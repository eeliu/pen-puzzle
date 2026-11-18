import qrcode from './vendor/qrcode-generator.mjs';

export function createPuzzlePageUrl(puzzleId) {
  if (typeof puzzleId !== 'string' || !puzzleId.trim()) {
    throw new Error('A puzzle ID is required to create a share URL');
  }

  const url = new URL('https://eeliu.github.io/pen-puzzle/');
  url.searchParams.set('puzzle', puzzleId);
  return url.toString();
}

export function createPuzzleQrSvg(puzzleId) {
  if (typeof puzzleId !== 'string' || !puzzleId.trim()) {
    throw new Error('A puzzle ID is required to create a QR code');
  }

  const code = qrcode(0, 'M');
  code.addData(puzzleId, 'Byte');
  code.make();
  const cellSize = 5;
  // The quiet zone must span four modules on every side.
  return code.createSvgTag({ cellSize, margin: cellSize * 4, scalable: true });
}
