// Too Quiet Victory / Objective Resolution — Prototype 06
//
// Opt-in presentation-only QA for the encounter's intended objective victory:
// restore all three Sound Nodes -> Veil loosens -> enemies destabilize ->
// ordinary backyard sound/space returns -> encounter resolves.
//
// IMPORTANT: this does not set node.restored, kill enemies, advance turns,
// award XP, or invoke the production victory state.
//
// Activate:
//   tactical-field-v2.html?dreamview=victory
//
// Optional:
//   hud=0|1
//   labels=0|1
//   repeat=0|1
export default class TooQuietVictoryPrototype {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.timers = [];
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('dreamview') === 'victory';
  }

  _bool(p,key,fallback) {
    const raw=p.get(key);
    if(raw===null) return fallback;
    return !['0','false','off'].includes(raw.toLowerCase());
  }

  _track(o) { if(o) this.objects.push(o); return o; }

  _hideHud() {
    const s=this.scene;
    [s.phaseFrame,s.turnText,s.goalFrame,s.goalPrimaryText,
     s.goalSecondaryText,s.messageText,s.heroCardsDrawer]
      .forEach(o=>{ if(o?.setVisible) o.setVisible(false); });
    if(s.hudHandle?.container) s.hudHandle.container.setVisible(false);
    if(s.actionMenu?.container) s.actionMenu.container.setVisible(false);
    if(s.zoomControls?.container) s.zoomControls.container.setVisible(false);
  }

  _label() {
    const s=this.scene;
    const t=s.add.text(10,10,
      'TOO QUIET — OBJECTIVE VICTORY QA\n3/3 Sound Nodes restored\npresentation-only; state unchanged',
      {fontFamily:'monospace',fontSize:'12px',color:'#f7e8b6',
       backgroundColor:'#090a14',padding:{x:8,y:8},lineSpacing:3}
    ).setDepth(9999).setScrollFactor(0);
    s.uiAdd(t); this._track(t);
  }

  _nodePulse(node, delay) {
    const s=this.scene;
    const p=s.grid.toScreen(node.x,node.y);
    const ring=this._track(
      s.add.ellipse(p.x,p.y,24,8,0,0)
       .setStrokeStyle(1.6,0xffe8a0,.82).setDepth(8.2)
    );
    s.worldAdd(ring);
    ring.setAlpha(0);
    this.timers.push(s.time.delayedCall(delay,()=>{
      ring.setAlpha(1);
      s.tweens.add({
        targets:ring,scaleX:3.5,scaleY:2.7,alpha:0,
        duration:650,ease:'Cubic.easeOut'
      });
    }));
  }

  _linkNodes(delay) {
    const s=this.scene;
    const pts=s.nodes.map(n=>s.grid.toScreen(n.x,n.y));
    const g=this._track(s.add.graphics().setDepth(7.85));
    s.worldAdd(g);
    g.setAlpha(0);
    this.timers.push(s.time.delayedCall(delay,()=>{
      g.setAlpha(1);
      g.lineStyle(1.1,0xc8a8ff,.34);
      g.beginPath();
      g.moveTo(pts[0].x,pts[0].y);
      g.lineTo(pts[1].x,pts[1].y);
      g.lineTo(pts[2].x,pts[2].y);
      g.strokePath();
      s.tweens.add({targets:g,alpha:0,duration:780,delay:220,ease:'Sine.easeOut'});
    }));
  }

  _enemyDestabilize(delay) {
    const s=this.scene;
    this.timers.push(s.time.delayedCall(delay,()=>{
      s.enemies.filter(e=>e.alive&&e.sprite).forEach((e,i)=>{
        const spr=e.sprite;
        const originalX=spr.x;
        s.tweens.add({
          targets:spr,
          x:{from:originalX-2,to:originalX+2},
          alpha:{from:1,to:.38},
          duration:85,
          yoyo:true,
          repeat:5+i,
          ease:'Sine.easeInOut',
          onComplete:()=>{
            s.tweens.add({
              targets:spr,alpha:.12,scaleX:spr.scaleX*.92,scaleY:spr.scaleY*1.06,
              duration:420,ease:'Cubic.easeIn'
            });
          }
        });
      });
    }));
  }

  _veilRelease(delay) {
    const s=this.scene;
    const center=s.grid.toScreen(6,5);
    const veil=this._track(
      s.add.ellipse(center.x,center.y,360,180,0x7447cc,.11)
       .setDepth(7.45).setBlendMode(Phaser.BlendModes.ADD)
    );
    s.worldAdd(veil);
    veil.setAlpha(0);
    this.timers.push(s.time.delayedCall(delay,()=>{
      veil.setAlpha(.11);
      s.tweens.add({
        targets:veil,scaleX:.18,scaleY:.18,alpha:0,
        duration:1150,ease:'Sine.easeInOut'
      });
    }));
  }

  _ordinaryWorldReturns(delay) {
    const s=this.scene;
    const center=s.grid.toScreen(6,5);
    const g=this._track(s.add.graphics().setDepth(7.9));
    s.worldAdd(g);
    g.setAlpha(0);

    this.timers.push(s.time.delayedCall(delay,()=>{
      g.setAlpha(1);

      // Three tiny motifs echo the objectives without becoming UI icons.
      // Dog/fence vibration.
      const dog=s.grid.toScreen(2,2);
      g.lineStyle(1.1,0xffe8a0,.48);
      for(let i=0;i<2;i++){
        g.beginPath(); g.arc(dog.x-4,dog.y-6,10+i*6,-.7,.7,false); g.strokePath();
      }

      // Pool water motion.
      const pool=s.grid.toScreen(2,9);
      g.lineStyle(1.1,0xbfeaff,.50);
      g.strokeEllipse(pool.x,pool.y+1,46,12);
      g.strokeEllipse(pool.x,pool.y+1,66,17);

      // Patio/laughter harmonics.
      const laugh=s.grid.toScreen(9,8);
      g.lineStyle(1.1,0xffe8a0,.44);
      for(let i=0;i<2;i++){
        g.beginPath();
        g.arc(laugh.x,laugh.y-5,10+i*7,Math.PI*1.08,Math.PI*1.82,false);
        g.strokePath();
      }

      // One restrained yard-wide exhale.
      g.lineStyle(1.3,0xfff3c8,.22);
      g.strokeEllipse(center.x,center.y,250,92);

      s.tweens.add({targets:g,alpha:0,duration:1250,delay:500,ease:'Sine.easeOut'});
    }));
  }

  _victoryText(delay) {
    const s=this.scene;
    const title=this._track(
      s.add.text(s.scale.width/2,s.scale.height*.20,'RESONANCE RESTORED',{
        fontFamily:'Georgia, serif',fontSize:'22px',color:'#fff1bd',
        stroke:'#251a3d',strokeThickness:4,align:'center'
      }).setOrigin(.5).setDepth(10000).setScrollFactor(0).setAlpha(0)
    );
    const sub=this._track(
      s.add.text(s.scale.width/2,s.scale.height*.20+30,
        'The backyard remembers its sound.',{
        fontFamily:'Georgia, serif',fontSize:'13px',color:'#d9d2e8',
        stroke:'#15131d',strokeThickness:3,align:'center'
      }).setOrigin(.5).setDepth(10000).setScrollFactor(0).setAlpha(0)
    );
    s.uiAdd(title); s.uiAdd(sub);

    this.timers.push(s.time.delayedCall(delay,()=>{
      s.tweens.add({targets:[title,sub],alpha:1,y:'-=4',duration:420,ease:'Cubic.easeOut'});
      s.tweens.add({targets:[title,sub],alpha:0,duration:500,delay:1800,ease:'Sine.easeIn'});
    }));
  }

  _heroSettle(delay) {
    const s=this.scene;
    this.timers.push(s.time.delayedCall(delay,()=>{
      s.heroes.filter(h=>h.alive&&h.sprite).forEach((h,i)=>{
        const y=h.sprite.y;
        s.tweens.add({
          targets:h.sprite,y:y-3,duration:180+i*25,yoyo:true,
          ease:'Sine.easeOut'
        });
      });
    }));
  }

  _run() {
    const s=this.scene;

    // 0.0–0.8s: third restoration cascades across all three nodes.
    s.nodes.forEach((n,i)=>this._nodePulse(n,i*160));
    this._linkNodes(430);

    // 0.8–2.0s: enemy hold on reality breaks while Veil retracts.
    this._enemyDestabilize(820);
    this._veilRelease(900);

    // 1.6–3.0s: ordinary environmental sound-language returns.
    this._ordinaryWorldReturns(1550);
    this._heroSettle(1900);

    // 2.1s: concise objective resolution.
    this._victoryText(2100);
  }

  apply() {
    if(!this.isEnabled()) return false;

    const s=this.scene;
    const p=new URLSearchParams(window.location.search);
    const hud=this._bool(p,'hud',false);
    const labels=this._bool(p,'labels',true);
    const repeat=this._bool(p,'repeat',false);

    if(!hud) this._hideHud();
    s.grid.clearAllOverlays();
    s.inputLocked=true;

    s.tacticalCamera.computeBounds(230);
    s.tacticalCamera.setZoom(s.scale.width>s.scale.height?.88:.66);
    s.tacticalCamera.focusOn(6,5,0);

    if(labels) this._label();
    this._run();

    if(repeat){
      this.timers.push(s.time.delayedCall(5200,()=>this._run(),null,this));
    }

    window.__PV_TOO_QUIET_VICTORY__={
      presentationOnly:true,
      productionVictoryInvoked:false,
      nodesMutated:false,
      enemiesKilled:false
    };
    return true;
  }
}
