# Execute Work Command

**Intended For:** 👤 Human
**Primary User:** Product Owner, Project Lead, or any human overseeing work execution
**Purpose:** Automatically dispatch work items to agents in parallel based on approved PRDs and work breakdowns
**Triggers:** After PRD/spec approval, when ready to begin automated parallel execution

---

> ## 🎛️ EXECUTION MODE CHECK
>
> This command's behavior depends on the current **execution mode**:
>
> | Mode | Behavior |
> |------|----------|
> | 🤖 **Agentic** | Full auto-dispatch parallel sessions |
> | 🤝 **Collaborative** | Execute in current session with @ mentions (Recommended) |
> | 🎯 **Direct** | User drives - suggest but don't auto-execute |
>
> **ALWAYS query mode at execution start:**
>
> ```
> 📋 Ready to execute work.
>
> How would you like to proceed?
>
> 1. 🤖 Agentic      - I'll dispatch parallel sessions automatically
> 2. 🤝 Collaborative - We work together in this session (Recommended)
> 3. 🎯 Direct       - You drive, I assist
>
> Enter choice (1/2/3):
> ```
>
> **Wait for user response before proceeding.**
>
> **In Collaborative/Direct mode:**
> - Do NOT auto-dispatch sessions
> - Do NOT auto-create Beads items
> - Work with user in current session

---

> ## ⚡ ISOLATED SESSION ORCHESTRATION (v6.3) [AGENTIC MODE]
>
> This command uses **isolated sessions** instead of Task tool subagents:
>
> | Traditional (@agent → Task tool) | Isolated Sessions (v6.3) |
> |----------------------------------|--------------------------|
> | Subagents fill main context | Main context stays clean |
> | Limited parallelism | Unlimited parallel sessions |
> | Context bleeds across tasks | Complete isolation |
> | No real-time visibility | Logs in workspace session directory |
>
> **How it works:**
> 1. Creates git worktree per work item
> 2. Spawns `claude --dangerously-skip-permissions` in worktree
> 3. Session runs Phase 1 (implementation) → marks as 'completed'
> 4. Session automatically continues to Phase 2 (review council) → marks as 'approved' or 'rejected'
> 5. Orchestrator merges approved work to main and closes Beads
>
> **Key:** The isolated session runs BOTH phases. The orchestrator does NOT trigger reviews.
>
> **CLI Entry Point:**
> ```bash
> node bin/amplify.js session dispatch-ready   # Dispatch all ready items
> node bin/amplify.js session status           # Monitor sessions (wait for 'approved')
> node bin/amplify.js session merge            # Merge approved work
> ```

---

---

## Overview

The `/execute-work` command bridges the gap between planning and execution. It engages the @work-orchestrator to query **existing Beads work items** (created by `/start` or `/plan-execution`) and dispatch work to multiple agents simultaneously—maximizing parallel execution and minimizing delivery time.

**Key Workflow:**
1. `/start` or `/plan-execution` → @tech-lead creates Beads work items directly
2. `/execute-work` → @work-orchestrator queries Beads, dispatches agents in parallel

**Key Benefits:**
- ⚡ **Parallel Execution**: Dispatches work to multiple agents at once
- 🎯 **Smart Dependencies**: Automatically identifies and respects work dependencies
- 🔄 **Multi-Project Support**: Can orchestrate multiple projects concurrently
- 📊 **Real-Time Status**: Provides live progress updates and blocker detection
- 🤖 **Automated**: Minimal human intervention after initial trigger
- 🔍 **Peer Review**: Mandatory council review ensures quality before QA
- ✅ **Epic Validation**: PM functional sign-off at epic completion

---

## When to Use

Use `/execute-work` when:
- ✅ Project PRD or request spec is approved
- ✅ Technical feasibility is confirmed
- ✅ Ready to begin active implementation
- ✅ Want to maximize parallel agent execution
- ✅ Need to execute multiple projects simultaneously

**Don't use when:**
- ❌ PRD/spec not yet approved
- ❌ Technical assessment incomplete
- ❌ Major blockers or open questions remain
- ❌ Still in discovery or planning phase

---

## Usage

```bash
# Execute single project
/execute-work project:[project-name]

# Execute single request
/execute-work request:[request-id]

# Execute all approved projects in parallel
/execute-work all

# Execute multiple specific projects in parallel
/execute-work projects:[project-1],[project-2],[project-3]

# Resume execution after resolving blockers
/execute-work resume project:[project-name]
```

---

## How It Works

### Phase 0: Ensure Amplify Operating Principles [MANDATORY]

**Check if `.claude/CLAUDE.md` contains Amplify operating principles:**

1. **Check if `.claude/CLAUDE.md` exists:**
   - If NO:
     1. Create `.claude/CLAUDE.md` with content from `templates/agent-context/amplify-operating-principles.md`
     2. **STOP IMMEDIATELY**
     3. Inform user:
        ```
        ⚠️ CLAUDE.md file has been created with Amplify operating principles.

        Please restart your Claude Code session and re-run /execute-work to continue.

        This ensures the Amplify delegation and parallelism principles are active.
        ```
     4. Do NOT proceed with work execution

   - If YES:
     1. Read `.claude/CLAUDE.md` and check if it contains both:
        - "Agent Delegation Protocol [MANDATORY]" section
        - "Unlimited Parallelism Principle [MANDATORY]" section
     2. If BOTH sections are present: Continue to Phase 1
     3. If either section is missing:
        1. Append the missing content from `templates/agent-context/amplify-operating-principles.md`
        2. **STOP IMMEDIATELY**
        3. Inform user:
           ```
           ⚠️ CLAUDE.md file has been updated with Amplify operating principles.

           Please restart your Claude Code session and re-run /execute-work to continue.

           This ensures the Amplify delegation and parallelism principles are active.
           ```
        4. Do NOT proceed with work execution

**Why This Matters:** The operating principles in CLAUDE.md ensure maximum parallel execution and proper agent delegation. These principles must be loaded at session start, so a restart is required after CLAUDE.md is created or updated.

---

### Phase 1: Query Existing Beads Items

**Work items are already created by `/start` or `/plan-execution`.** This phase verifies they exist and analyzes dependencies.

1. **Query Beads for Project Work Items:**
   ```bash
   # Find the project epic
   bd list --type feature --json | jq '.[] | select(.title | contains("[project-name]"))'
   # → Returns: bd-[hash] (e.g., bd-auth)

   # List all child work items
   bd list --parent bd-[hash] --json
   # → Shows all tasks with status, priority, dependencies
   ```

2. **Verify Work Items Exist:**
   ```bash
   # Check items exist
   bd list --json
   # Should show project epic and child tasks

   # Verify dependencies are configured
   bd dep tree bd-[hash]
   # Should show dependency relationships

   # Check for ready work
   bd ready --json
   # Should return items with no blockers
   ```

   ⛔ **STOP if verification fails:**
   - If `bd list` shows no items → Run `/start` or `/plan-execution` first
   - If `bd ready` returns empty but items exist → Check dependencies with `bd dep tree`
   - If items are missing → @tech-lead must create them with `bd create`

3. **Load Context from Memory Bank:**

   > **Context Discipline:** Check `agent_docs/index.md` first to discover relevant files. Load only what's needed for the specific project being executed.

   - Read PRD from `agent_docs/projects/[project-name]/prd.md` (context for agents)
   - Read implementation plan from `implementation-plan.md` (understanding architecture)
   - Review technical assessment for risks and considerations (if exists)

### Phase 2: Dispatch (Isolated Session Orchestration)

> ## 🤖 AGENTIC MODE ONLY
>
> **This entire phase applies ONLY when execution mode is AGENTIC.**
>
> - If mode is **Collaborative**: Skip this phase. Use @ mentions in current session instead.
> - If mode is **Direct**: Skip this phase. User drives implementation.
> - If mode is **Agentic**: Continue with dispatch below.
>
> **Check mode first:** If unsure, ask user or check `ai-tools/settings.json`.

> **CRITICAL: Use isolated sessions, NOT @agent mentions or Task tool.**
>
> ⚠️ **DO NOT use Task tool or @agent mentions.** These fill the main context.
> ⚠️ **DO NOT implement work yourself.** You are the orchestrator, not implementer.
> ✅ **DO use `amplify session` CLI commands.** These run in isolated processes.
>
> Isolated sessions run in git worktrees with their own Claude process.
> This keeps the main session context clean and enables true parallelism.

4. **Run Automated Orchestration:**
   ```bash
   # RECOMMENDED: Run full automated orchestration (dispatch, monitor, review, merge)
   node bin/amplify.js session execute

   # This command automatically:
   # - Queries bd ready for unblocked work items
   # - Creates git worktrees for each item
   # - Spawns isolated Claude sessions
   # - Monitors progress and handles completion
   # - Triggers review sessions
   # - Merges approved work back to main
   # - Loops until all work is complete
   ```

   The `execute` command handles the entire lifecycle automatically.
   You should run this and let it complete, only intervening if:
   - Questions are raised that need human input
   - Errors occur that need investigation
   - The timeout (2 hours) is reached

5. **Alternative: Manual Step-by-Step (Advanced):**

   If you need finer control, use individual commands:
   ```bash
   # Dispatch all ready items
   node bin/amplify.js session dispatch-ready

   # Monitor status (sessions run implementation + review internally)
   node bin/amplify.js session status

   # After sessions reach 'approved' status, merge
   node bin/amplify.js session merge
   ```

   **Note:** There is no `amplify session review` command. Each isolated session runs its own review council (Phase 2) automatically after implementation (Phase 1).

   Each dispatch:
   - Creates a git worktree at `.worktrees/<beads-id>/`
   - Creates session buffer in workspace session directory
   - Spawns `claude --dangerously-skip-permissions` in the worktree
   - Session runs Phase 1 (implementation) then Phase 2 (review council)
   - Returns immediately (session runs in background)

6. **Monitor Sessions:**
   ```bash
   # Check status of all sessions
   node bin/amplify.js session status

   # Check for pending questions (sessions may be blocked)
   node bin/amplify.js session questions

   # Answer a blocking question
   node bin/amplify.js session answer <session-id> <question-id> "<answer>"
   ```

   **IMPORTANT**: Monitor for questions regularly. Blocking questions hold up sessions.

7. **[AGENTIC] Reporting Progress to User:**

   > **After dispatching sessions**, report their status to the user.
   >
   > This is REPORTING, not DOING. You have already dispatched - now you inform.

   **When to report (state transitions only):**
   - After dispatch completes: "Dispatched 3 sessions to worktrees"
   - When session completes Phase 1: "Session bd-xxx completed implementation"
   - When session completes Phase 2: "Session bd-xxx approved by review council, ready for merge"
   - After merge: "Merged bd-xxx to main, 2 items now unblocked"

   **Example status report:**
   ```
   📊 Orchestration Status (Agentic Mode)

   Dispatched: 3 sessions running in isolated worktrees
   - bd-auth.1: running (Phase 1 - implementation)
   - bd-auth.2: running (Phase 2 - review council)
   - bd-auth.3: approved (ready for merge)

   Merged: 0 | Pending: 8

   Monitoring for questions and approved sessions...
   ```

   **Keep output minimal:** Don't dump raw JSON. Summarize state transitions.

8. **Question Monitoring Loop (Recommended):**

   While orchestration runs, you should poll for pending questions and surface them to the user:

   ```
   WHILE orchestration is running:
     1. Check for pending questions:
        node bin/amplify.js session questions --json

     2. IF questions exist:
        - Parse the JSON output
        - For EACH question:
          a. Use AskUserQuestion tool to surface the question to user
          b. Get user's answer
          c. Write answer:
             node bin/amplify.js session answer <session-id> <question-id> "<answer>"

     3. Sleep 10-15 seconds

     4. Check orchestration status:
        node bin/amplify.js session status
        - If all sessions completed → exit loop
   ```

   **Question Timeout Behavior:**

   Work sessions have configurable timeout for questions:
   - `AMPLIFY_QUESTION_TIMEOUT_MS` - Default 300000 (5 minutes)
   - `AMPLIFY_QUESTION_AUTO_RESUME` - Default true (proceed with best judgment)

   If a question times out and auto-resume is enabled, the work session will proceed
   with its best judgment. Monitor the output logs to see what decisions were made.

   **Example Question Flow:**
   ```bash
   # 1. Poll for questions
   node bin/amplify.js session questions --json
   # Output:
   # [
   #   {
   #     "id": "q-1735768840",
   #     "sessionId": "session-test63-10-5qe-mjvznquz-xhjpar",
   #     "question": "Which database should we use for user data?",
   #     "options": ["PostgreSQL", "SQLite", "MongoDB"],
   #     "context": "The work item requires persistent storage for user profiles.",
   #     "blocking": true
   #   }
   # ]

   # 2. Surface to user via AskUserQuestion tool
   # 3. Get answer: "PostgreSQL"

   # 4. Submit answer
   node bin/amplify.js session answer session-test63-10-5qe-mjvznquz-xhjpar q-1735768840 "PostgreSQL"
   ```

### Phase 3: Review Council [INSIDE ISOLATED SESSION - NOT ORCHESTRATOR]

> ## 🤖 AGENTIC MODE ONLY
>
> This phase applies only in **Agentic** mode. In other modes, review happens differently:
> - **Collaborative**: Review in current session before completion
> - **Direct**: User-initiated review

> **Responsibility Split (Agentic Mode):**
>
> | Step | Who | Where |
> |------|-----|-------|
> | Implementation (Phase 1) | Isolated session | Worktree |
> | Review Council (Phase 2) | Same isolated session | Same worktree |
> | Merge to main | Main session (orchestrator) | Main repo |
>
> **Key:** The isolated session runs BOTH implementation AND review. The orchestrator ONLY merges.

**CRITICAL: The orchestrator does NOT trigger reviews. Each isolated session runs its own review council automatically.**

8. **How Review Works Inside the Isolated Session:**

   After implementation completes (Phase 1), the session wrapper automatically continues to Phase 2:

   The isolated session spawns a review council via Task tool:
   1. Implementer agent presents and defends the work
   2. Peer reviewer agent independently examines the code
   3. If consensus: session marks itself 'approved'
   4. If disagreement: escalates to @tech-lead for binding decision
   5. @tech-lead can fix issues directly
   6. Session marks itself 'approved' or 'rejected'

   **The review council runs INSIDE the isolated session, not in a separate session.**

9. **Monitor for Approved Sessions:**

   ```bash
   # Check for sessions that completed review
   node bin/amplify.js session status
   # → Shows sessions with status: 'approved' (ready to merge)
   ```

   **There is no `amplify session review` command.** Reviews happen automatically.

10. **Review Outcomes:**

   | Decision | Meaning | Next Step |
   |----------|---------|-----------|
   | `approved` | Review council approved | Orchestrator merges |
   | `rejected` | Review council rejected | Re-dispatch work session |

   **Key principle**: Review council (inside isolated session) FIX issues rather than just reporting them.

### Phase 4: Merge Approved Work (Main Session)

> **===== MERGE SIMPLIFICATION (v6.3) =====**
>
> Merging now happens in the **main session** (this session) rather than
> in dispatched background sessions. This provides full context for
> intelligent conflict resolution via agents.

10. **Collect Approved Sessions:**

    After orchestration completes, the results include `readyForMerge` array:
    ```javascript
    // From orchestrator executeWork() return value
    results.readyForMerge = [
      {
        sessionId: 'session-xyz-123',
        beadsItemId: 'bd-auth.1',
        worktreePath: '/path/to/.worktrees/bd-auth.1-abc123',
        worktreeBranch: 'amplify/bd-auth.1-abc123',
        baseBranch: 'main',
        agentType: 'backend-engineer',
        summary: 'Implemented auth API with JWT tokens'
      },
      // ... more approved sessions
    ]
    ```

11. **Merge Each Approved Session:**

    For each session in `readyForMerge`:

    ```bash
    # Step 1: Ensure worktree changes are committed
    cd <worktreePath>
    git status --porcelain
    # If uncommitted changes:
    git add -A && git commit -m "chore: auto-commit before merge"

    # Step 2: Attempt merge
    git checkout main
    git merge <worktreeBranch> --no-ff -m "Merge <beadsItemId>: <summary>"
    ```

    **If merge succeeds:**
    ```bash
    # Close Beads item
    bd close <beadsItemId> --reason "<summary>"

    # Cleanup worktree
    git worktree remove <worktreePath> --force

    # Cleanup session
    # (orchestrator handles this automatically)
    ```

12. **Handle Merge Conflicts (Agent Resolution):**

    If merge fails due to conflicts, engage agents **in this main session**:

    ```markdown
    ## Conflict Resolution Task

    Work Item: <beadsItemId> - <title>
    Original Agent: @<agentType>
    Conflicting Files: <list of conflicted files>

    ### Context
    - Worktree branch: <worktreeBranch>
    - Base branch: <baseBranch>
    - Work summary: <summary>

    ### Your Changes (from worktree):
    [git diff <baseBranch>...<worktreeBranch>]

    ### Incoming Changes (from main):
    [git diff <worktreeBranch>...main]

    ### Instructions
    1. Resolve conflicts maintaining intent of both changes
    2. Commit the resolution
    3. Run tests to verify resolution
    4. Report outcome
    ```

    **Agent engagement pattern:**
    - Engage original agent type (e.g., @backend-engineer)
    - Always include @tech-lead for oversight
    - Use Task tool with full context

    **If agents successfully resolve:**
    - Retry merge
    - Continue with cleanup

    **If agents cannot resolve (rare):**
    - Surface to user with full context
    - User decides: manual fix, skip, or abort

13. **Unlock Next Wave:**
    ```bash
    # Query for newly unblocked items
    bd ready --json
    # → Items that depended on just-merged work are now ready

    # If more items ready, continue orchestration
    node bin/amplify.js session dispatch-ready
    ```

> **Why Main Session Merge?**
> - Full conversation context for intelligent conflict resolution
> - Agents can be engaged with complete project understanding
> - No polling gaps or state drift
> - Deterministic merge order

### Phase 5: Completion & Epic Validation

10. **Close Work Item:**
   ```bash
   bd close bd-[id] --reason "[completion summary]" --json
   ```
   - Closing automatically unblocks dependent work
   - Update `agent_docs/current-work.md`

11. **Detect Epic Completion (PM Validation Trigger):**

   When closing any work item, check for epic completion:
   ```bash
   # Get parent epic ID
   bd show <work-item-id> --json | jq '.parent'

   # Check if ALL sibling work items are closed
   bd list --parent <epic-id> --json | jq '[.[] | select(.status != "closed")] | length'
   ```

   **If ALL siblings closed (count = 0):**
   ```
   All work items in epic [epic-id] complete.
   Triggering @product-manager functional validation.

   @product-manager: Please validate epic [epic-name]:
   - Requirements match specification
   - User experience is correct
   - Edge cases handled properly
   - Acceptance criteria met

   This is functional validation only (not technical review).
   ```

   PM validates and either:
   - **APPROVED:** Epic can be closed
   - **NEEDS_WORK:** Specific issues identified, create follow-up work items

### Phase 6: Active Management

12. **Real-Time Coordination:**
   ```bash
   # Monitor active work
   bd list --status in_progress --json

   # Check for ready work (newly unblocked)
   bd ready --json
   ```
   - Monitor work item progress across all agents
   - Detect blockers and escalate immediately
   - Closing work items automatically unblocks dependent work
   - Update `agent_docs/current-work.md` continuously

13. **Status Reporting:**
   ```bash
   # Overall project status
   bd list --json | jq 'group_by(.status)'

   # Dependency visualization
   bd dep tree bd-[project-hash]
   ```
   - Provide progress updates to human
   - Flag blockers requiring human intervention
   - Report completion of work waves
   - Notify on project milestones

---

## Execution Patterns

### Pattern 1: Full-Stack Feature (Single Project)

```bash
/execute-work project:user-authentication

# Work Orchestrator analyzes PRD and creates Beads work items:

# Step 1: Create epic and tasks in Beads
bd create "User Authentication" -t feature -p 1 --json
# → bd-auth

bd create "Create user schema" --parent bd-auth --json      # → bd-auth.1
bd create "Design auth UI mockups" --parent bd-auth --json  # → bd-auth.2
bd create "Create test plan" --parent bd-auth --json        # → bd-auth.3
bd create "Implement auth API" --parent bd-auth --json      # → bd-auth.4
bd create "Implement login UI" --parent bd-auth --json      # → bd-auth.5
bd create "Execute integration tests" --parent bd-auth --json # → bd-auth.6

# Step 2: Add dependencies
bd dep add bd-auth.1 bd-auth.4 --type blocks  # schema → API
bd dep add bd-auth.4 bd-auth.5 --type blocks  # API → UI
bd dep add bd-auth.5 bd-auth.6 --type blocks  # UI → tests

# Step 3: Query ready work and dispatch
bd ready --json
# → Returns: [bd-auth.1, bd-auth.2, bd-auth.3] (no blockers)

# Wave 1 (Parallel - No Dependencies):
→ bd update bd-auth.1 --status in_progress
→ @database-engineer: bd-auth.1 (Create user schema)
→ bd update bd-auth.2 --status in_progress
→ @frontend-engineer: bd-auth.2 (Design auth UI mockups)
→ bd update bd-auth.3 --status in_progress
→ @qa-backend: bd-auth.3 (Create test plan)

# Wave 1 completes, close items:
→ bd close bd-auth.1 --reason "Schema created with migrations"
→ bd close bd-auth.2 --reason "Mockups approved"
→ bd close bd-auth.3 --reason "Test plan documented"

# Wave 2 (After Wave 1):
bd ready --json  # → [bd-auth.4]
→ @backend-engineer: bd-auth.4 (Implement auth API)

# Wave 3 (After Wave 2):
bd ready --json  # → [bd-auth.5]
→ @frontend-engineer: bd-auth.5 (Implement login UI)

# Wave 4 (After Wave 3):
bd ready --json  # → [bd-auth.6]
→ @qa-backend: bd-auth.6 (Execute integration tests)

# Complete:
bd close bd-auth --reason "User authentication feature complete"
```

### Pattern 2: Multi-Project Execution (Parallel Projects)

```bash
/execute-work all

# Work Orchestrator analyzes all approved projects:
# - Project A: User dashboard (3 work items)
# - Project B: Export feature (2 work items)
# - Project C: Performance optimization (2 work items)

# Detects cross-project dependencies: NONE
# Executes all projects in parallel:

# Project A - Wave 1:
→ @database-engineer: Dashboard data aggregation queries
→ @frontend-engineer: Dashboard layout and components

# Project B - Wave 1 (Parallel with Project A):
→ @backend-engineer: Export API endpoints
→ @frontend-engineer: Export UI controls

# Project C - Wave 1 (Parallel with A & B):
→ @backend-engineer: API response caching
→ @database-engineer: Query optimization

# All projects progress simultaneously
# Agents work in unlimited parallel (no capacity constraints)
```

### Pattern 3: Dependency-Heavy Project

```bash
/execute-work project:ai-rag-feature

# Complex AI feature with many dependencies

# Wave 1 (Parallel - Foundation):
→ @ai-engineer: Design RAG architecture and prompt strategy
→ @database-engineer: Research vector database options
→ @qa-engineer: Define evaluation metrics (RAGAS, custom)

# Wave 2 (After architecture decided):
→ @database-engineer: Set up vector database and ingestion pipeline
→ @ai-engineer: Implement embeddings and chunking strategy
→ @backend-engineer: Design LLM API client interface

# Wave 3 (After data pipeline ready):
→ @ai-engineer: Implement retrieval and generation logic
→ @backend-engineer: Integrate LLM client with caching and rate limiting
→ @frontend-engineer: Design Q&A interface with streaming

# Wave 4 (After implementation):
→ @qa-engineer: Run evaluation suite and test edge cases
→ @ai-engineer: Iterate on prompts based on evaluation results

# Wave 5 (Final):
→ @qa-engineer: Final acceptance testing
→ @backend-engineer: Performance optimization based on metrics
```

---

## Multi-Agent Coordination

### Unlimited Agent Spawning

**CRITICAL**: Agents are AI processes, not humans. There are NO capacity constraints.

When multiple projects need the same agent type:

```
Project A needs @backend-engineer
Project B needs @backend-engineer
Project C needs @backend-engineer

Work Orchestrator response:
→ Spawn 3 @backend-engineer instances (one for each project)
→ All three work simultaneously in parallel
→ No queueing, no waiting, no resource contention

Result: All projects progress at maximum speed
```

**Key Principle**: NEVER queue work due to "agent availability" - agents are infinite and can be engaged simultaneously without limits.

### Cross-Project Dependencies

```bash
/execute-work projects:shared-api,dashboard,mobile-app

# Detected dependency: dashboard and mobile-app depend on shared-api

# Execution plan:
Wave 1: shared-api (blocking others)
Wave 2: dashboard AND mobile-app (parallel, both depend on Wave 1)

# Work Orchestrator creates explicit handoff:
shared-api → @backend-engineer completes API
  ↓ (handoff with API contract)
dashboard → @frontend-engineer (web) receives API spec
mobile-app → @frontend-engineer (mobile) receives API spec
```

---

## Work Item Structure (Beads)

Work items are tracked in Beads. Query with `bd show [id] --json`:

```json
{
  "id": "bd-auth.1",
  "title": "Create user schema",
  "type": "task",
  "status": "open",
  "priority": 2,
  "parent": "bd-auth",
  "created_at": "2025-01-12T10:30:00Z",
  "updated_at": "2025-01-12T10:30:00Z",
  "body": "Create user schema with email, password hash, created_at...",
  "dependencies": {
    "blocks": ["bd-auth.2"],
    "blocked_by": []
  }
}
```

**Status Mapping:**
- `open` → Queued / Ready for work
- `in_progress` → Being worked on by agent
- `closed` → Completed

**Priority Mapping:**
- 0 → P0 (Critical)
- 1 → P1 (High)
- 2 → P2 (Medium)
- 3 → P3 (Low)

**Dependency Tracking:**
- `bd dep add [from] [to] --type blocks` - Add blocking dependency
- `bd dep tree [id]` - View full dependency tree
- `bd ready --json` - Find all unblocked work

**Additional Context in Memory Bank:**
Work items reference documentation in the Memory Bank:
- PRD: `agent_docs/projects/[name]/prd.md`
- Requirements: `agent_docs/requirements/[req-id].md`
- Design: `agent_docs/designs/[design-id].md`

Beads handles work tracking; Memory Bank handles documentation.

---

## Status Monitoring

During execution, monitor progress with Beads commands:

```bash
# List all work items
bd list --json

# Check work in progress
bd list --status in_progress --json

# Check ready work (unblocked)
bd ready --json

# Check specific work item
bd show [item-id] --json

# View dependency tree
bd dep tree [project-id]
```

Or use Beads CLI for filtering:
```bash
bd list --status in_progress --json   # Active work
bd list --status blocked --json       # Blocked items
bd dep tree [project-id]              # Full dependency tree
```

Work Orchestrator provides real-time updates (via Beads):
```
[2025-01-13 10:30] Project: user-authentication (bd-auth)
  Wave 1: 3/3 complete ✅
    - bd-auth.1 (closed): Schema created
    - bd-auth.2 (closed): Mockups approved
    - bd-auth.3 (closed): Test plan done
  Wave 2: 2/2 in progress 🔄
    - bd-auth.4 @backend-engineer (in_progress)
    - bd-auth.5 @frontend-engineer (in_progress)
  Wave 3: 1/1 queued ⏳
    - bd-auth.6 (open, blocked by bd-auth.4, bd-auth.5)

  Blockers: None
  Ready work: bd ready → []
```

---

## Handling Blockers

If agents encounter blockers:

1. **Agent Reports Blocker:**
   ```bash
   /update-work-item [item-id] status:blocked reason:"[blocker description]"
   ```

2. **Work Orchestrator Detects Blocker:**
   - Updates work item status
   - Notifies human via status update
   - Re-routes dependent work if possible
   - Escalates to @tech-lead or @product-manager as needed

3. **Human Resolves Blocker:**
   ```bash
   # After resolving external blocker
   /execute-work resume project:[project-name]
   ```

4. **Work Orchestrator Resumes:**
   - Unblocks waiting work items
   - Dispatches next wave of work
   - Updates status and ETAs

---

---

## CRITICAL: Failure Handling [MANDATORY]

### Fail Closed, Not Open

**When isolated session dispatch or orchestration fails, you MUST NOT fall back to alternative execution methods.**

| ❌ FORBIDDEN Actions | ✅ REQUIRED Actions |
|---------------------|---------------------|
| Fall back to Task tool | Report the error to user |
| Implement work directly | Diagnose the root cause |
| Use @agent mentions | Fix the orchestration infrastructure |
| Skip the review gate | Re-attempt after fix |

### Why This Matters

The review gate exists for safety. When dispatch fails and you fall back to Task tool:
1. **No peer review** - Code merges without council approval
2. **No isolation** - Work pollutes main session context
3. **No audit trail** - Session buffer not populated
4. **No merge control** - Changes go directly to main

**This defeats the entire purpose of isolated session orchestration.**

### What To Do When Dispatch Fails

1. **DO NOT** attempt alternative execution methods
2. **DO** report the specific error to the user:
   ```
   ❌ DISPATCH FAILED

   Error: [specific error message]
   Work Item: [beads-item-id]

   The isolated session infrastructure encountered an error.
   DO NOT fall back to Task tool or direct implementation.

   To fix:
   1. Check Beads item exists: bd show [id] --json
   2. Check worktree created: ls -la .worktrees/
   3. Check session status: npx amplify session status
   4. Review session logs using: npx amplify session status [session-id]

   After fixing the infrastructure issue, re-run: /execute-work
   ```

3. **DO** help the user diagnose the root cause
4. **DO** wait for the infrastructure to be fixed before proceeding

### Common Failure Modes and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `BEADS_LOOKUP_FAILED` | Beads item doesn't exist | Create item with `bd create` |
| `BEADS_ITEM_INVALID` | Item missing title/id | Update item with `bd update` |
| `WORKTREE_NOT_FOUND` | Worktree creation failed | Check git status, clean working tree |
| `DISPATCH_VALIDATION_FAILED` | Missing required params | Check CLI invocation |
| `Session spawn failed` | Claude CLI error | Check `claude --version`, permissions |

---

## Best Practices

### 1. Approve Before Executing
Ensure PRDs and technical assessments are fully approved before running `/execute-work`. Changes mid-execution are costly.

### 2. Monitor Actively
Check `bd list --json` and `bd ready --json` regularly to catch blockers early. Early intervention prevents cascading delays.

### 3. Trust the Orchestrator
Let @work-orchestrator manage dependencies and sequencing. It has the full dependency graph and can optimize better than manual coordination.

### 4. Resolve Blockers Quickly
Blockers compound exponentially. A blocked database engineer can stall backend, frontend, and QA engineers downstream.

### 5. Use Multi-Project Execution Wisely
`/execute-work all` is powerful but requires monitoring multiple projects. Start with single-project execution until comfortable.

### 6. Leverage Parallel Patterns
Review the execution patterns above. The more parallelizable your work breakdown, the faster your delivery.

---

## Comparison: Manual vs. Automated Execution

### Manual Execution (Old Way)
```bash
# Human manually triggers each work item sequentially
/start-work-item item-1
[wait for completion]
/start-work-item item-2
[wait for completion]
/start-work-item item-3
[wait for completion]

Time: ~10-15 minutes per item = 30-45 minutes total
Parallelism: None
Human effort: High (constant monitoring)
```

### Automated Execution (New Way)
```bash
# Human triggers once, orchestrator handles everything
/execute-work project:feature-name

# Orchestrator dispatches all parallelizable work simultaneously
# Wave 1: Items 1, 2, 3 run in parallel
# Wave 2: Item 4 runs after Wave 1 completes

Time: ~10-15 minutes (fastest item from each wave)
Parallelism: Maximum (based on dependencies)
Human effort: Minimal (just monitor status)
```

**Result:** 3x faster delivery with less human overhead.

---

## Integration with Workflow

```bash
# Complete workflow from inception to delivery

# 1. Discovery and Planning
/start
# → Creates PRD with @product-manager discovery
# → @tech-lead provides technical assessment

# 2. Approval (Human decision point)
# → Review PRD and technical assessment
# → Approve to proceed

# 3. Automated Execution (NEW!)
/execute-work project:[name]
# → @work-orchestrator analyzes and dispatches
# → Agents work in parallel with dependency management
# → Real-time status updates

# 4. Monitoring (via Beads CLI)
bd list --json              # Check progress anytime
bd ready --json             # See unblocked work
bd list --status blocked    # Find blockers to resolve

# 5. Completion
# → @work-orchestrator notifies when all work complete
# → Project marked as completed
# → Ready for deployment
```

---

## Notes for Agents

### @work-orchestrator
This is YOUR command. When invoked:

**Work items already exist in Beads (created by `/start` or `/plan-execution`).** Your job is to dispatch, not create.

1. **Query existing Beads items:** `bd list --json` and `bd dep tree bd-[project]`
2. **Verify items exist:** If `bd list` shows no items, stop and ask user to run `/start` first
3. **Find ready work:** `bd ready --json` returns unblocked items
4. **Claim and dispatch:** `bd update <id> --status in_progress` before engaging agents
5. **Monitor progress:** `bd list --status in_progress --json`
6. **Close completed work:** `bd close <id> --reason "..."` when agents complete
7. **Provide status updates** to human regularly

**Only create Beads items if they're truly missing** (e.g., discovered work during execution).

### All Other Agents
When dispatched via `/execute-work`:
1. You'll receive a Beads work item ID (e.g., `bd-auth.1`)
2. Use `bd show <id> --json` to see work item details
3. Update progress with `bd update <id> -d "progress notes" --json`
4. Report blockers immediately with `/update-work-item`
5. When complete, orchestrator will close your item with `bd close`
6. Use `/handoff-work-item` for cross-agent collaboration

---

## Success Criteria

A successful `/execute-work` execution should result in:

- ✅ All work items dispatched with clear ownership
- ✅ Maximum parallel execution achieved based on dependencies
- ✅ Zero manual work item triggering required
- ✅ Real-time status visibility for human oversight
- ✅ Blockers detected and escalated immediately
- ✅ **Peer reviews completed** for all non-trivial work items
- ✅ **QA validation passed** before work item closure
- ✅ **PM functional validation** triggered at epic completion
- ✅ All work completed with quality gates met
- ✅ Project delivered faster than manual execution

---

## Examples

See the README for complete workflow examples showing `/execute-work` in action for various project types (full-stack features, AI implementations, bug fixes, etc.).
