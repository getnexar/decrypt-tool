---
name: worktree-handover
description: Creates context handover when establishing git worktrees in collaborative mode. Prevents git contamination by guiding session transition.
allowed-tools: Bash, Read, Write, AskUserQuestion
---

# Worktree Handover

## Overview

This skill guides the transition to a git worktree in **Collaborative Mode**. When you create a worktree mid-session, there's a risk of "git contamination" - commands running in the wrong directory, commits to wrong branches, or context loss.

This skill:
1. Creates a context handover document for the new session
2. Presents the user with session transition options
3. Ensures clean handoff without git contamination

## When to Use

**Trigger this skill when ALL of these are true:**
- You're in **Collaborative Mode** (not Agentic or Direct)
- You've just created or are about to create a git worktree
- The worktree is for feature work that should be isolated

**Do NOT use this skill if:**
- You're in Agentic Mode (isolated sessions handle this automatically)
- The worktree was created by `amplify session dispatch`
- You're already inside a worktree

## Workflow

### Step 1: Capture Context for Handover

Before transitioning to the worktree, gather context from the current conversation:

```javascript
// Context to capture:
const context = {
  objective: "<What we're trying to accomplish>",
  background: "<Key decisions, constraints, relevant history>",
  plan: "<Implementation plan - reference to file or inline>",
  beadsItems: [
    // Related Beads work items
    { id: "bd-xxx", title: "...", status: "..." }
  ],
  nextSteps: [
    // Immediate actions for the new session
    "Step 1...",
    "Step 2..."
  ],
  keyFiles: [
    // Important files to reference
    "path/to/file1.js",
    "path/to/file2.js"
  ]
};
```

### Step 2: Create the Handover

Run the handover creation command:

```bash
# Create handover for the worktree
node scripts/orchestration/handover-helper.js detect "<worktree-path>"

# If worktree detected, create handover via Node:
node -e "
const { createHandover } = require('./scripts/orchestration/worktree-handover');
createHandover('<worktree-path>', {
  objective: '<objective>',
  background: '<background>',
  plan: '<plan>',
  beadsItems: [],
  nextSteps: ['<step1>', '<step2>'],
  keyFiles: ['<file1>', '<file2>']
});
"
```

### Step 3: Present Session Transition Options

Use AskUserQuestion to present the user with options:

```
## Worktree Ready for Work

The worktree has been created at:
  `.worktrees/<name>`

A context handover has been saved. To continue this work:

**Option 1: Start New Session (Recommended)**
Open a new terminal and run:
```
cd <full-worktree-path>
claude
```

The new session will automatically receive the handover context.

**Option 2: Continue Here (Prefixed Mode)**
I can continue working in this session by prefixing all commands with the worktree path.
This works but has higher risk of git contamination.
```

Present with AskUserQuestion:
- Question: "How would you like to continue?"
- Option 1: "Start new session" (Recommended) - I'll show you the cd command
- Option 2: "Continue here" - I'll use prefixed commands (higher risk)

### Step 4: Handle User Choice

**If user chooses "Start new session":**

```markdown
To continue in the new worktree:

1. Open a new terminal
2. Run:
   ```bash
   cd <full-worktree-path>
   claude
   ```

The new Claude session will:
- Detect you're in a worktree
- Load the handover context automatically
- Continue where we left off

This session will remain available if you need to return to main branch work.
```

**If user chooses "Continue here":**

```markdown
**Acknowledged: Prefixed Command Mode**

I'll continue working in this worktree by prefixing all commands.

**IMPORTANT:**
- All file operations will target: `<worktree-path>/`
- Git commands will run in the worktree context
- Higher risk of accidental commands in wrong directory

If you experience issues, consider starting a fresh session in the worktree.
```

Then for all subsequent commands, prefix with the worktree path:
- `cd <worktree-path> && <command>`
- Read files from `<worktree-path>/path/to/file`
- Write files to `<worktree-path>/path/to/file`

## Example Flow

```
User: Create a worktree for the authentication feature

Claude: I'll create a worktree for this feature.

[Creates worktree at .worktrees/feature-auth-xyz123]

Claude: [Invokes worktree-handover skill]

Claude: The worktree is ready. I've saved the context handover with:
- Objective: Implement user authentication
- Background: Using JWT tokens, REST API
- Next steps: Create user schema, implement login endpoint
- Key files: src/auth/, src/models/user.js

How would you like to continue?
1. Start new session (Recommended) - Clean environment
2. Continue here - Prefixed commands (higher risk)

User: 1

Claude: To continue in the new worktree:

1. Open a new terminal
2. Run:
   cd /path/to/.worktrees/feature-auth-xyz123
   claude

The new session will automatically receive the context and continue this work.
```

## Technical Details

**Handover Storage:**
- Location: `~/.amplify/workspaces/{projectHash}/worktrees/{worktree-name}/`
- Files:
  - `HANDOVER.md` - Human-readable context
  - `metadata.json` - Status, timestamps, paths
  - `session-history.json` - Track sessions

**Status Flow:**
- `pending` - Created, waiting for new session
- `active` - Being consumed by a session
- `completed` - Session finished with handover

**Session Detection:**
The session-start hook (`ai-tools/hooks/session-start.sh`) automatically:
1. Detects if CWD is a worktree
2. Looks up the handover
3. Injects context into Claude's system prompt
4. Marks handover as active

## Integration with Other Skills

- **/start** - May trigger worktree creation for feature isolation
- **session-orchestrator** - Creates worktrees automatically (doesn't need this skill)
- **plan-execution** - May recommend worktree creation before implementation
