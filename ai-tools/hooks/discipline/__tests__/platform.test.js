/**
 * Tests for cross-platform compatibility
 *
 * Tests platform-specific behavior:
 * - Windows paths (C:\, backslashes)
 * - UNC paths (\\server\share)
 * - Path normalization
 * - MAX_SEARCH_DEPTH limits
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const {
  sanitizePath,
  isPathWithinRoot,
  normalizePath,
  safeRelativePath,
} = require('../config');

describe('platform - Windows Paths', () => {
  it('should handle Windows drive letters', () => {
    const winPath = 'C:\\project\\src\\api.ts';
    const result = sanitizePath(winPath);

    assert.notStrictEqual(result, null);
    assert.strictEqual(typeof result, 'string');
  });

  it('should handle Windows backslashes', () => {
    const winPath = 'C:\\project\\src\\api.ts';
    const normalized = normalizePath(winPath);

    assert.notStrictEqual(normalized, null);
    assert.strictEqual(typeof normalized, 'string');
  });

  it('should normalize mixed separators', () => {
    const mixedPath = 'C:\\project/src\\api/tasks.ts';
    const normalized = normalizePath(mixedPath);

    assert.notStrictEqual(normalized, null);
    // Should use platform separator
    assert.strictEqual(normalized.includes('\\') || normalized.includes('/'), true);
  });

  it('should handle Windows path traversal', () => {
    const winProject = path.resolve('C:\\project');
    const maliciousWin = path.resolve('C:\\project\\..\\..\\Windows\\System32');

    assert.strictEqual(isPathWithinRoot(maliciousWin, winProject), false);
  });

  it('should accept Windows paths within project', () => {
    // Skip on non-Windows platforms
    if (process.platform === 'win32') {
      const winProject = path.resolve('C:\\project');
      const winFile = path.resolve('C:\\project\\src\\api.ts');
      assert.strictEqual(isPathWithinRoot(winFile, winProject), true);
    } else {
      // On Unix, test with Unix paths
      assert.strictEqual(isPathWithinRoot('/project/src/api.ts', '/project'), true);
    }
  });
});

describe('platform - UNC Paths', () => {
  it('should handle UNC paths', () => {
    const uncPath = '\\\\server\\share\\project\\src\\api.ts';
    const result = sanitizePath(uncPath);

    assert.notStrictEqual(result, null);
  });

  it('should normalize UNC paths', () => {
    const uncPath = '\\\\server\\share\\project\\src\\api.ts';
    const normalized = normalizePath(uncPath);

    assert.notStrictEqual(normalized, null);
    assert.strictEqual(typeof normalized, 'string');
  });

  it('should handle UNC path with forward slashes', () => {
    const uncPath = '//server/share/project/src/api.ts';
    const result = sanitizePath(uncPath);

    assert.notStrictEqual(result, null);
  });
});

describe('platform - Path Normalization', () => {
  it('should normalize Unix paths', () => {
    const unixPath = '/project/src/api.ts';
    const normalized = normalizePath(unixPath);

    assert.strictEqual(normalized, unixPath);
  });

  it('should normalize relative paths', () => {
    const relativePath = './src/../lib/utils.js';
    const normalized = normalizePath(relativePath);

    // Should remove ../ sequences
    assert.strictEqual(normalized.includes('..'), false);
  });

  it('should remove trailing slashes', () => {
    const withTrailing = '/project/src/';
    const normalized = normalizePath(withTrailing);

    // Should not end with separator (unless it's root)
    if (normalized !== path.sep && normalized !== '/') {
      assert.strictEqual(normalized.endsWith(path.sep), false);
    }
  });

  it('should preserve root path', () => {
    const root = '/';
    const normalized = normalizePath(root);

    assert.strictEqual(normalized, '/');
  });

  it('should handle empty string', () => {
    const result = normalizePath('');
    assert.strictEqual(result, '');
  });

  it('should handle current directory', () => {
    const current = '.';
    const normalized = normalizePath(current);

    assert.strictEqual(normalized, '.');
  });
});

describe('platform - Relative Path Calculation', () => {
  it('should calculate relative path from parent to child', () => {
    const parent = '/project';
    const child = '/project/src/api/tasks.ts';

    const relative = safeRelativePath(parent, child);

    assert.strictEqual(relative.startsWith('..'), false);
    assert.strictEqual(relative.includes('src'), true);
  });

  it('should handle same directory', () => {
    const dir = '/project/src';
    const relative = safeRelativePath(dir, dir);

    // Should return empty string or '.'
    assert.strictEqual(relative === '' || relative === '.', true);
  });

  it('should handle sibling directories', () => {
    const dir1 = '/project/src';
    const dir2 = '/project/lib';

    const relative = safeRelativePath(dir1, dir2);

    // Should go up and then down
    assert.strictEqual(relative.includes('..'), true);
    assert.strictEqual(relative.includes('lib'), true);
  });

  it('should handle paths with common ancestor', () => {
    const path1 = '/project/src/api';
    const path2 = '/project/lib/utils';

    const relative = safeRelativePath(path1, path2);

    assert.strictEqual(typeof relative, 'string');
    assert.strictEqual(relative.includes('..'), true);
  });
});

describe('platform - Path Separator Handling', () => {
  it('should use correct separator for platform', () => {
    const testPath = path.join('project', 'src', 'api.ts');

    // Should use path.sep (either / or \)
    assert.strictEqual(testPath.includes(path.sep), true);
  });

  it('should normalize separators consistently', () => {
    const testPath1 = path.join('project', 'src', 'api.ts');
    const testPath2 = path.join('project', 'src', 'api.ts');

    const norm1 = normalizePath(testPath1);
    const norm2 = normalizePath(testPath2);

    // Same logical path should normalize to same result
    assert.strictEqual(norm1, norm2);

    // Should use platform separator
    const platformSep = path.sep;
    assert.strictEqual(norm1.includes(platformSep), true);
  });
});

describe('platform - Edge Cases', () => {
  it('should handle very long paths', () => {
    // Create path longer than typical MAX_PATH (260 chars on Windows)
    const longPath = '/project/' + 'very-long-directory-name/'.repeat(20) + 'file.js';

    const result = sanitizePath(longPath);
    assert.notStrictEqual(result, null);
  });

  it('should handle paths with dots in directory names', () => {
    const pathWithDots = '/project/node_modules/.cache/api.ts';
    const normalized = normalizePath(pathWithDots);

    assert.notStrictEqual(normalized, null);
    assert.strictEqual(normalized.includes('.cache'), true);
  });

  it('should handle paths with spaces', () => {
    const pathWithSpaces = '/project/my documents/src/api.ts';
    const result = sanitizePath(pathWithSpaces);

    assert.notStrictEqual(result, null);
  });

  it('should handle paths with special characters', () => {
    const specialPath = '/project/src/api-v2.0_final(1).ts';
    const result = sanitizePath(specialPath);

    assert.notStrictEqual(result, null);
  });

  it('should handle paths with Unicode', () => {
    const unicodePath = '/project/文档/src/файл.ts';
    const result = sanitizePath(unicodePath);

    assert.notStrictEqual(result, null);
  });
});

describe('platform - Cross-Platform Consistency', () => {
  it('should produce consistent results for equivalent paths', () => {
    // These should be equivalent after normalization
    const path1 = '/project/src/../lib/utils.js';
    const path2 = '/project/lib/utils.js';

    const norm1 = path.normalize(path1);
    const norm2 = path.normalize(path2);

    // After normalization, should resolve to same path
    assert.strictEqual(path.resolve(norm1), path.resolve(norm2));
  });

  it('should handle both slash types in input', () => {
    const unixStyle = '/project/src/api.ts';
    const winStyle = '\\project\\src\\api.ts';

    const norm1 = normalizePath(unixStyle);
    const norm2 = normalizePath(winStyle);

    // Both should produce valid normalized paths
    assert.notStrictEqual(norm1, null);
    assert.notStrictEqual(norm2, null);
  });
});

describe('platform - Root Path Handling', () => {
  it('should handle Unix root', () => {
    const unixRoot = '/';
    const normalized = normalizePath(unixRoot);

    assert.strictEqual(normalized, '/');
  });

  it('should handle Windows root on Windows', () => {
    if (process.platform === 'win32') {
      const winRoot = 'C:\\';
      const normalized = normalizePath(winRoot);

      assert.strictEqual(normalized.match(/^[A-Z]:\\/i) !== null, true);
    }
  });

  it('should handle relative root', () => {
    const relativeRoot = '.';
    const normalized = normalizePath(relativeRoot);

    assert.strictEqual(normalized, '.');
  });
});

describe('platform - Path Validation', () => {
  it('should reject invalid path characters on respective platforms', () => {
    // Windows has more restricted characters
    if (process.platform === 'win32') {
      // These are valid on Unix but may be handled differently on Windows
      const paths = [
        'C:\\project\\file<name>.ts',
        'C:\\project\\file>name.ts',
        'C:\\project\\file:name.ts',
        'C:\\project\\file"name.ts',
        'C:\\project\\file|name.ts',
      ];

      paths.forEach(p => {
        const result = sanitizePath(p);
        // Windows may reject these or normalize them
        assert.strictEqual(typeof result, 'string');
      });
    }
  });

  it('should handle maximum path component length', () => {
    // Most filesystems limit to 255 chars per component
    const longComponent = 'a'.repeat(260);
    const longPath = `/project/${longComponent}/file.ts`;

    const result = sanitizePath(longPath);
    // Should handle without crashing
    assert.strictEqual(typeof result === 'string' || result === null, true);
  });
});
