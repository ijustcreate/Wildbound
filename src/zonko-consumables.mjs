import {waterAt} from './environment.mjs';
import {wildLandsGround,wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';
import {wildHomesteadAt} from './wild-homestead-layout.mjs';
import {HOGSMEADE_BUILDINGS,inHogsmeadeBuilding} from './hogsmeade-layout.mjs';
import {inBayouGoblinHut} from './bayou-goblin-hut-layout.mjs';
import {QUIDDITCH_ROOM} from './quidditch-layout.mjs';

export const ZONKO_FIREWORK='zonko_firework';
export const FLAMING_FOOTPRINTS='flaming_footprints';
export const FOOTPRINT_SECONDS=60;
export const FIREWORK_RISE_SECONDS=1.05;
export const FIREWORK_SECONDS=3.8;
const STEP_SPACING=15, FLAME_SECONDS=1.14, SCORCH_SECONDS=32;
const MAX_FLAMES=72, MAX_SCORCH=144, MAX_FIREWORKS=4;
const timelines=new WeakMap();
export const isZonkoConsumable=type=>type===ZONKO_FIREWORK||type===FLAMING_FOOTPRINTS;
const layer=g=>g.trainTest?'railway:'+(g.trainTest.design.activeRoom||'surface'):'classic:'+(g.generatedEnvironment||g.environment||'forest');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const inRect=(p,r)=>p.x>=r.x&&p.y>=r.y&&p.x<r.x+r.w&&p.y<r.y+r.h;

function timeline(g){
 let value=timelines.get(g);
 if(!value){value={flames:[],scorch:[],walkers:new WeakMap()};timelines.set(g,value);}
 return value;
}

export function zonkoGroundScorchable(g,p){
 if(waterAt(g,p.x,p.y)!=='grass')return false;
 if(g.house?.floors?.some(r=>inRect(p,r))||g.house?.paths?.some(r=>inRect(p,r)))return false;
 const d=g.trainTest?.design;
 if(!d?.wildLands)return !d?.activeRoom;
 if(d.activeRoom||wildLandsSurfaceAt(d,p.x,p.y)!=='grass'||wildLandsPathAt(p.x,p.y)||
  wildHomesteadAt(d,p.x,p.y)||inBayouGoblinHut(p.x,p.y)||HOGSMEADE_BUILDINGS.some(b=>inHogsmeadeBuilding(b,p.x,p.y)))return false;
 return ['forest','jungle','swamp','house','graveyard'].includes(wildLandsGround(d,p.x,p.y));
}

function canLight(p){
 return p.hp>0&&!p.room&&!p.swimming&&!p.underBridge&&!p.controlledFollowerId&&!p.vehicleId&&!p.broomMount&&!p.wingHover;
}

export function useZonkoConsumable(g,p,item,index){
 if(!item?.qty||p.inventory[index]!==item||!isZonkoConsumable(item.type))return false;
 if(p.hp<=0)return true;
 const notice=text=>{if(p.ui)p.ui.notice=text;else g.message?.(text);};
 if(item.type===ZONKO_FIREWORK){
  const effects=g.effects??=[];
  const active=effects.filter(f=>f.zonkoFirework&&f.life>0);
  if(!canLight(p)||g.trainTest?.design.activeRoom===QUIDDITCH_ROOM){notice('Set the firework off from a clear footing.');return true;}
  if(active.length>=MAX_FIREWORKS||active.some(f=>f.owner===p.id)){notice('Let the current fireworks finish first.');return true;}
  effects.push({zonkoFirework:true,owner:p.id,x:p.x,y:p.y-(p.pirateVisualLift||p.trainVisualLift||0),
   life:FIREWORK_SECONDS,duration:FIREWORK_SECONDS,seed:(p.id||0)*91+Math.round(g.time*60)});
  p.ui=null;p.consumeInput=true;
  g.onSound?.('zonkoFireworkLaunch',p);
 }else{
  (p.field??={}).flamingFootprints=FOOTPRINT_SECONDS;
  notice('Flaming Footprints active for 60 seconds.');
  g.onSound?.('coin',p);
 }
 if(--item.qty===0)p.inventory[index]=null;
 g.persist?.();
 return true;
}

export function tickZonkoFireworks(g){
 for(const fx of g.effects||[]){
  if(!fx.zonkoFirework||fx.burst||fx.duration-fx.life<FIREWORK_RISE_SECONDS)continue;
  fx.burst=true;g.onSound?.('zonkoFireworkBurst',fx);
 }
}

function append(marks,mark,now,limit){
 while(marks.length&&(marks[0].expires<=now||marks.length>=limit))marks.shift();
 marks.push(mark);
}

export function tickFlamingFootprints(g,p,dt){
 const remaining=p.field?.flamingFootprints;
 if(!(remaining>0))return;
 const next=Math.max(0,remaining-dt),state=timeline(g),walkers=state.walkers;
 if(next<=1e-7){delete p.field.flamingFootprints;walkers.delete(p);return;}
 p.field.flamingFootprints=next;
 const currentLayer=layer(g);
 if(!canLight(p)||p.ui||p.pirateRide||p.trainRide||p.trainDeck||Math.max(p.jumpHeight||0,p.trainGround||0,p.groundHeight||0)>5){walkers.delete(p);return;}
 const mark=walkers.get(p);
 if(!mark||mark.layer!==currentLayer||distance(mark,p)>55){walkers.set(p,{x:p.x,y:p.y,layer:currentLayer,side:1});return;}
 if(distance(mark,p)<STEP_SPACING||!p.moving)return;
 const dx=p.x-mark.x,dy=p.y-mark.y,span=Math.hypot(dx,dy);
 const point={x:Math.round(p.x-dy/span*mark.side*3),y:Math.round(p.y+dx/span*mark.side*2)};
 walkers.set(p,{x:p.x,y:p.y,layer:currentLayer,side:-mark.side});
 if(['water','shallow','mud','floodbridge'].includes(waterAt(g,point.x,point.y)))return;
 const now=g.time,entry={...point,layer:currentLayer,owner:p.id,born:now,angle:Math.atan2(dy,dx)};
 append(state.flames,{...entry,expires:now+FLAME_SECONDS},now,MAX_FLAMES);
 if(zonkoGroundScorchable(g,point))append(state.scorch,{...entry,expires:now+SCORCH_SECONDS},now,MAX_SCORCH);
}

export function zonkoGroundMarks(g){
 const current=layer(g),state=timelines.get(g);
 const active=marks=>marks?.filter(m=>m.expires>g.time&&m.layer===current)||[];
 return {flames:active(state?.flames),scorch:active(state?.scorch)};
}
