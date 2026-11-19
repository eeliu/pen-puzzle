import assert from 'node:assert/strict';
import test from 'node:test';
import { arithmeticFamilyKey, buildArithmeticPuzzle, buildWordPuzzle, parseWords } from '../puzzle-core.js';
import { buildPuzzleFromId, buildPuzzleFromRules } from '../puzzle-id.js';

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

test('arithmetic puzzle leaves a clue in every equation', () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const puzzle = makeArithmeticPuzzle(seed);
    assert.ok(puzzle.expressions.length > 1, `seed ${seed} should produce a connected puzzle`);

    for (const { cells } of puzzle.expressions) {
      const numericKeys = cells.filter((cell) => cell.numeric).map(coordinateKey);
      assert.ok(
        numericKeys.some((key) => !puzzle.blankSet.has(key)),
        `seed ${seed} contains an all-blank equation: ${cells.map((cell) => cell.token).join(' ')}`,
      );
    }
  }
});

test('hard arithmetic puzzles never produce all-blank equations', () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const puzzle = buildArithmeticPuzzle(seed, 20, Object.keys(arithmeticOperators), 40, 'hard');
    for (const { cells } of puzzle.expressions) {
      const numericKeys = cells.filter((cell) => cell.numeric).map(coordinateKey);
      assert.ok(numericKeys.some((key) => !puzzle.blankSet.has(key)), `seed ${seed} has an all-blank equation`);
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

// Independent finite-domain solver: retain all supported equation tuples, then
// branch on the smallest remaining domain to count complete assignments.
function countSolutions(puzzle) {
  const domains = new Map([...puzzle.grid].filter(([, cell]) => cell.numeric)
    .map(([key, cell]) => [key, puzzle.blankSet.has(key)
      ? Array.from({ length: puzzle.max + 1 }, (_, value) => value) : [cell.token]]));
  const constraints = puzzle.expressions.map(({ cells, expression }) => {
    const keys = [0, 2, 4].map((index) => coordinateKey(cells[index]));
    const tuples = [];
    for (const left of domains.get(keys[0])) {
      for (const right of domains.get(keys[1])) {
        const result = arithmeticOperators[expression[1]](left, right);
        if (domains.get(keys[2]).includes(result)) tuples.push([left, right, result]);
      }
    }
    return { keys, tuples };
  });
  function search(current) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const { keys, tuples } of constraints) {
        const valid = tuples.filter((tuple) => tuple.every((value, index) => current.get(keys[index]).includes(value)));
        if (!valid.length) return 0;
        keys.forEach((key, index) => {
          const supported = new Set(valid.map((tuple) => tuple[index]));
          const next = current.get(key).filter((value) => supported.has(value));
          if (next.length < current.get(key).length) {
            current.set(key, next);
            changed = true;
          }
        });
      }
    }
    const choice = [...current].filter(([, values]) => values.length > 1)
      .sort((left, right) => left[1].length - right[1].length)[0];
    if (!choice) return 1;
    let total = 0;
    for (const value of choice[1]) {
      const branch = new Map(current);
      branch.set(choice[0], [value]);
      total += search(branch);
    }
    return total;
  }
  return search(domains);
}

test('imported older puzzle rules generate a uniquely solvable current puzzle', () => {
  const imported = buildPuzzleFromId('PP2-AgCbDxBxABQCAAEoAaZB');
  assert.equal(countSolutions(imported.puzzle), 1);
  assert.deepEqual(imported.puzzle, buildPuzzleFromRules(imported.seed, imported.rules));
});

test('new arithmetic puzzles have exactly one solution across operators and difficulties', () => {
  for (const enabled of [['+'], ['−'], ['×'], ['÷'], Object.keys(arithmeticOperators)]) {
    for (const difficulty of ['easy', 'normal', 'hard']) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const puzzle = buildArithmeticPuzzle(seed, 12, enabled, 16, difficulty);
        assert.equal(countSolutions(puzzle), 1, `${enabled} ${difficulty} seed ${seed}`);
      }
    }
  }
});

test('unique generation supports the maximum numeric range and equation count', () => {
  const puzzle = buildArithmeticPuzzle(42, 500, Object.keys(arithmeticOperators), 40, 'hard');
  assert.equal(countSolutions(puzzle), 1);
});

test('version 4 deduplicates arithmetic families and reproduces layout and blanks', () => {
  const puzzle = makeArithmeticPuzzle(123456, 30, 24);
  assert.equal(puzzle.expressions.length, 24);
  const keys = puzzle.expressions.map(({ expression }) => arithmeticFamilyKey(expression));
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(puzzle, makeArithmeticPuzzle(123456, 30, 24));
  assert.ok(puzzle.expressions.some(({ cells }) => cells[0].x !== cells[1].x && cells[0].y !== cells[1].y));
  assert.equal(arithmeticFamilyKey([12, '+', 15, '=', 27]), arithmeticFamilyKey([27, '−', 12, '=', 15]));
});
