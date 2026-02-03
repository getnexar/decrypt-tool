/**
 * Google Drive API Wrapper
 *
 * Handles all Google Drive operations for the decrypt tool:
 * - Listing MP4 files in a folder (recursively)
 * - Downloading files for decryption
 * - Uploading decrypted files
 * - Creating destination folders
 *
 * Authentication is provided by Nexar Application Platform (NAP)
 * via the 'google-drive' capability and workspace-proxy.
 */

import { Agent } from 'undici'
import type { GDriveFile } from '@/types'

// NAP workspace-proxy handles OAuth via Domain-Wide Delegation
const WORKSPACE_PROXY_URL = process.env.WORKSPACE_PROXY_URL || 'https://workspace-proxy.internal'

// Required for internal workspace-proxy certificate
// Node.js native fetch uses undici, which doesn't respect NODE_TLS_REJECT_UNAUTHORIZED
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } })

// ============================================================================
// Configuration
// ============================================================================

export interface GDriveConfig {
  jwt: string  // X-Nexar-Platform-JWT from the request
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
  const response = await fetch(`${WORKSPACE_PROXY_URL}/drive${endpoint}`, {
    ...options,
    headers: {
      'X-Nexar-Platform-JWT': config.jwt,
      'Content-Type': 'application/json',
      ...options.headers
    },
    // @ts-expect-error - dispatcher is valid for undici but not in RequestInit types
    dispatcher: insecureAgent
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Drive API error: ${response.status} - ${error}`)
  }

  return response.json()
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
  const response = await fetch(
    `${WORKSPACE_PROXY_URL}/drive/files/${fileId}/content`,
    {
      headers: {
        'X-Nexar-Platform-JWT': config.jwt
      },
      // @ts-expect-error - dispatcher is valid for undici but not in RequestInit types
      dispatcher: insecureAgent
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('No response body')
  }

  return response.body
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
  const response = await fetch(
    `${WORKSPACE_PROXY_URL}/drive/files/${fileId}/content`,
    {
      headers: {
        'X-Nexar-Platform-JWT': config.jwt
      },
      // @ts-expect-error - dispatcher is valid for undici but not in RequestInit types
      dispatcher: insecureAgent
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`)
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
// Maximum size for single-request upload (10MB)
const MAX_SIMPLE_UPLOAD_SIZE = 10 * 1024 * 1024

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

  // Use resumable upload for large files
  if (buffer.length > MAX_SIMPLE_UPLOAD_SIZE) {
    return uploadFileResumable(folderId, filename, buffer, mimeType, config)
  }

  // Simple upload for small files
  const metadata = {
    name: filename,
    parents: [folderId]
  }

  const formData = new FormData()
  formData.append('metadata', JSON.stringify(metadata))
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
  formData.append('file', new Blob([arrayBuffer], { type: mimeType }), filename)

  const response = await fetch(
    `${WORKSPACE_PROXY_URL}/drive/files`,
    {
      method: 'POST',
      headers: {
        'X-Nexar-Platform-JWT': config.jwt
      },
      body: formData,
      // @ts-expect-error - dispatcher is valid for undici but not in RequestInit types
      dispatcher: insecureAgent
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload file: ${response.status} - ${error}`)
  }

  const result = await response.json() as { id: string }
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

  // Step 1: Initiate resumable upload session
  const initResponse = await fetch(
    `${WORKSPACE_PROXY_URL}/drive/files/resumable`,
    {
      method: 'POST',
      headers: {
        'X-Nexar-Platform-JWT': config.jwt,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': buffer.length.toString()
      },
      body: JSON.stringify(metadata),
      // @ts-expect-error - dispatcher is valid for undici but not in RequestInit types
      dispatcher: insecureAgent
    }
  )

  if (!initResponse.ok) {
    const error = await initResponse.text()
    throw new Error(`Failed to initiate resumable upload: ${initResponse.status} - ${error}`)
  }

  const uploadUri = initResponse.headers.get('Location')
  if (!uploadUri) {
    throw new Error('No upload URI returned from resumable upload initiation')
  }

  // Step 2: Upload the file content
  const uploadResponse = await fetch(uploadUri, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Length': buffer.length.toString()
    },
    body: buffer,
    // @ts-expect-error - dispatcher is valid for undici but not in RequestInit types
    dispatcher: insecureAgent
  })

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text()
    throw new Error(`Failed to upload file content: ${uploadResponse.status} - ${error}`)
  }

  const result = await uploadResponse.json() as { id: string }
  return result.id
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
  // Workspace-proxy POST /drive/files expects multipart/form-data
  // with 'metadata' field and 'file' field (even for folders)
  const formData = new FormData()
  formData.append('metadata', JSON.stringify({
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  }))
  // Workspace-proxy requires a file field - use empty blob for folders
  formData.append('file', new Blob([]), name)

  const response = await fetch(`${WORKSPACE_PROXY_URL}/drive/files`, {
    method: 'POST',
    headers: {
      'X-Nexar-Platform-JWT': config.jwt
      // Note: Don't set Content-Type - FormData sets it automatically with boundary
    },
    body: formData,
    // @ts-expect-error - dispatcher is valid for undici but not in RequestInit types
    dispatcher: insecureAgent
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create folder: ${response.status} - ${error}`)
  }

  const result = await response.json() as { id: string }
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
