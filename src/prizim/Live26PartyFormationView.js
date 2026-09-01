// LIVE26 formation bridge.
// Keeps live25 formation/crown alignment while swapping in the production
// Auryi FX sequence driver.
import Live25PartyFormationView from './Live25PartyFormationView.js?v=live25';
import Live26DuoHybridSequenceDriver from './Live26DuoHybridSequenceDriver.js?v=live26f';

export default class Live26PartyFormationView extends Live25PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new Live26DuoHybridSequenceDriver(scene);
  }
}
