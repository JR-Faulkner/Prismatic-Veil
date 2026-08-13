// Sound Node Restoration Presentation — Prototype 05
//
// Opt-in visual QA for Too Quiet's three ENVIRONMENT-INTEGRATED objectives.
// No combat state, HP, turn order, pathfinding, or node.restored flags change.
//
// Activate:
//   tactical-field-v2.html?dreamview=restore&node=dogs
//   tactical-field-v2.html?dreamview=restore&node=pool
//   tactical-field-v2.html?dreamview=restore&node=laughter
//   tactical-field-v2.html?dreamview=restore&node=all
//
// Optional:
//   hud=0|1
//   labels=0|1
//   repeat=0|1
export default class SoundNodeRestorationPrototype {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
    this.timers = [];
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('dreamview') === 'restore';
  }

  _bool(params, key, fallback) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    return !['0','false','off'].includes(raw.toLowerCase());
  }

  _node(id) {
    return this.scene.nodes.find(n => n.id === id);
  }

  _worldGraphics(depth) {
    const g = this.scene.add.graphics().setDepth(depth);
    this.scene.worldAdd(g);
    this.layers.push(g);
    return g;
  }

  _hideHud() {
    const s = this.scene;
    [s.phaseFrame, s.turnText, s.goalFrame, s.goalPrimaryText,
     s.goalSecondaryText, s.messageText, s.heroCardsDrawer]
      .forEach(o => { if (o?.setVisible) o.setVisible(false); });
    if (s.hudHandle?.container) s.hudHandle.container.setVisible(false);
    if (s.actionMenu?.container) s.actionMenu.container.setVisible(false);
    if (s.zoomControls?.container) s.zoomControls.container.setVisible(false);
  }

  _hideUnits() {
    const s = this.scene;
    s.heroes.forEach(u => u.sprite?.setVisible(false));
    s.enemies.forEach(u => u.sprite?.setVisible(false));
  }

  _label(text) {
    const s = this.scene;
    const t = s.add.text(10, 10, text, {
      fontFamily:'monospace', fontSize:'12px', color:'#f7e8b6',
      backgroundColor:'#090a14', padding:{x:8,y:8}, lineSpacing:3
    }).setDepth(9999).setScrollFactor(0);
    s.uiAdd(t);
  }

  _burstBase(p, color = 0xffe8a0) {
    const s = this.scene;
    const ring = s.add.ellipse(p.x, p.y, 22, 8, 0x000000, 0)
      .setStrokeStyle(2, color, .88).setDepth(8.1);
    s.worldAdd(ring);
    this.layers.push(ring);

    s.tweens.add({
      targets: ring,
      scaleX: 4.8,
      scaleY: 3.6,
      alpha: 0,
      duration: 720,
      ease: 'Cubic.easeOut'
    });
  }

  _veilRetreat(p, radiusX=82, radiusY=30) {
    // A dark-violet local stain shrinks/fades away. It visually communicates
    // "the Veil lets go HERE" without pretending to modify terrain art.
    const s = this.scene;
    const stain = s.add.ellipse(p.x, p.y + 1, radiusX, radiusY, 0x6f3dcc, .14)
      .setDepth(7.55).setBlendMode(Phaser.BlendModes.ADD);
    s.worldAdd(stain);
    this.layers.push(stain);

    s.tweens.add({
      targets: stain,
      scaleX: .28,
      scaleY: .28,
      alpha: 0,
      duration: 820,
      ease: 'Sine.easeInOut'
    });
  }

  _restoreDogs(node) {
    const s = this.scene;
    const p = s.grid.toScreen(node.x, node.y);
    const g = this._worldGraphics(8.0);

    // Fence/dog-area wake-up: compressed vibration expands outward.
    const draw = progress => {
      g.clear();
      const alpha = 0.70 * (1-progress);
      g.lineStyle(1.4, 0xffe8a0, alpha);
      for (let i=0; i<3; i++) {
        const r = 8 + i*6 + progress*18;
        g.beginPath();
        g.arc(p.x-4, p.y-6, r, -.82, .82, false);
        g.strokePath();
      }
      // Ordinary fence rail catches a brief warm resonance.
      g.lineStyle(1, 0xffd56a, .50*(1-progress));
      g.beginPath();
      g.moveTo(p.x-28, p.y+5);
      g.lineTo(p.x+24, p.y+5);
      g.strokePath();
    };

    const driver = {v:0};
    s.tweens.add({
      targets:driver, v:1, duration:720, ease:'Cubic.easeOut',
      onUpdate:()=>draw(driver.v),
      onComplete:()=>g.clear()
    });

    this._burstBase(p, 0xffe8a0);
    this._veilRetreat(p, 76, 26);
  }

  _restorePool(node) {
    const s = this.scene;
    const p = s.grid.toScreen(node.x, node.y);
    const g = this._worldGraphics(8.0);
    const driver = {v:0};

    // Water wakes up from an unnatural stillness. Ripples widen and cool back
    // toward ordinary moonlit water, with only a restrained gold/prismatic cue.
    s.tweens.add({
      targets:driver, v:1, duration:900, ease:'Sine.easeOut',
      onUpdate:()=>{
        g.clear();
        for (let i=0;i<4;i++) {
          const phase = Math.max(0, driver.v - i*.08);
          const w = 22 + phase*70 + i*10;
          const h = 6 + phase*18 + i*2;
          const a = Math.max(0, .72 - phase*.58 - i*.10);
          g.lineStyle(i===0?1.7:1.1, i===0?0xbfeaff:0xffe8a0, a);
          g.strokeEllipse(p.x, p.y+1, w, h);
        }
      },
      onComplete:()=>g.clear()
    });

    const sheen = s.add.ellipse(p.x+5, p.y+1, 46, 11, 0x9fe0ff, .10)
      .setDepth(7.9).setBlendMode(Phaser.BlendModes.ADD);
    s.worldAdd(sheen); this.layers.push(sheen);
    s.tweens.add({
      targets:sheen, scaleX:1.8, alpha:0,
      duration:980, ease:'Quad.easeOut'
    });

    this._burstBase(p, 0xbfeaff);
    this._veilRetreat(p, 96, 30);
  }

  _restoreLaughter(node) {
    const s = this.scene;
    const p = s.grid.toScreen(node.x, node.y);
    const g = this._worldGraphics(8.0);
    const driver = {v:0};

    // Harmonics return around the table/chairs/play area, not from a floating
    // crystal. Three arcs rise and separate, then vanish into the yard.
    s.tweens.add({
      targets:driver, v:1, duration:820, ease:'Cubic.easeOut',
      onUpdate:()=>{
        g.clear();
        const a = .72*(1-driver.v);
        g.lineStyle(1.3, 0xffe8a0, a);
        for (let i=0;i<3;i++) {
          const r = 9+i*7+driver.v*16;
          g.beginPath();
          g.arc(p.x, p.y-5-driver.v*6, r, Math.PI*1.08, Math.PI*1.82, false);
          g.strokePath();
        }
        g.fillStyle(0xc8a8ff, .45*(1-driver.v));
        [[-13,-16],[8,-20],[16,-11]].forEach(([dx,dy],i)=>{
          g.fillCircle(p.x+dx*(1+driver.v*.15), p.y+dy-driver.v*(5+i*2), 1.3);
        });
      },
      onComplete:()=>g.clear()
    });

    this._burstBase(p, 0xffe8a0);
    this._veilRetreat(p, 80, 28);
  }

  _restoreOne(id) {
    const node = this._node(id);
    if (!node) return;
    if (id==='dogs') this._restoreDogs(node);
    else if (id==='pool') this._restorePool(node);
    else if (id==='laughter') this._restoreLaughter(node);
  }

  _focusNode(id, duration=0) {
    const n = this._node(id);
    if (!n) return;
    this.scene.tacticalCamera.focusOn(n.x, n.y, duration);
  }

  _sequence(ids, repeat) {
    const s = this.scene;
    const run = () => {
      ids.forEach((id,index)=>{
        const timer = s.time.delayedCall(index*1200, ()=>{
          this._focusNode(id, 260);
          s.time.delayedCall(300, ()=>this._restoreOne(id));
        });
        this.timers.push(timer);
      });
      if (repeat) {
        const timer = s.time.delayedCall(ids.length*1200+1100, run);
        this.timers.push(timer);
      }
    };
    run();
  }

  apply() {
    if (!this.isEnabled()) return false;

    const s = this.scene;
    const params = new URLSearchParams(window.location.search);
    const nodeRaw = (params.get('node') || 'all').toLowerCase();
    const allowed = new Set(['dogs','pool','laughter','all']);
    const target = allowed.has(nodeRaw) ? nodeRaw : 'all';
    const hud = this._bool(params,'hud',false);
    const labels = this._bool(params,'labels',true);
    const repeat = this._bool(params,'repeat',false);

    if (!hud) this._hideHud();
    this._hideUnits();

    // Existing static node markers remain visible so reviewers can compare
    // "dormant marker" to the restoration event in the same shot.
    s.grid.clearAllOverlays();
    s.inputLocked = true;

    s.tacticalCamera.computeBounds(220);
    s.tacticalCamera.setZoom(s.scale.width>s.scale.height ? .98 : .72);

    const ids = target==='all' ? ['dogs','pool','laughter'] : [target];
    if (target!=='all') this._focusNode(target,0);
    this._sequence(ids, repeat);

    if (labels) {
      this._label(`SOUND NODE RESTORATION QA\nnode: ${target}\nvisual-only; game state unchanged`);
    }

    window.__PV_NODE_RESTORE__ = { target, repeat, stateMutation:false };
    return true;
  }
}
