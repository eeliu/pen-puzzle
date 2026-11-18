import qrcode from './vendor/qrcode-generator.mjs';

export function createPuzzleQrSvg(puzzleId) {
  if (typeof puzzleId !== 'string' || !puzzleId.trim()) {
    throw new Error('A puzzle ID is required to create a QR code');
  }

  const code = qrcode(0, 'M');
  code.addData(puzzleId, 'Byte');
  code.make();
  return code.createSvgTag({ cellSize: 5, margin: 4, scalable: true });
}
