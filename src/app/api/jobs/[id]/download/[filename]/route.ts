import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/job-store'
import { sanitizeFilename } from '@/lib/validation'

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

  // Sanitize filename to prevent path traversal
  const safeFilename = sanitizeFilename(filename)
  const result = job.results.find(r => r.filename === safeFilename)

  if (!result || result.status !== 'success') {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // TODO: Implement actual file retrieval
  // For now, return a placeholder error since the processor module doesn't exist yet
  return NextResponse.json(
    { error: 'File retrieval not yet implemented. Processor module required.' },
    { status: 501 }
  )

  // Once processor is implemented:
  // try {
  //   const fileBuffer = await getDecryptedFile(id, safeFilename)
  //
  //   return new NextResponse(fileBuffer, {
  //     headers: {
  //       'Content-Type': 'video/mp4',
  //       'Content-Disposition': `attachment; filename="${safeFilename}"`,
  //       'Content-Length': fileBuffer.length.toString()
  //     }
  //   })
  // } catch (error) {
  //   return NextResponse.json({ error: 'File not available' }, { status: 404 })
  // }
}
