import { NextRequest, NextResponse } from 'next/server'
import { getJob, createJob } from '@/lib/job-store'
import { validateHexKey } from '@/lib/validation'
import type { RetryRequest } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const originalJob = getJob(id)

  if (!originalJob) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    )
  }

  const body: RetryRequest & { key: string } = await request.json()

  if (!validateHexKey(body.key)) {
    return NextResponse.json(
      { error: 'Invalid key format' },
      { status: 400 }
    )
  }

  // Get failed files
  const failedFiles = originalJob.results
    .filter(r => r.status === 'failed')
    .map(r => r.filename)

  const filesToRetry = body.files || failedFiles

  if (filesToRetry.length === 0) {
    return NextResponse.json(
      { error: 'No files to retry' },
      { status: 400 }
    )
  }

  // Create new job for retry
  const newJob = createJob({
    sourceType: originalJob.sourceType,
    sourcePath: originalJob.sourcePath,
    destType: originalJob.destType,
    destPath: originalJob.destPath,
    sameFolder: originalJob.sameFolder
  })

  // TODO: Start retry processing
  // if (originalJob.sourceType === 'gdrive') {
  //   processGDriveJob(newJob.id, body.key, filesToRetry)
  // }

  return NextResponse.json({ jobId: newJob.id })
}
