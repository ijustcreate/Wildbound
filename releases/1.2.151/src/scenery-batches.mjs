// Batch distant scenery in depth order. Every live subject and any tree whose
// opacity depends on a nearby actor ends a run, preserving native occlusion.
const LIMIT=28*1024*1024,BAND=256;
const overlaps=(a,b)=>a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top;
function footprint(o){if(o.tree){const p=o.tree,size=p.size||90;return {left:p.x-Math.max(70,size*.85),right:p.x+Math.max(70,size*.85),top:p.y-Math.max(100,size*1.8,p.height||0),bottom:p.y+Math.max(40,size*.65,p.depth||0)};}const a=o.player||o.enemy||o.subject||o.car||o.owl||o.frog||o,rx=o.car?(a.length||320)+60:o.subject?220:85,above=o.car?240:o.subject?300:140,y=a.y-(a.jumpHeight||a.groundHeight||0);return {left:a.x-rx,right:a.x+rx,top:y-above,bottom:y+80};}
export function sceneryBatches(renderer,g,t,objects,paint){
 if(!renderer.splitChild||renderer.camera.zoom>.85||t.design.activeRoom||objects.some(o=>o.wildBuildingAsset))return objects;
 if(t.sceneryBatchStats?.frame!==renderer.frameSerial)t.sceneryBatchStats={frame:renderer.frameSerial,builds:0,hits:0,live:0};const metrics=t.sceneryBatchStats;
 const moving=objects.filter(o=>!o.tree).map(footprint),runs=[];let list=[],band=null;
 const flush=()=>{if(list.length)runs.push(list);list=[];};
 for(const o of objects){const p=o.tree,b=Math.floor(o.depth/BAND),live=!p||p.falling||p.burning||Number.isFinite(p.bushBurnAt)||p.harvest||p.depleted||p.kind==='bush'&&renderer.camera.zoom>=.55||['campfire','torch','grave_candles','spirit_lamp'].includes(p.kind)||moving.some(a=>overlaps(a,footprint(o)));
  if(live){flush();runs.push(o);band=null;}else{if(band!==b)flush();band=b;list.push(o);}
 }flush();t.sceneryBands??=new Map();t.sceneryBandBytes??=0;const output=[];
 for(const run of runs){if(!Array.isArray(run)){output.push(run);continue;}if(run.length<3){metrics.live+=run.length;output.push(...run);continue;}
  const key=run.map(o=>{const p=o.tree;return [p.id,p.kind,p.x,p.y,p.rootY,p.size,p.width,p.height,p.seed,p.variant,p.treeType,p.season,p.leafHabit,p.fallen,p.autumnAccent,p.grassTint,p.grassShade,p.cut,p.charred,p.grassBurnRevision||0,g.spriteLibrary?.[p.kind]?.revision||0].join(',');}).join(';');let entry=t.sceneryBands.get(key);
  if(!entry){metrics.builds++;const bounds=run.map(footprint),left=Math.floor(Math.min(...bounds.map(b=>b.left))),top=Math.floor(Math.min(...bounds.map(b=>b.top))),right=Math.ceil(Math.max(...bounds.map(b=>b.right))),bottom=Math.ceil(Math.max(...bounds.map(b=>b.bottom))),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil((right-left)/2));canvas.height=Math.max(1,Math.ceil((bottom-top)/2));entry={canvas,left,top,w:right-left,h:bottom-top,bytes:canvas.width*canvas.height*4,ready:false,members:run.map(o=>o.tree.id)};
   while(t.sceneryBands.size&&(t.sceneryBandBytes+entry.bytes>LIMIT||t.sceneryBands.size>=256)){const [id,old]=t.sceneryBands.entries().next().value;t.sceneryBandBytes-=old.bytes;t.sceneryBands.delete(id);}t.sceneryBands.set(key,entry);t.sceneryBandBytes+=entry.bytes;
  }
  else metrics.hits++;
  if(!entry.ready||entry.pending&&performance.now()>(entry.retryAt||0)){const c=entry.canvas.getContext('2d'),before=t.streamCoverage?.propPending||0;c.resetTransform();c.clearRect(0,0,entry.canvas.width,entry.canvas.height);c.setTransform(.5,0,0,.5,-entry.left*.5,-entry.top*.5);c.imageSmoothingEnabled=false;for(const o of run)paint(c,o.tree);entry.pending=(t.streamCoverage?.propPending||0)>before;entry.retryAt=entry.pending?performance.now()+90:0;entry.ready=true;}
  t.sceneryBands.delete(key);t.sceneryBands.set(key,entry);output.push({sceneryBatch:entry,depth:run[0].depth});
 }
 return output;
}
export function drawSceneryBatch(c,entry){c.drawImage(entry.canvas,entry.left,entry.top,entry.w,entry.h);}
