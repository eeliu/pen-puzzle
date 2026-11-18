import assert from 'node:assert/strict';
import test from 'node:test';
import { createPuzzlePageUrl, createPuzzleQrSvg } from '../puzzle-qr.js';

test('puzzle page URL opens the published page with the puzzle ID', () => {
  const puzzleId = 'PP2-example puzzle/with?reserved&characters';
  const url = new URL(createPuzzlePageUrl(puzzleId));

  assert.equal(url.origin, 'https://eeliu.github.io');
  assert.equal(url.pathname, '/pen-puzzle/');
  assert.equal(url.searchParams.get('puzzle'), puzzleId);
});

test('puzzle page URL rejects missing IDs', () => {
  assert.throws(() => createPuzzlePageUrl(''));
});

test('puzzle QR renderer accepts a puzzle auto-load URL', () => {
  const shareUrl = createPuzzlePageUrl('PP2-example-puzzle-id');

  assert.match(createPuzzleQrSvg(shareUrl), /^<svg\b/);
});

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
