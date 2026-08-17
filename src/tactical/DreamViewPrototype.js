// Dream View Production Prototype 01
//
// Opt-in visual QA mode for proving that the ACTUAL approved Prismel tactical
// asset can live inside the existing Too Quiet backyard without any AI redraw.
//
// Activate with:
//   tactical-field-v2.html?dreamview=prismel
//
// Normal gameplay is untouched when the query parameter is absent.
export default class DreamViewPrototype {
  constructor(scene) {
    this.scene = scene;
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('dreamview') === 'prismel';
  }

  apply() {
    if (!this.isEnabled()) return false;

    const s = this.scene;
    const prismel = s.heroes.find(h => h.id === 'prismel');
    if (!prismel || !prismel.sprite) return false;

    // Prototype 01 asks one question only:
    // "Does the real Prismel asset visually belong in this backyard?"
    // Hide every other combatant rather than inventing or re-rendering them.
    s.heroes.forEach(h => h.sprite.setVisible(h.id === 'prismel'));
    s.enemies.forEach(e => e.sprite.setVisible(false));

    // Node markers are runtime objective language, not part of this visual test.
    (s.nodeMarkers || []).forEach(marker => {
      if (marker && marker.setVisible) marker.setVisible(false);
      else if (marker && marker.container && marker.container.setVisible) marker.container.setVisible(false);
    });

    // Remove HUD/chrome from the screenshot test while leaving all objects
    // alive. This is intentionally presentation-only and reversible by reload.
    [
      s.phaseFrame, s.turnText, s.goalFrame, s.goalPrimaryText,
      s.goalSecondaryText, s.messageText, s.heroCardsDrawer
    ].forEach(o => { if (o && o.setVisible) o.setVisible(false); });

    if (s.hudHandle && s.hudHandle.container) s.hudHandle.container.setVisible(false);
    if (s.actionMenu && s.actionMenu.container) s.actionMenu.container.setVisible(false);
    if (s.zoomControls && s.zoomControls.container) s.zoomControls.container.setVisible(false);

    // The shipped map icon is already a preprocessed version of Prismel's
    // approved six-frame tactical movement art. Scale the CONTAINER, never the
    // source texture, so image/outline/contact-shadow remain registered.
    prismel.sprite.setScale(1.34);

    // A restrained world-space grounding pool. It is deliberately neutral,
    // not a selection ring or magical node marker.
    const p = s.grid.toScreen(prismel.x, prismel.y);
    const grounding = s.add.ellipse(
      p.x, p.y - 2, 82, 18, 0x05060a, 0.42
    ).setDepth(prismel.sprite.depth - 0.02);
    s.worldAdd(grounding);
    this.grounding = grounding;

    // Dream-view framing: slightly closer than normal Tactical, still wide
    // enough to read the backyard around Prismel. The camera remains the real
    // TacticalCamera, not a second renderer.
    const landscape = s.scale.width > s.scale.height;
    const compact = s.scale.width < 720 || s.scale.height < 500;
    const targetZoom = landscape
      ? (compact ? 0.98 : 1.08)
      : (compact ? 0.74 : 0.82);

    s.tacticalCamera.computeBounds(190);
    s.tacticalCamera.setZoom(targetZoom);

    const cam = s.cameras.main;
    const focus = s.grid.toScreen(prismel.x + 1, Math.max(0, prismel.y - 1));
    cam.setScroll(
      focus.x - s.scale.width / (2 * cam.zoom),
      focus.y - s.scale.height / (2 * cam.zoom)
    );
    s.tacticalCamera.clamp();

    // Freeze interaction for a clean visual-composition test.
    s.inputLocked = true;

    return true;
  }
}
