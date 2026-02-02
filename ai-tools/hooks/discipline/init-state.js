

/**
 * Discipline State Initializer
 *
 * Initializes or resets the discipline state file at session start.
 * Called by SessionStart hook to ensure clean state for each session.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getStateFilePath, getStateDir } = require('./config');

// ============================================================================
// State Schema
// ============================================================================

/**
 * @typedef {Object} PendingValidation
 * @property {string} filePath - Path to the modified file
 * @property {boolean} validated - Whether the change has been validated
 * @property {string} timestamp - ISO timestamp of the change
 */

/**
 * @typedef {Object} DisciplineState
 * @property {string} version - State schema version
 * @property {string} sessionId - Current session identifier
 * @property {string} startedAt - Session start timestamp
 * @property {PendingValidation[]} pendingValidations - Files awaiting validation
 */

// ============================================================================
// State Management
// ============================================================================

/**
 * Parse JSON safely, preventing prototype pollution
 * @param {string} content - JSON string to parse
 * @returns {any} Parsed object
 */
function safeJsonParse(content) {
  const parsed = JSON.parse(content, (key, value) => {
    // Block __proto__ and constructor pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });

  // Ensure it's a plain object/array, not polluted
  if (parsed && typeof parsed === 'object') {
    Object.setPrototypeOf(parsed, parsed instanceof Array ? Array.prototype : Object.prototype);
  }

  return parsed;
}

/**
 * Atomic write using temp file + rename pattern
 * @param {string} filePath - Target file path
 * @param {string} data - Data to write
 */
function atomicWriteSync(filePath, data) {
  const dir = path.dirname(filePath);
  const tempFile = path.join(dir, `.${path.basename(filePath)}.${crypto.randomBytes(6).toString('hex')}.tmp`);

  try {
    fs.writeFileSync(tempFile, data, { mode: 0o600 });
    fs.renameSync(tempFile, filePath);
  } catch (error) {
    // Clean up temp file on failure
    try { fs.unlinkSync(tempFile); } catch {}
    throw error;
  }
}

/**
 * Synchronous locked read-modify-write operation
 *
 * Uses single-attempt locking with stale lock detection. No busy-wait loops.
 * If lock acquisition fails, proceeds without lock (atomic writes still safe).
 *
 * NOTE: This is NOT true optimistic locking (no version checking or retry).
 * It's a best-effort lock for single-process use cases.
 *
 * ============================================================================
 * CONCURRENCY DESIGN DECISION (See PR #33 Review for context)
 * ============================================================================
 *
 * Known Limitation: Read-modify-write is NOT atomic across processes.
 *
 * Race Condition Window:
 *   Time | Session A              | Session B              | Result
 *   T0   | Read: [file1.ts]      |                        |
 *   T1   |                        | Read: [file1.ts]      | Both read same state
 *   T2   | Add file2.ts          |                        |
 *   T3   |                        | Add file3.ts          |
 *   T4   | Write: [file1, file2] |                        | A writes first
 *   T5   |                        | Write: [file1, file3] | B OVERWRITES A's changes
 *   T6   | LOST: file2.ts        |                        | file2 validation lost
 *
 * Why This Is Acceptable:
 * 1. Primary use case is single-user Claude Code sessions (no concurrent access)
 * 2. Atomic file writes (temp file + rename) prevent file corruption
 * 3. Worst case is duplicate or lost validation entry, NOT data corruption
 * 4. Lost validation = user may need to re-run tests (minor inconvenience)
 * 5. Implementing full process-safe locking adds significant complexity
 *
 * Implementation Strategy:
 * - Single lock attempt (no busy-wait to prevent CPU burn)
 * - Stale lock recovery (>10 seconds = abandoned, can be cleaned)
 * - Graceful degradation (proceed without lock, atomic writes still safe)
 *
 * Future Enhancement (if multi-process becomes common):
 * - Consider proper advisory file locking (flock on Unix, LockFile on Windows)
 * - Or use SQLite for atomic transactions
 * - Or implement a lock server for coordination
 *
 * See also: PR #33 team review, concurrency section
 * ============================================================================
 *
 * Rationale:
 * - Hooks run in single-threaded Claude Code context
 * - Atomic file writes (temp + rename) prevent corruption
 * - Worst case race: duplicate validation entry (harmless)
 * - Simplicity > theoretical perfect locking for discipline hooks
 *
 * @param {string} projectRoot - Project root directory
 * @param {Function} operation - Function that modifies state
 * @returns {any} Result from operation
 */
function withStateLockSync(projectRoot, operation) {
  const stateFile = getStateFilePath(projectRoot);
  const lockFile = stateFile + '.lock';
  const lockDir = path.dirname(stateFile);

  // Ensure directory exists
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true, mode: 0o700 });
  }

  // Create state file if missing
  if (!fs.existsSync(stateFile)) {
    atomicWriteSync(stateFile, JSON.stringify(createFreshState(), null, 2));
  }

  // Optimistic locking: try once, clean stale locks, proceed without lock if needed
  let lockFd = null;
  let lockAcquired = false;

  try {
    // Single attempt to acquire lock
    lockFd = fs.openSync(lockFile, 'wx');
    lockAcquired = true;
  } catch (error) {
    if (error.code === 'EEXIST') {
      // Check if lock is stale (> 10 seconds old)
      try {
        const stat = fs.statSync(lockFile);
        if (Date.now() - stat.mtimeMs > 10000) {
          // Stale lock - remove and retry once
          fs.unlinkSync(lockFile);
          try {
            lockFd = fs.openSync(lockFile, 'wx');
            lockAcquired = true;
          } catch {
            // Still failed - proceed without lock
            lockAcquired = false;
          }
        }
        // Lock is fresh - another process has it, proceed without lock
        // (atomic writes still provide safety)
      } catch {
        // Could not stat lock file, proceed without lock
        lockAcquired = false;
      }
    } else {
      // Unexpected error - proceed without lock
      lockAcquired = false;
    }
  }

  try {
    // Read current state
    const content = fs.readFileSync(stateFile, 'utf-8');
    const state = safeJsonParse(content);

    // Execute operation
    const newState = operation(state);

    // Write new state atomically (safe even without lock)
    atomicWriteSync(stateFile, JSON.stringify(newState, null, 2));

    return newState;
  } finally {
    if (lockAcquired && lockFd !== null) {
      // Close FD first to release system resources from THIS process
      // Then delete the lock file
      // This order prevents closing FDs owned by other processes in rare
      // FD recycling scenarios
      fs.closeSync(lockFd);
      try { fs.unlinkSync(lockFile); } catch {}
    }
  }
}

/**
 * Create a fresh discipline state
 */
function createFreshState() {
  return {
    version: '1.0.0',
    sessionId: process.env.CLAUDE_SESSION_ID || `session-${Date.now()}`,
    startedAt: new Date().toISOString(),
    pendingValidations: [],
  };
}

/**
 * Ensure the state directory exists
 * @param {string} projectRoot - Project root directory
 */
function ensureStateDir(projectRoot) {
  const stateDir = getStateDir(projectRoot);
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  }
}


/**
 * Initialize state file with fresh state
 * @param {string} projectRoot - Project root directory
 */
function initializeState(projectRoot = process.cwd()) {
  ensureStateDir(projectRoot);
  const state = createFreshState();
  const stateFile = getStateFilePath(projectRoot);
  atomicWriteSync(stateFile, JSON.stringify(state, null, 2));
  return state;
}

/**
 * Read current state (or initialize if missing)
 * @param {string} projectRoot - Project root directory
 */
function readState(projectRoot = process.cwd()) {
  const stateFile = getStateFilePath(projectRoot);

  try {
    if (fs.existsSync(stateFile)) {
      const content = fs.readFileSync(stateFile, 'utf-8');
      return safeJsonParse(content);
    }
  } catch (error) {
    // Corrupt or unreadable state, will reinitialize
    console.error(`Warning: Could not read discipline state: ${error.message}`);
  }

  return initializeState(projectRoot);
}

/**
 * Write state to file
 * @param {Object} state - State object to write
 * @param {string} projectRoot - Project root directory
 */
function writeState(state, projectRoot = process.cwd()) {
  ensureStateDir(projectRoot);
  const stateFile = getStateFilePath(projectRoot);
  atomicWriteSync(stateFile, JSON.stringify(state, null, 2));
}

/**
 * Add a pending validation
 * @param {string} filePath - File path to mark as needing validation
 * @param {string} projectRoot - Project root directory
 */
function addPendingValidation(filePath, projectRoot = process.cwd()) {
  return withStateLockSync(projectRoot, (state) => {
    // Find existing entry for same file
    const existingIndex = state.pendingValidations.findIndex(
      v => v.filePath === filePath
    );

    const entry = {
      filePath,
      validated: false,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      state.pendingValidations[existingIndex] = entry;
    } else {
      state.pendingValidations.push(entry);
    }

    return state;
  });
}

/**
 * Clear all pending validations (called when tests run)
 * @param {string} projectRoot - Project root directory
 */
function clearPendingValidations(projectRoot = process.cwd()) {
  return withStateLockSync(projectRoot, (state) => {
    state.pendingValidations = [];
    return state;
  });
}

/**
 * Get unvalidated files
 * @param {string} projectRoot - Project root directory
 */
function getUnvalidatedFiles(projectRoot = process.cwd()) {
  const state = readState(projectRoot);
  return state.pendingValidations
    .filter(v => !v.validated)
    .map(v => v.filePath);
}

/**
 * Check if there are pending validations
 * @param {string} projectRoot - Project root directory
 */
function hasPendingValidations(projectRoot = process.cwd()) {
  return getUnvalidatedFiles(projectRoot).length > 0;
}

/**
 * Get validation state atomically (single read)
 * Prevents race conditions between hasPending and getUnvalidated checks
 * @param {string} projectRoot - Project root directory
 * @returns {{hasPending: boolean, unvalidatedFiles: string[]}}
 */
function getValidationState(projectRoot = process.cwd()) {
  const state = readState(projectRoot);
  const unvalidatedFiles = state.pendingValidations
    .filter(v => !v.validated)
    .map(v => v.filePath);

  return {
    hasPending: unvalidatedFiles.length > 0,
    unvalidatedFiles,
  };
}

/**
 * Clean up stale session state files
 * Called on SessionStart hook
 * @param {string} projectRoot - Project root directory
 * @param {number} maxAgeMs - Maximum age in milliseconds (default 24 hours)
 */
function cleanupStaleState(projectRoot = process.cwd(), maxAgeMs = 24 * 60 * 60 * 1000) {
  const stateDir = getStateDir(projectRoot);

  if (!fs.existsSync(stateDir)) return;

  const now = Date.now();
  const files = fs.readdirSync(stateDir);

  for (const file of files) {
    if (!file.startsWith('discipline-state-')) continue;

    const filePath = path.join(stateDir, file);
    try {
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
}

// ============================================================================
// CLI Entrypoint
// ============================================================================

if (require.main === module) {
  const command = process.argv[2];
  const projectRoot = process.cwd();

  switch (command) {
    case 'init':
      const state = initializeState(projectRoot);
      console.log(JSON.stringify({ success: true, state }));
      break;

    case 'status':
      const currentState = readState(projectRoot);
      console.log(JSON.stringify(currentState, null, 2));
      break;

    case 'clear':
      const clearedState = clearPendingValidations(projectRoot);
      console.log(JSON.stringify({ success: true, state: clearedState }));
      break;

    case 'cleanup':
      cleanupStaleState(projectRoot);
      console.log(JSON.stringify({ success: true, message: 'Cleaned up stale state files' }));
      break;

    case 'add':
      const filePath = process.argv[3];
      if (!filePath) {
        console.error('Usage: init-state.js add <filePath>');
        process.exit(1);
      }
      const updatedState = addPendingValidation(filePath, projectRoot);
      console.log(JSON.stringify({ success: true, state: updatedState }));
      break;

    case 'pending':
      const pending = getUnvalidatedFiles(projectRoot);
      console.log(JSON.stringify(pending));
      break;

    default:
      console.log(`
Discipline State Manager

Usage:
  init-state.js init       Initialize fresh state
  init-state.js status     Show current state
  init-state.js clear      Clear all pending validations
  init-state.js cleanup    Clean up stale state files
  init-state.js add <path> Add a pending validation
  init-state.js pending    List unvalidated files
      `);
      process.exit(0);
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  safeJsonParse,
  atomicWriteSync,
  withStateLockSync,
  createFreshState,
  initializeState,
  readState,
  writeState,
  addPendingValidation,
  clearPendingValidations,
  getUnvalidatedFiles,
  hasPendingValidations,
  getValidationState,
  cleanupStaleState,
};
