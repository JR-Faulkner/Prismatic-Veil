(()=>{
const $=id=>document.getElementById(id),SAVE='at_game_v4_week1',clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),pick=a=>a[Math.floor(Math.random()*a.length)];
const BACKGROUND='Jace grew up in a family that made being ordinary into a survival skill. Some relatives are Standard. Others have Manifestations so underused they became jokes, conveniences, and party tricks. Nobody trains. Nobody pushes. Nobody asks what a “small” ability might become if someone actually followed it. The uncle who did was remembered as unstable and embarrassing, the proof that taking powers seriously only ruins lives. Then Jace awakened Alteration. Things he sincerely thinks of as his become legible, almost writable. Using the ability brings calm, warmth, approval and joy so natural that suppressing it suddenly feels stranger than using it. He convinced the family to help fund a respectable recovery and salvage business, then moved to the Verdant: a Shift-touched frontier of overgrown infrastructure, uncertain ownership, thin government reach and unanswered questions. Jace thinks Claim is the rule that lets him Alter. The Verdant is beginning to suggest Claim may only be the first rule he taught himself.';
const CAT={vehicle:{name:'Vehicles',icon:'🚙',focus:'performance'},tech:{name:'Technology',icon:'🎮',focus:'performance'},equipment:{name:'Equipment',icon:'🧰',focus:'condition'},base:{name:'Base & Property',icon:'🏚️',focus:'integrity'},other:{name:'Other Claims',icon:'✦',focus:'condition'}};
const LIB={
car:{name:'Virog 4',icon:'🚙',category:'vehicle',condition:82,integrity:85,efficiency:58,comfort:64,performance:76,worth:68,mods:[],claimType:'owned'},
console:{name:'Gaming System',icon:'🎮',category:'tech',condition:92,integrity:88,efficiency:68,comfort:0,performance:76,worth:24,mods:[],claimType:'owned'},
tools:{name:'Starter Tool Kit',icon:'🧰',category:'equipment',condition:83,integrity:86,efficiency:62,comfort:0,performance:0,worth:14,mods:[],claimType:'owned'},
beacon:{name:'Abandoned Survey Beacon',icon:'📡',category:'equipment',condition:41,integrity:58,efficiency:37,comfort:0,performance:32,worth:11,mods:[],claimType:'recovered'},
fieldpack:{name:'Verdant Field Pack',icon:'🎒',category:'equipment',condition:96,integrity:88,efficiency:72,comfort:70,performance:0,worth:16,mods:[],claimType:'owned'},
relay:{name:'Old Relay Shack',icon:'🏚️',category:'base',condition:48,integrity:61,efficiency:29,comfort:22,performance:0,worth:46,mods:[],claimType:'recovered'}
};
const NORMAL=[
{thread:'ARRIVAL',mood:'🌿 DAY 1 · THE VERDANT',title:'The Last Staffed Post Is Behind You',text:'The road keeps going after the state stops pretending it controls every mile of it. Old concrete disappears beneath green growth. Trees crowd abandoned utility lines. Farther out, whole structures sit half-swallowed by vegetation. Your recovery papers are legitimate. The reason you wanted them is less respectable: out here, nobody can tell you with certainty what is abandoned, what can be claimed, or what the Shift changed.',choices:[['Reach the rented yard','Get your feet under you first','life:arrive','AUTO'],['Inspect the starter tools','Begin with something unquestionably yours','inspect:tools','AUTO'],['Try one small Alteration','Feel the power again · 1 AP','alter:tools:condition:1','88%'],['Read the recovery board','See what people actually do for money here','study:verdant recovery','96%'],['Just take in the view','You came here for this too','life:observe','AUTO']]},
{thread:'NEW LIFE',mood:'🧰 DAY 2 · SETTLING IN',title:'The Business Exists Mostly On Paper',text:'Your rented yard is not impressive: fenced gravel, a small work bay, a room upstairs and a crooked sign frame waiting for a business name. The family helped because recovery work sounds sensible. You can almost hear them approving of the invoices, licenses and steel-toed boots. None of them know the first thing you did after unloading was Alter a wrench just to feel that quiet warmth settle through you again.',choices:[['Set up the work bay','Make the cover business genuinely useful','life:yard','AUTO'],['Study local Claim customs','Learn how abandoned recovery works here','study:claim customs','96%'],['Check for a first paid job','Money makes the cover real','life:jobs','AUTO'],['Experiment with your tools','Use Alteration because you can · 1 AP','alter:tools:efficiency:1','88%'],['Call the family','Give them the safe version','event:family:normal','AUTO']]},
{thread:'FIRST JOB',mood:'📋 DAY 3 · RECOVERY BOARD',title:'A Job Small Enough To Be Real',text:'The recovery board finally gives you something useful: retrieve intact electrical hardware from an abandoned service spur twelve miles off a maintained road. The pay is ordinary. The location is not. Half the mapping apps stop agreeing after the old flood-control station, and one handwritten note on the posting simply says: ROAD PASSABLE IF DRY.',choices:[['Accept the recovery job','Give the business its first real thread','event:notice:take','AUTO'],['Research the service spur','Know what the maps leave out','study:service spur','94%'],['Ask locals about the route','Rumors count as field data','study:local routes','92%'],['Prepare the Virog 4 and tools','Do the boring smart thing','inspect:car','AUTO'],['Pass on the job','You did not come here to obey a quest board','event:notice:pass','AUTO']]},
{thread:'FIRST CLAIM',mood:'📡 DAY 4 · OLD SERVICE ROAD',title:'Something Old Beside The Road',text:'Near the service route, a wall of vines has grown around an obsolete survey beacon. Its public tag is sun-bleached but readable: retired, unrecovered, no active claimant listed. Your Alter sense gives you nothing while you look at it. Then you think, deliberately and a little foolishly, mine. Something in you leans toward the idea.',choices:[['Stake a recovery Claim','See whether “mine” is enough','event:beacon:claim','AUTO'],['Inspect it without Claiming','Keep observation separate from ownership','event:beacon:inspect','AUTO'],['Photograph every tag','Verify the paperwork later','event:beacon:photo','AUTO'],['Leave it alone','Not every unknown needs your hand on it','event:beacon:leave','AUTO'],['Study that almost-answer','Pay attention to Claim itself','study:claim sense','90%']]},
{thread:'FIELD WORK',mood:'🔧 DAY 5 · SERVICE SPUR',title:'The First Recovery Run Gets Complicated',text:'The service spur is exactly the kind of place your family imagined when they gave you seed money: corroded cabinets, old conduit, salvageable hardware and hours of unglamorous lifting. Then you find a collapsed access gate blocking the easiest route to the equipment. It is not yours. Your car, tools and anything you have legitimately recovered are. Suddenly Alteration feels less like an upgrade menu and more like a way to solve a problem.',choices:[['Use your tools creatively','Solve it without spending AP first','life:recover','AUTO'],['Alter your tools for the job','Small field-use change · 1 AP','alter:tools:efficiency:1','88%'],['Inspect the car for another route','What you own may be the solution','inspect:car','AUTO'],['Study the old service hardware','Learn while you work','study:service systems','94%'],['Abandon the shortcut','Go the long way around','life:longroute','AUTO']]},
{thread:'A BAD FIT',mood:'✦ DAY 6 · POWER QUESTION',title:'Something Does Not Fit Your Rule',text:'Behind the recovered hardware is a sealed maintenance cabinet built into the old station wall. No owner tag. No active record. No obvious Claim. You expect the usual silence from Alteration. Instead, for less than a second, you sense one meaningless fragment: CONDITION. Then it vanishes. You did not Claim the cabinet. You did not even touch it. That should not have happened.',choices:[['Try to reproduce the flicker','Test the contradiction carefully','study:claim contradiction','88%'],['Do not force it','One weird reading is not a new rule','life:restpower','AUTO'],['Check the records again','Maybe ownership is simply messy','study:service ownership','94%'],['Compare it to a known Claim','Inspect something definitely yours','inspect:tools','AUTO'],['Write down exactly what happened','Do not let memory smooth the edges','life:record','AUTO']]},
{thread:'FIRST THREAD',mood:'🍲 DAY 7 · LOCAL TALK',title:'Someone Else Used That Word',text:'A week into the Verdant, you are eating at a roadside place where recovery crews trade weather reports and exaggerations. An older operator asks how your first week went. You mention Claim without thinking. He stops chewing. “Funny word,” he says. “Had a traveler years back who called it that too. Was not talking about salvage.” Then he goes back to his food as if he did not just rearrange your entire evening.',choices:[['Ask about the traveler','Do not pretend that did not land','life:traveler','AUTO'],['Ask where the traveler went','Push for a direction, not a biography','study:old traveler route','90%'],['Let it go for tonight','You have already learned plenty in seven days','life:weekone','AUTO'],['Review your Claim experiments','Look for what you assumed instead of proved','study:claim assumptions','92%'],['Go back to the yard','Sometimes mystery can wait until morning','life:rest','AUTO']]},
{thread:'PUTTING DOWN ROOTS',mood:'🪧 DAY 8 · YOUR YARD',title:'A Name On The Gate',text:'A week ago the yard was just rented gravel and a reason for your family not to worry. Now people have started asking what you call the business. The blank sign frame suddenly feels more official than any paperwork. That is mildly terrifying.',choices:[['Paint a simple recovery sign','Make the operation feel real','life:sign','AUTO'],['Check the board for work','Keep money moving','life:jobs','AUTO'],['Study local recovery prices','Learn what people actually pay','study:recovery pricing','94%'],['Tune up your field tools','A practical little Alteration · 1 AP','alter:tools:condition:1','88%'],['Take the evening off','You are allowed to enjoy getting here','life:rest','AUTO']]},
{thread:'REAL CUSTOMER',mood:'💼 DAY 9 · WALK-IN JOB',title:'Someone Actually Wants To Hire You',text:'A local mechanic stops by with a simple offer: an abandoned greenhouse complex still has a commercial refrigeration unit his shop can use. He knows roughly where it is. He does not know whether the interior is safe. Suddenly the fake-looking business has a customer standing in it.',choices:[['Take the greenhouse job','Turn the cover into real work','life:greenhouseContract','AUTO'],['Ask for more site details','Information before mileage','study:greenhouse site','94%'],['Price the job carefully','Do not work for free because you are excited','study:recovery pricing','92%'],['Prep the car and tools','Make tomorrow boring in the good way','inspect:car','AUTO'],['Decline it','You still choose what kind of business this becomes','life:decline','AUTO']]},
{thread:'GREENHOUSE RUN',mood:'🌱 DAY 10 · OFF THE CORRIDOR',title:'The Greenhouse That Never Quite Died',text:'The glass is mostly gone, but the greenhouse is anything but dead. Vines have grown through steel shelving and wrapped old coolant lines in thick green ropes. Somewhere under all of it sits the refrigeration unit you came for. The place is quiet enough that every drip sounds intentional.',choices:[['Work your way inside','Treat it like a recovery site, not a dungeon','life:greenhouse','AUTO'],['Study the plant growth','The Verdant keeps rewriting ordinary ecology','study:shift flora','92%'],['Inspect your tools first','Know exactly what you brought','inspect:tools','AUTO'],['Alter your work light','Better illumination · 1 AP','alter:tools:efficiency:1','88%'],['Back out and reassess','Curiosity is not a safety harness','life:rest','AUTO']]},
{thread:'HOME VOICES',mood:'📱 DAY 11 · FAMILY CALL',title:'The Power Everybody Laughs About',text:'A family video call turns into the usual stories. One cousin makes a spoon twitch across the table and everybody laughs. Someone else warms a plate without touching the microwave. Nobody calls those things powers. Not seriously. The family has spent so long making the strange small that “normal” feels inherited.',choices:[['Laugh with them','You know the ritual','life:familytrick','AUTO'],['Ask if anyone ever trained seriously','See how fast the room changes','life:familytrain','AUTO'],['Ask about your uncle','Touch the forbidden family thread','life:uncle','AUTO'],['Mention your own experiments','Tell a little truth','life:familytruth','AUTO'],['Keep your mouth shut','Listen instead','life:familylisten','AUTO']]},
{thread:'LOCAL MARKET',mood:'⛺ DAY 12 · SALVAGE ROW',title:'Market Day Under Tarps',text:'Once a week, a settlement two roads over becomes a patchwork market of stripped motors, food stalls, repaired electronics, hand tools, strange Verdant finds and people who can identify half of what they sell. The other half comes with confident lies.',choices:[['Buy a compact field pack','Spend $260 on better field gear','life:buyfieldpack','AUTO'],['Browse the strange tables','Learn what locals think is valuable','life:marketbrowse','AUTO'],['Sell ordinary recovered scrap','Turn clutter into cash','life:marketsell','AUTO'],['Talk shop with recovery crews','Build local knowledge','study:recovery crews','92%'],['Keep your money','Looking is free','life:rest','AUTO']]},
{thread:'MAPPING ERROR',mood:'🛣️ DAY 13 · WRONG ROAD',title:'A Road That Was Not On Yesterday’s Map',text:'A narrow paved spur cuts away from a route you drove three days ago. You are almost certain it was not there. The map shows nothing. The pavement is old enough to have roots lifting it. Either memory is lying, the map is terrible, or the Verdant has another answer.',choices:[['Follow it carefully','See where the impossible road goes','life:newroad','AUTO'],['Mark the coordinates','Treat wonder like field data','life:markroad','AUTO'],['Ask locals first','Someone may know the boring answer','study:local routes','92%'],['Improve the Virog 4 for rough ground','Small performance change · 2 AP','alter:car:performance:2','80%'],['Leave it for another day','Mysteries do not expire because you sleep','life:rest','AUTO']]},
{thread:'THE RAINLINE',mood:'🌧️ DAY 14 · SHIFT WEATHER',title:'Rain Falls In A Perfect Line',text:'The storm arrives sideways and stops fifty yards from the road. Not fades. Stops. On one side, hard warm rain hammers leaves flat. On the other, dry dust lifts around your shoes. The boundary runs straight through the trees farther than you can see.',choices:[['Watch the boundary','Sometimes observation is the adventure','life:rainline','AUTO'],['Study the weather pattern','Build a theory before touching anything','study:shift weather','90%'],['Drive along the edge','See how far the line holds','life:rainroad','AUTO'],['Test a claimed object at the boundary','Compare your power to the phenomenon','inspect:selected','AUTO'],['Head back to the yard','Beautiful is not the same as safe','life:rest','AUTO']]},
{thread:'MOMENTUM',mood:'💵 DAY 15 · TWO WEEKS IN',title:'The Business Starts Paying You Back',text:'Two weeks in, the numbers are not impressive, but they are real. A few recovery jobs have paid. People know where your yard is. Someone leaves a voicemail asking whether you take equipment retrieval work farther off the corridor. You came here chasing your power. Somehow you are also building a life.',choices:[['Take a better-paying contract','Let the business grow with you','life:betterjob','AUTO'],['Put money into the yard','Spend $300 making the work bay better','life:yardinvest','AUTO'],['Review your cash and gear','See what you can actually afford','inspect:tools','AUTO'],['Call home with good news','Give the family something real to celebrate','life:family','AUTO'],['Take a full day off','Success does not require immediate escalation','life:rest','AUTO']]},
{thread:'FIELD CONTRACT',mood:'💧 DAY 16 · BELOW GRADE',title:'The Pump House Below Grade',text:'The better contract leads to a half-flooded pump house where the useful equipment is one level down. The stairwell is intact. The lower room is not. Water covers the floor, old panels hang open, and a retrieval target sits on the far platform looking much heavier than it did in the listing photo.',choices:[['Plan the recovery normally','Ropes, leverage, patience','life:pumphouse','AUTO'],['Study the pump equipment','Know what can safely be moved','study:pump systems','92%'],['Inspect your field gear','Inventory before improvisation','inspect:tools','AUTO'],['Alter the recovery straps','Strength and reliability · 2 AP','alter:tools:integrity:2','84%'],['Walk away from bad conditions','A contract is not a suicide pact','life:rest','AUTO']]},
{thread:'DISTANCE',mood:'✦ DAY 17 · CLAIM TEST',title:'You Feel It From Across The Yard',text:'You are locking the gate when you think about one of your claimed items still inside the work bay. For a heartbeat you know exactly where it is without seeing it. Not direction in the normal sense. More like the fact of “mine” has a location attached to it.',choices:[['Test the sensation deliberately','See how far Claim reaches','life:distance','AUTO'],['Compare several owned objects','Look for consistency','study:claim distance','90%'],['Push until the feeling breaks','Find the edge carefully','study:claim limits','86%'],['Write down the experience','Keep assumptions separate from evidence','life:record','AUTO'],['Leave it alone tonight','You do not need every answer at once','life:rest','AUTO']]},
{thread:'OLD WORDS',mood:'📄 DAY 18 · JUNK BOX',title:'A Page In A Box Of Junk',text:'At the market you find a water-stained notebook page tucked inside a box of old survey manuals. Most of it is measurements and route notes. One sentence is boxed twice in faded ink: “The first rule was useful. Useful is not the same as true.” No name. Under it, three rough circles overlap around a single word: CLAIM.',choices:[['Buy the whole box','Spend $40 and keep the page','life:buybox','AUTO'],['Ask the vendor who brought it in','Follow provenance instead of prophecy','life:vendor','AUTO'],['Study the page in detail','Look for dates, places, patterns','study:old notebook','90%'],['Photograph it and leave it','Information does not require ownership','life:photoNote','AUTO'],['Ignore it','Coincidences are allowed to be coincidences','life:rest','AUTO']]},
{thread:'NEW PROPERTY',mood:'🏚️ DAY 19 · OUTER VERDANT',title:'The Old Relay Shack',text:'A contract route ends beside a decommissioned relay shack half-buried in vines. The registry tag is still readable: retired, public equipment removed, property claim lapsed years ago. The roof needs work. The door barely closes. It is also farther into the Verdant than your rented yard and sitting on a small rise with three old service roads feeding it.',choices:[['Stake a Claim on the shack','See whether a place can become yours','life:claimrelay','AUTO'],['Inspect the structure normally','Know what you are looking at first','life:relayinspect','AUTO'],['Research the old registry','Make sure “abandoned” is actually abandoned','study:relay records','94%'],['Mark it for later','You do not have to own every opportunity','life:markrelay','AUTO'],['Walk away','A ruin can remain a ruin','life:rest','AUTO']]},
{thread:'BEHIND THE WALL',mood:'🔦 DAY 20 · RELAY INTERIOR',title:'There Is A Room The Floorplan Forgot',text:'Behind a warped equipment wall is a narrow service door with no match on the public layout. The room beyond is dry. Too dry. Old mounts line the walls where equipment was removed long ago, but one palm-sized plate remains fixed to a central pedestal. It looks ordinary until the light hits it at the wrong angle.',choices:[['Search the hidden room','Treat it like a site, not a treasure chest','life:relaysearch','AUTO'],['Inspect the remaining plate','Start with what is physically there','life:plate','AUTO'],['Study the old wiring paths','Figure out what the room once did','study:relay systems','90%'],['Alter your work light','See whether better light changes anything · 1 AP','alter:tools:efficiency:1','88%'],['Seal it back up for now','Mystery can wait behind a locked door','life:rest','AUTO']]},
{thread:'NEW WORD',mood:'✦ DAY 21 · ALTERATION',title:'A Word That Should Not Be There',text:'You focus on the plate again. It is not yours. You have not Claimed it. Alteration should stay silent. Instead the sensation catches for a fraction of a second and gives you something that is not Condition, Integrity, or any property you have seen before. One word: ORIGIN. Then the readout collapses.',choices:[['Try to hold ORIGIN in focus','Test the new category carefully','life:origin','AUTO'],['Compare it to Claim','Ask whether ownership was ever the real gate','study:claim assumptions','88%'],['Record everything','Do not trust adrenaline as memory','life:record','AUTO'],['Think about the notebook sentence','Useful is not the same as true','study:old notebook','90%'],['Leave the room','Three weeks ago you only wanted to improve a tool kit','life:weekthree','AUTO']]},
{thread:'OPEN FRONTIER',mood:'🗺️ AFTER THREE WEEKS',title:'The Verdant Is Bigger Now',text:'You have a functioning little recovery operation, three weeks of field experience and more questions about Alteration than when you arrived. Paid jobs, strange roads, abandoned property, local rumors and your own experiments are all pulling in different directions. None of them has become a mandatory quest. The frontier is simply open.',choices:[['Check recovery postings','Keep the business alive','life:jobs','AUTO'],['Drive an unfamiliar route','Follow curiosity instead of paperwork','life:explore','AUTO'],['Work with a Claim','Experiment on something you actually own','inspect:selected','AUTO'],['Study the Verdant','Build field knowledge','study:verdant fieldcraft','94%'],['Take a normal day','Adventure is not a timecard','life:rest','AUTO']]}
];
const EVENTS=[
{id:'family',thread:'RANDOM EVENT',mood:'📞 HOME CALL',title:'The Family Checks In',text:'Someone from home calls to make sure the new “salvage business” has not already eaten all the seed money. The concern is real. So is the assumption that this is just a normal business venture.',chip:'Family is checking on the new operation.',choices:[['Give the respectable update','Business, yard, paperwork. Nothing strange.','event:family:normal','AUTO'],['Mention the Verdant is incredible','Leave the power part out','event:family:wonder','AUTO'],['Ask about your uncle','Test the old family story gently','event:family:uncle','AUTO'],['Change the subject','No reason to poke that thread yet','event:family:skip','AUTO'],['Tell them you are doing fine','Short and true','event:family:fine','AUTO']]},
{id:'notice',thread:'RANDOM EVENT',mood:'📋 RECOVERY BOARD',title:'A Small Recovery Notice',text:'A local posting offers modest money to retrieve intact electrical equipment from an abandoned service spur. Nothing legendary. Exactly the kind of job your family thinks you moved here to do.',chip:'A small paid recovery notice appeared.',choices:[['Take the job','Make the business real','event:notice:take','AUTO'],['Research the location first','Know what the map leaves out','study:service spur','94%'],['Ask locals about it','Rumors are data too','study:local routes','92%'],['Pass for now','You do not owe the business momentum','event:notice:pass','AUTO'],['Drive by without committing','See the area first','life:explore','AUTO']]},
{id:'beacon',thread:'RANDOM EVENT',mood:'📡 CLAIM QUESTION',title:'Something Old Beside The Road',text:'Half under a wall of vines sits an obsolete survey beacon with a faded abandonment mark. No active owner is listed on the public tag. When you focus on it, the Alter sense stays quiet. When you think, very deliberately, “mine,” something almost answers.',chip:'You found an apparently abandoned survey beacon.',choices:[['Stake a recovery claim','Treat the abandonment mark as permission','event:beacon:claim','AUTO'],['Inspect it without claiming','See what ordinary observation tells you','event:beacon:inspect','AUTO'],['Photograph the tag','Verify it later','event:beacon:photo','AUTO'],['Leave it alone','Not every mystery needs touching','event:beacon:leave','AUTO'],['Sit with that almost-answer','Study the Claim sensation itself','study:claim sense','90%']]},
{id:'weather',thread:'RANDOM EVENT',mood:'🌧️ VERDANT WEATHER',title:'Rain Changes The Road',text:'A hard warm rain hits fast enough to turn a side road into flowing mud. The maintained corridor is fine. The interesting road is not.',chip:'Heavy rain changed access to the side roads.',choices:[['Stay on maintained roads','Adventure can wait one day','event:weather:safe','AUTO'],['Inspect the Virog 4','See what it can safely handle','inspect:car','AUTO'],['Improve traction indirectly','Alter performance modestly · 2 AP','alter:car:performance:2','80%'],['Study local road conditions','Learn before improvising','study:verdant roads','94%'],['Turn back and relax','No shame in not drowning the Virog','life:rest','AUTO']]}
];
const INTERNALS={
 car:{
  basic:'The Virog 4 resolves as systems rather than a single Performance number: powertrain, cooling, electrical, braking, steering, suspension, tires, cabin systems and structural shell.',
  deep:'Focusing deeper separates the powertrain from its support systems, the suspension into spring/damper geometry and mounting points, braking into friction hardware and hydraulic/control paths, and the body into load-bearing structure versus exterior panels. Alter does not yet hand you engineering answers automatically; it shows you what is there well enough to ask better questions.'
 },
 console:{
  basic:'Inside the gaming system you can distinguish the main board, processor package, memory, storage, cooling assembly, power delivery, wireless hardware, ports and the physical shell.',
  deep:'The read sharpens into thermal paths, power-delivery stages, board traces, memory and storage interfaces, fan and heat-sink geometry, shielding, connectors and firmware-controlled components. You understand the layout more clearly than the design theory behind every part.'
 },
 tools:{
  basic:'You actually unpack the kit instead of reading a stat block. You brought a ratchet and socket set, combination wrenches, screwdrivers and bit drivers, lineman’s pliers, needle-nose pliers, side cutters, adjustable wrench, compact pry bar, utility knife, tape measure, compact electrical meter with probes, rechargeable work light, two recovery straps, tie-downs, work gloves, electrical tape, zip ties, spare fasteners and a small pouch of connectors and terminals.',
  deep:'When you focus, each piece separates by material, wear surface, joint, grip, fastener interface and intended load. The meter is its own little system of probes, protection, display electronics and power. The straps read as fibers, stitching, hooks and load paths. “Tool kit” was only your human shorthand.'
 },
 beacon:{
  basic:'Under the weathered shell are an old power cell, transmitter board, sensor package, calibration hardware, antenna feed, sealed connectors and a surprisingly dense central mounting block.',
  deep:'The beacon separates into power, sensing, timing, transmission and environmental sealing. Corrosion is worst around the lower connector bank. One sealed central module is physically intact but still semantically fuzzy to your Alter sense, as if you know where it is without yet knowing what category to call it.'
 },
 fieldpack:{
  basic:'The field pack resolves as fabric shell, frame sheet, straps, buckles, weather liner, padded pockets, tool loops and a compact power bank pocket.',
  deep:'You can distinguish load paths through the shoulder straps, abrasion zones, stitching patterns, water-entry points and how the internal dividers distribute weight.'
 },
 relay:{
  basic:'The relay shack separates into foundation, frame, roof, wall panels, door hardware, old conduit, grounding, ventilation and the stripped remains of its electrical service.',
  deep:'The structure reads less like a building and more like connected systems: weather barrier, load paths, grounding network, cable routes, moisture intrusion and several sealed voids not represented on the public floorplan.'
 }
};
function sceneFocus(){
 if(S.day===6)return'cabinet';
 if(S.day===4&&!S.items.beacon)return'beacon_unclaimed';
 if((S.day===19||S.day===20||S.day===21)&&!S.items.relay)return'relay_unclaimed';
 if((S.day===19||S.day===20||S.day===21)&&S.items.relay)return'relay';
 return S.selected;
}
const WORLD_TARGETS={
 gate:{
  name:'collapsed access gate',
  keywords:/\b(?:collapsed\s+)?(?:access\s+)?gate\b/,
  active:()=>S.day===5,
  inspect:'The collapsed access gate is old galvanized steel on a concrete track, bent inward where one hinge post shifted. Vines have threaded through the lower mesh, but the real blockage is mechanical: the frame is twisted and the roller no longer sits square in its guide. It is part of the site, not part of your recovery contract.',
  alter:'You focus on the gate and deliberately reach for Alteration. Nothing becomes writable. No CONDITION. No INTEGRITY. No familiar internal clarity. The power does not reject you dramatically; it simply never settles onto the gate. Your current explanation is immediate and comfortable: it is not yours. No AP is spent because no Alteration actually takes hold.'
 },
 cabinet:{
  name:'sealed maintenance cabinet',
  keywords:/\b(?:maintenance\s+)?cabinet\b/,
  active:()=>S.day===6,
  inspect:'The sealed cabinet is built into the station wall: old switchgear, heavy bus bars, relays, service cable, fused disconnects and one smaller sealed module deeper inside. There is no active owner tag and no stable Claim readout.',
  alter:'You try to reach for the cabinet the same way you would one of your Claims. For an instant the old impossible fragment almost returns, then slips away before you can hold it. The cabinet still does not become writable. No AP is spent.'
 },
 growth:{
  name:'Verdant growth',
  keywords:/\b(?:vines?|growth|plants?|roots?)\b/,
  active:()=>S.day===9||S.day===10,
  inspect:'The growth is physically real and ordinary enough to touch, but its behavior is odd: stems and roots favor seams, fasteners and old infrastructure instead of simply spreading through open soil.',
  alter:'You reach for the living growth with Alteration. It does not resolve as one of your Claims. No stable writable properties appear. Whatever the power may eventually do with living systems, you do not know how to access that yet.'
 },
 rainline:{
  name:'rain boundary',
  keywords:/\b(?:rainline|rain\s+line|rain\s+boundary|storm\s+boundary|weather\s+line)\b/,
  active:()=>S.day===14,
  inspect:'The rain stops along an unnaturally clean boundary. Leaves crossing it go from dry to soaked immediately. The line shifts by inches but holds its overall shape.',
  alter:'You try to treat the rain boundary as a target. Alteration gives you nothing stable to grip. It may not be an object in any useful sense, or your idea of what counts as a target may be too narrow. No AP is spent.'
 },
 crossing:{
  name:'flooded crossing',
  keywords:/\b(?:crossing|flooded\s+road|water|current)\b/,
  active:()=>S.day===12||S.day===16,
  inspect:'The water itself is not mysterious. The danger is speed, depth, footing and whatever the road surface is doing underneath it.',
  alter:'You reach for the crossing as though “make this easier” were enough of a target. It is not. Alteration does not accept an outcome as a property. Nothing changes, and no AP is spent.'
 },
 plate:{
  name:'dark pedestal plate',
  keywords:/\b(?:plate|pedestal\s+plate|dark\s+plate)\b/,
  active:()=>S.day===20||S.day===21,
  inspect:'The palm-sized plate is smooth, dark, slightly warm and fixed to the pedestal with no visible fasteners. Ordinary inspection explains almost nothing.',
  alter:'You reach for the plate without Claiming it. For a heartbeat something catches, but not enough to become a normal writable readout. The sensation is categorically different from a clean Claim. You cannot force it into a normal Alteration.'
 }
};
function worldTargetFromText(low){
 for(const [id,w] of Object.entries(WORLD_TARGETS)){
  if(w.active()&&w.keywords.test(low))return'world:'+id;
 }
 return null;
}
function worldTarget(id){
 return id&&id.startsWith('world:')?WORLD_TARGETS[id.slice(6)]:null;
}
function inspectWorldTarget(id){
 const w=worldTarget(id);
 if(!w){S.result='There is no clear world target in the current scene.';return}
 S.result=w.inspect;
 S.journal.unshift('Day '+S.day+' · Examined '+w.name+'.');
}
function attemptWorldAlter(id){
 const w=worldTarget(id);
 if(!w){S.result='Alteration cannot find a definite target in that request.';return}
 S.result='✦ ALTERATION ATTEMPT · '+w.name.toUpperCase()+'\n\n'+w.alter;
 S.knowledge['world-target attempts']=(S.knowledge['world-target attempts']||0)+1;
 S.journal.unshift('Day '+S.day+' · Attempted Alteration on '+w.name+' without an established Claim.');
}

function resolveTargetFromText(low){
 const world=worldTargetFromText(low);if(world)return world;
 if(/maintenance cabinet|cabinet/.test(low))return'cabinet';
 if(/survey beacon|beacon/.test(low))return S.items.beacon?'beacon':'beacon_unclaimed';
 if(/car|vehicle|coupe/.test(low))return'car';
 if(/game|console|gaming system/.test(low))return'console';
 if(/relay shack|relay|shack/.test(low))return S.items.relay?'relay':'relay_unclaimed';
 if(/field pack|pack|backpack/.test(low))return S.items.fieldpack?'fieldpack':S.selected;
 if(/tool|gear|kit/.test(low))return'tools';
 if(/\bit\b|inside|internals?|components?|composition|made of|detail/.test(low))return sceneFocus();
 return S.selected;
}
function deepInspect(id){
 if(id&&id.startsWith('world:')){inspectWorldTarget(id);return}
 if(id==='cabinet'){
  S.result='You stop treating the cabinet like a stat block and actually examine it. Behind the sealed doors are old switchgear, heavy bus bars, control relays, bundled service cable, fused disconnects and faded maintenance labels. Several circuits have been physically removed. One smaller sealed module sits deeper in the cabinet with no readable purpose marking. Your ordinary eyes can see all of that. The strange part is what Alter does not do: there is no stable Claim readout, only the memory of that impossible one-word flicker: CONDITION.';
  S.journal.unshift('Day '+S.day+' · Examined the maintenance cabinet in physical detail.');
  return;
 }
 if(id==='relay_unclaimed'){
  S.result='You inspect the old relay shack without trying to Claim it. The foundation is sound enough to stand, the roof has two obvious leak paths, the west wall is bowed around an old cable entry, and most of the electrical equipment has been stripped. The public tag and physical abandonment agree: nobody has cared for this place in a long time.';
  S.journal.unshift('Day '+S.day+' · Inspected the unclaimed relay shack.');
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
function fresh(name){return{name:name||'Jace',premise:BACKGROUND,day:1,money:4800,baseAP:6,ap:6,maxAP:6,items:{car:clone('car'),console:clone('console'),tools:clone('tools')},selected:'tools',knowledge:{'alteration sense':1,'claim sense':1},journal:['Day 1 · Crossed into the Verdant to begin a recovery and salvage operation.','Day 1 · Before the move, traded the sports car for a used Virog 4 AWD field car.','Day 1 · The family believes the move is about honest blue-collar work. That is only half true.'],alterations:0,worthUnlocked:false,currentEvent:null,lastEvent:null,claims:['car','console','tools'],threads:{business:true,serviceSpur:false,oldTraveler:false,uncle:false},usedChoices:{},result:'The last staffed post disappears in the mirror. For the first time, nobody at home is close enough to tell you to leave the power alone.'}}
function save(){localStorage.setItem(SAVE,JSON.stringify(S))}
function totalWorth(){return Object.values(S.items).reduce((n,x)=>n+(x.worth||0),0)}
function worthBonus(){if(!S.worthUnlocked)return 0;const t=totalWorth();return thresholds.filter(x=>t>=x).length}
function nextThreshold(){const t=totalWorth();return thresholds.find(x=>x>t)||null}
function knowledgeTotal(){return Object.values(S.knowledge||{}).reduce((a,b)=>a+b,0)}
function maybeUnlockWorth(){if(!S.worthUnlocked&&S.day>=12&&S.alterations>=5&&knowledgeTotal()>=7){S.worthUnlocked=true;S.journal.unshift('Day '+S.day+' · New sense unlocked: Worth.');$('worthUnlock').classList.remove('hidden');S.result='✦ WORTH UNLOCKED. This is not a price tag. Claimed things carry a deeper weight, and you can suddenly feel the total.';return true}return false}
function scene(){if(S.currentEvent)return EVENTS.find(e=>e.id===S.currentEvent)||NORMAL[0];return NORMAL[Math.min(S.day-1,NORMAL.length-1)]}
function choiceKey(action){return S.day+'|'+(S.currentEvent||'day')+'|'+action}
function markUsedAction(action){
 if(!action)return false;
 S.usedChoices=S.usedChoices||{};
 const sc=scene(),exists=(sc.choices||[]).slice(0,5).some(c=>c[2]===action);
 if(!exists)return false;
 S.usedChoices[choiceKey(action)]=true;
 return true;
}
function words(s){
 return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>3&&!['this','that','with','from','into','about','your','what','have','just','look','read','study','research'].includes(w));
}
function bestStudyChoice(topic){
 const sc=scene(),tw=words(topic);if(!tw.length)return null;
 let best=null,bestScore=0;
 (sc.choices||[]).slice(0,5).forEach(c=>{
  if(!c[2].startsWith('study:'))return;
  const hay=words(c[0]+' '+c[1]+' '+c[2].slice(6));
  const score=tw.filter(w=>hay.some(h=>h===w||h.includes(w)||w.includes(h))).length;
  if(score>bestScore){bestScore=score;best=c[2]}
 });
 return bestScore>0?best:null;
}
function markTypedEquivalent(kind,target,detail){
 const sc=scene(),actions=(sc.choices||[]).slice(0,5).map(c=>c[2]);
 let action=null;
 if(kind==='inspect'||kind==='deep'){
  if(target==='beacon_unclaimed')action=actions.find(a=>a==='event:beacon:inspect')||null;
  else if(target==='cabinet')action=actions.find(a=>a==='study:claim contradiction'||a==='study:service ownership')||null;
  else action=actions.find(a=>a===('inspect:'+target))||null;
 }
 if(kind==='alter')action=actions.find(a=>a.startsWith('alter:'+target+':'))||null;
 if(kind==='claim'&&(target==='beacon'||target==='beacon_unclaimed'))action=actions.find(a=>a==='event:beacon:claim')||null;
 if(kind==='study')action=bestStudyChoice(detail);
 if(kind==='life'&&detail)action=actions.find(a=>a===detail)||null;
 return markUsedAction(action);
}
function categoryItems(cat){return Object.entries(S.items).filter(([,v])=>v.category===cat)}
function categoryStat(cat,entries){const focus=(CAT[cat]||CAT.other).focus,vals=entries.map(([,x])=>x[focus]||0).filter(v=>v>0);return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0}
const SCENE_VISUALS={
  1:['road','THE VERDANT ROAD','Beyond the last staffed post'],
  2:['foothold','HOME BASE','Rented gravel, work bay, first real base'],
  3:['board','RECOVERY BOARD','Work begins to find you'],
  4:['beacon','OLD SERVICE ROAD','Vines, survey hardware, uncertain Claim'],
  5:['service','SERVICE SPUR','Collapsed gate and corroded infrastructure'],
  6:['station','OLD FLOOD STATION','The first contradiction'],
  7:['roadside','ROADSIDE EATERY','Local crews and an old word'],
  8:['foothold','HOME BASE','A name on the gate'],
  9:['foothold','HOME BASE','Your first walk-in customer'],
  10:['greenhouse','ABANDONED GREENHOUSE','Steel, vines, and a live recovery site'],
  11:['homecall','FAMILY CALL','Home feels different from out here'],
  12:['market','SALVAGE ROW','Tarps, tools, rumors, and recovered things'],
  13:['road','UNMAPPED SPUR','A road you do not remember'],
  14:['rainline','THE RAINLINE','Weather stops in a perfect line'],
  15:['foothold','HOME BASE','The business starts paying back'],
  16:['pump','OLD PUMP HOUSE','Water below, equipment beyond'],
  17:['foothold','HOME BASE','Claim gains distance'],
  18:['market','SALVAGE ROW','An old page in a junk box'],
  19:['relay','OLD RELAY SHACK','A possible foothold deeper in'],
  20:['relayinside','HIDDEN RELAY ROOM','A room the floorplan forgot'],
  21:['relayinside','THE PEDESTAL ROOM','One impossible word: ORIGIN']
};
function updateSceneWindow(){
  if(!$('sceneWindow'))return;
  const v=SCENE_VISUALS[Math.min(S.day,21)]||['foothold','THE VERDANT','Your life beyond the corridor'];
  $('sceneWindow').dataset.scene=v[0];
  $('scenePlace').textContent=v[1];
  $('sceneFlavor').textContent=v[2];
  $('sceneKicker').textContent=S.currentEvent?'LIVE EVENT':'CURRENT SCENE';
}

function render(){
 document.body.classList.add('playing');
 $('setup').classList.add('hidden');$('game').classList.remove('hidden');$('who').textContent=S.name;$('premise').textContent=S.premise||BACKGROUND;$('day').textContent=S.day;$('money').textContent='$'+S.money.toLocaleString();
 const weekNo=Math.ceil(S.day/7),phase=S.day<=7?'FOOTHOLD':S.day<=14?'ROOTS':S.day<=21?'DEEP VERDANT':'OPEN FRONTIER';
 if($('weekLabel'))$('weekLabel').textContent=S.day<=21?weekNo:'OPEN';
 if($('phaseLabel'))$('phaseLabel').textContent=phase;
 if($('weekTrack'))$('weekTrack').style.width=(S.day<=21?((((S.day-1)%7)+1)/7)*100:100)+'%';
 S.maxAP=S.baseAP+worthBonus();if(S.ap>S.maxAP)S.ap=S.maxAP;$('apText').textContent=S.ap+'/'+S.maxAP;$('apdots').innerHTML='';
 for(let i=0;i<S.maxAP;i++){const d=document.createElement('i');d.className='dot'+(i<S.ap?' on':'');$('apdots').appendChild(d)}
 const tw=totalWorth();$('worthTotal').textContent=tw;$('worthTotalTop').textContent=tw;$('stats').classList.toggle('hasWorth',S.worthUnlocked);const showWorth=S.worthUnlocked&&alterStage()>=2;$('worthStat').classList.toggle('hidden',!showWorth);$('worthSummary').classList.toggle('show',showWorth);
 if(S.worthUnlocked){const nx=nextThreshold();$('worthNext').innerHTML=nx?'NEXT RESONANCE<br><b>'+(nx-tw)+' WORTH AWAY</b>':'KNOWN RESONANCE<br><b>MAXED FOR NOW</b>'}
 const sc=scene();updateSceneWindow();$('thread').textContent=sc.thread;$('mood').textContent=sc.mood;$('sceneTitle').textContent=sc.title;$('sceneText').textContent=sc.text;$('result').textContent=S.result||'';
 $('eventChip').className='eventChip'+(S.currentEvent?' show':'');$('eventChip').textContent=S.currentEvent?'✦ '+sc.chip:'';
 $('choices').innerHTML='';sc.choices.slice(0,5).forEach((c,i)=>{const key=choiceKey(c[2]),used=!!(S.usedChoices&&S.usedChoices[key]),b=document.createElement('button');b.className='choice'+(used?' used':'');b.type='button';b.disabled=used;b.innerHTML='<span class="num">'+(used?'✓':(i+1))+'</span><span><strong>'+c[0]+'</strong><small>'+c[1]+'</small></span><span class="chance">'+(used?'USED':c[3])+'</span>';b.onclick=()=>{S.usedChoices=S.usedChoices||{};S.usedChoices[key]=true;handle(c[2])};$('choices').appendChild(b)});
 renderCategories();renderSelected();renderGrowth();renderJournal();save();
}
function alterStage(){
 if(S.worthUnlocked||S.day>=15||knowledgeTotal()>=9)return 2;
 if(S.day>=8||S.alterations>=3||knowledgeTotal()>=5)return 1;
 return 0;
}
function updateAlterSense(){
 const st=alterStage();
 if(!$('alterSenseTitle'))return;
 if(st===0){
  $('alterSenseTitle').textContent='CLAIM · BASIC READ';
  $('alterSenseHint').textContent='Owned things feel clear. Start with broad changes and questions.';
 }else if(st===1){
  $('alterSenseTitle').textContent='CLAIM · WORKING MODEL';
  $('alterSenseHint').textContent='Field experience is separating broad properties into useful choices.';
 }else{
  $('alterSenseTitle').textContent=S.worthUnlocked?'ALTERATION · EXPANDED SENSE':'CLAIM · DEEPER CONTROL';
  $('alterSenseHint').textContent=S.worthUnlocked?'A new layer of value and resonance has become legible.':'You can now read and manipulate more of a Claim deliberately.';
 }
}
function renderCategories(){
 const box=$('categories');box.innerHTML='';const st=alterStage();
 if(st===0){
  const wrap=document.createElement('div');wrap.className='simpleClaims';
  Object.entries(S.items).forEach(([id,x])=>{
   const b=document.createElement('button');b.className='simpleClaim'+(id===S.selected?' active':'');b.type='button';
   b.innerHTML='<span class="icon">'+x.icon+'</span><span><strong>'+x.name+'</strong><small>'+((x.claimType==='recovered')?'Recovered Claim':'Established Claim')+'</small></span><span class="claimMark">CLAIM</span>';
   b.onclick=()=>{S.selected=id;render()};
   wrap.appendChild(b);
  });
  box.appendChild(wrap);return;
 }
 [...new Set(Object.values(S.items).map(x=>x.category))].forEach(cat=>{
  const meta=CAT[cat]||CAT.other,entries=categoryItems(cat),stat=categoryStat(cat,entries),worth=entries.reduce((n,[,x])=>n+x.worth,0),sel=S.items[S.selected]&&S.items[S.selected].category===cat,d=document.createElement('details');d.className='cat';d.open=sel;
  d.innerHTML='<summary><span class="catIcon">'+meta.icon+'</span><span><strong>'+meta.name+'</strong><span class="catMeta">'+entries.length+' '+(entries.length===1?'claim':'claims')+(st>=2?' · '+meta.focus.toUpperCase()+' '+stat:'')+'</span></span><span class="catValue">'+(S.worthUnlocked&&st>=2?'W '+worth:'DETAILS')+'</span></summary><div class="catItems"></div>';
  const inner=d.querySelector('.catItems');entries.forEach(([id,x])=>{const b=document.createElement('button');b.className='prop'+(id===S.selected?' active':'');b.type='button';b.innerHTML='<span class="icon">'+x.icon+'</span><span><strong>'+x.name+'</strong><small>'+(x.mods.length?x.mods.slice(-2).join(' · '):(x.claimType==='recovered'?'Recovered claim':'Established claim'))+'</small></span><span class="mini">'+(S.worthUnlocked&&st>=2?'W '+x.worth:'COND '+x.condition)+'</span>';b.onclick=()=>{S.selected=id;render()};inner.appendChild(b)});box.appendChild(d)
 });
}
function renderSelected(){
 const x=S.items[S.selected]||Object.values(S.items)[0];if(!x)return;const st=alterStage();updateAlterSense();
 $('propName').textContent=x.name;$('propMods').textContent=st===0?'CLAIMED':(x.mods.length?(x.mods.length+' MOD'+(x.mods.length===1?'':'S')):'CLAIMED');const art=$('claimArt');if(art)art.className='claimArt'+(S.selected==='car'?' vehicle':'');
 let stats=[['Condition',x.condition],['Integrity',x.integrity],['Efficiency',x.efficiency]];
 if(st>=1&&x.performance)stats.push(['Performance',x.performance]);
 if(st>=2&&x.comfort)stats.push(['Comfort',x.comfort]);
 if(st>=2&&S.worthUnlocked)stats.push(['Worth',x.worth]);
 $('readout').innerHTML=stats.map(v=>'<div class="meter">'+v[0]+'<b>'+v[1]+'</b></div>').join('');
 $('alterChoices').innerHTML='';alterOptions(S.selected,x).forEach(o=>{const b=document.createElement('button');b.className='alterChoice';b.type='button';b.innerHTML='<strong>'+o[0]+'</strong><small>'+o[1]+'</small>';b.onclick=()=>handle(o[2]);$('alterChoices').appendChild(b)});
}
function alterOptions(id,x){
 const st=alterStage();
 if(st===0)return[
  ['ALTER','Make a small broad refinement · 1 AP','alter:'+id+':condition:1'],
  ['Inspect Deeper','Ask what is actually here. No AP.','inspect:'+id]
 ];
 if(st===1){
  const o=[
   ['Restore / Refine','Improve overall physical condition · 1 AP','alter:'+id+':condition:1'],
   ['Improve Efficiency','Reduce waste or friction · 2 AP','alter:'+id+':efficiency:2'],
   ['Inspect Deeper','See what your current knowledge can resolve.','inspect:'+id]
  ];
  if(x.performance)o.splice(2,0,['Improve Performance','Push useful capability upward · 2 AP','alter:'+id+':performance:2']);
  else o.splice(2,0,['Improve Integrity','Strengthen what is already there · 2 AP','alter:'+id+':integrity:2']);
  return o;
 }
 const o=[['Restore / Refine','Broad physical improvement · 1 AP','alter:'+id+':condition:1'],['Improve Efficiency','Reduce waste or friction · 2 AP','alter:'+id+':efficiency:2']];
 if(x.performance)o.push(['Improve Performance','Push capability upward · 2 AP','alter:'+id+':performance:2']);else o.push(['Improve Integrity','Strengthen what already exists · 2 AP','alter:'+id+':integrity:2']);
 o.push(['Inspect Deeper','Spend no AP. See what you currently understand.','inspect:'+id]);
 const deep=knowledgeTotal()>=7;o.push([deep?'Explore Another Approach':'Study This Category',deep?'Knowledge may reveal a different route instead of only improving the obvious property.':'Learning widens what Alter can perceive.','study:'+x.category+' '+(deep?'alternatives':'systems')]);
 return o;
}
function renderGrowth(){
 const box=$('knowledge');box.innerHTML='';
 if(S.worthUnlocked&&alterStage()>=2){const tw=totalWorth(),nx=nextThreshold(),w=document.createElement('div');w.className='worthCard';w.innerHTML='<strong>✦ RESONANT WORTH · '+tw+' TOTAL</strong><small>'+(nx?('The next known increase in Alteration capacity appears near '+nx+' total Worth. Current daily capacity: '+S.maxAP+' AP.'):'No further Worth threshold is currently understood. Daily capacity: '+S.maxAP+' AP.')+'</small><div class="bar"><i style="width:'+(nx?Math.min(100,(tw/nx)*100):100)+'%"></i></div>';box.appendChild(w)}
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
 else if(type==='sign'){S.threads.businessName=true;S.result='You paint a simple recovery sign and bolt it to the frame. Nothing magical happens. The place just looks a little more like yours, which somehow matters.';}
 else if(type==='greenhouseContract'){S.threads.greenhouse=true;S.result='You take the greenhouse recovery job. The mechanic gives you the old site coordinates and a very specific warning about the floor near the south wall.';}
 else if(type==='decline')S.result='You turn the job down. A business you own is still allowed to say no.';
 else if(type==='greenhouse'){if(!S._greenhousePaid){S._greenhousePaid=true;S.money+=320}S.knowledge['verdant fieldwork']=(S.knowledge['verdant fieldwork']||0)+1;S.result='You work the greenhouse carefully, cutting growth away from the refrigeration unit and moving it without wrecking the old floor. The customer pays $320. More interestingly, several vines had grown around metal without corroding it at all.';}
 else if(type==='familytrick')S.result='You laugh because that is what everybody has always done. The spoon twitches again. For the first time, the joke feels less harmless than unfinished.';
 else if(type==='familytrain'){S.knowledge['family power culture']=(S.knowledge['family power culture']||0)+1;S.result='The call goes quiet for half a beat. Someone says, “Train what?” and everybody moves on too quickly. That answer tells you plenty.';}
 else if(type==='uncle'){S.threads.uncle=true;S.knowledge['uncle thread']=(S.knowledge['uncle thread']||0)+1;S.result='The old story comes back: obsessed, embarrassing, convinced his ability meant something more. Nobody can tell you exactly what he did that proved he was crazy.';}
 else if(type==='familytruth')S.result='You admit you have been experimenting a little. The reactions split between nervous jokes and immediate advice to be careful. Nobody asks what it feels like when you use the power.';
 else if(type==='familylisten')S.result='You listen. Beneath the jokes are dozens of tiny powers nobody ever explored. Your family tree suddenly looks less ordinary than the family mythology allows.';
 else if(type==='buyfieldpack'){if(S.items.fieldpack)S.result='You already bought the field pack.';else if(S.money<260)S.result='You decide $260 is more than you should spend right now.';else{S.money-=260;S.items.fieldpack=clone('fieldpack');S.selected='fieldpack';S.result='You buy the field pack for $260. The instant the sale is complete, it snaps into clarity inside your Claim sense. That transition is becoming hard to dismiss as imagination.';}}
 else if(type==='marketbrowse'){S.knowledge['verdant salvage']=(S.knowledge['verdant salvage']||0)+1;S.result='You browse long enough to learn the local hierarchy of value: working pre-Shift hardware, anything with intact seals, maps with handwritten corrections, and objects nobody can identify but everybody wants to price.';}
 else if(type==='marketsell'){if(S._marketSold)S.result='You already cleared the ordinary scrap worth selling this week.';else{S._marketSold=true;S.money+=180;S.result='You unload ordinary recovered scrap for $180. Not every profit needs a mysterious glow.';}}
 else if(type==='newroad'){S.knowledge['verdant routes']=(S.knowledge['verdant routes']||0)+1;S.result='You follow the old spur far enough to confirm it is real, paved, and absent from every current map. It ends at a washed-out culvert before reaching whatever it once served.';}
 else if(type==='markroad')S.result='You save the coordinates and sketch the turnoff. A mystery becomes a place you can return to.';
 else if(type==='rainline'){S.knowledge['shift weather']=(S.knowledge['shift weather']||0)+1;S.result='You watch for nearly twenty minutes. The line wavers by inches but never breaks. Leaves carried across it go from dry to soaked instantly. Nothing about it behaves like normal weather.';}
 else if(type==='rainroad')S.result='You drive parallel to the boundary for almost two miles before it curves away into dense forest. The line is not random. You just do not know what it is following.';
 else if(type==='betterjob'){S.threads.pumpHouse=true;S.result='You accept a higher-paying equipment recovery contract at an old pump house. The location is farther out and the photos are old enough to be suspicious.';}
 else if(type==='yardinvest'){if(S.money<300)S.result='You decide the yard upgrade can wait.';else{S.money-=300;S.knowledge['business operations']=(S.knowledge['business operations']||0)+1;S.result='You spend $300 on shelving, lighting, locks and a better work surface. The yard still looks rough. It now looks intentionally rough.';}}
 else if(type==='pumphouse'){if(!S._pumpPaid){S._pumpPaid=true;S.money+=420}S.knowledge['field recovery']=(S.knowledge['field recovery']||0)+1;S.result='You rig the recovery carefully and get the unit out without turning the lower room into a disaster. The job pays $420. You are becoming annoyingly competent at the business that was supposed to be your excuse.';}
 else if(type==='distance'){S.knowledge['claim distance']=(S.knowledge['claim distance']||0)+1;S.result='You test the feeling across the yard, then from outside the gate. Claimed objects do not become visible in your mind, but their presence has a faint positional certainty. Claim may be a relationship, not a permission slip.';}
 else if(type==='buybox'){if(S.money<40)S.result='You leave the box where it is.';else{S.money-=40;S.threads.oldNotebook=true;S.knowledge['old notebook']=(S.knowledge['old notebook']||0)+1;S.result='You buy the box for $40. The notebook page is now yours. The phrase does not become clearer through Alteration. The paper does.';}}
 else if(type==='vendor'){S.threads.oldNotebook=true;S.result='The vendor remembers buying the box from an estate lot farther north. No name. Old survey gear, personal papers, and several route maps nobody bothered to keep.';}
 else if(type==='photoNote')S.result='You photograph the page and leave the box. The sentence follows you anyway.';
 else if(type==='claimrelay'){if(S.items.relay)S.result='The relay shack is already yours.';else{establishClaim('relay');S.threads.relay=true;S.result='✦ CLAIM ESTABLISHED: Old Relay Shack. The entire structure hits your perception at once: roof, frame, walls, wiring, foundation, all of it. Claiming a place feels heavier than claiming an object.';}}
 else if(type==='relayinspect'){deepInspect(S.items.relay?'relay':'relay_unclaimed');}
 else if(type==='markrelay')S.result='You mark the location and leave the shack untouched. Opportunity does not require immediate possession.';
 else if(type==='relaysearch'){S.knowledge['relay systems']=(S.knowledge['relay systems']||0)+1;S.result='The hidden room is almost empty, but the dust patterns say equipment once filled the wall mounts. The palm-sized plate on the pedestal is the only component nobody removed.';}
 else if(type==='plate')S.result='The plate is smooth, dark, and warmer than the room. No logo, no fasteners, no obvious interface. Your normal senses give you almost nothing. Alteration gives you less, until it does not.';
 else if(type==='origin'){S.knowledge['origin anomaly']=(S.knowledge['origin anomaly']||0)+1;S.result='You hold the idea of ORIGIN in your mind. For an instant the plate feels layered: material, manufacture, history, something behind history. Then the sensation snaps shut hard enough to leave you dizzy. Claim did not open that door.';}
 else if(type==='weekthree')S.result='You leave the room and lock up. Three weeks ago you thought the power was “change things I own.” The Verdant has already broken the sentence in two places.';
 else if(type==='rest')S.result='You take the day slow. The frontier does not punish you for failing to optimize your life.';
 else S.result='You spend some time simply living in the place you chose.';
}
function handle(action){if(!action)return;const p=action.split(':');if(p[0]==='inspect')inspect(p[1]);else if(p[0]==='study')study(p.slice(1).join(':'));else if(p[0]==='alter')alter(p[1],p[2],p[3]);else if(p[0]==='life')life(p[1]);else if(p[0]==='event')resolveEvent(p[1],p[2]);render()}
function freeAction(text){
 const t=text.trim();if(!t){render();return}
 const low=t.toLowerCase(),target=resolveTargetFromText(low);
 const wantsDeep=/more detail|more detailed|what(?:'s| is).*?(?:inside|\bin\b).*?(?:it|this|that|tool|kit|car|vehicle|console|system|beacon|cabinet)|what.*?(?:contain|include|made of)|what all.*?(?:in|inside)|list.*?(?:tool|gear|component|part|item)|show.*?(?:inside|contents|components|parts)|look inside|open it|internals?|components?|composition|contents?|inside it|inside this|inside that|break it down|what is in it|what do i have.*?(?:tool|gear|kit)/.test(low);
 const wantsStats=/stats?|numbers?|readout|condition|integrity|efficiency|performance|worth/.test(low)&&!/what(?:'s| is) (?:inside|in)|components?|composition|internals?/.test(low);
 if(wantsDeep){markTypedEquivalent('deep',target);deepInspect(target);render();return}
 if(/\bclaim\b|stake claim|make it mine/.test(low)){
  markTypedEquivalent('claim',target);
  if(target==='beacon'||target==='beacon_unclaimed'){if(S.day===4||S.items.beacon)establishClaim('beacon');else S.result='You remember the idea, but there is no survey beacon in front of you to Claim right now.'}
  else if(target&&target.startsWith('world:')){const w=worldTarget(target);S.result='You test the idea of Claim against '+(w?w.name:'the target')+'. The feeling does not settle into the clean certainty you get from something that is unquestionably yours. Jace can attempt the Claim, but right now he has no convincing reason to believe it took.';S.journal.unshift('Day '+S.day+' · Tested Claim against '+(w?w.name:'a world target')+'.');}
  else S.result='You reach for the sense you have been calling Claim. It wants a definite target, something you can point to and mean when you think: mine.';
  render();return
 }
 if(/study|research|read about|learn/.test(low)){
  let topic=low.replace(/^.*?(study|research|read about|learn)\s*/,'').slice(0,60)||'verdant fieldcraft';
  markTypedEquivalent('study',target,topic);study(topic);render();return
 }
 if(/alter|improve|upgrade|change|modify/.test(low)){
  if(target&&target.startsWith('world:')){attemptWorldAlter(target);render();return}
  const itemTarget=(target==='cabinet'||target==='beacon_unclaimed')?S.selected:target;
  const m=low.match(/(\d+)\s*(?:ap|point)/),cost=m?clamp(+m[1],1,6):1,stat=/comfort/.test(low)?'comfort':/perform|power|speed|traction/.test(low)?'performance':/efficien|cool|airflow|energy/.test(low)?'efficiency':/integr|strong|durab/.test(low)?'integrity':'condition';
  markTypedEquivalent('alter',itemTarget);alter(itemTarget,stat,cost);render();return
 }
 if(wantsStats||/inspect|look at|check|examine/.test(low)){
  markTypedEquivalent('inspect',target);
  if(target&&target.startsWith('world:')){inspectWorldTarget(target)}else if(target==='cabinet'||target==='beacon_unclaimed'){deepInspect(target)}else inspect(target);
  render();return
 }
 let lifeAction=null;
 if(/reach|head|go/.test(low)&&/yard/.test(low))lifeAction='life:arrive';
 else if(/take in|view|look around|scenery/.test(low))lifeAction='life:observe';
 else if(/set up|organize|work bay/.test(low)&&/yard|bay|shop/.test(low))lifeAction='life:yard';
 else if(/job|jobs|posting|postings|recovery board/.test(low))lifeAction='life:jobs';
 else if(/call|phone|ring/.test(low)&&/family|home/.test(low))lifeAction=scene().choices.some(c=>c[2]==='event:family:normal')?'event:family:normal':'life:family';
 else if(/long way|long route|go around/.test(low))lifeAction='life:longroute';
 else if(/write down|record|make a note|note it/.test(low))lifeAction='life:record';
 else if(/ask/.test(low)&&/traveler/.test(low))lifeAction='life:traveler';
 else if(/drive|explore|service road|unfamiliar route/.test(low))lifeAction='life:explore';
 else if(/rest|sleep|take it easy|slow day/.test(low))lifeAction='life:rest';
 if(lifeAction){
  markTypedEquivalent('life',target,lifeAction);
  if(lifeAction.startsWith('event:family:'))resolveEvent('family','normal');else life(lifeAction.slice(5));
  render();return
 }
 if(/go out|walk|eat/.test(low)){
  S.result='You do it. The Verdant does not require a skill check for every ordinary decision.';S.journal.unshift('Day '+S.day+' · '+t.slice(0,100));render();return
 }
 if(target&&target.startsWith('world:')){const w=worldTarget(target);S.result='You focus your action on '+(w?w.name:'the scene target')+'. The target is recognized, but the interpreter does not yet have a specific consequence for the exact verb you used. It is no longer being mistaken for one of your owned Claims.';}else S.result='You attempt: “'+t+'” The action is accepted as part of your life in the Verdant, but this build does not yet attach a specific mechanical consequence to it. No fake failure roll was added.';
 S.journal.unshift('Day '+S.day+' · '+t.slice(0,100));render();
}
function newDay(){
 S.day++;S.maxAP=S.baseAP+worthBonus();S.ap=S.maxAP;S.result='Day '+S.day+'. Alteration capacity returns to '+S.maxAP+' AP. Nothing says you need to spend it.';
 if(S.day===8){S.journal.unshift('Week 1 · The first week in the Verdant is complete.');}
 if(S.day===15){S.journal.unshift('Week 2 · The business is real enough to create choices of its own.');}
 if(S.day===22){S.journal.unshift('Week 3 · The authored opening is complete. The Verdant is now open.');}
 const pool=EVENTS.filter(e=>e.id!==S.lastEvent);
 if(S.day>=22&&Math.random()<.42){const ev=pick(pool);S.currentEvent=ev.id;S.lastEvent=ev.id;S.result='Day '+S.day+'. '+ev.chip}else S.currentEvent=null;
 S.journal.unshift('Day '+S.day+' · New day in the Verdant.');render()
}
$('start').onclick=()=>{S=fresh(($('nm').value||'Jace').trim());save();render()};
$('form').onsubmit=e=>{e.preventDefault();const t=$('act').value;$('act').value='';freeAction(t)};
$('end').onclick=newDay;
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===b.dataset.tab))});
try{S=JSON.parse(localStorage.getItem(SAVE)||'null')}catch(e){}
if(S){S.premise=BACKGROUND;if(S.items&&S.items.car){S.items.car.name='Virog 4';S.items.car.icon='🚙';}S.knowledge=S.knowledge||{'alteration sense':1,'claim sense':1};S.journal=S.journal||[];S.claims=S.claims||Object.keys(S.items||{});S.threads=S.threads||{business:true,serviceSpur:false,oldTraveler:false,uncle:false};S.usedChoices=S.usedChoices||{};S.baseAP=S.baseAP||6;S.result=S.result||'Welcome back to the Verdant.';render()}
if(location.search)history.replaceState({},'',location.pathname);
})();