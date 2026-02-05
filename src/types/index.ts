/**
 * Type definitions for the Decrypt Tool application
 *
 * This tool decrypts Nexar encrypted MP4 video files using XOR cipher.
 * Supports Google Drive and local file upload as sources, with flexible
 * output destinations.
 */

// ============================================================================
// Source and Destination Options
// ============================================================================

/**
 * Source type for encrypted files
 * - `gdrive`: Files from Google Drive folder
 * - `upload`: Files uploaded from local computer
 */
export type SourceType = 'gdrive' | 'upload'

/**
 * Destination type for decrypted files
 * - `gdrive`: Save to Google Drive folder
 * - `download`: Download to user's computer
 */
export type DestType = 'gdrive' | 'download'

// ============================================================================
// Job Lifecycle States
// ============================================================================

/**
 * Overall job processing status
 * - `pending`: Job created, not yet started
 * - `uploading`: Files being uploaded (for source=upload)
 * - `processing`: Actively decrypting files
 * - `paused`: Processing paused by user (client flow only)
 * - `completed`: All files processed (some may have failed)
 * - `failed`: Job failed entirely (unrecoverable error)
 */
export type JobStatus = 'pending' | 'uploading' | 'processing' | 'paused' | 'completed' | 'failed'

/**
 * Individual file processing status
 * - `pending`: Not yet processed
 * - `processing`: Currently being decrypted
 * - `success`: Successfully decrypted and validated
 * - `failed`: Failed to decrypt or validate
 */
export type FileStatus = 'pending' | 'processing' | 'success' | 'failed'

// ============================================================================
// File Processing Results
// ============================================================================

/**
 * Result for a single file's decryption attempt
 */
export interface FileResult {
  /** Original filename */
  filename: string

  /** Processing status for this file */
  status: FileStatus

  /** Error message if status is 'failed' */
  error?: string

  /** Output path in destination (for dest=gdrive) */
  outputPath?: string

  /** Temporary download URL (for dest=download) */
  downloadUrl?: string

  /** ISO timestamp when file was processed */
  processedAt?: string

  /** File size in bytes */
  size?: number
}

// ============================================================================
// Job State
// ============================================================================

/**
 * Complete job state tracked throughout processing lifecycle
 */
export interface Job {
  /** Unique job identifier (UUID) */
  id: string

  /** Current job status */
  status: JobStatus

  /** Whether the job is paused */
  isPaused?: boolean

  /** Source type chosen by user */
  sourceType: SourceType

  /** Google Drive folder ID or upload session ID */
  sourcePath?: string

  /** Destination type chosen by user */
  destType: DestType

  /** Google Drive folder ID for output (if dest=gdrive) */
  destPath?: string

  /** If true, creates /decrypted subfolder in same GDrive folder */
  sameFolder?: boolean

  /** If true, use [decrypted] filename prefix instead of subfolder (fallback mode) */
  useDecryptedPrefix?: boolean

  /** Total number of files to process */
  totalFiles: number

  /** Number of files processed so far (success or failed) */
  processedFiles: number

  /** Name of file currently being processed */
  currentFile?: string

  /** List of files to process (for GDrive jobs) */
  files?: GDriveFile[]

  /** Resolved destination folder ID (for GDrive output) */
  resolvedDestFolderId?: string

  /** Individual file results */
  results: FileResult[]

  /** Error message if job failed */
  error?: string

  /** ISO timestamp when job was created */
  createdAt: string

  /** ISO timestamp when job was last updated */
  updatedAt: string

  /** ISO timestamp when job data will be automatically deleted (24h retention) */
  expiresAt?: string
}

// ============================================================================
// Progress Updates (for UI)
// ============================================================================

/**
 * Real-time progress information for UI display
 */
export interface DecryptProgress {
  /** Total number of files in job */
  totalFiles: number

  /** Number of files processed so far */
  processedFiles: number

  /** Name of file currently being processed */
  currentFile?: string

  /** Progress percentage for current file (0-100) */
  currentFileProgress?: number

  /** Overall job progress percentage (0-100) */
  overallProgress: number

  /** Current job status */
  status: JobStatus

  /** ISO timestamp when processing started (for elapsed/remaining time calculation) */
  startedAt?: string
}

// ============================================================================
// Existing Folder Handling
// ============================================================================

/**
 * Action to take when "decrypted" folder already exists in source
 * - `include`: Also decrypt files inside the existing "decrypted" folder
 * - `overwrite`: Re-decrypt all source files, overwrite existing decrypted files
 * - `skip`: Skip files that already exist in the "decrypted" folder
 */
export type ExistingFolderAction = 'include' | 'overwrite' | 'skip'

// ============================================================================
// Job Configuration (form input)
// ============================================================================

/**
 * User configuration for creating a decryption job
 */
export interface JobConfig {
  /** Source type: Google Drive or local upload */
  sourceType: SourceType

  /** Google Drive folder URL (required if sourceType=gdrive) */
  sourceFolder?: string

  /** Files to upload (required if sourceType=upload) */
  files?: File[]

  /** 32-character hexadecimal decryption key */
  key: string

  /** Destination type: Google Drive or download */
  destType: DestType

  /** Google Drive folder URL (required if destType=gdrive and sameFolder=false) */
  destFolder?: string

  /** Use same folder with /decrypted subfolder (only for sourceType=gdrive, destType=gdrive) */
  sameFolder?: boolean

  /** If true, use [decrypted] filename prefix instead of subfolder */
  useDecryptedPrefix?: boolean

  /** Action when "decrypted" folder already exists (only for sameFolder=true) */
  existingFolderAction?: ExistingFolderAction
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for creating a new decryption job
 * POST /api/jobs
 */
export interface CreateJobRequest {
  /** Source type */
  sourceType: SourceType

  /** Google Drive folder URL or ID (if sourceType=gdrive) */
  sourceFolder?: string

  /** 32-character hexadecimal decryption key */
  key: string

  /** Destination type */
  destType: DestType

  /** Google Drive folder URL or ID (if destType=gdrive and sameFolder=false) */
  destFolder?: string

  /** Use same folder with /decrypted subfolder */
  sameFolder?: boolean

  /** If true, use [decrypted] filename prefix instead of subfolder */
  useDecryptedPrefix?: boolean

  /** Action when "decrypted" folder already exists */
  existingFolderAction?: ExistingFolderAction
}

/**
 * Response from creating a new job
 */
export interface CreateJobResponse {
  /** Unique job ID */
  jobId: string

  /** URL to upload files (for sourceType=upload) */
  uploadUrl?: string
}

/**
 * Response from job status endpoint
 * GET /api/jobs/{jobId}
 */
export interface JobStatusResponse extends Job {}

/**
 * Request to retry failed files
 * POST /api/jobs/{jobId}/retry
 */
export interface RetryRequest {
  /** Specific filenames to retry, or undefined to retry all failed files */
  files?: string[]
}

/**
 * Request to process next batch of files
 * POST /api/jobs/{jobId}/process-next
 */
export interface ProcessNextRequest {
  /** 32-character hexadecimal decryption key */
  key: string
}

/**
 * Response from processing next batch
 */
export interface ProcessNextResponse {
  /** Whether all files have been processed */
  done: boolean

  /** Number of files processed in this batch */
  processedInBatch: number

  /** Total files processed so far */
  processedFiles: number

  /** Total files in job */
  totalFiles: number

  /** Results from this batch */
  batchResults: FileResult[]

  /** Files currently being processed (for live log display) */
  processingFiles?: string[]

  /** Error if job failed (not individual file errors) */
  error?: string
}

// ============================================================================
// Google Drive Types
// ============================================================================

/**
 * Google Drive file metadata
 */
export interface GDriveFile {
  /** Google Drive file ID */
  id: string

  /** File name */
  name: string

  /** File size in bytes */
  size: number

  /** MIME type */
  mimeType: string

  /** Relative path in folder structure */
  path: string
}
