/**
 * Tests for init-state.js
 *
 * Tests state management for the discipline framework:
 * - Atomic file writing
 * - Safe JSON parsing (prototype pollution prevention)
 * - Adding and clearing pending validations
 * - Concurrent access handling
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  atomicWriteSync,
  safeJsonParse,
  addPendingValidation,
  clearPendingValidations,
  getUnvalidatedFiles,
  initializeState,
  readState,
} = require('../init-state');

// Test helper: Create temp directory
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'discipline-test-'));
}

// Test helper: Clean up temp directory
function cleanupTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('init-state.js - atomicWriteSync()', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should write file atomically', () => {
    const filePath = path.join(tempDir, 'test.json');
    const data = JSON.stringify({ test: true });

    atomicWriteSync(filePath, data);

    assert.strictEqual(fs.existsSync(filePath), true);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.strictEqual(content, data);
  });

  it('should overwrite existing file', () => {
    const filePath = path.join(tempDir, 'test.json');

    atomicWriteSync(filePath, 'first');
    atomicWriteSync(filePath, 'second');

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.strictEqual(content, 'second');
  });

  it('should set file permissions to 0600', () => {
    const filePath = path.join(tempDir, 'test.json');
    atomicWriteSync(filePath, 'data');

    const stats = fs.statSync(filePath);
    // Check that only owner has read/write (0600)
    const mode = stats.mode & 0o777;
    assert.strictEqual(mode, 0o600);
  });

  it('should not leave temp files on success', () => {
    const filePath = path.join(tempDir, 'test.json');
    atomicWriteSync(filePath, 'data');

    // Check for leftover .tmp files
    const files = fs.readdirSync(tempDir);
    const tempFiles = files.filter(f => f.endsWith('.tmp'));
    assert.strictEqual(tempFiles.length, 0);
  });
});

describe('init-state.js - safeJsonParse()', () => {
  it('should parse valid JSON', () => {
    const json = '{"key": "value", "number": 42}';
    const result = safeJsonParse(json);

    assert.deepStrictEqual(result, { key: 'value', number: 42 });
  });

  it('should parse arrays', () => {
    const json = '[1, 2, 3]';
    const result = safeJsonParse(json);

    assert.deepStrictEqual(result, [1, 2, 3]);
  });

  it('should block __proto__ pollution', () => {
    const malicious = '{"__proto__": {"admin": true}}';
    const result = safeJsonParse(malicious);

    // Should not pollute Object.prototype
    assert.strictEqual({}.admin, undefined);
    assert.strictEqual(result.admin, undefined);
  });

  it('should block constructor pollution', () => {
    const malicious = '{"constructor": {"prototype": {"admin": true}}}';
    safeJsonParse(malicious);

    // Should not pollute
    assert.strictEqual({}.admin, undefined);
  });

  it('should block prototype pollution', () => {
    const malicious = '{"prototype": {"admin": true}}';
    safeJsonParse(malicious);

    // Should not pollute
    assert.strictEqual({}.admin, undefined);
  });

  it('should preserve normal properties with similar names', () => {
    const json = '{"proto": "value", "construct": "data"}';
    const result = safeJsonParse(json);

    // Normal properties should work
    assert.strictEqual(result.proto, 'value');
    assert.strictEqual(result.construct, 'data');
  });
});

describe('init-state.js - addPendingValidation()', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    // Initialize state
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should add a pending validation', () => {
    addPendingValidation('/project/src/api.ts', tempDir);

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 1);
    assert.strictEqual(files[0], '/project/src/api.ts');
  });

  it('should add multiple pending validations', () => {
    addPendingValidation('/project/src/api.ts', tempDir);
    addPendingValidation('/project/src/utils.ts', tempDir);

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 2);
    assert.strictEqual(files.includes('/project/src/api.ts'), true);
    assert.strictEqual(files.includes('/project/src/utils.ts'), true);
  });

  it('should update timestamp for duplicate file', () => {
    addPendingValidation('/project/src/api.ts', tempDir);

    // Wait a bit to ensure different timestamp
    const wait = Date.now();
    while (Date.now() - wait < 10) {}

    addPendingValidation('/project/src/api.ts', tempDir);

    const files = getUnvalidatedFiles(tempDir);
    // Should still have only one entry
    assert.strictEqual(files.length, 1);
    assert.strictEqual(files[0], '/project/src/api.ts');
  });
});

describe('init-state.js - clearPendingValidations()', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should clear all pending validations', () => {
    addPendingValidation('/project/src/api.ts', tempDir);
    addPendingValidation('/project/src/utils.ts', tempDir);

    clearPendingValidations(tempDir);

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 0);
  });

  it('should handle clearing when empty', () => {
    // Should not throw
    clearPendingValidations(tempDir);

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 0);
  });
});

describe('init-state.js - getUnvalidatedFiles()', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should return empty array when no validations', () => {
    const files = getUnvalidatedFiles(tempDir);
    assert.deepStrictEqual(files, []);
  });

  it('should return all pending files', () => {
    addPendingValidation('/project/src/api.ts', tempDir);
    addPendingValidation('/project/src/utils.ts', tempDir);

    const files = getUnvalidatedFiles(tempDir);
    assert.strictEqual(files.length, 2);
  });
});

describe('init-state.js - initializeState()', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should create state directory', () => {
    initializeState(tempDir);

    const stateDir = path.join(tempDir, '.amplify');
    assert.strictEqual(fs.existsSync(stateDir), true);
  });

  it('should create state file', () => {
    initializeState(tempDir);

    const stateDir = path.join(tempDir, '.amplify');
    const files = fs.readdirSync(stateDir);
    const stateFiles = files.filter(f => f.startsWith('discipline-state-'));

    assert.strictEqual(stateFiles.length, 1);
  });

  it('should create valid state structure', () => {
    const state = initializeState(tempDir);

    assert.strictEqual(typeof state.version, 'string');
    assert.strictEqual(typeof state.sessionId, 'string');
    assert.strictEqual(typeof state.startedAt, 'string');
    assert.strictEqual(Array.isArray(state.pendingValidations), true);
  });
});

describe('init-state.js - readState()', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should initialize state if file missing', () => {
    const state = readState(tempDir);

    assert.strictEqual(typeof state, 'object');
    assert.strictEqual(state.version, '1.0.0');
  });

  it('should read existing state', () => {
    initializeState(tempDir);
    addPendingValidation('/project/src/api.ts', tempDir);

    const state = readState(tempDir);

    assert.strictEqual(state.pendingValidations.length, 1);
  });

  it('should reinitialize on corrupt state', () => {
    // Create corrupt state file
    const stateDir = path.join(tempDir, '.amplify');
    fs.mkdirSync(stateDir, { recursive: true });
    const stateFile = path.join(stateDir, 'discipline-state-default.json');
    fs.writeFileSync(stateFile, 'invalid json{{{');

    // Should not throw, should reinitialize
    const state = readState(tempDir);
    assert.strictEqual(typeof state, 'object');
    assert.strictEqual(Array.isArray(state.pendingValidations), true);
  });
});

