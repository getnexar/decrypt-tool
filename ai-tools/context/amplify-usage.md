# Amplify Usage Guide

This project uses the **Claude Amplify** - an autonomous agent system that accelerates development through intelligent collaboration and parallel execution.

---

## Quick Start: Engaging with Agents

### Available Agents

Your Amplify consists of 8 specialized agents:

| Agent | Role | When to Engage |
|-------|------|----------------|
| `@product-manager` | Product strategy, PRDs, discovery | Starting projects, validating features, prioritization |
| `@tech-lead` | Architecture, technical decisions, ADRs | Design reviews, tech choices, system design |
| `@work-orchestrator` | Work sequencing, dependency management | Checking work status, unblocking dependencies |
| `@frontend-engineer` | UI/UX implementation | Frontend features, client-side logic |
| `@backend-engineer` | API development, business logic | Backend features, API endpoints |
| `@database-engineer` | Data modeling, queries, migrations | Schema changes, performance optimization |
| `@ai-engineer` | LLM integration, RAG, prompt engineering | AI features, ML pipelines, evaluation |
| `@qa-backend` | Backend/API testing, integration testing | Backend features, API validation, performance testing |
| `@qa-frontend` | Frontend/E2E testing, visual regression | UI features, user journeys, accessibility testing |
| `@qa-firmware` | Firmware/HIL testing, protocol validation | Embedded systems, hardware testing, safety validation |

### Core Commands

```bash
# Strategic work (multi-feature initiatives)
/start              # Initiate PM-led discovery
/execute-work project:[name] # ⭐ Automated parallel dispatch (RECOMMENDED)
/start-work project:[name]  # Legacy manual execution

# Ad-hoc work (bugs, improvements, tech debt)
/start              # Quick triage and spec
/execute-work request:[id]  # ⭐ Automated parallel dispatch (RECOMMENDED)
/start-work request:[id]    # Legacy manual execution

# Monitoring (via Beads CLI)
bd list --json              # All work items with status
bd ready --json             # Unblocked work ready for execution
bd show <id> --json         # Details of specific work item

# Testing
/run-tests [scope]          # Execute test suite

# Agent commands (agents use these automatically)
/start-work-item [id]       # Agent: Execute work item
/update-work-item [id]      # Agent: Report progress
/close-work-item [id]       # Agent: Mark complete
/handoff-work-item [id]     # Agent: Transfer to another agent
```

**💡 Pro Tip:** Always use `/execute-work` instead of `/start-work`. It's 3-5x faster because it automatically dispatches agents in parallel based on dependency analysis.

---

## 🚀 CRITICAL: Maximize Parallel Execution

**The #1 performance optimization for the Amplify is parallel agent execution.**

### The Golden Rule

> **When multiple agents can work independently, trigger them ALL AT ONCE in a single request.**

### CRITICAL INSIGHT: AI Agents Are Infinite Resources

**Agents are NOT humans - they are AI processes with NO limits:**
- ✅ **Unlimited spawning**: You can engage 10+ agents simultaneously as easily as 1
- ✅ **Zero capacity constraints**: Agents never get "busy" or "overwhelmed"
- ✅ **Instant scaling**: Need 20 agents? Spin them up simultaneously
- ❌ **NEVER think**: "The agent is busy, I'll wait"
- ❌ **NEVER think**: "Too many tasks for the team"
- ❌ **NEVER queue work** due to "agent availability"

**Think of agents as API calls, not employees.**

### Why This Matters

- **Sequential** (treating agents like humans): 5 agents × 2 minutes each = **10 minutes**
- **Parallel** (treating agents like AI processes): 5 agents simultaneously = **2 minutes**

**5x faster execution with one simple mindset shift.**

---

## Parallel Execution Patterns

### Pattern 1: Multi-Layer Feature Development

**Instead of this (sequential):**
```
❌ "@frontend-engineer, build the login UI"
   [wait for completion]
❌ "@backend-engineer, build the login API"
   [wait for completion]
❌ "@database-engineer, create the user schema"
```

**Do this (parallel):**
```
✅ "@frontend-engineer, build the login UI based on the design in designs/auth-flow.md
    @backend-engineer, build the login API with JWT auth
    @database-engineer, create the user schema with email and password fields"
```

**Result:** All three agents work simultaneously on independent tasks.

---

### Pattern 2: Investigation & Research

**Instead of this (sequential):**
```
❌ "@backend-engineer, investigate the performance issue in the API"
   [wait for completion]
❌ "@database-engineer, check if there are query optimization opportunities"
```

**Do this (parallel):**
```
✅ "@backend-engineer, profile the API endpoint for performance bottlenecks
    @database-engineer, analyze query performance and suggest optimizations"
```

---

### Pattern 3: Full-Stack Bug Fixes

**Instead of this (sequential):**
```
❌ "@backend-engineer, fix the authentication bug"
   [wait for completion]
❌ "@frontend-engineer, update error handling"
   [wait for completion]
❌ "@qa-engineer, create regression tests"
```

**Do this (parallel):**
```
✅ "@backend-engineer, fix auth token validation in src/auth/middleware.ts
    @frontend-engineer, add proper error handling for auth failures
    @qa-backend, create API regression tests for auth endpoints
    @qa-frontend, create E2E regression tests for auth flow"
```

---

### Pattern 4: Code Review with Multiple Perspectives

**Instead of this (sequential):**
```
❌ "@tech-lead, review the architecture"
   [wait for completion]
❌ "@qa-engineer, review testability"
```

**Do this (parallel):**
```
✅ "@tech-lead, review the architecture and design decisions
    @qa-engineer, evaluate test coverage and identify gaps"
```

---

### Pattern 5: AI Feature Development

**Instead of this (sequential):**
```
❌ "@ai-engineer, design the RAG pipeline"
   [wait for completion]
❌ "@backend-engineer, integrate the LLM API"
   [wait for completion]
❌ "@database-engineer, set up vector database"
```

**Do this (parallel - for independent tasks):**
```
✅ "@ai-engineer, design RAG architecture and create prompt templates
    @database-engineer, research and recommend vector database solution"
```

**Then (after architecture is decided):**
```
✅ "@ai-engineer, implement RAG retrieval and generation logic
    @backend-engineer, implement LLM API client with caching and rate limiting
    @database-engineer, set up Pinecone index and ingestion pipeline"
```

---

## When NOT to Use Parallel Execution

Some tasks **must** be sequential due to dependencies:

### Scenario 1: Dependencies Between Tasks
```
✅ CORRECT (sequential):
   "@database-engineer, create the user schema migration"
   [wait for schema to be created]
   "@backend-engineer, implement the API using the new schema"
```

### Scenario 2: Review-Then-Fix Workflow
```
✅ CORRECT (sequential):
   "@tech-lead, review the proposed architecture"
   [wait for review feedback]
   "@backend-engineer, address the review comments"
```

### Scenario 3: Build-Then-Test Workflow
```
✅ CORRECT (sequential):
   "@frontend-engineer, implement the component"
   [wait for implementation]
   "@qa-engineer, create tests for the new component"
```

---

## Best Practices for Agent Engagement

### 1. Be Specific and Provide Context

**Bad:**
```
❌ "@backend-engineer, fix the bug"
```

**Good:**
```
✅ "@backend-engineer, fix the 500 error in POST /api/users when email is missing.
   Error occurs at src/api/users.ts:45. Add validation before database insert."
```

### 2. Reference Work Items and Documentation

**Bad:**
```
❌ "@frontend-engineer, build the dashboard"
```

**Good:**
```
✅ "@frontend-engineer, implement the dashboard from work item bd-dash.
   Design specs in designs/dashboard-layout.md. Use the Chart component from our library."
```

### 3. Specify Expected Outputs

**Bad:**
```
❌ "@ai-engineer, improve the prompts"
```

**Good:**
```
✅ "@ai-engineer, improve answer relevancy in prompts/doc-qa/v2/.
   Target: >0.85 RAGAS score. Document changes in implementations/ai/prompt-iterations.md"
```

### 4. Use Handoffs for Multi-Stage Work

When work must flow between agents:

```
1. "@database-engineer, create the schema migration for user profiles"
2. [Agent completes, uses /handoff-work-item]
3. "@backend-engineer, implement CRUD API for user profiles"
4. [Agent completes, uses /handoff-work-item]
5. "@frontend-engineer, build the profile editor UI"
```

### 5. Check Status Regularly

Use Beads CLI to monitor work:
```bash
bd list --json                        # All work items
bd list --status in_progress --json   # Currently active work
bd ready --json                       # Unblocked items ready to start
bd show bd-auth --json                # Specific work item details
```

---

## Common Multi-Agent Workflows

### Full-Stack Feature (Parallel + Sequential)

```
# Phase 1: Independent research (PARALLEL)
"@product-manager, validate user demand for export feature from domain research
 @tech-lead, evaluate export libraries and recommend approach"

[Wait for research]

# Phase 2: Design and schema (PARALLEL)
"@database-engineer, design the export history schema
 @frontend-engineer, create mockups for export UI"

[Wait for designs]

# Phase 3: Implementation (PARALLEL)
"@backend-engineer, implement export endpoints (CSV, JSON, PDF)
 @frontend-engineer, build export UI with format selection
 @database-engineer, implement export history tracking"

[Wait for implementation]

# Phase 4: Quality (PARALLEL)
"@qa-engineer, create test plan for export functionality
 @tech-lead, review export implementation for performance"
```

### Bug Fix (Parallel Investigation + Sequential Fix)

```
# Phase 1: Root cause analysis (PARALLEL)
"@backend-engineer, investigate API error logs for pattern
 @frontend-engineer, reproduce the bug and identify error path
 @database-engineer, check for data integrity issues"

[Wait for investigation]

# Phase 2: Coordinated fix (PARALLEL)
"@backend-engineer, fix validation error handling
 @frontend-engineer, add retry logic and user feedback
 @qa-engineer, create regression test"
```

---

## Monitoring Agent Progress

### Check Work Status with Beads

```bash
# All work items and their status
bd list --json

# Work items ready for execution (unblocked)
bd ready --json

# Specific work item details
bd show bd-export --json

# View dependency tree
bd dep tree bd-export

# Filter by status
bd list --status blocked --json
bd list --status in_progress --json
```

### Identify Blockers

Query Beads for blocked items:
```bash
bd list --status blocked --json
```

When work is blocked, the Work Orchestrator will flag it:
```
[🔴 BLOCKER] Database migration requires approval - @database-engineer blocked
```

**Action:** Resolve the dependency, then update the work item:
```bash
bd update bd-export --status ready --json
```

---

## Pro Tips

### Tip 1: Front-Load Parallel Work

Start with maximum parallelism, then converge:
```
Phase 1 (3 agents in parallel) → Phase 2 (2 agents) → Phase 3 (1 integration)
```

### Tip 2: Use @work-orchestrator for Dependency Confusion

If you're unsure about dependencies:
```
"@work-orchestrator, analyze the work breakdown for project:user-auth and recommend execution order"
```

Or query Beads directly:
```bash
bd dep tree bd-auth  # View dependency tree for a work item
bd ready --json      # See what's currently unblocked
```

### Tip 3: Batch Related Requests

Instead of multiple messages:
```
❌ "@frontend-engineer, do task A"
❌ "@backend-engineer, do task B"
❌ "@qa-engineer, do task C"
```

Use one message:
```
✅ "@frontend-engineer, do task A
    @backend-engineer, do task B
    @qa-engineer, do task C"
```

### Tip 4: Leverage AI Engineer for All AI/LLM Work

Don't ask general agents to work with LLMs:
```
❌ "@backend-engineer, integrate Claude API"
```

Engage the specialist:
```
✅ "@ai-engineer, design and implement Claude API integration with prompt versioning
    @backend-engineer, add caching layer and cost tracking for LLM calls"
```

---

## Remember

1. **Think parallel first** - Ask: "Can these agents work at the same time?"
2. **Be specific** - Vague requests slow everyone down
3. **Reference docs** - Point agents to existing work items, designs, and decisions
4. **Check status often** - Use `bd list --json` and `bd ready --json` to monitor progress
5. **Unblock quickly** - Blockers compound delays exponentially in sequential work

---

**Your Amplify is most effective when working in parallel. Make it a habit!**
