// src/lib/job-store.ts

import { v4 as uuidv4 } from 'uuid'
import type { Job, JobStatus, FileResult, SourceType, DestType, GDriveFile } from '@/types'

// In-memory store
// Use globalThis to persist across hot reloads in development
const globalForJobs = globalThis as unknown as { jobs: Map<string, Job> | undefined }
const jobs = globalForJobs.jobs ?? new Map<string, Job>()
if (process.env.NODE_ENV !== 'production') {
  globalForJobs.jobs = jobs
}

// Job expiration time (24 hours)
const JOB_EXPIRATION_MS = 24 * 60 * 60 * 1000

export function createJob(config: {
  sourceType: SourceType
  sourcePath?: string
  destType: DestType
  destPath?: string
  sameFolder?: boolean
  useDecryptedPrefix?: boolean
}): Job {
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + JOB_EXPIRATION_MS).toISOString()

  const job: Job = {
    id: uuidv4(),
    status: 'pending',
    sourceType: config.sourceType,
    sourcePath: config.sourcePath,
    destType: config.destType,
    destPath: config.destPath,
    sameFolder: config.sameFolder,
    useDecryptedPrefix: config.useDecryptedPrefix,
    totalFiles: 0,
    processedFiles: 0,
    results: [],
    createdAt: now,
    updatedAt: now,
    expiresAt
  }

  jobs.set(job.id, job)
  console.log(`[job-store] Created job ${job.id}, store has ${jobs.size} jobs`)
  return job
}

export function getJob(jobId: string): Job | undefined {
  console.log(`[job-store] Getting job ${jobId}, store has ${jobs.size} jobs, keys: ${[...jobs.keys()].join(', ')}`)
  const job = jobs.get(jobId)
  if (!job) {
    console.log(`[job-store] Job ${jobId} not found`)
    return undefined
  }

  // Check if expired
  if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
    jobs.delete(jobId)
    console.log(`[job-store] Job ${jobId} expired`)
    return undefined
  }

  return job
}

export function updateJobStatus(jobId: string, status: JobStatus, error?: string): void {
  const job = jobs.get(jobId)
  if (!job) return

  job.status = status
  if (error !== undefined) {
    job.error = error
  }
  job.updatedAt = new Date().toISOString()
}

export function pauseJob(jobId: string): boolean {
  const job = jobs.get(jobId)
  if (!job || job.status !== 'processing') return false

  job.isPaused = true
  job.status = 'paused'
  job.updatedAt = new Date().toISOString()
  return true
}

export function resumeJob(jobId: string): boolean {
  const job = jobs.get(jobId)
  if (!job || !job.isPaused) return false

  job.isPaused = false
  job.status = 'processing'
  job.updatedAt = new Date().toISOString()
  return true
}

export function isJobPaused(jobId: string): boolean {
  const job = jobs.get(jobId)
  return job?.isPaused ?? false
}

export function updateJobProgress(jobId: string, update: {
  processedFiles?: number
  currentFile?: string
  totalFiles?: number
}): void {
  const job = jobs.get(jobId)
  if (!job) return

  if (update.processedFiles !== undefined) job.processedFiles = update.processedFiles
  if (update.currentFile !== undefined) job.currentFile = update.currentFile
  if (update.totalFiles !== undefined) job.totalFiles = update.totalFiles
  job.updatedAt = new Date().toISOString()
}

export function addFileResult(jobId: string, result: FileResult): void {
  const job = jobs.get(jobId)
  if (!job) return

  // Check if file already exists to prevent duplicates
  const existing = job.results.find(r => r.filename === result.filename)
  if (existing) {
    // Update existing entry instead of adding duplicate
    Object.assign(existing, result)
  } else {
    job.results.push(result)
  }
  job.updatedAt = new Date().toISOString()
}

export function updateFileResult(jobId: string, filename: string, update: Partial<FileResult>): void {
  const job = jobs.get(jobId)
  if (!job) return

  const result = job.results.find(r => r.filename === filename)
  if (result) {
    Object.assign(result, update)
    job.updatedAt = new Date().toISOString()
  }
}

export function getJobResults(jobId: string): FileResult[] {
  const job = jobs.get(jobId)
  return job?.results ?? []
}

export function setJobFiles(jobId: string, files: GDriveFile[]): boolean {
  const job = jobs.get(jobId)
  if (!job) return false

  // Prevent race condition: only set files if not already set
  if (job.files && job.files.length > 0) {
    return false // Already initialized by another worker
  }

  job.files = files
  job.totalFiles = files.length
  job.updatedAt = new Date().toISOString()
  return true
}

export function setJobResolvedDestFolder(jobId: string, folderId: string): void {
  const job = jobs.get(jobId)
  if (!job) return

  job.resolvedDestFolderId = folderId
  job.updatedAt = new Date().toISOString()
}

export function getPendingFiles(jobId: string): GDriveFile[] {
  const job = jobs.get(jobId)
  if (!job || !job.files) return []

  // Get filenames that have already been processed or are being processed
  const processedFilenames = new Set(
    job.results
      .filter(r => r.status === 'success' || r.status === 'failed' || r.status === 'processing')
      .map(r => r.filename)
  )

  // Return files not yet processed
  return job.files.filter(f => !processedFilenames.has(f.name))
}

/**
 * Claim files for processing (atomic operation to prevent duplicate processing)
 * Returns the claimed files, or empty array if no files available
 */
export function claimFilesForProcessing(jobId: string, count: number): GDriveFile[] {
  const job = jobs.get(jobId)
  if (!job || !job.files) return []

  // Get filenames that have already been claimed or processed
  const takenFilenames = new Set(
    job.results.map(r => r.filename)
  )

  // Find unclaimed files
  const availableFiles = job.files.filter(f => !takenFilenames.has(f.name))
  const filesToClaim = availableFiles.slice(0, count)

  // Mark them as processing (claim them)
  for (const file of filesToClaim) {
    job.results.push({
      filename: file.name,
      status: 'processing'
    })
  }

  job.updatedAt = new Date().toISOString()
  return filesToClaim
}

export function deleteJob(jobId: string): boolean {
  return jobs.delete(jobId)
}

export function getAllJobs(): Job[] {
  return Array.from(jobs.values())
}

export function cleanupExpiredJobs(): number {
  const now = new Date()
  let cleaned = 0

  for (const [id, job] of jobs.entries()) {
    if (job.expiresAt && new Date(job.expiresAt) < now) {
      jobs.delete(id)
      cleaned++
    }
  }

  return cleaned
}

// Optional: Set up periodic cleanup
let cleanupInterval: NodeJS.Timeout | null = null

export function startCleanupScheduler(intervalMs: number = 60 * 60 * 1000): void {
  if (cleanupInterval) return
  cleanupInterval = setInterval(cleanupExpiredJobs, intervalMs)
}

export function stopCleanupScheduler(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}
