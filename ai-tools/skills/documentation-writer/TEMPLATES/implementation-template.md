# Implementation: [Feature Name]

**Domain:** Frontend | Backend | Database | AI | Firmware | DevOps
**Implemented By:** @[engineer-name]
**Date:** [YYYY-MM-DD]
**PR:** [link to pull request]

## Overview
[Brief 2-3 sentence description of what was implemented and how it fits into the system]

## Requirements
- **Requirements Doc:** `agent_docs/requirements/[filename].md`
- **ADRs:** ADR-XXX [if applicable]
- **Design Doc:** `agent_docs/designs/[feature-name]/technical-design.md` [if applicable]

## Architecture

### Components
**[Component Name]**
- **Location:** `src/path/to/component`
- **Purpose:** [What this component does and its responsibility]
- **Dependencies:** [Other components, services, or libraries this depends on]
- **Key Exports:** [Main functions, classes, or APIs exposed]

**[Another Component Name]**
[Repeat structure for each major component]

### Data Flow
[Describe how data moves through the system from input to output. Include:]
- Entry points (API endpoints, UI components, event handlers)
- Data transformations and processing steps
- Storage/persistence operations
- Response/output generation

### Key Patterns
- **Pattern 1:** [Design pattern name - why it was chosen and where it's applied]
- **Pattern 2:** [Design pattern name - rationale and usage]

## Code Locations

### Entry Points
- **Main file:** `src/path/to/main.ts` - [Brief description]
- **API endpoint:** `POST /api/path` - [What it does]
- **Component:** `src/components/FeatureName.tsx` - [Purpose]
- **Service:** `src/services/feature-service.ts` - [Business logic]

### Related Files
- **Tests:** `src/__tests__/feature-name.test.ts` - [Coverage: X%]
- **Types:** `src/types/feature-name.ts` - [Type definitions]
- **Utilities:** `src/utils/feature-helpers.ts` - [Helper functions]
- **Styles:** `src/styles/feature-name.css` - [Styling]

## Configuration
- **Environment variables:**
  - `FEATURE_NAME_API_KEY` - [Description and where to obtain]
  - `FEATURE_NAME_TIMEOUT` - [Default: X, purpose]
- **Feature flags:**
  - `enable_feature_name` - [Controls feature availability]
- **Config files:**
  - `.feature-name.config.js` - [Configuration options]

## Database Changes
- **Schema:** [Tables/collections added or modified]
  - `table_name` - [Columns, indexes, constraints]
- **Migrations:** `migrations/YYYYMMDD_feature_name.sql`
- **Data modifications:** [Any data seeding or transformations]

## API Contracts

### Endpoint: POST /api/feature
**Description:** [What this endpoint does]

**Request:**
```json
{
  "field1": "value",
  "field2": 123
}
```

**Response (200 OK):**
```json
{
  "result": "success",
  "data": {}
}
```

**Error Responses:**
- `400 Bad Request` - [When this occurs]
- `401 Unauthorized` - [When this occurs]
- `500 Internal Server Error` - [When this occurs]

### Endpoint: GET /api/feature/:id
[Repeat structure for each endpoint]

## Testing
- **Unit Tests:** `src/__tests__/` - [XX% coverage]
  - [Key test scenarios covered]
- **Integration Tests:** `tests/integration/feature-name.test.ts`
  - [Integration points tested]
- **E2E Tests:** `tests/e2e/feature-name.spec.ts`
  - [User flows covered]

## Deployment Notes
- **Build:** `npm run build` - [Any special build requirements]
- **Deploy:** [Deployment process - automatic via CI/CD or manual steps]
- **Rollback:** [How to rollback if issues occur]
- **Monitoring:** Dashboard at [link] - [Key metrics to watch]
- **Alerts:** [Alert conditions configured]

## Trade-offs & Decisions
- **Decision 1:** [What was decided]
  - **Why:** [Rationale for this approach]
  - **Trade-off:** [What was sacrificed or alternative approaches considered]
  - **Impact:** [Long-term implications]

## Known Limitations
- [Limitation 1 and why it exists]
- [Limitation 2 and future plan to address it]

## Future Improvements
- [Potential enhancement 1 - value it would provide]
- [Potential enhancement 2 - technical debt to address]

## References
- Design doc: `agent_docs/designs/feature-name/technical-design.md`
- ADR: `agent_docs/architecture/decisions/ADR-XXX.md`
- Related implementations: `agent_docs/implementations/[domain]/related-feature.md`
