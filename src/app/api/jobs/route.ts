import { NextRequest, NextResponse } from 'next/server'
import { createJob } from '@/lib/job-store'
import { parseGDriveUrl, validateHexKey } from '@/lib/validation'
import type { CreateJobRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateJobRequest = await request.json()

    // Validate key format (NEVER log the actual key)
    if (!validateHexKey(body.key)) {
      return NextResponse.json(
        { error: 'Invalid key format' },
        { status: 400 }
      )
    }

    // Validate source folder if GDrive
    if (body.sourceType === 'gdrive') {
      const folderId = parseGDriveUrl(body.sourceFolder || '')
      if (!folderId) {
        return NextResponse.json(
          { error: 'Invalid Google Drive folder URL' },
          { status: 400 }
        )
      }
    }

    // Create job
    const job = createJob({
      sourceType: body.sourceType,
      sourcePath: body.sourceFolder ? parseGDriveUrl(body.sourceFolder) || undefined : undefined,
      destType: body.destType,
      destPath: body.destFolder ? parseGDriveUrl(body.destFolder) || undefined : undefined,
      sameFolder: body.sameFolder
    })

    // TODO: Start processing in background
    // For GDrive: processGDriveJob(job.id, body.key)
    // For upload: Return upload URL

    return NextResponse.json({
      jobId: job.id,
      uploadUrl: body.sourceType === 'upload' ? `/api/jobs/${job.id}/upload` : undefined
    })
  } catch (error) {
    console.error('Failed to create job:', error instanceof Error ? error.message : 'Unknown error')

    // Check if error is about no files found
    if (error instanceof Error && error.message.includes('No MP4 files found')) {
      return NextResponse.json(
        { error: 'No MP4 files found in the specified folder', code: 'NO_FILES' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
