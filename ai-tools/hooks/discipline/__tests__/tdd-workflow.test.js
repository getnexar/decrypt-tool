const { isAllowlisted } = require('../config');
const { describe, test } = require('node:test');
const assert = require('node:assert');

describe('TDD Workflow', () => {
  test('test files are allowlisted - .test. pattern', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.test.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.test.js'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.test.tsx'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.test.jsx'), true);
  });

  test('test files are allowlisted - .spec. pattern', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.spec.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.spec.js'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.spec.tsx'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.spec.jsx'), true);
  });

  test('test files are allowlisted in __tests__ directory', () => {
    assert.strictEqual(isAllowlisted('/project/__tests__/tasks.test.ts'), true);
    assert.strictEqual(isAllowlisted('/project/__tests__/tasks.spec.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/__tests__/tasks.test.ts'), true);
  });

  test('test files are allowlisted - alternative patterns', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks-test.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks_test.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks-spec.ts'), true);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks_spec.ts'), true);
  });

  test('story files are allowlisted', () => {
    assert.strictEqual(isAllowlisted('/project/src/components/Button.stories.tsx'), true);
    assert.strictEqual(isAllowlisted('/project/src/components/Button.stories.js'), true);
  });

  test('source files are NOT allowlisted', () => {
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.ts'), false);
    assert.strictEqual(isAllowlisted('/project/src/api/tasks.js'), false);
    assert.strictEqual(isAllowlisted('/project/src/components/Button.tsx'), false);
  });

  test('config files are allowlisted', () => {
    // Config files should be allowlisted per TEST_FIRST_ALLOWLIST
    assert.strictEqual(isAllowlisted('/project/package.json'), true);
    assert.strictEqual(isAllowlisted('/project/tsconfig.json'), true);
    assert.strictEqual(isAllowlisted('/project/.eslintrc.js'), true);
  });

  test('documentation files are allowlisted', () => {
    assert.strictEqual(isAllowlisted('/project/README.md'), true);
    assert.strictEqual(isAllowlisted('/project/docs/api.md'), true);
  });
});
