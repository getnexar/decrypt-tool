/**
 * React hook for client-side file decryption
 *
 * Manages client-side decryption for the "Local Upload → Download" flow.
 * Uses Web Workers to decrypt files without sending them to the server.
 */

import { useState, useCallback, useRef } from 'react'
import { createDecryptWorker } from '@/workers'
import type { DecryptWorkerOutput } from '@/workers/types'
import type { DecryptProgress, FileStatus } from '@/types'

/**
 * Result for a single file's decryption attempt
 */
export interface DecryptResult {
  filename: string
  status: FileStatus
  error?: string
  blob?: Blob
  size?: number
}

/**
 * Hook return interface
 */
export interface UseClientDecryptReturn {
  /**
   * Start decrypting files
   */
  decryptFiles: (files: File[], key: string) => Promise<DecryptResult[]>

  /**
   * Current progress state
   */
  progress: DecryptProgress

  /**
   * Individual file results
   */
  results: DecryptResult[]

  /**
   * Cancel ongoing decryption
   */
  cancel: () => void

  /**
   * Pause decryption after current file completes
   */
  pause: () => void

  /**
   * Resume paused decryption
   */
  resume: () => void

  /**
   * Is currently processing
   */
  isProcessing: boolean

  /**
   * Is currently paused
   */
  isPaused: boolean

  /**
   * Reset state for new job
   */
  reset: () => void
}

/**
 * Client-side decryption hook
 *
 * @example
 * ```tsx
 * function DecryptPage() {
 *   const { decryptFiles, progress, results, cancel, isProcessing } = useClientDecrypt()
 *
 *   const handleSubmit = async (files: File[], key: string) => {
 *     const results = await decryptFiles(files, key)
 *     // results contains blobs ready for download
 *   }
 *
 *   return (
 *     <div>
 *       {isProcessing && (
 *         <ProgressPanel progress={progress} onCancel={cancel} />
 *       )}
 *       {results.length > 0 && !isProcessing && (
 *         <ResultsPanel results={results} />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useClientDecrypt(): UseClientDecryptReturn {
  const [progress, setProgress] = useState<DecryptProgress>({
    totalFiles: 0,
    processedFiles: 0,
    overallProgress: 0,
    status: 'pending'
  })

  const [results, setResults] = useState<DecryptResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const workerRef = useRef<Worker | null>(null)
  const cancelledRef = useRef(false)
  const pausedRef = useRef(false)
  const resumeResolverRef = useRef<(() => void) | null>(null)

  /**
   * Reset all state for a new decryption job
   */
  const reset = useCallback(() => {
    setProgress({
      totalFiles: 0,
      processedFiles: 0,
      overallProgress: 0,
      status: 'pending'
    })
    setResults([])
    setIsProcessing(false)
    cancelledRef.current = false
  }, [])

  /**
   * Cancel ongoing decryption
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    // If paused, resolve the wait so we can exit
    if (resumeResolverRef.current) {
      resumeResolverRef.current()
      resumeResolverRef.current = null
    }
    setIsProcessing(false)
    setIsPaused(false)
    setProgress(prev => ({ ...prev, status: 'failed' }))
  }, [])

  /**
   * Pause decryption after current file completes
   */
  const pause = useCallback(() => {
    pausedRef.current = true
    setIsPaused(true)
    setProgress(prev => ({ ...prev, status: 'paused' }))
  }, [])

  /**
   * Resume paused decryption
   */
  const resume = useCallback(() => {
    pausedRef.current = false
    setIsPaused(false)
    setProgress(prev => ({ ...prev, status: 'processing' }))
    // Resolve the pause wait if we're waiting
    if (resumeResolverRef.current) {
      resumeResolverRef.current()
      resumeResolverRef.current = null
    }
  }, [])

  /**
   * Decrypt multiple files
   *
   * @param files - Files to decrypt
   * @param key - 32-character hexadecimal decryption key
   * @returns Array of decrypt results with blobs
   */
  const decryptFiles = useCallback(
    async (files: File[], key: string): Promise<DecryptResult[]> => {
      reset()
      cancelledRef.current = false
      setIsProcessing(true)

      // Initialize results
      const initialResults: DecryptResult[] = files.map(f => ({
        filename: f.name,
        status: 'pending'
      }))
      setResults(initialResults)

      setProgress({
        totalFiles: files.length,
        processedFiles: 0,
        overallProgress: 0,
        status: 'processing',
        startedAt: new Date().toISOString()
      })

      const finalResults: DecryptResult[] = [...initialResults]
      let completedCount = 0

      // Process files sequentially with a worker
      // (Could be enhanced to use worker pool for parallel processing)
      const worker = createDecryptWorker()
      workerRef.current = worker

      for (let i = 0; i < files.length; i++) {
        if (cancelledRef.current) break

        const file = files[i]

        // Update status to processing
        finalResults[i] = { ...finalResults[i], status: 'processing' }
        setResults([...finalResults])
        setProgress(prev => ({
          ...prev,
          currentFile: file.name,
          currentFileProgress: 0
        }))

        // Process file with worker
        const result = await new Promise<DecryptResult>(resolve => {
          const handleMessage = (event: MessageEvent<DecryptWorkerOutput>) => {
            const msg = event.data

            if (msg.fileIndex !== i) return

            switch (msg.type) {
              case 'progress':
                setProgress(prev => ({
                  ...prev,
                  currentFileProgress: msg.percentComplete
                }))
                break

              case 'success':
                worker.removeEventListener('message', handleMessage)
                resolve({
                  filename: msg.filename,
                  status: 'success',
                  blob: msg.blob,
                  size: msg.size
                })
                break

              case 'error':
                worker.removeEventListener('message', handleMessage)
                resolve({
                  filename: msg.filename,
                  status: 'failed',
                  error: msg.error
                })
                break
            }
          }

          worker.addEventListener('message', handleMessage)
          worker.postMessage({ type: 'decrypt', file, key, fileIndex: i })
        })

        // Update results
        finalResults[i] = result
        setResults([...finalResults])

        completedCount++
        setProgress(prev => ({
          ...prev,
          processedFiles: completedCount,
          overallProgress: Math.round((completedCount / files.length) * 100),
          currentFile: undefined,
          currentFileProgress: undefined
        }))

        // Check if paused - wait for resume before continuing
        if (pausedRef.current && i < files.length - 1) {
          await new Promise<void>(resolve => {
            resumeResolverRef.current = resolve
          })
        }
      }

      // Cleanup
      worker.terminate()
      workerRef.current = null
      setIsProcessing(false)

      const hasFailures = finalResults.some(r => r.status === 'failed')
      setProgress(prev => ({
        ...prev,
        status: cancelledRef.current ? 'failed' : hasFailures ? 'completed' : 'completed'
      }))

      return finalResults
    },
    [reset]
  )

  return {
    decryptFiles,
    progress,
    results,
    cancel,
    pause,
    resume,
    isProcessing,
    isPaused,
    reset
  }
}
