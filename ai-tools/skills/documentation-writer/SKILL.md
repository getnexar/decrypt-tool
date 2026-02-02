---
name: documentation-writer
description: Creates structured technical documentation including requirements, implementation docs, and Architecture Decision Records (ADRs). Ensures proper source context tracking and artifact linking.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Core Workflow

This skill supports 3 documentation types:

## Operation 1: Create Requirements

### Critical Rule: Source Context Required

**Requirements MUST be derived from:**
- **From Project:** Link to `agent_docs/projects/[project-name]/prd.md`
- **From Request:** Link to `agent_docs/requests/[request-id]/spec.md`
- **Ad-hoc:** Requires approval with business justification

### Workflow

1. **Identify Source Context (REQUIRED):**
   - Verify project or request exists
   - Read source documentation

2. **Gather Context:**
   - Read `agent_docs/project-overview.md`
   - Read `.claude/agent-context/product-context.md`
   - Review related features

3. **Define Requirements:**
   - Feature name and description
   - Source context reference
   - User stories (INVEST principles)
   - Acceptance criteria (testable, measurable)
   - Success metrics and KPIs
   - Dependencies and constraints
   - Out of scope

4. **Validate Requirements:**
   - [ ] Source context specified
   - [ ] Requirements measurable and testable
   - [ ] Acceptance criteria clear
   - [ ] Success metrics defined
   - [ ] Dependencies identified
   - [ ] Aligns with product vision

5. **Output:**
   - Create `agent_docs/requirements/[feature-name].md`
   - Link back to source

### Template

See `TEMPLATES/requirements-template.md` for the exact copyable template.

**Key sections to fill:**
- **Source context** - Specify project: or request: link (REQUIRED)
- **User stories** - Use INVEST principles with testable acceptance criteria
- **Success metrics** - Must be measurable and aligned with domain benchmarks
- **Dependencies** - Both feature and external dependencies
- **Constraints** - Technical, business, time, budget limitations

---

## Operation 2: Create Implementation Doc

### When to Use
- Complex implementation needs documentation
- Feature completed, needs knowledge capture
- Handoff to QA or other engineers

### Workflow

1. **Create Documentation:**
   - File: `agent_docs/implementations/[domain]/[feature-name].md`
   - Domain: frontend, backend, database, ai, firmware, devops

2. **Include:**
   - What was implemented
   - How it works (architecture, patterns)
   - Key decisions and trade-offs
   - Code locations and entry points
   - Dependencies and integrations
   - Configuration and deployment notes

3. **Link Everything:**
   - Requirements reference
   - Design docs
   - PR links
   - Related ADRs

### Template

See `TEMPLATES/implementation-template.md` for the exact copyable template.

**Key sections to fill:**
- **Technical approach** - How the feature works architecturally
- **Components** - Code locations and responsibilities
- **Key decisions** - Trade-offs made during implementation
- **Code organization** - Entry points, related files, patterns used
- **Testing strategy** - Coverage metrics and test types

---

## Operation 3: Create ADR (Architecture Decision Record)

### When to Create ADRs
- Major architectural choice
- Technology selection
- Design pattern decision
- Decision with long-term system impact

### Decision Criteria

Create ADR if:
- Significant architectural decision
- Long-term impact on system
- Future engineers need to understand "why"
- Trade-offs between multiple viable options

### Workflow

1. **Identify Decision Scope:**
   - Is this architecturally significant?
   - Will it have long-term impact?

2. **Gather Context:**
   - What problem are we solving?
   - What constraints exist?

3. **Research Options:**
   - Identify 2-3 viable alternatives
   - Research pros/cons
   - Consider trade-offs

4. **Make Decision:**
   - Choose best option given constraints
   - Document clear rationale

5. **Create ADR:**
   - Use next sequential ADR number
   - Follow standard format

6. **Review:**
   - Have @tech-lead review and approve

### Template

See `TEMPLATES/adr-template.md` for the exact copyable template.

**Key sections to fill:**
- **Context** - Problem statement and why this decision is needed
- **Options considered** - 2-4 alternatives with pros/cons for each
- **Decision** - Clear statement of what was decided with detailed rationale
- **Consequences** - Both positive and negative impacts, with mitigation strategies

### Common ADR Topics
- Technology selection (languages, frameworks, databases)
- Architectural patterns (microservices, event-driven, CQRS)
- Data management (schema design, caching, consistency)
- Security (auth approach, encryption)
- Infrastructure (deployment, CI/CD, monitoring)
- API design (REST vs GraphQL, versioning)

---

## Validation Loop

After creating documentation:

**Self-Check Questions:**
1. Is source context (project: or request:) specified?
2. Are all template sections filled (no [TODO] or [TBD])?
3. Does documentation link to related artifacts?
4. Are technical terms used consistently?
5. Is the document discoverable (proper file path and name)?

**If any answer is "no", revise documentation before finalizing.**

## Context Files

> **Context Discipline:** Only load files directly relevant to the documentation task. Check `agent_docs/index.md` first if unsure which files are needed.

Reference these when documenting:
- `agent_docs/index.md` - Check first for file discovery
- `agent_docs/project-overview.md` - Project context (when documenting requirements)
- `.claude/agent-context/[domain]-context.md` - Domain context (when domain-specific)
- `agent_docs/projects/[project-name]/` - Projects (when source is a project)
- `agent_docs/requests/[request-id]/` - Requests (when source is a request)

For complete templates, see TEMPLATES/ folder.
