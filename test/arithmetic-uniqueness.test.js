import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPuzzleFromId, encodePuzzleId } from '../puzzle-id.js';
import { solveArithmeticPuzzle } from './helpers/arithmetic-solver.js';

function factKey([a, operator, b, , c]) {
  const additive = operator === '+' || operator === '−';
  const forward = operator === '+' || operator === '×';
  const pair = (forward ? [a, b] : [b, c]).sort((left, right) => left - right);
  return JSON.stringify([additive ? 'addition' : 'multiplication', pair, forward ? c : a]);
}

function examplePuzzle(expression, blankIndices) {
  const cells = expression.map((token, x) => ({ token, x, y: 0, numeric: x % 2 === 0 }));
  return { max: 5, grid: new Map(cells.map((cell) => [`${cell.x},0`, cell])),
    expressions: [{ expression, cells }], blankSet: new Set(blankIndices.map((x) => `${x},0`)) };
}

test('independent solver distinguishes zero, one and multiple solutions', () => {
  assert.equal(solveArithmeticPuzzle(examplePuzzle([2, '+', 3, '=', 5], [4])).length, 1);
  assert.equal(solveArithmeticPuzzle(examplePuzzle([2, '+', 3, '=', 5], [0, 2])).length, 2);
  assert.equal(solveArithmeticPuzzle(examplePuzzle([2, '+', 3, '=', 4], [])).length, 0);
  assert.equal(solveArithmeticPuzzle(examplePuzzle([0, '×', 3, '=', 0], [2])).length, 2);
  assert.equal(solveArithmeticPuzzle(examplePuzzle([4, '÷', 2, '=', 2], [2])).length, 1);
});

const operators = ['+', '−', '×', '÷'];
const cases = [];
for (let mask = 1; mask < 16; mask += 1) {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    for (const seed of [1, 42]) {
      cases.push({ seed, max: 20, operators: operators.filter((_, index) => mask & (1 << index)),
        count: difficulty === 'easy' ? 4 : difficulty === 'normal' ? 16 : 40, difficulty });
    }
  }
}
for (const max of [3, 50, 150, 151, 500]) {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    cases.push({ seed: 123456, max, operators, count: 6, difficulty });
  }
}

for (const { seed, ...settings } of cases) {
  const rules = { mode: 'math', ...settings };
  const id = encodePuzzleId(seed, rules);
  test(`unique arithmetic facts and exactly one solution: ${id} ${JSON.stringify({ seed, ...settings })}`, () => {
    const { puzzle } = buildPuzzleFromId(id);
    assert.ok(puzzle.expressions.length > 0);
    const facts = puzzle.expressions.map(({ expression }) => factKey(expression));
    assert.equal(new Set(facts).size, facts.length, 'Equivalent arithmetic facts repeat');
    const solutions = solveArithmeticPuzzle(puzzle);
    assert.equal(solutions.length, 1, `Expected one solution; found ${solutions.length >= 2 ? 'at least two' : 'zero'}. Witnesses: ${JSON.stringify(solutions)}`);
    for (const key of puzzle.blankSet) assert.equal(solutions[0][key], puzzle.grid.get(key).token);
  });
}

test('version 4 reproduces the reviewed unique puzzle', () => {
  const id = 'PP2-BAAAAAABABQBABAB2fY';
  const current = buildPuzzleFromId(id);
  assert.equal(current.generatorVersion, 4);
  assert.equal(solveArithmeticPuzzle(current.puzzle).length, 1);
  assert.deepEqual(buildPuzzleFromId(id).puzzle, current.puzzle);
});

// Fixed corpus seed makes CI failures reproducible while varying all rule inputs.
// The independent solver stops at two solutions; a timeout is always a failure.
test('1000 randomized arithmetic puzzles each have exactly one solution', { timeout: 180000 }, () => {
  let randomState = 0x20261119;
  function randomInteger(limit) {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return Math.floor((randomState / 4294967296) * limit);
  }
  const ranges = [3, 12, 20, 50, 150, 151, 500];
  const difficulties = ['easy', 'normal', 'hard'];
  for (let index = 0; index < 1000; index += 1) {
    const seed = randomInteger(0x100000000);
    const mask = 1 + randomInteger(15);
    const rules = {
      mode: 'math',
      max: index % 2 === 0 ? ranges[randomInteger(ranges.length)] : 3 + randomInteger(498),
      operators: operators.filter((_, bit) => mask & (1 << bit)),
      count: 4 + randomInteger(37),
      difficulty: difficulties[randomInteger(difficulties.length)],
    };
    const id = encodePuzzleId(seed, rules);
    const context = `sample=${index} id=${id} seed=${seed} rules=${JSON.stringify(rules)}`;
    try {
      const { puzzle } = buildPuzzleFromId(id);
      assert.ok(puzzle.expressions.length > 0, 'Empty puzzle');
      const facts = puzzle.expressions.map(({ expression }) => factKey(expression));
      assert.equal(new Set(facts).size, facts.length, 'Repeated arithmetic fact');
      const solutions = solveArithmeticPuzzle(puzzle);
      assert.equal(solutions.length, 1, `Expected one solution, found ${solutions.length}`);
      for (const key of puzzle.blankSet) assert.equal(solutions[0][key], puzzle.grid.get(key).token);
    } catch (error) {
      throw new Error(`${context}: ${error.message}`, { cause: error });
    }
  }
});
