// PriZim Duo-Hybrid Formation Adapter v0.14
// Keeps PartyBattleScene's proven attack-resolution contract while routing
// Kineza and Auryi through PriZim Sequence Mode.
// Neutral JSON manifests remain canonical presentation authority.

import PartyFormationView from '../PartyFormationView.js?v=duo-base-1';
import DuoHybridSequenceDriver from './DuoHybridSequenceDriver.js?v=duo-8';

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const lerp = (a, b, t) => a + (b - a) * t;

const KINEZA_BLITZER_DUO = Object.freeze({
  id: 'kineza_blitzer_basic_v1',
  name: 'Blitzer',
  manifest: './pv-data/sequences/kineza_blitzer.duo.sequence.json',
  version: '6',
  markerFrames: Object.freeze({
    gather: Object.freeze([1, 2, 3]),
    release: Object.freeze([4, 5, 6]),
    impact: Object.freeze([11]),
    recover: Object.freeze([14, 15, 16, 17])
  }),
  povFrames: Object.freeze([])
});

const AURYI_ENTRY_DUO = Object.freeze({
  id: 'auryi_turn_entry_v2',
  name: 'Auryi Turn Entry',
  manifest: './pv-data/sequences/auryi_turn_entry.duo.sequence.json',
  version: '8'
});

const AURYI_AUORB_DUO = Object.freeze({
  id: 'auryi_auorb_invocation_v4',
  name: 'Auorb Invocation',
  manifest: './pv-data/sequences/auryi_auorb_invocation.duo.sequence.json',
  version: '13',
  markerFrames: Object.freeze({
    gather: Object.freeze([1, 2, 3, 4, 5]),
    release: Object.freeze([9, 10]),
    impact: Object.freeze([11]),
    recover: Object.freeze([15, 16, 17])
  }),
  // PriZim owns Auryi's ranged camera/HUD takeover from the manifest.
  povFrames: Object.freeze([])
});

export default class DuoHybridPartyFormationView extends PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new DuoHybridSequenceDriver(scene);
  }

  create(roster) {
    super.create(roster);
    const kineza = this.actors.get('kineza');
    if (kineza) {
      kineza.duoSequenceConfig = KINEZA_BLITZER_DUO;
      kineza.attackSheetConfig = KINEZA_BLITZER_DUO;
      this.duoHybrid.prepare(KINEZA_BLITZER_DUO).catch(error => {
        kineza.duoPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Blitzer prewarm deferred:', error);
      });
    }
    const auryi = this.actors.get('auryi');
    if (auryi) {
      auryi.duoEntryConfig = AURYI_ENTRY_DUO;
      auryi.duoAttackConfig = AURYI_AUORB_DUO;
      auryi.attackSheetConfig = AURYI_AUORB_DUO;
      auryi.duoEntryPlayed = false;
      this._createAuryiBattleMagic(auryi);
      this.duoHybrid.prepare(AURYI_ENTRY_DUO).catch(error => {
        auryi.duoEntryPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Auryi entry prewarm deferred:', error);
      });
      this.duoHybrid.prepare(AURYI_AUORB_DUO).catch(error => {
        auryi.duoAttackPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Auryi attack prewarm deferred:', error);
      });
    }
  }

  _createAuryiBattleMagic(actor) {
    const crown = this.scene.add.graphics().setAlpha(0);
    const orb = this.scene.add.graphics().setAlpha(0);
    crown.setDepth(actor.sprite.depth + 0.35);
    orb.setDepth(actor.sprite.depth + 0.45);
    if (typeof crown.setBlendMode === 'function' && globalThis.Phaser?.BlendModes) {
      crown.setBlendMode(Phaser.BlendModes.ADD);
      orb.setBlendMode(Phaser.BlendModes.ADD);
    }
    this.scene.worldAdd([crown, orb]);
    actor.duoCrown = crown;
    actor.duoAuorb = orb;
    actor.duoMagicVisible = false;
    this._drawAuryiCrown(actor, 0.38, 0.68);
    this._drawAuryiAuorb(actor, 0.62, 0.56);
    this._layoutAuryiBattleMagic(actor);
  }

  _drawAuryiCrown(actor, alpha = 0.38, scale = 0.68) {
    const g = actor?.duoCrown;
    if (!g) return;
    const h = this.scene.scale.height;
    const r = Math.max(20, h * 0.056) * scale;
    g.clear();
    g.lineStyle(Math.max(2, h * 0.0048), 0xffd870, alpha);
    g.strokeEllipse(0, 0, r * 2.05, r * 0.70);
    g.lineStyle(Math.max(1.4, h * 0.0032), 0xc684ff, alpha * 0.62);
    g.strokeEllipse(0, 0, r * 2.34, r * 0.94);
    g.lineStyle(Math.max(1, h * 0.0022), 0xfff1b0, alpha * 0.85);
    g.beginPath();
    g.moveTo(-r * 0.88, -r * 0.12);
    g.lineTo(-r * 0.64, -r * 0.54);
    g.lineTo(-r * 0.38, -r * 0.14);
    g.lineTo(0, -r * 0.70);
    g.lineTo(r * 0.38, -r * 0.14);
    g.lineTo(r * 0.64, -r * 0.54);
    g.lineTo(r * 0.88, -r * 0.12);
    g.strokePath();
  }

  _drawAuryiAuorb(actor, scale = 0.62, alpha = 0.56) {
    const g = actor?.duoAuorb;
    if (!g) return;
    const h = this.scene.scale.height;
    const r = Math.max(8, h * 0.025) * scale;
    g.clear();
    g.fillStyle(0xc684ff, alpha * 0.18);
    g.fillCircle(0, 0, r * 2.15);
    g.fillStyle(0xffd870, alpha * 0.34);
    g.fillCircle(0, 0, r * 1.55);
    g.fillStyle(0xfff8d2, alpha * 0.94);
    g.fillCircle(0, 0, r * 0.72);
    g.lineStyle(Math.max(1.5, h * 0.003), 0xffe69a, alpha);
    g.strokeCircle(0, 0, r * 1.08);
    g.lineStyle(Math.max(1, h * 0.0022), 0xc684ff, alpha * 0.82);
    g.strokeEllipse(0, 0, r * 2.85, r * 1.42);
  }

  _layoutAuryiBattleMagic(actor) {
    if (!actor?.duoCrown || !actor?.duoAuorb) return;
    const h = this.scene.scale.height;
    actor.duoCrown.setPosition(actor.sprite.x, actor.sprite.y - h * 0.17);
    actor.duoAuorb.setPosition(actor.sprite.x + h * 0.063, actor.sprite.y - h * 0.089);
  }

  _showAuryiBattleMagic(actor, visible = true) {
    if (!actor?.duoCrown || !actor?.duoAuorb) return;
    actor.duoMagicVisible = visible;
    actor.duoCrown.setAlpha(visible ? 1 : 0);
    actor.duoAuorb.setAlpha(visible ? 1 : 0);
    if (visible) {
      this._drawAuryiCrown(actor, 0.38, 0.68);
      this._drawAuryiAuorb(actor, 0.62, 0.56);
      this._layoutAuryiBattleMagic(actor);
    }
  }

  _updateAuryiAttackMagic(actor, frameIndex, enemyX, enemyY) {
    if (!actor?.duoCrown || !actor?.duoAuorb) return;
    const h = this.scene.scale.height;
    const charge = clamp01(frameIndex / 8);
    const recover = clamp01((frameIndex - 12) / 5);
    const crownPower = 0.68 + charge * 0.32 - recover * 0.32;
    const crownAlpha = 0.38 + charge * 0.48 - recover * 0.48;
    this._drawAuryiCrown(actor, crownAlpha, crownPower);
    actor.duoCrown.setPosition(actor.sprite.x, actor.sprite.y - h * 0.17);

    const handX = actor.sprite.x + h * 0.063;
    const handY = actor.sprite.y - h * 0.089;
    const visualTargetX = Number.isFinite(enemyX) ? enemyX : this.scene.scale.width * 0.74;
    const visualTargetY = Number.isFinite(enemyY) ? enemyY + h * 0.10 : actor.sprite.y - h * 0.04;

    let orbX = handX;
    let orbY = handY;
    if (frameIndex < 9) {
      const theta = -1.15 + frameIndex * 0.78;
      const orbitR = h * (0.066 + charge * 0.020);
      orbX = actor.sprite.x + Math.cos(theta) * orbitR + h * 0.015;
      orbY = actor.sprite.y - h * 0.14 + Math.sin(theta) * orbitR * 0.50;
    } else if (frameIndex <= 11) {
      const t = clamp01((frameIndex - 9) / 2);
      orbX = lerp(handX, visualTargetX, t);
      orbY = lerp(handY, visualTargetY, t);
    } else {
      const t = clamp01((frameIndex - 12) / 4);
      orbX = lerp(visualTargetX, handX, t);
      orbY = lerp(visualTargetY, handY, t);
    }

    // True state ladder: small idle -> charged growth -> impact peak -> small idle.
    let orbScale = 0.62 + charge * 1.08;
    if (frameIndex >= 9 && frameIndex <= 11) orbScale = 1.72 + ((frameIndex - 9) / 2) * 0.28;
    if (frameIndex >= 12) orbScale = lerp(1.82, 0.62, clamp01((frameIndex - 12) / 5));
    const orbAlpha = 0.56 + charge * 0.38 - recover * 0.38;
    this._drawAuryiAuorb(actor, orbScale, orbAlpha);
    actor.duoAuorb.setPosition(orbX, orbY).setAlpha(1);
  }

  layout() {
    super.layout();
    const auryi = this.actors.get('auryi');
    if (!auryi || auryi._snapshot) return;
    const mul = 1.12;
    auryi.sprite.setScale(auryi.sprite.scaleX * mul, auryi.sprite.scaleY * mul);
    auryi.ghost.setScale(auryi.ghost.scaleX * mul, auryi.ghost.scaleY * mul);
    auryi.ring.setSize(auryi.sprite.displayWidth * 0.5, auryi.sprite.displayWidth * 0.18);
    this._layoutAuryiBattleMagic(auryi);
  }

  hasTurnEntry(heroId) {
    if (heroId === 'auryi') {
      const actor = this.actors.get(heroId);
      return !!(actor?.duoEntryConfig && !actor.duoEntryPlayed);
    }
    return super.hasTurnEntry(heroId);
  }

  async playTurnEntry(heroId) {
    if (heroId !== 'auryi') return super.playTurnEntry(heroId);
    const actor = this.actors.get(heroId);
    if (!actor?.duoEntryConfig || actor.duoEntryPlayed) return;
    // Lock immediately so repeated turn-start calls cannot replay the crown entry.
    actor.duoEntryPlayed = true;
    try {
      await this.duoHybrid.playSequence({
        config: actor.duoEntryConfig,
        actor,
        enemyX: actor.sprite.x,
        enemyY: actor.sprite.y,
        onFrame: null
      });
      this._showAuryiBattleMagic(actor, true);
    } catch (error) {
      actor.duoEntryPlayed = false;
      throw error;
    }
  }

  hasAttackSheet(heroId) {
    if (heroId === 'kineza') return !!this.actors.get(heroId)?.duoSequenceConfig;
    if (heroId === 'auryi') return !!this.actors.get(heroId)?.duoAttackConfig;
    return super.hasAttackSheet(heroId);
  }

  async playAttackSheet(heroId, onFrame) {
    if (heroId !== 'kineza' && heroId !== 'auryi') return super.playAttackSheet(heroId, onFrame);
    const actor = this.actors.get(heroId);
    const config = heroId === 'kineza' ? actor?.duoSequenceConfig : actor?.duoAttackConfig;
    if (!config) throw new Error(`[PriZim Duo-Hybrid] ${heroId} attack sequence was not registered.`);
    const enemyX = this.scene.enemyView?.container?.x ?? (this.scene.scale.width * 0.74);
    // Auryi's projectile uses the visual center of the enemy, not the container's upper anchor.
    const baseEnemyY = this.scene.enemyView?.container?.y ?? actor.sprite.y;
    const enemyY = heroId === 'auryi' ? baseEnemyY + this.scene.scale.height * 0.10 : baseEnemyY;
    try {
      return await this.duoHybrid.playSequence({
        config,
        actor,
        enemyX,
        enemyY,
        onFrame: (frameIndex, markerData, manifest) => {
          if (heroId === 'auryi') this._updateAuryiAttackMagic(actor, frameIndex, enemyX, baseEnemyY);
          onFrame?.(frameIndex, markerData, manifest);
        }
      });
    } catch (error) {
      const detail = error?.message || String(error);
      const rootStack = error?.stack || detail;
      const label = heroId === 'kineza' ? 'Blitzer' : 'Auorb Invocation';
      const wrapped = new Error(`[PriZim Duo-Hybrid · ${label}] ${detail}`);
      wrapped.stack = `${wrapped.message}\nROOT CAUSE:\n${rootStack}`;
      console.error(`[PriZim Duo-Hybrid · ${label}]`, error);
      throw wrapped;
    } finally {
      if (heroId === 'auryi' && actor?.duoMagicVisible) {
        this._drawAuryiCrown(actor, 0.38, 0.68);
        this._drawAuryiAuorb(actor, 0.62, 0.56);
        this._layoutAuryiBattleMagic(actor);
        actor.duoCrown.setAlpha(1);
        actor.duoAuorb.setAlpha(1);
      }
    }
  }
}
