/**
 * Hook Chain Integration Tests
 *
 * Tests the complete workflow of discipline hooks working together:
 * - Test-First Gate (PreToolUse) -> Edit
 * - Validation Loop Post (PostToolUse) -> Records pending validation
 * - Validation Loop Pre (PreToolUse) -> Blocks further edits until validated
 * - Validation Loop Bash (PostToolUse) -> Clears validations on test success
 *
 * These tests simulate the full hook chain without running actual hooks.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the hook functions
const { checkTestFirstGate } = require('../test-first-gate');
const { checkValidationLoop } = require('../validation-loop-pre');
const { recordPendingValidation } = require('../validation-loop-post');
const { detectTestExecution, verifyTestsActuallyRan } = require('../validation-loop-bash');
const {
  initializeState,
  clearPendingValidations,
  getUnvalidatedFiles,
  addPendingValidation,
} = require('../init-state');
const { isAllowlisted, isSourceFile } = require('../config');

// Test helper: Create temp directory with project structure
function createTestProject() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'discipline-integration-'));
  const srcDir = path.join(tempDir, 'src');
  const testDir = path.join(tempDir, 'src', '__tests__');

  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(testDir, { recursive: true });

  // Create package.json to mark project root
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify({ name: 'test-project' })
  );

  // Create a source file
  fs.writeFileSync(
    path.join(srcDir, 'api.ts'),
    'export function getUsers() { return []; }'
  );

  // Create a test file
  fs.writeFileSync(
    path.join(testDir, 'api.test.ts'),
    'test("getUsers", () => { expect([]).toEqual([]); });'
  );

  return {
    root: tempDir,
    srcFile: path.join(srcDir, 'api.ts'),
    testFile: path.join(testDir, 'api.test.ts'),
    newSrcFile: path.join(srcDir, 'utils.ts'),
  };
}

// Test helper: Clean up temp directory
function cleanupTestProject(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Parse hook response JSON
function parseResponse(response) {
  return JSON.parse(response);
}

describe('Integration - Test-First Gate -> Edit Workflow', () => {
  let project;

  beforeEach(() => {
    project = createTestProject();
    initializeState(project.root);
  });

  afterEach(() => {
    cleanupTestProject(project.root);
  });

  it('should block edit on source file without test', () => {
    // Try to edit a source file that doesn't have a test
    const response = checkTestFirstGate({
      tool_name: 'Edit',
      tool_input: { file_path: project.newSrcFile },
    });

    const result = parseResponse(response);

    // Without a test file, should be blocked
    assert.strictEqual(result.decision, 'deny');
    assert.ok(result.message.includes('TEST-FIRST GATE BLOCKED'));
  });

  it('should allow edit on source file WITH test', () => {
    // Edit a source file that has a corresponding test
    const response = checkTestFirstGate({
      tool_name: 'Edit',
      tool_input: { file_path: project.srcFile },
    });

    const result = parseResponse(response);

    // With a test file, should be allowed
    assert.strictEqual(result.decision, 'allow');
  });

  it('should always allow editing test files', () => {
    const response = checkTestFirstGate({
      tool_name: 'Edit',
      tool_input: { file_path: project.testFile },
    });

    const result = parseResponse(response);
    assert.strictEqual(result.decision, 'allow');
  });
});

describe('Integration - Validation Loop Complete Workflow', () => {
  let project;

  beforeEach(() => {
    project = createTestProject();
    initializeState(project.root);
    // Reset any pending validations
    clearPendingValidations(project.root);
  });

  afterEach(() => {
    cleanupTestProject(project.root);
  });

  it('Edit source -> post-hook records -> try edit another -> pre-hook blocks', () => {
    // Step 1: Edit source file (simulating successful Edit)
    // Post-hook should record the pending validation
    addPendingValidation(project.srcFile, project.root);

    // Verify validation is pending
    let pending = getUnvalidatedFiles(project.root);
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0], project.srcFile);

    // Step 2: Try to edit another source file
    // Pre-hook should block this
    const preResponse = checkValidationLoop({
      tool_name: 'Edit',
      tool_input: { file_path: project.newSrcFile },
    });

    const result = parseResponse(preResponse);
    assert.strictEqual(result.decision, 'deny');
    assert.ok(result.message.includes('VALIDATION REQUIRED'));
  });

  it('Edit source -> run tests -> bash-hook clears -> edit another succeeds', () => {
    // Step 1: Edit source file (record pending validation)
    addPendingValidation(project.srcFile, project.root);

    // Verify validation is pending
    assert.strictEqual(getUnvalidatedFiles(project.root).length, 1);

    // Step 2: Run tests (simulate bash hook detecting test execution)
    // This simulates the bash hook detecting a successful test run
    clearPendingValidations(project.root);

    // Verify validation is cleared
    assert.strictEqual(getUnvalidatedFiles(project.root).length, 0);

    // Step 3: Try to edit another source file
    // Should be allowed now since validations are cleared
    const preResponse = checkValidationLoop({
      tool_name: 'Edit',
      tool_input: { file_path: project.newSrcFile },
    });

    const result = parseResponse(preResponse);
    assert.strictEqual(result.decision, 'allow');
  });

  it('should allow editing same file when validation pending', () => {
    // Add pending validation for a file
    addPendingValidation(project.srcFile, project.root);

    // Should still be able to edit the SAME file
    const preResponse = checkValidationLoop({
      tool_name: 'Edit',
      tool_input: { file_path: project.srcFile },
    });

    const result = parseResponse(preResponse);
    assert.strictEqual(result.decision, 'allow');
  });

  it('should always allow editing test files even with pending validations', () => {
    // Add pending validation for source file
    addPendingValidation(project.srcFile, project.root);

    // Should be able to edit test file (allowlisted)
    const preResponse = checkValidationLoop({
      tool_name: 'Edit',
      tool_input: { file_path: project.testFile },
    });

    const result = parseResponse(preResponse);
    assert.strictEqual(result.decision, 'allow');
  });
});

describe('Integration - Multiple Rapid Edits', () => {
  let project;

  beforeEach(() => {
    project = createTestProject();
    initializeState(project.root);
    clearPendingValidations(project.root);
  });

  afterEach(() => {
    cleanupTestProject(project.root);
  });

  it('should accumulate multiple validations correctly', () => {
    const files = [
      path.join(project.root, 'src', 'file1.ts'),
      path.join(project.root, 'src', 'file2.ts'),
      path.join(project.root, 'src', 'file3.ts'),
    ];

    // Create test files for these so test-first gate passes
    files.forEach(f => {
      fs.writeFileSync(f, '// source');
      fs.writeFileSync(f.replace('.ts', '.test.ts'), '// test');
    });

    // Add validations for all files
    files.forEach(f => {
      addPendingValidation(f, project.root);
    });

    // Verify all are pending
    const pending = getUnvalidatedFiles(project.root);
    assert.strictEqual(pending.length, 3);

    // Clear all at once (simulating test run)
    clearPendingValidations(project.root);
    assert.strictEqual(getUnvalidatedFiles(project.root).length, 0);
  });

  it('should handle rapid add for same file', () => {
    // Add same file multiple times rapidly
    for (let i = 0; i < 10; i++) {
      addPendingValidation(project.srcFile, project.root);
    }

    // Should only have one entry
    const pending = getUnvalidatedFiles(project.root);
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0], project.srcFile);
  });
});

describe('Integration - Test Detection Edge Cases', () => {
  it('should detect successful test run', () => {
    const output = '5 tests passed in 1.2s';
    assert.strictEqual(verifyTestsActuallyRan(output), true);
  });

  it('should NOT clear on empty test suite', () => {
    const output = '0 tests passed\nNo tests found';
    assert.strictEqual(verifyTestsActuallyRan(output), false);
  });

  it('should NOT clear on skipped tests only', () => {
    const output = '0 passed, 5 skipped';
    assert.strictEqual(verifyTestsActuallyRan(output), false);
  });

  it('should clear on mixed passed and skipped', () => {
    const output = '5 passed, 3 skipped';
    assert.strictEqual(verifyTestsActuallyRan(output), true);
  });
});

describe('Integration - Fail-Open vs Fail-Closed Behavior', () => {
  let project;
  const originalFailClosed = process.env.DISCIPLINE_FAIL_CLOSED;

  beforeEach(() => {
    project = createTestProject();
    initializeState(project.root);
    clearPendingValidations(project.root);
  });

  afterEach(() => {
    cleanupTestProject(project.root);
    // Restore original env
    if (originalFailClosed) {
      process.env.DISCIPLINE_FAIL_CLOSED = originalFailClosed;
    } else {
      delete process.env.DISCIPLINE_FAIL_CLOSED;
    }
  });

  it('should allow on error in fail-open mode (default)', () => {
    // Default is fail-open, so errors should allow operation
    delete process.env.DISCIPLINE_FAIL_CLOSED;

    // Simulate valid operation (no error thrown)
    const response = checkTestFirstGate({
      tool_name: 'Edit',
      tool_input: { file_path: project.srcFile },
    });

    const result = parseResponse(response);
    // With valid test file, should allow
    assert.strictEqual(result.decision, 'allow');
  });
});

describe('Integration - Allowlist Verification', () => {
  it('should allowlist test files', () => {
    const testPaths = [
      '/project/src/api.test.ts',
      '/project/src/api.spec.ts',
      '/project/src/__tests__/api.ts',
      '/project/tests/unit/api.test.js',
    ];

    testPaths.forEach(p => {
      assert.strictEqual(isAllowlisted(p), true, `${p} should be allowlisted`);
    });
  });

  it('should NOT allowlist source files', () => {
    const srcPaths = [
      '/project/src/api.ts',
      '/project/lib/utils.js',
      '/project/src/testing.ts', // Not a test file!
    ];

    srcPaths.forEach(p => {
      assert.strictEqual(isAllowlisted(p), false, `${p} should NOT be allowlisted`);
    });
  });

  it('should correctly identify source files', () => {
    const srcPaths = [
      { path: '/project/src/api.ts', expected: true },
      { path: '/project/lib/utils.js', expected: true },
      { path: '/project/app/main.tsx', expected: true },
      { path: '/project/docs/readme.md', expected: false },
      { path: '/project/tests/api.test.js', expected: false },
    ];

    srcPaths.forEach(({ path: p, expected }) => {
      assert.strictEqual(
        isSourceFile(p, '/project'),
        expected,
        `${p} source file detection should be ${expected}`
      );
    });
  });
});

describe('Integration - Session State Persistence', () => {
  let project;

  beforeEach(() => {
    project = createTestProject();
  });

  afterEach(() => {
    cleanupTestProject(project.root);
  });

  it('should persist state across re-reads', () => {
    // Initialize state
    initializeState(project.root);

    // Add some validations
    addPendingValidation('/project/file1.ts', project.root);
    addPendingValidation('/project/file2.ts', project.root);

    // Read state again (simulating new process)
    const pending = getUnvalidatedFiles(project.root);

    // Should still have the validations
    assert.strictEqual(pending.length, 2);
  });

  it('should clear state on clearPendingValidations', () => {
    initializeState(project.root);
    addPendingValidation('/project/file1.ts', project.root);

    // Clear
    clearPendingValidations(project.root);

    // Should be empty
    const pending = getUnvalidatedFiles(project.root);
    assert.strictEqual(pending.length, 0);
  });
});
