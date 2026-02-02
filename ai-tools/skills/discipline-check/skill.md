---
name: discipline-check
description: Quick verification checklist for Amplify operating principles
category: utilities
tags: [discipline, orchestration, delegation, workflow]
---

# Discipline Check

**Purpose:** Quick self-verification against Amplify operating principles before taking action.

**When to use:** When you're about to write code, delegate work, or make implementation decisions and want to verify you're following correct patterns.

---

## Quick Verification Checklist

### 1. Am I a Worker Session?

**Check for ANY of these:**
- [ ] Prompt starts with `# CRITICAL CONTEXT - READ FIRST` mentioning "ISOLATED WORKTREE"
- [ ] Working directory is inside `.worktrees/` (e.g., `.worktrees/bd-xxx`)
- [ ] See `Session ID:` and `Worktree Path:` in initial context
- [ ] `AMPLIFY_SESSION_TYPE=worker` environment variable set

**If YES → WORKER MODE:**
- ✅ Implement directly - you ARE the implementer
- ✅ Write code, fix bugs, complete your assigned task
- ❌ DO NOT delegate to other agents
- ❌ DO NOT run `bd create` or dispatch sessions
- ❌ Stay in your worktree only

**If NO → ORCHESTRATOR MODE:** Continue to Step 2

---

### 2. Orchestrator Never Writes Code

**If you're an orchestrator:**
- ❌ DO NOT implement features yourself
- ❌ DO NOT write production code
- ❌ DO NOT perform technical implementations
- ✅ DO delegate to specialized agents via @ mentions

**Red flag actions for orchestrators:**
- Writing new functions/classes
- Implementing business logic
- Creating new components
- Writing tests directly
- Refactoring code

**Correct actions:**
- `@backend-engineer, implement the auth API`
- `@frontend-engineer, build the login form`
- `@database-engineer, create the users table`

---

### 3. How to Delegate (Agentic vs Collaborative)

**Check execution mode:**

**🤖 Agentic Mode:**
- Convert work to Beads items (`bd create`)
- Dispatch via `npx amplify session dispatch-ready`
- Let system handle parallelization
- Auto-trigger reviews and merges

**🤝 Collaborative Mode:**
- Stay in current session
- Use `@agent-name` mentions for delegation
- Multiple agents in one message = parallel execution
- Show changes and ask for approval

**🎯 Direct Mode:**
- User drives everything
- Assist on explicit request only
- No automatic patterns

---

### 4. Skill Check (1% Chance Rule)

**Before proceeding, ask:**
> "Is there a skill that might apply to this task?"

**Common skill triggers:**
- Writing new features → `superpowers:test-driven-development`
- Fixing bugs → `superpowers:systematic-debugging`
- About to claim done → `superpowers:verification-before-completion`
- Creating PR → `superpowers:requesting-code-review` then `pr-creator`
- Received review feedback → `superpowers:receiving-code-review`
- Writing implementation plans → `superpowers:writing-plans`
- Executing plans → `superpowers:executing-plans`

**If skill applies, invoke it FIRST before any other response.**

---

### 5. Parallelism Check

**Agents are unlimited AI processes, NOT human resources.**

**Before sequential execution, ask:**
> "Can any of these tasks run in parallel?"

**Example - WRONG (Sequential):**
```
"@database-engineer, create schema"
[wait]
"@backend-engineer, build API"
[wait]
"@frontend-engineer, build UI"
```

**Example - CORRECT (Parallel):**
```
"@database-engineer, create the users schema with email, password_hash, created_at
 @backend-engineer, build auth API with JWT tokens
 @frontend-engineer, build login form with validation"
```

**Parallelism rules:**
- Default to parallel unless there are actual dependencies
- Group work into dependency waves
- Never reason about "agent capacity" or "workload"
- Execute multiple projects simultaneously if independent

---

## Red Flag Actions Table

| Action | Worker Mode | Orchestrator Mode | Correct Approach |
|--------|-------------|-------------------|------------------|
| Writing code | ✅ Do it | ❌ STOP | Orchestrator: delegate to engineer |
| Fixing bugs | ✅ Do it | ❌ STOP | Orchestrator: delegate to engineer |
| Creating tests | ✅ Do it | ❌ STOP | Orchestrator: delegate to test-engineer |
| Delegating with @ | ❌ STOP | ✅ Do it | Worker: implement yourself |
| Running `bd create` | ❌ STOP | ✅ Do it | Worker: never create beads |
| Dispatching sessions | ❌ STOP | ✅ Do it | Worker: never dispatch |
| Implementing task | ✅ Do it | ❌ STOP | Check your role first |

---

## Common Violation Patterns

**Pattern 1: Orchestrator writes code**
```
❌ "Let me implement the login API..."
✅ "@backend-engineer, implement the login API with JWT auth"
```

**Pattern 2: Worker delegates**
```
❌ "@database-engineer, help me with the schema"
✅ [Worker implements schema changes directly]
```

**Pattern 3: Sequential execution when parallel possible**
```
❌ Complete task A, then start task B
✅ Dispatch A and B simultaneously if independent
```

**Pattern 4: Skipping relevant skills**
```
❌ Start implementing feature without TDD skill
✅ Invoke superpowers:test-driven-development first
```

**Pattern 5: Not checking worker mode first**
```
❌ Assume orchestrator, delegate when actually worker
✅ Check AMPLIFY_SESSION_TYPE and working directory first
```

---

## Decision Tree

```
START
  ↓
[Check: Am I in .worktrees/ directory?]
  ↓                    ↓
 YES                   NO
  ↓                    ↓
WORKER              ORCHESTRATOR
  ↓                    ↓
Implement           [Check: Is there a relevant skill?]
directly               ↓                    ↓
  ↓                   YES                   NO
COMPLETE             ↓                      ↓
                  Invoke skill         [Check: Can I parallelize?]
                     ↓                      ↓
                  COMPLETE           Delegate to agents
                                         ↓
                                     COMPLETE
```

---

## Output Format

After running this check, output:

```
✅ DISCIPLINE CHECK COMPLETE

Mode: [Worker / Orchestrator]
Relevant Skills: [List or "None"]
Parallelization: [Possible / Not Applicable]
Next Action: [What you'll do next]
```

---

## Notes

- This skill doesn't implement anything - it's a verification tool
- Use before major decisions (writing code, delegating, dispatching)
- Helps catch common anti-patterns early
- Reinforces correct Amplify workflow habits
