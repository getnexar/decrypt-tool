/**
 * Performance benchmarks for discipline framework
 *
 * Budgets:
 * - Individual hook: <50ms average
 * - State operation: <10ms average
 * - Full validation cycle: <200ms
 *
 * These benchmarks ensure the discipline framework doesn't significantly
 * impact Claude Code's responsiveness.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import functions to benchmark
const { checkTestFirstGate, findProjectRoot } = require('../test-first-gate');
const { checkValidationLoop } = require('../validation-loop-pre');
const { recordPendingValidation } = require('../validation-loop-post');
const { detectTestExecution } = require('../validation-loop-bash');
const {
  addPendingValidation,
  getValidationState,
  initializeState,
  clearPendingValidations,
  hasPendingValidations,
} = require('../init-state');

// Test helper: Create temp directory with project markers
function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'discipline-perf-'));

  // Create package.json to mark as project root
  fs.writeFileSync(path.join(dir, 'package.json'), '{}');

  // Create src directory for source file tests
  fs.mkdirSync(path.join(dir, 'src'));

  return dir;
}

// Test helper: Clean up temp directory
function cleanupTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Test helper: Measure average execution time
function measureAverageTime(fn, iterations = 100) {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    fn(i);
  }
  return (Date.now() - start) / iterations;
}

describe('performance - State Operations', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempProject();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('addPendingValidation should complete in <10ms average', () => {
    const iterations = 50;

    const avgMs = measureAverageTime((i) => {
      addPendingValidation(`/project/file${i}.ts`, tempDir);
    }, iterations);

    console.log(`addPendingValidation: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 10, `Average ${avgMs.toFixed(2)}ms exceeds 10ms budget`);
  });

  it('getValidationState should complete in <10ms average', () => {
    // Setup: add some validations first
    for (let i = 0; i < 10; i++) {
      addPendingValidation(`/project/file${i}.ts`, tempDir);
    }

    const iterations = 100;
    const avgMs = measureAverageTime(() => {
      getValidationState(tempDir);
    }, iterations);

    console.log(`getValidationState: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 10, `Average ${avgMs.toFixed(2)}ms exceeds 10ms budget`);
  });

  it('hasPendingValidations should complete in <10ms average', () => {
    // Setup: add some validations
    addPendingValidation('/project/file.ts', tempDir);

    const iterations = 100;
    const avgMs = measureAverageTime(() => {
      hasPendingValidations(tempDir);
    }, iterations);

    console.log(`hasPendingValidations: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 10, `Average ${avgMs.toFixed(2)}ms exceeds 10ms budget`);
  });

  it('clearPendingValidations should complete in <10ms average', () => {
    const iterations = 50;

    const avgMs = measureAverageTime((i) => {
      // Add then clear to measure clear operation
      addPendingValidation(`/project/file${i}.ts`, tempDir);
      clearPendingValidations(tempDir);
    }, iterations);

    // Divide by 2 since we're measuring both operations
    const clearAvg = avgMs / 2;
    console.log(`clearPendingValidations: ~${clearAvg.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(clearAvg < 10, `Average ${clearAvg.toFixed(2)}ms exceeds 10ms budget`);
  });
});

describe('performance - Hook Execution', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = createTempProject();
    initializeState(tempDir);
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  it('test-first-gate check should complete in <50ms average', () => {
    const iterations = 50;
    const srcFile = path.join(tempDir, 'src', 'api.ts');

    // Create the source file
    fs.writeFileSync(srcFile, 'export const api = {};');

    const input = {
      tool_name: 'Edit',
      tool_input: { file_path: srcFile }
    };

    const avgMs = measureAverageTime(() => {
      checkTestFirstGate(input);
    }, iterations);

    console.log(`test-first-gate: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 50, `Average ${avgMs.toFixed(2)}ms exceeds 50ms budget`);
  });

  it('validation-loop-pre check should complete in <50ms average', () => {
    const iterations = 50;
    const srcFile = path.join(tempDir, 'src', 'api.ts');

    fs.writeFileSync(srcFile, 'export const api = {};');

    const input = {
      tool_name: 'Edit',
      tool_input: { file_path: srcFile }
    };

    const avgMs = measureAverageTime(() => {
      checkValidationLoop(input);
    }, iterations);

    console.log(`validation-loop-pre: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 50, `Average ${avgMs.toFixed(2)}ms exceeds 50ms budget`);
  });

  it('validation-loop-post record should complete in <50ms average', () => {
    const iterations = 50;
    const srcFile = path.join(tempDir, 'src', 'api.ts');

    fs.writeFileSync(srcFile, 'export const api = {};');

    const input = {
      tool_name: 'Edit',
      tool_input: { file_path: srcFile },
      tool_result: { success: true }
    };

    const avgMs = measureAverageTime(() => {
      recordPendingValidation(input);
    }, iterations);

    console.log(`validation-loop-post: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 50, `Average ${avgMs.toFixed(2)}ms exceeds 50ms budget`);
  });

  it('validation-loop-bash detect should complete in <50ms average', () => {
    // Setup: add a pending validation
    addPendingValidation(path.join(tempDir, 'src', 'api.ts'), tempDir);

    const iterations = 50;
    const input = {
      tool_name: 'Bash',
      tool_input: { command: 'npm test' },
      tool_result: { stdout: '5 tests passed', exitCode: 0 }
    };

    const avgMs = measureAverageTime(() => {
      detectTestExecution(input);
    }, iterations);

    console.log(`validation-loop-bash: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 50, `Average ${avgMs.toFixed(2)}ms exceeds 50ms budget`);
  });
});

describe('performance - Project Root Detection', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempProject();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('findProjectRoot should complete in <20ms average', () => {
    const iterations = 100;
    const deepPath = path.join(tempDir, 'src', 'features', 'auth', 'components');
    fs.mkdirSync(deepPath, { recursive: true });

    const avgMs = measureAverageTime(() => {
      findProjectRoot(deepPath);
    }, iterations);

    console.log(`findProjectRoot: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 20, `Average ${avgMs.toFixed(2)}ms exceeds 20ms budget`);
  });

  it('findProjectRoot should handle deep paths efficiently', () => {
    // Create a very deep directory structure
    const deepPath = path.join(tempDir, 'a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p'.split('/').join(path.sep));
    fs.mkdirSync(deepPath, { recursive: true });

    const iterations = 50;
    const avgMs = measureAverageTime(() => {
      findProjectRoot(deepPath);
    }, iterations);

    console.log(`findProjectRoot (deep): ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 50, `Average ${avgMs.toFixed(2)}ms exceeds 50ms budget for deep paths`);
  });
});

describe('performance - Full Edit Cycle', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = createTempProject();
    initializeState(tempDir);
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  it('full edit cycle (pre + post hooks) should complete in <200ms', () => {
    const srcFile = path.join(tempDir, 'src', 'api.ts');
    fs.writeFileSync(srcFile, 'export const api = {};');

    // Create test file to pass test-first gate
    fs.mkdirSync(path.join(tempDir, 'src', '__tests__'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'src', '__tests__', 'api.test.ts'), 'test("api", () => {});');

    const iterations = 20;
    let totalMs = 0;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();

      // Simulate full edit cycle
      const preInput = {
        tool_name: 'Edit',
        tool_input: { file_path: srcFile }
      };

      // Pre-hook: test-first gate
      checkTestFirstGate(preInput);

      // Pre-hook: validation loop
      checkValidationLoop(preInput);

      // Post-hook: record validation
      const postInput = {
        tool_name: 'Edit',
        tool_input: { file_path: srcFile },
        tool_result: { success: true }
      };
      recordPendingValidation(postInput);

      totalMs += Date.now() - start;
    }

    const avgMs = totalMs / iterations;
    console.log(`Full edit cycle: ${avgMs.toFixed(2)}ms avg over ${iterations} iterations`);
    assert.ok(avgMs < 200, `Average ${avgMs.toFixed(2)}ms exceeds 200ms budget`);
  });
});

describe('performance - Stress Test', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempProject();
    initializeState(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should handle 100 pending validations efficiently', () => {
    // Add 100 pending validations
    for (let i = 0; i < 100; i++) {
      addPendingValidation(`/project/file${i}.ts`, tempDir);
    }

    const iterations = 50;
    const avgMs = measureAverageTime(() => {
      getValidationState(tempDir);
    }, iterations);

    console.log(`getValidationState (100 pending): ${avgMs.toFixed(2)}ms avg`);
    assert.ok(avgMs < 20, `Average ${avgMs.toFixed(2)}ms exceeds 20ms budget with 100 pending`);
  });
});
