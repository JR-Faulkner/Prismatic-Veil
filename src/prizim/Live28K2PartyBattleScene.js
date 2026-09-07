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
    const usePoses = this.formation.hasActionPoses?.(hero.id);

    this.audio.beginCinematicAttack?.();
    const ownsBloom = this.audio.auroraBloomStart?.() === true;
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    // 01-02: isolate + lift. Keep crown/halo FX out of this Resonart path.
    if (usePoses) this.formation.setActionPose(hero.id, 'step');
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.10, duration: 280, ease: 'Sine.easeOut' });
    await this._wait(AURORA_PULSE_TIMING.lift);

    // 03-05: Aurora growth. Celestial Bloom owns the cinematic bed when
    // present; generic Auryi gather remains a safe fallback for older builds.
    if (!ownsBloom) this.audio.attackGather(hero.id);
    if (usePoses) this.formation.setActionPose(hero.id, 'gather');
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 0.96, duration: 420, ease: 'Sine.easeInOut' });
    await this._wait(AURORA_PULSE_TIMING.bloomA);
    await this._wait(AURORA_PULSE_TIMING.bloomB);

    // 06: max charge.
    await this._wait(AURORA_PULSE_TIMING.maxCharge);

    // 07: compression / hand-smash. Tighten camera, then explicitly pause
    // Celestial Bloom for the approved silence pocket instead of merely
    // lowering battle BGM underneath it.
    if (usePoses) this.formation.setActionPose(hero.id, 'release');
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.13, duration: 220, ease: 'Sine.easeIn' });
    await this._wait(AURORA_PULSE_TIMING.compression);
    if (ownsBloom) this.audio.auroraBloomSilence?.();
    await this._wait(AURORA_PULSE_TIMING.silence);

    // 08: Pulse. Resume the real cue into its release/tail; old builds use
    // the established character release cue instead.
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
      // Keep the physical Pulse transient on impact; Celestial Bloom supplies
      // the celestial body/tail rather than replacing target feedback.
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

    // Recompose and restore battle framing cleanly while the Bloom tail
    // fades underneath the aftermath.
    if (usePoses) this.formation.setActionPose(hero.id, 'recover');
    this.tweens.add({
      targets: cam,
      zoom: cameraState.zoom,
      scrollX: cameraState.scrollX,
      scrollY: cameraState.scrollY,
      duration: 300,
      ease: 'Sine.easeInOut'
    });
    await this._wait(AURORA_PULSE_TIMING.recover);
    if (usePoses) this.formation.setActionPose(hero.id, 'idle');
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
