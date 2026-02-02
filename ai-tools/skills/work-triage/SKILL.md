---
name: work-triage
description: Analyzes incoming requests to determine priority, route to appropriate agents, and create work items. Uses urgency-impact matrix for P0-P3 prioritization and decision tree for agent routing.
allowed-tools: Read, Write, Grep, Glob
---

# Core Workflow

## Step 1: Analyze the Request

**Type of Work:**
- Product question/clarification
- Design or architectural decision
- Feature implementation
- Bug fix
- Test or quality issue
- Process or coordination issue
- Documentation request
- Infrastructure or deployment

**Domain Identification:**
- Requirements and product strategy
- Architecture and design
- Frontend/UI
- Backend/API
- Database/data
- AI/ML
- Firmware/embedded
- DevOps/infrastructure
- Testing/QA
- Coordination/process

**Complexity Assessment:**
- **Simple:** Single domain, clear solution, <1 day
- **Moderate:** Single domain, some uncertainty, 1-3 days
- **Complex:** Multiple domains, significant design, 3+ days
- **Epic:** Major initiative requiring project planning

**Urgency & Impact:**

**Urgency:**
- **Critical:** Production down, data loss risk, security breach
- **High:** Blocking work, severe user impact
- **Medium:** Important but not blocking
- **Low:** Nice to have, future improvement

**Impact:**
- **High:** Many users affected, core functionality
- **Medium:** Some users affected, important feature
- **Low:** Few users affected, minor feature

## Step 2: Determine Priority

**Priority Matrix:**

| Urgency/Impact | High Impact | Medium Impact | Low Impact |
|----------------|-------------|---------------|------------|
| **Critical**   | P0          | P0            | P1         |
| **High**       | P0          | P1            | P2         |
| **Medium**     | P1          | P2            | P3         |
| **Low**        | P2          | P3            | P3         |

**Priority Definitions:**
- **P0 (Critical):** Drop everything, address immediately
- **P1 (High):** Address today/this sprint
- **P2 (Medium):** Address this sprint or next
- **P3 (Low):** Backlog, address when capacity allows

## Step 3: Route to Agent(s)

**Routing Decision Tree:**

```
Is this about...

├─ Product direction/requirements/strategy?
│  └─ @product-manager

├─ Technical architecture/design decisions?
│  └─ @tech-lead

├─ Process/workflow/blockers/coordination?
│  └─ @work-orchestrator

└─ Implementation work?
   ├─ User interface/UX?
   │  └─ @frontend-engineer
   │
   ├─ Business logic/APIs/services?
   │  └─ @backend-engineer
   │
   ├─ Data model/queries/database?
   │  └─ @database-engineer
   │
   ├─ AI/ML/LLM integration?
   │  └─ @ai-engineer
   │
   ├─ Embedded/firmware/hardware?
   │  └─ @firmware-engineer
   │
   ├─ Infrastructure/deployment/CI/CD?
   │  └─ @devops-engineer
   │
   └─ Testing/validation/quality?
      └─ @qa-backend | @qa-frontend | @qa-firmware
```

## Step 4: Identify Additional Agents

**Multi-Agent Scenarios:**

**Full-Stack Feature:**
- Primary: @product-manager (requirements)
- Then: @frontend-engineer + @backend-engineer + @database-engineer (parallel)
- Then: @qa-engineer (validation)

**Bug Investigation:**
- If UI bug: @frontend-engineer
- If API bug: @backend-engineer
- If data bug: @database-engineer
- If unclear: Multiple engineers investigate in parallel

**Architecture Change:**
- Primary: @tech-lead (design)
- Then: Affected engineers (implementation)

## Step 5: Create Work Item(s)

Generate work item with:
- Clear title and description
- Priority level (P0-P3)
- Domain tags
- Assigned agent(s)
- Related context (requirements, issues, docs)
- Acceptance criteria
- Dependencies (if any)

## Step 6: Notify Agent(s)

Provide context:
- Link to work item
- Priority and urgency
- Time constraints
- Related documentation
- Specific concerns

## Triage Report Format

```markdown
# Triage Report: [Request Title]

**Request ID:** [Auto-generated ID]
**Date:** [YYYY-MM-DD HH:MM]
**Triaged By:** @work-orchestrator or @product-manager

## Request Summary
[Clear description]

## Analysis

**Type:** [Product / Design / Implementation / Bug / Test / Process / Infrastructure]
**Domain:** [Requirements / Architecture / Frontend / Backend / Database / AI / Firmware / DevOps / QA]
**Complexity:** Simple | Moderate | Complex | Epic

**Urgency:** Critical | High | Medium | Low
**Impact:** High | Medium | Low
**Priority:** P0 | P1 | P2 | P3

## Routing Decision

**Primary Agent:** @[agent-name]
**Role:** [What they should do]

**Additional Agents:** [@agent2, @agent3]
**Coordination:** [How agents coordinate]

## Work Item(s) Created

**Work Item:** Created via `bd create "title" -t <type> -p <priority> --json`
**ID:** [Beads ID, e.g., bd-a1b2]

**Title:** [Work item title]
**Priority:** P0-P3 (maps to `-p 0` through `-p 3`)
**Assigned:** @[agent-name]

## Context Provided

**Related Documentation:**
- Requirements: [Link if exists]
- Technical context: [Link if exists]
- Related issues: [Links]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Timeline

**Expected Start:** [Date/time]
**Expected Completion:** [Estimate]
**Deadline:** [If applicable]

## Notes
[Additional context, concerns, considerations]
```

## Routing Examples

### Example 1: "We need to add user authentication"

**Analysis:**
- Type: Feature implementation
- Domain: Multi-domain (product, backend, frontend)
- Complexity: Complex
- Urgency: Medium, Impact: High
- Priority: P1

**Routing:**
1. @product-manager → Create requirements
2. @tech-lead → Design review
3. @backend-engineer + @frontend-engineer (parallel)
4. @qa-engineer → Validation

### Example 2: "Tests are failing in CI"

**Analysis:**
- Type: Bug/issue
- Domain: Testing or implementation (unclear)
- Complexity: Simple to Moderate
- Urgency: High (blocking), Impact: Medium
- Priority: P1

**Routing:**
1. Check which tests failing
2. Route to appropriate engineer based on test domain

### Example 3: "Database queries are slow"

**Analysis:**
- Type: Performance issue
- Domain: Database
- Complexity: Moderate
- Urgency: Medium, Impact: High
- Priority: P1

**Routing:**
1. @database-engineer → Optimize queries, add indexes, consider caching

## Context Files

> **Context Discipline:** Only load files directly relevant to triaging the request. Check `agent_docs/index.md` first if unsure which files are needed.

Reference these when triaging:
- `agent_docs/index.md` - Check first for file discovery
- `agent_docs/project-overview.md` - Project context (for understanding scope)
- `agent_docs/technical-setup.md` - Technical setup (only when needed for domain routing)
- `.claude/agent-context/[domain]-context.md` - Domain context (only for relevant domain)
