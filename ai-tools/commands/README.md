# Agent Swarm Commands

Slash commands for the autonomous agent AI team. These commands can be used by both humans and agents via the `SlashCommand` tool.

## Commands vs Skills

**Commands** (this folder) handle orchestration and work tracking.
**Skills** (`ai-tools/skills/`) provide reusable workflow capabilities.

For workflows like code review, PR creation, testing, and documentation:
- See `ai-tools/skills/README.md`
- Skills are invoked by agents via the Skill tool
- Any agent can use any skill

Commands remain focused on:
- Project/request orchestration
- Work item tracking
- AI team coordination

---

## Quick Start

1. **Copy commands to your project:**
   ```bash
   cp -r templates/commands/ .claude/commands/
   ```

2. **Setup your AI team:**
   ```
   /setup-AI team
   ```

3. **Verify configuration:**
   ```
   /AI team-status
   ```

4. **Start working:**
   ```
   /create-requirements  # Create a feature requirement
   /create-work-item     # Create a work item to track it
   ```

## Available Commands (13 Total)

### 🎯 Setup & Configuration
| Command | Purpose |
|---------|---------|
| `/start` | Comprehensive discovery for greenfield products |
| `/setup-amplify` | Initialize Amplify for existing projects |
| `/status` | Verify configuration and health |
| `/sync-handbook` | Sync documentation to nexar-handbook for cross-repo awareness |

### 🚀 Strategic Planning & Orchestration
| Command | Purpose | Triggers |
|---------|---------|----------|
| `/start` | Product-led feature discovery (PM) | @product-manager |
| `/start` | Tech-led analysis & planning (TL) | @tech-lead |
| `/plan-execution` | Assess external PRD/design, create work breakdown | @tech-lead |
| `/execute-work` | Automated parallel dispatch of work items | @work-orchestrator |

### 📝 Work Item Management
| Command | Purpose |
|---------|---------|
| `/create-work-item` | Create standardized work item |
| `/start-work-item` | Begin assigned work item |
| `/update-work-item` | Update status and progress |
| `/handoff-work-item` | Transfer ownership between agents |
| `/close-work-item` | Mark work complete |

## Command Usage Patterns

### For Humans

**Starting a new product feature (with external PRD/design):**
```
1. Provide externally-created PRD and system design documents
2. /plan-execution project:[name] (Tech Lead assesses against codebase & creates work breakdown)
3. /execute-work project:[name] (automated parallel dispatch to engineers)
```

**Starting a new product feature (create PRD internally):**
```
1. /start (PM-led product discovery, creates PRD)
2. Work with designers/architects to create system design externally
3. /plan-execution project:[name] (Tech Lead assesses & creates work breakdown)
4. /execute-work project:[name] (automated parallel dispatch to engineers)
```

**Handling a technical issue (bug, refactor, tech debt):**
```
1. /start (Tech Lead-led technical analysis, creates tech spec)
2. /execute-work request:[id] (automated dispatch to engineers)
```

**For greenfield projects:**
```
1. /start (comprehensive product discovery, creates PRD and domain knowledge)
2. Create system design externally (or have architects/designers create it)
3. /plan-execution project:[name] (Tech Lead assesses & creates work breakdown)
4. /execute-work project:[name] (automated parallel dispatch)
```

**Checking system health:**
```
1. /status (verify configuration)
```

### For Agents

**@product-manager workflow:**
```
1. Receive /start request
2. Conduct product discovery (use inception-facilitator skill if needed)
3. Create comprehensive PRD with user stories
4. May invoke /plan-execution to hand off to @tech-lead
```

**@tech-lead workflow:**
```
1. Receive /start for technical issues OR
2. Receive /plan-execution after PRD is ready
3. Conduct technical analysis and system design
4. Create technical spec or system design document
5. Create work breakdown with dependencies
6. Signal @work-orchestrator for work item creation
```

**@work-orchestrator workflow:**
```
1. Receive work breakdown from @tech-lead
2. /create-work-item (break down into granular tasks)
3. Analyze dependencies and sequencing
4. Coordinate with /execute-work for parallel agent dispatch
```

**Engineer workflow:**
```
1. /start-work-item [id] (begin assigned work)
2. Implement feature (use skills: code-reviewer, test-engineer, etc.)
3. /update-work-item (report progress)
4. /handoff-work-item to=@qa-[domain] (handoff when complete)
```

**@qa-[domain] workflow:**
```
1. Receive handoff via /handoff-work-item
2. Execute tests (use skill: test-engineer)
3. /update-work-item (report results)
4. /close-work-item (if all acceptance criteria met)
```

## Agent Tool Access

All agents have access to the `SlashCommand` tool, allowing them to invoke these commands programmatically.

### Example: Agent invoking a command
```markdown
I'll create a work item for this using the SlashCommand tool:

SlashCommand: /create-work-item
Type: feature
Title: Add user authentication
Assigned: @backend-engineer
Priority: high
```

## File Structure Created by Commands

```
.claude/
├── agents/                    # Agent definitions
└── agent-context/             # Agent-specific contexts
    ├── product-context.md
    ├── workflow-context.md
    ├── architecture-context.md
    ├── frontend-context.md
    ├── backend-context.md
    ├── database-context.md
    └── qa-context.md

agent_docs/                    # Memory Bank & Agent Artifacts
├── project-overview.md
├── technical-setup.md
├── current-work.md
├── decisions.md
├── implementations.md
├── debt-summary.md
├── decisions/                 # ADRs index
├── debt/                      # Technical debt items
├── requirements/              # Product requirements
├── designs/                   # Technical designs
├── architecture/
│   └── decisions/             # Architecture Decision Records (ADRs)
├── implementations/           # Implementation docs
│   ├── frontend/
│   ├── backend/
│   └── database/
├── testing/                   # Test plans and reports
│   ├── plans/
│   └── reports/
├── sprints/                   # Sprint artifacts
├── backlog/                   # Product backlog
└── handoffs/                  # Handoff docs

.beads/                        # Beads Work Tracking (Git-synced)
├── beads.jsonl                # Work items (Git-tracked)
└── beads.db                   # SQLite cache (gitignored)

# Work items are managed via Beads CLI:
# bd create, bd list, bd update, bd close, bd ready, bd dep
```

## Best Practices

### For Command Authors
1. **Keep commands focused:** One clear purpose per command
2. **Include templates:** Provide starting point for docs
3. **Link to agents:** Reference which agents should use the command
4. **Document output:** Specify what files/artifacts are created

### For Command Users
1. **Read the command doc first:** Understand purpose and usage
2. **Follow the template:** Don't skip sections
3. **Link everything:** Connect requirements, designs, implementations
4. **Update regularly:** Keep work items and docs current

### For Agents
1. **Use commands for handoffs:** Formalize agent-to-agent transfers
2. **Document everything:** Use create-* commands liberally
3. **Check quality gates:** Use validation commands before handoff
4. **Stay in your lane:** Use /triage when work is outside your domain

## Customizing Commands

You can customize commands for your project:

1. **Edit templates:** Modify document templates to match your standards
2. **Add project-specific commands:** Create new commands in `.claude/commands/`
3. **Update workflows:** Adjust command instructions for your SDLC

## Troubleshooting

**Command not found:**
- Ensure commands are in `.claude/commands/`
- Check file has `.md` extension
- Verify file naming (use kebab-case)

**Agent not using command:**
- Check agent's system prompt mentions the command
- Verify agent has SlashCommand tool access
- Ensure command description is clear

**Command output unclear:**
- Review command's Instructions section
- Check template format
- Validate required directory structure exists

## Contributing

To add a new command:

1. Create `new-command.md` in `.claude/commands/`
2. Follow existing command structure:
   - Usage line
   - Purpose line
   - Instructions section
   - Template section (if creates docs)
   - Notes for Agents section
3. Update this README with command listing
4. Test with actual agents

## Support

- **Command issues:** Check `/AI team-status` output
- **Agent issues:** Review agent's context file in `.claude/agent-context/`
- **Setup issues:** Re-run `/setup-AI team`

## More Information

- **Skills:** See `ai-tools/skills/README.md` for reusable workflow capabilities
- **GitHub:** https://github.com/getnexar/amplify
