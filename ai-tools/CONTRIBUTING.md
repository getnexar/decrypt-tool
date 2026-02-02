# Contributing Guidelines

This document defines the coding standards, review processes, and best practices for all AI agents working on this project. Each agent must read and follow these guidelines before executing any work.

---

## Table of Contents

- [General Coding Standards](#general-coding-standards)
- [Code Review Standards](#code-review-standards)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Agent-Specific Guidelines](#agent-specific-guidelines)
  - [Frontend Engineer](#frontend-engineer)
  - [Backend Engineer](#backend-engineer)
  - [Database Engineer](#database-engineer)
  - [AI Engineer](#ai-engineer)
  - [DevOps Engineer](#devops-engineer)
  - [Firmware Engineer](#firmware-engineer)
  - [QA Engineers](#qa-engineers)
- [How to Customize](#how-to-customize)

---

## General Coding Standards

**Apply to all engineering agents.**

### Code Quality Principles

- **Simplicity First**: Choose the simplest solution that meets requirements
- **Readability**: Code is read more often than written - optimize for clarity
- **DRY (Don't Repeat Yourself)**: Extract common patterns, but avoid premature abstraction
- **SOLID Principles**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **Fail Fast**: Validate inputs early, handle errors explicitly
- **Separation of Concerns**: Keep business logic, presentation, and data access separate

### General Best Practices

- Write self-documenting code with clear variable and function names
- Add comments for complex logic or business rules
- Keep functions small and focused (ideally < 50 lines)
- Use meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Write tests for all business logic (unit + integration)
- Handle errors gracefully with proper logging
- Avoid magic numbers and strings - use named constants
- Follow the Boy Scout Rule: Leave code cleaner than you found it

### Testing Standards

- **Minimum Coverage**: 80% for new code
- **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E tests
- **Test Naming**: `test_<what>_<scenario>_<expected>` or `it('should <expected> when <scenario>')`
- **Arrange-Act-Assert**: Structure tests clearly with setup, execution, verification
- **Isolated Tests**: Tests should not depend on each other or external state
- **Fast Tests**: Unit tests should run in milliseconds, integration tests in seconds

### Security Standards

- Never commit secrets, API keys, or credentials (use environment variables)
- Validate all user inputs (whitelist approach preferred)
- Sanitize outputs to prevent injection attacks
- Use parameterized queries for database access
- Implement proper authentication and authorization
- Follow OWASP Top 10 guidelines
- Keep dependencies up to date (security patches)

---

## Code Review Standards

**All agents should follow these standards when reviewing code (including self-review).**

### What to Check

#### Correctness
- [ ] Code does what it's supposed to do (meets acceptance criteria)
- [ ] Edge cases are handled
- [ ] Error handling is comprehensive
- [ ] Business logic is correct

#### Code Quality
- [ ] Code is readable and maintainable
- [ ] Functions/classes have single responsibility
- [ ] No code duplication (DRY principle)
- [ ] Naming is clear and consistent
- [ ] Comments explain "why" not "what"

#### Testing
- [ ] Tests exist for new functionality
- [ ] Tests cover edge cases and error scenarios
- [ ] Tests are readable and maintainable
- [ ] Test coverage meets minimum threshold (80%)

#### Security
- [ ] No hardcoded secrets or credentials
- [ ] Inputs are validated and sanitized
- [ ] Authentication/authorization is proper
- [ ] Dependencies are up to date and secure

#### Performance
- [ ] No obvious performance issues (N+1 queries, inefficient algorithms)
- [ ] Appropriate caching where needed
- [ ] Database queries are optimized
- [ ] Large operations are paginated or streamed

#### Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Complex logic is commented
- [ ] Breaking changes are documented

### Review Process

1. **Self-Review First**: Before requesting review, check your code against this checklist
2. **Use the `code-reviewer` Skill**: Invoke the code-reviewer skill for comprehensive automated review
3. **Address Feedback**: Fix issues and respond to comments
4. **Request Re-Review**: If significant changes were made

### Providing Feedback

- Be constructive and specific
- Suggest alternatives, don't just point out problems
- Distinguish between "must fix" and "nice to have"
- Praise good code - positive reinforcement matters
- Focus on the code, not the person

---

## Pull Request Guidelines

**Follow these standards when creating pull requests.**

### PR Title

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

Examples:
feat(auth): add OAuth2 login support
fix(api): resolve race condition in user creation
docs(readme): update installation instructions
refactor(backend): simplify error handling middleware
test(frontend): add E2E tests for checkout flow
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `style`

### PR Description Template

```markdown
## What
Brief description of changes (1-2 sentences)

## Why
Business context or problem being solved

## How
Technical approach and key implementation details

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases covered

## Screenshots/Demo (if applicable)
[Add screenshots or demo GIF for UI changes]

## Checklist
- [ ] Code follows project standards
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes (or migration path provided)
- [ ] Self-reviewed code
- [ ] Reviewed by code-reviewer skill

## Related Links
- Closes #[issue-number]
- Related to [project/request ID]
- Design doc: [link]
```

### PR Best Practices

- **Keep PRs Small**: Aim for < 400 lines changed (easier to review)
- **Single Purpose**: One feature/fix per PR
- **Link Context**: Reference issues, requirements, design docs
- **Self-Review**: Review your own PR first using the `code-reviewer` skill
- **Update Tests**: Include test changes in the same PR
- **Squash WIP Commits**: Clean up commit history before final review
- **Respond to Feedback**: Address all comments before merging

---

## Agent-Specific Guidelines

### Frontend Engineer

<!-- CUSTOMIZE: Add your team's frontend-specific standards -->

**Tech Stack Considerations**
- Follow React/Vue/Angular/Svelte best practices for your framework
- Use TypeScript for type safety (if applicable)
- Follow component naming conventions
- Use appropriate state management patterns

**UI/UX Standards**
- Ensure responsive design (mobile, tablet, desktop)
- Follow accessibility guidelines (WCAG 2.1 AA minimum)
- Use semantic HTML
- Optimize for performance (lazy loading, code splitting, image optimization)
- Test across browsers (Chrome, Firefox, Safari, Edge)

**Component Guidelines**
- Keep components small and focused (< 200 lines)
- Separate presentational and container components
- Use prop validation/TypeScript types
- Document component API (props, events, slots)

**Styling**
- Follow CSS naming convention (BEM, CSS Modules, styled-components, Tailwind)
- Avoid inline styles except for dynamic values
- Use design tokens for consistency
- Keep specificity low

**Testing**
- Write component unit tests (React Testing Library, Vue Test Utils, etc.)
- Write E2E tests for critical user journeys (Playwright, Cypress)
- Test accessibility with axe or Pa11y
- Test responsive behavior

**Example Project Standards:**
```markdown
Framework: React 18 + TypeScript
Styling: Tailwind CSS + CSS Modules
State: Zustand for global state, React Query for server state
Testing: Vitest + React Testing Library + Playwright
Build: Vite
Linting: ESLint + Prettier
Component Structure: Atomic Design (atoms, molecules, organisms, templates, pages)
```

---

### Backend Engineer

<!-- CUSTOMIZE: Add your team's backend-specific standards -->

**API Design**
- Follow RESTful principles or GraphQL best practices
- Use semantic HTTP methods and status codes
- Version APIs (URL versioning or header-based)
- Implement pagination for list endpoints
- Provide filtering and sorting options
- Document with OpenAPI/Swagger or GraphQL schema

**Error Handling**
- Use consistent error response format
- Include error codes, messages, and details
- Log errors with appropriate severity levels
- Don't expose internal errors to clients
- Implement retry logic for transient failures

**Security**
- Validate all inputs (whitelist approach)
- Use parameterized queries (prevent SQL injection)
- Implement rate limiting
- Use HTTPS/TLS for all communications
- Implement proper authentication (JWT, OAuth2, etc.)
- Follow principle of least privilege for authorization
- Sanitize outputs to prevent XSS

**Performance**
- Optimize database queries (avoid N+1)
- Implement caching (Redis, in-memory)
- Use database indexes appropriately
- Implement async processing for long operations
- Monitor response times and set SLAs

**Testing**
- Unit tests for business logic
- Integration tests for API endpoints
- Contract tests for external integrations
- Load tests for performance validation

**Example Project Standards:**
```markdown
Language: Node.js 20 + TypeScript
Framework: Express + tRPC
Auth: JWT with refresh tokens
Database: PostgreSQL via Prisma ORM
Caching: Redis
Queues: Bull for async jobs
Testing: Jest + Supertest
API Style: REST + OpenAPI 3.0
Versioning: URL-based (/api/v1/)
```

---

### Database Engineer

<!-- CUSTOMIZE: Add your team's database-specific standards -->

**Schema Design**
- Normalize to 3NF unless denormalization is justified
- Use appropriate data types (don't use VARCHAR for everything)
- Define foreign key constraints
- Use proper indexing strategy
- Document schema with ER diagrams

**Migration Standards**
- All schema changes via versioned migrations
- Migrations must be reversible (up/down)
- Test migrations on staging before production
- Include data migrations when needed
- Name migrations descriptively: `YYYYMMDD_description.sql`

**Query Optimization**
- Use EXPLAIN/ANALYZE to understand query plans
- Add indexes for frequently queried columns
- Avoid SELECT * in production code
- Use appropriate JOIN types
- Optimize for common access patterns

**Data Integrity**
- Use transactions for multi-step operations
- Implement proper constraints (NOT NULL, UNIQUE, CHECK)
- Validate data at database level
- Use appropriate isolation levels

**Backup & Recovery**
- Document backup strategy
- Test restore procedures
- Implement point-in-time recovery
- Archive old data appropriately

**Example Project Standards:**
```markdown
Database: PostgreSQL 15
ORM: Prisma / SQLAlchemy / Hibernate
Migration Tool: Flyway / Alembic / Prisma Migrate
Naming: snake_case for tables/columns
Indexing: Composite indexes for common queries
Backups: Daily full + continuous WAL archiving
```

---

### AI Engineer

<!-- CUSTOMIZE: Add your team's AI/ML-specific standards -->

**LLM Integration**
- Version all prompts (use prompt management system or versioned files)
- Implement proper error handling and retries
- Set timeout limits for LLM calls
- Implement fallback strategies for failures
- Monitor token usage and costs
- Use streaming for long responses

**Prompt Engineering**
- Document prompt design rationale
- Version prompts in `prompts/` directory
- Use system/user/assistant message structure
- Implement few-shot examples when needed
- Test prompts with diverse inputs
- Monitor prompt performance over time

**RAG Systems**
- Chunk documents appropriately (200-500 tokens typical)
- Use appropriate embedding model
- Implement hybrid search (vector + keyword)
- Cache embeddings when possible
- Monitor retrieval quality
- Implement re-ranking if needed

**AI Evaluation**
- Define evaluation metrics (RAGAS, BLEU, custom)
- Create evaluation datasets
- Run offline evaluation before deployment
- Implement A/B testing for prompt changes
- Monitor production quality
- Detect hallucinations and biases

**Cost Management**
- Track token usage per request
- Implement caching for repeated queries
- Use smaller models when appropriate
- Set budget alerts
- Optimize prompt length

**Testing**
- Unit tests for AI integration logic
- Integration tests with mock LLM responses
- Evaluation harness for AI quality
- Test edge cases and adversarial inputs

**Example Project Standards:**
```markdown
LLM Provider: Anthropic Claude / OpenAI
Embedding Model: text-embedding-3-large
Vector DB: Pinecone / pgvector
Prompt Management: LangSmith / Custom versioning
Evaluation: RAGAS + custom metrics
Observability: LangSmith tracing
Cost Budget: $X per month
```

---

### DevOps Engineer

<!-- CUSTOMIZE: Add your team's DevOps-specific standards -->

**Infrastructure as Code**
- All infrastructure defined in code (Terraform, CloudFormation, Pulumi)
- Version control all IaC configurations
- Use modules/reusable components
- Document architecture diagrams
- Implement least privilege access

**CI/CD Pipelines**
- Automated testing on all branches
- Separate staging and production deployments
- Implement rollback mechanisms
- Use semantic versioning for releases
- Require code review before merging
- Run security scans (SAST, dependency checks)

**Deployment Standards**
- Use blue-green or canary deployments
- Implement health checks
- Set up monitoring before deploying
- Document rollback procedures
- Test disaster recovery regularly

**Monitoring & Observability**
- Implement structured logging
- Set up metrics collection (Prometheus, CloudWatch, etc.)
- Create dashboards for key metrics
- Set up alerts for critical issues
- Implement distributed tracing
- Monitor costs

**Security**
- Rotate credentials regularly
- Use secrets management (Vault, AWS Secrets Manager)
- Implement network segmentation
- Regular security audits
- Keep infrastructure patched
- Enable MFA for all production access

**Example Project Standards:**
```markdown
Cloud Provider: AWS / GCP / Azure
IaC Tool: Terraform
Container Orchestration: Kubernetes / ECS
CI/CD: GitHub Actions / GitLab CI
Monitoring: Datadog / Prometheus + Grafana
Logging: ELK Stack / CloudWatch
Secrets: AWS Secrets Manager / HashiCorp Vault
```

---

### Firmware Engineer

<!-- CUSTOMIZE: Add your team's firmware-specific standards -->

**Embedded Development**
- Follow MISRA C/C++ guidelines (if applicable)
- Use static analysis tools (Coverity, PC-Lint)
- Minimize dynamic memory allocation
- Optimize for power consumption
- Consider real-time constraints
- Document hardware dependencies

**Memory Management**
- Stay within memory budget (RAM/Flash)
- Use stack efficiently (avoid deep recursion)
- Profile memory usage regularly
- Implement memory protection where available
- Handle out-of-memory conditions

**Real-Time Considerations**
- Meet timing requirements (deadlines)
- Minimize interrupt latency
- Use appropriate RTOS primitives
- Avoid blocking operations in ISRs
- Test worst-case execution time

**Hardware Integration**
- Abstract hardware with HAL (Hardware Abstraction Layer)
- Document register configurations
- Implement proper initialization sequences
- Handle hardware errors gracefully
- Test on actual hardware, not just simulators

**Protocol Implementation**
- Follow protocol specifications precisely
- Implement error detection/correction
- Handle communication timeouts
- Test interoperability with other devices
- Document protocol state machines

**Testing**
- Unit tests on host (Unity, CppUTest)
- Hardware-in-the-loop (HIL) tests
- Protocol validation tests
- Power consumption tests
- Stress tests (thermal, voltage, timing)

**Example Project Standards:**
```markdown
MCU: STM32F4 / ESP32 / nRF52
RTOS: FreeRTOS / Zephyr
Language: C11 / C++17 for embedded
Build: CMake + GCC ARM
Testing: Unity + Ceedling + HIL
Protocols: I2C, SPI, UART, CAN, BLE
Coding Standard: MISRA C 2012
```

---

### QA Engineers

<!-- CUSTOMIZE: Add your team's QA-specific standards -->

**Test Strategy**
- Create test plans before implementation
- Cover functional and non-functional requirements
- Test positive and negative scenarios
- Test edge cases and boundary conditions
- Validate acceptance criteria completely

**Test Types**
- **Unit Tests**: Individual functions/methods (by developers)
- **Integration Tests**: Component interactions
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load, stress, scalability
- **Security Tests**: Vulnerability scanning, penetration testing
- **Accessibility Tests**: WCAG compliance (frontend)
- **Regression Tests**: Ensure fixes don't break existing functionality

**Test Documentation**
- Document test scenarios and expected results
- Track test coverage metrics
- Report bugs with reproduction steps
- Create test reports after test runs
- Maintain test data and fixtures

**Automation**
- Automate repetitive tests
- Run tests in CI/CD pipeline
- Use page object pattern (for E2E)
- Keep tests maintainable and fast
- Parallelize test execution

**Bug Reporting**
- Clear title describing the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, version)
- Screenshots/logs when applicable
- Severity and priority assessment

**QA-Specific Guidelines by Domain:**

**Backend QA:**
- API testing (REST, GraphQL, gRPC)
- Integration testing (databases, message queues, external services)
- Performance testing (load, stress)
- Security testing (OWASP Top 10)
- Contract testing (API versioning)

**Frontend QA:**
- E2E testing (Playwright, Cypress)
- Component testing (React Testing Library, Vitest)
- Visual regression testing (Percy, Chromatic)
- Accessibility testing (axe, Pa11y, WCAG)
- Cross-browser testing
- Responsive design testing

**Firmware QA:**
- Hardware-in-the-loop (HIL) testing
- Protocol validation testing
- Power consumption testing
- Memory profiling
- Real-time constraint validation
- Safety testing (watchdog, fault injection)

**Example Project Standards:**
```markdown
E2E Framework: Playwright / Cypress
API Testing: Supertest / REST Assured
Performance: k6 / JMeter / Gatling
Visual Regression: Percy / Chromatic
Accessibility: axe-core / Pa11y
Test Coverage: 80% minimum
CI Integration: All tests run on PR
Test Reports: HTML reports + CI artifacts
```

---

## How to Customize

**This file is meant to be customized for your team!**

### Steps to Customize:

1. **Review Defaults**: Read through all sections and identify what applies to your project
2. **Add Team Standards**: Fill in the `<!-- CUSTOMIZE -->` sections with your actual tech stack, tools, and conventions
3. **Remove Irrelevant Sections**: If you don't use firmware or AI, remove those sections
4. **Add Team-Specific Patterns**: Document your unique patterns, conventions, and requirements
5. **Link External Resources**: Add links to your team's style guides, design systems, or documentation
6. **Keep It Updated**: As standards evolve, update this file (it's version controlled!)

### What to Document:

- Specific frameworks and versions you use
- Your team's preferred patterns and architectures
- Tool configurations (linters, formatters, test runners)
- Naming conventions specific to your codebase
- Links to external style guides or documentation
- Team-specific requirements (compliance, security, accessibility)
- Examples from your actual codebase

### Example Customization:

```markdown
### Backend Engineer (CUSTOMIZED)

**Our Stack:**
- Language: Python 3.11
- Framework: FastAPI
- Database: PostgreSQL 15 via SQLAlchemy
- Testing: pytest + pytest-asyncio + TestContainers
- API Documentation: FastAPI's built-in OpenAPI

**Our Conventions:**
- Use async/await for all I/O operations
- Follow PEP 8 with Black formatter
- Use Pydantic models for request/response validation
- Keep routers under 200 lines (split into multiple files)
- Use dependency injection for database sessions
- All endpoints must have rate limiting decorators

**Our Review Checklist:**
- [ ] All database queries use async SQLAlchemy
- [ ] Pydantic models have examples for docs
- [ ] Rate limiting applied to all public endpoints
- [ ] Background tasks use Celery (not FastAPI BackgroundTasks)
```

---

## Questions or Improvements?

If you have questions about these guidelines or suggestions for improvement:
1. Open an issue in your project's issue tracker
2. Discuss with your team
3. Update this document via pull request
4. Ensure all agents are aware of changes

**Remember**: These guidelines exist to help us build better software together. They should be followed but not treated as unchangeable law. If something doesn't make sense for your use case, discuss it with your team and update accordingly.

