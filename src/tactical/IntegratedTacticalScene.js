// Integrated Tactical Presentation Stack — 03A + 04A + 04D
//
// Compatibility wrapper over the validated experimental TacticalScene.
// Keeps the gameplay/state authority in TacticalScene.js untouched while
// layering the new encounter HUD, linked battle transition, and fast enemy
// attack presentation on top.
import TacticalScene from './TacticalScene.js?v=80';
import TacticalEncounterHUD from './TacticalEncounterHUD.js?v=1';
import EnemyAttackCinematic from './EnemyAttackCinematic.js?v=1';
import LinkedBattleTransition from '../LinkedBattleTransition.js?v=1';
import ActiveTurnBattleSlice, { PRISMEL_READY_FRAMES, PRISMEL_ATTACK_FRAMES } from './ActiveTurnBattleSlice.js?v=3';

const HERO_HIT_SFX_KEY = Object.freeze({
  prismel: 'sfx_impact',
  kineza: 'kineza_impact',
  auryi: 'auryi_impact'
});

export default class IntegratedTacticalScene extends TacticalScene {
  preload() {
    super.preload();
    [...PRISMEL_READY_FRAMES, ...PRISMEL_ATTACK_FRAMES].forEach(key => {
      this.load.image(key, `./assets/poses/prismel_active_turn/${key}.png`);
    });
  }

  create() {
    super.create();

    this.linkedBattleTransition = new LinkedBattleTransition(this);
    this.enemyCinematic = new EnemyAttackCinematic(this);
    // 05E: gated behind its own battleslice=1 param (never dreamview=,
    // since that namespace is a project-wide guarantee of zero state
    // mutation this deliberately breaks). Absent the param, shouldIntercept()
    // is always false and enterLinkedBattle() below runs byte-for-byte as
    // it already did.
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice(this);

    // 03A: replace the old centered Goal plate visually without rewriting
    // TacticalScene's proven HUD construction. Hidden legacy objects stay
    // alive so no existing references break.
    [this.goalFrame, this.goalPrimaryText, this.goalSecondaryText]
      .filter(Boolean)
      .forEach(obj => obj.setVisible(false));

    this.encounterHUD = new TacticalEncounterHUD(this, this.nodes, this.enemies).create();
    this.uiAdd(this.encounterHUD.container);

    // Super.create() already performed its first layout/refresh before the
    // encounter HUD existed. Run them once more now that the layer is ready.
    this.layoutHUD();
    this.refreshHUD();
  }

  layoutHUD() {
    super.layoutHUD();
    if (!this.encounterHUD) return;

    [this.goalFrame, this.goalPrimaryText, this.goalSecondaryText]
      .filter(Boolean)
      .forEach(obj => obj.setVisible(false));

    const w = this.scale.width;
    const h = this.scale.height;
    const compact = w < 560 || h < 520;
    const margin = compact ? 10 : 16;
    const headerW = Math.min(w - margin * 2, 480);
    const phaseFrameH = this.phaseFrame ? this.phaseFrame.displayHeight : Math.round(headerW * (100 / 555));
    const encounterTop = margin + phaseFrameH + 7;

    const encounterBottom = this.encounterHUD.layout(w, h, {
      margin,
      topY: encounterTop,
      compact
    });

    const narrow = w < 620;
    const messageY = narrow ? encounterBottom + 5 : encounterTop;
    const messageW = narrow ? w * 0.86 : Math.min(300, w * 0.34);
    this.messageText.setPosition(w / 2, messageY).setWordWrapWidth(messageW);

    // Re-anchor the collapsible hero drawer to the new narration position.
    // Zoom/action controls remain exactly where super.layoutHUD() put them.
    // In landscape/desktop the drawer opens in the same left-hand column as
    // the objective panel (both anchored at x=margin) while messageText
    // itself sits centered at w/2 — so anchoring the drawer purely off
    // messageY there let it open directly on top of the objective panel's
    // own footprint (confirmed: at 1280x800 the panel runs to y=267 while
    // messageY+40 lands at 150). The drawer only needs to clear whichever
    // is taller: the narration gap, or the objective panel it shares a
    // column with.
    const cardW = headerW;
    const objectiveBottom = (!narrow && this.encounterHUD.objective)
      ? encounterTop + this.encounterHUD.objective.height + 10
      : 0;
    const stackTop = Math.max(messageY + (compact ? 34 : 40), objectiveBottom);
    let cardY = stackTop;
    this.heroCards.forEach(card => {
      this._layoutHeroCard(card, cardW);
      card.container.setPosition(margin, cardY);
      cardY += card.cardH + 6;
    });
    this._hudDrawerHiddenOffset = margin + cardW;
    this.hudHandle.container.setPosition(0, (stackTop + cardY - 6) / 2);
    if (!this._hudDrawerInit || !this.tweens.isTweening(this.heroCardsDrawer)) {
      this.heroCardsDrawer.x = this.hudExpanded ? 0 : -this._hudDrawerHiddenOffset;
      this._hudDrawerInit = true;
    }
  }

  refreshHUD() {
    super.refreshHUD();
    if (this.encounterHUD) this.encounterHUD.refresh();
  }

  // 04A: form the Veil fracture over the still-live Tactical battlefield,
  // then let the validated base bridge pause/hide Tactical and launch BP.
  async enterLinkedBattle(hero, target, actionKind) {
    // 05E: Prismel-vs-Hushling test slice intercepts here, before any of
    // the real bridge's own work starts — same entry point tryAttack()
    // already validated range/LOS through, so nothing about selection or
    // targeting needs to be re-checked. Everything below this branch is
    // completely unreached when the slice doesn't apply, which is the
    // normal case for every real player and every other Dream View pass.
    if (this.activeTurnBattleSlice && this.activeTurnBattleSlice.shouldIntercept(hero, target)) {
      await this.activeTurnBattleSlice.run(hero, target);
      return;
    }

    const oldAbility = hero.ability;
    if (actionKind === 'attack') hero.ability = hero.basicAttackName || 'Attack';

    try {
      if (this.linkedBattleTransition) {
        await this.linkedBattleTransition.playEnter(320);
      }
      super.enterLinkedBattle(hero, target, actionKind);
    } finally {
      hero.ability = oldAbility;
      if (this.linkedBattleTransition) this.linkedBattleTransition.clear();
    }
  }

  // 04D: enemy attacks stay Tactical-owned but use differentiated, automatic
  // presentation profiles so an enemy phase never becomes a tap marathon.
  async enemyAttack(enemy, hero) {
    this.grid.clearAllOverlays();
    this.tacticalCamera.saveCinematicState();
    this.tacticalCamera.focusOn(
      Math.round((enemy.x + hero.x) / 2),
      Math.round((enemy.y + hero.y) / 2),
      160
    );

    await this.wait(enemy.type === 'veil_wraith' ? 170 : 110);
    await this.enemyCinematic.play({
      enemyType: enemy.type,
      attackerKey: enemy.portraitKey,
      attackerName: enemy.name,
      targetKey: hero.portraitKey,
      targetName: hero.name,
      abilityName: enemy.ability,
      flavor: '',
      onImpact: () => {
        hero.hp = Math.max(0, hero.hp - enemy.atk);
        const msg = `${hero.name} suffers ${enemy.atk} damage!`;
        this.setMessage(msg);

        const key = HERO_HIT_SFX_KEY[hero.id];
        if (key) {
          const sfx = this.sound.get(key) || this.sound.add(key, { volume: 0.9 });
          sfx.play();
        }
        if (hero.hp <= 0) this.defeatHero(hero);
        return msg;
      }
    });

    this.floatDamage(hero, enemy.atk, false);
    await this.tacticalCamera.restoreCinematicState(220);
    this.refreshHUD();
    this.checkVictoryDefeat();
  }
}
