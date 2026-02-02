/**
 * Unified state management hook for decryption jobs
 *
 * Abstracts the client/server flow logic from the main page.
 * Manages both client-side (upload → download) and server-side (GDrive) flows.
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { useClientDecrypt } from './useClientDecrypt'
import { downloadFile as downloadBlob, downloadAsZip, downloadCsv as exportCsv } from '@/lib/download'
import { api, ApiError } from '@/lib/api'
import type { JobConfig, DecryptProgress, FileResult } from '@/types'

type JobStatus = 'idle' | 'processing' | 'completed' | 'failed'

export interface UseDecryptJobReturn {
  /**
   * Start a new decryption job
   */
  startJob: (config: JobConfig) => Promise<void>

  /**
   * Current job status
   */
  status: JobStatus

  /**
   * Current progress information
   */
  progress: DecryptProgress

  /**
   * File processing results
   */
  results: FileResult[]

  /**
   * Error message if job failed
   */
  error: string | null

  /**
   * Clear error message
   */
  clearError: () => void

  /**
   * Get blob for a specific file (client flow only)
   */
  getBlob: (filename: string) => Blob | undefined

  /**
   * Retry failed files
   */
  retry: () => Promise<void>

  /**
   * Cancel current job
   */
  cancel: () => void

  /**
   * Reset to initial state
   */
  reset: () => void

  /**
   * Download single file
   */
  downloadFile: (filename: string) => void

  /**
   * Download all successful files
   */
  downloadAll: () => Promise<void>

  /**
   * Download processing log as CSV
   */
  downloadCsv: () => void

  /**
   * True if using client-side flow
   */
  isClientFlow: boolean

  /**
   * Current job ID (server flow only)
   */
  jobId: string | null
}

/**
 * Unified hook for managing decryption jobs
 *
 * @example
 * ```tsx
 * function DecryptPage() {
 *   const {
 *     startJob,
 *     status,
 *     progress,
 *     results,
 *     retry,
 *     cancel,
 *     reset,
 *     downloadFile,
 *     downloadAll,
 *     downloadCsv,
 *     isClientFlow
 *   } = useDecryptJob()
 *
 *   return (
 *     <>
 *       {status === 'idle' && <DecryptForm onSubmit={startJob} />}
 *       {status === 'processing' && <ProgressPanel progress={progress} onCancel={cancel} />}
 *       {status === 'completed' && <ResultsPanel results={results} onRetry={retry} />}
 *     </>
 *   )
 * }
 * ```
 */
export function useDecryptJob(): UseDecryptJobReturn {
  const [status, setStatus] = useState<JobStatus>('idle')
  const [results, setResults] = useState<FileResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [jobConfig, setJobConfig] = useState<JobConfig | null>(null)
  const [serverJobId, setServerJobId] = useState<string | null>(null)
  const [serverProgress, setServerProgress] = useState<DecryptProgress>({
    totalFiles: 0,
    processedFiles: 0,
    overallProgress: 0,
    status: 'pending'
  })

  const pollingRef = useRef<boolean>(false)

  const {
    decryptFiles,
    progress: clientProgress,
    results: clientResults,
    cancel: cancelClient,
    isProcessing: isClientProcessing,
    reset: resetClient
  } = useClientDecrypt()

  const isClientFlow = jobConfig?.sourceType === 'upload' && jobConfig?.destType === 'download'
  const progress = isClientFlow ? clientProgress : serverProgress

  /**
   * Poll server job status
   */
  const pollJobStatus = useCallback(async (jobId: string) => {
    pollingRef.current = true

    while (pollingRef.current) {
      try {
        const job = await api.get<any>(`/api/jobs/${jobId}`)

        setServerProgress({
          totalFiles: job.totalFiles,
          processedFiles: job.processedFiles,
          currentFile: job.currentFile,
          overallProgress: job.totalFiles > 0
            ? Math.round((job.processedFiles / job.totalFiles) * 100)
            : 0,
          status: job.status
        })

        if (job.status === 'completed') {
          setResults(job.results)
          setStatus('completed')
          pollingRef.current = false
          break
        } else if (job.status === 'failed') {
          setResults(job.results || [])
          setStatus('failed')
          pollingRef.current = false
          break
        }

        // Wait before next poll
        await new Promise(r => setTimeout(r, 1000))
      } catch (err) {
        console.error('Poll error:', err)
        pollingRef.current = false
        setStatus('failed')
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to check job status. Please try again.')
        }
        break
      }
    }
  }, [])

  /**
   * Start a new decryption job
   */
  const startJob = useCallback(async (config: JobConfig) => {
    setJobConfig(config)
    setStatus('processing')
    setResults([])
    setError(null)

    const clientFlow = config.sourceType === 'upload' && config.destType === 'download'

    if (clientFlow) {
      // Client-side flow - decrypt locally with Web Workers
      try {
        const decryptResults = await decryptFiles(config.files || [], config.key)

        const fileResults: FileResult[] = decryptResults.map(r => ({
          filename: r.filename,
          status: r.status === 'success' ? 'success' : 'failed',
          error: r.error,
          size: r.size,
          processedAt: new Date().toISOString()
        }))

        setResults(fileResults)
        setStatus(decryptResults.some(r => r.status === 'failed') ? 'completed' : 'completed')
      } catch (err) {
        setStatus('failed')
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unexpected error occurred during decryption.')
        }
      }
    } else {
      // Server-side flow - create job and poll for status
      try {
        const { jobId } = await api.post<{ jobId: string }>('/api/jobs', {
          sourceType: config.sourceType,
          sourceFolder: config.sourceFolder,
          key: config.key,
          destType: config.destType,
          destFolder: config.destFolder,
          sameFolder: config.sameFolder
        })

        setServerJobId(jobId)
        pollJobStatus(jobId)
      } catch (err) {
        console.error('Failed to start job:', err)
        setStatus('failed')
        if (err instanceof ApiError) {
          setError(err.message)
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Failed to start decryption job. Please try again.')
        }
      }
    }
  }, [decryptFiles, pollJobStatus])

  /**
   * Retry failed files
   */
  const retry = useCallback(async () => {
    if (!jobConfig) return

    const failedFiles = results.filter(r => r.status === 'failed').map(r => r.filename)
    if (failedFiles.length === 0) return

    setStatus('processing')

    if (isClientFlow && jobConfig.files) {
      // Retry client-side with only failed files
      const filesToRetry = jobConfig.files.filter(f => failedFiles.includes(f.name))
      const retryResults = await decryptFiles(filesToRetry, jobConfig.key)

      // Merge with existing successful results
      const successResults = results.filter(r => r.status === 'success')
      const newResults: FileResult[] = [
        ...successResults,
        ...retryResults.map(r => ({
          filename: r.filename,
          status: r.status === 'success' ? 'success' as const : 'failed' as const,
          error: r.error,
          size: r.size,
          processedAt: new Date().toISOString()
        }))
      ]
      setResults(newResults)
      setStatus('completed')
    } else if (serverJobId) {
      // Server-side retry
      const response = await fetch(`/api/jobs/${serverJobId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: jobConfig.key, files: failedFiles })
      })

      if (response.ok) {
        const { jobId } = await response.json()
        setServerJobId(jobId)
        pollJobStatus(jobId)
      }
    }
  }, [jobConfig, results, isClientFlow, decryptFiles, serverJobId, pollJobStatus])

  /**
   * Cancel current job
   */
  const cancel = useCallback(() => {
    pollingRef.current = false
    if (isClientFlow) {
      cancelClient()
    }
    setStatus('idle')
  }, [isClientFlow, cancelClient])

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    pollingRef.current = false
    setStatus('idle')
    setResults([])
    setJobConfig(null)
    setServerJobId(null)
    resetClient()
    setServerProgress({
      totalFiles: 0,
      processedFiles: 0,
      overallProgress: 0,
      status: 'pending'
    })
  }, [resetClient])

  /**
   * Get blob for client-side results
   */
  const getBlob = useCallback((filename: string): Blob | undefined => {
    if (!isClientFlow) return undefined
    const result = clientResults.find(r => r.filename === filename)
    return result?.blob
  }, [isClientFlow, clientResults])

  /**
   * Download single file
   */
  const downloadFile = useCallback((filename: string) => {
    if (isClientFlow) {
      const blob = getBlob(filename)
      if (blob) downloadBlob(blob, filename)
    } else if (serverJobId) {
      window.location.href = `/api/jobs/${serverJobId}/download/${encodeURIComponent(filename)}`
    }
  }, [isClientFlow, getBlob, serverJobId])

  /**
   * Download all files
   */
  const downloadAll = useCallback(async () => {
    if (isClientFlow) {
      const files = clientResults
        .filter(r => r.status === 'success' && r.blob)
        .map(r => ({ blob: r.blob!, name: r.filename }))
      if (files.length > 0) await downloadAsZip(files)
    } else if (serverJobId) {
      window.location.href = `/api/jobs/${serverJobId}/download-all`
    }
  }, [isClientFlow, clientResults, serverJobId])

  /**
   * Download CSV log
   */
  const downloadCsv = useCallback(() => {
    if (!isClientFlow && serverJobId) {
      window.location.href = `/api/jobs/${serverJobId}/csv`
    } else {
      exportCsv(results)
    }
  }, [isClientFlow, serverJobId, results])

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    startJob,
    status,
    progress,
    results,
    error,
    clearError,
    getBlob,
    retry,
    cancel,
    reset,
    downloadFile,
    downloadAll,
    downloadCsv,
    isClientFlow,
    jobId: serverJobId
  }
}
