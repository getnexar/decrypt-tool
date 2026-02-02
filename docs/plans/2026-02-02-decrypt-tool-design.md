# Decrypt Tool - Design Document

**Date:** 2026-02-02
**Status:** Draft

## Overview

A NAP web application that decrypts encrypted MP4 files using the Nexar video encryption algorithm. Supports both Google Drive and local file sources, with flexible output options.

### Supported Workflows

| Source | Destination |
|--------|-------------|
| Google Drive folder | Google Drive folder (same or different) |
| Google Drive folder | Download to computer |
| Local file upload | Google Drive folder |
| Local file upload | Download to computer |

### User Flow

1. User selects source: GDrive folder link OR uploads local files
2. User enters the 32-character hex decryption key
3. User chooses destination: GDrive folder OR download to computer
4. App decrypts all MP4 files (recursively for GDrive), showing progress
5. User sees results summary with execution log
6. User can retry failed files, download CSV log, or download decrypted files

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web UI (Flask)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Form: GDrive link, Key, Destination choice         │   │
│  │  Progress: File X of Y progress bar                 │   │
│  │  Results: Success/failure summary + Retry button    │   │
│  │  Log: Filterable execution log + CSV download       │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Backend Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ GDrive API   │  │ Decrypt Core │  │ Job Manager      │  │
│  │ (list/dl/up) │  │ (XOR cipher) │  │ (progress/state) │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### NAP Capabilities

- `google-drive` - Read source files, write decrypted files
- `cloud-storage` - Temporary file storage during processing

---

## User Interface

### Form Panel

```
┌─────────────────────────────────────────────────────────────┐
│  Source:       ○ Google Drive folder                        │
│                ● Upload from computer                       │
│                                                             │
│  [If GDrive]:  [_________________________________]          │
│  [If Upload]:  ┌─────────────────────────────────┐          │
│                │  Drop files here or click to    │          │
│                │  browse (MP4 files only)        │          │
│                └─────────────────────────────────┘          │
│                                                             │
│  Decryption Key: [_________________________________]        │
│                                                             │
│  Destination:  ○ Google Drive folder                        │
│                ● Download to computer                       │
│                                                             │
│  [If GDrive]:  ○ Same folder (creates /decrypted subfolder) │
│                ○ Different folder                           │
│                [_________________________________]          │
│                                                             │
│                              [Start Decryption]             │
└─────────────────────────────────────────────────────────────┘
```

### Progress Panel (during processing)

```
┌─────────────────────────────────────────────────────────────┐
│  Decrypting file 7 of 23...                                 │
│  ████████████░░░░░░░░░░░░░░░░░░░░  30%                     │
│  Current: 2024-01-15_14-23-45_front.mp4                    │
└─────────────────────────────────────────────────────────────┘
```

### Results Panel (after completion)

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ 20 succeeded   ✗ 3 failed                                │
│                                                             │
│  [Retry Failed] [⬇ Download All (ZIP)] [⬇ CSV Log]         │
├─────────────────────────────────────────────────────────────┤
│  Filter: [All ▾]  [Success ▾]  [Failed ▾]                  │
├─────────────────────────────────────────────────────────────┤
│  ✓ 2024-01-15_14-23-45_front.mp4    decrypted     [⬇]      │
│  ✓ 2024-01-15_14-24-12_front.mp4    decrypted     [⬇]      │
│  ✗ 2024-01-15_14-25-01_rear.mp4     invalid header         │
│  ✓ 2024-01-15_14-26-33_front.mp4    decrypted     [⬇]      │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Download options (when destination is "Download to computer"):**
- **Download All (ZIP):** Downloads all successfully decrypted files as a ZIP archive
- **Individual download:** Click ⬇ icon next to each successful file

### UI Components (Nexar Design System)

| Element | Component | Notes |
|---------|-----------|-------|
| Source choice | `RadioGroup` | GDrive / Upload |
| Destination choice | `RadioGroup` | GDrive / Download |
| GDrive subfolder choice | `RadioGroup` | Same folder / Different folder |
| Form inputs | `Input` | With `Label` |
| File upload | Custom dropzone | Drag & drop + click to browse |
| Submit button | `Button` (primary) | Purple brand color |
| Progress bar | `Progress` | With percentage |
| Results summary | `Badge` | Success (green), Failed (destructive) |
| File log | `Table` | Sortable, filterable, with download icons |
| Filter dropdown | `Select` | All / Success / Failed |
| Retry button | `Button` (outline) | |
| Download All button | `Button` (primary) | ZIP archive |
| CSV download | `Button` (secondary) | With download icon |
| Individual download | Icon button | Per-file download |

**Typography:**
- Headings: `font-heading` (Hellix)
- Body: `font-sans` (Roobert)

---

## API Endpoints

### Create Job

```
POST /api/jobs
Body: {
  source_type: "gdrive" | "upload",
  source_folder?: string,   // GDrive folder link (if source_type=gdrive)
  key: string,              // 32-char hex decryption key
  dest_type: "gdrive" | "download",
  dest_folder?: string,     // GDrive folder link (if dest_type=gdrive)
  same_folder?: boolean     // If true, creates /decrypted subfolder (gdrive only)
}
Response: { job_id: string, upload_url?: string }
```

**Note:** For `source_type=upload`, client uploads files to the returned `upload_url`.

### Upload Files (for local upload source)

```
POST /api/jobs/{job_id}/upload
Body: multipart/form-data with files
Response: { uploaded: number, filenames: string[] }
```

### Get Job Status

```
GET /api/jobs/{job_id}
Response: {
  status: "pending" | "uploading" | "processing" | "completed" | "failed",
  total_files: number,
  processed: number,
  current_file: string,
  dest_type: "gdrive" | "download",
  results: [{
    filename: string,
    status: "success" | "failed",
    error?: string,
    output_path?: string,
    download_url?: string,  // Present if dest_type=download
    processed_at: string
  }]
}
```

### Retry Failed Files

```
POST /api/jobs/{job_id}/retry
Body: { files?: string[] }  // Optional: specific files, or all failed
Response: { job_id: string }
```

### Download Single File

```
GET /api/jobs/{job_id}/download/{filename}
Response: Binary file (Content-Disposition: attachment)
```

### Download All as ZIP

```
GET /api/jobs/{job_id}/download-all
Response: ZIP archive (Content-Disposition: attachment)
```

### Download CSV Log

```
GET /api/jobs/{job_id}/csv
Response: CSV file (Content-Disposition: attachment)
```

**CSV Format:**
```csv
filename,status,error,processed_at,output_path
2024-01-15_14-23-45_front.mp4,success,,2026-02-02T10:15:32Z,decrypted/2024-01-15_14-23-45_front.mp4
2024-01-15_14-25-01_rear.mp4,failed,invalid mp4 header,2026-02-02T10:15:45Z,
```

---

## Processing Flow

### Flow A: GDrive Source → GDrive Destination

1. Parse GDrive folder ID from link
2. List all .mp4 files recursively in folder
3. Create destination folder if needed
4. For each file:
   - Download to temp storage
   - Decrypt using XOR cipher
   - Validate MP4 header
   - Upload to destination GDrive folder
   - Log result
5. Clean up temp files
6. Return final results

### Flow B: GDrive Source → Download Destination

1. Parse GDrive folder ID from link
2. List all .mp4 files recursively
3. For each file:
   - Download to temp storage
   - Decrypt using XOR cipher
   - Validate MP4 header
   - Store in job output directory (Cloud Storage)
   - Log result with download URL
4. Return results with download links
5. Clean up after download/expiry (24h)

### Flow C: Local Upload → GDrive Destination

1. Receive uploaded files from client
2. Store in temp storage
3. For each file:
   - Decrypt using XOR cipher
   - Validate MP4 header
   - Upload to destination GDrive folder
   - Log result
4. Clean up temp files
5. Return final results

### Flow D: Local Upload → Download Destination

1. Receive uploaded files from client
2. For each file:
   - Decrypt using XOR cipher
   - Validate MP4 header
   - Store in job output directory
   - Log result with download URL
3. Return results with download links
4. Clean up after download/expiry (24h)

### Error Handling

- Continue processing all files on individual failures
- Report summary at end with success/failure counts
- Allow retry of failed files (individually or all)

### File Cleanup

- Temp files: Deleted immediately after processing
- Download files: Available for 24 hours, then auto-deleted

---

## Decryption Algorithm

**Cipher:** XOR stream cipher with LCG-based pseudo-random pad

**Implementation:** Pure Python with NumPy optimization (~200 MB/s)

```python
import numpy as np

def generate_xor_pad(key: bytes) -> bytes:
    """Generate 4096-byte XOR pad from key using LCG."""
    seed = 0
    padded_key = key.ljust(32, b'\x00')
    for b in padded_key:
        seed = (seed * 17) ^ b

    pad = bytearray(4096)
    for i in range(4096):
        seed = (1103515245 * seed + 12345) % (2**31)
        pad[i] = ((seed >> 24) ^ (seed >> 16) ^ (seed >> 8) ^ seed) & 0xFF
    return bytes(pad)

def decrypt_data(data: bytes, pad: bytes, offset: int = 0) -> bytes:
    """Decrypt data using XOR pad (NumPy optimized)."""
    data_arr = np.frombuffer(data, dtype=np.uint8)
    pad_arr = np.frombuffer(pad, dtype=np.uint8)

    # Create cycling pad for full data length
    full_pad = np.tile(pad_arr, (len(data) // 4096) + 1)
    full_pad = np.roll(full_pad, -offset)[:len(data)]

    return bytes(data_arr ^ full_pad)

def validate_mp4_header(header: bytes) -> bool:
    """Validate decrypted MP4 header structure."""
    if len(header) < 12:
        return False

    box_size = int.from_bytes(header[0:4], 'big')
    box_type = header[4:8].decode('ascii', errors='ignore')

    valid_types = {'ftyp', 'iso2', 'isom', 'mp41', 'mp42'}
    return 8 <= box_size <= 1024 and box_type in valid_types
```

**Key format:** 32 hexadecimal characters (e.g., `f626ad1ffb5159bef3e9295df34244af`)

---

## Project Structure

```
decrypt-tool/
├── nexar.yaml              # NAP configuration
├── requirements.txt        # Python dependencies
├── main.py                 # Flask app entry point
├── static/
│   ├── css/
│   │   └── style.css       # UI styling (Nexar Design System)
│   └── js/
│       └── app.js          # Progress polling, log filtering, CSV export
├── templates/
│   └── index.html          # Single-page UI
├── src/
│   ├── __init__.py
│   ├── crypto.py           # XOR cipher (NumPy-optimized)
│   ├── gdrive.py           # GDrive API wrapper (list/download/upload)
│   ├── processor.py        # Orchestrates decrypt jobs
│   └── models.py           # Job state, file results
└── docs/
    └── plans/
        └── 2026-02-02-decrypt-tool-design.md
```

---

## Configuration

**nexar.yaml:**
```yaml
name: decrypt-tool
runtime: python3.11

capabilities:
  - google-drive
  - cloud-storage

build:
  command: pip install -r requirements.txt

run:
  command: python main.py
  port: 8081
```

**requirements.txt:**
```
flask==3.0.0
numpy==1.26.0
google-api-python-client==2.110.0
google-auth==2.25.0
```

---

## Performance Estimates

**For a typical 200MB dashcam video:**

| Operation | Time |
|-----------|------|
| GDrive Download | ~10-20 sec |
| Decrypt (NumPy) | ~1-2 sec |
| GDrive Upload | ~10-20 sec |
| **Total per file** | **~20-42 sec** |

**For batch of 20 files (4GB total):** ~8-14 minutes

---

## Future Considerations

- Real-time progress via WebSocket/SSE (instead of polling)
- Key validation before starting (test decrypt first 12 bytes)
- Persistent job history
- Drag & drop folder upload (browser limitations may apply)
