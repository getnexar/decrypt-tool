# API Routes Implementation

**Date:** 2026-02-02
**Status:** Complete (Processor Integration Pending)
**Author:** backend-engineer

## Overview

Implemented all Next.js API routes for the decrypt tool server-side processing. The routes handle job creation, status polling, file downloads, retries, and CSV exports.

## Routes Implemented

| Route | Method | File | Status |
|-------|--------|------|--------|
| `/api/jobs` | POST | `src/app/api/jobs/route.ts` | ✅ Complete |
| `/api/jobs/[id]` | GET | `src/app/api/jobs/[id]/route.ts` | ✅ Complete |
| `/api/jobs/[id]/retry` | POST | `src/app/api/jobs/[id]/retry/route.ts` | ✅ Complete |
| `/api/jobs/[id]/download/[filename]` | GET | `src/app/api/jobs/[id]/download/[filename]/route.ts` | ⚠️ Pending Processor |
| `/api/jobs/[id]/download-all` | GET | `src/app/api/jobs/[id]/download-all/route.ts` | ⚠️ Pending Processor |
| `/api/jobs/[id]/csv` | GET | `src/app/api/jobs/[id]/csv/route.ts` | ✅ Complete |

## Implementation Details

### 1. POST /api/jobs - Create Job

**Purpose:** Create a new decryption job

**Request Body:**
```typescript
{
  sourceType: 'gdrive' | 'upload',
  sourceFolder?: string,  // GDrive URL (if sourceType=gdrive)
  key: string,            // 32-char hex key
  destType: 'gdrive' | 'download',
  destFolder?: string,    // GDrive URL (if destType=gdrive)
  sameFolder?: boolean    // Use same folder with /decrypted subfolder
}
```

**Response:**
```typescript
{
  jobId: string,
  uploadUrl?: string  // Present if sourceType=upload
}
```

**Security:**
- Validates key format without logging the actual key value
- Validates Google Drive URLs using `parseGDriveUrl`
- Returns 400 for invalid inputs
- Never exposes the encryption key in logs or error messages

**TODO:**
- Integrate background job processing for GDrive sources
- Implement upload URL generation for local file uploads

### 2. GET /api/jobs/[id] - Get Job Status

**Purpose:** Retrieve current job status and results

**Response:** Complete `Job` object including:
- Job status (pending, processing, completed, failed)
- Progress counters (totalFiles, processedFiles, currentFile)
- Individual file results with success/failure status

**Notes:**
- Returns 404 if job not found or expired
- Job expiration handled by job-store module (24h retention)

### 3. POST /api/jobs/[id]/retry - Retry Failed Files

**Purpose:** Create a new job to retry failed file decryptions

**Request Body:**
```typescript
{
  key: string,      // 32-char hex key (required for retry)
  files?: string[]  // Optional: specific files, or all failed files
}
```

**Response:**
```typescript
{
  jobId: string  // New job ID for retry operation
}
```

**Logic:**
- Extracts failed files from original job
- Creates new job with same configuration
- Allows selective retry (specific files) or retry all failed
- Validates key format without logging

**TODO:**
- Integrate retry processing once processor module exists

### 4. GET /api/jobs/[id]/download/[filename] - Download Single File

**Purpose:** Download a single decrypted file

**Security:**
- Sanitizes filename using `sanitizeFilename` to prevent path traversal
- Validates file exists and was successfully decrypted
- Returns 404 if file not found or failed

**Response Headers:**
```
Content-Type: video/mp4
Content-Disposition: attachment; filename="<sanitized-filename>"
Content-Length: <file-size>
```

**Status:** Awaiting processor module integration
- Currently returns 501 Not Implemented
- Placeholder for `getDecryptedFile(jobId, filename)` function

### 5. GET /api/jobs/[id]/download-all - Download All as ZIP

**Purpose:** Download all successfully decrypted files as a ZIP archive

**Logic:**
- Filters job results for successful files only
- Creates ZIP archive using JSZip with fast compression (level 1)
- Returns 400 if no files to download

**Response Headers:**
```
Content-Type: application/zip
Content-Disposition: attachment; filename="decrypted-<job-id-prefix>.zip"
Content-Length: <zip-size>
```

**Status:** Awaiting processor module integration
- Currently returns 501 Not Implemented
- Requires `getDecryptedFile` function for each file

**Performance Note:**
- Uses compression level 1 (fast) for large video files
- Compression level configurable via `compressionOptions.level`

### 6. GET /api/jobs/[id]/csv - Download CSV Log

**Purpose:** Download job results as CSV file

**CSV Format:**
```csv
filename,status,error,processed_at,size_bytes,output_path
video1.mp4,success,,2026-02-02T10:15:32Z,2048000,decrypted/video1.mp4
video2.mp4,failed,invalid mp4 header,2026-02-02T10:15:45Z,,
```

**Features:**
- CSV escaping handled by `generateCsvContent` utility
- Handles commas, quotes, and newlines in values
- Timestamped filename for easy identification

**Response Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="decrypt-log-<job-id-prefix>.csv"
```

## Security Implementation

### Key Handling

**CRITICAL:** Encryption keys are NEVER logged or persisted.

```typescript
// ✅ CORRECT
if (!validateHexKey(body.key)) {
  return NextResponse.json({ error: 'Invalid key format' }, { status: 400 })
}

// ❌ WRONG - Never do this
console.log(`Processing with key: ${body.key}`)
```

**Security Measures:**
1. Key validation without exposure
2. Keys passed via POST body only (never in URLs)
3. No key persistence to disk
4. Memory-only key handling
5. Error messages never include key values

### Path Traversal Prevention

All filename inputs sanitized using `sanitizeFilename`:
- Removes path separators (`/`, `\`)
- Removes null bytes
- Removes control characters
- Strips leading dots
- Limits length to 255 characters

### Job Isolation

- Jobs identified by UUID (not sequential IDs)
- No cross-job access possible
- Jobs expire after 24 hours automatically
- Authentication will be added at NAP deployment layer

## Dependencies

### Existing Modules
- `@/lib/job-store` - Job state management ✅
- `@/lib/validation` - Input validation and sanitization ✅
- `@/lib/download` - CSV generation and utilities ✅
- `@/types` - TypeScript type definitions ✅

### Missing Modules (Required for Full Implementation)
- `@/lib/processor` - Background job processing
  - `processGDriveJob(jobId, key, filesToProcess?)` - Process GDrive files
  - `getDecryptedFile(jobId, filename)` - Retrieve decrypted file buffer

## Testing Requirements

### Unit Tests
- [x] Input validation (key format, URLs)
- [ ] Error handling (invalid job IDs, missing files)
- [ ] CSV generation (escaping, formatting)
- [ ] Filename sanitization (path traversal prevention)

### Integration Tests
- [ ] POST /api/jobs - Job creation flow
- [ ] GET /api/jobs/[id] - Status polling
- [ ] POST /api/jobs/[id]/retry - Retry logic
- [ ] GET /api/jobs/[id]/csv - CSV download
- [ ] File download routes (once processor implemented)

### Security Tests
- [ ] Key never appears in logs
- [ ] Path traversal attempts blocked
- [ ] Invalid job ID access returns 404
- [ ] Rate limiting (future)

## Next Steps

1. **Processor Module** (BLOCKING)
   - Implement `processGDriveJob` for background decryption
   - Implement `getDecryptedFile` for file retrieval
   - Integrate with job-store for progress updates

2. **Upload Endpoint**
   - Create `/api/jobs/[id]/upload` route for local file uploads
   - Multipart form-data handling
   - File size validation

3. **Testing**
   - Write integration tests for all routes
   - Add security test suite
   - Performance testing for large files/batches

4. **Error Handling**
   - Add retry logic for transient failures
   - Better error messages for user feedback
   - Logging for debugging (without sensitive data)

5. **Authentication**
   - Integration with NAP authentication layer
   - Session binding for job isolation
   - Rate limiting per user

## Related Documentation

- Design: `/docs/plans/2026-02-02-decrypt-tool-design.md`
- Security Requirements: See design doc section on security
- Job Store: `/src/lib/job-store.ts`
- Validation: `/src/lib/validation.ts`
- Types: `/src/types/index.ts`
