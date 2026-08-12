// Tactical Field Foundation v2 — UnitController.
// Too Quiet Cinematic Batch 01 adds presentation-only depth sorting hooks.
// Movement rules, pathing, occupancy, and action state are unchanged.
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

  animateMove(unit, path, stepMs) {
    return new Promise(resolve => {
      if (!path || path.length < 2) { resolve(); return; }
      this.grid.clearOccupant(unit.x, unit.y);

      let i = 1;
      const step = () => {
        if (i >= path.length) {
          this.grid.setOccupant(unit.x, unit.y, unit);
          if (unit.onMoveEnd) unit.onMoveEnd();
          if (this.scene.syncUnitDepth) this.scene.syncUnitDepth(unit);
          resolve();
          return;
        }

        const tile = path[i];
        if (unit.onStep) unit.onStep({ x: unit.x, y: unit.y }, tile);
        const screen = this.grid.toScreen(tile.x, tile.y);

        // Depth is presentation only. Sorting to the destination y before
        // each tile tween prevents front/back overlaps from reading flat
        // while preserving the exact movement route and timing.
        if (this.scene.syncUnitDepth) {
          this.scene.syncUnitDepth(unit, screen.y);
        }

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
