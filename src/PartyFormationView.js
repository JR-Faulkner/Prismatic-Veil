// FAI-HUD-01 Phase A — renders the 3 active party members as independent
// layered actors in a fixed formation, per NEW_PARTY_DATA_CONTRACT.json
// (formation_changes_on_turn: false — positions never move; only the
// active-actor highlight does). Each actor gets its own ghost+sprite pair
// (same crossfade shape as HeroPoseView.js, so a future pose swap never
// hits the "fading both layers at once" trap documented in CLAUDE.md) and
// registers through scene.worldAdd() — never scene.uiLayer — so the
// battle camera can push in without dragging the party off their marks.
import { PARTY_SLOTS, PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, heightScaleFor } from './PartyBattleConfig.js?v=4';

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
  front: { xFrac: 0.54, yFrac: 0.79, depth: 14 }
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

      // FAI-BATTLE-PRESENTATION-03: hero.poses/posePath/flip/scaleMul are
      // BattleConfig.js's already-approved, already-battle-tested 1v1
      // attack pose set (see HeroPoseView.js) — the same hero objects
      // already carry this data (partyRoster() spreads it straight from
      // HEROES), so no separate asset system is invented here. Resolved
      // once at create() time so a missing/unloaded texture is caught
      // here, not mid-attack: `poseTex` stays null (attackGatherPulse()/
      // attackLunge() below remain the explicit fallback path — per
      // ANIMATION_INTEGRATION_DIRECTIVE.md's "keep any fallback behind an
      // explicit temporary fallback path", not a silent still-image swap)
      // unless every one of the five poses actually loaded.
      let poseTex = null;
      if (hero.poses) {
        const map = {};
        let allLoaded = true;
        Object.entries(hero.poses).forEach(([pose, tex]) => {
          if (this.scene.textures.exists(tex)) map[pose] = tex;
          else allLoaded = false;
        });
        if (allLoaded) poseTex = map;
      }

      // FAI-BATTLE-PRESENTATION-04 (ANIMATION_AUTHORITY_CORRECTION.md):
      // Kineza's real current-authority Basic Attack — a genuine 6-frame
      // sprite sheet, not a pose crossfade. A second, hidden Sprite (not
      // Image, since only Sprite can play a Phaser animation) sits over
      // the same slot; playAttackSheet() below swaps visibility with the
      // standby Image for the attack's duration, never both at once, so
      // this sidesteps the alpha-crossfade trap entirely (a hard cut
      // between two always-fully-opaque layers, not a fade).
      let attackSprite = null;
      let attackSheetConfig = null;
      const sheetCfg = HERO_ATTACK_SHEETS[heroId];
      if (sheetCfg && this.scene.textures.exists(sheetCfg.key)) {
        attackSprite = this.scene.add.sprite(0, 0, sheetCfg.key, 0).setVisible(false);
        this.scene.worldAdd(attackSprite);
        attackSprite.setDepth(SLOT_LAYOUT[slot].depth);
        const animKey = `${sheetCfg.key}_play`;
        if (!this.scene.anims.exists(animKey)) {
          const frames = this.scene.anims.generateFrameNumbers(sheetCfg.key, { start: 0, end: sheetCfg.frameCount - 1 });
          frames.forEach((f, i) => { f.duration = sheetCfg.frameDurations[i] || 150; });
          this.scene.anims.create({ key: animKey, frames, repeat: 0 });
        }
        attackSheetConfig = sheetCfg;
      }

      this.actors.set(heroId, {
        sprite, ghost, ring, slot, hero, poseTex,
        standbyTex: texKey, standbyOriginY: originY,
        _snapshot: null, _poseScale: null,
        attackSprite, attackSheetConfig
      });
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

    this.actors.forEach((actor, heroId) => {
      // Mid-attack, the actor's transform is governed by setActionPose()'s
      // own snapshot (see below), not this fixed-formation math — a
      // resize firing between Gather and Recover would otherwise snap the
      // acting hero back to standby scale/position out from under their
      // own attack animation.
      if (actor._snapshot) return;
      const { sprite, ghost, ring, slot } = actor;
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

  // FAI-BATTLE-PRESENTATION-04: whether this hero has a real current-
  // authority sprite-sheet attack (currently only Kineza) — checked
  // FIRST, ahead of hasActionPoses(), since a sheet outranks a pose-swap
  // when both exist.
  hasAttackSheet(heroId) {
    const actor = this.actors.get(heroId);
    return !!(actor && actor.attackSprite);
  }

  // Plays the hero's real Basic Attack sprite sheet once, hiding the
  // standby Image for the duration (a hard cut between two always-opaque
  // layers, never a fade) and restoring it on completion. `onFrame(i)` is
  // called once per Phaser 'animationupdate' with the 0-based frame index
  // actually on screen, so the caller can fire audio/damage exactly when
  // that frame becomes visible — "synchronize attack event markers to
  // actual current frames," not a fixed-timing guess. Scale is calibrated
  // the same way setActionPose() calibrates pose textures — matched to
  // this actor's own current standby height, not an absolute constant —
  // but anchored on the sheet's own registered baselinePx fraction
  // (its own asset convention, distinct from the pose set's origin=1
  // convention) rather than reusing that unrelated number.
  playAttackSheet(heroId, onFrame) {
    const actor = this.actors.get(heroId);
    if (!actor || !actor.attackSprite) return Promise.resolve();
    const { sprite, attackSprite, hero } = actor;
    const cfg = actor.attackSheetConfig;
    const originY = cfg.baselinePx / cfg.frameHeight;
    const scale = (sprite.displayHeight / cfg.frameHeight) * (hero.scaleMul || 1);

    this.scene.tweens.killTweensOf(attackSprite);
    attackSprite
      .setOrigin(0.5, originY)
      .setScale(scale)
      .setPosition(sprite.x, sprite.y)
      .setFlipX(sprite.flipX)
      .setAlpha(1)
      .setVisible(true);
    sprite.setVisible(false);

    return new Promise(resolve => {
      const animKey = `${cfg.key}_play`;
      const onUpdate = (_anim, frame) => { if (onFrame) onFrame(frame.index - 1); };
      attackSprite.on('animationupdate', onUpdate);
      attackSprite.once('animationcomplete', () => {
        attackSprite.off('animationupdate', onUpdate);
        attackSprite.setVisible(false);
        sprite.setVisible(true);
        resolve();
      });
      attackSprite.play(animKey);
    });
  }

  // FAI-BATTLE-PRESENTATION-03: whether this hero's real attack pose set
  // loaded successfully — PartyBattleScene checks this before choosing
  // between setActionPose() (real motion) and the older attackGatherPulse()
  // + attackLunge() still-image tween pair (explicit fallback only).
  hasActionPoses(heroId) {
    const actor = this.actors.get(heroId);
    return !!(actor && actor.poseTex);
  }

  // Swaps the acting hero through their real BattleConfig pose set —
  // 'step' | 'gather' | 'release' | 'recover' | 'idle' — the same five
  // poses HeroPoseView.js already uses in the 1v1 battle, reusing its own
  // proven conventions: one scale for the whole pose set (derived from
  // the idle frame, calibrated here to match this actor's current
  // on-screen standby height rather than a screen fraction, so the
  // swap-in doesn't visibly jump size), origin (0.5, 1) since these
  // assets are authored with feet at the exact canvas bottom, and a
  // ghost-layer crossfade so the outgoing frame never goes fully
  // transparent mid-blend (see CLAUDE.md's "crossfading two stacked
  // sprites" trap). The formation's own three fixed slots/positions are
  // untouched — only the acting hero's own sprite ever changes here.
  //
  // 'idle' restores the actor's standby art (the locked JRPG master used
  // the rest of the time) and is the action-sequence's own exit —
  // matching ANIMATION_EVENT_MARKERS.md's actionEnd.
  setActionPose(heroId, pose) {
    const actor = this.actors.get(heroId);
    if (!actor || !actor.poseTex) return false;
    const { sprite, hero } = actor;

    if (pose === 'idle') {
      if (!actor._snapshot) return true; // never entered an action pose — nothing to restore
      const snap = actor._snapshot;
      this._crossfade(actor, actor.standbyTex, false, snap.originY, snap);
      actor._snapshot = null;
      actor._poseScale = null;
      return true;
    }

    const texKey = actor.poseTex[pose];
    if (!texKey) return false;

    if (!actor._snapshot) {
      // Captured once, from the standby art still on screen, before the
      // first pose swap — every subsequent beat in this action (gather/
      // release/recover) reuses this same calibration and home position,
      // exactly like HeroPoseView's "one scale for the whole pose set".
      actor._snapshot = {
        x: sprite.x, y: sprite.y,
        scaleX: sprite.scaleX, scaleY: sprite.scaleY,
        originY: sprite.originY
      };
      const idleTex = this.scene.textures.get(actor.poseTex.idle);
      const idleImg = idleTex && idleTex.getSourceImage();
      const mul = hero.scaleMul || 1;
      actor._poseScale = (idleImg && idleImg.height)
        ? (sprite.displayHeight / idleImg.height) * mul
        : sprite.scaleX;
    }

    const flip = !!(hero.flip && hero.flip[pose]);
    // A small forward translation on Release only — supporting the real
    // pose art, never substituting for it (ANIMATION_INTEGRATION_
    // DIRECTIVE.md's Fallback section draws this line explicitly). Not
    // for Prismel: ANIMATION_AUTHORITY_CORRECTION.md asks specifically
    // for "minimal restrained motion that does not visually impersonate a
    // final current attack" from his fallback — no forward commitment,
    // just the pose swap itself. Auryi's own correction note carries no
    // such restraint, so hers is unchanged.
    const nudge = (pose === 'release' && heroId !== 'prismel') ? 18 : 0;
    this._crossfade(actor, texKey, flip, 1, {
      x: actor._snapshot.x + nudge, y: actor._snapshot.y,
      scaleX: actor._poseScale, scaleY: actor._poseScale
    });
    return true;
  }

  // Shared by every setActionPose() transition, including the idle
  // restore. Always eases position (even zero-distance) rather than
  // snapping, so Release's nudge and Recover's return never pop — PriZim's
  // own "no pop entering/leaving attack" requirement.
  _crossfade(actor, texKey, flipX, originY, transform) {
    const { sprite, ghost } = actor;
    this.scene.tweens.killTweensOf(sprite);
    this.scene.tweens.killTweensOf(ghost);
    if (sprite.texture.key !== texKey) {
      // Ghost holds the outgoing frame fully opaque behind the incoming
      // one — fading both layers at once (this project's own documented
      // trap) leaves a window where the character is see-through.
      ghost.setTexture(sprite.texture.key)
        .setOrigin(sprite.originX, sprite.originY)
        .setPosition(sprite.x, sprite.y)
        .setScale(sprite.scaleX, sprite.scaleY)
        .setFlipX(sprite.flipX)
        .setAlpha(1);
      sprite.setTexture(texKey).setAlpha(0);
    }
    sprite.setOrigin(0.5, originY).setFlipX(flipX).setScale(transform.scaleX, transform.scaleY);
    this.scene.tweens.add({
      targets: sprite,
      x: transform.x, y: transform.y, alpha: 1,
      duration: 130,
      ease: 'Sine.easeInOut',
      onComplete: () => { sprite.setAlpha(1); ghost.setAlpha(0); }
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
