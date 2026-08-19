// 05M.1 — PriZim transition-cleanup pass.
// Preserves all 05M registration/timing. Only the attack-frame blend policy changes.
// Goal: remove the double-image wobble seen in phone QA without freezing authored pose motion.

import ActiveTurnBattleSlice05M from './ActiveTurnBattleSlice05M.js?v=1';
import { PRISMEL_ATTACK_FRAMES } from './ActiveTurnBattleSlice.js?v=3';
import {
  PRISMEL_05M1_BLEND_MS,
  PRISMEL_05M1_DEFAULT_BLEND_MS,
  PRISMEL_05M1_MIN_VISIBLE_HOLD_MS
} from '../generated/prismelActiveTurn05M1Transition.js?v=1';

const ATTACK_SET = new Set(PRISMEL_ATTACK_FRAMES);

export default class ActiveTurnBattleSlice05M1 extends ActiveTurnBattleSlice05M {
  async _cycleFrames(frameKeys, frameMs) {
    if (!frameKeys || !frameKeys.some(key => ATTACK_SET.has(key))) {
      return super._cycleFrames(frameKeys, frameMs);
    }

    const img = this._ensureCutin();
    const ghost = this._cutinGhost;

    for (const key of frameKeys) {
      if (!img || !img.active) return;

      const holdMs = Math.max(PRISMEL_05M1_MIN_VISIBLE_HOLD_MS, frameMs || 0);
      if (img.texture.key === key) {
        this._layoutCutin();
        await this._delay(holdMs);
        continue;
      }

      const blendMs = PRISMEL_05M1_BLEND_MS[key] ?? PRISMEL_05M1_DEFAULT_BLEND_MS;

      // Kill any unfinished alpha blend from the previous pose so a stale ghost
      // cannot survive into the next authored silhouette.
      this.scene.tweens.killTweensOf(img);
      if (ghost) this.scene.tweens.killTweensOf(ghost);

      if (!ghost || !ghost.active || blendMs <= 0) {
        if (ghost && ghost.active) ghost.setAlpha(0);
        img.setTexture(key).setAlpha(1);
        this._heroLayerLayout(img);
        await this._delay(holdMs);
        continue;
      }

      ghost.setTexture(img.texture.key).setAlpha(1);
      this._heroLayerLayout(ghost);
      img.setTexture(key).setAlpha(0);
      this._heroLayerLayout(img);

      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: blendMs,
        ease: 'Linear'
      });
      this.scene.tweens.add({
        targets: img,
        alpha: 1,
        duration: blendMs,
        ease: 'Linear'
      });

      await this._delay(Math.max(holdMs, blendMs + 14));
      ghost.setAlpha(0);
      img.setAlpha(1);
    }
  }
}
