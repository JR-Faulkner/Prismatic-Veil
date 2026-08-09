// v0.5A Tactical Command Console Core — replaces the plain gray-rectangle
// action buttons with the locked console art (six button states, six
// command icons; see FAI_Handoff_v0.5A_Tactical_Command_Console_Core).
//
// Scope note: the handoff's shell mockup (Tactical_Console_Shell_
// Master_A_CANDIDATE.png) is a wide, three-zone desktop-scale HUD panel —
// its own center command-zone measures ~20% of the shell's width, which
// cannot hold a legible icon+label button at any width a 390px phone can
// spare without the whole shell overflowing the screen. Per the package's
// own framing ("use the shell candidate primarily as a visual authority
// for proportions and finish", "not the final full HUD"), this pass ships
// the actual interactive surface — the six button-state textures and six
// command icons — on the existing vertical stack layout, rather than
// forcing the wide reference frame into a footprint it wasn't drawn for.
// The shell art itself is not used here; revisit once a phone-scale HUD
// frame is authored for it specifically.
//
// Button state -> meaning (Button_State_Usage.md):
//   default            available
//   hover              pointer rollover (desktop mouse only)
//   selected           sustained, low-energy — this command is the one
//                      awaiting confirmation (attack/resonart while the
//                      player is choosing a target tile)
//   pressed            momentary, stronger — a brief flash on tap before
//                      the command dispatches
//   disabled           unavailable this action
//   veilshiftReady     Veilshift's own slot once Attunement is maxed,
//                      independent of the other states (still subject to
//                      disabled if the hero has already acted)

const ICON_TEX = Object.freeze({
  attack: 'tac_console_icon_attack',
  resonart: 'tac_console_icon_resonart',
  attune: 'tac_console_icon_attune',
  veilshift: 'tac_console_icon_veilshift',
  guard: 'tac_console_icon_guard',
  wait: 'tac_console_icon_wait'
});

const BUTTON_TEX = Object.freeze({
  default: 'tac_console_button_default',
  hover: 'tac_console_button_hover',
  selected: 'tac_console_button_selected',
  pressed: 'tac_console_button_pressed',
  disabled: 'tac_console_button_disabled',
  veilshiftReady: 'tac_console_button_veilshift_ready'
});

// Measured from the source art (button canvas 1536x1178, resized 1:1 to
// 480x368 for the shipped textures): the solid bar occupies a fixed
// fraction of the canvas, consistent across all six state images within
// a few px — so every state can share one registration point (canvas
// center) without the bar visibly shifting when the texture swaps.
const BAR_H_FRAC = 0.236;
const CANVAS_AR = 480 / 368;

const PRESSED_FLASH_MS = 110;

export default class TacticalActionConsole {
  constructor(scene, actionDefs, onChoice) {
    this.scene = scene;
    this.actionDefs = actionDefs;
    this.onChoice = onChoice;
    this.container = null;
    this.entries = [];
  }

  create() {
    const s = this.scene;
    this.container = s.add.container(0, 0);

    this.entries = this.actionDefs.map(def => {
      const row = s.add.container(0, 0);
      const bg = s.add.image(0, 0, BUTTON_TEX.default).setOrigin(0.5);
      const icon = s.add.image(0, 0, ICON_TEX[def.kind]).setOrigin(0.5);
      const label = s.add.text(0, 0, def.label, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#F8E7B0'
      }).setOrigin(0, 0.5);
      row.add([bg, icon, label]);
      this.container.add(row);

      const entry = {
        kind: def.kind, label: def.label, row, bg, icon, labelText: label,
        enabled: true, ready: false, pending: false, hovered: false, pressed: false
      };

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { entry.hovered = true; this._applyTexture(entry); });
      bg.on('pointerout', () => { entry.hovered = false; this._applyTexture(entry); });
      bg.on('pointerdown', (p, lx, ly, ev) => {
        if (!entry.enabled) return;
        if (ev) ev.stopPropagation();
        if (p.event) p.event._tacticalUIHandled = true;
        entry.pressed = true;
        this._applyTexture(entry);
        s.time.delayedCall(PRESSED_FLASH_MS, () => {
          entry.pressed = false;
          if (this.onChoice) this.onChoice(entry.kind);
        });
      });

      return entry;
    });

    return this;
  }

  // canAct/onNode/pendingKind come from TacticalScene's existing
  // enable-logic; ready/hero-specific state is derived here so callers
  // don't need to know which button reads Attunement.
  refresh(hero, { canAct, onNode, pendingKind }) {
    this.entries.forEach(entry => {
      let enabled = true;
      if (entry.kind === 'attune') enabled = canAct && onNode;
      else if (entry.kind === 'attack' || entry.kind === 'resonart' || entry.kind === 'veilshift') enabled = canAct;
      else if (entry.kind === 'guard' || entry.kind === 'wait') enabled = canAct;

      entry.enabled = enabled;
      entry.ready = entry.kind === 'veilshift' && !!hero && hero.attunement >= hero.attunementMax;
      entry.pending = entry.kind === pendingKind;
      entry.bg.input.enabled = enabled;
      this._applyTexture(entry);
    });
  }

  _applyTexture(entry) {
    let tex = BUTTON_TEX.default;
    if (!entry.enabled) tex = BUTTON_TEX.disabled;
    else if (entry.ready) tex = BUTTON_TEX.veilshiftReady;
    else if (entry.pending) tex = BUTTON_TEX.selected;
    else if (entry.pressed) tex = BUTTON_TEX.pressed;
    else if (entry.hovered) tex = BUTTON_TEX.hover;
    entry.bg.setTexture(tex);
    entry.labelText.setAlpha(entry.enabled ? 1 : 0.55);
    entry.icon.setAlpha(entry.enabled ? 1 : 0.55);
  }

  // barHeight drives every other measurement — canvas AR and the bar's
  // fixed fraction of its own canvas (BAR_H_FRAC) are constants measured
  // from the source art, not independently tunable.
  layout(barHeight, gap) {
    const canvasH = barHeight / BAR_H_FRAC;
    const canvasW = canvasH * CANVAS_AR;
    const barW = canvasW * 0.9447;
    const spacing = barHeight + gap;
    // Bumped up from 0.52/0.28 — at the old sizes (~23px icons, ~12px
    // font) the console read correctly in isolated screenshots but was
    // reported hard to make out on a real device; these intricate,
    // detailed icons in particular need more pixels to read as anything
    // but a blob at small sizes, independent of any display/DPI concern.
    const iconSize = barHeight * 0.7;
    const iconInset = barW * 0.19;
    const labelX = iconInset + iconSize * 0.5 + 10;

    this.entries.forEach((entry, i) => {
      const cy = i * spacing + barHeight / 2;
      entry.row.setPosition(barW / 2, cy);
      entry.bg.setDisplaySize(canvasW, canvasH);
      entry.icon.setPosition(-barW / 2 + iconInset, 0).setDisplaySize(iconSize, iconSize);
      entry.labelText.setPosition(-barW / 2 + labelX, 1).setFontSize(Math.round(barHeight * 0.32));
      // A 44px touch target regardless of the rendered bar height — the
      // same floor CommandConsole.js already holds BP's glyphs to.
      //
      // Phaser's GameObject.setInteractive() silently no-ops on hit-area
      // updates once an object already has an `.input` component — its
      // enable() is `t.input ? t.input.enabled = true : this.setHitArea(...)`,
      // so a *second* setInteractive() call (this one, on resize/layout)
      // never replaces the hit area created by create()'s first call.
      // Left unfixed, every row kept its default hit area sized to the
      // full un-scaled canvas (480x368) — with rows only ~50px apart,
      // that overlapped 3-4 neighboring buttons at once (confirmed via
      // scene.input.hitTestPointer(), which returned both `attack` and
      // `resonart` for the same point). Mutating the existing hitArea's
      // geometry directly, instead of re-calling setInteractive(), routes
      // around the no-op entirely.
      //
      // Hit-area coordinates are frame-space (0,0 at the texture's own
      // top-left, 0..frameWidth/frameHeight), not origin-relative —
      // Phaser adds displayOriginX/Y before testing against the hitArea,
      // so a center-origin object's own center sits at
      // (frameWidth/2, frameHeight/2) in that space, not (0,0).
      const hitH = Math.max(44, barHeight);
      const hitW = barW / entry.bg.scaleX;
      const hitHLocal = hitH / entry.bg.scaleY;
      const frameW = entry.bg.width;
      const frameH = entry.bg.height;
      entry.bg.input.hitArea.setTo(
        frameW / 2 - hitW / 2, frameH / 2 - hitHLocal / 2,
        hitW, hitHLocal
      );
    });

    return { barW, stackH: spacing * this.entries.length };
  }
}
