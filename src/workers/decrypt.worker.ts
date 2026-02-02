/**
 * Web Worker for client-side file decryption
 *
 * Decrypts Nexar encrypted MP4 files using XOR cipher in a separate thread
 * to avoid blocking the main UI thread.
 */

import { generateXorPad, decryptChunk, validateMp4Header } from '@/lib/crypto'
import type { DecryptWorkerInput, DecryptWorkerOutput } from './types'

// Chunk size for streaming decryption (1MB)
const CHUNK_SIZE = 1024 * 1024

/**
 * Process a file for decryption
 */
async function decryptFile(
  file: File,
  key: string,
  fileIndex: number
): Promise<void> {
  try {
    // Generate XOR pad once for the entire file
    const pad = generateXorPad(key)

    // Read entire file as ArrayBuffer for more efficient processing
    const arrayBuffer = await file.arrayBuffer()
    const encryptedData = new Uint8Array(arrayBuffer)

    // Validate header after decryption of first chunk
    // This catches wrong keys early before processing the entire file
    const headerChunk = decryptChunk(encryptedData.slice(0, 12), pad, 0)
    if (!validateMp4Header(headerChunk)) {
      throw new Error('Invalid MP4 header after decryption - wrong key?')
    }

    // Process in chunks for progress updates
    const decryptedChunks: Uint8Array[] = []
    let offset = 0

    while (offset < encryptedData.length) {
      const end = Math.min(offset + CHUNK_SIZE, encryptedData.length)
      const chunk = encryptedData.slice(offset, end)
      const decrypted = decryptChunk(chunk, pad, offset)
      decryptedChunks.push(decrypted)

      // Send progress update with detailed metrics
      const progressMessage: DecryptWorkerOutput = {
        type: 'progress',
        fileIndex,
        filename: file.name,
        bytesProcessed: end,
        totalBytes: encryptedData.length,
        percentComplete: Math.round((end / encryptedData.length) * 100)
      }
      self.postMessage(progressMessage)

      offset = end
    }

    // Combine chunks into final blob
    // Convert Uint8Array to standard Uint8Array with ArrayBuffer for Blob compatibility
    const decryptedBlob = new Blob(
      decryptedChunks.map(chunk => new Uint8Array(chunk)),
      { type: 'video/mp4' }
    )

    // Send success message
    const successMessage: DecryptWorkerOutput = {
      type: 'success',
      fileIndex,
      filename: file.name,
      blob: decryptedBlob,
      size: decryptedBlob.size
    }
    self.postMessage(successMessage)
  } catch (error) {
    // Send error message
    const errorMessage: DecryptWorkerOutput = {
      type: 'error',
      fileIndex,
      filename: file.name,
      error: error instanceof Error ? error.message : 'Unknown error during decryption'
    }
    self.postMessage(errorMessage)
  }
}

/**
 * Worker message handler
 */
self.onmessage = async (event: MessageEvent<DecryptWorkerInput>) => {
  const { type, file, key, fileIndex } = event.data

  if (type === 'decrypt') {
    await decryptFile(file, key, fileIndex)
  }
}
