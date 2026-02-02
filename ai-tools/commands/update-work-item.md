# Update Work Item Command

**Intended For:** Agent
**Primary User:** All agents
**Purpose:** Update progress, status, or details of an active work item in Beads
**Triggers:** Progress updates, status changes, blocker reports

## Instructions

You are updating an existing work item using Beads. Follow this process:

1. **Locate Work Item:**
   ```bash
   # Find work item by ID
   bd show bd-abc --json

   # List all open work items
   bd list --status open --json

   # List in-progress work items
   bd list --status in_progress --json
   ```

2. **Determine Update Type:**
   - **Status change:** `open` → `in_progress` → `closed`
   - **Description update:** Add progress notes or details
   - **Priority change:** Adjust urgency
   - **Add dependency:** Link to blocking work

3. **Make Updates with Beads:**

   ```bash
   # Change status to in_progress (claim work)
   bd update bd-abc --status in_progress --json

   # Update description with progress
   bd update bd-abc -d "Progress: API endpoints implemented. Next: Frontend integration." --json

   # Change priority
   bd update bd-abc -p 1 --json

   # Add blocking dependency
   bd dep add bd-blocker bd-abc --type blocks
   ```

4. **Report Blockers:**
   If blocked, add a dependency and update description:
   ```bash
   # Add blocking dependency
   bd dep add bd-blocker bd-abc --type blocks

   # Update description with blocker details
   bd update bd-abc -d "BLOCKED: Waiting for schema approval from @database-engineer. Cannot proceed with API implementation." --json
   ```

5. **Verify Update:**
   ```bash
   bd show bd-abc --json
   ```

## Beads Command Reference

```bash
# Update status
bd update <id> --status <status> --json
# Status options: open, in_progress, closed

# Update description
bd update <id> -d "new description" --json

# Update priority
bd update <id> -p <0-4> --json

# Update title
bd update <id> -t "new title" --json

# Add dependency
bd dep add <blocker-id> <blocked-id> --type blocks

# Remove dependency
bd dep remove <blocker-id> <blocked-id>

# View dependencies
bd dep tree <id>
```

## Status Workflow

```
open → in_progress → closed
         ↓
     (blocked via dependency)
```

- **open:** Not yet started, available for work
- **in_progress:** Actively being worked on
- **closed:** Work complete (use `/close-work-item`)

## Update Patterns

### Claiming Work (Start Working)
```bash
bd update bd-abc --status in_progress --json
bd update bd-abc -d "Started implementation. Setting up development environment." --json
```

### Progress Update
```bash
bd update bd-abc -d "Progress:\n- Completed API endpoint implementation\n- Unit tests passing\n- Next: Frontend integration" --json
```

### Reporting Blocker
```bash
# Add the blocking dependency
bd dep add bd-schema bd-api --type blocks

# Update description with blocker info
bd update bd-api -d "BLOCKED: Waiting for bd-schema (database schema) to complete. Cannot proceed with API implementation until schema is finalized." --json
```

### Priority Escalation
```bash
# Escalate to P0 (critical)
bd update bd-abc -p 0 --json
bd update bd-abc -d "ESCALATED TO P0: Customer-facing bug affecting 50% of users." --json
```

### Reassignment
```bash
bd update bd-abc -d "Reassigned from @frontend-engineer to @backend-engineer due to technical complexity. Frontend work completed, API implementation needed." --json
```

## Usage Examples

### Example 1: Start Work
```bash
bd update bd-auth.1 --status in_progress --json
bd update bd-auth.1 -d "Started: Creating user schema migration. Reviewing requirements and design docs." --json
```

### Example 2: Report Progress
```bash
bd update bd-auth.2 -d "Progress:\n- JWT authentication implemented\n- Login/logout endpoints working\n- Token refresh endpoint complete\n- Next: Add password reset flow" --json
```

### Example 3: Report Blocker
```bash
# Add dependency showing what's blocking
bd dep add bd-auth.1 bd-auth.2 --type blocks

# Update with blocker details
bd update bd-auth.2 -d "BLOCKED by bd-auth.1 (schema migration). Waiting for @database-engineer to complete schema. ETA: Tomorrow." --json
```

### Example 4: Mark Ready for Review
```bash
bd update bd-auth.3 -d "READY FOR REVIEW:\n- Implementation complete\n- PR submitted: #123\n- Unit tests passing\n- Requesting code review from @tech-lead" --json
```

### Example 5: Add Discovered Work
```bash
# Create new work item discovered during implementation
bd create "Add rate limiting to auth API" -t task -p 2 --json
# Returns: bd-rate123

# Link as discovered-from dependency
bd dep add bd-auth.2 bd-rate123 --type discovered-from
```

## Notes for Agents

- **All agents:** Update work items regularly (at least when status changes)
- **@work-orchestrator:** Monitor updates to track project progress
- **Engineers:** Update when you start work, hit blockers, or complete milestones
- **@qa-engineer:** Update when testing starts, bugs found, or testing complete

## Best Practices

1. **Update frequently:** Provide visibility to the team
2. **Be specific:** Clear progress descriptions help coordination
3. **Document blockers immediately:** Don't let impediments sit undocumented
4. **Use dependencies:** Link blockers properly so `bd ready` works correctly
5. **Include context:** Next steps, blockers, and ETA in descriptions

## Dependency Types

| Type | Usage | Example |
|------|-------|---------|
| `blocks` | This item must complete before another can start | Schema blocks API |
| `related` | Items are related but not blocking | Bug and its hotfix |
| `parent` | Parent-child relationship | Epic and its tasks |
| `discovered-from` | Found during work on another item | Tech debt discovered |

```bash
bd dep add <source> <target> --type <type>
```

## Verifying Updates

```bash
# Show updated work item
bd show bd-abc --json

# Check dependency tree
bd dep tree bd-abc

# Verify what's ready
bd ready --json
```
