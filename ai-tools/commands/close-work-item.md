# Close Work Item Command

**Intended For:** Agent
**Primary User:** All agents (typically @qa-engineer or completing agent)
**Purpose:** Mark work item as complete in Beads.
**Triggers:** All acceptance criteria met, quality gates passed, work verified

## Instructions

You are closing a work item using Beads. Follow this checklist:

1. **Verify Completion Criteria:**
   - [ ] All acceptance criteria met and verified
   - [ ] All quality gates passed (use `/run-quality-gates`)
   - [ ] **Peer review completed** (MANDATORY - see Step 2)
   - [ ] Tests passing (unit, integration, e2e)
   - [ ] Documentation updated
   - [ ] Product owner acceptance received

2. **Verify Review Completion [MANDATORY]:**

   Check the work item description for review state:
   ```bash
   bd show <work-item-id> --json
   # Look for REVIEW: in the description/body
   ```

   **Review State Validation:**

   | State | Can Close? | Action |
   |-------|------------|--------|
   | `REVIEW: approved` | Yes | Proceed to close |
   | `REVIEW: approved_with_conditions` | Yes* | Verify conditions addressed first |
   | `REVIEW: skipped (reason: X)` | Yes | Proceed if skip reason is valid |
   | `REVIEW: pending` | NO | Wait for review to complete |
   | `REVIEW: in_progress` | NO | Wait for review to complete |
   | `REVIEW: escalated` | NO | Wait for @tech-lead decision |
   | Missing | NO | Run `/request-review` first |

   **If Review Not Complete:**
   ```
   CLOSURE BLOCKED: Peer review required.

   Current state: [state or "no review found"]

   Options:
   1. Run: /request-review <work-item-id>
   2. Skip review: /request-review <work-item-id> --skip-review --reason "[reason]"

   Review is required unless work item:
   - Is tagged 'trivial' or 'docs-only'
   - Has no code file changes
   - Has explicit skip with documented reason
   ```

   **Do NOT proceed with closure until review state is `approved` or validly `skipped`.**

3. **Close Work Item with Beads:**

   ```bash
   # Close with reason (required)
   bd close bd-abc --reason "Implemented and tested successfully" --json

   # Close with detailed reason
   bd close bd-abc --reason "Feature complete: Added user profile editing with avatar upload. All tests passing, PR merged." --json
   ```

4. **Verify Closure:**

   ```bash
   # Confirm work item is closed
   bd show bd-abc --json

   # Check what's now unblocked
   bd ready --json
   ```

5. **Document Completion (if significant work):**
   - Create implementation doc: `agent_docs/implementations/[domain]/[feature-name].md`
   - Record decisions: `agent_docs/decisions/[decision-name].md`
   - Note technical debt: `agent_docs/debt/[debt-item].md`

## Beads Command Reference

```bash
# Close work item (required: --reason)
bd close <id> --reason "completion description" --json

# Show work item status
bd show <id> --json

# List closed work items
bd list --status closed --json

# Check what's now ready (newly unblocked)
bd ready --json
```

## Checklist Before Closing

### For Features
- [ ] All user stories implemented
- [ ] Acceptance criteria met
- [ ] **Peer review completed** (`REVIEW: approved|skipped`)
- [ ] QA testing complete
- [ ] Product owner accepted
- [ ] Documentation updated
- [ ] Deployed or ready to deploy

### For Bugs
- [ ] Bug fix implemented
- [ ] Root cause documented
- [ ] **Peer review completed** (`REVIEW: approved|skipped`)
- [ ] Regression test added
- [ ] Fix verified
- [ ] Reporter notified

### For Technical Work
- [ ] Technical objective achieved
- [ ] **Peer review completed** (`REVIEW: approved|skipped`)
- [ ] Code quality improved
- [ ] Documentation updated
- [ ] Team informed of changes

## Usage Examples

### Example 1: Feature Completion
```bash
bd close bd-auth.3 --reason "Login UI complete. Form validation, error handling, and responsive design implemented. All E2E tests passing." --json
```

### Example 2: Bug Fix Completion
```bash
bd close bd-bug123 --reason "Fixed login timeout issue. Root cause: session config was 5min instead of 30min. Added monitoring alert for session issues." --json
```

### Example 3: Technical Debt
```bash
bd close bd-tech456 --reason "Database queries optimized. Average query time reduced from 800ms to 120ms. Added query performance tests." --json
```

### Example 4: Spike/Research
```bash
bd close bd-spike789 --reason "OAuth research complete. Recommendation: Use Auth0 for OAuth. See agent_docs/decisions/auth-provider-selection.md" --json
```

### Example 5: Epic Completion
```bash
# Close all child items first
bd close bd-auth.1 --reason "User schema created with migrations"
bd close bd-auth.2 --reason "Auth API with JWT implemented"
bd close bd-auth.3 --reason "Login UI complete"
bd close bd-auth.4 --reason "Backend tests passing"
bd close bd-auth.5 --reason "E2E tests complete"

# Then close the parent epic
bd close bd-auth --reason "User Authentication feature complete. All components implemented, tested, and deployed."
```

## What Happens When You Close

1. **Status Changes:** Work item status → `closed`
2. **Dependencies Unlock:** Any work items blocked by this one become unblocked
3. **Ready Work Updates:** `bd ready` will now return newly unblocked items
4. **Audit Trail:** Closure reason and timestamp recorded

## Notes for Agents

- **@qa-engineer:** Often closes feature work items after validation
- **@product-manager:** Closes work items after final product acceptance
- **Engineers:** Close bugs and technical work items after verification
- **@work-orchestrator:** Monitors closures to dispatch next wave of work

## Documentation Reminder [CRITICAL]

> **Context Discipline:** Check `agent_docs/index.md` first to see what documentation already exists for this feature. Avoid duplicating existing docs - update them instead.

**BEFORE closing any significant work item, ensure you have documented:**

1. **Decisions made** during implementation:
   - `agent_docs/decisions/[domain]-[decision-name].md`

2. **Implementation details**:
   - `agent_docs/implementations/[domain]/[feature-name].md`

3. **Technical debt** discovered or created:
   - `agent_docs/debt/[domain]-debt-[id]-[short-name].md`

4. **Test results** (for QA agents):
   - `agent_docs/testing/reports/[feature-name]-test-results.md`

**Use the `documentation-writer` skill for comprehensive documentation.**

## Common Pitfalls to Avoid

1. **Closing prematurely:** Don't close until ALL acceptance criteria are met
2. **Vague reasons:** Provide specific, meaningful closure reasons
3. **Missing documentation:** Document decisions and implementation before closing
4. **Forgetting dependencies:** Check if closing this unblocks other work

## After Closing

1. **Check Ready Work:**
   ```bash
   bd ready --json  # See what's now unblocked
   ```

2. **Notify Team:**
   - @work-orchestrator will see the closure and dispatch next work

3. **Create Follow-up Items (if needed):**
   ```bash
   bd create "Follow-up: Add caching to auth API" -t chore -p 3 --json
   ```

## Verifying Closure

```bash
# Show closed work item
bd show bd-abc --json
# Should show: "status": "closed"

# List all closed items
bd list --status closed --json

# Verify dependent work is now ready
bd ready --json
```
