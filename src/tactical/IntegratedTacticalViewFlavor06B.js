// 06B — Tactical View Flavor Audition.
// Keeps the proven tactical rules while auditioning presentation on phone.
// 06B now inherits the current 06A active-turn stack so RUN BATTLE does not
// fall through to the legacy Battle Presentation scene.

import IntegratedTacticalScene06A from './IntegratedTacticalScene06A.js?v=11';

const FLAVORS = Object.freeze({
  classic: Object.freeze({ label:'CLASSIC ISO', halfW:34, halfH:17, landscapeZoom:0.95, portraitZoom:0.68, focusPush:0 }),
  shallow: Object.freeze({ label:'SHALLOW ISO', halfW:34, halfH:13, landscapeZoom:1.02, portraitZoom:0.76, focusPush:0 }),
  hybrid: Object.freeze({ label:'HYBRID FOCUS', halfW:36, halfH:13.5, landscapeZoom:1.00, portraitZoom:0.75, focusPush:0.11 })
});

export default class IntegratedTacticalViewFlavor06B extends IntegratedTacticalScene06A {
  constructor(){
    super();
    this._viewFlavor06B=FLAVORS.shallow;
    this._viewFlavorKey06B='shallow';
  }

  _readFlavor06B(){
    if(typeof window==='undefined') return 'shallow';
    const raw=new URLSearchParams(window.location.search).get('flavor')||'shallow';
    return Object.prototype.hasOwnProperty.call(FLAVORS,raw)?raw:'shallow';
  }

  _flavorZoom06B(cfg=this._viewFlavor06B){
    return this.scale.width>this.scale.height?cfg.landscapeZoom:cfg.portraitZoom;
  }

  defaultZoomFor(w,h){
    const cfg=this._viewFlavor06B||FLAVORS.shallow;
    return w>h?cfg.landscapeZoom:cfg.portraitZoom;
  }

  _refreshProjection06B(){
    const cfg=this._viewFlavor06B;
    this.grid.setOrigin(0,0,cfg.halfW,cfg.halfH);
    this.grid.clearAllOverlays();
    if(this.environment&&typeof this.environment._clearArt==='function') this.environment._clearArt();
    this.heroes.forEach(u=>this._placeUnitSprite(u));
    this.enemies.forEach(u=>this._placeUnitSprite(u));
    this.drawBoard();
    this.drawNodes();
    this.tacticalCamera.computeBounds(220);
    this.tacticalCamera.defaultZoom=this._flavorZoom06B(cfg);
    this.tacticalCamera.setZoom(this._flavorZoom06B(cfg));
    this.tacticalCamera.focusOn(8.7,6.2,0);
    this.refreshHUD();
    this.setMessage(`06B VIEW • ${cfg.label} • 06A ACTIVE TURN`);
  }

  selectHero(hero){
    super.selectHero(hero);
    if(!hero||this._viewFlavorKey06B!=='hybrid') return;
    const base=this._flavorZoom06B();
    this.cameras.main.zoomTo(Math.min(1.35,base+this._viewFlavor06B.focusPush),230,'Sine.easeOut',true);
    this.tacticalCamera.focusOn(hero.x,hero.y,230);
  }

  create(){
    this._viewFlavorKey06B=this._readFlavor06B();
    this._viewFlavor06B=FLAVORS[this._viewFlavorKey06B];
    super.create();
    this.time.delayedCall(180,()=>this._refreshProjection06B());
  }
}
