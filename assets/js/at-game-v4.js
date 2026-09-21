(()=>{
const $=id=>document.getElementById(id),SAVE='at_game_v4_week1',clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),pick=a=>a[Math.floor(Math.random()*a.length)];
const BACKGROUND='Your family never called itself powerless. That would have been inaccurate. Some relatives are Standard; others have small Manifestations or abilities nobody ever bothered to push beyond party tricks, convenience, or family events. The family lesson is older than you: keep it small, stay useful, do not stand out. The uncle who rejected that lesson was remembered as the one who went crazy. Your own ability has only recently awakened. Things you believe are yours become legible to you, and you can Alter them. Using it brings a deep calm, then a strange flicker of approval and joy. You came to the Verdant under the respectable cover of starting a recovery and salvage business with family seed money. You actually came because the Verdant is full of unknowns, abandoned places, uncertain ownership, and room to find out what this power really is.';
const CAT={vehicle:{name:'Vehicles',icon:'🏎️',focus:'performance'},tech:{name:'Technology',icon:'🎮',focus:'performance'},equipment:{name:'Equipment',icon:'🧰',focus:'condition'},base:{name:'Base & Property',icon:'🏚️',focus:'integrity'},other:{name:'Other Claims',icon:'✦',focus:'condition'}};
const LIB={
car:{name:'Sports Car',icon:'🏎️',category:'vehicle',condition:79,integrity:78,efficiency:56,comfort:68,performance:74,worth:66,mods:[],claimType:'owned'},
console:{name:'Gaming System',icon:'🎮',category:'tech',condition:92,integrity:88,efficiency:68,comfort:0,performance:76,worth:24,mods:[],claimType:'owned'},
tools:{name:'Starter Tool Kit',icon:'🧰',category:'equipment',condition:83,integrity:86,efficiency:62,comfort:0,performance:0,worth:14,mods:[],claimType:'owned'},
beacon:{name:'Abandoned Survey Beacon',icon:'📡',category:'equipment',condition:41,integrity:58,efficiency:37,comfort:0,performance:32,worth:11,mods:[],claimType:'recovered'}
};
const NORMAL=[
{thread:'ARRIVAL',mood:'🌿 DAY 1 · THE VERDANT',title:'The Last Staffed Post Is Behind You',text:'The road keeps going after the state stops pretending it controls every mile of it. Old concrete disappears beneath green growth. Trees crowd abandoned utility lines. Farther out, whole structures sit half-swallowed by vegetation. Your recovery papers are legitimate. The reason you wanted them is less respectable: out here, nobody can tell you with certainty what is abandoned, what can be claimed, or what the Shift changed.',choices:[['Reach the rented yard','Get your feet under you first','life:arrive','AUTO'],['Inspect the starter tools','Begin with something unquestionably yours','inspect:tools','AUTO'],['Try one small Alteration','Feel the power again · 1 AP','alter:tools:condition:1','88%'],['Read the recovery board','See what people actually do for money here','study:verdant recovery','96%'],['Just take in the view','You came here for this too','life:observe','AUTO']]},
{thread:'NEW LIFE',mood:'🧰 DAY 2 · SETTLING IN',title:'The Business Exists Mostly On Paper',text:'Your rented yard is not impressive: fenced gravel, a small work bay, a room upstairs and a crooked sign frame waiting for a business name. The family helped because recovery work sounds sensible. You can almost hear them approving of the invoices, licenses and steel-toed boots. None of them know the first thing you did after unloading was Alter a wrench just to feel that quiet warmth settle through you again.',choices:[['Set up the work bay','Make the cover business genuinely useful','life:yard','AUTO'],['Study local Claim customs','Learn how abandoned recovery works here','study:claim customs','96%'],['Check for a first paid job','Money makes the cover real','life:jobs','AUTO'],['Experiment with your tools','Use Alteration because you can · 1 AP','alter:tools:efficiency:1','88%'],['Call the family','Give them the safe version','event:family:normal','AUTO']]},
{thread:'FIRST JOB',mood:'📋 DAY 3 · RECOVERY BOARD',title:'A Job Small Enough To Be Real',text:'The recovery board finally gives you something useful: retrieve intact electrical hardware from an abandoned service spur twelve miles off a maintained road. The pay is ordinary. The location is not. Half the mapping apps stop agreeing after the old flood-control station, and one handwritten note on the posting simply says: ROAD PASSABLE IF DRY.',choices:[['Accept the recovery job','Give the business its first real thread','event:notice:take','AUTO'],['Research the service spur','Know what the maps leave out','study:service spur','94%'],['Ask locals about the route','Rumors count as field data','study:local routes','92%'],['Prepare the car and tools','Do the boring smart thing','inspect:car','AUTO'],['Pass on the job','You did not come here to obey a quest board','event:notice:pass','AUTO']]},
{thread:'FIRST CLAIM',mood:'📡 DAY 4 · OLD SERVICE ROAD',title:'Something Old Beside The Road',text:'Near the service route, a wall of vines has grown around an obsolete survey beacon. Its public tag is sun-bleached but readable: retired, unrecovered, no active claimant listed. Your Alter sense gives you nothing while you look at it. Then you think, deliberately and a little foolishly, mine. Something in you leans toward the idea.',choices:[['Stake a recovery Claim','See whether “mine” is enough','event:beacon:claim','AUTO'],['Inspect it without Claiming','Keep observation separate from ownership','event:beacon:inspect','AUTO'],['Photograph every tag','Verify the paperwork later','event:beacon:photo','AUTO'],['Leave it alone','Not every unknown needs your hand on it','event:beacon:leave','AUTO'],['Study that almost-answer','Pay attention to Claim itself','study:claim sense','90%']]},
{thread:'FIELD WORK',mood:'🔧 DAY 5 · SERVICE SPUR',title:'The First Recovery Run Gets Complicated',text:'The service spur is exactly the kind of place your family imagined when they gave you seed money: corroded cabinets, old conduit, salvageable hardware and hours of unglamorous lifting. Then you find a collapsed access gate blocking the easiest route to the equipment. It is not yours. Your car, tools and anything you have legitimately recovered are. Suddenly Alteration feels less like an upgrade menu and more like a way to solve a problem.',choices:[['Use your tools creatively','Solve it without spending AP first','life:recover','AUTO'],['Alter your tools for the job','Small field-use change · 1 AP','alter:tools:efficiency:1','88%'],['Inspect the car for another route','What you own may be the solution','inspect:car','AUTO'],['Study the old service hardware','Learn while you work','study:service systems','94%'],['Abandon the shortcut','Go the long way around','life:longroute','AUTO']]},
{thread:'A BAD FIT',mood:'✦ DAY 6 · POWER QUESTION',title:'Something Does Not Fit Your Rule',text:'Behind the recovered hardware is a sealed maintenance cabinet built into the old station wall. No owner tag. No active record. No obvious Claim. You expect the usual silence from Alteration. Instead, for less than a second, you sense one meaningless fragment: CONDITION. Then it vanishes. You did not Claim the cabinet. You did not even touch it. That should not have happened.',choices:[['Try to reproduce the flicker','Test the contradiction carefully','study:claim contradiction','88%'],['Do not force it','One weird reading is not a new rule','life:restpower','AUTO'],['Check the records again','Maybe ownership is simply messy','study:service ownership','94%'],['Compare it to a known Claim','Inspect something definitely yours','inspect:tools','AUTO'],['Write down exactly what happened','Do not let memory smooth the edges','life:record','AUTO']]},
{thread:'FIRST THREAD',mood:'🍲 DAY 7 · LOCAL TALK',title:'Someone Else Used That Word',text:'A week into the Verdant, you are eating at a roadside place where recovery crews trade weather reports and exaggerations. An older operator asks how your first week went. You mention Claim without thinking. He stops chewing. “Funny word,” he says. “Had a traveler years back who called it that too. Was not talking about salvage.” Then he goes back to his food as if he did not just rearrange your entire evening.',choices:[['Ask about the traveler','Do not pretend that did not land','life:traveler','AUTO'],['Ask where the traveler went','Push for a direction, not a biography','study:old traveler route','90%'],['Let it go for tonight','You have already learned plenty in seven days','life:weekone','AUTO'],['Review your Claim experiments','Look for what you assumed instead of proved','study:claim assumptions','92%'],['Go back to the yard','Sometimes mystery can wait until morning','life:rest','AUTO']]},
{thread:'OPEN FRONTIER',mood:'🗺️ AFTER WEEK ONE',title:'The Verdant Is Bigger Now',text:'You have a functioning little recovery operation, a week of field experience and more questions about Alteration than when you arrived. Paid jobs, strange roads, abandoned property, local rumors and your own experiments are all pulling in different directions. None of them has become a mandatory quest. The frontier is simply open.',choices:[['Check recovery postings','Keep the business alive','life:jobs','AUTO'],['Drive an unfamiliar route','Follow curiosity instead of paperwork','life:explore','AUTO'],['Work with a Claim','Experiment on something you actually own','inspect:selected','AUTO'],['Study the Verdant','Build field knowledge','study:verdant fieldcraft','94%'],['Take a normal day','Adventure is not a timecard','life:rest','AUTO']]}
];
const EVENTS=[
{id:'family',thread:'RANDOM EVENT',mood:'📞 HOME CALL',title:'The Family Checks In',text:'Someone from home calls to make sure the new “salvage business” has not already eaten all the seed money. The concern is real. So is the assumption that this is just a normal business venture.',chip:'Family is checking on the new operation.',choices:[['Give the respectable update','Business, yard, paperwork. Nothing strange.','event:family:normal','AUTO'],['Mention the Verdant is incredible','Leave the power part out','event:family:wonder','AUTO'],['Ask about your uncle','Test the old family story gently','event:family:uncle','AUTO'],['Change the subject','No reason to poke that thread yet','event:family:skip','AUTO'],['Tell them you are doing fine','Short and true','event:family:fine','AUTO']]},
{id:'notice',thread:'RANDOM EVENT',mood:'📋 RECOVERY BOARD',title:'A Small Recovery Notice',text:'A local posting offers modest money to retrieve intact electrical equipment from an abandoned service spur. Nothing legendary. Exactly the kind of job your family thinks you moved here to do.',chip:'A small paid recovery notice appeared.',choices:[['Take the job','Make the business real','event:notice:take','AUTO'],['Research the location first','Know what the map leaves out','study:service spur','94%'],['Ask locals about it','Rumors are data too','study:local routes','92%'],['Pass for now','You do not owe the business momentum','event:notice:pass','AUTO'],['Drive by without committing','See the area first','life:explore','AUTO']]},
{id:'beacon',thread:'RANDOM EVENT',mood:'📡 CLAIM QUESTION',title:'Something Old Beside The Road',text:'Half under a wall of vines sits an obsolete survey beacon with a faded abandonment mark. No active owner is listed on the public tag. When you focus on it, the Alter sense stays quiet. When you think, very deliberately, “mine,” something almost answers.',chip:'You found an apparently abandoned survey beacon.',choices:[['Stake a recovery claim','Treat the abandonment mark as permission','event:beacon:claim','AUTO'],['Inspect it without claiming','See what ordinary observation tells you','event:beacon:inspect','AUTO'],['Photograph the tag','Verify it later','event:beacon:photo','AUTO'],['Leave it alone','Not every mystery needs touching','event:beacon:leave','AUTO'],['Sit with that almost-answer','Study the Claim sensation itself','study:claim sense','90%']]},
{id:'weather',thread:'RANDOM EVENT',mood:'🌧️ VERDANT WEATHER',title:'Rain Changes The Road',text:'A hard warm rain hits fast enough to turn a side road into flowing mud. The maintained corridor is fine. The interesting road is not.',chip:'Heavy rain changed access to the side roads.',choices:[['Stay on maintained roads','Adventure can wait one day','event:weather:safe','AUTO'],['Inspect the car','See what it can safely handle','inspect:car','AUTO'],['Improve traction indirectly','Alter performance modestly · 2 AP','alter:car:performance:2','80%'],['Study local road conditions','Learn before improvising','study:verdant roads','94%'],['Turn back and relax','No shame in not drowning a coupe','life:rest','AUTO']]}
];
const INTERNALS={
 car:{
  basic:'The car resolves as systems rather than a single Performance number: powertrain, cooling, electrical, braking, steering, suspension, tires, cabin systems and structural shell.',
  deep:'Focusing deeper separates the powertrain from its support systems, the suspension into spring/damper geometry and mounting points, braking into friction hardware and hydraulic/control paths, and the body into load-bearing structure versus exterior panels. Alter does not yet hand you engineering answers automatically; it shows you what is there well enough to ask better questions.'
 },
 console:{
  basic:'Inside the gaming system you can distinguish the main board, processor package, memory, storage, cooling assembly, power delivery, wireless hardware, ports and the physical shell.',
  deep:'The read sharpens into thermal paths, power-delivery stages, board traces, memory and storage interfaces, fan and heat-sink geometry, shielding, connectors and firmware-controlled components. You understand the layout more clearly than the design theory behind every part.'
 },
 tools:{
  basic:'The starter kit is not one object to the power. It is a collection: sockets and drivers, cutters, pliers, a pry bar, compact meter, work light, straps, gloves and a handful of recovery hardware.',
  deep:'When you focus, each piece separates by material, wear surface, joint, grip, fastener interface and intended load. The meter is its own little system of probes, protection, display electronics and power. The straps read as fibers, stitching, hooks and load paths. “Tool kit” was only your human shorthand.'
 },
 beacon:{
  basic:'Under the weathered shell are an old power cell, transmitter board, sensor package, calibration hardware, antenna feed, sealed connectors and a surprisingly dense central mounting block.',
  deep:'The beacon separates into power, sensing, timing, transmission and environmental sealing. Corrosion is worst around the lower connector bank. One sealed central module is physically intact but still semantically fuzzy to your Alter sense, as if you know where it is without yet knowing what category to call it.'
 }
};
function sceneFocus(){
 if(S.day===6)return'cabinet';
 if(S.day===4&&!S.items.beacon)return'beacon_unclaimed';
 return S.selected;
}
function resolveTargetFromText(low){
 if(/maintenance cabinet|cabinet/.test(low))return'cabinet';
 if(/survey beacon|beacon/.test(low))return S.items.beacon?'beacon':'beacon_unclaimed';
 if(/car|vehicle|coupe/.test(low))return'car';
 if(/game|console|gaming system/.test(low))return'console';
 if(/tool|gear|kit/.test(low))return'tools';
 if(/\bit\b|inside|internals?|components?|composition|made of|detail/.test(low))return sceneFocus();
 return S.selected;
}
function deepInspect(id){
 if(id==='cabinet'){
  S.result='You stop treating the cabinet like a stat block and actually examine it. Behind the sealed doors are old switchgear, heavy bus bars, control relays, bundled service cable, fused disconnects and faded maintenance labels. Several circuits have been physically removed. One smaller sealed module sits deeper in the cabinet with no readable purpose marking. Your ordinary eyes can see all of that. The strange part is what Alter does not do: there is no stable Claim readout, only the memory of that impossible one-word flicker: CONDITION.';
  S.journal.unshift('Day '+S.day+' · Examined the maintenance cabinet in physical detail.');
  return;
 }
 if(id==='beacon_unclaimed'){
  S.result='You examine the abandoned beacon as an object rather than asking Alter for ownership stats. The housing is a weather-sealed composite shell over a metal frame. Through the service panel you can make out an old power cell, transmitter board, sensor hardware, antenna feed and several sealed connectors. None of it becomes fully legible to Alter yet. Visually you can tell what the pieces are; the power still refuses to organize them into a writable Claim.';
  S.journal.unshift('Day '+S.day+' · Examined the unclaimed survey beacon in physical detail.');
  return;
 }
 const x=S.items[id];
 if(!x){S.result='You can look closer, but there is no stable object in the current scene for the interpreter to resolve.';return}
 const info=INTERNALS[id];
 if(!info){S.result='You focus past the surface readout. Alter separates the object into materials, assemblies, connections and wear points, but this prototype does not yet have a authored internal map for '+x.name+'.';return}
 const lv=(S.knowledge[x.category+' systems']||0)+(S.knowledge['practical systems']||0);
 S.selected=id;
 S.result=x.icon+' '+x.name+' · INTERNAL READ\n\n'+info.basic+(lv>=2?'\n\nDEEPER RESOLUTION: '+info.deep:'\n\nYou can tell there is more resolution available, but you do not yet have enough relevant knowledge to name every subsystem confidently.');
 S.journal.unshift('Day '+S.day+' · Read the internal composition of '+x.name+'.');
}

const thresholds=[170,280,430,650,900,1250];let S=null;
const clone=id=>JSON.parse(JSON.stringify(LIB[id]));
function fresh(name){return{name:name||'Jace',premise:BACKGROUND,day:1,money:4800,baseAP:6,ap:6,maxAP:6,items:{car:clone('car'),console:clone('console'),tools:clone('tools')},selected:'tools',knowledge:{'alteration sense':1,'claim sense':1},journal:['Day 1 · Crossed into the Verdant to begin a recovery and salvage operation.','Day 1 · The family believes the move is about honest blue-collar work. That is only half true.'],alterations:0,worthUnlocked:false,currentEvent:null,lastEvent:null,claims:['car','console','tools'],threads:{business:true,serviceSpur:false,oldTraveler:false,uncle:false},result:'The last staffed post disappears in the mirror. For the first time, nobody at home is close enough to tell you to leave the power alone.'}}
function save(){localStorage.setItem(SAVE,JSON.stringify(S))}
function totalWorth(){return Object.values(S.items).reduce((n,x)=>n+(x.worth||0),0)}
function worthBonus(){if(!S.worthUnlocked)return 0;const t=totalWorth();return thresholds.filter(x=>t>=x).length}
function nextThreshold(){const t=totalWorth();return thresholds.find(x=>x>t)||null}
function knowledgeTotal(){return Object.values(S.knowledge||{}).reduce((a,b)=>a+b,0)}
function maybeUnlockWorth(){if(!S.worthUnlocked&&S.alterations>=4&&knowledgeTotal()>=5){S.worthUnlocked=true;S.journal.unshift('Day '+S.day+' · New sense unlocked: Worth.');$('worthUnlock').classList.remove('hidden');S.result='✦ WORTH UNLOCKED. This is not a price tag. Claimed things carry a deeper weight, and you can suddenly feel the total.';return true}return false}
function scene(){if(S.currentEvent)return EVENTS.find(e=>e.id===S.currentEvent)||NORMAL[0];return NORMAL[Math.min(S.day-1,NORMAL.length-1)]}
function categoryItems(cat){return Object.entries(S.items).filter(([,v])=>v.category===cat)}
function categoryStat(cat,entries){const focus=(CAT[cat]||CAT.other).focus,vals=entries.map(([,x])=>x[focus]||0).filter(v=>v>0);return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0}
function render(){
 $('setup').classList.add('hidden');$('game').classList.remove('hidden');$('who').textContent=S.name;$('premise').textContent=S.premise||BACKGROUND;$('day').textContent=S.day;$('money').textContent='$'+S.money.toLocaleString();
 S.maxAP=S.baseAP+worthBonus();if(S.ap>S.maxAP)S.ap=S.maxAP;$('apText').textContent=S.ap+'/'+S.maxAP;$('apdots').innerHTML='';
 for(let i=0;i<S.maxAP;i++){const d=document.createElement('i');d.className='dot'+(i<S.ap?' on':'');$('apdots').appendChild(d)}
 const tw=totalWorth();$('worthTotal').textContent=tw;$('worthTotalTop').textContent=tw;$('stats').classList.toggle('hasWorth',S.worthUnlocked);$('worthStat').classList.toggle('hidden',!S.worthUnlocked);$('worthSummary').classList.toggle('show',S.worthUnlocked);
 if(S.worthUnlocked){const nx=nextThreshold();$('worthNext').innerHTML=nx?'NEXT RESONANCE<br><b>'+(nx-tw)+' WORTH AWAY</b>':'KNOWN RESONANCE<br><b>MAXED FOR NOW</b>'}
 const sc=scene();$('thread').textContent=sc.thread;$('mood').textContent=sc.mood;$('sceneTitle').textContent=sc.title;$('sceneText').textContent=sc.text;$('result').textContent=S.result||'';
 $('eventChip').className='eventChip'+(S.currentEvent?' show':'');$('eventChip').textContent=S.currentEvent?'✦ '+sc.chip:'';
 $('choices').innerHTML='';sc.choices.slice(0,5).forEach((c,i)=>{const b=document.createElement('button');b.className='choice';b.type='button';b.innerHTML='<span class="num">'+(i+1)+'</span><span><strong>'+c[0]+'</strong><small>'+c[1]+'</small></span><span class="chance">'+c[3]+'</span>';b.onclick=()=>handle(c[2]);$('choices').appendChild(b)});
 renderCategories();renderSelected();renderGrowth();renderJournal();save();
}
function renderCategories(){
 const box=$('categories');box.innerHTML='';
 [...new Set(Object.values(S.items).map(x=>x.category))].forEach(cat=>{const meta=CAT[cat]||CAT.other,entries=categoryItems(cat),stat=categoryStat(cat,entries),worth=entries.reduce((n,[,x])=>n+x.worth,0),sel=S.items[S.selected]&&S.items[S.selected].category===cat,d=document.createElement('details');d.className='cat';d.open=sel;
 d.innerHTML='<summary><span class="catIcon">'+meta.icon+'</span><span><strong>'+meta.name+'</strong><span class="catMeta">'+entries.length+' '+(entries.length===1?'claim':'claims')+' · '+meta.focus.toUpperCase()+' '+stat+'</span></span><span class="catValue">'+(S.worthUnlocked?'W '+worth:'DETAILS')+'</span></summary><div class="catItems"></div>';
 const inner=d.querySelector('.catItems');entries.forEach(([id,x])=>{const b=document.createElement('button');b.className='prop'+(id===S.selected?' active':'');b.type='button';b.innerHTML='<span class="icon">'+x.icon+'</span><span><strong>'+x.name+'</strong><small>'+(x.mods.length?x.mods.slice(-2).join(' · '):(x.claimType==='recovered'?'Recovered claim':'Established claim'))+'</small></span><span class="mini">'+(S.worthUnlocked?'W '+x.worth:'COND '+x.condition)+'</span>';b.onclick=()=>{S.selected=id;render()};inner.appendChild(b)});box.appendChild(d)
 });
}
function renderSelected(){
 const x=S.items[S.selected]||Object.values(S.items)[0];if(!x)return;$('propName').textContent=x.name;$('propMods').textContent=x.mods.length?(x.mods.length+' MOD'+(x.mods.length===1?'':'S')):'CLAIMED';
 const stats=[['Condition',x.condition],['Integrity',x.integrity],['Efficiency',x.efficiency]];if(x.performance)stats.push(['Performance',x.performance]);if(x.comfort)stats.push(['Comfort',x.comfort]);if(S.worthUnlocked)stats.push(['Worth',x.worth]);$('readout').innerHTML=stats.map(v=>'<div class="meter">'+v[0]+'<b>'+v[1]+'</b></div>').join('');
 $('alterChoices').innerHTML='';alterOptions(S.selected,x).slice(0,5).forEach(o=>{const b=document.createElement('button');b.className='alterChoice';b.type='button';b.innerHTML='<strong>'+o[0]+'</strong><small>'+o[1]+'</small>';b.onclick=()=>handle(o[2]);$('alterChoices').appendChild(b)});
}
function alterOptions(id,x){const o=[['Restore / Refine','Broad physical improvement · 1 AP','alter:'+id+':condition:1'],['Improve Efficiency','Reduce waste or friction · 2 AP','alter:'+id+':efficiency:2']];if(x.performance)o.push(['Improve Performance','Push capability upward · 2 AP','alter:'+id+':performance:2']);else o.push(['Improve Integrity','Strengthen what already exists · 2 AP','alter:'+id+':integrity:2']);o.push(['Inspect Deeper','Spend no AP. See what you currently understand.','inspect:'+id]);const deep=knowledgeTotal()>=7;o.push([deep?'Explore Another Approach':'Study This Category',deep?'Knowledge may reveal a different route instead of a stronger version of the obvious one.':'Learning widens what Alter can perceive.','study:'+x.category+' '+(deep?'alternatives':'systems')]);return o}
function renderGrowth(){
 const box=$('knowledge');box.innerHTML='';
 if(S.worthUnlocked){const tw=totalWorth(),nx=nextThreshold(),w=document.createElement('div');w.className='worthCard';w.innerHTML='<strong>✦ RESONANT WORTH · '+tw+' TOTAL</strong><small>'+(nx?('The next known increase in Alteration capacity appears near '+nx+' total Worth. Current daily capacity: '+S.maxAP+' AP.'):'No further Worth threshold is currently understood. Daily capacity: '+S.maxAP+' AP.')+'</small><div class="bar"><i style="width:'+(nx?Math.min(100,(tw/nx)*100):100)+'%"></i></div>';box.appendChild(w)}
 Object.entries(S.knowledge).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>{const d=document.createElement('div');d.className='krow';d.innerHTML='<strong>'+title(k)+' · Lv '+v+'</strong><small>'+knowledgeDesc(k,v)+'</small><div class="bar"><i style="width:'+Math.min(100,v*14)+'%"></i></div>';box.appendChild(d)})
}
function renderJournal(){$('journalList').innerHTML=(S.journal||[]).slice(0,30).map(x=>'<div class="jrow"><strong>'+escapeHtml(x)+'</strong></div>').join('')}
function title(s){return String(s).replace(/\b\w/g,m=>m.toUpperCase())}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function knowledgeDesc(k,v){if(k.includes('claim'))return'Your current model says Claim is what allows Alteration access. The feeling is consistent enough that you trust it, for now.';if(k.includes('alteration'))return'Understanding the power itself. Using it feels calming, warm, and strangely approving.';if(k.includes('verdant'))return'Practical familiarity with the frontier, its routes, hazards, and recovery culture.';if(v>=5)return'Detailed enough to suggest alternate solutions instead of only direct improvement.';if(v>=3)return'You are beginning to see useful subsystems and tradeoffs.';return'Basic familiarity. Enough for broad choices, with plenty still hidden.'}
function inspect(id){if(id==='selected')id=S.selected;const x=S.items[id];if(!x){S.result='⚠ Your current Claim sense does not recognize that as yours.';return}S.selected=id;S.result=x.icon+' '+x.name+': condition '+x.condition+', integrity '+x.integrity+', efficiency '+x.efficiency+(x.performance?', performance '+x.performance:'')+(x.comfort?', comfort '+x.comfort:'')+(S.worthUnlocked?', Worth '+x.worth:'')+'. The object is clear inside your current Claim sense. No AP spent.';S.journal.unshift('Day '+S.day+' · Inspected '+x.name+'.')}
function study(topic){topic=topic==='selected systems'?((S.items[S.selected]&&S.items[S.selected].category)||'general')+' systems':topic;S.knowledge[topic]=(S.knowledge[topic]||0)+1;S.result='Learned more about '+topic+'. Knowledge Lv '+S.knowledge[topic]+'. The useful part is not raw power; it is seeing more possible answers.';S.journal.unshift('Day '+S.day+' · Studied '+topic+'.');maybeUnlockWorth()}
function alter(id,stat,cost){if(id==='selected')id=S.selected;const x=S.items[id];cost=+cost||1;if(!x){S.result='⚠ Alter reaches for a Claim and finds nothing stable enough to change.';return}if(S.ap<cost){S.result='⚠ Not enough Alteration capacity. '+S.ap+'/'+S.maxAP+' remains.';return}S.ap-=cost;const gain=cost===1?3:5;let target=stat;if(!(target in x)||typeof x[target]!=='number')target='condition';x[target]=clamp(x[target]+gain,0,100);x.worth+=cost===1?2:4;x.mods.push(title(target)+' +'+gain);S.alterations++;S.selected=id;S.result='✦ '+x.name+' altered: '+title(target)+' +'+gain+'. '+cost+' AP spent. As the change settles, that familiar calm rolls through you, warm and steady, followed by a bright little pulse of approval that makes you wonder again why anyone would choose not to use what they are.'+(S.worthUnlocked?' Worth is now '+x.worth+'.':'');S.journal.unshift('Day '+S.day+' · Altered '+x.name+': '+title(target)+' +'+gain+'.');maybeUnlockWorth()}
function establishClaim(id){if(S.items[id]){S.result='That Claim is already established.';return}if(!LIB[id]){S.result='You can feel the idea of Claim, but there is no definite target to attach it to.';return}S.items[id]=clone(id);S.selected=id;S.claims=S.claims||[];S.claims.push(id);S.knowledge['claim sense']=(S.knowledge['claim sense']||0)+1;S.result='✦ CLAIM ESTABLISHED: '+S.items[id].name+'. The moment you accept it as yours, the object changes inside your perception. Details that were absent become legible. The same calm follows, softer than Alteration but unmistakably familiar.';S.journal.unshift('Day '+S.day+' · Established Claim over '+S.items[id].name+'.')}
function resolveEvent(id,choice){
 if(id==='family'){if(choice==='uncle'){S.threads=S.threads||{};S.threads.uncle=true;S.knowledge['uncle thread']=(S.knowledge['uncle thread']||0)+1;S.result='The conversation changes temperature immediately. You get the old answer: he became obsessed with his ability, stopped listening, and went off chasing things in the frontier. Nobody actually says what he did that proved he was crazy.';S.journal.unshift('Day '+S.day+' · Asked the family about the uncle. The story still has holes.')}else if(choice==='wonder')S.result='You tell them the Verdant is beautiful and strange. They remind you that strange does not pay invoices.';else if(choice==='normal')S.result='You give them the safe version: paperwork, yard, gear, possible contracts. Everyone sounds relieved.';else S.result='The call stays ordinary. That is probably what they wanted.'}
 if(id==='notice'){if(choice==='take'){S.threads=S.threads||{};S.threads.serviceSpur=true;S.knowledge['recovery work']=(S.knowledge['recovery work']||0)+1;S.result='You accept the small recovery notice. It is now an active thread for the business, not a destiny quest.';S.journal.unshift('Day '+S.day+' · Accepted a small recovery job at an abandoned service spur.')}else if(choice==='pass')S.result='You pass. The posting remains somebody else’s problem.'}
 if(id==='beacon'){if(choice==='claim')establishClaim('beacon');else if(choice==='inspect')S.result='Ordinary inspection says it is old, weathered, obsolete, and publicly marked abandoned. Your Alter sense still refuses to show the deeper readout until the question of Claim is settled.';else if(choice==='photo')S.result='You photograph the tag and coordinates. Whatever it is, you can verify the record before touching it.';else if(choice==='leave')S.result='You leave it under the vines. The almost-answer fades as you drive away.'}
 if(id==='weather'){if(choice==='safe')S.result='You keep to maintained roads. The Verdant will not award a medal for getting stuck.'}
 S.journal.unshift('Day '+S.day+' · Event: '+((EVENTS.find(e=>e.id===id)||{}).title||id)+'.');S.currentEvent=null;maybeUnlockWorth();
}
function life(type){
 if(type==='arrive')S.result='You reach the rented yard before dark. It is small, rough and gloriously far from anybody who would tell you to leave the power alone.';
 else if(type==='observe')S.result='You watch green swallow old infrastructure. The Verdant feels less ruined than unfinished.';
 else if(type==='yard')S.result='You spend a few hours turning the work bay into something usable. It is not glamorous, but the place starts to feel like a beginning.';
 else if(type==='jobs')S.result='The recovery board has ordinary work, questionable work and a few postings with locations that maps refuse to agree on.';
 else if(type==='family')S.result='You send the family a boring update. They react positively to the boring parts.';
 else if(type==='explore')S.result='You take an unfamiliar service road far enough to feel the maintained world loosen around you, then turn back before curiosity becomes stupidity.';
 else if(type==='recover'){S.money+=220;S.knowledge['recovery work']=(S.knowledge['recovery work']||0)+1;S.result='You solve the access problem with leverage, patience and the gear you brought. The recovery run pays $220. The best part is realizing Alteration did not have to be the answer for the power to matter.';S.journal.unshift('Day '+S.day+' · Completed a small Verdant recovery run for $220.');}
 else if(type==='longroute')S.result='You take the long route around the blocked gate. It costs time, not dignity.';
 else if(type==='restpower')S.result='You leave the cabinet alone. The strange one-word reading bothers you more because you did not chase it.';
 else if(type==='record'){S.knowledge['claim contradiction']=(S.knowledge['claim contradiction']||0)+1;S.result='You write down the exact sequence before memory can tidy it up: no touch, no Claim, one flash of CONDITION. That is now evidence, not a feeling.';}
 else if(type==='traveler'){S.threads=S.threads||{};S.threads.oldTraveler=true;S.knowledge['old traveler thread']=(S.knowledge['old traveler thread']||0)+1;S.result='The operator remembers very little he is willing to swear to: the traveler asked about abandoned sites, argued that people confused rules with habits, and headed deeper into the Verdant. No name yet. Still, the phrasing hits uncomfortably close to your own thoughts.';S.journal.unshift('Day '+S.day+' · Heard about an older traveler who used the word Claim in a way unrelated to salvage.');}
 else if(type==='weekone')S.result='You let the comment sit. One week ago you came here to test a supposedly useless power. Now you have a business, a recovered frontier, a broken assumption and a stranger from years ago using your vocabulary.';
 else if(type==='rest')S.result='You take the day slow. The frontier does not punish you for failing to optimize your life.';
 else S.result='You spend some time simply living in the place you chose.';
}
function handle(action){if(!action)return;const p=action.split(':');if(p[0]==='inspect')inspect(p[1]);else if(p[0]==='study')study(p.slice(1).join(':'));else if(p[0]==='alter')alter(p[1],p[2],p[3]);else if(p[0]==='life')life(p[1]);else if(p[0]==='event')resolveEvent(p[1],p[2]);render()}
function freeAction(text){
 const t=text.trim();if(!t){render();return}
 const low=t.toLowerCase(),target=resolveTargetFromText(low);
 const wantsDeep=/more detail|more detailed|what(?:'s| is) (?:inside|in) (?:it|this|that)|what is it made of|what(?:'s| is) it made of|look inside|open it|internals?|components?|composition|inside it|inside this|inside that|break it down|what is in it/.test(low);
 const wantsStats=/stats?|numbers?|readout|condition|integrity|efficiency|performance|worth/.test(low)&&!/what(?:'s| is) (?:inside|in)|components?|composition|internals?/.test(low);
 if(wantsDeep){deepInspect(target);render();return}
 if(/\bclaim\b|stake claim|make it mine/.test(low)){
  if(target==='beacon'||target==='beacon_unclaimed'){if(S.day===4||S.items.beacon)establishClaim('beacon');else S.result='You remember the idea, but there is no survey beacon in front of you to Claim right now.'}
  else S.result='You reach for the sense you have been calling Claim. It wants a definite target, something you can point to and mean when you think: mine.';
  render();return
 }
 if(/study|research|read about|learn/.test(low)){
  let topic=low.replace(/^.*?(study|research|read about|learn)\s*/,'').slice(0,60)||'verdant fieldcraft';study(topic);render();return
 }
 if(/alter|improve|upgrade|change|modify/.test(low)){
  const itemTarget=(target==='cabinet'||target==='beacon_unclaimed')?S.selected:target;
  const m=low.match(/(\d+)\s*(?:ap|point)/),cost=m?clamp(+m[1],1,6):1,stat=/comfort/.test(low)?'comfort':/perform|power|speed|traction/.test(low)?'performance':/efficien|cool|airflow|energy/.test(low)?'efficiency':/integr|strong|durab/.test(low)?'integrity':'condition';
  alter(itemTarget,stat,cost);render();return
 }
 if(wantsStats||/inspect|look at|check|examine/.test(low)){
  if(target==='cabinet'||target==='beacon_unclaimed'){deepInspect(target)}else inspect(target);
  render();return
 }
 if(/drive|explore|go out|walk|rest|sleep|eat|call family/.test(low)&&!/alter|improve|upgrade/.test(low)){
  S.result='You do it. The Verdant does not require a skill check for every ordinary decision.';S.journal.unshift('Day '+S.day+' · '+t.slice(0,100));render();return
 }
 S.result='You attempt: “'+t+'” The action is accepted as part of your life in the Verdant, but this build does not yet attach a specific mechanical consequence to it. No fake failure roll was added.';
 S.journal.unshift('Day '+S.day+' · '+t.slice(0,100));render();
}
function newDay(){
 S.day++;S.maxAP=S.baseAP+worthBonus();S.ap=S.maxAP;S.result='Day '+S.day+'. Alteration capacity returns to '+S.maxAP+' AP. Nothing says you need to spend it.';
 if(S.day===8){S.journal.unshift('Week 1 · The first week in the Verdant is complete. The frontier is now open.');}
 const pool=EVENTS.filter(e=>e.id!==S.lastEvent);
 if(S.day>=8&&Math.random()<.42){const ev=pick(pool);S.currentEvent=ev.id;S.lastEvent=ev.id;S.result='Day '+S.day+'. '+ev.chip}else S.currentEvent=null;
 S.journal.unshift('Day '+S.day+' · New day in the Verdant.');render()
}
$('start').onclick=()=>{S=fresh(($('nm').value||'Jace').trim());save();render()};
$('form').onsubmit=e=>{e.preventDefault();const t=$('act').value;$('act').value='';freeAction(t)};
$('end').onclick=newDay;
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===b.dataset.tab))});
try{S=JSON.parse(localStorage.getItem(SAVE)||'null')}catch(e){}
if(S){S.premise=BACKGROUND;S.knowledge=S.knowledge||{'alteration sense':1,'claim sense':1};S.journal=S.journal||[];S.claims=S.claims||Object.keys(S.items||{});S.threads=S.threads||{business:true,serviceSpur:false,oldTraveler:false,uncle:false};S.baseAP=S.baseAP||6;S.result=S.result||'Welcome back to the Verdant.';render()}
})();