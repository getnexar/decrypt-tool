/**
 * Tests for security vulnerabilities
 *
 * Tests security protections in the discipline framework:
 * - Path traversal attacks
 * - Null byte injection
 * - Prototype pollution
 * - ReDoS prevention
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  sanitizePath,
  isPathWithinRoot,
  matchesPattern,
  globToRegex,
} = require('../config');
const { safeJsonParse } = require('../init-state');

describe('security - Path Traversal', () => {
  it('should reject ../ path traversal', () => {
    const malicious = '/project/../etc/passwd';
    const projectRoot = '/project';

    assert.strictEqual(isPathWithinRoot(malicious, projectRoot), false);
  });

  it('should reject multiple ../ sequences', () => {
    const malicious = '/project/src/../../etc/passwd';
    const projectRoot = '/project';

    assert.strictEqual(isPathWithinRoot(malicious, projectRoot), false);
  });

  it('should reject ../ in middle of path', () => {
    const malicious = '/project/src/../../../etc/passwd';
    const projectRoot = '/project';

    assert.strictEqual(isPathWithinRoot(malicious, projectRoot), false);
  });

  it('should reject absolute path outside project', () => {
    const malicious = '/etc/passwd';
    const projectRoot = '/project';

    assert.strictEqual(isPathWithinRoot(malicious, projectRoot), false);
  });

  it('should accept normal paths within project', () => {
    const normal = '/project/src/api/tasks.ts';
    const projectRoot = '/project';

    assert.strictEqual(isPathWithinRoot(normal, projectRoot), true);
  });

  it('should accept paths with legitimate parent references within project', () => {
    const normal = '/project/src/../lib/utils.js';
    const projectRoot = '/project';

    // After normalization, this becomes /project/lib/utils.js
    assert.strictEqual(isPathWithinRoot(normal, projectRoot), true);
  });
});

describe('security - Null Byte Injection', () => {
  it('should reject paths with null bytes', () => {
    const malicious = '/project/api.ts\0.md';

    assert.strictEqual(sanitizePath(malicious), null);
  });

  it('should reject null byte at start', () => {
    const malicious = '\0/project/api.ts';

    assert.strictEqual(sanitizePath(malicious), null);
  });

  it('should reject null byte at end', () => {
    const malicious = '/project/api.ts\0';

    assert.strictEqual(sanitizePath(malicious), null);
  });

  it('should reject multiple null bytes', () => {
    const malicious = '/pro\0ject/api\0.ts';

    assert.strictEqual(sanitizePath(malicious), null);
  });

  it('should accept normal paths without null bytes', () => {
    const normal = '/project/api.ts';

    assert.notStrictEqual(sanitizePath(normal), null);
  });
});

describe('security - Prototype Pollution', () => {
  it('should block __proto__ pollution', () => {
    const malicious = '{"__proto__": {"admin": true}}';

    safeJsonParse(malicious);

    // Should not pollute Object.prototype
    const testObj = {};
    assert.strictEqual(testObj.admin, undefined);
  });

  it('should block constructor pollution', () => {
    const malicious = '{"constructor": {"prototype": {"admin": true}}}';

    safeJsonParse(malicious);

    // Should not pollute
    const testObj = {};
    assert.strictEqual(testObj.admin, undefined);
  });

  it('should block prototype pollution', () => {
    const malicious = '{"prototype": {"admin": true}}';

    safeJsonParse(malicious);

    // Should not pollute
    const testObj = {};
    assert.strictEqual(testObj.admin, undefined);
  });

  it('should block nested __proto__ pollution', () => {
    const malicious = '{"nested": {"__proto__": {"admin": true}}}';

    safeJsonParse(malicious);

    // Should not pollute
    const testObj = {};
    assert.strictEqual(testObj.admin, undefined);
  });

  it('should preserve normal object properties', () => {
    const normal = '{"name": "test", "value": 42}';

    const result = safeJsonParse(normal);

    assert.strictEqual(result.name, 'test');
    assert.strictEqual(result.value, 42);
  });

  it('should handle arrays without pollution', () => {
    const normal = '[{"__proto__": {"admin": true}}, {"name": "test"}]';

    const result = safeJsonParse(normal);

    // Array should be parsed but not pollute
    assert.strictEqual(Array.isArray(result), true);
    assert.strictEqual(result.length, 2);

    const testObj = {};
    assert.strictEqual(testObj.admin, undefined);
  });
});

describe('security - ReDoS Prevention', () => {
  it('should handle complex glob patterns safely', () => {
    // Pattern that could cause ReDoS with naive regex
    const pattern = '******.js';

    // Should not hang, should handle gracefully
    const regex = globToRegex(pattern);

    // Should be a valid regex
    assert.strictEqual(regex instanceof RegExp, true);
  });

  it('should handle patterns with many wildcards', () => {
    const pattern = '*'.repeat(100);

    // Should not hang
    const regex = globToRegex(pattern);
    assert.strictEqual(regex instanceof RegExp, true);
  });

  it('should safely match patterns without hanging', () => {
    const pattern = '*.test.*.js';
    const filename = 'api.test.unit.js';

    // Should complete quickly
    const matches = matchesPattern(filename, pattern);
    assert.strictEqual(matches, true);
  });

  it('should handle empty pattern', () => {
    const pattern = '';
    const filename = 'test.js';

    // Should not throw
    const matches = matchesPattern(filename, pattern);
    assert.strictEqual(matches, false);
  });

  it('should handle pattern with special regex chars', () => {
    // These should be escaped and not cause ReDoS
    const pattern = 'test[0-9]+{1,100}.js';
    const filename = 'test[0-9]+{1,100}.js';

    const matches = matchesPattern(filename, pattern);
    assert.strictEqual(matches, true);
  });
});

describe('security - Input Validation', () => {
  it('should reject non-string paths in sanitizePath', () => {
    assert.strictEqual(sanitizePath(123), null);
    assert.strictEqual(sanitizePath({}), null);
    assert.strictEqual(sanitizePath([]), null);
    assert.strictEqual(sanitizePath(true), null);
  });

  it('should reject null and undefined in sanitizePath', () => {
    assert.strictEqual(sanitizePath(null), null);
    assert.strictEqual(sanitizePath(undefined), null);
  });

  it('should handle very long paths', () => {
    // Create a very long path
    const longPath = '/project/' + 'a/'.repeat(1000) + 'file.js';

    // Should not crash
    const result = sanitizePath(longPath);
    assert.notStrictEqual(result, null);
  });

  it('should handle paths with unusual but valid characters', () => {
    const path = '/project/file name with spaces.js';
    const result = sanitizePath(path);

    assert.notStrictEqual(result, null);
  });

  it('should handle Unicode in paths', () => {
    const path = '/project/文件.js';
    const result = sanitizePath(path);

    assert.notStrictEqual(result, null);
  });
});

describe('security - Edge Cases', () => {
  it('should handle empty string path', () => {
    assert.strictEqual(sanitizePath(''), null);
  });

  it('should handle root path', () => {
    const result = sanitizePath('/');
    assert.notStrictEqual(result, null);
  });

  it('should handle relative paths', () => {
    const result = sanitizePath('./src/api.ts');
    assert.notStrictEqual(result, null);
  });

  it('should handle Windows-style paths on any platform', () => {
    const winPath = 'C:\\project\\src\\api.ts';
    const result = sanitizePath(winPath);

    // Should normalize for current platform
    assert.notStrictEqual(result, null);
  });

  it('should handle UNC paths', () => {
    const uncPath = '\\\\server\\share\\file.js';
    const result = sanitizePath(uncPath);

    assert.notStrictEqual(result, null);
  });
});

describe('security - Combined Attack Vectors', () => {
  it('should reject path traversal with null byte', () => {
    const malicious = '/project/../etc/passwd\0.txt';

    // Should be rejected by null byte check
    assert.strictEqual(sanitizePath(malicious), null);
  });

  it('should reject multiple attack vectors in JSON', () => {
    // Fix: Properly escape the backslash in JSON string
    const malicious = '{"__proto__": {"admin": true}, "path": "/project/../etc/passwd"}';

    const result = safeJsonParse(malicious);

    // Should not pollute
    const testObj = {};
    assert.strictEqual(testObj.admin, undefined);

    // Path should be in result but not executed
    assert.strictEqual(typeof result.path, 'string');
  });

  it('should handle malformed patterns gracefully', () => {
    // Invalid pattern that should not cause ReDoS or crash
    const pattern = '[[[***{{{';

    // Should not throw or hang
    const matches = matchesPattern('test.js', pattern);
    assert.strictEqual(matches, false);
  });
});
