---
name: code-reviewer
description: Reviews code changes against quality, security, and performance standards. Analyzes pull requests, git diffs, or uncommitted changes. Categorizes issues as Critical, Important, or Suggestions and provides approval decisions.
allowed-tools: Read, Bash, Grep, Glob
---

> **CONVERGENCE NOTICE**: For interactive code review workflows, prefer superpowers skills:
> - `superpowers:requesting-code-review` - Pre-review checklist before submitting
> - `superpowers:receiving-code-review` - Process feedback with technical rigor
>
> **When to use this skill:**
> - Generating formal code review reports with categorized issues
> - Self-review before handoffs (produces documented artifact)
> - Reviewing external PRs that need structured feedback
>
> **When to use superpowers code review skills:**
> - Interactive review workflow (request → receive → respond)
> - Reviewing feedback from others with proper verification
> - Pre-submission checklist validation

# Core Workflow

## Step 1: Identify Review Scope

Run appropriate git command:

**Uncommitted changes:**
```bash
git diff
```

**Branch comparison:**
```bash
git diff main...feature-branch
```

**Pull request:**
```bash
gh pr diff <PR-number>
```

## Step 2: Load Standards

Read `.claude/workflows/code-review-template.md` if exists. Otherwise use framework defaults.

## Step 3: Review Checklist

### Code Quality
- [ ] Code is readable and well-structured
- [ ] Variable/function names descriptive
- [ ] Follows DRY principle
- [ ] Complex logic documented
- [ ] No commented-out code
- [ ] Follows team style guide

### Security
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Authentication/authorization proper
- [ ] Sensitive data encrypted
- [ ] No secrets in code
- [ ] Input validation present

### Performance
- [ ] No N+1 query problems
- [ ] Database queries optimized
- [ ] Appropriate caching
- [ ] Efficient algorithms
- [ ] Large datasets handled properly

### Testing
- [ ] Tests added/updated
- [ ] Coverage meets threshold (>80%)
- [ ] Tests cover happy path and edge cases
- [ ] Tests are maintainable

### Documentation
- [ ] Code self-documenting
- [ ] Complex logic has comments
- [ ] Public APIs documented
- [ ] README updated if applicable

For detailed criteria, see REFERENCE.md.

## Step 4: Categorize Issues

**Critical (Must Fix):**
- Security vulnerabilities
- Data loss risks
- Breaking changes without migration
- Test failures
- Performance regressions (>20% slowdown)

**Important (Should Fix):**
- Code quality issues
- Missing tests
- Incomplete error handling
- Documentation gaps

**Suggestions (Nice to Have):**
- Code style preferences
- Refactoring opportunities
- Additional test coverage

## Step 4: Generate Review Report

**Copy this EXACT template:**

```markdown
# Code Review Report

**Reviewed:** [git diff / branch name / PR #123]
**Date:** [YYYY-MM-DD]
**Reviewer:** [Your agent name]

## Summary
[2-3 sentences: scope of changes, overall quality assessment, major observations]

## Checklist Status

### Code Quality
- [✅/❌/⚠️] Readable and well-structured
- [✅/❌/⚠️] Descriptive naming
- [✅/❌/⚠️] Follows DRY principle
- [✅/❌/⚠️] Complex logic documented

### Security
- [✅/❌/⚠️] No SQL injection risks
- [✅/❌/⚠️] No XSS vulnerabilities
- [✅/❌/⚠️] Auth/authorization proper
- [✅/❌/⚠️] No secrets in code

### Performance
- [✅/❌/⚠️] No N+1 queries
- [✅/❌/⚠️] Efficient algorithms
- [✅/❌/⚠️] Appropriate caching

### Testing
- [✅/❌/⚠️] Tests added/updated
- [✅/❌/⚠️] Coverage >80%
- [✅/❌/⚠️] Edge cases covered

[For complete checklist, see REFERENCE.md]

## Issues Found

### ❌ Critical (Must Fix Before Merge)
[List each issue or write "None"]

1. **[file.ts:42]** [Issue title]
   - **Problem:** [What's wrong]
   - **Risk:** [What could happen]
   - **Fix:** [How to resolve]
   ```typescript
   // Example fix
   ```

### ⚠️ Important (Should Fix)
[List each issue or write "None"]

1. **[file.ts:108]** [Issue title]
   - **Problem:** [What needs improvement]
   - **Recommendation:** [Suggested approach]

### 💡 Suggestions (Nice to Have)
[List each issue or write "None"]

1. **[file.ts:215]** [Suggestion]
   - **Current:** [What it does now]
   - **Better:** [What would be better]

## Positive Observations
[Call out 2-3 good practices, clever solutions, well-written code]

- ✅ [Good practice 1]
- ✅ [Good practice 2]

## Decision

**Result:** [Choose ONE]
- ✅ **APPROVE** - Ready to merge (no critical issues)
- ⚠️ **APPROVE WITH SUGGESTIONS** - Can merge, consider improvements
- ❌ **REQUEST CHANGES** - Must address critical issues

**Confidence:** [High / Medium / Low]

**Reasoning:** [1-2 sentences justifying decision based on issues found]

## Next Steps
[What should happen next]
```

**Legends:**
- ✅ = Meets standard
- ❌ = Does not meet standard
- ⚠️ = Partially meets standard or needs attention

## Validation Loop

Before finalizing review:

**Self-Check Questions:**
1. Did I check ALL categories (quality, security, performance, testing)?
2. Are issues categorized correctly (Critical = blocks merge, Important = should fix, Suggestions = nice-to-have)?
3. Is my approval decision justified by the issues found?
4. Did I provide actionable fixes for critical issues?
5. Did I acknowledge good practices in "Positive Observations"?

**If any answer is "no", revise the review before submitting.**

## Context Files

> **Context Discipline:** Only load files directly relevant to the code review. Check `agent_docs/index.md` first if unsure which files are needed.

Reference these when reviewing:
- `agent_docs/index.md` - Check first for file discovery
- `.claude/workflows/code-review-template.md` - Team standards (if exists)
- `.claude/agent-context/architecture-context.md` - Coding standards
- `agent_docs/technical-setup.md` - Tech stack (only when needed for stack-specific review)
