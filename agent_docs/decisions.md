# Architecture Decisions

## ADR-001: Pure Python/JS Implementation

**Status:** Accepted
**Date:** 2026-02-02

**Context:** The video-recovery tool uses a C library for XOR decryption. NAP deployment doesn't easily support native binaries.

**Decision:** Implement decryption in pure Python with NumPy optimization.

**Consequences:**
- Slightly slower than C (~2x) but acceptable
- Simpler deployment
- Easier maintenance

---

## ADR-002: Polling vs WebSocket for Progress

**Status:** Accepted
**Date:** 2026-02-02

**Context:** Need to show real-time progress during file processing.

**Decision:** Use polling (2-second intervals) for MVP.

**Consequences:**
- Simpler implementation
- Slightly higher server load
- Future consideration: SSE or WebSocket for real-time updates
