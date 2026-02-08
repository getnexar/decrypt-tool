/**
 * Google Drive API Wrapper
 *
 * Handles all Google Drive operations for the decrypt tool:
 * - Listing MP4 files in a folder (recursively)
 * - Downloading files for decryption
 * - Uploading decrypted files
 * - Creating destination folders
 *
 * Authentication modes:
 * - Production (NAP): Uses workspace-proxy with JWT (Domain-Wide Delegation)
 * - Local dev: Uses direct Google Drive API with OAuth access token
 */

import { Agent, fetch as undiciFetch } from 'undici'
import type { GDriveFile } from '@/types'
import { logDebug, logWarn } from './logger'

// ============================================================================
// Environment Detection
// ============================================================================

// Local dev mode: use direct Google API with access token
const isLocalDev = !!process.env.GDRIVE_ACCESS_TOKEN

// API endpoints
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'
const WORKSPACE_PROXY_URL = process.env.WORKSPACE_PROXY_URL || 'https://workspace-proxy.internal'

// TLS certificate validation configuration
// In production (NAP), workspace-proxy uses self-signed certificates.
// NODE_TLS_REJECT_UNAUTHORIZED=0 is set via:
//   1. package.json start script (shell-level, before Node boots)
//   2. src/instrumentation.ts (Next.js server startup hook)
// The undici Agent dispatcher does NOT work with Next.js 16 Turbopack.
const isInternalProxy = !!process.env.WORKSPACE_PROXY_URL?.includes('.internal')
const internalAgent = new Agent({
  connect: { rejectUnauthorized: !isInternalProxy }
})

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error thrown when Google Drive authentication fails
 */
export class GDriveAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GDriveAuthError'
  }
}

/**
 * Parse API error and throw appropriate error type
 */
function handleApiError(status: number, errorBody: string): never {
  if (status === 401) {
    if (isLocalDev) {
      throw new GDriveAuthError(
        'Google Drive access token expired or invalid. Please refresh your GDRIVE_ACCESS_TOKEN in .env.local'
      )
    } else {
      throw new GDriveAuthError(
        'Google Drive authentication failed. Please sign in again.'
      )
    }
  }

  if (status === 403) {
    throw new Error('Access denied. You may not have permission to access this folder.')
  }

  if (status === 404) {
    throw new Error('Folder not found. Please check the Google Drive URL.')
  }

  throw new Error(`Google Drive error: ${status}`)
}

// ============================================================================
// Configuration
// ============================================================================

export interface GDriveConfig {
  jwt?: string        // X-Nexar-Platform-JWT (NAP mode)
  accessToken?: string // OAuth access token (local dev mode)
}

// ============================================================================
// Internal Types
// ============================================================================

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  parents?: string[]
}

interface DriveListResponse {
  files: DriveFile[]
  nextPageToken?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

async function driveRequest<T>(
  endpoint: string,
  config: GDriveConfig,
  options: RequestInit = {}
): Promise<T> {
  const token = config.accessToken || process.env.GDRIVE_ACCESS_TOKEN

  if (isLocalDev && token) {
    // Local dev: direct Google Drive API
    const response = await fetch(`${DRIVE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.text()
      handleApiError(response.status, error)
    }

    return response.json()
  }

  // NAP mode: workspace-proxy with JWT
  // Use undici's fetch directly - Next.js 16 patches global fetch and ignores dispatcher
  const response = await undiciFetch(`${WORKSPACE_PROXY_URL}/drive${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'X-Nexar-Platform-JWT': config.jwt || '',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    },
    body: options.body as string | undefined,
    dispatcher: internalAgent
  })

  if (!response.ok) {
    const error = await response.text()
    handleApiError(response.status, error)
  }

  return response.json() as T
}

// ============================================================================
// Public API
// ============================================================================

/**
 * List all MP4 files in a folder recursively
 *
 * @param folderId - Google Drive folder ID
 * @param config - API configuration with access token
 * @param path - Internal: current path in folder structure
 * @returns Array of MP4 files with metadata
 */
export async function listMp4Files(
  folderId: string,
  config: GDriveConfig,
  path: string = ''
): Promise<GDriveFile[]> {
  const files: GDriveFile[] = []
  let pageToken: string | undefined

  do {
    const query = `'${folderId}' in parents and trashed=false`
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name,mimeType,size),nextPageToken',
      pageSize: '1000',
      ...(pageToken && { pageToken })
    })

    const response = await driveRequest<DriveListResponse>(
      `/files?${params}`,
      config
    )

    for (const file of response.files) {
      const filePath = path ? `${path}/${file.name}` : file.name

      if (file.mimeType === 'application/vnd.google-apps.folder') {
        // Skip "decrypted" folder to avoid re-processing already decrypted files
        if (file.name.toLowerCase() === 'decrypted') {
          logDebug('gdrive', ` Skipping "decrypted" folder at ${filePath}`)
          continue
        }
        // Recurse into subfolder
        const subFiles = await listMp4Files(file.id, config, filePath)
        files.push(...subFiles)
      } else if (
        file.mimeType === 'video/mp4' ||
        file.name.toLowerCase().endsWith('.mp4')
      ) {
        files.push({
          id: file.id,
          name: file.name,
          size: parseInt(file.size || '0', 10),
          mimeType: file.mimeType,
          path: filePath
        })
      }
    }

    pageToken = response.nextPageToken
  } while (pageToken)

  return files
}

/**
 * Download a file as a ReadableStream
 *
 * Use this for large files to avoid memory issues.
 *
 * @param fileId - Google Drive file ID
 * @param config - API configuration with access token
 * @returns ReadableStream of file content
 */
export async function downloadFile(
  fileId: string,
  config: GDriveConfig
): Promise<ReadableStream<Uint8Array>> {
  const token = config.accessToken || process.env.GDRIVE_ACCESS_TOKEN

  let response: Response
  if (isLocalDev && token) {
    // Local dev: direct Google Drive API
    response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  } else {
    // NAP mode: workspace-proxy
    response = await undiciFetch(
      `${WORKSPACE_PROXY_URL}/drive/files/${fileId}/content`,
      {
        headers: {
          'X-Nexar-Platform-JWT': config.jwt || ''
        },
        dispatcher: internalAgent
      }
    ) as unknown as Response
  }

  if (!response.ok) {
    const error = await response.text()
    handleApiError(response.status, error)
  }

  if (!response.body) {
    throw new Error('No response body')
  }

  return response.body as ReadableStream<Uint8Array>
}

/**
 * Download a file as a Buffer
 *
 * Use this for smaller files that can fit in memory.
 *
 * @param fileId - Google Drive file ID
 * @param config - API configuration with access token
 * @returns Buffer containing file content
 */
export async function downloadFileAsBuffer(
  fileId: string,
  config: GDriveConfig
): Promise<Buffer> {
  const token = config.accessToken || process.env.GDRIVE_ACCESS_TOKEN
  logDebug('gdrive', ` Downloading file ${fileId}...`)

  let response: Response
  if (isLocalDev && token) {
    // Local dev: direct Google Drive API
    response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    logDebug('gdrive', ` Download response: status=${response.status}`)
  } else {
    // NAP mode: workspace-proxy
    response = await undiciFetch(
      `${WORKSPACE_PROXY_URL}/drive/files/${fileId}/content`,
      {
        headers: {
          'X-Nexar-Platform-JWT': config.jwt || ''
        },
        dispatcher: internalAgent
      }
    ) as unknown as Response
  }

  if (!response.ok) {
    const error = await response.text()
    handleApiError(response.status, error)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Upload a file to a folder
 *
 * @param folderId - Google Drive folder ID to upload to
 * @param filename - Name for the uploaded file
 * @param data - File content as Buffer or ReadableStream
 * @param mimeType - MIME type of the file (default: video/mp4)
 * @param config - API configuration with access token
 * @returns Google Drive file ID of uploaded file
 */
// Maximum size for simple upload
// - Local dev: 10MB (Google's multipart upload limit)
// - NAP mode: 1MB (Envoy proxy buffer limit in GCP Internal Load Balancer)
const MAX_SIMPLE_UPLOAD_SIZE_LOCAL = 10 * 1024 * 1024
const MAX_SIMPLE_UPLOAD_SIZE_NAP = 1 * 1024 * 1024

export async function uploadFile(
  folderId: string,
  filename: string,
  data: Buffer | ReadableStream,
  mimeType: string = 'video/mp4',
  config: GDriveConfig
): Promise<string> {
  // Convert stream to buffer if needed
  let buffer: Buffer
  if (Buffer.isBuffer(data)) {
    buffer = data
  } else {
    const chunks: Uint8Array[] = []
    const reader = data.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    buffer = Buffer.concat(chunks)
  }

  const token = config.accessToken || process.env.GDRIVE_ACCESS_TOKEN

  // Determine max size for simple upload based on mode
  const maxSimpleUploadSize = isLocalDev ? MAX_SIMPLE_UPLOAD_SIZE_LOCAL : MAX_SIMPLE_UPLOAD_SIZE_NAP

  // Use resumable upload for large files (bypasses Envoy buffer limit in NAP mode)
  if (buffer.length > maxSimpleUploadSize) {
    logDebug('gdrive', ` File size ${buffer.length} exceeds ${maxSimpleUploadSize} bytes, using resumable upload`)
    return uploadFileResumable(folderId, filename, buffer, mimeType, config)
  }

  // Simple upload for small files
  const metadata = {
    name: filename,
    parents: [folderId]
  }

  if (isLocalDev && token) {
    // Local dev: direct Google Drive API multipart upload
    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const body = Buffer.concat([
      Buffer.from(
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n`
      ),
      buffer,
      Buffer.from(closeDelimiter)
    ])

    logDebug('gdrive', ` Local dev upload: file="${filename}" to parent="${folderId}" (${buffer.length} bytes)`)
    const response = await fetch(
      `${UPLOAD_API_BASE}/files?uploadType=multipart`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
      }
    )

    logDebug('gdrive', ` Upload response: status=${response.status}`)
    if (!response.ok) {
      const error = await response.text()
      logDebug('gdrive', ` Upload error: ${error}`)
      handleApiError(response.status, error)
    }

    const result = await response.json() as { id: string }
    logDebug('gdrive', ` Upload success: fileId=${result.id}`)
    return result.id
  }

  // NAP mode: workspace-proxy expects 'parent' as separate form field (not in metadata JSON)
  logDebug('gdrive', ` NAP upload: file="${filename}" to parent="${folderId}"`)
  const formData = new FormData()
  formData.append('parent', folderId)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
  formData.append('file', new Blob([arrayBuffer], { type: mimeType }), filename)

  const response = await undiciFetch(
    `${WORKSPACE_PROXY_URL}/drive/files`,
    {
      method: 'POST',
      headers: {
        'X-Nexar-Platform-JWT': config.jwt || ''
      },
      body: formData as unknown as import('undici').FormData,
      dispatcher: internalAgent
    }
  )

  const responseText = await response.text()
  logDebug('gdrive', ` NAP upload response: status=${response.status}, body=${responseText.substring(0, 500)}`)

  if (!response.ok) {
    handleApiError(response.status, responseText)
  }

  const result = JSON.parse(responseText) as { id: string, webViewLink?: string }
  logDebug('gdrive', ` NAP upload success: fileId=${result.id}, webViewLink=${result.webViewLink}`)
  return result.id
}

/**
 * Upload a large file using resumable upload
 */
async function uploadFileResumable(
  folderId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string,
  config: GDriveConfig
): Promise<string> {
  const metadata = {
    name: filename,
    parents: [folderId]
  }

  const token = config.accessToken || process.env.GDRIVE_ACCESS_TOKEN

  if (isLocalDev && token) {
    // Local dev: direct Google Drive API resumable upload
    const initResponse = await fetch(
      `${UPLOAD_API_BASE}/files?uploadType=resumable`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': buffer.length.toString()
        },
        body: JSON.stringify(metadata)
      }
    )

    if (!initResponse.ok) {
      const error = await initResponse.text()
      handleApiError(initResponse.status, error)
    }

    const uploadUri = initResponse.headers.get('Location')
    if (!uploadUri) {
      throw new Error('No upload URI returned from resumable upload initiation')
    }

    // Convert Buffer to Blob for fetch compatibility
    // Create a proper ArrayBuffer copy to avoid SharedArrayBuffer type issues
    const arrayBuffer = new ArrayBuffer(buffer.length)
    new Uint8Array(arrayBuffer).set(buffer)
    const blob = new Blob([arrayBuffer])

    const uploadResponse = await fetch(uploadUri, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString()
      },
      body: blob
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      handleApiError(uploadResponse.status, error)
    }

    const result = await uploadResponse.json() as { id: string }
    return result.id
  }

  // NAP mode: workspace-proxy resumable upload
  // Step 1: Initiate resumable upload session
  logDebug('gdrive', ` NAP resumable upload: initiating for "${filename}" (${buffer.length} bytes)`)
  const initResponse = await undiciFetch(
    `${WORKSPACE_PROXY_URL}/drive/files/resumable`,
    {
      method: 'POST',
      headers: {
        'X-Nexar-Platform-JWT': config.jwt || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: filename,
        mimeType,
        parentId: folderId,
        size: buffer.length
      }),
      dispatcher: internalAgent
    }
  )

  const initResponseText = await initResponse.text()
  logDebug('gdrive', ` NAP resumable init response: status=${initResponse.status}, body=${initResponseText.substring(0, 500)}`)

  if (!initResponse.ok) {
    // If resumable endpoint doesn't exist (404), throw clear error
    if (initResponse.status === 404) {
      throw new Error(
        `Resumable upload endpoint not available (HTTP 404). ` +
        `File size ${buffer.length} bytes exceeds 1MB limit for simple uploads. ` +
        `Contact platform team to enable POST /drive/files/resumable endpoint.`
      )
    }
    handleApiError(initResponse.status, initResponseText)
  }

  // Parse response - uploadUrl should be in JSON body per @olympum's example
  let initResult: { uploadUrl?: string }
  try {
    initResult = JSON.parse(initResponseText)
  } catch {
    throw new Error(`Invalid JSON response from resumable upload initiation: ${initResponseText.substring(0, 200)}`)
  }

  const uploadUri = initResult.uploadUrl
  if (!uploadUri) {
    throw new Error(
      `No uploadUrl in resumable upload response. Response: ${initResponseText.substring(0, 200)}`
    )
  }

  logDebug('gdrive', ` NAP resumable upload: got upload URL, uploading ${buffer.length} bytes directly to Google`)

  // Step 2: Upload directly to Google (bypasses platform load balancer)
  const napArrayBuffer = new ArrayBuffer(buffer.length)
  new Uint8Array(napArrayBuffer).set(buffer)
  const napBlob = new Blob([napArrayBuffer])

  const uploadResponse = await fetch(uploadUri, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Length': buffer.length.toString()
    },
    body: napBlob
    // Note: No dispatcher needed - uploading directly to Google, not through workspace-proxy
  })

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text()
    logDebug('gdrive', ` NAP resumable upload failed: status=${uploadResponse.status}, error=${error.substring(0, 500)}`)
    handleApiError(uploadResponse.status, error)
  }

  const result = await uploadResponse.json() as { id: string }
  logDebug('gdrive', ` NAP resumable upload success: fileId=${result.id}`)
  return result.id
}

/**
 * Custom error for folder creation failures
 */
export class FolderCreationError extends Error {
  constructor(message: string, public readonly canRetryWithPrefix: boolean = true) {
    super(message)
    this.name = 'FolderCreationError'
  }
}

/**
 * Create a folder
 *
 * @param parentId - Parent folder ID
 * @param name - Name for the new folder
 * @param config - API configuration with access token
 * @returns Google Drive folder ID of created folder
 */
export async function createFolder(
  parentId: string,
  name: string,
  config: GDriveConfig
): Promise<string> {
  const token = config.accessToken || process.env.GDRIVE_ACCESS_TOKEN

  if (isLocalDev && token) {
    // Local dev: direct Google Drive API
    const response = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      handleApiError(response.status, error)
    }

    const result = await response.json() as { id: string }
    return result.id
  }

  // NAP mode: Try folder creation via workspace-proxy
  // Use the /drive/folders endpoint if available, otherwise try /drive/files with mimeType
  logDebug('gdrive', ` NAP: Attempting to create folder "${name}" in parent ${parentId}`)

  const response = await undiciFetch(
    `${WORKSPACE_PROXY_URL}/drive/folders`,
    {
      method: 'POST',
      headers: {
        'X-Nexar-Platform-JWT': config.jwt || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        parentId
      }),
      dispatcher: internalAgent
    }
  )

  const responseText = await response.text()
  logDebug('gdrive', ` NAP folder creation response: status=${response.status}, body=${responseText.substring(0, 500)}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new FolderCreationError(
        'Folder creation is not supported by workspace-proxy. ' +
        'You can either upload files with a [decrypted] prefix in the same folder, ' +
        'or select a different destination folder.',
        true
      )
    }
    throw new FolderCreationError(
      `Failed to create folder: ${response.status} - ${responseText.substring(0, 200)}`,
      true
    )
  }

  const result = JSON.parse(responseText) as { id: string }
  return result.id
}

/**
 * Check if a folder exists and is accessible
 *
 * @param folderId - Google Drive folder ID to check
 * @param config - API configuration with access token
 * @returns true if folder exists and is accessible, false otherwise
 */
export async function folderExists(
  folderId: string,
  config: GDriveConfig
): Promise<boolean> {
  try {
    await driveRequest<DriveFile>(
      `/files/${folderId}?fields=id,mimeType`,
      config
    )
    return true
  } catch {
    return false
  }
}

/**
 * Check if a file with the given name exists in a folder
 *
 * @param folderId - Google Drive folder ID to check
 * @param filename - Name of the file to look for
 * @param config - API configuration with access token
 * @returns true if file exists, false otherwise
 */
export async function fileExistsInFolder(
  folderId: string,
  filename: string,
  config: GDriveConfig
): Promise<boolean> {
  try {
    const query = `'${folderId}' in parents and name='${filename.replace(/'/g, "\\'")}' and trashed=false`
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id)',
      pageSize: '1'
    })

    const response = await driveRequest<DriveListResponse>(
      `/files?${params}`,
      config
    )

    return response.files.length > 0
  } catch {
    return false
  }
}

/**
 * Get or create a "decrypted" subfolder
 *
 * This is used when the user selects "Same folder" option for destination.
 * Creates a /decrypted subfolder if it doesn't exist, or returns the existing one.
 *
 * @param parentId - Parent folder ID
 * @param config - API configuration with access token
 * @returns Google Drive folder ID of the decrypted folder
 */
export async function getOrCreateDecryptedFolder(
  parentId: string,
  config: GDriveConfig
): Promise<string> {
  // Check if "decrypted" folder already exists
  const query = `'${parentId}' in parents and name='decrypted' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id)'
  })

  const response = await driveRequest<DriveListResponse>(
    `/files?${params}`,
    config
  )

  if (response.files.length > 0) {
    return response.files[0].id
  }

  // Create new folder
  return createFolder(parentId, 'decrypted', config)
}
