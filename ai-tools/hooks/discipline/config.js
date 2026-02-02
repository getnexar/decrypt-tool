/**
 * Discipline Framework Configuration
 *
 * Centralized configuration for test-first gates and validation loops.
 * Defines patterns, allowlists, and shared utilities.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// Environment Variables for Bypass
// ============================================================================
//
// BYPASS DESIGN PHILOSOPHY (See PR #33 Review for context)
// ============================================================================
//
// Bypasses are for CONVENIENCE, not security enforcement.
//
// Design Assumptions:
// - Users are good-faith developers who want to write quality code
// - Bypasses exist for legitimate use cases (CI pipelines, emergencies, debugging)
// - The framework aims to provide guardrails, not handcuffs
//
// What Bypasses ARE:
// - Escape hatches for edge cases where discipline blocks legitimate work
// - Temporary overrides during debugging or experimentation
// - CI/CD integrations where tests run in separate pipeline stages
// - Quick fixes during production incidents (with proper follow-up)
//
// What Bypasses are NOT:
// - Security boundaries against malicious users
// - Tamper-proof enforcement mechanisms
// - Audit trails that prevent log manipulation
//
// Audit Log Limitations:
// - Log file is stored at .amplify/discipline-bypass.log
// - Log is plain JSON, 0o644 permissions (readable by user)
// - Users with file access CAN delete or edit the log
// - This is BY DESIGN - the goal is accountability, not prevention
// - For adversarial environments: use git pre-commit hooks + CI enforcement
//
// Worker Session Exemption:
// - Workers check AMPLIFY_SESSION_TYPE === 'worker'
// - This is self-asserted via environment variable
// - Users can spoof this (export AMPLIFY_SESSION_TYPE=worker)
// - This is acceptable because:
//   1. Workers execute pre-approved plans in isolated worktrees
//   2. The framework assumes good-faith developers
//   3. Spoofing bypasses discipline (by design, for convenience)
//   4. Security enforcement belongs in git hooks + CI, not Claude Code hooks
//
// For Security-Critical Environments:
// - Use git pre-commit hooks (can't be bypassed without --no-verify)
// - Enforce in CI/CD pipeline (centralized, not client-side)
// - Consider branch protection rules
// - Use code review requirements
//
// ============================================================================

const BYPASS = {
  TEST_FIRST: process.env.DISCIPLINE_SKIP_TEST_FIRST === '1',
  VALIDATION: process.env.DISCIPLINE_SKIP_VALIDATION === '1',
  ALL: process.env.DISCIPLINE_SKIP_ALL === '1',
};

// ============================================================================
// Fail-Closed Mode Configuration
// ============================================================================
//
// By default, hooks fail OPEN (allow operations on error) for convenience.
// This can be changed by setting DISCIPLINE_FAIL_CLOSED=1.
//
// Fail-Open (default):
// - Hook errors silently allow the operation to proceed
// - Better developer experience, fewer interruptions
// - Framework errors don't block legitimate work
// - Risk: Users may not know when discipline is degraded
//
// Fail-Closed (DISCIPLINE_FAIL_CLOSED=1):
// - Hook errors block the operation
// - Stricter enforcement for users who want guarantees
// - Risk: Broken hooks can block all Edit/Write operations
//
// Use fail-closed when:
// - You want strict discipline enforcement
// - You prefer knowing when the framework fails vs silent degradation
// - You're debugging framework issues
//
// ============================================================================

/**
 * Check if fail-closed mode is enabled
 * When enabled, hook errors will block operations instead of allowing them
 * @returns {boolean} True if fail-closed mode is enabled
 */
function isFailClosedMode() {
  return process.env.DISCIPLINE_FAIL_CLOSED === '1';
}

// Worker sessions are automatically exempt (they execute approved plans)
// Only check AMPLIFY_SESSION_TYPE - session ID alone is not sufficient
// to determine worker mode (orchestrator sessions also have IDs)
//
// NOTE: This check is self-asserted and can be spoofed. See design notes above.
// This is intentional - worker exemption is for convenience, not security.
const isWorkerSession = () => {
  return process.env.AMPLIFY_SESSION_TYPE === 'worker';
};

// ============================================================================
// Source Directory Patterns
// ============================================================================

// Directories considered "source code" that require tests
const SOURCE_DIRECTORIES = [
  'src/',
  'lib/',
  'app/',
  'packages/',
  'modules/',
  'core/',
  'services/',
  'components/',
  'features/',
  'domain/',
  'infrastructure/',
];

// ============================================================================
// Test-First Gate Allowlist
// ============================================================================

// Files exempt from test-first requirement
const TEST_FIRST_ALLOWLIST = {
  // File extensions that never need tests
  extensions: [
    '.config.js',
    '.config.ts',
    '.config.mjs',
    '.config.cjs',
    '.d.ts',          // TypeScript declarations
    '.css',
    '.scss',
    '.less',
    '.md',
    '.json',
    '.yaml',
    '.yml',
    '.env',
    '.env.example',
    '.gitignore',
    '.eslintrc',
    '.prettierrc',
  ],

  // File name patterns (exact match or glob-like)
  filePatterns: [
    'index.ts',       // Barrel exports
    'index.js',
    'types.ts',       // Type-only files
    'types.js',
    'constants.ts',
    'constants.js',
    'config.ts',
    'config.js',
    '.eslintrc.js',
    '.prettierrc.js',
    'jest.config.js',
    'vitest.config.ts',
    'tsconfig.json',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
  ],

  // Directory patterns (files in these dirs are exempt)
  directories: [
    '__tests__/',
    'tests/',
    'test/',
    '__mocks__/',
    'mocks/',
    'fixtures/',
    '__fixtures__/',
    'storybook/',
    'stories/',
    '.storybook/',
    'docs/',
    'documentation/',
  ],

  // Path substring patterns (if path contains these, exempt)
  pathPatterns: [
    '.test.',
    '.spec.',
    '.stories.',
    '-test.',
    '-spec.',
    '_test.',
    '_spec.',
  ],
};

// ============================================================================
// Test File Location Patterns
// ============================================================================

// Where to look for test files relative to source file
const TEST_FILE_PATTERNS = {
  // Colocated tests (next to source file)
  colocated: [
    // src/api/tasks.ts -> src/api/tasks.test.ts
    (srcPath) => srcPath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
    // src/api/tasks.ts -> src/api/tasks.spec.ts
    (srcPath) => srcPath.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
  ],

  // __tests__ directory (sibling)
  testsDir: [
    // src/api/tasks.ts -> src/api/__tests__/tasks.test.ts
    (srcPath) => {
      const dir = path.dirname(srcPath);
      const base = path.basename(srcPath).replace(/\.(ts|tsx|js|jsx)$/, '');
      const ext = srcPath.match(/\.(ts|tsx|js|jsx)$/)?.[1] || 'ts';
      return path.join(dir, '__tests__', `${base}.test.${ext}`);
    },
    // src/api/tasks.ts -> src/api/__tests__/tasks.spec.ts
    (srcPath) => {
      const dir = path.dirname(srcPath);
      const base = path.basename(srcPath).replace(/\.(ts|tsx|js|jsx)$/, '');
      const ext = srcPath.match(/\.(ts|tsx|js|jsx)$/)?.[1] || 'ts';
      return path.join(dir, '__tests__', `${base}.spec.${ext}`);
    },
  ],

  // Root tests directory (mirror structure)
  rootTests: [
    // src/api/tasks.ts -> tests/api/tasks.test.ts
    (srcPath, projectRoot) => {
      const relativePath = safeRelativePath(projectRoot, srcPath);
      // Remove first directory (src/) and add tests/
      const pathParts = relativePath.split(path.sep);
      pathParts.shift(); // Remove 'src' or similar
      const newPath = ['tests', ...pathParts].join(path.sep);
      return path.join(projectRoot, newPath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'));
    },
  ],
};

// ============================================================================
// Validation Loop Configuration
// ============================================================================

/**
 * Sanitize sessionId to prevent path injection
 * @param {string} sessionId - Raw session ID
 * @returns {string} Sanitized session ID
 */
function sanitizeSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return 'default';
  }
  // Remove path separators and special characters
  // Allow only alphanumeric, dash, underscore
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}

/**
 * Get state file path for a project
 * State is stored per-project, per-session
 * @param {string} projectRoot - Project root directory
 * @param {string} sessionId - Session identifier (optional)
 * @returns {string} Path to state file
 */
function getStateFilePath(projectRoot, sessionId = null) {
  const stateDir = path.join(projectRoot, '.amplify');
  const session = sanitizeSessionId(sessionId || process.env.CLAUDE_SESSION_ID || 'default');
  return path.join(stateDir, `discipline-state-${session}.json`);
}

/**
 * Get the state directory for cleanup operations
 * @param {string} projectRoot - Project root directory
 * @returns {string} Path to state directory
 */
function getStateDir(projectRoot) {
  return path.join(projectRoot, '.amplify');
}

// Test execution command patterns (detected in Bash PostToolUse)
const TEST_EXECUTION_PATTERNS = [
  // npm/yarn/pnpm test commands
  /^(npm|yarn|pnpm)\s+(run\s+)?test/i,
  /^(npm|yarn|pnpm)\s+t\b/i,

  // Direct test runners
  /^jest\b/i,
  /^vitest\b/i,
  /^mocha\b/i,
  /^ava\b/i,
  /^tap\b/i,
  /^tape\b/i,
  /^pytest\b/i,
  /^python\s+-m\s+pytest\b/i,
  /^py\.test\b/i,
  /^go\s+test\b/i,
  /^cargo\s+test\b/i,
  /^rspec\b/i,
  /^bundle\s+exec\s+rspec\b/i,
  /^phpunit\b/i,
  /^\.\/vendor\/bin\/phpunit\b/i,

  // Make targets
  /^make\s+test\b/i,
  /^make\s+check\b/i,

  // Build verification (also validates)
  /^(npm|yarn|pnpm)\s+(run\s+)?build/i,
  /^tsc\b/i,
  /^cargo\s+build\b/i,
  /^go\s+build\b/i,
];

// ============================================================================
// Security and Path Utilities
// ============================================================================

/**
 * Escape special regex characters in a string
 * Prevents regex injection attacks
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert glob pattern to regex safely
 * Only supports '*' wildcard, not full glob syntax
 * Prevents ReDoS attacks by limiting pattern complexity
 */
function globToRegex(pattern) {
  // Escape all regex special chars except *
  const escaped = pattern
    .split('*')
    .map(escapeRegex)
    .join('.*');

  return new RegExp(`^${escaped}$`);
}

/**
 * Check if filename matches pattern (safe version)
 * Replaces unsafe regex construction
 */
function matchesPattern(fileName, pattern) {
  // Exact match first
  if (fileName === pattern) return true;

  // If pattern has no wildcard, only exact match counts
  if (!pattern.includes('*')) return false;

  try {
    const regex = globToRegex(pattern);
    return regex.test(fileName);
  } catch {
    // Invalid pattern, skip it
    return false;
  }
}

/**
 * Normalize a file path for cross-platform compatibility
 * Handles: Windows backslashes, UNC paths, trailing slashes
 */
function normalizePath(filePath) {
  if (!filePath) return filePath;

  // Normalize path separators
  let normalized = path.normalize(filePath);

  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith(path.sep)) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Get relative path safely (handles edge cases)
 * Replaces unsafe string replace operations
 */
function safeRelativePath(from, to) {
  const normalFrom = normalizePath(from);
  const normalTo = normalizePath(to);

  // Use path.relative for cross-platform handling
  return path.relative(normalFrom, normalTo);
}

/**
 * Sanitize file path to prevent traversal
 * Rejects null bytes and normalizes path
 */
function sanitizePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // Reject null bytes (potential injection)
  if (filePath.includes('\0')) {
    return null;
  }

  // Normalize to remove ../ sequences
  return path.normalize(filePath);
}

/**
 * Validate that a path is within the allowed project root
 * Prevents path traversal attacks and symlink escape attacks
 *
 * @param {string} filePath - File path to validate
 * @param {string} projectRoot - Project root boundary
 * @returns {boolean} True if path is within project root
 */
function isPathWithinRoot(filePath, projectRoot) {
  let normalizedFile, normalizedRoot;

  try {
    // Resolve symlinks to prevent symlink escape attacks
    // e.g., /project/evil-link -> /etc/passwd
    normalizedFile = fs.realpathSync(filePath);
    normalizedRoot = fs.realpathSync(projectRoot);
  } catch {
    // If realpath fails (broken symlink, permission denied, path doesn't exist),
    // fall back to path.resolve (still catches basic traversal)
    normalizedFile = path.resolve(filePath);
    normalizedRoot = path.resolve(projectRoot);
  }

  // Ensure file path starts with root path
  // Use path.sep to handle both Unix and Windows
  return normalizedFile.startsWith(normalizedRoot + path.sep) ||
         normalizedFile === normalizedRoot;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a file path is in a source directory
 */
function isSourceFile(filePath, projectRoot) {
  const relativePath = safeRelativePath(projectRoot, filePath);
  return SOURCE_DIRECTORIES.some(dir => relativePath.startsWith(dir));
}

/**
 * Check if a file is allowlisted (doesn't need tests)
 */
function isAllowlisted(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = filePath;

  // Check extension allowlist
  for (const ext of TEST_FIRST_ALLOWLIST.extensions) {
    if (filePath.endsWith(ext)) return true;
  }

  // Check file pattern allowlist (using safe pattern matching)
  for (const pattern of TEST_FIRST_ALLOWLIST.filePatterns) {
    if (matchesPattern(fileName, pattern)) return true;
  }

  // Check directory allowlist
  for (const dir of TEST_FIRST_ALLOWLIST.directories) {
    if (relativePath.includes(dir)) return true;
  }

  // Check path pattern allowlist
  for (const pattern of TEST_FIRST_ALLOWLIST.pathPatterns) {
    if (relativePath.includes(pattern)) return true;
  }

  return false;
}

/**
 * Generate possible test file paths for a source file
 */
function getPossibleTestPaths(srcPath, projectRoot) {
  const paths = [];

  // Colocated tests
  for (const fn of TEST_FILE_PATTERNS.colocated) {
    paths.push(fn(srcPath));
  }

  // __tests__ directory
  for (const fn of TEST_FILE_PATTERNS.testsDir) {
    paths.push(fn(srcPath));
  }

  // Root tests directory
  for (const fn of TEST_FILE_PATTERNS.rootTests) {
    paths.push(fn(srcPath, projectRoot));
  }

  return paths;
}

/**
 * Check if a command looks like a test execution
 */
function isTestCommand(command) {
  return TEST_EXECUTION_PATTERNS.some(pattern => pattern.test(command));
}

/**
 * Log bypass usage for audit trail
 * @param {string} bypassType - Type of bypass (test-first, validation, all)
 * @param {string} projectRoot - Project root directory (defaults to cwd)
 */
function logBypassUsage(bypassType, projectRoot = process.cwd()) {
  const logDir = path.join(projectRoot, '.amplify');
  const logFile = path.join(logDir, 'discipline-bypass.log');

  // Ensure directory exists
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
    } catch {
      return; // Silent fail - don't break discipline for logging failure
    }
  }

  const entry = {
    timestamp: new Date().toISOString(),
    user: process.env.USER || process.env.USERNAME || 'unknown',
    bypassType,
    sessionId: process.env.CLAUDE_SESSION_ID || 'unknown',
    pid: process.pid,
  };

  try {
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', { mode: 0o644 });
  } catch {
    // Silent fail - don't break discipline for logging failure
  }
}

/**
 * Check if discipline checks should be skipped (with audit logging)
 *
 * Skip conditions (in order of priority):
 * 1. DISCIPLINE_SKIP_ALL=1 - Explicit full bypass
 * 2. Worker session - Automatically exempt
 * 3. Type-specific bypass (DISCIPLINE_SKIP_TEST_FIRST, DISCIPLINE_SKIP_VALIDATION)
 */
function shouldSkipDiscipline(checkType = 'all') {
  if (BYPASS.ALL) {
    logBypassUsage('all');
    return true;
  }
  if (isWorkerSession()) {
    return true; // Workers exempt, no audit needed
  }

  switch (checkType) {
    case 'test-first':
      if (BYPASS.TEST_FIRST) {
        logBypassUsage('test-first');
        return true;
      }
      return false;
    case 'validation':
      if (BYPASS.VALIDATION) {
        logBypassUsage('validation');
        return true;
      }
      return false;
    default:
      return false;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  BYPASS,
  isWorkerSession,
  isFailClosedMode,
  SOURCE_DIRECTORIES,
  TEST_FIRST_ALLOWLIST,
  TEST_FILE_PATTERNS,
  TEST_EXECUTION_PATTERNS,
  // State management
  getStateFilePath,
  getStateDir,
  sanitizeSessionId,
  // Security and path utilities
  escapeRegex,
  globToRegex,
  matchesPattern,
  normalizePath,
  safeRelativePath,
  sanitizePath,
  isPathWithinRoot,
  // Original utilities
  isSourceFile,
  isAllowlisted,
  getPossibleTestPaths,
  isTestCommand,
  shouldSkipDiscipline,
  logBypassUsage,
};
