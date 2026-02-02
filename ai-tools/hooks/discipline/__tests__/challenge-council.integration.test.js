/**
 * Challenge Council Integration Tests
 *
 * Tests the integration between:
 * - @challenger agent (ai-tools/agents/challenger.md)
 * - challenge-council skill (ai-tools/skills/challenge-council/SKILL.md)
 *
 * These tests verify the protocol works end-to-end by:
 * - Loading and parsing agent/skill definitions
 * - Validating the 3-round protocol structure
 * - Testing verdict handling
 *
 * Note: These are structural integration tests, not full AI invocation tests.
 * Full invocation would require a running Claude Code instance.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Paths to agent and skill files (relative to discipline __tests__ dir)
// __tests__ -> discipline -> hooks -> ai-tools
const AI_TOOLS_ROOT = path.resolve(__dirname, '../../..');
const AGENT_PATH = path.join(AI_TOOLS_ROOT, 'agents/challenger.md');
const SKILL_PATH = path.join(AI_TOOLS_ROOT, 'skills/challenge-council/SKILL.md');

// Helper to parse YAML frontmatter from markdown
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};

  yaml.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Handle arrays in YAML
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim());
      }
      // Handle boolean strings
      if (value === 'true') value = true;
      if (value === 'false') value = false;

      result[key] = value;
    }
  });

  return result;
}

describe('Challenge Council - Agent Loading', () => {
  let agentContent;
  let agentFrontmatter;

  beforeEach(() => {
    // Read agent file
    agentContent = fs.readFileSync(AGENT_PATH, 'utf-8');
    agentFrontmatter = parseFrontmatter(agentContent);
  });

  it('should load @challenger agent file', () => {
    assert.ok(fs.existsSync(AGENT_PATH), 'Agent file should exist');
    assert.ok(agentContent.length > 0, 'Agent file should have content');
  });

  it('should have correct agent frontmatter', () => {
    assert.ok(agentFrontmatter, 'Should have frontmatter');
    assert.strictEqual(agentFrontmatter.name, 'challenger');
    assert.strictEqual(agentFrontmatter.model, 'opus');
    assert.strictEqual(agentFrontmatter.permissionMode, 'plan');
  });

  it('should define challenger as adversarial reviewer', () => {
    assert.ok(agentContent.includes('adversarial reviewer'), 'Should define adversarial role');
    assert.ok(agentContent.includes('Challenger'), 'Should have Challenger title');
  });

  it('should specify exactly 3 challenges requirement', () => {
    assert.ok(agentContent.includes('exactly 3'), 'Should specify 3 challenges');
    assert.ok(agentContent.includes('Exactly 3 Challenges'), 'Should have 3 challenges section');
    assert.ok(agentContent.includes('Challenge 1'), 'Should have Challenge 1');
    assert.ok(agentContent.includes('Challenge 2'), 'Should have Challenge 2');
    assert.ok(agentContent.includes('Challenge 3'), 'Should have Challenge 3');
  });

  it('should define challenge categories', () => {
    const categories = ['Technical', 'Design', 'Requirements', 'Risk'];
    categories.forEach(cat => {
      assert.ok(agentContent.includes(cat), `Should define ${cat} category`);
    });
  });

  it('should define verdict options', () => {
    const verdicts = ['APPROVED', 'APPROVED_WITH_MODIFICATIONS', 'REJECTED', 'ESCALATE_TO_USER'];
    verdicts.forEach(v => {
      assert.ok(agentContent.includes(v), `Should define ${v} verdict`);
    });
  });
});

describe('Challenge Council - Skill Loading', () => {
  let skillContent;
  let skillFrontmatter;

  beforeEach(() => {
    skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');
    skillFrontmatter = parseFrontmatter(skillContent);
  });

  it('should load challenge-council skill file', () => {
    assert.ok(fs.existsSync(SKILL_PATH), 'Skill file should exist');
    assert.ok(skillContent.length > 0, 'Skill file should have content');
  });

  it('should have correct skill frontmatter', () => {
    assert.ok(skillFrontmatter, 'Should have frontmatter');
    assert.strictEqual(skillFrontmatter.name, 'challenge-council');
    assert.ok(skillFrontmatter.description.includes('adversarial review'));
  });

  it('should define 3-round protocol', () => {
    assert.ok(skillContent.includes('ROUND 1'), 'Should define Round 1');
    assert.ok(skillContent.includes('ROUND 2'), 'Should define Round 2');
    assert.ok(skillContent.includes('ROUND 3'), 'Should define Round 3');
    assert.ok(skillContent.includes('Round 1: Challenge Generation'), 'Should describe Round 1');
    assert.ok(skillContent.includes('Round 2: Defense'), 'Should describe Round 2');
    assert.ok(skillContent.includes('Round 3: Resolution'), 'Should describe Round 3');
  });

  it('should define @challenger engagement', () => {
    assert.ok(skillContent.includes('@challenger'), 'Should reference @challenger agent');
  });

  it('should define defense response types', () => {
    const responseTypes = ['Accept', 'Refute', 'Escalate'];
    responseTypes.forEach(type => {
      assert.ok(skillContent.includes(type), `Should define ${type} response type`);
    });
  });
});

describe('Challenge Council - 3-Round Protocol Structure', () => {
  let skillContent;

  beforeEach(() => {
    skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');
  });

  it('should define Round 1: Challenge Generation', () => {
    // Round 1 receives proposal and generates challenges
    assert.ok(skillContent.includes('Receive Proposal'), 'Round 1 should receive proposal');
    assert.ok(skillContent.includes('Engage @challenger'), 'Round 1 should engage @challenger');
    assert.ok(skillContent.includes('Receive Challenges'), 'Round 1 should receive challenges');
  });

  it('should define Round 2: Defense', () => {
    // Round 2 presents challenges and collects defenses
    assert.ok(skillContent.includes('Present Challenges to Proposer'), 'Round 2 should present challenges');
    assert.ok(skillContent.includes('Defense Guidelines'), 'Round 2 should have guidelines');
  });

  it('should define Round 3: Resolution', () => {
    // Round 3 evaluates defenses and issues verdict
    assert.ok(skillContent.includes('Return Defense to @challenger'), 'Round 3 should return defense');
    assert.ok(skillContent.includes('Receive Verdict'), 'Round 3 should receive verdict');
  });

  it('should define verdict handling procedures', () => {
    // Each verdict type should have handling procedure
    const verdictHandling = [
      'APPROVED',
      'APPROVED_WITH_MODIFICATIONS',
      'REJECTED',
      'ESCALATE_TO_USER'
    ];

    verdictHandling.forEach(verdict => {
      assert.ok(skillContent.includes(`### ${verdict}`), `Should have ${verdict} handling section`);
    });
  });
});

describe('Challenge Council - Verdict Handling', () => {
  let agentContent;
  let skillContent;

  beforeEach(() => {
    agentContent = fs.readFileSync(AGENT_PATH, 'utf-8');
    skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');
  });

  it('APPROVED verdict should allow proposal to proceed as-is', () => {
    // Check skill defines APPROVED behavior
    const approvedSection = skillContent.match(/### APPROVED\n\n([\s\S]*?)(?=\n### |\n---|\n## )/);
    assert.ok(approvedSection, 'Should have APPROVED section');
    assert.ok(approvedSection[1].includes('proceed'), 'APPROVED should allow proceeding');
  });

  it('APPROVED_WITH_MODIFICATIONS should require changes', () => {
    const modSection = skillContent.match(/### APPROVED_WITH_MODIFICATIONS\n\n([\s\S]*?)(?=\n### |\n---|\n## )/);
    assert.ok(modSection, 'Should have APPROVED_WITH_MODIFICATIONS section');
    assert.ok(modSection[1].includes('changes') || modSection[1].includes('modifications'),
      'Should require modifications');
  });

  it('REJECTED verdict should prevent proceeding', () => {
    const rejectedSection = skillContent.match(/### REJECTED\n\n([\s\S]*?)(?=\n### |\n---|\n## )/);
    assert.ok(rejectedSection, 'Should have REJECTED section');
    assert.ok(rejectedSection[1].includes('does not proceed') || rejectedSection[1].includes('revise'),
      'REJECTED should prevent proceeding');
  });

  it('ESCALATE_TO_USER should involve user arbitration', () => {
    const escalateSection = skillContent.match(/### ESCALATE_TO_USER\n\n([\s\S]*?)(?=\n### |\n---|\n## )/);
    assert.ok(escalateSection, 'Should have ESCALATE_TO_USER section');
    assert.ok(escalateSection[1].includes('arbitration') || escalateSection[1].includes('User'),
      'ESCALATE should involve user');
  });
});

describe('Challenge Council - User Escalation Protocol', () => {
  let skillContent;

  beforeEach(() => {
    skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');
  });

  it('should define user arbitration protocol', () => {
    assert.ok(skillContent.includes('User Arbitration Protocol'),
      'Should have user arbitration section');
  });

  it('should present both positions to user', () => {
    assert.ok(skillContent.includes('Challenger Position'),
      'Should present challenger position');
    assert.ok(skillContent.includes('Proposer Position'),
      'Should present proposer position');
  });

  it('should make user decision final', () => {
    assert.ok(skillContent.includes('final') || skillContent.includes('binding'),
      'User decision should be final');
  });
});

describe('Challenge Council - Integration Points', () => {
  let skillContent;

  beforeEach(() => {
    skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');
  });

  it('should integrate with Beads work items', () => {
    assert.ok(skillContent.includes('bd update') || skillContent.includes('Beads'),
      'Should integrate with Beads');
    assert.ok(skillContent.includes('CHALLENGE:'),
      'Should use CHALLENGE status markers');
  });

  it('should integrate with Discipline Framework', () => {
    // Challenge Council can be part of validation loop
    assert.ok(skillContent.includes('Discipline') || skillContent.includes('DISCIPLINE_SKIP'),
      'Should reference discipline framework');
  });

  it('should save challenge transcripts', () => {
    assert.ok(skillContent.includes('agent_docs/reviews/'),
      'Should save transcripts to agent_docs/reviews/');
    assert.ok(skillContent.includes('Challenge Council Transcript'),
      'Should have transcript format');
  });
});

describe('Challenge Council - Quality Gates', () => {
  let skillContent;

  beforeEach(() => {
    skillContent = fs.readFileSync(SKILL_PATH, 'utf-8');
  });

  it('should have validation checklist', () => {
    assert.ok(skillContent.includes('Validation Checklist') || skillContent.includes('checklist'),
      'Should have validation checklist');
  });

  it('should verify exactly 3 challenges generated', () => {
    assert.ok(skillContent.includes('Exactly 3 challenges') || skillContent.includes('3 challenges'),
      'Should verify 3 challenges');
  });

  it('should verify proposer responded to all challenges', () => {
    assert.ok(skillContent.includes('responded to all'),
      'Should verify all challenges addressed');
  });

  it('should verify verdict was issued', () => {
    assert.ok(skillContent.includes('Clear verdict') || skillContent.includes('verdict was issued'),
      'Should verify verdict issued');
  });
});
