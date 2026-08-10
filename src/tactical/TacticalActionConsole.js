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
//
// Bar width: the button art is one baked pill image at a fixed ~5:1
// width:height, so a single Image sized for a touch-friendly height comes
// out the same width for every row regardless of label length — "ATTACK"
// and "VEILSHIFT" got an identical, mostly-empty bar. Same fix this
// project's own KitFrame.js already uses for its command-window frame:
// crop three pieces out of the one texture — a left cap and a right cap
// (kept at natural scale, so the gem/gold-corner ornaments never
// distort) and a thin flat-rail slice from the middle (which IS safe to
// stretch — it's a straight horizontal line, not a shape). Crop bounds
// were picked by sampling the actual pixels for the most saturated
// (ornament) columns near each edge (x=24 / x=454 of 480) and confirming
// visually that x=230-250 is clean flat rail with no hidden detail.

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
const NATIVE_W = 480;
const NATIVE_H = 368;
const CAP_W = 100;
const MID_X0 = 230;
const MID_W = 20;

const CAP_FRAME = Object.freeze({ left: 'capLeft', mid: 'midRail', right: 'capRight' });

const PRESSED_FLASH_MS = 110;

export default class TacticalActionConsole {
  constructor(scene, actionDefs, onChoice) {
    this.scene = scene;
    this.actionDefs = actionDefs;
    this.onChoice = onChoice;
    this.container = null;
    this.entries = [];
  }

  // Frames belong to the texture, not to any one Image instance, so this
  // only needs to run once per texture — guarded in case create() ever
  // runs again (scene restart) rather than assuming it won't.
  _ensureFrames() {
    Object.values(BUTTON_TEX).forEach(key => {
      const tex = this.scene.textures.get(key);
      if (!tex.has(CAP_FRAME.left)) tex.add(CAP_FRAME.left, 0, 0, 0, CAP_W, NATIVE_H);
      if (!tex.has(CAP_FRAME.right)) tex.add(CAP_FRAME.right, 0, NATIVE_W - CAP_W, 0, CAP_W, NATIVE_H);
      if (!tex.has(CAP_FRAME.mid)) tex.add(CAP_FRAME.mid, 0, MID_X0, 0, MID_W, NATIVE_H);
    });
  }

  create() {
    const s = this.scene;
    this._ensureFrames();
    this.container = s.add.container(0, 0);

    this.entries = this.actionDefs.map(def => {
      const row = s.add.container(0, 0);
      const bgLeft = s.add.image(0, 0, BUTTON_TEX.default, CAP_FRAME.left).setOrigin(0.5);
      const bgMid = s.add.image(0, 0, BUTTON_TEX.default, CAP_FRAME.mid).setOrigin(0.5);
      const bgRight = s.add.image(0, 0, BUTTON_TEX.default, CAP_FRAME.right).setOrigin(0.5);
      const icon = s.add.image(0, 0, ICON_TEX[def.kind]).setOrigin(0.5);
      const label = s.add.text(0, 0, def.label, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#F8E7B0'
      }).setOrigin(0, 0.5);
      // Invisible hit target spanning the full bar footprint — the three
      // background pieces don't need their own interactivity, and a
      // single shared zone avoids any seam between them ever being a
      // dead click spot.
      const hitZone = s.add.rectangle(0, 0, 10, 10, 0x000000, 0).setOrigin(0.5);
      row.add([bgLeft, bgMid, bgRight, icon, label, hitZone]);
      this.container.add(row);

      const entry = {
        kind: def.kind, label: def.label, row, bgLeft, bgMid, bgRight, icon, labelText: label, hitZone,
        enabled: true, ready: false, pending: false, hovered: false, pressed: false
      };

      hitZone.setInteractive({ useHandCursor: true });
      hitZone.on('pointerover', () => { entry.hovered = true; this._applyTexture(entry); });
      hitZone.on('pointerout', () => { entry.hovered = false; this._applyTexture(entry); });
      hitZone.on('pointerdown', (p, lx, ly, ev) => {
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
      entry.hitZone.input.enabled = enabled;
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
    entry.bgLeft.setTexture(tex, CAP_FRAME.left);
    entry.bgMid.setTexture(tex, CAP_FRAME.mid);
    entry.bgRight.setTexture(tex, CAP_FRAME.right);
    entry.labelText.setAlpha(entry.enabled ? 1 : 0.55);
    entry.icon.setAlpha(entry.enabled ? 1 : 0.55);
  }

  // barHeight drives the vertical scale (and the cap pieces' width,
  // since they scale uniformly with it to avoid distorting the gold
  // corner/gem ornaments); barWidth is now driven by content — each
  // row's actual icon+label footprint — rather than being a fixed
  // multiple of barHeight, so "ATTACK" no longer carries the same
  // mostly-empty bar as "VEILSHIFT".
  layout(barHeight, gap) {
    const canvasH = barHeight / BAR_H_FRAC;
    const scale = canvasH / NATIVE_H;
    const capW = CAP_W * scale;
    const spacing = barHeight + gap;
    const iconSize = barHeight * 0.7;
    const iconInset = capW * 0.55;
    const labelGap = 10;
    const rightPad = capW * 0.6;

    // Font sized first so each label's real rendered width (not a
    // guessed character count) drives the shared bar width below.
    this.entries.forEach(entry => {
      entry.labelText.setFontSize(Math.round(barHeight * 0.34));
    });

    // One shared width across all six rows (sized to the longest label,
    // currently VEILSHIFT) keeps the stack reading as a uniform grid —
    // per-row variable widths would look ragged rather than "sized
    // better".
    const contentW = Math.max(...this.entries.map(entry =>
      iconInset + iconSize * 0.5 + labelGap + entry.labelText.width
    ));
    const barW = Math.max(contentW + rightPad, capW * 2 + 12);
    const midW = Math.max(2, barW - capW * 2);

    this.entries.forEach((entry, i) => {
      const cy = i * spacing + barHeight / 2;
      entry.row.setPosition(barW / 2, cy);

      entry.bgLeft.setDisplaySize(capW, canvasH).setPosition(-barW / 2 + capW / 2, 0);
      entry.bgRight.setDisplaySize(capW, canvasH).setPosition(barW / 2 - capW / 2, 0);
      entry.bgMid.setDisplaySize(midW, canvasH).setPosition(0, 0);

      entry.icon.setPosition(-barW / 2 + iconInset, 0).setDisplaySize(iconSize, iconSize);
      entry.labelText.setPosition(-barW / 2 + iconInset + iconSize * 0.5 + labelGap, 1);

      // A 44px touch target regardless of the rendered bar height — the
      // same floor CommandConsole.js already holds BP's glyphs to.
      // hitZone is a Shape (not an Image), so unlike bgLeft/Mid/Right its
      // width/height ARE its own current geometry rather than a fixed
      // texture frame — frame-space for hit-testing is exactly
      // (0,0,barW,hitH), no origin-centering offset needed (confirmed
      // against the identical cancelBg case in TacticalScene.js).
      // Mutating the existing hit area in place, not re-calling
      // setInteractive() — see the note on that no-op in
      // TacticalScene.js's own cancelBg hit-area update.
      const hitH = Math.max(44, barHeight);
      entry.hitZone.setSize(barW, hitH);
      entry.hitZone.input.hitArea.setTo(0, 0, barW, hitH);
    });

    return { barW, stackH: spacing * this.entries.length };
  }
}
