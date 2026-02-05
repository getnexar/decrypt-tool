import { NextRequest, NextResponse } from 'next/server'
import {
  getJob,
  getPendingFiles,
  claimFilesForProcessing,
  updateJobStatus,
  updateJobProgress,
  addFileResult,
  updateFileResult,
  setJobFiles,
  setJobResolvedDestFolder,
  isJobPaused
} from '@/lib/job-store'
import {
  listMp4Files,
  downloadFileAsBuffer,
  uploadFile,
  getOrCreateDecryptedFolder,
  GDriveAuthError
} from '@/lib/gdrive'
import { generateXorPad, decryptChunk, validateMp4Header } from '@/lib/crypto'
import { sanitizeFilename, validateHexKey } from '@/lib/validation'
import type { ProcessNextRequest, ProcessNextResponse, GDriveFile } from '@/types'

// Number of files to process per request
const BATCH_SIZE = 3

// Local dev mode detection
const isLocalDev = !!process.env.GDRIVE_ACCESS_TOKEN

interface GDriveConfig {
  jwt?: string
  accessToken?: string
}

/**
 * Process next batch of files
 * POST /api/jobs/{id}/process-next
 *
 * This endpoint is called repeatedly by the client to process files in batches.
 * Each call carries a fresh JWT, avoiding token expiration issues for long jobs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const body: ProcessNextRequest = await request.json()

    // Validate key
    if (!validateHexKey(body.key)) {
      return NextResponse.json(
        { error: 'Invalid key format' },
        { status: 400 }
      )
    }

    const job = getJob(jobId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if job is paused
    if (isJobPaused(jobId)) {
      return NextResponse.json({
        done: false,
        processedInBatch: 0,
        processedFiles: job.processedFiles,
        totalFiles: job.totalFiles,
        batchResults: [],
        paused: true
      })
    }

    // Get JWT from request headers (fresh each time)
    const jwt = request.headers.get('X-Nexar-Platform-JWT') || ''
    const accessToken = process.env.GDRIVE_ACCESS_TOKEN

    if (!jwt && !accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const config: GDriveConfig = isLocalDev ? { accessToken } : { jwt }

    // First call: list files and set up destination folder
    // Use atomic check to prevent race condition with parallel workers
    if (!job.files || job.files.length === 0) {
      if (!job.sourcePath) {
        return NextResponse.json(
          { error: 'No source path specified' },
          { status: 400 }
        )
      }

      updateJobStatus(jobId, 'processing')

      // List files from source
      const files = await listMp4Files(job.sourcePath, config)

      if (files.length === 0) {
        updateJobStatus(jobId, 'completed')
        return NextResponse.json({
          done: true,
          processedInBatch: 0,
          processedFiles: 0,
          totalFiles: 0,
          batchResults: []
        } as ProcessNextResponse)
      }

      // Atomic set - returns false if another worker already set files
      const didSetFiles = setJobFiles(jobId, files)

      if (didSetFiles) {
        // This worker won the race - resolve destination folder
        if (job.destType === 'gdrive') {
          let destFolderId: string | undefined

          if (job.sameFolder && job.sourcePath) {
            if (job.useDecryptedPrefix) {
              destFolderId = job.sourcePath
            } else {
              destFolderId = await getOrCreateDecryptedFolder(job.sourcePath, config)
            }
          } else if (job.destPath) {
            destFolderId = job.destPath
          }

          if (destFolderId) {
            setJobResolvedDestFolder(jobId, destFolderId)
          }
        }

        // Return with file count, client will call again to start processing
        return NextResponse.json({
          done: false,
          processedInBatch: 0,
          processedFiles: 0,
          totalFiles: files.length,
          batchResults: []
        } as ProcessNextResponse)
      }

      // Another worker already initialized - wait for it to complete setup
      // Poll until files are available or timeout
      let refreshedJob = getJob(jobId)
      let waitAttempts = 0
      while ((!refreshedJob?.files || refreshedJob.files.length === 0) && waitAttempts < 10) {
        await new Promise(r => setTimeout(r, 100))
        refreshedJob = getJob(jobId)
        waitAttempts++
      }

      if (!refreshedJob || !refreshedJob.files || refreshedJob.files.length === 0) {
        return NextResponse.json({ error: 'Job initialization timeout' }, { status: 500 })
      }
      // Fall through to claim files below
    }

    // Claim files for processing (atomic to support parallel requests)
    const batch = claimFilesForProcessing(jobId, BATCH_SIZE)

    if (batch.length === 0) {
      // No files to claim - check if all done or just waiting for other workers
      const pendingFiles = getPendingFiles(jobId)
      if (pendingFiles.length === 0) {
        // All files processed or being processed
        // Check if there are still files being processed by other workers
        const refreshedJob = getJob(jobId)
        const processingCount = refreshedJob?.results.filter(r => r.status === 'processing').length || 0

        if (processingCount === 0) {
          updateJobStatus(jobId, 'completed')
          return NextResponse.json({
            done: true,
            processedInBatch: 0,
            processedFiles: refreshedJob?.processedFiles || job.processedFiles,
            totalFiles: job.totalFiles,
            batchResults: []
          } as ProcessNextResponse)
        }
      }

      // Other workers still processing - this worker can exit
      return NextResponse.json({
        done: true,
        processedInBatch: 0,
        processedFiles: job.processedFiles,
        totalFiles: job.totalFiles,
        batchResults: []
      } as ProcessNextResponse)
    }

    // Capture the files being processed for the live log
    const processingFiles = batch.map(f => f.name)

    // Process claimed batch
    const pad = generateXorPad(body.key)
    const batchResults: ProcessNextResponse['batchResults'] = []
    // Refresh job to get resolvedDestFolderId (might have been set by another worker)
    const currentJob = getJob(jobId)
    const destFolderId = currentJob?.resolvedDestFolderId || job.resolvedDestFolderId
    const useDecryptedPrefix = currentJob?.useDecryptedPrefix || job.useDecryptedPrefix || false

    for (const file of batch) {
      const safeFilename = sanitizeFilename(file.name)

      updateJobProgress(jobId, { currentFile: file.name })

      // File already marked as processing by claimFilesForProcessing

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
          const uploadFilename = useDecryptedPrefix ? `[decrypted] ${safeFilename}` : safeFilename
          const newFileId = await uploadFile(
            destFolderId,
            uploadFilename,
            decryptedBuffer,
            'video/mp4',
            config
          )

          const result = {
            filename: file.name,
            status: 'success' as const,
            outputPath: `gdrive://${newFileId}`,
            size: decryptedBuffer.length,
            processedAt: new Date().toISOString()
          }

          updateFileResult(jobId, file.name, result)
          batchResults.push(result)
        } else {
          // Download mode - store for download
          // Note: For download mode, we'd need to store the buffer somewhere
          // For now, this is primarily for GDrive-to-GDrive flow
          const result = {
            filename: file.name,
            status: 'success' as const,
            downloadUrl: `/api/jobs/${jobId}/download/${encodeURIComponent(file.name)}`,
            size: decryptedBuffer.length,
            processedAt: new Date().toISOString()
          }

          updateFileResult(jobId, file.name, result)
          batchResults.push(result)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Check if it's an auth error - should propagate to client
        if (error instanceof GDriveAuthError) {
          // Return partial results but with auth error
          return NextResponse.json({
            done: false,
            processedInBatch: batchResults.length,
            processedFiles: job.processedFiles + batchResults.length,
            totalFiles: job.totalFiles,
            batchResults,
            error: errorMessage
          } as ProcessNextResponse, { status: 401 })
        }

        const result = {
          filename: file.name,
          status: 'failed' as const,
          error: errorMessage,
          processedAt: new Date().toISOString()
        }

        updateFileResult(jobId, file.name, result)
        batchResults.push(result)
      }
    }

    // Get fresh job state to calculate accurate counts
    const finalJob = getJob(jobId)
    if (!finalJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Count processed files from actual results (not a running counter)
    const processedCount = finalJob.results.filter(
      r => r.status === 'success' || r.status === 'failed'
    ).length

    // Update progress with accurate count
    updateJobProgress(jobId, {
      processedFiles: processedCount,
      currentFile: undefined
    })

    // Check if done - no more files to process or being processed
    const remainingFiles = getPendingFiles(jobId)
    const processingCount = finalJob.results.filter(r => r.status === 'processing').length
    const done = remainingFiles.length === 0 && processingCount === 0

    if (done) {
      updateJobStatus(jobId, 'completed')
    }

    // Get all files currently being processed (by any worker) for live log
    const allProcessingFiles = finalJob.results
      .filter(r => r.status === 'processing')
      .map(r => r.filename)

    return NextResponse.json({
      done,
      processedInBatch: batchResults.length,
      processedFiles: processedCount,
      totalFiles: finalJob.totalFiles,
      batchResults,
      processingFiles: allProcessingFiles
    } as ProcessNextResponse)

  } catch (error) {
    console.error('Process-next error:', error)

    // Check if it's an auth error
    if (error instanceof GDriveAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
