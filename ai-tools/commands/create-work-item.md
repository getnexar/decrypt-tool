# Create Work Item Command

**Intended For:** Agent
**Primary User:** @work-orchestrator, @product-manager
**Purpose:** Create work item in Beads for tracking through the AI team.
**Triggers:** Breaking down projects/requests into trackable work units

## Instructions

You are creating a work item using Beads. Follow this process:

1. **Determine Work Item Type:**
   - `feature` - New capability or enhancement
   - `bug` - Defect or issue to fix
   - `task` - General work item
   - `chore` - Technical/infrastructure work
   - `spike` - Research or investigation

2. **Determine Priority:**
   - P0 (Critical) → `-p 0`
   - P1 (High) → `-p 1`
   - P2 (Medium) → `-p 2` (default)
   - P3 (Low) → `-p 3`

3. **Create Work Item with Beads:**

   ```bash
   # Basic work item
   bd create "Title of work item" -t task -p 2 --json

   # Feature with description
   bd create "Add user profile editing" -t feature -p 1 -d "Allow users to edit their profile information" --json

   # Bug fix
   bd create "Fix login timeout issue" -t bug -p 0 --json

   # Child work item (under an epic/parent)
   bd create "Implement API endpoint" --parent bd-abc --json

   # Spike/research
   bd create "Research OAuth providers" -t spike -p 2 --json
   ```

4. **Add Dependencies (if applicable):**

   ```bash
   # This work item is blocked by another
   bd dep add bd-blocker bd-this --type blocks

   # View dependency tree
   bd dep tree bd-abc
   ```

5. **Assign to Agent:**
   Update the work item description to include assignment:
   ```bash
   bd update bd-abc -d "Assigned: @backend-engineer\n\nImplement the auth API with JWT tokens" --json
   ```

6. **Output:**
   - Work item created in Beads with unique ID (e.g., `bd-abc123`)
   - Dependencies configured
   - Ready for execution via `/execute-work`

## Beads Command Reference

```bash
# Create basic work item
bd create "title" -t <type> -p <priority> --json

# Create with description
bd create "title" -t <type> -p <priority> -d "description" --json

# Create child work item
bd create "title" --parent <parent-id> --json

# Add blocking dependency
bd dep add <blocker-id> <blocked-id> --type blocks

# List work items
bd list --json
bd list --status open --json

# Show work item details
bd show <id> --json
```

## Type Mapping

| Amplify Type | Beads Type | Flag |
|--------------|------------|------|
| Feature | feature | `-t feature` |
| Bug | bug | `-t bug` |
| Technical | chore | `-t chore` |
| Spike | spike | `-t spike` |
| Task | task | `-t task` |

## Priority Mapping

| Priority | Beads Priority | Flag |
|----------|----------------|------|
| Critical (P0) | 0 | `-p 0` |
| High (P1) | 1 | `-p 1` |
| Medium (P2) | 2 | `-p 2` |
| Low (P3) | 3 | `-p 3` |

## Usage Examples

### Example 1: Feature Work Item
```bash
bd create "Add user profile editing" -t feature -p 1 -d "Allow users to update their name, email, and avatar. Assigned: @frontend-engineer" --json
```

### Example 2: Bug Work Item
```bash
bd create "Fix login timeout issue" -t bug -p 0 -d "Users experiencing timeouts after 5 minutes of inactivity. Assigned: @backend-engineer" --json
```

### Example 3: Technical Work Item
```bash
bd create "Optimize database queries for reports" -t chore -p 2 -d "Reduce query time from 800ms to under 200ms. Assigned: @database-engineer" --json
```

### Example 4: Epic with Children
```bash
# Create epic
bd create "User Authentication System" -t feature -p 1 --json
# Returns: bd-auth

# Create child tasks
bd create "Create user schema" --parent bd-auth -d "Assigned: @database-engineer" --json
bd create "Build auth API" --parent bd-auth -d "Assigned: @backend-engineer" --json
bd create "Build login UI" --parent bd-auth -d "Assigned: @frontend-engineer" --json

# Add dependencies
bd dep add bd-auth.1 bd-auth.2 --type blocks  # schema blocks API
bd dep add bd-auth.2 bd-auth.3 --type blocks  # API blocks UI
```

### Example 5: Research Spike
```bash
bd create "Research vector database options" -t spike -p 2 -d "Evaluate Pinecone, Weaviate, and pgvector for RAG system. Assigned: @ai-engineer" --json
```

## Notes for Agents

- **All agents:** Use this command when you identify new work that needs tracking
- **@work-orchestrator:** Create work items during `/execute-work` planning phase
- **@product-manager:** Create work items when breaking down PRDs
- **Engineers:** Create work items for bugs found during implementation or tech debt
- **@qa-engineer:** Create bug work items when defects are found

## Automation Hints

After creating a work item:
- Use `bd dep add` to link dependencies
- Use `bd ready --json` to check if it's ready for execution
- Use `/execute-work` to dispatch work to agents
- Use `/update-work-item` to track progress

## Verifying Creation

```bash
# Show created work item
bd show bd-abc --json

# List all open work items
bd list --status open --json

# Check what's ready to work on
bd ready --json
```
