PRISMATIC VEIL - MOBILE CRISP SPRITE FIX

This version targets the issue seen on phone:
- removes baked white/gray checkerboard blocks from sprite sheets
- keeps sprite cells transparent
- stabilizes Prismel/Kineza/Auryi frame placement
- adds CSS pixel-art rendering for the game canvas
- keeps the flat GitHub repo layout

Replace these files in the repo root:
index.html
prismel_spritesheet.png
kineza_spritesheet.png
auryi_spritesheet.png
all_sprites_preview.png

Leave phaser.min.js where it is.

Test after GitHub finishes publishing:
https://jr-faulkner.github.io/prismatic-veil/?v=mobilecrisp1

If the browser still shows old art, bump the cache buster:
?v=mobilecrisp2
