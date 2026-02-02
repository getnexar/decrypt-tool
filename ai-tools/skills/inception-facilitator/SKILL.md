---
name: inception-facilitator
description: Facilitates multi-phase greenfield product discovery through idea exploration, technical feasibility, team synthesis, and foundation setup. Conducts domain research, validates concepts, and pre-populates agent contexts.
allowed-tools: Read, Write, WebSearch, WebFetch, Bash, Grep, Glob
---

> **DEPRECATION NOTICE**: For general design exploration and brainstorming, prefer `superpowers:brainstorming` which provides a more interactive Socratic design refinement process.
>
> **When to use this skill instead:**
> - Full Amplify greenfield product inception (4-phase process)
> - Need to pre-populate Memory Bank and agent context files
> - Running `/start` command for new products
>
> **When to use superpowers:brainstorming:**
> - Quick design exploration before implementation
> - Refining feature requirements interactively
> - Any brainstorming that doesn't need Amplify's full inception workflow

# Core Workflow

Inception has 4 sequential phases with handoffs:

## Phase 1: Idea Exploration (@product-manager)

**Output:** Validated product concept with domain knowledge

### Workflow

1. **Define Concept:**
   - Problem statement (who, what, impact)
   - Initial vision (2-3 paragraphs)
   - 3-5 specific goals

2. **Validate Assumptions:**

| Assumption | Validation Method | Status | Evidence |
|------------|------------------|--------|----------|
| [Assumption 1] | [How validated] | ✅/⚠️/❌ | [Evidence] |

3. **Conduct Domain Research (CRITICAL):**

Document in `.claude/agent-context/domain-knowledge.md`:

Use `TEMPLATES/domain-knowledge-template.md` as the structure.

**Research using IDCAR Method (see REFERENCE.md):**
- **I**ndustry Analysis - Market size, growth, key players
- **D**omain Trends - Top 5 trends affecting the space
- **C**ompetitive Landscape - Direct competitors, feature gaps
- **A**udience Understanding - User personas, behaviors, pain points
- **R**egulatory Environment - Compliance requirements, standards

**For detailed research methodology, see REFERENCE.md**

4. **Define Target Users:**

**Primary Persona:**
- Demographics
- Goals
- Pain Points
- Technical Proficiency
- Persona Quote

5. **Create Value Proposition:**

**For [Target User]**
**Who** [statement of need]
**The [Product Name]** is a [product category]
**That** [key benefit]
**Unlike** [primary competitor]
**Our product** [primary differentiation]

6. **Define MVP Scope:**

**In Scope (MVP):**
- Feature 1 - must-have
- Feature 2 - must-have

**MVP Success Criteria:**
- Criterion 1 - measurable
- Criterion 2 - measurable

**Out of Scope (Future):**
- Feature 1 - valuable but not MVP

7. **Success Metrics:**

| Metric | 3 Months | 6 Months | 12 Months | Benchmark |
|--------|----------|----------|-----------|-----------|
| [User Acquisition] | [Target] | [Target] | [Target] | [Industry] |
| [Engagement] | [Target] | [Target] | [Target] | [Industry] |

8. **Risk Assessment:**

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| [Risk 1] | H/M/L | H/M/L | [How to address] |

**Output:** `agent_docs/start/idea-exploration.md`

**Hand off to:** @tech-lead for Phase 2

---

## Phase 2: Technical Feasibility (@tech-lead)

**Output:** Technical architecture and implementation plan

### Workflow

1. **Review Domain Context:**
   - Read Idea Exploration document
   - Review `.claude/agent-context/domain-knowledge.md`
   - Note domain-specific tech patterns

2. **Recommend Tech Stack:**

**Frontend:**
- Framework: [React/Vue/Next.js]
- State Management: [Redux/Zustand]
- Styling: [Tailwind/styled-components]
- Testing: [Jest/Playwright]
- **Rationale for each**

**Backend:**
- Language/Framework: [Node.js/Python/Go]
- API Style: [REST/GraphQL]
- Authentication: [JWT/OAuth]
- Testing: [Jest/pytest]
- **Rationale for each**

**Database:**
- Primary DB: [PostgreSQL/MongoDB]
- ORM: [Prisma/TypeORM]
- Caching: [Redis/Memcached]
- **Rationale for each**

**Infrastructure:**
- Cloud Provider: [AWS/GCP/Vercel]
- Containerization: [Docker/Kubernetes]
- CI/CD: [GitHub Actions]
- **Rationale for each**

3. **Define Architecture Pattern:**

**Recommended:** [Monolith / Modular Monolith / Microservices / Serverless]

**Rationale:** [Why this over alternatives]

**Architecture Diagram:**
```
[High-level system architecture]
```

4. **Map Requirements:**

| Requirement | Technical Approach | Complexity |
|-------------|-------------------|------------|
| [Feature 1] | [How we'll build] | Low/Med/High |

**Non-Functional:**

**Performance:**
- Target: [Response time, throughput]
- Approach: [Optimization strategies]

**Scalability:**
- Target: [Concurrent users, requests/sec]
- Approach: [Scaling strategy]

**Security:**
- Requirements: [Auth, encryption, compliance]
- Approach: [Implementation]

5. **Assess Technical Risks:**

**High Priority Risks:**

**Risk 1:** [Description]
- Impact: High/Med/Low
- Probability: High/Med/Low
- Mitigation: [How to address]
- Contingency: [Plan B]

6. **Identify Dependencies:**

| Dependency | Purpose | Risk Level | Alternative |
|------------|---------|-----------|-------------|
| [Service 1] | [Usage] | H/M/L | [Backup] |

7. **Estimate Effort:**

**Overall:** [S / M / L / XL] - [Approximate months to MVP]

**Breakdown:**
- Frontend: [Weeks/Months]
- Backend: [Weeks/Months]
- Database: [Weeks/Months]

**Output:** `agent_docs/start/technical-feasibility.md`

**Technical Viability:** ✅ Viable / ⚠️ Viable with Caveats / ❌ Not Viable

**Hand off to:** @product-manager for Phase 3

---

## Phase 3: Team Synthesis (@product-manager)

**Output:** Complete inception package ready for development

### Workflow

1. **Executive Summary:**
   - Problem we're solving
   - Our approach
   - Technical decisions
   - Confidence in success

2. **Consolidate Vision:**
   - Product vision statement
   - Mission
   - Target users and personas
   - Market opportunity
   - Competitive position

3. **Define Goals & Metrics:**

**Business Goals:**

1. **[Goal 1]:** [Specific, measurable]
   - Timeline: [When]
   - Metric: [How measured]
   - Target: [Specific value]

**Success Metrics Dashboard:**

| Metric | 3 Months | 6 Months | 12 Months | Benchmark |
|--------|----------|----------|-----------|-----------|
| Active Users | [Target] | [Target] | [Target] | [Industry] |

4. **Finalize Scope:**

**MVP (Version 1.0):**

**Core Features:**
1. Feature 1: [Description and value]
2. Feature 2: [Description and value]

**MVP Success Criteria:**
- [ ] Criterion 1 - measurable
- [ ] Criterion 2 - measurable

5. **Summarize Technical Architecture:**

**Tech Stack Summary:**
- Frontend: [Framework + key tech]
- Backend: [Framework + key tech]
- Database: [DB + key tech]

**Architecture Pattern:** [Monolith/Microservices/etc.]

**Why This Approach:** [Brief rationale]

6. **Document Domain Knowledge:**

Update `.claude/agent-context/domain-knowledge.md` with:
- Industry standards to follow
- User behavior patterns
- Regulatory requirements
- Technical patterns common to domain

7. **Create Timeline:**

**Phase 1: Foundation (Weeks 1-4)**
- [ ] Development environment setup
- [ ] Core infrastructure

**Phase 2: Core Development (Weeks 5-12)**
- [ ] Key feature 1
- [ ] Key feature 2

**Phase 3: Integration & Testing (Weeks 13-16)**
- [ ] E2E testing
- [ ] Performance optimization

**Phase 4: Launch Preparation (Weeks 17-20)**
- [ ] Beta release
- [ ] Launch readiness

8. **Risk Management:**

**Top Risks & Mitigation:**

**Risk 1:** [Description]
- Type: Technical/Market/Business
- Impact: H/M/L
- Mitigation: [How addressing]
- Owner: [Responsible]

9. **Pre-Populate Context Files:**

Create/update:
- `.claude/agent-context/product-context.md`
- `.claude/agent-context/architecture-context.md`
- `.claude/agent-context/domain-knowledge.md`
- `.claude/agent-context/workflow-context.md`
- `.claude/agent-context/frontend-context.md`
- `.claude/agent-context/backend-context.md`
- `.claude/agent-context/database-context.md`
- `agent_docs/project-overview.md`
- `agent_docs/technical-setup.md`
- `agent_docs/current-work.md`

10. **Team Alignment & Approval:**

**Team Alignment:**
- [ ] @product-manager - Aligned on vision and scope
- [ ] @tech-lead - Aligned on technical approach
- [ ] All engineers - Aligned on their domains
- [ ] @qa-engineer - Aligned on quality standards

**User Approval:**
- [ ] User reviewed and approved
- [ ] User authorizes Phase 4

**Output:** `agent_docs/start/team-synthesis.md`

**Hand off to:** Phase 4 (automatic)

---

## Phase 4: Foundation Setup (Automatic)

**Executed By:** System (automatic)

**Trigger:** User approval of Team Synthesis

### Automatic Actions

1. Run `/setup-amplify` with all context
2. Validate agent configurations
3. Verify Memory Bank structure
4. Confirm all context files created
5. Ready for `/start`

---

## Context Files

> **Context Discipline:** Inception is a creation-focused skill. It creates files rather than loading them. Only read existing files when explicitly continuing a prior inception.

**Inception creates:**
- `agent_docs/start/idea-exploration.md`
- `agent_docs/start/technical-feasibility.md`
- `agent_docs/start/team-synthesis.md`
- `.claude/agent-context/domain-knowledge.md`
- All agent context files
- All Memory Bank files including `agent_docs/index.md`

For detailed guidance on each phase, see REFERENCE.md.
