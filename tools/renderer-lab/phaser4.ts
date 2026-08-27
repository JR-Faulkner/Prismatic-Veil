import * as Phaser from 'phaser';

declare global {
  interface Window {
    __pvPhaser4LabReady?: boolean;
    __pvPhaser4Lab?: {
      phaserVersion: string;
      renderer: string;
      filters: readonly string[];
      productionRendererChanged: false;
    };
  }
}

class VeilRendererLab extends Phaser.Scene {
  constructor() {
    super('VeilRendererLab');
  }

  create() {
    const { width, height } = this.scale;

    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(0x070817, 0x070817, 0x25124b, 0x12091f, 1);
    backdrop.fillRect(0, 0, width, height);

    const horizon = this.add.graphics();
    horizon.lineStyle(1, 0x8d4dff, 0.18);
    for (let y = height * 0.54; y < height; y += 24) horizon.lineBetween(0, y, width, y);
    for (let x = 0; x < width; x += 44) horizon.lineBetween(width / 2, height * 0.5, x, height);

    const veil = this.add.graphics();
    veil.fillStyle(0x6b37b7, 0.13);
    veil.fillEllipse(width * 0.68, height * 0.48, width * 0.45, height * 0.62);
    veil.enableFilters();
    if (!veil.filters) throw new Error('Phaser 4 filter list unavailable on Veil distortion layer after enableFilters()');
    const barrel = veil.filters.external.addBarrel(1.03);

    const crystal = this.add.graphics({ x: width * 0.5, y: height * 0.52 });
    crystal.fillStyle(0xd7c6ff, 0.95);
    crystal.lineStyle(3, 0xffd97a, 0.92);
    crystal.beginPath();
    crystal.moveTo(0, -92);
    crystal.lineTo(48, -18);
    crystal.lineTo(30, 75);
    crystal.lineTo(0, 105);
    crystal.lineTo(-30, 75);
    crystal.lineTo(-48, -18);
    crystal.closePath();
    crystal.fillPath();
    crystal.strokePath();
    crystal.enableFilters();
    if (!crystal.filters) throw new Error('Phaser 4 filter list unavailable on prismatic crystal after enableFilters()');
    const glow = crystal.filters.external.addGlow(0x9b65ff, 5, 0.8, 1, false, 10, 12);
    crystal.filters.external.addBarrel(1.015);

    const shardA = this.add.triangle(width * 0.34, height * 0.48, 0, 48, 22, 0, 44, 48, 0x7b4fd2, 0.75);
    const shardB = this.add.triangle(width * 0.67, height * 0.58, 0, 44, 18, 0, 36, 44, 0xf0c96d, 0.72);
    shardA.enableFilters();
    shardB.enableFilters();
    if (!shardA.filters || !shardB.filters) throw new Error('Phaser 4 filter list unavailable on shard layer after enableFilters()');
    shardA.filters.external.addGlow(0x7348c8, 3, 0, 1, false, 8, 8);
    shardB.filters.external.addGlow(0xffd876, 2.5, 0, 1, false, 8, 8);

    const color = this.cameras.main.filters.internal.addColorMatrix();
    color.colorMatrix.saturate(0.18);

    this.tweens.add({
      targets: crystal,
      rotation: { from: -0.025, to: 0.025 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: glow,
      outerStrength: { from: 3.6, to: 7.2 },
      duration: 1250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: barrel,
      amount: { from: 0.985, to: 1.035 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({ targets: shardA, y: shardA.y - 14, duration: 1450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: shardB, y: shardB.y + 12, duration: 1650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const renderer = this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas';
    const filters = ['Glow', 'Barrel', 'ColorMatrix'] as const;

    window.__pvPhaser4Lab = {
      phaserVersion: Phaser.VERSION,
      renderer,
      filters,
      productionRendererChanged: false
    };
    window.__pvPhaser4LabReady = true;

    const status = document.querySelector<HTMLElement>('#status');
    if (status) {
      status.innerHTML = `
        <strong>PRIZIM · PHASER 4 RENDERER LAB</strong>
        <span>Phaser ${Phaser.VERSION} · ${renderer}</span>
        <span>Native filters: ${filters.join(' + ')}</span>
        <span>Production authority: Phaser 3 unchanged</span>
      `;
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'lab',
  backgroundColor: '#070817',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
  scene: VeilRendererLab
};

new Phaser.Game(config);
