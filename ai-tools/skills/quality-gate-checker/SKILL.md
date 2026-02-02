---
name: quality-gate-checker
description: Validates readiness for handoffs, PR creation, and deployment across 7 quality gates. Checks implementation quality, test coverage, documentation, and provides pass/fail with remediation steps.
allowed-tools: Read, Bash, Grep, Glob
---

> **CONVERGENCE NOTICE**: For simple "is this fix actually working?" verification, prefer `superpowers:verification-before-completion` which provides evidence-based completion confirmation.
>
> **When to use this skill:**
> - Formal quality gate validation (7 gates: implementation, code, tests, docs, PR, handoff, deployment)
> - Multi-stakeholder handoffs requiring documented verification
> - Pre-deployment readiness checks
> - Compliance or audit requirements
>
> **When to use superpowers:verification-before-completion:**
> - Quick verification that a fix/change actually works
> - Before claiming "done" on any task
> - Evidence-based completion (run tests, check output)

# Core Workflow

This skill validates 7 quality gates with enforced dependencies.

---

## Gate Dependency Matrix [BLOCKING]

Gates MUST be passed in order. You CANNOT skip to later gates without passing earlier ones.

```
Gate 1 (Implementation Readiness)
    │
    ▼ MUST PASS
Gate 2 (Code Quality)
    │
    ▼ MUST PASS
Gate 3 (Test Coverage)
    │
    ▼ MUST PASS
Gate 4 (Documentation)
    │
    ▼ MUST PASS
Gate 5 (PR Readiness)
    │
    ▼ MUST PASS
Gate 6 (Handoff Readiness)
    │
    ▼ MUST PASS
Gate 7 (Deployment Readiness)
```

### Hard Gates (No Exceptions)

| Gate | Skip Allowed? | Rationale |
|------|---------------|-----------|
| Gate 2 (Code Quality) | ❌ NO | Bad code creates compounding problems |
| Gate 3 (Test Coverage) | ❌ NO | Untested code is a liability |
| Gate 5 (PR Readiness) | ❌ NO | Incomplete PRs waste reviewer time |

### Soft Gates (With Documentation)

| Gate | Skip Allowed? | Requires |
|------|---------------|----------|
| Gate 1 (Implementation Readiness) | ⚠️ With approval | PM approval documented |
| Gate 4 (Documentation) | ⚠️ For trivial changes | Documented justification |
| Gate 6 (Handoff Readiness) | ⚠️ Solo work | N/A for single-agent work |
| Gate 7 (Deployment Readiness) | ⚠️ Staging only | Full check required for prod |

---

## Root Cause Analysis for Gate Failures [MANDATORY]

When ANY gate criterion fails, you MUST document:

1. **WHAT** failed (specific criterion)
2. **WHY** it failed (root cause, not symptom)
3. **HOW** to fix it (specific remediation steps)

### Failure Documentation Template

```markdown
## Gate Failure Report

**Gate:** [Gate number and name]
**Criterion:** [Which specific criterion failed]
**Status:** ❌ FAIL

### Root Cause Analysis

**Symptom:** [What the failure looks like]

**Root Cause:** [WHY this actually failed - dig deeper than the symptom]

**Contributing Factors:**
- [Factor 1]
- [Factor 2]

### Remediation Plan

**Immediate Fix:**
- [ ] [Step 1]
- [ ] [Step 2]

**Prevention:**
- [ ] [How to prevent this in future]

**Owner:** [@agent-name]
**Target:** [When this should be fixed]
```

### Example: Good vs Bad Failure Analysis

**❌ BAD (Symptom-only):**
```
Gate 3 failed: Tests not passing
Fix: Make tests pass
```

**✅ GOOD (Root Cause):**
```
Gate 3 failed: Test coverage below threshold

Root Cause: New API endpoints in src/api/tasks.ts (lines 45-120)
were added without corresponding tests. The createTask and
updateTask functions have no unit test coverage.

Remediation:
- [ ] Create src/api/__tests__/tasks.test.ts
- [ ] Add tests for createTask (happy path, validation errors, auth)
- [ ] Add tests for updateTask (happy path, not found, auth)
- [ ] Run coverage report to verify ≥80%
```

---

## Gate Failure Escalation

### When to Escalate

| Failure Type | Action |
|--------------|--------|
| Simple fix (<30 min) | Fix immediately, re-run gate |
| Complex fix (>30 min) | Document as blocking issue, get approval for timeline |
| Architectural issue | Escalate to @tech-lead |
| Requirements unclear | Escalate to @product-manager |

### Escalation Format

```markdown
## Gate Escalation

**Gate:** [Gate number]
**Criterion:** [Failing criterion]
**Escalated To:** [@agent-name]

**Why Escalation:**
[Cannot be fixed at current level because...]

**Options:**
1. [Option A with trade-offs]
2. [Option B with trade-offs]

**Recommended:** [Which option and why]

**Blocking:** Work cannot proceed until resolved.
```

---

## Gate 1: Implementation Readiness (Before Starting Work)

### Checklist

**Requirements Quality:**
- [ ] Requirements document exists and approved
- [ ] Source context specified (project or request)
- [ ] Acceptance criteria clear and testable
- [ ] Success metrics defined
- [ ] Dependencies identified

**Design Quality (if needed):**
- [ ] Technical design document exists
- [ ] Design reviewed and approved by @tech-lead
- [ ] Architecture aligns with system patterns
- [ ] ADR created for significant decisions

**Environment Readiness:**
- [ ] Development environment setup
- [ ] Required services/dependencies available
- [ ] Test data available (if needed)

**Verdict:**
- ✅ **READY** - All criteria met
- ⚠️ **READY WITH CAVEATS** - Minor gaps
- ❌ **NOT READY** - Critical gaps

---

## Gate 2: Code Quality (Before Handoff/PR)

### Checklist

**Readability & Maintainability:**
- [ ] Follows team style guide
- [ ] Variable/function names descriptive
- [ ] Code well-structured
- [ ] Complex logic documented
- [ ] No commented-out code
- [ ] Follows DRY principle

**Functionality:**
- [ ] All acceptance criteria implemented
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] No hardcoded values
- [ ] Logging appropriate

**Security:**
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Auth/authorization proper
- [ ] Sensitive data encrypted
- [ ] No secrets in code
- [ ] Input validation present

**Performance:**
- [ ] No N+1 query problems
- [ ] Database queries optimized
- [ ] Appropriate caching
- [ ] No memory leaks
- [ ] Efficient algorithms

**Dependencies:**
- [ ] New dependencies justified
- [ ] Dependencies up to date
- [ ] No known security vulnerabilities
- [ ] License compatibility verified

**Verdict:**
- ✅ **PASS** - Meets all standards
- ⚠️ **PASS WITH NOTES** - Minor issues
- ❌ **FAIL** - Critical issues

---

## Gate 3: Test Coverage (Before Handoff/PR)

### Checklist

**Test Existence:**
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated (if applicable)
- [ ] E2E tests added (for user-facing features)
- [ ] Tests cover happy path
- [ ] Tests cover edge cases
- [ ] Tests cover error scenarios

**Test Quality:**
- [ ] Tests readable and maintainable
- [ ] Tests use proper assertions
- [ ] Tests are independent
- [ ] Mocks/stubs used appropriately
- [ ] Test data clear and meaningful
- [ ] Test names descriptive

**Test Coverage:**
- [ ] Code coverage ≥80% (or project threshold)
- [ ] All new functions/methods have tests
- [ ] All branches tested
- [ ] Critical paths fully covered

**Test Execution:**
- [ ] All tests passing locally
- [ ] No flaky tests
- [ ] Reasonable execution time

**Domain-Specific:**

**Backend:**
- [ ] API endpoint tests
- [ ] Integration tests with database
- [ ] Contract tests (if API consumer)
- [ ] Performance tests (if critical)
- [ ] Security tests

**Frontend:**
- [ ] Component unit tests
- [ ] E2E user journey tests
- [ ] Visual regression tests (if UI changes)
- [ ] Accessibility tests
- [ ] Cross-browser tests (if significant UI)

**Firmware:**
- [ ] Unit tests for embedded functions
- [ ] HIL tests (if hardware interaction)
- [ ] Protocol tests
- [ ] Memory usage tests
- [ ] Safety tests

**Verdict:**
- ✅ **PASS** - Coverage meets standards
- ⚠️ **PASS WITH GAPS** - Acceptable gaps documented
- ❌ **FAIL** - Insufficient coverage

---

## Gate 4: Documentation (Before Handoff/PR)

### Checklist

**Code Documentation:**
- [ ] Code self-documenting where possible
- [ ] Complex logic has comments
- [ ] Public APIs documented
- [ ] Type definitions documented

**Implementation Documentation:**
- [ ] Implementation doc created (for complex features)
- [ ] Architecture/component overview
- [ ] Code locations documented
- [ ] Key decisions documented
- [ ] Trade-offs explained

**Requirements Traceability:**
- [ ] Linked to requirements document
- [ ] Acceptance criteria verified
- [ ] Out-of-scope items noted

**Deployment Documentation:**
- [ ] Configuration changes documented
- [ ] Environment variables documented
- [ ] Migration steps documented (if applicable)
- [ ] Rollback plan documented (if needed)

**User-Facing Documentation:**
- [ ] README updated (if applicable)
- [ ] API docs updated (if API changes)
- [ ] CHANGELOG updated
- [ ] User guides updated (if user-facing)

**Verdict:**
- ✅ **PASS** - Documentation complete
- ⚠️ **PASS WITH NOTES** - Minor gaps acceptable
- ❌ **FAIL** - Critical documentation missing

---

## Gate 5: PR Readiness (Before Creating PR)

### Checklist

**Pre-PR:**
- [ ] All code changes committed
- [ ] Branch up to date with base
- [ ] Code quality gate passed
- [ ] Test coverage gate passed
- [ ] Documentation gate passed
- [ ] Self-review completed
- [ ] No merge conflicts
- [ ] CI checks passing locally

**PR Content Readiness:**
- [ ] Clear PR title prepared
- [ ] Comprehensive PR description prepared
- [ ] Screenshots ready (if UI changes)
- [ ] Breaking changes documented (if any)
- [ ] Deployment notes prepared (if special considerations)

**Verdict:**
- ✅ **READY FOR PR** - All criteria met
- ⚠️ **ALMOST READY** - Minor items to complete
- ❌ **NOT READY** - Significant work remaining

---

## Gate 6: Handoff Readiness (Before Handing to Another Agent)

### Checklist

**Engineering → QA:**
- [ ] Implementation complete
- [ ] Self-tested and working
- [ ] Unit/integration tests passing
- [ ] Implementation doc created
- [ ] Test data available
- [ ] Known issues documented
- [ ] Acceptance criteria clear

**Design → Engineering:**
- [ ] Technical design approved
- [ ] Requirements linked
- [ ] ADR created (if architectural decision)
- [ ] Dependencies identified
- [ ] Risks documented

**Backend → Frontend (or vice versa):**
- [ ] API contracts defined/implemented
- [ ] Integration points tested
- [ ] Documentation shared
- [ ] Test environment available

**QA → Deployment:**
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance validated
- [ ] Security validated
- [ ] Acceptance criteria met
- [ ] Deployment plan ready

**Verdict:**
- ✅ **READY FOR HANDOFF** - Complete and documented
- ⚠️ **READY WITH NOTES** - Minor items to communicate
- ❌ **NOT READY** - Significant gaps

---

## Gate 7: Deployment Readiness (Before Deploying)

### Checklist

**Testing:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E tests passing
- [ ] Performance tests passing (if applicable)
- [ ] Security tests passing
- [ ] Load tests passing (if high-traffic)

**Quality:**
- [ ] Code reviewed and approved
- [ ] No critical or high-priority bugs
- [ ] Technical debt documented (if accepted)
- [ ] Performance benchmarks met

**Infrastructure:**
- [ ] Deployment script/pipeline ready
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Rollback plan documented and tested
- [ ] Monitoring configured
- [ ] Alerts configured

**Documentation:**
- [ ] Deployment guide complete
- [ ] Runbook created (if needed)
- [ ] User documentation updated
- [ ] Known issues documented
- [ ] Support team notified

**Communication:**
- [ ] Stakeholders notified
- [ ] Deployment window scheduled
- [ ] On-call engineer assigned
- [ ] Rollback criteria defined

**Verdict:**
- ✅ **APPROVED FOR DEPLOYMENT** - All gates passed
- ⚠️ **APPROVED WITH MONITORING** - Deploy with extra monitoring
- ❌ **DEPLOYMENT BLOCKED** - Critical issues

---

## Gate Report Template

**Copy this EXACT template for each gate:**

```markdown
# Quality Gate Report: [Gate Name]

**Checked By:** [Agent name]
**Date:** [YYYY-MM-DD]
**Target:** [Feature/work item name]
**Context:** [PRHandoff / Deployment / etc.]

## Checklist Results

[Copy relevant checklist from gate definition]

**Example for Code Quality Gate:**
- [✅/❌] Follows team style guide
- [✅/❌] Variable/function names descriptive
- [✅/❌] Code well-structured
- [✅/❌] Complex logic documented
- [✅/❌] Follows DRY principle

[Continue with full checklist]

## Detailed Findings

### ✅ Passing Criteria (X/Y)
- [Item 1 that passed]
- [Item 2 that passed]

### ❌ Failing Criteria (X/Y)
1. **[Criterion]**
   - **Issue:** [What's wrong]
   - **Impact:** [Why it matters]
   - **Remediation:** [How to fix]
   - **Owner:** [@agent-name]

### ⚠️ Warnings (X)
1. **[Criterion]**
   - **Concern:** [What could be better]
   - **Recommendation:** [Suggested improvement]

## Overall Gate Status

**VERDICT:** [Choose ONE]
- ✅ **PASS** - All criteria met, ready to proceed
- ⚠️ **PASS WITH WARNINGS** - Proceed with caution, address warnings soon
- ❌ **FAIL** - Must address failing criteria before proceeding

**Score:** [X / Y criteria passed] ([Z]%)

**Confidence:** [High / Medium / Low]

## Next Actions

**Required (Must Do):**
- [ ] [Action 1 to address failing criterion]
- [ ] [Action 2 to address failing criterion]

**Recommended (Should Do):**
- [ ] [Action 1 to address warning]
- [ ] [Action 2 to improve quality]

**Assigned To:** [@agent-name or team]
**Target Date:** [When remediation should be complete]
```

## Context Files

> **Context Discipline:** Only load files directly relevant to the gate being checked. Check `agent_docs/index.md` first if unsure which files are needed.

Reference these when checking gates:
- `agent_docs/index.md` - Check first for file discovery
- `agent_docs/requirements/[feature-name].md` - Requirements for the feature being validated
- `agent_docs/technical-setup.md` - Technical standards (only when needed)
- `.claude/agent-context/architecture-context.md` - Architecture (only when needed)
- `.claude/agent-context/[domain]-context.md` - Domain context (only when domain-specific)
- Work items via `bd show <id> --json` - Use Beads for work item details

For domain-specific quality standards, see REFERENCE.md.
