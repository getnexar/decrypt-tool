---
name: challenge-council
description: Orchestrates adversarial review through 3-round dialogue between proposer and @challenger. Generates challenges, manages defense rounds, issues verdicts, and escalates to user arbitration when needed.
allowed-tools: Read, Bash, Grep, Glob, Write, Task
---

> **Implementation Status: SPECIFICATION ONLY**
>
> This skill document defines the Challenge Council protocol. The automated
> orchestration is not yet implemented. The protocol can be followed manually
> using @challenger agent mentions.
>
> See: Future work item for implementation tracking.

# Challenge Council Skill

Orchestrate adversarial review of proposals through a structured 3-round protocol with @challenger. Strengthens proposals by forcing defenders to justify their choices with evidence.

## Philosophy

> "Challenge Council exists to stop shortcuts and enforce deep thinking. When developers take the easy way out instead of reflecting deeply on problems, the challenger forces them to defend their choices with evidence."

**Key principle:** Challenge Council is a sparring partner, not a blocker. The goal is to strengthen proposals through challenge, not to prevent work. But the sparring must be uncomfortable enough that developers cannot dismiss it.

## When to Invoke

| Trigger | Context |
|---------|---------|
| Pre-Implementation | After planning complete, before writing code |
| Pre-Design Approval | Before approving a technical design |
| Pre-PR | Before creating a PR for significant changes |
| `/challenge [proposal]` | Explicit request for adversarial review |
| User Request | When user asks for adversarial or critical review |

### Skip Criteria

Challenge Council may be skipped if:
- Change is trivial (documentation-only, config updates)
- Time-critical hotfix (document post-mortem instead)
- Proposal has already passed Challenge Council
- Explicit `--skip-challenge` with documented reason

## Protocol Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHALLENGE COUNCIL PROTOCOL                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ROUND 1: Challenge Generation                                  │
│  ├── @challenger receives proposal                              │
│  └── Generates exactly 3 prioritized challenges                 │
│                                                                 │
│  ROUND 2: Defense                                               │
│  ├── Proposer responds to each challenge:                       │
│  │   • Accept (modify proposal)                                 │
│  │   • Refute (with evidence)                                   │
│  │   • Escalate (genuine disagreement)                          │
│  └── Defenses documented for each challenge                     │
│                                                                 │
│  ROUND 3: Resolution                                            │
│  ├── @challenger evaluates defenses                             │
│  └── Issues verdict:                                            │
│      • APPROVED                                                 │
│      • APPROVED_WITH_MODIFICATIONS                              │
│      • REJECTED                                                 │
│      • ESCALATE_TO_USER                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Round 1: Challenge Generation

### Step 1.1: Receive Proposal

Collect the proposal to be challenged:
- **Proposal document:** Design doc, plan, or specification
- **Context:** What problem it solves, constraints, alternatives considered
- **Specific areas of concern** (if proposer has any)

### Step 1.2: Engage @challenger

Present the proposal to @challenger for analysis.

**Prompt template:**
```markdown
@challenger, review this proposal and generate your 3 challenges:

## Proposal: [Title]

### Summary
[What is being proposed]

### Context
[Why this is being proposed, constraints, background]

### Key Decisions
[The main choices being made]

### Alternatives Considered
[What else was considered and why rejected]

---

Generate exactly 3 challenges prioritized by severity.
```

### Step 1.3: Receive Challenges

@challenger returns 3 challenges in this format:

```markdown
# Challenge Review: [Proposal Title]

**Proposal Summary:** [1-2 sentence summary]
**Reviewed:** [YYYY-MM-DD]

---

## CHALLENGE 1: [Title] (Critical/High)

**Category:** [Technical | Design | Requirements | Risk]
**Target:** [The specific claim/decision being challenged]
**Challenge:** [The attack - why this might be wrong]
**Evidence Required:** [What the proposer must show to defend]

---

## CHALLENGE 2: [Title] (High/Medium)
[Same format]

---

## CHALLENGE 3: [Title] (Medium)
[Same format]

---

## Awaiting Defense

The proposer must respond to each challenge with:
1. **Accept** - Acknowledge and modify the proposal
2. **Refute** - Provide evidence that addresses the challenge
3. **Escalate** - Disagree and request user arbitration
```

---

## Round 2: Defense

### Step 2.1: Present Challenges to Proposer

Show the proposer all 3 challenges and request defense.

**Defense template:**
```markdown
# Defense Response

## Challenge 1: [Title]

**Response Type:** [Accept | Refute | Escalate]

**Defense:**
[Explanation and evidence]

**Proposed Modification (if Accept):**
[What will change]

---

## Challenge 2: [Title]

**Response Type:** [Accept | Refute | Escalate]

**Defense:**
[Explanation and evidence]

---

## Challenge 3: [Title]

**Response Type:** [Accept | Refute | Escalate]

**Defense:**
[Explanation and evidence]
```

### Step 2.2: Defense Guidelines

Guide proposer on what makes a strong defense:

| Response Type | When to Use | What to Include |
|---------------|-------------|-----------------|
| **Accept** | Challenge is valid, proposal should change | Specific modification to proposal |
| **Refute** | Challenge can be addressed with evidence | Concrete evidence, data, or precedent |
| **Escalate** | Genuine disagreement, need user input | Both positions stated fairly |

**Strong evidence includes:**
- Benchmark data or measurements
- Precedent from similar systems
- Technical documentation or standards
- Risk analysis with probabilities
- Expert opinion with rationale

**Weak evidence includes:**
- "We believe" or "it seems"
- Anecdotes without data
- Appeal to common practice without justification
- Ignoring the challenge core

---

## Round 3: Resolution

### Step 3.1: Return Defense to @challenger

Present the proposer's defenses to @challenger for evaluation.

**Prompt template:**
```markdown
@challenger, evaluate these defenses:

## Original Challenges and Defenses

### Challenge 1: [Title]
**Original Challenge:** [The challenge]
**Response Type:** [Accept/Refute/Escalate]
**Defense:** [The defense provided]
**Evidence:** [Evidence if any]

### Challenge 2: [Title]
[Same format]

### Challenge 3: [Title]
[Same format]

---

Issue your verdict: APPROVED, APPROVED_WITH_MODIFICATIONS, REJECTED, or ESCALATE_TO_USER
```

### Step 3.2: Receive Verdict

@challenger issues final verdict:

```markdown
# Challenge Council Verdict

**Proposal:** [Title]
**Date:** [YYYY-MM-DD]

## Challenge Resolution Summary

| Challenge | Defense | Outcome |
|-----------|---------|---------|
| 1. [Title] | [Accept/Refute/Escalate] | [Addressed/Outstanding/Escalated] |
| 2. [Title] | [Accept/Refute/Escalate] | [Addressed/Outstanding/Escalated] |
| 3. [Title] | [Accept/Refute/Escalate] | [Addressed/Outstanding/Escalated] |

## Verdict: [APPROVED | APPROVED_WITH_MODIFICATIONS | REJECTED | ESCALATE_TO_USER]

**Reasoning:**
[Explanation based on defense quality]

### Required Modifications (if applicable)
- [ ] [Modification 1]
- [ ] [Modification 2]

### Escalation Details (if applicable)
**Disagreement:** [What cannot be resolved]
**Challenger Position:** [View with evidence]
**Proposer Position:** [View with evidence]
**User Decision Needed:** [The question for user]
```

---

## Verdict Handling

### APPROVED

Proposal proceeds as-is:
1. Document approval in proposal file
2. Proceed to implementation/PR/next step
3. No further challenge needed

### APPROVED_WITH_MODIFICATIONS

Proposal proceeds with changes:
1. Document required modifications
2. Proposer updates proposal
3. Changes verified (no re-challenge needed unless scope changes significantly)
4. Proceed to next step

### REJECTED

Proposal does not proceed:
1. Document rejection reasons
2. Proposer must substantially revise proposal
3. Revised proposal goes through new Challenge Council
4. Prevent implementation of flawed proposal

### ESCALATE_TO_USER

User arbitration needed:
1. Present both positions clearly
2. Include evidence from both sides
3. Ask user for decision
4. User's decision is final
5. Document decision and proceed accordingly

---

## User Arbitration Protocol

When `ESCALATE_TO_USER` is triggered:

### Step 1: Present the Dispute

```markdown
# Challenge Council Escalation

## The Dispute

**Challenge:** [Title of challenged aspect]
**Category:** [Technical/Design/Requirements/Risk]

## Challenger Position

**Argument:**
[What @challenger believes]

**Evidence:**
[Supporting evidence]

**Risk if Ignored:**
[What could go wrong]

## Proposer Position

**Argument:**
[What proposer believes]

**Evidence:**
[Supporting evidence]

**Cost if Rejected:**
[What is lost if challenge is upheld]

## Decision Required

[Specific question for user to answer]

**Options:**
1. **Side with Challenger** - [What this means]
2. **Side with Proposer** - [What this means]
3. **Hybrid Approach** - [If there's a middle ground]
```

### Step 2: Accept User Decision

User's decision is final and binding:
- Document the decision
- Update proposal accordingly
- Proceed with user's choice
- No further debate on this point

---

## Integration Points

### With Beads Work Items

Track challenge status in work items:

```bash
# Challenge started
bd update <id> -d "CHALLENGE: in_progress - Challenge Council initiated" --json

# Challenge passed
bd update <id> -d "CHALLENGE: approved - Passed Challenge Council" --json

# Challenge passed with modifications
bd update <id> -d "CHALLENGE: approved_with_modifications - [modifications]" --json

# Challenge rejected
bd update <id> -d "CHALLENGE: rejected - [reason]" --json

# Escalated to user
bd update <id> -d "CHALLENGE: escalated - Awaiting user arbitration on [topic]" --json
```

### With Discipline Framework

Challenge Council can be part of the validation loop:
- Triggered after plan completion
- Blocking before implementation begins
- Can be bypassed with `DISCIPLINE_SKIP_ALL=true` in emergencies

### With PR Creation

When `/pr-create` or PR workflow triggers:
- Check if significant changes warrant challenge
- If yes, initiate Challenge Council first
- PR blocked until challenge passes or is explicitly skipped

---

## Output Artifacts

### Challenge Transcript

Save full challenge session to:
`agent_docs/reviews/challenge-[proposal-name]-[date].md`

**Template:**
```markdown
# Challenge Council Transcript

**Proposal:** [Title]
**Date:** [YYYY-MM-DD]
**Proposer:** [Agent/User]
**Challenger:** @challenger

---

## Round 1: Challenges

[Full challenge text from @challenger]

---

## Round 2: Defenses

[Full defense text from proposer]

---

## Round 3: Verdict

[Full verdict from @challenger]

---

## Resolution

**Final Status:** [APPROVED/APPROVED_WITH_MODIFICATIONS/REJECTED/USER_DECISION]
**Modifications (if any):** [List]
**User Decision (if escalated):** [Decision]

---

## Impact on Proposal

[How the proposal changed as a result of this challenge]
```

---

## Quick Reference Card

```
CHALLENGE COUNCIL QUICK REFERENCE

Invoke:
  /challenge [proposal description]
  - OR include "challenge-council" in skill invocation

Skip Conditions:
  - Trivial changes (docs, config)
  - Time-critical hotfix
  - Already challenged
  - --skip-challenge flag

Challenge Categories:
  - Technical: Implementation, performance, scalability
  - Design: Structure, patterns, maintainability
  - Requirements: Problem definition, scope, criteria
  - Risk: Security, reliability, operations

Defense Types:
  - Accept: Modify proposal to address challenge
  - Refute: Provide evidence against challenge
  - Escalate: Request user arbitration

Verdicts:
  - APPROVED: Proceed as-is
  - APPROVED_WITH_MODIFICATIONS: Proceed with changes
  - REJECTED: Revise and re-challenge
  - ESCALATE_TO_USER: User decides

Evidence Quality:
  Strong: Data, benchmarks, precedent, documentation
  Weak: Opinions, anecdotes, common practice
```

---

## Validation Checklist

Before concluding Challenge Council:

- [ ] Proposal was clearly presented to @challenger
- [ ] Exactly 3 challenges were generated
- [ ] Proposer responded to all 3 challenges
- [ ] @challenger evaluated all defenses
- [ ] Clear verdict was issued
- [ ] Required modifications are specific (if applicable)
- [ ] User arbitration was fair (if escalated)
- [ ] Transcript saved to `agent_docs/reviews/`
- [ ] Work item updated with challenge status

---

## Context Files

> **Context Discipline:** Only load files directly relevant to the proposal being challenged.

Reference during challenges:
- `agent_docs/index.md` - Check first for file discovery
- `.claude/agents/challenger.md` - Challenger agent definition
- `agent_docs/designs/[feature]/` - Design being challenged (if design review)
- `agent_docs/requirements/[feature].md` - Requirements context
