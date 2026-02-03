// src/lib/processor.ts

import {
  getJob,
  updateJobStatus,
  updateJobProgress,
  addFileResult,
  updateFileResult
} from '@/lib/job-store'
import {
  listMp4Files,
  downloadFileAsBuffer,
  uploadFile,
  getOrCreateDecryptedFolder
} from '@/lib/gdrive'
import { generateXorPad, decryptChunk, validateMp4Header } from '@/lib/crypto'
import { sanitizeFilename } from '@/lib/validation'
import type { GDriveFile } from '@/types'

// In-memory storage for decrypted files (for download mode)
// In production, use Cloud Storage or similar
const decryptedFileStore = new Map<string, Map<string, Buffer>>()

// Cleanup interval (1 hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000

// Local dev mode detection
const isLocalDev = !!process.env.GDRIVE_ACCESS_TOKEN

interface GDriveConfig {
  jwt?: string
  accessToken?: string
}

/**
 * Process a GDrive-to-GDrive or GDrive-to-Download job
 * @param jobId - The job ID
 * @param key - 32-char hex decryption key (NOT stored, only used in memory)
 * @param jwt - X-Nexar-Platform-JWT for workspace-proxy authentication (optional in local dev)
 * @param specificFiles - Optional: only process these files (for retry)
 */
export async function processGDriveJob(
  jobId: string,
  key: string,
  jwt: string,
  specificFiles?: string[]
): Promise<void> {
  const job = getJob(jobId)
  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }

  try {
    // Check authentication
    const accessToken = process.env.GDRIVE_ACCESS_TOKEN
    if (!jwt && !accessToken) {
      throw new Error(
        'Authentication required. Either:\n' +
        '- Deploy to NAP (provides JWT automatically), or\n' +
        '- Set GDRIVE_ACCESS_TOKEN env var for local development'
      )
    }

    if (isLocalDev) {
      console.log(`[processor] Job ${jobId}: Running in LOCAL DEV mode with access token`)
    }

    updateJobStatus(jobId, 'processing')

    const config: GDriveConfig = isLocalDev ? { accessToken } : { jwt }
    const pad = generateXorPad(key)

    // List files from source
    let files: GDriveFile[]
    if (job.sourcePath) {
      files = await listMp4Files(job.sourcePath, config)
    } else {
      throw new Error('No source path specified')
    }

    // Filter to specific files if retrying
    if (specificFiles && specificFiles.length > 0) {
      files = files.filter(f => specificFiles.includes(f.name))
    }

    if (files.length === 0) {
      updateJobStatus(jobId, 'completed')
      return
    }

    updateJobProgress(jobId, { totalFiles: files.length })

    // Get destination folder ID
    let destFolderId: string | undefined
    console.log(`[processor] Job ${jobId}: destType=${job.destType}, sameFolder=${job.sameFolder}, sourcePath=${job.sourcePath}`)
    if (job.destType === 'gdrive') {
      if (job.sameFolder && job.sourcePath) {
        console.log(`[processor] Job ${jobId}: Creating/getting decrypted folder in ${job.sourcePath}`)
        destFolderId = await getOrCreateDecryptedFolder(job.sourcePath, config)
        console.log(`[processor] Job ${jobId}: Destination folder ID: ${destFolderId}`)
      } else if (job.destPath) {
        destFolderId = job.destPath
        console.log(`[processor] Job ${jobId}: Using specified destination: ${destFolderId}`)
      }
    } else {
      console.log(`[processor] Job ${jobId}: Using download mode (files stored in memory)`)
    }

    // Initialize file store for download mode
    if (job.destType === 'download') {
      decryptedFileStore.set(jobId, new Map())
    }

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const safeFilename = sanitizeFilename(file.name)

      updateJobProgress(jobId, {
        currentFile: file.name,
        processedFiles: i
      })

      // Add pending result
      addFileResult(jobId, {
        filename: file.name,
        status: 'processing'
      })

      try {
        // Download file
        const encryptedBuffer = await downloadFileAsBuffer(file.id, config)
        const encryptedData = new Uint8Array(encryptedBuffer)

        // Validate header after decryption
        const headerDecrypted = decryptChunk(encryptedData.slice(0, 12), pad, 0)
        if (!validateMp4Header(headerDecrypted)) {
          throw new Error('Invalid MP4 header after decryption - wrong key?')
        }

        // Decrypt full file
        const decryptedData = decryptChunk(encryptedData, pad, 0)
        const decryptedBuffer = Buffer.from(decryptedData)

        // Handle destination
        if (job.destType === 'gdrive' && destFolderId) {
          // Upload to GDrive
          console.log(`[processor] Job ${jobId}: Uploading ${safeFilename} to GDrive folder ${destFolderId}`)
          const newFileId = await uploadFile(
            destFolderId,
            safeFilename,
            decryptedBuffer,
            'video/mp4',
            config
          )
          console.log(`[processor] Job ${jobId}: Upload complete - ${safeFilename} -> fileId: ${newFileId}`)

          updateFileResult(jobId, file.name, {
            status: 'success',
            error: undefined, // Clear any previous error
            outputPath: `gdrive://${newFileId}`,
            size: decryptedBuffer.length,
            processedAt: new Date().toISOString()
          })
        } else {
          // Store for download
          const fileStore = decryptedFileStore.get(jobId)
          if (fileStore) {
            fileStore.set(file.name, decryptedBuffer)
          }

          updateFileResult(jobId, file.name, {
            status: 'success',
            error: undefined, // Clear any previous error
            downloadUrl: `/api/jobs/${jobId}/download/${encodeURIComponent(file.name)}`,
            size: decryptedBuffer.length,
            processedAt: new Date().toISOString()
          })
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        updateFileResult(jobId, file.name, {
          status: 'failed',
          error: errorMessage,
          processedAt: new Date().toISOString()
        })
      }
    }

    // Update final status
    updateJobProgress(jobId, {
      processedFiles: files.length,
      currentFile: undefined
    })
    updateJobStatus(jobId, 'completed')

    // Schedule cleanup for download mode
    if (job.destType === 'download') {
      setTimeout(() => cleanupJobFiles(jobId), 24 * 60 * 60 * 1000) // 24 hours
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Job ${jobId} processing error:`, errorMessage)
    updateJobStatus(jobId, 'failed', errorMessage)
    throw error
  }
}

/**
 * Get a decrypted file from temporary storage
 * @param jobId - The job ID
 * @param filename - The filename to retrieve
 * @returns Buffer of decrypted file
 */
export async function getDecryptedFile(
  jobId: string,
  filename: string
): Promise<Buffer> {
  const fileStore = decryptedFileStore.get(jobId)
  if (!fileStore) {
    throw new Error(`No files stored for job ${jobId}`)
  }

  const buffer = fileStore.get(filename)
  if (!buffer) {
    throw new Error(`File ${filename} not found for job ${jobId}`)
  }

  return buffer
}

/**
 * Clean up temporary files for a job
 * @param jobId - The job ID
 */
export async function cleanupJobFiles(jobId: string): Promise<void> {
  decryptedFileStore.delete(jobId)
}

// Periodic cleanup of orphaned files
setInterval(() => {
  // This would check job expiration and clean up
  // For now, jobs clean themselves up after 24h
}, CLEANUP_INTERVAL)
