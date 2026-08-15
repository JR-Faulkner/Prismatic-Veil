// Active-Turn Battle Slice — 05E
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

  // Approximates the supplied Prismel signature-attack keyframe sheet
  // (staff-ready swirl -> shard launch -> impact burst) using the same
  // Graphics-primitive language the rest of Tactical's presentation
  // already speaks, rather than importing the reference sheet itself —
  // ASSET_MANIFEST is explicit these are keyframe/likeness authorities,
  // not final runtime sprites, and slicing them into real game assets is
  // its own pipeline (alpha work, resizing, frame timing) this slice
  // doesn't need to prove.
  async _playAttackPresentation(hero, target) {
    const s = this.scene;
    const a = s.grid.toScreen(hero.x, hero.y);
    const b = s.grid.toScreen(target.x, target.y);
    const g = this._worldGraphics(8.2);

    // Charge: a small prismatic swirl gathers at the hero's hand.
    await new Promise(resolve => {
      const driver = { v: 0 };
      s.tweens.add({
        targets: driver, v: 1, duration: 360, ease: 'Sine.easeOut',
        onUpdate: () => {
          g.clear();
          g.lineStyle(1.6, 0x9fe0ff, 0.7 * driver.v);
          g.strokeCircle(a.x + 10, a.y - 20, 6 + driver.v * 6);
          g.fillStyle(0xffe8a0, 0.6 * driver.v);
          g.fillCircle(a.x + 10, a.y - 20, 2 + driver.v * 1.5);
        },
        onComplete: resolve
      });
    });

    // Launch: the shard streaks from hero to target along the thread.
    await new Promise(resolve => {
      const driver = { v: 0 };
      s.tweens.add({
        targets: driver, v: 1, duration: 260, ease: 'Cubic.easeIn',
        onUpdate: () => {
          g.clear();
          const t = driver.v;
          const x = a.x + 10 + (b.x - (a.x + 10)) * t;
          const y = (a.y - 20) + (b.y - 18 - (a.y - 20)) * t;
          g.fillStyle(0xffe8a0, 0.9);
          g.fillCircle(x, y, 3);
          g.lineStyle(2, 0x9fe0ff, 0.5 * (1 - t * 0.4));
          g.beginPath();
          g.moveTo(a.x + 10, a.y - 20);
          g.lineTo(x, y);
          g.strokePath();
        },
        onComplete: resolve
      });
    });

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

  _buildHud(hero, target) {
    const s = this.scene;
    const w = s.scale.width, h = s.scale.height;
    const compact = w < 560 || h < 520;

    const c = s.add.container(0, 0).setDepth(9500).setAlpha(0);

    // Every panel anchors relative to the action panel's own position
    // instead of independently to the viewport — the earlier version
    // pinned the hero panel to viewport-bottom and the target panel to
    // viewport-top separately from the action panel, which worked by
    // coincidence on a wide/short landscape phone (side-by-side, no
    // overlap) but genuinely collided on a narrow/tall portrait phone
    // (confirmed directly: hero panel and action panel overlapped by
    // ~100px, target panel overlapped the turn banner). Stacking
    // everything bottom-up off one shared anchor is correct regardless
    // of aspect ratio, and keeps this entirely clear of the existing
    // top-of-screen HUD (turn banner, objective panel, enemy roster)
    // rather than competing with it for the same space.
    const margin = compact ? 10 : 16;
    const panelW = Math.min(w - margin * 2, 420);
    const panelH = compact ? 116 : 136;
    const px = w / 2;
    const py = h - margin - panelH / 2;
    const panelTop = py - panelH / 2;

    const rowGap = 8;
    const rowH = compact ? 92 : 108;
    const rowTop = panelTop - rowGap - rowH;
    const cardGap = 8;
    const cardW = (panelW - cardGap) / 2;
    const heroX = px - panelW / 2;
    const heroY = rowTop;
    const heroW = cardW;
    const heroH = rowH;
    const tgtX = heroX + cardW + cardGap;
    const tgtY = rowTop;
    const tgtW = cardW;
    const tgtH = rowH;

    // Hero card, bottom-left of the row — mirrors TacticalEncounterHUD's
    // portrait card language (circular framed portrait, HP/RP bars)
    // rather than introducing a third HUD visual style.
    const heroBg = s.add.rectangle(heroX, heroY, heroW, heroH, 0x090816, 0.90)
      .setOrigin(0, 0).setStrokeStyle(1.4, 0xc6a45a, 0.85);
    const portraitD = heroH - 16;
    const heroPortraitFrame = s.add.circle(heroX + 8 + portraitD / 2, heroY + heroH / 2, portraitD / 2, 0x111326, 0.95)
      .setStrokeStyle(1.4, 0x67c8ff, 0.85);
    const heroPortrait = s.add.image(heroPortraitFrame.x, heroPortraitFrame.y, hero.portraitKey);
    const hTex = heroPortrait.texture.getSourceImage();
    const hTarget = portraitD * 0.92;
    const hSrcW = hTex && hTex.width ? hTex.width : 1;
    const hSrcH = hTex && hTex.height ? hTex.height : 1;
    heroPortrait.setDisplaySize(
      hSrcW >= hSrcH ? hTarget : hTarget * (hSrcW / hSrcH),
      hSrcH >= hSrcW ? hTarget : hTarget * (hSrcH / hSrcW)
    );

    const contentX = heroX + 12 + portraitD;
    const heroName = s.add.text(contentX, heroY + 10, hero.name, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: compact ? '13px' : '16px', color: '#FFE8A0'
    }).setOrigin(0, 0);

    const hpBarW = Math.max(30, heroX + heroW - 10 - contentX);
    const hpTrack = s.add.rectangle(contentX, heroY + 36, hpBarW, 9, 0x24121c, 0.95).setOrigin(0, 0);
    const hpFill = s.add.rectangle(contentX, heroY + 36, hpBarW, 9, 0x71ff88, 1).setOrigin(0, 0);
    const hpText = s.add.text(contentX, heroY + 49, `HP ${hero.hp}/${hero.maxHp}`, {
      fontFamily: 'Georgia, serif', fontSize: compact ? '9px' : '11px', color: '#F4E7C0'
    }).setOrigin(0, 0);

    const rpTrack = s.add.rectangle(contentX, heroY + 66, hpBarW, 7, 0x121a2c, 0.95).setOrigin(0, 0);
    const rpFill = s.add.rectangle(contentX, heroY + 66, hpBarW, 7, 0x67c8ff, 1).setOrigin(0, 0);
    const rpText = s.add.text(contentX, heroY + 77, `RP ${hero.rp}/${hero.maxRp}`, {
      fontFamily: 'Georgia, serif', fontSize: compact ? '9px' : '11px', color: '#C8DFFF'
    }).setOrigin(0, 0);

    // Target card, bottom-right of the row.
    const tgtBg = s.add.rectangle(tgtX, tgtY, tgtW, tgtH, 0x090816, 0.90)
      .setOrigin(0, 0).setStrokeStyle(1.4, 0xd878ff, 0.7);
    const tgtName = s.add.text(tgtX + 12, tgtY + 10, target.name, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: compact ? '13px' : '16px', color: '#FF8B9A'
    }).setOrigin(0, 0);
    const tgtHpBarW = tgtW - 24;
    const tgtHpTrack = s.add.rectangle(tgtX + 12, tgtY + 40, tgtHpBarW, 10, 0x24121c, 0.95).setOrigin(0, 0);
    const tgtHpFill = s.add.rectangle(tgtX + 12, tgtY + 40, tgtHpBarW, 10, 0xa8243f, 1).setOrigin(0, 0);
    const tgtHpText = s.add.text(tgtX + tgtW / 2, tgtY + 55, `${target.hp}/${target.maxHp}`, {
      fontFamily: 'Georgia, serif', fontSize: compact ? '10px' : '12px', color: '#FFFFFF'
    }).setOrigin(0.5, 0);

    // Action panel, bottom-most — attack name, fixed damage readout, confirm/back.
    const panelBg = s.add.rectangle(px, py, panelW, panelH, 0x090816, 0.92)
      .setStrokeStyle(1.5, 0xffe8a0, 0.55);
    const abilityName = s.add.text(px, py - panelH * 0.32, hero.ability, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: compact ? '15px' : '18px', color: '#9FE0FF'
    }).setOrigin(0.5);
    const dmgText = s.add.text(px, py - panelH * 0.06, `Damage: ${ActiveTurnBattleSlice.FIXED_DAMAGE}`, {
      fontFamily: 'Georgia, serif', fontSize: compact ? '13px' : '15px', color: '#F7E8B6'
    }).setOrigin(0.5);

    const btnW = compact ? 120 : 140, btnH = compact ? 36 : 42;
    const confirmBg = s.add.rectangle(px - btnW / 2 - 8, py + panelH * 0.30, btnW, btnH, 0x1a3a1e, 0.95)
      .setStrokeStyle(1.4, 0x71ff88, 0.85).setInteractive({ useHandCursor: true });
    const confirmText = s.add.text(confirmBg.x, confirmBg.y, 'CONFIRM', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: compact ? '13px' : '15px', color: '#D8FFD8'
    }).setOrigin(0.5);

    const backBg = s.add.rectangle(px + btnW / 2 + 8, py + panelH * 0.30, btnW, btnH, 0x3a1a1e, 0.95)
      .setStrokeStyle(1.4, 0xff8b8b, 0.85).setInteractive({ useHandCursor: true });
    const backText = s.add.text(backBg.x, backBg.y, 'BACK', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold',
      fontSize: compact ? '13px' : '15px', color: '#FFD8D8'
    }).setOrigin(0.5);

    c.add([
      heroBg, heroPortraitFrame, heroPortrait, heroName,
      hpTrack, hpFill, hpText, rpTrack, rpFill, rpText,
      tgtBg, tgtName, tgtHpTrack, tgtHpFill, tgtHpText,
      panelBg, abilityName, dmgText,
      confirmBg, confirmText, backBg, backText
    ]);
    this._uiObject(c);

    return {
      container: c, hpFill, hpText, tgtHpFill, tgtHpText, hpBarW, tgtHpBarW,
      confirmBg, backBg
    };
  }

  _updateHudHp(hud, hero, target) {
    const hFrac = Phaser.Math.Clamp(hero.hp / hero.maxHp, 0, 1);
    hud.hpFill.setSize(Math.max(1, hud.hpBarW * hFrac), hud.hpFill.height);
    hud.hpText.setText(`HP ${hero.hp}/${hero.maxHp}`);
    const tFrac = Phaser.Math.Clamp(target.hp / target.maxHp, 0, 1);
    hud.tgtHpFill.setSize(Math.max(1, hud.tgtHpBarW * tFrac), hud.tgtHpFill.height);
    hud.tgtHpText.setText(`${Math.max(0, target.hp)}/${target.maxHp}`);
  }

  _teardownVisuals() {
    this.timers.forEach(t => { if (t && t.remove) t.remove(false); });
    this.timers = [];
    this.layers.forEach(o => { if (o && o.destroy) { try { o.destroy(); } catch (err) {} } });
    this.layers = [];
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

  async run(hero, target) {
    if (this._running) return;
    this._running = true;
    this._resolved = false;

    const s = this.scene;
    s.inputLocked = true;
    s.grid.clearAllOverlays();

    s.tacticalCamera.saveCinematicState();
    s.grid.showAttackRange([{ x: target.x, y: target.y }]);
    this._drawResonanceThread(hero, target);
    this._vignettePulse();

    const focusX = hero.x + (target.x - hero.x) * 0.32;
    const focusY = hero.y + (target.y - hero.y) * 0.32;
    s.tacticalCamera.setZoom(Math.min(s.tacticalCamera.zoomMax, 1.4));
    s.tacticalCamera.focusOn(focusX, focusY, 420);
    await this._delay(460);

    const hud = this._buildHud(hero, target);
    s.tweens.add({ targets: hud.container, alpha: 1, duration: 240, ease: 'Sine.easeOut' });

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

    s.grid.clearAllOverlays();
    s.finishHeroAction(hero);
    s.checkVictoryDefeat();

    s.inputLocked = false;
    this._running = false;
    this._resolved = true;
  }
}
