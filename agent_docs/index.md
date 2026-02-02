# Agent Docs Index

## Quick Navigation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `project-overview.md` | Project summary and status | Starting work, need context |
| `technical-setup.md` | Build commands, deployment | Running or deploying |
| `current-work.md` | Active work items | Checking progress |
| `decisions.md` | Architecture decisions | Making new decisions |

## Project Context

**Name:** Decrypt Tool
**Type:** NAP Web Application
**Status:** Design Complete, Ready for Implementation

## Key Design Decisions

1. **Pure Python/JS** - No native C libraries (NAP deployment constraint)
2. **NumPy optimization** - For XOR decryption performance
3. **Polling for progress** - 2-second intervals (SSE/WebSocket future consideration)

## Directory Structure

```
agent_docs/
├── index.md              # This file
├── project-overview.md   # Project summary
├── technical-setup.md    # Build/deploy info
├── current-work.md       # Active work
├── decisions.md          # ADRs
├── projects/             # Project-level docs
├── requests/             # User requests
├── requirements/         # PRDs and specs
├── designs/              # Technical designs
├── decisions/            # Individual ADRs
├── implementations/      # Implementation docs
├── testing/              # Test plans
├── backlog/              # Future work
└── handoffs/             # Agent handoffs
```

## Related Documentation

- **Design Doc:** `docs/plans/2026-02-02-decrypt-tool-design.md`
- **Domain Knowledge:** `.claude/agent-context/domain-knowledge.md`
- **Repository Patterns:** `.claude/agent-context/repository-patterns.md`
