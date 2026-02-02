'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, DownloadSimple } from '@phosphor-icons/react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'
import type { FileResult } from '@/types'

interface FileLogTableProps {
  results: FileResult[]
  onDownloadFile?: (filename: string) => void
  showDownloads?: boolean
}

type FilterType = 'all' | 'success' | 'failed'

export function FileLogTable({ results, onDownloadFile, showDownloads }: FileLogTableProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = results.filter(r => {
    if (filter === 'all') return true
    return r.status === filter
  })

  if (filtered.length === 0) {
    return <EmptyState title="No files to display" description={filter !== 'all' ? `No ${filter} files found` : undefined} />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({results.length})</SelectItem>
            <SelectItem value="success">Success ({results.filter(r => r.status === 'success').length})</SelectItem>
            <SelectItem value="failed">Failed ({results.filter(r => r.status === 'failed').length})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Filename</TableHead>
              <TableHead>Error</TableHead>
              {showDownloads && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((result, i) => (
              <TableRow key={i}>
                <TableCell>
                  {result.status === 'success' ? (
                    <CheckCircle className="size-5 text-green-600" weight="fill" />
                  ) : (
                    <XCircle className="size-5 text-destructive" weight="fill" />
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm truncate max-w-xs">
                  {result.filename}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {result.error || '-'}
                </TableCell>
                {showDownloads && (
                  <TableCell>
                    {result.status === 'success' && onDownloadFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadFile(result.filename)}
                      >
                        <DownloadSimple className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
