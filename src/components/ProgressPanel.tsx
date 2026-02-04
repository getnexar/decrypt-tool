'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import type { DecryptProgress, FileResult } from '@/types'

interface ProgressPanelProps {
  progress: DecryptProgress
  results?: FileResult[]
  onCancel?: () => void
  onPause?: () => void
  onResume?: () => void
  isPaused?: boolean
}

/**
 * Status indicator for file log
 */
function StatusIcon({ status }: { status: FileResult['status'] }) {
  switch (status) {
    case 'pending':
      return <span className="text-muted-foreground">○</span>
    case 'processing':
      return <span className="text-primary animate-pulse">●</span>
    case 'success':
      return <span className="text-green-600">✓</span>
    case 'failed':
      return <span className="text-destructive">✗</span>
    default:
      return <span className="text-muted-foreground">○</span>
  }
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--:--'

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ProgressPanel({ progress, results = [], onCancel, onPause, onResume, isPaused = false }: ProgressPanelProps) {
  const [now, setNow] = useState(() => Date.now())
  const lastEstimateRef = useRef<number | null>(null)
  const lastProcessedRef = useRef<number>(0)
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when results change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [results])

  // Update current time every second for elapsed time calculation
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Reset refs when a new job/retry starts (detected by startedAt change)
  useEffect(() => {
    lastEstimateRef.current = null
    lastProcessedRef.current = 0
  }, [progress.startedAt])

  // Calculate elapsed and remaining time
  const startTime = progress.startedAt ? new Date(progress.startedAt).getTime() : null
  const elapsedSeconds = startTime ? Math.floor((now - startTime) / 1000) : 0

  // Calculate remaining time with smoothing
  let remainingSeconds: number | null = null
  if (progress.processedFiles > 0 && progress.totalFiles > 0) {
    const avgTimePerFile = elapsedSeconds / progress.processedFiles
    const remainingFiles = progress.totalFiles - progress.processedFiles
    const newEstimate = Math.ceil(avgTimePerFile * remainingFiles)

    // Only update estimate when a file completes, otherwise decay smoothly
    if (progress.processedFiles > lastProcessedRef.current) {
      // File completed - update estimate
      lastEstimateRef.current = newEstimate
      lastProcessedRef.current = progress.processedFiles
      remainingSeconds = newEstimate
    } else if (lastEstimateRef.current !== null) {
      // Between files - smoothly decrease by 1 second per tick
      remainingSeconds = Math.max(0, lastEstimateRef.current - 1)
      lastEstimateRef.current = remainingSeconds
    } else {
      remainingSeconds = newEstimate
      lastEstimateRef.current = newEstimate
    }
  }

  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {isPaused
                ? `Paused at ${progress.processedFiles} of ${progress.totalFiles} files`
                : `Decrypting file ${progress.processedFiles + 1} of ${progress.totalFiles}...`
              }
            </span>
            <span>{progress.overallProgress}%</span>
          </div>
          <Progress value={progress.overallProgress} />
        </div>
        {progress.startedAt && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Elapsed: {formatTime(elapsedSeconds)}</span>
            <span>Remaining: ~{remainingSeconds !== null ? formatTime(remainingSeconds) : '--:--'}</span>
          </div>
        )}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Files:</p>
            <div ref={logContainerRef} className="max-h-48 overflow-y-auto border rounded-lg divide-y">
              {results.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <StatusIcon status={file.status} />
                  <span className="truncate flex-1">{file.filename}</span>
                  {file.status === 'failed' && file.error && (
                    <span className="text-xs text-destructive truncate max-w-32">
                      {file.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {(onCancel || onPause || onResume) && (
          <div className="flex justify-end gap-2">
            {isPaused && onResume && (
              <Button onClick={onResume}>Resume</Button>
            )}
            {!isPaused && onPause && (
              <Button variant="outline" onClick={onPause}>Pause</Button>
            )}
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
