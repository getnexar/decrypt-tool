# Mode Command

**Intended For:** 👤 Human
**Primary User:** Any user working with Amplify
**Purpose:** Set or query the current execution mode for the session
**Triggers:** When user wants to change how work is executed

---

## Overview

The `/mode` command controls how Amplify executes work after planning is complete. Different modes offer different levels of automation and user control.

---

## Usage

```bash
# Query current mode
/mode

# Set mode for this session
/mode agentic
/mode collaborative
/mode direct

# Short aliases
/mode auto        # Same as agentic
/mode guided      # Same as collaborative
/mode manual      # Same as direct
```

---

## Execution Modes

### 🤖 Agentic Mode (`agentic` | `auto`)

**Full automation with parallel session dispatch.**

| Aspect | Behavior |
|--------|----------|
| Session Management | Auto-dispatches isolated sessions in git worktrees |
| Parallelism | Maximum - unlimited parallel sessions |
| Beads Integration | Required - all work tracked as Beads items |
| User Involvement | Minimal - only for blocking questions |
| Review Process | Automated review sessions before merge |

**Best for:**
- Large features with multiple independent tasks
- Multi-file refactors
- When you want to step away and let it run

**Commands used:**
```bash
npx amplify session dispatch-ready   # Dispatch all ready work items
npx amplify session status           # Monitor session progress
npx amplify session approve <id>     # Approve completed sessions
git merge --no-ff <branch>           # Merge approved work to main
```

---

### 🤝 Collaborative Mode (`collaborative` | `guided`)

**Work together in the current session with agent assistance.**

| Aspect | Behavior |
|--------|----------|
| Session Management | Stays in current session |
| Parallelism | Sequential with @ mentions (agents work in-context) |
| Beads Integration | Suggested but optional |
| User Involvement | Moderate - user approves each major step |
| Review Process | In-session review before completion |

**Best for:**
- Medium-sized tasks
- When you want to see what's happening
- Learning or understanding the codebase
- Tasks that benefit from conversational iteration

**How it works:**
- Uses @ mentions to engage agents (e.g., `@backend-engineer`)
- Agents work within the conversation context
- You see all changes and can intervene
- Suggests creating Beads items but doesn't require them

---

### 🎯 Direct Mode (`direct` | `manual`)

**User drives everything, AI assists on request.**

| Aspect | Behavior |
|--------|----------|
| Session Management | N/A - user controls execution |
| Parallelism | N/A - user decides what to run |
| Beads Integration | Optional - user decides |
| User Involvement | High - user drives all actions |
| Review Process | User-initiated |

**Best for:**
- Quick fixes and small changes
- Debugging and exploration
- When you know exactly what you want
- Sensitive changes requiring full control

**How it works:**
- AI acts as an assistant, not an orchestrator
- No automatic delegation or dispatch
- User explicitly requests what they want
- AI provides suggestions but doesn't act autonomously

---

## Mode Selection Flow

When a plan is ready for implementation, you'll be asked:

```
📋 Plan ready for implementation.

How would you like to execute this work?

1. 🤖 Agentic    - I'll dispatch parallel sessions automatically
2. 🤝 Collaborative - We work together in this session  
3. 🎯 Direct     - You drive, I assist

Current default: collaborative

Enter choice (1/2/3) or /mode <name> to set:
```

---

## Persistence

| Scope | Behavior |
|-------|----------|
| Session | Mode persists for current session until changed |
| Project | Default can be set in `ai-tools/settings.json` |
| Global | No global persistence (session-specific) |

### Setting Project Default

**Option 1:** Edit `.claude/settings.local.json` (Claude Code native):

```json
{
  "amplify": {
    "executionMode": {
      "default": "collaborative"
    }
  }
}
```

**Option 2:** Edit `ai-tools/settings.json` (Amplify config):

```json
{
  "executionMode": {
    "default": "collaborative"
  }
}
```

**Values:**
- `"collaborative"` (default) - Work together in this session with @ mentions
- `"agentic"` - Auto-dispatch parallel sessions
- `"direct"` - User drives, AI assists
- `"ask"` - Always prompt at plan→implementation transition

The `/mode` command checks `.claude/settings.local.json` first, then falls back to `ai-tools/settings.json`.

---

## Mode Comparison

| Feature | Agentic | Collaborative | Direct |
|---------|---------|---------------|--------|
| Auto-dispatch sessions | ✅ | ❌ | ❌ |
| @ agent mentions | ❌ (uses dispatch) | ✅ | ❌ |
| Beads required | ✅ | Optional | Optional |
| Git worktrees | ✅ | ❌ | ❌ |
| Parallel execution | Unlimited | Limited (in-context) | Manual |
| Context isolation | Full | None | N/A |
| User approval needed | Questions only | Each major step | Every action |
| Best for | Large features | Medium tasks | Quick fixes |

---

## Examples

### Switch to Agentic Mode
```
User: /mode agentic

AI: ✅ Execution mode set to **Agentic**.

When a plan is ready, I will:
- Convert tasks to Beads work items
- Dispatch isolated sessions in parallel
- Monitor progress and surface questions
- Guide you through reviews and merges

You can change modes anytime with /mode <name>.
```

### Switch to Collaborative Mode
```
User: /mode collaborative

AI: ✅ Execution mode set to **Collaborative**.

When a plan is ready, I will:
- Work with you in this session
- Use @ mentions to engage agents
- Show you changes before committing
- Ask for approval at key decision points

You can change modes anytime with /mode <name>.
```

### Query Current Mode
```
User: /mode

AI: 📊 Current execution mode: **Collaborative**

Available modes:
- /mode agentic - Full automation with parallel dispatch
- /mode collaborative - Work together in this session (current)
- /mode direct - You drive, I assist
```

---

## Implementation

**CRITICAL: Always run the CLI command to persist the mode change.**

When user invokes `/mode <name>`, you MUST run:

```bash
npx amplify mode <name>
```

This persists the mode to `.claude/settings.local.json` so the statusLine reflects the change.

Example:
```bash
# User: /mode agentic
npx amplify mode agentic
# Output: 🤖 Mode set to: agentic
```

---

## Integration with Other Commands

| Command | Respects Mode? | Notes |
|---------|----------------|-------|
| `/start` | ✅ | Queries mode at plan→implementation transition |
| `/execute-work` | ✅ | Behavior changes based on mode |
| `/plan-execution` | ✅ | Post-plan behavior follows mode |
| Worker sessions | N/A | Always in "worker mode" (implement directly) |

---

## Notes

- Mode changes take effect immediately
- Changing mode mid-execution may cause inconsistent behavior
- Worker sessions (dispatched via agentic mode) always implement directly regardless of this setting
- The mode setting doesn't affect the planning phase, only execution

