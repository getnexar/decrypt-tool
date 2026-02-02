'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import type { DecryptProgress } from '@/types'

interface ProgressPanelProps {
  progress: DecryptProgress
  onCancel?: () => void
}

export function ProgressPanel({ progress, onCancel }: ProgressPanelProps) {
  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Decrypting file {progress.processedFiles + 1} of {progress.totalFiles}...</span>
            <span>{progress.overallProgress}%</span>
          </div>
          <Progress value={progress.overallProgress} />
        </div>
        {progress.currentFile && (
          <p className="text-sm text-muted-foreground truncate">
            Current: {progress.currentFile}
          </p>
        )}
        {onCancel && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
