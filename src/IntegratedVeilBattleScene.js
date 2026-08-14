// Integrated Linked Battle Presentation — 04A + 04B + 04C + 04E
//
// Compatibility wrapper over the validated VeilBattleScene. Standalone BP
// remains untouched; only Tactical-linked rounds receive the cinematic
// transition, streamlined HUD, one-meaningful-tap pacing, action identity,
// and Tactical-authoritative RP preview.
import VeilBattleScene from './VeilBattleScene.js?v=48';
import LinkedBattleTransition from './LinkedBattleTransition.js?v=1';

const DEFAULT_POSE_TIMING = Object.freeze({
  step: 220,
  gather: 450,
  hold: 120,
  release: 160,
  recover: 260
});

export default class IntegratedVeilBattleScene extends VeilBattleScene {
  create() {
    super.create();
    if (!this.linkedMode) return;

    this.linkedBattleTransition = new LinkedBattleTransition(this);
    this.linkedBattleTransition.playBattleReveal(360);

    this._configureLinkedActionIdentity();
    this._configureLinkedNarrationPacing();
    this._configureLinkedResourcePreview();
    this._streamlineLinkedHUD();
  }

  layoutSceneText() {
    super.layoutSceneText();
    if (this.linkedMode) {
      if (this.titleText) this.titleText.setVisible(false);
      if (this.hintText) this.hintText.setVisible(false);
    }
  }

  _configureLinkedActionIdentity() {
    const action = this.linkedContext && this.linkedContext.action;
    if (!action || !this.battleConfig || !this.battleConfig.hero) return;

    const hero = this.battleConfig.hero;
    const actionName = action.displayName || hero.attack.name;
    hero.attack.name = actionName;

    if (action.kind !== 'attack') return;

    // 04C: ATTACK reuses the approved poses, but at a materially brisker
    // cadence than the full signature RESONART presentation.
    const authored = { ...DEFAULT_POSE_TIMING, ...(hero.attackTiming || {}) };
    hero.attackTiming = {
      ...authored,
      step: Math.max(150, Math.round(authored.step * 0.72)),
      gather: Math.max(220, Math.round(authored.gather * 0.52)),
      hold: Math.max(50, Math.round(authored.hold * 0.38)),
      release: Math.max(120, Math.round(authored.release * 0.76)),
      recover: Math.max(180, Math.round(authored.recover * 0.78))
    };

    // Signature technique prose belongs to RESONART, not a basic ATTACK.
    hero.attack.flavor = '';
  }

  _configureLinkedNarrationPacing() {
    const hud = this.hud;
    if (!hud) return;

    const hero = this.battleConfig.hero;
    const enemy = this.battleConfig.enemy;
    const action = this.linkedContext.action;
    const originalOpenTapGate = hud._openTapGate.bind(hud);

    // 04B: optional auto-advance exists only for explicitly recognized
    // linked cinematic beats. Damage/result narration remains tap-gated.
    hud.queueMessage = (text, onDone, options = null) => {
      if (!text) {
        if (onDone) onDone();
        return;
      }

      let autoAdvanceMs = options && Number.isFinite(options.autoAdvanceMs)
        ? Math.max(0, options.autoAdvanceMs)
        : null;

      if (autoAdvanceMs == null) {
        if (text === `${hero.name} uses ${hero.attack.name}!`) {
          autoAdvanceMs = 140;
        } else if (action.kind === 'resonart' && text === hero.attack.flavor) {
          const gather = (hero.attackTiming && hero.attackTiming.gather) || DEFAULT_POSE_TIMING.gather;
          autoAdvanceMs = Math.max(220, gather - 120);
        } else if (text === `${enemy.name} shatters! The veil clears...`) {
          autoAdvanceMs = 520;
        }
      }

      hud._queue.push({ text, onDone, autoAdvanceMs });
      if (!hud._showing) hud._nextMessage();
    };

    hud._openTapGate = item => {
      if (item && item.autoAdvanceMs != null) {
        hud._typingEvent = null;
        hud._waitingForTap = false;
        hud._pendingAdvance = null;
        hud.msgCursor.setVisible(false);
        this.time.delayedCall(item.autoAdvanceMs, () => {
          if (item.onDone) item.onDone();
          hud._nextMessage();
        });
        return;
      }
      originalOpenTapGate(item);
    };
  }

  _configureLinkedResourcePreview() {
    const hud = this.hud;
    if (!hud) return;

    const originalUpdateRp = hud.updateRp.bind(hud);
    hud.updateRp = (cur, max, instant) => {
      if (instant) return originalUpdateRp(cur, max, instant);

      // 04C: linked BP previews exactly Tactical's authorized delta instead
      // of BattleController's standalone prototype RP_DRAW animation.
      const delta = this.linkedContext
        && this.linkedContext.resolutionPlan
        && this.linkedContext.resolutionPlan.resourceDelta
        ? (this.linkedContext.resolutionPlan.resourceDelta.rp || 0)
        : 0;
      const base = this.linkedContext
        && this.linkedContext.tacticalSnapshot
        && this.linkedContext.tacticalSnapshot.heroRP != null
        ? this.linkedContext.tacticalSnapshot.heroRP
        : this.battleConfig.hero.rp;
      const authorized = Phaser.Math.Clamp(base + delta, 0, max);
      return originalUpdateRp(authorized, max, false);
    };
  }

  _streamlineLinkedHUD() {
    // 04E: linked BP is a cinematic chamber, not another command screen.
    if (this.titleText) this.titleText.setVisible(false);
    if (this.hintText) this.hintText.setVisible(false);

    // 05A (base VeilBattleScene) now never constructs CommandConsole in
    // linked mode at all — this used to build the full six-button console
    // every linked round just to destroy it a moment later. Nothing left
    // to clean up here.

    if (this.hud) {
      if (this.hud.bars && this.hud.bars.heroRp && this.hud.bars.heroRp.g) {
        this.hud.bars.heroRp.g.setVisible(false);
      }
      if (this.hud.rpText) this.hud.rpText.setVisible(false);
      if (this.hud.turnText) this.hud.turnText.setVisible(false);
      if (this.hud.attunementFacets) {
        this.hud.attunementFacets.forEach(f => f.setVisible(false));
      }
    }
  }

  // 04A: collapse BP through the same Veil seam before committing the
  // BattleResult and resuming the exact paused Tactical state.
  returnToTactical(battleResult) {
    if (!this.linkedMode || this._returningToTactical) return;
    this._returningToTactical = true;

    const finish = () => super.returnToTactical(battleResult);
    if (!this.linkedBattleTransition) {
      finish();
      return;
    }
    this.linkedBattleTransition.playReturn(300).then(finish);
  }
}
