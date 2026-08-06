// Tactical Field Foundation v2 — TerrainRegistry.
// Returns movement cost, walkability, line-of-sight blocking, and display
// key for a terrain type. Pure lookup — no grid state, no rendering.
export default class TerrainRegistry {
  constructor(data) {
    this.data = data;
  }

  get(type) {
    return this.data[type] || this.data.open;
  }

  movementCost(type) {
    return this.get(type).movementCost;
  }

  isWalkable(type) {
    return !!this.get(type).walkable;
  }

  blocksLineOfSight(type) {
    return !!this.get(type).blocksLineOfSight;
  }

  displayKey(type) {
    return this.get(type).productionAsset;
  }
}
