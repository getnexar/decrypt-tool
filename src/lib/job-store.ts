// src/lib/job-store.ts

import { v4 as uuidv4 } from 'uuid'
import type { Job, JobStatus, FileResult, SourceType, DestType } from '@/types'

// In-memory store
const jobs = new Map<string, Job>()

// Job expiration time (24 hours)
const JOB_EXPIRATION_MS = 24 * 60 * 60 * 1000

export function createJob(config: {
  sourceType: SourceType
  sourcePath?: string
  destType: DestType
  destPath?: string
  sameFolder?: boolean
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
    totalFiles: 0,
    processedFiles: 0,
    results: [],
    createdAt: now,
    updatedAt: now,
    expiresAt
  }

  jobs.set(job.id, job)
  return job
}

export function getJob(jobId: string): Job | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined

  // Check if expired
  if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
    jobs.delete(jobId)
    return undefined
  }

  return job
}

export function updateJobStatus(jobId: string, status: JobStatus): void {
  const job = jobs.get(jobId)
  if (!job) return

  job.status = status
  job.updatedAt = new Date().toISOString()
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

  job.results.push(result)
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
