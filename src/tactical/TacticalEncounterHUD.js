// Tactical Encounter HUD — Batch 03A
//
// Presentation-only encounter framing for Too Quiet.
// Owns:
//   - upper-left objective panel with exact encounter copy + sound-node states
//   - upper-right enemy cards with name / HP / portrait, no levels
//
// Does NOT own:
//   - turn sequencing
//   - combat logic
//   - target selection
//   - enemy AI
//   - node restoration logic
//
// TacticalScene passes live enemy/node state into refresh().
export default class TacticalEncounterHUD {
  constructor(scene, nodes, enemies) {
    this.scene = scene;
    this.nodes = nodes;
    this.enemies = enemies;

    this.container = scene.add.container(0, 0);
    this.objective = null;
    this.enemyCards = [];
    this.bottomY = 0;
  }

  create() {
    this.objective = this._buildObjectivePanel();
    this.enemyCards = this.enemies.map((enemy, i) => this._buildEnemyCard(enemy, i));

    this.container.add(this.objective.container);
    this.enemyCards.forEach(c => this.container.add(c.container));
    return this;
  }

  _buildObjectivePanel() {
    const container = this.scene.add.container(0, 0);

    const outerGlow = this.scene.add.rectangle(0, 0, 10, 10, 0x8a5cff, 0.10)
      .setOrigin(0, 0)
      .setBlendMode(Phaser.BlendModes.ADD);

    const bg = this.scene.add.rectangle(0, 0, 10, 10, 0x080b1a, 0.91)
      .setOrigin(0, 0)
      .setStrokeStyle(1.5, 0xc6a45a, 0.92);

    const inner = this.scene.add.rectangle(0, 0, 10, 10, 0x10182b, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x6d5a8a, 0.48);

    const title = this.scene.add.text(0, 0, 'Too Quiet', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      color: '#FFE8A0'
    }).setOrigin(0, 0);

    const goal = this.scene.add.text(0, 0, 'Goal: Restore all 3 sound nodes.', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      color: '#F4E7C0'
    }).setOrigin(0, 0);

    const optional = this.scene.add.text(0, 0, 'Defeating every enemy is optional.', {
      fontFamily: 'Georgia, serif',
      color: '#C8A8FF'
    }).setOrigin(0, 0);

    const div = this.scene.add.rectangle(0, 0, 10, 1, 0xc6a45a, 0.35).setOrigin(0, 0.5);

    const rows = this.nodes.map(node => {
      const marker = this.scene.add.circle(0, 0, 4.5, 0x8a5cff, 0.22)
        .setStrokeStyle(1.2, 0xc8a8ff, 0.82);
      const label = this.scene.add.text(0, 0, node.label, {
        fontFamily: 'Georgia, serif',
        color: '#E8E5F5'
      }).setOrigin(0, 0.5);
      container.add([marker, label]);
      return { node, marker, label };
    });

    container.add([outerGlow, bg, inner, title, goal, optional, div]);
    // Keep authored order behind row objects.
    container.sendToBack(outerGlow);
    container.sendToBack(bg);
    container.moveAbove(inner, bg);

    return { container, outerGlow, bg, inner, title, goal, optional, div, rows, width: 0, height: 0 };
  }

  _buildEnemyCard(enemy, index) {
    const container = this.scene.add.container(0, 0);

    const accent = enemy.type === 'veil_wraith' ? 0x9b63df : 0xb94a43;

    const glow = this.scene.add.rectangle(0, 0, 10, 10, accent, 0.08)
      .setOrigin(0, 0)
      .setBlendMode(Phaser.BlendModes.ADD);

    const bg = this.scene.add.rectangle(0, 0, 10, 10, 0x090b18, 0.91)
      .setOrigin(0, 0)
      .setStrokeStyle(1.3, 0xc6a45a, 0.86);

    const portraitFrame = this.scene.add.circle(0, 0, 10, 0x111326, 0.95)
      .setStrokeStyle(1.4, accent, 0.86);

    const portrait = this.scene.add.image(0, 0, enemy.portraitKey).setOrigin(0.5);

    // Circular mask is deliberately avoided here. Phaser bitmap masks inside
    // UI-layer Containers have historically been a source of cross-camera
    // surprises in this project. The frame itself gives a compact portrait
    // read while keeping the implementation robust.
    const name = this.scene.add.text(0, 0, enemy.name, {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      color: '#FFE8A0'
    }).setOrigin(0, 0.5);

    const hpTrack = this.scene.add.rectangle(0, 0, 10, 8, 0x24121c, 0.95).setOrigin(0, 0.5);
    const hpFill = this.scene.add.rectangle(0, 0, 10, 8, 0xa8243f, 1).setOrigin(0, 0.5);
    const hpText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const deadVeil = this.scene.add.rectangle(0, 0, 10, 10, 0x05060b, 0.62)
      .setOrigin(0, 0)
      .setVisible(false);

    container.add([glow, bg, portraitFrame, portrait, name, hpTrack, hpFill, hpText, deadVeil]);

    return {
      container, enemy, glow, bg, portraitFrame, portrait,
      name, hpTrack, hpFill, hpText, deadVeil,
      width: 0, height: 0, barW: 0
    };
  }

  layout(viewW, viewH, options = {}) {
    const margin = options.margin || 12;
    const topY = options.topY || margin;
    const compact = !!options.compact;
    const narrow = viewW < 620;

    if (narrow) {
      // Portrait/narrow phone: objective becomes the dominant full-width
      // encounter summary, enemy cards become a compact row beneath it.
      const objectiveW = Math.max(280, viewW - margin * 2);
      const objH = this._layoutObjective(objectiveW, compact);
      this.objective.container.setPosition(margin, topY);

      const rowY = topY + objH + 7;
      const gap = 5;
      const aliveOrAll = this.enemyCards;
      const availableW = viewW - margin * 2 - gap * Math.max(0, aliveOrAll.length - 1);
      const cardW = Math.max(78, Math.min(118, availableW / Math.max(1, aliveOrAll.length)));
      let x = margin;
      let maxH = 0;

      aliveOrAll.forEach(c => {
        const h = this._layoutEnemyCard(c, cardW, true);
        c.container.setPosition(x, rowY);
        x += cardW + gap;
        maxH = Math.max(maxH, h);
      });

      this.bottomY = rowY + maxH;
      return this.bottomY;
    }

    // Landscape/desktop: objective left, enemy stack right. This opens the
    // center/top of the battlefield compared with the old giant centered
    // Goal plate and keeps house/environment cues visible.
    const objectiveW = Math.min(compact ? 245 : 286, viewW * 0.34);
    const objH = this._layoutObjective(objectiveW, compact);
    this.objective.container.setPosition(margin, topY);

    const enemyW = Math.min(compact ? 154 : 182, viewW * 0.23);
    let enemyY = topY;
    const enemyGap = compact ? 5 : 7;
    this.enemyCards.forEach(c => {
      const h = this._layoutEnemyCard(c, enemyW, compact);
      c.container.setPosition(viewW - margin - enemyW, enemyY);
      enemyY += h + enemyGap;
    });

    this.bottomY = Math.max(topY + objH, enemyY - enemyGap);
    return this.bottomY;
  }

  _layoutObjective(width, compact) {
    const p = this.objective;
    const pad = compact ? 10 : 12;
    const titleSize = compact ? 17 : 20;
    const goalSize = compact ? 11 : 12;
    const optSize = compact ? 10 : 11;
    const rowSize = compact ? 11 : 12;
    const rowH = compact ? 18 : 21;

    const topBlockH = compact ? 72 : 82;
    const height = topBlockH + p.rows.length * rowH + pad;

    p.width = width;
    p.height = height;

    p.outerGlow.setPosition(-3, -3).setSize(width + 6, height + 6);
    p.bg.setSize(width, height);
    p.inner.setPosition(4, 4).setSize(width - 8, height - 8);

    p.title.setPosition(pad, pad - 1).setFontSize(titleSize);
    p.goal.setPosition(pad, pad + titleSize + 6)
      .setFontSize(goalSize)
      .setWordWrapWidth(width - pad * 2);
    p.optional.setPosition(pad, pad + titleSize + 25)
      .setFontSize(optSize)
      .setWordWrapWidth(width - pad * 2);

    const divY = topBlockH - 8;
    p.div.setPosition(pad, divY).setSize(width - pad * 2, 1);

    p.rows.forEach((r, i) => {
      const cy = topBlockH + i * rowH;
      r.marker.setPosition(pad + 5, cy);
      r.label.setPosition(pad + 16, cy).setFontSize(rowSize);
    });

    return height;
  }

  _layoutEnemyCard(card, width, compact) {
    const h = compact ? Math.round(width * 0.38) : Math.round(width * 0.40);
    const pad = compact ? 6 : 8;
    const portraitD = h - pad * 2;
    const portraitX = pad + portraitD / 2;
    const cy = h / 2;

    card.width = width;
    card.height = h;

    card.glow.setPosition(-2, -2).setSize(width + 4, h + 4);
    card.bg.setSize(width, h);

    card.portraitFrame.setPosition(portraitX, cy).setRadius(portraitD / 2);

    const tex = card.portrait.texture.getSourceImage();
    const sourceW = tex && tex.width ? tex.width : 1;
    const sourceH = tex && tex.height ? tex.height : 1;
    const target = portraitD * 0.90;
    card.portrait.setPosition(portraitX, cy)
      .setDisplaySize(
        sourceW >= sourceH ? target : target * (sourceW / sourceH),
        sourceH >= sourceW ? target : target * (sourceH / sourceW)
      );

    const contentX = pad + portraitD + pad;
    const contentW = width - contentX - pad;
    card.name.setPosition(contentX, compact ? h * 0.29 : h * 0.28)
      .setFontSize(compact ? Math.max(9, width * 0.065) : Math.max(11, width * 0.065));

    const barY = h * 0.64;
    const barH = Math.max(6, h * 0.14);
    card.barW = contentW;
    card.hpTrack.setPosition(contentX, barY).setSize(contentW, barH);
    card.hpFill.setPosition(contentX, barY).setSize(contentW, barH);
    card.hpText.setPosition(contentX + contentW / 2, barY)
      .setFontSize(compact ? 8 : 9);

    card.deadVeil.setSize(width, h);
    return h;
  }

  refresh() {
    // Objective rows.
    this.objective.rows.forEach(r => {
      const restored = !!r.node.restored;
      r.marker
        .setFillStyle(restored ? 0xffd56a : 0x8a5cff, restored ? 0.72 : 0.18)
        .setStrokeStyle(1.2, restored ? 0xfff3c8 : 0xc8a8ff, restored ? 0.95 : 0.74);
      r.label
        .setColor(restored ? '#FFE8A0' : '#E8E5F5')
        .setText(`${r.node.label}${restored ? '  ✓' : ''}`);
    });

    // Enemy cards.
    this.enemyCards.forEach(c => {
      const e = c.enemy;
      const alive = !!e.alive && e.hp > 0;
      const frac = e.maxHp ? Phaser.Math.Clamp(e.hp / e.maxHp, 0, 1) : 0;

      c.container.setAlpha(alive ? 1 : 0.58);
      c.hpFill.setSize(Math.max(1, c.barW * frac), c.hpFill.height);
      c.hpText.setText(alive ? `${Math.max(0, e.hp)} / ${e.maxHp}` : 'DEFEATED');
      c.deadVeil.setVisible(!alive);

      if (alive && frac <= 0.25) {
        c.hpFill.setFillStyle(0xe54a58, 1);
      } else {
        c.hpFill.setFillStyle(0xa8243f, 1);
      }
    });
  }
}
