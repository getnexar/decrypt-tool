

/**
 * Validation Loop Pre-Hook (PreToolUse)
 *
 * Blocks Edit/Write operations when there are unvalidated changes pending.
 * Forces a validation feedback loop: Change -> Validate -> Change.
 *
 * Hook Type: PreToolUse
 * Tools: Edit, Write
 */

const path = require('path');
const {
  shouldSkipDiscipline,
  isAllowlisted,
  sanitizePath,
  isPathWithinRoot,
  isFailClosedMode,
} = require('./config');
const {
  getValidationState,
} = require('./init-state');
const { findProjectRoot } = require('./test-first-gate');

// ============================================================================
// Hook Response Helpers
// ============================================================================

function allow() {
  return JSON.stringify({ decision: 'allow' });
}

function deny(message) {
  return JSON.stringify({
    decision: 'deny',
    message,
  });
}

// ============================================================================
// Main Hook Logic
// ============================================================================

function checkValidationLoop(input) {
  const { tool_name, tool_input } = input;

  // Only check Edit and Write tools
  if (tool_name !== 'Edit' && tool_name !== 'Write') {
    return allow();
  }

  // Skip if discipline is bypassed
  if (shouldSkipDiscipline('validation')) {
    return allow();
  }

  // Get the file path being modified
  const rawPath = tool_input.file_path || tool_input.filePath;
  const filePath = sanitizePath(rawPath);

  if (!filePath) {
    return allow(); // Invalid path, skip check
  }

  // Determine project root for path validation
  const projectRoot = findProjectRoot(path.dirname(filePath));

  // Validate path is within project
  if (!isPathWithinRoot(filePath, projectRoot)) {
    return allow(); // Path outside project, skip discipline
  }

  // Allow modifications to allowlisted files (configs, tests, etc.)
  if (isAllowlisted(filePath)) {
    return allow();
  }

  // Check for pending validations (atomic read to prevent race conditions)
  const { hasPending, unvalidatedFiles } = getValidationState(projectRoot);
  if (!hasPending) {
    return allow(); // No pending validations, proceed
  }

  // There are unvalidated changes - check if this is a different file

  // Allow editing the same file (continuing work on it)
  // Normalize paths to handle different path representations
  if (unvalidatedFiles.length === 1) {
    const normalizedFilePath = path.resolve(filePath);
    const normalizedUnvalidated = path.resolve(unvalidatedFiles[0]);
    if (normalizedUnvalidated === normalizedFilePath) {
      return allow();
    }
  }

  // Block editing a different file when validations are pending
  const fileList = unvalidatedFiles
    .slice(0, 5)
    .map(f => `  - ${path.basename(f)}`)
    .join('\n');

  const moreCount = unvalidatedFiles.length > 5
    ? `\n  ... and ${unvalidatedFiles.length - 5} more`
    : '';

  return deny(`
VALIDATION REQUIRED

You modified files that haven't been validated:
${fileList}${moreCount}

Before proceeding, you MUST verify these changes work:
  - Run related tests
  - Show output confirming success

You cannot make another edit until you validate previous changes.

Run tests to clear this gate (e.g., npm test, pytest, etc.)

Bypass: export DISCIPLINE_SKIP_VALIDATION=1
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
      const result = checkValidationLoop(input);
      console.log(result);

      process.exit(0);
    } catch (error) {
      // Handle hook error based on fail-closed mode
      const timestamp = new Date().toISOString();
      const filePath = (() => {
        try {
          const input = JSON.parse(inputData);
          return input.tool_input?.file_path || input.tool_input?.filePath || 'unknown';
        } catch {
          return 'unknown (parse failed)';
        }
      })();

      console.error(`[Discipline] Validation loop pre-hook error: ${error.message}`);
      if (isFailClosedMode()) {
        // Fail-closed: block operation on error
        console.log(deny(`
DISCIPLINE HOOK ERROR (Fail-Closed Mode)

Hook: validation-loop-pre
Operation: Edit/Write ${filePath}
Time: ${timestamp}

Error: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

Troubleshooting:
1. Check the stack trace to identify the failing code
2. Verify .amplify/discipline-state-*.json exists and is valid JSON
3. Check file permissions on the .amplify directory
4. Try running tests to clear pending validations

Options:
  - Fix the underlying error
  - Disable strict mode: unset DISCIPLINE_FAIL_CLOSED
  - Bypass this check: export DISCIPLINE_SKIP_VALIDATION=1
`));
      } else {
        // Fail-open (default): allow operation on error
        console.log(allow());
      }
      process.exit(0);
    }
  });
}

// ============================================================================
// Exports
// ============================================================================

module.exports = { checkValidationLoop };
