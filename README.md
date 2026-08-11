# The Prismatic Veil

A family JRPG built with Phaser 3 — no build tools, no bundler, no CDN. Everything is served straight from this repository.

**▶ Play the battle: https://jr-faulkner.github.io/Prismatic-Veil/battle-v2.html**

> Add a cache-busting query when testing a fresh deploy: `battle-v2.html?v=40`

---

## What this project is now

The current work is a **stage battle** in the Shining Force tradition: a hero on the left facing an enemy on the right, turn-based rounds, typed battle dialogue, and cinematic attacks with camera work and hit stop.

`battle-v2.html` is the live build and the thing to look at. The older wave-survival game still lives here and still runs, but it is a **legacy prototype** — see [Legacy prototypes](#legacy-prototypes).

---

## Battle system status

**Playable now:** Prismel, Kineza, or Auryi versus the Veil Wraith (default) or the Hushling — art-complete and audio-complete on all three heroes, portrait-phone first.

> Pick the encounter with a query param: `battle-v2.html?enemy=wraith` or `battle-v2.html?enemy=hushling`. It's read once at battle start, and is overridden by an in-game enemy switch or a gauntlet win (see below) once either has fired.

There's now an in-game **enemy switch** button, right below the hero switch, that cycles the active enemy and restarts the battle — the manual counterpart to the roster below. Beating an enemy also **auto-advances the gauntlet**: the next round starts against the next enemy in `ENEMY_ORDER`, looping back to the first after the last one falls, so a run never dead-ends as more enemies join the roster.

### Round flow

Rounds alternate one full side at a time. The enemy acts **only** on its own round; there is no auto-chained sequence. Counter attacks and interruption moves are planned as their own mechanic later.

```
Battle opens with a right-to-left stage sweep
  ↓
PLAYER ROUND
  1 hero portrait synchronizes
  2 tactical command console opens
  3 player taps a Veil glyph
  4 reticle seeks → locks
  5 Idle → Step 220ms → Gather 450ms → Hold 120ms
       → Release 160ms → Hit Stop 80ms → Recover 260ms → Idle
  6 damage number + CRITICAL! callout
  7 HP chip resolves, Veil conduit recharges
  8 round hands over
  ↓
ENEMY ROUND    (tap to run)
  Enemy lunges, hero takes damage
  ↓
repeat until the enemy shatters → victory → gauntlet advances to the
next enemy in ENEMY_ORDER (loops to the first after the last) → restart
```

### Combat

| | |
|---|---|
| Damage wording | `<name> uses <attack>!` → `<target> is hit for <n> damage!` (player) / `<target> suffers <n> damage!` (enemy) |
| Criticals | 25% Prismel, 22% Kineza, 20% Auryi, 15% enemy — double damage, `CRITICAL!` callout, doubled hit stop, harder shake |
| Hit stop | 80ms scene freeze on impact, 160ms on a critical |
| Hero switch | Button on the right cycles the active hero and restarts the battle |
| Enemy switch | Button below the hero switch cycles the active enemy and restarts the battle |
| Gauntlet | Beating an enemy auto-advances to the next one in `ENEMY_ORDER`, looping back to the first after the last |
| Commands | One glyph per hero is bound to their attack. The rest are slots with nothing behind them yet — selecting one narrates and leaves the console open |

### Roster

| Hero | Pronouns | HP | Attack | Damage | Accent |
|---|---|---|---|---|---|
| **Prismel** | — | 100 | Refractive Burst | 14 | violet-blue |
| **Kineza** | he/him | 115 | Momentum Fist | 17 | kinetic green |
| **Auryi** | she/her | 100 | Veil Pulse | 13 | lavender-gold |

Refractive Burst is the player-facing name (v0.3 Battle Presentation Base handoff); the internal pose/state name stays `release` throughout the codebase. Veil Pulse is a working player-facing name — the pose is locked, the name may still evolve.

*Vyan and Sarallel are designed but have no battle pose libraries yet.*

---

## Completed pose pipelines

All three heroes run the same canonical five-beat sequence. Poses crossfade through a ghost layer that stays fully opaque behind the incoming frame, so the character is never see-through mid-blend.

### Prismel — `assets/poses/`

| Pose | File |
|---|---|
| Idle | `Pose01_Idle_LOCKED.png` |
| Step Forward | `Pose02_StepForward_LOCKED.png` |
| Gather | `Pose03_Gather_LOCKED.png` |
| Prismatic Release | `Pose04_PrismaticRelease_LOCKED.png` |
| Recover | `Pose05_Recover_LOCKED.png` |

Authored with **mixed orientation** — Release fires right, the rest look left — so the config flips per pose.

### Kineza — `assets/poses/kineza/`

| Pose | File |
|---|---|
| Idle | `Kineza01_Idle_LOCKED.png` |
| Step Forward | `Kineza02_Step_LOCKED.png` |
| Coil | `Kineza03_Coil_LOCKED.png` |
| Kinetic Strike | `Kineza04_Strike_LOCKED.png` |
| Recover | `Kineza05_Recover_LOCKED.png` |

Authored **facing right throughout**, per the animation standard — no flipping needed. This is the template for every future character.

### Auryi — `assets/poses/auryi/`

| Pose | File |
|---|---|
| Battle Ready | `Pose01_BattleReady_BattleMasterA_LOCKED.png` |
| Veil Step | `Pose02_VeilStep_LOCKED.png` |
| Orb Gather | `Pose03_OrbGather_LOCKED.png` |
| Attack / Veil Pulse | `Pose04_Attack_VeilPulse_POSE_LOCKED.png` |
| Recompose | `Pose05_Recompose_LOCKED.png` |

Delivered (v0.3 Battle Presentation Base) as flat RGB renders on a solid studio backdrop, no alpha channel — background keyed out (distance-based chroma key from the sampled corner color, graded edge alpha, not a hard threshold) before these landed in the repo; originals are untouched outside this pipeline. Same mixed-orientation pattern as Prismel's set — Attack/Veil Pulse already fires right, the rest look left. `scaleMul: 1.29`, derived from the locked trio scale calibration reference (Auryi measures ~1.29x Prismel's head-to-foot height there) — her pose canvases carry almost the same content-to-canvas ratio as Prismel's idle pose, so that ratio carries straight through without a separate padding correction.

### Art standards

- PNG with a **real alpha channel** — never JPEG, never a painted-on checkerboard or white matte
- Author heroes **facing right**; enemy art faces **left**
- One scale factor per pose set, derived from the idle frame. Crouched and wide poses are legitimately shorter and must not be stretched to match

### Walk cycle — `assets/prismel/walk/`

A locked six-frame Prismel walk cycle (Contact A → Down A → Passing A → Contact B → Down B → Passing B), 1024×1536 transparent PNGs, QA'd at ~9.5fps. Not used by the five-beat battle pose sequence above — its consumer is the tactical prototype's map token (see "Tactical Field prototype" below), which walks Prismel tile-to-tile with these frames. `prismel_walk_manifest.json` in the same folder documents frame order and baseline.

---

## Systems

### HUD — `src/BattleHUD.js`, `src/HudFrame.js`, `src/ActorPortrait.js`
Faceted crystal HP and RP conduits with angled end caps, chip-damage ghosts trailing the live fill, a recharge wavefront distinct from the healing flash, and hairline fractures below 25%. Hero accent colours drive the fill; the Wraith uses corrupted violet styling. RP is the same conduit system the old "Veil conduit" used, repurposed as a value-based readout (`updateRp`, not the old percent-based `updateVeil`) — it still dips on a command and recharges by the next round, and still gates nothing. A 3-facet Attunement gauge sits beside the hero portrait, lighting up toward VEILSHIFT readiness.

Each combatant carries a framed portrait beside their conduit, running the kit's four states — idle, active (their round), hurt below 25%, down at zero — and flinching when they take a hit. Dialogue is compact narration in a nine-slice frame with a blinking continue crystal and **no speaker portrait box**; the portrait lives in the HUD instead. A Veil border with crystal corners pulses on gather, flares gold on criticals and blooms on victory, and a danger vignette creeps in below 25% HP.

### Interaction layer — `src/CommandConsole.js`, `src/TargetReticle.js`, `src/KitFrame.js`
The player's round runs through a tactical command console rather than a bare tap. It opens on their turn, shows one Veil glyph per command with a selection cursor, and hands the choice back. Glyph states are the kit's own language — dormant, synchronized, disconnected, the last marked with broken-circuit corners rather than plain low opacity. Every tap target clears 44px even at 390px wide. In landscape the console is its own bottom dock rather than sharing the portrait dialogue's clearance.

Selecting a command sends the target reticle through seeking → locked → confirmed → shatter. The reticle is drawn procedurally — four corner brackets, cardinal anchor diamonds, broken arc segments — with a **hollow center**, not a baked image with a gem in the middle. Nothing sits over the Wraith's face at any state, at any viewport. `KitFrame` assembles a frame of any size from one corner slice and a stretchable rail.

### Combat feedback — `src/BattleFeedback.js`, `src/BattleFeel.js`
Sheet 05's custom numerals, sliced to real alpha and loaded like every other asset — relative paths from `preload()`, no embedded base64. Ten tintable white masks for normal damage, coloured by the attacker's accent; ten gold numerals plus a geometric burst for criticals. A hero's own `damageStyle` drives the number's motion whether they're dealing the hit or taking it, so a hurt Prismel still refracts and a hurt Kineza still slams. Falls back to the older drawn numbers if the digit textures are ever incomplete.

`BattleFeel` centralises impact timing so both heroes — and both sides of the fight — land with the same weight: a 58ms hit stop on a normal hit, 92ms on a critical, plus a small camera impulse on lock/release/impact. A critical that follows a normal impact within the same beat escalates the existing freeze instead of stacking a second one. It's the *only* thing that touches hit stop or camera shake now — `BattleController` no longer calls either directly, since a second call on top of `BattleFeel`'s would just stretch the freeze back out and quietly undo the tuning.

### Audio — `src/UiAudio.js`, `assets/sfx/`
Six battle hooks (`PLAY_STEP` / `GATHER` / `RELEASE` / `IMPACT` / `RECOVER` / `VICTORY`) emitted as scene events and mapped to **per-hero sound banks**. Prismel's set is crystalline; Kineza's seven clips are kinetic, with a debris accent 36ms behind his impact. UI cues (turn start, low HP, victory, confirm) are **synthesised at runtime** with the Web Audio API — no files, nothing to cache-bust. `Veilbreak.mp3` loops as the shared battle theme, trimmed to an 80s loop with matched boundary levels so the hard restart doesn't click.

### Camera — `src/BattleCamera.js`
Right-to-left entrance sweep, gather push to 1.32×, release snap to 1.55×, hit shake, eased recover, slow victory pull-out, and a continuous 1–2px idle breath that suppresses itself whenever a pan or zoom is active.

Those 1.32×/1.55× levels were tuned against Prismel (`scaleMul: 1`) and applied flatly to every hero — reported directly as Auryi (`scaleMul: 1.29`, the largest of the trio) getting cropped by the same nominal zoom that frames Prismel and the smaller Kineza (`scaleMul: 0.78`) fine. `displayHeight` scales directly with `scaleMul`, so `gatherPush()`/`releaseSnap()` now divide the zoom itself by `scaleMul` (not just the boost above baseline — a gentler version of that was tried first and, confirmed by sampling actual on-screen sprite bounds during the release beat, still cropped her feet by ~22px) whenever `scaleMul > 1`, leaving Kineza and Prismel completely untouched. Verified with real screen-space bounds (world-space `getBounds()` converted through the camera's own `scrollX/scrollY/zoom`, not compared directly): 0 cropped samples across a full release beat after the fix, vs cropping at the original flat zoom before it.

**Two-camera architecture:** the main camera renders and zooms `scene.world`; a second camera renders `scene.uiLayer` and never moves. Without this the HUD would scale off screen during an attack. **Any new battlefield visual must register via `scene.worldAdd()`; HUD elements go on `uiLayer`.**

### Atmosphere — `src/BattleAtmosphere.js`, `src/AmbientBattlefieldDirector.js`
The battlefield backdrop is five real painted layers (`assets/battle/veil_fracture/`), stacked back to front by `AmbientBattlefieldDirector`: far background (very slow independent drift), crystal midground (camera-relative parallax, factor 0.35 — the same offset-proportional-to-camera-displacement convention `BattleAtmosphere.updateParallax()` already used), the static combat platform the fighters stand on, a fracture-energy overlay (15–20% opacity, ~4.8s pulse), and a sparse particle overlay drifting at its own independent rate. Every layer is scaled to fully cover the viewport plus a margin sized against its own motion, so drift never exposes an empty edge.

`BattleAtmosphere` still owns drifting fog banks and the foreground corner silhouettes — neither is covered by the five painted layers, so both stayed. Its old procedural backdrop gradient, light-shaft bands, floor disc, and ambient motes were removed once the real art shipped, since drawing both would double up the same visual role. Ground compression ripples and the per-hero ability-tint flashes (cool refracted highlights for Prismel, warm kinetic flashes for Kineza) are unchanged.

### Battle Presence FX — `src/BattleFXDirector.js`
Prismel's and Auryi's attacks (`fxVersion: 'v2'` in `BattleConfig.js`) route their charge/projectile/impact/residual visuals through this director instead of `BattleFX`'s own `gather()`/`beam()`/`impact()` — Kineza keeps his original BattleFX-driven identity untouched. Six small procedural layer concepts (particle, mist, ribbon, distortion, residual, environmental overlay) back a five-call public API (`playChargeFX`/`playProjectileFX`/`playImpactFX`/`playResidualFX`/`playRecoverFX`, plus `clearResidualFX`/`clearAll`). Each hero has its own palette — Auryi's adds a `support` field (soft green) consumed only by a dedicated source-anchored aura layer, kept structurally separate so it can never drift onto her projectile or impact core. It never touches camera, hit-stop, damage, sequencing, or audio — those calls stay explicit in `BattleController`, the same way `BattleFeel` owns them everywhere else. Residual FX are tracked per-target so a round that ends early still cleans up completely before the next one starts.

Both v2 heroes' attack phases were reported as blurring together — Prismel's `attackTiming` override already stretched his step/hold beats, but not enough, and Auryi had no override at all (bare `POSE_TIMING` defaults). Kineza, on the older single-effect `BattleFX` path, read fine at the same defaults — the actual cause was `playChargeFX(type, source)` never taking a duration at all, unlike `playProjectileFX` (which explicitly documents "duration matches however long the pose actually holds, rather than a constant tuned for one hero's timing"). Its internal mist/aura/staged-particle-burst choreography ran on a hardcoded ~570ms schedule regardless of how long the gather pose was actually scheduled to hold, so a hero with a longer gather+hold window than that just sat there with the charge effect already finished. `playChargeFX` now takes a `duration` (default 570, matching what it was originally tuned at) and scales every internal beat proportionally — `BattleController` passes `timing.gather + timing.hold`. Both Prismel and Auryi's `attackTiming` are now `{ step: 340, gather: 560, hold: 220, release: 220 }` (defaults: 220/450/120/160).

### Enemy — `src/EnemyCatalog.js`, `src/EnemyViewFactory.js`, `src/EnemyWraithView.js`, `src/EnemyHushlingView.js`
Two enemies now, each texture-driven with the same four-pose language — Idle, Attack, Hit, Shatter — behind a common interface (`container`, `sprite`, `layout/setPose/introSlide/hit/attack/die/reset`), so `BattleController`, `BattleFX` and `TargetReticle` never need to know which one they're fighting. `EnemyCatalog.selectEnemy(baseEnemy, search, override)` resolves the active enemy: an explicit `override` (from the in-game enemy switch or a gauntlet win, both delivered via the scene registry) beats the `?enemy=` query param, which beats the default Wraith. `EnemyCatalog.ENEMY_ORDER` and `nextEnemyId()` drive the gauntlet — `BattleController.resetBattle()` reads the current enemy's id, advances it, stashes the result in the registry, and does a full `scene.restart()`, the same mechanism already proven for the hero switch. `EnemyViewFactory.createEnemyView()` picks the matching view class.

The **Veil Wraith** floats and drifts, recoils with a single compression-and-recoil beat when struck, lunges on its own round, and unravels into a fading silhouette on death — now with small shard fragments scattering outward as it dissolves, and a faint spectral flicker on the sprite itself (not just its aura) during idle. The **Hushling** is wider and heavier — a slow idle weight shift instead of a hover, a short hard lunge, a bigger shove and slower settle on hit (now with a light dust puff on impact), and a downward collapse on defeat. Both share a one-beat hit reaction, not a multi-cycle jiggle — a second enemy has to match the standard the first one was already corrected to, not just have *a* reaction.

As of v34 both run full-fidelity painted art (1000×1500px source, matching the approved concept designs) instead of the earlier pixel-built prototypes — a low-alpha, additively-blended aura layer breathes behind each sprite for a soft ambient glow, and pose transitions crossfade through a ghost layer using the same fully-opaque-backing pattern already proven on the hero's own pose view (see the trap below). Source art is authored tall and narrow rather than square, so `layout()` derives display width from the sprite's own aspect ratio instead of forcing a square box.

### Enemy audio — `src/EnemyAudioDirector.js`
Each enemy has its own five-cue bank (idle, release, impact, hurt, defeat) resolved **only** through that bank — there is no fallback to the active hero's sound bank. A missing cue is silence, never a borrowed Prismel or Kineza clip. `BattleController` emits enemy-specific event names (`PLAY_ENEMY_RELEASE` / `_IMPACT` / `_HURT` / `_DEFEAT`) distinct from the hero's own `PLAY_RELEASE` / `PLAY_IMPACT`, so the two audio paths can never cross.

---

## File map

```
battle-v2.html              ← the live battle. Start here.
phaser.min.js               bundled Phaser 3.70 (do not modify, no CDN)
Veilbreak.mp3               battle theme (80s trimmed loop)

src/                        all battle code, ES modules
  VeilBattleScene.js        scene root: preload, layers, cameras, hero/enemy switch
  BattleController.js       round flow, pose timings, audio events, crits
  BattleConfig.js           hero roster + enemy: stats, poses, accents, attacks
  HeroPoseView.js           hero pose set, crossfade, idle signature
  EnemyCatalog.js           enemy selection + gauntlet order/advance
  EnemyViewFactory.js       picks the enemy view class by viewId
  EnemyWraithView.js        Veil Wraith poses and reactions
  EnemyHushlingView.js      Hushling poses and reactions
  EnemyAudioDirector.js     per-enemy sound bank, no hero fallback
  BattleHUD.js              HP + Veil conduits, dialogue, actor portraits
  ActorPortrait.js          framed portrait: idle / active / hurt / down
  CommandConsole.js         tactical command console, Veil command glyphs
  TargetReticle.js          seeking / locked / confirmed targeting
  KitFrame.js               modular frame from corner + rail pieces
  BattleFeedback.js         Sheet 05 damage numerals, gold criticals
  BattleFeel.js             hit stop, camera impulse — the sole owner of both
  HudFrame.js               Veil border, crystal corners, vignette, flares
  BattleFX.js               Kineza's attack FX, crit flourish, victory
  BattleFXDirector.js       Prismel V2's layered charge/projectile/impact FX
  BattleAtmosphere.js       parallax layers, fog, floor, motes, ripples
  AmbientBattlefieldDirector.js  loads/composites the 5 painted battlefield layers
  BattleCamera.js           entrance sweep, pushes, shake, breath, pull-out
  UiAudio.js                synthesised UI cues (Web Audio)
  Timeline.js               stepped playback helper
  VeilFracture.js           veil flash / fade

assets/
  poses/                    Prismel's five locked poses
  poses/kineza/             Kineza's five locked poses
  enemy/veil_wraith/        Wraith Idle / Attack / Hit / Shatter (v34 full-fidelity art)
  enemy/hushling/           Hushling Idle / Attack / Hit / Shatter (v34 full-fidelity art)
  sfx/enemy/wraith/         Wraith idle / release / impact / hurt / defeat
  sfx/enemy/hushling/       Hushling idle / release / impact / hurt / defeat
  ui/                       dialog frame, continue crystal, portrait crops
  ui/kit/                   Battle Presentation Alpha v1.0 UI kit, sliced
                            and keyed from the eight source sheets
  feedback_digits/          Sheet 05 numeral set: 10 white, 10 gold
  sfx/                      Prismel + shared battle SFX
  sfx/kineza/               Kineza's seven kinetic clips
  prismel_locked.png        locked full-body reference art

pv-check.sh                 pre-commit check — run before every commit
CLAUDE.md                   working notes and standards for AI collaborators
```

### Documentation

Design specs and per-package handoffs are exchanged as zip packages rather than committed here. The standards they established are summarised in `CLAUDE.md` and in [Working standards](#working-standards) below.

---

## Tactical Field prototype (bridged to Battle Presentation)

**`tactical-field-v2.html`** — a self-contained engineering prototype for a Shining Force-style tactical battle: a 12×10 grid, weighted pathfinding, barriers and difficult terrain, line of sight, camera pan/zoom, and (as of v0.4) a real hand-off into the full stage battle for ATTACK and RESONART.

`tactical-field-v2.html` boots `TacticalScene` and `VeilBattleScene` together in **one `Phaser.Game`** — `battle-v2.html` remains a completely separate, single-scene boot and is unaffected by any of this; standalone BP still works for hero/enemy/FX testing exactly as before. Choosing ATTACK or RESONART on a hero calls `TacticalScene.enterLinkedBattle()`, which:

1. Computes an immutable resolution plan up front, using Tactical's own existing flat damage math (`hero.atk`, no crit yet) — no roll happens twice.
2. Calls `this.scene.pause()` **and** `this.scene.setVisible(false)` — pause alone stops Tactical's update loop but leaves it rendering every frame underneath BP, which is wasted cost even though nothing shows on screen (see `CLAUDE.md`'s traps list).
3. Launches the full `VeilBattleScene` with an `EncounterContext` (hero/enemy ids, a tactical-state snapshot, the resolution plan). BP syncs HP/RP/Attunement from that snapshot rather than `BattleConfig`'s frozen defaults, skips the console (the action was already chosen in Tactical), plays the one hero-bound attack command, and never chains into a second round or the standalone gauntlet.
4. `VeilBattleScene.returnToTactical()` calls `TacticalScene.onBattleResolved()` — which restores visibility, applies the `BattleResult` exactly once, and hands the round back — then stops itself and resumes Tactical exactly where it left off, camera and all, by construction (nothing was ever torn down).

ATTUNE, GUARD, and WAIT resolve entirely within Tactical and never enter BP. VEILSHIFT is narrated as not-yet-attuned until Attunement reaches its max (3 facets).

Returning from a full BP round used to snap straight back to the tactical map with nothing but an HP number and a text line changing — `TacticalScene.floatDamage()` adds a floating damage number plus a brief punch-scale on the hit token plus a camera micro-shake, called from `onBattleResolved()` right where the HP change already lands. Enemy attacks (`enemyAttack()`, which never enters BP — see below) get the same `floatDamage()` call once their own lighter cut-in closes, plus the cut-in itself (`BattleCinematic.js`) now carries a camera shake and a target-portrait flinch-compress at the impact beat, not just the flash it shipped with — presentation weight closer to what BP's own hits already carry, without promoting every routine enemy swing to the full battle screen (a deliberate pacing choice: multiple enemies acting in one phase would make the full presentation feel repetitive rather than snappy). The cut-in's own text box originally only ever showed `"<enemy> uses <ability>!"` for its whole hold — it never told the player what the hit actually did. `onImpact` (owned by `TacticalScene`, doing the real HP math) now returns the `"<target> suffers <n> damage!"` line, and `BattleCinematic.play()` drops it into the box's second line (`flavorLabel`, otherwise unused for enemy attacks) right as the hit lands, with a small pop-in. It also used to auto-close on a fixed timer right after that line appeared — kid playtesting flagged the same "gone before you can read it" problem BP's own dialogue had before it went tap-gated, so the cut-in now shows a pulsing "Tap to continue" prompt once the damage line lands and genuinely waits for a tap before closing (text sized up too, 13px/11px minimums → 16px/15px). Its portrait pair also assumed every portrait shares the roster's common 256×256 resolution — true for everyone except Auryi's much higher-res 1122×1402 asset, which rendered at native pixel size (`scale: 1`) filled the entire phone screen instead of sitting in her half of the cut-in. Both portraits now scale to a shared target height instead of a bare `scale: 1`, correct for any future portrait regardless of its actual source resolution. The enemy cut-in's impact beat also never had a sound of its own on the hero actually getting hit — `HERO_HIT_SFX` (a plain per-hero lookup, not a full `EnemyAudioDirector`-style bank, since this is the one moment that needed a cue) plays the target hero's own BP impact clip (`sfx_impact`/`kineza_impact`/`auryi_impact`) right at `onImpact`. `floatDamage()` itself was also sized/weighted up — 15px/20px → 19px/26px, 3px → 5px/6px stroke, and a brief full-alpha hold before the fade (rather than dissolving from the first frame) over a longer 1250ms lifespan instead of 850ms, so it reads as a solid, deliberate number rather than a thin flash.

Title music used to skip playing for the *entire session* if the player's tap landed before its ~11MB file finished downloading — `TitleScene.beginGame()` only ever checked readiness once, at the moment of the tap, and nothing picked the track back up if it finished loading a moment later. The scene transition also used to fully stop TitleScene (`scene.start()`), which shut down its own Loader mid-download and meant a late-finishing load's `'complete'` event never fired at all. Fixed two ways: the transition now uses `scene.launch()` + `scene.pause()` + `scene.setVisible(false)` (same pattern `TacticalScene.enterLinkedBattle()` already uses for its own scene handoff) so the paused-not-stopped scene's Loader keeps running in the background, and the load's own `'complete'` handler starts the track retroactively if `beginGame()` already ran without it. Verified directly by artificially delaying the title track's network response past the scene transition — the track still starts once it actually finishes, even though the owning scene is long gone from the scene manager's perspective. A second, separate gap in the same area: `beginGame()` called `.play()` unconditionally the instant a tap fired, without checking `sound.locked` first — `TacticalScene.create()`'s tactical-music startup already followed DAI's own v0.5B spec and deferred via `sound.once('unlocked', ...)` when locked, but title_music never got the same treatment. Fine on a fast desktop unlock, but a real phone's AudioContext can still be mid-unlock in that exact instant even inside a genuine tap handler, and playing while still locked doesn't reliably auto-start once it unlocks a moment later — reported directly from a real device as music never starting at all. Both readiness checks (file loaded, context unlocked) and the sound-object creation now live in one `_tryStartMusic()` guard, called from both the tap and the load's own completion, deferring via `sound.once('unlocked', ...)` exactly like tactical_music already did. Verified by forcing `sound.locked` to stay genuinely true straight through a real tap (a plain forced value gets silently clobbered by Phaser's own internal unlock write, so the test uses a getter it can't overwrite) — title_music correctly waits rather than firing a doomed `.play()` call, then starts cleanly the instant the lock releases. The title prompt itself now reads "TAP OR PRESS ANY KEY" instead of "TAP TO BEGIN" — keyboard already triggered the same `begin()` handler, the copy just never mentioned it. Even after both of those fixes, a real device still reported title music not starting — Phaser's own unlock is entirely automatic (listeners it attaches to `document.body` for `touchstart`/`touchend`/`click`/`keydown`, calling `context.resume()`), which is a well-known flaky spot on iOS Safari specifically. `begin()` now also calls `this.sound.context.resume()` itself, synchronously, as the first thing the real tap/keydown does — a second, more directly-tied-to-the-gesture path to unlock, at no cost if Phaser's own listener already handles it fine.

`TitleScene.js` is the first scene registered in `tactical-field-v2.html`'s boot — it reuses the original wave-survival prototype's title art and music (`title_screen.jpg`, `prism-of-elders.mp3`, both at repo root), rebuilt for `Phaser.Scale.RESIZE` (viewport-relative layout, re-laid-out on resize) rather than the original's fixed-canvas positions. Only the background image loads in `preload()`; the ~11MB music loads lazily in `create()` so the title is up and tappable immediately rather than sitting behind a loading spinner for it. `battle-v2.html` has no title screen — it stays the standalone BP dev/test harness. The title theme keeps playing on the trip past the title screen (`TitleScene.beginGame()` deliberately doesn't stop it) rather than cutting off — `TacticalScene.create()` eventually crossfades it out into Tactical's own persistent theme (`assets/music/veil_clockwork_drift.mp3`, v0.5B, looped at 0.38) once that track is loaded and unlocked. Both are Sound Manager objects findable by key from any scene, so `TacticalScene.enterLinkedBattle()`/`onBattleResolved()` pause and resume the tactical track (not title_music, which has already stopped by then) around a linked BP round rather than letting it layer under `battle_music`.

`IntroCrawlScene.js` sits between the two — a black-background, Star-Wars-style scrolling story crawl (starfield of procedural dots, no texture load needed), added after a tap still wasn't reliably starting title music on a real device even after three rounds of unlock-timing fixes. `TitleScene.beginGame()` used to hand off to `TacticalScene` ~470ms after a tap, giving the title track almost no runway to actually be audible (or to unlock at all, if it was ever going to) before Tactical's own crossfade took over; the crawl gives it real seconds instead (originally 30s, extended to 46s after that read as too fast for the amount of text — `SCROLL_MS`), with the story itself as the reason to wait. The crawl content (header + body) scrolls from below the screen to above it while scaling down, a simple flat approximation of the classic tilted-perspective crawl rather than true 3D — good enough to read as the reference without the skew/matrix math a literal recreation would need. It's tap-skippable, but only after a 1500ms grace period (`SKIP_GRACE_MS`) — same deliberate-tap-over-hair-trigger-dismiss philosophy as BP's dialogue and the enemy cut-in — with a pulsing "Tap to skip" prompt that only appears once skipping is actually live. The header's font size is computed from viewport width rather than fixed — a fixed 34px measured 364px wide for "THE PRISMATIC VEIL" in bold Georgia, wider than a 360px-CSS-width phone's entire screen, so it would have clipped at the edges on a real narrow device; sized as `w * 0.084` (capped at 34px) instead, confirmed to fit with margin at 360px. This scene never touches `title_music` at all — it's the same Sound Manager object TitleScene started, still playing, completely unmodified by anything here; `TacticalScene`'s existing crossfade fires exactly the same way whenever this scene hands off to it, whether that's from a full read-through or an early skip.

Enemy attacks never enter BP (`BattleCinematic.js`'s lighter cut-in handles them instead — see the round-flow section above) — its "X uses Y!" line now renders inside an actual text box rather than floating over whatever the map shows there, and `TacticalConfig.js`'s `cinematicHoldMs`/`cinematicOutMs` were both lengthened (520→1500 / 200→350) so there's real time to read it before the hit lands.

Both `tactical-field-v2.html` and `battle-v2.html` patch `Phaser.GameObjects.GameObjectFactory.prototype.text` once at boot to set a `resolution: devicePixelRatio` default on every text object. `Phaser.Scale.RESIZE` ties the canvas's backing-store resolution 1:1 to its CSS pixel size with no DPI awareness at all, so on any real phone the browser upscales that low-res canvas to fill the physical screen — visible mostly as soft text and small icons. A full fix (bigger backing store, matching camera zoom so world coordinates still map 1:1) touches camera-zoom math and the `getWorldPoint()` input-coordinate conversion this project's already been bitten by once; per-object text `resolution` is a safe, self-contained partial fix with none of that risk, since each Text object rasterizes to its own off-screen bitmap independent of the main canvas.

`tactical-field-v2.html` — and only that file, since it's the actual live game entry point, not `index.html` (legacy prototype) or `battle-v2.html` (standalone BP harness) — carries a Home Screen icon and `tactical.webmanifest` (v0.5B App Icon handoff). The manifest's `start_url` is `./tactical-field-v2.html` explicitly, not the example's `./`: this manifest lives at the repo root alongside `index.html`, and GitHub Pages serves that as the site root, so an unmodified `start_url` would launch the legacy prototype from the Home Screen icon instead of this game.

```
/tactical-field-v2.html
/data/tactical_map_v2.json        the "Too Quiet" Restore Sound encounter
/src/tactical/
  TacticalConfig.js                grid size, zoom limits, timing, breakpoints
  TerrainRegistry.js                movement cost / walkable / LOS-blocking lookup
  TacticalGrid.js                   isometric projection, occupancy, overlays
  TacticalPathfinder.js             weighted Dijkstra + deterministic, symmetric LOS raycast
  TacticalCamera.js                 pan/zoom/clamp, cinematic state save/restore
  UnitController.js                 selection, path preview/confirm, tile-by-tile move animation
  BattleCinematic.js                presentation-only attack cut-in
  TacticalActionConsole.js          the six command buttons — v0.5A button-state/icon art, state machine
  TitleScene.js                     title screen — first scene on boot, taps into IntroCrawlScene
  IntroCrawlScene.js                 Star-Wars-style story crawl, taps/times out into TacticalScene
  TacticalScene.js                  phase sequencing, objectives, enemy AI, HUD
```

Three heroes (Prismel, Auryi, Kineza) and two enemy types (Hushling ×3, Veil Wraith ×1) restore three silenced sound nodes to win; defeating every enemy is optional. Hero map tokens use approved *tactical-scale* character art for all three heroes: Prismel's six-frame walk cycle (`assets/prismel/walk/`), Auryi's six-frame movement set (`assets/auryi/movement/`, replacing an earlier seven-frame placeholder set), and Kineza's six-frame run cycle (`assets/kineza/movement/`), each used for both idle and walking, all walking tile-to-tile with frame cycling and a direction-based facing flip, `TacticalScene._buildCharacterToken()`/`CHARACTER_TOKEN_ART`. None of them use the cinematic battle-pose art in `assets/poses/` — that library is `BattleCinematic`'s close-up cut-in exclusively, kept deliberately separate from whatever's approved for the map itself. The enemies keep the procedural accent-colored-circle-and-initials token (their full battle-art portraits are the wrong shape/scale for a map marker). `_buildHero()` branches purely on whether `CHARACTER_TOKEN_ART` has an entry for that hero id, and `UnitController.animateMove()` drives presentation only through the optional `onStep`/`onMoveEnd` hooks a token returns — so a hero's sprite is a new `CHARACTER_TOKEN_ART` entry, not a rewrite of grid movement, targeting, selection, or the cinematic battle-transition code. The real portrait art (`assets/ui/portrait_*.png`) is reserved separately for `BattleCinematic`'s close-up cut-in, where detail matters — the same "tactical map sprite → zoomed battle sprite" pairing shown in this project's own reference art.

Sprite tokens sit on a subtle character-following outline plus a small grounded contact shadow (`ONSCREEN_W`/`ONSCREEN_H`, `map_icons/*_silhouette.png`) rather than a heavy colored oval — the outline is a separately pre-thresholded solid-alpha silhouette texture, not just a tinted copy of the display texture, since `setTint()` never changes a texture's alpha and a tinted copy would carry the same semi-transparent regions (Auryi's aura, painterly shading) responsible for the original grid-bleed-through ghost bug. See `CLAUDE.md`'s traps list for the full story.

The post-move action menu uses the locked v0.4 command lexicon — **ATTACK, RESONART, ATTUNE, VEILSHIFT, GUARD, WAIT, Cancel** (`ACTION_DEFS` in `TacticalScene.js`) — the same labels across every hero. Hero identity (Prism Weaver / Momentum Born / Aura Acolyte, `hero.title`) is flavor text only, never an action-button label. RESONART shares each hero's existing bound BP attack command for presentation; ATTUNE restores a silenced node (the old "Resonate"); VEILSHIFT narrates as not-yet-attuned until Attunement hits its max. Button identity is a stable `kind`, decoupled from the display `label`, so the enable/dispatch logic can never desync from what's on screen.

The six console-owned commands (everything but Cancel) render through `TacticalActionConsole.js`, using the v0.5A Tactical Command Console Core handoff's button-state art (default/hover/selected/pressed/disabled/veilshift-ready) and six command icons, pre-resized offline (LANCZOS) from the handoff's much larger masters — rendering the native 1536×1178/768×768 art directly at gameplay button/icon scale would be a ~7-30x runtime minification, well into the range that's previously produced visible alpha-averaging haze on this project's soft/glowing art. Selected/Focused is the *sustained* state for whichever of Attack/Resonart the player has committed to and is now choosing a target for (not a hover synonym); Pressed/Active is a brief flash on tap before the command dispatches; Veilshift Ready overrides Default specifically for that button once Attunement maxes out. The handoff's own wide three-zone shell mockup (hero portrait / command stack / detail panel) isn't used here — its center command zone is a fixed ~20% of the shell's own width, which cannot hold a legible button at any width a 390px phone can spare without the whole shell overflowing the screen; per the package's own framing, that art is "a visual authority for proportions and finish," not a literal template, so this pass ships the actual interactive surface (the button/icon art) on the same vertical stack the plain-rectangle menu already used. Cancel isn't part of the six-command icon set, so it stays a small plain pill next to the console. See `CLAUDE.md`'s traps list for a `setInteractive()` gotcha this surfaced: calling it a second time on an already-interactive object silently no-ops the hit-area update, which briefly left every console button's clickable region sized to the full unscaled art canvas — overlapping 3-4 neighboring buttons at once.

Each button bar is three pieces, not one image — the art is a single baked pill at a fixed ~5:1 width:height, so a straight `setDisplaySize()` at a touch-friendly height gave every row an identical width regardless of label length ("ATTACK" and "VEILSHIFT" carried the same mostly-empty bar). `TacticalActionConsole.layout()` instead crops a left cap, a right cap, and a thin flat-rail slice from the middle of each state texture (same technique `KitFrame.js` already uses for the battle HUD's command window) — the caps stay at natural scale so the gold/gem ornaments never distort, and only the flat rail stretches, which is safe since it's already a straight horizontal line. Bar width is then driven by content: each row's real measured icon+label footprint (`Text.width`, not a guessed character count), with one shared width across all six rows sized to the longest label so the stack still reads as a uniform grid rather than ragged per-row widths.

### Hero HUD cards — v0.5C Tactical Hero HUD
Each hero card used to be a flat procedural rectangle (a plain background, numeric-only HP, a thin generic RP bar, three rotated-square facets) — the v0.5C handoff replaced that with the approved ornate shell art (`assets/ui/tactical_hud/hero_hud_master_a.png`, 1252×453 after cropping ~950px of transparent padding off the delivered canvas) plus real HP/RP resource icons dropped into its two circular wells.

The handoff shipped three additional "state reference" images (inactive/active/veilshift_ready) framed as lighting/color guidance, explicitly warning not to inherit their geometry drift — confirmed that drift is real before deciding how to handle it: alpha-silhouette diffing Master A against the active/inactive references measured ~20-23% differing pixels and visibly offset bounding boxes, which would have shifted the HP/RP channels and Attunement sockets between states had they been used as swap-in textures (the same failure mode the handoff's own critical rule warns about). So Master A is the *only* shell texture ever loaded, for every state — Default/Active/Inactive/Veilshift Ready are all achieved at runtime on that one texture: a multiply-tint (`HUD_INACTIVE_TINT`, a cool desaturating blue-grey — never a flat alpha fade, which the handoff explicitly calls out as reading "disabled") for Inactive, an additive gold glow rectangle behind the shell for Active/selected, and a second additive glow specifically over the Attunement-facet/ready-slot region (plus "VEILSHIFT READY" text) for Veilshift Ready — matching the handoff's own state-priority note that Veilshift Ready's treatment "wins within the Attunement and ready-slot region" while Active stays legible everywhere else. The handoff doesn't define what actually triggers Default vs. Inactive at runtime (both are "not currently selected" in its own language) — mapped against this game's real state model as: Active while a hero is actually the current `unitController.selected`, Inactive while a *different* hero is selected, Default (untreated) in the idle moment nothing is selected yet.

HP now gets a real left-to-right fill bar (previously text-only) alongside RP's existing one — "three concepts, three visual languages" still holds: HP fills crimson-red, RP fills violet-blue, Attunement stays three discrete facets rather than a third bar. Every well/bar/facet/ready-slot position is `HERO_HUD_GEOMETRY`, a set of fractions of Master A's own pixel dimensions measured directly off the shipped asset (pixel-sampled bar-track and facet-center coordinates, not eyeballed off the handoff's preview) — `_layoutHeroCard()` multiplies those fractions against whatever width a card actually renders at, so the whole layout stays correct at any viewport without re-deriving geometry, the same responsive approach every other HUD element here already uses. Low-HP gets a restrained alpha-breathe pulse (never arcade flashing, per the handoff), RP gets a brief scale-pop on an actual gain/spend rather than every refresh, and both only ever run their tween while the triggering condition is genuinely true — guarded so `refreshHUD()`'s frequent calls can't stack duplicate tweens on the same object.

Two real-device follow-ups. First, the name/title text was noticeably off-centre — `HERO_HUD_GEOMETRY.title.leftX/rightX` are each strip's own *centre* x, but the text was created with `setOrigin(0, 0.5)` (left-edge anchor), so it rendered starting *at* centre and ran off to the right of it instead of actually centring there; fixed to `setOrigin(0.5, 0.5)`.

Second, the cards were reported as covering too much of the map to see the characters — the v0.5C shell is legitimately much bigger than the old 132×58 cards, and there are three of them stacked. Heroes are also selectable straight off their own map token (`handleWorldTap()`), so the rich card doesn't have to stay permanently on screen to be usable: it's now a drawer, collapsed by default, that slides in from the left on tap. A small fixed tab (`_buildHudHandle()`) sits at the screen edge and never moves — only `heroCardsDrawer` (the three cards) slides underneath/behind it, between fully hidden and its normal position. Tapping the map while the drawer's open dismisses it without also acting on the tile underneath (`handleWorldTap()` checks `hudExpanded` before anything else and returns early). Chasing that dismiss behavior surfaced a real, separate input-timing bug: stamping `_tacticalUIHandled` on the pointerdown event alone wasn't enough to stop `handleWorldTap()` from also running on the same tap's pointerup — confirmed directly by counting `toggleHudDrawer()` calls per tap (2, not 1) — because `pointer.event` isn't reliably the same stamped object by the time `onPointerUp` checks it a beat later. A dedicated `_hudHandleJustTapped` flag, set only by the handle's own pointerdown and cleared at the end of every `onPointerUp`, doesn't depend on that stamp surviving the gap and fixed it outright.

Sprite tokens load pre-downsampled `map_icons/` copies of the character art (`assets/prismel/walk/map_icons/`, `assets/auryi/movement/map_icons/`, `assets/kineza/movement/map_icons/`), not the full battle-res source directly. Loading a 1024×1536-scale texture and letting the GPU minify it live down to a small token is a large downscale — linear-filtered minification at that ratio averages so many soft, semi-transparent edge pixels (hair, cloak fringe, ambient glow) into each screen pixel that the effective alpha visibly drops, reading as a translucent ghost rather than a small solid sprite even though every alpha/tint value in code is correct. The `map_icons` are pre-resized once (LANCZOS, offline, 260px reference content height) to keep the runtime downscale in a range a GPU linear filter handles cleanly, and every sprite token also sits on a solid accent-colored backing disc (same gold-ring language as the procedural tokens) so full-detail illustrated art has a grounded, contrasted base against the tile art instead of floating on nothing. See `CLAUDE.md`'s traps list for the full story, including a first attempt that undersized the fix.

World geometry is fixed regardless of viewport; only the camera's default zoom adapts per screen size (compact phones start zoomed out further to keep more context visible) — tying tile scale to viewport width instead would fight the camera system on every resize. See `CLAUDE.md`'s traps list for two bugs specific to this prototype's two-camera setup: `pointer.worldX`/`worldY` being ambiguous with more than one camera in the scene, and an anonymous resize listener leaking one extra registration per `scene.restart()`.

---

## Running locally

No build step. Serve over HTTP — opening the file directly breaks module imports and audio:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/battle-v2.html
```

Any static server works (`npx serve .`, `php -S localhost:8000`).

**Before every commit:**

```bash
bash pv-check.sh
```

---

## Working standards

Learned the hard way across the packages so far:

- **Zero CDN.** Phaser stays bundled at the repo root. Everything loads from relative paths.
- **Portrait phone first.** Test at 390×844 before anything else. If it fits there it fits everywhere.
- **Play one full round per hero before shipping.** Three separate bugs reached the repo that a single playthrough would have caught.
- **Valid Phaser ease names only** — `Quad.easeOut`, not `Quad.Out`. Tweens accept unknown names silently and fall back to linear; camera pans throw.
- **`scene.restart()` reuses the scene instance but destroys its game objects.** Clear cached object references at the top of `create()`.
- **Crossfading two stacked sprites:** only the top layer changes alpha. Fading both leaves a window where the subject is see-through.
- The turn indicator shows **turn state only**. Attack callouts go through the dialogue queue.
- **Combat narration waits for a real tap, not a timer.** Live playtesting (a kid at the controls) found the old fixed-hold auto-advance moved on before there was any real chance to read a line. `BattleHUD.tryAdvance()` — called by the scene's own pointerdown handling ahead of whatever else a tap would mean (e.g. "start the next round") — is the tap-to-continue gate for every queued message; a tap while a line is still typing fast-forwards to the full text and opens the same gate rather than making an impatient reader wait out the remaining per-character delay too. A speed *setting* can layer on top of this later; the default has to be "wait for the player."
- **Authored UI sheets arrive with the checkerboard painted into the pixels.** Seven of the Alpha v1.0 sheets had no alpha channel at all. Key them before use — never ship a sheet with a matte baked in.
- **Painted panel art does not nine-slice.** If the top edge carries a centred ornament, a nine-slice smears it the full width. Build frames from corner + rail pieces instead.

---

## Legacy prototypes

These still run and are preserved for reference, but they are **not** the current direction.

| File | What it is |
|---|---|
| `index.html` | **Wave-survival prototype.** The original single-file Phaser game — pick a hero, survive escalating waves, choose Resonance Shards on level-up. Self-contained; uses the `*_stable_spritesheet.png` files and `prism-of-elders.mp3`. |
| `tactical-prototype.html` | Self-contained grid tactical proof of concept with an embedded locked Prismel. |
| `restore-sound-demo.html` | Isometric "Restore Sound" encounter — restore Dogs Barking, Pool Splash and Backyard Laughter before the Hushlings eat the quiet. |
| `game.js`, `extracted.js` | Archived earlier versions of the survival code. **Not loaded by anything.** |
| `*_stable_spritesheet.png` | 48×72 sprite sheets used by the survival prototype only. |
| `README_*.txt` | Historical patch notes from the survival build. |

The survival prototype is playable at the repository root: https://jr-faulkner.github.io/Prismatic-Veil/

---

## Deployment

The repository root **is** the GitHub Pages deployment — every asset must stay at root level. The flat layout is intentional.

Module imports carry a `?v=` query that is bumped on notable deploys, because cache-busting the HTML alone leaves browsers running stale `src/*.js`.

**If a freshly-pushed page 404s on the live site:** check whether the "pages build and deployment" run for that commit is stuck in `queued` status in the Actions tab (`created_at` and `updated_at` identical, no progress after several minutes) — this is a GitHub-side stall, not a broken push; `git log` on `origin/main` will already show the commit present. GitHub refuses to manually re-run a workflow it still considers "already running" even while stuck queued, so the fix is a fresh push (any real content change) rather than a re-run attempt — a new push spins up an independent deployment run rather than trying to unstick the old one.

---

## Credits

Made by the Faulkner family.

© 2026 The Prismatic Veil
