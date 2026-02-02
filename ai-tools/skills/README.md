# Claude Amplify Skills

Reusable workflow capabilities that any agent can invoke to perform specialized tasks.

## What Are Skills?

**Skills** are self-contained workflow modules that encapsulate best practices, templates, and step-by-step processes for common development tasks. Unlike commands (which orchestrate work) or agents (which have roles), skills are **capabilities that any agent can use**.

### Skills vs. Commands vs. Agents

| Concept | Purpose | Invoked By | Example |
|---------|---------|------------|---------|
| **Commands** | Orchestrate work and manage workflow | Humans, Agents | `/start`, `/execute-work` |
| **Agents** | Perform roles with responsibilities | Humans (via @mention) | `@frontend-engineer`, `@tech-lead` |
| **Skills** | Provide reusable capabilities | Agents (via Skill tool) | `code-reviewer`, `pr-creator` |

**Key Insight:** Skills are to agents what libraries are to code—reusable, tested, composable capabilities that ensure consistency.

---

## Available Skills

### 1. **code-reviewer**
**Purpose:** Comprehensive code review following team standards

**When to use:**
- Self-reviewing your own implementation
- Reviewing another agent's code
- Validating quality gates before PR creation

**Key capabilities:**
- Loads team-specific review standards
- Comprehensive checklist (code quality, security, performance, etc.)
- Categorizes issues (Critical/Important/Suggestions)
- Provides actionable feedback with code examples

**Example invocation:**
```markdown
I need to review my auth implementation before handoff.

[Agent uses Skill tool with: code-reviewer]

Context: Review src/auth/ directory
Focus: Security and error handling
```

---

### 2. **pr-creator**
**Purpose:** Create professional, comprehensive pull requests

**When to use:**
- After code review approval
- Ready to submit work for human review
- Need to create draft PR for collaboration

**Key capabilities:**
- Analyzes git history and changes
- Generates PR description from template
- Recommends reviewers based on CODEOWNERS
- Suggests appropriate labels
- Creates PR via GitHub CLI

**Example invocation:**
```markdown
Code review passed, ready to create PR.

[Agent uses Skill tool with: pr-creator]

Context: feature/user-auth branch → main
Type: Feature (authentication system)
```

---

### 3. **test-engineer**
**Purpose:** Complete testing lifecycle (plan → create → run → cleanup)

**When to use:**
- Creating test plans for new features
- Generating test code from specifications
- Running test suites and analyzing results
- Removing obsolete tests

**Key capabilities:**
- **4 operations:** Plan, Create, Run, Remove
- Domain-specific testing (Backend API, Frontend E2E, Firmware HIL)
- Test coverage validation
- Safety checks for test removal

**Example invocation:**
```markdown
Need comprehensive test plan for user authentication.

[Agent uses Skill tool with: test-engineer]

Operation: Create test plan
Scope: Backend API + Frontend UI
Features: Login, signup, password reset
```

---

### 4. **documentation-writer**
**Purpose:** Create structured documentation (requirements, implementations, ADRs)

**When to use:**
- Documenting product requirements
- Recording implementation details
- Capturing architectural decisions

**Key capabilities:**
- **3 operations:** Requirements, Implementation Docs, ADRs
- Ensures proper source context (project/request)
- Templates for all documentation types
- Links to related artifacts

**Example invocation:**
```markdown
Need to document the caching implementation.

[Agent uses Skill tool with: documentation-writer]

Type: Implementation documentation
Feature: Redis caching layer
Location: implementations/backend/caching-strategy.md
```

---

### 5. **inception-facilitator**
**Purpose:** Multi-phase discovery for greenfield products

**When to use:**
- Starting completely new products
- Need comprehensive domain research
- Validating product-market fit
- Choosing tech stack

**Key capabilities:**
- **4-phase process:** Idea Exploration → Technical Feasibility → Team Synthesis → Foundation Setup
- Extensive domain research (industry, competitors, users)
- Tech stack evaluation with all engineers
- Pre-populates all agent context files
- User approval gates

**Example invocation:**
```markdown
[Typically invoked via /start command]

Starting a new SaaS project for construction management.

[Command invokes skill with: inception-facilitator]

Context: Greenfield product, B2B SaaS
Domain: Construction project management
```

---

### 6. **design-reviewer**
**Purpose:** Review technical designs for architectural alignment

**When to use:**
- Validating technical design docs
- Ensuring architectural alignment
- Before implementation begins

**Key capabilities:**
- Comprehensive design checklist
- Reviews against requirements and architecture
- Security, performance, testing considerations
- Clear approve/conditions/reject decision

**Example invocation:**
```markdown
Need design review before implementation.

[Agent uses Skill tool with: design-reviewer]

Design: designs/api-gateway/technical-design.md
Scope: API Gateway architecture
Focus: Security and scalability
```

---

### 7. **work-triage**
**Purpose:** Analyze and route incoming work requests

**When to use:**
- New bug reports
- Feature requests
- Tech debt items
- Unclear requests needing classification

**Key capabilities:**
- Priority matrix (urgency × impact → P0-P3)
- Agent routing decision tree
- Work item creation with context
- Multi-agent coordination

**Example invocation:**
```markdown
Triage this request: "Users can't log in with SSO"

[Agent uses Skill tool with: work-triage]

Request type: Bug report
Reporter: Customer support
```

---

### 8. **quality-gate-checker**
**Purpose:** Validate readiness for handoffs and deployment

**When to use:**
- Before handing off to QA
- Before creating PR
- Before marking work complete
- Pre-deployment validation

**Key capabilities:**
- **7 quality gates:** Implementation, Code Quality, Test Coverage, Documentation, PR Readiness, Handoff Readiness, Deployment Readiness
- Domain-specific standards
- Pass/fail with specific remediation steps
- Integrates with other skills

**Example invocation:**
```markdown
Validate readiness for QA handoff.

[Agent uses Skill tool with: quality-gate-checker]

Gate: Handoff Readiness
Scope: User authentication feature
Target: @qa-backend
```

---

### 9. **nexar-platform-architect**
**Purpose:** Architecture guidance for Nexar Platform deployments

**When to use:**
- Planning new Nexar Platform deployments
- Designing full-stack architecture for corp apps
- Deciding which capabilities to enable
- Migrating existing apps to Nexar Platform
- Configuring nexar.yaml for complex deployments

**Key capabilities:**
- Fetches latest docs from corp-load-balancer repo
- Falls back to embedded context if unavailable
- Provides nexar.yaml templates for common patterns
- Guides capability selection with decision tree
- Includes migration checklists

**Example invocation:**
```markdown
I need to deploy an AI-powered internal tool on Nexar Platform.

[Agent uses Skill tool with: nexar-platform-architect]

Context: Full-stack app with Vertex AI, Cloud SQL, file uploads
```

---

## How to Invoke Skills

### For Agents

Skills are invoked using the **Skill tool** available to all agents:

```markdown
# Step 1: Determine which skill is needed
# Example: After completing implementation, need code review

# Step 2: Invoke the skill via Skill tool
[Use Skill tool with skill name: "code-reviewer"]

# Step 3: Provide context
Context: Review src/features/auth/
Focus: Security and error handling
Scope: Uncommitted changes
```

### Skill Composition

Skills can invoke other skills to build complex workflows:

**Example: PR Creation Workflow**
```markdown
1. @backend-engineer completes auth API implementation

2. @backend-engineer invokes: code-reviewer
   → Reviews own code
   → Identifies 2 suggestions (non-blocking)

3. @backend-engineer invokes: quality-gate-checker
   → Validates PR readiness
   → All gates pass ✅

4. @backend-engineer invokes: pr-creator
   → Creates comprehensive PR
   → PR #123 created successfully

5. Human reviews PR #123 on GitHub
```

---

## Skill Development Principles

When creating or modifying skills, follow these principles:

### 1. **Agent-Agnostic**
Skills should not assume WHO is invoking them. Write workflows that work for any agent.

❌ **Bad:** "You are the @code-reviewer agent"
✅ **Good:** "This skill performs code reviews"

### 2. **Self-Contained**
Skills should include all necessary context, checklists, and templates.

❌ **Bad:** "See external documentation for checklist"
✅ **Good:** Embed complete checklist in the skill

### 3. **Comprehensive**
Include examples, best practices, and error handling.

❌ **Bad:** Just list steps without context
✅ **Good:** Explain WHY each step matters and provide examples

### 4. **Composable**
Skills can invoke other skills to build complex workflows.

❌ **Bad:** Duplicate workflows across skills
✅ **Good:** Have one skill invoke another when needed

### 5. **Consistent Format**
Follow the established skill structure:
- When to Use
- How to Invoke
- What It Does
- Workflow Steps
- Output Format
- Best Practices
- Context Sources
- Example Usage
- Integration with Workflow

---

## Best Practices for Using Skills

### 1. **Choose the Right Skill**
Match the skill to your need:
- Need code review? → `code-reviewer`
- Need PR? → `pr-creator` (after code review)
- Need tests? → `test-engineer`
- Need docs? → `documentation-writer`

### 2. **Provide Context**
Skills work best with clear context:
- What to review/test/document
- Specific focus areas
- Domain or scope

### 3. **Follow Skill Outputs**
Skills provide structured outputs—use them:
- Code review → Fix critical issues before PR
- Quality gate → Address blockers before handoff
- Test plan → Follow test strategy recommendations

### 4. **Compose Skills**
Build workflows by chaining skills:
```
Implementation Complete
  ↓
Invoke: code-reviewer
  ↓
Invoke: quality-gate-checker (PR readiness)
  ↓
Invoke: pr-creator
  ↓
PR submitted for human review
```

### 5. **Update Skills, Not Agents**
When workflow changes:
- ❌ Don't update each agent's instructions
- ✅ Update the skill once—all agents benefit

---

## Skill File Structure

Each skill follows Claude's official format:

```
templates/skills/
├── skill-name/
│   ├── SKILL.md           # Core workflow (300-500 lines)
│   ├── REFERENCE.md       # Detailed checklists (optional)
│   ├── EXAMPLES.md        # Usage examples (optional)
│   └── TEMPLATES/         # Template files (optional)
```

**SKILL.md Format:**
```yaml
---
name: skill-name
description: Third-person description with trigger terms (max 1024 chars)
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Core Workflow

[Concise step-by-step workflow]

## Templates

[Exact templates for outputs]

## Validation Checklist

- [ ] Item 1
- [ ] Item 2

## Context Files

[References to supporting files]
```

## Extending the Skills System

Want to add a new skill?

### 1. **Identify the Need**
- Is there a workflow that multiple agents perform?
- Is there duplication across agent definitions?
- Would this benefit from standardization?

### 2. **Create the Skill Directory**
```bash
mkdir -p templates/skills/new-skill
```

### 3. **Create SKILL.md**
Follow the official format:
- YAML frontmatter with name, description, allowed-tools
- Core workflow (300-500 lines max)
- Actionable steps, not explanations
- Copyable templates
- References to REFERENCE.md if needed

### 4. **Apply Progressive Disclosure**
If skill exceeds 500 lines:
- Keep core workflow in SKILL.md
- Move detailed checklists to REFERENCE.md
- Move examples to EXAMPLES.md
- Move templates to TEMPLATES/ folder

### 5. **Test with Multiple Agents**
Ensure the skill works when invoked by different agents:
- @frontend-engineer
- @backend-engineer
- @tech-lead

---

## Support

For questions or issues with skills:
1. Check the skill's README section
2. Review example usage in the skill file
3. Consult `/templates/ARCHITECTURE.md` for design philosophy
4. Report issues at: https://github.com/getnexar/claude-aiteam/issues

---

## More Information

- **Commands:** See `ai-tools/commands/README.md` for orchestration commands
- **GitHub:** https://github.com/getnexar/amplify
