import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWords } from '../puzzle-core.js';
import { buildPuzzleFromId, buildPuzzleFromRules, decodePuzzleId, encodePuzzleId } from '../puzzle-id.js';

test('arithmetic puzzle ID preserves seed and all generation rules', () => {
  const seed = 0xBAAFF9DA;
  const rules = {
    mode: 'math',
    max: 37,
    operators: ['+', '−', '÷'],
    count: 9,
    difficulty: 'hard',
  };

  const puzzleId = encodePuzzleId(seed, rules);
  const decoded = decodePuzzleId(puzzleId);

  assert.match(puzzleId, /^PP1-BAAFF9DA-/);
  assert.deepEqual(decoded, { seed, rules });
});

test('importing an arithmetic puzzle ID builds the same seeded puzzle', () => {
  const seed = 0xBAAFF9DA;
  const rules = {
    mode: 'math',
    max: 30,
    operators: ['+', '−', '×', '÷'],
    count: 8,
    difficulty: 'normal',
  };
  const puzzleId = encodePuzzleId(seed, rules);

  const imported = buildPuzzleFromId(puzzleId);
  const expected = buildPuzzleFromRules(seed, rules);

  assert.equal(imported.seed, seed);
  assert.deepEqual(imported.rules, rules);
  assert.deepEqual(imported.puzzle, expected);
});

test('word puzzle ID preserves Unicode clues and reproduces its puzzle', () => {
  const seed = 74219;
  const rules = {
    mode: 'words',
    entries: parseWords('APPLE 苹果\nRIVER 河流\nPLANET 行星\nBRIDGE 桥梁'),
    prefill: 0.2,
    showBank: true,
  };
  const puzzleId = encodePuzzleId(seed, rules);

  const imported = buildPuzzleFromId(puzzleId);
  const expected = buildPuzzleFromRules(seed, rules);

  assert.deepEqual(imported.rules, rules);
  assert.deepEqual(imported.puzzle, expected);
});

test('puzzle ID decoder rejects old, malformed, and tampered identifiers', () => {
  const validId = encodePuzzleId(1234, {
    mode: 'math', max: 20, operators: ['+'], count: 4, difficulty: 'easy',
  });

  assert.throws(() => decodePuzzleId('BAAFF9DA'));
  assert.throws(() => decodePuzzleId('PP1-not-an-id'));
  assert.throws(() => decodePuzzleId(validId.replace(/^PP1-/, 'PP2-')));
  assert.throws(() => decodePuzzleId(validId.replace('000004D2', '000004D3')));
});
