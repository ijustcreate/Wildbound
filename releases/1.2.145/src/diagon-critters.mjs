import {BACKPACK_SLOTS,ITEMS,clearSlot,give,migrateLegacySupplies,take} from './items.mjs';
import {critterContainer} from './critter-containers.mjs';
import {DIAGON_CRITTER_SPECIES as SPECIES} from './diagon-critter-species.mjs';
import {NOCTURNE_LANE,nocturneLaneX} from './alley-street-layout.mjs';

const WILD_CRITTERS=[
 {id:'moonvein-west',kind:'moonvein_butterfly',stops:[[7312,4001],[7345,4023],[7356,3997],[7325,3983]]},
 {id:'moonvein-willow',kind:'moonvein_butterfly',stops:[[7475,3850],[7530,3885],[7515,3940],[7440,3930]]},
 {id:'moonvein-south',kind:'moonvein_butterfly',stops:[[7230,4110],[7282,4170],[7250,4240],[7186,4202]]},
 {id:'gloamwhisker',kind:'gloamwhisker_rat',stops:[[9093,5010],[9072,4850],[9118,4726],[9141,4844],[9127,5107],[8997,5210],[8856,5210],[8742,5241],[8919,5262],[9051,5238]]},
 {id:'cobble-garden',kind:'cobble_jumper',stops:[[7162,4048],[7183,4087],[7222,4078],[7210,4030]]},
 {id:'cobble-signpost',kind:'cobble_jumper',stops:[[9031,4742],[9064,4777],[9085,4775],[9088,4693]]},
 {id:'cobble-threadneedle',kind:'cobble_jumper',stops:[[9131,5339],[9084,5382],[9061,5361],[9075,5310]]},
 {id:'cobble-nightglass',kind:'cobble_jumper',stops:[[9081,5502],[9119,5539],[9134,5505],[9122,5471]]},
].map(crit=>['gloamwhisker','cobble-signpost','cobble-threadneedle','cobble-nightglass'].includes(crit.id)?
 {...crit,stops:crit.stops.map(([x,y])=>[x>=8970?nocturneLaneX(x):x,y])}:crit);
const RESPAWN_SECONDS=360,RELEASE_LIMIT=12;
const active=g=>g.trainTest?.design?.activeRoom==='diagon';
const playable=(g,p)=>active(g)&&['play','won'].includes(g.phase)&&!g.paused&&p.hp>0&&!p.room&&!p.trainRide&&!p.vehicleId;
const equipNet=p=>[p.equipment?.hand1,p.equipment?.hand2].includes('critter_net');
const stateFor=g=>g.trainTest.diagonCritterState??={caughtUntil:{},released:[],serial:0};
const runtime=new WeakMap();

function terrain(g,x,y,r){return g.blocked(x,y,r,false,false,false,0);}

function makeCritter(def,phase,blocked){
 const index=def.stops.findIndex(([x,y])=>!blocked(x,y,3));
 if(index<0)return null;
 const [x,y]=def.stops[index];
 return {...def,x,y,faceX:1,faceY:0,next:(index+1)%def.stops.length,idle:.5+(phase%3)*.3,phase,altitude:0,moving:false};
}

function population(g,blocked){
 const t=g.trainTest,s=stateFor(g);
 let field=runtime.get(t);
 if(!field){field={animals:new Map(),refreshAt:0};runtime.set(t,field);}
 if(t.time<field.refreshAt)return field;
 field.refreshAt=t.time+1;
 const populate=(def,phase)=>{
  if(field.animals.has(def.id))return;
  const animal=makeCritter(def,phase,blocked);
  if(animal)field.animals.set(def.id,animal);
 };
 WILD_CRITTERS.forEach((def,i)=>{
  if((s.caughtUntil[def.id]||0)>t.time)return;
  delete s.caughtUntil[def.id];
  const burrow=s.wallHides?.[def.id];
  if(burrow&&t.time<burrow.until)return;
  if(burrow){
   const stops=[...def.stops].sort(([ax,ay],[bx,by])=>Math.hypot(bx-burrow.x,by-burrow.y)-Math.hypot(ax-burrow.x,ay-burrow.y));
   populate({...def,stops},i*.93+1);
   if(field.animals.has(def.id))delete s.wallHides[def.id];
  }else populate(def,i*.93+1);
 });
 for(const r of s.released)if(Object.hasOwn(SPECIES,r.kind)){
  const stops=[[r.x,r.y],[r.x+22,r.y-12],[r.x+24,r.y+17],[r.x-16,r.y+12]];
  populate({...r,stops,released:true},r.x+r.y);
 }
 return field;
}

export function visitDiagonCritters(g,visit){
 if(!active(g))return;
 for(const animal of runtime.get(g.trainTest)?.animals.values()||[])visit(animal);
}

function advance(a,g,dt,blocked){
 const air=a.kind==='moonvein_butterfly',rat=a.kind==='gloamwhisker_rat';
 const nearby=g.players.filter(p=>p.hp>0&&!p.room&&Math.abs(p.x-a.x)<820&&Math.abs(p.y-a.y)<620);
 if(!nearby.length)return;
 const startled=rat&&nearby.some(p=>Math.hypot(p.x-a.x,p.y-a.y)<55);
 if(rat)a.startled=startled;
 a.idle=Math.max(0,a.idle-dt*(startled?3:1));
 if(a.idle>0){
  a.moving=false;
  a.altitude=Math.max(0,a.altitude-dt*36);
  return;
 }
 const [tx,ty]=a.stops[a.next],dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);
 const pace=SPECIES[a.kind].speed*(startled?1.65:1),hopTime=g.trainTest.time+a.phase;
 if(d<3||blocked(tx,ty,3)){
  a.next=(a.next+1)%a.stops.length;
  a.idle=air?.72+(a.next%3)*.23:rat?.22:1.1+(a.next%3)*.28;
  return;
 }
 const length=Math.min(pace*dt,d),nx=dx/d,ny=dy/d;
 const previousX=a.x,previousY=a.y;
 const drift=air?Math.sin(hopTime*3)*length*.32:0;
 const x=a.x+nx*length-ny*drift,y=a.y+ny*length+nx*drift;
 if(!blocked(x,y,3)){
  a.x=x;a.y=y;a.faceX=nx;a.faceY=ny;a.moving=true;
 }else if(!blocked(x,a.y,3))a.x=x;
 else if(!blocked(a.x,y,3))a.y=y;
 else {a.next=(a.next+1)%a.stops.length;a.idle=.17;}
 if(rat){
  const distance=Math.hypot(a.x-previousX,a.y-previousY);
  a.moving=distance>0;
  a.step=(a.step||0)+distance*(startled?.22:.24);
 }
 a.altitude=air?Math.min(17+Math.sin(hopTime*4)*3,a.altitude+dt*54):
  rat?0:Math.max(0,Math.sin(hopTime*17)-.15)*2;
}

export function tickDiagonCritters(g,dt,blocked=(x,y,r)=>terrain(g,x,y,r),hunt){
 if(!active(g))return;
 const field=population(g,blocked);
 const fleeing=hunt?.(g,dt,field.animals,blocked,(rat,hole)=>{
  const s=stateFor(g);
  (s.wallHides??={})[rat.id]={x:hole.x,y:hole.y,until:g.trainTest.time+20};
  field.animals.delete(rat.id);
  g.persist?.();
 });
 for(const a of field.animals.values())if(a.id!==fleeing)advance(a,g,dt,blocked);
}

function netTarget(g,p,field){
 if(!playable(g,p)||p.ui||!equipNet(p))return null;
 let best=null,max=54;
 for(const a of field?.animals.values()||[]){
  const dx=a.x-p.x,dy=a.y-p.y,d=Math.hypot(dx,dy);
  if(d>=max||dx*(p.faceX||0)+dy*(p.faceY||0)<-8||Math.abs((a.altitude||0)-(p.jumpHeight||0))>31)continue;
  if(terrain(g,p.x+dx*.36,p.y+dy*.36,2)||terrain(g,p.x+dx*.71,p.y+dy*.71,2))continue;
  best=a;max=d;
 }
 return best;
}

export function diagonCritterPrompt(g,p){
 const target=netTarget(g,p,runtime.get(g.trainTest));
 return target?'CATCH '+SPECIES[target.kind].name.toUpperCase():'';
}

function takeContainer(list,preferred){
 const choices=preferred==='critter_cage'?['critter_cage']:['empty_jar','critter_cage'];
 for(const id of choices)if(take(list,id))return id;
 for(const bag of list)if(ITEMS[bag?.type]?.bag&&Array.isArray(bag.contents)){
  const id=takeContainer(bag.contents,preferred);
  if(id)return id;
 }
 return null;
}

export function catchDiagonCritter(g,p){
 if(!playable(g,p)||p.ui||!equipNet(p))return false;
 const animal=netTarget(g,p,population(g,(x,y,r)=>terrain(g,x,y,r)));
 if(!animal)return false;
 const type='caught_'+animal.kind,{container:preferred,name}=SPECIES[animal.kind];
 const inventory=structuredClone(p.inventory);migrateLegacySupplies(inventory);
 const container=takeContainer(inventory,preferred);
 if(!container){
  g.message(preferred==='critter_cage'?'You need an empty travel cage for this rat.':'Bring an empty critter jar or travel cage.');
  return true;
 }
 if(!give(inventory,type,1,BACKPACK_SLOTS,{captureContainer:container})){
  g.message('Make room for your new passenger. Your container is still empty.');
  return true;
 }
 p.inventory=inventory;
 const t=g.trainTest,s=stateFor(g);
 if(animal.released)s.released=s.released.filter(r=>r.id!==animal.id);
 else s.caughtUntil[animal.id]=t.time+RESPAWN_SECONDS;
 runtime.get(t).animals.delete(animal.id);
 if(!t.persistent)((t.diagonCritterReceipts??={})[p.id]??=[]).push({type,container});
 p.attack=p.attackDuration=.34;p.attackClip='punch';
 g.onSound?.('pickup',p);g.message('Caught a '+name+'!');g.persist?.();
 return true;
}

function habitat(kind,x,y){
 const garden=x>=7110&&x<=7608&&y>=3780&&y<=4294&&(x<7490||y<4100);
 const lane=NOCTURNE_LANE;
 const nocturne=(x>=lane.x&&x<=lane.x+lane.w&&y>=lane.y&&y<=lane.y+lane.h)||(x>=8670&&x<=9210&&y>=5161&&y<=5303);
 return SPECIES[kind].habitat==='either'?garden||nocturne:SPECIES[kind].habitat==='garden'?garden:nocturne;
}

export function releaseDiagonCritter(g,p,index){
 const item=p.inventory?.[index],kind=item?.type?.startsWith('caught_')&&item.type.slice(7);
 if(!kind||!Object.hasOwn(SPECIES,kind))return false;
 const announce=message=>{if(p.ui)p.ui.notice=message;g.message?.(message);return true;};
 if(!playable(g,p))return announce('Bring this critter to its outdoor habitat in Diagon Alley.');
 const t=g.trainTest,s=stateFor(g),container=critterContainer(item.type,item);
 const receipts=t.diagonCritterReceipts?.[p.id],receiptIndex=receipts?.findIndex(r=>r.type===item.type&&r.container===container)??-1;
 if(!t.persistent&&receiptIndex<0)return announce('Open your saved Wild Lands expedition to release this critter.');
 if(s.released.length>=RELEASE_LIMIT)return announce('All the release spots are occupied.');
 let spot=null;
 for(const radius of [22,35,48]){
  for(let i=0;i<8&&!spot;i++){
   const angle=i*Math.PI/4,x=p.x+Math.round(Math.cos(angle)*radius),y=p.y+Math.round(Math.sin(angle)*radius);
   if(habitat(kind,x,y)&&!terrain(g,x,y,4)&&!terrain(g,(p.x+x)/2,(p.y+y)/2,3))spot={x,y};
  }
  if(spot)break;
 }
 if(!spot)return announce('Find open ground in this critter’s habitat before releasing it.');
 const inventory=structuredClone(p.inventory);
 if(--inventory[index].qty===0)clearSlot(inventory,index);
 if(!give(inventory,container))return announce('Make room for the empty container first.');
 p.inventory=inventory;
 if(receiptIndex>=0)receipts.splice(receiptIndex,1);
 s.released.push({id:'diagon-release-'+(++s.serial),kind,...spot});
 const field=runtime.get(t);if(field)field.refreshAt=0;
 g.persist?.();return announce('Released into its habitat. You got the empty container back.');
}

export function transferDiagonCritters(t){
 let changed=false;
 for(const original of t.returnPlayers){
  const receipts=t.diagonCritterReceipts?.[original.id];
  if(!receipts?.length)continue;
  for(const {type,container}of receipts){
   const inventory=structuredClone(original.inventory);migrateLegacySupplies(inventory);
   if(takeContainer(inventory,container)!==container)continue;
   if(!give(inventory,type,1,BACKPACK_SLOTS,{captureContainer:container}))continue;
   original.inventory=inventory;changed=true;
  }
 }
 delete t.diagonCritterReceipts;
 return changed;
}
