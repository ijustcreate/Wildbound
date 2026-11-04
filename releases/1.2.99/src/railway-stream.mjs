// Native ground and scenery preparation belongs off the animation thread. A
// single prioritized worker keeps ahead of the camera without unbounded work.
export function railwayStream(t){
 if(t.streamDisabled||typeof Worker==='undefined')return null;
 if(t.terrainStream?.design===t.design)return t.terrainStream;
 t.terrainStream?.worker.terminate();
 const s={design:t.design,queue:new Map(),ready:new Map(),busy:false,errors:[],serial:0,pixels:0};
 const worker=s.worker=new Worker(new URL('./railway-stream-worker.mjs',import.meta.url),{type:'module'});
 s.request=(kind,key,args={},priority=0)=>{if(s.ready.has(key))return (()=>{const v=s.ready.get(key);s.ready.delete(key);s.ready.set(key,v);return v;})();if(!s.queue.has(key)&&s.active!==key){if(args.family)for(const [id,job]of s.queue)if(job.args.family===args.family)s.queue.delete(id);s.queue.set(key,{kind,key,args,priority,serial:s.serial++});}s.pump();return null;};
 s.pump=()=>{if(s.busy||!s.queue.size)return;const job=[...s.queue.values()].sort((a,b)=>b.priority-a.priority||a.serial-b.serial)[0];s.queue.delete(job.key);s.active=job.key;s.busy=true;worker.postMessage(job);};
 worker.onmessage=({data})=>{s.busy=false;s.active=null;if(data.error){s.errors.push(data.error);console.error('Railway terrain worker:',data.error);s.failed=true;}else{if(data.worlds){t.wildNativeWorlds??=new Map();for(const [key,value]of data.worlds)if(!t.wildNativeWorlds.has(key))t.wildNativeWorlds.set(key,value);}if(data.forest){t.forestChunks??=new Map();for(const [key,value]of data.forest)if(!t.forestChunks.has(key))t.forestChunks.set(key,value);}const value=data.value||data.bitmap||true,image=value.ground||value;s.ready.set(data.key,value);s.pixels+=(image.width||0)*(image.height||0);while(s.pixels>32*1024*1024){const entry=[...s.ready].find(([key,v])=>key!==data.key&&(v.ground||v)?.close);if(!entry)break;const [key,v]=entry,pic=v.ground||v;s.pixels-=pic.width*pic.height;pic.close();s.ready.delete(key);}}s.pump();};
 worker.onerror=e=>{s.errors.push(e.message);s.failed=true;s.busy=false;console.error('Railway terrain worker:',e.message);};
 t.preparing=true;worker.postMessage({kind:'init',design:t.design});t.terrainStream=s;return s;
}
export function stopRailwayStream(t){t?.terrainStream?.worker.terminate();for(const v of t?.terrainStream?.ready.values()||[])(v.ground||v)?.close?.();if(t){delete t.terrainStream;delete t.preparing;}}
export function streamRegion(t,x,y,priority=10){const s=railwayStream(t);if(!s)return true;const cx=Math.floor(x/1600),cy=Math.floor(y/1600),key=`region:${t.design.activeRoom||'surface'}:${cx}:${cy}`;return !!s.request('region',key,{cx,cy,room:t.design.activeRoom||null},priority);}
export function streamImage(t,kind,key,args,priority=5){return railwayStream(t)?.request(kind,key,{...args,room:t.design.activeRoom||null},priority);}
export function prepareRailwayView(t,bounds,players=[]){const s=railwayStream(t);if(!s)return;
 for(const p of players){streamRegion(t,p.x,p.y,100);const radius=1700;for(let dy=-radius;dy<=radius;dy+=radius)for(let dx=-radius;dx<=radius;dx+=radius){const x=p.x+dx,y=p.y+dy;if(x>=0&&y>=0&&x<t.design.width&&y<t.design.height)streamRegion(t,x,y,80);}}
 for(const p of players)for(let cy=Math.max(0,Math.floor((p.y-1300)/512));cy<=Math.min(Math.ceil(t.design.height/512)-1,Math.floor((p.y+1300)/512));cy++)for(let cx=Math.max(0,Math.floor((p.x-1300)/512));cx<=Math.min(Math.ceil(t.design.width/512)-1,Math.floor((p.x+1300)/512));cx++){if(t.design.wildLands)s.request('floor',`floor:${t.design.activeRoom||'surface'}:512:${cx}:${cy}`,{x:cx*512,y:cy*512,span:512,far:false,room:t.design.activeRoom||null},5);}
 for(let cy=Math.max(0,Math.floor(bounds.top/1600));cy<=Math.min(Math.ceil(t.design.height/1600)-1,Math.floor(bounds.bottom/1600));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/1600));cx<=Math.min(Math.ceil(t.design.width/1600)-1,Math.floor(bounds.right/1600));cx++)streamRegion(t,cx*1600+800,cy*1600+800,50);
}
