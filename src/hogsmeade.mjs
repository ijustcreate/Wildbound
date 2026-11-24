import {HOGSMEADE_BUILDINGS,HOGSMEADE_PROPS,HOGSMEADE_SHACK,hogsmeadeDoor,inHogsmeade,inHogsmeadeBuilding} from './hogsmeade-layout.mjs';
import {interactLupin,nearbyLupin} from './remus-lupin.mjs';
import {interactShackFixture,shackFixturePrompt} from './hogsmeade-boggart.mjs';
import {itemKind} from './items.mjs';
import {SHRINKING_CANDY} from './shrinking-candy.mjs';

const roomActive=g=>g.trainTest?.design?.wildLands&&!g.trainTest.design.activeRoom;
const state=g=>g.trainTest.hogsmeade??={};
const doorOpen=(g,b)=>!!g.trainTest.hogsmeade?.[b.id]?.open||!!g.trainTest.hogsmeade?.[b.id]?.broken;
export const hogsmeadeDoors=(g,b)=>g.trainTest.hogsmeade?.[b.id]||{};
const boardsHealth=42,shackHealth=58;
const innId='three-broomsticks';
const shackRumor='The Shack’s been boarded for years. Some nights I hear a howl. Others it’s something rattling inside a wardrobe. If you go looking, keep your wand close.';
const stocks={
 'three-broomsticks':[
  {label:'Buy Butterbeer · 4 gold',price:4,item:'butterbeer'},
  {label:'Take a warming tonic · 8 gold',price:8,item:'stamina_potion'},
 ],
 zonkos:[{label:'A chocolate frog for your pocket · 5 gold',price:5,item:'chocolate_frog'},
  {label:'Take a travel cage · 8 gold',price:8,item:'critter_cage'},
  {label:'Buy a Firework · 8 gold',price:8,item:'zonko_firework'},
  {label:'Buy Flaming Footprints Candy · 12 gold',price:12,item:'flaming_footprints'},
  {label:'Buy Shrinking Candy · 10 gold',price:10,item:SHRINKING_CANDY}],
};
export const HOGSMEADE_NPCS=[
 {id:'rosmerta',name:'Madam Rosmerta',title:'Publican',x:7818,y:3987,faceX:.2,faceY:1,
  building:'three-broomsticks',appearance:{hair:'waves',hairColor:'#895744',shirt:'#8c594d',pants:'#48423a'},
  line:'A hot butterbeer by the hearth first, then you can tell me what news came down the hill.'},
 {id:'zonko',name:'Zonko',title:'Jokeshop proprietor',x:8466,y:3921,faceX:.3,faceY:1,
  building:'zonkos',appearance:{hair:'crop',hairColor:'#b48c57',shirt:'#c09253',pants:'#514565'},
  equipment:{head:'witch_hat_ember_russet'},line:'Mind the teacups. The little white one took the tip off my measuring spoon.'},
 {id:'hagrid',name:'Rubeus Hagrid',title:'Keeper of Keys and Grounds',x:8719,y:4199,faceX:-.6,faceY:1,
  appearance:{hair:'waves',hairColor:'#4f392e',shirt:'#7b593f',pants:'#454a46',facialHair:'fullbeard'},
  line:'The Shack’s been empty for years. If ye hear scratching upstairs, mind where ye put yer feet.'},
].map(n=>({...n,sprite:'player',kind:'player',hp:1,maxHp:1,equipment:n.equipment||{},appearance:{skin:'#bd8d6b',eyeColor:'#36423a',...n.appearance}}));

function doorNear(g,p){
 return HOGSMEADE_BUILDINGS.find(b=>{const door=hogsmeadeDoor(b);return !hogsmeadeDoors(g,b).broken&&Math.abs(p.x-door.x)<25&&Math.abs(p.y-door.y)<30;});
}
function npcNear(g,p){
 return HOGSMEADE_NPCS.find(n=>Math.hypot(p.x-n.x,p.y-n.y)<59&&(!n.building||
  inHogsmeadeBuilding(HOGSMEADE_BUILDINGS.find(b=>b.id===n.building),p.x,p.y,-6)));
}
const available=(g,p)=>roomActive(g)&&p.hp>0&&!p.trainRide&&!p.room&&!p.swimming&&inHogsmeade(p.x,p.y,50);
const say=(g,text)=>{g.trainTest.notice=text;g.trainTest.noticeUntil=g.trainTest.time+4;g.message?.(text);};
export const carriesInnWand=p=>['hand1','hand2'].some(slot=>itemKind(p.equipment?.[slot])==='wand')||
 (p.inventory||[]).some(stack=>stack?.qty>0&&itemKind(stack.type)==='wand');
const innWandNeeded=(g,site,p)=>site.id===innId&&!doorOpen(g,site)&&p.y>=hogsmeadeDoor(site).y&&!carriesInnWand(p);

export function hogsmeadePrompt(g,p){
 const lupin=nearbyLupin(g,p);
 if(!available(g,p))return lupin?'TALK TO REMUS LUPIN':'';
 const fixture=shackFixturePrompt(g,p);if(fixture)return fixture;
 const door=doorNear(g,p);
 if(door){
  if(door===HOGSMEADE_SHACK&&!hogsmeadeDoors(g,door).unboarded)return 'THE SHACK IS BOARDED UP';
  if(innWandNeeded(g,door,p))return 'WAND NEEDED · THE THREE BROOMSTICKS';
  return (doorOpen(g,door)?'CLOSE':'OPEN')+' '+door.name.toUpperCase();
 }
 if(lupin)return 'TALK TO REMUS LUPIN';
 const npc=npcNear(g,p);
 return npc?'TALK TO '+npc.name.toUpperCase():'';
}

export function interactHogsmeade(g,p){
 if(!available(g,p))return interactLupin(g,p);
 if(interactShackFixture(g,p))return true;
 const site=doorNear(g,p);
 if(site){
  if(innWandNeeded(g,site,p)){say(g,'The Three Broomsticks’ lock needs a wand. Keep one in your hand or backpack.');return true;}
  const door=hogsmeadeDoor(site),status=state(g)[site.id]??={};
  if(site===HOGSMEADE_SHACK&&!status.unboarded){say(g,'Swing at the boards to pry the entrance clear.');return true;}
  if(status.open&&g.players.some(q=>q.hp>0&&Math.abs(q.x-door.x)<door.half+3&&Math.abs(q.y-door.y)<12)){
   say(g,'The doorway is occupied.');return true;
  }
  status.open=!status.open;
  g.onSound?.(site.id===innId?(status.open?'doorOpen':'doorClose'):'door',p);
  g.persist?.();return true;
 }
 if(interactLupin(g,p))return true;
 const npc=npcNear(g,p);
 if(!npc)return false;
 p.ui={shop:'npc-dialogue',hogsmeadeNpc:npc.id,ownerDevice:p.device,index:0,node:'welcome'};
 p.consumeInput=true;p.charge=0;return true;
}

export function hogsmeadeDialogueView(g,p){
 const npc=available(g,p)&&npcNear(g,p);
 const exit={label:'Leave',action:'close'};
 if(!npc||npc.id!==p.ui?.hogsmeadeNpc||p.ui.ownerDevice!==p.device)return {text:'The conversation has ended.',choices:[exit]};
 const choices=(stocks[npc.building]||[]).map((item,index)=>({...item,action:'hogsmeade:'+index,disabled:(p.coins||0)<item.price}));
 if(npc.id==='rosmerta')choices.push({label:'What have you heard about the Shrieking Shack?',action:'hogsmeade:shack-rumor'});
 return {npc,text:p.ui.notice||(p.ui.node==='shack-rumor'?shackRumor:npc.line),choices:[...choices,exit]};
}

export function hogsmeadeDialogueAction(g,p,action,give){
 const {npc,choices}=hogsmeadeDialogueView(g,p),ui=p.ui;
 if(!npc||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(['next','prev','down','up'].includes(action)){
  ui.index=(ui.index+choices.length+(['next','down'].includes(action)?1:-1))%choices.length;return true;
 }
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close'){p.ui=null;p.consumeInput=true;return true;}
 const choice=choices.find(c=>c.action===action&&!c.disabled);
 if(!choice)return true;
 if(choice.action==='hogsmeade:shack-rumor'){
  ui.node='shack-rumor';delete ui.notice;ui.revision=(ui.revision||0)+1;return true;
 }
 if(choice.item&&!give(p.inventory,choice.item,1)){ui.notice='Your backpack is full.';return true;}
 p.coins-=choice.price;
 ui.notice=choice.item==='butterbeer'?'Rosmerta slides a warm tankard across the bar.':'Wrapped and ready.';
 g.onSound?.('purchase',p);g.persist?.();return true;
}

export function hogsmeadeBlocked(g,x,y,r,height=0){
 if(!roomActive(g)||!inHogsmeade(x,y,90)||height>72)return false;
 for(const b of HOGSMEADE_BUILDINGS){
  if(!inHogsmeadeBuilding(b,x,y,r+6))continue;
  const dx=Math.abs(x-b.x),dy=y-b.y,pad=r+5;
  if(Math.abs(dx-b.w/2)<pad||Math.abs(dy+b.h/2)<pad)return true;
  if(Math.abs(dy-b.h/2)<pad&&(!doorOpen(g,b)||dx>=hogsmeadeDoor(b).half-r))return true;
 }
 return HOGSMEADE_PROPS.some(p=>p.solid&&Math.abs(x-p.building.x-p.x)<p.w/2+r&&Math.abs(y-p.building.y-p.y)<6+r);
}

export function hitHogsmeadeDoor(g,p,damage,range){
 if(!available(g,p)||p.ui||p.faceY>=.65&&p.y>hogsmeadeDoor(HOGSMEADE_SHACK).y)return false;
 const door=hogsmeadeDoor(HOGSMEADE_SHACK),dx=door.x-p.x,dy=door.y-p.y;
 const d=Math.hypot(dx,dy);
 if(d>range||d&&(dx*(p.faceX||0)+dy*(p.faceY||0))/d<.66)return false;
 const status=state(g)[HOGSMEADE_SHACK.id]??={};
 if(status.broken||status.open)return false;
 if(!status.unboarded){
  status.boardDamage=(status.boardDamage||0)+damage;
  if(status.boardDamage>=boardsHealth){status.unboarded=true;say(g,'The planks give way. Open the door or break the rotten wood.');}
 }else{
  status.doorDamage=(status.doorDamage||0)+damage;
  if(status.doorDamage>=shackHealth){status.broken=true;say(g,'The Shack door splinters inward.');}
 }
 g.onSound?.('wood',p);g.persist?.();return true;
}
