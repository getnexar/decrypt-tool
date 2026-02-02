# Plan Execution Command

**Intended For:** 👤 Human
**Primary User:** Project Lead, Tech Lead, Product Manager
**Purpose:** Ingest externally-created PRD and system design documents, assess against codebase, and create executable work breakdown.
**Triggers:** PRD and system design ready, Need implementation plan, Ready to break down into agent tasks

> **SUPERPOWERS INTEGRATION**: This command integrates with superpowers skills for enhanced planning:
>
> **When to use this command (`/plan-execution`):**
> - Ingesting externally-created PRDs and system designs
> - Need codebase assessment before creating work breakdown
> - Want Beads work items auto-created with dependencies
> - Full Amplify workflow with Memory Bank integration
>
> **When to use `superpowers:writing-plans` instead:**
> - Quick implementation planning from specs/requirements
> - Creating plans for smaller features without full workflow
> - Planning outside of the Amplify agent system
>
> **Best Practice:** For Amplify projects, use this command. The @tech-lead will invoke `superpowers:writing-plans` internally during Phase 2 when creating the detailed implementation plan.

## Instructions

This command handles scenarios where **product requirements (PRD) and system design documents have been created externally** (e.g., in Figma, Google Docs, external design tools). It engages the **@tech-lead** to:

1. Ingest the external documentation
2. Assess feasibility against the existing codebase
3. Identify gaps, risks, and implementation challenges
4. Propose a robust execution plan
5. Break down work into assignable agent tasks

### Phase 0: Ensure Amplify Operating Principles [MANDATORY]

**Check if `.claude/CLAUDE.md` contains Amplify operating principles:**

1. **Check if `.claude/CLAUDE.md` exists:**
   - If NO:
     1. Create `.claude/CLAUDE.md` with content from `templates/agent-context/amplify-operating-principles.md`
     2. **STOP IMMEDIATELY**
     3. Inform user:
        ```
        ⚠️ CLAUDE.md file has been created with Amplify operating principles.

        Please restart your Claude Code session and re-run /plan-execution to continue.

        This ensures the Amplify delegation and parallelism principles are active.
        ```
     4. Do NOT proceed with the rest of the command

   - If YES:
     1. Read `.claude/CLAUDE.md` and check if it contains both:
        - "Agent Delegation Protocol [MANDATORY]" section
        - "Unlimited Parallelism Principle [MANDATORY]" section
     2. If BOTH sections are present: Continue with the rest of this command
     3. If either section is missing:
        1. Append the missing content from `templates/agent-context/amplify-operating-principles.md`
        2. **STOP IMMEDIATELY**
        3. Inform user:
           ```
           ⚠️ CLAUDE.md file has been updated with Amplify operating principles.

           Please restart your Claude Code session and re-run /plan-execution to continue.

           This ensures the Amplify delegation and parallelism principles are active.
           ```
        4. Do NOT proceed with the rest of the command

**Why This Matters:** The operating principles in CLAUDE.md ensure Claude Code always delegates to specialized agents and maximizes parallel execution. These principles must be loaded at session start, so a restart is required after CLAUDE.md is created or updated.

---

## Phase 1: Ingest External Documentation

1. **Locate and Read External Documentation:**

   **Required Documents:**
   - **PRD:** `agent_docs/projects/[feature-name]/prd.md` (created externally)
   - **System Design:** `agent_docs/projects/[feature-name]/system-design.md` (created externally)

   **Optional Documents:**
   - **Requirements:** `agent_docs/requirements/[feature-name]-*.md`
   - **User Stories:** Additional user stories or acceptance criteria
   - **Design Mockups:** `agent_docs/designs/[feature-name]/` (Figma exports, wireframes)
   - **Architecture Diagrams:** Diagrams from external tools
   - **API Contracts:** OpenAPI specs, GraphQL schemas
   - **Domain Research:** `agent_docs/projects/[feature-name]/domain-knowledge.md`

2. **Validate Documentation Completeness:**
   - ✅ PRD exists with clear requirements and success criteria
   - ✅ System design exists with architecture, components, and data models
   - ✅ User stories have acceptance criteria
   - ✅ Technical specifications are detailed enough for implementation
   - ✅ Dependencies and integrations are documented

   **If NOT ready:** Stop and inform user:
   ```
   ⚠️ Required documentation is missing or incomplete:
   - [Missing: PRD or system-design.md]
   - [Incomplete: specific sections]

   Please provide both PRD and system design documents before running /plan-execution.
   ```

---

## Phase 2: Tech Lead Assessment & Planning

3. **Invoke @tech-lead for Codebase Assessment:**

   The tech lead will:

   **A. Ingest External Documentation**
   - Read and understand PRD requirements
   - Analyze provided system design
   - Review any additional specifications

   **B. Assess Against Existing Codebase**
   - **Architecture compatibility** - How does the design fit with existing architecture?
   - **Code reusability** - What existing components/services can be leveraged?
   - **Technical gaps** - What's missing? What needs to be built from scratch?
   - **Integration points** - How will this connect to existing systems?
   - **Database impact** - Schema changes, migrations, data migration needs
   - **API compatibility** - Breaking changes, versioning needs
   - **Dependencies** - New libraries/services needed, version conflicts
   - **Performance impact** - Effect on existing system performance
   - **Security considerations** - Authentication, authorization, data protection
   - **Testing strategy** - How to test without breaking existing functionality

   **C. Identify Implementation Challenges**
   - Technical risks and how to mitigate them
   - Unknowns that need research or prototyping
   - Areas where external design may not be feasible
   - Suggested design modifications based on codebase realities

4. **Propose Execution Plan:**

   The tech lead will:
   - **Recommend approach** - Suggest implementation strategy based on codebase assessment
   - **Highlight risks** - Call out technical risks and mitigation plans
   - **Suggest alternatives** - If external design has issues, propose alternatives
   - **Sequence work** - Recommend order of implementation (foundation → features → integration)
   - **Estimate effort** - Provide realistic effort estimates per component

5. **Use Skills for Validation:**
   - **`design-reviewer` skill** - Validate the external design against codebase constraints
   - **`documentation-writer` skill** - Create ADRs if design requires architecture decisions

---

## Phase 3: Create Beads Work Items

**Beads is the single source of truth for work items.** No separate markdown work breakdown files.

6. **Create Work Items Directly in Beads:**

   Based on the assessment, create granular work items in Beads:

   ```bash
   # Create parent epic for the project
   bd create "[Project Name]" -t feature -p 1 -d "See implementation-plan: agent_docs/projects/[feature-name]/implementation-plan.md" --json
   # → Returns: bd-xxx

   # Phase 1: Foundation tasks
   bd create "Database schema and migrations" --parent bd-xxx -d "Assigned: @database-engineer. [Details and acceptance criteria]" --json
   bd create "API scaffolding and base endpoints" --parent bd-xxx -d "Assigned: @backend-engineer. [Details]" --json

   # Phase 2: Core Implementation tasks
   bd create "Core feature implementation" --parent bd-xxx -d "Assigned: @backend-engineer. [Details]" --json
   bd create "UI component development" --parent bd-xxx -d "Assigned: @frontend-engineer. [Details]" --json

   # Phase 3: Integration tasks
   bd create "System integration" --parent bd-xxx -d "Assigned: @backend-engineer. [Details]" --json

   # Phase 4: Testing tasks
   bd create "Backend API tests" --parent bd-xxx -d "Assigned: @qa-backend. [Details]" --json
   bd create "E2E tests" --parent bd-xxx -d "Assigned: @qa-frontend. [Details]" --json
   ```

7. **Configure Dependencies in Beads:**

   ```bash
   # Foundation before implementation
   bd dep add bd-xxx.1 bd-xxx.3 --type blocks  # Schema before core feature
   bd dep add bd-xxx.2 bd-xxx.3 --type blocks  # API scaffold before core feature

   # Implementation before integration
   bd dep add bd-xxx.3 bd-xxx.5 --type blocks  # Core feature before integration
   bd dep add bd-xxx.4 bd-xxx.5 --type blocks  # UI before integration

   # Integration before testing
   bd dep add bd-xxx.5 bd-xxx.6 --type blocks  # Integration before backend tests
   bd dep add bd-xxx.5 bd-xxx.7 --type blocks  # Integration before E2E tests
   bd dep add bd-xxx.6 bd-xxx.7 --type blocks  # Backend tests before E2E
   ```

8. **Verify Work Items:**

   ```bash
   # List all items under the epic
   bd list --parent bd-xxx --json

   # View dependency tree
   bd dep tree bd-xxx

   # Check what's ready to start
   bd ready --json
   ```

9. **Generate Implementation Plan Document (Reference Only):**
   - Create `agent_docs/projects/[feature-name]/implementation-plan.md`
   - Include assessment findings and proposed approach
   - Document risks and mitigations
   - Reference Beads epic ID for tracking: `bd show bd-xxx --json`
   - **Note:** This document is for reference/archival; Beads is the source of truth

---

## Phase 4: Output & Handoff

10. **Execution Artifacts Created:**
    - **Beads work items:** All tasks created with `bd create`, dependencies configured
    - **Implementation plan:** Reference document in `agent_docs/projects/[feature-name]/implementation-plan.md`
    - **ADRs:** Architecture decisions made during assessment (if any)

11. **Hand Off to @work-orchestrator:**
    - Beads items are already created - no conversion needed
    - @work-orchestrator queries `bd ready` for unblocked work
    - @work-orchestrator dispatches agents based on dependencies

12. **Output:**
    - **Beads epic:** `bd-xxx` with all child work items and dependencies
    - Implementation plan (reference): `agent_docs/projects/[feature-name]/implementation-plan.md`
    - ADRs (if needed): `agent_docs/architecture/decisions/[decision-name].md`
    - Ready for: `/execute-work project:[feature-name]`

---

## Template: Implementation Plan Document

```markdown
# Implementation Plan: [Feature Name]

**Project:** [Feature Name]
**Tech Lead:** @tech-lead
**Status:** Draft | Under Review | Approved | In Progress
**Created:** [YYYY-MM-DD]
**Updated:** [YYYY-MM-DD]

---

## Source Documentation

**External Documentation Provided:**
- **PRD:** `agent_docs/projects/[feature-name]/prd.md`
- **System Design:** `agent_docs/projects/[feature-name]/system-design.md`
- **Additional Docs:** [List any other provided documents]

**Note:** This implementation plan is based on externally-created product and technical specifications. The tech lead has assessed these against the existing codebase and created this executable plan.

---

## Executive Summary

[2-3 sentences summarizing what will be built and the proposed approach]

---

## Codebase Assessment

### Architecture Compatibility
**How does the proposed design fit with our existing architecture?**
- ✅ **Compatible:** [List what aligns well]
- ⚠️ **Needs Adaptation:** [List what needs modification]
- ❌ **Conflicts:** [List what doesn't work with current architecture]

### Code Reusability
**What existing components/services can we leverage?**
- **Reusable Component 1:** [Component name - how it will be used]
- **Reusable Component 2:** [Component name - how it will be used]
- **New Components Needed:** [List what must be built from scratch]

### Technical Gaps
**What's missing from the current codebase?**
- **Gap 1:** [Description - Impact: High/Med/Low]
- **Gap 2:** [Description - Impact: High/Med/Low]

### Integration Points
**How will this connect to existing systems?**
- **Integration 1:** [System name - connection method - complexity]
- **Integration 2:** [System name - connection method - complexity]

### Database Impact
**Schema changes and data migration needs:**
- **New Tables:** [List tables to create]
- **Modified Tables:** [List tables to modify]
- **Migrations:** [Data migration strategy]
- **Estimated Migration Time:** [Time to run migrations]

### API Compatibility
**Impact on existing APIs:**
- **New Endpoints:** [List new endpoints to create]
- **Modified Endpoints:** [List endpoints to change - breaking? versioning?]
- **Deprecated Endpoints:** [List endpoints to deprecate]

### Dependencies
**Libraries, services, and version requirements:**
- **New Dependencies:** [Library/service - version - purpose]
- **Version Conflicts:** [Conflicts identified - resolution strategy]
- **External Services:** [Third-party services needed - setup required?]

### Performance Impact
**Effect on system performance:**
- **Expected Load:** [Requests/second, data volume, etc.]
- **Performance Risks:** [Potential bottlenecks identified]
- **Optimization Strategy:** [How we'll ensure performance targets]

### Security Considerations
**Authentication, authorization, data protection:**
- **Authentication:** [How will users/services authenticate?]
- **Authorization:** [What permission model?]
- **Data Security:** [Encryption, PII handling, compliance]
- **Security Risks:** [Identified risks and mitigation]

### Testing Strategy
**How to test without breaking existing functionality:**
- **Unit Testing:** [Coverage targets, key areas]
- **Integration Testing:** [Critical integration paths]
- **E2E Testing:** [User journeys to test]
- **Regression Testing:** [How to ensure existing functionality works]

---

## Implementation Challenges & Risks

### Challenge 1: [Challenge Title]
**Description:** [What's the challenge?]
**Impact:** High | Medium | Low
**Mitigation:** [How we'll address it]

### Challenge 2: [Challenge Title]
**Description:** [What's the challenge?]
**Impact:** High | Medium | Low
**Mitigation:** [How we'll address it]

---

## Design Modifications (If Any)

**Areas where external design needs adjustment:**

### Modification 1: [Aspect of Design]
**Original Design:** [What was proposed]
**Issue:** [Why it won't work with our codebase]
**Proposed Change:** [What we suggest instead]
**Rationale:** [Why this is better]

---

## Proposed Execution Approach

### Overall Strategy
[High-level approach to implementation - e.g., incremental, feature-flagged, parallel streams]

### Recommended Implementation Order
1. **Foundation work** - [What needs to be built first]
2. **Core features** - [What can be built in parallel]
3. **Integration** - [How we connect to existing systems]
4. **Testing & validation** - [How we validate everything works]

### Effort Estimation
| Component | Effort | Confidence |
|-----------|--------|------------|
| Database schema | [X days] | High/Med/Low |
| Backend API | [X days] | High/Med/Low |
| Frontend UI | [X days] | High/Med/Low |
| Integration | [X days] | High/Med/Low |
| Testing | [X days] | High/Med/Low |
| **Total** | **[X days]** | - |

## Work Breakdown (Beads Items)

**Beads Epic:** `bd-[project]` (created by @tech-lead during planning)

> All work items are created directly in Beads using `bd create`. View with `bd list --parent bd-[project] --json`.

### Execution Phases

#### Phase 1: Foundation
**Goal:** [What this phase achieves]
**Duration:** [Estimated days/weeks]
**Beads Items:**
- `bd-[project].1` - Database schema and migrations (@database-engineer)
- `bd-[project].2` - API scaffolding (@backend-engineer)

**Parallel Execution:** Items .1 and .2 can run in parallel (no dependencies)

---

#### Phase 2: Core Implementation
**Goal:** [What this phase achieves]
**Duration:** [Estimated days/weeks]
**Depends On:** Phase 1
**Beads Items:**
- `bd-[project].3` - Core feature implementation (@backend-engineer)
- `bd-[project].4` - UI component development (@frontend-engineer)

**Dependencies configured:**
```bash
bd dep add bd-[project].1 bd-[project].3 --type blocks
bd dep add bd-[project].2 bd-[project].3 --type blocks
```

---

#### Phase 3: Integration
**Goal:** [What this phase achieves]
**Duration:** [Estimated days/weeks]
**Depends On:** Phase 2
**Beads Items:**
- `bd-[project].5` - System integration (@backend-engineer)

---

#### Phase 4: Testing & Refinement
**Goal:** [What this phase achieves]
**Duration:** [Estimated days/weeks]
**Depends On:** Phase 3
**Beads Items:**
- `bd-[project].6` - Backend API tests (@qa-backend)
- `bd-[project].7` - E2E tests (@qa-frontend)

---

### View Dependency Graph

```bash
bd dep tree bd-[project]
```

### View Ready Work

```bash
bd ready --json
```

### Critical Path
[Identify the longest dependency chain - this determines minimum project duration]

**Example Critical Path:** bd-[project].1 → .3 → .5 → .6 → .7
**Minimum Duration:** [X weeks]

---

## Architecture Decision Records (ADRs)

[Create ADRs for any significant technical decisions made during assessment]

- [ADR-001: Database Schema Design](../../architecture/decisions/adr-001-database-schema.md)
- [ADR-002: Integration Strategy](../../architecture/decisions/adr-002-integration-strategy.md)

---

## Sign-Off

**Tech Lead Assessment Complete:** [ ] @tech-lead - [Date]
**Product Manager Review:** [ ] @product-manager - [Date]
**Ready for Execution:** [ ] [Date]

**Next Step:** @work-orchestrator, please create individual work items and coordinate execution using `/execute-work project:[feature-name]`
```

---

## Notes for Agents

- **@tech-lead:** This is YOUR command for assessing external designs against the codebase. Be thorough in your assessment—identify incompatibilities, propose modifications, and create an executable plan. Use the `design-reviewer` skill to validate external designs. **You MUST create Beads work items directly** using `bd create` after completing assessment. Configure dependencies with `bd dep add`.
- **@product-manager:** You may be consulted if external design significantly conflicts with codebase and major scope changes are needed.
- **@work-orchestrator:** Beads items are already created when you're engaged. Query `bd ready` for unblocked work and dispatch agents accordingly. No need to "convert" work breakdowns—they're already in Beads.
- **Engineers:** You'll receive work items tracked in Beads. Use `bd show <id>` for details and `bd update <id> --status in_progress` when starting.

---

## Usage Examples

```bash
# After receiving external PRD and system design
/plan-execution project:user-authentication

# For a feature with Figma designs and external specs
/plan-execution project:dashboard-redesign

# For externally-designed AI feature
/plan-execution project:recommendation-engine
```

---

## Success Criteria

A well-executed `/plan-execution` should result in:
- [ ] Complete codebase assessment against external documentation
- [ ] Architecture compatibility analysis with clear gaps identified
- [ ] Code reusability assessment - what can be leveraged vs built new
- [ ] Integration points and challenges documented
- [ ] Database, API, and dependency impacts analyzed
- [ ] Performance and security considerations addressed
- [ ] Implementation challenges identified with mitigation strategies
- [ ] Design modifications proposed (if external design has issues)
- [ ] Execution approach recommended with justification
- [ ] Detailed work breakdown with effort estimates (documentation)
- [ ] Dependencies clearly identified with execution phases
- [ ] Critical path identified
- [ ] ADRs created for significant decisions
- [ ] Ready for @work-orchestrator to create **Beads work items** via `bd create`
- [ ] Ready for `/execute-work` to dispatch agents (Beads-tracked)
