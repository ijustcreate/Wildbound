// Native ground and scenery preparation belongs off the animation thread. A
// single prioritized worker keeps ahead of the camera without unbounded work.
import {wildHomesteadSource} from './wild-homestead-layout.mjs';
const JOB_TIMEOUT=15000;
const COLD_WORKER_TIMEOUT=30000;
export const RAILWAY_READY_BUDGET=128*1024*1024;

function readyBytes(value){
 const image=value.ground||value;
 return (image.width||0)*(image.height||0)*4+(value.data?.byteLength||0);
}
function trimReadyAssets(stream,keep){
 if(stream.readyBytes<=RAILWAY_READY_BUDGET)return;
 for(const [key,value] of stream.ready){
  if(key===keep||stream.pinned.has(key)||stream.baseline.has(key))continue;
  const bytes=readyBytes(value);
  if(!bytes)continue;
  (value.ground||value).close?.();
  stream.ready.delete(key);
  stream.readyBytes-=bytes;
  if(stream.readyBytes<=RAILWAY_READY_BUDGET)break;
 }
}

export function railwayRegionInterior(cx,cy){
 return {left:cx*1600+220,top:cy*1600+220,right:(cx+1)*1600-221,bottom:(cy+1)*1600-221};
}

function disableRailwayStream(t){
 stopRailwayStream(t);
 t.streamDisabled=true;
}

export function railwayStream(t){
 if(t.streamDisabled||typeof Worker==='undefined'){delete t.preparing;return null;}
 const previous=t.terrainStream;
 if(previous?.design===t.design){
  if(!previous.failed)return previous;
  disableRailwayStream(t);return null;
 }
 if(previous)stopRailwayStream(t);
 let worker;
 try{worker=new Worker(new URL('./railway-stream-worker.mjs',import.meta.url),{type:'module'});}
 catch(error){console.warn('Railway terrain worker unavailable:',error.message);disableRailwayStream(t);return null;}
 const s={design:t.design,queue:new Map(),ready:new Map(),busy:false,errors:[],serial:0,readyBytes:0,pinned:new Set(),baseline:new Set(),baseGrass:new Map(),generation:0};
 s.worker=worker;
 s.request=(kind,key,args={},priority=0)=>{
  if(s.ready.has(key)){
   const value=s.ready.get(key);
   s.ready.delete(key);s.ready.set(key,value);
   return value;
  }
  const previous=s.queue.get(key);
  if(previous){
   previous.priority=Math.max(priority,previous.priority);
   previous.seen=performance.now();
   if(!args.prefetch&&previous.args.prefetch)previous.args.prefetch=false;
  }else if(s.active!==key){
   if(args.family)for(const [id,job] of s.queue)if(job.args.family===args.family)s.queue.delete(id);
   s.queue.set(key,{kind,key,args,priority,serial:s.serial++,seen:performance.now()});
  }
  if(!s.planning)s.pump();
  return null;
 };
 s.pump=()=>{
  if(s.busy||s.failed||!s.queue.size)return;
  const now=performance.now();
  let next;
  for(const [key,job]of s.queue){
   if(now-job.seen>800&&job.priority<200&&!s.baseline.has(key)){s.queue.delete(key);continue;}
   if(!next||job.priority>next.priority||job.priority===next.priority&&job.serial<next.serial)next=job;
  }
  if(!next)return;
  s.queue.delete(next.key);s.active=next.key;s.activeAt=now;s.busy=true;worker.postMessage(next);
 };
 worker.onmessage=({data})=>{
  s.hasWorkerReply=true;s.busy=false;s.active=null;
  if(data.error){
   s.errors.push(data.error);console.error('Railway terrain worker:',data.error);s.failed=true;
   return;
  }
  for(const item of data.baseGrass||[]){
   s.baseGrass.delete(item.key);s.baseGrass.set(item.key,item.data);
   if(s.baseGrass.size>256)s.baseGrass.delete(s.baseGrass.keys().next().value);
  }
  if(data.railField)t.meadowRailField=data.railField;
  if(data.worlds?.length){
   s.generation++;t.wildNativeWorlds??=new Map();
   for(const [key,value] of data.worlds)if(!t.wildNativeWorlds.has(key))t.wildNativeWorlds.set(key,value);
  }
  if(data.forest?.length){
   t.forestChunks??=new Map();
   for(const [key,value] of data.forest)if(!t.forestChunks.has(key))t.forestChunks.set(key,value);
  }
  const previous=s.ready.get(data.key),value=data.value||data.bitmap||true;
  if(previous&&previous!==value){
   s.readyBytes-=readyBytes(previous);
   (previous.ground||previous).close?.();
   s.ready.delete(data.key);
  }
  s.ready.set(data.key,value);
  if(previous!==value)s.readyBytes+=readyBytes(value);
  trimReadyAssets(s,data.key);
  s.pump();
 };
 worker.onerror=e=>{s.errors.push(e.message);s.failed=true;s.busy=false;console.error('Railway terrain worker:',e.message);};
 const home=wildHomesteadSource(t.design);
 t.preparing=true;worker.postMessage({kind:'init',design:home?{...t.design,wildHomesteadSource:home}:t.design});t.terrainStream=s;return s;
}
export function stopRailwayStream(t){
 const stream=t?.terrainStream;
 if(stream){clearTimeout(stream.localStartupTimer);stream.worker.terminate();for(const v of stream.ready.values())(v.ground||v)?.close?.();}
 if(t){delete t.terrainStream;delete t.preparing;}
}
export function railwayStarting(t,groundReady,now=performance.now()){
 const stream=t.terrainStream;
 if(!t.preparing||!stream)return false;
 stream.startupAt??=now;
 if(stream.failed||now-stream.startupAt>JOB_TIMEOUT){
  // The synchronous renderer can supply the same terrain and collision data.
  disableRailwayStream(t);return false;
 }
 const collisionReady=[...(stream.views?.values()||[])].every(plan=>
  [...(plan.startupRegions||[])].every(key=>stream.ready.has(key)));
 if(groundReady&&collisionReady){
  t.preparing=false;stream.startedAt=now;return false;
 }
 return true;
}
function regionRequest(t,s,x,y,priority,wanted){
 const cx=Math.floor(x/1600),cy=Math.floor(y/1600),room=t.design.activeRoom||null;
 const key=`region:${room||'surface'}:${cx}:${cy}`;
 if(wanted)wanted.add(key);
 s.request('region',key,{cx,cy,room,prefetch:!!wanted},priority);
 return key;
}
export function streamRegion(t,x,y,priority=10){
 const s=railwayStream(t);
 return !s||s.ready.has(regionRequest(t,s,x,y,priority));
}
export function streamImage(t,kind,key,args,priority=5){return railwayStream(t)?.request(kind,key,{...args,room:t.design.activeRoom||null},priority);}

function primeWildLandsStart(t,s){
 if(!t.design.wildLands||typeof window==='undefined'||s.localStartupPending)return;
 s.localStartupAttempted??=new Set();
 const pending=[...s.views.values()].flatMap(plan=>[...(plan.startupRegions||[])]);
 const key=pending.find(region=>!s.ready.has(region)&&!s.localStartupAttempted.has(region));
 if(!key)return;
 s.localStartupAttempted.add(key);
 s.localStartupPending=true;
 // Give the streamed view time to display its backdrop, then prepare only the
 // party's collision region with the module graph already loaded by the game.
 s.localStartupTimer=setTimeout(async()=>{
  try{
   const {nativeWildProps}=await import('./wild-native-biomes.mjs');
   const [,room,x,y]=key.split(':');
   if(t.terrainStream!==s||!t.preparing||s.ready.has(key)||room!==(t.design.activeRoom||'surface'))return;
   const local={
    design:t.design,route:t.route,otherRoutes:t.otherRoutes,viewZoom:1,streamDisabled:true,
    wildNativeWorlds:t.wildNativeWorlds??=new Map(),nativeKinds:t.nativeKinds??=new Map(),
   };
   nativeWildProps(local,railwayRegionInterior(Number(x),Number(y)));
   s.ready.set(key,true);
  }catch(error){console.warn('Local railway startup:',error.message);}
  finally{s.localStartupPending=false;}
 },24);
}

function warmBaseline(t,s,now){
 if(!t.design.wildLands||t.design.activeRoom||now-s.startedAt<750)return;
 const columns=Math.ceil(t.design.width/2048),rows=Math.ceil(t.design.height/2048);
 if(!s.baseline.size)for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)s.baseline.add(`floor:surface:2048:${x}:${y}`);
 let pending=Number(s.baseline.has(s.active));
 for(const key of s.queue.keys())if(s.baseline.has(key))pending++;
 // Baseline work fills spare capacity instead of posting forty jobs on entry.
 for(const key of s.baseline){
  if(pending>=2)break;
  if(s.ready.has(key)||s.queue.has(key)||s.active===key)continue;
  const [, , , x, y]=key.split(':');
  s.request('floor',key,{x:x*2048,y:y*2048,span:2048,far:true,room:null,seed:t.grassSeed||42},40);
  pending++;
 }
}

export function prepareRailwayView(t,bounds,players=[],viewId='shared'){
 const s=railwayStream(t);if(!s)return;const now=performance.now();s.views??=new Map();
 // Local collision can make The Wild Lands playable while the new Worker is
 // still loading its own module graph. Regular jobs keep the shorter deadline.
 const timeout=t.design.wildLands&&!t.preparing&&!s.hasWorkerReply?COLD_WORKER_TIMEOUT:JOB_TIMEOUT;
 if(s.busy&&now-s.activeAt>timeout){disableRailwayStream(t);return;}
 const room=t.design.activeRoom||null;
 if(room!==s.viewRoom){
  s.viewRoom=room;s.views.clear();s.pinned.clear();
  for(const [key,job] of s.queue)if((job.args.room||null)!==room)s.queue.delete(key);
 }
 for(const [id,view]of s.views)if(now-view.seen>1000)s.views.delete(id);
 let plan=s.views.get(viewId);if(!plan){plan={seen:now,pinned:new Set(),wanted:new Set()};s.views.set(viewId,plan);}plan.seen=now;
 if(t.preparing){
  plan.startupRegions=new Set(players.map(p=>regionRequest(t,s,p.x,p.y,220)));
  s.prepareNearPoses=false;
  primeWildLandsStart(t,s);
  return;
 }
 const last=plan.lastView,dt=last?Math.max(.016,(now-last.time)/1000):.016;
 const cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2,width=bounds.right-bounds.left,height=bounds.bottom-bounds.top,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const vx=last?(last.vx||0)*.7+clamp((cx-last.x)/dt,-800,800)*.3:0,vy=last?(last.vy||0)*.7+clamp((cy-last.y)/dt,-800,800)*.3:0,widthRate=last?(width-last.width)/dt:0;
 s.lastView=plan.lastView={x:cx,y:cy,width,vx,vy,time:now};
 if(plan.nextPlan>now)return;plan.nextPlan=now+150;plan.pinned.clear();
 const far=(t.viewZoom||1)<.3,margin=far?2048:900,lookX=vx*3,lookY=vy*3;
 const area={left:Math.max(0,bounds.left-margin+Math.min(0,lookX)),right:Math.min(t.design.width,bounds.right+margin+Math.max(0,lookX)),top:Math.max(0,bounds.top-margin+Math.min(0,lookY)),bottom:Math.min(t.design.height,bounds.bottom+margin+Math.max(0,lookY))};
 s.prepareNearPoses=far&&(t.viewZoom||1)>.2&&widthRate< -30;
 const wanted=plan.wanted=new Set();
 const inView=(x,y,size)=>x<bounds.right&&x+size>bounds.left&&y<bounds.bottom&&y+size>bounds.top;
 const includes=(x,y,size,px,py)=>px>=x&&py>=y&&px<x+size&&py<y+size;
 function floor(size,isFar,forecast,priority,visiblePriority=priority){
  for(let row=Math.floor(forecast.top/size);row<=Math.floor((forecast.bottom-.1)/size);row++){
   for(let col=Math.floor(forecast.left/size);col<=Math.floor((forecast.right-.1)/size);col++){
    const x=col*size,y=row*size,visible=inView(x,y,size);
    const focus=visible&&visiblePriority>priority&&
      (includes(x,y,size,cx,cy)||players.some(p=>includes(x,y,size,p.x,p.y)));
    const tilePriority=visible&&visiblePriority>priority?(focus?visiblePriority:visiblePriority-10):priority;
    const key=`floor:${room||'surface'}:${size}:${col}:${row}`;
    wanted.add(key);
    if(visible)plan.pinned.add(key);
    s.request('floor',key,{x,y,span:size,far:isFar,seed:t.grassSeed||42,room,prefetch:true},tilePriority);
    if(!isFar&&!room){
     const waterKey=`water:surface:${x}:${y}`;
     wanted.add(waterKey);
     s.request('water',waterKey,{x,y,room:null,prefetch:true},visible&&visiblePriority>priority?175:95);
    }
   }
  }
 }
 s.planning=true;
 try{
  // Publish the entire view before choosing the next job. Current collision
  // and visible floor then win even if the worker was idle mid-plan.
  for(const p of players)regionRequest(t,s,p.x,p.y,220,wanted);
  for(const p of players)for(const dy of [-1600,0,1600])for(const dx of [-1600,0,1600]){
   const x=p.x+dx,y=p.y+dy;
   if((dx||dy)&&x>=0&&y>=0&&x<t.design.width&&y<t.design.height)regionRequest(t,s,x,y,130,wanted);
  }
  for(let row=Math.floor(area.top/1600);row<=Math.floor((area.bottom-.1)/1600);row++){
   for(let col=Math.floor(area.left/1600);col<=Math.floor((area.right-.1)/1600);col++){
    const x=col*1600,y=row*1600;
    regionRequest(t,s,x+800,y+800,inView(x,y,1600)?185:120,wanted);
   }
  }
  if(t.design.wildLands){
   floor(far?2048:512,far,area,105,190);
   if(s.prepareNearPoses){
    const nearArea={left:Math.max(0,cx-3600+Math.min(0,lookX)),right:Math.min(t.design.width,cx+3600+Math.max(0,lookX)),top:Math.max(0,cy-2400+Math.min(0,lookY)),bottom:Math.min(t.design.height,cy+2400+Math.max(0,lookY))};
    s.nearForecast=nearArea;floor(512,false,nearArea,115);
   }
   if(!far&&widthRate>2000)floor(2048,true,{left:0,top:0,right:t.design.width,bottom:t.design.height},100);
  }else{
   for(let row=Math.max(0,Math.floor(bounds.top/1600));row<=Math.min(Math.ceil(t.design.height/1600)-1,Math.floor(bounds.bottom/1600));row++){
    for(let col=Math.max(0,Math.floor(bounds.left/1600));col<=Math.min(Math.ceil(t.design.width/1600)-1,Math.floor(bounds.right/1600));col++){
     const key=`forest:${col}:${row}:800`;
     plan.pinned.add(key);wanted.add(key);
     s.request('forest',key,{x:col*1600,y:row*1600,span:1600,size:800,room,prefetch:true},180);
    }
   }
  }
  warmBaseline(t,s,now);
  // Retain every viewport's work without requesting the space between them.
  s.pinned.clear();
  const allWanted=new Set();
  for(const view of s.views.values()){
   for(const key of view.pinned)s.pinned.add(key);
   for(const key of view.wanted)allWanted.add(key);
  }
  for(const [key,job] of s.queue)if(job.args.prefetch&&!allWanted.has(key))s.queue.delete(key);
  trimReadyAssets(s);
 }finally{
  s.planning=false;s.pump();
 }
 s.forecast=area;
}
