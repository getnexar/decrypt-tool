# Domain Knowledge - Decrypt Tool

## Project Overview

**Purpose:** NAP web application that decrypts encrypted Nexar dashcam video files. Supports multiple input/output options.

**Business Context:** Nexar dashcam devices encrypt video files on the SD card. When users need to access their raw video files (e.g., for insurance claims, video editing, or backup), they need a way to decrypt them. This tool provides a user-friendly web interface for batch decryption.

**Target Users:** Internal Nexar support staff and potentially end users who need to decrypt their own videos.

## Technical Architecture

### Platform
- **Runtime:** NAP (Nexar Application Platform) - internal deployment platform
- **Framework:** Next.js 16 with App Router
- **Styling:** Tailwind CSS 4 + Nexar Design System
- **Language:** TypeScript

### Capabilities Required
- `google-drive` - Read source files, write decrypted files
- `cloud-storage` - Temporary file storage during processing

### Supported Workflows

| Source | Destination |
|--------|-------------|
| Google Drive folder | Google Drive folder |
| Google Drive folder | Download to computer |
| Local file upload | Google Drive folder |
| Local file upload | Download to computer |

### Core Flow
1. User selects source: GDrive folder OR uploads local files
2. User provides 32-char hex decryption key
3. User chooses destination: GDrive folder OR download to computer
4. For each file: decrypt → validate → store/upload
5. Show progress and results with retry capability
6. If download destination: provide ZIP archive and individual downloads

## Encryption Algorithm

**Cipher:** XOR stream cipher with Linear Congruential Generator (LCG)

**Key Details:**
- Key format: 32 hexadecimal characters (128-bit)
- XOR pad size: 4096 bytes (cycling)
- Validation: MP4 header structure check

**Implementation:** Pure Python with NumPy optimization for performance (~200 MB/s).

**Key Sources:**
- Camera command: `rtos_api video_encryption_key get`
- File path on device: `/data/nexar/nexar1/.activation/enc_key`

## UI/UX Standards

### Nexar Design System
- **Brand color:** Purple (`bg-primary`, `text-primary`)
- **Heading font:** Hellix (`font-heading`)
- **Body font:** Roobert (`font-sans`)
- **Default radius:** `rounded-xl` (cards), `rounded-lg` (smaller)
- **Card padding:** `p-6` or `p-8`

### Component Library
Fetch components from: `https://raw.githubusercontent.com/dashagolubchinaux/components/main/ui/`

Required components for this app:
- Button, Input, Label (form)
- RadioGroup (source/destination choice)
- Progress (progress bar)
- Table (execution log)
- Select (log filter)
- Badge (status indicators)
- Card (layout)
- Custom file dropzone (drag & drop upload)

## API Design

### Endpoints
- `POST /api/jobs` - Create decryption job
- `POST /api/jobs/{id}/upload` - Upload local files (for upload source)
- `GET /api/jobs/{id}` - Get job status and results
- `POST /api/jobs/{id}/retry` - Retry failed files
- `GET /api/jobs/{id}/download/{filename}` - Download single decrypted file
- `GET /api/jobs/{id}/download-all` - Download all as ZIP
- `GET /api/jobs/{id}/csv` - Download execution log

### Job States
- `pending` - Job created, not started
- `uploading` - Receiving uploaded files
- `processing` - Currently decrypting files
- `completed` - All files processed
- `failed` - Job-level failure (not individual file failures)

## Quality Requirements

### Error Handling
- Continue processing all files even if some fail
- Report detailed error messages for failed files (without exposing sensitive data)
- Allow retry of failed files (individually or batch)

### Performance Targets
- Progress updates every 2 seconds via polling
- Support folders with 50+ video files
- Handle files up to 1GB each (2GB max, 10GB per job)

## Security Requirements (CRITICAL)

**Video files contain sensitive personal data (faces, license plates, locations). The encryption key is also sensitive.**

### Key Handling (MANDATORY)
- **NEVER log keys** - Keys must never appear in logs, errors, or debug output
- **No persistence** - Keys held in memory only, never written to disk
- **No URL exposure** - Keys submitted via POST body, never in URLs
- **Memory cleanup** - Zero-out key buffers after use

### Data Protection
- **Encrypted storage** - All files in Cloud Storage with encryption
- **Secure deletion** - Files deleted securely, not just unlinked
- **Job isolation** - Users can only access their own jobs
- **Auto-expiration** - Jobs and files expire after 24 hours

### Access Control
- **Authentication required** - All endpoints require NAP auth
- **Rate limiting** - Prevent brute-force and abuse
- **Secure job IDs** - UUIDs, not sequential (prevent enumeration)

### Logging Rules
- Log: job IDs, timestamps, success/failure counts, error types
- NEVER log: keys, file contents, full filenames, personal data

### Input Validation
- Validate key format (32 hex chars) without logging value
- Validate file types (MP4 magic bytes, not just extension)
- Enforce size limits
- Sanitize filenames (prevent path traversal)

## File Organization

\`\`\`
src/
├── app/
│   ├── page.tsx          # Main UI
│   ├── layout.tsx        # App shell
│   ├── globals.css       # Tailwind + theme
│   └── api/
│       └── jobs/         # API routes
├── components/
│   └── ui/               # Design system components
├── lib/
│   ├── utils.ts          # cn() utility
│   ├── crypto.ts         # XOR decryption
│   ├── gdrive.ts         # GDrive API wrapper
│   └── types.ts          # TypeScript types
└── styles/
    ├── nexar-theme.css   # Design tokens
    └── fonts/            # Hellix + Roobert
\`\`\`

## Development Workflow

### Build Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint

### Deployment
- Deploy via `nap deploy`
- Port: 8081 (NAP requirement)
- Capabilities configured in `nexar.yaml`

## Constraints

1. **NAP Platform:** Must follow NAP deployment patterns
2. **Design System:** All UI must use Nexar Design System
3. **Google Drive:** Requires Domain-Wide Delegation setup
4. **No external dependencies:** Cannot use native C libraries (pure Python/JS only)
