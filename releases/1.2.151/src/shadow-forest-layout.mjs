import {dressShadowThickets} from './shadow-thickets.mjs';
// Purposeful, additive forest dressing; no changes to saved terrain or authored props.
export const SHADOW_FOREST_PROPS=Object.freeze({
 mooncap_cluster:{size:38,scale:'small'},witch_fern:{size:44,scale:'small'},star_shards:{size:34,scale:'small'},wisp_lantern:{size:46,scale:'small'},
 moonwell:{size:104,scale:'medium'},thorn_shrine:{size:122,scale:'medium'},hollow_stump:{size:100,scale:'medium'},
});
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const distance=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);};
export function shadowPathDistance(state,x,y){return Math.min(Infinity,...(state.links||[]).map(([a,b])=>distance(x,y,state.chambers[a],state.chambers[b])),...(state.enchantedPaths||[]).map(([a,b])=>distance(x,y,a,b)));}
export function translateShadowForestState(s,ox,oy){
 for(const p of s.enchantedPOIs||[]){p.x+=ox;p.y+=oy;}
 for(const line of s.enchantedPaths||[])for(const p of line){p.x+=ox;p.y+=oy;}
 if(s.enchantedExit){s.enchantedExit.x+=ox;s.enchantedExit.y+=oy;}return s;
}
export function addShadowPools(terrain,chambers,links,seed){
 const made=[];for(const roomIndex of [1,4,6]){
  const room=chambers[roomIndex];
  for(let n=0;n<40;n++){
   const a=n*2.39996+hash(seed,roomIndex)*6.28,x=room.x+Math.cos(a)*room.r*.67,y=room.y+Math.sin(a)*room.r*.55;
   if(Math.min(...links.map(([i,j])=>distance(x,y,chambers[i],chambers[j])))<105)continue;
   const cells=[];for(let ty=Math.floor((y-50)/32);ty<=Math.floor((y+50)/32);ty++)for(let tx=Math.floor((x-70)/32);tx<=Math.floor((x+70)/32);tx++){const q=((tx*32+16-x)/70)**2+((ty*32+16-y)/48)**2;if(q<1)cells.push({id:ty*50+tx,q});}
   if(cells.length<5||cells.some(c=>terrain[c.id]!=='shadow_soil'))continue;
   for(const c of cells)terrain[c.id]=c.q<.4?'water':'shallow';made.push({x,y});break;
  }
 }return made;
}
export function dressShadowForest(g,terrainAt=null){
 const s=g.realmState;if(!s||s.env!=='shadow'||s.underworldAuthored)return 0;
 if(s.enchantedForestVersion===1)return dressShadowThickets(g,terrainAt,shadowPathDistance);
 const ox=s.originX||0,oy=s.originY||0,seed=s.seed||g.seed||0,props=g.scenery,start=props.length;
 const tile=(x,y)=>terrainAt?terrainAt(Math.floor(x/32),Math.floor(y/32)):g.terrain?.[Math.floor((y-oy)/32)*50+Math.floor((x-ox)/32)];
 const local=props.filter(p=>p.x>=ox&&p.x<ox+1600&&(p.rootY??p.y)>=oy&&(p.rootY??p.y)<oy+1600),cap=Math.min(238,(s.settings?.propDensity||100)+106);
 const add=(kind,x,y,rule,extra={})=>{
  const def=SHADOW_FOREST_PROPS[kind],size=def?.size||150;
  if(local.length>=cap||tile(x,y)!=='shadow_soil'||Math.hypot(x-ox-800,y-oy-816)<220)return null;
  if(local.some(p=>Math.hypot(p.x-x,(p.rootY??p.y)-y)<(def?.scale==='medium'?57:18)))return null;
  const p={id:`enchanted:${ox}:${oy}:${local.length}`,kind,x,y:y-size*.19,rootY:y,size,procedural:true,realm:true,underworldDressing:true,enchantedRule:rule,collisionWidth:0,collisionDepth:0,...extra};props.push(p);local.push(p);return p;
 };
 s.enchantedPOIs=[];s.enchantedPaths=[];
 for(const [i,kind,name]of [[3,'moonwell','The Mirrorwater Glade'],[5,'thorn_shrine','The Wayfarer Shrine'],[1,'hollow_stump','The Whispering Grove']]){
  const room=s.chambers?.[i];if(!room)continue;
  let anchor=null,branchStart=null;
  const starts=(s.links||[]).flatMap(([a,b])=>Array.from({length:25},(_,j)=>({x:s.chambers[a].x+(s.chambers[b].x-s.chambers[a].x)*j/24,y:s.chambers[a].y+(s.chambers[b].y-s.chambers[a].y)*j/24}))).filter(p=>tile(p.x,p.y)==='shadow_soil');
  for(let n=0;n<300;n++){const a=n*2.39996+hash(seed,i)*6.28,r=room.r*(.32+(n%8)*.09),x=room.x+Math.cos(a)*r,y=room.y+Math.sin(a)*r;
   if(tile(x,y)!=='shadow_soil'||shadowPathDistance(s,x,y)<45||local.some(p=>Math.hypot(p.x-x,(p.rootY??p.y)-y)<59))continue;
   branchStart=starts.filter(p=>Math.hypot(p.x-x,p.y-y)<room.r*1.6).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).find(p=>Array.from({length:17},(_,j)=>tile(p.x+(x-p.x)*j/16,p.y+(y-p.y)*j/16)).every(k=>k==='shadow_soil'));
   if(!branchStart)continue;anchor={x,y};break;}
  if(!anchor)continue;const p=add(kind,anchor.x,anchor.y,'poi-anchor');if(!p)continue;
  s.enchantedPOIs.push({id:kind,name,x:p.x,y:p.rootY,radius:95});s.enchantedPaths.push([branchStart,{x:p.x,y:p.rootY}]);
  for(const [side,j]of [[-1,0],[1,1]]){add('wisp_lantern',p.x+side*48,p.rootY+44,'poi-entrance');add(kind==='moonwell'?'witch_fern':kind==='hollow_stump'?'mooncap_cluster':'star_shards',p.x+side*45,p.rootY+8,'poi-edge');}
 }
 // Far-bank trees are deliberately placed to cast recognizable canopy reflections.
 for(let n=0,placed=0;n<32&&placed<2;n++){
  const a=3.45+n/31*2.4,x=ox+1240+Math.cos(a)*124,y=oy+440+Math.sin(a)*103;
  if(tile(x,y)!=='shadow_soil'||shadowPathDistance(s,x,y)<45||local.some(p=>Math.hypot(p.x-x,(p.rootY??p.y)-y)<52))continue;
  if(add('wither_tree',x,y,'mirror-bank-canopy',{size:150,collisionWidth:12,collisionDepth:10,surfaceHeight:999}))placed++;
 }
 // Canopy groups frame the outer glades and keep the near water banks open.
 for(let n=0,trees=0;n<350&&trees<15;n++){
  const room=s.chambers?.[1+n%7];if(!room)continue;const a=n*2.39996+hash(seed,411)*6.28,x=room.x+Math.cos(a)*room.r*.78,y=room.y+Math.sin(a)*room.r*.68;
  if(tile(x,y)!=='shadow_soil'||shadowPathDistance(s,x,y)<65||local.some(p=>Math.hypot(p.x-x,(p.rootY??p.y)-y)<76)||[-48,0,48].some(dx=>[-40,-80,-120].some(dy=>['water','shallow'].includes(tile(x+dx,y+dy)))))continue;
  if(add('wither_tree',x,y,'canopy-fringe',{size:150+Math.round(hash(seed,n)*28),collisionWidth:12,collisionDepth:10,surfaceHeight:999}))trees++;
 }
 // Roots host fungi; wet edges host ferns; dry verges host fallen star fragments.
 for(let n=0;n<600&&local.length<cap-1;n++){
  const x=ox+80+hash(seed+n,913)*1440,y=oy+80+hash(n,seed+391)*1440;if(tile(x,y)!=='shadow_soil')continue;
  const path=shadowPathDistance(s,x,y),trees=local.filter(p=>['wither_tree','ashen_log','hollow_stump'].includes(p.kind)),root=trees.some(p=>Math.hypot(p.x-x,(p.rootY??p.y)-y)<64);
  const damp=[[32,0],[-32,0],[0,32],[0,-32],[48,32],[-48,32]].some(([dx,dy])=>['water','shallow','shadow_void'].includes(tile(x+dx,y+dy)));
  let kind,rule;if(root&&path>29){kind='mooncap_cluster';rule='root-fungi';}else if(damp&&path>30){kind='witch_fern';rule='wet-bank';}else if(path>28&&path<53){kind=n%3?'star_shards':'wisp_lantern';rule='path-verge';}else continue;
  if(local.filter(p=>p.kind===kind).length>=13)continue;add(kind,x,y,rule);
 }
 // A reachable exit is deliberately tied to the shrine route, with a clear approach.
 const shrine=s.enchantedPOIs.find(p=>p.id==='thorn_shrine');
 if(shrine){for(const [dx,dy]of [[0,62],[62,0],[-62,0],[0,-62]]){const x=shrine.x+dx,y=shrine.y+dy;if(tile(x,y)==='shadow_soil'&&local.every(p=>!['tree','rock'].includes(p.type)&&Math.hypot(p.x-x,(p.rootY??p.y)-y)>25)){s.enchantedExit={x,y};break;}}}
 s.enchantedExit??={x:ox+800,y:oy+1090};add('root_arch',s.enchantedExit.x,s.enchantedExit.y,'waygate-frame',{size:155});s.enchantedForestVersion=1;dressShadowThickets(g,terrainAt,shadowPathDistance);return props.length-start;
}
