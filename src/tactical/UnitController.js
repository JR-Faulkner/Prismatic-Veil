// Tactical Field Foundation v2 — UnitController.
// Owns selection, movement state, action completion, occupancy updates,
// and path animation. Does not decide turn order or AI — TacticalScene
// drives when a unit gets to act; this module carries out the act.
export default class UnitController {
  constructor(scene, grid, pathfinder) {
    this.scene = scene;
    this.grid = grid;
    this.pathfinder = pathfinder;
    this.selected = null;
    this.reachable = null;
    this.previewPath = null;
  }

  select(unit) {
    this.selected = unit;
    this.previewPath = null;
    if (unit.moved) {
      this.reachable = null;
      this.grid.clearAllOverlays();
      return;
    }
    this.reachable = this.pathfinder.reachable(unit.x, unit.y, unit.move, unit);
    this.grid.showReachable(this.reachable.dist);
  }

  clearSelection() {
    this.selected = null;
    this.reachable = null;
    this.previewPath = null;
    this.grid.clearAllOverlays();
  }

  // Returns the previewed route (or null if the tile isn't reachable) and
  // draws it. Doesn't move anything — that's confirmMove()'s job, kept
  // separate so a tap can preview before a second tap commits, matching
  // the spec's "preview route → move or remain in place" turn sequence.
  previewRouteTo(x, y) {
    if (!this.selected || !this.reachable) { this.previewPath = null; return null; }
    this.previewPath = this.pathfinder.routeTo(this.selected.x, this.selected.y, x, y, this.reachable);
    this.grid.showPath(this.previewPath);
    return this.previewPath;
  }

  remainingBudget(x, y) {
    if (!this.reachable) return 0;
    const cost = this.reachable.dist.get(this.grid.key(x, y));
    return cost === undefined ? null : this.selected.move - cost;
  }

  // Animates the unit tile-by-tile along `path` (path[0] is the unit's
  // current tile). Occupancy is cleared at the start and re-claimed only
  // once the unit reaches its final tile, so mid-move it doesn't block its
  // own old or new tile against a concurrent query.
  // `unit.onStep(from, to)` and `unit.onMoveEnd()` are optional hooks a
  // unit can implement for its own presentation (walk-frame cycling,
  // facing flips) without this controller knowing anything character-
  // specific — same generic-interface pattern as the enemy views.
  animateMove(unit, path, stepMs) {
    return new Promise(resolve => {
      if (!path || path.length < 2) { resolve(); return; }
      this.grid.clearOccupant(unit.x, unit.y);

      let i = 1;
      const step = () => {
        if (i >= path.length) {
          this.grid.setOccupant(unit.x, unit.y, unit);
          if (unit.onMoveEnd) unit.onMoveEnd();
          resolve();
          return;
        }
        const tile = path[i];
        if (unit.onStep) unit.onStep({ x: unit.x, y: unit.y }, tile);
        const screen = this.grid.toScreen(tile.x, tile.y);
        this.scene.tweens.add({
          targets: unit.sprite,
          x: screen.x,
          y: screen.y - (unit.spriteYOffset || 0),
          duration: stepMs,
          ease: 'Linear',
          onComplete: () => {
            unit.x = tile.x;
            unit.y = tile.y;
            i++;
            step();
          }
        });
      };
      step();
    });
  }

  markMoved(unit) {
    unit.moved = true;
  }

  markActed(unit) {
    unit.acted = true;
    unit.moved = true;
  }

  resetForNewTurn(units) {
    units.forEach(u => {
      u.moved = false;
      u.acted = false;
    });
  }
}
