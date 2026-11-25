import {forestSettings,saveForestSettings} from './forest-settings.mjs';
export {forestSettings,saveForestSettings} from './forest-settings.mjs';
import {realmTerrainAt} from './realm-world.mjs';
import {tickFern} from './fern-art.mjs';
import {vegetationWindStrength} from './vegetation-motion.mjs';
import {drawForestAsset} from './forest-props.mjs';
import {houseKeepsWorld} from './house-victory.mjs';
// Layered, deterministic pixel vegetation. No bitmap dependencies or per-frame random spawning.
import {forestWind} from './forest-landscape.mjs';
import {hasForestLandscape,drawCanopyShadow,drawLandscapeCover} from './forest-art.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export * from './forest-tree-art.mjs';
import {leafHabit,treeBase,palmBase,treeSeason,forestRect as rect,forestCrown as crown} from './forest-tree-art.mjs';
export function waterBodyAt(g,x,y){
 if((g.house?.pools||[]).some(p=>x>=p.x&&y>=p.y&&x<p.x+p.w&&y<p.y+p.h))return 'pool';
 if((x<0||y<0||x>=1600||y>=1600)&&g.mapMode!=='boundless')return null;
 const t=realmTerrainAt(g,Math.floor(x/32),Math.floor(y/32));return ['water','shallow'].includes(t)&&!g.house?.pools?'natural':null;
}
const bankRegionCaches=new WeakMap();
function forestBanks(g){
 let cached=bankRegionCaches.get(g);const signature=g.seed+':'+g.boundlessGenerationVersion+':'+JSON.stringify(g.house?.pools||[]);
 if(!cached||cached.terrain!==g.terrain||cached.signature!==signature){cached={terrain:g.terrain,signature,regions:new Map()};bankRegionCaches.set(g,cached);}
 const keys=['0,0',...(g.mapMode==='boundless'?(g.boundlessLoadedChunks||[]).map(r=>r.key):[])],result=[];
 for(const key of new Set(keys)){
  let banks=cached.regions.get(key);
  if(!banks){banks=[];const [cx,cy]=key.split(',').map(Number),central=!cx&&!cy;
   for(let y=cy*50+(central?1:0);y<cy*50+(central?49:50);y++)for(let x=cx*50+(central?1:0);x<cx*50+(central?49:50);x++){
    const px=x*32+16,py=y*32+16;if(waterBodyAt(g,px,py)!=='natural')continue;
    const shore=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>['grass','path'].includes(realmTerrainAt(g,x+dx,y+dy)));
    const seed=Math.floor(hash(x,y+g.seed)*100000);
    if(shore&&hash(x+g.seed,y)>.28)banks.push({kind:'reeds',x:px-8,y:py+6,seed});
    if(hash(x,y+(g.seed||0))>.77)banks.push({kind:'lily',x:px+5,y:py,seed});
   }
   if(cached.regions.size>=12)cached.regions.delete(cached.regions.keys().next().value);cached.regions.set(key,banks);
  }
  result.push(...banks);
 }
 return result;
}
const cache=new WeakMap();
const convertedForestLists=new WeakMap();
export function forestDecor(g){
 const signature=[g.seed,g.generatedEnvironment,JSON.stringify(g.house?.pools||[]),JSON.stringify(forestSettings),g.scenery?.length,(g.boundlessLoadedChunks||[]).map(r=>r.key).join(';')].join('|');let data=cache.get(g);
 if(data?.signature===signature&&data.terrain===g.terrain)return data;
 data={signature,terrain:g.terrain,leaves:[],banks:[]};
 for(const p of g.scenery||[])if(['tree','snow_tree'].includes(p.kind)&&leafHabit(p)==='deciduous'){
 const b=treeBase(p);for(let i=0;i<16;i++)data.leaves.push({x:b.x+(hash(i,p.x)-.5)*p.size,y:b.y+(hash(p.y,i)-.5)*p.size*.5,dx:0,dy:0,vx:0,vy:0,seed:i+Math.floor(p.x),tree:p});}
 if((g.generatedEnvironment||g.environment)==='forest')data.banks=forestBanks(g);
 cache.set(g,data);return data;
}
export function tickForest(g,dt){
 for(const p of g.forestLandscape?.cover||[])if(p.kind==='fern')tickFern(p,g.players||[],dt);
 if((g.generatedEnvironment||g.environment)==='forest'&&g.scenery&&convertedForestLists.get(g.scenery)!==g.scenery.length){for(const p of g.scenery)if(p.procedural&&p.kind==='fern'&&hash(p.x,p.y)>.55)p.kind='bush';convertedForestLists.set(g.scenery,g.scenery.length);}
 const data=forestDecor(g),players=(g.players||[]).filter(p=>p.hp>0&&!p.room&&p.moving&&!(p.jumpHeight>0));
 for(const leaf of data.leaves){if(Math.abs(leaf.vx)+Math.abs(leaf.vy)<.02&&!players.some(p=>Math.abs(leaf.x+leaf.dx-p.x)<24&&Math.abs(leaf.y+leaf.dy-p.y)<24)){leaf.vx=leaf.vy=0;continue;}for(const p of players){const dx=leaf.x+leaf.dx-p.x,dy=leaf.y+leaf.dy-p.y,d=Math.hypot(dx,dy);if(d<18){leaf.vx+=(dx/(d||1)*65+(p.faceX||0)*15)*dt;leaf.vy+=(dy/(d||1)*50+(p.faceY||0)*15)*dt;}}
 leaf.vx*=Math.exp(-dt*3);leaf.vy*=Math.exp(-dt*3);leaf.dx=Math.max(-35,Math.min(35,leaf.dx+leaf.vx*dt));leaf.dy=Math.max(-25,Math.min(25,leaf.dy+leaf.vy*dt));}
 for(const b of g.scenery||[])if(b.kind==='bush'){const near=players.some(p=>Math.hypot(p.x-b.x,p.y-(b.y+b.size*.19))<b.size*.55);b.rustle=near?1:Math.max(0,(b.rustle||0)-dt*2.5);}
}
const bankReedSprites=new WeakMap();
export function drawBankReeds(c,p,time,g){
 if(typeof document!=='undefined'){drawForestAsset(c,{...p,forestAsset:'forest_cattail_tuft',rootY:p.y,size:48},time,g);return;}
 if(typeof document==='undefined'){for(let i=0;i<6;i++){const x=p.x+i*3,y=p.y+hash(i,p.seed)*5;line(c,x,y,x+forestWind(x,y,time)*2,y-10-hash(i,p.seed)*9,2,i%2?'#799653':'#416b46');}return;}
 let sprite=bankReedSprites.get(p);
 if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=36;const pen=sprite.getContext('2d');pen.translate(8,28);for(let i=0;i<6;i++){const x=i*3,y=hash(i,p.seed)*5;line(pen,x,y,x,y-10-hash(i,p.seed)*9,2,i%2?'#799653':'#416b46');if(i%2)rect(pen,x,y-18,2,5,'#887248');}bankReedSprites.set(p,sprite);}
 const wind=forestWind(p.x,p.y,time)*2;c.save();c.translate(Math.round(p.x),Math.round(p.y));c.transform(1,0,-wind/20,1,0,0);c.imageSmoothingEnabled=false;c.drawImage(sprite,-8,-28);c.restore();
}
export function drawForestGround(c,g,visible=()=>true,{dynamicShadows=false,shaderGrass=false}={}){
 const data=forestDecor(g),landscape=hasForestLandscape(g);c.save();
 if(landscape){const cameraVisible=visible;visible=p=>cameraVisible(p)&&(g.phase!=='won'||houseKeepsWorld(g))&&(g.bloom>=3||Math.hypot(p.x-800,p.y-800)<g.bloom*430);drawLandscapeCover(c,g,visible,shaderGrass);}
 for(const p of g.scenery||[])if(['tree','snow_tree','palm'].includes(p.kind)&&visible(p)){
 if(landscape&&p.kind!=='palm'){if(!dynamicShadows)drawCanopyShadow(c,p,g);continue;}
 if(!dynamicShadows){const b=p.kind==='palm'?palmBase(p):treeBase(p);c.fillStyle=p.fallen?'#102b224d':'#0b25234f';c.beginPath();c.ellipse(b.x+5,b.y+3,p.size*(p.fallen?.13:.34),p.size*(p.fallen?.05:.12),0,0,Math.PI*2);c.fill();}}
 for(const l of data.leaves)if(visible(l)&&waterBodyAt(g,l.x,l.y)!=='pool'){
 const season=treeSeason(l.tree,g);if(season==='winter')continue;rect(c,l.x+l.dx,l.y+l.dy,3,1.5,season==='autumn'?['#a97442','#c79c51','#785742'][l.seed%3]:['#7e8448','#687643','#a18c53'][l.seed%3]);}
 for(const p of data.banks)if(visible(p)&&waterBodyAt(g,p.x,p.y)==='natural'){
 if(p.kind==='lily'){
 const x=Math.round(p.x),y=Math.round(p.y+Math.sin(g.time*1.5+p.seed)*.6);
 for(const [dy,left,width] of [[-5,-3,6],[-4,-5,10],[-2,-6,12],[0,-5,10],[2,-3,6]]){
  rect(c,x+left,y+dy+1,width,2,'#244e40');rect(c,x+left,y+dy,width,2,'#628b4b');
 }
 rect(c,x-3,y-4,5,2,'#91ac61');rect(c,x-4,y-2,3,2,'#789b52');
 // Open notch is water, not a smooth pie-slice arc.
 rect(c,x+2,y,4,2,'#244e40');rect(c,x+4,y-1,2,1,'#244e40');
 if(p.seed%4===0){rect(c,x+1,y-5,4,2,'#ddd5b4');rect(c,x+2,y-6,2,4,'#f1e6c6');rect(c,x+2,y-5,1,1,'#d6ab59');}
 }
 else drawBankReeds(c,p,g.time,g);
 }
 c.restore();
}
const AUTUMN_LEAVES=['#d7a254','#b56940','#c58c43'];
const SUMMER_LEAVES=['#9da259','#728c49','#81964c'];
export function drawFallingLeaves(c,g,visible=()=>true,scenery=g.scenery||[]){
 if(!forestSettings.fallingLeaves)return;
 let budget=48;
 const time=g.time||0;
 for(const p of scenery){
  if(p.kind!=='tree'||p.fallen||p.falling||p.burning||p.depleted||leafHabit(p)!=='deciduous'||!visible(p))continue;
  const season=treeSeason(p,g);
  if(season==='winter')continue;
  const autumn=season==='autumn',colors=autumn?AUTUMN_LEAVES:SUMMER_LEAVES;
  const b=treeBase(p),spread=p.size*.58,wind=forestWind(b.x,b.y,time);
  for(let i=0;i<(autumn?6:3);i++){
   const u=(time*(.25+i*.013)+hash(i+b.x,b.y))%1;
   if(u>.9)continue;
   const x=b.x+(hash(b.x+i,b.y+19)-.5)*spread+Math.sin(u*8+i)*15+wind*u*18;
   const y=b.y-p.size*(.66-u*.75)+Math.sin(u*7+i)*2;
   const turn=Math.sin(u*26+i),width=turn<-.45?1:turn>.4?3:2;
   rect(c,x,y,width,1,colors[i%colors.length]);
   if(width===3)rect(c,x+1,y+1,1,1,colors[i%colors.length]);
   if(--budget===0)return;
  }
 }
}
export function drawBush(c,p,time,{dynamicShadows=false,windStrength=1}={}){const s=p.size/40,b=p.y+p.size*.19;c.save();c.translate(p.x,b);c.scale(s,s);if(!dynamicShadows){c.fillStyle='#17392e66';c.beginPath();c.ellipse(0,1,17,5,0,0,Math.PI*2);c.fill();}const sway=Math.sin(time*24+p.x)*(p.rustle||0)*3+forestWind(p.x,b,time,windStrength)*.8;for(let i=0;i<3;i++){crown(c,(i-1)*10+sway,-8-(i===1?5:0),11,9,'#274f35',i);crown(c,(i-1)*10-2+sway,-12-(i===1?5:0),8,5,'#5e8247',i);for(let j=0;j<5;j++)rect(c,(i-1)*10-7+j*3+sway,-13+hash(j,i)*7,2,2,'#92a65b');}c.restore();}
