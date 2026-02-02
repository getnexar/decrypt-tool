# Session Orchestrator Skill

**Intended For:** 🤖 Agent (Work Orchestrator)
**Purpose:** Dispatch work to isolated Claude sessions running in git worktrees
**Triggers:** When executing work items that require implementation

---

## Overview

This skill enables **isolated session orchestration** - dispatching work to separate Claude processes that run in their own git worktrees with full context isolation.

### Why Isolated Sessions?

| Traditional Approach | Isolated Sessions |
|---------------------|-------------------|
| `@agent` → Task tool subagent | Separate Claude process in worktree |
| Fills main session context | Main session stays clean |
| Limited parallelism | Unlimited parallel sessions |
| No real-time visibility | Logs in workspace session directory |
| Context bleeds across tasks | Complete isolation |

---

## When to Use

**USE isolated sessions when:**
- Executing Beads work items via `/execute-work`
- Multiple work items can run in parallel
- Work requires implementation (code changes)
- You need context isolation

**DO NOT use isolated sessions for:**
- Quick research or questions
- Reading files
- Simple commands
- Non-implementation tasks

---

## Core Commands

### Dispatch a Single Work Item

```bash
node bin/amplify.js session dispatch <beads-id> [agent-type]
```

Example:
```bash
node bin/amplify.js session dispatch bd-auth.1 backend-engineer
```

This will:
1. Create a git worktree at `.worktrees/<beads-id>/`
2. Create a session buffer in the workspace session directory
3. Spawn `claude --dangerously-skip-permissions -p "<prompt>"` in the worktree
4. Return immediately (session runs in background)

### Dispatch All Ready Items

```bash
node bin/amplify.js session dispatch-ready [project]
```

This queries `bd ready --json` and dispatches all unblocked items in parallel.

### Full Orchestration Loop

```bash
node bin/amplify.js session execute [project]
```

This runs the complete loop:
1. Query ready items
2. Dispatch parallel sessions
3. Monitor for questions
4. Trigger reviews on completion
5. Merge approved work
6. Query newly unblocked items
7. Repeat until done

---

## Monitoring

### Check Status

```bash
node bin/amplify.js session status
```

Shows:
- Active sessions
- Pending questions
- Sessions awaiting review
- Sessions ready to merge

### Check Specific Session

```bash
node bin/amplify.js session status <session-id>
```

### View Session Logs

```bash
# Session logs are in the workspace session directory
# Use `npx amplify session status <session-id>` to find the path
tail -f <session-dir>/output.log
```

### List Pending Questions

```bash
node bin/amplify.js session questions
```

---

## Answering Questions

Sessions can ask questions that block their progress. You must monitor and answer these.

### List Questions

```bash
node bin/amplify.js session questions
```

### Answer a Question

```bash
node bin/amplify.js session answer <session-id> <question-id> "<answer>"
```

Example:
```bash
node bin/amplify.js session answer session-bd-auth-xyz q-123 "Use bcrypt for password hashing"
```

The session will poll for answers and continue when it receives one.

---

## Review Process

Review happens INSIDE the isolated session, not triggered by the orchestrator.

### How Review Works (Two-Phase Session)

Each isolated session runs TWO phases automatically:

**Phase 1: Implementation**
- Worker implements the requirements
- Marks session as 'completed'

**Phase 2: Review Council (same session, same worktree)**
- Session spawns implementer agent to present work
- Session spawns peer reviewer agent to independently review
- If consensus: session marks itself 'approved'
- If disagreement: escalates to @tech-lead for binding decision
- Session marks itself 'approved' or 'rejected'

**The orchestrator does NOT trigger reviews.** It only monitors for approved sessions and merges them.

### Review Council Behavior

The review council (spawned via Task tool inside the isolated session):
- Implementer presents and defends the work
- Peer reviewer independently examines code, tests, security
- If they agree: APPROVED
- If they disagree: @tech-lead arbitrates (can fix issues directly)
- Final verdict written to output.log as `REVIEW_VERDICT: APPROVED` or `REJECTED`

---

## Merging Approved Work

After review approval, the orchestrator merges using native git commands:

```bash
# 1. Get approved session info
npx amplify session status
# Look for sessions with status: approved

# 2. Merge the worktree branch to main
git merge --no-ff <worktree-branch> -m "Merge <beads-id>: <summary>"

# 3. Close Beads item
bd close <beads-id> --reason "Merged to main"

# 4. Clean up worktree
git worktree remove .worktrees/<beads-id>
```

---

## Session Lifecycle

```
DISPATCH (by orchestrator)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  ISOLATED SESSION (Two Phases in Same Session)          │
│                                                         │
│  PHASE 1: IMPLEMENTATION                                │
│  - Reads Beads item                                     │
│  - Implements in worktree                               │
│  - May ask questions → waits for answers                │
│  - Validates (tests, lint, build)                       │
│  - Writes summary.md                                    │
│  - Sets status = 'completed'                            │
│                                                         │
│  PHASE 2: REVIEW COUNCIL (automatic, same session)      │
│  - Spawns implementer agent to present work             │
│  - Spawns peer reviewer agent to independently review   │
│  - If disagreement: escalates to @tech-lead             │
│  - Tech-lead can fix issues directly                    │
│  - Writes review.json                                   │
│  - Sets status = 'approved' or 'rejected'               │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  MERGE (by orchestrator, after session is 'approved')   │
│  - git merge to main                                    │
│  - bd close with summary                                │
│  - Cleanup worktree and session                         │
└─────────────────────────────────────────────────────────┘
```

**Key:** The isolated session runs BOTH implementation AND review. The orchestrator does NOT spawn separate review sessions.

---

## File Locations

Session files are stored in the workspace directory structure:
`~/.amplify/workspaces/{projectHash}/instance-{uuid}/isolated-sessions/{sessionId}/`

| File | Path | Purpose |
|------|------|---------|
| Session state | `<session-dir>/state.json` | Current status, PID, timestamps |
| Questions | `<session-dir>/questions.json` | Session's blocking questions |
| Answers | `<session-dir>/answers.json` | Orchestrator's answers |
| Summary | `<session-dir>/summary.md` | Work session completion summary |
| Review | `<session-dir>/review.json` | Review decision |
| Output log | `<session-dir>/output.log` | Session stdout/stderr |
| Orchestrator state | `<instance-dir>/orchestrator.json` | Global session tracking |
| Worktree | `.worktrees/<beads-id>/` | Isolated git worktree |

---

## Integration with /execute-work

When `/execute-work` is invoked:

1. **Check Beads items exist**: `bd list --json`
2. **Query ready items**: `bd ready --json`
3. **For each ready item**:
   ```bash
   node bin/amplify.js session dispatch <beads-id> <agent-type>
   ```
4. **Monitor sessions** (each session runs implementation + review internally):
   ```bash
   node bin/amplify.js session status
   ```
5. **Answer questions** as they arise
6. **Wait for sessions to reach 'approved' status** (review happens automatically inside each session)
7. **Merge approved work** (using native git):
   ```bash
   git merge --no-ff <worktree-branch> -m "Merge <beads-id>: <summary>"
   bd close <beads-id> --reason "Merged to main"
   git worktree remove .worktrees/<beads-id>
   ```
8. **Query newly unblocked items**: `bd ready --json`
9. **Repeat** until no more work

**Note:** Step 6 does NOT involve running `amplify session review`. Each isolated session runs its own review council internally.

---

## Natural Language to Commands

When the user says... | Run this command
---------------------|------------------
"Start working on the project" | `node bin/amplify.js session execute project:name`
"Dispatch the auth work item" | `node bin/amplify.js session dispatch bd-auth.1`
"What's the status?" | `node bin/amplify.js session status`
"Any questions from the agents?" | `node bin/amplify.js session questions`
"Use PostgreSQL" (answering a question) | `node bin/amplify.js session answer <sid> <qid> "PostgreSQL"`
"Merge the approved work" | `node bin/amplify.js session merge`

**Note:** There is no "trigger review" command. Reviews happen automatically inside each isolated session.

---

## Error Handling

### Session Dies Unexpectedly

The orchestrator detects dead processes and marks sessions as failed:
```bash
node bin/amplify.js session cleanup
```

### Merge Conflicts

If merge fails due to conflicts:
1. Session is marked as failed with conflict details
2. You must resolve manually or re-dispatch

### Session Timeout

Sessions that run longer than 1 hour without activity are marked stale:
```bash
node bin/amplify.js session cleanup
```

---

## Best Practices

1. **Monitor actively** - Check status and questions regularly
2. **Answer quickly** - Blocking questions hold up work
3. **Let reviews fix** - Review sessions should fix issues, not just report them
4. **Trust the process** - Sessions are isolated and will complete on their own
5. **Check logs** - If something seems stuck, check the session's `output.log` file

---

## Example: Full Execution Flow

```bash
# User: "Let's build the authentication system"

# 1. Check ready work
node bin/amplify.js session dispatch-ready project:auth
# → Dispatches: bd-schema.1 (database-engineer), bd-backend-scaffold.1 (backend-engineer)

# 2. Monitor
node bin/amplify.js session status
# → 2 sessions running

# 3. Answer any questions
node bin/amplify.js session questions
# → "Should we use bcrypt or argon2?"
node bin/amplify.js session answer session-xyz q-123 "Use argon2"

# 4. Sessions complete, trigger review
node bin/amplify.js session review
# → Review sessions spawned

# 5. Reviews approve, merge
node bin/amplify.js session merge
# → Merged to main, Beads items closed

# 6. New items unblocked
node bin/amplify.js session dispatch-ready project:auth
# → Dispatches: bd-auth-api.1 (depends on schema + scaffold)

# Repeat until complete
```
