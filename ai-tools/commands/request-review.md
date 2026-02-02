# Request Review Command

**Intended For:** Agent or Human
**Primary User:** Implementing agents after work completion, @work-orchestrator for automated flow
**Purpose:** Initiate peer review council for a work item before QA handoff
**Triggers:** Implementation complete, ready for peer validation

## Usage

```bash
# Standard review request
/request-review <work-item-id>

# Skip review with documented reason
/request-review <work-item-id> --skip-review --reason "trivial config change"

# Force review even for items meeting skip criteria
/request-review <work-item-id> --force-review
```

## Instructions

### 1. Validate Work Item State

```bash
bd show <work-item-id> --json
```

**Prerequisites:**
- Work item must be `in_progress` status
- Implementation must be complete (not just started)
- No existing `REVIEW: approved` status

**If validation fails:**
```
REVIEW REQUEST BLOCKED:
- Work item status: [status] (required: in_progress)
- Run /start-work-item first if not started
- Complete implementation before requesting review
```

### 2. Check Skip Criteria

Evaluate whether review can be skipped:

| Criteria | Detection | Skip Allowed |
|----------|-----------|--------------|
| `trivial` tag | Work item title/body contains "trivial" | Yes |
| `docs-only` tag | Work item title/body contains "docs-only" | Yes |
| No code changes | `git diff --name-only HEAD~1` shows only .md/.txt/.json | Yes |
| `--skip-review` flag | Explicit flag with `--reason` | Yes |
| Parent reviewed | Parent work item has `REVIEW: approved` | Yes |

**Check for code changes:**
```bash
# Check if any code files were changed
git diff --name-only HEAD~1 | grep -E '\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp|h|hpp|swift|kt)$'
```

### 3. Determine Review Path

**If skip criteria met AND no `--force-review`:**
```bash
# Update Beads with skip reason
bd update <work-item-id> -d "REVIEW: skipped (reason: [detected-reason])" --json
```

Output:
```
Review skipped for <work-item-id>
Reason: [skip-reason]
Work item ready for QA handoff.
```

**If review required (default path):**
Continue to Step 4.

### 4. Identify Participants

**Determine implementer:**
- Agent who marked the work item `in_progress`
- Usually apparent from work item context

**Select peer reviewer using domain matching:**

| Implementer Domain | Peer Reviewer |
|--------------------|---------------|
| @backend-engineer | @backend-engineer |
| @frontend-engineer | @frontend-engineer |
| @database-engineer | @database-engineer |
| @ai-engineer | @ai-engineer |
| @firmware-engineer | @firmware-engineer |
| @devops-engineer | @devops-engineer |
| Cross-domain | @tech-lead |

### 5. Update Beads Status

```bash
bd update <work-item-id> -d "REVIEW: pending - Review requested. Awaiting @[peer-agent]" --json
```

### 6. Invoke Council Review

Use the `council-review` skill to conduct the peer review:

```
[Invoke council-review skill with context:]
- Work item ID: <work-item-id>
- Implementer: @[implementer-agent]
- Peer reviewer: @[peer-agent]
- Implementation summary: [from work item and git diff]
```

The skill will:
1. Conduct synchronous dialogue (max 3 rounds)
2. Reach consensus or escalate to @tech-lead
3. Update Beads with review outcome
4. Generate transcript at `agent_docs/reviews/<work-item-id>-review.md`

### 7. Report Outcome

After review completes:

**If APPROVED:**
```
Review Complete: <work-item-id>
Status: APPROVED
Reviewer: @[peer-agent]
Summary: [review summary]

Work item ready for QA handoff.
Transcript: agent_docs/reviews/<work-item-id>-review.md
```

**If APPROVED_WITH_CONDITIONS:**
```
Review Complete: <work-item-id>
Status: APPROVED WITH CONDITIONS
Reviewer: @[peer-agent]
Conditions:
- [condition 1]
- [condition 2]

Address conditions before QA handoff.
Transcript: agent_docs/reviews/<work-item-id>-review.md
```

**If ESCALATED:**
```
Review Escalated: <work-item-id>
Status: ESCALATED TO @tech-lead
Reason: [escalation reason]

@tech-lead will arbitrate and make binding decision.
Transcript: agent_docs/reviews/<work-item-id>-review.md
```

---

## Skip Criteria Details

| Criteria | How to Detect | Example |
|----------|---------------|---------|
| `trivial` tag | Work item contains "trivial" | Typo fix, version bump |
| `docs-only` tag | Work item contains "docs-only" | README update, comment fixes |
| No code changes | git diff shows only non-code files | Only .md changes |
| Explicit skip | `--skip-review --reason "X"` flag | User decision |
| Parent reviewed | Parent item has `REVIEW: approved` | Sub-task of reviewed epic |

**Valid skip reasons:**
- `trivial` - Minor change with no functional impact
- `docs-only` - Documentation changes only
- `no-code` - No code files modified
- `config-only` - Configuration file changes only
- `parent-reviewed` - Parent work item already reviewed
- `[custom]` - User-provided reason with `--reason`

---

## Examples

### Example 1: Standard Review Request
```bash
/request-review bd-auth.3
```
Output:
```
Starting review for bd-auth.3
Implementer: @backend-engineer
Peer: @backend-engineer
Status: REVIEW: pending

[council-review skill conducts dialogue...]

Review Complete: bd-auth.3
Status: APPROVED
Summary: Auth middleware implementation approved. Clean separation of concerns.
Transcript: agent_docs/reviews/bd-auth.3-review.md
```

### Example 2: Skip Review (Trivial)
```bash
/request-review bd-docs.1 --skip-review --reason "docs-only README update"
```
Output:
```
Review skipped for bd-docs.1
Reason: docs-only README update
Work item ready for QA handoff.
```

### Example 3: Force Review
```bash
/request-review bd-config.2 --force-review
```
Output:
```
Forcing review for bd-config.2 (skip criteria met but --force-review specified)
[proceeds with standard review flow]
```

### Example 4: Escalated Review
```bash
/request-review bd-api.5
```
Output:
```
Starting review for bd-api.5
Implementer: @backend-engineer
Peer: @backend-engineer

[council-review skill conducts dialogue...]
[No consensus after 3 rounds]

Review Escalated: bd-api.5
Status: ESCALATED TO @tech-lead
Reason: Disagreement on error handling approach

@tech-lead arbitrating...

Arbitration Complete:
Decision: Use Result type pattern as @backend-engineer suggested
Rationale: Aligns with existing codebase patterns

Review Complete: bd-api.5
Status: APPROVED (via arbitration)
Transcript: agent_docs/reviews/bd-api.5-review.md
```

---

## Beads Commands Reference

```bash
# View work item
bd show <id> --json

# Update with review state
bd update <id> -d "REVIEW: pending" --json
bd update <id> -d "REVIEW: approved - [summary]" --json
bd update <id> -d "REVIEW: skipped (reason: trivial)" --json

# Check for items pending review
bd list --status in_progress --json | jq '.[] | select(.body | contains("REVIEW: pending"))'
```

---

## Notes for Agents

- **Implementing agents:** Request review after completing implementation
- **@work-orchestrator:** Automatically triggers this after agents signal completion
- **@tech-lead:** Engaged only when escalation occurs
- Review must complete before `/close-work-item` will succeed

## Integration Points

- **`/close-work-item`:** Checks for `REVIEW: approved|skipped` before allowing closure
- **`/execute-work`:** Automatically triggers review phase after implementation
- **`/handoff-work-item`:** Blocks Engineer→QA handoffs without review completion
