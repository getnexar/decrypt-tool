# Decrypt Tool

A web application for decrypting encrypted Nexar dashcam videos using XOR cipher.

**Version:** 0.5.4
**Status:** Working (GDrive → GDrive flow tested)

## Features

- Decrypt videos from Google Drive folders
- Batch processing with parallel workers (3 concurrent)
- Client-driven processing (survives browser refresh, laptop sleep)
- Duplicate detection (skips already-processed files)
- Download decrypted files individually or as ZIP
- Export results to CSV

## Project Status

| Environment | Status | Notes |
|-------------|--------|-------|
| **Local Dev** | ✅ Working | Full functionality with personal GDrive token |
| **NAP (Production)** | ✅ Working | GDrive → GDrive tested; use "same folder with prefix" option |

> **Note:** Only the Google Drive → Google Drive flow has been fully tested. Other source/destination combinations may have issues. Contributions welcome!

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Google account with access to encrypted video folders

### 1. Install dependencies

```bash
npm install
```

### 2. Get Google Drive Access Token

The local dev environment uses a personal OAuth token for Google Drive access.

**Option A: Using Google OAuth Playground (Recommended)**

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials" (optional, for longer-lived tokens)
4. In Step 1, find "Drive API v3" and select:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.file`
5. Click "Authorize APIs" and sign in with your Google account
6. In Step 2, click "Exchange authorization code for tokens"
7. Copy the `access_token` from the response

**Option B: Using gcloud CLI**

```bash
gcloud auth application-default print-access-token
```

### 3. Configure environment

Create `.env.local` in the project root:

```bash
GDRIVE_ACCESS_TOKEN=your_access_token_here
```

> **Note:** Access tokens expire after ~1 hour. You'll need to refresh when you see auth errors.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Usage

1. Enter the Google Drive folder URL containing encrypted `.mp4` files
2. Enter the decryption key (hex format)
3. Choose destination (same folder with "decrypted" prefix, or different folder)
4. Click "Start Decryption"
5. Monitor progress and download results

## Known Limitations (Production/NAP)

### Folder Creation Not Supported

The NAP workspace-proxy doesn't support creating new folders in Google Drive. When you select "Same folder → Create 'decrypted' subfolder", you'll see an error dialog with two options:

1. **Use prefix instead (Recommended):** Files saved to same folder with `[decrypted]` prefix
2. **Select existing folder:** Choose a pre-existing destination folder

### In-Memory Job Store

Jobs are stored in-memory. If the instance restarts (scaling, deployment, crash), job state is lost. This is rare with `min_instances: 1` but can happen.

**For future improvements:** See [`docs/issues/504-timeout-job-loss.md`](docs/issues/504-timeout-job-loss.md)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ DecryptForm │  │ ProgressPanel│  │ ResultsPanel  │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────────┘  │
│         │                │                              │
│         ▼                ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              useDecryptJob Hook                  │   │
│  │   (manages job state, parallel workers)          │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTP (process-next)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js Server                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │           /api/jobs/[id]/process-next            │   │
│  │   (claims batch, downloads, decrypts, uploads)   │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│  ┌──────────────┐  ┌────┴────┐  ┌─────────────────┐   │
│  │  job-store   │  │ crypto  │  │     gdrive      │   │
│  │ (in-memory)  │  │  (XOR)  │  │ (download/upload)│   │
│  └──────────────┘  └─────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

- **Client-driven processing:** Browser polls `process-next` endpoint, ensuring fresh JWT on each request (solves token expiration in long jobs)
- **Parallel workers:** 3 concurrent workers claim batches atomically to prevent duplicate processing
- **In-memory job store:** Simple but doesn't survive instance restarts (the known issue)

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Run ESLint
```

## Documentation

- [`docs/plans/2026-02-02-decrypt-tool-design.md`](docs/plans/2026-02-02-decrypt-tool-design.md) - Original design document
- [`docs/plans/2026-02-02-implementation-plan.md`](docs/plans/2026-02-02-implementation-plan.md) - Implementation plan
- [`docs/issues/504-timeout-job-loss.md`](docs/issues/504-timeout-job-loss.md) - Production timeout issue & fixes

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS, Radix UI
- **Testing:** Vitest
- **Deployment:** Nexar Application Platform (NAP)
