import {ITEMS,itemKind,give,take} from './items.mjs';
import {railwayStations} from './railway-station.mjs';
import {spellTransition} from './portal-transition.mjs';
import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {alleyStreetPropBlocked} from './diagon-alley-props.mjs';
import {HOGWARTS_CATALOG} from './train-tailor.mjs';
import {OLLIVANDERS_LAYOUT, ollivandersBlocked, ollivandersInCounterReach} from './diagon-wand-shop-layout.mjs';
import {ALLEY_SHOP_ROOMS, mirroredShopPoint, shopServiceReach, shopSolidAt} from './diagon-shop-rooms.mjs';
import {nearbyAlleyResident,openAlleyResidentDialogue,tickAlleyResidents} from './diagon-residents.mjs';
import {flooPrompt,hearthBlocks,startFlooTravel,tickFlooTravel} from './floo-travel.mjs';
import {wildHomesteadHearth} from './wild-homestead-layout.mjs';
import {visitQuidditchPitch} from './quidditch-scene.mjs';
import {QUIDDITCH_SHOP_PORTKEY_LOCAL} from './quidditch-layout.mjs';
import {FLOURISH_SPELLBOOK_STOCK,FIREBOLT_STOCK,MALKINS_WITCH_HAT_STOCK,syncWizardingShopStock} from './wizarding-shop-goods.mjs';
import {nocturneSpiderPrompt,openNocturneSpiderMerchant,transferNocturneSpiderPurchase} from './nocturne-spider-merchant.mjs';
import {nocturneDarkWizardPrompt,openNocturneDarkWizard,tickNocturneDarkWizards} from './nocturne-dark-wizards.mjs';
import {MAGE_GARDEN_AREAS,mageGardenBlocked} from './diagon-mage-garden.mjs';
import {alleyGardenPropBlocked} from './diagon-garden-props.mjs';
import {tickDiagonCritters} from './diagon-critters.mjs';
import {activeGardenBench,gardenBenchPrompt,interactGardenBench} from './diagon-garden-benches.mjs';
import {clearGardenCats,tickGardenCats,tickNocturneCatHunt} from './diagon-garden-cats.mjs';
import {prepareDiagonArrival} from './diagon-alley-assets.mjs';
import {GARDEN_SHOPS,MERIDIAN_ARENA_ENTRANCE} from './diagon-garden-shops.mjs';
import {openBellglassDivination} from './divination.mjs';
import {GARDEN_PERIMETER_FRONTAGES} from './diagon-garden-layout.mjs';
import {LOCKSMITH_LOOK} from './diagon-locksmith.mjs';
import {WRONG_TURN_KEY} from './wrong-turn-key.mjs';
import {interactWrongTurnDoor,tickWrongTurnDoors,wrongTurnDoorBlocked,wrongTurnDoorPrompt} from './wrong-turn-doors.mjs';
import {travelThroughWrongTurn} from './wrong-turn-travel.mjs';
import {EMPORIUM_OWL_STOCK} from './owl-emporium.mjs';
import {NOCTURNE_REAR_AREAS,nocturneGraveBlocked,nocturneCemeteryInteraction,interactNocturneCemetery,restoreNocturneCemeteryGhosts} from './diagon-nocturne-rear.mjs';
import {enterDiagonArena} from './diagon-arena.mjs';
import {diagonEntryBlocked} from './diagon-entry-plaza.mjs';
export const ALLEY={left:7100,right:9688,top:3720,bottom:5750,entry:{x:8000,y:5660}};
export const DIAGON_STREET={x:7760,y:3905,w:480,h:1845};
export const OLLIVANDERS_PASSAGE={x:7350,y:4275,w:468,h:49};
export const NOCTURNE_CONNECTOR={x:8180,y:5181,w:1030,h:105};
export const NOCTURNE_STREETS=[
 NOCTURNE_CONNECTOR,
 {x:8970,y:4535,w:246,h:1073},
 ...NOCTURNE_REAR_AREAS,
];
export const ALLEY_SHOPS=[
 {id:'ollivanders',name:'Ollivanders',owner:'Garrick Ollivander',subtitle:'Fine wands since 382 BC',x:7550,y:4190,color:'#514a66',stock:[['starter_wand',35],['wand',75],['fire_wand',140],['ice_wand',140]],line:'Curious… the wand chooses the wizard.'},
 {id:'flourish',name:'Flourish & Blotts',owner:'Bernard Blott',subtitle:'Books for every young witch',x:8450,y:4250,color:'#496252',stock:[['standard_book_of_spells',65],...FLOURISH_SPELLBOOK_STOCK],line:'Mind the books that bite. Those stay upstairs.'},
 {id:'malkins',name:'Madam Malkin’s',owner:'Madam Malkin',subtitle:'Robes for all occasions',x:7550,y:4630,color:'#69516b',stock:[...HOGWARTS_CATALOG,...MALKINS_WITCH_HAT_STOCK],line:'Stand still, dear. The tape measure is only ticklish.'},
 {id:'quidditch',name:'Quality Quidditch Supplies',owner:'Kennilworthy Spindle',subtitle:'Brooms, polished and flight-ready',x:8450,y:4630,color:'#624b39',stock:[['flying_broom',130],['nimbus_2000',240],FIREBOLT_STOCK],line:'A repaired Nimbus still has plenty of sky in it.'},
 {id:'apothecary',name:'Slugg & Jiggers',owner:'Arsenius Jigger',subtitle:'The apothecary',x:7550,y:5010,color:'#42615d',stock:[['potion',12],['stamina_potion',18]],line:'Three drops. Not three spoonfuls. Very different results.'},
 {id:'eeylops',name:'Eeylops Owl Emporium',owner:'Myrtle Featherwick',subtitle:'Cages, nets and feathered friends',x:8450,y:5010,color:'#5e5849',stock:[['critter_cage',8],...EMPORIUM_OWL_STOCK,['critter_net',24],['empty_jar',4]],line:'Meet Hedwig, Pigwidgeon, and Archimedes. Use their cage whenever you need to call them back.'},
 {id:'floreans',name:'Florean Fortescue’s',owner:'Florean Fortescue',subtitle:'Ice cream & magical sweets',x:7550,y:5390,color:'#805653',stock:[['diagon_ice_cream',8],['chocolate_frog',15]],line:'An extra scoop for the journey? Chocolate frogs do hop off.'},
 {id:'gringotts',name:'Gringotts Wizarding Bank',owner:'Griphook',subtitle:'Safe coin exchange',x:8000,y:3834,frontEntrance:true,color:'#77786d',stock:[],line:'Your gold is counted. Every last coin.'},
 {id:'nocturne-curios',district:'nocturne',name:'Nocturne Curios',owner:'Mara Vesper',subtitle:'Mantles, ashwood wands and Floo powder',x:9300,y:4930,color:'#514565',stock:[['alley_inkcap',27],['alley_moonstitch_robe',52],['alley_lantern_mantle',36],['alley_ashwood_wand',105],['floo_powder',10]],line:'Look for the thing that catches the lamplight.'},
 {id:'nightglass',district:'nocturne',name:'Nightglass Apothecary',owner:'Perrin Graves',subtitle:'Tinctures and tinted glass',x:9300,y:5500,color:'#365454',stock:[['alley_moonmint_tonic',16],['alley_lodestone_brooch',48],['alley_copperweave_gloves',25]],line:'Moonmint is cooling. The copper gloves are for everything else.'},
 {id:'borgin-burkes',district:'nocturne',name:'Borgin and Burkes',owner:'Mr. Borgin',subtitle:'Unusual and enchanted antiques',x:9300,y:4650,color:'#48473d',stock:[['skeleton_skull',44],['warlock_sigil',85],['cursed_axe',140]],line:'Leave the cabinet latch alone. Some merchandise is strictly for display.'},
 ...GARDEN_SHOPS,
].map(shop=>shop.district||shop.frontEntrance?shop:{...shop,x:shop.x+(shop.x<8000?90:-90)});
const portkeyShop=ALLEY_SHOPS.find(shop=>shop.id==='quidditch');
const meridianShop=ALLEY_SHOPS.find(shop=>shop.id==='meridian-hall');
export const ALLEY_PITCH_PORTKEY=mirroredShopPoint(portkeyShop,QUIDDITCH_SHOP_PORTKEY_LOCAL);
const curios=ALLEY_SHOPS.find(shop=>shop.id==='nocturne-curios');
export const ALLEY_SHOP_HEARTH=Object.freeze({id:curios.id,room:'diagon',
 ...mirroredShopPoint(curios,ALLEY_SHOP_ROOMS[curios.id].props.find(prop=>prop.id==='curios-fireplace'))});
export const ALLEY_CLOSED_FRONTAGES=[
 {x:7605,y:4410,theme:'stationery'}, {x:8390,y:4450,theme:'pottery'},
 {x:7615,y:4820,theme:'clockmaker'}, {x:8395,y:4820,theme:'stationery'},
 {x:7600,y:5200,theme:'pottery'}, {x:8690,y:5380,theme:'clockmaker'},
 {x:7630,y:5615,theme:'clockmaker'}, {x:8370,y:5615,theme:'pottery'},
].map(frontage=>({...frontage,x:frontage.x+(frontage.x>8600?0:frontage.x<8000?57:-57),halfWidth:98,halfDepth:78})).concat([
 {x:7450,y:4409,theme:'pottery'}, {x:7454,y:4842,theme:'stationery'}, {x:7418,y:5418,theme:'clockmaker'},
 {x:8548,y:4455,theme:'clockmaker'}, {x:8542,y:4830,theme:'pottery'}, {x:8575,y:5600,theme:'stationery'},
].map(frontage=>({...frontage,halfWidth:98,halfDepth:78})),[
 {x:7414,y:4602,theme:'weaver',halfWidth:97,halfDepth:74},
 {x:7405,y:5001,theme:'pottery',halfWidth:97,halfDepth:78},
 {x:8620,y:4202,theme:'clockmaker',halfWidth:99,halfDepth:81},
 {x:8595,y:4993,theme:'weaver',halfWidth:99,halfDepth:79},
 {x:8855,y:4559,theme:'undertaker',halfWidth:101,halfDepth:76},
 {x:8853,y:4788,theme:'night-weaver',halfWidth:102,halfDepth:84},
 {x:8855,y:5033,theme:'undertaker',halfWidth:100,halfDepth:77},
 {x:9107,y:4420,theme:'night-weaver',halfWidth:103,halfDepth:87},
 {x:8882,y:5529,theme:'undertaker',halfWidth:86,halfDepth:66},
 {x:9320,y:5083,theme:'night-weaver',halfWidth:101,halfDepth:110},
 {x:9322,y:5356,theme:'undertaker',halfWidth:103,halfDepth:62},
 {x:9322,y:4780,theme:'night-weaver',halfWidth:101,halfDepth:56},
 {x:9372,y:4430,theme:'undertaker',halfWidth:96,halfDepth:88},
 {x:7634,y:5807,theme:'stationery',halfWidth:110,halfDepth:83},
 {x:7850,y:5870,theme:'pottery',halfWidth:108,halfDepth:80},
 {x:8074,y:5863,theme:'weaver',halfWidth:105,halfDepth:82},
 {x:8286,y:5813,theme:'clockmaker',halfWidth:106,halfDepth:84},
 ...GARDEN_PERIMETER_FRONTAGES,
]);

export function alleyShopGround(shop){
 if(shop.frontEntrance)return {x:shop.x-133,y:shop.y-85,w:266,h:204};
 return {x:shop.x-150,y:shop.y-91,w:300,h:182};
}
export const ALLEY_PATHS=[DIAGON_STREET,OLLIVANDERS_PASSAGE,...NOCTURNE_STREETS,...MAGE_GARDEN_AREAS,...ALLEY_SHOPS.map(alleyShopGround)];
const insidePath=(area,x,y,r)=>x>=area.x+r&&x<=area.x+area.w-r&&y>=area.y+r&&y<=area.y+area.h-r;
export const insideNocturne=(x,y)=>(x>=8610&&NOCTURNE_STREETS.some(area=>insidePath(area,x,y,0)))||
 ALLEY_SHOPS.some(shop=>shop.district==='nocturne'&&insidePath(alleyShopGround(shop),x,y,0));
export const inDiagon=g=>g.trainTest?.design.activeRoom==='diagon';
export const holdingWand=p=>[p.equipment?.hand1,p.equipment?.hand2].some(i=>itemKind(typeof i==='string'?i:i?.type)==='wand');
const nearMeridianChart=p=>Math.hypot(p.x-MERIDIAN_ARENA_ENTRANCE.x,p.y-MERIDIAN_ARENA_ENTRANCE.y)<=24;
const nearMeridianClerk=p=>Math.abs(p.x-(meridianShop.x-61))<27&&p.y>=meridianShop.y-7&&p.y<meridianShop.y+45;
export function alleyGate(g){const t=g.trainTest;if(!t?.design.wildLands||t.design.activeRoom)return null;const w=railwayStations(t.design)[0];if(!w)return null;return {x:w.station.x+w.station.w/2+80,y:w.station.y+35,station:w.station.name};}
export function alleyPrompt(g,p){
 if(p.hp<=0||p.trainRide)return '';
 const hearth=flooPrompt(g,p,ALLEY_SHOP_HEARTH);
 if(hearth!==null)return hearth;
 if(inDiagon(g)){
  const cemetery=nocturneCemeteryInteraction(g,p);
  if(cemetery)return cemetery.label;
  const bench=gardenBenchPrompt(g,p,(x,y,r)=>alleyBlocked(g,x,y,r));
  if(bench)return bench;
  if(nearMeridianChart(p))return 'EXAMINE THE BROKEN MIRROR';
  if(nearMeridianClerk(p))return 'TALK TO CELIA ORRERY';
  const wrongTurn=wrongTurnDoorPrompt(g,p);
  if(wrongTurn)return wrongTurn;
  if(Math.hypot(p.x-ALLEY_PITCH_PORTKEY.x,p.y-ALLEY_PITCH_PORTKEY.y)<26)return 'PORTKEY TO THE QUIDDITCH PITCH';
  if(Math.hypot(p.x-ALLEY.entry.x,p.y-ALLEY.entry.y)<80)return 'RETURN TO STATION';
  const spiderMerchant=nocturneSpiderPrompt(g,p);
  if(spiderMerchant)return spiderMerchant;
  const shop=nearbyAlleyShop(g,p);
  if(shop)return shop.id==='gringotts'?'TALK TO GRIPHOOK':shop.id==='bellglass'?'TALK TO IONA BELLGLASS':'VISIT '+shop.name.toUpperCase();
  const darkWizard=nocturneDarkWizardPrompt(g,p);
  if(darkWizard)return darkWizard;
  const resident=nearbyAlleyResident(g,p,(x,y,r)=>alleyBlocked(g,x,y,r));
  return resident?'TALK TO '+resident.name.toUpperCase():'';
 }
 const gate=alleyGate(g);return gate&&Math.hypot(p.x-gate.x,p.y-gate.y)<110?(g.trainTest.alleyOpened?'ENTER DIAGON ALLEY':holdingWand(p)?'OPEN ENCHANTED BRICK WALL':'THE BRICKS QUIVER · HOLD A WAND'):'';
}
export function switchAlleyLayer(g,room){
 const t=g.trainTest;
 if((t.design.activeRoom||null)===(room||null))return;
 if(room==='diagon'){
  prepareDiagonArrival(ALLEY);
  const actors=['enemies','loot','pickups','baits','spells','arrows','traps','effects','xpOrbs','ghosts','villageFollowers','boomerangs','rifleShots'];
  t.alleyActors=Object.fromEntries(actors.map(key=>[key,g[key]]));
  for(const key of actors)g[key]=[];
 }else if(t.alleyActors){
  Object.assign(g,t.alleyActors);
  delete t.alleyActors;
 }
 if(room!=='diagon')clearGardenCats(g);
 t.design.activeRoom=room||undefined;
}
function travel(g,room,point){
 const t=g.trainTest;
 switchAlleyLayer(g,room);
 t.wildLandsOverview=false;
 t.notice=room?'Welcome to Diagon Alley. Explore the shops and return through the golden arch.':'Returned to Jungle Ruins station.';
 t.noticeUntil=t.time+4;
 for(const [i,p]of g.players.entries()){
  const arrival=point.arrivals?.[i]||{x:point.x+i*28,y:point.y};
  delete p.trainRide;
  delete p.gardenBench;
  Object.assign(p,{...arrival,room:null,ui:null,swimming:false,trainGround:0,trainVisualLift:0,trainDeck:false,
   jumpHeight:0,jumpVelocity:0,dashTime:0,dashRecovery:0,charge:0});
 }
 spellTransition(g);
}
export function interactAlley(g,p){if(p.hp<=0||p.trainRide)return false;const t=g.trainTest;if(!t?.design.wildLands)return false;
 if(startFlooTravel(g,p,ALLEY_SHOP_HEARTH))return true;
 if(inDiagon(g)){
  if(interactNocturneCemetery(g,p))return true;
  if(interactGardenBench(g,p,(x,y,r)=>alleyBlocked(g,x,y,r)))return true;
  if(nearMeridianChart(p))return enterDiagonArena(g,p,MERIDIAN_ARENA_ENTRANCE.id);
  if(nearMeridianClerk(p)){
   p.ui={shop:'npc-dialogue',meridianClerk:{...alleyMerchantActor(meridianShop),name:meridianShop.owner,title:'Meridian Hall'},ownerDevice:p.device,index:0,node:'intro'};
   p.consumeInput=true;return true;
  }
  if(interactWrongTurnDoor(g,p,t.persistent?null:()=>{
   const delta=alleyReceipt(g,p).delta;
   delta[WRONG_TURN_KEY]=(delta[WRONG_TURN_KEY]||0)-1;
  }))return true;
  if(Math.hypot(p.x-ALLEY_PITCH_PORTKEY.x,p.y-ALLEY_PITCH_PORTKEY.y)<26)return visitQuidditchPitch(g,p,ALLEY_PITCH_PORTKEY);
  if(openNocturneSpiderMerchant(g,p))return true;
  if(Math.hypot(p.x-ALLEY.entry.x,p.y-ALLEY.entry.y)<80){travel(g,null,t.alleyReturn);return true;}
  const s=nearbyAlleyShop(g,p);
  if(!s)return openNocturneDarkWizard(g,p)||openAlleyResidentDialogue(g,p,nearbyAlleyResident(g,p,(x,y,r)=>alleyBlocked(g,x,y,r)));
  if(s.id==='gringotts'){
   p.ui={shop:'npc-dialogue',gringotts:{...alleyMerchantActor(s),name:s.owner,title:'Gringotts exchange clerk'},ownerDevice:p.device,index:0,node:'exchange'};
   p.consumeInput=true;return true;
  }
  t.alleyMerchants??={};const m=t.alleyMerchants[s.id]??={...s,shopTitle:s.name,trainTailor:true,alleyShop:true,stock:s.stock.map(([type,price])=>({item:{type,qty:1},price})),revision:0,greeting:s.line,visual:alleyMerchantActor(s)};
  syncWizardingShopStock(m,s);
  const service=mirroredShopPoint(s,OLLIVANDERS_LAYOUT.service);
  Object.assign(m,service);
  if(s.id==='bellglass')return openBellglassDivination(g,p,m);
  p.ui={shop:'merchant',alleyShop:s.id,panel:'stock',index:0,page:0,notice:s.line};return true;
 }
 const gate=alleyGate(g);if(!gate||Math.hypot(p.x-gate.x,p.y-gate.y)>110)return false;
 if(!t.alleyOpened){if(!holdingWand(p)){g.message('The old bricks stir. Hold a wand to reveal the passage.');return true;}t.alleyOpened=true;t.alleyOpenedAt=t.time;prepareDiagonArrival(ALLEY);g.onSound?.('magic',p);g.message('The bricks fold away… Diagon Alley awaits.');return true;}
 if(t.time-t.alleyOpenedAt<.65)return true;
 if(g.players.some(q=>q.trainRide)){g.message('Everyone must leave the train before entering Diagon Alley.');return true;}
 t.alleyReturn={x:gate.x,y:gate.y+65};travel(g,'diagon',{x:8000,y:5560});return true;
}
export function nearbyAlleyShop(g,p){
 return inDiagon(g)&&!p.trainRide?ALLEY_SHOPS.find(s=>s.id==='ollivanders'
   ? ollivandersInCounterReach(s,p)
   : shopServiceReach(s,p)):null;
}
const keeperLooks={
 flourish:{hair:'sidepart',hairColor:'#634c39',skin:'#d4af87',pants:'#4d4c3c'},
 malkins:{hair:'braids',hairColor:'#9e8783',skin:'#d8ad8e',pants:'#5c4353'},
 quidditch:{hair:'crop',hairColor:'#5e482d',skin:'#b68460',pants:'#634a40'},
 apothecary:{hair:'long',hairColor:'#48534a',skin:'#b78c69',pants:'#495b51'},
 eeylops:{hair:'braids',hairColor:'#765a44',skin:'#c89a70',pants:'#535c50'},
 floreans:{hair:'curls',hairColor:'#87553e',skin:'#d5ab7d',pants:'#6c5148'},
 'nocturne-curios':{hair:'curls',hairColor:'#504059',skin:'#bf977f',pants:'#383243'},
 nightglass:{hair:'braids',hairColor:'#536763',skin:'#987765',pants:'#2d4245'},
 'borgin-burkes':{hair:'sidepart',hairColor:'#6e6962',skin:'#aa8a72',pants:'#3d3936'},
 bellglass:{hair:'curls',hairColor:'#56463a',skin:'#c6926e',pants:'#626043'},
 'meridian-hall':{hair:'waves',hairColor:'#b5a398',skin:'#a77455',pants:'#454b5d'},
 'wrong-turn':LOCKSMITH_LOOK,
};
export function alleyMerchantActor(s){
 const wandmaker=s.id==='ollivanders';
 const offset=wandmaker?OLLIVANDERS_LAYOUT.keeper:ALLEY_SHOP_ROOMS[s.id].keeper||{x:-9,y:-36};
 if(s.id==='gringotts')return {id:'alley-'+s.id,sprite:'alley_goblin',kind:'alley_goblin',goblinRole:'banker',hp:1,
  ...mirroredShopPoint(s,offset),faceX:0,faceY:1,moving:false};
 const look=wandmaker?{hair:'waves',hairColor:'#d8d4c4',skin:'#d1a386'}:keeperLooks[s.id];
 return {id:'alley-'+s.id,sprite:'player',kind:'player',hp:1,...mirroredShopPoint(s,offset),faceX:0,faceY:1,
   equipment:{},appearance:{...DEFAULT_APPEARANCE,...look,shirt:s.color}};
}
export function alleyBlocked(g,x,y,r=7,from=null,height=0){if(!inDiagon(g)){
  const t=g.trainTest;
  if(t?.design.wildLands&&!t.design.activeRoom&&hearthBlocks(wildHomesteadHearth(t.design),x,y,r))return true;
  const gate=alleyGate(g);
  return !!gate&&!t.alleyOpened&&Math.abs(x-gate.x)<60+r&&Math.abs(y-gate.y)<12+r;
 }
 if(Math.abs(x-8000)<50+r&&y>4142-r&&y<4184+r)return true;
 if(!ALLEY_PATHS.some(area=>insidePath(area,x,y,r)))return true;
 const swimmer=from&&g.players.includes(from)&&!from.controlledFollowerId&&!from.vehicleId&&!from.trainRide?from:null;
 if(mageGardenBlocked(x,y,r,swimmer,height))return true;
 if(alleyGardenPropBlocked(x,y,r))return true;
 if(alleyStreetPropBlocked(x,y,r))return true;
 if(y>5590&&diagonEntryBlocked(x,y,r))return true;
 if(nocturneGraveBlocked(g,x,y,r))return true;
 if(wrongTurnDoorBlocked(g,x,y,r))return true;
 if(hearthBlocks(ALLEY_SHOP_HEARTH,x,y,r))return true;
 // Shop floors connect to the street through wide open fronts. Back, sides,
 // counters and displays are solid; the open central aisle remains walkable.
 return ALLEY_CLOSED_FRONTAGES.some(s=>Math.abs(x-s.x)<s.halfWidth+r&&Math.abs(y-s.y)<s.halfDepth+r)||
  ALLEY_SHOPS.some(s=>s.id==='ollivanders'?ollivandersBlocked(s,x,y,r):shopSolidAt(s,x,y,r,g.trainTest.nocturneCemetery?.door));
}
export function alleyReceipt(g,p){return ((g.trainTest.alleyPurchases??={})[p.id]??={spent:0,gold:0,items:[],delta:{}});}
export function transferAlleyPurchases(g,t){let changed=false;for(const original of t.returnPlayers){const p=g.players.find(p=>p.id===original.id),r=t.alleyPurchases?.[original.id];if(!p||!r)continue;changed=true;original.coins=Math.max(0,(original.coins||0)-r.spent+r.gold);original.npcQuests??={};const state=original.npcQuests.train_students??={received:{},pending:[]};state.pending??=[];
 for(const [type,amount]of Object.entries(r.delta)){const n=['potion','stamina_potion','diagon_ice_cream','alley_moonmint_tonic'].includes(type)?Math.min(amount,Math.max(0,p.inventory.filter(a=>a?.type===type).reduce((v,a)=>v+a.qty,0)-(r.baseline?.[type]||0))):amount;if(n<0){let left=-n;for(const a of original.inventory)if(a?.type===type){const used=Math.min(left,a.qty);a.qty-=used;left-=used;}original.inventory=original.inventory.map(a=>a?.qty===0?null:a);}else if(n>0&&!give(original.inventory,type,n))state.pending.push({type,qty:n});}
 transferNocturneSpiderPurchase(original,p,r);
 }return changed;}

function completeHearthTravel(g,hearth,p){
 const t=g.trainTest,gate=alleyGate(g);
 if(!t.persistent){
  const {delta}=alleyReceipt(g,p);
  delta.floo_powder=(delta.floo_powder||0)-1;
 }
 if(hearth.room&&!t.alleyReturn&&gate)t.alleyReturn={x:gate.x,y:gate.y+65};
 const arrivals=g.players.map((_,i)=>({x:hearth.x+[0,-14,14][i%3],y:hearth.y+19+Math.floor(i/3)*16}));
 travel(g,hearth.room,{arrivals});
 t.notice=hearth.room?'Nocturne Curios':'Wilds Homestead';
 g.persist?.();
}

export function tickAlley(g,dt){const t=g.trainTest;if(!t?.design.wildLands)return;
 if(tickFlooTravel(g,ALLEY_SHOP_HEARTH,(hearth,p)=>completeHearthTravel(g,hearth,p)))return;
 const gate=alleyGate(g),p=g.players.find(p=>p.hp>0&&!p.trainRide&&!p.ui&&!p.room&&(inDiagon(g)?Math.hypot(p.x-ALLEY.entry.x,p.y-ALLEY.entry.y)<24:gate&&t.alleyOpened&&t.time-t.alleyOpenedAt>.65&&Math.hypot(p.x-gate.x,p.y-(gate.y-12))<24));if(p)interactAlley(g,p);
 if(!inDiagon(g))return;
 if(tickWrongTurnDoors(g,travelThroughWrongTurn))return;
 restoreNocturneCemeteryGhosts(g);
 // Older saves could place an explorer on what is now a dark service yard.
 for(const actor of g.players){
  if(!alleyBlocked(g,actor.x,actor.y,7,actor,(actor.groundHeight||0)+(actor.jumpHeight||0)))continue;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const options=ALLEY_PATHS.map(a=>({x:clamp(actor.x,a.x+12,a.x+a.w-12),y:clamp(actor.y,a.y+12,a.y+a.h-12)}));
  for(const r of [18,36,60,90])for(let i=0;i<12;i++)options.push({x:actor.x+Math.cos(i*Math.PI/6)*r,y:actor.y+Math.sin(i*Math.PI/6)*r});
  const clear=options.filter(q=>!alleyBlocked(g,q.x,q.y)).sort((a,b)=>Math.hypot(actor.x-a.x,actor.y-a.y)-Math.hypot(actor.x-b.x,actor.y-b.y));
  Object.assign(actor,clear[0]||{x:8000,y:5560},{ui:null});
 }
 for(const actor of g.players)if(actor.gardenBench&&!activeGardenBench(g,actor))delete actor.gardenBench;
 const blocked=(x,y,r)=>alleyBlocked(g,x,y,r);
 tickAlleyResidents(g,dt,blocked);
 tickNocturneDarkWizards(g);
 tickDiagonCritters(g,dt,blocked,tickNocturneCatHunt);
 tickGardenCats(g,dt,blocked);
}
