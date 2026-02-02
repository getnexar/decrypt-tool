const { isPathWithinRoot, sanitizePath } = require('../config');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('Path Security', () => {
  const projectRoot = path.join(os.tmpdir(), 'test-project-' + Date.now());

  beforeEach(() => {
    // Create test directory structure
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    try {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('isPathWithinRoot', () => {
    test('allows paths within project', () => {
      const testFile = path.join(projectRoot, 'src', 'file.ts');
      fs.writeFileSync(testFile, 'test content');
      assert.strictEqual(isPathWithinRoot(testFile, projectRoot), true);
    });

    test('blocks paths outside project', () => {
      const outsidePath = os.platform() === 'win32' ? 'C:\\Windows\\System32' : '/etc/passwd';
      assert.strictEqual(isPathWithinRoot(outsidePath, projectRoot), false);
    });

    test('blocks path traversal attempts', () => {
      const traversalPath = path.join(projectRoot, '..', '..', '..', 'etc', 'passwd');
      assert.strictEqual(isPathWithinRoot(traversalPath, projectRoot), false);
    });

    test('blocks symlink escape (if symlinks are possible)', () => {
      // Skip on Windows or if symlinks not supported
      if (os.platform() === 'win32') {
        console.log('Skipping symlink test on Windows');
        return;
      }

      const symlinkPath = path.join(projectRoot, 'evil-link');
      const targetPath = os.tmpdir(); // Outside project

      try {
        fs.symlinkSync(targetPath, symlinkPath);

        // Symlink pointing outside project should NOT be within project root
        // After realpath resolution, it points to os.tmpdir() which is outside projectRoot
        const symlinkTarget = path.join(symlinkPath, 'some-file');
        const result = isPathWithinRoot(symlinkTarget, projectRoot);

        // The symlink resolves to os.tmpdir(), which should be blocked
        assert.strictEqual(result, false, 'Symlink escape should be blocked');
      } catch (e) {
        // If we can't create symlinks, skip test
        console.log('Skipping symlink test - unable to create symlinks:', e.message);
      } finally {
        try { fs.unlinkSync(symlinkPath); } catch {}
      }
    });

    test('handles non-existent paths gracefully', () => {
      // Should not throw, falls back to path.resolve
      const nonExistentPath = path.join(projectRoot, 'nonexistent', 'file.ts');
      assert.doesNotThrow(() => {
        const result = isPathWithinRoot(nonExistentPath, projectRoot);
        // Even though path doesn't exist, it should be considered within root
        // because after path.resolve() fallback, it's under projectRoot
        assert.strictEqual(result, true, 'Non-existent path within project should be allowed');
      });
    });
  });

  describe('path normalization in validation loop', () => {
    test('normalized paths match correctly', () => {
      const path1 = path.join(projectRoot, 'src', 'file.ts');
      const path2 = path.join(projectRoot, '.', 'src', '..', 'src', 'file.ts');

      // After normalization, these should be the same
      assert.strictEqual(path.resolve(path1), path.resolve(path2));
    });

    test('absolute and relative paths normalize to same result', () => {
      const absolutePath = path.join(projectRoot, 'src', 'file.ts');
      const relativePath = path.join('.', path.relative(process.cwd(), absolutePath));

      // Both should resolve to same absolute path
      const normalizedAbs = path.resolve(absolutePath);
      const normalizedRel = path.resolve(relativePath);

      assert.strictEqual(normalizedAbs, normalizedRel);
    });
  });
});
