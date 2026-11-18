import { buildArithmeticPuzzle, buildWordPuzzle } from './puzzle-core.js';

// Increment this when a generator change can alter output for an existing seed.
export const generatorVersion = 1;

export function encodePuzzleId(seed, rules) {
  const payload = rules.mode === 'math'
    ? { v: 1, g: generatorVersion, m: 'a', x: rules.max, o: rules.operators, n: rules.count, d: rules.difficulty }
    : { v: 1, g: generatorVersion, m: 'w', e: rules.entries, p: rules.prefill, b: rules.showBank };
  payload.s = seed >>> 0;

  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `PP1-${payload.s.toString(16).toUpperCase().padStart(8, '0')}-${encoded}`;
}

export function decodePuzzleId(rawId) {
  const match = rawId.trim().match(/^PP1-([0-9A-F]{8})-([A-Za-z0-9_-]+)$/i);
  if (!match) throw new Error('Invalid puzzle ID format');

  const base64 = match[2].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - match[2].length % 4) % 4);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  const seed = Number.parseInt(match[1], 16) >>> 0;

  if (payload.v !== 1 || payload.g !== generatorVersion || (payload.s >>> 0) !== seed) {
    throw new Error('Unsupported puzzle ID version');
  }

  if (payload.m === 'a') {
    if (!Number.isInteger(payload.x) || payload.x < 3 || payload.x > 500) throw new Error('Invalid arithmetic range');
    if (!Array.isArray(payload.o) || !payload.o.length || payload.o.some((operator) => !['+', '−', '×', '÷'].includes(operator))) {
      throw new Error('Invalid arithmetic operators');
    }
    if (!Number.isInteger(payload.n) || payload.n < 4 || payload.n > 40 || !['easy', 'normal', 'hard'].includes(payload.d)) {
      throw new Error('Invalid arithmetic rules');
    }
    return { seed, rules: { mode: 'math', max: payload.x, operators: payload.o, count: payload.n, difficulty: payload.d } };
  }

  if (payload.m === 'w') {
    const validEntries = Array.isArray(payload.e)
      && payload.e.length >= 2
      && payload.e.every((entry) => typeof entry.word === 'string' && /^[A-Z]{2,}$/.test(entry.word) && typeof entry.clue === 'string');
    if (!validEntries) throw new Error('Invalid word list');
    if (![0, 0.2, 0.4].includes(payload.p) || typeof payload.b !== 'boolean') throw new Error('Invalid word rules');
    return { seed, rules: { mode: 'words', entries: payload.e, prefill: payload.p, showBank: payload.b } };
  }

  throw new Error('Unknown puzzle type');
}

export function buildPuzzleFromRules(seed, rules) {
  if (rules.mode === 'math') {
    return buildArithmeticPuzzle(seed, rules.max, rules.operators, rules.count, rules.difficulty);
  }
  if (rules.mode === 'words') {
    return buildWordPuzzle(seed, rules.entries, rules.prefill, rules.showBank);
  }
  throw new Error('Unknown puzzle type');
}

export function buildPuzzleFromId(puzzleId) {
  const decoded = decodePuzzleId(puzzleId);
  return { ...decoded, puzzle: buildPuzzleFromRules(decoded.seed, decoded.rules) };
}
