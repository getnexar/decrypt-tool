/**
 * Tests for validation-loop-bash.js
 *
 * Tests test execution detection and validation clearing:
 * - Exit code extraction
 * - Test evidence detection
 * - False positive prevention
 * - TAP and JSON format parsing
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  extractExitCode,
  verifyTestsActuallyRan,
  detectFromStructuredOutput,
} = require('../validation-loop-bash');

describe('validation-loop-bash.js - extractExitCode()', () => {
  it('should extract from result object with exitCode', () => {
    const result = { exitCode: 0, output: 'tests passed' };
    assert.strictEqual(extractExitCode(result), 0);
  });

  it('should extract from result object with exit_code', () => {
    const result = { exit_code: 1, output: 'tests failed' };
    assert.strictEqual(extractExitCode(result), 1);
  });

  it('should extract from result object with code', () => {
    const result = { code: 2, output: 'error' };
    assert.strictEqual(extractExitCode(result), 2);
  });

  it('should extract from string with "exit code X"', () => {
    const result = 'Command exited with exit code 1';
    assert.strictEqual(extractExitCode(result), 1);
  });

  it('should extract from string with "exited with code X"', () => {
    const result = 'Process exited with code 0';
    assert.strictEqual(extractExitCode(result), 0);
  });

  it('should extract from string with "returned X"', () => {
    const result = 'Command returned 127';
    assert.strictEqual(extractExitCode(result), 127);
  });

  it('should extract from string with "exit status X"', () => {
    const result = 'Process terminated with exit status 2';
    assert.strictEqual(extractExitCode(result), 2);
  });

  it('should return null when no exit code found', () => {
    const result = 'Some output without exit code';
    assert.strictEqual(extractExitCode(result), null);
  });

  it('should return null for null/undefined input', () => {
    assert.strictEqual(extractExitCode(null), null);
    assert.strictEqual(extractExitCode(undefined), null);
  });
});

describe('validation-loop-bash.js - verifyTestsActuallyRan()', () => {
  it('should detect tests from "X tests passed"', () => {
    const result = '5 tests passed in 1.2s';
    assert.strictEqual(verifyTestsActuallyRan(result), true);
  });

  it('should detect tests from "X specs passed"', () => {
    const result = '10 specs passed';
    assert.strictEqual(verifyTestsActuallyRan(result), true);
  });

  it('should detect tests from "passed: X"', () => {
    const result = 'Test results: passed: 5, failed: 0';
    assert.strictEqual(verifyTestsActuallyRan(result), true);
  });

  it('should detect tests from pytest format', () => {
    const result = '5 passed in 0.5s';
    assert.strictEqual(verifyTestsActuallyRan(result), true);
  });

  it('should detect tests from "Tests: X"', () => {
    const result = 'Tests: 15 passed, 0 failed';
    assert.strictEqual(verifyTestsActuallyRan(result), true);
  });

  it('should detect tests from "ran X tests"', () => {
    const result = 'Successfully ran 20 tests';
    assert.strictEqual(verifyTestsActuallyRan(result), true);
  });

  it('should detect tests from "(X tests)"', () => {
    const result = 'All passed (12 tests)';
    assert.strictEqual(verifyTestsActuallyRan(result), true);
  });

  it('should reject "No tests found"', () => {
    const result = 'No tests found matching pattern';
    assert.strictEqual(verifyTestsActuallyRan(result), false);
  });

  it('should reject output with no test indicators', () => {
    const result = 'Build completed successfully';
    assert.strictEqual(verifyTestsActuallyRan(result), false);
  });

  it('should handle empty output', () => {
    assert.strictEqual(verifyTestsActuallyRan(''), false);
    assert.strictEqual(verifyTestsActuallyRan(null), false);
  });
});

describe('validation-loop-bash.js - False Positive Prevention', () => {
  it('should not clear on "5 deprecated packages" warning', () => {
    const result = 'npm WARN deprecated package@1.0.0: Use newer version\n5 packages found';
    assert.strictEqual(verifyTestsActuallyRan(result), false);
  });

  it('should not clear on zero tests with exit 0', () => {
    const result = { exitCode: 0, output: 'No tests found' };
    assert.strictEqual(verifyTestsActuallyRan(result.output), false);
  });

  it('should not clear on build success without tests', () => {
    const result = 'Build completed successfully\nexit code 0';
    assert.strictEqual(verifyTestsActuallyRan(result), false);
  });

  it('should not clear on empty test suite', () => {
    const result = 'Test suite empty\nPassing: 0\nFailing: 0';
    assert.strictEqual(verifyTestsActuallyRan(result), false);
  });
});

describe('validation-loop-bash.js - Zero Test Suite Detection', () => {
  it('should reject "0 tests passed"', () => {
    assert.strictEqual(verifyTestsActuallyRan('0 tests passed'), false);
    assert.strictEqual(verifyTestsActuallyRan('0 specs passed'), false);
  });

  it('should reject "passed: 0"', () => {
    assert.strictEqual(verifyTestsActuallyRan('passed: 0'), false);
    assert.strictEqual(verifyTestsActuallyRan('Test results: passed: 0, failed: 0'), false);
  });

  it('should reject "0 passed" standalone', () => {
    assert.strictEqual(verifyTestsActuallyRan('0 passed in 0.5s'), false);
    assert.strictEqual(verifyTestsActuallyRan('Tests: 0 passed, 0 total'), false);
  });

  it('should reject "test suites: 0 passed"', () => {
    assert.strictEqual(verifyTestsActuallyRan('test suites: 0 passed'), false);
  });

  it('should reject "ran 0 tests"', () => {
    assert.strictEqual(verifyTestsActuallyRan('ran 0 tests'), false);
  });

  it('should accept non-zero test counts', () => {
    assert.strictEqual(verifyTestsActuallyRan('5 tests passed'), true);
    assert.strictEqual(verifyTestsActuallyRan('1 test passed'), true);
    assert.strictEqual(verifyTestsActuallyRan('Tests: 10 passed'), true);
  });
});

describe('validation-loop-bash.js - TAP Format Detection', () => {
  it('should detect TAP format with passing tests', () => {
    const result = `
TAP version 13
1..3
ok 1 - should pass test 1
ok 2 - should pass test 2
ok 3 - should pass test 3
    `;

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('VALIDATION CLEARED'), true);
  });

  it('should detect TAP format with failing tests', () => {
    const result = `
TAP version 13
1..3
ok 1 - should pass test 1
not ok 2 - should fail test 2
ok 3 - should pass test 3
    `;

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('VALIDATION NOT CLEARED'), true);
  });

  it('should not detect TAP format without test indicators', () => {
    const result = 'Some output without TAP format';

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    // Should fall back to legacy detection
    assert.strictEqual(parsed.continue, true);
  });
});

describe('validation-loop-bash.js - JSON Format Detection', () => {
  it('should detect JSON format with passing tests', () => {
    const result = JSON.stringify({
      passed: 10,
      failed: 0,
      total: 10,
    });

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('VALIDATION CLEARED'), true);
  });

  it('should detect JSON format with failing tests', () => {
    const result = JSON.stringify({
      passed: 8,
      failed: 2,
      total: 10,
    });

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('VALIDATION NOT CLEARED'), true);
  });

  it('should handle JSON with alternative field names', () => {
    const result = JSON.stringify({
      successes: 5,
      failures: 0,
      tests: 5,
    });

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('VALIDATION CLEARED'), true);
  });

  it('should handle JSON embedded in other text', () => {
    const result = `
Some output before
{"passed": 5, "failed": 0}
Some output after
    `;

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('VALIDATION CLEARED'), true);
  });

  it('should handle invalid JSON gracefully', () => {
    const result = '{"passed": 5, "failed": invalid}';

    // Should not throw, should fall back
    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
  });
});

describe('validation-loop-bash.js - Skipped Tests Edge Cases', () => {
  it('should NOT clear on "0 passed, 5 skipped"', () => {
    // When all tests are skipped, should not clear validations
    // Tests were not actually run, just skipped
    assert.strictEqual(verifyTestsActuallyRan('0 passed, 5 skipped'), false);
  });

  it('should NOT clear on "0 tests passed\\n5 suites skipped"', () => {
    assert.strictEqual(verifyTestsActuallyRan('0 tests passed\n5 suites skipped'), false);
  });

  it('should NOT clear on "Tests: 0 passed (5 skipped)"', () => {
    assert.strictEqual(verifyTestsActuallyRan('Tests: 0 passed (5 skipped)'), false);
  });

  it('should NOT clear on "Tests: 0 passed, 5 skipped"', () => {
    assert.strictEqual(verifyTestsActuallyRan('Tests: 0 passed, 5 skipped'), false);
  });

  it('should NOT clear on "0 passed, 3 pending"', () => {
    // Pending tests are also not actually run
    assert.strictEqual(verifyTestsActuallyRan('0 passed, 3 pending'), false);
  });

  it('should clear on "5 passed, 3 skipped" (some tests ran)', () => {
    // When some tests passed and some were skipped, validations should clear
    assert.strictEqual(verifyTestsActuallyRan('5 passed, 3 skipped'), true);
  });

  it('should clear on "10 passed in 1.5s"', () => {
    assert.strictEqual(verifyTestsActuallyRan('10 passed in 1.5s'), true);
  });

  it('should NOT clear on jest empty suite', () => {
    const jestEmpty = `
Test Suites: 0 passed, 0 failed, 0 skipped, 0 total
Tests:       0 passed, 0 total
`;
    assert.strictEqual(verifyTestsActuallyRan(jestEmpty), false);
  });

  it('should clear on jest passing suite', () => {
    const jestPassing = `
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
`;
    assert.strictEqual(verifyTestsActuallyRan(jestPassing), true);
  });

  it('should NOT clear on jest all skipped', () => {
    const jestSkipped = `
Test Suites: 0 passed, 1 skipped, 1 total
Tests:       0 passed, 5 skipped, 5 total
`;
    assert.strictEqual(verifyTestsActuallyRan(jestSkipped), false);
  });
});

describe('validation-loop-bash.js - Legacy Heuristic Detection', () => {
  it('should clear on clear success indicators', () => {
    const result = 'All 5 tests passed successfully';

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('VALIDATION CLEARED'), true);
  });

  it('should not clear on failure indicators', () => {
    const result = '2 tests failed';

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('VALIDATION NOT CLEARED'), true);
  });

  it('should not clear on ambiguous output', () => {
    const result = 'Tests completed';

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.continue, true);
    assert.strictEqual(parsed.message.includes('STATUS UNKNOWN'), true);
  });

  it('should detect PASS indicator', () => {
    const result = 'PASS src/api.test.js';

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.message.includes('VALIDATION CLEARED'), true);
  });

  it('should detect OK indicator', () => {
    const result = 'OK (5 tests)';

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.message.includes('VALIDATION CLEARED'), true);
  });

  it('should detect 0 failures', () => {
    const result = '10 tests, 0 failures';

    const output = detectFromStructuredOutput(result);
    const parsed = JSON.parse(output);

    assert.strictEqual(parsed.message.includes('VALIDATION CLEARED'), true);
  });
});
