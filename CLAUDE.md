# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game Locally

There is no build step — the game is pure static HTML/JS. Because of browser audio and CORS restrictions, you must serve files over HTTP rather than opening `index.html` directly:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works (`npx serve .`, `php -S localhost:8000`, etc.).

**Live site:** `https://jr-faulkner.github.io/Prismatic-Veil/`
Use cache-busting query params when testing deployed changes: `?v=<tagname>`

There are no automated tests, no linter config, and no package.json.

## Codebase Architecture

### Single-file design
All active game code lives **inline in `index.html`** (≈2,600 lines). The files `game.js` and `extracted.js` are older archived versions and are **not loaded or used** — do not edit them expecting changes to appear in the game.

`phaser.min.js` is the bundled Phaser 3 engine (do not modify).

### Scene flow
```
TitleScene → CharacterSelectScene → BattleScene → GameOverScene → (back to CharacterSelect)
```
All four scenes are Phaser.Scene subclasses registered in the config at the bottom of `index.html`. Scene transitions use `this.scene.start('SceneName')`.

### Global state
`gameState` is a plain JS object defined at module scope and shared across all scenes. It holds: `selectedCharacter`, `titleMusic`, `musicEnabled/sfxEnabled`, and run-persistent stats (`level`, `score`, `killCount`, `gameTime`). Per-run combat state (HP, EXP, weapons) is reset inside `BattleScene.init()` as local `this.*` properties.

### Key data tables (all at top of script, before classes)
- `CHARACTER_DATA` — base stats per hero (speed, damage, attack range, projectile speed)
- `CHARACTER_ANIM_SETS` / `CHARACTER_ANIM_RATES` — per-hero animation frame lists and framerates
- `CHARACTER_SPRITE_TUNING` / `CHARACTER_BODY_TUNING` — per-hero scale and physics body offsets
- `HERO_UI_THEMES` — per-hero HUD colors and label strings
- `WEAPON_DEFS` — weapon definitions for the survival system
- `COLORS` — shared color palette as Phaser hex integers

### Audio architecture
Two parallel audio systems:
1. **Phaser sound** — `prism-of-elders.mp3` loaded as `'title_music'`, managed via `gameState.titleMusic`. Plays through Title + CharacterSelect, fades/stops on battle start.
2. **`SoundFX` class** (`sfx` singleton) — all SFX are synthesized at runtime using the Web Audio API. No audio files for SFX. Methods like `sfx.attackKineza()`, `sfx.levelUp()`, `sfx.gem()` compose oscillator/noise layers directly.

### Sprite sheets
Each hero has two sprite sheet variants in the repo root:
- `*_spritesheet.png` — original/experimental sheets
- `*_stable_spritesheet.png` — **the active version** referenced in `SPRITE_PATHS`

Frame layout: 224×224px per frame, 14 frames per sheet — frames 0–3 idle, 4–9 walk/float, 10–13 attack.

### BattleScene internals
`BattleScene` is the bulk of the code. Key systems:
- **Weapon system** — `this.weapons` object keyed by weapon ID; each weapon fires on its own timer via `this.time.addEvent`. Weapon upgrades applied from relic cards mutate entries here.
- **Hero FX** — `this.heroFx` holds per-character visual effect containers (Prismel's crystal, Auryi's orb, Kineza's glow fists). Updated every frame in `updateHeroEffects()`.
- **Spawn/pacing** — `this.spawnInterval` decreases over time; enemy pack types escalate at 60/120/180 second phase boundaries via `this.time.delayedCall`.
- **Physics** — Phaser Arcade Physics for player, enemies, projectiles, and XP gems. All physics groups guarded with `body`-existence checks before velocity/position writes.
- **Level-up cards** — `showRelicCards()` pauses Arcade Physics world and presents 3 drawn cards; card `apply()` functions mutate `this.weapons`, `this.passives`, or player stat multipliers then call `tryEvolutions()`.

### Deployment
The repo root **is** the GitHub Pages deployment — all assets must stay at the root level. The flat layout is intentional.
