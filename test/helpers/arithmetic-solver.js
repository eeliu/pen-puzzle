// Independent finite-domain solver: never read stored answers from blank cells.
export function solveArithmeticPuzzle(puzzle, limit = 2) {
  const keyOf = (cell) => `${cell.x},${cell.y}`;
  const known = new Map([...puzzle.grid].filter(([key, cell]) => cell.numeric && !puzzle.blankSet.has(key))
    .map(([key, cell]) => [key, Number(cell.token)]));
  const constraints = puzzle.expressions.map(({ expression, cells }) => {
    const keys = cells.filter((cell) => cell.numeric).map(keyOf);
    const valuesAt = (index) => known.has(keys[index]) ? [known.get(keys[index])]
      : Array.from({ length: puzzle.max + 1 }, (_, value) => value);
    const rows = [];
    for (const a of valuesAt(0)) {
      for (const b of valuesAt(1)) {
        let c;
        switch (expression[1]) {
          case '+': c = a + b; break;
          case '−': c = a - b; break;
          case '×': c = a * b; break;
          case '÷': c = b !== 0 && a % b === 0 ? a / b : -1; break;
          default: throw new Error('Unknown operator');
        }
        if (c < 0 || c > puzzle.max || (known.has(keys[2]) && known.get(keys[2]) !== c)) continue;
        rows.push([a, b, c]);
      }
    }
    return { keys, rows };
  });
  const solutions = [];
  let nodes = 0;
  function search(domains) {
    if (++nodes > 100000) throw new Error('Solver search limit exceeded; uniqueness was not established');
    let changed = true;
    while (changed) {
      changed = false;
      for (const { keys, rows } of constraints) {
        const compatible = rows.filter((row) => keys.every((key, index) => !domains.has(key) || domains.get(key).has(row[index])));
        if (!compatible.length) return;
        for (let index = 0; index < keys.length; index += 1) {
          const allowed = new Set(compatible.map((row) => row[index]));
          const previous = domains.get(keys[index]);
          if (!previous || previous.size !== allowed.size) {
            domains.set(keys[index], allowed);
            changed = true;
          }
        }
      }
    }
    const branch = [...domains].filter(([, values]) => values.size > 1).sort((a, b) => a[1].size - b[1].size)[0];
    if (!branch) {
      solutions.push(Object.fromEntries([...domains].map(([key, values]) => [key, [...values][0]])));
      return;
    }
    const [key, values] = branch;
    for (const value of values) {
      const next = new Map(domains);
      next.set(key, new Set([value]));
      search(next);
      if (solutions.length >= limit) return;
    }
  }
  search(new Map([...known].map(([key, value]) => [key, new Set([value])])));
  return solutions;
}
