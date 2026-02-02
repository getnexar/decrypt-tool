# ADR-[NNN]: [Decision Title]

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date:** [YYYY-MM-DD]
**Author:** @[tech-lead or engineer]

## Context

[Describe the problem or situation that requires a decision. Provide enough background for readers to understand why this decision is necessary.]

### Background
[Context about the system, project phase, and the specific circumstances that led to needing this decision. Include relevant technical or business constraints.]

### Constraints
- [Technical constraint 1 - e.g., must integrate with existing system X]
- [Business constraint 2 - e.g., budget limits, timeline requirements]
- [Organizational constraint 3 - e.g., team expertise, support requirements]

### Requirements
[Link to requirements driving this decision: `agent_docs/requirements/[filename].md`]

## Decision

**We will [decision statement in clear, active voice].**

[Detailed description of what was decided. Be specific about the approach, technologies, patterns, or architectures chosen. Include enough detail that engineers can implement this decision.]

## Options Considered

### Option 1: [Name of Option]

**Description:**
[How this option would work, including key technologies, patterns, or approaches]

**Pros:**
- [Advantage 1 - be specific about benefits]
- [Advantage 2]
- [Advantage 3]

**Cons:**
- [Disadvantage 1 - be specific about drawbacks]
- [Disadvantage 2]
- [Disadvantage 3]

**Trade-offs:**
- [Trade-off description - what you gain vs what you sacrifice]

**Estimated Effort:** [Small / Medium / Large / X weeks]

### Option 2: [Name of Option]
[Repeat same structure as Option 1]

### Option 3: [Name of Option]
[Repeat same structure - typically 2-4 options total]

## Rationale

[Explain why the chosen option was selected over the alternatives. Address the key factors that influenced the decision.]

**Key Factors:**
1. [Factor 1 and why it was prioritized - e.g., Performance is critical because...]
2. [Factor 2 and its importance - e.g., Team familiarity reduces risk because...]
3. [Factor 3 and rationale - e.g., Maintainability outweighed initial cost because...]

**Decision Criteria:**
- [How options were evaluated - e.g., scoring, prototyping, research]
- [Who was involved in the decision - stakeholders consulted]

## Consequences

### Positive
- [Positive consequence 1 - specific benefit that will result]
- [Positive consequence 2 - improvement to system or team]
- [Positive consequence 3 - future opportunities enabled]

### Negative
- [Negative consequence 1 - drawback or limitation]
  - **Mitigation:** [How we'll address this concern]
- [Negative consequence 2 - technical debt or complexity added]
  - **Mitigation:** [Plan to minimize impact]
- [Negative consequence 3 - risk introduced]
  - **Mitigation:** [Strategy to manage risk]

### Neutral
- [Neutral consequence 1 - changes that are neither good nor bad]
- [Neutral consequence 2 - shifts in approach or responsibility]

## Implementation

### Required Changes
- [Change to component/system A - what needs to be modified]
- [Change to component/system B - new code or refactoring needed]
- [Change to infrastructure/tooling - setup or configuration]

### Migration Strategy
[If replacing an existing approach:]
- **Current State:** [How it works now]
- **Transition Plan:** [Steps to migrate from current to new approach]
- **Backward Compatibility:** [How to support existing integrations during migration]
- **Timeline:** [Phased rollout or big-bang approach]

### Timeline
[When this will be implemented:]
- **Phase 1:** [Dates] - [What will be done]
- **Phase 2:** [Dates] - [What will be done]
- **Complete:** [Target date]

### Success Criteria
- [ ] [Criterion 1 - measurable outcome]
- [ ] [Criterion 2 - validation method]
- [ ] [Criterion 3 - acceptance threshold]

## Related Decisions

- **Supersedes:** ADR-XXX [if this replaces a previous decision]
- **Superseded by:** ADR-YYY [if this decision is later replaced]
- **Related to:** ADR-ZZZ [related architectural decisions]
- **Requirements:** `agent_docs/requirements/[filename].md`
- **Implementations:** `agent_docs/implementations/[domain]/[feature].md`

## References

- [Link to technical documentation, research papers, or articles]
- [Link to prototype, proof of concept, or benchmark results]
- [Link to vendor documentation or community resources]
- [Link to internal discussions, RFC, or design docs]

## Notes

[Any additional context, caveats, or future considerations that don't fit elsewhere but are important for understanding this decision]
