---
name: work-tracker
description: Internal work item management powered by Beads. Used by Work Orchestrator and execution commands.
internal: true
---

# Work Tracker Skill

## Purpose

Internal skill providing work item management for Amplify agents. This skill wraps Beads operations and maps Amplify terminology to Beads concepts.

**Users interact with standard Amplify commands** (`/execute-work`, etc.) and Beads CLI (`bd list`, `bd ready`) for status queries - this skill handles the backend integration with Beads.

---

## Terminology Mapping

| Amplify Term | Beads Term | Description |
|--------------|------------|-------------|
| Work Item | Issue | Core tracking unit |
| Project | Epic (parent issue) | Group of related work items |
| Work Breakdown | Child issues | `bd-abc.1`, `bd-abc.2`, etc. |
| Status: pending | Status: open | Not yet started |
| Status: in_progress | Status: in_progress | Being worked on |
| Status: completed | Status: closed | Done |
| Priority P0 | Priority 0 | Critical |
| Priority P1 | Priority 1 | High |
| Priority P2 | Priority 2 | Medium |
| Priority P3 | Priority 3 | Low |
| Dependency | `bd dep` relationship | blocks, related, parent |

---

## Operations

### Create Work Item

**Amplify:** Create a work item for a project
**Beads:** `bd create "title" -t type -p priority --json`

```bash
# Create project epic
bd create "User Authentication" -t feature -p 1 --json
# → {"id": "bd-auth", "title": "User Authentication", ...}

# Create child work item
bd create "Create user schema" --parent bd-auth --json
# → {"id": "bd-auth.1", ...}
```

**Type Mapping:**
- Feature work → `-t feature`
- Bug fix → `-t bug`
- General task → `-t task`
- Maintenance → `-t chore`
- Research → `-t spike`

### Query Ready Work

**Amplify:** Find work items ready for execution (no blockers)
**Beads:** `bd ready --json`

```bash
bd ready --json
# Returns all issues with no blocking dependencies
# [{"id": "bd-auth.1", ...}, {"id": "bd-auth.2", ...}]
```

### Claim Work Item

**Amplify:** Mark work item as in progress (claim for agent)
**Beads:** `bd update [id] --status in_progress --json`

```bash
bd update bd-auth.1 --status in_progress --json
```

### Complete Work Item

**Amplify:** Mark work item as completed
**Beads:** `bd close [id] --reason "description" --json`

```bash
bd close bd-auth.1 --reason "Schema created and migrated" --json
```

### Add Dependency

**Amplify:** Mark work item as depending on another
**Beads:** `bd dep add [from] [to] --type blocks`

```bash
# bd-auth.1 (schema) must complete before bd-auth.2 (API)
bd dep add bd-auth.1 bd-auth.2 --type blocks
```

### Query Work Status

**Amplify:** Check work item status
**Beads:** `bd show [id] --json` or `bd list --json`

```bash
# Single item
bd show bd-auth.1 --json

# All items
bd list --json

# By status
bd list --status in_progress --json
bd list --status open --json
bd list --status closed --json
```

### View Dependencies

**Amplify:** View work item dependency tree
**Beads:** `bd dep tree [id]`

```bash
bd dep tree bd-auth
# Shows hierarchical dependency structure
```

---

## Integration Points

This skill is used internally by:

1. **Work Orchestrator** (`@work-orchestrator`)
   - Creates work items from PRDs
   - Manages dependencies
   - Queries ready work for dispatch

2. **Execute Work Command** (`/execute-work`)
   - Creates project epics and child tasks
   - Sets up dependency graph
   - Dispatches waves based on `bd ready`

3. **Beads CLI Status Queries**
   - `bd list --json` for current state
   - `bd ready --json` for unblocked work
   - `bd show <id> --json` for specific item details

4. **Work Item Commands**
   - `/create-work-item` → uses `bd create`
   - `/close-work-item` → uses `bd close`
   - `/update-work-item` → uses `bd update`

---

## Error Handling

### Issue Not Found

```bash
bd show bd-nonexistent --json
# Error: Issue not found
```

**Response:** Inform user work item doesn't exist, suggest checking ID.

### Duplicate Dependency

```bash
bd dep add bd-auth.1 bd-auth.2 --type blocks
# (when dependency already exists)
```

**Response:** Silently succeed - dependency already tracked.

### Circular Dependency

```bash
bd dep add bd-auth.2 bd-auth.1 --type blocks
# (when bd-auth.1 already blocks bd-auth.2)
```

**Response:** Beads rejects circular dependencies. Inform user of the conflict.

### Database Locked

```bash
bd list --json
# Error: Database locked
```

**Response:** Another process is using Beads. Wait and retry, or run `bd sync`.

---

## Best Practices

1. **Always use `--json` flag** for machine-readable output
2. **Create parent issues (epics) first** before child tasks
3. **Set dependencies immediately** after creating related work items
4. **Use meaningful close reasons** for audit trail
5. **Query `bd ready` for dispatch** - don't manually track dependencies
6. **Let Beads handle the graph** - don't duplicate dependency logic

---

## Example Workflow

```bash
# 1. Create project epic
bd create "User Dashboard" -t feature -p 2 --json
# → bd-dash

# 2. Create child tasks
bd create "Design dashboard layout" --parent bd-dash --json   # → bd-dash.1
bd create "Build dashboard API" --parent bd-dash --json       # → bd-dash.2
bd create "Implement dashboard UI" --parent bd-dash --json    # → bd-dash.3
bd create "Write dashboard tests" --parent bd-dash --json     # → bd-dash.4

# 3. Set dependencies
bd dep add bd-dash.1 bd-dash.3 --type blocks  # design → UI
bd dep add bd-dash.2 bd-dash.3 --type blocks  # API → UI
bd dep add bd-dash.3 bd-dash.4 --type blocks  # UI → tests

# 4. Query ready work
bd ready --json
# → [bd-dash.1, bd-dash.2] (design and API have no blockers)

# 5. Dispatch and claim
bd update bd-dash.1 --status in_progress --json
bd update bd-dash.2 --status in_progress --json
# → Engage @frontend-engineer and @backend-engineer

# 6. Complete work
bd close bd-dash.1 --reason "Layout approved"
bd close bd-dash.2 --reason "API implemented"

# 7. Check newly ready work
bd ready --json
# → [bd-dash.3] (UI now unblocked)

# 8. Continue until complete
bd close bd-dash.3 --reason "UI implemented"
bd close bd-dash.4 --reason "Tests passing"
bd close bd-dash --reason "Dashboard feature complete"
```

---

## Related Documentation

- `ai-tools/BEADS.md` - Full Beads integration guide
- `ai-tools/commands/setup-beads.md` - Beads setup command
- `ai-tools/agents/work-orchestrator.md` - Work Orchestrator agent
- `ai-tools/commands/execute-work.md` - Execute Work command
