# Web Worker for Video Decryption

This directory contains the Web Worker implementation for off-main-thread decryption of Nexar encrypted video files.

## Overview

The decrypt worker processes XOR-encrypted MP4 files in a separate thread to keep the UI responsive while processing large video files (potentially hundreds of MB).

## Files

- **`types.ts`** - TypeScript type definitions for worker messages
- **`decrypt.worker.ts`** - The actual Web Worker implementation
- **`index.ts`** - Worker factory function for easy instantiation
- **`__tests__/decrypt.worker.test.ts`** - Unit tests

## Usage Example

```typescript
import { createDecryptWorker } from '@/workers'
import type { DecryptWorkerOutput } from '@/workers'

function DecryptComponent() {
  const [progress, setProgress] = useState<Record<number, number>>({})

  const decryptFiles = async (files: File[], key: string) => {
    // Create a worker instance
    const worker = createDecryptWorker()

    // Set up message handler
    worker.onmessage = (event: MessageEvent<DecryptWorkerOutput>) => {
      const message = event.data

      switch (message.type) {
        case 'progress':
          setProgress(prev => ({
            ...prev,
            [message.fileIndex]: message.percentComplete
          }))
          console.log(
            `${message.filename}: ${message.bytesProcessed}/${message.totalBytes} (${message.percentComplete}%)`
          )
          break

        case 'success':
          console.log(`Decrypted: ${message.filename} (${message.size} bytes)`)
          // Download or display the decrypted video
          const url = URL.createObjectURL(message.blob)
          // ... use the URL
          break

        case 'error':
          console.error(`Error decrypting ${message.filename}: ${message.error}`)
          break
      }
    }

    // Dispatch decryption tasks to worker
    files.forEach((file, index) => {
      worker.postMessage({
        type: 'decrypt',
        file,
        key,
        fileIndex: index
      })
    })

    // Clean up worker when done
    return () => worker.terminate()
  }

  return (
    // ... UI components
  )
}
```

## Message Protocol

### Input (Main → Worker)

```typescript
{
  type: 'decrypt'
  file: File          // The encrypted MP4 file
  key: string         // 32-character hex key (e.g., "f626ad1ffb5159bef3e9295df34244af")
  fileIndex: number   // Index in batch (for tracking multiple files)
}
```

### Output (Worker → Main)

**Progress Update** (sent every 1MB processed):
```typescript
{
  type: 'progress'
  fileIndex: number
  filename: string
  bytesProcessed: number
  totalBytes: number
  percentComplete: number  // 0-100
}
```

**Success** (sent when decryption completes):
```typescript
{
  type: 'success'
  fileIndex: number
  filename: string
  blob: Blob          // Decrypted MP4 file as Blob
  size: number        // File size in bytes
}
```

**Error** (sent if decryption fails):
```typescript
{
  type: 'error'
  fileIndex: number
  filename: string
  error: string       // Error description
}
```

## Key Features

- **Off-Main-Thread Processing**: Keeps UI responsive during large file decryption
- **Progress Updates**: Reports progress every 1MB for smooth progress bars
- **Early Validation**: Validates MP4 header after decrypting first chunk to catch wrong keys early
- **Memory Efficient**: Processes files in chunks to avoid loading entire files into memory at once
- **Error Handling**: Catches and reports decryption errors with descriptive messages

## Implementation Details

### Chunking Strategy

The worker processes files in 1MB chunks:
- Balances memory usage vs progress update frequency
- Allows UI to show smooth progress without overwhelming the main thread with messages
- Each chunk is decrypted with the correct offset for XOR pad cycling

### Header Validation

MP4 files start with a "box" structure:
- Bytes 0-3: Box size (big-endian uint32)
- Bytes 4-7: Box type (ASCII, typically "ftyp")

The worker validates this header after decrypting the first 12 bytes. If the header is invalid, it means:
1. The decryption key is wrong, OR
2. The file is not a valid Nexar encrypted MP4

### XOR Pad Cycling

The XOR pad is 4096 bytes and cycles throughout the file:
- Pad is generated once from the key
- Each byte is XORed with `pad[(fileOffset + byteIndex) % 4096]`
- The worker correctly handles this offset across chunks

## Browser Compatibility

Web Workers are supported in all modern browsers:
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge (all versions)

The `new URL('./decrypt.worker.ts', import.meta.url)` pattern works with:
- Next.js 13+
- Webpack 5+
- Vite
- Parcel 2+

## Testing

Run tests with:
```bash
npm test src/workers/__tests__/decrypt.worker.test.ts
```

Tests cover:
- Message type validation
- XOR pad generation
- Chunk decryption with offsets
- MP4 header validation
- Error scenarios

## Performance

Typical performance on modern hardware:
- **100MB file**: ~1-2 seconds decryption time
- **Progress updates**: Every 1MB (~50-100 updates for 100MB file)
- **Memory usage**: ~2-4MB per worker (chunk buffers)

Multiple workers can run in parallel for batch processing multiple files simultaneously.
