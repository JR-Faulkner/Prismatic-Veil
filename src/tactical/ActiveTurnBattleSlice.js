// Active-Turn Battle Slice — 05E / 05E-2
//
// The first STATEFUL promotion out of the Dream View battle-mode sandbox
// (05D-1). Unlike every dreamview=* sandbox, this intentionally mutates
// real combat state — so it deliberately does NOT live behind the
// `dreamview=` query namespace. Every existing sandbox and this project's
// own QA habits treat `dreamview=` as a hard guarantee of zero state
// mutation; reusing that prefix here would quietly break that guarantee
// for anyone who trusts it. Gated behind its own `battleslice=1` param
// instead, so the two families stay unambiguous.
//
// Scope (BUILD_BRIEF 05E): Prismel vs a Hushling only, fixed deterministic
// damage, no crits/misses/status/victory-defeat — this is a proof that the
// stateful loop (confirm -> exactly-once damage -> persists back to
// Tactical) works at all, not a combat system.
//
// Intercepts at the same entry point real ATTACK/RESONART already uses
// (TacticalScene.tryAttack() -> enterLinkedBattle()), so range/LOS
// validation is inherited for free and this never launches VeilBattleScene
// — everything happens inside the live Tactical scene.
//
// 05E-2 correction: the first pass approximated the attack with Graphics
// primitives and kept the underlying Tactical map token at its normal
// tiny map-icon scale — user QA (on the unmodified linked-BP path, not
// this slice) asked for a visibly new experience, and DAI's follow-up
// brief made the requirement explicit regardless: the approved Prismel
// keyframe sheets must actually appear on screen, and the camera/framing
// change must be unmistakable. This version shows a large, dominant
// foreground cutin (PRISMEL_READY_FRAMES then PRISMEL_ATTACK_FRAMES,
// cycled as real sprite frames on the UI layer) alongside a much tighter
// camera push on the live Tactical battlefield, and a mobile-first HUD
// rebuild (see _layout()).
//
// The two frame arrays below are extracted from the approved
// prismel_staff_materialization_6f.png / prismel_signature_attack_6f.png
// keyframe sheets (background-matted + trimmed offline, not sliced live —
// see FAI_FEEDBACK_05E2 for the extraction method). A dedicated asset
// family under assets/poses/prismel_active_turn/, kept separate from both
// the tactical map-icon set and the existing BattleCinematic pose set per
// this project's own "different asset libraries" rule. IntegratedTacticalScene
// imports these same two arrays for its preload() step, so the texture
// keys used there and here can never drift out of sync.
export const PRISMEL_READY_FRAMES = ['prismel_ready_1', 'prismel_ready_2', 'prismel_ready_3', 'prismel_ready_4', 'prismel_ready_5', 'prismel_ready_6'];
export const PRISMEL_ATTACK_FRAMES = ['prismel_attack_1', 'prismel_attack_2', 'prismel_attack_3', 'prismel_attack_4', 'prismel_attack_5', 'prismel_attack_6'];

export default class ActiveTurnBattleSlice {
  // Non-lethal on purpose: Hushling's 10 HP stays above zero after this
  // fixed hit, so defeat/victory flow (an explicit 05E non-goal) never
  // has to trigger for this slice to prove the loop end-to-end.
  static FIXED_DAMAGE = 4;

  constructor(scene) {
    this.scene = scene;
    this.layers = [];
    this.timers = [];
    this._running = false;
    this._resolved = false;
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return ['1', 'true', 'on', 'yes'].includes((params.get('battleslice') || '').toLowerCase());
  }

  shouldIntercept(hero, target) {
    return this.isEnabled()
      && !!hero && hero.id === 'prismel'
      && !!target && target.type === 'hushling' && target.alive;
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
    this.scene.uiAdd(obj);
    this.layers.push(obj);
    return obj;
  }

  _drawResonanceThread(hero, target) {
    const a = this.scene.grid.toScreen(hero.x, hero.y);
    const b = this.scene.grid.toScreen(target.x, target.y);
    const g = this._worldGraphics(6.2);
    g.lineStyle(1.4, 0x9fe0ff, 0.46);
    g.beginPath();
    g.moveTo(a.x, a.y - 18);
    g.lineTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 34);
    g.lineTo(b.x, b.y - 18);
    g.strokePath();
    return g;
  }

  // A brief vignette pulse, not a full opaque curtain — the battlefield
  // must stay visible and zoomed throughout, never hidden the way the
  // real Tactical<->BP bridge's LinkedBattleTransition closes over a
  // scene swap. That class is the wrong tool here for exactly that
  // reason: its curtains end fully closed, which would hide the very
  // battlefield this slice is supposed to keep in view.
  _vignettePulse() {
    const s = this.scene;
    const w = s.scale.width, h = s.scale.height;
    const wash = s.add.rectangle(0, 0, w, h, 0x1a0f38, 0).setOrigin(0, 0);
    this._uiObject(wash);
    s.tweens.add({
      targets: wash, alpha: 0.22, duration: 260, yoyo: true, ease: 'Sine.easeInOut'
    });
    return wash;
  }

  // Single source of truth for every panel's geometry, returning explicit
  // top-left rects so nothing can drift out of sync (the pre-05E-2 version
  // anchored each panel independently and collided). Two distinct layouts:
  //
  //  - Portrait / desktop (tall enough): a vertical stack — target strip
  //    across the top under the turn banner, the Prismel cutin filling the
  //    middle, hero row + action panel across the bottom.
  //
  //  - Landscape phone (short, wide): the vertical stack physically can't
  //    fit under the wide centred turn banner in ~390px of height, so
  //    MOBILE_HUD_ACCEPTANCE.md's landscape hierarchy applies instead —
  //    live view centre, hero card bottom-left, actions bottom-right,
  //    target HP a thin strip up top, and the cutin as the centre
  //    foreground between the two bottom cards.
  _layoutMetrics() {
    const s = this.scene;
    const w = s.scale.width, h = s.scale.height;
    const compact = w < 560 || h < 520;
    const landscape = w > h && h < 520;
    const margin = compact ? 10 : 16;
    const phaseFrameH = s.phaseFrame ? s.phaseFrame.displayHeight : 70;
    const bannerBottom = margin + phaseFrameH;

    if (landscape) {
      const stripY = bannerBottom + 6;
      const stripH = 46;
      const target = { x: margin, y: stripY, w: w - margin * 2, h: stripH };

      const cardW = Math.min(Math.round(w * 0.31), 300);
      const heroH = 92;
      const hero = { x: margin, y: h - margin - heroH, w: cardW, h: heroH };
      const actionH = 128;
      const action = { x: w - margin - cardW, y: h - margin - actionH, w: cardW, h: actionH };

      const cutinX = hero.x + hero.w + 12;
      const cutinBottomY = h - margin;
      const cutinTop = stripY + stripH + 8;
      return {
        w, h, compact, landscape, margin, target, hero, action,
        cutin: {
          x: cutinX, bottomY: cutinBottomY,
          maxW: Math.max(120, action.x - cutinX - 12),
          maxH: Math.max(120, cutinBottomY - cutinTop)
        }
      };
    }

    // Portrait / desktop vertical stack.
    const stripTop = bannerBottom + 8;
    const stripH = compact ? 60 : 72;
    const target = { x: margin, y: stripTop, w: w - margin * 2, h: stripH };

    const panelW = Math.min(w - margin * 2, 460);
    const panelH = compact ? 132 : 150;
    const panelX = (w - panelW) / 2;
    const action = { x: panelX, y: h - margin - panelH, w: panelW, h: panelH };

    const heroH = compact ? 104 : 118;
    const hero = { x: panelX, y: action.y - 8 - heroH, w: panelW, h: heroH };

    const cutinTop = target.y + target.h + 10;
    return {
      w, h, compact, landscape, margin, target, hero, action,
      cutin: {
        x: margin, bottomY: hero.y - 6,
        maxW: w * (compact ? 0.62 : 0.46),
        maxH: Math.max(140, (hero.y - 6) - cutinTop)
      }
    };
  }

  _ensureCutin() {
    if (this._cutinImage) return this._cutinImage;
    const s = this.scene;
    const img = s.add.image(0, 0, PRISMEL_READY_FRAMES[0])
      .setOrigin(0, 1)
      .setDepth(9400)
      .setAlpha(0);
    this._uiObject(img);
    this._cutinImage = img;
    return img;
  }

  _layoutCutin() {
    const img = this._cutinImage;
    if (!img) return;
    const c = this._layoutMetrics().cutin;
    const tex = img.texture.getSourceImage();
    const srcW = tex && tex.width ? tex.width : 1;
    const srcH = tex && tex.height ? tex.height : 1;
    let dispH = Math.min(c.maxH, srcH);
    let dispW = dispH * (srcW / srcH);
    if (dispW > c.maxW) {
      dispW = c.maxW;
      dispH = dispW * (srcH / srcW);
    }
    img.setDisplaySize(dispW, dispH);
    img.setPosition(c.x, c.bottomY);
  }

  // Cycles the cutin through a frame sequence at a fixed cadence, awaiting
  // the full sequence. setTexture() per frame (not a Phaser AnimationManager
  // asset) — twelve one-off frames across two beats don't need a registered
  // animation, and this keeps _layoutCutin()'s per-frame native-size read
  // (frames have different trimmed aspect ratios) trivially correct.
  async _cycleFrames(frameKeys, frameMs) {
    const img = this._ensureCutin();
    for (const key of frameKeys) {
      img.setTexture(key);
      this._layoutCutin();
      await this._delay(frameMs);
    }
  }

  // Prismel is present as the dominant foreground cutin for the WHOLE
  // active turn (matching too_quiet_active_turn_prismel_mock.png), not
  // just during the attack — so the staff-materialization ready sequence
  // plays as the turn opens, alongside the HUD fade-in, and then holds on
  // the fully-materialized ready pose while the player decides. The
  // approved authored art is on screen from the first beat, which is
  // BUILD_BRIEF 05E-2's hard visual requirement.
  async _introCutin() {
    const img = this._ensureCutin();
    img.setTexture(PRISMEL_READY_FRAMES[0]);
    this._layoutCutin();
    this.scene.tweens.add({ targets: img, alpha: 1, duration: 220, ease: 'Sine.easeOut' });
    await this._cycleFrames(PRISMEL_READY_FRAMES, 120);
    // Hold on the last ready frame (staff fully materialized) — set
    // explicitly so a later re-layout keeps the right texture.
    img.setTexture(PRISMEL_READY_FRAMES[PRISMEL_READY_FRAMES.length - 1]);
    this._layoutCutin();
  }

  // Real authored keyframes drive this instead of a Graphics
  // approximation — the signature attack (charge -> release -> recover),
  // per BUILD_BRIEF 05E-2's hard visual requirement. The cutin is already
  // visible (from _introCutin), so this just cycles the attack frames.
  // The thread/impact Graphics accents stay as supplementary particles/
  // lighting around the real character art, which the brief still allows.
  async _playAttackPresentation(hero, target) {
    this._ensureCutin();
    await this._cycleFrames(PRISMEL_ATTACK_FRAMES.slice(0, 4), 100);

    // The shard-launch beat (last two attack frames) races the actual
    // projectile graphic toward the target so the real impact and the
    // authored release pose land together.
    const s = this.scene;
    const a = s.grid.toScreen(hero.x, hero.y);
    const b = s.grid.toScreen(target.x, target.y);
    const g = this._worldGraphics(8.2);
    const launch = new Promise(resolve => {
      const driver = { v: 0 };
      s.tweens.add({
        targets: driver, v: 1, duration: 240, ease: 'Cubic.easeIn',
        onUpdate: () => {
          g.clear();
          const t = driver.v;
          const x = a.x + 10 + (b.x - (a.x + 10)) * t;
          const y = (a.y - 20) + (b.y - 18 - (a.y - 20)) * t;
          g.fillStyle(0xffe8a0, 0.9);
          g.fillCircle(x, y, 4);
          g.lineStyle(2.4, 0x9fe0ff, 0.55 * (1 - t * 0.4));
          g.beginPath();
          g.moveTo(a.x + 10, a.y - 20);
          g.lineTo(x, y);
          g.strokePath();
        },
        onComplete: resolve
      });
    });
    await Promise.all([this._cycleFrames(PRISMEL_ATTACK_FRAMES.slice(4), 110), launch]);

    g.clear();
    g.destroy();
    this.layers = this.layers.filter(o => o !== g);
  }

  _impactBurst(target) {
    const s = this.scene;
    const p = s.grid.toScreen(target.x, target.y);
    const ring = s.add.ellipse(p.x, p.y, 20, 8, 0x000000, 0)
      .setStrokeStyle(2.2, 0xffe8a0, 0.85).setDepth(8.3);
    s.worldAdd(ring);
    s.tweens.add({
      targets: ring, scaleX: 3.4, scaleY: 2.6, alpha: 0,
      duration: 380, ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
    s.cameras.main.shake(140, 0.004);
  }

  // 05E-2 mobile HUD correction: MOBILE_HUD_ACCEPTANCE.md's hard requirement
  // is a dedicated mobile layout, not the desktop HUD proportionally
  // shrunk — "no scaling a pre-rendered HUD texture/canvas that causes
  // blur." This was never actually baked-texture blur (every element here
  // is a live Text/Rectangle/Circle primitive, and the project's own
  // per-object `resolution: devicePixelRatio` patch on add.text() already
  // keeps text pixel-sharp at any size) — the real issue was font sizes
  // and button targets simply too small at real phone viewing distance,
  // plus the target card competing for the same bottom cluster as the
  // hero card and action panel. Portrait hierarchy now follows the brief
  // exactly: target+HP at the top (below the existing turn banner, which
  // already doubles as the compact turn-order element), the live battle
  // view + Prismel cutin in the middle, hero HP/RP + large actions at the
  // bottom.
  _buildHud(hero, target) {
    const s = this.scene;
    const m = this._layoutMetrics();
    const c = s.add.container(0, 0).setDepth(9500).setAlpha(0);
    const parts = [];

    const tgt = this._buildTargetStrip(m, target, parts);
    const hp = this._buildHeroCard(m, hero, parts);
    const act = this._buildActionPanel(m, hero, parts);

    c.add(parts);
    this._uiObject(c);

    return {
      container: c,
      hpFill: hp.hpFill, hpText: hp.hpText, hpBarW: hp.hpBarW,
      tgtHpFill: tgt.hpFill, tgtHpText: tgt.hpText, tgtHpBarW: tgt.hpBarW,
      confirmBg: act.confirmBg, backBg: act.backBg
    };
  }

  // Target HP: a full-width strip in portrait/desktop, the same strip
  // shape (just thinner) up top in landscape. Name left, HP value centred
  // on the bar.
  _buildTargetStrip(m, target, parts) {
    const s = this.scene;
    const r = m.target;
    const big = !m.compact;
    const bg = s.add.rectangle(r.x, r.y, r.w, r.h, 0x090816, 0.90)
      .setOrigin(0, 0).setStrokeStyle(1.6, 0xd878ff, 0.75);
    const name = s.add.text(r.x + 14, r.y + (m.landscape ? 6 : 8), target.name, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: big ? '24px' : (m.landscape ? '17px' : '20px'), color: '#FF8B9A'
    }).setOrigin(0, 0);
    const barH = big ? 16 : 14;
    const barW = r.w - 28;
    const barY = r.y + r.h - (m.landscape ? 20 : (big ? 24 : 22));
    const track = s.add.rectangle(r.x + 14, barY, barW, barH, 0x24121c, 0.95).setOrigin(0, 0);
    const fill = s.add.rectangle(r.x + 14, barY, barW, barH, 0xa8243f, 1).setOrigin(0, 0);
    const text = s.add.text(r.x + 14 + barW / 2, barY + barH / 2, `${target.hp} / ${target.maxHp}`, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: big ? '15px' : '13px', color: '#FFFFFF'
    }).setOrigin(0.5);
    parts.push(bg, name, track, fill, text);
    return { hpFill: fill, hpText: text, hpBarW: barW };
  }

  // Always portrait-left / content-right (name + two bars stacked to the
  // right of the circular portrait) — the same internal layout for every
  // orientation, so the only thing that changes per-orientation is the
  // outer card rect from _layoutMetrics(). An earlier landscape-specific
  // stack put the name below the portrait, which overflowed the short
  // (~92px) landscape card and pushed the bars off-screen.
  _buildHeroCard(m, hero, parts) {
    const s = this.scene;
    const r = m.hero;
    const big = !m.compact;
    const bg = s.add.rectangle(r.x, r.y, r.w, r.h, 0x090816, 0.90)
      .setOrigin(0, 0).setStrokeStyle(1.6, 0xc6a45a, 0.85);
    const portraitD = Math.min(r.h - 18, r.w * 0.34);
    const frame = s.add.circle(r.x + 9 + portraitD / 2, r.y + r.h / 2, portraitD / 2, 0x111326, 0.95)
      .setStrokeStyle(1.6, 0x67c8ff, 0.85);
    const portrait = s.add.image(frame.x, frame.y, hero.portraitKey);
    const tex = portrait.texture.getSourceImage();
    const sz = portraitD * 0.92;
    const sw = tex && tex.width ? tex.width : 1;
    const sh = tex && tex.height ? tex.height : 1;
    portrait.setDisplaySize(sw >= sh ? sz : sz * (sw / sh), sh >= sw ? sz : sz * (sh / sw));

    const contentX = r.x + 14 + portraitD;
    const contentW = r.x + r.w - 12 - contentX;
    const name = s.add.text(contentX, r.y + (big ? 10 : 8), hero.name, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: big ? '22px' : (m.landscape ? '16px' : '18px'), color: '#FFE8A0'
    }).setOrigin(0, 0);

    const barH = big ? 20 : (m.landscape ? 15 : 18);
    const hpBarW = Math.max(50, contentW);
    const hpBarY = r.y + (big ? 48 : (m.landscape ? 34 : 40));
    const hpTrack = s.add.rectangle(contentX, hpBarY, hpBarW, barH, 0x24121c, 0.95).setOrigin(0, 0);
    const hpFill = s.add.rectangle(contentX, hpBarY, hpBarW, barH, 0x71ff88, 1).setOrigin(0, 0);
    const hpText = s.add.text(contentX + hpBarW / 2, hpBarY + barH / 2, `HP ${hero.hp}/${hero.maxHp}`, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: big ? '15px' : '13px', color: '#0a1a0e'
    }).setOrigin(0.5);

    const rpBarY = hpBarY + barH + (big ? 10 : 6);
    const rpTrack = s.add.rectangle(contentX, rpBarY, hpBarW, barH, 0x121a2c, 0.95).setOrigin(0, 0);
    const rpFill = s.add.rectangle(contentX, rpBarY, hpBarW, barH, 0x67c8ff, 1).setOrigin(0, 0);
    const rpText = s.add.text(contentX + hpBarW / 2, rpBarY + barH / 2, `RP ${hero.rp}/${hero.maxRp}`, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: big ? '15px' : '13px', color: '#0a1420'
    }).setOrigin(0.5);

    parts.push(bg, frame, portrait, name, hpTrack, hpFill, hpText, rpTrack, rpFill, rpText);
    return { hpFill, hpText, hpBarW };
  }

  _buildActionPanel(m, hero, parts) {
    const s = this.scene;
    const r = m.action;
    const big = !m.compact;
    const cx = r.x + r.w / 2;
    const bg = s.add.rectangle(r.x, r.y, r.w, r.h, 0x090816, 0.92)
      .setOrigin(0, 0).setStrokeStyle(1.8, 0xffe8a0, 0.6);
    const abilityName = s.add.text(cx, r.y + r.h * 0.18, hero.ability, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: big ? '22px' : (m.landscape ? '17px' : '19px'), color: '#9FE0FF'
    }).setOrigin(0.5);
    const dmgText = s.add.text(cx, r.y + r.h * 0.44, `Damage: ${ActiveTurnBattleSlice.FIXED_DAMAGE}`, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: big ? '18px' : (m.landscape ? '14px' : '16px'), color: '#F7E8B6'
    }).setOrigin(0.5);

    const btnW = Math.min(big ? 158 : 138, (r.w - 30) / 2);
    const btnH = m.landscape ? 40 : (big ? 54 : 48);
    const btnY = r.y + r.h - btnH / 2 - 12;
    const confirmBg = s.add.rectangle(cx - btnW / 2 - 8, btnY, btnW, btnH, 0x1a3a1e, 0.95)
      .setStrokeStyle(1.8, 0x71ff88, 0.9).setInteractive({ useHandCursor: true });
    const confirmText = s.add.text(confirmBg.x, confirmBg.y, 'CONFIRM', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: m.landscape ? '15px' : (big ? '19px' : '17px'), color: '#D8FFD8'
    }).setOrigin(0.5);
    const backBg = s.add.rectangle(cx + btnW / 2 + 8, btnY, btnW, btnH, 0x3a1a1e, 0.95)
      .setStrokeStyle(1.8, 0xff8b8b, 0.9).setInteractive({ useHandCursor: true });
    const backText = s.add.text(backBg.x, backBg.y, 'BACK', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: m.landscape ? '15px' : (big ? '19px' : '17px'), color: '#FFD8D8'
    }).setOrigin(0.5);

    parts.push(bg, abilityName, dmgText, confirmBg, confirmText, backBg, backText);
    return { confirmBg, backBg };
  }

  _updateHudHp(hud, hero, target) {
    const hFrac = Phaser.Math.Clamp(hero.hp / hero.maxHp, 0, 1);
    hud.hpFill.setSize(Math.max(1, hud.hpBarW * hFrac), hud.hpFill.height);
    hud.hpText.setText(`HP ${hero.hp}/${hero.maxHp}`);
    const tFrac = Phaser.Math.Clamp(target.hp / target.maxHp, 0, 1);
    hud.tgtHpFill.setSize(Math.max(1, hud.tgtHpBarW * tFrac), hud.tgtHpFill.height);
    hud.tgtHpText.setText(`${Math.max(0, target.hp)} / ${target.maxHp}`);
  }

  _teardownVisuals() {
    this.timers.forEach(t => { if (t && t.remove) t.remove(false); });
    this.timers = [];
    this.layers.forEach(o => { if (o && o.destroy) { try { o.destroy(); } catch (err) {} } });
    this.layers = [];
    // _cutinImage is destroyed above (it's in `layers`, via _ensureCutin's
    // _uiObject() call) — the reference itself must also clear here, or a
    // second run() would hand _ensureCutin() a dead object to reuse.
    this._cutinImage = null;
  }

  // Mirrors onActionMenuChoice('cancel')'s cleanup exactly, but called
  // directly instead of through that handler — it starts with an
  // `inputLocked` guard, and this slice deliberately keeps input locked
  // for its whole run so the normal world-tap/HUD handlers stay inert
  // while this owns the screen.
  _cancelToTacticalSelection() {
    const s = this.scene;
    s.unitController.clearSelection();
    s.actionMenu.container.setVisible(false);
    s.zoomControls.container.setVisible(true);
    s._pendingAction = null;
    s._previewedTile = null;
    s.refreshHUD();
  }

  // 05E-2 "HUD duplication cleanup": the objective panel and enemy roster
  // cards (TacticalEncounterHUD) show the same target HP the active-turn
  // strip now owns — leaving both up competes for the same information
  // and the same screen space. Hidden for the slice's duration only,
  // restored the moment control returns to Tactical (both the Confirm and
  // Back exits go through here, same as every other piece of state this
  // slice touches).
  _hideBackgroundHud() {
    const s = this.scene;
    if (s.encounterHUD && s.encounterHUD.container) s.encounterHUD.container.setVisible(false);
    // messageText is the base scene's floating narration ("Prismel: choose
    // a target in range.") — stale and distracting once the active-turn
    // HUD owns the screen. finishHeroAction()/refreshHUD() on return
    // repaints it from this.message, so hiding it here is safe; the final
    // "suffers N damage!" line still shows on the restored overview.
    if (s.messageText) s.messageText.setVisible(false);
  }

  _restoreBackgroundHud() {
    const s = this.scene;
    if (s.encounterHUD && s.encounterHUD.container) s.encounterHUD.container.setVisible(true);
    if (s.messageText) s.messageText.setVisible(true);
  }

  async run(hero, target) {
    if (this._running) return;
    this._running = true;
    this._resolved = false;

    const s = this.scene;
    s.inputLocked = true;
    s.grid.clearAllOverlays();
    this._hideBackgroundHud();

    s.tacticalCamera.saveCinematicState();
    s.grid.showAttackRange([{ x: target.x, y: target.y }]);
    this._drawResonanceThread(hero, target);
    this._vignettePulse();

    // 05E-2: the prior pass's push to 1.4 (and even the config's own 1.6
    // zoomMax) wasn't visibly obvious enough — user QA and the brief both
    // flag the camera change as the thing that must be unmistakable, with
    // a phone recording as the acceptance proof. The tactical camera
    // clamps every focusOn() update to zoomMax, so a bigger push means
    // temporarily raising that ceiling for the slice's duration and
    // restoring it on exit (saved cinematic zoom is 0.95, well inside the
    // original bounds, so restoreCinematicState() is unaffected either
    // way). The map tokens stay a clean downscale even at 2.0x (their
    // pre-processed content heights are 230-400px, still larger than the
    // on-screen size at this zoom), so nothing upscales/softens.
    //
    // Focus lands on the TARGET, not the midpoint: the approved mock frames
    // Prismel as the big foreground cutin (the persistent ready pose, shown
    // from turn-open by _introCutin) while the live camera keeps the target
    // enemy centred and readable ahead. Biasing 0.85 toward the target
    // (rather than dead-on) keeps a little of the space between them in
    // frame so the shard's travel path reads, while still framing the
    // target clearly rather than parking it at a screen edge.
    this._savedZoomMax = s.tacticalCamera.zoomMax;
    s.tacticalCamera.zoomMax = 2.0;
    const focusX = hero.x + (target.x - hero.x) * 0.85;
    const focusY = hero.y + (target.y - hero.y) * 0.85;
    s.tacticalCamera.setZoom(2.0);
    s.tacticalCamera.focusOn(focusX, focusY, 520);
    await this._delay(560);

    // Prismel ready-up cutin + HUD come up together — the approved art is
    // on screen from the start of the active turn, not just on confirm.
    const introDone = this._introCutin();
    const hud = this._buildHud(hero, target);
    s.tweens.add({ targets: hud.container, alpha: 1, duration: 240, ease: 'Sine.easeOut' });
    await introDone;

    // Wait for a real tap on either button — this is the one beat in the
    // whole slice that must not auto-advance, since Confirm is the exact
    // moment state mutation is allowed to happen.
    const choice = await new Promise(resolve => {
      hud.confirmBg.once('pointerdown', () => resolve('confirm'));
      hud.backBg.once('pointerdown', () => resolve('back'));
    });

    if (choice === 'back') {
      await new Promise(resolve => {
        s.tweens.add({
          targets: hud.container, alpha: 0, duration: 200, ease: 'Sine.easeIn',
          onComplete: resolve
        });
      });
      this._teardownVisuals();
      await s.tacticalCamera.restoreCinematicState(360);
      s.tacticalCamera.zoomMax = this._savedZoomMax;
      this._restoreBackgroundHud();
      this._cancelToTacticalSelection();
      s.inputLocked = false;
      this._running = false;
      this._resolved = true;
      return;
    }

    // Confirm — disable both buttons immediately so a second tap (or a
    // fast double-click) can't queue a second resolution; only one
    // 'pointerdown' promise is ever awaited above, but this also stops
    // any further pointer events from reaching them while damage applies.
    hud.confirmBg.disableInteractive();
    hud.backBg.disableInteractive();
    hud.confirmBg.setAlpha(0.5);
    hud.backBg.setAlpha(0.5);

    await this._playAttackPresentation(hero, target);

    // The one place damage is applied — exactly once, matching every
    // other real damage-application path in this scene (onBattleResolved,
    // enemyAttack's onImpact).
    target.hp = Math.max(0, target.hp - ActiveTurnBattleSlice.FIXED_DAMAGE);
    this._impactBurst(target);
    s.floatDamage(target, ActiveTurnBattleSlice.FIXED_DAMAGE, false);
    this._updateHudHp(hud, hero, target);
    s.setMessage(`${target.name} suffers ${ActiveTurnBattleSlice.FIXED_DAMAGE} damage!`);
    if (target.hp <= 0) s.defeatEnemy(target);

    await this._delay(680);

    s.tweens.add({ targets: hud.container, alpha: 0, duration: 240, ease: 'Sine.easeIn' });
    await this._delay(260);

    this._teardownVisuals();
    await s.tacticalCamera.restoreCinematicState(380);
    s.tacticalCamera.zoomMax = this._savedZoomMax;
    this._restoreBackgroundHud();

    s.grid.clearAllOverlays();
    s.finishHeroAction(hero);
    s.checkVictoryDefeat();

    s.inputLocked = false;
    this._running = false;
    this._resolved = true;
  }
}
