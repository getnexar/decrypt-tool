

/**
 * Validation Loop Post-Hook (PostToolUse)
 *
 * Records pending validations after Edit/Write operations on source files.
 * Works with validation-loop-pre.js to enforce the validation feedback loop.
 *
 * Hook Type: PostToolUse
 * Tools: Edit, Write
 */

const path = require('path');
const {
  shouldSkipDiscipline,
  isAllowlisted,
  isSourceFile,
  sanitizePath,
  isPathWithinRoot,
  isFailClosedMode,
} = require('./config');
const {
  addPendingValidation,
} = require('./init-state');
const { findProjectRoot } = require('./test-first-gate');

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
// Main Hook Logic
// ============================================================================

function recordPendingValidation(input) {
  const { tool_name, tool_input, tool_result } = input;

  // Only track Edit and Write tools
  if (tool_name !== 'Edit' && tool_name !== 'Write') {
    return continueExecution();
  }

  // Skip if tool failed
  if (tool_result && tool_result.error) {
    return continueExecution();
  }

  // Skip if discipline is bypassed
  if (shouldSkipDiscipline('validation')) {
    return continueExecution();
  }

  // Get the file path that was modified
  const rawPath = tool_input.file_path || tool_input.filePath;
  const filePath = sanitizePath(rawPath);

  if (!filePath) {
    return continueExecution(); // Invalid path, skip tracking
  }

  // Determine project root for validation
  const projectRoot = findProjectRoot(path.dirname(filePath));

  // Validate path is within project
  if (!isPathWithinRoot(filePath, projectRoot)) {
    return continueExecution(); // Path outside project, skip discipline
  }

  // Don't track allowlisted files (configs, tests, etc.)
  if (isAllowlisted(filePath)) {
    return continueExecution();
  }

  // Only track source files
  if (!isSourceFile(filePath, projectRoot)) {
    return continueExecution();
  }

  // Record this file as needing validation
  addPendingValidation(filePath, projectRoot);

  const relativePath = path.basename(filePath);

  return continueExecution(`
VALIDATION REQUIRED

You modified: ${relativePath}

Before proceeding to other files, you MUST verify this change works:
  - Run related tests
  - Show output

You cannot edit a different file until you validate this one.
`);
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
      const result = recordPendingValidation(input);
      console.log(result);

      process.exit(0);
    } catch (error) {
      // Handle hook error based on fail-closed mode
      // Note: PostToolUse hooks cannot block - operation already happened
      // In fail-closed mode, we report the error prominently
      const timestamp = new Date().toISOString();
      const filePath = (() => {
        try {
          const input = JSON.parse(inputData);
          return input.tool_input?.file_path || input.tool_input?.filePath || 'unknown';
        } catch {
          return 'unknown (parse failed)';
        }
      })();

      console.error(`[Discipline] Validation loop post-hook error: ${error.message}`);
      if (isFailClosedMode()) {
        // Fail-closed: report error prominently (cannot block PostToolUse)
        console.log(continueExecution(`
DISCIPLINE HOOK ERROR (Fail-Closed Mode)

Hook: validation-loop-post
Operation: Edit/Write ${filePath} (already completed)
Time: ${timestamp}

Error: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

IMPORTANT: PostToolUse hooks cannot block operations that already completed.
The file modification was NOT tracked for validation. Consequences:
  - The validation loop may not enforce tests for this file
  - You should run tests manually to validate: ${filePath}

Troubleshooting:
1. Check the stack trace to identify the failing code
2. Verify .amplify/discipline-state-*.json is writable
3. Check disk space on the filesystem
4. Manually run tests to ensure changes are validated

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

module.exports = { recordPendingValidation };
