// LIVE26 Auryi harmonized FX atlas.
// The production atlas is split only to keep repository payloads manageable.
import part00 from './auryiFxAtlasPart00.js?v=live26';
import part01 from './auryiFxAtlasPart01.js?v=live26';

export const AURYI_FX_ATLAS_WIDTH = 1536;
export const AURYI_FX_ATLAS_HEIGHT = 704;
export const AURYI_FX_CELL_W = 192;

export const AURYI_FX_ROWS = Object.freeze({
  crown: Object.freeze({ y: 0, h: 128, count: 8 }),
  charge: Object.freeze({ y: 128, h: 128, count: 8 }),
  projectile: Object.freeze({ y: 256, h: 128, count: 8 }),
  impact: Object.freeze({ y: 384, h: 192, count: 8 }),
  recompose: Object.freeze({ y: 576, h: 128, count: 6 })
});

export default `data:image/webp;base64,${part00}${part01}`;
