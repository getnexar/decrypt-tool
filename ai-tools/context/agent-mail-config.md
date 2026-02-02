# Agent Mail Configuration

Agent Mail provides real-time coordination for parallel agents, preventing work item collisions when multiple agents work simultaneously.

---

## When Agent Mail Is Needed

Agent Mail is **automatically used** when:
- Multiple agents are dispatched in parallel
- `/execute-work` runs with multiple work items
- Wave-based execution engages concurrent agents

**Without Agent Mail:** 2-5 second sync delay via Git
**With Agent Mail:** <100ms real-time coordination

---

## How It Works

```
Agent A                          Agent B
   │                                │
   ├─► bd ready                     │
   │   Returns: bd-123, bd-456      │
   │                                ├─► bd ready
   │                                │   Returns: bd-123, bd-456
   ├─► bd update bd-123 (claim)     │
   │   ✓ Reserved via Agent Mail    │
   │                                ├─► bd update bd-123 (claim)
   │                                │   ✗ HTTP 409: Reserved by Agent A
   │                                │
   │                                ├─► bd update bd-456 (claim)
   │                                │   ✓ Reserved (different item)
```

When Agent A claims `bd-123`, Agent Mail immediately notifies all other agents. Agent B's claim attempt fails with a 409 conflict, so it moves to the next available item.

---

## Configuration

### Environment Variables

Set these in your shell or `.env` file:

```bash
# Agent Mail server URL (default: localhost)
export BEADS_AGENT_MAIL_URL=http://127.0.0.1:8765

# Unique agent identifier (auto-generated if not set)
export BEADS_AGENT_NAME=amplify-agent-$(uuidgen | cut -c1-8)

# Project identifier for scoping
export BEADS_PROJECT_ID=my-project
```

### Starting the Agent Mail Server

```bash
# Start server (in separate terminal)
npx @beads/agent-mail

# Or with custom port
AGENT_MAIL_PORT=9000 npx @beads/agent-mail
```

The server runs on port 8765 by default and handles:
- Work item reservations
- Real-time sync notifications
- Agent heartbeat monitoring

---

## Automatic Setup

When running `/setup-amplify` or `/setup-beads --with-agent-mail`:

1. **Detect multi-agent needs** based on project complexity
2. **Generate unique agent name** for the session
3. **Set environment variables** automatically
4. **Verify server connectivity** if server is running

---

## Integration with Work Orchestrator

Work Orchestrator automatically uses Agent Mail when available:

1. **Before claiming work:**
   ```bash
   bd update bd-abc --status in_progress --json
   # → Agent Mail reserves bd-abc for this agent
   ```

2. **Collision handling:**
   ```
   HTTP 409 Conflict: Reserved by amplify-agent-a1b2c3d4
   ```
   Work Orchestrator automatically tries next available item.

3. **After completing work:**
   ```bash
   bd close bd-abc --reason "..." --json
   # → Agent Mail releases reservation
   ```

---

## Troubleshooting

### Agent Mail Not Connecting

```bash
# Check if server is running
curl http://127.0.0.1:8765/health

# Expected response:
# {"status": "ok", "agents": 2, "reservations": 5}
```

### Stale Reservations

If an agent crashes without releasing reservations:

```bash
# Reservations auto-expire after 5 minutes
# Or restart Agent Mail server to clear all
```

### Environment Not Set

```bash
# Verify environment
echo $BEADS_AGENT_MAIL_URL
echo $BEADS_AGENT_NAME
echo $BEADS_PROJECT_ID
```

If empty, run `/setup-beads --with-agent-mail`.

---

## When to Skip Agent Mail

Agent Mail is optional. Skip it when:
- Working with single agent (no parallelism)
- Simple sequential workflows
- Local development without parallel sessions

Beads works fine without Agent Mail - it just uses Git for sync (2-5 seconds vs <100ms).

---

## Security Notes

- Agent Mail runs on localhost by default (127.0.0.1)
- No authentication for local development
- For team usage, deploy behind a firewall or VPN
- Reservations are project-scoped via `BEADS_PROJECT_ID`
