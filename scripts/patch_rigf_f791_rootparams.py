from pathlib import Path

p=Path('mugen-lab/rig-f7.html')
s=p.read_text()

# Version labels.
s=s.replace('MobMugen · Rig F · F7.9','MobMugen · Rig F · F7.9.1')
s=s.replace('MOBMUGEN · RIG F · F7.9','MOBMUGEN · RIG F · F7.9.1')
s=s.replace('Rig F · F7.9','Rig F · F7.9.1')
s=s.replace('F7.9 witness log','F7.9.1 witness log')
s=s.replace('WASM JIT · WINE 3.1','WASM JIT · WINE 3.1 PARAMS')

# Force the actual modern shell config and params, not just witness text.
old_root="const ROOT_BASE='./assets/'"
if old_root in s:
    s=s.replace(old_root,"const ROOT_BASE='https://boxedwine.org/v2/2/'")

old="function buildParams(){const work=exeDir?'d:/'+exeDir:'d:/';return ['root=fullWine1.7.55-v8','overlay=wine1.7.55-v8-min-online','p=d%3A%5CWinMugen%5CWinmugen.exe','w='+work,'auto=true','sound=false','bpp=16','storage=memory'].join('&')}"
new="function buildParams(){const work=exeDir?'d:/'+exeDir:'d:/';return ['root=TinyCore15Wine3.1','p=d%3A%5CWinMugen%5CWinmugen.exe','w='+work,'auto=true','sound=false','bpp=16','storage=memory'].join('&')}"
if old not in s:
    raise SystemExit('F7.9.1 buildParams patch point not found')
s=s.replace(old,new)

# Remove legacy overlay defaults if any survive in runtime strings.
s=s.replace("cfg.locateOverlayBaseUrl=OVERLAY_BASE;","cfg.locateOverlayBaseUrl='';")

# Make the real config transition visible.
s=s.replace("log('F7.9 ROOT · TinyCore15Wine3.1.zip · BoxedWine official');", "log('F7.9.1 ROOT PARAMS · root=TinyCore15Wine3.1 · overlay=NONE');")
s=s.replace("const text='MOBMUGEN · RIG F · F7.9\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.9.1\\nRUNTIME STATUS")

p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
heading='## Rig F F7.9.1 - repair actual Wine 3.1 runtime params'
if heading not in t:
    t += '''\n\n## Rig F F7.9.1 - repair actual Wine 3.1 runtime params\n- Phone witness proved F7.9 labels changed but the actual runtime URL params still requested fullWine1.7.55-v8 plus the legacy overlay.\n- F7.9.1 replaces buildParams directly with root=TinyCore15Wine3.1 and no overlay parameter.\n- ROOT_BASE is forced to https://boxedwine.org/v2/2/ and locateOverlayBaseUrl is blanked.\n- JIT core, direct 259-file D: stream and drive-qualified WinMUGEN path stay unchanged.\n'''
    d.write_text(t)
print('F7.9.1 root params repaired')
