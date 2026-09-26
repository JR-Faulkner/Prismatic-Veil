"""Render original synthetic PV Tower audition cues; no game hooks changed."""
from pathlib import Path
import math, random, struct, wave, json
SR = 24000
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/audio/tower/audition-v1'
OUT.mkdir(parents=True, exist_ok=True)
rng = random.Random(926)

def blank(seconds): return [0.] * int(seconds * SR)
def tone(buf, at, frequency, duration, gain=.12, sweep=0., metallic=False):
    start = int(at * SR)
    for k in range(min(int(duration*SR),len(buf)-start)):
        t=k/SR; env=min(1,t/.009)*math.exp(-5*t/duration)*min(1,(duration-t)/.035)
        phase=2*math.pi*(frequency*t+sweep*t*t/2)
        value=math.sin(phase)+.22*math.sin(phase*(2.73 if metallic else 2))+.10*math.sin(phase*4.12)
        buf[start+k]+=gain*env*value
def click(buf,at,gain=.065):
    start=int(at*SR)
    for k in range(min(int(.065*SR),len(buf)-start)):
        t=k/SR; buf[start+k]+=gain*rng.uniform(-1,1)*math.exp(-100*t)
    tone(buf,at,145,.10,gain*.7,sweep=-450)
def space(buf):
    source=buf[:]
    for delay,gain in [(.071,.13),(.137,.08),(.233,.05)]:
        n=int(delay*SR)
        for k in range(n,len(buf)):buf[k]+=source[k-n]*gain
    return buf
def write(name,buf):
    peak=max(abs(x) for x in buf) or 1
    scale=min(1,.6/peak)
    with wave.open(str(OUT/(name+'.wav')),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR)
        f.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x*scale))*32767)) for x in buf))
    return {'file':name+'.wav','duration':round(len(buf)/SR,3),'peak':round(peak*scale,4)}

cues={}
b=blank(.4);click(b,.01);tone(b,.025,330,.22,.045,metallic=True);cues['ring-turn']=space(b)
b=blank(1.3)
for at,f in [(0,220),(.055,330),(.11,440)]:tone(b,at,f,1.05,.075,metallic=True)
cues['ring-align']=space(b)
b=blank(1.8)
for f in [196,202]:tone(b,.02,f,1.6,.075,sweep=3 if f==196 else -3)
cues['harmonic-search']=space(b)
b=blank(1.8)
for at,f in [(0,196),(.1,294),(.2,392)]:tone(b,at,f,1.45,.085)
click(b,.19,.035);cues['harmonic-lock']=space(b)
b=blank(1.25)
for at,f in [(0,261.63),(.16,392.0),(.30,523.25)]:tone(b,at,f,.8,.08,metallic=True)
cues['memory-link']=space(b)
b=blank(.85);tone(b,0,294,.65,.095,sweep=-65);click(b,.05,.025);cues['route-release']=space(b)
b=blank(3.6)
for at,f in [(0,196),(.18,261.63),(.36,294),(.54,392),(.72,523.25)]:tone(b,at,f,2.65,.075,metallic=True)
cues['tower-resolve']=space(b)
manifest=[];sequence=blank(sum(len(x)/SR+.85 for x in cues.values()));cursor=0
for name,b in cues.items():
    row=write(name,b);row['sequence_at']=round(cursor/SR,2);manifest.append(row)
    sequence[cursor:cursor+len(b)]=b;cursor+=len(b)+int(.85*SR)
write('tower-audition-sequence',sequence)
(OUT/'manifest.json').write_text(json.dumps({'sample_rate':SR,'channels':1,'format':'PCM16 WAV','status':'Original synthesized concepts awaiting audition approval','cues':manifest},indent=2)+'\n',encoding='utf8')
print(json.dumps(manifest))
