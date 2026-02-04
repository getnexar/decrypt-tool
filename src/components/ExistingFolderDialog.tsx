'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import type { ExistingFolderAction } from '@/types'

interface ExistingFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (action: ExistingFolderAction) => void
}

export function ExistingFolderDialog({
  open,
  onOpenChange,
  onSelect,
}: ExistingFolderDialogProps) {
  const [selected, setSelected] = useState<ExistingFolderAction>('skip')

  const handleConfirm = () => {
    onSelect(selected)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Existing Decrypted Folder Found</DialogTitle>
          <DialogDescription>
            This folder already contains a "decrypted" subfolder from a previous run.
            How would you like to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <RadioGroup
            value={selected}
            onValueChange={(v) => setSelected(v as ExistingFolderAction)}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                 onClick={() => setSelected('skip')}>
              <RadioGroupItem value="skip" id="action-skip" className="mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="action-skip" className="font-medium cursor-pointer">
                  Skip existing files
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only decrypt files that don't already exist in the decrypted folder
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                 onClick={() => setSelected('overwrite')}>
              <RadioGroupItem value="overwrite" id="action-overwrite" className="mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="action-overwrite" className="font-medium cursor-pointer">
                  Overwrite existing files
                </Label>
                <p className="text-sm text-muted-foreground">
                  Re-decrypt all source files and replace any existing decrypted files
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                 onClick={() => setSelected('include')}>
              <RadioGroupItem value="include" id="action-include" className="mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="action-include" className="font-medium cursor-pointer">
                  Include nested files
                </Label>
                <p className="text-sm text-muted-foreground">
                  Also decrypt any encrypted files inside the existing decrypted folder
                </p>
              </div>
            </div>
          </RadioGroup>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
