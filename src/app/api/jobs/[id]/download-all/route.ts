import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getJob } from '@/lib/job-store'
import { getDecryptedFile } from '@/lib/processor'

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

  try {
    const zip = new JSZip()

    for (const file of successFiles) {
      const buffer = await getDecryptedFile(id, file.filename)
      zip.file(file.filename, buffer)
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 1 }
    })

    return new Response(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="decrypted-${id.slice(0, 8)}.zip"`,
        'Content-Length': zipBlob.size.toString()
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create ZIP'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
