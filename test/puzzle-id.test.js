import assert from 'node:assert/strict';
import test from 'node:test';
import { buildArithmeticPuzzle, parseWords } from '../puzzle-core.js';
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

  assert.match(puzzleId, /^PP2-/);
  assert.ok(puzzleId.length < 40, `compact math ID was ${puzzleId.length} characters`);
  assert.deepEqual(decoded, { seed, rules, generatorVersion: 3 });
});

test('compact arithmetic IDs preserve the sample data and remain much shorter', () => {
  const legacyId = 'PP1-3407580A-eyJ2IjoxLCJnIjoxLCJtIjoiYSIsIngiOjIwLCJvIjpbIisiLCLiiJIiXSwibiI6NDAsImQiOiJoYXJkIiwicyI6ODcyODk2NTIyfQ';
  const expected = {
    seed: 872896522,
    rules: { mode: 'math', max: 20, operators: ['+', '−'], count: 40, difficulty: 'hard' },
  };
  const compactId = encodePuzzleId(expected.seed, expected.rules);
  const legacyExpected = { ...expected, generatorVersion: 1 };
  const compactExpected = { ...expected, generatorVersion: 3 };

  assert.deepEqual(decodePuzzleId(legacyId), legacyExpected);
  assert.deepEqual(decodePuzzleId(compactId), compactExpected);
  assert.ok(compactId.length < legacyId.length / 3);

  const importedLegacy = buildPuzzleFromId(legacyId);
  const legacyPuzzle = buildArithmeticPuzzle(
    expected.seed,
    expected.rules.max,
    expected.rules.operators,
    expected.rules.count,
    expected.rules.difficulty,
    1,
  );
  assert.deepEqual(importedLegacy.puzzle, legacyPuzzle);
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
  assert.equal(imported.generatorVersion, 3);
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
  assert.throws(() => decodePuzzleId(validId.replace(/^PP2-/, 'PP3-')));
  const changedCharacter = `${validId.slice(0, 8)}${validId[8] === 'A' ? 'B' : 'A'}${validId.slice(9)}`;
  assert.throws(() => decodePuzzleId(changedCharacter));
});
