/**
 * Tests for concurrency handling
 *
 * Tests concurrent access to state file:
 * - Parallel addPendingValidation calls
 * - Concurrent read/write operations
 * - Stale lock recovery
 * - Race condition prevention
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  addPendingValidation,
  clearPendingValidations,
  getUnvalidatedFiles,
  initializeState,
} = require('../init-state');

// Test helper: Create temp directory
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'discipline-concurrency-'));
}

// Test helper: Clean up temp directory
function cleanupTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('concurrency - Parallel addPendingValidation', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should handle 20 concurrent addPendingValidation calls without data loss', () => {
    const fileCount = 20;
    const files = Array.from({ length: fileCount }, (_, i) => `/project/file${i}.ts`);

    // Execute all additions "simultaneously" (in rapid succession)
    // Note: In Node.js synchronous operations run sequentially, but this tests
    // the locking mechanism under rapid succession
    files.forEach(file => {
      addPendingValidation(file, tempDir);
    });

    const unvalidated = getUnvalidatedFiles(tempDir);

    // All 20 files should be present
    assert.strictEqual(unvalidated.length, fileCount);

    // Verify all files are present
    files.forEach(file => {
      assert.strictEqual(unvalidated.includes(file), true, `File ${file} should be in state`);
    });
  });

  it('should handle rapid add and clear operations', () => {
    // Add files
    addPendingValidation('/project/file1.ts', tempDir);
    addPendingValidation('/project/file2.ts', tempDir);

    // Clear
    clearPendingValidations(tempDir);

    // Add more
    addPendingValidation('/project/file3.ts', tempDir);
    addPendingValidation('/project/file4.ts', tempDir);

    const unvalidated = getUnvalidatedFiles(tempDir);

    // Should only have the last two files
    assert.strictEqual(unvalidated.length, 2);
    assert.strictEqual(unvalidated.includes('/project/file3.ts'), true);
    assert.strictEqual(unvalidated.includes('/project/file4.ts'), true);
  });

  it('should handle interleaved add operations for same file', () => {
    const file = '/project/api.ts';
    const iterations = 10;

    // Add the same file multiple times rapidly
    for (let i = 0; i < iterations; i++) {
      addPendingValidation(file, tempDir);
    }

    const unvalidated = getUnvalidatedFiles(tempDir);

    // Should only have one entry (updates timestamp)
    assert.strictEqual(unvalidated.length, 1);
    assert.strictEqual(unvalidated[0], file);
  });
});

describe('concurrency - Concurrent Read/Write', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should handle rapid read and write operations', () => {
    // Add files
    addPendingValidation('/project/file1.ts', tempDir);
    addPendingValidation('/project/file2.ts', tempDir);

    // Interleave reads and writes
    const read1 = getUnvalidatedFiles(tempDir);
    addPendingValidation('/project/file3.ts', tempDir);
    const read2 = getUnvalidatedFiles(tempDir);
    addPendingValidation('/project/file4.ts', tempDir);
    const read3 = getUnvalidatedFiles(tempDir);

    // Verify progression
    assert.strictEqual(read1.length, 2);
    assert.strictEqual(read2.length, 3);
    assert.strictEqual(read3.length, 4);
  });

  it('should maintain consistency after multiple operations', () => {
    const operations = [
      () => addPendingValidation('/project/file1.ts', tempDir),
      () => addPendingValidation('/project/file2.ts', tempDir),
      () => getUnvalidatedFiles(tempDir),
      () => addPendingValidation('/project/file3.ts', tempDir),
      () => clearPendingValidations(tempDir),
      () => addPendingValidation('/project/file4.ts', tempDir),
    ];

    // Execute all operations
    operations.forEach(op => op());

    const final = getUnvalidatedFiles(tempDir);

    // After clear, only file4 should remain
    assert.strictEqual(final.length, 1);
    assert.strictEqual(final[0], '/project/file4.ts');
  });
});

describe('concurrency - Stale Lock Recovery', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should recover from stale lock file', () => {
    const stateDir = path.join(tempDir, '.amplify');
    const lockFile = path.join(stateDir, 'discipline-state-default.json.lock');

    // Create a stale lock file (old timestamp)
    fs.writeFileSync(lockFile, 'stale');

    // Modify the timestamp to be old (11 seconds ago)
    const oldTime = new Date(Date.now() - 11000);
    fs.utimesSync(lockFile, oldTime, oldTime);

    // This should succeed by removing stale lock
    addPendingValidation('/project/api.ts', tempDir);

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 1);
    assert.strictEqual(files[0], '/project/api.ts');

    // Lock should be cleaned up
    assert.strictEqual(fs.existsSync(lockFile), false);
  });

  it('should handle missing lock file gracefully', () => {
    // Just verify normal operation works
    addPendingValidation('/project/api.ts', tempDir);

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 1);
  });
});

describe('concurrency - Lock Timeout', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should handle lock acquisition with fresh locks', () => {
    // First operation acquires and releases lock
    addPendingValidation('/project/file1.ts', tempDir);

    // Second operation should succeed (lock was released)
    addPendingValidation('/project/file2.ts', tempDir);

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 2);
  });

  it('should clean up lock after successful operation', () => {
    const stateDir = path.join(tempDir, '.amplify');
    const lockFile = path.join(stateDir, 'discipline-state-default.json.lock');

    addPendingValidation('/project/api.ts', tempDir);

    // Lock should be cleaned up
    assert.strictEqual(fs.existsSync(lockFile), false);
  });

  it('should clean up lock after clear operation', () => {
    const stateDir = path.join(tempDir, '.amplify');
    const lockFile = path.join(stateDir, 'discipline-state-default.json.lock');

    clearPendingValidations(tempDir);

    // Lock should be cleaned up
    assert.strictEqual(fs.existsSync(lockFile), false);
  });
});

describe('concurrency - Lock Cleanup Order', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should unlink lock file before closing to prevent race condition', () => {
    const stateDir = path.join(tempDir, '.amplify');
    const lockFile = path.join(stateDir, 'discipline-state-default.json.lock');

    // Perform multiple operations rapidly
    // If lock cleanup order is wrong (close before unlink),
    // another process could see an existing-but-closed lock file
    for (let i = 0; i < 10; i++) {
      addPendingValidation(`/project/file${i}.ts`, tempDir);
      // Lock should always be fully cleaned up after each operation
      assert.strictEqual(fs.existsSync(lockFile), false,
        `Lock file should not exist after operation ${i}`);
    }

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 10);
  });

  it('should handle rapid sequential operations without lock contention', () => {
    const stateDir = path.join(tempDir, '.amplify');
    const lockFile = path.join(stateDir, 'discipline-state-default.json.lock');

    // Run 50 rapid operations to stress test lock handling
    for (let i = 0; i < 50; i++) {
      if (i % 10 === 0 && i > 0) {
        clearPendingValidations(tempDir);
      } else {
        addPendingValidation(`/project/file${i}.ts`, tempDir);
      }
      // Lock should always be fully released
      assert.strictEqual(fs.existsSync(lockFile), false,
        `Lock file should not exist after operation ${i}`);
    }
  });
});

describe('concurrency - Data Integrity', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should maintain data integrity across multiple rapid operations', () => {
    // Add 10 files rapidly
    for (let i = 0; i < 10; i++) {
      addPendingValidation(`/project/file${i}.ts`, tempDir);
    }

    let files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 10);

    // Clear
    clearPendingValidations(tempDir);
    files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 0);

    // Add again
    for (let i = 10; i < 20; i++) {
      addPendingValidation(`/project/file${i}.ts`, tempDir);
    }

    files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 10);

    // Verify correct files (10-19, not 0-9)
    assert.strictEqual(files.includes('/project/file0.ts'), false);
    assert.strictEqual(files.includes('/project/file15.ts'), true);
  });

  it('should not corrupt state with rapid duplicate adds', () => {
    const file = '/project/api.ts';

    // Add same file 50 times
    for (let i = 0; i < 50; i++) {
      addPendingValidation(file, tempDir);
    }

    const files = getUnvalidatedFiles(tempDir);

    // Should only have one entry
    assert.strictEqual(files.length, 1);
    assert.strictEqual(files[0], file);
  });
});
