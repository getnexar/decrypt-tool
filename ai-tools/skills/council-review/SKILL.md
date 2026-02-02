---
name: council-review
description: Facilitates synchronous peer review dialogue between agents. Orchestrates implementer-peer discussion, consensus building, and escalation to @tech-lead when needed. Produces review transcripts and updates Beads work items.
allowed-tools: Read, Bash, Grep, Glob, Write, Task
---

# Council Review Skill

Orchestrate peer review between implementer and domain peer through structured dialogue, reaching consensus or escalating to @tech-lead for arbitration.

## When to Use

- After implementation complete, before QA handoff
- Triggered by `/request-review` command
- Enforced by `/close-work-item` (cannot close without review)
- **Automatically triggered** in isolated session orchestration (v6.3+)

---

## Pre-Approval Verification Gate [BLOCKING]

Before ANY approval decision, the review council MUST complete all verification steps. This gate cannot be bypassed.

### 1. Run Full Test Suite
```bash
npm test  # or appropriate test command
```
- All tests MUST pass
- If tests fail, approval is **BLOCKED**
- No "approve with failing tests" allowed

### 2. Verify Against Original Requirements
- Read the original work item/plan
- Check: Does implementation match ALL requirements?
- Check: Are any requirements missing or partially implemented?
- Check: Were any requirements changed without documentation?

### 3. Evidence Documentation [MANDATORY]
- Every concern or approval MUST cite specific code references
- Format: `file_path:line_number`
- "Looks good" is **NOT** valid feedback
- Every observation must reference actual code

**Examples of valid feedback:**
```
✅ "The error handling in src/api/users.ts:47-52 properly catches auth failures"
✅ "Missing null check at src/components/Form.tsx:123 could cause crash"
```

**Examples of invalid feedback:**
```
❌ "The code looks clean"
❌ "LGTM"
❌ "Approve - good work"
```

### 4. Test Coverage Check
- New code MUST have test coverage
- If coverage gaps exist, document them explicitly
- Coverage gaps require justification or remediation

---

## Approval Blockers [HARD GATES]

Approval is **BLOCKED** if ANY of these conditions are true:

| Blocker | Detection | Resolution |
|---------|-----------|------------|
| Tests failing | `npm test` fails | Fix tests before approval |
| Missing test coverage | New code without tests | Add tests or document exception |
| Security concerns identified | Review finding | Must be addressed, not deferred |
| Performance concerns identified | Review finding | Must be addressed or documented with metrics |
| Requirements not fully met | Compare to work item | Complete implementation |
| "Fix post-merge" recommended | Review comment | **NEVER ALLOWED** - fix now |

### The "Fix Post-Merge" Rule

**CRITICAL:** The phrase "fix post-merge", "address later", "technical debt ticket", or any variant is **FORBIDDEN** in approval decisions.

If an issue is identified:
1. It MUST be fixed before approval, OR
2. It MUST be documented as explicitly out of scope with PM approval, OR
3. The PR is rejected until the issue is addressed

There is no middle ground. If you can identify the issue, you can fix it now.

## Isolated Session Mode (v6.3+)

When running as a review session in the isolated orchestration model:

### Detection
You're in isolated session mode if:
- Environment variable `AMPLIFY_SESSION_ID` is set
- You're in a git worktree (`.git` is a file, not directory)

### Session Buffer Integration

**Read work session summary:**
```bash
# Session dir constructed from env vars (set by orchestrator)
SESSION_DIR=~/.amplify/workspaces/$AMPLIFY_WORKSPACE_HASH/instance-$AMPLIFY_INSTANCE_ID/isolated-sessions/$AMPLIFY_SESSION_ID
cat $SESSION_DIR/summary.md
```

**Write review decision:**
```bash
cat > $SESSION_DIR/review.json << 'EOF'
{
  "decision": "approved",
  "summary": "Code review passed. All tests pass.",
  "reviewedBy": "@peer-agent, @tech-lead",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
```

**Update session state on completion:**
```bash
node -e "
const fs = require('fs');
const sessionDir = process.env.HOME + '/.amplify/workspaces/' + process.env.AMPLIFY_WORKSPACE_HASH + '/instance-' + process.env.AMPLIFY_INSTANCE_ID + '/isolated-sessions/' + process.env.AMPLIFY_SESSION_ID;
const statePath = sessionDir + '/state.json';
const state = JSON.parse(fs.readFileSync(statePath));
state.status = 'approved'; // or 'rejected'
state.completedAt = new Date().toISOString();
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
"
```

### Review Council Powers (Isolated Mode)

In isolated session mode, the review council has enhanced powers:
- **Can modify code** to fix issues found during review
- **Must run full test suite** before approval
- **Must verify original functionality** is preserved
- **Can commit fixes** directly to the worktree branch

### Isolated Mode Workflow

1. Read the work session summary
2. Review all changed files (`git diff main...HEAD`)
3. Run full test suite (`npm test`)
4. If issues found:
   - Fix them directly
   - Commit with message: `fix: [description from review]`
   - Re-run tests
5. Write review decision to session buffer
6. Update session state

## Skip Criteria

Review can be skipped if ANY condition is met:

| Criteria | Detection Method |
|----------|------------------|
| `trivial` tag | Work item title/tags contain "trivial" |
| `docs-only` tag | Work item title/tags contain "docs-only" |
| No code changes | `git diff --name-only` shows only .md, .txt, .json files |
| Explicit skip | `--skip-review` flag with documented reason |
| Sub-task reviewed | Parent work item already has `REVIEW: approved` |

---

## Peer Selection Logic

Match implementer to domain peer:

| Implementer | Primary Reviewer | Fallback |
|-------------|------------------|----------|
| @backend-engineer | @backend-engineer | @tech-lead |
| @frontend-engineer | @frontend-engineer | @tech-lead |
| @database-engineer | @database-engineer | @tech-lead |
| @ai-engineer | @ai-engineer | @tech-lead |
| @firmware-engineer | @firmware-engineer | @tech-lead |
| @devops-engineer | @devops-engineer | @tech-lead |
| Cross-domain work | @tech-lead | - |

**Note:** @tech-lead serves as universal peer for cross-domain or when no domain peer is available.

---

## Review Protocol

### Phase 1: Context Loading

1. **Load work item details:**
   ```bash
   bd show <work-item-id> --json
   ```

2. **Identify implementer from work item** (who marked it `in_progress`)

3. **Load implementation context:**
   - Read relevant implementation docs from `agent_docs/implementations/`
   - Get git diff: `git diff main...HEAD` or `git diff HEAD~1`
   - Read affected files

4. **Select peer reviewer** using Peer Selection Logic above

### Phase 2: Synchronous Dialogue (Max 3 Rounds)

The dialogue follows a structured format. Each round consists of implementer statement followed by peer response.

#### Round 1: Opening

**Implementer presents:**
- What was built and why
- Key implementation decisions made
- Areas of uncertainty or concern
- Specific feedback requested

**Peer responds:**
- Initial technical assessment
- Questions about implementation choices
- Concerns or potential issues
- Suggestions for improvement

#### Round 2: Clarification

**Implementer responds:**
- Addresses peer questions
- Explains decisions with rationale
- Agrees or disagrees with suggestions (with reasoning)
- Proposes adjustments if needed

**Peer responds:**
- Follow-up questions (if any)
- Accepts explanations OR maintains concerns
- Moves toward consensus OR identifies blocking issues

#### Round 3: Resolution (if needed)

**Implementer:**
- Final clarifications
- Commits to specific changes (if agreed)

**Peer concludes with ONE of:**
- `CONSENSUS: APPROVED` - Implementation is acceptable
- `CONSENSUS: APPROVED_WITH_CONDITIONS` - Acceptable with specific changes
- `ESCALATE: [reason]` - Cannot reach agreement, need @tech-lead

### Phase 3: Consensus or Escalation

**If CONSENSUS reached:**
1. Document agreement in transcript
2. Update Beads: `bd update <id> -d "REVIEW: approved - [summary]" --json`
3. Generate transcript file

**If ESCALATE triggered (or 3 rounds without consensus):**
1. Document disagreement in transcript
2. Update Beads: `bd update <id> -d "REVIEW: escalated - [reason]" --json`
3. Engage @tech-lead for arbitration (see Escalation Protocol below)

### Phase 4: Documentation

1. **Generate transcript** at `agent_docs/reviews/<work-item-id>-review.md`
2. **Update Beads work item** with review summary
3. **Notify orchestrator** that review is complete

---

## Escalation Protocol

When escalated to @tech-lead:

### Tech-Lead Receives:
- Full review transcript
- Implementation context (files, decisions)
- Points of disagreement clearly stated

### Tech-Lead Actions:
1. **Review both positions** objectively
2. **Assess technical merit** of each approach
3. **Check alignment** with architecture and standards
4. **If requirements unclear:** Engage @product-manager for clarification
5. **Make binding decision** - all parties must commit

### Arbitration Decision Format:
```markdown
## Tech-Lead Arbitration

**Work Item:** <id>
**Participants:** @implementer, @peer
**Escalation Reason:** [why consensus failed]

### Analysis
[Brief analysis of both positions]

### Decision
[Clear ruling on how to proceed]

### Rationale
[Why this approach was chosen]

### Required Actions
- [ ] [Specific action 1]
- [ ] [Specific action 2]

### PM Involvement
[Yes/No - if yes, what was clarified]

**Binding:** All parties commit to this decision.
```

---

## Dialogue Output Format

During the review, format dialogue as:

```markdown
### Round 1

**@implementer:**
> [Opening statement about implementation]

**@peer:**
> [Review response with assessment/questions/suggestions]

### Round 2

**@implementer:**
> [Response to feedback]

**@peer:**
> [Follow-up or consensus statement]

### Outcome
**Decision:** [CONSENSUS: APPROVED | CONSENSUS: APPROVED_WITH_CONDITIONS | ESCALATE]
**Summary:** [1-2 sentence summary]
```

---

## Beads Integration

### Review States

Track in work item description:

| State | Meaning |
|-------|---------|
| `REVIEW: pending` | Review requested, not started |
| `REVIEW: in_progress` | Dialogue underway |
| `REVIEW: approved` | Consensus reached, approved |
| `REVIEW: approved_with_conditions` | Approved with specific changes |
| `REVIEW: escalated` | Sent to @tech-lead |
| `REVIEW: skipped (reason: X)` | Review skipped with documented reason |

### Update Commands

```bash
# Start review
bd update <id> -d "REVIEW: in_progress - Review started with @peer" --json

# Approved
bd update <id> -d "REVIEW: approved - @peer approved. [Brief summary]" --json

# Approved with conditions
bd update <id> -d "REVIEW: approved_with_conditions - Must address: [conditions]" --json

# Escalated
bd update <id> -d "REVIEW: escalated - Disagreement on [topic]. @tech-lead arbitrating." --json

# Skipped
bd update <id> -d "REVIEW: skipped (reason: trivial - config file update only)" --json
```

---

## Review Criteria by Domain

### Backend Reviews
- API design and RESTful conventions
- Error handling and response formats
- Database query efficiency
- Authentication/authorization
- Input validation
- Logging and observability

### Frontend Reviews
- Component structure and reusability
- State management patterns
- Accessibility (a11y)
- Performance (bundle size, rendering)
- User experience consistency
- Error boundaries and loading states

### Database Reviews
- Schema design and normalization
- Migration safety (rollback possible?)
- Index usage and query performance
- Data integrity constraints
- Backup/recovery considerations

### AI/ML Reviews
- Prompt design and effectiveness
- Evaluation metrics and baselines
- Cost and latency considerations
- Error handling for LLM failures
- Security (prompt injection, data leakage)

### Firmware Reviews
- Memory management
- Real-time constraints
- Hardware interface correctness
- Power consumption
- Safety-critical considerations

---

## Transcript Template

See `TEMPLATES/review-transcript-template.md` for the complete transcript format.

---

## Validation Checklist

Before concluding review, verify:

- [ ] All implementation aspects discussed
- [ ] Key decisions documented with rationale
- [ ] Concerns addressed or escalated
- [ ] Clear outcome (APPROVED / APPROVED_WITH_CONDITIONS / ESCALATED)
- [ ] Beads work item updated with review state
- [ ] Transcript written to `agent_docs/reviews/`
- [ ] If conditions exist, they are specific and actionable

---

## Context Files

> **Context Discipline:** Only load files directly relevant to the work item being reviewed. Check `agent_docs/index.md` first if unsure which files are needed.

Reference during reviews:
- `agent_docs/index.md` - Check first for file discovery
- `agent_docs/technical-setup.md` - Tech stack (only when needed for context)
- `agent_docs/decisions/` - Previous decisions (only relevant ones)
- `agent_docs/implementations/[domain]/[feature].md` - Specific implementation being reviewed
- `.claude/agents/` - Agent responsibilities (only for peer selection)
