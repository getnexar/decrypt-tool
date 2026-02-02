# Project Overview - Decrypt Tool

## Purpose

A NAP web application that decrypts encrypted Nexar dashcam video files from Google Drive.

## Status

**Phase:** Implementation Complete, Ready for Testing & Deployment

## Key Documents

- **Design Document:** `docs/plans/2026-02-02-decrypt-tool-design.md`
- **Domain Knowledge:** `.claude/agent-context/domain-knowledge.md`

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Nexar Design System

## Key Features

1. **Input Form**
   - GDrive folder link
   - 32-char hex decryption key
   - Destination choice (same folder / different folder)

2. **Progress Tracking**
   - Progress bar with "File X of Y"
   - Current file name display

3. **Results & Logging**
   - Success/failure summary with badges
   - Filterable execution log (All / Success / Failed)
   - CSV export of full log
   - Retry failed files

## Architecture

```
User → Web UI → API Routes → GDrive API + Decrypt Engine
                    ↓
              Cloud Storage (temp files)
```

## Team

- Solo developer project

## Related Resources

- Video recovery reference: `/Users/naama/Workspace/nursery/video-recovery/`
- Nexar Design System: See CLAUDE.md in project root
