---
name: sync-handbook
description: Sync project documentation to nexar-handbook for cross-repo awareness
---

# Sync to Nexar Handbook

You are executing a command to sync this repository's documentation to the nexar-handbook repository, establishing cross-repo agent awareness across Nexar's systems.

## Purpose

This command:
- Syncs project documentation from `agent_docs/` to the organization-wide handbook
- Creates JSON metadata for programmatic repo discovery
- Generates standardized system documentation
- Enables agents across repos to understand this system

## Workflow Overview

Follow these phases in order. Use your built-in tools (Read, Write, Bash) to accomplish each step.

---

## Phase 1: Documentation Validation

### Step 1.1: Check for Required Documentation

Use the **Read** tool to check if these files exist:
- `agent_docs/project-overview.md`
- `agent_docs/technical-setup.md`

**If BOTH files exist:**
- ✅ Proceed to Step 1.2

**If EITHER file is missing:**
- ❌ Stop execution
- Check if `.claude/agents/tech-lead.md` exists
- Display appropriate message:

**If tech-lead exists:**
```
⚠️  Required documentation is missing.

Missing files:
• agent_docs/project-overview.md
• agent_docs/technical-setup.md

ACTION REQUIRED:
Please engage @tech-lead to create comprehensive documentation:

"@tech-lead, I need documentation for the nexar-handbook sync. Please analyze this repository and create:

1. agent_docs/project-overview.md with:
   - Purpose (what problem does this solve?)
   - Goals (what are we trying to achieve?)
   - Success Criteria (how do we measure success?)
   - Stakeholders (who owns/uses this?)

2. agent_docs/technical-setup.md with:
   - Tech Stack (languages, frameworks, databases, cloud services)
   - Architecture (high-level system design)
   - Development Environment (how to set up locally)
   - Architecture Constraints (non-functional requirements, limitations)

Be specific to THIS repository by analyzing the actual codebase."

After @tech-lead completes the documentation, run /sync-handbook again.
```

**If tech-lead does NOT exist:**
```
⚠️  Required documentation is missing and @tech-lead agent not found.

Missing files:
• agent_docs/project-overview.md
• agent_docs/technical-setup.md

OPTIONS:
1. Run /manage-agents to enable the tech-lead agent
2. Create documentation files manually following the templates
3. Install tech-lead from package defaults

After creating documentation, run /sync-handbook again.
```
- Exit command

### Step 1.2: Validate Documentation Quality

Use the **Read** tool to check both files:

For `agent_docs/project-overview.md`:
- Count lines (must be at least 20 lines)
- Check for keywords: "Purpose" or "Goals" or "What"
- Ensure it's not just a placeholder

For `agent_docs/technical-setup.md`:
- Count lines (must be at least 20 lines)
- Check for keywords: "Tech Stack" or "Architecture" or "Stack"
- Ensure it's not just a placeholder

**If validation fails:**
```
⚠️  Documentation quality check failed:

Issues found:
[List specific issues for each file]

The documentation seems incomplete or placeholder text.

OPTIONS:
1. Engage @tech-lead to improve documentation
2. Continue anyway (may need manual fixes in handbook later)
3. Cancel and manually update documentation

Continue anyway? (Responding 'yes' will proceed with current documentation)
```

If user says "no" or "cancel": Exit command
If user says "yes" or "continue": Proceed to Phase 2

---

## Phase 2: Extract Repository Metadata

### Step 2.1: Get Repository Information

Use **Bash** tool to extract git information:

```bash
git remote get-url origin
```

From the output:
- Extract repository name (last part before .git)
- Convert SSH URLs to HTTPS if needed:
  - `git@github.com:getnexar/amplify.git` → `https://github.com/getnexar/amplify`
- Store as `REPO_URL`

```bash
basename $(git remote get-url origin) .git
```

Store the output as `REPO_NAME`

```bash
git rev-parse HEAD
```

Store the output as `COMMIT_HASH` (first 7 characters)

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Store the output as `TIMESTAMP`

### Step 2.2: Extract Description

Use **Read** tool to read `agent_docs/project-overview.md`:

1. Look for first paragraph after the title
2. OR look for "Purpose" section
3. Extract 1-2 sentences (max 150 characters)
4. Clean up any Markdown formatting
5. Store as `DESCRIPTION`

Example:
- Input: "## Purpose\n\nThis framework helps developers build applications faster..."
- Output: "Framework that helps developers build applications faster through autonomous AI agents"

---

## Phase 3: Clone Nexar Handbook

### Step 3.1: Check Prerequisites

Use **Bash** tool to verify:

```bash
gh --version
```

**If command fails:**
```
❌ GitHub CLI (gh) is not installed.

Install it first:
• macOS: brew install gh
• Linux: See https://github.com/cli/cli#installation
• Windows: See https://github.com/cli/cli#installation

Then run /sync-handbook again.
```
- Exit command

```bash
gh auth status
```

**If not authenticated:**
```
❌ GitHub CLI is not authenticated.

Run this command to authenticate:
gh auth login

Then run /sync-handbook again.
```
- Exit command

### Step 3.2: Create Temporary Directory and Clone

Use **Bash** tool:

```bash
TEMP_DIR="/tmp/nexar-handbook-sync-$$"
git clone https://github.com/getnexar/nexar-handbook.git "$TEMP_DIR" 2>&1
echo "CLONE_STATUS:$?"
echo "TEMP_DIR:$TEMP_DIR"
```

**If clone fails (non-zero exit status):**
```
❌ Failed to clone nexar-handbook repository.

Possible reasons:
• No internet connection
• No access to getnexar/nexar-handbook
• Repository URL has changed

Verify you have access: https://github.com/getnexar/nexar-handbook

Then run /sync-handbook again.
```
- Exit command

Store the `TEMP_DIR` value for later steps.

### Step 3.3: Create Branch

Use **Bash** tool:

```bash
cd [TEMP_DIR]
BRANCH_NAME="sync-[REPO_NAME]-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH_NAME" 2>&1
echo "BRANCH_STATUS:$?"
echo "BRANCH_NAME:$BRANCH_NAME"
```

Store the `BRANCH_NAME` value.

---

## Phase 4: Generate Files

### Step 4.1: Create Directory Structure

Use **Bash** tool:

```bash
cd [TEMP_DIR]
mkdir -p _repos
mkdir -p architecture/systems/[REPO_NAME]
```

### Step 4.2: Create JSON Metadata

Use **Write** tool to create `[TEMP_DIR]/_repos/[REPO_NAME].json`:

```json
{
  "name": "[REPO_NAME]",
  "url": "[REPO_URL]",
  "description": "[DESCRIPTION]",
  "team": "cloud",
  "documentation": {
    "overview": "/architecture/systems/[REPO_NAME]/README.md",
    "architecture": "/architecture/systems/[REPO_NAME]/architecture.md"
  },
  "last_synced": "[TIMESTAMP]",
  "synced_from_commit": "[COMMIT_HASH]"
}
```

Replace placeholders with actual values extracted in Phase 2.

### Step 4.3: Generate Overview Document

Use **Read** tool to read `agent_docs/project-overview.md` (from current repo, not handbook).

Extract the content and use **Write** tool to create `[TEMP_DIR]/architecture/systems/[REPO_NAME]/README.md`:

```markdown
# [REPO_NAME]

> **Repository:** [REPO_URL]
> **Team:** cloud
> **Last Synced:** [TIMESTAMP]

[CONTENT FROM project-overview.md - keep all sections, headings, formatting]

---

## Metadata

- **Repository:** [REPO_URL]
- **Last Synced:** [TIMESTAMP]
- **Synced From Commit:** [COMMIT_HASH]

*This documentation is automatically synced from the repository using the `/sync-handbook` command. To update, run `/sync-handbook` in the source repository.*
```

### Step 4.4: Generate Architecture Document

Use **Read** tool to read `agent_docs/technical-setup.md` (from current repo, not handbook).

Extract the content and use **Write** tool to create `[TEMP_DIR]/architecture/systems/[REPO_NAME]/architecture.md`:

```markdown
# [REPO_NAME] - Technical Architecture

[CONTENT FROM technical-setup.md - keep all sections, headings, formatting]

---

## Metadata

- **Repository:** [REPO_URL]
- **Last Synced:** [TIMESTAMP]
- **Synced From Commit:** [COMMIT_HASH]

*This documentation is automatically synced from the repository using the `/sync-handbook` command. To update, run `/sync-handbook` in the source repository.*
```

---

## Phase 5: Commit and Push

### Step 5.1: Stage All Changes

Use **Bash** tool:

```bash
cd [TEMP_DIR]
git add _repos/[REPO_NAME].json
git add architecture/systems/[REPO_NAME]/
git status --short
```

Display the staged files to user:
```
📝 Files staged for commit:
[output from git status]
```

### Step 5.2: Commit Changes

Use **Bash** tool:

```bash
cd [TEMP_DIR]
git commit -m "docs: Sync [REPO_NAME] documentation

- Added/updated JSON metadata: _repos/[REPO_NAME].json
- Added/updated system overview: architecture/systems/[REPO_NAME]/README.md
- Added/updated architecture docs: architecture/systems/[REPO_NAME]/architecture.md

Source: [REPO_URL]
Commit: [COMMIT_HASH]
Synced: [TIMESTAMP]
" 2>&1
echo "COMMIT_STATUS:$?"
```

**If commit fails:**
```
❌ Failed to commit changes.

Error: [show error output]

This is unexpected. Please report this issue.
```
- Proceed to cleanup (Phase 7.1)
- Exit command

### Step 5.3: Push Branch

Use **Bash** tool:

```bash
cd [TEMP_DIR]
git push origin [BRANCH_NAME] 2>&1
echo "PUSH_STATUS:$?"
```

**If push fails:**
```
❌ Failed to push branch to nexar-handbook.

Possible reasons:
• Network issue
• No write access to getnexar/nexar-handbook
• Authentication expired

Error: [show error output]

You can create the PR manually:
1. The branch is ready locally at: [TEMP_DIR]
2. Push manually: cd [TEMP_DIR] && git push origin [BRANCH_NAME]
3. Create PR at: https://github.com/getnexar/nexar-handbook/compare/[BRANCH_NAME]

Or fix the issue and run /sync-handbook again.
```
- Proceed to cleanup (Phase 7.1)
- Exit command

---

## Phase 6: Create Pull Request

### Step 6.1: Create PR via GitHub CLI

Use **Bash** tool:

```bash
cd [TEMP_DIR]
gh pr create \
  --repo getnexar/nexar-handbook \
  --title "docs: Sync [REPO_NAME] documentation" \
  --body "## Summary
Automated documentation sync from **[REPO_NAME]** repository.

## Changes
- ✅ Created/updated JSON metadata: \`_repos/[REPO_NAME].json\`
- ✅ Created/updated system overview: \`architecture/systems/[REPO_NAME]/README.md\`
- ✅ Created/updated architecture docs: \`architecture/systems/[REPO_NAME]/architecture.md\`

## Source Information
- **Repository:** [REPO_URL]
- **Commit:** [COMMIT_HASH]
- **Synced At:** [TIMESTAMP]

## Documentation Extracted From
- \`agent_docs/project-overview.md\`
- \`agent_docs/technical-setup.md\`

## What This Enables
This documentation allows agents across all Nexar repositories to:
- Discover this system and its purpose
- Understand the technical architecture
- Identify integration points
- Make informed decisions about cross-repo dependencies

---
🤖 Generated with [Claude Code](https://claude.com/claude-code) via \`/sync-handbook\` command

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1
```

Extract the PR URL from the output (look for "https://github.com/getnexar/nexar-handbook/pull/")

**If PR creation fails:**
```
⚠️  Pull request creation encountered an issue.

Error: [show error output]

However, your changes have been pushed to branch: [BRANCH_NAME]

Create the PR manually:
https://github.com/getnexar/nexar-handbook/compare/[BRANCH_NAME]?expand=1

The PR body has been prepared above - copy it when creating manually.
```
- Proceed to cleanup (Phase 7.1)
- Exit command

Store the PR URL as `PR_URL`

---

## Phase 7: Cleanup and Report

### Step 7.1: Remove Temporary Directory

Use **Bash** tool:

```bash
rm -rf [TEMP_DIR]
echo "CLEANUP_STATUS:$?"
```

**If cleanup fails:**
- Don't fail the command, just warn:
```
⚠️  Could not clean up temporary directory: [TEMP_DIR]
You may want to remove it manually.
```

### Step 7.2: Report Success

Display to user:

```
════════════════════════════════════════════════════════════
✅ Documentation synced successfully to nexar-handbook!
════════════════════════════════════════════════════════════

📋 Files created/updated:
   • _repos/[REPO_NAME].json
   • architecture/systems/[REPO_NAME]/README.md
   • architecture/systems/[REPO_NAME]/architecture.md

🔗 Pull Request: [PR_URL]

📖 What's Next:
   1. Review the PR at the link above
   2. Once merged, documentation will be available to all agents
   3. Other repos can now discover and understand this system
   4. Run /sync-handbook anytime to update the documentation

💡 Tip: Run /sync-handbook regularly to keep handbook documentation in sync with your repo changes.
```

---

## Error Recovery Guidelines

Throughout execution:
1. Always clean up temporary directory before exiting on error
2. Provide clear, actionable error messages
3. Suggest specific fixes for common issues
4. Preserve any work done (branch pushed, files created)
5. Allow user to complete manually if automation fails

---

## Common Error Scenarios

### Scenario 1: Missing `gh` CLI
```
❌ GitHub CLI (gh) not found
💡 Install: brew install gh (macOS) or see https://cli.github.com
```

### Scenario 2: Not Authenticated
```
❌ GitHub CLI not authenticated
💡 Run: gh auth login
```

### Scenario 3: No Write Access
```
❌ Cannot push to nexar-handbook
💡 Request access from your team lead
```

### Scenario 4: Network Issues
```
❌ Failed to clone/push to nexar-handbook
💡 Check internet connection and try again
```

### Scenario 5: Documentation Too Short
```
⚠️  Documentation seems incomplete (< 20 lines)
💡 Engage @tech-lead to generate comprehensive docs
```

---

## Prerequisites Checklist

Before starting Phase 1, the command should verify:
- [ ] Inside a git repository (`git rev-parse --git-dir` succeeds)
- [ ] Repository has a remote origin
- [ ] `gh` CLI is installed
- [ ] `gh` CLI is authenticated
- [ ] Internet connectivity (handbook clone will work)

If any prerequisite fails, stop and guide user to fix it.

---

## Notes for Claude

- Use descriptive variable names when storing values
- Always check command exit codes (Bash tool returns stderr/stdout)
- Read files from the CURRENT repo, write to TEMP_DIR (handbook clone)
- Clean up temp directory even if command fails
- Be helpful in error messages - users should know exactly what to do next
- The command is declarative - you (Claude) are the executor

---

## Success Criteria

By the end of execution:
✅ JSON metadata created in `_repos/[repo-name].json`
✅ System documentation created in `architecture/systems/[repo-name]/`
✅ Branch pushed to nexar-handbook
✅ Pull request created automatically
✅ User has PR URL to review
✅ Temporary directory cleaned up
✅ Clear success message displayed

This establishes the foundation for Nexar-wide agentic awareness.
