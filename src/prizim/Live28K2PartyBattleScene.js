// LIVE28K2/K3/K4/K5/K6/K7 production battle-scene adapter.
// Keeps LIVE28J battle behavior intact while using the approved LIVE28K full-resolution authorities.
import Live28PartyBattleScene from './Live28PartyBattleScene.js?v=live28j';
import Live28K7PartyFormationView from './Live28K7PartyFormationView.js?v=live28k7-halo';

const PRISMEL_K2_PASSIVE_KEY = 'prismel_live28k2_passive';
const PRISMEL_K2_PASSIVE_PATH = './assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png?pvasset=live28k3';
const PRISMEL_K2_ACTIVE_KEY = 'prismel_live28k2_staff_ready';
const PRISMEL_K2_ACTIVE_PATH = './assets/party_formation/PRISMEL_LIVE28K2_STAFF_READY.png?pvasset=live28k3';
const AURYI_K2_PRIMARY_KEY = 'auryi_live28k2_primary';
const AURYI_K2_PRIMARY_PATH = './assets/party_formation/AURYI_LIVE28K2_PRIMARY.png?pvasset=live28k3';
const AURORA_BLOOM_KEY = 'pv_auryi_celestial_bloom';
const AURORA_BLOOM_PATH = './assets/music/Celestial Bloom.m4a?pvasset=live28k11-audio';
const TRIUMPH_LIGHT_KEY = 'pv_triumph_of_light';
const TRIUMPH_LIGHT_PATH = './assets/music/Triumph of Light.m4a?pvasset=live28k11-audio';

// Exact approved 01-08 production lane. Keep this false until the original
// transparent PNG bytes are physically installed at the paths below. This
// prevents 404s and guarantees LIVE28K11 continues using the proven pose bridge.
const AURORA_PULSE_FRAMES_READY = false;
const AURORA_PULSE_FRAMES = Object.freeze(
  Array.from({ length: 8 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return Object.freeze({
      key: `auryi_aurora_pulse_${n}`,
      path: `./assets/characters/auryi/animations/aurora_pulse/frames/Auryi_Aurora_Pulse_${n}.png?pvasset=live28k12-aurora`
    });
  })
);

const AURORA_PULSE_HIT_CHANCE = 0.92;
const AURORA_PULSE_TIMING = Object.freeze({
  lift: 360,
  bloomA: 520,
  bloomB: 520,
  maxCharge: 420,
  compression: 260,
  silence: 170,
  release: 240,
  aftermath: 300,
  recover: 320
});

export default class Live28K2PartyBattleScene extends Live28PartyBattleScene {
  preload() {
    super.preload();
    // Battle-critical LIVE28K art is direct repo-served PNG only. No WebP wrappers.
    this.load.image(PRISMEL_K2_PASSIVE_KEY, PRISMEL_K2_PASSIVE_PATH);
    this.load.image(PRISMEL_K2_ACTIVE_KEY, PRISMEL_K2_ACTIVE_PATH);
    this.load.image(AURYI_K2_PRIMARY_KEY, AURYI_K2_PRIMARY_PATH);

    // Exact supplied masters. These paths intentionally remain M4A so no
    // source transcode/recompression is introduced during the production ingest.
    this.load.audio(AURORA_BLOOM_KEY, AURORA_BLOOM_PATH);
    this.load.audio(TRIUMPH_LIGHT_KEY, TRIUMPH_LIGHT_PATH);

    // Do not request missing production art. Once the already-approved 01-08
    // PNG bytes are restored, flipping the gate activates this lane without
    // changing any Aurora choreography or battle logic.
    if (AURORA_PULSE_FRAMES_READY) {
      AURORA_PULSE_FRAMES.forEach(frame => this.load.image(frame.key, frame.path));
    }
  }

  create() {
    super.create();

    const old = this.formation;
    if (old) {
      this.scale.off('resize', old.layout, old);
      old.actors?.forEach(actor => {
        [actor.sprite, actor.ghost, actor.ring, actor.attackSprite, actor.duoCrown, actor.duoAuorb]
          .filter(Boolean)
          .forEach(obj => obj.destroy?.());
      });
    }

    this.formation = new Live28K7PartyFormationView(this);
    this.formation.create(this.party);
    if (this.activeHeroId) this.formation.setActive(this.activeHeroId);

    globalThis.__PV_LIVE28K2_RUNTIME__ = true;
    globalThis.__PV_LIVE28K2_FULLRES_PRIMARIES__ = true;
    globalThis.__PV_LIVE28K2_PRISMEL_STATE_PAIR__ = true;
    globalThis.__PV_LIVE28K6_AURYI_CROWN_HYBRID__ = true;
    globalThis.__PV_LIVE28K7_ATTACK_HALO_CLEAN__ = true;
    globalThis.__PV_LIVE28K_AURORA_PULSE_CINEMATIC__ = true;
    globalThis.__PV_LIVE28K_AURORA_FRAME_LANE_READY__ = this._hasAuroraPulseFrames();
  }

  _onCommand(label) {
    super._onCommand(label);
    if (label !== 'Resonart') return;

    const hero = this._activeHero();
    if (hero?.id !== 'auryi' || !hero.resonart || !this._drawer) return;

    // Auryi's Basic Attack and Resonart are separate authorities:
    // Aurorb Slice remains Attack; Aurora Pulse owns the Resonart drawer.
    this._drawer.title.setText(hero.resonart.name.toUpperCase());
    this._drawer.detail.setText(hero.resonart.flavor || 'A signature technique.');
  }

  _hasAuroraPulseFrames() {
    return AURORA_PULSE_FRAMES_READY && AURORA_PULSE_FRAMES.every(frame => this.textures.exists(frame.key));
  }

  _setAuroraPulseFrame(index) {
    if (!this._hasAuroraPulseFrames()) return false;
    const actor = this.formation?.actors?.get?.('auryi');
    const frame = AURORA_PULSE_FRAMES[index - 1];
    if (!actor?.sprite || !frame || !this.textures.exists(frame.key)) return false;

    actor.sprite.setTexture(frame.key).setVisible(true).setAlpha(1).setAngle(0);
    actor.ghost?.setVisible(false)?.setAlpha?.(0);
    actor.attackSprite?.setVisible(false)?.setAlpha?.(1);
    actor.ring?.setVisible(false)?.setAlpha?.(0);

    // Fit by measured visible-body bounds instead of raw 900x900 canvas size,
    // preserving Auryi's approved battlefield height and anchor across all frames.
    const targetBodyH = this.scale.height * 0.47;
    this.formation._fitActorToBodyHeight?.(actor, frame.key, targetBodyH);
    return true;
  }

  _restoreAuryiAfterAurora() {
    const actor = this.formation?.actors?.get?.('auryi');
    if (!actor) return;
    this.formation._restoreAuryiPrimary?.(actor);
    this.formation.layout?.();
    this.formation._forceActiveRing?.(this.activeHeroId);
  }

  async _resolveHeroAction(hero, command) {
    if (hero?.id === 'auryi' && command === 'Resonart' && hero.resonart) {
      return this._playAuryiAuroraPulse(hero);
    }
    return super._resolveHeroAction(hero, command);
  }

  async _playAuryiAuroraPulse(hero) {
    this._turnLock = true;
    this._hideCommandRail();

    const cam = this.cameras.main;
    const cameraState = {
      zoom: cam.zoom,
      scrollX: cam.scrollX,
      scrollY: cam.scrollY
    };
    const base = hero.resonart.damage;
    const low = Math.round(base * 0.85);
    const high = Math.round(base * 1.15);
    const hitRoll = Math.random() < AURORA_PULSE_HIT_CHANCE;
    const useAuroraFrames = this._hasAuroraPulseFrames();
    // Aurora Pulse must never fall back to Auryi's Basic Attack poses.
    // Until the approved 01-08 PNGs return, keep her approved primary and
    // use Aurora-specific lift/compression movement only.
    const fallbackActor = !useAuroraFrames ? this.formation?.actors?.get?.('auryi') : null;
    if (fallbackActor) this.formation._restoreAuryiPrimary?.(fallbackActor);
    const fallbackY = fallbackActor?.sprite?.y ?? 0;

    this.audio.beginCinematicAttack?.();
    const ownsBloom = this.audio.auroraBloomStart?.() === true;
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    // 01-02: battlefield invocation + lift.
    if (useAuroraFrames) this._setAuroraPulseFrame(1);
    else if (fallbackActor?.sprite) {
      fallbackActor.ghost?.setVisible(false)?.setAlpha?.(0);
      fallbackActor.attackSprite?.setVisible(false)?.setAlpha?.(1);
      fallbackActor.ring?.setVisible(false)?.setAlpha?.(0);
      this.tweens.add({ targets: fallbackActor.sprite, y: fallbackY - Math.min(28, this.scale.height * 0.05), duration: AURORA_PULSE_TIMING.lift, ease: 'Sine.easeOut' });
    }
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.10, duration: 280, ease: 'Sine.easeOut' });
    if (useAuroraFrames) {
      await this._wait(AURORA_PULSE_TIMING.lift / 2);
      this._setAuroraPulseFrame(2);
      await this._wait(AURORA_PULSE_TIMING.lift / 2);
    } else {
      await this._wait(AURORA_PULSE_TIMING.lift);
    }

    // 03-05: Aurora growth and celestial expansion.
    if (!ownsBloom) this.audio.attackGather(hero.id);
    if (useAuroraFrames) this._setAuroraPulseFrame(3);
    else if (fallbackActor?.sprite) {
      this.tweens.add({ targets: fallbackActor.sprite, y: fallbackY - Math.min(38, this.scale.height * 0.065), duration: AURORA_PULSE_TIMING.bloomA + AURORA_PULSE_TIMING.bloomB, ease: 'Sine.easeInOut' });
    }
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 0.96, duration: 420, ease: 'Sine.easeInOut' });
    if (useAuroraFrames) {
      await this._wait(AURORA_PULSE_TIMING.bloomA / 2);
      this._setAuroraPulseFrame(4);
      await this._wait(AURORA_PULSE_TIMING.bloomA / 2);
      this._setAuroraPulseFrame(5);
      await this._wait(AURORA_PULSE_TIMING.bloomB);
    } else {
      await this._wait(AURORA_PULSE_TIMING.bloomA);
      await this._wait(AURORA_PULSE_TIMING.bloomB);
    }

    // 06: maximum charge.
    if (useAuroraFrames) this._setAuroraPulseFrame(6);
    await this._wait(AURORA_PULSE_TIMING.maxCharge);

    // 07: compression / hand-smash, then the approved frozen silence pocket.
    if (useAuroraFrames) this._setAuroraPulseFrame(7);
    else if (fallbackActor?.sprite) {
      this.tweens.add({ targets: fallbackActor.sprite, y: fallbackY - Math.min(14, this.scale.height * 0.025), duration: AURORA_PULSE_TIMING.compression, ease: 'Quad.easeIn' });
    }
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.13, duration: 220, ease: 'Sine.easeIn' });
    await this._wait(AURORA_PULSE_TIMING.compression);
    if (ownsBloom) this.audio.auroraBloomSilence?.();
    await this._wait(AURORA_PULSE_TIMING.silence);

    // 08: outward Pulse.
    if (useAuroraFrames) this._setAuroraPulseFrame(8);
    if (ownsBloom) this.audio.auroraBloomResume?.();
    else this.audio.attackRelease(hero.id);
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 0.91, duration: 130, ease: 'Quad.easeOut' });
    await this._wait(AURORA_PULSE_TIMING.release);

    if (hitRoll) {
      const dmg = Phaser.Math.Between(low, high);
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this._updateTargetCard();
      this.enemyView.hit();
      this._floatText(`-${dmg}`, '#FFE8A0');
      this._setBanner(`${hero.name} uses ${hero.resonart.name} for ${dmg} damage!`);
      this.audio.attackImpact(hero.id);
      this.audio.enemyHit();

      if (this.enemy.hp <= 0) {
        this.enemyView.die();
        this.audio.enemyDefeat();
      }
    } else {
      this._setBanner(`${hero.name} uses ${hero.resonart.name} — missed!`);
    }

    await this._wait(AURORA_PULSE_TIMING.aftermath);

    // Recompose and restore battle framing cleanly while the Bloom tail fades.
    if (!useAuroraFrames && fallbackActor?.sprite) {
      this.tweens.add({ targets: fallbackActor.sprite, y: fallbackY, duration: AURORA_PULSE_TIMING.recover, ease: 'Sine.easeInOut' });
    }
    this.tweens.add({
      targets: cam,
      zoom: cameraState.zoom,
      scrollX: cameraState.scrollX,
      scrollY: cameraState.scrollY,
      duration: 300,
      ease: 'Sine.easeInOut'
    });
    await this._wait(AURORA_PULSE_TIMING.recover);
    if (useAuroraFrames) this._restoreAuryiAfterAurora();
    else if (fallbackActor) {
      this.formation._restoreAuryiPrimary?.(fallbackActor);
      this.formation.layout?.();
      this.formation._forceActiveRing?.(this.activeHeroId);
    }
    if (ownsBloom) this.audio.auroraBloomStop?.(420);
    this.audio.endCinematicAttack?.();

    this._turnLock = false;
    this._endHeroTurn();
  }

  _setBanner(msg) {
    const hero = this._activeHero();
    if (hero?.id === 'auryi' && hero.resonart && typeof msg === 'string' && msg.includes(hero.attack.name)) {
      msg = msg.replaceAll(hero.attack.name, hero.resonart.name);
    }
    super._setBanner(msg);
  }
}
