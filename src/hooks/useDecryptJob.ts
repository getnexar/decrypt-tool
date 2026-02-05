/**
 * Unified state management hook for decryption jobs
 *
 * Abstracts the client/server flow logic from the main page.
 * Manages both client-side (upload → download) and server-side (GDrive) flows.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useClientDecrypt } from './useClientDecrypt'
import { downloadFile as downloadBlob, downloadAsZip, downloadCsv as exportCsv } from '@/lib/download'
import { api, ApiError } from '@/lib/api'
import type { JobConfig, DecryptProgress, FileResult, ProcessNextResponse } from '@/types'

type JobStatus = 'idle' | 'processing' | 'completed' | 'failed'

export interface UseDecryptJobReturn {
  /**
   * Start a new decryption job
   */
  startJob: (config: JobConfig) => Promise<void>

  /**
   * Restart job with [decrypted] prefix mode (after folder creation fails)
   */
  restartWithPrefix: () => Promise<void>

  /**
   * Retry job after user manually creates folder
   */
  retryWithManualFolder: () => Promise<void>

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
   * Pause current job (client flow only)
   */
  pause: () => void

  /**
   * Resume paused job (client flow only)
   */
  resume: () => void

  /**
   * Is job currently paused (client flow only)
   */
  isPaused: boolean

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
  const [serverStartedAt, setServerStartedAt] = useState<string | null>(null)

  const processingRef = useRef<boolean>(false)
  const pausedRef = useRef<boolean>(false)
  const keyRef = useRef<string>('')
  const isRetryingRef = useRef<boolean>(false)
  const successfulResultsRef = useRef<FileResult[]>([])

  const {
    decryptFiles,
    progress: clientProgress,
    results: clientResults,
    cancel: cancelClient,
    pause: pauseClient,
    resume: resumeClient,
    isProcessing: isClientProcessing,
    isPaused: isClientPaused,
    reset: resetClient
  } = useClientDecrypt()

  const isClientFlow = jobConfig?.sourceType === 'upload' && jobConfig?.destType === 'download'
  const progress = isClientFlow ? clientProgress : serverProgress

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processingRef.current = false
      pausedRef.current = false
    }
  }, [])

  // During retry, merge successful results with live client results
  const liveResults = isRetryingRef.current && isClientProcessing
    ? [
        ...successfulResultsRef.current,
        ...clientResults.map(r => ({
          filename: r.filename,
          status: r.status,
          error: r.error,
          size: r.size
        } as FileResult))
      ]
    : (isClientFlow && isClientProcessing)
      ? clientResults.map(r => ({
          filename: r.filename,
          status: r.status,
          error: r.error,
          size: r.size
        } as FileResult))
      : results

  // Number of parallel workers for processing
  const PARALLEL_WORKERS = 3

  /**
   * Single worker that processes files in batches
   */
  const processWorker = useCallback(async (
    jobId: string,
    key: string,
    workerId: number,
    onBatchComplete: (response: ProcessNextResponse) => void
  ): Promise<void> => {
    while (processingRef.current) {
      // Check if paused
      if (pausedRef.current) {
        await new Promise(r => setTimeout(r, 500))
        continue
      }

      try {
        const response = await api.post<ProcessNextResponse>(
          `/api/jobs/${jobId}/process-next`,
          { key }
        )

        onBatchComplete(response)

        // Check if this worker is done (no more files to claim)
        if (response.done) {
          break
        }

        // Check for job-level error
        if (response.error) {
          throw new ApiError(response.error, 401)
        }

        // Small stagger between requests from same worker
        await new Promise(r => setTimeout(r, 50))

      } catch (err) {
        // Re-throw to be handled by parent
        throw err
      }
    }
  }, [])

  /**
   * Process files using parallel workers (client-driven processing)
   * Each call to /process-next gets a fresh JWT from the browser session
   */
  const processFiles = useCallback(async (jobId: string, key: string) => {
    processingRef.current = true
    keyRef.current = key

    // Callback to aggregate results from all workers
    const onBatchComplete = (response: ProcessNextResponse) => {
      // Update progress
      setServerProgress(prev => ({
        totalFiles: response.totalFiles,
        processedFiles: response.processedFiles,
        overallProgress: response.totalFiles > 0
          ? Math.round((response.processedFiles / response.totalFiles) * 100)
          : 0,
        status: response.done ? 'completed' : 'processing',
        startedAt: prev.startedAt
      }))

      // Update results: add processing files and completed batch results
      setResults(prev => {
        let updated = [...prev]

        // Add files currently being processed (from any worker)
        if (response.processingFiles && response.processingFiles.length > 0) {
          for (const filename of response.processingFiles) {
            const exists = updated.some(r => r.filename === filename)
            if (!exists) {
              updated.push({ filename, status: 'processing' })
            }
          }
        }

        // Update with completed batch results
        if (response.batchResults && response.batchResults.length > 0) {
          for (const result of response.batchResults) {
            const idx = updated.findIndex(r => r.filename === result.filename)
            if (idx >= 0) {
              updated[idx] = result
            } else {
              updated.push(result)
            }
          }
        }

        return updated
      })
    }

    try {
      // Launch parallel workers
      const workers = Array.from({ length: PARALLEL_WORKERS }, (_, i) =>
        processWorker(jobId, key, i, onBatchComplete)
      )

      // Wait for all workers to complete
      await Promise.all(workers)

      // All workers done
      if (processingRef.current) {
        setStatus('completed')
        processingRef.current = false
      }

    } catch (err) {
      console.error('Process error:', err)
      processingRef.current = false

      if (err instanceof ApiError) {
        setError(err.message)
        if (err.status === 401) {
          setError('Google Drive authentication expired. Please refresh the page to continue.')
        }
      } else {
        setError('Failed to process files. Please try again.')
      }
      setStatus('failed')
    }
  }, [processWorker])

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
      // Server-side flow - create job and drive processing from client
      try {
        const { jobId } = await api.post<{ jobId: string }>('/api/jobs', {
          sourceType: config.sourceType,
          sourceFolder: config.sourceFolder,
          key: config.key,
          destType: config.destType,
          destFolder: config.destFolder,
          sameFolder: config.sameFolder,
          useDecryptedPrefix: config.useDecryptedPrefix
        })

        setServerJobId(jobId)
        const startTime = new Date().toISOString()
        setServerStartedAt(startTime)
        setServerProgress(prev => ({ ...prev, startedAt: startTime }))

        // Start client-driven processing (each request gets fresh JWT)
        processFiles(jobId, config.key)
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
  }, [decryptFiles, processFiles])

  /**
   * Restart job with [decrypted] prefix mode (after folder creation fails)
   */
  const restartWithPrefix = useCallback(async () => {
    if (!jobConfig) return

    // Clear error and restart with prefix mode enabled
    setError(null)
    setStatus('processing')
    const newConfig = {
      ...jobConfig,
      useDecryptedPrefix: true
    }
    setJobConfig(newConfig)
    await startJob(newConfig)
  }, [jobConfig, startJob])

  /**
   * Retry job after user manually creates folder
   */
  const retryWithManualFolder = useCallback(async () => {
    if (!jobConfig) return

    // Clear error and restart - will find the manually created folder
    setError(null)
    setStatus('processing')
    await startJob(jobConfig)
  }, [jobConfig, startJob])

  /**
   * Retry failed files
   */
  const retry = useCallback(async () => {
    if (!jobConfig) return

    const failedFiles = results.filter(r => r.status === 'failed').map(r => r.filename)
    if (failedFiles.length === 0) return

    setStatus('processing')

    if (isClientFlow && jobConfig.files) {
      // Save successful results for merging during retry
      const successResults = results.filter(r => r.status === 'success')
      successfulResultsRef.current = successResults
      isRetryingRef.current = true

      // Retry client-side with only failed files
      const filesToRetry = jobConfig.files.filter(f => failedFiles.includes(f.name))
      const retryResults = await decryptFiles(filesToRetry, jobConfig.key)

      // Merge with existing successful results
      isRetryingRef.current = false
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
      // Server-side retry - create new job and process from client
      const response = await fetch(`/api/jobs/${serverJobId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: jobConfig.key, files: failedFiles })
      })

      if (response.ok) {
        const { jobId } = await response.json()
        setServerJobId(jobId)
        // Start client-driven processing for the new job
        processFiles(jobId, jobConfig.key)
      }
    }
  }, [jobConfig, results, isClientFlow, decryptFiles, serverJobId, processFiles])

  /**
   * Cancel current job
   */
  const cancel = useCallback(() => {
    processingRef.current = false
    pausedRef.current = false
    if (isClientFlow) {
      cancelClient()
    }
    setStatus('idle')
  }, [isClientFlow, cancelClient])

  /**
   * Pause current job
   */
  const pause = useCallback(async () => {
    if (isClientFlow) {
      pauseClient()
    } else {
      // For server flow, pause happens client-side (processing loop checks pausedRef)
      pausedRef.current = true
      setServerProgress(prev => ({ ...prev, status: 'paused' }))
    }
  }, [isClientFlow, pauseClient])

  /**
   * Resume paused job
   */
  const resume = useCallback(async () => {
    if (isClientFlow) {
      resumeClient()
    } else {
      // For server flow, resume client-side processing
      pausedRef.current = false
      setServerProgress(prev => ({ ...prev, status: 'processing' }))
    }
  }, [isClientFlow, resumeClient])

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    processingRef.current = false
    pausedRef.current = false
    keyRef.current = ''
    setStatus('idle')
    setResults([])
    setError(null)
    setJobConfig(null)
    setServerJobId(null)
    setServerStartedAt(null)
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
    restartWithPrefix,
    retryWithManualFolder,
    status,
    progress,
    results: liveResults,
    error,
    clearError,
    getBlob,
    retry,
    cancel,
    pause,
    resume,
    isPaused: isClientFlow ? isClientPaused : pausedRef.current,
    reset,
    downloadFile,
    downloadAll,
    downloadCsv,
    isClientFlow,
    jobId: serverJobId
  }
}
