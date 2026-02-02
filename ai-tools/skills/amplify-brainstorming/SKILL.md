---
name: amplify-brainstorming
description: Enhanced brainstorming with mandatory thinking sequence and multi-perspective exploration. Use for feature discovery, design exploration, and understanding user intent before implementation.
allowed-tools: Read, Bash, Grep, Glob, Task, AskUserQuestion
---

# Amplify Brainstorming Skill

Enhanced version of brainstorming that integrates the thinking sequence from agentic transformation learnings. This skill ensures deliberate reasoning before action.

## When to Use

- New feature requests
- Ambiguous requirements
- Design decisions
- Before any non-trivial implementation
- When user intent is unclear

## Core Principle

**Understand before building. Question before assuming. Verify before claiming.**

---

## Thinking Sequence [MANDATORY]

Before making ANY significant decision during brainstorming, work through this sequence. This is not optional.

### Step 1: Think
**Question:** "What is the problem we're solving?"

- State the problem in ONE clear sentence
- Identify who has the problem (user, system, business)
- Confirm understanding with user before proceeding

**Output:**
```
THINK: The problem is [one sentence description].
User confirmed: [yes/no]
```

### Step 2: Think Hard
**Question:** "What are the implications of this approach?"

- List downstream effects (3-5 items)
- Consider dependencies (what does this touch?)
- Identify integration points

**Output:**
```
THINK HARD: Implications include:
1. [Implication 1]
2. [Implication 2]
3. [Implication 3]
Dependencies: [list]
```

### Step 3: Think Really Hard
**Question:** "What am I missing? What could go wrong?"

- What edge cases exist?
- What could fail?
- What assumptions am I making?
- What would a skeptic say?

**Output:**
```
THINK REALLY HARD: Potential issues:
- Edge case: [description]
- Failure mode: [description]
- Assumption risk: [description]
```

### Step 4: Think Differently
**Question:** "What if my assumptions are wrong?"

- Challenge your own reasoning
- Consider the opposite approach
- Ask: "What would make me completely wrong?"

**Output:**
```
THINK DIFFERENTLY: Alternative perspective:
- If assumption X is wrong: [consequence]
- Opposite approach would be: [description]
- This could be wrong if: [condition]
```

### Step 5: Do Not Jump to Conclusions
**Question:** "Have I verified this before acting on it?"

- Cite evidence for your conclusion
- If no evidence exists, state that explicitly
- When uncertain, ask the user

**Output:**
```
DO NOT JUMP: Verification status:
- Evidence for approach: [what supports this]
- Evidence gaps: [what's missing]
- Confidence level: [high/medium/low]
- Next step: [gather evidence / proceed with caution / confirm with user]
```

---

## Brainstorming Workflow

### Phase 1: Intent Discovery

1. **Receive request** from user
2. **Apply thinking sequence** (Steps 1-2)
3. **Ask ONE clarifying question** if needed
4. **Confirm understanding** before proceeding

**Anti-pattern:** Asking 5 questions at once
**Correct pattern:** One question, wait for answer, then next question

### Phase 2: Solution Exploration

1. **Generate 2-3 approaches** (not just the obvious one)
2. **Apply thinking sequence** (Steps 3-4) to each approach
3. **Present trade-offs** clearly

**Format:**
```markdown
## Approach Options

### Option A: [Name]
**Description:** [1-2 sentences]
**Pros:** [bullet list]
**Cons:** [bullet list]
**Effort:** [relative estimate: small/medium/large]

### Option B: [Name]
[same format]

### Option C: [Name]
[same format]

**Recommended:** Option [X] because [reasoning]
```

### Phase 3: Design Validation

1. **Apply thinking sequence** (Step 5)
2. **Get user confirmation** on approach
3. **Document assumptions** explicitly
4. **Identify unknowns** that need research

### Phase 4: Multi-Perspective Review

For non-trivial features, explicitly address each perspective:

| Perspective | Questions to Answer |
|-------------|---------------------|
| Architecture | Does this fit our patterns? What's the integration story? |
| Security | What's the auth model? What data is exposed? |
| Testing | How will this be tested? What coverage is needed? |
| Performance | Any latency concerns? Database impact? |

### Phase 5: Handoff to Planning

Once brainstorming is complete:
1. Summarize decisions made
2. List explicit assumptions
3. Hand off to `amplify-planning` or `superpowers:writing-plans`

---

## Red Flags During Brainstorming

Stop and reconsider if you catch yourself:

| Thought | What to Do Instead |
|---------|---------------------|
| "This is obvious" | Apply full thinking sequence anyway |
| "The user probably means..." | Ask, don't assume |
| "We can figure that out later" | Figure it out now or document as unknown |
| "This is how it's usually done" | Verify it fits this specific context |
| "Let me just start coding" | NO - complete brainstorming first |

---

## Output Format

At the end of brainstorming, produce:

```markdown
# Brainstorming Summary: [Feature Name]

## Problem Statement
[One sentence from Think step]

## Chosen Approach
[Selected option with brief rationale]

## Key Decisions
- Decision 1: [what] - Rationale: [why]
- Decision 2: [what] - Rationale: [why]

## Explicit Assumptions
- ASSUMPTION: [assumption 1]
- ASSUMPTION: [assumption 2]

## Known Unknowns
- [ ] [Thing we need to research/verify]
- [ ] [Thing we need to research/verify]

## Perspective Reviews
- Architecture: [addressed/not applicable]
- Security: [addressed/not applicable]
- Testing: [addressed/not applicable]

## Next Step
[Hand off to planning / need more information / blocked on X]
```

---

## Context Files

> **Context Discipline:** Only load files directly relevant to understanding the feature being brainstormed.

- `agent_docs/project-overview.md` - Understand project context
- `agent_docs/technical-setup.md` - Tech stack constraints
- `agent_docs/decisions/` - Relevant prior decisions
- `.claude/agent-context/` - Domain-specific context
