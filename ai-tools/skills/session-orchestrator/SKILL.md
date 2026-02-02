---
name: session-orchestrator
description: Orchestrates isolated Claude sessions for parallel work execution. Manages worktrees, dispatches work sessions, monitors progress, surfaces questions, triggers review councils, and merges approved work.
allowed-tools: Bash, Read, Write
---

# Session Orchestrator

> ## 🤖 AGENTIC MODE ONLY
>
> **This skill is ONLY for Agentic execution mode.**
>
> | Mode | Use This Skill? |
> |------|-----------------|
> | 🤖 Agentic | ✅ YES - dispatch isolated sessions |
> | 🤝 Collaborative | ❌ NO - use @ mentions in current session |
> | 🎯 Direct | ❌ NO - user drives implementation |
>
> **Before using this skill, verify mode is Agentic.**

## Overview

This skill enables the main Claude session to act as an orchestrator that:
1. Dispatches work to isolated Claude sessions running in git worktrees
2. Monitors session progress and surfaces questions to the user
3. Waits for sessions to reach 'approved' status (reviews happen INSIDE each session)
4. Merges approved work back to main branch

## When to Use

Use this skill when:
- **Execution mode is AGENTIC** (check first!)
- Executing multiple Beads work items in parallel
- You want to preserve main session context (avoid filling context window)
- Work items are independent and can run in isolated environments

## Core Workflow

### Step 1: Query Ready Work Items

```bash
# Get unblocked work items from Beads
bd ready --json
```

### Step 2: Dispatch Sessions

For each ready work item, the orchestrator:

1. **Creates a git worktree**
```bash
# Created automatically by the orchestration scripts
# Located at .worktrees/<item-id>-<timestamp>
```

2. **Creates session buffer**
```bash
# Session state in workspace directory:
# ~/.amplify/workspaces/{hash}/instance-{uuid}/isolated-sessions/{session-id}/
#   - state.json (status, worktree, beads item)
#   - questions.json (questions from session)
#   - answers.json (answers from orchestrator)
#   - output.log (session output)
#   - summary.md (completion summary)
```

3. **Spawns isolated Claude session**
```bash
# Runs in background with:
claude -p "<work-prompt>" --dangerously-skip-permissions
# Working directory: the worktree
# Output: redirected to session buffer
```

### Step 3: Monitor Sessions

Poll session status periodically:

```bash
# Use the CLI to check status
npx amplify session status

# Or check individual session state
# Path: ~/.amplify/workspaces/{hash}/instance-{uuid}/isolated-sessions/{session-id}/
cat <session-dir>/state.json

# Tail session output
tail -f <session-dir>/output.log
```

### Step 4: Surface Questions

When a session needs user input:

```bash
# Session writes to questions.json:
{
  "id": "q-xxx",
  "question": "Which database should we use?",
  "options": ["PostgreSQL", "SQLite"],
  "context": "For the user preferences feature",
  "blocking": true
}
```

Orchestrator surfaces this to user, then writes answer:

```bash
# Write to answers.json:
{
  "questionId": "q-xxx",
  "answer": "PostgreSQL",
  "additionalContext": "Use existing connection pool"
}
```

### Step 5: Wait for Session Approval

Each isolated session runs BOTH implementation (Phase 1) AND review council (Phase 2) internally. The orchestrator does NOT trigger reviews.

**Check session status:**
```bash
# Session dir: ~/.amplify/workspaces/{hash}/instance-{uuid}/isolated-sessions/{session-id}/
cat <session-dir>/state.json | jq '.status'
# "running" → still working (Phase 1 or Phase 2)
# "approved" → ready for merge
# "rejected" → review failed
```

**When session reaches 'approved':**
```bash
# Read review decision
cat <session-dir>/review.json
# decision: "approved" | "rejected"
```

**IMPORTANT:** Do NOT spawn separate review sessions. Each isolated session handles its own review internally.

### Step 6: Merge Approved Work

```bash
# Orchestration handles:
# 1. Ensure worktree is clean (commit if needed)
# 2. Merge branch to main
# 3. Close Beads item
# 4. Cleanup worktree
# 5. Archive session files
```

## Using the CLI Commands

The main session orchestrates using CLI commands (not automated scripts):

```bash
# Dispatch all ready work items
npx amplify session dispatch-ready

# Check status of running sessions
npx amplify session status

# View specific session logs
npx amplify session logs <session-id>

# Approve a completed session
npx amplify session approve <session-id>

# Merge approved work (native git)
git merge --no-ff <worktree-branch>
bd close <beads-id> --reason "Merged"
```

The main session stays in control and makes decisions - there's no automated loop.

## Session Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Main Session (Orchestrator)                    │
│              Context: Clean & Summarized                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Work Session  │   │ Work Session  │   │ Work Session  │
│ (worktree A)  │   │ (worktree B)  │   │ (worktree C)  │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Review Council│   │ Review Council│   │ Review Council│
│ (same wt A)   │   │ (same wt B)   │   │ (same wt C)   │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Merge to     │
                    │  main branch  │
                    └───────────────┘
```

## Key Principles

1. **Main session stays clean** - Only summaries come back
2. **Beads drives parallelism** - Dependency graph determines what can run
3. **Worktrees provide isolation** - Each session works on its own branch
4. **Review is mandatory** - All work goes through peer + tech-lead review
5. **Review can fix** - Council has modification powers to ensure quality

## Responsibility Split (Agentic Mode)

> **CRITICAL: Understand who does what in Agentic mode.**

| Step | Who Does It | Where |
|------|-------------|-------|
| Implementation (Phase 1) | Isolated session | Worktree |
| Review Council (Phase 2) | Same isolated session | Same worktree |
| Merge to main | Main session (orchestrator) | Main repo |
| User status reports | Main session (orchestrator) | Main repo |

**Each isolated session runs BOTH implementation AND review. Main session only MERGES and REPORTS.**

The main session (orchestrator) does NOT:
- Write implementation code
- Perform technical tasks
- Do work that isolated sessions should do

## Reporting to User (After Dispatch)

> **Report on dispatched work. Don't do the work yourself.**

After dispatching sessions, the orchestrator should keep the user informed:

**When to report (on state transitions only):**
- After dispatch completes: "Dispatched 3 sessions to worktrees"
- When session is approved: "Session bd-xxx approved (review council passed), ready for merge"
- After merge: "Merged bd-xxx to main, 2 items now unblocked"

**Note:** Sessions run both implementation AND review internally. You won't see a separate "completed" state - sessions go from "running" directly to "approved" or "rejected".

**How to check status:**
```bash
npx amplify session status
```

**What NOT to do:**
- ❌ Implement code yourself because a session seems slow
- ❌ Skip dispatch and do work directly
- ❌ Engage agents via @ mentions (that's Collaborative mode)

## File Locations

| Location | Purpose |
|----------|---------|
| `~/.amplify/workspaces/{hash}/instance-{uuid}/isolated-sessions/` | Session coordination buffer |
| `.worktrees/` | Git worktrees (gitignored) |
| `scripts/orchestration/` | JavaScript implementation |

## Troubleshooting

### Session stuck in "running"
Check if process is alive:
```bash
# Session dir: ~/.amplify/workspaces/{hash}/instance-{uuid}/isolated-sessions/{session-id}/
cat <session-dir>/state.json | jq '.pid'
ps -p <pid>
```

### Questions not being answered
Ensure answers.json is valid JSON and questionId matches.

### Merge conflicts
Review council should resolve. If not, conflicts appear in merge result.
