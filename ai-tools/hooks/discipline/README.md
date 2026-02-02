# Discipline Framework

A 2-part framework that provides **active resistance to poor decisions** and **enforces validation during work**.

## Components

### 1. Test-First Gates (PreToolUse hook)
- Blocks `Edit`/`Write` on source files without corresponding tests
- Automatically allowlists configs, types, test files, markdown, etc.
- Clear error messages with suggested test file locations

### 2. Validation Loops (Pre/PostToolUse hooks)
- Records pending validations after source file modifications
- Blocks editing different files until previous changes are validated
- Automatically clears validations when test commands run successfully
- Detects test pass/fail from output and exit codes

## Usage

### Bypass Mechanisms

```bash
# Skip test-first gate only
export DISCIPLINE_SKIP_TEST_FIRST=1

# Skip validation loop only
export DISCIPLINE_SKIP_VALIDATION=1

# Skip all discipline checks
export DISCIPLINE_SKIP_ALL=1
```

### Strict Mode (Fail-Closed)

By default, hooks **fail open** - if a hook encounters an error (JSON parsing crash, filesystem full, etc.), it allows the operation to proceed. This provides the best developer experience but means you may not know when discipline is degraded.

For stricter enforcement, enable **fail-closed mode**:

```bash
# Reject operations on hook errors (default: allow)
export DISCIPLINE_FAIL_CLOSED=1
```

**Fail-Closed Behavior:**
- PreToolUse hooks (test-first-gate, validation-loop-pre): Block the operation with clear error message
- PostToolUse hooks (validation-loop-post, validation-loop-bash): Report error prominently (cannot block - operation already completed)

**When to use fail-closed:**
- You want strict discipline enforcement
- You prefer knowing when the framework fails vs silent degradation
- You're debugging framework issues
- Your team has a zero-tolerance policy for quality shortcuts

**Trade-offs:**
- Pro: You'll know immediately if the framework breaks
- Con: Broken hooks can block all Edit/Write operations until fixed

### Worker Sessions

Worker sessions (AMPLIFY_SESSION_TYPE=worker) are automatically exempt from discipline checks. This is because workers execute pre-approved plans in isolated worktrees.

## Design Philosophy

### Bypasses are for Convenience, Not Security

The bypass mechanisms assume **good-faith developers** who want to write quality code. They exist for legitimate use cases:

- CI/CD pipelines where tests run in separate stages
- Emergency production fixes (with proper follow-up)
- Debugging and experimentation
- Edge cases where discipline blocks legitimate work

The audit log (`discipline-bypass.log`) provides **accountability**, not **tamper-proofing**. Users with file access can manipulate logs - this is expected.

### For Security Enforcement

If you need security enforcement (not just development discipline), use:

1. **Git pre-commit hooks** - Cannot be bypassed without `--no-verify`
2. **CI/CD pipeline checks** - Centralized, not client-side
3. **Branch protection rules** - Require reviews before merge
4. **Code review requirements** - Human oversight

### Concurrency Limitations

The framework uses optimistic locking for state management:

- Read-modify-write is **NOT atomic** across processes
- Primary use case is single-user Claude Code sessions
- Worst case is duplicate/lost validation entry (not corruption)
- Atomic file writes (temp + rename) prevent file corruption

For multi-process scenarios, consider using git hooks or CI enforcement instead.

### Known Limitations

**Validation tracking is per-session:**
Restarting Claude Code creates a new session with empty state. Pending validations from previous sessions are not migrated. This means:
- Restarting Claude Code will clear validation enforcement
- Users could bypass validation by restarting their session
- This is acceptable for the primary use case (single-user good-faith development)

**State fragmentation:**
Each Claude Code session has its own state file (`discipline-state-<sessionId>.json`). State is not shared across sessions. If you want validation enforcement across sessions, consider using git pre-commit hooks.

## Files

| File | Purpose |
|------|---------|
| `config.js` | Centralized configuration, patterns, utilities |
| `init-state.js` | State management (pending validations) |
| `test-first-gate.js` | PreToolUse hook for test-first enforcement |
| `validation-loop-pre.js` | PreToolUse hook for validation blocking |
| `validation-loop-post.js` | PostToolUse hook for validation recording |
| `validation-loop-bash.js` | PostToolUse hook for test detection |

## Testing

```bash
# Run all discipline framework tests
npm test -- ai-tools/hooks/discipline/__tests__/*.test.js

# Run specific test suite
npm test -- ai-tools/hooks/discipline/__tests__/config.test.js
```

## State Files

State is stored in `.amplify/` directory:

- `discipline-state-<sessionId>.json` - Pending validations
- `discipline-bypass.log` - Audit trail for bypass usage

State files older than 24 hours are automatically cleaned up on session start.
