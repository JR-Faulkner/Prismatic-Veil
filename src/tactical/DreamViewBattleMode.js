// Dream View Battle Mode Sandbox — 05D-1
//
// Opt-in, query-param-gated transition QA for the Tactical -> Battle
// Presentation doorway. This sandbox does NOT launch VeilBattleScene and
// does NOT mutate HP, turn state, node state, or BattleResult data.
//
// Activate:
//   tactical-field-v2.html?dreamview=battle
//
// Optional:
//   hero=prismel|auryi|kineza
//   enemy=hushling_1|hushling_2|hushling_3|wraith_1
//   action=attack|resonart
//   hud=0|1
//   labels=0|1
//   repeat=0|1
export default class DreamViewBattleMode {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
    this.timers = [];
    this._running = false;
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('dreamview') === 'battle';
  }

  _bool(params, key, fallback) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    return !['0', 'false', 'off', 'no'].includes(raw.toLowerCase());
  }

  _oneOf(params, key, allowed, fallback) {
    const raw = (params.get(key) || fallback).toLowerCase();
    return allowed.includes(raw) ? raw : fallback;
  }

  _hero(id) {
    return this.scene.heroes.find(h => h.id === id) || this.scene.heroes[0];
  }

  _enemy(id) {
    return this.scene.enemies.find(e => e.id === id)
      || this.scene.enemies.find(e => e.alive)
      || this.scene.enemies[0];
  }

  _timer(ms, cb) {
    const t = this.scene.time.delayedCall(ms, cb);
    this.timers.push(t);
    return t;
  }

  _delay(ms) {
    return new Promise(resolve => this._timer(ms, resolve));
  }

  _worldGraphics(depth) {
    const g = this.scene.add.graphics().setDepth(depth);
    this.scene.worldAdd(g);
    this.layers.push(g);
    return g;
  }

  _uiObject(obj) {
    obj.setDepth(9998);
    this.scene.uiAdd(obj);
    this.layers.push(obj);
    return obj;
  }

  _clear() {
    this.timers.forEach(t => {
      if (t && t.remove) t.remove(false);
    });
    this.timers = [];
    this.layers.forEach(o => {
      if (o && o.destroy) o.destroy();
    });
    this.layers = [];
  }

  _hideHud() {
    const s = this.scene;
    [
      s.phaseFrame, s.turnText, s.goalFrame, s.goalPrimaryText,
      s.goalSecondaryText, s.messageText, s.heroCardsDrawer
    ].forEach(o => {
      if (o && o.setVisible) o.setVisible(false);
    });
    if (s.hudHandle && s.hudHandle.container) s.hudHandle.container.setVisible(false);
    if (s.actionMenu && s.actionMenu.container) s.actionMenu.container.setVisible(false);
    if (s.zoomControls && s.zoomControls.container) s.zoomControls.container.setVisible(false);
  }

  _label(text) {
    const s = this.scene;
    const label = s.add.text(10, 10, text, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#f7e8b6',
      backgroundColor: '#090a14',
      padding: { x: 8, y: 8 },
      lineSpacing: 3
    }).setScrollFactor(0);
    this._uiObject(label);
    return label;
  }

  _message(text) {
    if (this.scene.setMessage) this.scene.setMessage(text);
  }

  _showSelected(hero) {
    if (this.scene.grid && this.scene.grid.showSelectedSigil) {
      this.scene.grid.showSelectedSigil(hero);
      return;
    }

    const p = this.scene.grid.toScreen(hero.x, hero.y);
    const g = this._worldGraphics(4);
    g.lineStyle(1.6, 0xffe8a0, 0.78);
    g.strokeEllipse(p.x, p.y + 3, 38, 14);
    g.lineStyle(3, 0x9f78ff, 0.18);
    g.strokeEllipse(p.x, p.y + 3, 44, 18);
  }

  _drawTargetRing(enemy) {
    const p = this.scene.grid.toScreen(enemy.x, enemy.y);
    const g = this._worldGraphics(6.8);
    const hushling = enemy.type === 'hushling';
    const w = hushling ? 78 : 48;
    const h = hushling ? 24 : 38;

    g.lineStyle(2.2, 0xff503c, 0.74);
    g.strokeEllipse(p.x, p.y + 3, w, h);
    g.lineStyle(4.5, 0x9f78ff, 0.16);
    g.strokeEllipse(p.x, p.y + 3, w + 8, h + 6);
    return g;
  }

  _drawResonanceThread(hero, enemy) {
    const a = this.scene.grid.toScreen(hero.x, hero.y);
    const b = this.scene.grid.toScreen(enemy.x, enemy.y);
    const g = this._worldGraphics(6.2);

    g.lineStyle(1.4, 0x9fe0ff, 0.46);
    g.beginPath();
    g.moveTo(a.x, a.y - 18);
    g.lineTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 34);
    g.lineTo(b.x, b.y - 18);
    g.strokePath();

    g.fillStyle(0xffe8a0, 0.70);
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 30;
      g.fillCircle(x, y, i % 2 ? 1.6 : 1.1);
    }
    return g;
  }

  _battleCurtain(alpha = 0) {
    const s = this.scene;
    const w = s.scale.width;
    const h = s.scale.height;
    const c = s.add.container(0, 0);
    const wash = s.add.rectangle(0, 0, w, h, 0x080612, alpha).setOrigin(0, 0);
    const left = s.add.polygon(0, 0, [
      0, 0, w * 0.44, 0, w * 0.34, h, 0, h
    ], 0x28134f, 0.42).setOrigin(0, 0);
    const right = s.add.polygon(0, 0, [
      w, 0, w * 0.56, 0, w * 0.66, h, w, h
    ], 0x130b2e, 0.52).setOrigin(0, 0);
    c.add([wash, left, right]);
    c.setAlpha(0);
    this._uiObject(c);
    return c;
  }

  _battlePreviewCard(hero, enemy, action) {
    const s = this.scene;
    const w = s.scale.width;
    const h = s.scale.height;
    const compact = w < 560 || h < 520;

    const c = s.add.container(0, 0).setAlpha(0);
    const panelW = Math.min(w * 0.86, 620);
    const panelH = compact ? Math.min(h * 0.50, 230) : 270;
    const x = w / 2;
    const y = h / 2;

    const bg = s.add.rectangle(x, y, panelW, panelH, 0x090816, 0.88)
      .setStrokeStyle(1.5, 0xffe8a0, 0.55);

    const title = s.add.text(x, y - panelH * 0.40, 'BATTLE PRESENTATION PREVIEW', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      fontSize: compact ? '14px' : '18px',
      color: '#FFE8A0'
    }).setOrigin(0.5);

    const heroText = s.add.text(x - panelW * 0.25, y - 16, hero.name, {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      fontSize: compact ? '18px' : '24px',
      color: '#9FE0FF'
    }).setOrigin(0.5);

    const vs = s.add.text(x, y - 16, 'VS', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      fontSize: compact ? '18px' : '24px',
      color: '#FFE8A0'
    }).setOrigin(0.5);

    const enemyText = s.add.text(x + panelW * 0.25, y - 16, enemy.name, {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      fontSize: compact ? '18px' : '24px',
      color: '#FF8B9A'
    }).setOrigin(0.5);

    const act = s.add.text(x, y + panelH * 0.22, `${action.toUpperCase()} doorway only — HP unchanged`, {
      fontFamily: 'Georgia, serif',
      fontSize: compact ? '12px' : '15px',
      color: '#C8A8FF'
    }).setOrigin(0.5);

    const result = s.add.text(x, y + panelH * 0.36, 'Preview result beat: damage line / tap gate / return stitch', {
      fontFamily: 'Georgia, serif',
      fontSize: compact ? '11px' : '13px',
      color: '#F7E8B6'
    }).setOrigin(0.5);

    c.add([bg, title, heroText, vs, enemyText, act, result]);
    this._uiObject(c);
    return c;
  }

  _returnStitch(hero, enemy) {
    const a = this.scene.grid.toScreen(hero.x, hero.y);
    const b = this.scene.grid.toScreen(enemy.x, enemy.y);
    const g = this._worldGraphics(8.0);

    g.lineStyle(1.2, 0xffe8a0, 0.56);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      g.beginPath();
      g.moveTo(x - 8, y - 8);
      g.lineTo(x + 7, y + 7);
      g.strokePath();
    }

    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 520,
      ease: 'Sine.easeOut',
      onComplete: () => g.destroy()
    });
  }

  async _runSequence(hero, enemy, action, repeat) {
    if (this._running) return;
    this._running = true;

    const s = this.scene;
    s.inputLocked = true;
    if (s.grid && s.grid.clearAllOverlays) s.grid.clearAllOverlays();

    this._showSelected(hero);
    this._drawTargetRing(enemy);
    this._drawResonanceThread(hero, enemy);

    this._message(`${hero.name} lines up ${action.toUpperCase()} against ${enemy.name}.`);
    s.tacticalCamera.focusOn(hero.x, hero.y, 260);
    await this._delay(420);

    s.tacticalCamera.focusOn(enemy.x, enemy.y, 360);
    await this._delay(460);

    this._message('The backyard folds toward the Veil...');
    const curtain = this._battleCurtain(0.0);
    s.tweens.add({ targets: curtain, alpha: 1, duration: 420, ease: 'Sine.easeInOut' });
    await this._delay(500);

    const card = this._battlePreviewCard(hero, enemy, action);
    s.tweens.add({ targets: card, alpha: 1, duration: 260, ease: 'Sine.easeOut' });
    await this._delay(1250);

    this._message('Preview return: Tactical state remains unchanged.');
    s.tweens.add({ targets: card, alpha: 0, duration: 260, ease: 'Sine.easeIn' });
    await this._delay(280);

    this._returnStitch(hero, enemy);
    s.tweens.add({ targets: curtain, alpha: 0, duration: 480, ease: 'Sine.easeInOut' });
    s.tacticalCamera.focusOn(hero.x, hero.y, 360);
    await this._delay(560);

    this._message('Dream Battle preview complete. No HP, turn, or objective state changed.');
    s.inputLocked = false;
    this._running = false;

    if (repeat) {
      this._timer(1100, () => {
        this._clear();
        this._runSequence(hero, enemy, action, repeat);
      });
    }
  }

  apply() {
    if (!this.isEnabled()) return false;

    const s = this.scene;
    const params = new URLSearchParams(window.location.search);
    const heroId = this._oneOf(params, 'hero', ['prismel', 'auryi', 'kineza'], 'prismel');
    const enemyId = this._oneOf(params, 'enemy', ['hushling_1', 'hushling_2', 'hushling_3', 'wraith_1'], 'hushling_3');
    const action = this._oneOf(params, 'action', ['attack', 'resonart'], 'attack');
    const hud = this._bool(params, 'hud', true);
    const labels = this._bool(params, 'labels', true);
    const repeat = this._bool(params, 'repeat', false);

    const hero = this._hero(heroId);
    const enemy = this._enemy(enemyId);

    if (!hud) this._hideHud();

    if (labels) {
      this._label(
        `DREAM BATTLE MODE QA\n` +
        `hero: ${hero.id}\n` +
        `enemy: ${enemy.id}\n` +
        `action: ${action}\n` +
        `visual-only; no battle launch; no state mutation`
      );
    }

    window.__PV_DREAM_BATTLE__ = {
      heroId: hero.id,
      enemyId: enemy.id,
      action,
      repeat,
      stateMutation: false,
      launchesBattleScene: false
    };

    this._runSequence(hero, enemy, action, repeat);
    return true;
  }
}
