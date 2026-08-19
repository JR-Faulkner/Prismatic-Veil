// 05I — PV Mobile Shell.
//
// Structural phone presentation test. Phaser owns the battlefield, actors,
// animation, camera, particles, and combat state. The active-turn HUD is real
// HTML/CSS layered over the canvas so iPhone sizing, typography, safe areas,
// and touch targets are no longer tied to Phaser canvas text/panel geometry.
//
// Inherits 05H's visible-silhouette Prismel registration fix and 05G's improved
// Too Quiet backyard composition. Combat/state behavior and Pool Splash QA
// staging remain unchanged.

import ActiveTurnBattleSlice05H from './ActiveTurnBattleSlice05H.js?v=1';

class DomButtonAdapter {
  constructor(el) {
    this.el = el;
  }

  once(eventName, callback) {
    if (!this.el) return this;
    const domEvent = eventName === 'pointerdown' ? 'pointerdown' : eventName;
    this.el.addEventListener(domEvent, callback, { once: true });
    return this;
  }

  disableInteractive() {
    if (this.el) this.el.disabled = true;
    return this;
  }

  setAlpha(alpha) {
    if (this.el) this.el.style.opacity = String(alpha);
    return this;
  }
}

export default class ActiveTurnBattleSlice05I extends ActiveTurnBattleSlice05H {
  constructor(scene) {
    super(scene);
    this._mobileShell = null;
    this._shellEls = null;
    this._shellHud = null;
  }

  // With the large canvas HUD removed, let the authored battle scene breathe.
  // Prismel stays foreground dominant, but neither actor has to dodge a giant
  // bottom panel anymore.
  _layoutMetrics() {
    const m = super._layoutMetrics();
    const { w, h } = m;
    if (w > h) {
      const compact = w < 760 || h < 500;
      m.cutin = {
        x: w * (compact ? 0.245 : 0.26),
        bottomY: h * 0.955,
        maxW: w * (compact ? 0.43 : 0.42),
        maxH: h * 0.83
      };
      m.enemy = {
        x: w * (compact ? 0.755 : 0.765),
        bottomY: h * 0.82,
        maxW: w * (compact ? 0.235 : 0.225),
        maxH: h * 0.50
      };
    }
    return m;
  }

  _collectShell() {
    if (this._mobileShell && this._shellEls) return this._shellEls;
    if (typeof document === 'undefined') return null;

    const root = document.getElementById('pv-mobile-shell');
    if (!root) return null;

    const byId = id => document.getElementById(id);
    this._mobileShell = root;
    this._shellEls = {
      root,
      turn: byId('pv-turn-number'),
      active: byId('pv-active-label'),
      targetName: byId('pv-target-name'),
      targetHp: byId('pv-target-hp'),
      targetFill: byId('pv-target-fill'),
      heroName: byId('pv-hero-name'),
      heroHp: byId('pv-hero-hp'),
      heroRp: byId('pv-hero-rp'),
      heroHpFill: byId('pv-hero-hp-fill'),
      heroRpFill: byId('pv-hero-rp-fill'),
      ability: byId('pv-ability-name'),
      damage: byId('pv-predicted-damage'),
      objective: byId('pv-objective'),
      confirm: byId('pv-confirm'),
      back: byId('pv-back')
    };
    return this._shellEls;
  }

  _setShellVisible(visible) {
    const els = this._collectShell();
    if (!els) return;
    els.root.classList.toggle('is-visible', !!visible);
    els.root.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  _renderShell(hero, target) {
    const e = this._collectShell();
    if (!e) return;

    const clamp01 = v => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    const hpFrac = clamp01(hero.hp / Math.max(1, hero.maxHp));
    const rpFrac = clamp01(hero.rp / Math.max(1, hero.maxRp));
    const targetFrac = clamp01(target.hp / Math.max(1, target.maxHp));

    if (e.turn) e.turn.textContent = String(this.scene.turn || 1).padStart(2, '0');
    if (e.active) e.active.textContent = 'PRISMEL';
    if (e.targetName) e.targetName.textContent = String(target.name || 'Hushling').toUpperCase();
    if (e.targetHp) e.targetHp.textContent = `${Math.max(0, target.hp)} / ${target.maxHp}`;
    if (e.targetFill) e.targetFill.style.width = `${targetFrac * 100}%`;
    if (e.heroName) e.heroName.textContent = String(hero.name || 'Prismel').toUpperCase();
    if (e.heroHp) e.heroHp.textContent = `${hero.hp}/${hero.maxHp}`;
    if (e.heroRp) e.heroRp.textContent = `${hero.rp}/${hero.maxRp}`;
    if (e.heroHpFill) e.heroHpFill.style.width = `${hpFrac * 100}%`;
    if (e.heroRpFill) e.heroRpFill.style.width = `${rpFrac * 100}%`;
    if (e.ability) e.ability.textContent = 'PRISMATIC SHARD';
    if (e.damage) e.damage.textContent = '4';
    if (e.objective) e.objective.textContent = 'TOO QUIET  •  DEFEAT HUSHLING  •  VEIL 36%';
  }

  _buildHud(hero, target) {
    const e = this._collectShell();

    // Browser-safe fallback: if the shell markup is ever missing, use 05H's
    // Phaser HUD rather than breaking the battle slice.
    if (!e || !e.confirm || !e.back) return super._buildHud(hero, target);

    this._renderShell(hero, target);
    e.confirm.disabled = false;
    e.back.disabled = false;
    e.confirm.style.opacity = '1';
    e.back.style.opacity = '1';

    // Existing battle-flow code expects a Phaser container for its fade tween.
    // Keep a zero-content adapter container so combat logic remains untouched.
    const container = this.scene.add.container(0, 0).setAlpha(1).setDepth(1);
    this._uiObject(container);

    const hud = {
      container,
      confirmBg: new DomButtonAdapter(e.confirm),
      backBg: new DomButtonAdapter(e.back),
      hero,
      target,
      isDomShell: true
    };
    this._shellHud = hud;
    this._setShellVisible(true);
    return hud;
  }

  _updateHudHp(hud, hero, target) {
    if (hud && hud.isDomShell) {
      this._renderShell(hero, target);
      return;
    }
    super._updateHudHp(hud, hero, target);
  }

  async _fadePresentation(hud) {
    if (hud && hud.isDomShell) this._setShellVisible(false);
    await super._fadePresentation(hud);
  }

  _teardownVisuals() {
    this._setShellVisible(false);
    this._shellHud = null;
    super._teardownVisuals();
  }
}
