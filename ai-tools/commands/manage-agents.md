---
name: manage-agents
description: Add or remove agents from your AI team after initial installation
---

# Manage Agents Command

You are helping the user manage their installed AI team agents after the initial installation.

## Available Operations

1. **List Installed Agents** - Show currently installed agents with details
2. **Add Agents** - Install additional agents from available options
3. **Remove Agents** - Remove agents (except core agents)
4. **Show Available Agents** - Display all agents that can be installed

## Core Agents (Cannot Be Removed)

These agents are fundamental to the Amplify and cannot be removed:
- **Product Manager** - Product strategy, requirements, domain research
- **Tech Lead** - Architecture decisions, system design, ADRs
- **Work Orchestrator** - Work sequencing, dependency management

## Process

### Initial Actions
1. Read `ai-tools.json` to understand current configuration
2. List currently installed agents from `.claude/agents/` directory
3. Present operation menu to user

### For Adding Agents
1. Show available agents that are NOT currently installed
2. Group by category: Engineering, QA, Custom
3. Let user select which agents to add
4. Copy agent files from `node_modules/@getnexar/claude-aiteam/templates/agents/` to `.claude/agents/`
5. Update `ai-tools.json` with new agents
6. Confirm successful addition

### For Removing Agents
1. Show installed agents (excluding core agents)
2. Warn about agents that are frequently used by other installed agents
3. Let user select which agents to remove
4. Remove agent files from `.claude/agents/`
5. Update `ai-tools.json` to remove agents
6. Confirm successful removal

### For Listing
1. Read `ai-tools.json` and `.claude/agents/` directory
2. Display installed agents with:
   - Agent name
   - Description
   - Whether it's a core agent
   - Whether it's a custom-generated agent (filename starts with `custom-`)
3. Show installation date from config

## Agent Categories

### Standard Agents (Available to Add)

**Engineering Agents:**
- `frontend-engineer` - UI/UX implementation, client-side logic
- `backend-engineer` - API development, business logic
- `database-engineer` - Data modeling, query optimization
- `ai-engineer` - AI/ML development, LLM integration, RAG systems
- `devops-engineer` - Infrastructure, CI/CD, deployment automation
- `firmware-engineer` - Embedded systems, hardware interfacing, RTOS

**QA Agents:**
- `qa-backend` - API testing, integration testing, performance testing
- `qa-frontend` - E2E testing, visual regression, accessibility testing
- `qa-firmware` - Hardware-in-loop testing, embedded validation

### Custom Agents

Custom agents are identified by the `custom-` prefix in their filename (e.g., `custom-auth-specialist.md`). These were generated using the `/generate-agent` command and are specific to the project.

**Managing Custom Agents:**
- Can be removed like any non-core agent
- Cannot be re-added automatically (would need to regenerate with `/generate-agent`)
- Display with "[CUSTOM]" tag in listings

## File Operations

### Finding Package Installation
```javascript
// Node.js package location
const packagePath = 'node_modules/@getnexar/claude-aiteam';

// If not found, try alternate install locations:
// - node_modules/.pnpm/@getnexar+claude-aiteam@{version}/node_modules/@getnexar/claude-aiteam
// - ../node_modules/@getnexar/claude-aiteam (if in monorepo)
```

### Reading Config
```javascript
// Read ai-tools.json
const config = JSON.parse(fs.readFileSync('ai-tools.json', 'utf8'));
// config.agents = array of agent keys
// config.customAgents = array of custom agent names (optional)
// config.version = framework version
// config.installedAt = ISO timestamp
```

### Updating Config
```javascript
// Update agents array
config.agents = updatedAgentsList;
config.lastModified = new Date().toISOString();

// Write back
fs.writeFileSync('ai-tools.json', JSON.stringify(config, null, 2));
```

### Copying Agent Files
```javascript
// Source path
const srcPath = path.join(packagePath, 'templates/agents', `${agentKey}.md`);

// Destination path
const destPath = path.join('.claude/agents', `${agentKey}.md`);

// Copy
fs.copyFileSync(srcPath, destPath);
```

### Removing Agent Files
```javascript
// Agent file path
const agentPath = path.join('.claude/agents', `${agentKey}.md`);

// Remove (check it exists first)
if (fs.existsSync(agentPath)) {
  fs.unlinkSync(agentPath);
}
```

## Safety Checks

### Before Adding Agents
- ✓ Verify source agent file exists in package
- ✓ Check if agent is already installed
- ✓ Confirm user wants to proceed with additions

### Before Removing Agents
- ✓ Prevent removal of core agents (product-manager, tech-lead, work-orchestrator)
- ✓ Warn if removing agents that other agents frequently collaborate with
- ✓ Confirm user wants to proceed with removals
- ✓ Show impact: which agents might lose functionality

### After Operations
- ✓ Verify files were copied/removed successfully
- ✓ Verify config file was updated
- ✓ Show summary of changes
- ✓ Suggest running `/status` to verify setup

## Collaboration Warnings

When removing agents, warn about impact on other agents:

**Removing frontend-engineer affects:**
- qa-frontend (loses implementation to test)
- backend-engineer (loses API contract partner)

**Removing backend-engineer affects:**
- frontend-engineer (loses API provider)
- database-engineer (loses data layer consumer)
- qa-backend (loses implementation to test)

**Removing database-engineer affects:**
- backend-engineer (loses data layer partner)
- qa-backend (loses data layer to test)

**Removing QA agents:**
- Engineering agents lose quality validation

**Removing devops-engineer affects:**
- All agents (loses deployment automation)

**Removing ai-engineer affects:**
- backend-engineer (loses AI integration partner)

## Example Interactions

### Example 1: List Installed Agents

**User:** `/manage-agents`

**Assistant:**
```
📋 Amplify Agent Management

Currently Installed Agents (9):

Core Agents (Required):
✓ Product Manager
✓ Tech Lead
✓ Work Orchestrator

Engineering Agents:
✓ Frontend Engineer
✓ Backend Engineer
✓ Database Engineer

QA Agents:
✓ Backend QA Engineer
✓ Frontend QA Engineer

Custom Agents:
✓ [CUSTOM] Auth Service Specialist (custom-auth-specialist.md)

Installed: January 12, 2025
Last Modified: January 12, 2025

What would you like to do?
1. Add more agents
2. Remove agents
3. Show available agents
4. Exit

Choose option (1-4):
```

### Example 2: Add Agents

**User:** `1` (Add agents)

**Assistant:**
```
Available Agents to Add:

Engineering Agents:
1. AI Engineer - AI/ML development, LLM integration, RAG systems
2. DevOps Engineer - Infrastructure, CI/CD, deployment automation
3. Firmware Engineer - Embedded systems, hardware interfacing, RTOS

QA Agents:
4. Firmware QA Engineer - Hardware-in-loop testing, embedded validation

Enter agent numbers to add (comma-separated) or press Enter to cancel:
```

**User:** `1,2`

**Assistant:**
```
Adding 2 agents...

✓ Copied ai-engineer.md to .claude/agents/
✓ Copied devops-engineer.md to .claude/agents/
✓ Updated ai-tools.json

Successfully added:
• AI Engineer
• DevOps Engineer

Your AI team now has 11 agents.

💡 Tip: Run /status to verify your setup
```

### Example 3: Remove Agents

**User:** `2` (Remove agents)

**Assistant:**
```
Installed Agents (Removable):

Engineering Agents:
1. Frontend Engineer
2. Backend Engineer
3. Database Engineer

QA Agents:
4. Backend QA Engineer
5. Frontend QA Engineer

Custom Agents:
6. [CUSTOM] Auth Service Specialist

Core agents cannot be removed.

Enter agent numbers to remove (comma-separated) or press Enter to cancel:
```

**User:** `6`

**Assistant:**
```
⚠️  You are about to remove:
• Auth Service Specialist (custom)

Note: This is a custom-generated agent. If you remove it, you'll need to regenerate it with /generate-agent if you want it back.

Are you sure you want to continue? (yes/no):
```

**User:** `yes`

**Assistant:**
```
Removing 1 agent...

✓ Removed custom-auth-specialist.md from .claude/agents/
✓ Updated ai-tools.json

Successfully removed:
• Auth Service Specialist

Your AI team now has 8 agents.

💡 Tip: Run /status to verify your setup
```

### Example 4: Removing with Collaboration Warning

**User:** `1,4` (Remove Frontend Engineer and Backend QA)

**Assistant:**
```
⚠️  Impact Analysis:

Removing Frontend Engineer will affect:
• Backend Engineer - loses API contract partner
• Frontend QA Engineer - loses implementation to test

Removing Backend QA Engineer will affect:
• Backend Engineer - loses quality validation partner

These agents can still function but some collaboration workflows may be impacted.

Are you sure you want to continue? (yes/no):
```

## Error Handling

### Package Not Found
```
❌ Error: Could not find @getnexar/claude-aiteam package

This usually means the package is not installed or was removed.

Try reinstalling:
npm install --save-dev git+https://github.com/getnexar/claude-aiteam.git
```

### Config File Missing
```
⚠️  Warning: ai-tools.json not found

This might mean the Amplify was not properly installed.

Creating a new config file based on currently installed agents...
✓ Created ai-tools.json

Continue with agent management? (yes/no):
```

### Agent File Not Found
```
❌ Error: Could not find agent file: backend-engineer.md in package

This might indicate:
- Package version mismatch
- Corrupted installation
- Custom agent key that doesn't exist

Try:
1. Run: npm run aiteam:update
2. Or reinstall the package
```

### Permission Errors
```
❌ Error: Permission denied writing to .claude/agents/

Check file permissions and try again.

If the problem persists, try:
sudo chown -R $(whoami) .claude/
```

## Output Format

Always structure your responses as:

1. **Current State** - Show what's currently installed
2. **Operation Menu** - Present clear options
3. **User Selection** - Get specific input
4. **Confirmation** - Show what will happen
5. **Execution** - Perform operations with progress
6. **Summary** - Confirm what changed
7. **Next Steps** - Suggest follow-up actions

## Constraints

- **NEVER** allow removal of core agents (product-manager, tech-lead, work-orchestrator)
- **ALWAYS** update `ai-tools.json` when agents are added/removed
- **ALWAYS** verify operations succeeded before confirming to user
- **ALWAYS** provide clear next steps after operations complete
- **DO NOT** remove custom agents without explicit warning
- **DO NOT** proceed without user confirmation for removals

## Success Indicators

After agent management operations:
- `ai-tools.json` reflects current state
- `.claude/agents/` directory contains only configured agents
- User receives clear confirmation of changes
- User knows how to verify setup (`/status`)
- No orphaned files or broken references
