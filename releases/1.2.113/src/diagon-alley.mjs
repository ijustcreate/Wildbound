import {ITEMS,itemKind,give,take} from './items.mjs';
import {railwayStations} from './railway-station.mjs';
import {spellTransition} from './portal-transition.mjs';
import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {HOGWARTS_CATALOG} from './train-tailor.mjs';
import {OLLIVANDERS_LAYOUT, ollivandersBlocked, ollivandersInCounterReach} from './diagon-wand-shop-layout.mjs';
import {ALLEY_SHOP_ROOMS, mirroredShopPoint, shopServiceReach, shopSolidAt} from './diagon-shop-rooms.mjs';
export const ALLEY={left:7100,right:8900,top:3970,bottom:5750,entry:{x:8000,y:5660}};
export const ALLEY_SHOPS=[
 {id:'ollivanders',name:'Ollivanders',owner:'Garrick Ollivander',subtitle:'Fine wands since 382 BC',x:7550,y:4190,color:'#514a66',stock:[['starter_wand',35],['wand',75],['fire_wand',140],['ice_wand',140]],line:'Curious… the wand chooses the wizard.'},
 {id:'flourish',name:'Flourish & Blotts',owner:'Bernard Blott',subtitle:'Books for every young witch',x:8450,y:4250,color:'#496252',stock:[['standard_book_of_spells',65]],line:'Mind the books that bite. Those stay upstairs.'},
 {id:'malkins',name:'Madam Malkin’s',owner:'Madam Malkin',subtitle:'Robes for all occasions',x:7550,y:4630,color:'#69516b',stock:HOGWARTS_CATALOG,line:'Stand still, dear. The tape measure is only ticklish.'},
 {id:'quidditch',name:'Quality Quidditch Supplies',owner:'Kennilworthy Spindle',subtitle:'Brooms, polished and flight-ready',x:8450,y:4630,color:'#624b39',stock:[['flying_broom',130],['nimbus_2000',240]],line:'A repaired Nimbus still has plenty of sky in it.'},
 {id:'apothecary',name:'Slugg & Jiggers',owner:'Arsenius Jigger',subtitle:'The apothecary',x:7550,y:5010,color:'#42615d',stock:[['potion',12],['stamina_potion',18]],line:'Three drops. Not three spoonfuls. Very different results.'},
 {id:'eeylops',name:'Eeylops Owl Emporium',owner:'Myrtle Featherwick',subtitle:'Cages, nets and feathered friends',x:8450,y:5010,color:'#5e5849',stock:[['critter_cage',8],['critter_net',24],['empty_jar',4]],line:'Open a station owl’s cage and you might make a friend.'},
 {id:'floreans',name:'Florean Fortescue’s',owner:'Florean Fortescue',subtitle:'Ice cream & magical sweets',x:7550,y:5390,color:'#805653',stock:[['diagon_ice_cream',8],['chocolate_frog',15]],line:'An extra scoop for the journey? Chocolate frogs do hop off.'},
 {id:'gringotts',name:'Gringotts Wizarding Bank',owner:'Griphook',subtitle:'Safe coin exchange',x:8450,y:5390,color:'#77786d',stock:[],line:'Your gold is counted. Every last coin.'}
];
export const inDiagon=g=>g.trainTest?.design.activeRoom==='diagon';
export const holdingWand=p=>[p.equipment?.hand1,p.equipment?.hand2].some(i=>itemKind(typeof i==='string'?i:i?.type)==='wand');
export function alleyGate(g){const t=g.trainTest;if(!t?.design.wildLands||t.design.activeRoom)return null;const w=railwayStations(t.design)[0];if(!w)return null;return {x:w.station.x+w.station.w/2+80,y:w.station.y+35,station:w.station.name};}
export function alleyPrompt(g,p){if(p.hp<=0||p.trainRide)return '';if(inDiagon(g)){if(Math.hypot(p.x-ALLEY.entry.x,p.y-ALLEY.entry.y)<80)return 'RETURN TO STATION';const s=nearbyAlleyShop(g,p);return s?(s.id==='gringotts'?'EXCHANGE 5 DARK ESSENCE · 25 GOLD':'VISIT '+s.name.toUpperCase()):'';}const gate=alleyGate(g);return gate&&Math.hypot(p.x-gate.x,p.y-gate.y)<110?(g.trainTest.alleyOpened?'ENTER DIAGON ALLEY':holdingWand(p)?'OPEN ENCHANTED BRICK WALL':'THE BRICKS QUIVER · HOLD A WAND'):'';}
function travel(g,room,point){const t=g.trainTest;if(room==='diagon'){t.alleyActors=Object.fromEntries(['enemies','loot','pickups','baits','spells','arrows','traps','effects','xpOrbs','ghosts','villageFollowers','boomerangs','rifleShots'].map(key=>[key,g[key]]));for(const key of Object.keys(t.alleyActors))g[key]=[];}else if(t.alleyActors){Object.assign(g,t.alleyActors);delete t.alleyActors;}t.design.activeRoom=room||undefined;t.wildLandsOverview=false;t.notice=room?'Welcome to Diagon Alley. Explore the shops and return through the golden arch.':'Returned to Jungle Ruins station.';t.noticeUntil=t.time+4;for(const [i,p]of g.players.entries()){delete p.trainRide;Object.assign(p,{x:point.x+i*28,y:point.y,room:null,ui:null,swimming:false,trainGround:0,trainVisualLift:0,trainDeck:false,jumpHeight:0,jumpVelocity:0,dashTime:0,dashRecovery:0,charge:0});}spellTransition(g);}
export function interactAlley(g,p){if(p.hp<=0||p.trainRide)return false;const t=g.trainTest;if(!t?.design.wildLands)return false;
 if(inDiagon(g)){
  if(Math.hypot(p.x-ALLEY.entry.x,p.y-ALLEY.entry.y)<80){travel(g,null,t.alleyReturn);return true;}
  const s=nearbyAlleyShop(g,p);if(!s)return false;
  if(s.id==='gringotts'){
   const original=t.returnPlayers?.find(explorer=>explorer.id===p.id);
   const receipt=t.persistent?null:alleyReceipt(g,p);
   const reserved=-(receipt?.delta.dark_essence||0);
   if(receipt){
    const durable=original?.inventory.reduce((sum,item)=>sum+(item?.type==='dark_essence'?item.qty:0),0)||0;
    if(durable<reserved+5){g.message('Bring 5 Dark Essence from your expedition to make a lasting exchange.');return true;}
   }
   if(!take(p.inventory,'dark_essence',5)){g.message('Gringotts exchanges 5 Dark Essence for 25 gold.');return true;}
   p.coins=(p.coins||0)+25;
   if(receipt){receipt.gold+=25;receipt.delta.dark_essence=-reserved-5;}
   g.message('Five Dark Essence exchanged for 25 gold.');
   g.persist?.();
   return true;
  }
  t.alleyMerchants??={};const m=t.alleyMerchants[s.id]??={...s,shopTitle:s.name,trainTailor:true,alleyShop:true,stock:s.stock.map(([type,price])=>({item:{type,qty:1},price})),revision:0,greeting:s.line,visual:alleyMerchantActor(s)};
  const service=mirroredShopPoint(s,OLLIVANDERS_LAYOUT.service);
  Object.assign(m,service);p.ui={shop:'merchant',alleyShop:s.id,panel:'stock',index:0,page:0,notice:s.line};return true;
 }
 const gate=alleyGate(g);if(!gate||Math.hypot(p.x-gate.x,p.y-gate.y)>110)return false;
 if(!t.alleyOpened){if(!holdingWand(p)){g.message('The old bricks stir. Hold a wand to reveal the passage.');return true;}t.alleyOpened=true;t.alleyOpenedAt=t.time;g.onSound?.('magic',p);g.message('The bricks fold away… Diagon Alley awaits.');return true;}
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
 gringotts:{hair:'sidepart',hairColor:'#bab6a0',skin:'#c2a380',pants:'#424944'},
};
export function alleyMerchantActor(s){
 const wandmaker=s.id==='ollivanders';
 const offset=wandmaker?OLLIVANDERS_LAYOUT.keeper:ALLEY_SHOP_ROOMS[s.id].keeper||{x:-9,y:-36};
 const look=wandmaker?{hair:'waves',hairColor:'#d8d4c4',skin:'#d1a386'}:keeperLooks[s.id];
 return {id:'alley-'+s.id,sprite:'player',kind:'player',hp:1,...mirroredShopPoint(s,offset),faceX:0,faceY:1,
   equipment:{},appearance:{...DEFAULT_APPEARANCE,...look,shirt:s.color}};
}
export function alleyBlocked(g,x,y,r=7){if(!inDiagon(g)){const gate=alleyGate(g);return !!gate&&!g.trainTest.alleyOpened&&Math.abs(x-gate.x)<60+r&&Math.abs(y-gate.y)<12+r;}
 if(Math.abs(x-8000)<50+r&&y>4142-r&&y<4184+r)return true;
 if(x<ALLEY.left+r||x>ALLEY.right-r||y<ALLEY.top+r||y>ALLEY.bottom-r)return true;
 // Shop floors connect to the street through wide open fronts. Back, sides,
 // counters and displays are solid; the open central aisle remains walkable.
 return ALLEY_SHOPS.some(s=>s.id==='ollivanders'?ollivandersBlocked(s,x,y,r):shopSolidAt(s,x,y,r));
}
export function alleyReceipt(g,p){return ((g.trainTest.alleyPurchases??={})[p.id]??={spent:0,gold:0,items:[],delta:{}});}
export function transferAlleyPurchases(g,t){let changed=false;for(const original of t.returnPlayers){const p=g.players.find(p=>p.id===original.id),r=t.alleyPurchases?.[original.id];if(!p||!r)continue;changed=true;original.coins=Math.max(0,(original.coins||0)-r.spent+r.gold);original.npcQuests??={};const state=original.npcQuests.train_students??={received:{},pending:[]};state.pending??=[];
 for(const [type,amount]of Object.entries(r.delta)){const n=['potion','stamina_potion','diagon_ice_cream'].includes(type)?Math.min(amount,Math.max(0,p.inventory.filter(a=>a?.type===type).reduce((v,a)=>v+a.qty,0)-(r.baseline?.[type]||0))):amount;if(n<0){let left=-n;for(const a of original.inventory)if(a?.type===type){const used=Math.min(left,a.qty);a.qty-=used;left-=used;}original.inventory=original.inventory.map(a=>a?.qty===0?null:a);}else if(n>0&&!give(original.inventory,type,n))state.pending.push({type,qty:n});}
 }return changed;}

export function tickAlley(g,dt){const t=g.trainTest;if(!t?.design.wildLands)return;const gate=alleyGate(g),p=g.players.find(p=>p.hp>0&&!p.trainRide&&!p.ui&&(inDiagon(g)?Math.hypot(p.x-ALLEY.entry.x,p.y-ALLEY.entry.y)<24:gate&&t.alleyOpened&&t.time-t.alleyOpenedAt>.65&&Math.hypot(p.x-gate.x,p.y-(gate.y-12))<24));if(p)interactAlley(g,p);
 if(!inDiagon(g))return;t.alleyVisitors??=Array.from({length:4},(_,i)=>({id:'alley-visitor-'+i,sprite:'player',kind:'player',hp:1,x:7880+(i%2)*240,y:4300+i*300,faceX:0,faceY:1,equipment:{chest:'hogwarts_student_robes',back:'hogwarts_scarf_'+['red','blue','yellow','green'][i]},appearance:{...DEFAULT_APPEARANCE,hair:i%2?'bob':'sidepart',hairColor:['#563a30','#ad7048','#514537','#493e32'][i]}}));
 for(const [i,a]of t.alleyVisitors.entries()){const y=4300+i*300+Math.sin(t.time*.18+i)*80,dy=y-a.y;a.moving=Math.abs(dy)>.2;a.faceY=dy<0?-1:1;a.y+=Math.max(-1,Math.min(1,dy))*dt*20;a.step=(a.step||0)+Math.min(Math.abs(dy),dt*20)*.12;}
}
