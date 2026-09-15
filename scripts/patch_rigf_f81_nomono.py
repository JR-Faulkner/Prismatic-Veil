from pathlib import Path

p=Path('mugen-lab/rig-f7.html')
s=p.read_text()

# Version / presentation.
s=s.replace('MobMugen · Rig F · F8.0','MobMugen · Rig F · F8.1')
s=s.replace('MOBMUGEN · RIG F · F8.0','MOBMUGEN · RIG F · F8.1')
s=s.replace('Rig F · F8.0','Rig F · F8.1')
s=s.replace('F8.0 witness log','F8.1 witness log')
s=s.replace('WASM JIT · PERF + INPUT','WASM JIT · PERF + INPUT · NO MONO')

# Suppress Wine Mono/Gecko installation prompts through BoxedWine's supported
# env parameter. getEnvProp() expects a quoted KEY:value pair and forwards it
# to the emulator as -env "KEY=value". Keep the semicolon literal because
# getEnvProp() does not URL-decode the value after splitting KEY:value.
old="function buildParams(){const work=exeDir?'d:/'+exeDir:'d:/';return ['root=TinyCore15Wine3.1','p=d%3A%5CWinMugen%5CWinmugen.exe','w='+work,'auto=true','sound=false','bpp=16','storage=memory'].join('&')}"
new="function buildParams(){const work=exeDir?'d:/'+exeDir:'d:/';return ['root=TinyCore15Wine3.1','env=%22WINEDLLOVERRIDES:mscoree=d;mshtml=d%22','p=d%3A%5CWinMugen%5CWinmugen.exe','w='+work,'auto=true','sound=false','bpp=16','storage=memory'].join('&')}"
if old not in s:
    raise SystemExit('F8.1 buildParams patch point not found')
s=s.replace(old,new,1)

# Update F8 trace identity while preserving the proven runtime stack.
s=s.replace('F8.0 ROOT · same-origin TinyCore15Wine3.1 · overlay=NONE','F8.1 ROOT · same-origin TinyCore15Wine3.1 · overlay=NONE')
s=s.replace('RIGF F8.0: DIRECT ZIP STREAM BEGIN','RIGF F8.1: DIRECT ZIP STREAM BEGIN')
s=s.replace('RIGF F8.0: STREAM ','RIGF F8.1: STREAM ')
s=s.replace('RIGF F8.0: DIRECT ZIP STREAM READY','RIGF F8.1: DIRECT ZIP STREAM READY')
s=s.replace('RIGF F8.0: LOCAL ROOT BEGIN','RIGF F8.1: LOCAL ROOT BEGIN')
s=s.replace('RIGF F8.0: LOCAL ROOT READY','RIGF F8.1: LOCAL ROOT READY')
s=s.replace('RIGF F8.0: LOCAL ROOT ERROR','RIGF F8.1: LOCAL ROOT ERROR')
s=s.replace("log('F8.0 INPUT · '+code+' · targets='+delivered+(ack?' · SDL ACK ✓':' · DOM ONLY'));", "log('F8.1 INPUT · '+code+' · targets='+delivered+(ack?' · SDL ACK ✓':' · DOM ONLY'));")
s=s.replace("log('F8.0 FIRST FRAME CHANGE · JIT VIDEO LIVE');log('F8.0 PERF WITNESS · RAF badge measures browser scheduler; INPUT badge becomes SDL✓ when BoxedWine consumes a synthetic key event')", "log('F8.1 FIRST FRAME CHANGE · JIT VIDEO LIVE');log('F8.1 MONO SUPPRESS · WINEDLLOVERRIDES=mscoree=d;mshtml=d');log('F8.1 PERF WITNESS · RAF badge measures browser scheduler; INPUT badge becomes SDL✓ when BoxedWine consumes a synthetic key event')")
s=s.replace("const text='MOBMUGEN · RIG F · F8.0\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F8.1\\nRUNTIME STATUS")

# Update setup copy so the witness goal is obvious on-phone.
s=s.replace('F8 keeps the proven modern BoxedWine WASM JIT + local Wine 3.1 boot path, adds live scheduler telemetry, and witnesses whether touch/gamepad key events are consumed by the Emscripten SDL keyboard bridge.', 'F8.1 keeps the proven JIT + Wine 3.1 path, suppresses Wine Mono/Gecko installer prompts, and preserves the live performance + SDL input witness.')

p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
heading='## Rig F F8.1 - suppress Wine Mono prompt'
if heading not in t:
    t += '''\n\n## Rig F F8.1 - suppress Wine Mono prompt\n- F8.0 proved the modern JIT path still renders WinMUGEN and showed a Wine Mono Installer dialog before user interaction.\n- WinMUGEN does not require Mono/.NET for this boot path, so F8.1 passes WINEDLLOVERRIDES=mscoree=d;mshtml=d through BoxedWine's supported env parameter to suppress Mono/Gecko installation prompts.\n- The proven TinyCore15Wine3.1 same-origin root, 259-file stream, audio-off setting, RAF witness, and SDL input witness remain unchanged.\n- Expected trace includes the env parameter and F8.1 MONO SUPPRESS after first frame.\n'''
    d.write_text(t)

print('F8.1 Mono suppression patch applied')
