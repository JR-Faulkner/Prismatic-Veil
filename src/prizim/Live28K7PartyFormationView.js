// LIVE28K7 formation shim.
// Preserve the approved K2/K6 formation, sizing, identity, and crown sequencing,
// but bind the K7 attack-FX adapter so Safari receives the halo correction.
import Live28K2PartyFormationView from './Live28K2PartyFormationView.js?v=live28k7-base';
import Live28K7DuoHybridSequenceDriver from './Live28K7DuoHybridSequenceDriver.js?v=live28k7-halo';

export default class Live28K7PartyFormationView extends Live28K2PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new Live28K7DuoHybridSequenceDriver(scene);
  }
}
