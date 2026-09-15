from pathlib import Path

p = Path('mugen-lab/rig-f7.html')
s = p.read_text()

# Version / witness labels.
s = s.replace('MobMugen · Rig F · F7.8', 'MobMugen · Rig F · F7.9')
s = s.replace('MOBMUGEN · RIG F · F7.8', 'MOBMUGEN · RIG F · F7.9')
s = s.replace('Rig F · F7.8', 'Rig F · F7.9')
s = s.replace('F7.8 witness log', 'F7.9 witness log')
s = s.replace('WASM JIT · FULL EXE PATH', 'WASM JIT · WINE 3.1')

# Move the modern BoxedWine JIT core to an officially supported BoxedWine filesystem.
# Wine 3.1 is intentionally the first compatibility step because it is the oldest
# currently listed package and is much closer to WinMUGEN's era than Wine 11.
s = s.replace("const ROOT_BASE='./assets/'", "const ROOT_BASE='https://boxedwine.org/v2/2/'")
s = s.replace('fullWine1.7.55-v8.zip', 'TinyCore15Wine3.1.zip')

# The old 1.7.55 ExeBrowser overlay is not compatible with the modern TinyCore root.
# Remove it from URL parameters and any literal config/trace remnants.
s = s.replace('&overlay=wine1.7.55-v8-min-online.zip', '')
s = s.replace('overlay=wine1.7.55-v8-min-online.zip&', '')
s = s.replace('overlay=wine1.7.55-v8-min-online.zip', 'overlay=')

# Make the root transition unmistakable in phone traces.
s = s.replace("log('F7.8 PROGRAM PATH · d:\\\\WinMugen\\\\Winmugen.exe');", "log('F7.9 ROOT · TinyCore15Wine3.1.zip · BoxedWine official');log('F7.9 PROGRAM PATH · d:\\\\WinMugen\\\\Winmugen.exe');")

# Ensure copied trace identifies F7.9 even if older copied-text literal survived.
s = s.replace("const text='MOBMUGEN · RIG F · F7.8\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.9\\nRUNTIME STATUS")

p.write_text(s)

# Continuity.
d = Path('docs/MOBMUGEN_LIVE.md')
t = d.read_text()
heading = '## Rig F F7.9 - BoxedWine official Wine 3.1 root'
if heading not in t:
    t += '''\n\n## Rig F F7.9 - BoxedWine official Wine 3.1 root\n- F7.8 proved the modern JIT core can mount D:, locate D:\\WinMugen\\Winmugen.exe, and hand the actual executable to Wine.\n- F7.8 then failed in the legacy Wine 1.7.55 layer with repeated InitCommonControlsEx aborts and c0000005 during main EXE initialization.\n- F7.9 preserves the 259-file direct ZIP streamer, modern WASM JIT core, D: mount, and drive-qualified WinMUGEN launch path.\n- Root changes to BoxedWine's official TinyCore15Wine3.1.zip package from https://boxedwine.org/v2/2/.\n- Legacy wine1.7.55-v8-min-online.zip overlay is removed for this branch.\n- If the remote root is blocked by browser CORS, the next task is same-origin packaging/proxying rather than changing WinMUGEN payload logic.\n'''
    d.write_text(t)

print('F7.9 Wine 3.1 root patch applied')
