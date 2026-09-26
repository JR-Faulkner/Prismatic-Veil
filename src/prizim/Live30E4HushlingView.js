// LIVE30E4 — the first encounter has one Hushling, so it owns center stage.
// Multi-enemy spacing belongs to a future formation controller, not this
// single-enemy visual adapter.
import EnemyHushlingView from '../EnemyHushlingView.js?v=live30e4-base';

export default class Live30E4HushlingView extends EnemyHushlingView {
  layout() {
    super.layout();
    this.baseX = Math.round(this.scene.scale.width * 0.5);
    this.container.setPosition(this.baseX, this.baseY);
  }
}
