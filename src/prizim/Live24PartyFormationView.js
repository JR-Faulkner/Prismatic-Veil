// LIVE24 Auryi formation adapter.
// Live23 base state/scale/anchors stay authoritative; only the cinematic FX
// renderer is replaced with the corrected screen-space implementation.
import Live23PartyFormationView from './Live23PartyFormationView.js?v=live23';
import Live24DuoHybridSequenceDriver from './Live24DuoHybridSequenceDriver.js?v=live24';

export default class Live24PartyFormationView extends Live23PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new Live24DuoHybridSequenceDriver(scene);
  }
}
