PRISMATIC VEIL - MASTER SHEET REBUILD

This rebuild uses the larger master sheets for all three heroes.
It standardizes the game-ready sprite strips without crushing them down to 64x64.

Replace these repo-root files:
- index.html
- prismel_spritesheet.png
- kineza_spritesheet.png
- auryi_spritesheet.png
- all_sprites_preview.png

Leave phaser.min.js in place.

This build uses 224x224 sprite frames and tuned per-character scale.
Game mapping:
- Frames 0-3: idle
- Frames 4-9: movement
- Frames 10-13: attack

Cache-buster test URL:
https://jr-faulkner.github.io/prismatic-veil/?v=mastersheet1
