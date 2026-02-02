---
name: test-engineer
description: Manages complete testing lifecycle across backend APIs, frontend E2E, and firmware HIL testing. Creates test plans, generates test code, runs test suites, and removes obsolete tests.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

> **CONVERGENCE NOTICE**: For Test-Driven Development (RED-GREEN-REFACTOR), prefer `superpowers:test-driven-development` which enforces the TDD cycle with anti-patterns guidance.
>
> **When to use this skill:**
> - Creating comprehensive test plans (formal documentation)
> - Managing test suites across domains (backend, frontend, firmware)
> - Running and reporting on test execution
> - Removing obsolete tests safely
>
> **When to use superpowers:test-driven-development:**
> - Writing new features using TDD methodology
> - RED → GREEN → REFACTOR cycles
> - Learning/enforcing TDD discipline

# Core Workflow

This skill supports 4 operations:

## Operation 1: Create Test Plan

### When to Use
- New feature ready for testing
- Complex functionality requires structured approach
- Need to coordinate testing across domains

### Workflow

1. **Review Requirements:**
   - Read `agent_docs/requirements/[feature-name].md`
   - Understand acceptance criteria

2. **Detect Domain:**
   - `implementations/backend/` → Backend tests (API, integration, performance)
   - `implementations/frontend/` → Frontend tests (E2E, component, accessibility)
   - `implementations/firmware/` → Firmware tests (HIL, protocol, safety)

3. **Create Test Plan:**
   - File: `agent_docs/testing/plans/[domain]/[feature-name].md`
   - Cover happy paths, edge cases, errors
   - Define test data requirements

### Test Plan Template

**Copy this EXACT template:**

```markdown
# Test Plan: [Feature Name]

**Domain:** [Backend API / Frontend E2E / Firmware HIL]
**Requirements:** `agent_docs/requirements/[name].md`
**Implementation:** `agent_docs/implementations/[domain]/[name].md`
**Created:** [YYYY-MM-DD]

## Test Strategy

**Scope:** [What's being tested - specific features/components]
**Approach:** [Manual / Automated / Both]
**Entry Criteria:**
- [ ] [Criterion 1: e.g., Implementation complete]
- [ ] [Criterion 2: e.g., Code reviewed]

**Exit Criteria:**
- [ ] [Criterion 1: e.g., All test cases executed]
- [ ] [Criterion 2: e.g., >80% coverage achieved]
- [ ] [Criterion 3: e.g., No critical defects]

## Test Cases

### TC-001: [Test Case Title - Happy Path]
**Priority:** Critical | High | Medium | Low
**Type:** Functional | Integration | Regression | Performance

**Preconditions:**
- [Setup requirement 1]
- [Setup requirement 2]

**Steps:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Expected Result:**
[Specific, measurable expected outcome]

**Actual Result:**
[To be filled during execution]

**Status:** [ ] Pass / [ ] Fail / [ ] Blocked

---

### TC-002: [Test Case Title - Edge Case]
[Repeat structure]

---

### TC-003: [Test Case Title - Error Handling]
[Repeat structure]

## Test Data Requirements
- [Data requirement 1]
- [Data requirement 2]

## Dependencies
- [External service 1]
- [Test environment setup]

## Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk 1] | High/Med/Low | [Strategy] |
```

**Domain-Specific Guidelines:**

**Backend API Tests:**
- Cover all HTTP methods (GET, POST, PUT, DELETE)
- Test authentication/authorization
- Validate error responses (400, 401, 403, 404, 500)
- Test rate limiting if applicable

**Frontend E2E Tests:**
- Test user journeys end-to-end
- Verify accessibility (keyboard navigation, screen readers)
- Check responsive behavior (mobile, tablet, desktop)
- Test error states and loading indicators

**Firmware HIL Tests:**
- Test hardware interactions via test harness
- Verify protocol compliance
- Test power states and transitions
- Include safety-critical scenarios

### Domain-Specific Focus

**Backend:** API tests, integration tests, performance tests, security tests, contract tests

**Frontend:** E2E tests, component tests, visual regression, accessibility (WCAG), performance (Core Web Vitals), cross-browser

**Firmware:** HIL tests, protocol tests (I2C, SPI, UART, CAN, BLE), power consumption, memory usage, real-time constraints, safety tests, OTA updates

---

## Operation 2: Create Tests

### When to Use
- Feature implemented, needs test coverage
- Acceptance criteria defined
- Test coverage below threshold

### Workflow

1. **Identify Test Criteria:**
   - From Requirements: `agent_docs/requirements/[feature].md`
   - From Work Item: Acceptance criteria
   - From Code: Specific function/module

2. **Determine Test Type:**
   - **Backend**: API tests, integration tests, performance tests
   - **Frontend**: Component tests, E2E tests, visual tests, a11y tests
   - **Firmware**: Unit tests, HIL tests, protocol tests, safety tests

3. **Generate Test Cases:**
   - Happy path
   - Error conditions
   - Edge cases
   - Boundary conditions
   - Null/undefined inputs

4. **Write Test Code:**
   - Use project's test framework
   - Follow existing patterns
   - Descriptive test names

### Test Code Example (Jest)

```javascript
describe('User Authentication', () => {
  it('should successfully log in with valid credentials', async () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: 'valid123' };

    // Act
    const result = await login(credentials);

    // Assert
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    await expect(login({ email: 'test@example.com', password: 'wrong' }))
      .rejects.toThrow('Invalid credentials');
  });

  it('should handle missing email', async () => {
    await expect(login({ password: 'valid123' }))
      .rejects.toThrow('Email required');
  });
});
```

### Test Coverage Checklist
- [ ] Happy path scenarios
- [ ] Error conditions
- [ ] Edge cases
- [ ] Boundary values
- [ ] Null/undefined inputs
- [ ] Concurrent access (if applicable)
- [ ] Performance under load
- [ ] Security vulnerabilities

---

## Operation 3: Run Tests

### When to Use
- Verifying code changes
- Before creating PRs
- CI/CD execution
- Release validation

### Workflow

1. **Identify Test Scope:**
   - All tests: Complete suite
   - Backend tests: `run tests backend`
   - Frontend tests: `run tests frontend`
   - Firmware tests: `run tests firmware`
   - Specific path: `run tests path/to/module`

2. **Execute Tests:**
   - Use project's test runner
   - Capture output and results
   - Collect coverage metrics

3. **Analyze Results:**
   - Total tests run
   - Passed / Failed / Skipped
   - Code coverage %
   - Execution time

4. **Report Findings:**
   - If all pass: Continue
   - If failures: Document, create bug work items

### Test Execution Commands

**Backend:**
```bash
npm run test:api          # API integration tests
npm run test:performance  # Load/performance tests
npm run test:security     # Security scans
```

**Frontend:**
```bash
npm run test:e2e          # E2E tests
npm run test:visual       # Visual regression
npm run test:a11y         # Accessibility tests
```

**Firmware:**
```bash
platformio test           # Embedded unit tests
python tests/hil_tests.py # HIL tests
pytest tests/protocol/    # Protocol tests
```

### Report Format

```markdown
# Test Run Report

**Date:** [YYYY-MM-DD HH:MM]
**Scope:** [All | Backend | Frontend | Firmware]
**Branch:** [branch name]

## Summary
- **Total Tests:** X
- **Passed:** X (X%)
- **Failed:** X (X%)
- **Skipped:** X
- **Duration:** Xs
- **Coverage:** X%

## Failed Tests ❌

### test/auth/login.test.js
- **Test:** "should handle invalid credentials"
- **Error:** Expected 401, received 500
- **Stack trace:** [truncated]

## Coverage Report
- Statements: X%
- Branches: X%
- Functions: X%
- Lines: X%

## Recommendations
- [ ] Fix failed tests before merging
- [ ] Add tests for uncovered edge cases
```

---

## Operation 4: Remove Tests

### When to Use
- Feature removed from codebase
- Code refactored, tests no longer relevant
- Duplicate/redundant coverage
- Flaky tests to be rewritten

### Safety Checks

**IMPORTANT - Verify before removal:**
- [ ] Tests are truly obsolete
- [ ] Coverage won't drop below threshold
- [ ] Feature actually removed (not just refactored)
- [ ] No other code depends on this coverage
- [ ] Alternative tests exist if functionality still present

### Workflow

1. **Identify Removal Criteria:**
   - Feature removed
   - Refactored code
   - Redundant tests
   - Flaky tests
   - Pattern match

2. **Execute Removal:**
   - Delete test files or specific test cases
   - Update test documentation
   - Run remaining tests

3. **Document Removal:**
   - Log why tests removed
   - Update `agent_docs/testing/reports/`

4. **Verify Impact:**
   - Check new coverage %
   - Ensure no related functionality untested
   - Run full test suite

### Warnings

- ❌ DO NOT remove tests without understanding purpose
- ❌ DO NOT remove tests to speed up suite
- ❌ DO NOT remove tests because they're failing (fix them)
- ❌ DO NOT let coverage drop below threshold

---

## Validation Loop

After creating test plan/tests:

**Self-Check Questions:**
1. Do test cases cover happy path, edge cases, AND error scenarios?
2. Are preconditions clearly stated and achievable?
3. Are expected results specific and measurable?
4. Does the test data support all test cases?
5. Are domain-specific patterns applied correctly?

**If any answer is "no", revise tests before execution.**

## Context Files

> **Context Discipline:** Only load files directly relevant to the testing task. Check `agent_docs/index.md` first if unsure which files are needed.

Reference these when testing:
- `agent_docs/index.md` - Check first for file discovery
- `agent_docs/requirements/[feature-name].md` - Requirements for the feature being tested
- `agent_docs/testing/plans/[domain]/[feature-name].md` - Existing test plans
- Work items via `bd show <id> --json` - Use Beads for work item details
- `agent_docs/technical-setup.md` - Technical context (only when needed for stack info)

For detailed domain-specific patterns, see REFERENCE.md.
