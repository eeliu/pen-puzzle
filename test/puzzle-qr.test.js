import assert from 'node:assert/strict';
import test from 'node:test';
import { createPuzzleQrSvg } from '../puzzle-qr.js';

test('puzzle ID QR renderer returns a scalable SVG', () => {
  const svg = createPuzzleQrSvg('PP2-example-puzzle-id');

  assert.match(svg, /^<svg\b/);
  assert.match(svg, /viewBox=/);
  assert.match(svg, /<path\b/);
});

test('puzzle ID QR renderer supports longer imported IDs', () => {
  const longPuzzleId = `PP2-${'A1_b-'.repeat(160)}`;
  const svg = createPuzzleQrSvg(longPuzzleId);

  assert.match(svg, /^<svg\b/);
  assert.match(svg, /viewBox=/);
});

test('puzzle ID QR renderer rejects missing IDs', () => {
  assert.throws(() => createPuzzleQrSvg(''));
});
