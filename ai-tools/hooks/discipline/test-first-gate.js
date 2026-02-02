

/**
 * Test-First Gate Hook (PreToolUse)
 *
 * Blocks Edit/Write operations on source files that don't have corresponding tests.
 * Enforces test-driven development by requiring tests to exist before implementation.
 *
 * Hook Type: PreToolUse
 * Tools: Edit, Write
 */

const fs = require('fs');
const path = require('path');
const {
  isSourceFile,
  isAllowlisted,
  getPossibleTestPaths,
  shouldSkipDiscipline,
  sanitizePath,
  isPathWithinRoot,
  safeRelativePath,
  isFailClosedMode,
} = require('./config');

// ============================================================================
// Project Root Detection
// ============================================================================

const MAX_SEARCH_DEPTH = 50;

/**
 * Find project root by searching for package.json or .git
 * Uses platform-agnostic root detection with symlink cycle detection
 */
function findProjectRoot(startPath) {
  const visited = new Set();
  let searchDir = path.resolve(startPath);
  let depth = 0;

  while (depth < MAX_SEARCH_DEPTH) {
    // Cycle detection (symlink loops)
    // Use realpath to detect when we've visited the same actual directory
    let realPath = searchDir;
    try {
      if (fs.existsSync(searchDir)) {
        realPath = fs.realpathSync(searchDir);
      }
    } catch {
      // If realpath fails, use the original path
    }

    if (visited.has(realPath)) {
      break; // Cycle detected
    }
    visited.add(realPath);

    // Check if we've reached filesystem root (platform-agnostic)
    const parentDir = path.dirname(searchDir);
    if (parentDir === searchDir) {
      break;
    }

    // Check for project markers
    try {
      if (fs.existsSync(path.join(searchDir, 'package.json')) ||
          fs.existsSync(path.join(searchDir, '.git'))) {
        return searchDir;
      }
    } catch {
      // Permission denied or other error, skip this directory
    }

    searchDir = parentDir;
    depth++;
  }

  // Fallback: use current working directory
  return process.cwd();
}

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

function checkTestFirstGate(input) {
  const { tool_name, tool_input } = input;

  // Only check Edit and Write tools
  if (tool_name !== 'Edit' && tool_name !== 'Write') {
    return allow();
  }

  // Skip if discipline is bypassed
  if (shouldSkipDiscipline('test-first')) {
    return allow();
  }

  // Get the file path being modified
  const rawPath = tool_input.file_path || tool_input.filePath;
  const filePath = sanitizePath(rawPath);

  if (!filePath) {
    return allow(); // Invalid path, skip check
  }

  // Determine project root using safe cross-platform detection
  const projectRoot = findProjectRoot(path.dirname(filePath));

  // Validate path is within project
  if (!isPathWithinRoot(filePath, projectRoot)) {
    return allow(); // Path outside project, skip discipline
  }

  // Check if it's a source file
  if (!isSourceFile(filePath, projectRoot)) {
    return allow(); // Not a source file, no test required
  }

  // Check if it's allowlisted
  if (isAllowlisted(filePath)) {
    return allow(); // File type doesn't require tests
  }

  // Look for existing test files
  const possibleTestPaths = getPossibleTestPaths(filePath, projectRoot);
  const existingTestPath = possibleTestPaths.find(testPath => fs.existsSync(testPath));

  if (existingTestPath) {
    return allow(); // Test file exists, proceed
  }

  // No test file found - BLOCK
  const relativePath = safeRelativePath(projectRoot, filePath);
  const suggestedPaths = possibleTestPaths
    .slice(0, 3) // Show top 3 suggestions
    .map(p => `  - ${safeRelativePath(projectRoot, p)}`)
    .join('\n');

  return deny(`
TEST-FIRST GATE BLOCKED

Cannot modify ${relativePath} without tests.

Required: Create test file first at ONE of:
${suggestedPaths}

Then re-attempt this edit.

Bypass: export DISCIPLINE_SKIP_TEST_FIRST=1
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
      const result = checkTestFirstGate(input);
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

      console.error(`[Discipline] Test-first gate error: ${error.message}`);
      if (isFailClosedMode()) {
        // Fail-closed: block operation on error
        console.log(deny(`
DISCIPLINE HOOK ERROR (Fail-Closed Mode)

Hook: test-first-gate
Operation: Edit/Write ${filePath}
Time: ${timestamp}

Error: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

Troubleshooting:
1. Check the stack trace to identify the failing code
2. Verify the file path exists and is valid
3. Check .amplify/discipline-state-*.json for corruption
4. Ensure the project root has a package.json or .git directory

Options:
  - Fix the underlying error
  - Disable strict mode: unset DISCIPLINE_FAIL_CLOSED
  - Bypass this check: export DISCIPLINE_SKIP_TEST_FIRST=1
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

module.exports = { checkTestFirstGate, findProjectRoot };
