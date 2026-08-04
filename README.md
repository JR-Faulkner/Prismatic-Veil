# The Prismatic Veil

A family JRPG built with Phaser 3 — no build tools, no bundler, no CDN. Everything is served straight from this repository.

**▶ Play the battle: https://jr-faulkner.github.io/Prismatic-Veil/battle-v2.html**

> Add a cache-busting query when testing a fresh deploy: `battle-v2.html?v=26`

---

## What this project is now

The current work is a **stage battle** in the Shining Force tradition: a hero on the left facing an enemy on the right, turn-based rounds, typed battle dialogue, and cinematic attacks with camera work and hit stop.

`battle-v2.html` is the live build and the thing to look at. The older wave-survival game still lives here and still runs, but it is a **legacy prototype** — see [Legacy prototypes](#legacy-prototypes).

---

## Battle system status

**Playable now:** Prismel or Kineza versus the Veil Wraith — art-complete and audio-complete on both sides, portrait-phone first.

### Round flow

Rounds alternate one full side at a time. The enemy acts **only** on its own round; there is no auto-chained sequence. Counter attacks and interruption moves are planned as their own mechanic later.

```
Battle opens with a right-to-left stage sweep
  ↓
PLAYER ROUND   (tap to run)
  Idle → Step 220ms → Gather 450ms → Hold 120ms
       → Release 160ms → Hit Stop 80ms → Recover 260ms → Idle
  ↓
ENEMY ROUND    (tap to run)
  Wraith lunges, hero takes damage
  ↓
repeat until the Wraith shatters → victory → battle resets
```

### Combat

| | |
|---|---|
| Damage wording | `<name> uses <attack>!` → `<target> is hit for <n> damage!` (player) / `<target> suffers <n> damage!` (enemy) |
| Criticals | 25% Prismel, 22% Kineza, 15% enemy — double damage, `CRITICAL!` callout, doubled hit stop, harder shake |
| Hit stop | 80ms scene freeze on impact, 160ms on a critical |
| Hero switch | Button on the right cycles the active hero and restarts the battle |

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

---

## Systems

### HUD — `src/BattleHUD.js`, `src/HudFrame.js`
Faceted crystal HP bars with angled end caps, chip-damage ghosts trailing the live fill, healing flash, and hairline fractures below 25%. Hero accent colours drive the fill; the Wraith uses corrupted violet styling. Typed dialogue in a nine-slice frame with a blinking continue crystal, a speaker plate with hero-specific portrait frames (Prismel diamond + rainbow glint, Kineza forged plate + momentum lines), and a Veil border with crystal corners that pulses on gather, flares gold on criticals and blooms on victory. A danger vignette creeps in below 25% HP.

### Audio — `src/UiAudio.js`, `assets/sfx/`
Six battle hooks (`PLAY_STEP` / `GATHER` / `RELEASE` / `IMPACT` / `RECOVER` / `VICTORY`) emitted as scene events and mapped to **per-hero sound banks**. Prismel's set is crystalline; Kineza's seven clips are kinetic, with a debris accent 36ms behind his impact. UI cues (turn start, low HP, victory, confirm) are **synthesised at runtime** with the Web Audio API — no files, nothing to cache-bust. `prismcharge.mp3` loops as the battle theme.

### Camera — `src/BattleCamera.js`
Right-to-left entrance sweep, gather push to 1.32×, release snap to 1.55×, hit shake, eased recover, slow victory pull-out, and a continuous 1–2px idle breath that suppresses itself whenever a pan or zoom is active.

**Two-camera architecture:** the main camera renders and zooms `scene.world`; a second camera renders `scene.uiLayer` and never moves. Without this the HUD would scale off screen during an attack. **Any new battlefield visual must register via `scene.worldAdd()`; HUD elements go on `uiLayer`.**

### Atmosphere — `src/BattleAtmosphere.js`
Gradient backdrop, distant Veil light bands, drifting fog banks, an elliptical floor with perspective rings, ambient motes and foreground silhouettes — all on parallax layers that drift against the camera at different rates. Ground compression ripples spread beneath a fighter on footfalls and impacts. Abilities briefly tint the scene: cool refracted highlights for Prismel, warm kinetic flashes for Kineza.

### Enemy — `src/EnemyWraithView.js`, `assets/enemy/veil_wraith/`
The Veil Wraith is texture-driven with four crossfaded poses — Idle, Attack, Hit, Shatter. It hovers, recoils with an eye flare when struck, lunges on its own round, shatters on death and reforms on reset.

---

## File map

```
battle-v2.html              ← the live battle. Start here.
phaser.min.js               bundled Phaser 3.70 (do not modify, no CDN)
prismcharge.mp3             battle theme

src/                        all battle code, ES modules
  VeilBattleScene.js        scene root: preload, layers, cameras, hero switch
  BattleController.js       round flow, pose timings, audio events, crits
  BattleConfig.js           hero roster + enemy: stats, poses, accents, attacks
  HeroPoseView.js           hero pose set, crossfade, idle signature
  EnemyWraithView.js        Veil Wraith poses and reactions
  BattleHUD.js              HP bars, dialogue, speaker plate, portrait frames
  HudFrame.js               Veil border, crystal corners, vignette, flares
  BattleFX.js               per-hero attack FX, target reticle, crit, victory
  BattleAtmosphere.js       parallax layers, fog, floor, motes, ripples
  BattleCamera.js           entrance sweep, pushes, shake, breath, pull-out
  UiAudio.js                synthesised UI cues (Web Audio)
  Timeline.js               stepped playback helper
  VeilFracture.js           veil flash / fade

assets/
  poses/                    Prismel's five locked poses
  poses/kineza/             Kineza's five locked poses
  enemy/veil_wraith/        Wraith Idle / Attack / Hit / Shatter
  ui/                       dialog frame, speaker plate, continue crystal,
                            hero portrait crops
  sfx/                      Prismel + shared battle SFX
  sfx/kineza/               Kineza's seven kinetic clips
  prismel_locked.png        locked full-body reference art

pv-check.sh                 pre-commit check — run before every commit
CLAUDE.md                   working notes and standards for AI collaborators
```

### Documentation

Design specs and per-package handoffs are exchanged as zip packages rather than committed here. The standards they established are summarised in `CLAUDE.md` and in [Working standards](#working-standards) below.

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

---

## Credits

Made by the Faulkner family.

© 2026 The Prismatic Veil
