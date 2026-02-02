---
name: pr-creator
description: Creates comprehensive pull requests from git changes. Analyzes commits, generates PR descriptions, recommends reviewers, suggests labels, and uses GitHub CLI to create PRs.
allowed-tools: Read, Bash, Grep, Glob
---

> **CONVERGENCE NOTICE**: For branch lifecycle decisions (merge, PR, or cleanup), prefer `superpowers:finishing-a-development-branch` which guides the full completion workflow.
>
> **When to use this skill:**
> - Direct PR creation with comprehensive descriptions
> - Automated PR generation (CI/CD, scripts)
> - Creating PRs with specific reviewer/label requirements
>
> **When to use superpowers:finishing-a-development-branch:**
> - Deciding HOW to complete work (merge directly? create PR? cleanup?)
> - Full branch lifecycle guidance
> - Uncertain whether PR is the right next step

# Core Workflow

## Step 1: Gather Information

```bash
# Get current branch
git branch --show-current

# Get commits for this branch
git log main..HEAD --oneline

# Get file changes summary
git diff main...HEAD --stat

# Get detailed changes
git diff main...HEAD
```

## Step 2: Load Team Template

Check for team-specific PR template:
```bash
cat .claude/workflows/pr-template.md
```

If exists, use it. Otherwise use framework default below.

## Step 3: Analyze Changes

Determine:
- **PR Type**: Feature, bug fix, refactor, performance, docs, test, chore
- **Scope**: Areas affected (frontend, backend, database, infrastructure)
- **Impact**: Breaking changes, new dependencies, migrations
- **Testing**: Test coverage added/updated
- **Related Work**: Issues, work items, requirements docs

## Step 4: PR Description Template

**Copy this EXACT template and fill in the bracketed sections:**

```markdown
## Type
[X] Feature / [ ] Bug Fix / [ ] Refactor / [ ] Performance / [ ] Documentation

## Summary
[2-3 sentences: What changed and why. Focus on business value, not implementation.]

## Changes Made
- [Specific change 1 in past tense]
- [Specific change 2 in past tense]
- [Specific change 3 in past tense]

## Technical Details
[How this works: algorithms, data flow, architecture decisions]

## Breaking Changes
- [ ] No breaking changes
- [ ] Yes: [describe what breaks and migration path]

## Testing
- [ ] Unit tests: [before X% → after Y%]
- [ ] Integration tests: [added/updated]
- [ ] Manual testing: [describe steps taken]

**Test Coverage:** [X]% → [Y]%

## Related Work
Closes #[issue-number]
Implements: `agent_docs/requirements/[name].md`

## Deployment Notes
- [ ] No special considerations
- [ ] Environment variables: [list]
- [ ] New dependencies: [list]
- [ ] Configuration changes: [list]

## Checklist
- [ ] Code reviewed (self or peer)
- [ ] Tests passing locally
- [ ] Documentation updated
- [ ] No secrets in code
```

**Fill-in Guide:**
- **Type:** Check ONE box matching primary change type
- **Summary:** Write 2-3 sentences, lead with "what" then "why"
- **Changes Made:** Use past tense ("Added X", "Updated Y", "Fixed Z")
- **Test Coverage:** Provide actual before/after percentages
- **Related Work:** Link issues and requirements docs

## Step 5: Recommend Reviewers

**Code Ownership:**
```bash
cat .github/CODEOWNERS
```

**Recent Contributors:**
```bash
git log --pretty=format:"%an" -- path/to/file | sort | uniq -c | sort -rn
```

**Domain Expertise:**
- Read `.claude/agent-context/` for team structure
- Match expertise to changes

## Step 6: Suggest Labels

**By Type:** `feature`, `bugfix`, `refactor`, `performance`, `documentation`, `test`

**By Area:** `frontend`, `backend`, `database`, `ai`, `infrastructure`

**By Priority:** `critical`, `high-priority`, `medium-priority`, `low-priority`

**By Size:** `size/xs` (<10 lines), `size/s` (<100), `size/m` (<500), `size/l` (<1000), `size/xl` (>1000)

## Step 7: Create PR

```bash
gh pr create \
  --title "feat: add user authentication" \
  --body "$(cat <<'EOF'
[PR description content]
EOF
)" \
  --base main \
  --reviewer user1,user2 \
  --label feature,backend
```

**For draft PR:**
```bash
gh pr create --draft [...]
```

## Output Format

```markdown
# Pull Request Created

**PR Number:** #123
**URL:** https://github.com/org/repo/pull/123
**Branch:** feature/user-auth → main
**Status:** Open / Draft

## Summary
[Brief summary]

## Files Changed
- X files changed
- Y insertions(+)
- Z deletions(-)

## Reviewers Assigned
- @reviewer1 (code owner)
- @reviewer2 (domain expert)

## Labels Applied
- feature
- backend
- size/m

## Next Steps
- Wait for CI checks
- Address reviewer feedback
- Merge when approved
```

## Validation Loop

Before creating PR:

**Self-Check Questions:**
1. Did I analyze ALL commits since branch point?
2. Are breaking changes properly documented with migration path?
3. Does the PR description explain WHY, not just WHAT?
4. Are reviewers correctly identified from CODEOWNERS?
5. Is test coverage information accurate?
6. Did I check for related issues to link?

**If any answer is "no", revise PR content before creating.**

## Context Files

> **Context Discipline:** Only load files directly relevant to the PR being created. Check `agent_docs/index.md` first if unsure which files are needed.

Reference these when creating PRs:
- `agent_docs/index.md` - Check first for file discovery
- `.claude/workflows/pr-template.md` - Team template (if exists)
- Work items via `bd show <id> --json` - Use Beads for work item details
- `agent_docs/requirements/[feature-name].md` - Requirements for the feature
- `agent_docs/implementations/[domain]/[feature-name].md` - Implementation docs for the feature
