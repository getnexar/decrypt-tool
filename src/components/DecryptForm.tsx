'use client'

import { useState } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileDropzone } from './FileDropzone'
import { ExistingFolderDialog } from './ExistingFolderDialog'
import { validateHexKey, parseGDriveUrl } from '@/lib/validation'
import type { JobConfig, SourceType, DestType, ExistingFolderAction } from '@/types'

interface DecryptFormProps {
  onSubmit: (config: JobConfig) => void
  isProcessing?: boolean
}

export function DecryptForm({ onSubmit, isProcessing }: DecryptFormProps) {
  const [sourceType, setSourceType] = useState<SourceType>('gdrive')
  const [sourceFolder, setSourceFolder] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [destType, setDestType] = useState<DestType>('gdrive')
  const [destFolder, setDestFolder] = useState('')
  const [sameFolder, setSameFolder] = useState(true)
  const [showExistingFolderDialog, setShowExistingFolderDialog] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const keyValid = validateHexKey(key)
  const sourceValid = sourceType === 'upload' ? files.length > 0 : !!parseGDriveUrl(sourceFolder)
  const destValid = destType === 'download' || (sameFolder || !!parseGDriveUrl(destFolder))
  const formValid = keyValid && sourceValid && destValid && !isProcessing && !isChecking

  const submitJob = (existingFolderAction?: ExistingFolderAction) => {
    onSubmit({
      sourceType,
      sourceFolder: sourceType === 'gdrive' ? sourceFolder : undefined,
      files: sourceType === 'upload' ? files : undefined,
      key,
      destType,
      destFolder: destType === 'gdrive' && !sameFolder ? destFolder : undefined,
      sameFolder: destType === 'gdrive' ? sameFolder : undefined,
      existingFolderAction
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValid) return

    // Check for existing "decrypted" folder when using sameFolder option
    if (sourceType === 'gdrive' && destType === 'gdrive' && sameFolder) {
      setIsChecking(true)
      try {
        const response = await fetch(`/api/gdrive/check-folder?folderUrl=${encodeURIComponent(sourceFolder)}`)
        const data = await response.json()

        if (data.hasDecryptedFolder) {
          setIsChecking(false)
          setShowExistingFolderDialog(true)
          return
        }
      } catch (error) {
        console.error('Failed to check for existing folder:', error)
        // Continue anyway if check fails
      }
      setIsChecking(false)
    }

    submitJob()
  }

  const handleExistingFolderAction = (action: ExistingFolderAction) => {
    submitJob(action)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Decrypt Video Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source */}
          <div className="space-y-3">
            <Label>Source</Label>
            <RadioGroup value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="gdrive" id="src-gdrive" />
                <Label htmlFor="src-gdrive" className="font-normal">Google Drive folder</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="upload" id="src-upload" />
                <Label htmlFor="src-upload" className="font-normal">Upload from computer</Label>
              </div>
            </RadioGroup>
            {sourceType === 'gdrive' ? (
              <Input
                placeholder="https://drive.google.com/drive/folders/..."
                value={sourceFolder}
                onChange={(e) => setSourceFolder(e.target.value)}
                disabled={isProcessing}
              />
            ) : (
              <FileDropzone onFilesSelected={setFiles} disabled={isProcessing} />
            )}
          </div>

          {/* Key */}
          <div className="space-y-2">
            <Label htmlFor="key">Decryption Key</Label>
            <div className="relative">
              <Input
                id="key"
                type={showKey ? 'text' : 'password'}
                placeholder="32-character hex key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className={key && !keyValid ? 'border-destructive' : ''}
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showKey ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {key && !keyValid && (
              <p className="text-sm text-destructive">Key must be 32 hexadecimal characters</p>
            )}
          </div>

          {/* Destination */}
          <div className="space-y-3">
            <Label>Destination</Label>
            <RadioGroup value={destType} onValueChange={(v) => setDestType(v as DestType)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="download" id="dest-download" />
                <Label htmlFor="dest-download" className="font-normal">Download to computer</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="gdrive" id="dest-gdrive" />
                <Label htmlFor="dest-gdrive" className="font-normal">Google Drive folder</Label>
              </div>
            </RadioGroup>
            {destType === 'gdrive' && (
              <div className="space-y-3 pl-6">
                <RadioGroup value={sameFolder ? 'same' : 'different'} onValueChange={(v) => setSameFolder(v === 'same')}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="same" id="dest-same" />
                    <Label htmlFor="dest-same" className="font-normal">Same folder (creates /decrypted)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="different" id="dest-different" />
                    <Label htmlFor="dest-different" className="font-normal">Different folder</Label>
                  </div>
                </RadioGroup>
                {!sameFolder && (
                  <Input
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={destFolder}
                    onChange={(e) => setDestFolder(e.target.value)}
                    disabled={isProcessing}
                  />
                )}
              </div>
            )}
          </div>

          <Button type="submit" disabled={!formValid} className="w-full">
            {isProcessing ? 'Processing...' : isChecking ? 'Checking...' : 'Start Decryption'}
          </Button>
        </CardContent>
      </Card>

      <ExistingFolderDialog
        open={showExistingFolderDialog}
        onOpenChange={setShowExistingFolderDialog}
        onSelect={handleExistingFolderAction}
      />
    </form>
  )
}
