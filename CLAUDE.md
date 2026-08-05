# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

Read `README.md` first — it is the source of truth for what the project currently is. This file covers the working practices and the traps.

## What is active

The live work is the **stage battle**: `battle-v2.html` plus `src/*.js` (ES modules) and `assets/`.

The wave-survival game in `index.html` is a **legacy prototype**. It still runs and is preserved deliberately, but it is not the current direction. Do not assume a change to `index.html` affects the battle, or vice versa — they share only `phaser.min.js` and the repo root.

## Running locally

No build step, no package.json, no tests, no linter. Serve over HTTP — opening the file directly breaks ES module imports and audio:

```bash
python3 -m http.server 8000
# battle:   http://localhost:8000/battle-v2.html
# survival: http://localhost:8000/
```

**Live:** `https://jr-faulkner.github.io/Prismatic-Veil/battle-v2.html`

## Required: run the check before every commit

```bash
bash pv-check.sh
```

It must pass before pushing. It catches JS syntax errors in `index.html`'s inline script, duplicate top-level data-table declarations, and unresolved merge markers. A pre-commit hook runs it, but call it manually after resolving conflicts, since those happen outside `git commit`.

Also syntax-check the battle modules, which `pv-check.sh` does not cover:

```bash
for f in src/*.js; do node --check "$f" || break; done
```

---

## Battle architecture (`battle-v2.html` + `src/`)

Scene root is `VeilBattleScene`. See the README file map for what each module does.

### Two render layers, two cameras

This is the single most important structural fact:

- `scene.world` — combatants, FX, damage numbers, atmosphere. The **main camera** renders and zooms this.
- `scene.uiLayer` — HUD, dialogue, frame, titles. A **second camera** (`scene.uiCam`) renders it and never moves.

Attacks push the camera to 1.55×. Without the split, the HUD would scale off screen.

**Any new battlefield visual must go through `scene.worldAdd(obj)`. Any new HUD element goes on `uiLayer`.** Miss this and the object renders on both cameras — doubled and unzoomed.

### Data-driven roster

`src/BattleConfig.js` holds heroes and the enemy. A character is config, not code:

```
name, hp, maxHp, portrait
poses      { idle, step, gather, release, recover }  texture keys
posePath   directory those textures load from
flip       per-pose horizontal flip (legacy sets only)
scaleMul   per-hero size correction for differently framed art
accent     bar fill and frame colour
accentAlt  secondary accent, glints and etching
frameStyle 'diamond' | 'forged'
damageStyle 'refraction' | 'slam'
attack     { name, damage, flavor, critChance, critMultiplier }
frameColourway  portrait frame family: 'blue' | 'teal' | 'violet'
commands   console glyph row. Exactly one entry is bound to the attack;
           the rest carry `locked: true` and only narrate when tapped.
```

Adding a hero means adding an entry plus their pose PNGs. New frame or damage styles are a small switch case each.

### Enemy roster (`src/EnemyCatalog.js`, `src/EnemyViewFactory.js`)

The enemy side mirrors this. `selectEnemy(baseEnemy, search)` reads `?enemy=` off the URL once at battle start and returns either the base Wraith (from `BattleConfig.js`) or an overlay entry (`id`, `viewId`, `audioBank`, `name`, `hp`, `portrait`, `accent`, `frameColourway`, `attack`). `EnemyViewFactory.createEnemyView()` maps `viewId` to a view class. Every enemy view implements the same interface — `container`, `sprite`, `layout()`, `setPose()`, `introSlide()`, `hit()`, `attack()`, `die()`, `reset()` — so `BattleController`, `BattleFX`, `TargetReticle` and `BattleHUD` are written against that interface and never branch on which enemy is active. Adding an enemy means an `EnemyCatalog` entry, a view class with that interface, an `EnemyAudioDirector` bank, and the pose PNGs — no changes to the files that already work generically.

Enemy audio is a **separate, non-fallback system** (`src/EnemyAudioDirector.js`): `BattleController` emits `PLAY_ENEMY_RELEASE` / `_IMPACT` / `_HURT` / `_DEFEAT`, distinct from the hero's own `PLAY_RELEASE` / `PLAY_IMPACT`, specifically so the two can never resolve through the same map. A missing enemy cue is silence, not a borrowed hero clip — enforced by having no shared code path between them at all, not by a guard that could be skipped.

### Round flow

`BattleController` runs one full side at a time, alternating. The enemy acts **only** on its own round — never auto-chain the two. `POSE_TIMING` holds the canonical beat lengths (scheduling); `AUDIO_EVENTS` are emitted as scene events and mapped to per-hero sound banks in the scene. The impact schedule step reads its length from `BattleFeel.getHitStopMs(critical)` (58/92ms) rather than the old fixed `POSE_TIMING.hitStop` — the schedule and the actual freeze duration are one source of truth as of v33.

The player's round is driven by the command console, not a bare tap, and follows the Alpha v1.0 flow: portrait synchronizes → console opens → glyph selected → reticle seeks and locks → cinematic → feedback → HP chip → hand over. The enemy's round still advances on a tap.

The Veil conduit dips on a command and recharges by the next round. **It gates nothing** — it is a readout, not a resource. Making it a real cost is a later mechanic.

**`BattleFeel` (`src/BattleFeel.js`) is the sole owner of hit stop and camera shake — both directions, both heroes.** It centralizes what used to be scattered `battleCam.hitShake()` / `scene.hitStop()` calls so a normal hit and a critical always land with the same tuned weight (58ms / 92ms hit stop) regardless of which hero or which side is hitting. `scene.hitStop()` supports deadline extension — calling it again while already stopped pushes the deadline out rather than starting a second freeze — specifically so a critical that follows a normal impact within the same beat (`fx.impact()` then `fx.critical()`, back to back, same frame) escalates the existing freeze instead of stacking a muddy second one. **Nothing else may call `hitShake()` or `hitStop()` directly** — a second call on top of `BattleFeel`'s doesn't error, it just silently stretches the freeze back out to whatever the old caller asked for and undoes the tuning. This bit once already: a DAI package added `BattleFeel` and wired it into `BattleFX`, but `BattleController` — not included in that package — still had its own `cam.hitShake(hit.crit)` and `scene.hitStop(...)` calls sitting right next to the new ones.

---

## Traps that have already bitten

Every one of these reached the repo and had to be fixed. Do not repeat them.

**Phaser ease names.** Use `Quad.easeOut`, `Sine.easeInOut`, `Back.easeOut`. The short forms — `Quad.Out`, `Sine.Out`, `Expo.Out` — do **not** exist in this build. Tweens accept an unknown name silently and fall back to linear, so a whole game's worth of easing can quietly do nothing; camera `pan`/`zoomTo` throw outright. Thirty invalid names were found in one sweep.

**`scene.restart()` reuses the scene instance but destroys its game objects.** Anything cached on `this` across a restart becomes a dead reference. Clear cached object references at the top of `create()`. The hero switch calls `restart()`, so this path is exercised constantly.

**Crossfading two stacked sprites.** Only the **top** layer changes alpha; the bottom stays fully opaque as a backing plate. Fading both leaves a window where the subject is see-through — and hit stop freezes tweens, so that window can sit on screen for hundreds of milliseconds.

**Killing tweens mid-transition.** `killTweensOf` must run *before* creating the tweens for the new state, never after.

**One AudioContext per page.** Browsers cap live contexts at a handful. Anything constructed per scene-restart must share, not open its own.

**Pose scaling.** One scale factor per hero, derived from the idle frame. Fitting every pose to the same screen height blows up crouched or wide poses — they are legitimately shorter.

**Authored UI sheets ship fake transparency.** Seven of the eight Alpha v1.0 sheets were RGB with the transparency checkerboard painted into the pixels — light on the frame sheets, dark on the feedback and targeting sheets. Always check the mode and alpha range before slicing, and key the background out (edge flood fill + trapped-pocket removal + graded alpha) rather than thresholding.

**Painted panel art does not nine-slice.** Sheet 04A's command window carries a centred gem on its top and bottom edges; a nine-slice stretches that gem the whole width and a straight scale squashes the corners. Frames are built from `KitFrame` — one corner slice flipped four ways plus a stretchable rail.

**Chained setters must return `this`.** `ActorPortrait.setSize()` returned undefined and `setSize(n).setPosition(x, y)` threw on boot. Anything meant to chain has to say so.

**The target reticle goes *behind* the enemy.** Its centre gem lands on the Wraith's chest otherwise. Depth 16, under the enemy container's 18 — the kit's own note asks that it frame the target without covering it.

**`compact = width < 560` alone is not a landscape check.** A landscape phone is ~390px tall, which that condition never catches (844px wide easily clears 560). `EnemyWraithView` and `HeroPoseView` both sized and positioned themselves off pre-landscape formulas this way — the Wraith's math put its sprite top 58px *above* y=0. Any layout function keyed on screen size needs its own `landscape = width > height` branch, not a reuse of the portrait/compact split.

**A deferred tween's `onComplete` can destroy an object twice.** `scene.restart()` tears down the display list, but the tween manager survives it and keeps ticking. A fade-out queued a moment before a hero switch can have its `onComplete` fire against an object Phaser's own restart sweep is *simultaneously* destroying — two independent paths racing for the same object, neither aware of the other. Checking `obj.scene` first does not reliably win that race. Wrap the destroy call itself in try/catch (`BattleFeedback._destroy`, `VeilBattleScene._destroyIfAlive`) rather than trying to prove the object is still alive beforehand.

**A sprite's bounding-box centre is not its visual centre.** The Wraith's art carries a gem spike above its head, so true vertical mid-height of the sprite lands on its eye line, not its chest — the target reticle's centre gem sat right over its face until the anchor was dropped to 40% up from the feet instead of 50%. Don't assume `displayHeight * 0.5` is "the middle of the character." (v32 sidesteps this whole class of bug for the reticle specifically — see below.)

**A fixed pixel offset tied to another element's size breaks when that element's size changes.** v32 replaced the reticle's baked center gem with a hollow procedural rig (four corner brackets, no center at all) specifically so nothing could ever sit on the Wraith's face again. But `BattleFX.critical()`'s `CRIT` label still positioned itself at a hard-coded `p.y - 70`, sized for the *old* reticle's larger radius — against the new, smaller hollow rig, that fixed offset landed the label back on the eyes through a completely different code path than the one that had just been fixed. The label now reads `reticle.radius` at draw time instead of assuming a constant. Any two elements meant to stay clear of each other need to reference each other's actual current size, not a number tuned for whatever the other one used to be.

**"Functionally identical to what you sent, not re-included" needs to actually be true.** After the v32 pass, FAI's return bundle described `VeilBattleScene.js` as a version-bump-only file and left it out of the returned source. It wasn't identical — the reticle-asset preload cleanup from that same pass was real content, just not called out. DAI's v33 package was built from that description, reverted three lines back to preloading PNGs that no longer exist in the repo (the ones the cleanup had just deleted), and shipped it as a `PASS` in static verification, because static checks can't know a file changed if the return bundle claims it didn't. If a file changes for *any* reason during a pass, it goes back in the return bundle, full stop — "just a version bump" is a claim the next package's author has no way to verify.

**A new enemy needs to match the *current* animation language, not just have one.** The Hushling arrived with a three-cycle hit-recoil vibration — the exact pattern v32 spent a whole pass replacing on the Wraith with one compression/recoil/settle beat. Both enemies now share the same one-beat shape, sized to each one's own weight (bigger shove, slower settle for the heavier silhouette) rather than copying the Wraith's numbers outright. When a second instance of something arrives, check it against the standard the first instance was already corrected to, not just against whether it works.

**A full rewrite of a working file can silently drop a fix that isn't visible in a diff of the new behavior.** The v34 art pass rewrote both enemy views from scratch to support the new full-fidelity sprites, and along the way quietly went back to a hard-cut texture swap on pose changes — no ghost layer, no crossfade. Nothing about it looked wrong in isolation; it only matters because of the exact trap already documented above ("Crossfading two stacked sprites") and hit once already on the hero's own pose view. Restored the same fully-opaque-ghost pattern on both enemy views, verified by sampling `sprite.alpha + ghost.alpha * (1 - sprite.alpha)` every 20ms across a full round — combined opacity never dropped below 1.0. When a package rewrites a file wholesale rather than diffing it, check the rewrite against every trap on this list, not just against whatever the brief asked for — the brief won't mention a regression its own author didn't know was a regression.

**`scene.sound` is not one of the objects a restart destroys.** Switching heroes calls `scene.restart()`, and `create()` runs `this.sound.add('battle_music', ...)` again — but the previous instance was never stopped, so two loops layer on top of each other. Call `this.sound.stopAll(); this.sound.removeAll();` at the top of `create()`, same as the other restart-survivor caches.

---

## Standards

- **Zero CDN.** Phaser stays bundled at the repo root; everything loads from relative paths.
- **Portrait phone first.** Verify at 390×844 before anything else.
- **Play one full round per hero before shipping.** Three separate bugs reached the repo that a single playthrough would have caught.
- **Art:** PNG with a real alpha channel. Never JPEG, never a painted-on checkerboard or white matte. Heroes authored facing **right**, enemies facing **left**.
- **Battle wording is fixed:** `<name> uses <attack>!` then `<target> is hit for <n> damage!` (player) or `<target> suffers <n> damage!` (enemy).
- The turn indicator shows **turn state only**. Attack callouts go through the dialogue queue.
- **No speaker portrait box.** Combat narration is a single compact line; the acting portrait lives in the HUD, not in the dialogue.
- **Touch targets clear 44px** even when the glyph renders smaller — set an explicit hit area, don't rely on the sprite bounds.
- Bump the `?v=` on `src/*.js` imports for notable deploys — cache-busting the HTML alone leaves browsers on stale modules.

---

## Legacy survival prototype (`index.html`)

Kept for reference. All of its code is inline in `index.html` (≈2,600 lines); `game.js` and `extracted.js` are older archived copies and are **not loaded**.

- Scene flow: `TitleScene → CharacterSelectScene → BattleScene → GameOverScene`
- `gameState` at module scope holds `selectedCharacter`, `titleMusic`, audio toggles and run stats
- Data tables at the top of the script: `CHARACTER_DATA`, `CHARACTER_ANIM_SETS`/`RATES`, `CHARACTER_SPRITE_TUNING`/`BODY_TUNING`, `HERO_UI_THEMES`, `WEAPON_DEFS`, `COLORS`
- Audio: `prism-of-elders.mp3` as title music, plus a `SoundFX` singleton synthesising all SFX via Web Audio
- Sprites: `*_stable_spritesheet.png` are the active sheets — 48×72 per frame, 14 frames (672×72), frames 0–3 idle, 4–9 walk, 10–13 attack

Note that its `BattleScene` class name collides with the battle project's scene, which is why the new one is `VeilBattleScene`.

## Deployment

The repo root **is** the GitHub Pages deployment — all assets must stay at root level. The flat layout is intentional.
