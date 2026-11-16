const $ = (selector) => document.querySelector(selector);
const state = { mode: 'math', puzzle: null, seed: '', saved: null };

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

function newSeed() {
  return Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
}

function choose(list, random) {
  return list[Math.floor(random() * list.length)];
}

function arithmeticCandidates(max, enabled, random) {
  const candidates = [];
  const upper = Math.min(max, 500);
  for (let a = 0; a <= upper; a += 1) {
    for (let b = 0; b <= upper; b += 1) {
      for (const op of enabled) {
        const result = operators[op](a, b);
        if (result === null || result < 0 || result > max) continue;
        if ((op === '+' && b === 0) || (op === '×' && (a === 0 || b === 0))) continue;
        candidates.push([a, op, b, '=', result]);
      }
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

function canPlace(cells, grid) {
  let intersections = 0;
  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    const existing = grid.get(key);
    if (existing) {
      if (!cell.numeric || !existing.numeric || String(cell.token) !== String(existing.token)) return -1;
      intersections += 1;
    }
  }
  return intersections;
}

function buildArithmeticPuzzle(seed, max, enabled, count, difficulty) {
  const random = seededRandom(seed);
  const candidates = arithmeticCandidates(max, enabled, random);
  const grid = new Map();
  const expressions = [];
  const center = Math.floor(count / 2);

  for (const expression of candidates) {
    if (!expressions.length) {
      const cells = expressionCells(expression, 0, 0, 'across');
      cells.forEach((cell) => grid.set(`${cell.x},${cell.y}`, cell));
      expressions.push({ expression, cells, direction: 'across' });
    }
    if (expressions.length >= count) break;

    const anchors = [...grid.values()].filter((cell) => cell.numeric && grid.get(`${cell.x},${cell.y}`) === cell);
    const possible = [];
    for (const anchor of anchors) {
      for (const [numberIndex, token] of [[0, expression[0]], [2, expression[2]], [4, expression[4]]]) {
        if (String(token) !== String(anchor.token)) continue;
        for (const direction of ['across', 'down']) {
          const x = anchor.x - (direction === 'across' ? numberIndex : 0);
          const y = anchor.y - (direction === 'down' ? numberIndex : 0);
          const cells = expressionCells(expression, x, y, direction);
          const intersections = canPlace(cells, grid);
          if (intersections > 0) possible.push({ cells, direction, intersections });
        }
      }
    }
    if (!possible.length) continue;
    const placement = choose(possible, random);
    placement.cells.forEach((cell) => grid.set(`${cell.x},${cell.y}`, cell));
    expressions.push({ expression, cells: placement.cells, direction: placement.direction });
  }

  // Add separated starter equations only when there were not enough intersections.
  for (const expression of candidates) {
    if (expressions.length >= count) break;
    const y = expressions.length * 2 + 2;
    const cells = expressionCells(expression, 0, y, 'across');
    if (canPlace(cells, grid) !== 0) continue;
    cells.forEach((cell) => grid.set(`${cell.x},${cell.y}`, cell));
    expressions.push({ expression, cells, direction: 'across' });
  }

  const numericCells = [...grid.values()].filter((cell) => cell.numeric && grid.get(`${cell.x},${cell.y}`) === cell);
  const ratio = { easy: 0.25, normal: 0.4, hard: 0.55 }[difficulty];
  const blankCount = Math.max(1, Math.floor(numericCells.length * ratio));
  const blankSet = new Set(numericCells.map((cell) => `${cell.x},${cell.y}`));
  const shuffled = [...blankSet];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  shuffled.slice(blankCount).forEach((key) => blankSet.delete(key));
  return { kind: 'math', grid, expressions, blankSet, blankCount, max, difficulty };
}

function parseWords(raw) {
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

function buildWordPuzzle(seed, entries) {
  const random = seededRandom(seed);
  const shuffled = [...entries].sort(() => random() - 0.5).sort((a, b) => b.word.length - a.word.length);
  const grid = new Map();
  const placed = [];
  const unplaced = [];
  for (const entry of shuffled) {
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
            if (cells.some((cell) => Math.abs(cell.x) > 13 || Math.abs(cell.y) > 13)) continue;
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
            if (valid && intersections > 0 && (!best || intersections > best.intersections)) best = { x, y, direction, cells, intersections };
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
    placed.push({ ...entry, direction: best.direction, cells });
  }

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
  const prefillRatio = Number($('#prefill').value);
  const prefilled = new Set();
  const candidates = [...grid.keys()].sort(() => random() - 0.5);
  candidates.slice(0, Math.floor(candidates.length * prefillRatio)).forEach((key) => prefilled.add(key));
  return { kind: 'words', grid, placed, unplaced, starts, minX, maxX, minY, maxY, prefilled, showBank: $('#word-bank').checked };
}

function getGridBounds(puzzle) {
  const cells = [...puzzle.grid.values()];
  return {
    minX: Math.min(...cells.map((cell) => cell.x)), maxX: Math.max(...cells.map((cell) => cell.x)),
    minY: Math.min(...cells.map((cell) => cell.y)), maxY: Math.max(...cells.map((cell) => cell.y)),
  };
}

function renderMath(puzzle) {
  const bounds = getGridBounds(puzzle);
  const table = document.createElement('table');
  table.className = 'arithmetic-grid';
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    const row = table.insertRow();
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const td = row.insertCell();
      const key = `${x},${y}`;
      const cell = puzzle.grid.get(key);
      if (!cell) { td.className = 'empty-cell'; continue; }
      if (!cell.numeric) { td.className = 'operator-cell'; td.textContent = cell.token; continue; }
      td.className = 'number-cell';
      const answer = String(cell.token);
      if (puzzle.blankSet.has(key)) {
        const input = document.createElement('input');
        input.inputMode = 'numeric';
        input.dataset.key = key;
        input.dataset.answer = answer;
        input.setAttribute('aria-label', `数字格 ${x + 1}, ${y + 1}`);
        input.value = puzzle.userEntries?.[key] || '';
        td.append(input);
      } else {
        td.textContent = answer;
      }
    }
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'grid-wrap';
  wrapper.append(table);
  const container = document.createElement('div');
  container.append(wrapper);
  const note = document.createElement('div');
  note.className = 'equation-notes';
  note.textContent = `${puzzle.expressions.length} 条相交算式 · ${puzzle.blankCount} 个数字待填写`;
  container.append(note);
  return container;
}

function renderWords(puzzle) {
  const layout = document.createElement('div');
  layout.className = 'word-layout';
  const table = document.createElement('table');
  table.className = 'word-grid';
  for (let y = puzzle.minY; y <= puzzle.maxY; y += 1) {
    const row = table.insertRow();
    for (let x = puzzle.minX; x <= puzzle.maxX; x += 1) {
      const td = row.insertCell();
      const key = `${x},${y}`;
      const cell = puzzle.grid.get(key);
      if (!cell) { td.className = 'block'; continue; }
      if (puzzle.starts.has(key)) {
        const number = document.createElement('span');
        number.className = 'answer-number';
        number.textContent = puzzle.starts.get(key);
        td.append(number);
      }
      if (puzzle.prefilled.has(key)) {
        const letter = document.createElement('span');
        letter.className = 'prefilled';
        letter.textContent = cell.letter;
        td.append(letter);
      } else {
        const input = document.createElement('input');
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.dataset.key = key;
        input.dataset.answer = cell.letter;
        input.value = puzzle.userEntries?.[key] || '';
        td.append(input);
      }
    }
  }
  layout.append(table);
  const clues = document.createElement('div');
  clues.className = 'clues';
  for (const direction of ['across', 'down']) {
    const heading = document.createElement('h3');
    heading.textContent = direction === 'across' ? '横向 ACROSS' : '纵向 DOWN';
    clues.append(heading);
    const list = document.createElement('ol');
    puzzle.placed.filter((word) => word.direction === direction).sort((a, b) => a.number - b.number).forEach((word) => {
      const item = document.createElement('li');
      item.value = word.number;
      item.textContent = word.clue;
      list.append(item);
    });
    clues.append(list);
  }
  if (puzzle.showBank) {
    const bank = document.createElement('div');
    bank.className = 'word-bank-note';
    bank.textContent = `单词库：${puzzle.placed.map((word) => word.word).join(' · ')}`;
    clues.append(bank);
  }
  layout.append(clues);
  return layout;
}

function renderPuzzle() {
  const puzzle = state.puzzle;
  if (!puzzle) return;
  const content = $('#puzzle-content');
  content.replaceChildren(puzzle.kind === 'math' ? renderMath(puzzle) : renderWords(puzzle));
  $('#puzzle-title').textContent = puzzle.kind === 'math' ? '今日算术交叉谜题' : '今日单词交叉谜题';
  $('#meta-summary').textContent = puzzle.kind === 'math'
    ? `范围 0–${puzzle.max} · ${puzzle.expressions.length} 条表达式`
    : `${puzzle.placed.length} 个单词已放置${puzzle.unplaced.length ? ` · ${puzzle.unplaced.length} 个未能放置` : ''}`;
  $('#meta-difficulty').textContent = puzzle.difficulty ? { easy: '轻松', normal: '适中', hard: '挑战' }[puzzle.difficulty] : '自定义词表';
  $('#footer-id').textContent = `P&P — ${state.seed.toString(16).toUpperCase()}`;
  $('#puzzle-id').textContent = state.seed.toString(16).toUpperCase().padStart(8, '0');
  if (puzzle.unplaced?.length) showNotice(`有 ${puzzle.unplaced.length} 个词无法与其他词相交，未放入本题。可以增加共享字母的词或重新生成。`, 'error');
  else showNotice('', 'success');
}

function showNotice(message, type = 'success') {
  const notice = $('#notice');
  notice.textContent = message;
  notice.className = message ? `notice ${type}` : 'notice hidden';
}

function generate() {
  const button = $('#generate');
  button.disabled = true;
  const seed = newSeed();
  state.seed = seed;
  if (state.mode === 'math') {
    const custom = Number($('#custom-range').value);
    const max = custom ? Math.max(3, Math.min(500, custom)) : Number($('#range').value);
    const enabled = [...document.querySelectorAll('.operator-options input:checked')].map((input) => input.value);
    if (!enabled.length) {
      showNotice('请至少选择一种运算符。', 'error');
      button.disabled = false;
      return;
    }
    state.puzzle = buildArithmeticPuzzle(seed, max, enabled, Number($('#equation-count').value), $('#difficulty').value);
    state.puzzle.userEntries = {};
  } else {
    const entries = parseWords($('#word-list').value);
    if (entries.length < 2) {
      showNotice('请至少填写两个有效单词。', 'error');
      button.disabled = false;
      return;
    }
    state.puzzle = buildWordPuzzle(seed, entries);
    state.puzzle.userEntries = {};
  }
  renderPuzzle();
  persist();
  button.disabled = false;
}

function collectEntries() {
  if (!state.puzzle) return;
  const entries = {};
  document.querySelectorAll('#puzzle-content input[data-key]').forEach((input) => { entries[input.dataset.key] = input.value; });
  state.puzzle.userEntries = entries;
}

function checkAnswers() {
  const inputs = [...document.querySelectorAll('#puzzle-content input[data-answer]')];
  if (!inputs.length) return;
  let correct = 0;
  let empty = 0;
  for (const input of inputs) {
    const value = input.value.trim().toUpperCase();
    const answer = input.dataset.answer.toUpperCase();
    input.classList.remove('correct', 'incorrect');
    if (!value) { empty += 1; continue; }
    if (value === answer) { correct += 1; input.classList.add('correct'); }
    else input.classList.add('incorrect');
  }
  showNotice(empty ? `${correct} 格正确，还剩 ${empty} 格未填写。红色格子需要修改。` : correct === inputs.length ? '全部正确！做得漂亮。' : `${correct} / ${inputs.length} 格正确，请继续调整红色格子。`, correct === inputs.length && !empty ? 'success' : 'error');
  collectEntries();
  persist();
}

function revealAnswers() {
  document.querySelectorAll('#puzzle-content input[data-answer]').forEach((input) => { input.value = input.dataset.answer; input.classList.remove('incorrect'); input.classList.add('correct'); });
  collectEntries();
  showNotice('答案已显示。你可以清空填写后再挑战一次。', 'success');
  persist();
}

function persist() {
  if (!state.puzzle) return;
  collectEntries();
  try { localStorage.setItem('pen-puzzle-progress', JSON.stringify({ seed: state.seed, mode: state.mode, puzzle: serializePuzzle(state.puzzle) })); } catch { /* Private browsing may block storage. */ }
}

function serializePuzzle(puzzle) {
  return { ...puzzle, grid: [...puzzle.grid.entries()], blankSet: puzzle.blankSet ? [...puzzle.blankSet] : undefined, prefilled: puzzle.prefilled ? [...puzzle.prefilled] : undefined, starts: puzzle.starts ? [...puzzle.starts] : undefined };
}

function restoreSaved() {
  try {
    const data = JSON.parse(localStorage.getItem('pen-puzzle-progress'));
    if (!data?.puzzle) return;
    const puzzle = data.puzzle;
    puzzle.grid = new Map(puzzle.grid);
    if (puzzle.blankSet) puzzle.blankSet = new Set(puzzle.blankSet);
    if (puzzle.prefilled) puzzle.prefilled = new Set(puzzle.prefilled);
    if (puzzle.starts) puzzle.starts = new Map(puzzle.starts);
    state.seed = data.seed;
    state.mode = data.mode;
    state.puzzle = puzzle;
    setMode(state.mode);
    renderPuzzle();
  } catch { /* Ignore stale or unavailable local progress. */ }
}

function printPuzzle(kind) {
  if (!state.puzzle) { showNotice('先生成一份谜题，再进行打印。', 'error'); return; }
  collectEntries();
  const root = $('#print-root');
  root.replaceChildren();
  const sheet = (answers) => {
    const page = document.createElement('section');
    page.className = 'print-sheet';
    const title = document.createElement('h1');
    title.textContent = answers ? '答案页 Answer Key' : '纸笔谜题工坊';
    const summary = document.createElement('div');
    summary.className = 'print-summary';
    summary.textContent = `${state.puzzle.kind === 'math' ? '算术交叉谜题' : '单词交叉谜题'} · 编号 ${state.seed.toString(16).toUpperCase()}${answers ? ' · 参考答案' : ''}`;
    page.append(title, summary);
    const clone = state.puzzle.kind === 'math' ? renderMath(state.puzzle) : renderWords(state.puzzle);
    clone.querySelectorAll('input[data-answer]').forEach((input) => {
      if (answers) input.replaceWith(document.createTextNode(input.dataset.answer));
      else { input.value = ''; input.removeAttribute('value'); }
    });
    page.append(clone);
    if (answers) {
      const banner = document.createElement('div');
      banner.className = 'answer-banner';
      banner.textContent = '答案供核对使用';
      page.append(banner);
    }
    return page;
  };
  if (kind === 'puzzle' || kind === 'both') root.append(sheet(false));
  if (kind === 'answers' || kind === 'both') root.append(sheet(true));
  window.print();
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-button').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $('#math-settings').classList.toggle('hidden', mode !== 'math');
  $('#word-settings').classList.toggle('hidden', mode !== 'words');
}

document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
$('#generate').addEventListener('click', generate);
$('#puzzle-content').addEventListener('input', (event) => {
  if (event.target.matches('input[data-key]')) {
    if (state.puzzle?.kind === 'words') event.target.value = event.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(-1);
    collectEntries();
    persist();
  }
});
$('#puzzle-content').addEventListener('keydown', (event) => {
  const input = event.target;
  if (!input.matches('input[data-key]') || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Enter'].includes(event.key)) return;
  const fields = [...document.querySelectorAll('#puzzle-content input[data-key]')];
  const index = fields.indexOf(input);
  const next = ['ArrowRight', 'ArrowDown', 'Enter'].includes(event.key) ? index + 1 : index - 1;
  if (fields[next]) { event.preventDefault(); fields[next].focus(); }
});
$('#puzzle-content').addEventListener('change', checkAnswers);
$('#reset').addEventListener('click', () => {
  document.querySelectorAll('#puzzle-content input[data-key]').forEach((input) => { input.value = ''; input.classList.remove('correct', 'incorrect'); });
  if (state.puzzle) state.puzzle.userEntries = {};
  showNotice('', 'success');
  persist();
});
$('#save').addEventListener('click', () => { persist(); showNotice('进度已保存在这台设备的浏览器中。', 'success'); });
$('#print-menu-button').addEventListener('click', () => $('#print-menu').classList.toggle('hidden'));
document.querySelectorAll('[data-print]').forEach((button) => button.addEventListener('click', () => {
  $('#print-menu').classList.add('hidden');
  printPuzzle(button.dataset.print);
}));
window.addEventListener('afterprint', () => $('#print-root').replaceChildren());
restoreSaved();
