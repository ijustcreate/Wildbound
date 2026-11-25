import {drawBeachGull} from './beach-art.mjs';
import {drawCoastalCritter,tickCoastalCritter} from './coastal-critters.mjs';
import {LAND_OUTLINE,PORTAL_ISLAND,wildLandsCoastDistance,wildLandsOpenOcean,wildLandsPathAt} from './wild-lands-geography.mjs';
import {TIDEGLASS_COASTLINES,tideglassEdge,tideglassIntersects,tideglassOcean,tideglassPathDistance} from './tideglass-layout.mjs';
import {wildHash,wildLandsGround,wildLandsSurface,wildLandsSurfaceAt} from './wild-lands-world.mjs';

const CELL=512, WAKE_RADIUS=980, MAX_ACTIVE=24, MAX_RELEASED=12;
const LIVE_SECONDS=360, MOVE_STEP=1/15;
const CARDINALS=[[8,0],[-8,0],[0,8],[0,-8]];
const shoreCells=new Map(), runtime=new WeakMap();
const cellKey=(x,y)=>`${x},${y}`;
const active=g=>g.trainTest?.design?.wildLands&&!g.trainTest.design.activeRoom&&!g.trainTest.wildLandsOverview;

// Use the authored world coastline, including the outer island. A river or
// lake can be deep too, but cannot contribute an ocean home.
function indexShoreSites(){
 if(shoreCells.size)return;
 const original=[LAND_OUTLINE,PORTAL_ISLAND].map(outline=>outline.map(([x,y])=>[x*16000,y*9600]));
 for(const [island,points] of [...original,...TIDEGLASS_COASTLINES].entries()){
  for(const [edge,[ax,ay]] of points.entries()){
   const [bx,by]=points[(edge+1)%points.length],length=Math.hypot(bx-ax,by-ay);
   const tx=(bx-ax)/length,ty=(by-ay)/length,count=Math.max(1,Math.round(length/340));
   for(let i=0;i<count;i++){
    const id=`${island}-${edge}-${i}`,random=wildHash(edge+island*41,i+13);
    const distance=(i+.35+random*.3)*length/count,x=ax+tx*distance,y=ay+ty*distance;
    const key=cellKey(Math.floor(x/CELL),Math.floor(y/CELL));
    if(!shoreCells.has(key))shoreCells.set(key,[]);
    shoreCells.get(key).push({id,x,y,tx,ty,random});
   }
  }
 }
}

export function wildCoastalHabitat(d,kind,x,y){
 if(!d?.wildLands||d.activeRoom||x<12||y<12||x>d.width-12||y>d.height-12)return false;
 const tideglass=tideglassIntersects(x-1,y-1,x+1,y+1);
 const ocean=wildLandsOpenOcean(x,y)&&(!tideglass||tideglassOcean(x,y)),surface=wildLandsSurface(d,x,y);
 if(kind==='fish'){
  return ocean&&surface==='water'&&wildLandsSurfaceAt(d,x,y)==='water'&&CARDINALS.every(([dx,dy])=>
   wildLandsSurface(d,x+dx,y+dy)==='water'&&wildLandsSurfaceAt(d,x+dx,y+dy)==='water');
 }
 if(kind!=='crab'||wildLandsGround(d,x,y)!=='beach'||wildLandsPathAt(x,y)||tideglass&&tideglassPathDistance(x,y)<32)return false;
 const nearCoast=tideglass&&Math.abs(tideglassEdge(x,y))<=145||wildLandsCoastDistance(x,y)<=145;
 if(!nearCoast)return false;
 return ocean?surface==='shallow'&&wildLandsSurfaceAt(d,x,y)==='shallow':surface==='grass'&&wildLandsSurfaceAt(d,x,y)==='grass';
}

function fieldFor(t){
 let field=runtime.get(t);
 if(field?.design!==t.design){
  field={design:t.design,animals:[],releases:[],homeCache:new Map(),refreshAt:0,elapsed:0};
  runtime.set(t,field);
 }
 return field;
}

function animal(kind,id,x,y,random){
 return {kind,id,x,y,homeX:x,homeY:y,phase:random*Math.PI*2,faceX:random<.5?-1:1,faceY:0,variant:Math.floor(random*3)};
}

function shoreHomes(d,site){
 const {id,x,y,tx,ty,random}=site;
 const position=(out,along=0)=>({x:x+ty*out+tx*along,y:y-tx*out+ty*along});
 const result=[];
 const fill=(kind,offsets,along=0,suffix='')=>{
  for(const distance of offsets){
   const p=position(distance,along);
   if(!wildCoastalHabitat(d,kind,p.x,p.y))continue;
   result.push(animal(kind,`${id}:${kind}${suffix}`,p.x,p.y,random));
   break;
  }
 };
 fill('crab',[-28,-52,22,-72,58]);
 fill('fish',[164+random*78,258,312,116]);
 if(random>.68)fill('fish',[184,262,330],57,'2');
 if(!result.length)return result;
 if(random>.45)result.push({...animal('gull',`${id}:gull`,x,y,random),tx,ty});
 if(random>.81){
  const p=position(106);
  result.push({...animal('pelican',`${id}:pelican`,p.x,p.y,random),tx,ty,hp:1,moving:true,animationAction:'fly'});
 }
 return result;
}

function refresh(t,field,players){
 indexShoreSites();
 const caught=t.wildCoastalCaught||{};
 for(const id of Object.keys(caught))if(caught[id]<=t.time)delete caught[id];
 const activeSites=new Set();
 for(const p of players){
  for(let cy=Math.floor((p.y-WAKE_RADIUS)/CELL);cy<=Math.floor((p.y+WAKE_RADIUS)/CELL);cy++){
   for(let cx=Math.floor((p.x-WAKE_RADIUS)/CELL);cx<=Math.floor((p.x+WAKE_RADIUS)/CELL);cx++){
    for(const site of shoreCells.get(cellKey(cx,cy))||[]){
     if(Math.hypot(site.x-p.x,site.y-p.y)<WAKE_RADIUS)activeSites.add(site);
    }
   }
  }
 }
 const old=new Map(field.animals.map(a=>[a.id,a]));
 const near=a=>Math.min(...players.map(p=>Math.hypot(p.x-a.homeX,p.y-a.homeY)));
 const candidates=[];
 for(const site of activeSites){
  if(!field.homeCache.has(site.id))field.homeCache.set(site.id,shoreHomes(t.design,site));
  for(const home of field.homeCache.get(site.id)){
   if(caught[home.id]>t.time)continue;
   const distance=near(home);
   if(distance<WAKE_RADIUS)candidates.push({home,distance});
  }
 }
 field.animals=candidates.sort((a,b)=>a.distance-b.distance).slice(0,MAX_ACTIVE).map(({home})=>old.get(home.id)||{...home});
}

function moveBird(a,time){
 const t=time*(a.kind==='gull'?.20:.14)+a.phase,along=Math.sin(t)*82,off=Math.sin(t*.7)*31;
 const x=a.homeX+a.tx*along+a.ty*off,y=a.homeY+a.ty*along-a.tx*off;
 a.faceX=x-a.x||a.faceX;a.faceY=y-a.y||a.faceY;a.x=x;a.y=y;
 a.flightHeight=a.kind==='gull'?36+Math.sin(t*1.7)*9:24+Math.sin(t*1.3)*8;
}

export function tickWildCoastalCritters(g,dt){
 const t=g.trainTest;
 if(!active(g))return;
 const field=fieldFor(t);
 if(t.time>=field.refreshAt){
  field.refreshAt=t.time+.6;
  refresh(t,field,(g.players||[]).filter(p=>p.hp>0&&!p.room));
 }
 field.elapsed+=dt;
 if(field.elapsed<MOVE_STEP)return;
 const step=Math.min(.1,field.elapsed);
 field.elapsed=0;
 for(const a of [...field.animals,...field.releases]){
  if(a.kind==='gull'||a.kind==='pelican'){moveBird(a,t.time);continue;}
  const owner=a.releasedOwner==null?null:g.players.find(p=>p.id===a.releasedOwner&&!p.room&&p.hp>0);
  const target=owner&&Math.hypot(owner.x-a.x,owner.y-a.y)>25?owner:null;
  tickCoastalCritter(g,a,step,t.time,target,(_,kind,x,y)=>
   (a.releasedOwner!=null||Math.hypot(x-a.homeX,y-a.homeY)<84)&&wildCoastalHabitat(t.design,kind,x,y));
 }
}

export function wildCoastalAnimals(g){
 const field=active(g)&&runtime.get(g.trainTest);
 return field?[...field.animals,...field.releases]:[];
}

export function drawWildCoastalCritters(c,g,visible,animator=null){
 for(const a of wildCoastalAnimals(g)){
  const bird=a.kind==='gull'||a.kind==='pelican';
  if(bird!==!!animator||!visible(a,bird?55:16))continue;
  if(a.kind==='gull')drawBeachGull(c,{x:a.x,y:a.y-(a.flightHeight||36)},g.time,a.phase);
  else if(a.kind==='pelican')animator.draw(c,{...a,y:a.y-(a.flightHeight||24)},g.time,35);
  else drawCoastalCritter(c,a,g.time);
 }
}

export function catchableWildCoastalCritter(g,p){
 if(!active(g)||p.room||p.trainRide||p.vehicleId||!(p.hp>0))return null;
 let target=null,best=46;
 for(const a of wildCoastalAnimals(g)){
  if(a.kind!=='crab'&&a.kind!=='fish')continue;
  const dx=a.x-p.x,dy=a.y-p.y,distance=Math.hypot(dx,dy);
  if(distance>=best||dx*(p.faceX||0)+dy*(p.faceY||0)<-8)continue;
  target=a;best=distance;
 }
 return target;
}

export function removeWildCoastalCritter(g,a){
 const t=g.trainTest,field=fieldFor(t);
 if(a.releasedOwner!=null)field.releases=field.releases.filter(other=>other!==a);
 else{
  (t.wildCoastalCaught??={})[a.id]=t.time+LIVE_SECONDS;
  field.animals=field.animals.filter(other=>other!==a);
 }
}

export function wildCoastalReleaseSpot(g,p,kind){
 if(!active(g)||p.trainRide||p.vehicleId||fieldFor(g.trainTest).releases.length>=MAX_RELEASED)return null;
 const d=g.trainTest.design;
 let best=81,spot=null;
 for(let dy=-80;dy<=80;dy+=16)for(let dx=-80;dx<=80;dx+=16){
  const distance=Math.hypot(dx,dy),x=p.x+dx,y=p.y+dy;
  if(distance>=best||!wildCoastalHabitat(d,kind,x,y))continue;
  best=distance;spot={x,y};
 }
 return spot;
}

export function releaseWildCoastalCritter(g,p,kind,{x,y}){
 const id=`released-coastal-${g.nextId++}`;
 fieldFor(g.trainTest).releases.push({...animal(kind,id,x,y,wildHash(x,y)),releasedOwner:p.id});
}
