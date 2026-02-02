# StatusLine Command

**Intended For:** Human
**Purpose:** View or change the statusLine verbosity tier
**Triggers:** User wants to adjust status display, or setup statusLine

---

## Usage

```
/statusline           # Show current status and tier info
/statusline cycle     # Cycle to next verbosity tier (1->2->3->1)
/statusline minimal   # Set to tier 1 (minimal)
/statusline standard  # Set to tier 2 (standard)
/statusline full      # Set to tier 3 (full)
```

---

## Tiers

| Tier | Name | Output |
|------|------|--------|
| 1 | minimal | Mode + folder + branch on single line |
| 2 | standard | Mode + role + active sessions + questions |
| 3 | full | Multi-line with all session details |

### Examples

**Tier 1 (Minimal):**
```
🤝 collaborative │ amplify │ main
```

**Tier 2 (Standard):**
```
🤖 agentic │ orchestrator │ 3 active │ 1 question
```

**Tier 3 (Full):**
```
🤖 agentic │ orchestrator
📁 amplify │ 🌿 main 🌳 bd-auth
⚡ 3 active │ ✅ 2 approved │ ❓ 1 question
```

---

## Implementation

### Show Current Status

When invoked without arguments, display:

```
Current StatusLine Configuration
================================
Tier: standard (2)
Output:
🤝 collaborative │ orchestrator │ 0 active │ 0 questions

Available tiers:
  1 = minimal   (mode + folder + branch)
  2 = standard  (mode + role + sessions + questions)
  3 = full      (multi-line with all details)

Commands:
  /statusline cycle     - Cycle to next tier
  /statusline <tier>    - Set specific tier (minimal/standard/full)
```

### Cycle Tier

When `cycle` argument provided:

```bash
npx amplify status cycle
```

Announce the change: "StatusLine tier changed: standard -> full"

### Set Specific Tier

When tier name provided (`minimal`, `standard`, `full`):

```bash
npx amplify status set <1|2|3>
```

Map tier names:
- `minimal` -> 1
- `standard` -> 2
- `full` -> 3

---

## Claude Code Configuration

Add this to `.claude/settings.local.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx amplify status",
    "padding": 0
  }
}
```

---

## Notes

- StatusLine updates every ~300ms when conversation messages update
- Tier preference is saved to `.claude/settings.local.json`
- Session counts require orchestration modules (returns 0 if unavailable)
- Works in both orchestrator and worker sessions
