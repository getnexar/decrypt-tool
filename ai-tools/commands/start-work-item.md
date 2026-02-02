# Start Work Item Command

**Intended For:** 🤖 Agent
**Primary User:** All engineer agents, @work-orchestrator
**Purpose:** Begin work on a specific work item.
**Triggers:** Assigned work item ready to execute, dependencies met

## Instructions

1. **Identify Work Item:**
   ```bash
   # View work item details
   bd show <id> --json

   # Verify no blockers
   bd dep tree <id>
   ```
   - Verify assignment to correct agent
   - Check dependencies are met (no blockers)

2. **Update Status:**
   ```bash
   # Claim the work item
   bd update <id> --status in_progress --json
   ```
   - This marks the item as in-progress
   - Other agents will see it as claimed

3. **Verify Prerequisites:**
   - [ ] Requirements are clear
   - [ ] Dependencies are available (all blockers resolved)
   - [ ] Technical design approved (if needed)
   - [ ] No blockers in `bd dep tree <id>`

4. **Set Up Work Context:**
   - Create feature branch (if needed)
   - Review linked requirements/designs
   - Understand acceptance criteria

5. **Begin Execution:**
   - Document approach if complex
   - Track progress with `bd update <id> -d "progress notes" --json`

## Usage Examples

```bash
# Start work on a feature
/start-work-item bd-auth.1

# Start work on a bug fix
/start-work-item bd-f14c
```

## Beads Commands Reference

```bash
# View work item details
bd show <id> --json

# Claim work item (mark in-progress)
bd update <id> --status in_progress --json

# Check dependencies
bd dep tree <id>

# Add progress notes
bd update <id> -d "Started implementing auth middleware" --json

# List all ready work (no blockers)
bd ready --json
```

## Notes for Agents

- **Engineers:** Use this to formally start work on assigned items
- **@work-orchestrator:** Use `bd list --status in_progress --json` to track active work
- Update progress regularly with `bd update <id> -d "notes" --json`
- When complete, use `/close-work-item` (which runs `bd close`)
