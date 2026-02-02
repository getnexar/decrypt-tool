# Setup Beads Command

**Intended For:** AI Agent (Orchestrator) or Human
**Primary User:** Advanced users wanting explicit Beads control or troubleshooting
**Purpose:** Initialize or reconfigure Beads issue tracker for work item management
**Triggers:** Manually when needed (Beads is auto-initialized during `npm install`)

---

## Overview

The `/setup-beads` command manages the Beads distributed issue tracker, which powers Amplify's work orchestration system. Beads provides:

- **Dependency-aware work tracking** - Automatic detection of ready work
- **Parallel-safe operations** - Hash-based IDs prevent collisions
- **Git-synced persistence** - Work items travel with your code
- **Agent Mail coordination** - Real-time multi-agent synchronization

**Note:** Beads is automatically installed and initialized when you install Amplify (`npm install @getnexar/amplify`). Use this command only when you need to:
- Reconfigure Agent Mail settings
- Force re-initialization
- Troubleshoot Beads setup

---

## Usage

```bash
# Basic initialization (non-interactive)
/setup-beads

# With Agent Mail configuration
/setup-beads --with-agent-mail

# Force re-initialization
/setup-beads --force

# Check current Beads status
/setup-beads --status
```

---

## What It Does

### Phase 1: Check Prerequisites

1. **Verify Node.js version** (>= 14.0.0)
2. **Check for existing `.beads/` directory**
3. **Verify Git repository exists** (Beads requires Git for sync)

### Phase 2: Verify Beads CLI

```bash
# Beads is installed as a dependency - verify it's available
npx bd --version

# Or if using the local binary directly
./node_modules/.bin/bd --version
```

### Phase 3: Initialize Beads Database

```bash
# Non-interactive initialization
bd init --quiet

# Creates:
# .beads/
# ├── beads.db        # SQLite local cache (gitignored)
# └── beads.jsonl     # Git-tracked source of truth
```

### Phase 4: Configure Git Integration

1. **Add `.beads/beads.db` to `.gitignore`** (local cache shouldn't be tracked)
2. **Ensure `.beads/beads.jsonl` is tracked** (source of truth)
3. **Configure merge driver** for JSONL conflict resolution (optional)

### Phase 5: Configure Agent Mail (Optional)

If `--with-agent-mail` flag is provided or multiple agents detected:

```bash
# Set environment variables for Agent Mail
export BEADS_AGENT_MAIL_URL=http://127.0.0.1:8765
export BEADS_AGENT_NAME=amplify-agent-$(uuidgen | cut -c1-8)
export BEADS_PROJECT_ID=$(basename $(pwd))
```

### Phase 6: Verify Setup

```bash
# Create test issue to verify
bd create "Setup verification" -t task -p 3 --json

# Check it exists
bd list --json

# Clean up test issue
bd close <test-id> --reason "Setup verified"
```

---

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BEADS_AGENT_MAIL_URL` | Agent Mail server URL | `http://127.0.0.1:8765` |
| `BEADS_AGENT_NAME` | Unique agent identifier | Auto-generated |
| `BEADS_PROJECT_ID` | Project identifier for Agent Mail | Directory name |
| `BEADS_AUTO_SYNC` | Enable automatic sync | `true` |
| `BEADS_SYNC_DEBOUNCE` | Sync debounce in ms | `5000` |

### Agent Mail Server

For teams running multiple agents in parallel, Agent Mail provides real-time coordination:

```bash
# Start Agent Mail server (separate terminal)
npx @beads/agent-mail

# Server runs on port 8765 by default
# Provides <100ms coordination vs 2-5s git sync
```

---

## Integration with Amplify

After setup, Beads is used automatically by:

1. **Work Orchestrator** (`@work-orchestrator`)
   - Creates work items via `bd create`
   - Queries ready work via `bd ready`
   - Manages dependencies via `bd dep`

2. **Execute Work Command** (`/execute-work`)
   - Finds unblocked work with `bd ready --json`
   - Claims work with `bd update --status in_progress`
   - Completes work with `bd close`

3. **Work Item Commands**
   - `/create-work-item` → `bd create`
   - `/close-work-item` → `bd close`
   - `/update-work-item` → `bd update`

---

## Direct Beads Usage (Optional)

Power users can interact with Beads directly:

```bash
# Find ready work
bd ready --json

# Create a work item
bd create "Implement feature X" -t feature -p 2 --json

# Add dependency
bd dep add bd-abc bd-xyz --type blocks

# View dependency tree
bd dep tree bd-abc

# Update status
bd update bd-abc --status in_progress

# Complete work
bd close bd-abc --reason "Implemented and tested"

# Sync with remote
bd sync
```

See `ai-tools/BEADS.md` for comprehensive documentation.

---

## Troubleshooting

### "bd: command not found"

```bash
# Use npx (recommended - uses local dependency)
npx bd init

# Or reinstall Amplify to get the dependency
npm install @getnexar/amplify
```

### "Not a git repository"

Beads requires Git for synchronization:

```bash
git init
/setup-beads
```

### "Database locked"

Another process is using the database:

```bash
# Check for running bd processes
ps aux | grep bd

# Force sync if needed
bd sync --force
```

### Agent Mail Connection Failed

```bash
# Check if server is running
curl http://127.0.0.1:8765/health

# Start server if needed
npx @beads/agent-mail
```

---

## Success Criteria

A successful `/setup-beads` execution results in:

- `.beads/` directory created with database
- `bd` command available and functional
- `.gitignore` updated to exclude `beads.db`
- Test issue created and closed successfully
- Agent Mail configured (if requested)

---

## Examples

### Basic Setup During Amplify Installation

```bash
# Automatically called by /setup-amplify
/setup-amplify
# → Phase 3 includes: /setup-beads
```

### Manual Setup for Existing Project

```bash
# User explicitly wants to add Beads
/setup-beads

# Output:
# ✓ Prerequisites verified
# ✓ Beads CLI installed (v1.2.0)
# ✓ Database initialized at .beads/
# ✓ Git integration configured
# ✓ Setup verified
#
# Beads is ready! Work Orchestrator will now use Beads for work tracking.
```

### Setup with Agent Mail for Team

```bash
/setup-beads --with-agent-mail

# Output:
# ✓ Prerequisites verified
# ✓ Beads CLI installed (v1.2.0)
# ✓ Database initialized at .beads/
# ✓ Git integration configured
# ✓ Agent Mail configured
#   - URL: http://127.0.0.1:8765
#   - Agent: amplify-agent-a1b2c3d4
#   - Project: my-project
# ✓ Setup verified
#
# Start Agent Mail server with: npx @beads/agent-mail
```

---

## Related Commands

- `/setup-amplify` - Full Amplify setup (includes Beads)
- `/execute-work` - Work dispatch using Beads
- `bd list --json` - Check work progress
- `bd ready --json` - Find unblocked work
- `bd --help` - Direct Beads CLI help
