# Discipline Hooks Test Suite

Comprehensive test suite for the discipline framework hooks.

## Test Coverage

### 1. config.test.js (config.js utilities)
- **isSourceFile()** - Source directory detection
  - Files in `src/`, `lib/`, `app/`, etc.
  - Files outside source directories
- **isAllowlisted()** - Allowlist pattern matching
  - Config files by extension
  - TypeScript declaration files
  - Test directories and files
  - Path patterns
- **escapeRegex()** - Regex escaping
  - Special regex characters
  - All metacharacters
- **globToRegex()** - Safe glob conversion
  - Simple patterns with wildcards
  - Multiple wildcards
  - Patterns without wildcards
- **matchesPattern()** - Safe pattern matching
  - Exact string matching
  - Glob patterns
  - Invalid patterns
- **isTestCommand()** - Test command detection
  - npm/yarn/pnpm test commands
  - Direct test runners (jest, vitest, pytest, etc.)
  - Build commands
- **sanitizePath()** - Path sanitization
  - Valid paths
  - Null byte rejection
  - Input validation
- **isPathWithinRoot()** - Path traversal prevention
  - Paths within project
  - Path traversal attempts
  - Windows and Unix paths

### 2. init-state.test.js (state management)
- **atomicWriteSync()** - Atomic file writing
  - Write and overwrite operations
  - File permissions (0600)
  - Temp file cleanup
- **safeJsonParse()** - Prototype pollution prevention
  - Valid JSON parsing
  - `__proto__` pollution blocking
  - `constructor` pollution blocking
  - `prototype` pollution blocking
- **addPendingValidation()** - Adding validations
  - Single and multiple files
  - Duplicate file handling
- **clearPendingValidations()** - Clearing validations
  - Clear all validations
  - Clear when empty
- **getUnvalidatedFiles()** - Retrieving pending files
  - Empty state
  - Multiple pending files
- **initializeState()** - State initialization
  - Directory creation
  - State file creation
  - Valid state structure
- **readState()** - State reading
  - Initialize if missing
  - Read existing state
  - Reinitialize on corrupt state

### 3. validation-loop.test.js (test detection)
- **extractExitCode()** - Exit code extraction
  - From result objects (exitCode, exit_code, code)
  - From string patterns
  - Missing exit codes
- **verifyTestsActuallyRan()** - Test evidence detection
  - Various test output formats
  - "No tests found" rejection
  - Empty output handling
- **False Positive Prevention** (CRITICAL)
  - "5 deprecated packages" warning
  - Zero tests with exit 0
  - Build success without tests
  - Empty test suites
- **TAP Format Detection**
  - Passing tests
  - Failing tests
  - Non-TAP output
- **JSON Format Detection**
  - Passing tests
  - Failing tests
  - Alternative field names
  - Embedded JSON
  - Invalid JSON handling
- **Legacy Heuristic Detection**
  - Success indicators
  - Failure indicators
  - Ambiguous output

### 4. concurrency.test.js (race conditions)
- **Parallel addPendingValidation**
  - 20 concurrent calls without data loss
  - Rapid add and clear operations
  - Interleaved operations for same file
- **Concurrent Read/Write**
  - Rapid read and write operations
  - Consistency after multiple operations
- **Stale Lock Recovery**
  - Recovery from stale lock files
  - Missing lock file handling
- **Lock Timeout**
  - Lock acquisition with fresh locks
  - Lock cleanup after operations
- **Data Integrity**
  - Multiple rapid operations
  - Rapid duplicate adds

### 5. security.test.js (security vulnerabilities)
- **Path Traversal**
  - `../` sequences
  - Multiple traversal attempts
  - Absolute paths outside project
- **Null Byte Injection**
  - Null bytes in paths
  - Multiple positions
- **Prototype Pollution**
  - `__proto__` pollution
  - `constructor` pollution
  - `prototype` pollution
  - Nested pollution
- **ReDoS Prevention**
  - Complex glob patterns
  - Many wildcards
  - Safe matching without hanging
- **Input Validation**
  - Non-string paths
  - Null and undefined
  - Very long paths
  - Unicode paths

### 6. platform.test.js (cross-platform compatibility)
- **Windows Paths**
  - Drive letters
  - Backslashes
  - Mixed separators
  - Path traversal
- **UNC Paths**
  - Network paths
  - Normalization
- **Path Normalization**
  - Unix paths
  - Relative paths
  - Trailing slashes
  - Root path preservation
- **Relative Path Calculation**
  - Parent to child
  - Same directory
  - Sibling directories
- **Path Separator Handling**
  - Platform-specific separators
  - Consistent normalization
- **Edge Cases**
  - Very long paths
  - Paths with dots
  - Paths with spaces
  - Unicode paths

## Running Tests

```bash
# Run all discipline hooks tests
npm test ai-tools/hooks/discipline/__tests__/*.test.js

# Or using node directly
node --test ai-tools/hooks/discipline/__tests__/*.test.js
```

## Test Statistics

- **Total Tests:** 313
- **Total Suites:** 78
- **Test Files:** 11
- **All Tests Passing:** ✅

## Key Test Cases

### Critical Security Tests
- Prototype pollution via `__proto__`
- Path traversal with `../`
- Null byte injection
- ReDoS prevention

### Critical Concurrency Tests
- 20 parallel operations without data loss
- Stale lock recovery
- Atomic writes

### Critical False Positive Prevention
- "5 deprecated packages" warning (should NOT clear validations)
- Zero tests with exit 0 (should NOT clear validations)
- Build success without tests (should NOT clear validations)

### Critical Skipped Tests Edge Cases
- "0 passed, 5 skipped" (should NOT clear - tests were skipped, not run)
- "Tests: 0 passed (5 skipped)" (should NOT clear)
- "5 passed, 3 skipped" (SHOULD clear - some tests actually ran)

## Important: Validation Loop and Test Files

### Q: Can I edit test files when validations are pending?

**A: YES.** Test files are allowlisted and can always be edited.

The validation loop enforces this workflow:
1. Edit source file -> Validation pending
2. **Edit test file -> ALLOWED (test files are allowlisted)**
3. Run tests -> Validation cleared
4. Edit another source file -> Allowed

### How Test Files Are Allowlisted

Test files are exempt from the validation loop via multiple patterns:

1. **Directory patterns:** Files in these directories are always allowed:
   - `__tests__/`, `tests/`, `test/`
   - `__mocks__/`, `mocks/`
   - `fixtures/`, `__fixtures__/`

2. **Path patterns:** Files containing these substrings are always allowed:
   - `.test.`, `.spec.`
   - `-test.`, `-spec.`
   - `_test.`, `_spec.`
   - `.stories.`

### Examples of Allowlisted Test Files

| File Path | Allowlisted? | Why? |
|-----------|--------------|------|
| `src/api/tasks.test.ts` | ✅ Yes | Contains `.test.` |
| `src/api/tasks.spec.ts` | ✅ Yes | Contains `.spec.` |
| `src/__tests__/tasks.ts` | ✅ Yes | In `__tests__/` dir |
| `tests/unit/api.test.js` | ✅ Yes | In `tests/` dir AND contains `.test.` |
| `src/testing.ts` | ❌ No | Doesn't match patterns |
| `src/api/tasks.ts` | ❌ No | Source file |

### Fixing Failing Tests Workflow

When tests fail, this is the correct workflow:

```
1. Edit source file (src/api/tasks.ts)
   -> "VALIDATION REQUIRED" message shown
   -> State: 1 pending validation

2. Edit test file (src/api/tasks.test.ts)
   -> ALLOWED (test files are allowlisted)
   -> State: still 1 pending validation

3. Run tests (npm test)
   -> Tests pass
   -> "VALIDATION CLEARED" message shown
   -> State: 0 pending validations

4. Edit another source file (src/api/users.ts)
   -> ALLOWED (no pending validations)
```

## Test Framework

Uses Node.js built-in test runner (`node:test`).
