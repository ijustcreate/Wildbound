import {graveyardHash,graveyardBlocked,GRAVEYARD_SAFE_AREA} from './graveyard-world.mjs';
import {drawGraveyardCritter} from './graveyard-art.mjs';
import {ITEMS,give,take,clearSlot,migrateLegacySupplies} from './items.mjs';
import {CRITTER_CONTAINERS,critterContainer} from './critter-containers.mjs';

// Parent registers the caught_* ITEMS and container mappings. No registry mutation here.
// All save data is nested on g.graveyard.surfaceEcology; no hidden WeakMap animals.
export const GRAVEYARD_ECOLOGY_LIMITS=Object.freeze({grave_moth:8,crypt_beetle:6,graveyard_cat:1,total:15});
export const GRAVEYARD_CRITTER_KINDS=Object.freeze(['grave_moth','crypt_beetle']);
export const GRAVEYARD_CRITTER_ITEMS=Object.freeze({
  caught_grave_moth:{name:'Captured grave moth',stack:1,color:'#cbbaca',sellPrice:8,description:'A pale moth from the cemetery. Release it to follow you for this level.'},
  caught_crypt_beetle:{name:'Captured crypt beetle',stack:1,color:'#6f9886',sellPrice:8,description:'An iridescent beetle found among mossy graves.'},
});
const active=g=>g?.generatedEnvironment==='graveyard' && !!g.graveyard;
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const known=kind=>GRAVEYARD_CRITTER_KINDS.includes(kind)||kind==='graveyard_cat';
const protectedSpot=(x,y)=>x>=GRAVEYARD_SAFE_AREA.x-24 && x<=GRAVEYARD_SAFE_AREA.x+GRAVEYARD_SAFE_AREA.w+24 &&
  y>=GRAVEYARD_SAFE_AREA.y-24 && y<=GRAVEYARD_SAFE_AREA.y+GRAVEYARD_SAFE_AREA.h+24;

export function graveyardHabitat(g,kind,x,y) {
  if(!active(g)||!known(kind)||!Number.isFinite(x)||!Number.isFinite(y)||x<56||y<56||x>1544||y>1544||protectedSpot(x,y))return false;
  const tile=g.terrain?.[Math.floor(y/32)*50+Math.floor(x/32)];
  if(!tile||['water','shallow','quicksand'].includes(tile))return false;
  // Even moths are seeded away from stone roofs and iron; flight is a drawing layer.
  return !graveyardBlocked(g,x,y,kind==='graveyard_cat'?8:4,false);
}

/** Pure adapter for initLivingEcosystem; IDs fit its existing 0..17 caught mask. */
export function seedGraveyardCritters(g,limit=GRAVEYARD_ECOLOGY_LIMITS.total) {
  if(!active(g))return [];
  limit=Math.max(0,Math.min(GRAVEYARD_ECOLOGY_LIMITS.total,Math.floor(finite(limit))));
  const animals=[],seed=g.graveyard.seed;
  for(const kind of ['grave_moth','crypt_beetle','graveyard_cat']) {
    for(let n=0;n<GRAVEYARD_ECOLOGY_LIMITS[kind] && animals.length<limit;n++) {
      let spot=null;
      for(let attempt=0;attempt<96;attempt++) {
        const salt=n+attempt*13+(kind==='grave_moth'?100:kind==='crypt_beetle'?400:700);
        const x=400+graveyardHash(seed,salt,31)*800,y=420+graveyardHash(seed,salt,71)*720;
        if(graveyardHabitat(g,kind,x,y)&&!animals.some(a=>Math.hypot(a.x-x,a.y-y)<32)){spot={x,y};break;}
      }
      if(!spot)continue;
      const id=animals.length;
      animals.push({id,kind,...spot,homeX:spot.x,homeY:spot.y,phase:graveyardHash(seed,id,97)*Math.PI*2,
        faceX:id%2?1:-1,variant:id%3,catchable:kind!=='graveyard_cat',faction:'neutral',
        moving:false,idle:kind==='graveyard_cat'?'sit':'idle',graveyardAmbient:true});
    }
  }
  return animals;
}

/** Idempotent, including after JSON restore; catches never trigger population refill. */
export function spawnSurfaceEcology(g) {
  if(!active(g))return [];
  let s=g.graveyard.surfaceEcology;
  if(s?.version!==1 || s.seed!==g.graveyard.seed) {
    s=g.graveyard.surfaceEcology={version:1,seed:g.graveyard.seed,time:0,caught:[],animals:seedGraveyardCritters(g)};
  } else {
    s.time=finite(s.time);
    s.caught=Array.isArray(s.caught)?[...new Set(s.caught.filter(id=>Number.isInteger(id)&&id>=0&&id<15))]:[];
    const counts={},ids=new Set();
    s.animals=(Array.isArray(s.animals)?s.animals:[]).filter(a=> {
      if(!a||!known(a.kind)||ids.has(a.id)||!graveyardHabitat(g,a.kind,a.x,a.y)||s.caught.includes(a.id))return false;
      counts[a.kind]=(counts[a.kind]||0)+1;
      if(counts[a.kind]>GRAVEYARD_ECOLOGY_LIMITS[a.kind])return false;
      ids.add(a.id);a.catchable=a.kind!=='graveyard_cat';a.faction='neutral';return true;
    }).slice(0,GRAVEYARD_ECOLOGY_LIMITS.total);
  }
  return s.animals;
}

/** Adapter also works on live animals owned by initLivingEcosystem's runtime. */
export function tickGraveyardCritter(g,a,dt,time=0,target=null) {
  if(!active(g)||g.phase!=='play'||g.paused||!known(a?.kind)||!Number.isFinite(dt)||dt<=0)return false;
  dt=Math.min(dt,1);time=finite(time);a.phase=finite(a.phase);a.moving=false;
  const cat=a.kind==='graveyard_cat';
  if(cat) {
    // Mostly seated or curled up; the cat never flees, hunts, attacks or enters AI.
    const cycle=(time+a.phase*3)%24;
    a.idle=cycle<12?'sit':cycle<20?'sleep':'walk';
    if(a.idle!=='walk')return true;
  }
  const owner=a.releasedOwner!=null?(g.players||[]).find(p=>p.id===a.releasedOwner&&p.hp>0&&!p.room):null;
  target=owner?{x:owner.x-18,y:owner.y+22}:target;
  const t=time+a.phase;
  let gx=target?.x??finite(a.homeX,a.x)+Math.sin(t*(cat ? .15 : .55))*(cat?20:28);
  let gy=target?.y??finite(a.homeY,a.y)+Math.cos(t*(cat ? .12 : .43))*(cat?12:18);
  if(!target&&!cat) {
    const threat=(g.players||[]).find(p=>p.hp>0&&!p.room&&Math.hypot(p.x-a.x,p.y+14-a.y)<42);
    if(threat){gx=a.x+(a.x-threat.x)*2;gy=a.y+(a.y-threat.y-14)*2;}
  }
  const dx=gx-a.x,dy=gy-a.y,d=Math.hypot(dx,dy)||1;
  const step=Math.min(d,dt*(cat?8:a.kind==='grave_moth'?target?60:20:target?48:10));
  // Small movement substeps prevent delayed frames tunneling across iron rails.
  const steps=Math.max(1,Math.ceil(step/3));
  for(let n=0;n<steps;n++) {
    const mx=dx/d*step/steps,my=dy/d*step/steps;
    for(const [x,y] of [[a.x+mx,a.y+my],[a.x+mx,a.y],[a.x,a.y+my]]) {
      if(Math.hypot(x-a.x,y-a.y)<.001||!graveyardHabitat(g,a.kind,x,y))continue;
      a.faceX=x-a.x || a.faceX;a.x=x;a.y=y;a.moving=true;break;
    }
  }
  return true;
}

export function tickSurfaceEcology(g,dt) {
  if(!active(g)||g.phase!=='play'||g.paused||!Number.isFinite(dt)||dt<=0)return false;
  const animals=spawnSurfaceEcology(g),s=g.graveyard.surfaceEcology;
  s.time=(s.time+Math.min(dt,1))%3600;
  for(const a of animals)tickGraveyardCritter(g,a,dt,s.time);
  return true;
}

/** Draw in the world camera transform; moths belong to air, beetle/cat to ground. */
export function drawGraveyardEcology(ctx,g,layer='ground') {
  if(!active(g)||g.phase==='won'||!['ground','air'].includes(layer))return false;
  const s=g.graveyard.surfaceEcology;if(!s)return false;
  for(const a of s.animals)if((a.kind==='grave_moth')===(layer==='air')) {
    if(Number.isFinite(g.bloom)&&g.bloom<3&&Math.hypot(a.x-800,a.y-800)>g.bloom*430)continue;
    drawGraveyardCritter(ctx,a,s.time);
  }
  return true;
}

const hasNet=p=>[p?.equipment?.hand1,p?.equipment?.hand2].includes('critter_net');
function consumeContainer(list,preferred) {
  for(const type of [preferred,...CRITTER_CONTAINERS.filter(c=>c!==preferred)])if(take(list,type))return type;
  for(const item of list)if(ITEMS[item?.type]?.bag&&Array.isArray(item.contents)) {
    const container=consumeContainer(item.contents,preferred);if(container)return container;
  }
  return null;
}

/** Same give/take/container transaction as the existing net; cat is never caught. */
export function catchGraveyardCritter(g,p,range=78) {
  if(!active(g)||g.phase!=='play'||g.paused||!p||p.room||p.ui||p.hp<=0||!hasNet(p)||!Number.isFinite(range)||range<=0)return false;
  const animals=spawnSurfaceEcology(g);
  const a=animals.filter(a=>a.catchable && Math.hypot(a.x-p.x,a.y-p.y)<=range &&
    (a.x-p.x)*(p.faceX || 0)+(a.y-p.y)*(p.faceY || 0)>=-8)
    .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  if(!a)return false;
  const type='caught_'+a.kind;
  if(!ITEMS[type]){g.message?.('This critter needs its inventory definition before it can be caught.');return true;}
  const copy=structuredClone(p.inventory || []);migrateLegacySupplies(copy);
  const container=consumeContainer(copy,'empty_jar');
  if(!container){g.message?.('You need an empty critter bottle or travel cage.');return true;}
  if(!give(copy,type,1,24,{captureContainer:container})) {
    g.message?.('Make room for your new passenger. Nothing was consumed.');return true;
  }
  p.inventory=copy;
  const s=g.graveyard.surfaceEcology;
  if(a.releasedOwner==null && !s.caught.includes(a.id))s.caught.push(a.id);
  s.animals=s.animals.filter(b=>b!==a);
  p.attack=p.attackDuration=.34;p.attackClip='punch';
  g.message?.('Caught '+a.kind.replaceAll('_',' ')+'!');g.persist?.();return true;
}

/** Route caught_grave_moth/caught_crypt_beetle here before generic releaseCritter. */
export function releaseGraveyardCritter(g,p,index) {
  const item=p?.inventory?.[index],kind=item?.type?.replace(/^caught_/,'');
  if(!active(g)||g.phase!=='play'||g.paused||!p||p.room||p.hp<=0||!Number.isInteger(index)||!item?.type?.startsWith('caught_')||!GRAVEYARD_CRITTER_KINDS.includes(kind)||!Number.isFinite(item.qty)||item.qty<1)return false;
  const animals=spawnSurfaceEcology(g);
  const fail=message=>{if(p.ui)p.ui.notice=message;g.message?.(message);return true;};
  if(animals.filter(a=>a.kind===kind).length>=GRAVEYARD_ECOLOGY_LIMITS[kind])return fail('This cemetery already has enough of that critter.');
  let spot=null;
  for(let radius=24;radius<=96&&!spot;radius+=16)for(let n=0;n<8;n++) {
    const x=p.x+Math.cos(n*Math.PI/4)*radius,y=p.y+14+Math.sin(n*Math.PI/4)*radius;
    if(graveyardHabitat(g,kind,x,y)){spot={x,y};break;}
  }
  if(!spot)return fail('Move onto open cemetery ground before releasing this critter.');
  const container=critterContainer(item.type,item),copy=structuredClone(p.inventory);
  if(--copy[index].qty===0)clearSlot(copy,index);
  if(!give(copy,container,1))return fail('Make room for the empty container first.');
  p.inventory=copy;
  const s=g.graveyard.surfaceEcology;
  // The counter lives in saved graveyard state, independent of global nextId.
  s.releaseSerial=(s.releaseSerial || 0)+1;
  s.animals.push({id:'grave-released:'+s.releaseSerial,kind,...spot,homeX:spot.x,homeY:spot.y,
    phase:s.time,faceX:1,variant:s.releaseSerial%3,catchable:true,faction:'neutral',
    releasedOwner:p.id,moving:false,graveyardAmbient:true});
  if(p.ui)p.ui.notice='Released! Catch your companion again before leaving.';
  g.uiRevision=(g.uiRevision || 0)+1;g.persist?.();return true;
}
