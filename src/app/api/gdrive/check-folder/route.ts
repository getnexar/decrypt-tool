import { NextRequest, NextResponse } from 'next/server'
import { parseGDriveUrl } from '@/lib/validation'

// API endpoints
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const WORKSPACE_PROXY_URL = process.env.WORKSPACE_PROXY_URL || 'https://workspace-proxy.internal'
const isLocalDev = !!process.env.GDRIVE_ACCESS_TOKEN

/**
 * Check if a "decrypted" folder exists in the given folder
 * GET /api/gdrive/check-folder?folderId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderUrl = searchParams.get('folderUrl')

    if (!folderUrl) {
      return NextResponse.json(
        { error: 'folderUrl parameter required' },
        { status: 400 }
      )
    }

    const folderId = parseGDriveUrl(folderUrl)
    if (!folderId) {
      return NextResponse.json(
        { error: 'Invalid Google Drive folder URL' },
        { status: 400 }
      )
    }

    // Check for existing "decrypted" folder
    const query = `'${folderId}' in parents and name='decrypted' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name)'
    })

    const jwt = request.headers.get('X-Nexar-Platform-JWT') || ''
    const token = process.env.GDRIVE_ACCESS_TOKEN

    let response: Response
    if (isLocalDev && token) {
      response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } else {
      const { Agent } = await import('undici')
      const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } })

      response = await fetch(`${WORKSPACE_PROXY_URL}/drive/files?${params}`, {
        headers: {
          'X-Nexar-Platform-JWT': jwt
        },
        // @ts-expect-error - dispatcher is valid for undici
        dispatcher: insecureAgent
      })
    }

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Google Drive authentication failed. Please refresh your access token.' },
          { status: 401 }
        )
      }
      const error = await response.text()
      return NextResponse.json(
        { error: `Failed to check folder: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json() as { files: Array<{ id: string; name: string }> }
    const hasDecryptedFolder = data.files && data.files.length > 0

    return NextResponse.json({
      hasDecryptedFolder,
      decryptedFolderId: hasDecryptedFolder ? data.files[0].id : null
    })
  } catch (error) {
    console.error('Failed to check folder:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to check folder' },
      { status: 500 }
    )
  }
}
