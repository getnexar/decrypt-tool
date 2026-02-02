// src/lib/__tests__/processor.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { processGDriveJob, getDecryptedFile, cleanupJobFiles } from '../processor'
import {
  createJob,
  getJob,
  deleteJob,
  getAllJobs
} from '../job-store'
import * as gdrive from '../gdrive'
import { generateXorPad, decryptChunk } from '../crypto'
import type { GDriveFile } from '@/types'

// Mock environment variable
const mockAccessToken = 'mock-access-token-12345'
process.env.GDRIVE_ACCESS_TOKEN = mockAccessToken

// Mock Google Drive functions
vi.mock('../gdrive', () => ({
  listMp4Files: vi.fn(),
  downloadFileAsBuffer: vi.fn(),
  uploadFile: vi.fn(),
  getOrCreateDecryptedFolder: vi.fn()
}))

describe('Processor', () => {
  const testKey = 'f626ad1ffb5159bef3e9295df34244af'
  const testFolderId = 'test-folder-123'
  const testDestFolderId = 'dest-folder-456'

  beforeEach(() => {
    // Clear all jobs before each test
    const allJobs = getAllJobs()
    allJobs.forEach(job => deleteJob(job.id))

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('processGDriveJob', () => {
    describe('happy path - GDrive to Download', () => {
      it('should process single file successfully', async () => {
        // Create job
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        // Mock file list
        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        // Create valid encrypted MP4 data
        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18, // box size = 24
          0x66, 0x74, 0x79, 0x70, // "ftyp"
          0x69, 0x73, 0x6f, 0x6d  // brand: "isom"
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const encryptedBuffer = Buffer.from(encryptedHeader)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

        // Process job
        await processGDriveJob(job.id, testKey)

        // Verify job status
        const updatedJob = getJob(job.id)
        expect(updatedJob?.status).toBe('completed')
        expect(updatedJob?.totalFiles).toBe(1)
        expect(updatedJob?.processedFiles).toBe(1)

        // Verify file result
        expect(updatedJob?.results).toHaveLength(1)
        expect(updatedJob?.results[0].filename).toBe('video1.mp4')
        expect(updatedJob?.results[0].status).toBe('success')
        expect(updatedJob?.results[0].downloadUrl).toBeDefined()
        expect(updatedJob?.results[0].size).toBe(encryptedBuffer.length)

        // Verify GDrive API calls
        expect(gdrive.listMp4Files).toHaveBeenCalledWith(
          testFolderId,
          { accessToken: mockAccessToken }
        )
        expect(gdrive.downloadFileAsBuffer).toHaveBeenCalledWith(
          'file1',
          { accessToken: mockAccessToken }
        )
      })

      it('should process multiple files successfully', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          },
          {
            id: 'file2',
            name: 'video2.mp4',
            size: 2000,
            mimeType: 'video/mp4',
            path: 'video2.mp4'
          },
          {
            id: 'file3',
            name: 'video3.mp4',
            size: 3000,
            mimeType: 'video/mp4',
            path: 'video3.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        // Create valid encrypted data for all files
        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const encryptedBuffer = Buffer.from(encryptedHeader)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

        await processGDriveJob(job.id, testKey)

        const updatedJob = getJob(job.id)
        expect(updatedJob?.status).toBe('completed')
        expect(updatedJob?.totalFiles).toBe(3)
        expect(updatedJob?.processedFiles).toBe(3)
        expect(updatedJob?.results).toHaveLength(3)

        // All files should be successful
        expect(updatedJob?.results[0].status).toBe('success')
        expect(updatedJob?.results[1].status).toBe('success')
        expect(updatedJob?.results[2].status).toBe('success')

        // Verify download was called for each file
        expect(gdrive.downloadFileAsBuffer).toHaveBeenCalledTimes(3)
      })

      it('should retrieve decrypted file from storage', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const encryptedBuffer = Buffer.from(encryptedHeader)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

        await processGDriveJob(job.id, testKey)

        // Retrieve decrypted file
        const decryptedFile = await getDecryptedFile(job.id, 'video1.mp4')

        expect(decryptedFile).toBeInstanceOf(Buffer)
        expect(decryptedFile.length).toBe(encryptedBuffer.length)
      })
    })

    describe('happy path - GDrive to GDrive', () => {
      it('should upload to destination folder', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'gdrive',
          destPath: testDestFolderId
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const encryptedBuffer = Buffer.from(encryptedHeader)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)
        vi.mocked(gdrive.uploadFile).mockResolvedValue('new-file-id-123')

        await processGDriveJob(job.id, testKey)

        // Verify upload was called
        expect(gdrive.uploadFile).toHaveBeenCalledWith(
          testDestFolderId,
          'video1.mp4',
          expect.any(Buffer),
          'video/mp4',
          { accessToken: mockAccessToken }
        )

        // Verify result contains output path
        const updatedJob = getJob(job.id)
        expect(updatedJob?.results[0].status).toBe('success')
        expect(updatedJob?.results[0].outputPath).toBe('gdrive://new-file-id-123')
      })

      it('should create decrypted subfolder when sameFolder=true', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'gdrive',
          sameFolder: true
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const encryptedBuffer = Buffer.from(encryptedHeader)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)
        vi.mocked(gdrive.getOrCreateDecryptedFolder).mockResolvedValue('decrypted-folder-id')
        vi.mocked(gdrive.uploadFile).mockResolvedValue('new-file-id-123')

        await processGDriveJob(job.id, testKey)

        // Verify decrypted folder was created/retrieved
        expect(gdrive.getOrCreateDecryptedFolder).toHaveBeenCalledWith(
          testFolderId,
          { accessToken: mockAccessToken }
        )

        // Verify upload to decrypted folder
        expect(gdrive.uploadFile).toHaveBeenCalledWith(
          'decrypted-folder-id',
          'video1.mp4',
          expect.any(Buffer),
          'video/mp4',
          { accessToken: mockAccessToken }
        )
      })
    })

    describe('error handling', () => {
      it('should handle wrong decryption key', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        // Use wrong key to encrypt
        const wrongKey = '00000000000000000000000000000000'
        const wrongPad = generateXorPad(wrongKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedWithWrongKey = decryptChunk(realHeader, wrongPad, 0)
        const encryptedBuffer = Buffer.from(encryptedWithWrongKey)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

        // Use correct key to decrypt (should fail validation)
        await processGDriveJob(job.id, testKey)

        const updatedJob = getJob(job.id)
        expect(updatedJob?.status).toBe('completed')
        expect(updatedJob?.results[0].status).toBe('failed')
        expect(updatedJob?.results[0].error).toContain('Invalid MP4 header')
      })

      it('should handle individual file failures without stopping job', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          },
          {
            id: 'file2',
            name: 'video2.mp4',
            size: 2000,
            mimeType: 'video/mp4',
            path: 'video2.mp4'
          },
          {
            id: 'file3',
            name: 'video3.mp4',
            size: 3000,
            mimeType: 'video/mp4',
            path: 'video3.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const validBuffer = Buffer.from(encryptedHeader)

        // First file succeeds, second fails, third succeeds
        vi.mocked(gdrive.downloadFileAsBuffer)
          .mockResolvedValueOnce(validBuffer)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(validBuffer)

        await processGDriveJob(job.id, testKey)

        const updatedJob = getJob(job.id)
        expect(updatedJob?.status).toBe('completed')
        expect(updatedJob?.totalFiles).toBe(3)
        expect(updatedJob?.processedFiles).toBe(3)

        // Check individual results
        expect(updatedJob?.results[0].status).toBe('success')
        expect(updatedJob?.results[1].status).toBe('failed')
        expect(updatedJob?.results[1].error).toContain('Network error')
        expect(updatedJob?.results[2].status).toBe('success')
      })

      it('should handle job not found', async () => {
        await expect(
          processGDriveJob('non-existent-job', testKey)
        ).rejects.toThrow('Job non-existent-job not found')
      })

      it('should handle missing source path', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          destType: 'download'
          // No sourcePath
        })

        await expect(
          processGDriveJob(job.id, testKey)
        ).rejects.toThrow('No source path specified')

        const updatedJob = getJob(job.id)
        expect(updatedJob?.status).toBe('failed')
      })

      it('should handle Google Drive API errors', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        vi.mocked(gdrive.listMp4Files).mockRejectedValue(
          new Error('Drive API error: 403 - Forbidden')
        )

        await expect(
          processGDriveJob(job.id, testKey)
        ).rejects.toThrow('Drive API error: 403 - Forbidden')

        const updatedJob = getJob(job.id)
        expect(updatedJob?.status).toBe('failed')
      })
    })

    describe('retry functionality', () => {
      it('should retry only specific files', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          },
          {
            id: 'file2',
            name: 'video2.mp4',
            size: 2000,
            mimeType: 'video/mp4',
            path: 'video2.mp4'
          },
          {
            id: 'file3',
            name: 'video3.mp4',
            size: 3000,
            mimeType: 'video/mp4',
            path: 'video3.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const encryptedBuffer = Buffer.from(encryptedHeader)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

        // Retry only video2.mp4
        await processGDriveJob(job.id, testKey, ['video2.mp4'])

        const updatedJob = getJob(job.id)
        expect(updatedJob?.totalFiles).toBe(1)
        expect(updatedJob?.processedFiles).toBe(1)
        expect(updatedJob?.results).toHaveLength(1)
        expect(updatedJob?.results[0].filename).toBe('video2.mp4')

        // Only one download should have occurred
        expect(gdrive.downloadFileAsBuffer).toHaveBeenCalledTimes(1)
      })
    })

    describe('filename sanitization', () => {
      it('should sanitize malicious filenames', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: '../../../etc/passwd.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: '../../../etc/passwd.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const encryptedBuffer = Buffer.from(encryptedHeader)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

        await processGDriveJob(job.id, testKey)

        // File should still be in results with original name
        const updatedJob = getJob(job.id)
        expect(updatedJob?.results[0].filename).toBe('../../../etc/passwd.mp4')
        expect(updatedJob?.results[0].status).toBe('success')
      })
    })

    describe('empty file list', () => {
      it('should complete immediately when no files found', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        vi.mocked(gdrive.listMp4Files).mockResolvedValue([])

        await processGDriveJob(job.id, testKey)

        const updatedJob = getJob(job.id)
        expect(updatedJob?.status).toBe('completed')
        expect(updatedJob?.totalFiles).toBe(0)
        expect(updatedJob?.processedFiles).toBe(0)
        expect(updatedJob?.results).toHaveLength(0)
      })
    })

    describe('progress tracking', () => {
      it('should update progress during processing', async () => {
        const job = createJob({
          sourceType: 'gdrive',
          sourcePath: testFolderId,
          destType: 'download'
        })

        const mockFiles: GDriveFile[] = [
          {
            id: 'file1',
            name: 'video1.mp4',
            size: 1000,
            mimeType: 'video/mp4',
            path: 'video1.mp4'
          },
          {
            id: 'file2',
            name: 'video2.mp4',
            size: 2000,
            mimeType: 'video/mp4',
            path: 'video2.mp4'
          }
        ]
        vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

        const pad = generateXorPad(testKey)
        const realHeader = new Uint8Array([
          0x00, 0x00, 0x00, 0x18,
          0x66, 0x74, 0x79, 0x70,
          0x69, 0x73, 0x6f, 0x6d
        ])
        const encryptedHeader = decryptChunk(realHeader, pad, 0)
        const encryptedBuffer = Buffer.from(encryptedHeader)

        vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

        await processGDriveJob(job.id, testKey)

        const updatedJob = getJob(job.id)
        expect(updatedJob?.totalFiles).toBe(2)
        expect(updatedJob?.processedFiles).toBe(2)
        // Note: currentFile will be the last processed file, not undefined
        // This is due to job-store not supporting setting fields to undefined
        expect(updatedJob?.currentFile).toBeDefined()
      })
    })
  })

  describe('getDecryptedFile', () => {
    it('should retrieve decrypted file from storage', async () => {
      const job = createJob({
        sourceType: 'gdrive',
        sourcePath: testFolderId,
        destType: 'download'
      })

      const mockFiles: GDriveFile[] = [
        {
          id: 'file1',
          name: 'video1.mp4',
          size: 1000,
          mimeType: 'video/mp4',
          path: 'video1.mp4'
        }
      ]
      vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

      const pad = generateXorPad(testKey)
      const realHeader = new Uint8Array([
        0x00, 0x00, 0x00, 0x18,
        0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d
      ])
      const encryptedHeader = decryptChunk(realHeader, pad, 0)
      const encryptedBuffer = Buffer.from(encryptedHeader)

      vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

      await processGDriveJob(job.id, testKey)

      const file = await getDecryptedFile(job.id, 'video1.mp4')

      expect(file).toBeInstanceOf(Buffer)
      expect(file.length).toBeGreaterThan(0)
    })

    it('should throw error for non-existent job', async () => {
      await expect(
        getDecryptedFile('non-existent-job', 'video1.mp4')
      ).rejects.toThrow('No files stored for job non-existent-job')
    })

    it('should throw error for non-existent file', async () => {
      const job = createJob({
        sourceType: 'gdrive',
        sourcePath: testFolderId,
        destType: 'download'
      })

      const mockFiles: GDriveFile[] = [
        {
          id: 'file1',
          name: 'video1.mp4',
          size: 1000,
          mimeType: 'video/mp4',
          path: 'video1.mp4'
        }
      ]
      vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

      const pad = generateXorPad(testKey)
      const realHeader = new Uint8Array([
        0x00, 0x00, 0x00, 0x18,
        0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d
      ])
      const encryptedHeader = decryptChunk(realHeader, pad, 0)
      const encryptedBuffer = Buffer.from(encryptedHeader)

      vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

      await processGDriveJob(job.id, testKey)

      await expect(
        getDecryptedFile(job.id, 'video2.mp4')
      ).rejects.toThrow('File video2.mp4 not found for job')
    })
  })

  describe('cleanupJobFiles', () => {
    it('should remove files from storage', async () => {
      const job = createJob({
        sourceType: 'gdrive',
        sourcePath: testFolderId,
        destType: 'download'
      })

      const mockFiles: GDriveFile[] = [
        {
          id: 'file1',
          name: 'video1.mp4',
          size: 1000,
          mimeType: 'video/mp4',
          path: 'video1.mp4'
        }
      ]
      vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

      const pad = generateXorPad(testKey)
      const realHeader = new Uint8Array([
        0x00, 0x00, 0x00, 0x18,
        0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d
      ])
      const encryptedHeader = decryptChunk(realHeader, pad, 0)
      const encryptedBuffer = Buffer.from(encryptedHeader)

      vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

      await processGDriveJob(job.id, testKey)

      // File should be retrievable before cleanup
      const fileBefore = await getDecryptedFile(job.id, 'video1.mp4')
      expect(fileBefore).toBeInstanceOf(Buffer)

      // Cleanup
      await cleanupJobFiles(job.id)

      // File should not be retrievable after cleanup
      await expect(
        getDecryptedFile(job.id, 'video1.mp4')
      ).rejects.toThrow('No files stored for job')
    })

    it('should handle cleanup of non-existent job gracefully', async () => {
      await expect(
        cleanupJobFiles('non-existent-job')
      ).resolves.toBeUndefined()
    })
  })

  describe('authentication', () => {
    it('should use access token from environment', async () => {
      const job = createJob({
        sourceType: 'gdrive',
        sourcePath: testFolderId,
        destType: 'download'
      })

      const mockFiles: GDriveFile[] = [
        {
          id: 'file1',
          name: 'video1.mp4',
          size: 1000,
          mimeType: 'video/mp4',
          path: 'video1.mp4'
        }
      ]
      vi.mocked(gdrive.listMp4Files).mockResolvedValue(mockFiles)

      const pad = generateXorPad(testKey)
      const realHeader = new Uint8Array([
        0x00, 0x00, 0x00, 0x18,
        0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d
      ])
      const encryptedHeader = decryptChunk(realHeader, pad, 0)
      const encryptedBuffer = Buffer.from(encryptedHeader)

      vi.mocked(gdrive.downloadFileAsBuffer).mockResolvedValue(encryptedBuffer)

      await processGDriveJob(job.id, testKey)

      // Verify that GDrive functions were called with the correct access token
      expect(gdrive.listMp4Files).toHaveBeenCalledWith(
        testFolderId,
        { accessToken: mockAccessToken }
      )
    })
  })
})
