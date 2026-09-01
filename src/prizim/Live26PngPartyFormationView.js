// LIVE26 PNG-only formation bridge.
// Keeps live25 formation/crown alignment and swaps Auryi to normal repo-served PNG FX.
import Live25PartyFormationView from './Live25PartyFormationView.js?v=live25';
import Live26PngDuoHybridSequenceDriver from './Live26PngDuoHybridSequenceDriver.js?v=live26png1';

export default class Live26PngPartyFormationView extends Live25PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new Live26PngDuoHybridSequenceDriver(scene);
  }
}
