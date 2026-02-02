# Nexar Platform Migration Checklist

Use this checklist when migrating an existing app to Nexar Platform.

## Pre-Migration

- [ ] **Document current architecture**
  - [ ] List all services/components
  - [ ] Identify data stores (databases, caches, files)
  - [ ] Map external integrations
  - [ ] Note authentication method

- [ ] **Inventory secrets and config**
  - [ ] List all environment variables
  - [ ] Identify sensitive values (API keys, passwords)
  - [ ] Document configuration files

- [ ] **Analyze dependencies**
  - [ ] Review package.json / requirements.txt
  - [ ] Check for platform-specific code
  - [ ] Identify deprecated dependencies

## Migration Steps

### 1. Create nexar.yaml

- [ ] Choose appropriate `app_id` (lowercase, hyphens)
- [ ] Set display `name` and `description`
- [ ] Determine required `capabilities`
- [ ] Configure `resources` (memory, CPU)

### 2. Handle Authentication

- [ ] Remove existing auth code (IAP handles this)
- [ ] Update code to read IAP headers:
  ```python
  email = request.headers.get("X-Goog-Authenticated-User-Email", "")
  user = email.replace("accounts.google.com:", "") if email else None
  ```
- [ ] If public API needed, enable and configure API keys

### 3. Migrate Secrets

For each secret:
- [ ] Create secret: `nexar secrets create SECRET_NAME`
- [ ] Set value: `nexar secrets set SECRET_NAME`
- [ ] Update code to read from environment

### 4. Migrate Data Stores

**Database:**
- [ ] Enable cloud-sql or firestore capability
- [ ] Export data from current database
- [ ] Import to new database
- [ ] Update connection strings

**Files:**
- [ ] Enable cloud-storage capability
- [ ] Migrate files to Cloud Storage bucket
- [ ] Update file access code

### 5. Update Build Process

- [ ] Ensure PORT environment variable is used
- [ ] Create/update Procfile or Dockerfile
- [ ] Test build locally if possible

### 6. Deploy and Test

- [ ] Initial deploy: `nexar deploy`
- [ ] Check logs: `nexar logs`
- [ ] Test all endpoints
- [ ] Verify authentication works
- [ ] Test capability access (DB, storage, etc.)

## Post-Migration

- [ ] Update DNS/redirects from old URL
- [ ] Notify users of new URL
- [ ] Monitor for errors: `nexar logs --severity ERROR`
- [ ] Decommission old infrastructure
- [ ] Update documentation

## Rollback Plan

If issues occur:
1. Keep old infrastructure running during migration
2. Use `nexar undeploy` to stop new app (preserves config)
3. Redirect traffic back to old system
4. Analyze logs and fix issues
5. Re-deploy when ready

## Common Migration Issues

| Issue | Solution |
|-------|----------|
| App not starting | Check PORT env var, review logs |
| Permission denied | Enable missing capability |
| Database connection failed | Verify secrets, check connection string |
| Auth not working | Ensure using IAP headers, not old auth |
| Files not found | Update paths to use Cloud Storage |
