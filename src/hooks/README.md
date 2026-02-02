# useClientDecrypt Hook

React hook for client-side file decryption using Web Workers.

## Purpose

This hook manages client-side decryption for the "Local Upload → Download" flow. It uses Web Workers to decrypt files without sending them to the server, keeping the decryption key private and processing files entirely in the browser.

## Features

- Decrypts files using Web Workers (non-blocking UI)
- Real-time progress tracking
- Individual file status tracking
- Cancellation support
- Automatic header validation
- Blob output ready for download

## Usage

### Basic Example

```tsx
import { useClientDecrypt } from '@/hooks/useClientDecrypt'
import { Button } from '@/components/ui/button'

function DecryptPage() {
  const { decryptFiles, progress, results, isProcessing, cancel } = useClientDecrypt()

  const handleDecrypt = async (files: File[], key: string) => {
    const results = await decryptFiles(files, key)

    // Download successful files
    results.forEach(result => {
      if (result.status === 'success' && result.blob) {
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename.replace(/\.enc$/, '')
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  return (
    <div>
      {isProcessing && (
        <div>
          <p>Processing {progress.currentFile}</p>
          <p>{progress.currentFileProgress}% - {progress.overallProgress}% overall</p>
          <Button onClick={cancel}>Cancel</Button>
        </div>
      )}

      {results.length > 0 && !isProcessing && (
        <ul>
          {results.map(result => (
            <li key={result.filename}>
              {result.filename} - {result.status}
              {result.error && ` (${result.error})`}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### With Progress Display

```tsx
import { useClientDecrypt } from '@/hooks/useClientDecrypt'
import { Progress } from '@/components/ui/progress'

function DecryptWithProgress() {
  const { decryptFiles, progress, isProcessing } = useClientDecrypt()

  return (
    <div>
      {isProcessing && (
        <>
          <h3>Decrypting: {progress.currentFile}</h3>
          <Progress value={progress.currentFileProgress} />

          <h4>Overall Progress</h4>
          <Progress value={progress.overallProgress} />

          <p>
            {progress.processedFiles} / {progress.totalFiles} files
          </p>
        </>
      )}
    </div>
  )
}
```

### With Error Handling

```tsx
import { useClientDecrypt } from '@/hooks/useClientDecrypt'

function DecryptWithErrors() {
  const { decryptFiles, results } = useClientDecrypt()

  const handleDecrypt = async (files: File[], key: string) => {
    const results = await decryptFiles(files, key)

    const failed = results.filter(r => r.status === 'failed')
    const succeeded = results.filter(r => r.status === 'success')

    console.log(`Success: ${succeeded.length}, Failed: ${failed.length}`)

    failed.forEach(file => {
      console.error(`${file.filename}: ${file.error}`)
    })

    // Download successful files only
    succeeded.forEach(file => {
      if (file.blob) {
        downloadBlob(file.blob, file.filename)
      }
    })
  }

  return <div>{/* ... */}</div>
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

## API Reference

### `useClientDecrypt()`

Returns an object with:

#### `decryptFiles(files: File[], key: string): Promise<DecryptResult[]>`

Start decrypting files.

- **Parameters:**
  - `files`: Array of encrypted files to decrypt
  - `key`: 32-character hexadecimal decryption key
- **Returns:** Promise that resolves with array of DecryptResult objects

#### `progress: DecryptProgress`

Current progress state with:
- `totalFiles`: Total number of files
- `processedFiles`: Number completed
- `currentFile`: Filename currently processing
- `currentFileProgress`: Percentage complete for current file (0-100)
- `overallProgress`: Overall job progress (0-100)
- `status`: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'

#### `results: DecryptResult[]`

Array of individual file results:
```typescript
interface DecryptResult {
  filename: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  error?: string
  blob?: Blob
  size?: number
}
```

#### `cancel(): void`

Cancel ongoing decryption. Terminates the worker and marks job as failed.

#### `isProcessing: boolean`

Whether files are currently being processed.

#### `reset(): void`

Reset state for a new decryption job. Clears progress, results, and resets processing flag.

## Implementation Details

### Web Worker

The hook uses a Web Worker (`decrypt.worker.ts`) to decrypt files off the main thread. This prevents UI blocking during decryption.

### Sequential Processing

Files are processed sequentially (one at a time) to avoid memory issues. For parallel processing, the implementation can be enhanced with a worker pool.

### Memory Management

- Worker is terminated after processing completes
- Blobs are created from decrypted chunks
- Original file data is not retained

### Error Handling

Errors are captured per-file:
- Invalid decryption key
- Invalid MP4 header
- File read errors
- Worker errors

### Progress Updates

The worker sends progress messages during decryption:
- Every chunk processed (1MB)
- Percentage complete
- Bytes processed / total bytes

## Performance

- **Chunk Size:** 1MB per chunk
- **Memory:** Streams large files to avoid loading entire file in memory
- **Validation:** Validates MP4 header on first chunk only
- **Worker Lifecycle:** One worker per batch, terminated after completion

## Notes

- The hook manages a single worker instance
- Files are processed sequentially
- Progress updates in real-time
- Cancel terminates the worker immediately
- Results include Blob objects ready for download
- No server communication - all processing happens client-side
