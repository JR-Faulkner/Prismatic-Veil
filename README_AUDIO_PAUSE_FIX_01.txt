PRISMATIC VEIL - AUDIO + PAUSE FIX 01

Fixes:
- Title/menu music now plays through Title Screen and Character Select.
- Title/menu music fades out ONLY when selecting a hero and entering Battle.
- Battle stays quiet for now until separate battle music is added.
- Level-up / power selection menu now pauses Arcade Physics.
- Enemies/projectiles/gems should stop moving while relic cards are on screen.
- Added tiny build stamp on the title screen: AUDIO/PAUSE FIX 01.

Upload/replace these root files:
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
https://jr-faulkner.github.io/Prismatic-Veil/?v=audiopause01

Expected:
- Tap title: music starts.
- Character select: same menu music keeps playing.
- Select hero: music fades out.
- Battle: no title music.
- Relic card/power selection: game action freezes until a card is picked.
