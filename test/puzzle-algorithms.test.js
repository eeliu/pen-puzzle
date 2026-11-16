import assert from 'node:assert/strict';
import test from 'node:test';
import { buildArithmeticPuzzle, buildWordPuzzle, parseWords } from '../puzzle-core.js';

const arithmeticOperators = {
  '+': (left, right) => left + right,
  '−': (left, right) => left - right,
  '×': (left, right) => left * right,
  '÷': (left, right) => right !== 0 && left % right === 0 ? left / right : null,
};

function makeArithmeticPuzzle(seed = 20261116, max = 20, count = 16) {
  return buildArithmeticPuzzle(seed, max, Object.keys(arithmeticOperators), count, 'normal');
}

function coordinateKey(cell) {
  return `${cell.x},${cell.y}`;
}

test('arithmetic puzzle never reveals a complete equation', () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const puzzle = makeArithmeticPuzzle(seed);
    assert.ok(puzzle.expressions.length > 1, `seed ${seed} should produce a connected puzzle`);

    for (const { cells } of puzzle.expressions) {
      const numericKeys = cells.filter((cell) => cell.numeric).map(coordinateKey);
      assert.ok(
        numericKeys.some((key) => puzzle.blankSet.has(key)),
        `seed ${seed} contains a fully revealed equation: ${cells.map((cell) => cell.token).join(' ')}`,
      );
    }
  }
});

test('arithmetic puzzle stays within the selected numeric range', () => {
  const max = 12;
  const puzzle = makeArithmeticPuzzle(73, max, 20);

  for (const cell of puzzle.grid.values()) {
    if (cell.numeric) assert.ok(Number(cell.token) >= 0 && Number(cell.token) <= max);
  }

  for (const { expression } of puzzle.expressions) {
    const [left, operator, right, equals, result] = expression;
    assert.equal(equals, '=');
    assert.ok(Object.hasOwn(arithmeticOperators, operator));
    assert.equal(arithmeticOperators[operator](left, right), result);
    assert.ok(left >= 0 && left <= max);
    assert.ok(right >= 0 && right <= max);
    assert.ok(result >= 0 && result <= max);
  }
});

test('arithmetic expressions intersect consistently and remain connected', () => {
  const puzzle = makeArithmeticPuzzle(994, 30, 24);

  for (let index = 1; index < puzzle.expressions.length; index += 1) {
    const current = puzzle.expressions[index];
    const priorKeys = new Set(puzzle.expressions.slice(0, index).flatMap(({ cells }) => cells.map(coordinateKey)));
    const intersections = current.cells.filter((cell) => priorKeys.has(coordinateKey(cell)));
    assert.ok(intersections.length > 0, `expression ${index} is disconnected`);
    for (const cell of intersections) {
      assert.ok(cell.numeric, 'only numeric cells may intersect');
      assert.equal(puzzle.grid.get(coordinateKey(cell)).token, cell.token);
    }
  }
});

const sampleWordEntries = parseWords(`
  ORANGE fruit
  GREEN color
  TIGER animal
  GRAPE fruit
  GARDEN place
  RING jewelry
  ANGLE shape
  GRAIN seed
`);

test('word puzzle leaves at least one answer cell blank in every placed word', () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const puzzle = buildWordPuzzle(seed, sampleWordEntries, 1, true);
    assert.ok(puzzle.placed.length > 0);

    for (const word of puzzle.placed) {
      assert.ok(
        word.cells.some((cell) => !puzzle.prefilled.has(coordinateKey(cell))),
        `seed ${seed} fully reveals the word ${word.word}`,
      );
    }
    assert.equal(puzzle.showBank, true);
  }
});

test('word crossings agree on letters and each placed word joins the existing grid', () => {
  const puzzle = buildWordPuzzle(518, sampleWordEntries, 0.4);
  const connectedCells = new Set();

  for (const word of puzzle.placed) {
    const shared = word.cells.filter((cell) => connectedCells.has(coordinateKey(cell)));
    if (!word.isRoot) assert.ok(shared.length > 0, `${word.word} does not cross the existing puzzle`);
    for (const cell of word.cells) {
      const gridCell = puzzle.grid.get(coordinateKey(cell));
      assert.equal(gridCell.letter, cell.letter, `crossing letter mismatch for ${word.word}`);
      connectedCells.add(coordinateKey(cell));
    }
  }
});

test('word parser removes invalid and duplicate entries', () => {
  assert.deepEqual(parseWords('TREE plant\ntree duplicate\nA ignored\nBLUE-BIRD bird'), [
    { word: 'TREE', clue: 'plant' },
    { word: 'BLUEBIRD', clue: 'bird' },
  ]);
});
