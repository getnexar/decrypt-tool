import JSZip from 'jszip'
import type { FileResult } from '@/types'

/**
 * Trigger browser download of a blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Download multiple files as a ZIP archive
 */
export async function downloadAsZip(
  files: Array<{ blob: Blob; name: string }>,
  zipFilename: string = 'decrypted-files.zip'
): Promise<void> {
  const zip = new JSZip()

  // Add each file to the ZIP
  for (const file of files) {
    // Convert blob to array buffer
    const arrayBuffer = await file.blob.arrayBuffer()
    zip.file(file.name, arrayBuffer)
  }

  // Generate the ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 }  // Fast compression for large videos
  })

  // Download the ZIP
  downloadFile(zipBlob, zipFilename)
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: string | number | undefined): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generate CSV content from file results
 */
export function generateCsvContent(results: FileResult[]): string {
  const headers = ['filename', 'status', 'error', 'processed_at', 'size_bytes', 'output_path']
  const rows = results.map(r => [
    escapeCsvValue(r.filename),
    escapeCsvValue(r.status),
    escapeCsvValue(r.error),
    escapeCsvValue(r.processedAt),
    escapeCsvValue(r.size),
    escapeCsvValue(r.outputPath)
  ].join(','))

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Download file results as CSV
 */
export function downloadCsv(
  results: FileResult[],
  filename: string = 'decrypt-log.csv'
): void {
  const csv = generateCsvContent(results)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, filename)
}

/**
 * Format file size for display (e.g., "1.5 GB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Generate a timestamped filename
 */
export function generateTimestampedFilename(
  prefix: string,
  extension: string
): string {
  const now = new Date()
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19)
  return `${prefix}_${timestamp}.${extension}`
}
