# Decrypt Tool - Design Document

**Date:** 2026-02-02
**Status:** Draft

## Overview

A NAP web application that decrypts encrypted MP4 files from a Google Drive folder using the Nexar video encryption algorithm.

### User Flow

1. User pastes a GDrive folder link containing encrypted videos
2. User enters the 32-character hex decryption key
3. User chooses destination: same folder (subfolder) or different folder
4. App decrypts all MP4 files recursively, showing progress
5. User sees results summary with execution log
6. User can retry failed files or download CSV log

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
│  Source GDrive Folder: [_________________________________]  │
│  Decryption Key:       [_________________________________]  │
│                                                             │
│  Destination:  ○ Same folder (creates /decrypted subfolder) │
│                ● Different folder                           │
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
│  ✓ 20 succeeded   ✗ 3 failed      [Retry Failed] [⬇ CSV]   │
├─────────────────────────────────────────────────────────────┤
│  Filter: [All ▾]  [Success ▾]  [Failed ▾]                  │
├─────────────────────────────────────────────────────────────┤
│  ✓ 2024-01-15_14-23-45_front.mp4           decrypted       │
│  ✓ 2024-01-15_14-24-12_front.mp4           decrypted       │
│  ✗ 2024-01-15_14-25-01_rear.mp4            invalid header  │
│  ✓ 2024-01-15_14-26-33_front.mp4           decrypted       │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### UI Components (Nexar Design System)

| Element | Component | Notes |
|---------|-----------|-------|
| Form inputs | `Input` | With `Label` |
| Destination choice | `RadioGroup` | Same folder / Different folder |
| Submit button | `Button` (primary) | Purple brand color |
| Progress bar | `Progress` | With percentage |
| Results summary | `Badge` | Success (green), Failed (destructive) |
| File log | `Table` | Sortable, filterable |
| Filter dropdown | `Select` | All / Success / Failed |
| Retry button | `Button` (outline) | |
| CSV download | `Button` (secondary) | With download icon |

**Typography:**
- Headings: `font-heading` (Hellix)
- Body: `font-sans` (Roobert)

---

## API Endpoints

### Create Job

```
POST /api/jobs
Body: {
  source_folder: string,    // GDrive folder link or ID
  key: string,              // 32-char hex decryption key
  dest_folder?: string,     // Optional: destination folder link
  same_folder: boolean      // If true, creates /decrypted subfolder
}
Response: { job_id: string }
```

### Get Job Status

```
GET /api/jobs/{job_id}
Response: {
  status: "pending" | "processing" | "completed" | "failed",
  total_files: number,
  processed: number,
  current_file: string,
  results: [{
    filename: string,
    status: "success" | "failed",
    error?: string,
    output_path?: string,
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

1. **Parse GDrive folder ID** from link
2. **List all .mp4 files** recursively in folder
3. **Create destination folder** if needed (subfolder or separate folder)
4. **For each file:**
   - Download to temp storage (Cloud Storage bucket)
   - Decrypt using XOR cipher (NumPy-optimized)
   - Validate MP4 header
   - Upload to destination GDrive folder (preserve folder structure)
   - Log result (success/failure + error message)
   - Clean up temp files
5. **Return final results**

### Error Handling

- Continue processing all files on individual failures
- Report summary at end with success/failure counts
- Allow retry of failed files (individually or all)

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
- Batch download as ZIP
- Key validation before starting (test decrypt first 12 bytes)
- Persistent job history
