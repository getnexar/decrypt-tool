# Quality Gate Checker Reference

This document provides comprehensive checklists and standards for all 7 quality gates.

---

## Gate 1: Implementation Readiness (Before Starting Work)

### Requirements Quality
- [ ] Requirements document exists and is approved by @product-manager
- [ ] Source context specified (project: or request: link present)
- [ ] Acceptance criteria are clear, specific, and testable
- [ ] Success metrics are defined and measurable
- [ ] Dependencies on other features or systems are identified
- [ ] User stories follow INVEST principles
- [ ] Edge cases are documented
- [ ] Out-of-scope items are explicitly listed

### Design Quality (if architectural changes needed)
- [ ] Technical design document exists
- [ ] Design reviewed and approved by @tech-lead
- [ ] Architecture aligns with existing system patterns
- [ ] ADR created for significant architectural decisions
- [ ] Data models and schemas defined
- [ ] API contracts specified
- [ ] Integration points documented

### Environment Readiness
- [ ] Development environment is set up and functional
- [ ] Required services/dependencies are available locally or in dev environment
- [ ] Test data is available or can be generated
- [ ] Access credentials and API keys are configured
- [ ] Database migrations (if any) are ready

**Verdict:**
- ✅ **READY** - All criteria met, work can begin
- ⚠️ **READY WITH CAVEATS** - Minor gaps exist but won't block progress
- ❌ **NOT READY** - Critical gaps must be resolved before starting

---

## Gate 2: Code Quality (Before Handoff/PR)

### Readability & Maintainability
- [ ] Code follows team style guide (linting passes)
- [ ] Variable and function names are descriptive and follow conventions
- [ ] Code is well-structured with clear separation of concerns
- [ ] Complex logic has explanatory comments
- [ ] No commented-out code or debug statements
- [ ] Follows DRY principle (no unnecessary duplication)
- [ ] Functions/methods are appropriately sized (single responsibility)
- [ ] Magic numbers replaced with named constants

### Functionality
- [ ] All acceptance criteria from requirements are implemented
- [ ] Edge cases are handled appropriately
- [ ] Error handling is comprehensive and appropriate
- [ ] No hardcoded values (use configuration or environment variables)
- [ ] Logging is appropriate (level, content, no sensitive data)
- [ ] Input validation is present for all user inputs
- [ ] Business logic is correct and testable

### Security
- [ ] No SQL injection vulnerabilities (parameterized queries used)
- [ ] No XSS vulnerabilities (output is properly escaped)
- [ ] Authentication/authorization checks are present and correct
- [ ] Sensitive data is encrypted at rest and in transit
- [ ] No secrets, API keys, or credentials in code
- [ ] Input validation prevents injection attacks
- [ ] CORS/CSP policies configured correctly
- [ ] Rate limiting implemented for sensitive endpoints

### Performance
- [ ] No N+1 query problems (eager loading where appropriate)
- [ ] Database queries are optimized (indexes used appropriately)
- [ ] Appropriate caching strategy implemented
- [ ] No memory leaks (resources properly released)
- [ ] Efficient algorithms chosen (appropriate time/space complexity)
- [ ] Large datasets handled with pagination or streaming
- [ ] Unnecessary re-renders avoided (frontend)

### Dependencies
- [ ] New dependencies are justified and necessary
- [ ] Dependencies are up to date (no outdated packages)
- [ ] No known security vulnerabilities in dependencies
- [ ] License compatibility verified for all dependencies
- [ ] Dependency size impact considered (bundle size)

**Verdict:**
- ✅ **PASS** - Meets all code quality standards
- ⚠️ **PASS WITH NOTES** - Minor issues that don't block handoff
- ❌ **FAIL** - Critical issues must be fixed

---

## Gate 3: Test Coverage (Before Handoff/PR)

### Test Existence
- [ ] Unit tests added/updated for new/changed code
- [ ] Integration tests added/updated (if applicable)
- [ ] E2E tests added for user-facing features
- [ ] Tests cover happy path scenarios
- [ ] Tests cover edge cases
- [ ] Tests cover error scenarios
- [ ] Tests cover boundary conditions

### Test Quality
- [ ] Tests are readable and maintainable
- [ ] Tests use proper assertions (specific, meaningful)
- [ ] Tests are independent (no shared state)
- [ ] Mocks/stubs used appropriately (not over-mocked)
- [ ] Test data is clear and meaningful
- [ ] Test names are descriptive (describe what is being tested)
- [ ] No flaky tests (tests pass consistently)

### Test Coverage
- [ ] Code coverage ≥80% (or project-specific threshold)
- [ ] All new functions/methods have tests
- [ ] All branches are tested (if/else, switch cases)
- [ ] Critical paths are fully covered
- [ ] Error handling paths are tested

### Test Execution
- [ ] All tests passing locally
- [ ] No skipped or ignored tests without justification
- [ ] Test execution time is reasonable (<5 minutes for unit tests)
- [ ] Tests run successfully in CI environment

### Domain-Specific: Backend
- [ ] API endpoint tests for all HTTP methods
- [ ] Integration tests with database
- [ ] Contract tests (if API has consumers)
- [ ] Performance tests for critical endpoints
- [ ] Security tests (auth, input validation)

### Domain-Specific: Frontend
- [ ] Component unit tests
- [ ] E2E user journey tests
- [ ] Visual regression tests (if significant UI changes)
- [ ] Accessibility tests (keyboard navigation, screen readers)
- [ ] Cross-browser tests (if significant UI changes)

### Domain-Specific: Firmware
- [ ] Unit tests for embedded functions
- [ ] HIL tests (if hardware interaction)
- [ ] Protocol tests (I2C, SPI, UART, etc.)
- [ ] Memory usage tests
- [ ] Safety-critical path tests (100% coverage)

**Verdict:**
- ✅ **PASS** - Coverage meets all standards
- ⚠️ **PASS WITH GAPS** - Acceptable gaps are documented with justification
- ❌ **FAIL** - Insufficient coverage, must add tests

---

## Gate 4: Documentation (Before Handoff/PR)

### Code Documentation
- [ ] Code is self-documenting where possible
- [ ] Complex logic has explanatory comments
- [ ] Public APIs are documented (JSDoc, docstrings, etc.)
- [ ] Type definitions are documented
- [ ] Function parameters and return values documented

### Implementation Documentation
- [ ] Implementation doc created for complex features
- [ ] Architecture/component overview provided
- [ ] Code locations documented (where to find key files)
- [ ] Key decisions and trade-offs explained
- [ ] Integration points documented

### Requirements Traceability
- [ ] Linked to requirements document
- [ ] All acceptance criteria verified and documented
- [ ] Out-of-scope items noted
- [ ] Known limitations documented

### Deployment Documentation
- [ ] Configuration changes documented
- [ ] Environment variables documented
- [ ] Migration steps documented (if applicable)
- [ ] Rollback plan documented (if needed)
- [ ] Monitoring/alerting setup documented

### User-Facing Documentation
- [ ] README updated (if applicable)
- [ ] API docs updated (if API changes)
- [ ] CHANGELOG updated with user-facing changes
- [ ] User guides updated (if user-facing changes)

**Verdict:**
- ✅ **PASS** - Documentation is complete and clear
- ⚠️ **PASS WITH NOTES** - Minor gaps that don't block handoff
- ❌ **FAIL** - Critical documentation missing

---

## Gate 5: PR Readiness (Before Creating PR)

### Pre-PR Checklist
- [ ] All code changes are committed
- [ ] Branch is up to date with base branch (main/develop)
- [ ] Code quality gate passed
- [ ] Test coverage gate passed
- [ ] Documentation gate passed
- [ ] Self-review completed
- [ ] No merge conflicts
- [ ] CI checks passing locally

### PR Content Readiness
- [ ] Clear, descriptive PR title prepared
- [ ] Comprehensive PR description prepared
- [ ] Screenshots ready (if UI changes)
- [ ] Breaking changes documented (if any)
- [ ] Deployment notes prepared (if special considerations)
- [ ] Related issues/work items linked
- [ ] Reviewers identified

**Verdict:**
- ✅ **READY FOR PR** - All criteria met, create PR
- ⚠️ **ALMOST READY** - Minor items to complete
- ❌ **NOT READY** - Significant work remaining

---

## Gate 6: Handoff Readiness (Before Handing to Another Agent)

### Engineering → QA Handoff
- [ ] Implementation is complete (all acceptance criteria met)
- [ ] Self-tested and working in dev environment
- [ ] Unit/integration tests passing
- [ ] Implementation documentation created
- [ ] Test data available or documented how to generate
- [ ] Known issues documented
- [ ] Acceptance criteria are clear and testable

### Design → Engineering Handoff
- [ ] Technical design approved by @tech-lead
- [ ] Requirements document linked
- [ ] ADR created for architectural decisions
- [ ] Dependencies identified
- [ ] Risks documented
- [ ] Data models defined
- [ ] API contracts specified

### Backend → Frontend Handoff (or vice versa)
- [ ] API contracts defined and documented
- [ ] Integration points tested
- [ ] Documentation shared (implementation docs, API docs)
- [ ] Test environment available with realistic data
- [ ] Error response formats documented

### QA → Deployment Handoff
- [ ] All tests passing (unit, integration, E2E)
- [ ] No critical or high-priority bugs
- [ ] Performance validated (meets SLAs)
- [ ] Security validated (no vulnerabilities)
- [ ] All acceptance criteria met
- [ ] Deployment plan ready

**Verdict:**
- ✅ **READY FOR HANDOFF** - Complete and well-documented
- ⚠️ **READY WITH NOTES** - Minor items to communicate
- ❌ **NOT READY** - Significant gaps, not ready for handoff

---

## Gate 7: Deployment Readiness (Before Deploying)

### Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Performance tests passing (if applicable)
- [ ] Security tests passing
- [ ] Load tests passing (if high-traffic feature)
- [ ] No flaky tests

### Quality
- [ ] Code reviewed and approved by appropriate reviewers
- [ ] No critical or high-priority bugs
- [ ] Technical debt documented (if accepted for launch)
- [ ] Performance benchmarks met
- [ ] Security audit completed (if required)

### Infrastructure
- [ ] Deployment script/pipeline ready and tested
- [ ] Environment variables configured in production
- [ ] Database migrations tested in staging
- [ ] Rollback plan documented and tested
- [ ] Monitoring configured (metrics, logs, traces)
- [ ] Alerts configured (error rates, performance, availability)
- [ ] Capacity planning done (if high-traffic)

### Documentation
- [ ] Deployment guide complete
- [ ] Runbook created for operations (if complex feature)
- [ ] User documentation updated
- [ ] Known issues documented
- [ ] Support team notified and trained

### Communication
- [ ] Stakeholders notified of deployment
- [ ] Deployment window scheduled (if downtime required)
- [ ] On-call engineer assigned
- [ ] Rollback criteria defined
- [ ] Communication plan for issues

**Verdict:**
- ✅ **APPROVED FOR DEPLOYMENT** - All gates passed, deploy with confidence
- ⚠️ **APPROVED WITH MONITORING** - Deploy with extra monitoring and caution
- ❌ **DEPLOYMENT BLOCKED** - Critical issues must be resolved

---

## Domain-Specific Quality Standards

### Backend Standards
- API response time: p95 < 500ms
- Error rate: < 0.1%
- Test coverage: >85%
- No SQL injection vulnerabilities
- All endpoints authenticated/authorized
- Rate limiting on public endpoints
- Request/response validation
- Structured logging with correlation IDs

### Frontend Standards
- Lighthouse score: >90
- Core Web Vitals:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- Test coverage: >80%
- No XSS vulnerabilities
- Accessibility: WCAG 2.1 Level AA
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Responsive design (mobile, tablet, desktop)
- Error boundaries implemented

### Firmware Standards
- Safety-critical code: 100% test coverage
- Memory usage within device limits
- Real-time constraints met
- Power consumption within spec
- Protocol compliance verified
- OTA update mechanism tested
- Fault tolerance and recovery tested
- Hardware abstraction layer consistency

---

## Severity Definitions

### Critical
**Definition:** Issues that block progress, cause data loss, security vulnerabilities, or system crashes.

**Examples:**
- Security vulnerabilities (SQL injection, XSS, exposed credentials)
- Data loss or corruption
- System crashes or unrecoverable errors
- Breaking changes without migration path
- No error handling on critical paths

**Action Required:** Must fix immediately before proceeding.

### Important
**Definition:** Issues that significantly impact quality, maintainability, or user experience but don't block progress.

**Examples:**
- Missing tests for new functionality
- Incomplete error handling
- Performance issues (but within acceptable range)
- Code quality issues (complex, hard to maintain)
- Documentation gaps

**Action Required:** Should fix before handoff/PR, but can proceed with documented plan.

### Warning
**Definition:** Issues that are best practices violations or improvements but don't impact functionality.

**Examples:**
- Code style inconsistencies
- Missing comments on complex logic
- Suboptimal algorithms (but performance acceptable)
- Minor refactoring opportunities

**Action Required:** Consider fixing, document as future improvement if deferred.
