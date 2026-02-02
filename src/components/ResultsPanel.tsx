'use client'

import { ArrowCounterClockwise, DownloadSimple, FileCsv } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileLogTable } from './FileLogTable'
import type { FileResult } from '@/types'

interface ResultsPanelProps {
  results: FileResult[]
  onRetry?: () => void
  onDownloadAll?: () => void
  onDownloadCsv?: () => void
  onDownloadFile?: (filename: string) => void
  showDownloads?: boolean
}

export function ResultsPanel({
  results,
  onRetry,
  onDownloadAll,
  onDownloadCsv,
  onDownloadFile,
  showDownloads
}: ResultsPanelProps) {
  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-4">
          <span>Results</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            ✓ {successCount} succeeded
          </Badge>
          {failedCount > 0 && (
            <Badge variant="destructive">
              ✗ {failedCount} failed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {failedCount > 0 && onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <ArrowCounterClockwise className="size-4 mr-2" />
              Retry Failed
            </Button>
          )}
          {showDownloads && successCount > 0 && onDownloadAll && (
            <Button onClick={onDownloadAll}>
              <DownloadSimple className="size-4 mr-2" />
              Download All (ZIP)
            </Button>
          )}
          {onDownloadCsv && (
            <Button variant="secondary" onClick={onDownloadCsv}>
              <FileCsv className="size-4 mr-2" />
              CSV Log
            </Button>
          )}
        </div>
        <FileLogTable
          results={results}
          onDownloadFile={onDownloadFile}
          showDownloads={showDownloads}
        />
      </CardContent>
    </Card>
  )
}
