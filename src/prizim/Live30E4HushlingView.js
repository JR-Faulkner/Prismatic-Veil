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

    // One Hushling still owns a single enemy lane, but "center screen" is not
    // the same thing as "enemy space": Kineza's live formation sits near 0.54w,
    // so a 0.50w Hushling overlaps the party on TVs and wide browsers.
    // Keep the smaller enemy clearly across the field and slightly raised so
    // its full silhouette reads above the fixed party/status strip.
    if (landscape) {
      const largeLandscape = width >= 1100 && height >= 600;
      this.baseX = Math.round(width * (largeLandscape ? 0.72 : 0.70));
      this.baseY = Math.round(height * (largeLandscape ? 0.71 : 0.73));
    }
    this.container.setPosition(this.baseX, this.baseY);
  }
}
