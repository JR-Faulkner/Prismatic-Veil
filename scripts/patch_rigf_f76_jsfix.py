from pathlib import Path
p=Path('mugen-lab/rig-f7.html')
s=p.read_text()
s=s.replace('MobMugen · Rig F · F7.5','MobMugen · Rig F · F7.6')
s=s.replace('MOBMUGEN · RIG F · F7.5','MOBMUGEN · RIG F · F7.6')
s=s.replace('Rig F · F7.5','Rig F · F7.6')
s=s.replace('F7.5 witness log','F7.6 witness log')
s=s.replace('WASM JIT · START WITNESS','WASM JIT · JS REPAIRED')
# Repair the malformed JS string introduced by the F7 shell patch.
bad="src+='\n;try{window.__RigFConfig=Config;window.__RigFGetParams=getEmulatorParams;}catch(e){console.error(\"RIGF F7.1 expose failed\",e)}\n';"
# In the generated HTML, \n above is an actual newline inside a single-quoted JS string. Replace via the stable surrounding markers.
start=s.find("  src+='\n;try{window.__RigFConfig=Config;")
if start < 0:
    # Search the actual broken form explicitly.
    start=s.find("  src+='\n;try{window.__RigFConfig=Config;".replace('\\n','\n'))
if start < 0:
    raise SystemExit('F7.6 malformed src+= patch point not found')
end=s.find("  return src\n}", start)
if end < 0:
    raise SystemExit('F7.6 patchShell end not found')
segment=s[start:end]
# Preserve expose wording, but encode newlines as JS escapes rather than literal source newlines.
import re
m=re.search(r"try\{window\.__RigFConfig=Config;window\.__RigFGetParams=getEmulatorParams;\}catch\(e\)\{console\.error\(\"([^\"]+)\",e\)\}", segment, re.S)
msg=m.group(1) if m else 'RIGF F7.6 expose failed'
fixed="  src+='\\n;try{window.__RigFConfig=Config;window.__RigFGetParams=getEmulatorParams;}catch(e){console.error(\\\""+msg+"\\\",e)}\\n';\n"
s=s[:start]+fixed+s[end:]
s=s.replace("const text='MOBMUGEN · RIG F · F7.5\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.6\\nRUNTIME STATUS")
p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
if '## Rig F F7.6 - main JavaScript syntax repair' not in t:
    t += '\n\n## Rig F F7.6 - main JavaScript syntax repair\n- Phone F7.5 proved the dependency-free inline START witness fired while the main application listener did not.\n- CI Node syntax validation found the exact blocker at the patchShell `src+=` line: an unescaped literal newline inside a single-quoted JavaScript string.\n- F7.6 encodes those newlines correctly, then validates the extracted inline script with `node --check` before commit.\n- Direct ZIP streaming and the modern BoxedWine WASM JIT architecture remain unchanged.\n'
    d.write_text(t)
