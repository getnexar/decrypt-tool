'use client'

import { Warning, FolderPlus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface FolderErrorDialogProps {
  error: string
  onUsePrefix: () => void
  onRetryWithFolder: () => void
  onCancel: () => void
}

/**
 * Dialog shown when folder creation fails in NAP mode.
 * Gives user options: create folder manually, use prefix, or cancel.
 */
export function FolderErrorDialog({
  error,
  onUsePrefix,
  onRetryWithFolder,
  onCancel
}: FolderErrorDialogProps) {
  return (
    <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="py-6 space-y-4">
        <div className="flex gap-3">
          <Warning
            className="size-6 text-amber-600 flex-shrink-0"
            weight="fill"
          />
          <div className="space-y-2">
            <h3 className="font-semibold font-heading text-amber-800 dark:text-amber-200">
              Folder Creation Not Supported
            </h3>
            <p className="text-sm text-muted-foreground">
              The platform cannot automatically create a "decrypted" subfolder.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium">Choose how to proceed:</p>

          <div className="space-y-2">
            <Button
              onClick={onRetryWithFolder}
              className="w-full justify-start h-auto py-3"
              variant="outline"
            >
              <FolderPlus className="size-5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">I'll create the folder manually</div>
                <div className="text-xs text-muted-foreground">
                  Create a "decrypted" folder in Google Drive, then click to retry
                </div>
              </div>
            </Button>

            <Button
              onClick={onUsePrefix}
              className="w-full justify-start h-auto py-3"
              variant="outline"
            >
              <div className="text-left pl-8">
                <div className="font-medium">Use [decrypted] prefix instead</div>
                <div className="text-xs text-muted-foreground">
                  Files saved as "[decrypted] filename.mp4" in the same folder
                </div>
              </div>
            </Button>

            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Check if an error message indicates a folder creation failure
 */
export function isFolderCreationError(error: string | null): boolean {
  if (!error) return false
  return error.includes('Folder creation') ||
         error.includes('not supported') ||
         error.includes('/drive/folders')
}
