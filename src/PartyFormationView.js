// FAI-HUD-01 Phase A — renders the 3 active party members as independent
// layered actors in a fixed formation, per NEW_PARTY_DATA_CONTRACT.json
// (formation_changes_on_turn: false — positions never move; only the
// active-actor highlight does). Each actor gets its own ghost+sprite pair
// (same crossfade shape as HeroPoseView.js, so a future pose swap never
// hits the "fading both layers at once" trap documented in CLAUDE.md) and
// registers through scene.worldAdd() — never scene.uiLayer — so the
// battle camera can push in without dragging the party off their marks.
import { PARTY_SLOTS, PARTY_ASSET_LOCK, heightScaleFor } from './PartyBattleConfig.js?v=3';

// Formation x-fractions (of screen width) and relative depth-in-frame —
// back is furthest from the enemy/camera, front is nearest. Landscape and
// portrait both stack the party toward the left third of the screen,
// enemies on the right, matching every existing battle screen's facing
// convention (heroes face right).
//
// FAI-HUD-01E: on-device landscape evidence showed Prismel/Auryi/Kineza's
// silhouettes merging into one mass (0.16/0.24/0.34 packed them within
// ~18% of screen width of each other). Widened so each retains a
// separate readable envelope — verified against DAI's own annotated
// reference by screenshot, not just by the numbers looking bigger.
//
// Follow-up, caught on-device again: that widening still put Prismel's
// anchor (0.07) directly inside the vertical command rail's own footprint
// (x: 16-166px, i.e. up to ~0.20 of an 844px landscape width) — the rail
// sits on the UI camera, on top of everything in world space, so it
// plastered right over him. Shifted the whole trio right — twice: the
// first shift (anchor to 0.24) cleared the rail at the anchor point but
// not the actual sprite, since each sprite's origin is horizontally
// centered and the source canvases carry real width beyond the character
// (flowing robes, an outstretched staff) — Prismel's displayed left edge
// still reached into the rail even with his center clear of it, confirmed
// by screenshot, not assumed fixed from the anchor number alone. Pushed
// further so the sprite's actual rendered footprint — not just its
// anchor — clears the rail.
const SLOT_LAYOUT = Object.freeze({
  back: { xFrac: 0.30, yFrac: 0.60, depth: 10 },
  middle: { xFrac: 0.42, yFrac: 0.74, depth: 12 },
  front: { xFrac: 0.54, yFrac: 0.90, depth: 14 }
});

export default class PartyFormationView {
  constructor(scene) {
    this.scene = scene;
    this.actors = new Map(); // heroId -> { sprite, ghost, ring, slot }
  }

  create(roster) {
    PARTY_SLOTS.forEach(({ slot, heroId }) => {
      const hero = roster.find(h => h.id === heroId);
      if (!hero) return;

      const tex = PARTY_ASSET_LOCK.textures[heroId];
      const texKey = tex && this.scene.textures.exists(tex.key) ? tex.key : null;
      if (!texKey) return; // caller's preload() is the source of truth for what's loaded

      // Origin.y lands on each asset's own measured feet position (see
      // contentBottomFrac's comment in PartyBattleConfig.js) rather than
      // a blind canvas-bottom anchor, so all three appear to stand on
      // the same ground line despite differently-padded source canvases.
      const originY = tex.contentBottomFrac;
      const sprite = this.scene.add.image(0, 0, texKey).setOrigin(0.5, originY);
      const ghost = this.scene.add.image(0, 0, texKey).setOrigin(0.5, originY).setAlpha(0);
      // Active-turn ring: hollow, drawn behind the actor's feet, never a
      // filled disc over the art (same "reticle goes behind, never
      // covers" lesson CLAUDE.md documents for the enemy target reticle).
      const ring = this.scene.add.ellipse(0, 0, 40, 14, 0x000000, 0)
        .setStrokeStyle(2.2, 0xffe8a0, 0).setDepth(SLOT_LAYOUT[slot].depth - 0.5);

      this.scene.worldAdd([ring, ghost, sprite]);
      sprite.setDepth(SLOT_LAYOUT[slot].depth);
      ghost.setDepth(SLOT_LAYOUT[slot].depth);

      this.actors.set(heroId, { sprite, ghost, ring, slot, hero });
    });

    this.layout();
    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => this.scene.scale.off('resize', this.layout, this));
  }

  layout() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const landscape = w > h;
    // Target on-screen CONTENT height for Auryi specifically (the
    // tallest, per the locked height hierarchy) — everything else derives
    // from her via the locked normalizedHeightPx ratios (Prismel
    // 570/650=0.877, Kineza 475/650=0.731 of Auryi's own height), not an
    // independent per-hero target.
    //
    // FAI-HUD-01E: landscape's old 0.5 read as "dominating the full
    // center of screen" on-device (DAI's own words) — REVISED_VISUAL_
    // RATIOS.json's actor_height_share_of_stage puts Auryi at 0.38-0.42.
    // 0.40 lands there directly, and the locked ratios carry Prismel to
    // ~0.35 and Kineza to ~0.29 — both inside their own target bands too
    // (0.34-0.39 and 0.27-0.33) without touching heightScaleFor's math at
    // all. Portrait is untouched — this pack's evidence and ratios are
    // explicitly landscape-scoped.
    const targetAuryiContentH = landscape ? h * 0.40 : h * 0.4;
    const commonScale = targetAuryiContentH / PARTY_ASSET_LOCK.normalizedHeightPx.auryi;

    this.actors.forEach(({ sprite, ghost, ring, slot }, heroId) => {
      const pos = SLOT_LAYOUT[slot];
      const scale = heightScaleFor(heroId, commonScale);
      sprite.setScale(scale);
      ghost.setScale(scale);

      const x = Math.round(w * pos.xFrac);
      const y = Math.round(h * pos.yFrac);
      sprite.setPosition(x, y);
      ghost.setPosition(x, y);
      ring.setPosition(x, y + 6);
      ring.setSize(sprite.displayWidth * 0.5, sprite.displayWidth * 0.18);
    });
  }

  // Only the highlight ring moves per-turn — formation stays fixed, per
  // the data contract's formation_changes_on_turn: false.
  setActive(heroId) {
    this.actors.forEach((actor, id) => {
      const on = id === heroId;
      this.scene.tweens.killTweensOf(actor.ring);
      this.scene.tweens.add({
        targets: actor.ring,
        alpha: on ? 1 : 0,
        duration: 180,
        ease: 'Sine.easeOut'
      });
      // Manually drive strokeAlpha via a plain tween target object, since
      // Graphics/Shape stroke alpha isn't itself tweenable as `alpha` on
      // an Ellipse's stroke — setStrokeStyle again each tick is cheapest.
      actor.ring.setStrokeStyle(2.2, 0xffe8a0, on ? 0.85 : 0);
    });
  }

  hit(heroId) {
    const actor = this.actors.get(heroId);
    if (!actor) return;
    const { sprite } = actor;
    this.scene.tweens.killTweensOf(sprite);
    const homeX = sprite.x;
    this.scene.tweens.add({
      targets: sprite,
      x: homeX + 10,
      angle: 2.5,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => sprite.setPosition(homeX, sprite.y).setAngle(0)
    });
  }

  // FAI-AUDIO-02 (ATTACK_AUDIO_TIMING.md): a real anticipation beat for
  // attackGather() to attach to — previously the lunge fired immediately
  // with no visual "charging" moment at all, so Gather and Release always
  // landed in the same JS tick. A small settle-then-swell scale pulse,
  // not a new pose or animation system — the smallest addition that
  // gives audio an actual milestone to hook, per that doc's own guidance
  // ("add the smallest callback mechanism needed... do not rewrite the
  // battle controller").
  attackGatherPulse(heroId) {
    const actor = this.actors.get(heroId);
    if (!actor) return Promise.resolve();
    const { sprite } = actor;
    const baseScale = sprite.scaleX;
    return new Promise(resolve => {
      this.scene.tweens.add({
        targets: sprite,
        scaleX: baseScale * 1.05,
        scaleY: baseScale * 1.05,
        duration: 260,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => { sprite.setScale(baseScale); resolve(); }
      });
    });
  }

  attackLunge(heroId) {
    const actor = this.actors.get(heroId);
    if (!actor) return Promise.resolve();
    const { sprite } = actor;
    const homeX = sprite.x;
    return new Promise(resolve => {
      this.scene.tweens.add({
        targets: sprite,
        x: homeX + 34,
        duration: 160,
        yoyo: true,
        hold: 90,
        ease: 'Back.easeOut',
        onComplete: () => { sprite.setPosition(homeX, sprite.y); resolve(); }
      });
    });
  }

  guardPose(heroId, on) {
    const actor = this.actors.get(heroId);
    if (!actor) return;
    this.scene.tweens.add({
      targets: actor.sprite,
      alpha: on ? 0.82 : 1,
      duration: 160,
      ease: 'Sine.easeOut'
    });
  }
}
