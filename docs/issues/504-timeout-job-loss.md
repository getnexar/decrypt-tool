# Issue: 504 Timeout & Job Loss in Production

**Status:** Open
**Severity:** Medium
**Date:** 2026-02-05

## Problem

In production (Cloud Run), the `process-next` endpoint sometimes exceeds the 60-second request timeout, causing:

1. **504 Gateway Timeout** - Cloud Run terminates long-running requests
2. **Instance restart** - After timeouts, Cloud Run may scale down or restart the instance
3. **404 Job not found** - New instance has empty in-memory job store

## Root Cause

Jobs are stored in an in-memory `Map<string, Job>` (`src/lib/job-store.ts`). This state doesn't survive instance restarts.

```
User starts job → Instance A stores job in memory
Request times out (504) → Instance A may restart
User retries → Instance B has no knowledge of job → 404
```

## Error Logs

```
/api/jobs/{id}/process-next - 504 Gateway Timeout (multiple)
/api/jobs/{id}/process-next - 404 Not Found
ApiError: Job not found
```

## Local vs Production

- **Local:** Works fine (no timeouts, instance never restarts)
- **Production:** Fails under load or with large files

## Potential Fixes

### Option A: Increase Timeout (Quick Fix)

Increase Cloud Run timeout from 60s to 300s.

**Pros:**
- Fast to implement (config change)
- Reduces timeout frequency

**Cons:**
- Doesn't solve job loss on instance restarts
- Just delays the problem for very large jobs

**Implementation:**
- Update `nexar.yaml` or Cloud Run settings

---

### Option B: Smaller Batches + Client Recovery (Recommended)

Reduce batch size and add client-side recovery logic.

**Changes:**
1. Reduce batch from 3 files to 1 file per request
2. Add retry with exponential backoff on 504
3. On "job not found" (404), recreate job from client state
4. Skip files already in destination (existing dedup logic)

**Pros:**
- Works within timeout limits
- Client has all info needed to recover (file list, key)
- No new infrastructure
- Graceful degradation

**Cons:**
- More HTTP requests
- Slightly slower throughput

---

### Option C: Persistent Storage (Firestore)

Move job store from in-memory to Firestore.

**Changes:**
1. Add Firestore dependency
2. Replace `Map<string, Job>` with Firestore collection
3. Update all job-store functions to use Firestore

**Pros:**
- Full persistence across instance restarts
- True resumability (close browser, resume next day)
- Scales better

**Cons:**
- New dependency and complexity
- Overkill if resumability isn't critical
- Additional latency for job operations

---

## Recommendation

**Option B** is recommended for medium resumability needs:
- No new infrastructure
- Client-side recovery leverages existing duplicate detection
- Works within Cloud Run's timeout constraints

## Files Involved

- `src/lib/job-store.ts` - In-memory job storage
- `src/app/api/jobs/[id]/process-next/route.ts` - Batch processing endpoint
- `src/hooks/useDecryptJob.ts` - Client-side processing loop
