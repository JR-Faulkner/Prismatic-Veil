// Tactical Field Foundation v2 — TacticalPathfinder.
// Calculates weighted reachable tiles and a deterministic shortest route.
// Orthogonal movement only, per the locked spec (no diagonals this pass).
// Deterministic: neighbors are always visited in the same fixed order
// (up, right, down, left), so two runs from the same start/budget/board
// state always produce the same reachable set and the same route.
const DIRS = Object.freeze([
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 }
]);

export default class TacticalPathfinder {
  constructor(grid, terrainRegistry) {
    this.grid = grid;
    this.terrain = terrainRegistry;
  }

  // Dijkstra over the weighted grid, bounded by moveBudget. `movingUnit` is
  // excluded from its own occupancy check so a unit's starting tile is
  // never treated as blocked against itself.
  reachable(startX, startY, moveBudget, movingUnit) {
    const dist = new Map();
    const from = new Map();
    const startKey = this.grid.key(startX, startY);
    dist.set(startKey, 0);

    const frontier = [{ x: startX, y: startY, cost: 0 }];
    while (frontier.length) {
      frontier.sort((a, b) => a.cost - b.cost);
      const cur = frontier.shift();
      const curKey = this.grid.key(cur.x, cur.y);
      if (cur.cost > dist.get(curKey)) continue;

      for (const d of DIRS) {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        if (!this.grid.inBounds(nx, ny)) continue;

        const terrainType = this.grid.terrainAt(nx, ny);
        if (!this.terrain.isWalkable(terrainType)) continue;
        if (this.grid.isOccupied(nx, ny, movingUnit)) continue;

        const stepCost = this.terrain.movementCost(terrainType);
        const nextCost = cur.cost + stepCost;
        if (nextCost > moveBudget) continue;

        const nKey = this.grid.key(nx, ny);
        if (!dist.has(nKey) || nextCost < dist.get(nKey)) {
          dist.set(nKey, nextCost);
          from.set(nKey, curKey);
          frontier.push({ x: nx, y: ny, cost: nextCost });
        }
      }
    }
    return { dist, from };
  }

  // Reconstructs the shortest path (inclusive of start and target) from a
  // reachable() result. Returns null if the target was never reached.
  routeTo(startX, startY, targetX, targetY, reachableResult) {
    const targetKey = this.grid.key(targetX, targetY);
    if (!reachableResult.dist.has(targetKey)) return null;

    const startKey = this.grid.key(startX, startY);
    const path = [{ x: targetX, y: targetY }];
    let curKey = targetKey;
    while (curKey !== startKey) {
      curKey = reachableResult.from.get(curKey);
      const [x, y] = curKey.split(',').map(Number);
      path.unshift({ x, y });
    }
    return path;
  }

  // Deterministic grid-line-of-sight check between two tiles (inclusive of
  // neither endpoint — a unit's own tile and the target's tile never block
  // their own line to each other). Standard integer Bresenham walk,
  // checking every intermediate cell it passes through — a single-path
  // raycast, not a two-cell-wide "supercover" line, so on a diagonal
  // crossing it samples one of the two adjacent cells, not both. That
  // matches how most tactics-grid LOS checks are done.
  //
  // Plain Bresenham is NOT symmetric on its own — run from (0,0) to (2,1)
  // and it visits a different intermediate cell than running from (2,1) to
  // (0,0), which would make a ranged unit's LOS check disagree with what
  // the target "should" see looking back (confirmed empirically before
  // shipping this, not assumed). Fixed by canonicalizing direction first:
  // always raycast from the lexicographically smaller endpoint to the
  // larger one, regardless of which was passed as "from" — so
  // hasLineOfSight(a, b) and hasLineOfSight(b, a) always compute the exact
  // same ray.
  hasLineOfSight(fromX, fromY, toX, toY) {
    let x0 = fromX, y0 = fromY, x1 = toX, y1 = toY;
    if (x0 > x1 || (x0 === x1 && y0 > y1)) {
      [x0, x1] = [x1, x0];
      [y0, y1] = [y1, y0];
    }

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (x0 !== x1 || y0 !== y1) {
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
      if (x0 === x1 && y0 === y1) break;
      const terrainType = this.grid.terrainAt(x0, y0);
      if (this.terrain.blocksLineOfSight(terrainType)) return false;
    }
    return true;
  }
}
