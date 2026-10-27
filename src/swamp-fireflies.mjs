// Small nocturnal wildlife, not another world-light/shadow system.
import {realmTerrainAt,realmContexts,realmHash,realmVoidBlocked,realmFootprint} from './realm-world.mjs';
import {timeOfDay,sightRadius} from './night-cycle.mjs';
import {ITEMS,give,take,clearSlot,migrateLegacySupplies} from './items.mjs';
import {CRITTER_CONTAINERS,critterContainer} from './critter-containers.mjs';

export const MARSH_FIREFLY_LIMIT=10;
export const firefliesAwake=g=>timeOfDay(g)==='night';
export function marshFireflyHabitat(g,x,y){
  const state=g.realmState;if(!state||state.env!=='swamp')return false;
  const ox=state.originX||0,oy=state.originY||0;
  if(x<ox+48||x>ox+1552||y<oy+48||y>oy+1552||realmVoidBlocked(g,x,y,3))return false;
  const tx=Math.floor(x/32),ty=Math.floor(y/32),tile=realmTerrainAt(g,tx,ty);
  if(!tile||['water','bridge','floodbridge'].includes(tile))return false;
  const wet=tile==='shallow'||[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].some(([dx,dy])=>['water','shallow'].includes(realmTerrainAt(g,tx+dx,ty+dy)));
  return wet&&!(g.scenery||[]).some(p=>{const b=realmFootprint(p);return b&&x>b.x-3&&x<b.x+b.w+3&&y>b.y-3&&y<b.y+b.h+3;});
}
// Separate migration from faunaVersion: preserve later shadow-fauna work and
// captured identities; never regenerate the population every night or reload.
export function seedMarshFireflies(g){
  const s=g.realmState;if(s?.env!=='swamp'||s.fireflyHabitatVersion===1)return;
  s.animals||=[];s.caughtFireflies||=[];
  const occupied=s.animals.filter(a=>a.kind==='marsh_firefly'),spots=[];
  for(let i=0;i<1100&&spots.length<MARSH_FIREFLY_LIMIT;i++){
    const x=(s.originX||0)+64+realmHash(s.seed+i*17,231)*1472,y=(s.originY||0)+64+realmHash(s.seed+i*29,725)*1472;
    if(marshFireflyHabitat(g,x,y)&&!spots.some(p=>Math.hypot(p.x-x,p.y-y)<85))spots.push({x,y});
  }
  for(let n=0;n<MARSH_FIREFLY_LIMIT;n++){
    const old=occupied[n],id=old?.id||'marsh-firefly:'+n;if(s.caughtFireflies.includes(id))continue;
    const spot=old&&marshFireflyHabitat(g,old.x,old.y)?old:spots.shift();if(!spot)continue;
    const a=old||{id,kind:'marsh_firefly',phase:realmHash(s.seed,n)*Math.PI*2,faceX:1,faceY:0,neutral:true};
    Object.assign(a,{x:spot.x,y:spot.y,homeX:spot.x,homeY:spot.y});if(!old)s.animals.push(a);
  }
  s.fireflyHabitatVersion=1;
}
export function tickMarshFirefly(g,a,dt){
  a.moving=false;if(!firefliesAwake(g))return;
  const t=(g.time||0)+(a.phase||0),owner=a.releasedOwner!=null?g.players?.find(p=>p.id===a.releasedOwner&&p.hp>0&&!p.room):null;
  const goal=owner&&marshFireflyHabitat(g,owner.x,owner.y)?owner:{x:a.homeX,y:a.homeY};
  const dx=goal.x+Math.sin(t*.8)*18-a.x,dy=goal.y+Math.cos(t*.65)*12-a.y,len=Math.hypot(dx,dy)||1,step=Math.min(len,Math.max(0,Math.min(dt,.1))*14);
  const x=a.x+dx/len*step,y=a.y+dy/len*step;
  if(marshFireflyHabitat(g,x,y)){a.x=x;a.y=y;a.faceX=dx/len;a.faceY=dy/len;a.moving=step>.01;}
}
let halo;
export function drawMarshFirefly(c,a,time=0){
  if(!halo){halo=document.createElement('canvas');halo.width=halo.height=18;const p=halo.getContext('2d'),gradient=p.createRadialGradient(9,9,0,9,9,9);gradient.addColorStop(0,'#d9ed894f');gradient.addColorStop(.3,'#bdd96e25');gradient.addColorStop(1,'#bdd96e00');p.fillStyle=gradient;p.fillRect(0,0,18,18);}
  const x=Math.round(a.x),y=Math.round(a.y-7+Math.sin(time*2+(a.phase||0))*2),pulse=.6+.4*Math.sin(time*2.5+(a.phase||0))**2;
  c.save();c.globalAlpha*=pulse;c.drawImage(halo,x-9,y-9);c.fillStyle='#eff3af';c.fillRect(x,y,2,2);c.fillStyle='#78946b';c.fillRect(x-1,y-1,1,1);c.restore();
}
// Small emissive pixels survive the night tint without punching holes in fog.
// This pass is camera/visibility culled and adds ZERO world-light sources.
export function drawMarshFireflyGlows(c,g,camera,w,h){
  if(!firefliesAwake(g)||g.phase==='won'||!(g.players||[]).some(p=>p.hp>0&&!p.room))return;
  c.save();c.translate(w/2-camera.x*camera.zoom,h/2-camera.y*camera.zoom);c.scale(camera.zoom,camera.zoom);
  for(const ctx of realmContexts(g))for(const a of ctx.realmState?.animals||[]){
    if(a.kind!=='marsh_firefly'||Math.abs(a.x-camera.x)>w/(2*camera.zoom)+12||Math.abs(a.y-camera.y)>h/(2*camera.zoom)+12)continue;
    if(g.bloom<3&&g.mapMode!=='boundless'&&Math.hypot(a.x-800,a.y-800)>g.bloom*430)continue;
    if(!(g.players||[]).some(p=>p.hp>0&&!p.room&&Math.hypot(p.x-a.x,p.y-a.y)<sightRadius(g,p)))continue;
    drawMarshFirefly(c,a,g.time||0);
  }
  c.restore();
}
function consumeContainer(list){
  for(const type of CRITTER_CONTAINERS)if(take(list,type))return type;
  for(const item of list||[])if(ITEMS[item?.type]?.bag&&Array.isArray(item.contents)){const c=consumeContainer(item.contents);if(c)return c;}
  return null;
}
export function catchMarshFirefly(g,p){
  if(g.phase!=='play'||g.paused||!firefliesAwake(g)||!p||p.room||p.ui||p.hp<=0||![p.equipment?.hand1,p.equipment?.hand2].includes('critter_net'))return false;
  const choices=realmContexts(g).flatMap(ctx=>(ctx.realmState?.animals||[]).filter(a=>a.kind==='marsh_firefly').map(a=>({a,s:ctx.realmState})));
  const match=choices.filter(({a})=>Math.hypot(a.x-p.x,a.y-p.y)<46&&(a.x-p.x)*(p.faceX||0)+(a.y-p.y)*(p.faceY||0)>=-8).sort((a,b)=>Math.hypot(a.a.x-p.x,a.a.y-p.y)-Math.hypot(b.a.x-p.x,b.a.y-p.y))[0];if(!match)return false;
  const copy=structuredClone(p.inventory||[]);migrateLegacySupplies(copy);const container=consumeContainer(copy);
  if(!container){g.message?.('You need an empty critter bottle/jar or travel cage.');return true;}
  if(!give(copy,'caught_marsh_firefly',1,24,{captureContainer:container})){g.message?.('Make room for your firefly. Nothing was consumed.');return true;}
  p.inventory=copy;const {a,s}=match;s.caughtFireflies||=[];if(a.releasedOwner==null&&!s.caughtFireflies.includes(a.id))s.caughtFireflies.push(a.id);s.animals=s.animals.filter(b=>b!==a);
  p.attack=p.attackDuration=.34;p.attackClip='punch';g.message?.('Caught a marsh firefly!');g.persist?.();return true;
}
export function releaseMarshFirefly(g,p,index){
  const item=p.inventory?.[index];if(item?.type!=='caught_marsh_firefly')return false;
  const fail=message=>{if(p.ui)p.ui.notice=message;g.message?.(message);return true;};
  if(g.phase!=='play'||g.paused||p.room||p.hp<=0)return fail('Release fireflies outside beside a swamp bank at night.');
  const ctx=realmContexts(g).find(c=>marshFireflyHabitat(c,p.x,p.y));
  if(!ctx||!firefliesAwake(g))return fail('Release fireflies beside a swamp bank at night. Nothing was consumed.');
  const s=ctx.realmState;if((s.animals||[]).filter(a=>a.kind==='marsh_firefly').length>=MARSH_FIREFLY_LIMIT)return fail('This bank already has enough fireflies.');
  const copy=structuredClone(p.inventory),container=critterContainer(item.type,item);if(--copy[index].qty===0)clearSlot(copy,index);
  if(!give(copy,container,1))return fail('Make room for the empty container first.');
  p.inventory=copy;s.fireflyReleaseSerial=(s.fireflyReleaseSerial||0)+1;
  s.animals.push({id:'released-marsh-firefly:'+s.fireflyReleaseSerial,kind:'marsh_firefly',x:p.x,y:p.y,homeX:p.x,homeY:p.y,neutral:true,phase:g.time||0,faceX:1,faceY:0,releasedOwner:p.id});
  if(p.ui)p.ui.notice='Released beside the bank. Catch it again with your net.';g.persist?.();return true;
}
