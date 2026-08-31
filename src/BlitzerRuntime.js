// Compact web/mobile carrier for Kineza's 18-frame Blitzer sheet.
// Runtime payload parts are base64 text chunks. Reassemble the text,
// decode it into the original WebP bytes, then expose a blob URL to Phaser.
const PARTS = ['p01.bin','p02.bin','p03.bin','p04.bin','p05.bin','p06.bin']
  .map(name => new URL(`../assets/runtime/blitzer/${name}`, import.meta.url));

const chunks = await Promise.all(PARTS.map(async url => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Blitzer runtime payload failed: ${url}`);
  return (await response.text()).replace(/\s+/g, '');
}));

const base64 = chunks.join('');
let binary;
try {
  binary = atob(base64);
} catch (error) {
  throw new Error(`Blitzer runtime base64 decode failed: ${error?.message || error}`);
}

const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

// WebP RIFF sanity check. Fails loudly at module import instead of letting
// Phaser limp into create() with a missing attack texture.
if (bytes.length < 12 || String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' ||
    String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP') {
  throw new Error('Blitzer runtime payload is not a valid WebP RIFF stream.');
}

export const BLITZER_SHEET_DATA_URI = URL.createObjectURL(
  new Blob([bytes], { type: 'image/webp' })
);
