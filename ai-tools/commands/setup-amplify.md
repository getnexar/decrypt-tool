---
name: setup-amplify
description: Intelligent Amplify setup with repository analysis, pattern injection, and agent optimization
---

# Setup Amplify Command - Intelligent Orchestrator

**Purpose:** AI-powered setup that analyzes your repository, injects patterns, and creates optimized agent configurations.

**Two Paths:**
1. **New/Greenfield Projects**: Use `/start` instead - comprehensive discovery then calls this automatically
2. **Existing Projects**: Run this command - intelligent analysis and optimization

## CRITICAL: This command must ALWAYS be run before using the Amplify

**Check if setup has been run:**
```javascript
const setupComplete = fs.existsSync('.claude/agent-context/repository-patterns.md') &&
                      fs.existsSync('agent_docs/project-overview.md');
```

**If setup hasn't been run and user tries another command, respond with:**
```
⚠️  Amplify Setup Required

The Amplify needs to be set up first. This is a one-time intelligent setup that will:
- Analyze your repository structure and patterns
- Inject repository-specific guidelines into agents
- Generate domain knowledge from your codebase
- Create specialized agents for complex modules
- Optimize your Amplify configuration

Would you like to run setup now? (yes/no):
```

---

## 6-Phase Intelligent Setup Workflow

### Phase 1: Repository Discovery & Analysis

**Step 1: Welcome & Context Gathering**
```markdown
🤖 Amplify Intelligent Setup

Welcome! I'm going to set up an optimized Amplify for your repository.

This will take 3-5 minutes and involves:
1. Deep repository analysis
2. Interactive questions about your needs
3. Pattern extraction and injection
4. Specialized agent recommendations
5. Domain knowledge generation
6. Configuration optimization

Let's get started!
```

**Step 2: Repository Structure Analysis**

Use Read, Glob, and Grep tools extensively to analyze:

```markdown
🔍 Phase 1: Repository Discovery

Analyzing your repository...

[Progress indicators as analysis proceeds]

✓ Repository structure scanned
✓ Package.json analyzed
✓ Technology stack detected
✓ Code patterns identified
✓ Documentation reviewed
✓ Configuration files analyzed
```

**What to analyze:**

1. **Repository Type Detection**
```javascript
// Check for monorepo
const isMonorepo = fs.existsSync('lerna.json') ||
                   fs.existsSync('pnpm-workspace.yaml') ||
                   fs.existsSync('nx.json') ||
                   (packageJson.workspaces);

// Check for microservices
const hasMicroservices = fs.existsSync('docker-compose.yml') &&
                         (check for multiple service directories);

// Identify workspace structure
if (isMonorepo) {
  // Find workspaces: packages/*, apps/*, services/*
}
```

2. **Technology Stack Detection**
```javascript
// Read package.json for all packages
// Detect:
- Frameworks (React, Vue, Angular, Express, NestJS, Django, etc.)
- Build tools (Vite, Webpack, Turborepo, etc.)
- Testing (Jest, Vitest, Cypress, Playwright, etc.)
- Databases (Prisma, TypeORM, Mongoose, etc.)
- AI/ML (LangChain, OpenAI SDK, TensorFlow, etc.)
- Cloud (AWS SDK, Firebase, Supabase, etc.)
```

3. **File Organization Patterns**
```javascript
// Analyze directory structure
// Detect patterns:
- Feature-based (src/features/*)
- Layered (src/controllers/, src/services/, src/repositories/)
- Domain-driven (src/domain/*, src/application/*, src/infrastructure/*)
- Module-based (src/modules/*)

// Identify key directories:
- Source code: src/ or lib/
- Tests: __tests__/, tests/, **/*.test.ts
- Configuration: config/, *.config.js
- Documentation: docs/, *.md files
```

4. **Naming Conventions**
```bash
# Use Grep to detect:
- Component naming (PascalCase, kebab-case)
- File naming patterns (*.service.ts, *.controller.ts, *.test.ts)
- Variable/function naming (camelCase, snake_case)
- Constants naming (UPPER_SNAKE_CASE)
- Test naming patterns
```

5. **Code Standards Detection**
```bash
# Analyze for:
- Error handling patterns (try/catch, error classes)
- Async patterns (async/await vs promises vs callbacks)
- Import styles (absolute vs relative, named vs default)
- Export patterns
- Logging patterns
- Comment styles
```

6. **Testing Patterns**
```bash
# Detect:
- Test frameworks (Jest, Vitest, Mocha, Pytest, etc.)
- Test file patterns (*.test.ts, *.spec.ts, test_*.py)
- Test organization (collocated, separate directories)
- Coverage requirements (.nycrc, jest.config.js)
- Mocking patterns
```

7. **Documentation Analysis**
```bash
# Read existing docs:
- README.md
- CONTRIBUTING.md
- ARCHITECTURE.md
- docs/**/*.md

# Extract:
- Setup instructions
- Architecture decisions
- Coding standards
- Development workflow
- Deployment process
```

**Output from Phase 1:**
```markdown
Repository Analysis Complete!

Type: Monorepo with 4 workspaces
Structure:
  packages/
    ├── api-gateway/ (Express + TypeScript)
    ├── auth-service/ (Node.js + JWT + Redis)
    ├── payment-service/ (Node.js + Stripe)
    └── ui/ (React + TypeScript + Tailwind)

Technologies Detected:
✓ TypeScript (all packages)
✓ Node.js 20.x
✓ React 18
✓ Express
✓ Prisma (PostgreSQL)
✓ Redis (ioredis)
✓ Jest + Supertest
✓ Turborepo (build system)

Patterns Detected:
✓ Layered architecture (controllers, services, repositories)
✓ Feature-based organization in UI
✓ Absolute imports via tsconfig paths
✓ Named exports (no default exports)
✓ Async/await (consistent)
✓ Custom error classes (AppError pattern)
✓ Jest + Supertest for testing
✓ High test coverage (85%+ in all packages)

Documentation Found:
✓ README.md (setup, architecture overview)
✓ docs/API.md (API documentation)
✓ docs/ARCHITECTURE.md (system design)
✓ CONTRIBUTING.md (development guidelines)

Complexity Assessment: High
- 15,000+ lines of code
- 4 distinct services
- Complex authentication flows
- Payment processing (PCI considerations)
- Real-time features (WebSockets in API gateway)
```

### Phase 2: Team Needs Discovery

**Interactive Q&A to understand the team and workflow:**

```markdown
📋 Phase 2: Understanding Your Team & Workflow

Let me ask a few questions to optimize your Amplify configuration.
```

**Question 1: Team Structure**
```
What's your team structure?

1. Solo developer
2. Small team (2-5 developers)
3. Medium team (6-15 developers)
4. Large team (15+ developers)

Select (1-4):
```

**Question 2: Development Focus** (Multi-select)
```
What's your primary development focus? (Enter numbers comma-separated)

1. Full-stack features (frontend + backend + database)
2. API-first development (backend emphasis)
3. Frontend-heavy applications (UI/UX emphasis)
4. Background processing (jobs, queues, events)
5. Real-time features (WebSockets, Server-Sent Events)
6. Mobile applications
7. AI/ML features (LLMs, RAG, embeddings)
8. DevOps/Infrastructure

Enter selections (e.g., 1,2,7):
```

**Question 3: Repository Complexity Areas** (Multi-select)
```
Which areas of your codebase are particularly complex? (Enter numbers comma-separated)

Detected potential complexity areas:
1. Authentication/authorization (packages/auth-service)
2. Payment processing (packages/payment-service)
3. Real-time features (API gateway WebSockets)
4. Database design and queries
5. API design and contracts
6. Frontend state management
7. Testing strategy
8. Deployment and infrastructure

Enter selections or "none":
```

**Question 4: Conventions Documentation**
```
Do you have documented coding conventions or patterns?

1. Yes, well documented (found in docs/)
2. Yes, but scattered/incomplete
3. No, we're establishing them now
4. No, and we need help creating them

Select (1-4):
```

**Question 5: Agent Specialization Interest**
```
Based on your repository, I can create specialized agents for:

High Priority (Recommended):
1. Authentication Service Specialist (packages/auth-service)
2. Payment Service Specialist (packages/payment-service)
3. UI Component Specialist (packages/ui shared library)

Medium Priority:
4. API Gateway Specialist (packages/api-gateway)

Would you like me to generate specialized agents? (yes/no/later):
```

### Phase 3: Specialization Recommendations

**Based on analysis and Q&A, recommend specialized agents:**

```markdown
🤖 Phase 3: Specialized Agent Recommendations

Based on your repository analysis, I recommend creating specialized agents for:

┌─────────────────────────────────────────────────────────────┐
│ HIGH PRIORITY                                                │
└─────────────────────────────────────────────────────────────┘

1. Authentication Service Specialist
   Scope: packages/auth-service/
   Rationale: Complex JWT + OAuth2 + RBAC patterns detected
            Handles sensitive security operations
            Frequent changes expected in auth domain
   Will handle: Auth flows, token management, OAuth providers,
                RBAC, session management
   Base: Backend Engineer

2. Payment Service Specialist
   Scope: packages/payment-service/
   Rationale: Stripe integration with PCI compliance concerns
            Transaction handling requires domain expertise
            Payment logic isolated in dedicated service
   Will handle: Payment processing, refunds, subscriptions,
                webhook handling, PCI compliance
   Base: Backend Engineer

3. UI Component Specialist
   Scope: packages/ui/
   Rationale: Shared component library with Storybook
            Design system consistency critical
            Used across multiple apps
   Will handle: Component development, design system maintenance,
                Storybook stories, accessibility
   Base: Frontend Engineer

┌─────────────────────────────────────────────────────────────┐
│ MEDIUM PRIORITY                                              │
└─────────────────────────────────────────────────────────────┘

4. API Gateway Specialist
   Scope: packages/api-gateway/
   Rationale: Complex routing, rate limiting, WebSocket management
            Entry point for all API traffic
            Real-time feature coordination
   Will handle: Route configuration, middleware, WebSockets,
                rate limiting, request/response transformation
   Base: Backend Engineer

Which agents would you like to create?
- Enter numbers (comma-separated): 1,2,3,4
- Type "high" for high-priority only: 1,2,3
- Type "all" for all recommendations
- Type "none" to skip for now

Selection:
```

### Phase 4: Pattern Injection

**Extract patterns and inject into all agents:**

```markdown
🎯 Phase 4: Injecting Repository Patterns into Agents

Extracting patterns from your codebase...

Analyzing 247 TypeScript files...
✓ File organization patterns
✓ Naming conventions
✓ Code standards
✓ Testing requirements
✓ Documentation standards
✓ Error handling patterns

Creating repository-patterns.md...
```

**Extract and document:**

1. **File Organization**
```markdown
## File Organization Patterns

### Source Code Structure
- Controllers: `src/*/controllers/` - Handle HTTP requests/responses
- Services: `src/*/services/` - Business logic and orchestration
- Repositories: `src/*/repositories/` - Data access layer
- Models: `src/*/models/` - Data models and schemas
- Utils: `src/*/utils/` - Utility functions
- Types: `src/*/types/` - TypeScript type definitions

### Test Structure
- Unit tests: Collocated with source (`*.test.ts` next to `*.ts`)
- Integration tests: `src/**/__tests__/integration/`
- E2E tests: `tests/e2e/`

### Configuration
- Environment-specific: `config/*.ts`
- Shared config: `src/config/index.ts`
```

2. **Naming Conventions**
```markdown
## Naming Conventions

### Files
- Components: PascalCase (`Button.tsx`, `UserProfile.tsx`)
- Services: camelCase with `.service.ts` suffix (`auth.service.ts`)
- Controllers: camelCase with `.controller.ts` suffix
- Utils: camelCase (`formatDate.ts`, `validators.ts`)
- Types: PascalCase with `.types.ts` suffix (`User.types.ts`)
- Tests: Same as source with `.test.ts` suffix

### Code
- Variables/Functions: camelCase (`getUserById`, `isValid`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `API_BASE_URL`)
- Types/Interfaces: PascalCase (`User`, `ApiResponse`)
- Classes: PascalCase (`UserService`, `AuthController`)
```

3. **Code Standards**
```markdown
## Code Standards

### Import/Export
- Use absolute imports via tsconfig paths (`@/services/auth` not `../../services/auth`)
- Prefer named exports over default exports
- Group imports: external → internal → types

### Error Handling
- Use custom AppError class for application errors
- Always use async/await (no .then() chains)
- Catch errors at controller level, propagate with proper status codes
- Log errors with context (request ID, user ID, etc.)

### Async Patterns
- Always use async/await syntax
- Handle promise rejections explicitly
- Use Promise.all() for parallel operations
- Use Promise.allSettled() when some failures are acceptable
```

4. **Testing Requirements**
```markdown
## Testing Standards

### Coverage Requirements
- Minimum 80% coverage per package
- 100% coverage for critical paths (auth, payments, security)

### Test Structure
- Use describe/it blocks with clear descriptions
- Arrange-Act-Assert pattern
- Mock external dependencies (databases, APIs, services)
- Use TestContainers for integration tests requiring real services

### Naming
- Test files: `*.test.ts`
- Test descriptions: "should [expected behavior] when [condition]"
- Mock objects: Prefix with `mock` (`mockUserRepository`)
```

5. **Documentation Standards**
```markdown
## Documentation Requirements

### API Documentation
- All API endpoints documented in OpenAPI 3.0 spec
- Include request/response examples
- Document error responses
- Specify authentication requirements

### Component Documentation
- All UI components have Storybook stories
- Document props with JSDoc comments
- Include usage examples
- Document accessibility considerations

### Code Comments
- JSDoc for public APIs, classes, complex functions
- Inline comments for non-obvious logic only
- No commented-out code in commits
- README.md required per package
```

**Inject patterns into agents:**
```markdown
Injecting patterns into 9 agents...

✓ Backend Engineer
  Added: File organization, naming, async patterns, error handling
  Added: API documentation requirements, testing standards

✓ Frontend Engineer
  Added: Component naming, Storybook requirements
  Added: Accessibility standards, testing patterns

✓ Database Engineer
  Added: Migration patterns, query conventions
  Added: TestContainer requirements for integration tests

✓ QA Backend
  Added: Testing requirements, coverage standards
  Added: TestContainer setup, mocking patterns

✓ QA Frontend
  Added: Component testing patterns, E2E structure
  Added: Accessibility testing requirements

✓ Tech Lead
  Added: Architecture constraints, service boundaries
  Added: ADR requirements, design review standards

✓ Work Orchestrator
  Added: Build requirements, test gates
  Added: Pre-merge checklists

✓ DevOps Engineer
  Added: CI/CD patterns, deployment requirements
  Added: Environment configuration standards

✓ Product Manager
  Added: Feature flagging approach
  Added: A/B testing requirements

Created: .claude/agent-context/repository-patterns.md
```

### Phase 5: Agent Generation

**Generate specialized agents if user requested them:**

```markdown
🏗️ Phase 5: Generating Specialized Agents

Creating specialized agents based on your selections...
```

**For each selected agent:**
```markdown
Generating: Authentication Service Specialist

1. Analyzing packages/auth-service/...
   ✓ JWT token management patterns
   ✓ OAuth2 provider integrations (Google, GitHub)
   ✓ RBAC permission system
   ✓ Session management (Redis)
   ✓ Password hashing (bcrypt)
   ✓ 97 test files (94% coverage)

2. Building agent definition...
   ✓ Core responsibilities tailored to auth domain
   ✓ Quality gates: Security checks, token validation, OAuth flows
   ✓ Context sources: packages/auth-service/docs/
   ✓ Boundaries: Only modifies packages/auth-service/
   ✓ Collaboration: @backend-engineer, @database-engineer, @qa-backend

3. Creating agent file...
   ✓ Template: module-specialist-template.md
   ✓ Variables populated from analysis
   ✓ Security-focused quality gates added
   ✓ OAuth provider patterns documented

✓ Created: .claude/agents/custom-auth-service-specialist.md

[Repeat for other selected agents...]

Summary:
✓ Created 3 specialized agents:
  • Authentication Service Specialist
  • Payment Service Specialist
  • UI Component Specialist

✓ Updated .claude-amplify.json with custom agents
```

### Phase 6: Domain Knowledge & Directory Structure

**Step 1: Generate Domain Knowledge**

```markdown
📚 Phase 6: Bootstrapping Domain Knowledge & Configuration

Generating domain knowledge from repository analysis...
```

**Create `.claude/agent-context/domain-knowledge.md`:**
```markdown
Creating .claude/agent-context/domain-knowledge.md...

Sources:
✓ Repository analysis
✓ Documentation files (README, ARCHITECTURE, etc.)
✓ Code patterns and technologies
✓ Your Q&A responses

Sections generated:
✓ Project Overview - Purpose and business domain
✓ Technical Architecture - System design and constraints
✓ Service Boundaries - Module responsibilities
✓ Key Technologies - Stack and tool choices
✓ Conventions - Coding and testing standards
✓ Integration Points - External systems and APIs
✓ Security Requirements - Auth, compliance, data protection
✓ Performance Targets - Benchmarks and SLAs

Generated 450 lines of domain knowledge.

⚠️  IMPORTANT: Review and refine this file!
   While generated from your codebase, you should:
   - Add business context and goals
   - Add regulatory/compliance requirements
   - Add performance targets and SLAs
   - Add user behavior patterns and expectations
   - Add competitive landscape insights
```

**Step 2: Create Directory Structure**
```markdown
Creating directory structure...

✓ .claude/agent-context/
  ✓ domain-knowledge.md (generated)
  ✓ repository-patterns.md (generated)
  ✓ product-context.md (template)
  ✓ workflow-context.md (template)
  ✓ architecture-context.md (generated from analysis)
  ✓ frontend-context.md (generated from package.json)
  ✓ backend-context.md (generated from package.json)
  ✓ database-context.md (generated from Prisma schema)
  ✓ qa-context.md (generated from test config)

✓ agent_docs/
  ✓ project-overview.md
  ✓ technical-setup.md (generated from package.json)
  ✓ current-work.md
  ✓ decisions.md
  ✓ implementations.md
  ✓ debt-summary.md
  ✓ decisions/
  ✓ debt/
  ✓ projects/
  ✓ requests/
  ✓ requirements/
  ✓ designs/
  ✓ architecture/
  ✓ implementations/
  ✓ testing/
  ✓ backlog/
  ✓ handoffs/

Note: Work items are tracked in Beads (.beads/), not in agent_docs/work-items/
```

**Step 3: Inject Amplify Operating Principles**
```markdown
Configuring Amplify operating principles...

✓ Read templates/agent-context/amplify-operating-principles.md
✓ Read templates/agent-context/amplify-usage.md
✓ Appended to .claude/CLAUDE.md

These principles enforce:
• Agent delegation (you orchestrate, agents implement)
• Unlimited parallelism thinking (agents are infinite resources)
• Quality-first development
• Memory bank hygiene
```

**Step 4: Initialize Beads Work Tracking**
```markdown
Initializing Beads work tracking system...

✓ Verified Beads CLI installed
✓ Initialized .beads/ directory
✓ Created beads.db (SQLite local cache)
✓ Created issues.jsonl (Git-tracked source of truth)
✓ Updated .gitignore to exclude beads.db

Setting up centralized Beads for cross-worktree sync...

✓ Created central location: ~/.amplify/workspaces/{projectHash}/beads/
✓ Moved issues.jsonl to central location
✓ Created symlink: .beads/issues.jsonl -> central location
✓ Created redirect file for bd CLI
✓ All worktrees will share the same Beads database

Centralized Beads provides:
• Cross-worktree visibility (items created in one worktree visible in all)
• Session tracking (items linked to worker sessions)
• Orphan detection (find items stuck in_progress)
• Event history (track all state changes)
• Velocity metrics (items closed per day, avg time in_progress)
• Auto-commit to git (changes synced to repo)

Basic Beads provides:
• Dependency-aware work tracking
• Automatic ready-work detection
• Parallel-safe agent coordination
• Git-synced persistence
```

**Note on Beads:** Beads is automatically used by Work Orchestrator and `/execute-work`
for intelligent work management. Power users can optionally interact with `bd` commands
directly. See `ai-tools/BEADS.md` for documentation.

**Note on Centralized Beads:** Centralized Beads is set up automatically during init.
If you need to migrate existing worktrees or check status, use:
• `npx amplify beads status` - Check centralization status
• `npx amplify beads migrate` - Migrate all worktrees to centralized database
• `npx amplify beads orphans` - Find items stuck in_progress
• `npx amplify beads velocity` - View velocity metrics

**Step 5: Register Plugin Marketplaces**
```markdown
Registering Amplify plugin marketplaces...
```

Run the following commands to ensure all required marketplaces and plugins are installed:

```bash
# Register marketplaces
claude /plugin marketplace add getnexar/claude-agents
claude /plugin marketplace add obra/superpowers-marketplace
claude /plugin marketplace add anthropics/claude-code

# Enable default plugins
claude /plugin add nexar@nexar-claude-agents
claude /plugin add superpowers@superpowers-marketplace
claude /plugin add feature-dev@claude-code-plugins
claude /plugin add frontend-design@claude-code-plugins
claude /plugin add ralph-wiggum@claude-code-plugins
```

```markdown
✓ Registered 3 plugin marketplaces:
  • nexar-claude-agents (getnexar/claude-agents)
  • superpowers-marketplace (obra/superpowers-marketplace)
  • claude-code-plugins (anthropics/claude-code)

✓ Enabled 5 default plugins:
  • nexar@nexar-claude-agents
  • superpowers@superpowers-marketplace
  • feature-dev@claude-code-plugins
  • frontend-design@claude-code-plugins
  • ralph-wiggum@claude-code-plugins
```

**Step 6: Configuration Update**
```markdown
Updating configuration...

✓ Updated .claude-amplify.json with:
  - setupCompleted: true
  - setupDate: 2025-01-12T14:30:00.000Z
  - repositoryType: monorepo
  - complexity: high
  - customAgents: [array of generated agents]
  - patternsInjected: true
```

### Phase 7: Summary & Next Steps

**Final output:**
```markdown
✅ Setup Complete - Optimized Amplify Configuration

═══════════════════════════════════════════════════════════════

Your Amplify:
┌─────────────────────────────────────────────────────────────┐
│ CORE AGENTS (3)                                              │
└─────────────────────────────────────────────────────────────┘
  ✓ Product Manager
  ✓ Tech Lead
  ✓ Work Orchestrator

┌─────────────────────────────────────────────────────────────┐
│ ENGINEERING AGENTS (4)                                       │
└─────────────────────────────────────────────────────────────┘
  ✓ Frontend Engineer (enhanced with repository patterns)
  ✓ Backend Engineer (enhanced with repository patterns)
  ✓ Database Engineer (enhanced with repository patterns)
  ✓ DevOps Engineer (enhanced with repository patterns)

┌─────────────────────────────────────────────────────────────┐
│ QA AGENTS (2)                                                │
└─────────────────────────────────────────────────────────────┘
  ✓ QA Backend (enhanced with testing standards)
  ✓ QA Frontend (enhanced with testing standards)

┌─────────────────────────────────────────────────────────────┐
│ SPECIALIZED AGENTS (3) ⭐ NEW                                │
└─────────────────────────────────────────────────────────────┘
  ✓ Authentication Service Specialist
  ✓ Payment Service Specialist
  ✓ UI Component Specialist

═══════════════════════════════════════════════════════════════

Repository Intelligence Injected:
┌─────────────────────────────────────────────────────────────┐
│ PATTERNS EXTRACTED & INJECTED                                │
└─────────────────────────────────────────────────────────────┘
  ✓ 47 file organization patterns
  ✓ 23 naming conventions
  ✓ 15 code standards (async, imports, error handling)
  ✓ 12 testing requirements
  ✓ 8 documentation standards
  ✓ 6 quality gates
  ✓ 5 architectural constraints

┌─────────────────────────────────────────────────────────────┐
│ FILES CREATED                                                │
└─────────────────────────────────────────────────────────────┘
  ✓ .claude/agents/ (9 standard + 3 specialized = 12 agents)
  ✓ .claude/agent-context/domain-knowledge.md (AI-generated, 450 lines)
  ✓ .claude/agent-context/repository-patterns.md (extracted patterns)
  ✓ .claude/agent-context/*.md (8 context files, partially generated)
  ✓ .claude/CLAUDE.md (Amplify operating principles)
  ✓ agent_docs/ (Memory Bank structure)
  ✓ .beads/ (Beads work tracking - dependency graph, ready detection)
    ✓ issues.jsonl symlink -> ~/.amplify/workspaces/{hash}/beads/
    ✓ redirect file for bd CLI
  ✓ ~/.amplify/workspaces/{hash}/beads/ (centralized Beads database)
    ✓ issues.jsonl (source of truth, shared across worktrees)
    ✓ events.jsonl (state change history)
    ✓ session-tracking.json (session-item bindings)
  ✓ .claude-amplify.json (updated with metadata)

═══════════════════════════════════════════════════════════════

⚠️  IMPORTANT: Session Restart Required

.claude/CLAUDE.md has been updated with Amplify operating principles.

Please restart your Claude Code session for these principles to take effect.

This ensures proper agent delegation and maximum parallelism in all future work.

═══════════════════════════════════════════════════════════════

Next Steps:

1. **Restart Claude Code Session** (REQUIRED)

2. **Review Domain Knowledge** (Highly Recommended)
   Open: .claude/agent-context/domain-knowledge.md

   AI-generated, but needs your refinement:
   • Add business context and strategic goals
   • Add regulatory/compliance requirements specific to your industry
   • Add performance targets and SLAs
   • Add user behavior patterns and expectations
   • Add competitive landscape insights

3. **Review Repository Patterns** (Optional)
   Open: .claude/agent-context/repository-patterns.md

   Verify extracted patterns are accurate:
   • File organization conventions
   • Naming standards
   • Testing requirements
   • Documentation standards

4. **Review Specialized Agents** (If Generated)
   Open: .claude/agents/custom-*.md

   Verify agent definitions are correct:
   • Core responsibilities
   • Scope boundaries
   • Quality gates
   • Collaboration patterns

5. **Customize Context Files** (As Needed)
   Directory: .claude/agent-context/

   Files partially generated, customize:
   • product-context.md - Add product vision, metrics
   • workflow-context.md - Add team workflows
   • [domain]-context.md - Refine technical contexts

6. **Verify Setup**
   Run: /amplify-status

   Confirms all agents properly configured

7. **Test Your Amplify**
   Try engaging agents:
   • "@backend-engineer, review our error handling patterns"
   • "@auth-service-specialist, explain our OAuth flow"
   • "@product-manager, help me prioritize these features"

8. **Start Building**
   For strategic features:
   • /start → PM-led discovery & PRD

   For bugs/improvements:
   • /start → Quick triage & fix

═══════════════════════════════════════════════════════════════

Performance Impact Estimates:
┌─────────────────────────────────────────────────────────────┐
│ EFFICIENCY GAINS                                             │
└─────────────────────────────────────────────────────────────┘
  ⚡ 60% reduction in back-and-forth (patterns pre-injected)
  ⚡ 90% reduction in setup questions (domain knowledge auto-generated)
  ⚡ 3-5x faster in specialized domains (custom agents)
  ⚡ 85%+ first-time-right implementations (quality gates + patterns)

═══════════════════════════════════════════════════════════════

💡 Pro Tips:

**Use Specialized Agents:**
For auth work: "@auth-service-specialist, add MFA support"
Not: "@backend-engineer, add MFA to packages/auth-service"

**Leverage Patterns:**
Agents now know your conventions automatically.
No need to specify "use absolute imports" or "follow our error handling pattern"

**Parallel Execution:**
"@frontend-engineer, build the dashboard UI
 @backend-engineer, build the dashboard API
 @database-engineer, create the dashboard schema"

All three work simultaneously!

═══════════════════════════════════════════════════════════════
```

## Special Cases

### Case 1: Setup Check Failed (Command Prerequisites)

When user tries to run `/start`, `/start`, or `/start` and setup hasn't been run:

```markdown
⚠️  Amplify Setup Required

The Amplify needs to be set up before running this command.

Setup is a one-time intelligent process that will:
✓ Analyze your repository (3-5 minutes)
✓ Extract and inject patterns into agents
✓ Generate domain knowledge from codebase
✓ Create specialized agents for complex modules
✓ Optimize agent configuration

This ensures agents work efficiently with your specific codebase.

Would you like to run setup now? (yes/no):
```

### Case 2: Re-running Setup (Update Patterns)

If setup was already run but user wants to re-run:

```markdown
⚠️  Amplify Already Set Up

Setup was completed on: January 10, 2025

You can:
1. **Update patterns only** - Re-analyze and inject new patterns (recommended)
2. **Full re-setup** - Complete setup from scratch (careful: may overwrite customizations)
3. **Cancel** - Keep existing setup

Select option (1-3):
```

**Option 1: Update Patterns**
- Re-run repository analysis
- Extract latest patterns
- Re-inject into agents
- Preserve domain knowledge and customizations
- Update repository-patterns.md

**Option 2: Full Re-setup**
- Warn about overwriting customizations
- Backup existing .claude-amplify.json and domain-knowledge.md
- Run full 6-phase setup
- Restore backup of domain knowledge if user wants

### Case 3: Minimal Setup (Skip Analysis)

If user wants quick setup without deep analysis:

```markdown
Would you like:
1. **Intelligent Setup** (Recommended) - Deep analysis, pattern injection, agent optimization (3-5 minutes)
2. **Quick Setup** - Basic structure, template files, no analysis (30 seconds)

For production use, intelligent setup is highly recommended.

Select (1-2):
```

**Quick Setup:**
- Create directory structure
- Copy template files (no analysis)
- Create basic domain-knowledge.md template (not generated)
- Skip pattern injection
- Skip specialized agent generation
- Add note to .claude-amplify.json: `quickSetup: true, analysisSkipped: true`

## Error Handling

### Repository Analysis Failures

```markdown
⚠️  Repository Analysis Issue

I encountered an issue analyzing: {specific area}

Error: {error message}

Options:
1. Continue setup with partial analysis
2. Skip intelligent features, use basic setup
3. Cancel and troubleshoot

This might happen with very large repositories or unusual structures.

Select option (1-3):
```

### Pattern Extraction Failures

```markdown
⚠️  Pattern Extraction Warning

Could not extract patterns for: {specific category}

This might be because:
- Patterns are inconsistent in the codebase
- Non-standard project structure
- Missing or incomplete files

I'll proceed with available patterns and note the gaps in repository-patterns.md.

Continue? (yes/no):
```

### Agent Generation Failures

```markdown
❌ Specialized Agent Generation Failed

Could not generate: {agent name}

Reason: {specific reason}

The standard agents will still work perfectly.
You can try generating this agent later with /generate-agent.

Continue setup? (yes/no):
```

## Quality Checks

Before completing setup, verify:
- [ ] Domain knowledge file created and has content (not just template)
- [ ] Repository patterns extracted and injected into agents
- [ ] Directory structure created completely
- [ ] CLAUDE.md updated with operating principles
- [ ] .claude-amplify.json updated with metadata
- [ ] All specialized agents (if requested) created successfully
- [ ] User informed about session restart requirement
- [ ] User provided with clear next steps

## Success Indicators

Setup is successful when:
- All files created in correct locations
- Agents enhanced with repository patterns
- Domain knowledge bootstrapped from analysis
- Specialized agents (if requested) working
- User knows to restart session
- User knows how to verify setup (/amplify-status)
- User understands how to engage agents
- No errors or warnings left unresolved

## Constraints

- **MUST** perform repository analysis (unless quick setup chosen)
- **MUST** extract and inject patterns
- **MUST** generate domain knowledge (not just template)
- **MUST** update CLAUDE.md with operating principles
- **MUST** inform user to restart session
- **ALWAYS** provide progress indicators during analysis
- **NEVER** skip pattern injection without user approval
- **NEVER** proceed if critical errors in analysis
