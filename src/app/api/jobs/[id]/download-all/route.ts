import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getJob } from '@/lib/job-store'

/**
 * Download all successfully decrypted files as a ZIP archive
 * GET /api/jobs/[id]/download-all
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const job = getJob(id)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const successFiles = job.results.filter(r => r.status === 'success')

  if (successFiles.length === 0) {
    return NextResponse.json({ error: 'No files to download' }, { status: 400 })
  }

  // TODO: Implement actual ZIP creation with decrypted files
  // For now, return a placeholder error since the processor module doesn't exist yet
  return NextResponse.json(
    { error: 'ZIP download not yet implemented. Processor module required.' },
    { status: 501 }
  )

  // Once processor is implemented:
  // try {
  //   const zip = new JSZip()
  //
  //   for (const file of successFiles) {
  //     const buffer = await getDecryptedFile(id, file.filename)
  //     zip.file(file.filename, buffer)
  //   }
  //
  //   const zipBuffer = await zip.generateAsync({
  //     type: 'nodebuffer',
  //     compression: 'DEFLATE',
  //     compressionOptions: { level: 1 }
  //   })
  //
  //   return new NextResponse(zipBuffer, {
  //     headers: {
  //       'Content-Type': 'application/zip',
  //       'Content-Disposition': `attachment; filename="decrypted-${id.slice(0, 8)}.zip"`,
  //       'Content-Length': zipBuffer.length.toString()
  //     }
  //   })
  // } catch (error) {
  //   return NextResponse.json({ error: 'Failed to create ZIP' }, { status: 500 })
  // }
}
