// 06B — Tactical View Flavor Audition.
// Keeps the proven tactical rules while auditioning presentation on phone.
// 06B inherits the current 06A three-hero canon active-turn stack.

import IntegratedTacticalScene06A from './IntegratedTacticalScene06A.js?v=8';

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

  _applyFlavorProjection06B(key,{announce=true,refocus=true}={}){
    const cfg=FLAVORS[key]||FLAVORS.shallow;
    this._viewFlavorKey06B=key;
    this._viewFlavor06B=cfg;
    if(this.grid){
      this.grid.tileHalfW=cfg.halfW;
      this.grid.tileHalfH=cfg.halfH;
      if(this.grid.rebuildVisuals)this.grid.rebuildVisuals();
    }
    if(this.tacticalCamera){
      this.tacticalCamera.setZoom(this._flavorZoom06B(cfg));
      if(refocus)this.tacticalCamera.focusOn(8.7,6.2,0);
    }
    if(announce&&this.setMessage)this.setMessage(`06B • ${cfg.label}`);
  }

  create(){
    super.create();
    const key=this._readFlavor06B();
    this._applyFlavorProjection06B(key,{announce:false,refocus:false});
    this.time.delayedCall(180,()=>{
      this._applyFlavorProjection06B(key,{announce:true,refocus:true});
      this.refreshHUD();
    });
  }
}
