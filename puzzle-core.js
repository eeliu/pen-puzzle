const operators = {
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => b !== 0 && a % b === 0 ? a / b : null,
};

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed() {
  return Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
}

function choose(list, random) {
  return list[Math.floor(random() * list.length)];
}

function arithmeticCandidates(max, enabled, random) {
  const candidates = [];
  const upper = Math.min(max, 500);
  const seen = new Set();
  const addCandidate = (a, b, op) => {
    const result = operators[op](a, b);
    if (result === null || result < 0 || result > max) return;
    if ((op === '+' && b === 0) || (op === '×' && (a === 0 || b === 0))) return;
    const candidate = [a, op, b, '=', result];
    const key = `${a}${op}${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  if (upper <= 150) {
    for (let a = 0; a <= upper; a += 1) {
      for (let b = 0; b <= upper; b += 1) {
        for (const op of enabled) addCandidate(a, b, op);
      }
    }
  } else {
    // Large custom ranges do not need every possible tuple in memory.
    const candidateLimit = 15000;
    const attemptLimit = candidateLimit * 12;
    let attempts = 0;
    while (candidates.length < candidateLimit && attempts < attemptLimit) {
      attempts += 1;
      const a = Math.floor(random() * (upper + 1));
      const b = Math.floor(random() * (upper + 1));
      addCandidate(a, b, choose(enabled, random));
    }
  }
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates;
}

function expressionCells(expression, x, y, direction) {
  return expression.map((token, index) => ({
    x: x + (direction === 'across' ? index : 0),
    y: y + (direction === 'down' ? index : 0),
    token,
    numeric: index === 0 || index === 2 || index === 4,
  }));
}

function canPlace(cells, direction, grid, directionsByCell) {
  const cellKeys = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
  const intersectionKeys = new Set();
  const perpendicularDirection = direction === 'across' ? 'down' : 'across';

  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    const existing = grid.get(key);
    if (existing) {
      const existingDirections = directionsByCell.get(key);
      if (!cell.numeric || !existing.numeric || String(cell.token) !== String(existing.token)) return null;
      if (existingDirections?.has(direction)) return null;
      intersectionKeys.add(key);
    }
  }

  if (!intersectionKeys.size) return null;

  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const neighborKey = `${cell.x + dx},${cell.y + dy}`;
      if (cellKeys.has(neighborKey) || !grid.has(neighborKey)) continue;

      const neighborDirections = directionsByCell.get(neighborKey);
      const isExpectedCrossing = intersectionKeys.has(key)
        && neighborDirections?.has(perpendicularDirection)
        && !neighborDirections.has(direction);
      if (!isExpectedCrossing) return null;
    }
  }

  return intersectionKeys.size;
}

// Every blank must follow uniquely from known numbers. If deduction stalls,
// expose an unresolved number. This constructive proof has no search timeout.
function ensureUniqueArithmeticSolution(expressions, grid, blankSet, max) {
  const equations = expressions.map(({ cells, expression }) => ({
    keys: [0, 2, 4].map((index) => `${cells[index].x},${cells[index].y}`),
    operator: expression[1],
  }));
  const known = new Map([...grid]
    .filter(([key, cell]) => cell.numeric && !blankSet.has(key))
    .map(([key, cell]) => [key, cell.token]));
  const unresolved = new Set(blankSet);
  while (unresolved.size) {
    let progress = false;
    for (const { keys, operator } of equations) {
      const missing = keys.filter((key) => !known.has(key));
      if (missing.length !== 1) continue;
      const unknown = missing[0];
      const possibilities = [];
      for (let value = 0; value <= max; value += 1) {
        const [left, right, result] = keys.map((key) => key === unknown ? value : known.get(key));
        if (operators[operator](left, right) === result) possibilities.push(value);
      }
      if (possibilities.length !== 1) continue;
      known.set(unknown, possibilities[0]);
      unresolved.delete(unknown);
      progress = true;
    }
    if (progress) continue;
    const key = unresolved.values().next().value;
    blankSet.delete(key);
    known.set(key, grid.get(key).token);
    unresolved.delete(key);
  }
}

export function buildArithmeticPuzzle(seed, max, enabled, count, difficulty, algorithmVersion = 3) {
  const random = seededRandom(seed);
  const candidates = arithmeticCandidates(max, enabled, random);
  const grid = new Map();
  const directionsByCell = new Map();
  const anchorsByValue = new Map();
  let expressions = [];

  const addExpression = (expression, cells, direction) => {
    cells.forEach((cell) => {
      const key = `${cell.x},${cell.y}`;
      grid.set(key, cell);
      if (!directionsByCell.has(key)) directionsByCell.set(key, new Set());
      directionsByCell.get(key).add(direction);
      if (!cell.numeric) return;

      const value = String(cell.token);
      if (!anchorsByValue.has(value)) anchorsByValue.set(value, []);
      const anchors = anchorsByValue.get(value);
      if (!anchors.some((anchor) => anchor.key === key)) anchors.push({ key, x: cell.x, y: cell.y });
    });
    expressions.push({ expression, cells, direction });
  };

  for (const expression of candidates) {
    if (!expressions.length) {
      // Center the first equation so the rest of the structure can grow outwards.
      const cells = expressionCells(expression, -2, 0, 'across');
      addExpression(expression, cells, 'across');
      continue;
    }
    if (expressions.length >= count) break;

    const possible = [];
    for (const numberIndex of [0, 2, 4]) {
      const token = String(expression[numberIndex]);
      const anchors = anchorsByValue.get(token) || [];
      for (const anchor of anchors) {
        for (const direction of ['across', 'down']) {
          const x = anchor.x - (direction === 'across' ? numberIndex : 0);
          const y = anchor.y - (direction === 'down' ? numberIndex : 0);
          const cells = expressionCells(expression, x, y, direction);
          const intersections = canPlace(cells, direction, grid, directionsByCell);
          if (intersections) possible.push({ cells, direction, intersections });
        }
      }
    }
    if (!possible.length) continue;

    const existingCells = [...grid.values()];
    const minX = Math.min(...existingCells.map((cell) => cell.x));
    const maxX = Math.max(...existingCells.map((cell) => cell.x));
    const minY = Math.min(...existingCells.map((cell) => cell.y));
    const maxY = Math.max(...existingCells.map((cell) => cell.y));
    let placement = null;
    let bestScore = -Infinity;
    for (const candidate of possible) {
      const candidateMinX = Math.min(minX, ...candidate.cells.map((cell) => cell.x));
      const candidateMaxX = Math.max(maxX, ...candidate.cells.map((cell) => cell.x));
      const candidateMinY = Math.min(minY, ...candidate.cells.map((cell) => cell.y));
      const candidateMaxY = Math.max(maxY, ...candidate.cells.map((cell) => cell.y));
      const width = candidateMaxX - candidateMinX + 1;
      const height = candidateMaxY - candidateMinY + 1;
      const progress = Math.sqrt((expressions.length + 1) / count);
      const targetWidth = 5 + 15 * progress;
      const targetHeight = 1 + 28 * progress;
      const sizePenalty = Math.abs(width - targetWidth) + Math.abs(height - targetHeight);
      const centerPenalty = Math.abs(candidateMinX + candidateMaxX) + Math.abs(candidateMinY + candidateMaxY);
      const aspectPenalty = Math.abs(width / height - (186 / 273)) * Math.max(width, height);
      const score = candidate.intersections * 2
        - Math.max(0, candidate.intersections - 1) * 4
        - sizePenalty * 4
        - aspectPenalty * 5
        - centerPenalty * 0.4
        + random() * 0.1;
      if (score > bestScore) {
        bestScore = score;
        placement = candidate;
      }
    }
    addExpression(expression, placement.cells, placement.direction);
  }

  // Keep the equation coordinates as a separate layout before filling its cells.
  const layoutSlots = expressions.map((placed) => ({
    x: placed.cells[0].x,
    y: placed.cells[0].y,
    direction: placed.direction,
    equationKey: placed.expression.join('|'),
  }));
  const equationsByKey = new Map(candidates.map((expression) => [expression.join('|'), expression]));
  expressions = layoutSlots.map((slot) => {
    const expression = equationsByKey.get(slot.equationKey);
    return {
      expression,
      cells: expressionCells(expression, slot.x, slot.y, slot.direction),
      direction: slot.direction,
    };
  });

  // Fill the fixed structure, then translate it to positive grid coordinates.
  const plannedCells = expressions.flatMap((placed) => placed.cells);
  const minX = Math.min(...plannedCells.map((cell) => cell.x));
  const minY = Math.min(...plannedCells.map((cell) => cell.y));
  grid.clear();
  directionsByCell.clear();
  const normalizedExpressions = expressions.map((placed) => ({
    ...placed,
    cells: placed.cells.map((cell) => ({ ...cell, x: cell.x - minX, y: cell.y - minY })),
  }));
  const width = Math.max(...normalizedExpressions.flatMap((placed) => placed.cells.map((cell) => cell.x))) + 1;
  const height = Math.max(...normalizedExpressions.flatMap((placed) => placed.cells.map((cell) => cell.y))) + 1;
  const transposeForPortrait = width > height;
  expressions = normalizedExpressions.map((placed) => ({
    ...placed,
    direction: transposeForPortrait
      ? (placed.direction === 'across' ? 'down' : 'across')
      : placed.direction,
    cells: transposeForPortrait
      ? placed.cells.map((cell) => ({ ...cell, x: cell.y, y: cell.x }))
      : placed.cells,
  }));

  expressions.forEach((placed) => {
    placed.cells.forEach((cell) => {
      const key = `${cell.x},${cell.y}`;
      grid.set(key, cell);
      if (!directionsByCell.has(key)) directionsByCell.set(key, new Set());
      directionsByCell.get(key).add(placed.direction);
    });
  });

  const numericCells = [...grid.values()].filter((cell) => cell.numeric && grid.get(`${cell.x},${cell.y}`) === cell);
  const ratio = { easy: 0.25, normal: 0.4, hard: 0.55 }[difficulty];
  const targetBlankCount = Math.max(1, Math.floor(numericCells.length * ratio));
  const blankSet = new Set();
  if (algorithmVersion === 1) {
    const shuffledExpressions = [...expressions];
    for (let i = shuffledExpressions.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [shuffledExpressions[i], shuffledExpressions[j]] = [shuffledExpressions[j], shuffledExpressions[i]];
    }

    // Keep version 1's blank selection so existing PP1 IDs retain their original grids.
    for (const placedExpression of shuffledExpressions) {
      const numericKeys = placedExpression.cells
        .filter((cell) => cell.numeric)
        .map((cell) => `${cell.x},${cell.y}`);
      if (numericKeys.some((key) => blankSet.has(key))) continue;
      blankSet.add(choose(numericKeys, random));
    }

    const remainingKeys = numericCells
      .map((cell) => `${cell.x},${cell.y}`)
      .filter((key) => !blankSet.has(key));
    for (let i = remainingKeys.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [remainingKeys[i], remainingKeys[j]] = [remainingKeys[j], remainingKeys[i]];
    }
    while (blankSet.size < targetBlankCount && remainingKeys.length) blankSet.add(remainingKeys.pop());
  } else if (algorithmVersion === 2 || algorithmVersion === 3) {
    const numericKeysByEquation = expressions.map((placedExpression) => placedExpression.cells
      .filter((cell) => cell.numeric)
      .map((cell) => `${cell.x},${cell.y}`));
    const equationsByNumericKey = new Map();
    numericKeysByEquation.forEach((keys, equationIndex) => {
      for (const key of keys) {
        if (!equationsByNumericKey.has(key)) equationsByNumericKey.set(key, []);
        equationsByNumericKey.get(key).push(equationIndex);
      }
    });
    const blankCounts = numericKeysByEquation.map(() => 0);
    const changeBlank = (key, add) => {
      if (add) blankSet.add(key);
      else blankSet.delete(key);
      for (const equationIndex of equationsByNumericKey.get(key) || []) {
        blankCounts[equationIndex] += add ? 1 : -1;
      }
    };

    // Alternating positions along each equation guarantee both a clue and a blank.
    const blankParity = Math.floor(random() * 2);
    for (const cell of numericCells) {
      const key = `${cell.x},${cell.y}`;
      const parity = (Math.floor(cell.x / 2) + Math.floor(cell.y / 2)) % 2;
      if (parity === blankParity) changeBlank(key, true);
    }

    const shuffledNumericKeys = numericCells.map((cell) => `${cell.x},${cell.y}`);
    for (let i = shuffledNumericKeys.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [shuffledNumericKeys[i], shuffledNumericKeys[j]] = [shuffledNumericKeys[j], shuffledNumericKeys[i]];
    }

    // Adjust toward difficulty without making any equation all blank or all given.
    if (blankSet.size > targetBlankCount) {
      for (const key of shuffledNumericKeys) {
        if (blankSet.size <= targetBlankCount) break;
        const affectedEquations = equationsByNumericKey.get(key) || [];
        if (affectedEquations.every((index) => blankCounts[index] > 1)) changeBlank(key, false);
      }
    } else if (blankSet.size < targetBlankCount) {
      for (const key of shuffledNumericKeys) {
        if (blankSet.size >= targetBlankCount) break;
        if (blankSet.has(key)) continue;
        const affectedEquations = equationsByNumericKey.get(key) || [];
        if (affectedEquations.every((index) => blankCounts[index] < numericKeysByEquation[index].length - 1)) {
          changeBlank(key, true);
        }
      }
    }
  } else {
    throw new Error(`Unsupported arithmetic generator version: ${algorithmVersion}`);
  }

  if (algorithmVersion === 3) ensureUniqueArithmeticSolution(expressions, grid, blankSet, max);

  const blankCount = blankSet.size;
  return { kind: 'math', grid, expressions, blankSet, blankCount, targetBlankCount, max, difficulty, requestedCount: count };
}

export function parseWords(raw) {
  const seen = new Set();
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const split = line.search(/\s/);
    const word = (split === -1 ? line : line.slice(0, split)).toUpperCase().replace(/[^A-Z]/g, '');
    const clue = split === -1 ? '（未填写线索）' : line.slice(split).trim();
    return { word, clue };
  }).filter((entry) => {
    if (entry.word.length < 2 || seen.has(entry.word)) return false;
    seen.add(entry.word);
    return true;
  });
}

export function buildWordPuzzle(seed, entries, prefillRatio = 0, showBank = false) {
  const random = seededRandom(seed);
  const shuffled = [...entries];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  const rootCount = Math.min(3, shuffled.length);
  const roots = shuffled.slice(0, rootCount);
  const expansions = shuffled.slice(rootCount).sort((left, right) => right.word.length - left.word.length);
  const grid = new Map();
  const placed = [];
  const unplaced = [];
  const rootDirection = random() < 0.5 ? 'across' : 'down';
  const rootOffset = Math.floor(random() * 9) - 4;
  const rootSpacingDirection = rootDirection === 'across' ? 'down' : 'across';
  const rootSlots = [-6, 0, 6];
  for (let index = rootSlots.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [rootSlots[index], rootSlots[swapIndex]] = [rootSlots[swapIndex], rootSlots[index]];
  }

  // Seed up to three randomly selected words in a seeded random orientation
  // and order; later words grow from and can bridge these components.
  roots.forEach((entry, rootIndex) => {
    const offset = rootSlots[rootIndex];
    const startX = rootDirection === 'down' ? offset : rootOffset;
    const startY = rootDirection === 'across' ? offset : rootOffset;
    const cells = [...entry.word].map((letter, index) => ({
      x: startX + (rootDirection === 'across' ? index : 0),
      y: startY + (rootDirection === 'down' ? index : 0),
      letter,
    }));
    cells.forEach((cell) => grid.set(`${cell.x},${cell.y}`, { ...cell, word: entry.word, clue: entry.clue }));
    placed.push({ ...entry, direction: rootDirection, cells, isRoot: true, roots: [], layer: 0 });
  });

  for (const entry of expansions) {
    let best = null;
    if (!placed.length) {
      best = { x: 0, y: 0, direction: 'across', intersections: 0 };
    } else {
      for (const existing of placed) {
        for (let i = 0; i < entry.word.length; i += 1) {
          for (let j = 0; j < existing.word.length; j += 1) {
            if (entry.word[i] !== existing.word[j]) continue;
            const direction = existing.direction === 'across' ? 'down' : 'across';
            const cross = existing.cells[j];
            const x = cross.x - (direction === 'across' ? i : 0);
            const y = cross.y - (direction === 'down' ? i : 0);
            const cells = [...entry.word].map((letter, index) => ({
              x: x + (direction === 'across' ? index : 0),
              y: y + (direction === 'down' ? index : 0),
              letter,
            }));
            if (cells.some((cell) => Math.abs(cell.x) > 20 || Math.abs(cell.y) > 20)) continue;
            let valid = true;
            let intersections = 0;
            for (const cell of cells) {
              const old = grid.get(`${cell.x},${cell.y}`);
              if (old && old.letter !== cell.letter) valid = false;
              if (old) intersections += 1;
              for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const neighbor = grid.get(`${cell.x + dx},${cell.y + dy}`);
                const isWordCell = cells.some((candidate) => candidate.x === cell.x + dx && candidate.y === cell.y + dy);
                if (neighbor && !isWordCell && !old) valid = false;
              }
            }
            if (valid && intersections > 0 && (!best || intersections > best.intersections)) {
              best = { x, y, direction, cells, intersections };
            }
          }
        }
      }
    }
    if (!best) {
      unplaced.push(entry);
      continue;
    }
    const cells = best.cells || [...entry.word].map((letter, index) => ({ x: best.x + index, y: best.y, letter }));
    cells.forEach((cell) => grid.set(`${cell.x},${cell.y}`, { ...cell, word: entry.word, clue: entry.clue }));
    placed.push({ ...entry, direction: best.direction, cells, roots: [], layer: null });
  }

  // Build the word-intersection graph. A word can inherit multiple roots when
  // it bridges components, so this also records cross-root dependencies.
  const wordByCell = new Map();
  placed.forEach((word, index) => {
    for (const cell of word.cells) {
      const key = `${cell.x},${cell.y}`;
      if (!wordByCell.has(key)) wordByCell.set(key, []);
      wordByCell.get(key).push(index);
    }
  });
  const neighbors = placed.map(() => new Set());
  const edges = [];
  for (const [key, wordIndexes] of wordByCell) {
    if (wordIndexes.length < 2) continue;
    for (let left = 0; left < wordIndexes.length; left += 1) {
      for (let right = left + 1; right < wordIndexes.length; right += 1) {
        const a = wordIndexes[left];
        const b = wordIndexes[right];
        neighbors[a].add(b);
        neighbors[b].add(a);
        edges.push({ from: a, to: b, cell: key });
      }
    }
  }
  const rootIndexes = placed.map((word, index) => word.isRoot ? index : -1).filter((index) => index >= 0);
  for (const rootIndex of rootIndexes) {
    const rootId = rootIndexes.indexOf(rootIndex) + 1;
    const distances = new Map([[rootIndex, 0]]);
    const queue = [rootIndex];
    while (queue.length) {
      const current = queue.shift();
      for (const neighbor of neighbors[current]) {
        if (distances.has(neighbor)) continue;
        distances.set(neighbor, distances.get(current) + 1);
        queue.push(neighbor);
      }
    }
    for (const [wordIndex, distance] of distances) {
      const word = placed[wordIndex];
      word.roots.push(rootId);
      if (word.layer === null || distance < word.layer) word.layer = distance;
    }
  }
  const graph = {
    roots: rootIndexes,
    edges,
  };

  const starts = new Map();
  let nextNumber = 1;
  for (const word of placed) {
    const start = word.cells[0];
    const key = `${start.x},${start.y}`;
    if (!starts.has(key)) starts.set(key, nextNumber++);
    word.number = starts.get(key);
  }
  const letters = [...grid.values()];
  const minX = Math.min(...letters.map((cell) => cell.x));
  const maxX = Math.max(...letters.map((cell) => cell.x));
  const minY = Math.min(...letters.map((cell) => cell.y));
  const maxY = Math.max(...letters.map((cell) => cell.y));
  const prefilled = new Set();
  const candidates = [...grid.keys()].sort(() => random() - 0.5);
  const prefillTargetCount = Math.floor(candidates.length * Math.max(0, Math.min(1, prefillRatio)));
  for (const key of candidates) {
    if (prefilled.size >= prefillTargetCount) break;
    const crossingWords = placed.filter((word) => word.cells.some((cell) => `${cell.x},${cell.y}` === key));
    const keepsEveryWordIncomplete = crossingWords.every((word) => word.cells.some((cell) => {
      const cellKey = `${cell.x},${cell.y}`;
      return cellKey !== key && !prefilled.has(cellKey);
    }));
    if (keepsEveryWordIncomplete) prefilled.add(key);
  }
  return {
    kind: 'words', grid, placed, unplaced, starts, minX, maxX, minY, maxY, graph,
    prefilled, prefillTargetCount, showBank,
  };
}
