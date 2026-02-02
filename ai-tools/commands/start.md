# Start Work Command

**Intended For:** Human
**Purpose:** Universal entry point - checks prerequisites then ALWAYS triggers brainstorming
**Triggers:** Any new work request

---

## CRITICAL: Mandatory Brainstorming [HIGHEST PRIORITY]

**This command MUST invoke the `amplify-brainstorming` skill. There are NO exceptions.**

After passing prerequisites, you MUST use the **Skill tool** to invoke `amplify-brainstorming`. Do NOT:
- ❌ Route based on keywords or work type
- ❌ Skip brainstorming for "simple" requests
- ❌ Ask routing questions before brainstorming
- ❌ Engage agents directly without brainstorming first
- ❌ Describe what brainstorming would do - actually invoke it

---

## Phase 1: Prerequisites Check

**Check the following before proceeding:**

```
Required:
- [ ] .claude/CLAUDE.md exists
- [ ] agent_docs/ directory exists
- [ ] Git repository initialized (.git exists)

Recommended:
- [ ] agent_docs/project-overview.md has content (not just template)
- [ ] agent_docs/technical-setup.md has content (not just template)
```

**If required checks fail:**
```
⚠️ Amplify Setup Required

Before starting work, Amplify needs to be configured:

Missing:
- [list what's missing]

Run /setup-amplify to configure Amplify for this repository.
```

**If required checks pass but recommended fail:**
```
Memory Bank Incomplete

Your Memory Bank has template files that haven't been filled in:
- [list incomplete files]

The brainstorming process will work better with project context.
Continue anyway? (yes/no)
```

---

## Phase 2: Invoke Brainstorming [MANDATORY]

**Once prerequisites pass, you MUST immediately invoke the skill:**

1. **Announce:** "Using amplify-brainstorming skill to explore your idea..."

2. **Use the Skill tool:**
   ```
   Skill tool invocation:
   - skill: "amplify-brainstorming"
   - args: [user's original request]
   ```

3. **Follow the skill's instructions exactly**

**THIS IS NOT OPTIONAL. You MUST use the Skill tool to invoke amplify-brainstorming.**

---

## Why Brainstorming First?

The `amplify-brainstorming` skill:
- Understands project context from Memory Bank
- Asks clarifying questions one at a time
- Explores approaches and trade-offs
- Presents designs incrementally for validation
- Creates implementation plans
- Determines the right specialists to engage
- Sets up isolated workspaces when needed

By ALWAYS starting with brainstorming, `/start` ensures:
- No assumptions about work type
- User intent is fully understood
- Right approach is chosen collaboratively
- Quality outcomes through proper discovery

---

## Examples

### Example 1: Feature Request
```
User: /start Build a task management API

Claude: [Checks prerequisites - all pass]
        Using amplify-brainstorming skill to explore your idea...
        [Uses Skill tool with skill="amplify-brainstorming" args="Build a task management API"]
```

### Example 2: Bug Report
```
User: /start Fix the login timeout issue

Claude: [Checks prerequisites - all pass]
        Using amplify-brainstorming skill to explore your idea...
        [Uses Skill tool with skill="amplify-brainstorming" args="Fix the login timeout issue"]
```

### Example 3: Vague Request
```
User: /start Make the app faster

Claude: [Checks prerequisites - all pass]
        Using amplify-brainstorming skill to explore your idea...
        [Uses Skill tool with skill="amplify-brainstorming" args="Make the app faster"]
```

### Example 4: Setup Required
```
User: /start Add user authentication

Claude: ⚠️ Amplify Setup Required

        Before starting work, Amplify needs to be configured:

        Missing:
        - .claude/CLAUDE.md
        - agent_docs/ directory

        Run /setup-amplify to configure Amplify for this repository.
```

---

## Anti-Patterns to Avoid

**DO NOT do any of these:**

1. **Don't classify first:**
   ❌ "This looks like a bug fix, let me route to @tech-lead..."
   ✅ Use `amplify-brainstorming` skill - it handles classification

2. **Don't ask routing questions:**
   ❌ "Is this a new feature, bug fix, or improvement?"
   ✅ Use `amplify-brainstorming` skill - it asks the right questions

3. **Don't skip for "simple" tasks:**
   ❌ "This is simple, I'll just do it directly..."
   ✅ Use `amplify-brainstorming` skill - simple tasks benefit too

4. **Don't describe the skill:**
   ❌ "The brainstorming skill would help explore this..."
   ✅ Actually invoke it with the Skill tool

---

## Success Criteria

A correct `/start` execution:
- [ ] Prerequisites checked first
- [ ] Skill tool used to invoke `amplify-brainstorming`
- [ ] User's original request passed as args
- [ ] Brainstorming skill's instructions followed
- [ ] No routing/classification done before brainstorming
- [ ] Multi-perspective planning completed by skill for non-trivial features

---

## Multi-Perspective Planning [REQUIRED]

> **Note:** Multi-perspective planning is executed by the `amplify-brainstorming`
> skill during its Phase 4 (Multi-Perspective Review). The information below
> documents the perspectives that the skill will guide you through.
>
> You do not need to manually initiate this - invoking `amplify-brainstorming`
> handles it automatically.

For any non-trivial feature, the brainstorming/planning phase MUST include multiple perspectives. This ensures blind spots are identified early.

### Required Perspectives (Always)

| Perspective | Owner | Key Questions |
|-------------|-------|---------------|
| **Architecture** | @tech-lead | Is this the right approach? Does it fit existing patterns? Scalability concerns? |
| **Security** | Review focus | Auth/authorization implications? Data exposure risks? Input validation needs? |
| **Testing** | @test-engineer | How will this be tested? What test types are needed? Coverage requirements? |

### Conditional Perspectives (Based on Feature Type)

| Perspective | When Required | Key Questions |
|-------------|---------------|---------------|
| **Performance** | High-traffic, data-intensive, or real-time features | Latency requirements? Caching strategy? Database query impact? |
| **DevOps** | Infrastructure changes, new services, deployment changes | CI/CD impact? Monitoring needs? Rollback strategy? |
| **UX** | User-facing features | User flow impact? Accessibility? Error states? |
| **Data** | Data model changes, new data sources | Schema impact? Migration strategy? Data integrity? |

### Perspective Review Format

During brainstorming, each required perspective should be explicitly addressed:

```markdown
## Perspective Reviews

### Architecture (@tech-lead)
- **Alignment:** [Does this fit our architecture? Why/why not?]
- **Patterns:** [What existing patterns apply?]
- **Concerns:** [Any architectural risks?]
- **Decision:** [Approved / Needs changes / Rejected]

### Security
- **Auth Impact:** [How does this affect auth/authorization?]
- **Data Exposure:** [What data is exposed? To whom?]
- **Validation:** [What input validation is needed?]
- **Concerns:** [Any security risks?]

### Testing (@test-engineer)
- **Test Strategy:** [How will this be tested?]
- **Test Types:** [Unit, integration, E2E, etc.]
- **Coverage Target:** [What coverage is expected?]
- **Edge Cases:** [What edge cases need coverage?]
```

### Enforcement

- Brainstorming skill MUST prompt for each required perspective
- Plan documents MUST include perspective reviews
- Missing perspectives = incomplete plan
- Cannot proceed to implementation without all required perspectives addressed

### When to Skip Multi-Perspective

Multi-perspective planning CAN be skipped only for:
- Bug fixes with clear root cause
- Configuration changes
- Documentation-only changes
- Trivial refactors (no behavior change)

Document the skip reason: `MULTI-PERSPECTIVE: skipped - [reason]`
