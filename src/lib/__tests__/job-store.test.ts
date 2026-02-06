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
  stopCleanupScheduler,
  setJobFiles,
  setJobResolvedDestFolder,
  getPendingFiles,
  claimFilesForProcessing,
  pauseJob,
  resumeJob,
  isJobPaused
} from '../job-store'
import type { FileResult, GDriveFile } from '@/types'

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

  describe('pauseJob', () => {
    it('should pause a processing job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      updateJobStatus(job.id, 'processing')

      const result = pauseJob(job.id)

      expect(result).toBe(true)
      const updated = getJob(job.id)
      expect(updated?.status).toBe('paused')
      expect(updated?.isPaused).toBe(true)
    })

    it('should return false for non-processing job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      // Job is in 'pending' status

      const result = pauseJob(job.id)

      expect(result).toBe(false)
      const updated = getJob(job.id)
      expect(updated?.status).toBe('pending')
      expect(updated?.isPaused).toBeFalsy()
    })

    it('should return false for non-existent job', () => {
      const result = pauseJob('non-existent-id')
      expect(result).toBe(false)
    })

    it('should update updatedAt timestamp', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      updateJobStatus(job.id, 'processing')
      const beforePause = getJob(job.id)?.updatedAt

      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      pauseJob(job.id)

      vi.useRealTimers()

      const updated = getJob(job.id)
      expect(updated?.updatedAt).not.toBe(beforePause)
    })
  })

  describe('resumeJob', () => {
    it('should resume a paused job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      updateJobStatus(job.id, 'processing')
      pauseJob(job.id)

      const result = resumeJob(job.id)

      expect(result).toBe(true)
      const updated = getJob(job.id)
      expect(updated?.status).toBe('processing')
      expect(updated?.isPaused).toBe(false)
    })

    it('should return false for non-paused job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      updateJobStatus(job.id, 'processing')

      const result = resumeJob(job.id)

      expect(result).toBe(false)
      const updated = getJob(job.id)
      expect(updated?.status).toBe('processing')
    })

    it('should return false for non-existent job', () => {
      const result = resumeJob('non-existent-id')
      expect(result).toBe(false)
    })

    it('should update updatedAt timestamp', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      updateJobStatus(job.id, 'processing')
      pauseJob(job.id)
      const beforeResume = getJob(job.id)?.updatedAt

      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      resumeJob(job.id)

      vi.useRealTimers()

      const updated = getJob(job.id)
      expect(updated?.updatedAt).not.toBe(beforeResume)
    })
  })

  describe('isJobPaused', () => {
    it('should return true for paused job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      updateJobStatus(job.id, 'processing')
      pauseJob(job.id)

      expect(isJobPaused(job.id)).toBe(true)
    })

    it('should return false for non-paused job', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })
      updateJobStatus(job.id, 'processing')

      expect(isJobPaused(job.id)).toBe(false)
    })

    it('should return false for non-existent job', () => {
      expect(isJobPaused('non-existent-id')).toBe(false)
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

    it('should update existing file result instead of adding duplicate', () => {
      const job = createJob({ sourceType: 'upload', destType: 'download' })

      const result1: FileResult = {
        filename: 'video1.mp4',
        status: 'processing',
        processedAt: new Date().toISOString()
      }

      const result2: FileResult = {
        filename: 'video1.mp4',
        status: 'success',
        outputPath: '/output/video1.mp4',
        processedAt: new Date().toISOString()
      }

      addFileResult(job.id, result1)
      addFileResult(job.id, result2)

      const updated = getJob(job.id)
      expect(updated?.results).toHaveLength(1) // Should not duplicate
      expect(updated?.results[0].status).toBe('success')
      expect(updated?.results[0].outputPath).toBe('/output/video1.mp4')
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

  describe('setJobFiles', () => {
    it('should set files on a job and return true', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' },
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' }
      ]

      const result = setJobFiles(job.id, files)

      expect(result).toBe(true)
      const updated = getJob(job.id)
      expect(updated?.files).toEqual(files)
      expect(updated?.totalFiles).toBe(2)
    })

    it('should return false if files already set (race condition prevention)', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files1: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' }
      ]
      const files2: GDriveFile[] = [
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' }
      ]

      const result1 = setJobFiles(job.id, files1)
      const result2 = setJobFiles(job.id, files2)

      expect(result1).toBe(true)
      expect(result2).toBe(false) // Second call should fail

      // Files should remain as first set
      const updated = getJob(job.id)
      expect(updated?.files).toEqual(files1)
      expect(updated?.totalFiles).toBe(1)
    })

    it('should return false for non-existent job', () => {
      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' }
      ]

      const result = setJobFiles('non-existent-id', files)
      expect(result).toBe(false)
    })
  })

  describe('setJobResolvedDestFolder', () => {
    it('should set resolved destination folder', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      setJobResolvedDestFolder(job.id, 'folder-abc-123')

      const updated = getJob(job.id)
      expect(updated?.resolvedDestFolderId).toBe('folder-abc-123')
    })

    it('should handle non-existent job gracefully', () => {
      expect(() => {
        setJobResolvedDestFolder('non-existent-id', 'folder-abc')
      }).not.toThrow()
    })
  })

  describe('getPendingFiles', () => {
    it('should return all files when none processed', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' },
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' },
        { id: 'file3', name: 'video3.mp4', size: 3000, mimeType: 'video/mp4', path: 'video3.mp4' }
      ]

      setJobFiles(job.id, files)

      const pending = getPendingFiles(job.id)
      expect(pending).toHaveLength(3)
    })

    it('should exclude successfully processed files', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' },
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' },
        { id: 'file3', name: 'video3.mp4', size: 3000, mimeType: 'video/mp4', path: 'video3.mp4' }
      ]

      setJobFiles(job.id, files)
      addFileResult(job.id, { filename: 'video1.mp4', status: 'success' })

      const pending = getPendingFiles(job.id)
      expect(pending).toHaveLength(2)
      expect(pending.map(f => f.name)).toEqual(['video2.mp4', 'video3.mp4'])
    })

    it('should exclude failed files', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' },
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' }
      ]

      setJobFiles(job.id, files)
      addFileResult(job.id, { filename: 'video1.mp4', status: 'failed', error: 'Some error' })

      const pending = getPendingFiles(job.id)
      expect(pending).toHaveLength(1)
      expect(pending[0].name).toBe('video2.mp4')
    })

    it('should exclude files currently processing', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' },
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' }
      ]

      setJobFiles(job.id, files)
      addFileResult(job.id, { filename: 'video1.mp4', status: 'processing' })

      const pending = getPendingFiles(job.id)
      expect(pending).toHaveLength(1)
      expect(pending[0].name).toBe('video2.mp4')
    })

    it('should return empty array for non-existent job', () => {
      const pending = getPendingFiles('non-existent-id')
      expect(pending).toEqual([])
    })

    it('should return empty array for job without files', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const pending = getPendingFiles(job.id)
      expect(pending).toEqual([])
    })
  })

  describe('claimFilesForProcessing', () => {
    it('should claim specified number of files', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' },
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' },
        { id: 'file3', name: 'video3.mp4', size: 3000, mimeType: 'video/mp4', path: 'video3.mp4' },
        { id: 'file4', name: 'video4.mp4', size: 4000, mimeType: 'video/mp4', path: 'video4.mp4' }
      ]

      setJobFiles(job.id, files)

      const claimed = claimFilesForProcessing(job.id, 2)
      expect(claimed).toHaveLength(2)
      expect(claimed.map(f => f.name)).toEqual(['video1.mp4', 'video2.mp4'])

      // Verify they are marked as processing
      const updated = getJob(job.id)
      expect(updated?.results).toHaveLength(2)
      expect(updated?.results[0].status).toBe('processing')
      expect(updated?.results[1].status).toBe('processing')
    })

    it('should not claim already claimed files', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' },
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' },
        { id: 'file3', name: 'video3.mp4', size: 3000, mimeType: 'video/mp4', path: 'video3.mp4' }
      ]

      setJobFiles(job.id, files)

      // First claim
      const claimed1 = claimFilesForProcessing(job.id, 2)
      expect(claimed1).toHaveLength(2)

      // Second claim should get remaining file
      const claimed2 = claimFilesForProcessing(job.id, 2)
      expect(claimed2).toHaveLength(1)
      expect(claimed2[0].name).toBe('video3.mp4')

      // Third claim should get nothing
      const claimed3 = claimFilesForProcessing(job.id, 2)
      expect(claimed3).toHaveLength(0)
    })

    it('should support parallel claiming (simulated)', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' },
        { id: 'file2', name: 'video2.mp4', size: 2000, mimeType: 'video/mp4', path: 'video2.mp4' },
        { id: 'file3', name: 'video3.mp4', size: 3000, mimeType: 'video/mp4', path: 'video3.mp4' },
        { id: 'file4', name: 'video4.mp4', size: 4000, mimeType: 'video/mp4', path: 'video4.mp4' },
        { id: 'file5', name: 'video5.mp4', size: 5000, mimeType: 'video/mp4', path: 'video5.mp4' },
        { id: 'file6', name: 'video6.mp4', size: 6000, mimeType: 'video/mp4', path: 'video6.mp4' }
      ]

      setJobFiles(job.id, files)

      // Simulate 3 parallel workers each claiming 2 files
      const worker1 = claimFilesForProcessing(job.id, 2)
      const worker2 = claimFilesForProcessing(job.id, 2)
      const worker3 = claimFilesForProcessing(job.id, 2)

      // Each worker should get different files
      expect(worker1).toHaveLength(2)
      expect(worker2).toHaveLength(2)
      expect(worker3).toHaveLength(2)

      const allClaimed = [...worker1, ...worker2, ...worker3].map(f => f.name)
      const uniqueClaimed = new Set(allClaimed)
      expect(uniqueClaimed.size).toBe(6) // All 6 files claimed, no duplicates
    })

    it('should return empty array for non-existent job', () => {
      const claimed = claimFilesForProcessing('non-existent-id', 3)
      expect(claimed).toEqual([])
    })

    it('should return empty array when no files to claim', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const claimed = claimFilesForProcessing(job.id, 3)
      expect(claimed).toEqual([])
    })

    it('should claim fewer files if not enough available', () => {
      const job = createJob({ sourceType: 'gdrive', destType: 'gdrive' })

      const files: GDriveFile[] = [
        { id: 'file1', name: 'video1.mp4', size: 1000, mimeType: 'video/mp4', path: 'video1.mp4' }
      ]

      setJobFiles(job.id, files)

      const claimed = claimFilesForProcessing(job.id, 5)
      expect(claimed).toHaveLength(1)
    })
  })
})
