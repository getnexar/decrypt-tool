/**
 * Tests for fail-closed mode behavior
 *
 * Tests that hooks correctly handle errors based on DISCIPLINE_FAIL_CLOSED mode:
 * - Fail-open (default): Allow operations on hook errors
 * - Fail-closed: Block operations on hook errors (PreToolUse) or report prominently (PostToolUse)
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('Fail-Closed Mode - Test-First Gate', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear module cache
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../test-first-gate')];
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../test-first-gate')];
  });

  it('should allow operation on error when fail-open (default)', () => {
    delete process.env.DISCIPLINE_FAIL_CLOSED;

    // Load fresh modules
    const { checkTestFirstGate } = require('../test-first-gate');

    // Pass invalid input that would cause an error in normal processing
    // The hook should catch the error and return allow
    const result = checkTestFirstGate({
      tool_name: 'Edit',
      tool_input: {
        // Missing file_path entirely
      },
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.decision, 'allow');
  });

  it('should allow valid operations in fail-closed mode', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '1';

    const { checkTestFirstGate } = require('../test-first-gate');

    // Valid input for non-source file should still be allowed
    const result = checkTestFirstGate({
      tool_name: 'Edit',
      tool_input: {
        file_path: '/project/docs/readme.md',
      },
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.decision, 'allow');
  });

  it('should allow non-Edit/Write tools regardless of fail-closed mode', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '1';

    const { checkTestFirstGate } = require('../test-first-gate');

    const result = checkTestFirstGate({
      tool_name: 'Read',
      tool_input: {
        file_path: '/project/src/api.ts',
      },
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.decision, 'allow');
  });
});

describe('Fail-Closed Mode - Validation Loop Pre', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../validation-loop-pre')];
    delete require.cache[require.resolve('../init-state')];
    delete require.cache[require.resolve('../test-first-gate')];
  });

  afterEach(() => {
    process.env = originalEnv;
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../validation-loop-pre')];
    delete require.cache[require.resolve('../init-state')];
    delete require.cache[require.resolve('../test-first-gate')];
  });

  it('should allow operation on error when fail-open (default)', () => {
    delete process.env.DISCIPLINE_FAIL_CLOSED;

    const { checkValidationLoop } = require('../validation-loop-pre');

    // Pass invalid input that would cause an error
    const result = checkValidationLoop({
      tool_name: 'Edit',
      tool_input: {
        // Missing file_path
      },
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.decision, 'allow');
  });

  it('should allow valid operations in fail-closed mode', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '1';

    const { checkValidationLoop } = require('../validation-loop-pre');

    // Valid input for allowlisted file
    const result = checkValidationLoop({
      tool_name: 'Edit',
      tool_input: {
        file_path: '/project/jest.config.js',
      },
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.decision, 'allow');
  });
});

describe('Fail-Closed Mode - Validation Loop Post', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../validation-loop-post')];
    delete require.cache[require.resolve('../init-state')];
    delete require.cache[require.resolve('../test-first-gate')];
  });

  afterEach(() => {
    process.env = originalEnv;
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../validation-loop-post')];
    delete require.cache[require.resolve('../init-state')];
    delete require.cache[require.resolve('../test-first-gate')];
  });

  it('should continue silently on error when fail-open (default)', () => {
    delete process.env.DISCIPLINE_FAIL_CLOSED;

    const { recordPendingValidation } = require('../validation-loop-post');

    // Pass invalid input
    const result = recordPendingValidation({
      tool_name: 'Edit',
      tool_input: {
        // Missing file_path
      },
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.continue, true);
    // In fail-open mode, no message should be present for skipped operations
    assert.strictEqual(parsed.message, undefined);
  });

  it('should continue with message for valid operations', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '1';

    const { recordPendingValidation } = require('../validation-loop-post');

    // Valid input for allowlisted file should continue without validation message
    const result = recordPendingValidation({
      tool_name: 'Edit',
      tool_input: {
        file_path: '/project/jest.config.js',
      },
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.continue, true);
  });
});

describe('Fail-Closed Mode - Validation Loop Bash', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../validation-loop-bash')];
    delete require.cache[require.resolve('../init-state')];
  });

  afterEach(() => {
    process.env = originalEnv;
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../validation-loop-bash')];
    delete require.cache[require.resolve('../init-state')];
  });

  it('should continue silently on error when fail-open (default)', () => {
    delete process.env.DISCIPLINE_FAIL_CLOSED;

    const { detectTestExecution } = require('../validation-loop-bash');

    // Non-Bash tool should continue silently
    const result = detectTestExecution({
      tool_name: 'Read',
      tool_input: {},
      tool_result: {},
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.continue, true);
  });

  it('should continue without error for non-test commands', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '1';

    const { detectTestExecution } = require('../validation-loop-bash');

    // Non-test command
    const result = detectTestExecution({
      tool_name: 'Bash',
      tool_input: {
        command: 'ls -la',
      },
      tool_result: 'file1.txt\nfile2.txt',
    });

    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.continue, true);
  });
});

describe('Fail-Closed Mode - isFailClosedMode function', () => {
  afterEach(() => {
    delete process.env.DISCIPLINE_FAIL_CLOSED;
    delete require.cache[require.resolve('../config')];
  });

  it('should return true when DISCIPLINE_FAIL_CLOSED=1', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '1';
    delete require.cache[require.resolve('../config')];
    const { isFailClosedMode } = require('../config');
    assert.strictEqual(isFailClosedMode(), true);
  });

  it('should return false when DISCIPLINE_FAIL_CLOSED is not set', () => {
    delete process.env.DISCIPLINE_FAIL_CLOSED;
    delete require.cache[require.resolve('../config')];
    const { isFailClosedMode } = require('../config');
    assert.strictEqual(isFailClosedMode(), false);
  });

  it('should return false when DISCIPLINE_FAIL_CLOSED=0', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '0';
    delete require.cache[require.resolve('../config')];
    const { isFailClosedMode } = require('../config');
    assert.strictEqual(isFailClosedMode(), false);
  });

  it('should return false when DISCIPLINE_FAIL_CLOSED=true (must be exactly "1")', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = 'true';
    delete require.cache[require.resolve('../config')];
    const { isFailClosedMode } = require('../config');
    assert.strictEqual(isFailClosedMode(), false);
  });
});
