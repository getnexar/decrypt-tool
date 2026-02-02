# Test Plan: API Routes

**Domain:** Backend API
**Requirements:** `/docs/plans/2026-02-02-decrypt-tool-design.md`
**Implementation:** `/agent_docs/implementations/backend/api-routes.md`
**Created:** 2026-02-02

## Test Strategy

**Scope:** All API routes for decryption job management
**Approach:** Automated unit and integration tests
**Entry Criteria:**
- [ ] API routes implementation complete
- [ ] Job store module functional
- [ ] Validation module functional

**Exit Criteria:**
- [ ] All test cases executed
- [ ] >90% coverage achieved
- [ ] No critical security defects
- [ ] No memory leaks in key handling

## Test Cases

### TC-001: POST /api/jobs - Create Job with GDrive Source
**Priority:** Critical
**Type:** Integration

**Preconditions:**
- Valid 32-char hex key available
- Valid Google Drive folder URL

**Steps:**
1. POST to `/api/jobs` with valid GDrive source configuration
2. Verify response contains `jobId`
3. Verify response does NOT contain `uploadUrl`
4. Verify job created in job-store with correct configuration

**Expected Result:**
```json
{
  "jobId": "<uuid>",
  "uploadUrl": undefined
}
```

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-002: POST /api/jobs - Create Job with Upload Source
**Priority:** Critical
**Type:** Integration

**Preconditions:**
- Valid 32-char hex key available

**Steps:**
1. POST to `/api/jobs` with `sourceType: 'upload'`
2. Verify response contains both `jobId` and `uploadUrl`
3. Verify `uploadUrl` matches pattern `/api/jobs/{jobId}/upload`

**Expected Result:**
```json
{
  "jobId": "<uuid>",
  "uploadUrl": "/api/jobs/<uuid>/upload"
}
```

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-003: POST /api/jobs - Invalid Key Format
**Priority:** Critical
**Type:** Security

**Preconditions:**
- None

**Steps:**
1. POST to `/api/jobs` with invalid key (not 32 hex chars)
2. Verify response is 400 Bad Request
3. Verify error message does NOT contain the key value
4. Verify no job created in job-store

**Expected Result:**
```json
{
  "error": "Invalid key format"
}
```
Status: 400

**Test Data:**
- `"invalid"` - too short
- `"f626ad1ffb5159bef3e9295df34244ag"` - invalid char 'g'
- `"f626ad1ffb5159bef3e9295df34244a"` - 31 chars (too short)
- `""` - empty string

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-004: POST /api/jobs - Invalid GDrive URL
**Priority:** High
**Type:** Functional

**Preconditions:**
- Valid 32-char hex key

**Steps:**
1. POST to `/api/jobs` with `sourceType: 'gdrive'` and invalid folder URL
2. Verify response is 400 Bad Request
3. Verify error message indicates invalid Google Drive URL

**Expected Result:**
```json
{
  "error": "Invalid Google Drive folder URL"
}
```
Status: 400

**Test Data:**
- `"not-a-url"`
- `"https://example.com/folder/123"`
- `""`

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-005: GET /api/jobs/[id] - Valid Job
**Priority:** Critical
**Type:** Integration

**Preconditions:**
- Job created with known ID

**Steps:**
1. GET `/api/jobs/{jobId}` with valid job ID
2. Verify response contains complete Job object
3. Verify status is one of: pending, processing, completed, failed
4. Verify totalFiles, processedFiles, results arrays present

**Expected Result:**
Complete Job object with all fields populated

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-006: GET /api/jobs/[id] - Non-existent Job
**Priority:** High
**Type:** Error Handling

**Preconditions:**
- None

**Steps:**
1. GET `/api/jobs/{randomUUID}` with non-existent job ID
2. Verify response is 404 Not Found
3. Verify error message is appropriate

**Expected Result:**
```json
{
  "error": "Job not found"
}
```
Status: 404

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-007: GET /api/jobs/[id] - Expired Job
**Priority:** Medium
**Type:** Functional

**Preconditions:**
- Job created with expired timestamp (mock/override expiry)

**Steps:**
1. Create job with expiry in the past
2. GET `/api/jobs/{jobId}`
3. Verify response is 404 Not Found (expired jobs auto-deleted)

**Expected Result:**
404 Not Found

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-008: POST /api/jobs/[id]/retry - Retry All Failed Files
**Priority:** High
**Type:** Integration

**Preconditions:**
- Original job exists with some failed files
- Valid 32-char hex key

**Steps:**
1. Create job with failed file results
2. POST to `/api/jobs/{jobId}/retry` with key (no file list)
3. Verify response contains new `jobId`
4. Verify new job created in job-store
5. Verify new job has same configuration as original

**Expected Result:**
```json
{
  "jobId": "<new-uuid>"
}
```

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-009: POST /api/jobs/[id]/retry - Retry Specific Files
**Priority:** High
**Type:** Integration

**Preconditions:**
- Original job with multiple failed files
- Valid key

**Steps:**
1. POST to `/api/jobs/{jobId}/retry` with key and specific file list
2. Verify new job created
3. TODO: Verify only specified files queued for retry (requires processor)

**Expected Result:**
New job ID returned, retry queued for specific files only

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-010: POST /api/jobs/[id]/retry - Invalid Key
**Priority:** Critical
**Type:** Security

**Preconditions:**
- Original job exists with failed files

**Steps:**
1. POST to `/api/jobs/{jobId}/retry` with invalid key
2. Verify response is 400 Bad Request
3. Verify error does NOT contain key value
4. Verify no new job created

**Expected Result:**
```json
{
  "error": "Invalid key format"
}
```
Status: 400

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-011: POST /api/jobs/[id]/retry - No Failed Files
**Priority:** Medium
**Type:** Error Handling

**Preconditions:**
- Original job exists with all files succeeded

**Steps:**
1. POST to `/api/jobs/{jobId}/retry` with valid key
2. Verify response is 400 Bad Request
3. Verify error message indicates no files to retry

**Expected Result:**
```json
{
  "error": "No files to retry"
}
```
Status: 400

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-012: GET /api/jobs/[id]/download/[filename] - Path Traversal Attempt
**Priority:** Critical
**Type:** Security

**Preconditions:**
- Job with successful file

**Steps:**
1. GET `/api/jobs/{jobId}/download/../../../etc/passwd`
2. Verify filename sanitized (path separators removed)
3. Verify response is 404 (sanitized filename won't match)
4. Verify no filesystem access outside job directory

**Expected Result:**
404 Not Found (after sanitization, filename doesn't exist)

**Test Data:**
- `"../../../etc/passwd"`
- `"..\\..\\windows\\system32\\config\\sam"`
- `"../../secret.mp4"`
- `"./../file.mp4"`

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-013: GET /api/jobs/[id]/download/[filename] - Null Byte Injection
**Priority:** Critical
**Type:** Security

**Preconditions:**
- Job with successful file

**Steps:**
1. GET `/api/jobs/{jobId}/download/file.mp4%00.txt`
2. Verify null byte removed by sanitization
3. Verify response is 404 or file not found

**Expected Result:**
Null byte stripped, safe handling

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-014: GET /api/jobs/[id]/download/[filename] - Valid File (Processor Pending)
**Priority:** High
**Type:** Integration

**Preconditions:**
- Job with successfully decrypted file
- Processor module implemented

**Steps:**
1. GET `/api/jobs/{jobId}/download/{filename}` with valid filename
2. Verify response is binary MP4 file
3. Verify Content-Type header is `video/mp4`
4. Verify Content-Disposition header includes filename
5. Verify Content-Length matches file size

**Expected Result:**
Binary file download with correct headers

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [x] Blocked (awaiting processor)

---

### TC-015: GET /api/jobs/[id]/download-all - Valid ZIP (Processor Pending)
**Priority:** High
**Type:** Integration

**Preconditions:**
- Job with multiple successful files
- Processor module implemented

**Steps:**
1. GET `/api/jobs/{jobId}/download-all`
2. Verify response is ZIP archive
3. Verify Content-Type is `application/zip`
4. Extract ZIP and verify all successful files present
5. Verify compression level is fast (level 1)

**Expected Result:**
ZIP archive containing all successful decrypted files

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [x] Blocked (awaiting processor)

---

### TC-016: GET /api/jobs/[id]/download-all - No Successful Files
**Priority:** Medium
**Type:** Error Handling

**Preconditions:**
- Job with all files failed

**Steps:**
1. GET `/api/jobs/{jobId}/download-all`
2. Verify response is 400 Bad Request
3. Verify error message indicates no files available

**Expected Result:**
```json
{
  "error": "No files to download"
}
```
Status: 400

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-017: GET /api/jobs/[id]/csv - Valid CSV Export
**Priority:** High
**Type:** Integration

**Preconditions:**
- Job with mixed success/failure results

**Steps:**
1. GET `/api/jobs/{jobId}/csv`
2. Verify response is CSV file
3. Verify Content-Type is `text/csv; charset=utf-8`
4. Verify CSV headers present: filename, status, error, processed_at, size_bytes, output_path
5. Verify data rows match job results
6. Verify CSV escaping correct (commas, quotes, newlines)

**Expected Result:**
Valid CSV file with all job results

**Test Data:**
- Filename with comma: `"file,test.mp4"`
- Filename with quote: `"file"test.mp4"`
- Error with newline: `"Error:\nInvalid header"`

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-018: GET /api/jobs/[id]/csv - Empty Results
**Priority:** Low
**Type:** Edge Case

**Preconditions:**
- Job with no processed files yet

**Steps:**
1. GET `/api/jobs/{jobId}/csv` on pending job
2. Verify CSV headers still present
3. Verify no data rows (only headers)

**Expected Result:**
CSV with headers only

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-019: Security - Key Never Logged
**Priority:** Critical
**Type:** Security Audit

**Preconditions:**
- Logging enabled

**Steps:**
1. POST to `/api/jobs` with valid key
2. POST to `/api/jobs/{id}/retry` with valid key
3. POST with invalid keys
4. Review all server logs, console output, error messages
5. Verify key value NEVER appears in any log

**Expected Result:**
No key values in logs under any circumstance

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-020: Performance - Large CSV Export
**Priority:** Medium
**Type:** Performance

**Preconditions:**
- Job with 1000+ file results

**Steps:**
1. Create job with 1000 file results
2. GET `/api/jobs/{jobId}/csv`
3. Measure response time
4. Verify response completes within 5 seconds

**Expected Result:**
CSV generation and download completes in < 5s for 1000 files

**Actual Result:** [To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

## Test Data Requirements

- Valid hex keys (32 chars): `f626ad1ffb5159bef3e9295df34244af`
- Invalid hex keys: See TC-003
- Valid GDrive URLs: `https://drive.google.com/drive/folders/1ABC123def456`
- Invalid GDrive URLs: See TC-004
- Path traversal attempts: See TC-012
- Special filename characters: See TC-017

## Dependencies

- Job store module functional
- Validation module functional
- Processor module (for download tests)
- Test fixtures for mock jobs

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Processor module delays blocking download tests | High | Mock processor functions for download route tests |
| Key leakage in logs | Critical | Audit all log statements, automated log scanning |
| Path traversal vulnerabilities | High | Security-focused test suite, penetration testing |

## Test Execution Notes

**Run Order:**
1. Unit tests first (validation, sanitization)
2. Integration tests (job creation, status)
3. Security tests (key handling, path traversal)
4. Performance tests last

**Coverage Target:** >90% for all API route handlers

**Automated:** All tests should be automated and run in CI/CD pipeline
