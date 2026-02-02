'use client'

import { useState, useCallback } from 'react'
import { Upload, X, File } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { validateFileSize, formatFileSize } from '@/lib/validation'

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  className?: string
}

export function FileDropzone({ onFilesSelected, disabled, className }: FileDropzoneProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles: File[] = []
    const newErrors: string[] = []

    for (const file of fileArray) {
      if (!file.name.toLowerCase().endsWith('.mp4')) {
        newErrors.push(`${file.name}: Not an MP4 file`)
        continue
      }
      if (!validateFileSize(file)) {
        newErrors.push(`${file.name}: Exceeds 2GB limit`)
        continue
      }
      validFiles.push(file)
    }

    const updatedFiles = [...files, ...validFiles]
    setFiles(updatedFiles)
    setErrors(newErrors)
    onFilesSelected(updatedFiles)
  }, [files, onFilesSelected])

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFilesSelected(updated)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="size-8 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">Drop MP4 files here</p>
        <p className="text-sm text-muted-foreground">or click to browse</p>
        <input
          id="file-input"
          type="file"
          accept=".mp4,video/mp4"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {errors.length > 0 && (
        <div className="text-sm text-destructive space-y-1">
          {errors.map((err, i) => <p key={i}>{err}</p>)}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{files.length} file(s) selected</p>
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <File className="size-4" />
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              <button onClick={() => removeFile(i)} className="p-1 hover:bg-background rounded">
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
