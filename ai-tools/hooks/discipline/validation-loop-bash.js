

/**
 * Validation Loop Bash Hook (PostToolUse)
 *
 * Detects test execution commands and clears pending validations.
 * Recognizes various test runners: npm test, jest, pytest, go test, etc.
 *
 * Hook Type: PostToolUse
 * Tools: Bash
 */

const {
  shouldSkipDiscipline,
  isTestCommand,
  isFailClosedMode,
} = require('./config');
const {
  clearPendingValidations,
  hasPendingValidations,
  getValidationState,
} = require('./init-state');

// ============================================================================
// Hook Response Helpers
// ============================================================================

function continueExecution(message = null) {
  const result = { continue: true };
  if (message) {
    result.message = message;
  }
  return JSON.stringify(result);
}

// ============================================================================
// Test Detection Helpers
// ============================================================================

/**
 * Extract exit code from tool result
 * @param {*} result - Tool result (object or string)
 * @returns {number|null} - Exit code or null if not determinable
 */
function extractExitCode(result) {
  if (!result) return null;

  // Check for explicit exit code in result object
  if (typeof result === 'object') {
    if ('exitCode' in result) return result.exitCode;
    if ('exit_code' in result) return result.exit_code;
    if ('code' in result) return result.code;
  }

  // Check for exit code in string output
  const resultStr = typeof result === 'string' ? result : JSON.stringify(result);

  // Pattern: "exit code X" or "exited with code X" or "returned X" or "exit status X"
  const exitMatch = resultStr.match(/(?:exit(?:ed)?\s+(?:code|with\s+code|status)\s*[:\s]?\s*|returned\s+)(\d+)/i);
  if (exitMatch) {
    return parseInt(exitMatch[1], 10);
  }

  return null;
}

/**
 * Verify that tests actually ran (not just an empty test suite)
 * @param {*} result - Tool result
 * @returns {boolean} - True if there's positive evidence of tests running
 */
function verifyTestsActuallyRan(result) {
  const resultStr = typeof result === 'string' ? result : JSON.stringify(result || '');

  // REJECT: Explicit "No tests found" patterns
  if (/no\s+tests?\s+(?:found|match)/i.test(resultStr)) {
    return false;
  }

  // REJECT: Empty test suite patterns (exit 0 but no tests actually ran)
  // These patterns are carefully crafted to NOT match when tests are skipped/pending
  // "0 tests passed, 5 skipped" should NOT trigger empty test rejection
  const emptyTestPatterns = [
    // Match "0 tests passed" but NOT if followed by skipped/pending count
    // Uses negative lookahead to exclude "0 passed, N skipped" patterns
    /\b0\s+(?:test|spec)s?\s+passed(?!\s*,\s*\d+\s+(?:skipped|pending))/i,
    // Match "passed: 0" alone (not part of a larger summary)
    /^passed:\s*0$/im,
    // Match "0 passed" but not "0 passed, N failed" or "0 passed (N skipped)"
    /\b0\s+passed\b(?!\s*[,(])/i,
    // Match "test suites: 0 passed" but not with skipped
    /test\s+suites?:\s+0\s+passed(?!\s*,\s*\d+\s+skipped)/i,
    // Match "Tests: 0 passed" but not with skipped/pending
    /Tests:\s+0\s+passed(?!\s*,?\s*\d+\s+(?:skipped|pending))/i,
    // Match "ran 0 tests" (clear indicator of empty suite)
    /ran\s+0\s+tests?\b/i,
  ];

  if (emptyTestPatterns.some(p => p.test(resultStr))) {
    return false;
  }

  // REJECT: Only skipped tests with none passed
  // "0 passed, 5 skipped" or "Tests: 0 passed (5 skipped)" should not clear validations
  const onlySkippedPatterns = [
    /\b0\s+passed\s*,\s*\d+\s+skipped/i,           // "0 passed, 5 skipped"
    /Tests:\s+0\s+passed\s*,?\s*\d+\s+skipped/i,   // "Tests: 0 passed, 5 skipped"
    /\b0\s+passed\s*\(\s*\d+\s+skipped\s*\)/i,     // "0 passed (5 skipped)"
  ];

  if (onlySkippedPatterns.some(p => p.test(resultStr))) {
    return false;
  }

  // Must have POSITIVE evidence of tests running (actual tests, not just skipped)
  // These patterns require at least 1 test to have passed
  const testEvidencePatterns = [
    // Match "N tests passed" where N > 0 (digit followed by more digits or just 1-9)
    /[1-9]\d*\s+(?:test|spec|suite)s?\s+(?:passed|completed|ran|executed)/i,
    // Match "passed: N" where N > 0
    /(?:passed|ok|success):\s*[1-9]\d*/i,
    // Match "N passed" where N > 0 (pytest style)
    /[1-9]\d*\s+passed(?:\s+in\s+[\d.]+s)?/i,
    // Match "Tests: N" where N > 0
    /Tests:\s+[1-9]\d*/i,
    // Match "(N tests)" where N > 0
    /\([1-9]\d*\s+tests?\)/i,
    // Match "ran N tests" where N > 0
    /ran\s+[1-9]\d*\s+tests?/i,
    // Match "test suites: N passed" where N > 0
    /test\s+suites?:\s+[1-9]\d*\s+passed/i,
    // Match "assertions: N" where N > 0
    /assertions?:\s*[1-9]\d*/i,
    // Match "specs: N" where N > 0
    /specs?:\s*[1-9]\d*/i,
    // Match "OK" from many test runners (like unittest, tap)
    /\bOK\b/,
    // Match "All tests passed"
    /all\s+\d+\s+tests?\s+passed/i,
  ];

  return testEvidencePatterns.some(p => p.test(resultStr));
}

/**
 * Detect test results from structured output (TAP, JSON, etc.)
 * @param {*} result - Tool result
 * @param {string} projectRoot - Project root directory
 * @returns {string} - Hook response
 */
function detectFromStructuredOutput(result, projectRoot) {
  const resultStr = typeof result === 'string' ? result : JSON.stringify(result || '');

  // TAP format: "ok 1 - test name" / "not ok 1 - test name"
  const tapOkCount = (resultStr.match(/^ok\s+\d+/gm) || []).length;
  const tapFailCount = (resultStr.match(/^not ok\s+\d+/gm) || []).length;

  if (tapOkCount > 0 || tapFailCount > 0) {
    if (tapFailCount === 0 && tapOkCount > 0) {
      clearPendingValidations(projectRoot);
      return continueExecution(`
VALIDATION CLEARED (TAP format detected)

${tapOkCount} tests passed. Pending validations cleared.
`);
    } else {
      return continueExecution(`
VALIDATION NOT CLEARED

TAP output shows ${tapFailCount} failing tests. Fix before proceeding.
`);
    }
  }

  // JSON format: {"passed": X, "failed": Y}
  try {
    const jsonMatch = resultStr.match(/\{[^{}]*"(?:passed|failed|tests)"[^{}]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      const failed = data.failed || data.failures || data.errors || 0;
      const passed = data.passed || data.successes || data.tests || 0;

      if (failed === 0 && passed > 0) {
        clearPendingValidations(projectRoot);
        return continueExecution(`
VALIDATION CLEARED (JSON format detected)

${passed} tests passed, ${failed} failed. Pending validations cleared.
`);
      } else if (failed > 0) {
        return continueExecution(`
VALIDATION NOT CLEARED

JSON output shows ${failed} failing tests. Fix before proceeding.
`);
      }
    }
  } catch {
    // Ignore JSON parsing errors
  }

  // Last resort: original heuristic (but require BOTH success indicator AND no failure)
  return legacyHeuristicDetection(resultStr, projectRoot);
}

/**
 * Legacy heuristic detection (fallback only)
 * @param {string} resultStr - Result as string
 * @param {string} projectRoot - Project root directory
 * @returns {string} - Hook response
 */
function legacyHeuristicDetection(resultStr, projectRoot) {
  const failurePatterns = [
    /(\d+)\s+(?:test|spec|assertion)s?\s+failed/i,
    /FAIL(?:ED|URE)?\s/,
    /error:\s/i,
    /(\d+)\s+errors?\s+found/i,
    /assertion.*(?:error|fail)/i,
  ];

  const successPatterns = [
    /all\s+\d+\s+tests?\s+passed/i,
    /(\d+)\s+(?:test|spec)s?\s+passed/i,
    /PASS\s/,
    /OK\s*\(/,
    /0\s+fail(?:ure|ed)?s?/i,
  ];

  const hasFailure = failurePatterns.some(p => p.test(resultStr));
  const hasSuccess = successPatterns.some(p => p.test(resultStr));

  // Require explicit success AND no failure (stricter than before)
  if (hasSuccess && !hasFailure) {
    clearPendingValidations(projectRoot);
    return continueExecution(`
VALIDATION CLEARED (heuristic detection)

Test success indicators found. Pending validations cleared.
Note: Consider using a test runner with structured output for more reliable detection.
`);
  }

  if (hasFailure) {
    return continueExecution(`
VALIDATION NOT CLEARED

Test failure indicators detected. Fix failing tests before proceeding.
`);
  }

  // Ambiguous: no clear success or failure
  return continueExecution(`
VALIDATION STATUS UNKNOWN

Could not determine test outcome. Validations remain pending.
To clear validations, ensure tests run with clear success indicators.

Tips:
- Use exit code 0 for success, non-zero for failure
- Include "X tests passed" or "0 failures" in output
- Consider using --reporter=json for structured output
`);
}

// ============================================================================
// Main Hook Logic
// ============================================================================

function detectTestExecution(input) {
  const { tool_name, tool_input, tool_result } = input;

  // Only check Bash tool
  if (tool_name !== 'Bash') {
    return continueExecution();
  }

  // Skip if discipline is bypassed
  if (shouldSkipDiscipline('validation')) {
    return continueExecution();
  }

  // No pending validations, nothing to clear
  // Note: Bash hook uses CWD as projectRoot since we don't have file context
  const projectRoot = process.cwd();
  if (!hasPendingValidations(projectRoot)) {
    return continueExecution();
  }

  // Get the command that was executed
  const command = tool_input.command || '';
  if (!command || !isTestCommand(command)) {
    return continueExecution();
  }

  // PRIMARY: Check exit code
  const exitCode = extractExitCode(tool_result);

  // Exit code 0 = success, non-zero = failure
  // null = couldn't determine (fall back to heuristics)
  if (exitCode !== null) {
    if (exitCode === 0) {
      // SECONDARY: Verify tests actually ran (not empty test suite)
      if (verifyTestsActuallyRan(tool_result)) {
        clearPendingValidations(projectRoot);
        return continueExecution(`
VALIDATION CLEARED

Tests executed successfully (exit code 0). Pending validations cleared.
You may now proceed with additional edits.
`);
      } else {
        return continueExecution(`
VALIDATION NOT CLEARED

Command succeeded but no test execution evidence found.
Ensure tests actually ran before proceeding.

Expected evidence: "X passed", "OK", "tests completed", etc.
`);
      }
    } else {
      return continueExecution(`
VALIDATION NOT CLEARED

Tests failed (exit code ${exitCode}). Pending validations remain.
Fix the failing tests before proceeding with other edits.
`);
    }
  }

  // FALLBACK: Exit code not available, use structured output detection
  return detectFromStructuredOutput(tool_result, projectRoot);
}

// ============================================================================
// Hook Entrypoint
// ============================================================================

if (require.main === module) {
  // Read hook input from stdin
  let inputData = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    inputData += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const input = JSON.parse(inputData);
      const result = detectTestExecution(input);
      console.log(result);

      process.exit(0);
    } catch (error) {
      // Handle hook error based on fail-closed mode
      // Note: PostToolUse hooks cannot block - operation already happened
      // In fail-closed mode, we report the error prominently
      const timestamp = new Date().toISOString();
      const command = (() => {
        try {
          const input = JSON.parse(inputData);
          const cmd = input.tool_input?.command || 'unknown';
          // Truncate long commands for readability
          return cmd.length > 100 ? cmd.substring(0, 100) + '...' : cmd;
        } catch {
          return 'unknown (parse failed)';
        }
      })();

      console.error(`[Discipline] Validation loop bash hook error: ${error.message}`);
      if (isFailClosedMode()) {
        // Fail-closed: report error prominently (cannot block PostToolUse)
        console.log(continueExecution(`
DISCIPLINE HOOK ERROR (Fail-Closed Mode)

Hook: validation-loop-bash
Command: ${command}
Time: ${timestamp}

Error: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

IMPORTANT: PostToolUse hooks cannot block operations that already completed.
Validation state may be inconsistent. Consequences:
  - Pending validations may not have been cleared properly
  - You may need to run tests again to clear validation state

Troubleshooting:
1. Check the stack trace to identify the failing code
2. Verify .amplify/discipline-state-*.json exists and is writable
3. Run tests again to ensure validation state is correct
4. Check if the command was a valid test command

Options:
  - Fix the underlying error
  - Disable strict mode: unset DISCIPLINE_FAIL_CLOSED
`));
      } else {
        // Fail-open (default): continue silently
        console.log(continueExecution());
      }
      process.exit(0);
    }
  });
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  detectTestExecution,
  extractExitCode,
  verifyTestsActuallyRan,
  detectFromStructuredOutput,
  legacyHeuristicDetection,
};
