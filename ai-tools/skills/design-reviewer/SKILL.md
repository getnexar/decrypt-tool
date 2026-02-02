---
name: design-reviewer
description: Reviews technical design documents for architectural alignment, security, performance, and testability. Provides structured feedback with approve/conditions/reject decisions.
allowed-tools: Read, Grep, Glob
---

# Core Workflow

## Step 1: Prepare for Review

**Engineer submits:**
- Design document: `agent_docs/designs/[feature-name]/technical-design.md`
- Related requirements
- Specific questions/concerns

**Self-Review Checklist (before requesting review):**
- [ ] Design addresses all requirements
- [ ] Cross-cutting concerns addressed
- [ ] Aligns with existing architecture
- [ ] Dependencies identified
- [ ] Migration/deployment strategy defined
- [ ] Test strategy outlined

## Step 2: Review Checklist

### Alignment with Requirements
- [ ] All functional requirements addressed
- [ ] Non-functional requirements considered
- [ ] Acceptance criteria can be met
- [ ] Out-of-scope items defined

### Architectural Alignment
- [ ] Follows established patterns
- [ ] Consistent with existing system
- [ ] Integrates cleanly with components
- [ ] Respects architectural boundaries
- [ ] References relevant ADRs

### Design Quality
- [ ] Appropriate level of detail
- [ ] Components well-defined and scoped
- [ ] Clear separation of concerns
- [ ] Reasonable complexity (not over-engineered)
- [ ] Maintainability considered

### Data Design
- [ ] Data model sound
- [ ] Schema changes properly planned
- [ ] Migrations strategy defined
- [ ] Data integrity constraints present
- [ ] Indexing strategy appropriate

### API Design
- [ ] API contracts well-defined
- [ ] RESTful conventions followed (if REST)
- [ ] Versioning strategy considered
- [ ] Error handling defined
- [ ] Auth/authorization addressed

### Security
- [ ] Authentication approach appropriate
- [ ] Authorization model clear
- [ ] Input validation planned
- [ ] Sensitive data protection addressed
- [ ] Security vulnerabilities mitigated

### Performance
- [ ] Performance requirements identified
- [ ] Scalability considered
- [ ] Caching strategy defined (if needed)
- [ ] Database query optimization planned
- [ ] Load handling strategy clear

### Observability
- [ ] Logging strategy defined
- [ ] Metrics to track identified
- [ ] Alerting thresholds specified
- [ ] Debugging strategy considered

### Testing
- [ ] Test strategy outlined
- [ ] Test coverage targets defined
- [ ] Integration testing approach clear
- [ ] Performance testing considered

### Implementation Plan
- [ ] Broken into logical phases
- [ ] Dependencies identified
- [ ] Risk mitigation strategies present
- [ ] Effort estimates reasonable

### Alternatives
- [ ] Multiple alternatives considered
- [ ] Trade-offs clearly documented
- [ ] Rationale for chosen approach clear

### Documentation
- [ ] Design clearly documented
- [ ] Diagrams aid understanding
- [ ] Assumptions stated
- [ ] Open questions identified

For detailed criteria, see REFERENCE.md.

## Step 3: Categorize Findings

**Critical Issues (Must Fix Before Approval):**
- Security vulnerabilities
- Architectural violations
- Scalability risks
- Data integrity concerns
- Breaking changes without migration plan

**Important Issues (Should Fix):**
- Performance concerns
- Maintainability issues
- Missing error handling
- Incomplete test strategy
- Documentation gaps

**Suggestions (Nice to Have):**
- Optimization opportunities
- Alternative approaches to consider
- Future enhancement possibilities

## Step 4: Provide Feedback

### Report Format

```markdown
# Design Review Report: [Feature Name]

**Reviewed By:** @tech-lead
**Review Date:** [YYYY-MM-DD]
**Design Document:** `agent_docs/designs/[feature-name]/technical-design.md`
**Requirements:** `agent_docs/requirements/[feature-name].md`

## Summary
[2-3 sentence overview]

## Strengths
- [Strength 1: e.g., Well-thought-out data model]
- [Strength 2: e.g., Clear separation of concerns]

## Review Checklist

### Alignment with Requirements
- [✅/❌/⚠️] All functional requirements addressed
- [✅/❌/⚠️] Non-functional requirements considered

### Architectural Alignment
- [✅/❌/⚠️] Follows established patterns
- [✅/❌/⚠️] Consistent with existing system

### Security
- [✅/❌/⚠️] Authentication appropriate
- [✅/❌/⚠️] Authorization model clear
- [✅/❌/⚠️] Input validation planned

### Performance
- [✅/❌/⚠️] Performance requirements identified
- [✅/❌/⚠️] Scalability considered
- [✅/❌/⚠️] Caching strategy defined

## Issues Found

### Critical (Must Fix Before Approval)
[If none, write "None"]

**Issue 1:** [Description]
- **Location:** [Where in design]
- **Problem:** [Detailed explanation]
- **Risk:** [What could go wrong]
- **Recommendation:** [How to fix]

### Important (Should Fix)
[If none, write "None"]

**Issue 1:** [Description]
- **Problem:** [Explanation]
- **Recommendation:** [How to improve]

### Suggestions (Nice to Have)
[If none, write "None"]

**Suggestion 1:** [Description]
- **Current:** [What design does now]
- **Better:** [What would be better]
- **Benefit:** [Why this helps]

## Recommendations

### Required Actions
1. [Action 1]
2. [Action 2]

### Suggested Improvements
1. [Improvement 1]

### Follow-Up Items
1. [Future consideration 1]

## ADR Recommendation

- [ ] No ADR needed (follows existing patterns)
- [ ] ADR recommended: [Topic] - [Rationale]

## Decision

**Result:** [Choose one]
- ✅ **APPROVED** - Design sound, ready for implementation
- ⚠️ **APPROVED WITH CONDITIONS** - Minor issues to address during implementation
- ❌ **REQUEST CHANGES** - Critical issues must be resolved

**Confidence:** High | Medium | Low

**Reasoning:** [Brief explanation]

## Next Steps
[What should happen next]
```

## Context Files

> **Context Discipline:** Only load files directly relevant to the design being reviewed. Check `agent_docs/index.md` first if unsure which files are needed.

Reference these when reviewing:
- `agent_docs/index.md` - Check first for file discovery
- `agent_docs/requirements/[feature-name].md` - Requirements for the feature being reviewed
- `.claude/agent-context/architecture-context.md` - Architecture standards
- `agent_docs/technical-setup.md` - Tech stack (only when needed)
- `agent_docs/decisions/` - Existing ADRs (only relevant ones)
- `.claude/agent-context/domain-knowledge.md` - Domain knowledge (when domain-specific)
