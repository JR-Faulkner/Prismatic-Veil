from pathlib import Path
import re
p=Path('mugen-lab/rig-f7.html')
s=p.read_text()
s=s.replace('MobMugen · Rig F · F7.7','MobMugen · Rig F · F7.8')
s=s.replace('MOBMUGEN · RIG F · F7.7','MOBMUGEN · RIG F · F7.8')
s=s.replace('Rig F · F7.7','Rig F · F7.8')
s=s.replace('F7.7 witness log','F7.8 witness log')
s=s.replace('WASM JIT · ZIP INDEX FIX','WASM JIT · FULL EXE PATH')
# Modern BoxedWine's -w working directory is not sufficient for Wine to locate a bare Winmugen.exe.
# Force the Windows drive-qualified program path through the p= parameter.
count=s.count('p=Winmugen.exe')
if count == 0:
    raise SystemExit('F7.8 program parameter patch point not found')
s=s.replace('p=Winmugen.exe','p=d%3A%5CWinMugen%5CWinmugen.exe')
# Keep the same working directory, but make launch intent obvious in the trace.
s=s.replace("log('F7.2 POST-LAUNCH HEARTBEAT · 2s')", "log('F7.8 PROGRAM PATH · d:\\\\WinMugen\\\\Winmugen.exe');log('F7.2 POST-LAUNCH HEARTBEAT · 2s')")
# Reduce noisy stream telemetry while preserving progress visibility.
s=s.replace("if(((i+1)%2)===0||i===plan.length-1)", "if(((i+1)%25)===0||i===plan.length-1)")
s=s.replace("const text='MOBMUGEN · RIG F · F7.7\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.8\\nRUNTIME STATUS")
p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
if '## Rig F F7.8 - drive-qualified WinMUGEN launch path' not in t:
    t += '\n\n## Rig F F7.8 - drive-qualified WinMUGEN launch path\n- F7.7 proved the 259-file direct ZIP stream and modern BoxedWine JIT engine both start.\n- Wine then resolved bare Winmugen.exe against C:\\windows\\system32 and failed to find it.\n- F7.8 changes p= to d:\\WinMugen\\Winmugen.exe while preserving w=d:/WinMugen.\n- Stream trace cadence reduced from every 2 files to every 25 files.\n- If Wine 1.7.55 still faults after the executable is found, next branch is a modern BoxedWine-supported Wine root.\n'
    d.write_text(t)
print('patched program occurrences', count)
