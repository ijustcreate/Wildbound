import {nearbyScenery} from './performance.mjs';
import {propBase} from './environment.mjs';

// Geometry remains authored as whole assets. Only damaged cells are serialized;
// spatial indices, raster caches and cosmetic debris never enter a save/network snapshot.
export const WALL_SECTION_SIZE=40;
export const DESTRUCTION_PARTICLE_LIMIT=160;
const CELL=128, indices=new WeakMap(), visuals=new WeakMap(), rasters=new Map();
const RASTER_PIXEL_LIMIT=4*1024*1024;let rasterPixels=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const cols=b=>Math.ceil(b.w/WALL_SECTION_SIZE);
const rows=b=>Math.ceil(b.h/WALL_SECTION_SIZE);
const at=(b,n)=>({x:b.x+(n%cols(b))*WALL_SECTION_SIZE,y:b.y+Math.floor(n/cols(b))*WALL_SECTION_SIZE,
  w:Math.min(WALL_SECTION_SIZE,b.w-(n%cols(b))*WALL_SECTION_SIZE),h:Math.min(WALL_SECTION_SIZE,b.h-Math.floor(n/cols(b))*WALL_SECTION_SIZE)});
const rectDistance=(r,x,y)=>Math.hypot(x-clamp(x,r.x,r.x+r.w),y-clamp(y,r.y,r.y+r.h));
const material=(g,b)=>b.kind==='window'?'glass':b.kind==='fence'||b.destructionGroup==='doors'||b.destructionGroup==='furniture'?'wood':g.house?.temple?'stone':'plaster';
const toughness=(g,b)=>({glass:24,wood:65,plaster:110,stone:180})[material(g,b)];
function state(g){let s=visuals.get(g);if(!s||s.house!==g.house){s={house:g.house,particles:[],soundAt:-Infinity,saveAt:-Infinity};visuals.set(g,s);}return s;}
function index(g){
  const h=g.house;if(!h)return null;
  let s=indices.get(h);
  const count=(h.walls?.length||0)+(h.doors?.length||0)+(h.furniture?.length||0);
  if(s&&s.walls===h.walls&&s.doors===h.doors&&s.furniture===h.furniture&&s.count===count)return s;
  s={walls:h.walls,doors:h.doors,furniture:h.furniture,count,buckets:new Map()};
  for(const group of ['walls','doors','furniture'])for(const b of h[group]||[]){
    if(group==='furniture'&&['rug','plant'].includes(b.kind))continue;
    // Keep editor libraries untouched: only the active level receives this metadata.
    b.destructionGroup=group;
    for(let y=Math.floor(b.y/CELL);y<=Math.floor((b.y+b.h)/CELL);y++)for(let x=Math.floor(b.x/CELL);x<=Math.floor((b.x+b.w)/CELL);x++){
      const key=x+':'+y;let list=s.buckets.get(key);if(!list)s.buckets.set(key,list=[]);list.push(b);
    }
  }
  indices.set(h,s);return s;
}
function query(g,x,y,r){
  const s=index(g);if(!s)return [];
  const found=new Set();
  for(let cy=Math.floor((y-r)/CELL);cy<=Math.floor((y+r)/CELL);cy++)for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++)
    for(const b of s.buckets.get(cx+':'+cy)||[])if(!(b.destructionGroup==='doors'&&b.open)&&!b.destroyed&&rectDistance(b,x,y)<=r)found.add(b);
  return found;
}
function cells(b,x,y,r){
  const result=[],nx=cols(b),ny=rows(b);
  for(let cy=clamp(Math.floor((y-r-b.y)/WALL_SECTION_SIZE),0,ny-1);cy<=clamp(Math.floor((y+r-b.y)/WALL_SECTION_SIZE),0,ny-1);cy++)
    for(let cx=clamp(Math.floor((x-r-b.x)/WALL_SECTION_SIZE),0,nx-1);cx<=clamp(Math.floor((x+r-b.x)/WALL_SECTION_SIZE),0,nx-1);cx++){
      const n=cy*nx+cx,rect=at(b,n);if(rectDistance(rect,x,y)<=r)result.push({n,rect});
    }
  return result;
}
export function sectionBlocked(b,x,y,r=8){
  if(b.destroyed)return false;
  if(!b.sectionDamage)return rectDistance(b,x,y)<r;
  return cells(b,x,y,r).some(({n,rect})=>!b.sectionDamage[n]?.broken&&rectDistance(rect,x,y)<r);
}
function burst(g,r,b,dx,dy,broken){
  const s=state(g),count=Math.min(broken?12:3,DESTRUCTION_PARTICLE_LIMIT-s.particles.length),m=material(g,b);
  const colors={stone:['#9b997e','#6b7067','#ccc7a7'],wood:['#9e7448','#d4af73','#604632'],glass:['#99d2d7','#d9f4e5','#6c969f'],plaster:['#d8c8a1','#97856b','#6d4d36']}[m];
  for(let n=0;n<count;n++){
    const seed=(Math.imul(Math.round(r.x+r.y*13),1103515245)+n*977)>>>0,a=(seed%628)/100,speed=18+seed%48;
    s.particles.push({x:r.x+r.w/2,y:r.y+r.h/2,z:3+seed%12,vx:Math.cos(a)*speed+dx*35,vy:Math.sin(a)*speed*.55+dy*25,vz:35+seed%70,
      age:0,life:.55+(seed%40)/100,size:2+seed%3,color:colors[n%3],dust:n%4===0});
  }
  if((g.time||0)-s.soundAt>.09){g.onSound?.(broken?(m==='stone'?'mine':m==='glass'?'hatch':'fall'):'hit',{x:r.x+r.w/2,y:r.y+r.h/2});s.soundAt=g.time||0;}
}
function damageCell(g,b,n,damage,dx=0,dy=0){
  b.sectionDamage||={};const old=b.sectionDamage[n];if(old?.broken)return false;
  const max=toughness(g,b),value=Math.min(max,(old?.damage||0)+Math.max(0,damage));if(value===(old?.damage||0))return false;
  const broken=value>=max;b.sectionDamage[n]={damage:value,broken};b.destructionRevision=(b.destructionRevision||0)+1;
  state(g).dirty=true;
  if(broken){g.house.destructionRevision=(g.house.destructionRevision||0)+1;
    if(Object.values(b.sectionDamage).filter(s=>s.broken).length===cols(b)*rows(b))b.destroyed=true;
    if(b.kind==='window')b.broken=true;
  }
  burst(g,at(b,n),b,dx,dy,broken);return true;
}
// A sword strike only reaches the nearest exposed section; it cannot damage
// another room through an intact intervening wall.
export function damageStructureMelee(g,p,damage,range,spin=false){
  if(!g.house||!(damage>0))return false;
  let best=null;
  for(const b of query(g,p.x,p.y,range))for(const cell of cells(b,p.x,p.y,range)){
    if(b.sectionDamage?.[cell.n]?.broken)continue;
    const x=clamp(p.x,cell.rect.x,cell.rect.x+cell.rect.w),y=clamp(p.y,cell.rect.y,cell.rect.y+cell.rect.h),dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy);
    if(!spin&&d>1&&(dx*(p.faceX||0)+dy*(p.faceY||0))/d<.35)continue;
    let clear=true;for(let n=1,steps=Math.ceil(d/5);n<steps;n++)if(g.projectileBlocked?.(p.x+dx*n/steps,p.y+dy*n/steps,.5)){clear=false;break;}
    if(clear&&(!best||d<best.d))best={b,...cell,d};
  }
  return !!best&&damageCell(g,best.b,best.n,damage,p.faceX||0,p.faceY||0);
}
export function damageStructureProjectile(g,bolt){
  if(!(bolt.structureCharge>=.5)||bolt.healing||bolt.friendship)return false;
  const radius=(bolt.size||6)/2;
  for(const b of query(g,bolt.x,bolt.y,radius))for(const {n} of cells(b,bolt.x,bolt.y,radius))
    if(!b.sectionDamage?.[n]?.broken)return damageCell(g,b,n,bolt.damage,bolt.vx/260,bolt.vy/260);
  return false;
}
// Older glass panes retain their existing one-hit shatter behavior. Once a
// pane has structural cells, glass hits affect just the remaining local cell.
export function breakDamagedWindow(g,x,y,r){
  for(const b of query(g,x,y,r))if(b.kind==='window'&&b.sectionDamage)
    for(const {n,rect}of cells(b,x,y,r))if(!b.sectionDamage[n]?.broken&&rectDistance(rect,x,y)<r)return damageCell(g,b,n,toughness(g,b));
  return false;
}
const treeKinds=new Set(['tree','snow_tree','palm','leafless_tree','grave_forest_tree']);
const runnerRadii={elephant:38,rhino:34,zebra:18};
export function stampedeDestruction(g,e,from){
  // Airborne members of a mixed stampede don't smash ground structures.
  const radius=runnerRadii[e.kind];if(!radius)return;
  const dx=e.x-from.x,dy=e.y-from.y,len=Math.hypot(dx,dy),steps=Math.max(1,Math.ceil(len/20));let changed=false;
  for(let i=0;i<=steps;i++){
    const x=from.x+dx*i/steps,y=from.y+dy*i/steps;
    for(const b of query(g,x,y,radius))for(const {n} of cells(b,x,y,radius))if(!b.sectionDamage?.[n]?.broken)
      changed=damageCell(g,b,n,toughness(g,b),dx/(len||1),dy/(len||1))||changed;
    for(const p of nearbyScenery(g.scenery||[],x,y,radius+40)){
      if(p.depleted||p.falling||!treeKinds.has(p.kind))continue;
      const base=propBase(p);if(Math.hypot(x-base.x,y-base.y)>radius+12)continue;
      p.harvest=p.maxHarvest||Math.round(p.size*.85);p.falling=.001;p.fallDirection=dx<0?-1:1;p.logCount=Math.max(2,Math.round(p.size/32));p.hitAt=g.time;
      burst(g,{x:base.x-8,y:base.y-6,w:16,h:12},{kind:'fence'},dx/(len||1),dy/(len||1),true);changed=true;
    }
  }
  // Existing environment tick completes the fall and drops logs exactly once.
  if(changed)state(g).dirty=true;
}
export function tickDestruction(g,dt){
  if(!visuals.has(g))return;const s=state(g);
  for(const p of s.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=240*dt;if(p.z<0){p.z=0;p.vz=0;p.vx*=.5;p.vy*=.5;}}
  s.particles=s.particles.filter(p=>p.age<p.life);
  if(s.dirty&&(g.time||0)-s.saveAt>=.35){s.dirty=false;s.saveAt=g.time||0;g.persist?.();}
}
export function destructionStats(g){return {particles:visuals.get(g)?.particles.length||0,particleLimit:DESTRUCTION_PARTICLE_LIMIT,rasterBytes:rasterPixels*8,rasterByteLimit:RASTER_PIXEL_LIMIT*8};}
function paintDamage(c,g,b,n,record){
  const r=at(b,n),m=material(g,b);
  if(record.broken){
    const palette=m==='stone'?['#7b8070','#a7aa8a']:m==='glass'?['#82b5b7','#b6ded6']:['#7d6040','#ba986a'];
    for(let i=0;i<7;i++){c.fillStyle=palette[i%2];c.fillRect(r.x+((n*17+i*11)%Math.max(1,r.w-4)),r.y+((n*13+i*7)%Math.max(1,r.h-3)),3+i%4,2+i%3);}
    // Small attached splinters/stone teeth frame the breach without closing it.
    const nx=cols(b);c.fillStyle=palette[0];
    if(n%nx>0&&!b.sectionDamage?.[n-1]?.broken)c.fillRect(r.x,r.y+2,3,Math.max(2,r.h*.3));
    if(n%nx<nx-1&&!b.sectionDamage?.[n+1]?.broken)c.fillRect(r.x+r.w-3,r.y+r.h*.55,3,Math.max(2,r.h*.25));
  }else{
    const amount=record.damage/toughness(g,b);c.strokeStyle=m==='stone'?'#333e36':'#584534';c.lineWidth=1;c.beginPath();
    const x=r.x+r.w*.45,y=r.y+r.h*.2;c.moveTo(x,y);c.lineTo(x-4,y+r.h*.22);c.lineTo(x+3,y+r.h*.47);c.lineTo(x-2,y+r.h*.65);
    if(amount>.5){c.moveTo(x-4,y+r.h*.22);c.lineTo(x+9,y+r.h*.34);c.moveTo(x+3,y+r.h*.47);c.lineTo(x-9,y+r.h*.57);}c.stroke();
  }
}
// One raster per asset, patched only in cells that changed. No full-building
// redraw, framebuffer reads, physics bodies, canvas filters or particle lights.
export function drawBreakable(c,g,b,painter,style='default'){
  // Huge editor rectangles use one clipped draw instead of allocating giant
  // surfaces. Normal assets share a globally bounded LRU of paired rasters.
  if(typeof document==='undefined'||(b.w+16)*(b.h+64)>512*1024){
    if(!b.sectionDamage){painter(c,b);return;}c.save();c.beginPath();
    for(let n=0;n<cols(b)*rows(b);n++){const r=at(b,n);if(!b.sectionDamage[n]?.broken)c.rect(r.x,r.y,r.w,r.h);}
    c.clip();painter(c,b);c.restore();
    for(const [n,record]of Object.entries(b.sectionDamage))paintDamage(c,g,b,Number(n),record);return;
  }
  let cache=rasters.get(b);
  const key=style+':'+(b.kind==='window'&&!b.sectionDamage?!!b.broken:false);
  if(!cache||cache.style!==key){
    if(cache){rasterPixels-=cache.pixels;cache.source.width=cache.canvas.width=1;rasters.delete(b);}
    const pixels=(b.w+16)*(b.h+64);
    while(rasterPixels+pixels>RASTER_PIXEL_LIMIT&&rasters.size){const oldest=rasters.keys().next().value,entry=rasters.get(oldest);rasterPixels-=entry.pixels;entry.source.width=entry.canvas.width=1;rasters.delete(oldest);}
    const source=document.createElement('canvas');source.width=b.w+16;source.height=b.h+64;
    const sc=source.getContext('2d');sc.translate(8-b.x,48-b.y);painter(sc,b.kind==='window'&&b.sectionDamage?{...b,broken:false}:b);
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);
    cache={source,canvas,style:key,revision:-1,seen:{},pixels};rasters.set(b,cache);rasterPixels+=pixels;
  }
  else {rasters.delete(b);rasters.set(b,cache);}
  if(b.sectionDamage&&cache.revision!==b.destructionRevision){
    const cc=cache.canvas.getContext('2d');
    for(const [key,record] of Object.entries(b.sectionDamage)){
      if(cache.seen[key]===record.damage)continue;const n=Number(key),r=at(b,n),sx=r.x-b.x+8,sy=r.y-b.y+48;
      const height=r.h+(r.y+r.h===b.y+b.h?8:0);
      cc.clearRect(sx,sy,r.w,height);
      if(!record.broken)cc.drawImage(cache.source,sx,sy,r.w,height,sx,sy,r.w,height);
      cc.save();cc.translate(8-b.x,48-b.y);paintDamage(cc,g,b,n,record);cc.restore();cache.seen[key]=record.damage;
    }
    cache.revision=b.destructionRevision;
  }
  c.drawImage(cache.canvas,b.x-8,b.y-48);
}
export function drawDestruction(c,g,visible=()=>true){
  if(!visuals.has(g))return;const s=state(g);if(!s.particles.length)return;c.save();
  for(const p of s.particles){if(!visible(p))continue;c.globalAlpha=Math.min(1,(p.life-p.age)*3)*(p.dust?.35:1);c.fillStyle=p.color;
    c.fillRect(Math.round(p.x),Math.round(p.y-p.z),p.dust?p.size*2:p.size,p.dust?p.size*2:Math.max(1,p.size-1));}
  c.restore();
}
