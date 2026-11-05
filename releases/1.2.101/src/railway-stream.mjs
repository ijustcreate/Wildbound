// Native ground and scenery preparation belongs off the animation thread. A
// single prioritized worker keeps ahead of the camera without unbounded work.
export function railwayStream(t){
 if(t.streamDisabled||typeof Worker==='undefined')return null;
 if(t.terrainStream?.design===t.design)return t.terrainStream;
 t.terrainStream?.worker.terminate();
 const s={design:t.design,queue:new Map(),ready:new Map(),busy:false,errors:[],serial:0,pixels:0,pinned:new Set(),baseline:new Set(),baseGrass:new Map(),generation:0};
 const worker=s.worker=new Worker(new URL('./railway-stream-worker.mjs',import.meta.url),{type:'module'});
 s.request=(kind,key,args={},priority=0)=>{if(s.ready.has(key))return (()=>{const v=s.ready.get(key);s.ready.delete(key);s.ready.set(key,v);return v;})();if(s.queue.has(key)){s.queue.get(key).priority=Math.max(priority,s.queue.get(key).priority);s.queue.get(key).seen=performance.now();}if(!s.queue.has(key)&&s.active!==key){if(args.family)for(const [id,job]of s.queue)if(job.args.family===args.family)s.queue.delete(id);s.queue.set(key,{kind,key,args,priority,serial:s.serial++,seen:performance.now()});}s.pump();return null;};
 s.pump=()=>{if(s.busy||!s.queue.size)return;const now=performance.now();for(const [key,job]of s.queue)if(now-job.seen>800&&job.priority<200&&!s.baseline.has(key))s.queue.delete(key);if(!s.queue.size)return;const job=[...s.queue.values()].sort((a,b)=>b.priority-a.priority||a.serial-b.serial)[0];s.queue.delete(job.key);s.active=job.key;s.busy=true;worker.postMessage(job);};
 worker.onmessage=({data})=>{s.busy=false;s.active=null;if(data.error){s.errors.push(data.error);console.error('Railway terrain worker:',data.error);s.failed=true;}else{if(data.baseGrass)for(const item of data.baseGrass){s.baseGrass.delete(item.key);s.baseGrass.set(item.key,item.data);while(s.baseGrass.size>256)s.baseGrass.delete(s.baseGrass.keys().next().value);}if(data.railField)t.meadowRailField=data.railField;if(data.worlds?.length)s.generation++;if(data.worlds){t.wildNativeWorlds??=new Map();for(const [key,value]of data.worlds)if(!t.wildNativeWorlds.has(key))t.wildNativeWorlds.set(key,value);}if(data.forest){t.forestChunks??=new Map();for(const [key,value]of data.forest)if(!t.forestChunks.has(key))t.forestChunks.set(key,value);}const value=data.value||data.bitmap||true,image=value.ground||value;s.ready.set(data.key,value);s.pixels+=(image.width||0)*(image.height||0);while(s.pixels>32*1024*1024){const entry=[...s.ready].find(([key,v])=>key!==data.key&&!s.pinned.has(key)&&!s.baseline.has(key)&&(v.ground||v)?.close);if(!entry)break;const [key,v]=entry,pic=v.ground||v;s.pixels-=pic.width*pic.height;pic.close();s.ready.delete(key);}}s.pump();};
 worker.onerror=e=>{s.errors.push(e.message);s.failed=true;s.busy=false;console.error('Railway terrain worker:',e.message);};
 t.preparing=true;worker.postMessage({kind:'init',design:t.design});t.terrainStream=s;return s;
}
export function stopRailwayStream(t){t?.terrainStream?.worker.terminate();for(const v of t?.terrainStream?.ready.values()||[])(v.ground||v)?.close?.();if(t){delete t.terrainStream;delete t.preparing;}}
export function streamRegion(t,x,y,priority=10){const s=railwayStream(t);if(!s)return true;const cx=Math.floor(x/1600),cy=Math.floor(y/1600),key=`region:${t.design.activeRoom||'surface'}:${cx}:${cy}`;return !!s.request('region',key,{cx,cy,room:t.design.activeRoom||null},priority);}
export function streamImage(t,kind,key,args,priority=5){return railwayStream(t)?.request(kind,key,{...args,room:t.design.activeRoom||null},priority);}
export function prepareRailwayView(t,bounds,players=[]){
 const s=railwayStream(t);if(!s)return;const now=performance.now(),last=s.lastView,dt=last?Math.max(.016,(now-last.time)/1000):.016;
 const cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2,width=bounds.right-bounds.left,height=bounds.bottom-bounds.top,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const vx=last?(last.vx||0)*.7+clamp((cx-last.x)/dt,-800,800)*.3:0,vy=last?(last.vy||0)*.7+clamp((cy-last.y)/dt,-800,800)*.3:0,expanding=last?Math.max(0,(width-last.width)/dt):0;
 s.lastView={x:cx,y:cy,width,vx,vy,time:now};
 if(s.nextPlan>now)return;s.nextPlan=now+150;s.pinned.clear();
 const far=(t.viewZoom||1)<.3,margin=far?2048:900,lookX=vx*3,lookY=vy*3;
 const area={left:Math.max(0,bounds.left-margin+Math.min(0,lookX)),right:Math.min(t.design.width,bounds.right+margin+Math.max(0,lookX)),top:Math.max(0,bounds.top-margin+Math.min(0,lookY)),bottom:Math.min(t.design.height,bounds.bottom+margin+Math.max(0,lookY))};
 for(const p of players){streamRegion(t,p.x,p.y,220);for(const dy of [-1600,0,1600])for(const dx of [-1600,0,1600])if(p.x+dx>=0&&p.y+dy>=0&&p.x+dx<t.design.width&&p.y+dy<t.design.height)streamRegion(t,p.x+dx,p.y+dy,130);}
 for(let y=Math.floor(area.top/1600);y<=Math.floor((area.bottom-.1)/1600);y++)for(let x=Math.floor(area.left/1600);x<=Math.floor((area.right-.1)/1600);x++)streamRegion(t,x*1600+800,y*1600+800,120);
 if(t.design.wildLands&&!t.design.activeRoom)for(let y=0;y<Math.ceil(t.design.height/2048);y++)for(let x=0;x<Math.ceil(t.design.width/2048);x++){
  const key=`floor:surface:2048:${x}:${y}`;s.baseline.add(key);s.request('floor',key,{x:x*2048,y:y*2048,span:2048,far:true,room:null,seed:t.grassSeed||42},100);
 }
 s.prepareNearPoses=far&&(t.viewZoom||1)>.2&&expanding< -30;const wanted=new Set(),floor=(size,far,area,priority)=>{for(let y=Math.floor(area.top/size);y<=Math.floor((area.bottom-.1)/size);y++)for(let x=Math.floor(area.left/size);x<=Math.floor((area.right-.1)/size);x++){
  const key=`floor:${t.design.activeRoom||'surface'}:${size}:${x}:${y}`;wanted.add(key);s.pinned.add(key);if(!far&&!t.design.activeRoom){const waterKey=`water:surface:${x*size}:${y*size}`;wanted.add(waterKey);s.request('water',waterKey,{x:x*size,y:y*size,room:null,prefetch:true},110);}s.request('floor',key,{x:x*size,y:y*size,span:size,far,seed:t.grassSeed||42,room:t.design.activeRoom||null,prefetch:true},priority);
 }};
 if(t.design.wildLands){floor(far?2048:512,far,area,105);if(s.prepareNearPoses){const nearArea={left:Math.max(0,cx-3600+Math.min(0,lookX)),right:Math.min(t.design.width,cx+3600+Math.max(0,lookX)),top:Math.max(0,cy-2400+Math.min(0,lookY)),bottom:Math.min(t.design.height,cy+2400+Math.max(0,lookY))};s.nearForecast=nearArea;floor(512,false,nearArea,115);}if(!far&&expanding>2000)floor(2048,true,{left:0,top:0,right:t.design.width,bottom:t.design.height},100);}
 for(const [key,job]of s.queue)if(job.args.prefetch&&!wanted.has(key))s.queue.delete(key);
 s.forecast=area;
}
