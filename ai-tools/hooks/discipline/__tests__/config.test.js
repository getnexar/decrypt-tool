/**
 * Tests for config.js
 *
 * Tests configuration utilities for the discipline framework:
 * - Source file detection
 * - Allowlist pattern matching
 * - Regex escaping and glob conversion
 * - Safe pattern matching
 * - Test command detection
 * - Path sanitization and security
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const {
  isSourceFile,
  isAllowlisted,
  escapeRegex,
  globToRegex,
  matchesPattern,
  isTestCommand,
  sanitizePath,
  isPathWithinRoot,
} = require('../config');

describe('config.js - isSourceFile()', () => {
  it('should detect files in source directories', () => {
    const projectRoot = '/project';
    assert.strictEqual(isSourceFile('/project/src/api/tasks.ts', projectRoot), true);
    assert.strictEqual(isSourceFile('/project/lib/utils.js', projectRoot), true);
    assert.strictEqual(isSourceFile('/project/app/main.tsx', projectRoot), true);
  });

  it('should reject files not in source directories', () => {
    const projectRoot = '/project';
    assert.strictEqual(isSourceFile('/project/docs/readme.md', projectRoot), false);
    assert.strictEqual(isSourceFile('/project/tests/api.test.js', projectRoot), false);
    assert.strictEqual(isSourceFile('/project/config.js', projectRoot), false);
  });
});

describe('config.js - isAllowlisted()', () => {
  it('should allowlist config files by extension', () => {
    assert.strictEqual(isAllowlisted('/project/jest.config.js'), true);
    assert.strictEqual(isAllowlisted('/project/webpack.config.ts'), true);
    assert.strictEqual(isAllowlisted('/project/babel.config.mjs'), true);
  });

  it('should allowlist TypeScript declaration files', () => {
    assert.strictEqual(isAllowlisted('/project/src/types.d.ts'), true);
  });

  it('should allowlist by file pattern', () => {
    assert.strictEqual(isAllowlisted('/project/src/index.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/types.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/constants.js'), true);
  });

  it('should allowlist test directories', () => {
    assert.strictEqual(isAllowlisted('/project/src/__tests__/api.test.js'), true);
    assert.strictEqual(isAllowlisted('/project/tests/unit/api.js'), true);
    assert.strictEqual(isAllowlisted('/project/__mocks__/fs.js'), true);
  });

  it('should allowlist by path pattern', () => {
    assert.strictEqual(isAllowlisted('/project/src/api.test.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/api.spec.js'), true);
    assert.strictEqual(isAllowlisted('/project/src/Button.stories.tsx'), true);
  });

  it('should not allowlist production source files', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.ts'), false);
    assert.strictEqual(isAllowlisted('/project/lib/utils.js'), false);
  });
});

describe('config.js - Test File Editing (Validation Loop Support)', () => {
  // These tests verify that test files can be edited when validations are pending
  // This is critical: when fixing tests, you must be able to edit the test file

  it('should allowlist .test.ts files (colocated test)', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.test.ts'), true);
  });

  it('should allowlist .spec.ts files (colocated test)', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.spec.ts'), true);
  });

  it('should allowlist .test.js files', () => {
    assert.strictEqual(isAllowlisted('/project/src/utils.test.js'), true);
  });

  it('should allowlist .spec.js files', () => {
    assert.strictEqual(isAllowlisted('/project/src/utils.spec.js'), true);
  });

  it('should allowlist test files in __tests__ directory', () => {
    assert.strictEqual(isAllowlisted('/project/src/__tests__/tasks.test.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/__tests__/handler.test.js'), true);
  });

  it('should allowlist test files in tests/ directory', () => {
    assert.strictEqual(isAllowlisted('/project/tests/unit/api.test.ts'), true);
    assert.strictEqual(isAllowlisted('/project/tests/integration/db.test.js'), true);
  });

  it('should allowlist test files in test/ directory', () => {
    assert.strictEqual(isAllowlisted('/project/test/unit/api.test.ts'), true);
    assert.strictEqual(isAllowlisted('/project/test/api.js'), true);
  });

  it('should allowlist -test.ts pattern', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks-test.ts'), true);
  });

  it('should allowlist _test.ts pattern', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks_test.ts'), true);
  });

  it('should allowlist mock files', () => {
    assert.strictEqual(isAllowlisted('/project/src/__mocks__/api.ts'), true);
    assert.strictEqual(isAllowlisted('/project/mocks/db.js'), true);
  });

  it('should allowlist fixture files', () => {
    assert.strictEqual(isAllowlisted('/project/src/__fixtures__/data.json'), true);
    assert.strictEqual(isAllowlisted('/project/fixtures/testData.ts'), true);
  });

  it('should NOT allowlist source file that matches similar pattern', () => {
    // "testing.ts" should NOT be allowlisted (it's not a test file)
    // But our patterns use .test. and .spec. with dots
    assert.strictEqual(isAllowlisted('/project/src/testing.ts'), false);
    assert.strictEqual(isAllowlisted('/project/src/contest.ts'), false);
  });
});

describe('config.js - escapeRegex()', () => {
  it('should escape special regex characters', () => {
    assert.strictEqual(escapeRegex('test.js'), 'test\\.js');
    assert.strictEqual(escapeRegex('test*'), 'test\\*');
    assert.strictEqual(escapeRegex('test[0-9]'), 'test\\[0-9\\]');
    assert.strictEqual(escapeRegex('test{1,2}'), 'test\\{1,2\\}');
  });

  it('should escape all regex metacharacters', () => {
    const special = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(special);
    // Should escape every character - backslash will be in the escaped output
    // Check that literal dot is escaped
    assert.strictEqual(escaped.includes('\\.'), true);
  });

  it('should handle empty string', () => {
    assert.strictEqual(escapeRegex(''), '');
  });
});

describe('config.js - globToRegex()', () => {
  it('should convert simple glob patterns', () => {
    const regex = globToRegex('*.js');
    assert.strictEqual(regex.test('test.js'), true);
    assert.strictEqual(regex.test('index.js'), true);
    assert.strictEqual(regex.test('test.ts'), false);
  });

  it('should convert glob with multiple wildcards', () => {
    const regex = globToRegex('*test*.js');
    assert.strictEqual(regex.test('mytest.js'), true);
    assert.strictEqual(regex.test('api.test.js'), true);
    assert.strictEqual(regex.test('api.js'), false);
  });

  it('should handle patterns without wildcards', () => {
    const regex = globToRegex('exact.js');
    assert.strictEqual(regex.test('exact.js'), true);
    assert.strictEqual(regex.test('other.js'), false);
  });

  it('should escape regex special characters in non-wildcard parts', () => {
    const regex = globToRegex('test[0].js');
    assert.strictEqual(regex.test('test[0].js'), true);
    assert.strictEqual(regex.test('test0.js'), false);
  });
});

describe('config.js - matchesPattern()', () => {
  it('should match exact strings', () => {
    assert.strictEqual(matchesPattern('index.ts', 'index.ts'), true);
    assert.strictEqual(matchesPattern('index.ts', 'index.js'), false);
  });

  it('should match glob patterns with wildcards', () => {
    assert.strictEqual(matchesPattern('index.ts', '*.ts'), true);
    assert.strictEqual(matchesPattern('api.test.js', '*.test.js'), true);
    assert.strictEqual(matchesPattern('api.js', '*.test.js'), false);
  });

  it('should not match when pattern has no wildcard and not exact', () => {
    assert.strictEqual(matchesPattern('index.tsx', 'index.ts'), false);
  });

  it('should handle invalid patterns gracefully', () => {
    // Should not throw, should return false
    assert.strictEqual(matchesPattern('test.js', '**[invalid'), false);
  });
});

describe('config.js - isTestCommand()', () => {
  it('should detect npm test commands', () => {
    assert.strictEqual(isTestCommand('npm test'), true);
    assert.strictEqual(isTestCommand('npm run test'), true);
    assert.strictEqual(isTestCommand('npm t'), true);
  });

  it('should detect yarn test commands', () => {
    assert.strictEqual(isTestCommand('yarn test'), true);
    assert.strictEqual(isTestCommand('yarn run test'), true);
  });

  it('should detect pnpm test commands', () => {
    assert.strictEqual(isTestCommand('pnpm test'), true);
    assert.strictEqual(isTestCommand('pnpm run test'), true);
  });

  it('should detect direct test runner commands', () => {
    assert.strictEqual(isTestCommand('jest'), true);
    assert.strictEqual(isTestCommand('jest --coverage'), true);
    assert.strictEqual(isTestCommand('vitest run'), true);
    assert.strictEqual(isTestCommand('pytest tests/'), true);
    assert.strictEqual(isTestCommand('go test ./...'), true);
    assert.strictEqual(isTestCommand('cargo test'), true);
  });

  it('should detect build commands (validation)', () => {
    assert.strictEqual(isTestCommand('npm run build'), true);
    assert.strictEqual(isTestCommand('tsc'), true);
    assert.strictEqual(isTestCommand('cargo build'), true);
  });

  it('should not detect non-test commands', () => {
    assert.strictEqual(isTestCommand('npm install'), false);
    assert.strictEqual(isTestCommand('git commit'), false);
    assert.strictEqual(isTestCommand('ls -la'), false);
    assert.strictEqual(isTestCommand('echo "test"'), false);
  });
});

describe('config.js - sanitizePath()', () => {
  it('should return normalized path for valid input', () => {
    const result = sanitizePath('/project/src/api.ts');
    assert.strictEqual(typeof result, 'string');
    assert.strictEqual(result.includes('..'), false);
  });

  it('should normalize relative paths', () => {
    const result = sanitizePath('src/../lib/utils.js');
    assert.strictEqual(result.includes('..'), false);
    assert.strictEqual(path.basename(result), 'utils.js');
  });

  it('should reject null bytes', () => {
    const result = sanitizePath('/project/src\0api.ts');
    assert.strictEqual(result, null);
  });

  it('should reject null or undefined', () => {
    assert.strictEqual(sanitizePath(null), null);
    assert.strictEqual(sanitizePath(undefined), null);
  });

  it('should reject non-string input', () => {
    assert.strictEqual(sanitizePath(123), null);
    assert.strictEqual(sanitizePath({}), null);
  });
});

describe('config.js - isPathWithinRoot()', () => {
  it('should accept paths within project root', () => {
    assert.strictEqual(isPathWithinRoot('/project/src/api.ts', '/project'), true);
    assert.strictEqual(isPathWithinRoot('/project/lib/utils.js', '/project'), true);
  });

  it('should reject path traversal attempts', () => {
    assert.strictEqual(isPathWithinRoot('/project/../etc/passwd', '/project'), false);
    assert.strictEqual(isPathWithinRoot('/other/project/api.ts', '/project'), false);
  });

  it('should handle Windows-style paths', () => {
    // Skip on non-Windows platforms as path.resolve behaves differently
    if (process.platform === 'win32') {
      const winProject = path.resolve('C:\\project');
      const winFile = path.resolve('C:\\project\\src\\api.ts');
      assert.strictEqual(isPathWithinRoot(winFile, winProject), true);
    } else {
      // On Unix, just verify the function works with Unix paths
      assert.strictEqual(isPathWithinRoot('/project/src/api.ts', '/project'), true);
    }
  });

  it('should accept root path itself', () => {
    assert.strictEqual(isPathWithinRoot('/project', '/project'), true);
  });

  it('should handle trailing slashes', () => {
    assert.strictEqual(isPathWithinRoot('/project/src/', '/project'), true);
    assert.strictEqual(isPathWithinRoot('/project/src', '/project/'), true);
  });
});

describe('config.js - isWorkerSession()', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore environment
    delete process.env.AMPLIFY_SESSION_TYPE;
    delete process.env.AMPLIFY_SESSION_ID;
  });

  it('should return true when AMPLIFY_SESSION_TYPE is worker', () => {
    process.env.AMPLIFY_SESSION_TYPE = 'worker';
    const { isWorkerSession } = require('../config');
    // Re-evaluate by clearing cache
    delete require.cache[require.resolve('../config')];
    const fresh = require('../config');
    assert.strictEqual(fresh.isWorkerSession(), true);
  });

  it('should return false when only AMPLIFY_SESSION_ID is set', () => {
    delete process.env.AMPLIFY_SESSION_TYPE;
    process.env.AMPLIFY_SESSION_ID = 'some-session-id';
    delete require.cache[require.resolve('../config')];
    const fresh = require('../config');
    assert.strictEqual(fresh.isWorkerSession(), false);
  });

  it('should return false when neither env var is set', () => {
    delete process.env.AMPLIFY_SESSION_TYPE;
    delete process.env.AMPLIFY_SESSION_ID;
    delete require.cache[require.resolve('../config')];
    const fresh = require('../config');
    assert.strictEqual(fresh.isWorkerSession(), false);
  });

  it('should return false when AMPLIFY_SESSION_TYPE is not worker', () => {
    process.env.AMPLIFY_SESSION_TYPE = 'orchestrator';
    delete require.cache[require.resolve('../config')];
    const fresh = require('../config');
    assert.strictEqual(fresh.isWorkerSession(), false);
  });
});

describe('config.js - isFailClosedMode()', () => {
  afterEach(() => {
    // Restore environment
    delete process.env.DISCIPLINE_FAIL_CLOSED;
    // Clear module cache to reset the module state
    delete require.cache[require.resolve('../config')];
  });

  it('should return true when DISCIPLINE_FAIL_CLOSED is 1', () => {
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

  it('should return false when DISCIPLINE_FAIL_CLOSED is 0', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '0';
    delete require.cache[require.resolve('../config')];
    const { isFailClosedMode } = require('../config');
    assert.strictEqual(isFailClosedMode(), false);
  });

  it('should return false when DISCIPLINE_FAIL_CLOSED is empty string', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = '';
    delete require.cache[require.resolve('../config')];
    const { isFailClosedMode } = require('../config');
    assert.strictEqual(isFailClosedMode(), false);
  });

  it('should return false when DISCIPLINE_FAIL_CLOSED is any other value', () => {
    process.env.DISCIPLINE_FAIL_CLOSED = 'true';
    delete require.cache[require.resolve('../config')];
    const { isFailClosedMode } = require('../config');
    assert.strictEqual(isFailClosedMode(), false);
  });
});
