import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/job-store'
import { sanitizeFilename } from '@/lib/validation'
import { getDecryptedFile } from '@/lib/processor'

/**
 * Download a single decrypted file
 * GET /api/jobs/[id]/download/[filename]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params
  const job = getJob(id)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Decode the filename (URL encoded in the path)
  const decodedFilename = decodeURIComponent(filename)

  // Look up by original filename in results
  const result = job.results.find(r => r.filename === decodedFilename)

  if (!result || result.status !== 'success') {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // Sanitize filename only for Content-Disposition header (security)
  const safeFilename = sanitizeFilename(decodedFilename)

  try {
    // Get file by original name (how it's stored)
    const fileBuffer = await getDecryptedFile(id, decodedFilename)

    // Convert Node.js Buffer to ArrayBuffer for web API compatibility
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    ) as ArrayBuffer

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'File not available'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
