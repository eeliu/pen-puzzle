import { buildArithmeticPuzzle, buildWordPuzzle } from './puzzle-core.js';

// Increment this when a generator change can alter output for an existing seed.
export const generatorVersion = 5;
const legacyGeneratorVersion = 1;

const operators = ['+', '−', '×', '÷'];
const difficulties = ['easy', 'normal', 'hard'];
const prefillValues = [0, 0.2, 0.4];

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(encoded) {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Invalid puzzle ID data');
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - encoded.length % 4) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function appendUint32(bytes, value) {
  const seed = value >>> 0;
  bytes.push((seed >>> 24) & 0xff, (seed >>> 16) & 0xff, (seed >>> 8) & 0xff, seed & 0xff);
}

function readUint32(bytes, cursor) {
  if (cursor.offset + 4 > bytes.length) throw new Error('Incomplete puzzle ID data');
  const value = ((bytes[cursor.offset] << 24)
    | (bytes[cursor.offset + 1] << 16)
    | (bytes[cursor.offset + 2] << 8)
    | bytes[cursor.offset + 3]) >>> 0;
  cursor.offset += 4;
  return value;
}

function appendVarUint(bytes, value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid puzzle ID value');
  let remaining = value;
  while (remaining >= 0x80) {
    bytes.push((remaining & 0x7f) | 0x80);
    remaining = Math.floor(remaining / 0x80);
  }
  bytes.push(remaining);
}

function readVarUint(bytes, cursor) {
  let value = 0;
  let multiplier = 1;
  for (let index = 0; index < 8; index += 1) {
    if (cursor.offset >= bytes.length) throw new Error('Incomplete puzzle ID data');
    const byte = bytes[cursor.offset];
    cursor.offset += 1;
    value += (byte & 0x7f) * multiplier;
    if (!Number.isSafeInteger(value)) throw new Error('Invalid puzzle ID value');
    if ((byte & 0x80) === 0) return value;
    multiplier *= 0x80;
  }
  throw new Error('Invalid puzzle ID value');
}

function appendString(bytes, value) {
  const encoded = new TextEncoder().encode(value);
  appendVarUint(bytes, encoded.length);
  for (const byte of encoded) bytes.push(byte);
}

function readString(bytes, cursor) {
  const length = readVarUint(bytes, cursor);
  if (length > bytes.length - cursor.offset) throw new Error('Incomplete puzzle ID data');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(cursor.offset, cursor.offset + length));
  cursor.offset += length;
  return text;
}

function checksum16(bytes) {
  let checksum = 0xffff;
  for (const byte of bytes) {
    checksum ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      checksum = (checksum & 0x8000) ? ((checksum << 1) ^ 0x1021) & 0xffff : (checksum << 1) & 0xffff;
    }
  }
  return checksum;
}

function appendChecksum(bytes) {
  const checksum = checksum16(bytes);
  bytes.push((checksum >>> 8) & 0xff, checksum & 0xff);
}

function validateMathRules(rules) {
  if (!Number.isInteger(rules.max) || rules.max < 3 || rules.max > 500) throw new Error('Invalid arithmetic range');
  if (!Array.isArray(rules.operators) || !rules.operators.length || rules.operators.length > operators.length
      || rules.operators.some((operator) => !operators.includes(operator))) {
    throw new Error('Invalid arithmetic operators');
  }
  if (!Number.isInteger(rules.count) || rules.count < 4 || rules.count > 40 || !difficulties.includes(rules.difficulty)) {
    throw new Error('Invalid arithmetic rules');
  }
}

function validateWordRules(rules) {
  const validEntries = Array.isArray(rules.entries)
    && rules.entries.length >= 2
    && rules.entries.every((entry) => typeof entry.word === 'string' && /^[A-Z]{2,}$/.test(entry.word) && typeof entry.clue === 'string');
  if (!validEntries) throw new Error('Invalid word list');
  if (!prefillValues.includes(rules.prefill) || typeof rules.showBank !== 'boolean') throw new Error('Invalid word rules');
}

function encodeV2(seed, rules) {
  const bytes = [generatorVersion, rules.mode === 'math' ? 0 : 1];
  appendUint32(bytes, seed);

  if (rules.mode === 'math') {
    validateMathRules(rules);
    bytes.push((rules.max >>> 8) & 0xff, rules.max & 0xff, rules.operators.length);
    for (const operator of rules.operators) bytes.push(operators.indexOf(operator));
    bytes.push(rules.count, difficulties.indexOf(rules.difficulty));
  } else if (rules.mode === 'words') {
    validateWordRules(rules);
    bytes.push(prefillValues.indexOf(rules.prefill), rules.showBank ? 1 : 0);
    appendVarUint(bytes, rules.entries.length);
    for (const entry of rules.entries) {
      appendString(bytes, entry.word);
      appendString(bytes, entry.clue);
    }
  } else {
    throw new Error('Unknown puzzle type');
  }

  appendChecksum(bytes);
  return `PP2-${toBase64Url(bytes)}`;
}

function decodeV1(rawId) {
  const match = rawId.match(/^PP1-([0-9A-F]{8})-([A-Za-z0-9_-]+)$/i);
  if (!match) throw new Error('Invalid puzzle ID format');

  const bytes = fromBase64Url(match[2]);
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  const seed = Number.parseInt(match[1], 16) >>> 0;
  if (payload.v !== 1 || payload.g !== legacyGeneratorVersion || (payload.s >>> 0) !== seed) {
    throw new Error('Unsupported puzzle ID version');
  }

  if (payload.m === 'a') {
    const rules = { mode: 'math', max: payload.x, operators: payload.o, count: payload.n, difficulty: payload.d };
    validateMathRules(rules);
    return { seed, rules, generatorVersion: legacyGeneratorVersion };
  }

  if (payload.m === 'w') {
    const rules = { mode: 'words', entries: payload.e, prefill: payload.p, showBank: payload.b };
    validateWordRules(rules);
    return { seed, rules, generatorVersion: legacyGeneratorVersion };
  }

  throw new Error('Unknown puzzle type');
}

function decodeV2(rawId) {
  const match = rawId.match(/^PP2-([A-Za-z0-9_-]+)$/i);
  if (!match) throw new Error('Invalid puzzle ID format');

  const bytes = fromBase64Url(match[1]);
  if (bytes.length < 8) throw new Error('Incomplete puzzle ID data');
  const data = bytes.subarray(0, -2);
  const expectedChecksum = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1];
  if (checksum16(data) !== expectedChecksum) throw new Error('Puzzle ID checksum mismatch');

  const cursor = { offset: 0 };
  const generator = data[cursor.offset++];
  const mode = data[cursor.offset++];
  const seed = readUint32(data, cursor);
  if (![2, 3, 4, 5].includes(generator)) throw new Error('Unsupported puzzle ID version');

  if (mode === 0) {
    if (cursor.offset + 4 > data.length) throw new Error('Incomplete puzzle ID data');
    const max = (data[cursor.offset] << 8) | data[cursor.offset + 1];
    cursor.offset += 2;
    const operatorCount = data[cursor.offset++];
    if (operatorCount < 1 || operatorCount > operators.length || cursor.offset + operatorCount + 2 > data.length) {
      throw new Error('Invalid arithmetic operators');
    }
    const selectedOperators = [];
    for (let index = 0; index < operatorCount; index += 1) {
      const operator = operators[data[cursor.offset++]];
      if (!operator) throw new Error('Invalid arithmetic operators');
      selectedOperators.push(operator);
    }
    const count = data[cursor.offset++];
    const difficulty = difficulties[data[cursor.offset++]];
    const rules = { mode: 'math', max, operators: selectedOperators, count, difficulty };
    validateMathRules(rules);
    if (cursor.offset !== data.length) throw new Error('Unexpected puzzle ID data');
    return { seed, rules, generatorVersion: generator };
  }

  if (mode === 1) {
    if (cursor.offset + 2 > data.length) throw new Error('Incomplete puzzle ID data');
    const prefill = prefillValues[data[cursor.offset++]];
    const showBankValue = data[cursor.offset++];
    if (showBankValue > 1) throw new Error('Invalid word rules');
    const entryCount = readVarUint(data, cursor);
    if (entryCount < 2 || entryCount > data.length) throw new Error('Invalid word list');
    const entries = [];
    for (let index = 0; index < entryCount; index += 1) {
      entries.push({ word: readString(data, cursor), clue: readString(data, cursor) });
    }
    const rules = { mode: 'words', entries, prefill, showBank: showBankValue === 1 };
    validateWordRules(rules);
    if (cursor.offset !== data.length) throw new Error('Unexpected puzzle ID data');
    return { seed, rules };
  }

  throw new Error('Unknown puzzle type');
}

export function encodePuzzleId(seed, rules) {
  return encodeV2(seed >>> 0, rules);
}

export function decodePuzzleId(rawId) {
  const normalized = rawId.trim();
  const prefix = normalized.slice(0, 4).toUpperCase();
  if (prefix === 'PP1-') return decodeV1(normalized);
  if (prefix === 'PP2-') return decodeV2(normalized);
  throw new Error('Invalid puzzle ID format');
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
  const puzzle = buildPuzzleFromRules(decoded.seed, decoded.rules);
  return { ...decoded, puzzle };
}
