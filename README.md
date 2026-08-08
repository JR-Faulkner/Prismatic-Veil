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

**Playable now:** Prismel or Kineza versus the Veil Wraith (default) or the Hushling — art-complete and audio-complete on both sides, portrait-phone first.

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
| Criticals | 25% Prismel, 22% Kineza, 15% enemy — double damage, `CRITICAL!` callout, doubled hit stop, harder shake |
| Hit stop | 80ms scene freeze on impact, 160ms on a critical |
| Hero switch | Button on the right cycles the active hero and restarts the battle |
| Enemy switch | Button below the hero switch cycles the active enemy and restarts the battle |
| Gauntlet | Beating an enemy auto-advances to the next one in `ENEMY_ORDER`, looping back to the first after the last |
| Commands | One glyph per hero is bound to their attack. The rest are slots with nothing behind them yet — selecting one narrates and leaves the console open |

### Roster

| Hero | Pronouns | HP | Attack | Damage | Accent |
|---|---|---|---|---|---|
| **Prismel** | — | 100 | Prismatic Release | 14 | violet-blue |
| **Kineza** | he/him | 115 | Momentum Fist | 17 | kinetic green |

*Auryi, Vyan and Sarallel are designed but have no battle pose libraries yet.*

---

## Completed pose pipelines

Both heroes run the same canonical five-beat sequence. Poses crossfade through a ghost layer that stays fully opaque behind the incoming frame, so the character is never see-through mid-blend.

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

### Art standards

- PNG with a **real alpha channel** — never JPEG, never a painted-on checkerboard or white matte
- Author heroes **facing right**; enemy art faces **left**
- One scale factor per pose set, derived from the idle frame. Crouched and wide poses are legitimately shorter and must not be stretched to match

### Staged, not yet wired — `assets/prismel/walk/`

A locked six-frame Prismel walk cycle (Contact A → Down A → Passing A → Contact B → Down B → Passing B), 1024×1536 transparent PNGs, QA'd at ~9.5fps. Nothing in the current battle or tactical systems drives a locomotion cycle yet — battle poses are the five-beat sequence above, and the tactical prototype uses procedural map tokens (see below) — so these are staged for whichever future feature actually walks a hero across a screen. `prismel_walk_manifest.json` in the same folder documents frame order and baseline.

---

## Systems

### HUD — `src/BattleHUD.js`, `src/HudFrame.js`, `src/ActorPortrait.js`
Faceted crystal HP and Veil conduits with angled end caps, chip-damage ghosts trailing the live fill, a recharge wavefront distinct from the healing flash, and hairline fractures below 25%. Hero accent colours drive the fill; the Wraith uses corrupted violet styling.

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

**Two-camera architecture:** the main camera renders and zooms `scene.world`; a second camera renders `scene.uiLayer` and never moves. Without this the HUD would scale off screen during an attack. **Any new battlefield visual must register via `scene.worldAdd()`; HUD elements go on `uiLayer`.**

### Atmosphere — `src/BattleAtmosphere.js`, `src/AmbientBattlefieldDirector.js`
The battlefield backdrop is five real painted layers (`assets/battle/veil_fracture/`), stacked back to front by `AmbientBattlefieldDirector`: far background (very slow independent drift), crystal midground (camera-relative parallax, factor 0.35 — the same offset-proportional-to-camera-displacement convention `BattleAtmosphere.updateParallax()` already used), the static combat platform the fighters stand on, a fracture-energy overlay (15–20% opacity, ~4.8s pulse), and a sparse particle overlay drifting at its own independent rate. Every layer is scaled to fully cover the viewport plus a margin sized against its own motion, so drift never exposes an empty edge.

`BattleAtmosphere` still owns drifting fog banks and the foreground corner silhouettes — neither is covered by the five painted layers, so both stayed. Its old procedural backdrop gradient, light-shaft bands, floor disc, and ambient motes were removed once the real art shipped, since drawing both would double up the same visual role. Ground compression ripples and the per-hero ability-tint flashes (cool refracted highlights for Prismel, warm kinetic flashes for Kineza) are unchanged.

### Battle Presence FX — `src/BattleFXDirector.js`
Prismel's attack (`fxVersion: 'v2'` in `BattleConfig.js`) routes its charge/projectile/impact/residual visuals through this director instead of `BattleFX`'s own `gather()`/`beam()`/`impact()` — Kineza keeps his original BattleFX-driven identity untouched. Six small procedural layer concepts (particle, mist, ribbon, distortion, residual, environmental overlay) back a four-call public API (`playChargeFX`/`playProjectileFX`/`playImpactFX`/`playResidualFX`, plus `clearResidualFX`/`clearAll`). It never touches camera, hit-stop, damage, sequencing, or audio — those calls stay explicit in `BattleController`, the same way `BattleFeel` owns them everywhere else. Residual FX are tracked per-target so a round that ends early still cleans up completely before the next one starts.

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

## Tactical Field prototype (standalone)

**`tactical-field-v2.html`** — a separate, self-contained engineering prototype for a Shining Force-style tactical battle: a 12×10 grid, weighted pathfinding, barriers and difficult terrain, line of sight, camera pan/zoom, and cinematic attacks that hand off to a close-up cut-in and return to the exact tactical state. **Not merged into the main battle flow** — it shares nothing at runtime with `battle-v2.html` beyond `phaser.min.js` and some portrait art, by design, per the brief this was built against.

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
  TacticalScene.js                  phase sequencing, objectives, enemy AI, HUD
```

Three heroes (Prismel, Auryi, Kineza) and two enemy types (Hushling ×3, Veil Wraith ×1) restore three silenced sound nodes to win; defeating every enemy is optional. Map tokens are procedural (accent-colored circle + initials) rather than photo art — the project's legacy 48×72 pixel spritesheets read as low quality at any scale, and the full battle-art PNGs are the wrong shape for a small marker. The real portrait art (`assets/ui/portrait_*.png`) is reserved for `BattleCinematic`'s close-up cut-in, where detail matters — the same "tactical map sprite → zoomed battle sprite" pairing shown in this project's own reference art.

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
