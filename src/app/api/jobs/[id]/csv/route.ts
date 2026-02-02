import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/job-store'
import { generateCsvContent } from '@/lib/download'

/**
 * Download job results as CSV log
 * GET /api/jobs/[id]/csv
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

  const csv = generateCsvContent(job.results)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="decrypt-log-${id.slice(0, 8)}.csv"`
    }
  })
}
