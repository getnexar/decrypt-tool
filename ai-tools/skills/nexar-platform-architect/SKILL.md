---
name: nexar-platform-architect
description: Guides architecture decisions for Nexar Corporate Platform deployments. Covers deployment patterns, full-stack architecture, auth handling, GCP service integration, and migration. Activates only when user mentions Nexar Platform, corp.nexars.ai, or nexar deploy.
allowed-tools: Read, Bash, Grep, Glob, WebFetch
---

# Nexar Platform Architect

Architecture guidance for internal apps deployed on Nexar Corporate Platform (`*.corp.nexars.ai`).

## When to Use

Invoke this skill when:
- Planning a new Nexar Platform deployment
- Designing full-stack architecture for corp apps
- Deciding which capabilities (Vertex AI, Storage, SQL, etc.) to enable
- Migrating existing apps to Nexar Platform
- Configuring nexar.yaml for complex deployments
- Understanding auth flow (IAP, API keys, RBAC)

**Trigger phrases:**
- "Nexar Platform"
- "corp.nexars.ai"
- "nexar deploy"
- "nexar.yaml configuration"

**This skill does NOT activate by default.** It only activates when the user explicitly mentions these terms.

---

## Documentation Fetching Strategy

### Step 1: Attempt Fresh Documentation Fetch

Try to fetch latest docs from `getnexar/corp-load-balancer` repo:

```bash
# Check if gh CLI is authenticated
gh auth status 2>/dev/null

# If authenticated, fetch specific doc file
gh api repos/getnexar/corp-load-balancer/contents/docs-site/docs/<filename>.md \
  --jq '.content' | base64 -d
```

**Key documentation files by topic:**

| Topic | File Path |
|-------|-----------|
| Architecture overview | `docs-site/docs/Architecture.md` |
| Capabilities overview | `docs-site/docs/Capabilities-Overview.md` |
| Quick start | `docs-site/docs/Quick-Start.md` |
| Authentication | `docs-site/docs/Authentication.md` |
| Vertex AI | `docs-site/docs/Vertex-AI.md` |
| Cloud Storage | `docs-site/docs/Cloud-Storage.md` |
| Cloud SQL | `docs-site/docs/Cloud-SQL.md` |
| BigQuery | `docs-site/docs/BigQuery.md` |
| Pub/Sub | `docs-site/docs/Pub-Sub.md` |
| Secret Manager | `docs-site/docs/Secret-Manager.md` |
| Public API | `docs-site/docs/Public-API.md` |
| API Keys | `docs-site/docs/nexar-api-keys.md` |
| CLI Overview | `docs-site/docs/CLI-Overview.md` |

### Step 2: Fallback to Embedded Context

If gh CLI fails (no auth, network issues), use embedded context:

```bash
cat ai-tools/context/nexar-platform.md
```

### Step 3: Ask User for Context

If neither works, inform user:

```
I couldn't fetch Nexar Platform documentation. Please provide:
1. The specific capability/feature you're trying to configure
2. Your current nexar.yaml (if any)
3. Any error messages you're seeing

Alternatively, run `gh auth login` to enable documentation fetching.
```

---

## Core Workflow

### Phase 1: Understand Requirements

Ask these clarifying questions:

**1. App Type**: What kind of app are you building?
- Web UI (frontend only)
- API service (backend only)
- Full-stack (frontend + backend)
- AI/ML workload
- Scheduled job / cron

**2. GCP Services Needed**: Which capabilities do you need?
- AI (Vertex AI / Gemini)
- Storage (Cloud Storage, Firestore, Cloud SQL)
- Data (BigQuery, Data Warehouse)
- Messaging (Pub/Sub)
- Google Workspace (Drive, Sheets, Gmail, Calendar)
- Secrets management

**3. Access Pattern**: Who accesses your app?
- Internal only (Nexar employees via IAP)
- Public API (external clients, mobile apps)
- Both

**4. Resource Requirements**:
- Memory needs (256Mi - 32Gi)
- CPU needs (1-8 cores)
- GPU needs (nvidia-l4)

### Phase 2: Fetch Relevant Documentation

Based on requirements, fetch specific docs:

```bash
# Example: User needs Vertex AI + Cloud Storage
gh api repos/getnexar/corp-load-balancer/contents/docs-site/docs/Vertex-AI.md \
  --jq '.content' | base64 -d

gh api repos/getnexar/corp-load-balancer/contents/docs-site/docs/Cloud-Storage.md \
  --jq '.content' | base64 -d
```

### Phase 3: Generate Architecture Recommendation

Provide structured recommendation using this template:

```markdown
# Nexar Platform Architecture: [App Name]

## Overview
[2-3 sentence summary]

## Recommended Architecture

### App Type: [Web UI / API / Full-Stack / AI Workload]

### Deployment Pattern
[Describe the deployment approach]

### nexar.yaml Configuration

```yaml
[Complete nexar.yaml with comments]
```

## Capabilities Breakdown

| Capability | Purpose | Configuration Notes |
|------------|---------|---------------------|
| [cap1] | [why needed] | [special config] |

## Authentication Strategy

### Internal Users (IAP)
[How to handle authenticated users]

### Public API (if applicable)
[API key management strategy]

## Code Patterns

### Reading User Identity
```python
[Code snippet for extracting user from IAP headers]
```

### Using [Capability Name]
```python
[Code snippet for the main capability]
```

## Resource Sizing

| Resource | Recommended | Rationale |
|----------|-------------|-----------|
| Memory | [size] | [why] |
| CPU | [cores] | [why] |
| Instances | [min-max] | [why] |

## Migration Notes (if applicable)
[Notes for migrating from other platforms]

## Next Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

---

## Architecture Patterns

### Pattern 1: Simple Web App (Frontend Only)

**Use when**: Building dashboards, internal tools, simple UIs

```yaml
app_id: my-dashboard
name: Team Dashboard
description: Internal team metrics dashboard
capabilities:
  - vertex-ai      # Optional: for AI features
resources:
  memory: 512Mi
  cpu: 1
```

**Key points**:
- No backend needed if using client-side rendering
- Use IAP headers for user identity
- Static assets served from Cloud Run

### Pattern 2: API Service (Backend Only)

**Use when**: Building REST/GraphQL APIs, webhooks, integrations

```yaml
app_id: my-api
name: Data API Service
capabilities:
  - bigquery
  - secret-manager
resources:
  memory: 1Gi
  cpu: 2
```

**Key points**:
- Expose endpoints for other apps to consume
- Consider enabling Public API if external access needed
- Use secrets for API keys and credentials

### Pattern 3: Full-Stack Application

**Use when**: Complete apps with UI + backend + database

```yaml
app_id: my-fullstack-app
name: Project Manager
capabilities:
  - cloud-sql       # PostgreSQL database
  - cloud-storage   # File uploads
  - secret-manager  # Credentials
  - vertex-ai       # AI features
resources:
  memory: 2Gi
  cpu: 2
```

**Key points**:
- Single Cloud Run service handles both frontend and API
- Database connection via Cloud SQL connector
- Consider Firestore for simpler data models

### Pattern 4: AI/ML Workload

**Use when**: LLM apps, AI processing, model inference

```yaml
app_id: my-ai-app
name: AI Assistant
capabilities:
  - vertex-ai
  - cloud-storage   # For document processing
resources:
  memory: 16Gi      # Minimum for GPU
  cpu: 4            # Minimum for GPU
  gpu: nvidia-l4    # L4 GPU for inference
```

**Key points**:
- GPU requires Dockerfile with CUDA
- Memory minimum 16Gi for GPU workloads
- Use streaming for long-running inference

### Pattern 5: Scheduled Jobs / Cron

**Use when**: Periodic data processing, reports, syncs

```yaml
app_id: my-scheduler
name: Daily Report Generator
capabilities:
  - cloud-scheduler
  - bigquery
  - google-sheets
resources:
  memory: 1Gi
  cpu: 1
```

**Key points**:
- Use Cloud Scheduler capability
- Configure schedules via `nexar scheduler` commands
- Consider timeout settings for long jobs

---

## Capability Decision Tree

Use this to recommend capabilities:

```
Q: Does app need AI/ML?
├─ Yes → vertex-ai
│
Q: Does app store files?
├─ Yes → cloud-storage (dedicated bucket per app)
│
Q: Does app need a database?
├─ Relational data → cloud-sql (PostgreSQL)
├─ Document/NoSQL → firestore
├─ Analytics only → bigquery
│
Q: Does app process events asynchronously?
├─ Yes → pubsub
│
Q: Does app need external API access?
├─ Yes → Consider Public API + API keys
│
Q: Does app integrate with Google Workspace?
├─ Files → google-drive
├─ Spreadsheets → google-sheets
├─ Email → gmail
├─ Calendar → google-calendar
├─ Documents → google-docs
├─ Presentations → google-slides
│
Q: Does app store credentials/secrets?
└─ Yes → secret-manager
```

---

## Quick Reference: Common Configurations

### Minimal App
```yaml
app_id: my-app
resources:
  memory: 512Mi
  cpu: 1
```

### With Database
```yaml
app_id: my-app
capabilities:
  - cloud-sql
  - secret-manager
resources:
  memory: 1Gi
  cpu: 2
```

### With AI
```yaml
app_id: my-app
capabilities:
  - vertex-ai
resources:
  memory: 2Gi
  cpu: 2
```

### Full Production
```yaml
app_id: my-app
capabilities:
  - cloud-sql
  - cloud-storage
  - vertex-ai
  - secret-manager
  - logging
resources:
  memory: 2Gi
  cpu: 2
  scaling:
    min_instances: 1
    max_instances: 10
```

---

## Context Files

> **Context Discipline:** Load files only when relevant to the user's specific question.

**Primary context (always check first):**
- `ai-tools/context/nexar-platform.md` - Embedded platform reference

**For detailed patterns, see:**
- `ai-tools/skills/nexar-platform-architect/REFERENCE.md` - Auth, migrations, troubleshooting
- `ai-tools/skills/nexar-platform-architect/TEMPLATES/` - Ready-to-use configurations

**Fetch on-demand from repo (if gh CLI available):**
- `getnexar/corp-load-balancer/docs-site/docs/` - Latest documentation
