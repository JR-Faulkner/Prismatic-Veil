PRISMATIC VEIL - AUDIO + LEVEL CARD VISIBILITY PASS 01

Fixes/changes:
- Title music now fades out and stops when leaving title screen.
- No title music should play during character select or battle.
- Replaced simple boop/beep SFX with grittier retro-inspired Web Audio layers.
- First level-up happens much sooner so the Prismatic Relic Cards are easy to see.
- EXP gems now pull from farther away and give more resonance.
- Added a temporary prototype helper: tap the LV badge in the first 12 seconds to force-open the relic card menu for testing.

Replace/add these root files:
index.html
title_screen.jpg
prism-of-elders.mp3
prismel_spritesheet.png
kineza_spritesheet.png
auryi_spritesheet.png
all_sprites_preview.png
prismel_portrait.png
kineza_portrait.png
auryi_portrait.png
prismel_full.png
kineza_full.png
auryi_full.png

Leave phaser.min.js as-is.

Test:
https://jr-faulkner.github.io/Prismatic-Veil/?v=audiolevel01
