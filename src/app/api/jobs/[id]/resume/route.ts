import { NextResponse } from 'next/server'
import { resumeJob, getJob } from '@/lib/job-store'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params

  const job = getJob(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const success = resumeJob(jobId)
  if (!success) {
    return NextResponse.json(
      { error: 'Cannot resume job - not paused' },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, status: 'processing' })
}
