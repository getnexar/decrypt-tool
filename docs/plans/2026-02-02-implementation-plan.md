# Decrypt Tool - Implementation Plan

**Date:** 2026-02-02
**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
**Design Doc:** `docs/plans/2026-02-02-decrypt-tool-design.md`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App Router                          │
├─────────────────────────────────────────────────────────────────┤
│  Page: /                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DecryptForm (source, key, destination)                  │   │
│  │  ProgressPanel (file X of Y, current file)               │   │
│  │  ResultsPanel (summary, log table, actions)              │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Client-Side Crypto          │  API Routes                      │
│  (Local→Download flow)       │  (GDrive flows)                  │
│  - decrypt.ts (browser)      │  - POST /api/jobs                │
│  - No server round-trip      │  - GET  /api/jobs/[id]           │
│  - Key never leaves client   │  - POST /api/jobs/[id]/retry     │
│                              │  - GET  /api/jobs/[id]/download  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow Decision Matrix

| Source | Destination | Processing Location | Key Exposure |
|--------|-------------|---------------------|--------------|
| Local Upload | Download | **Client-side** | Never leaves browser |
| Local Upload | GDrive | Server-side | Sent to server (HTTPS) |
| GDrive | Download | Server-side | Sent to server (HTTPS) |
| GDrive | GDrive | Server-side | Sent to server (HTTPS) |

---

## Phase 1: Core Infrastructure

### Task 1.1: Crypto Library (TypeScript)
**Files:** `src/lib/crypto.ts`

Port the Python XOR cipher to TypeScript using Uint8Array:

```typescript
// Core functions needed:
function generateXorPad(key: string): Uint8Array    // 32-hex-char → 4096-byte pad
function decryptChunk(data: Uint8Array, pad: Uint8Array, offset: number): Uint8Array
function validateMp4Header(header: Uint8Array): boolean
```

**Performance target:** ~100-150 MB/s in browser, ~150-200 MB/s in Node.js

### Task 1.2: Type Definitions
**Files:** `src/types/index.ts`

```typescript
type SourceType = 'gdrive' | 'upload'
type DestType = 'gdrive' | 'download'
type JobStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
type FileStatus = 'pending' | 'processing' | 'success' | 'failed'

interface Job { ... }
interface FileResult { ... }
interface DecryptProgress { ... }
```

### Task 1.3: Validation Utilities
**Files:** `src/lib/validation.ts`

- `validateHexKey(key: string): boolean` - 32 hex chars
- `parseGDriveUrl(url: string): string | null` - Extract folder ID
- `sanitizeFilename(name: string): string` - Path traversal prevention
- `validateMp4File(file: File): Promise<boolean>` - Magic bytes check

---

## Phase 2: UI Components

### Task 2.1: Fetch Design System Components
**Files:** `src/components/ui/`

Fetch from `https://raw.githubusercontent.com/dashagolubchinaux/components/main/ui/`:

| Component | File | Required Radix Package |
|-----------|------|------------------------|
| Button | `button.tsx` | `@radix-ui/react-slot` (installed) |
| Input | `input.tsx` | - |
| Label | `label.tsx` | `@radix-ui/react-label` |
| RadioGroup | `radio-group.tsx` | `@radix-ui/react-radio-group` |
| Progress | `progress.tsx` | `@radix-ui/react-progress` |
| Badge | `badge.tsx` | - |
| Card | `card.tsx` | - |
| Table | `table.tsx` | - |
| Select | `select.tsx` | `@radix-ui/react-select` |

**Install:** `npm install @radix-ui/react-label @radix-ui/react-radio-group @radix-ui/react-progress @radix-ui/react-select`

### Task 2.2: Custom Components
**Files:** `src/components/`

| Component | Description |
|-----------|-------------|
| `FileDropzone.tsx` | Drag & drop file upload with MP4 validation |
| `DecryptForm.tsx` | Main form with source/key/destination inputs |
| `ProgressPanel.tsx` | Progress bar with file counter |
| `ResultsPanel.tsx` | Summary badges, log table, action buttons |
| `FileLogTable.tsx` | Filterable table with download icons |

---

## Phase 3: Client-Side Decryption

### Task 3.1: Browser Decrypt Worker
**Files:** `src/workers/decrypt.worker.ts`

Web Worker for off-main-thread decryption:
- Receives: File + key
- Processes: Chunk-by-chunk XOR (streaming)
- Returns: Decrypted blob + progress updates

### Task 3.2: Client Decrypt Hook
**Files:** `src/hooks/useClientDecrypt.ts`

```typescript
function useClientDecrypt() {
  return {
    decryptFiles: (files: File[], key: string) => Promise<DecryptResult[]>,
    progress: DecryptProgress,
    cancel: () => void
  }
}
```

### Task 3.3: Download Utilities
**Files:** `src/lib/download.ts`

- `downloadFile(blob: Blob, filename: string)` - Single file download
- `downloadAsZip(files: {blob: Blob, name: string}[])` - ZIP archive (using JSZip)
- `generateCsvLog(results: FileResult[]): string` - CSV export

**Install:** `npm install jszip @types/jszip`

---

## Phase 4: Server-Side API (GDrive Flows)

### Task 4.1: Job Storage
**Files:** `src/lib/job-store.ts`

In-memory job store (upgrade to Redis/DB later if needed):
- Create job with UUID
- Update job status/progress
- Get job by ID
- Auto-expire after 24h

### Task 4.2: Google Drive Integration
**Files:** `src/lib/gdrive.ts`

Using `googleapis` package:
- `listMp4Files(folderId: string): Promise<GDriveFile[]>`
- `downloadFile(fileId: string): Promise<ReadableStream>`
- `uploadFile(folderId: string, name: string, data: Buffer): Promise<string>`
- `createFolder(parentId: string, name: string): Promise<string>`

**Install:** `npm install googleapis`

### Task 4.3: API Routes
**Files:** `src/app/api/jobs/`

| Route | Method | Handler |
|-------|--------|---------|
| `/api/jobs` | POST | Create job |
| `/api/jobs/[id]` | GET | Get job status |
| `/api/jobs/[id]/retry` | POST | Retry failed files |
| `/api/jobs/[id]/download/[filename]` | GET | Download single file |
| `/api/jobs/[id]/download-all` | GET | Download ZIP |
| `/api/jobs/[id]/csv` | GET | Download CSV log |

### Task 4.4: Server Decrypt Processor
**Files:** `src/lib/processor.ts`

Orchestrates server-side decryption:
- Streams files from GDrive
- Decrypts in chunks
- Uploads to destination or stores for download
- Updates job progress

---

## Phase 5: Integration & Polish

### Task 5.1: Main Page Assembly
**Files:** `src/app/page.tsx`

Wire together:
- Form submission → detect flow type
- Client-side flow: use `useClientDecrypt` hook
- Server-side flow: POST to `/api/jobs`, poll for status
- Show progress panel during processing
- Show results panel on completion

### Task 5.2: State Management
**Files:** `src/hooks/useDecryptJob.ts`

Unified hook for both client and server flows:
```typescript
function useDecryptJob() {
  return {
    startJob: (config: JobConfig) => void,
    status: JobStatus,
    progress: DecryptProgress,
    results: FileResult[],
    retry: (files?: string[]) => void
  }
}
```

### Task 5.3: Error Handling & Edge Cases
- Invalid key format → inline validation error
- Invalid MP4 header → mark file as failed, continue
- Network errors → retry with exponential backoff
- Large files (>2GB) → streaming, no memory overflow
- Empty folder → clear error message

### Task 5.4: Security Hardening
Per design doc requirements:
- [ ] Keys never logged
- [ ] HTTPS only (enforced by NAP)
- [ ] Job isolation (UUID-based)
- [ ] File size limits (2GB per file, 10GB per job)
- [ ] Filename sanitization
- [ ] Secure deletion (best effort in serverless)

---

## Implementation Order

```
Phase 1 (Foundation)     Phase 2 (UI)           Phase 3 (Client)
├── 1.1 Crypto ──────────┼── 2.1 Fetch DS ──────┼── 3.1 Worker
├── 1.2 Types            ├── 2.2 Custom         ├── 3.2 Hook
└── 1.3 Validation       │   Components         └── 3.3 Download
                         │
                    Phase 4 (Server)        Phase 5 (Integration)
                    ├── 4.1 Job Store       ├── 5.1 Page Assembly
                    ├── 4.2 GDrive          ├── 5.2 State Mgmt
                    ├── 4.3 API Routes      ├── 5.3 Error Handling
                    └── 4.4 Processor       └── 5.4 Security
```

**Parallelization opportunities:**
- Phase 1 tasks can run in parallel
- Phase 2.1 (fetch) and 2.2 (custom) can run in parallel
- Phase 3 depends on Phase 1 (crypto)
- Phase 4 depends on Phase 1 (crypto, types)
- Phase 5 depends on all others

---

## Dependencies to Install

```bash
npm install \
  @radix-ui/react-label \
  @radix-ui/react-radio-group \
  @radix-ui/react-progress \
  @radix-ui/react-select \
  googleapis \
  jszip \
  uuid

npm install -D @types/uuid
```

---

## Success Criteria

- [ ] Local→Download flow works entirely client-side (key never sent to server)
- [ ] GDrive→GDrive flow works with proper auth
- [ ] Progress shows real-time updates
- [ ] Failed files can be retried
- [ ] CSV export contains all results
- [ ] ZIP download works for multiple files
- [ ] Security checklist from design doc passes
- [ ] Performance: ~100+ MB/s decrypt speed

---

## Estimated Effort

| Phase | Complexity | Parallelizable |
|-------|------------|----------------|
| Phase 1 | Low | Yes (all 3 tasks) |
| Phase 2 | Medium | Partial |
| Phase 3 | Medium | After Phase 1 |
| Phase 4 | High | After Phase 1 |
| Phase 5 | Medium | After all others |
