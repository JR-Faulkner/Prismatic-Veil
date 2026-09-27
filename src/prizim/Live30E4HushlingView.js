// LIVE30E4 — the first encounter has one Hushling, so it owns center stage.
// Multi-enemy spacing belongs to a future formation controller, not this
// single-enemy visual adapter.
import EnemyHushlingView from '../EnemyHushlingView.js?v=live30e4-base';

export default class Live30E4HushlingView extends EnemyHushlingView {
  layout() {
    super.layout();
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const landscape = width > height;

    // The first encounter has one Hushling. Keep it optically centered in the
    // open battlefield, with its full silhouette above the fixed party strip.
    // The base view's grounded 0.885h anchor works for a large Wraith, but the
    // Hushling is half that height; using the same floor line leaves almost all
    // of the smaller source image behind the HUD cards on wide screens.
    this.baseX = Math.round(width * 0.5);
    if (landscape) {
      const largeLandscape = width >= 1100 && height >= 600;
      this.baseY = Math.round(height * (largeLandscape ? 0.78 : 0.76));
    }
    this.container.setPosition(this.baseX, this.baseY);
  }
}
