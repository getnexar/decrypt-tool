# Shared Agent Protocol

Common protocols for all Amplify agents. Referenced by agent definitions.

---

## Context Loading [CRITICAL]

**DO NOT eagerly load Memory Bank files.**

1. Check `agent_docs/index.md` first
2. Identify max 3 files relevant to current task
3. Load ONLY those files
4. Never bulk-load directories

---

## Beads Work Tracking

All work tracked in Beads (`.beads/`).

**Starting work:**
```bash
bd show <id> --json           # View assignment
bd update <id> --status in_progress --json
```

**Completing work:**
```bash
bd close <id> --reason "Brief description" --json
```

Always close items when done - failure blocks dependent work.

**Example workflow:**
```bash
bd show 123 --json                              # View assignment
bd update 123 --status in_progress --json       # Start work
# ... implementation ...
bd close 123 --reason "Implemented auth API" --json  # Complete
```

---

## Output Format [MANDATORY]

When returning results:
```
STATUS: completed | blocked | needs-input
RESULT: Max 3 bullet points
FILES: Changed file paths only
EVIDENCE: Max 10 lines if code needed
```

**NO prose. NO task repetition. NO verbose explanations.**

---

## Documentation Protocol

### What to Document
- Non-obvious implementation decisions
- Architecture choices and trade-offs
- Technical debt (with impact + proposed solution)
- Progress updates in work items

### Where to Document
- Decisions: `agent_docs/decisions/<domain>-<name>.md`
- Implementations: `agent_docs/implementations/<domain>/<feature>.md`
- Debt: `agent_docs/debt/<domain>-debt-<id>-<name>.md`
- Progress: `bd update <id> -d "notes" --json`

### When to Document
- During: Key decisions as you make them
- After: Use `documentation-writer` skill for comprehensive docs
- Debt: Document immediately when encountered

---

## Quality Gates

**CRITICAL: Read `CONTRIBUTING.md` before writing any code.**

This is NON-NEGOTIABLE. The CONTRIBUTING.md file contains:
- Coding standards and conventions
- Code review requirements
- Commit message format
- Agent-specific engineering guidelines

Before marking work complete:
- [ ] Read and followed `CONTRIBUTING.md` standards
- [ ] Tests written with adequate coverage
- [ ] No security vulnerabilities (check: hardcoded secrets, SQL injection, XSS, input validation)
- [ ] Error handling comprehensive
- [ ] Documentation updated if needed
- [ ] Work item closed via `bd close`

---

## Tool Usage Discipline

**Minimize context consumption:**
- File reads: Specific line ranges, not full files
- Grep: Use `head_limit` parameter (default: 20)
- Bash: Pipe to `head`/`tail` for large output
- Prefer `Glob` (paths only) over `Grep` content when locating files

---

## Collaboration Patterns

**Handoff outputs:**
- Implementation notes in `agent_docs/implementations/`
- Clear commit messages following repo conventions
- PR descriptions linking to requirements
- Links to external tools in doc headers

**Boundaries:**
- Stay in your domain - don't make decisions for other agents
- Escalate cross-cutting concerns to @tech-lead
- Report blockers to @work-orchestrator
