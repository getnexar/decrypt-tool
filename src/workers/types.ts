/**
 * Web Worker Message Types for Decryption
 *
 * Message protocol for off-main-thread video decryption.
 * Worker receives encrypted files and returns decrypted blobs with progress updates.
 */

/**
 * Input message sent to worker to start decryption
 */
export interface DecryptWorkerInput {
  type: 'decrypt'
  file: File          // The encrypted file
  key: string         // 32-char hex key
  fileIndex: number   // Index in batch (for progress tracking)
}

/**
 * Progress update message from worker
 * Sent periodically during decryption for UI feedback
 */
export interface DecryptWorkerProgress {
  type: 'progress'
  fileIndex: number
  filename: string
  bytesProcessed: number
  totalBytes: number
  percentComplete: number
}

/**
 * Success message from worker
 * Contains decrypted file as Blob
 */
export interface DecryptWorkerSuccess {
  type: 'success'
  fileIndex: number
  filename: string
  blob: Blob          // Decrypted file as Blob
  size: number
}

/**
 * Error message from worker
 * Sent if decryption fails (wrong key, invalid file, etc.)
 */
export interface DecryptWorkerError {
  type: 'error'
  fileIndex: number
  filename: string
  error: string
}

/**
 * Union type of all possible worker output messages
 */
export type DecryptWorkerOutput =
  | DecryptWorkerProgress
  | DecryptWorkerSuccess
  | DecryptWorkerError
