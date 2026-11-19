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

export function buildArithmeticPuzzle(seed, max, enabled, count, difficulty) {
  return buildGraphArithmeticPuzzle(seed, max, enabled, count, difficulty);
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

// Separate random streams keep blank selection independent of layout search work.
function phaseRandom(seed, phase) {
  let hash = seed >>> 0;
  for (const character of phase) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return seededRandom(hash >>> 0);
}

export function arithmeticFamilyKey(expression) {
  const [a, op, b, , c] = expression;
  const additive = op === '+' || op === '−';
  const parts = additive
    ? (op === '+' ? [a, b] : [b, c])
    : (op === '×' ? [a, b] : [b, c]);
  parts.sort((left, right) => left - right);
  return `${additive ? 'sum' : 'product'}:${parts.join(',')}:${op === '+' || op === '×' ? c : a}`;
}

// Score both page coverage and the distribution of occupied cells. A 3 x 4
// sampling grid detects empty regions that a bounding-box ratio cannot see.
function arithmeticLayoutScore(cells) {
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const width = Math.max(...cells.map((cell) => cell.x)) - minX + 1;
  const height = Math.max(...cells.map((cell) => cell.y)) - minY + 1;
  const pageAspect = 202 / 245;
  const aspect = width / height;
  const pageCoverage = Math.min(aspect / pageAspect, pageAspect / aspect);
  const buckets = Array(12).fill(0);
  for (const cell of cells) {
    const column = Math.min(2, Math.floor((cell.x - minX) * 3 / width));
    const row = Math.min(3, Math.floor((cell.y - minY) * 4 / height));
    buckets[row * 3 + column] += 1;
  }
  const average = cells.length / buckets.length;
  const unevenness = buckets.reduce((total, value) => total + (value - average) ** 2, 0)
    / (buckets.length * average ** 2);
  const density = cells.length / (width * height);
  return pageCoverage * 12 + density * 3 - unevenness * 2;
}

function buildGraphArithmeticPuzzle(seed, max, enabled, count, difficulty) {
  const equationRandom = phaseRandom(seed, 'equations');
  const layoutRandom = phaseRandom(seed, 'layout');
  const blankRandom = phaseRandom(seed, 'blanks');
  const families = new Set();
  const candidates = arithmeticCandidates(max, enabled, equationRandom).filter((expression) => {
    const key = arithmeticFamilyKey(expression);
    if (families.has(key)) return false;
    families.add(key);
    return true;
  });
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1]];
  const keyOf = (cell) => `${cell.x},${cell.y}`;
  let best = [];
  let bestLayoutScore = -Infinity;
  // Bounded restarts avoid depending on wall-clock timing when reproducing IDs.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const grid = new Map();
    const placed = [];
    const used = new Set();
    const add = (expression, cells, direction) => {
      placed.push({ expression, cells, direction });
      used.add(arithmeticFamilyKey(expression));
      for (const cell of cells) grid.set(keyOf(cell), cell);
    };
    const root = candidates[Math.floor(layoutRandom() * candidates.length)];
    if (!root) break;
    add(root, root.map((token, index) => ({ x: index, y: 0, token, numeric: index % 2 === 0 })), '1,0');
    while (placed.length < count) {
      const anchors = new Map();
      for (const cell of grid.values()) {
        if (!cell.numeric) continue;
        if (!anchors.has(cell.token)) anchors.set(cell.token, []);
        anchors.get(cell.token).push(cell);
      }
      let choice = null;
      let bestScore = -Infinity;
      const existing = [...grid.values()];
      for (const expression of candidates) {
        if (used.has(arithmeticFamilyKey(expression))) continue;
        for (const index of [0, 2, 4]) {
          for (const anchor of anchors.get(expression[index]) || []) {
            for (const [dx, dy] of directions) {
              const cells = expression.map((token, offset) => ({
                x: anchor.x + (offset - index) * dx,
                y: anchor.y + (offset - index) * dy,
                token, numeric: offset % 2 === 0,
              }));
              const overlaps = cells.filter((cell) => grid.has(keyOf(cell)));
              if (overlaps.some((cell) => !cell.numeric || !grid.get(keyOf(cell)).numeric || grid.get(keyOf(cell)).token !== cell.token)) continue;
              // One shared anchor leaves room to expand and avoids overlapping equations.
              if (overlaps.length !== 1) continue;
              const ownKeys = new Set(cells.map(keyOf));
              if (cells.some((cell) => !cell.numeric && directions.some(([nx, ny]) => {
                const neighbor = `${cell.x + nx},${cell.y + ny}`;
                return grid.has(neighbor) && !ownKeys.has(neighbor);
              }))) continue;
              const addedCells = cells.filter((cell) => !grid.has(keyOf(cell)));
              const score = arithmeticLayoutScore(existing.concat(addedCells)) + layoutRandom() * 0.05;
              if (score > bestScore) {
                bestScore = score;
                choice = { expression, cells, direction: `${dx},${dy}` };
              }
            }
          }
        }
        // Explore enough alternatives without scanning the entire large-range pool.
        if (choice && layoutRandom() < 0.08) break;
      }
      if (!choice) break;
      add(choice.expression, choice.cells, choice.direction);
    }
    const layoutScore = arithmeticLayoutScore([...grid.values()]);
    if (placed.length > best.length || (placed.length === best.length && layoutScore > bestLayoutScore)) {
      best = placed;
      bestLayoutScore = layoutScore;
    }
    // Compare three complete layouts rather than accepting the first full one.
    if (best.length === count && attempt >= 2) break;
  }
  const allCells = best.flatMap(({ cells }) => cells);
  const minX = Math.min(...allCells.map((cell) => cell.x));
  const minY = Math.min(...allCells.map((cell) => cell.y));
  const grid = new Map();
  const expressions = best.map((placed) => ({ ...placed,
    cells: placed.cells.map((cell) => ({ ...cell, x: cell.x - minX, y: cell.y - minY })),
  }));
  for (const { cells } of expressions) for (const cell of cells) grid.set(keyOf(cell), cell);
  const numericKeys = [...grid.values()].filter((cell) => cell.numeric).map(keyOf);
  const equations = expressions.map(({ cells }) => cells.filter((cell) => cell.numeric).map(keyOf));
  const blankSet = new Set();
  const shuffledKeys = [...numericKeys].sort();
  for (let i = shuffledKeys.length - 1; i > 0; i -= 1) {
    const j = Math.floor(blankRandom() * (i + 1));
    [shuffledKeys[i], shuffledKeys[j]] = [shuffledKeys[j], shuffledKeys[i]];
  }
  const priority = new Map(shuffledKeys.map((key, index) => [key, index]));
  // A full chain of forced single-unknown equations proves uniqueness. Zero
  // multiplication and zero dividends need explicit domain checks: one unknown
  // alone does not imply that its value is forced.
  function canRecoverAllBlanks() {
    const known = new Map([...grid].filter(([key, cell]) => cell.numeric && !blankSet.has(key))
      .map(([key, cell]) => [key, Number(cell.token)]));
    let progress = true;
    while (progress) {
      progress = false;
      for (let index = 0; index < equations.length; index += 1) {
        const keys = equations[index];
        const unknown = keys.filter((key) => !known.has(key));
        if (unknown.length !== 1) continue;
        const unknownKey = unknown[0];
        const op = expressions[index].expression[1];
        let solution;
        let matches = 0;
        for (let value = 0; value <= max; value += 1) {
          const [a, b, c] = keys.map((key) => key === unknownKey ? value : known.get(key));
          if (operators[op](a, b) !== c) continue;
          solution = value;
          if (++matches > 1) break;
        }
        if (matches !== 1) continue;
        known.set(unknownKey, solution);
        progress = true;
      }
    }
    return numericKeys.every((key) => known.has(key));
  }
  const acceptsBlanks = () => canRecoverAllBlanks();
  // Backtrack over uncovered equations so every equation has a blank and a clue.
  function coverEquations() {
    const uncovered = equations.find((keys) => !keys.some((key) => blankSet.has(key)));
    if (!uncovered) return true;
    const options = [...uncovered].sort((a, b) => priority.get(a) - priority.get(b));
    for (const key of options) {
      const preservesClues = equations.every((keys) => !keys.includes(key)
        || keys.some((other) => other !== key && !blankSet.has(other)));
      if (!preservesClues) continue;
      blankSet.add(key);
      if (acceptsBlanks() && coverEquations()) return true;
      blankSet.delete(key);
    }
    return false;
  }
  if (!coverEquations()) throw new Error('Unable to select valid arithmetic blanks');
  const targetBlankCount = Math.max(1, Math.floor(numericKeys.length * { easy: 0.25, normal: 0.4, hard: 0.55 }[difficulty]));
  for (const key of shuffledKeys) {
    if (blankSet.size >= targetBlankCount) break;
    if (blankSet.has(key)) continue;
    if (!equations.every((keys) => !keys.includes(key) || keys.some((other) => other !== key && !blankSet.has(other)))) continue;
    blankSet.add(key);
    if (!acceptsBlanks()) blankSet.delete(key);
  }
  return { kind: 'math', grid, expressions, blankSet, blankCount: blankSet.size, targetBlankCount, max, difficulty, requestedCount: count };
}
