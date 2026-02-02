# Using Amplify with Different AI Tools

This guide explains how to use the Claude Amplify with different AI coding assistants. While the framework was initially designed for Claude Code, it's fundamentally AI-agnostic and can be adapted to work with any AI tool.

## Table of Contents
- [Claude Code](#claude-code) (Native Support)
- [Cursor](#cursor) (Full Support)
- [Windsurf](#windsurf) (Full Support)
- [Contributing Support for New Tools](#contributing-support-for-new-ai-tools)

---

## Claude Code

**Status:** ✅ Native Support

Claude Code is the primary tool for which this framework was designed. Installation and usage are fully automated.

### Installation

```bash
npm install git+https://github.com/getnexar/amplify.git
```

During installation, you'll be prompted to select which agents to install based on your project type.

### Usage

Agents are invoked using the `@agent-name` syntax:

```
@product-manager, create a PRD for user authentication

@tech-lead, review this architecture design

@frontend-engineer, implement the login UI
@backend-engineer, implement the login API
@database-engineer, create the user schema
```

### Commands

Slash commands provide structured workflows:

```
/start          # Start new strategic project
/start          # Triage bug or improvement
/start-work             # Begin work on project/request
/code-review            # Review code changes
/create-pr              # Create pull request
/status          # Check Amplify configuration
```

### Configuration

- Agents: `.claude/agents/*.md`
- Commands: `.claude/commands/*.md`
- Contexts: `.claude/agent-context/*.md`
- Workflows: `.claude/workflows/*.md`

---

## Cursor

**Status:** ✅ Full Support

Cursor can use the Amplify through `.cursorrules` configuration.

### Installation

1. Install the framework:
```bash
npm install git+https://github.com/getnexar/amplify.git
```

2. Select agents during installation (interactive prompt)

3. Generate Cursor configuration:
```bash
# The framework provides a Cursor rules generator
node node_modules/@getnexar/amplify/scripts/generators/generate-cursor-rules.js
```

This creates `.cursorrules` in your project root.

### Manual Setup (Alternative)

If you prefer manual setup, create `.cursorrules` in your project root:

```markdown
# Amplify for Cursor

You are part of an AI team with specialized roles. Based on the user's request, adopt the appropriate role and follow its guidelines.

## Available Roles

### @product-manager
**Role:** Product Manager
**When to use:** Product strategy, PRD creation, requirements definition

**Responsibilities:**
- Challenge assumptions and validate product direction
- Lead discovery with structured questioning
- Create comprehensive PRDs
- Define user stories and acceptance criteria
- Prioritize features

**Context:** Read `.claude/agent-context/product-context.md` and `agent_docs/project-overview.md`

**Output:** PRDs in `agent_docs/projects/[name]/prd.md`, requirements in `agent_docs/requirements/`

---

### @tech-lead
**Role:** Technical Lead
**When to use:** Architecture decisions, system design, technical feasibility

**Responsibilities:**
- Make architectural decisions
- Create ADRs
- Assess technical feasibility
- Review technical designs
- Ensure code quality

**Context:** Read `.claude/agent-context/architecture-context.md` and `agent_docs/technical-setup.md`

**Output:** ADRs in `agent_docs/architecture/decisions/`, technical assessments

---

### @frontend-engineer
**Role:** Frontend Engineer
**When to use:** UI/UX implementation, client-side logic

**Responsibilities:**
- Implement user interfaces
- Build client-side logic
- Integrate with APIs
- Ensure responsive design
- Write frontend tests

**Context:** Read architecture context and project requirements

**Output:** UI components, frontend tests, docs in `agent_docs/implementations/frontend/`

---

### @backend-engineer
**Role:** Backend Engineer
**When to use:** API development, business logic, server-side

**Responsibilities:**
- Develop REST/GraphQL APIs
- Implement business logic
- Handle authentication/authorization
- Integrate with databases and services
- Write backend tests

**Context:** Read architecture context and technical setup

**Output:** API endpoints, business logic, backend tests, docs in `agent_docs/implementations/backend/`

---

### @database-engineer
**Role:** Database Engineer
**When to use:** Data modeling, query optimization, migrations

**Responsibilities:**
- Design database schemas
- Write efficient queries
- Create and manage migrations
- Optimize performance
- Ensure data integrity

**Context:** Read architecture context and data requirements

**Output:** Schemas, migrations, docs in `agent_docs/implementations/database/`

---

### @ai-engineer
**Role:** AI/ML Engineer
**When to use:** AI/ML development, LLM integration, RAG systems

**Responsibilities:**
- Design and implement AI features
- Integrate LLMs
- Build RAG systems
- Create prompt templates
- Implement AI evaluation

**Context:** Read `.claude/agent-context/ai-context.md`

**Output:** AI implementations, prompts, evaluation harnesses, docs in `agent_docs/implementations/ai/`

---

### @qa-engineer
**Role:** QA Engineer
**When to use:** Test strategy, quality assurance, testing

**Responsibilities:**
- Create test plans
- Write tests (unit, integration, e2e)
- Ensure >80% test coverage
- Verify acceptance criteria
- Report quality metrics

**Context:** Read requirements and technical setup

**Output:** Tests, test plans in `agent_docs/testing/`

---

### @code-reviewer
**Role:** Code Reviewer
**When to use:** Code review, quality checks

**Responsibilities:**
- Review code for quality, security, performance
- Check adherence to standards
- Verify test coverage
- Provide constructive feedback

**Context:** Read `.claude/workflows/code-review-template.md` (if exists), coding standards

**Output:** Review comments, approval recommendation

---

### @pr-creator
**Role:** PR Creator
**When to use:** Creating pull requests

**Responsibilities:**
- Analyze code changes
- Generate PR descriptions
- Follow PR template
- Recommend reviewers
- Suggest labels

**Context:** Read `.claude/workflows/pr-template.md` (if exists), git history

**Output:** Complete PR content (title, description, checklist)

---

## Usage Instructions

When a user addresses you with @role-name, immediately adopt that role and follow its guidelines. Always:

1. Read relevant context files first
2. Follow the role's responsibilities
3. Output to the specified locations
4. Use the project's coding standards
5. Reference domain knowledge from `.claude/agent-context/domain-knowledge.md`

## Collaboration Pattern

For complex tasks involving multiple roles:
1. User specifies which roles are needed
2. Each role performs its responsibilities
3. Roles hand off work to each other as needed
4. Final output follows all quality standards
```

### Usage in Cursor

Invoke agents by mentioning them in your requests:

```
@product-manager, create a PRD for user authentication

@tech-lead, review this architecture

@frontend-engineer and @backend-engineer, implement the login feature

@code-reviewer, review my changes
```

### Tips for Cursor

- Use the chat interface for multi-turn conversations
- Mention multiple agents for parallel work
- Reference files explicitly when needed
- Use Cursor's composer for complex, multi-file changes

---

## Windsurf

**Status:** ✅ Full Support

Windsurf can use the Amplify through project-level instructions.

### Installation

1. Install the framework:
```bash
npm install git+https://github.com/getnexar/amplify.git
```

2. Select agents during installation

3. Generate Windsurf configuration:
```bash
# The framework provides a Windsurf rules generator
node node_modules/@getnexar/amplify/scripts/generators/generate-windsurf-rules.js
```

This creates `.windsurf/rules.md` in your project root.

### Manual Setup (Alternative)

Create `.windsurf/rules.md` in your project root with agent role definitions (similar structure to Cursor's `.cursorrules`).

```markdown
# Amplify for Windsurf

You are part of an AI development team with specialized roles. Adopt the appropriate role based on the user's request.

[Include similar role definitions as Cursor setup above]
```

### Usage in Windsurf

Invoke agents through natural language:

```
Acting as product manager, create a PRD for authentication

As the tech lead, review this architecture

As frontend engineer and backend engineer, implement login
```

### Tips for Windsurf

- Use Windsurf's cascade feature for multi-agent workflows
- Leverage Windsurf's context awareness
- Reference the Memory Bank explicitly when needed

---

## Other AI Tools

The framework can work with any AI coding assistant that supports:
1. Reading project files
2. Custom instructions/rules
3. Multi-turn conversations

### General Adaptation Steps

1. **Install Framework:**
   ```bash
   npm install git+https://github.com/getnexar/amplify.git
   ```

2. **Understand Your Tool's Configuration:**
   - Where does it read custom instructions? (`.cursorrules`, system prompt, etc.)
   - How does it handle role-playing or persona switching?
   - What file access does it have?

3. **Create Agent Definitions:**
   - Extract agent definitions from `.claude/agents/*.md`
   - Adapt to your tool's format
   - Include role, responsibilities, context files, and output locations

4. **Set Up Context Files:**
   - Ensure your tool can read `.claude/agent-context/*.md`
   - Point agents to relevant Memory Bank files

5. **Test Agent Invocation:**
   - Test how to invoke different agents
   - Verify agents can read context files
   - Confirm agents output to correct locations

---

## Contributing Support for New AI Tools

We welcome contributions to support additional AI coding tools!

### How to Contribute

1. **Test the Framework:**
   - Install and use the framework with your tool
   - Document what works and what doesn't
   - Identify tool-specific adaptations needed

2. **Create Configuration Templates:**
   - Create configuration file templates for your tool
   - Add generator script in `scripts/generate-[tool]-rules.js`
   - Update installation instructions

3. **Document Usage:**
   - Add a section to this file
   - Include installation steps
   - Provide usage examples
   - Share tips and best practices

4. **Submit Pull Request:**
   ```bash
   # Fork the repository
   git clone https://github.com/your-username/amplify.git
   cd amplify
   git checkout -b add-[tool]-support

   # Make your changes
   # - Add documentation
   # - Add generator script
   # - Add templates

   git add .
   git commit -m "Add support for [Tool Name]"
   git push origin add-[tool]-support

   # Create PR on GitHub
   ```

### What We Need

For each new tool, please provide:
- ✅ Configuration file format and location
- ✅ Example configuration with all agents
- ✅ Generator script (Node.js)
- ✅ Installation instructions
- ✅ Usage examples
- ✅ Limitations or known issues
- ✅ Tips for best results

### Template for New Tool Sections

````markdown
## [Tool Name]

**Status:** 🚧 Community Contributed

[Brief description of the tool]

### Installation

1. Install framework:
```bash
npm install git+https://github.com/getnexar/amplify.git
```

2. Generate [tool] configuration:
```bash
[command to generate config]
```

### Configuration

[Where config files are located and what they contain]

### Usage

[How to invoke agents in this tool]

```
[Example invocations]
```

### Tips

- [Tip 1]
- [Tip 2]

### Limitations

- [Known limitation 1]
- [Known limitation 2]

### Contributed By

[@username](https://github.com/username) - [Date]
````

---

## Feature Parity Matrix

| Feature | Claude Code | Cursor | Windsurf | Other Tools |
|---------|-------------|---------|----------|-------------|
| Agent Invocation | ✅ @mention | ✅ @mention | ✅ Natural lang | Varies |
| Slash Commands | ✅ Native | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| Auto Context | ✅ Yes | ⚠️ Partial | ⚠️ Partial | ❌ No |
| File Reading | ✅ Full | ✅ Full | ✅ Full | Varies |
| File Writing | ✅ Full | ✅ Full | ✅ Full | Varies |
| Memory Bank | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Workflow Templates | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

✅ Full Support | ⚠️ Partial Support | ❌ Not Available

---

## Best Practices (All Tools)

### 1. Always Populate Context Files
Before using any agent, ensure these files are filled out:
- `.claude/agent-context/product-context.md`
- `.claude/agent-context/architecture-context.md`
- `.claude/agent-context/domain-knowledge.md` (MOST CRITICAL)
- `.claude/agent-context/workflow-context.md`

### 2. Use Parallel Agent Execution
When possible, engage multiple agents simultaneously:
```
@frontend-engineer, build the UI
@backend-engineer, build the API
@database-engineer, create the schema
```

All three work in parallel = 3x faster!

### 3. Reference Context Explicitly
If your tool doesn't auto-load context:
```
@product-manager, read .claude/agent-context/product-context.md
and agent_docs/project-overview.md, then create a PRD for authentication
```

### 4. Use the Memory Bank (Index-Based Loading)
All agents use the Memory Bank for project context, but should **never eagerly load all files**.

**Discovery process:**
1. Check `agent_docs/index.md` first - provides file summaries and loading guidance
2. Load ONLY files directly relevant to the current task
3. Never bulk load directories like `agent_docs/implementations/` or `agent_docs/debt/`

**Common files (load selectively):**
- `agent_docs/project-overview.md` - Product vision (when planning features)
- `agent_docs/technical-setup.md` - Tech stack (before implementation)
- `agent_docs/decisions/` - Decision history (when making similar decisions)
- `agent_docs/implementations/` - Implementation patterns (when implementing features)

### 5. Customize Workflows
Adapt workflows to your team:
- Edit `.claude/workflows/code-review-template.md`
- Edit `.claude/workflows/pr-template.md`
- Create custom workflow templates

---

## Getting Help

- **Documentation:** [README.md](README.md)
- **Agent Reference:** [AGENTS.md](AGENTS.md)
- **Issues:** [GitHub Issues](https://github.com/getnexar/amplify/issues)
- **Discussions:** [GitHub Discussions](https://github.com/getnexar/amplify/discussions)

---

## More Information

- [GitHub Repository](https://github.com/getnexar/amplify)
- [Installation Guide](../docs/INSTALLATION.md)
- [Changelog](../CHANGELOG.md)
