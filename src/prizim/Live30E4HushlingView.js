// LIVE30E4 — the first encounter has one Hushling, so it owns the enemy lane.
// Multi-enemy spacing belongs to a future formation controller, not this
// single-enemy visual adapter.
import EnemyHushlingView from '../EnemyHushlingView.js?v=live31i-base';

export default class Live30E4HushlingView extends EnemyHushlingView {
  layout() {
    super.layout();
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const landscape = width > height;

    // One Hushling owns one stable enemy lane. Keep its anchor independent of
    // the old large/small-landscape split so the silhouette does not jump
    // between two nearby positions when the browser or TV crosses a breakpoint.
    if (landscape) {
      this.baseX = Math.round(width * 0.76);
      this.baseY = Math.round(height * 0.80);
    } else {
      // Portrait keeps the same enemy-side reading and grounds the feet near
      // the party baseline instead of inheriting the old height-minus-264px
      // anchor, which floated the Hushling on tall phones.
      this.baseX = Math.round(width * 0.78);
      this.baseY = Math.round(height * 0.78);
    }
    this.container.setPosition(this.baseX, this.baseY);
  }
}
