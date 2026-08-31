// Compact web/mobile carrier for Kineza's 18-frame Blitzer sheet.
// The PZ production masters stay at 768px/frame; runtime parts reconstruct
// a 128px/frame WebP sheet in-browser before Phaser preloads it.
const PARTS = ['p01.bin','p02.bin','p03.bin','p04.bin','p05.bin','p06.bin']
  .map(name => new URL(`../assets/runtime/blitzer/${name}`, import.meta.url));

const buffers = await Promise.all(PARTS.map(async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Blitzer runtime payload failed: ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}));

const total = buffers.reduce((sum, bytes) => sum + bytes.length, 0);
const joined = new Uint8Array(total);
let offset = 0;
for (const bytes of buffers) {
  joined.set(bytes, offset);
  offset += bytes.length;
}

export const BLITZER_SHEET_DATA_URI = URL.createObjectURL(
  new Blob([joined], { type: 'image/webp' })
);
