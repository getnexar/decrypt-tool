// src/lib/__tests__/job-store.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createJob,
  getJob,
  updateJobStatus,
  updateJobProgress,
  addFileResult,
  updateFileResult,
  getJobResults,
  deleteJob,
  getAllJobs,
  cleanupExpiredJobs,
  startCleanupScheduler,
  stopCleanupScheduler
} from '../job-store'
import type { FileResult } from '@/types'

describe('Job Store', () => {
  beforeEach(() => {
    // Clear all jobs before each test
    const allJobs = getAllJobs()
    allJobs.forEach(job => deleteJob(job.id))
  })

  afterEach(() => {
    stopCleanupScheduler()
  })

  describe('createJob', () => {
    it('should create a job with valid configuration', () => {
      const job = createJob({
        sourceType: 'gdrive',
        sourcePath: 'folder-123',
        destType: 'download'
      })

      expect(job.id).toBeDefined()
      expect(job.status).toBe('pending')
      expect(job.sourceType).toBe('gdrive')
      expect(job.sourcePath).toBe('folder-123')
      expect(job.destType).toBe('download')
      expect(job.totalFiles).toBe(0)
      expect(job.processedFiles).toBe(0)
      expect(job.results).toEqual([])
      expect(job.createdAt).toBeDefined()
      expect(job.updatedAt).toBeDefined()
      expect(job.expiresAt).toBeDefined()
    })

    it('should create a job with sameFolder option', () => {
      const job = createJob({
        sourceType: 'upload',
        destType: 'gdrive',
        destPath: 'folder-456',
        sameFolder: true
      })

      expect(job.sameFolder).toBe(true)
      expect(job.destPath).toBe('folder-456')
    })

    it('should generate unique IDs for each job', () => {
      const job1 = createJob({ sourceType: 'upload', destType: 'download' })
      const job2 = createJob({ sourceType: 'upload', destType: 'download' })

      expect(job1.id).not.toBe(job2.id)
    })

    it('should set expiration time to 24 hours from creation', () => {
      const before = Date.now()
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      const after = Date.now()

      const expiresAtMs = new Date(job.expiresAt!).getTime()
      const expectedMin = before + 24 * 60 * 60 * 1000
      const expectedMax = after + 24 * 60 * 60 * 1000

      expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMin)
      expect(expiresAtMs).toBeLessThanOrEqual(expectedMax)
    })
  })

  describe('getJob', () => {
    it('should retrieve an existing job', () => {
      const created = createJob({ sourceType: 'upload', destType: 'download' })
      const retrieved = getJob(created.id)

      expect(retrieved).toEqual(created)
    })

    it('should return undefined for non-existent job', () => {
      const job = getJob('non-existent-id')

      expect(job).toBeUndefined()
    })

    it('should return undefined and delete expired job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      // Manually set expiration to past
      const retrievedJob = getJob(job.id)
      if (retrievedJob) {
        retrievedJob.expiresAt = new Date(Date.now() - 1000).toISOString()
      }

      const expiredJob = getJob(job.id)
      expect(expiredJob).toBeUndefined()

      // Verify it was deleted
      const allJobs = getAllJobs()
      expect(allJobs.find(j => j.id === job.id)).toBeUndefined()
    })
  })

  describe('updateJobStatus', () => {
    it('should update job status', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      const initialUpdatedAt = job.updatedAt

      // Wait a bit to ensure timestamp changes
      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      updateJobStatus(job.id, 'processing')

      vi.useRealTimers()

      const updated = getJob(job.id)
      expect(updated?.status).toBe('processing')
      expect(updated?.updatedAt).not.toBe(initialUpdatedAt)
    })

    it('should handle updating non-existent job gracefully', () => {
      expect(() => {
        updateJobStatus('non-existent-id', 'completed')
      }).not.toThrow()
    })
  })

  describe('updateJobProgress', () => {
    it('should update processedFiles', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      updateJobProgress(job.id, { processedFiles: 5 })

      const updated = getJob(job.id)
      expect(updated?.processedFiles).toBe(5)
    })

    it('should update currentFile', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      updateJobProgress(job.id, { currentFile: 'video1.mp4' })

      const updated = getJob(job.id)
      expect(updated?.currentFile).toBe('video1.mp4')
    })

    it('should update totalFiles', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      updateJobProgress(job.id, { totalFiles: 10 })

      const updated = getJob(job.id)
      expect(updated?.totalFiles).toBe(10)
    })

    it('should update multiple progress fields at once', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      updateJobProgress(job.id, {
        processedFiles: 3,
        currentFile: 'video3.mp4',
        totalFiles: 10
      })

      const updated = getJob(job.id)
      expect(updated?.processedFiles).toBe(3)
      expect(updated?.currentFile).toBe('video3.mp4')
      expect(updated?.totalFiles).toBe(10)
    })

    it('should update updatedAt timestamp', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      const initialUpdatedAt = job.updatedAt

      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      updateJobProgress(job.id, { processedFiles: 1 })

      vi.useRealTimers()

      const updated = getJob(job.id)
      expect(updated?.updatedAt).not.toBe(initialUpdatedAt)
    })

    it('should handle updating non-existent job gracefully', () => {
      expect(() => {
        updateJobProgress('non-existent-id', { processedFiles: 5 })
      }).not.toThrow()
    })
  })

  describe('addFileResult', () => {
    it('should add a file result to job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const result: FileResult = {
        filename: 'video1.mp4',
        status: 'success',
        processedAt: new Date().toISOString()
      }

      addFileResult(job.id, result)

      const updated = getJob(job.id)
      expect(updated?.results).toHaveLength(1)
      expect(updated?.results[0]).toEqual(result)
    })

    it('should add multiple file results', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const result1: FileResult = {
        filename: 'video1.mp4',
        status: 'success',
        processedAt: new Date().toISOString()
      }

      const result2: FileResult = {
        filename: 'video2.mp4',
        status: 'failed',
        error: 'Decryption error',
        processedAt: new Date().toISOString()
      }

      addFileResult(job.id, result1)
      addFileResult(job.id, result2)

      const updated = getJob(job.id)
      expect(updated?.results).toHaveLength(2)
      expect(updated?.results[0]).toEqual(result1)
      expect(updated?.results[1]).toEqual(result2)
    })

    it('should update updatedAt timestamp', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      const initialUpdatedAt = job.updatedAt

      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      const result: FileResult = {
        filename: 'video1.mp4',
        status: 'success',
        processedAt: new Date().toISOString()
      }

      addFileResult(job.id, result)

      vi.useRealTimers()

      const updated = getJob(job.id)
      expect(updated?.updatedAt).not.toBe(initialUpdatedAt)
    })

    it('should handle adding to non-existent job gracefully', () => {
      const result: FileResult = {
        filename: 'video1.mp4',
        status: 'success',
        processedAt: new Date().toISOString()
      }

      expect(() => {
        addFileResult('non-existent-id', result)
      }).not.toThrow()
    })
  })

  describe('updateFileResult', () => {
    it('should update an existing file result', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const result: FileResult = {
        filename: 'video1.mp4',
        status: 'processing',
        processedAt: new Date().toISOString()
      }

      addFileResult(job.id, result)

      updateFileResult(job.id, 'video1.mp4', {
        status: 'success',
        outputPath: '/output/video1.mp4'
      })

      const updated = getJob(job.id)
      expect(updated?.results[0].status).toBe('success')
      expect(updated?.results[0].outputPath).toBe('/output/video1.mp4')
      expect(updated?.results[0].filename).toBe('video1.mp4')
    })

    it('should not update if filename not found', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const result: FileResult = {
        filename: 'video1.mp4',
        status: 'success',
        processedAt: new Date().toISOString()
      }

      addFileResult(job.id, result)

      updateFileResult(job.id, 'video2.mp4', { status: 'failed' })

      const updated = getJob(job.id)
      expect(updated?.results).toHaveLength(1)
      expect(updated?.results[0].filename).toBe('video1.mp4')
      expect(updated?.results[0].status).toBe('success')
    })

    it('should update updatedAt timestamp', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const result: FileResult = {
        filename: 'video1.mp4',
        status: 'processing',
        processedAt: new Date().toISOString()
      }

      addFileResult(job.id, result)

      const initialUpdatedAt = getJob(job.id)?.updatedAt

      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      updateFileResult(job.id, 'video1.mp4', { status: 'success' })

      vi.useRealTimers()

      const updated = getJob(job.id)
      expect(updated?.updatedAt).not.toBe(initialUpdatedAt)
    })

    it('should handle updating non-existent job gracefully', () => {
      expect(() => {
        updateFileResult('non-existent-id', 'video1.mp4', { status: 'failed' })
      }).not.toThrow()
    })
  })

  describe('getJobResults', () => {
    it('should return all results for a job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const result1: FileResult = {
        filename: 'video1.mp4',
        status: 'success',
        processedAt: new Date().toISOString()
      }

      const result2: FileResult = {
        filename: 'video2.mp4',
        status: 'success',
        processedAt: new Date().toISOString()
      }

      addFileResult(job.id, result1)
      addFileResult(job.id, result2)

      const results = getJobResults(job.id)

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual(result1)
      expect(results[1]).toEqual(result2)
    })

    it('should return empty array for non-existent job', () => {
      const results = getJobResults('non-existent-id')

      expect(results).toEqual([])
    })

    it('should return empty array for job with no results', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const results = getJobResults(job.id)

      expect(results).toEqual([])
    })
  })

  describe('deleteJob', () => {
    it('should delete an existing job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const deleted = deleteJob(job.id)

      expect(deleted).toBe(true)
      expect(getJob(job.id)).toBeUndefined()
    })

    it('should return false for non-existent job', () => {
      const deleted = deleteJob('non-existent-id')

      expect(deleted).toBe(false)
    })
  })

  describe('getAllJobs', () => {
    it('should return all jobs', () => {
      const job1 = createJob({ sourceType: 'upload', destType: 'download' })
      const job2 = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const allJobs = getAllJobs()

      expect(allJobs).toHaveLength(2)
      expect(allJobs.find(j => j.id === job1.id)).toBeDefined()
      expect(allJobs.find(j => j.id === job2.id)).toBeDefined()
    })

    it('should return empty array when no jobs exist', () => {
      const allJobs = getAllJobs()

      expect(allJobs).toEqual([])
    })
  })

  describe('cleanupExpiredJobs', () => {
    it('should remove expired jobs', () => {
      const job1 = createJob({ sourceType: 'upload', destType: 'download' })
      const job2 = createJob({ sourceType: 'upload', destType: 'download' })

      // Manually expire job1
      const retrieved1 = getJob(job1.id)
      if (retrieved1) {
        retrieved1.expiresAt = new Date(Date.now() - 1000).toISOString()
      }

      const cleaned = cleanupExpiredJobs()

      expect(cleaned).toBe(1)
      expect(getJob(job1.id)).toBeUndefined()
      expect(getJob(job2.id)).toBeDefined()
    })

    it('should return 0 when no jobs are expired', () => {
      createJob({ sourceType: 'upload', destType: 'download' })
      createJob({ sourceType: 'upload', destType: 'download' })

      const cleaned = cleanupExpiredJobs()

      expect(cleaned).toBe(0)
    })

    it('should handle jobs without expiresAt', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      // Remove expiresAt
      const retrieved = getJob(job.id)
      if (retrieved) {
        retrieved.expiresAt = undefined
      }

      const cleaned = cleanupExpiredJobs()

      expect(cleaned).toBe(0)
      expect(getJob(job.id)).toBeDefined()
    })
  })

  describe('cleanup scheduler', () => {
    it('should start cleanup scheduler', () => {
      vi.useFakeTimers()

      const job = createJob({ sourceType: 'upload', destType: 'download' })

      startCleanupScheduler(1000) // Run every second

      // Manually expire the job (directly access the job without triggering getJob's expiration check)
      const allJobsBefore = getAllJobs()
      const jobToExpire = allJobsBefore.find(j => j.id === job.id)
      if (jobToExpire) {
        jobToExpire.expiresAt = new Date(Date.now() - 1000).toISOString()
      }

      // Verify job still exists before scheduler runs
      expect(allJobsBefore.find(j => j.id === job.id)).toBeDefined()

      vi.advanceTimersByTime(1000)

      // After scheduler runs, job should be cleaned
      const allJobsAfter = getAllJobs()
      expect(allJobsAfter.find(j => j.id === job.id)).toBeUndefined()

      vi.useRealTimers()
    })

    it('should not start multiple schedulers', () => {
      vi.useFakeTimers()

      startCleanupScheduler(1000)
      startCleanupScheduler(1000) // Try to start again

      // No error should be thrown
      expect(() => {
        stopCleanupScheduler()
      }).not.toThrow()

      vi.useRealTimers()
    })

    it('should stop cleanup scheduler', () => {
      vi.useFakeTimers()

      startCleanupScheduler(1000)
      stopCleanupScheduler()

      const job = createJob({ sourceType: 'upload', destType: 'download' })

      // Manually expire the job
      const retrieved = getJob(job.id)
      if (retrieved) {
        retrieved.expiresAt = new Date(Date.now() - 1000).toISOString()
      }

      vi.advanceTimersByTime(1000)

      // Should not be cleaned because scheduler is stopped
      const allJobs = getAllJobs()
      expect(allJobs.find(j => j.id === job.id)).toBeDefined()

      vi.useRealTimers()
    })
  })

  describe('concurrent operations', () => {
    it('should handle rapid status updates', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      updateJobStatus(job.id, 'processing')
      updateJobStatus(job.id, 'completed')
      updateJobStatus(job.id, 'processing')
      updateJobStatus(job.id, 'completed')

      const updated = getJob(job.id)
      expect(updated?.status).toBe('completed')
    })

    it('should handle rapid result additions', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      for (let i = 0; i < 100; i++) {
        addFileResult(job.id, {
          filename: `video${i}.mp4`,
          status: 'success',
          processedAt: new Date().toISOString()
        })
      }

      const results = getJobResults(job.id)
      expect(results).toHaveLength(100)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined optional fields', () => {
      const job = createJob({
        sourceType: 'upload',
        destType: 'download'
      })

      expect(job.sourcePath).toBeUndefined()
      expect(job.destPath).toBeUndefined()
      expect(job.sameFolder).toBeUndefined()
    })

    it('should handle empty strings in update', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      updateJobProgress(job.id, { currentFile: '' })

      const updated = getJob(job.id)
      expect(updated?.currentFile).toBe('')
    })

    it('should handle zero values in update', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      updateJobProgress(job.id, { processedFiles: 0, totalFiles: 0 })

      const updated = getJob(job.id)
      expect(updated?.processedFiles).toBe(0)
      expect(updated?.totalFiles).toBe(0)
    })
  })
})
