---
name: amplify-planning
description: Strategy-first planning with separate strategy and implementation documents. Ensures "why" is documented before "what". Use for non-trivial features requiring explicit approval.
allowed-tools: Read, Write, Bash, Grep, Glob, Task, AskUserQuestion
---

# Amplify Planning Skill

Strategy-first planning that separates strategic decisions from implementation details. This ensures the "why" is documented and approved before the "what".

## When to Use

- Non-trivial features (more than 3 steps or 2 files)
- Architectural changes
- Any work requiring stakeholder alignment
- After brainstorming has determined the approach

## Core Principle

**Strategy before tactics. Document why before documenting what.**

---

## Two-Document Structure

All planning produces TWO documents, created in order:

### 1. Strategy Document
**Purpose:** Captures the "why" - problem, alternatives, decision rationale
**Created:** First
**Approval:** Required before creating implementation plan
**Location:** `docs/plans/YYYY-MM-DD-<feature>-strategy.md`

### 2. Implementation Plan
**Purpose:** Captures the "what" - tasks, files, code, tests
**Created:** After strategy is approved
**Approval:** Required before implementation begins
**Location:** `docs/plans/YYYY-MM-DD-<feature>-plan.md`

---

## Strategy Document Template

```markdown
# [Feature Name] Strategy

**Author:** [Agent name]
**Date:** [YYYY-MM-DD]
**Status:** Draft | Under Review | Approved | Superseded

## Problem Statement

### What Problem Are We Solving?
[Clear, concise description of the problem in 1-3 sentences]

### Why Does This Problem Matter?
- Business impact: [how this affects the business]
- User impact: [how this affects users]
- Technical impact: [how this affects the system]

### Success Criteria
How will we know this problem is solved?
- [ ] Criterion 1: [measurable outcome]
- [ ] Criterion 2: [measurable outcome]
- [ ] Criterion 3: [measurable outcome]

---

## Alternatives Considered

| Approach | Description | Pros | Cons | Effort |
|----------|-------------|------|------|--------|
| Option A: [Name] | [1-2 sentences] | [bullets] | [bullets] | [S/M/L] |
| Option B: [Name] | [1-2 sentences] | [bullets] | [bullets] | [S/M/L] |
| Option C: Do Nothing | Status quo | [bullets] | [bullets] | None |

### Why Not Option [X]?
[Explain why rejected alternatives were rejected]

---

## Recommended Approach

**Selected:** Option [X]: [Name]

### Rationale
[Why this approach was chosen over alternatives]

### Key Trade-offs
- Trade-off 1: [what we're giving up for what we're gaining]
- Trade-off 2: [what we're giving up for what we're gaining]

---

## Assumptions

Explicit assumptions this strategy relies on:

| # | Assumption | Impact if Wrong | Validation |
|---|------------|-----------------|------------|
| 1 | [assumption] | [what happens if false] | [how to verify] |
| 2 | [assumption] | [what happens if false] | [how to verify] |
| 3 | [assumption] | [what happens if false] | [how to verify] |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [risk 1] | High/Med/Low | High/Med/Low | [how to mitigate] |
| [risk 2] | High/Med/Low | High/Med/Low | [how to mitigate] |

---

## Dependencies

### External Dependencies
- [ ] [Dependency 1] - Status: [ready/pending/blocked]
- [ ] [Dependency 2] - Status: [ready/pending/blocked]

### Internal Dependencies
- [ ] [Prior work item or decision]

---

## Multi-Perspective Review

### Architecture (@tech-lead)
- Alignment with existing architecture: [yes/no - explanation]
- Integration concerns: [list]
- Scalability considerations: [notes]
- **Decision:** Approved / Needs changes / Rejected

### Security
- Authentication/authorization impact: [notes]
- Data exposure risks: [notes]
- Input validation requirements: [notes]
- **Concerns identified:** [list or "None"]

### Testing (@test-engineer)
- Test strategy overview: [how this will be tested]
- Coverage requirements: [target percentage or criteria]
- Special testing needs: [list]

---

## Approval

| Role | Name | Decision | Date |
|------|------|----------|------|
| Author | [name] | Proposed | [date] |
| Tech Lead | [name] | Pending | - |
| Product | [name] | Pending | - |

**Strategy Status:** DRAFT

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| [date] | [name] | Initial draft |
```

---

## Implementation Plan Template

**Only create after strategy is approved.**

```markdown
# [Feature Name] Implementation Plan

**Strategy:** [link to strategy document]
**Author:** [Agent name]
**Date:** [YYYY-MM-DD]
**Status:** Draft | Approved | In Progress | Complete

---

## Overview

Brief summary of what will be implemented based on the approved strategy.

---

## Implementation Tasks

### Phase 1: [Phase Name]

#### Task 1.1: [Task Name]
- **Description:** [What needs to be done]
- **Files:**
  - `path/to/file1.ts` - [what changes]
  - `path/to/file2.ts` - [what changes]
- **Dependencies:** [what must be done first]
- **Acceptance Criteria:**
  - [ ] [Specific, testable criterion]
  - [ ] [Specific, testable criterion]
- **Tests Required:**
  - [ ] Unit test: [description]
  - [ ] Integration test: [description]

#### Task 1.2: [Task Name]
[same format]

### Phase 2: [Phase Name]
[same format]

---

## Test Strategy

### Unit Tests
| Component | Test File | Coverage Target |
|-----------|-----------|-----------------|
| [component] | [path] | [percentage] |

### Integration Tests
| Scenario | Test File | What It Validates |
|----------|-----------|-------------------|
| [scenario] | [path] | [description] |

### E2E Tests (if applicable)
| User Journey | Test File | Steps |
|--------------|-----------|-------|
| [journey] | [path] | [high-level steps] |

---

## Rollback Plan

If this implementation needs to be reverted:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Rollback criteria:** [When to trigger rollback]

---

## Verification Checklist

Before marking implementation complete:

- [ ] All tasks completed
- [ ] All tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Rollback plan tested (if applicable)
- [ ] Success criteria from strategy met

---

## Execution Notes

[Space for notes during implementation - blockers, decisions, changes]

| Date | Note |
|------|------|
| | |
```

---

## Workflow

### Step 1: Create Strategy (First)

1. Receive input from brainstorming
2. Create strategy document using template
3. Fill in all sections (no placeholders like "[TBD]")
4. Submit for review

### Step 2: Strategy Review

1. @tech-lead reviews architecture alignment
2. Security concerns addressed
3. Test strategy validated
4. All assumptions documented

**Gate:** Strategy must be APPROVED before proceeding.

### Step 3: Create Implementation Plan (After Approval)

1. Only after strategy is approved
2. Create implementation plan using template
3. Break down into concrete tasks
4. Define test requirements per task

### Step 4: Plan Review

1. Verify tasks cover all strategy requirements
2. Verify test coverage is adequate
3. Verify rollback plan exists

**Gate:** Plan must be APPROVED before implementation begins.

---

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Skipping strategy for "simple" features | Even simple features need documented rationale |
| Strategy with "[TBD]" placeholders | Fill in all sections or mark as explicit unknowns |
| Implementation plan before strategy approval | Wait for strategy approval |
| Single document for both | Always use two separate documents |
| Copying the template without thinking | Each section should reflect actual analysis |

---

## Integration with Beads

When creating work items from a plan:

```bash
# Create work item linked to plan
bd create -t "[Task name from plan]" \
  -d "From plan: docs/plans/YYYY-MM-DD-feature-plan.md
Task: [task reference]
Acceptance: [criteria]" \
  --json

# Link strategy in work item
bd update <id> -d "Strategy: docs/plans/YYYY-MM-DD-feature-strategy.md" --json
```

---

## Context Files

> **Context Discipline:** Load strategy context, not implementation details.

- `agent_docs/project-overview.md` - Project context
- `agent_docs/decisions/` - Prior decisions that may affect strategy
- `docs/plans/` - Existing strategies for reference
- Brainstorming output from `amplify-brainstorming`
