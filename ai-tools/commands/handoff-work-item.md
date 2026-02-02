# Handoff Work Item Command

**Intended For:** 🤖 Agent
**Primary User:** All engineer agents
**Purpose:** Hand off work item to another agent for next phase
**Triggers:** Work phase complete, needs different expertise

## Instructions

You are handing off a work item to another agent. Follow this process:

1. **Verify Handoff Readiness:**
   - Your portion of work is complete
   - All necessary documentation is created
   - No unresolved blockers that prevent next step
   - Acceptance criteria for your phase are met

2. **Verify Review Status (for Engineer → QA Handoffs):**

   **If handing off TO a QA agent** (@qa-backend, @qa-frontend, @qa-firmware):

   ```bash
   bd show <work-item-id> --json
   # Check for REVIEW: in description
   ```

   | Review State | Can Handoff to QA? |
   |--------------|-------------------|
   | `REVIEW: approved` | Yes |
   | `REVIEW: approved_with_conditions` | Yes (if conditions addressed) |
   | `REVIEW: skipped (reason: X)` | Yes |
   | `REVIEW: pending` | NO |
   | `REVIEW: in_progress` | NO |
   | `REVIEW: escalated` | NO |
   | Missing | NO |

   **If review not complete:**
   ```
   HANDOFF BLOCKED: Peer review required before QA handoff.

   Current state: [state or "no review found"]

   Run: /request-review <work-item-id>

   Or to skip review:
   /request-review <work-item-id> --skip-review --reason "[reason]"
   ```

   **Handoffs that do NOT require review:**
   - Requirements → Design (@product-manager → @tech-lead)
   - Design → Engineering (@tech-lead → @[engineer])
   - Engineering → Engineering (collaboration between engineers)
   - QA → Product (@qa-* → @product-manager)

3. **Prepare Handoff Package:**
   ```bash
   # Update work item with final status and handoff notes
   bd update <id> -d "Handoff to @next-agent: [context and notes]" --json
   ```
   - Document what was completed
   - Document what needs to happen next
   - Create or link to implementation docs
   - Identify any gotchas or areas of concern

4. **Identify Next Agent:**
   - Determine who should own this work item next
   - Typical flow: @product-manager → @tech-lead → @[engineer] → **[peer review]** → @qa-[domain] → @product-manager

5. **Execute Handoff:**
   ```bash
   # Add detailed handoff notes
   bd update <id> -d "HANDOFF: @from-agent → @to-agent

   Work Completed:
   - [Task 1 with reference to output]
   - [Task 2 with reference to output]

   What's Next:
   [Clear description of what the next agent needs to do]

   Context:
   - [Important detail 1]
   - [Important detail 2]" --json
   ```

6. **Notify Agents:**
   - Notify next agent with context
   - Make yourself available for questions

## Template: Handoff Progress Entry

When updating the work item description with handoff notes:

```
HANDOFF: @[previous-agent] → @[next-agent]
Date: [YYYY-MM-DD]

Work Completed:
- [Task 1 with reference to output]
- [Task 2 with reference to output]
- [Task 3 with reference to output]

Documentation Created:
- `agent_docs/implementations/[domain]/[filename].md`
- PR: [link]
- Tests: [link or description]

What's Next:
[Clear description of what the next agent needs to do]

Acceptance Criteria Status:
- [x] [Criterion 1] - Completed
- [x] [Criterion 2] - Completed
- [ ] [Criterion 3] - Needs next agent

Context for Next Agent:
- [Important detail 1]
- [Important detail 2]
- [Area of concern or complexity]
```

## Common Handoff Patterns

### 1. Requirements → Technical Design
**From:** @product-manager
**To:** @tech-lead
**Context:** Requirements are approved, need architectural design

```
HANDOFF: @product-manager → @tech-lead

Work Completed:
- Requirements document created: `agent_docs/requirements/feature-name.md`
- User stories defined with acceptance criteria
- Success metrics identified

What's Next:
Please review requirements and create technical design. Specifically:
- Architecture approach for [complex part]
- Data model design
- API contracts for frontend/backend integration

Context for @tech-lead:
- Performance is critical: target <200ms response time
- Must integrate with existing auth system
- Mobile-first design required
```

### 2. Technical Design → Implementation
**From:** @tech-lead
**To:** @frontend-engineer, @backend-engineer, @database-engineer
**Context:** Design is approved, ready for implementation

```
HANDOFF: @tech-lead → @backend-engineer, @frontend-engineer

Work Completed:
- Technical design: `agent_docs/designs/feature-name/technical-design.md`
- Architecture decision record: `agent_docs/architecture/decisions/ADR-XXX.md`
- API contracts defined

What's Next:
Implementation can begin in parallel:
- @backend-engineer: Implement API endpoints per design
- @frontend-engineer: Implement UI components per mockups
- Coordinate on API contract at [link]

Context for Engineers:
- Database schema already migrated (see PR #123)
- Use existing auth middleware
- Follow error handling pattern from ADR-025
```

### 3. Implementation → QA
**From:** @[engineer]
**To:** @qa-[domain]
**Context:** Implementation complete, **peer review passed**, ready for testing

**IMPORTANT:** Peer review must be complete before handoff to QA. Check for `REVIEW: approved|skipped` in work item.

```
HANDOFF: @frontend-engineer → @qa-frontend

Work Completed:
- Feature implemented per requirements
- Unit tests passing (coverage: 85%)
- **Peer review: APPROVED** (see agent_docs/reviews/bd-xxx-review.md)
- Code reviewed and merged
- Deployed to staging environment

What's Next:
Please test against acceptance criteria in `agent_docs/requirements/feature-name.md`

Context for @qa-frontend:
- Test environment: https://staging.example.com
- Test credentials: [location]
- Focus areas: form validation and error states
- Review transcript: agent_docs/reviews/bd-feature.3-review.md
```

### 4. QA → Product Validation
**From:** @qa-[domain]
**To:** @product-manager
**Context:** Testing complete, ready for product acceptance

```
HANDOFF: @qa-frontend → @product-manager

Work Completed:
- All acceptance criteria tested and passing
- Regression testing complete
- Bug fixes verified
- Test report: `agent_docs/testing/reports/feature-name.md`

What's Next:
Please validate feature meets product requirements and user expectations.
Ready for production deployment pending your approval.

Context for @product-manager:
- All high-priority bugs fixed
- Performance meets targets (<150ms average)
- Accessibility compliance verified (WCAG AA)
```

## Usage Examples

### Example 1: Simple Handoff
```bash
# Update work item with handoff notes
bd update bd-auth.2 -d "HANDOFF: @backend-engineer → @frontend-engineer. API complete. Ready for frontend integration." --json
```

### Example 2: Handoff with Multiple Next Agents
```bash
# Update work item for parallel handoff
bd update bd-dash.1 -d "HANDOFF: @tech-lead → @frontend-engineer, @backend-engineer. Design approved. Both can work in parallel per technical design doc." --json
```

## Beads Commands Reference

```bash
# View current work item state
bd show <id> --json

# Update with handoff notes
bd update <id> -d "handoff notes here" --json

# Check dependencies (ensure blockers resolved before handoff)
bd dep tree <id>

# If creating child tasks for next agent
bd create "Next phase task" --parent <id> --json
```

## Notes for Agents

- **All agents:** Use this command when your work is complete and another agent needs to take over.
- **@work-orchestrator:** Use `bd list --status in_progress --json` to track workflow progress and identify bottlenecks.
- Include enough context for the next agent to work independently.
- Document any non-obvious details or gotchas.
- Make yourself available for questions during transition.

## Best Practices

1. **Complete your work first:** Don't handoff incomplete work without explicit reason
2. **Provide context:** Next agent shouldn't need to hunt for information
3. **Link everything:** Implementation docs, PRs, tests, designs
4. **Highlight concerns:** Point out complex areas or potential issues
5. **Be available:** Successful handoffs require smooth knowledge transfer
