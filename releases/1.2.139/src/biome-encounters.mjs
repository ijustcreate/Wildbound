import {sketchGround} from './wild-lands-geography.mjs';

const unit=(kind,hp,damage,extra={})=>({kind,count:1,hp,damage,...extra});
const shield=()=>unit('skeleton',85,11,{combatRole:'shield'});
const bow=()=>unit('archer',48,8,{combatRole:'archer'});
const rows=[
 ['forest','Brambleline patrol',[shield(),unit('boar',70,12,{combatRole:'charger'}),bow()],'A bowstring catches on the thorn.\nA bristled shadow waits till morn.','Flank the shield and interrupt the bow. Bait the boar into open ground, then punish its recovery.'],
 ['forest','Hunters of the fern trail',[unit('wolf',62,10),unit('vine',64,9),unit('snake',42,8)],'The fern tips bend against the breeze.\nA low growl passes through the trees.','Draw the wolf away from the vine. Sidestep the snake after it coils and strike between their attacks.'],
 ['desert','Embers behind the carapace',[unit('beetle',75,10),unit('fire_elemental',66,9),unit('scorpion',36,8)],'A shell moves where the sand lies still.\nAn ember rides the evening chill.','Flank the beetle and close on the caster after its cinder. Leave room to sidestep the scorpion.'],
 ['desert','The dune salvage crew',[unit('tarantula',58,9),bow(),shield()],'Old buckles scrape a buried stair.\nA bow is drawn in heated air.','Use the shield carrier to bait the first swing, then circle into the archer’s lane while the spider waits.'],
 ['ice','Hunters of the white drift',[unit('wolf',60,10),unit('water_elemental',65,9),unit('white_lion',90,12)],'Blue water gathers in the snow.\nWhite paws wait where cold winds blow.','Dodge through the gap in the water fan. Bait the lion’s committed pounce before pressing the caster.'],
 ['ice','The frostbound watch',[shield(),unit('skeleton_wizard',68,10),bow()],'Pale knuckles hold a frosted string.\nA brittle staff begins to sing.','Flank the guard and interrupt the staff. Take the opening after the archer releases its arrow.'],
 ['house','The unquiet armory',[shield(),unit('skeleton_unarmed',45,8),bow()],'An empty helmet turns toward light.\nThe dusty shelves prepare to fight.','Use doorways to separate the guard from the bow. Counter the unarmed skeleton after its heavy punch.'],
 ['house','Rustling in the rafters',[unit('beetle',66,9),unit('imp',52,8),unit('spider',38,7)],'A coal-red grin peers from a beam.\nSmall claws disturb a dusty seam.','Keep clear of the imp’s marked shot. Flank the beetle and avoid getting pinned by the spider.'],
 ['temple','The shrine sentries',[unit('golem',120,14),bow(),unit('skeleton_caster',58,8)],'The temple stones remember feet.\nA staff keeps time beneath the heat.','Bait the golem’s slam, then interrupt the healer. The archer leaves a clear opening after its shot.'],
 ['temple','Raiders of the hanging roots',[unit('monkey',52,8),unit('vine',62,9),unit('tiger',82,12)],'A bronze leaf rattles overhead.\nFresh claw marks cross the temple tread.','Pull the monkey away from the vine. Sidestep the tiger’s pounce and use its long recovery.'],
 ['graveyard','The gravewatch detail',[unit('zombie',66,10),bow(),shield()],'A watchman counts the leaning stones.\nA bowstring stirs among the bones.','Flank the shield and punish the bow’s release. Keep an escape lane past the zombie.'],
 ['graveyard','The candlelit coven',[unit('skeleton_unarmed',48,8),unit('ghost',55,9),unit('skeleton_caster',55,8)],'White sleeves drift between the graves.\nA crooked staff calls back the brave.','Interrupt the staff before focusing the frontline. The ghost commits its reaching swipe before it lands.'],
 ['beach','The tideguard skirmish',[unit('shore_goblin',64,10,{shoreRole:'melee',shoreColor:0}),unit('water_elemental',62,8),unit('shore_goblin',50,7,{shoreRole:'healer',shoreColor:2})],'Bright fins appear above the foam.\nA violet staff defends their home.','Separate the club from the staff. Interrupt healing and close after the water fan passes.'],
 ['beach','Shellbreakers on the strand',[unit('crab',58,9),unit('skeleton_deckhand',65,10),unit('scorpion',34,8)],'A cutlass taps a stranded shell.\nSmall claws keep time beside the swell.','Bait the crab’s raised claws, then counter the deckhand. Keep enough room to dodge the sting.'],
 ['swamp','Hunters of the reedbank',[unit('crocodile',82,12),unit('spore',52,8),unit('snake',40,8)],'A mossy back divides the reeds.\nThe still air carries drifting seeds.','Draw the crocodile away from the spore. Punish its short lunge after stepping outside the burst.'],
 ['swamp','The bog lantern escort',[shield(),unit('water_elemental',62,8),unit('zombie',62,9)],'A cold glow wavers in the rain.\nThe drowned march down the boards again.','Circle the shield and bait the water fan. Avoid being boxed in by the slow zombie.'],
 ['caverns','The crystal sentries',[unit('crystal_golem',110,13),unit('arcane_eye',55,9),unit('bat',32,7)],'A crystal hums below the floor.\nOne narrow eye surveys the door.','Sidestep the eye after its aim locks. Attack the golem during recovery and watch for the bat’s dive.'],
 ['caverns','Fangs beneath the shelf',[unit('cave_monster',80,11),unit('eye_tentacle',62,9),unit('beetle',62,9)],'Loose stones fall from a hidden jaw.\nA watching stalk withdraws its claw.','Bait the pounce away from the tentacle. Cross the locked lash, then punish the cave monster’s landing.'],
 ['shadow','The veilwood hunters',[unit('forest_golem',100,12),unit('watcher',58,8),unit('ghost',50,8)],'Old roots unfold beneath the veil.\nA watchful glow turns cold and pale.','Sidestep the watcher’s locked gaze. Use the golem’s recovery to cross its ground and flank the ghost.'],
 ['shadow','The thornlight court',[unit('evil_hand',58,10),unit('enchanted_book',58,8),unit('spore',48,8)],'A page turns where no fingers lie.\nA buried hand reaches for the sky.','Bait the hand’s short grab, then close on the book after its volley. Stay outside the spore’s burst.'],
];
const reinforcements={
 forest:[unit('beetle',45,7),unit('wolf',45,8)],desert:[unit('scorpion',30,7),unit('beetle',46,7)],
 ice:[unit('wolf',45,8),unit('skeleton_unarmed',42,7)],house:[unit('skeleton_unarmed',42,7),unit('beetle',45,7)],
 temple:[unit('monkey',42,7),unit('skeleton_unarmed',44,7)],graveyard:[unit('zombie',48,8),unit('skeleton_unarmed',42,7)],
 beach:[unit('crab',42,7),unit('skeleton_deckhand',48,8)],swamp:[unit('snake',32,7),unit('zombie',48,8)],
 caverns:[unit('beetle',46,7),unit('bat',28,6)],shadow:[unit('ghost',42,7),unit('skeleton_unarmed',42,7)],
};
// Advice follows the reduced pair as well as the full trio. Keep authored/save
// overrides intact; only native cards receive these default introductions.
const pairTips=[
 'Flank the shield. Bait the boar into open ground and strike after its dash.',
 'Draw the wolf away from the vine and strike between their attacks.',
 'Flank the beetle. Close on the caster after its cinder passes.',
 'Sidestep the tarantula, then close on the archer after its shot.',
 'Draw the wolf aside. Cross the gap in the water fan before closing in.',
 'Flank the shield and interrupt the wizard’s staff before its spell lands.',
 'Circle the shield and punish the unarmed skeleton after its heavy punch.',
 'Flank the beetle. Close on the imp after its marked shot.',
 'Bait the golem’s slam, then close on the archer after its arrow.',
 'Draw the monkey away from the vine and counter between their attacks.',
 'Lead the zombie away from the bow, then punish the archer’s release.',
 'Bait the heavy punch. Sidestep the ghost’s committed reaching swipe.',
 'Bait the club’s swing, then close after the water fan passes.',
 'Bait the crab’s raised claws, then counter the deckhand’s cutlass.',
 'Draw the crocodile outside the spore’s burst and punish its missed lunge.',
 'Circle the shield. Cross the gap in the water fan after its aim locks.',
 'Sidestep the eye’s locked beam. Strike the golem during recovery.',
 'Bait the pounce away from the tentacle, then cross its locked lash.',
 'Sidestep the watcher’s locked gaze and punish the golem’s recovery.',
 'Bait the hand’s grab, then close on the book after its volley.',
];
export const BIOME_MIXED_EVENTS=Object.freeze(rows.map(([environment,name,enemies,verse,tip],index)=>({
 name,environment,kind:enemies[0].kind,type:'enemy',role:'ordinary',biomeMixed:true,count:3,
 hp:enemies[0].hp,speed:50,damage:enemies[0].damage,weight:9,enemies,verse,tip,pairTip:pairTips[index],
})));
const availablePlayer=p=>p&&p.hp>0&&!p.room&&!p.ui&&!p.lobbyDisconnected&&!p.disconnected&&!p.unavailable&&!p.spectator;
export function encounterAnchor(g){const players=(g.players||[]).filter(availablePlayer);return players.find(p=>p.id===g.roll?.playerId)||players[0]||null;}
export function encounterBiome(g){
 const d=g.trainTest?.design,p=encounterAnchor(g);
 if(d?.wildLands&&p){if(d.activeRoom)return d.activeRoom==='diagon'?'house':d.activeRoom;const zone=sketchGround(p.x,p.y);return zone==='jungle'?'temple':zone;}
 return g.generatedEnvironment||g.environment||'forest';
}
export function encounterContext(g){const zone=encounterBiome(g);return zone===g.generatedEnvironment?g:Object.assign(Object.create(g),{generatedEnvironment:zone,environment:zone});}
const hostile=e=>e.hp>0&&!e.room&&!e.wildlife&&!e.stampede&&!e.stampeding&&!e.pet&&!e.hunterPet&&e.allyOwner==null&&e.ownerKey==null&&!e.controlledBy&&!['ally','neutral'].includes(e.faction)&&!e.practiceTarget;
const bosses=new Set(['dragon','gorilla','anaconda','grim_reaper','banshee_queen','dreadmane_lion','scorpion_boss','skeleton_boss','necromancer','succubus','hunter','krampus']);
const isBoss=e=>e.boss||e.cryptBoss||e.role==='boss'||bosses.has(e.kind);
const pressureCost=e=>isBoss(e)?3:['golem','crystal_golem','forest_golem','ogre'].includes(e.kind)?2:1;
function localPressure(g){
 const anchor=encounterAnchor(g);if(!anchor||g.trainTest?.design.activeRoom==='diagon')return null;
 const nearby=(g.players||[]).filter(p=>availablePlayer(p)&&Math.hypot(p.x-anchor.x,p.y-anchor.y)<=520&&Math.abs((p.trainGround||p.groundHeight||0)-(anchor.trainGround||anchor.groundHeight||0))<16);
 const partySize=Math.max(1,Math.min(4,nearby.length)),early=Math.max(0,...nearby.map(p=>p.progress||0))<12;
 const active=(g.enemies||[]).filter(e=>hostile(e)&&Math.hypot(e.x-anchor.x,e.y-anchor.y)<650&&Math.abs((e.groundHeight||e.trainGround||0)-(anchor.groundHeight||anchor.trainGround||0))<16);
 const pressure=active.reduce((n,e)=>n+pressureCost(e),0);
 const capacity=[0,early?4:5,7,9,10][partySize];
 return {anchor,partySize,early,active,pressure,capacity};
}
export function planBiomeEncounter(g,event){
 if(!event?.biomeMixed)return null;
 const local=localPressure(g);if(!local)return null;
 const {anchor,partySize,early,active,pressure,capacity}=local;
 if(partySize<3&&active.some(e=>isBoss(e)))return null;
 const hazard=g.weather?.life>0&&['blizzard','sandstorm','thunderstorm'].includes(g.weather.type||g.weather.kind)||(g.volcanoes||[]).some(v=>v.life>0&&Math.hypot(v.x-anchor.x,v.y-anchor.y)<650)||(g.enemies||[]).some(e=>e.hp>0&&(e.stampede||e.stampeding)&&Math.hypot(e.x-anchor.x,e.y-anchor.y)<650);
 const count=Math.min((early?2:3)+partySize-1,6,capacity-pressure,hazard?2:6);
 if(count<2)return null;
 const base=event.enemies.flatMap(e=>Array.from({length:e.count||1},()=>({...e,count:1})));
 const extra=reinforcements[event.environment]||[];
 const members=base.slice(0,count);
 for(let i=members.length;i<count;i++)members.push({...extra[(i-base.length)%extra.length],count:1});
 // Incoming heavies cost the same as heavies already in the fight. Never trim
 // a mixed encounter down to a lone actor to squeeze it into the local budget.
 while(members.reduce((n,e)=>n+pressureCost(e),0)>capacity-pressure)members.pop();
 if(members.length<2)return null;
 return {anchorId:anchor.id,partySize,early,capacity,existingPressure:pressure,members,tip:members.length===2?(event.pairTip||event.tip):event.tip};
}
export function mixedPressureAllows(g,event){
 if(event.biomeMixed)return !!planBiomeEncounter(g,event);
 if(event.type&&event.type!=='enemy')return true;
 const local=localPressure(g);if(!local)return true;
 const mixed=event.comboLayout||event.enemies?.length>1&&new Set(event.enemies.map(e=>e.kind)).size>1;
 if(!mixed&&!local.active.some(e=>e.biomeMixed||e.comboLayout||e.combatRole))return true;
 if(mixed&&local.partySize<3&&local.active.some(e=>isBoss(e)))return false;
 const kinds=event.enemies?.length?event.enemies.flatMap(e=>Array.from({length:e.count||0},()=>e.kind)):event.squad||Array.from({length:event.count||1},()=>event.kind);
 const incoming=kinds.reduce((n,k)=>n+(bosses.has(k)?3:['golem','crystal_golem','forest_golem','ogre'].includes(k)?2:1),0);
 return local.pressure+incoming<=local.capacity;
}
export function mixedEncounterDue(g,recent){
 const zone=encounterBiome(g),history=recent.filter(e=>!e.zone||e.zone===zone);
 let ordinary=0;for(const e of [...history].reverse()){if(e.mixed)break;if((e.type==='enemy'||!e.type)&&!['boss','hazard','peaceful','discovery'].includes(e.role))ordinary++;}
 return ordinary>=3;
}
// A shared approach sector makes the group readable; collision and starting-
// terrain rules still own the final position. Nothing is painted on the floor.
export function biomeEncounterSpot(g,plan,actor,index,angle){
 const p=(g.players||[]).find(p=>p.id===plan.anchorId);if(!p)return null;
 const peers=(g.players||[]).filter(p=>p.hp>0&&!p.room),backline=actor.combatRole==='archer'||['archer','skeleton_caster','skeleton_wizard','water_elemental','fire_elemental','imp','arcane_eye','watcher','enchanted_book'].includes(actor.kind)||actor.shoreRole==='healer';
 for(let attempt=0;attempt<64;attempt++){
  const a=angle+Math.floor(attempt/4)*Math.PI/8,rad=230+(backline?45:0)+(attempt%4)*18,lateral=(index-(plan.members.length-1)/2)*42+(attempt%2?12:-12);
  const x=p.x+Math.cos(a)*rad-Math.sin(a)*lateral,y=p.y+Math.sin(a)*rad+Math.cos(a)*lateral;
  if(!g.trainTest&&g.mapMode!=='boundless'&&(x<40||y<40||x>1560||y>1560))continue;
  if(peers.some(q=>Math.hypot(q.x-x,q.y-y)<180)||(g.enemies||[]).some(q=>q.hp>0&&Math.hypot(q.x-x,q.y-y)<28))continue;
  if(g.blocked?.(x,y,18,false,!!actor.aquatic,false,0))continue;
  return {x,y};
 }return null;
}
