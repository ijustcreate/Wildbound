import {forestSettings,saveForestSettings} from './forest-settings.mjs';
export {forestSettings,saveForestSettings} from './forest-settings.mjs';
import {realmTerrainAt} from './realm-world.mjs';
import {applyTreeFall} from './tree-fall.mjs';
import {tickFern} from './fern-art.mjs';
import {vegetationWindStrength,leafClusterMotion} from './vegetation-motion.mjs';
import {drawForestAsset} from './forest-props.mjs';
import {houseKeepsWorld} from './house-victory.mjs';
// Layered, deterministic pixel vegetation. No bitmap dependencies or per-frame random spawning.
import {forestWind} from './forest-landscape.mjs';
import {hasForestLandscape,drawCanopyShadow,drawLandscapeCover} from './forest-art.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export const TREE_TYPES=['oak','birch','pine'];
export const palmBase=p=>({x:p.x,y:Number.isFinite(p.rootY)?p.rootY:p.y+p.size*.19});
export function palmStructure(p){const seed=p.seed??hash(p.x,p.y)*1000;return {seed,lean:(hash(seed,11)-.5)*19,height:(45+hash(seed,12)*10)*forestSettings.trunkHeight,spread:(.85+hash(seed,13)*.3)*forestSettings.canopyWidth*forestSettings.branchSpread};}
export function drawPalmTrunk(c,p){
 const s=palmStructure(p);
 for(let i=0;i<18;i++){const t=i/17,x=s.lean*t*t,y=-s.height*t,w=7-t*3;
  rect(c,x-w/2-1,y,w+2,5,'#493d2c');rect(c,x-w/2,y,w,4,'#94734c');rect(c,x-w/2,y,2,3,'#c7a171');
  if(i%2===0)line(c,x-w/2,y+3,x+w/2,y+2,1,'#665139');
 }
 drawTreeRoots(c,p);
}
export function drawPalmFronds(c,p,time){
 const s=palmStructure(p),cx=s.lean,cy=-s.height;
 for(let i=0;i<9;i++){
  const angle=-Math.PI+.22+i*(Math.PI*2-.44)/9,len=(24+hash(i,s.seed)*13)*s.spread;
  const dx=Math.cos(angle)*len,dy=Math.sin(angle)*len*.52;
  const sway=Math.sin(time*1.4+s.seed+i*.7)*1.4*forestSettings.wind;
  const point=t=>[cx+dx*t+sway*t*t,cy+dy*t-13*Math.sin(t*Math.PI)+10*t*t];
  let previous=point(0);
  for(let n=1;n<=12;n++){const t=n/12,[x,y]=point(t),w=8*Math.sin(Math.PI*t)*(.75+hash(i,n)*.25);
   line(c,previous[0],previous[1],x,y,2,'#244c38');
   const nx=-dy/len,ny=dx/len;
   line(c,x,y,x+nx*w-dx*.06,y+ny*w+4*t,2,i%3===0?'#3b6840':'#568449');
   line(c,x,y,x-nx*w-dx*.06,y-ny*w+4*t,2,'#35623d');
   line(c,previous[0],previous[1]-1,x,y-1,1,i%2?'#83a85b':'#a0b968');previous=[x,y];
  }
 }
 crown(c,cx,cy,5,4,'#476839',s.seed);
 for(let i=0;i<Math.min(3,p.coconuts??Math.floor(hash(s.seed,17)*4));i++){rect(c,cx-5+i*4,cy+2+i%2*3,5,5,'#503d2b');rect(c,cx-4+i*4,cy+2+i%2*3,2,2,'#b28a50');}
}
export const treeType=p=>TREE_TYPES.includes(p.treeType)?p.treeType:p.kind==='snow_tree'?'pine':TREE_TYPES[Math.floor(hash(p.x,p.y)*3)];
export const treeBase=p=>({x:p.x,y:Number.isFinite(p.rootY)?p.rootY:p.y+p.size*.35});
export function treeSeason(p,g={}){return p.season|| (forestSettings.season==='auto'?(g.generatedEnvironment==='ice'||p.kind==='snow_tree'?'winter':p.autumnAccent?'autumn':'summer'):forestSettings.season);}
export const leafHabit=p=>p.leafHabit||forestSettings[treeType(p)];
export function treeStructure(p){const seed=p.seed??hash(p.x,p.y)*1000;return {height:(.88+hash(seed,2)*.24)*forestSettings.trunkHeight,width:(.85+hash(seed,3)*.3)*forestSettings.canopyWidth,lean:(hash(seed,4)-.5)*.16,branchSpread:(.8+hash(seed,5)*.4)*forestSettings.branchSpread,seed};}
export function treeStumpPalette(p){
 if(p.kind==='palm')return {shadow:'#403729',bark:'#94734c',highlight:'#c7a171',rings:'#695238',root:'#796043'};
 const type=treeType(p);
 if(type==='birch')return {shadow:'#343b35',bark:'#c9cbb3',highlight:'#ebebcf',rings:'#4f5650',root:'#bfc3af'};
 if(type==='pine')return {shadow:'#3b352c',bark:'#5f4b39',highlight:'#967755',rings:'#403a32',root:'#665a47'};
 return {shadow:'#514333',bark:'#65503a',highlight:'#b79463',rings:'#72593e',root:'#65503a'};
}
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function line(c,x,y,xx,yy,width,color){const n=Math.ceil(Math.hypot(xx-x,yy-y));for(let i=0;i<=n;i++)rect(c,x+(xx-x)*i/(n||1)-width/2,y+(yy-y)*i/(n||1),width,width,color);}
function crown(c,x,y,rx,ry,color,seed){for(let row=-ry;row<=ry;row+=2){const half=Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx,jag=hash(Math.floor(row/4),seed)*3;rect(c,x-half+jag-1,y+row,half*2-jag+hash(row,seed)*2,2,color);}}
export const TREE_CUT_Y=-9;
export function treeFallPose(p){
 const progress=Math.max(0,Math.min(1,(p.falling||0)/1.1));
 return {cutY:TREE_CUT_Y,angle:(p.fallDirection||1)*Math.PI/2*(.08*progress+.92*progress**2.2),alpha:Math.max(0,Math.min(1,(1.5-(p.falling||0))/.25))};
}
export function drawTreeRoots(c,p){
 const colors=treeStumpPalette(p),seed=p.seed??hash(p.x,p.y)*1000;
 // Tapered, branching roots end individually; there is no rectangular ground pad.
 for(let i=0;i<5;i++){
  const sign=i%2?-1:1,end=sign*(7+hash(seed,i)*8),ey=1+hash(i,seed)*4;
  const mx=end*.52,my=-2+hash(seed,i+5)*3;
  line(c,sign*2,-6,mx,my,4,colors.shadow);line(c,mx,my,end,ey,2,colors.shadow);
  line(c,sign*2,-5,mx,my,2,colors.root);line(c,mx,my,end,ey-1,1,colors.highlight);
  if(i%2)line(c,mx,my,end*.8,ey+2,1,colors.root);
 }
}
export function drawTreeTrunk(c,p){
 const birch=treeType(p)==='birch',bark=birch?'#c9cbb3':'#655044';
 // Square brush strokes end at the ground, not a brush-width below it.
 line(c,0,-43,-1,birch?-7:-11,birch?7:11,'#343b35');line(c,-1,-40,-2,birch?-5:-7,birch?5:7,bark);
 line(c,-2,-33,-3,-3,2,birch?'#ebebcf':'#987652');
 drawTreeRoots(c,p);
 for(let i=0;i<7;i++)rect(c,birch?(i%2?-3:0):1,-5-i*5,birch?4:2,1,birch?'#4f5650':'#403a32');
}
export function drawTreeBranches(c,p){
 const shape=treeStructure(p),pine=treeType(p)==='pine',birch=treeType(p)==='birch';
 const ends=pine?[[-19,-30],[20,-32],[-14,-43],[13,-47],[-6,-58],[6,-60]]:[[-22,-43],[19,-47],[-12,-59],[10,-64]];
 ends.forEach(([xx,yy],i)=>{const x=xx*shape.branchSpread,y=yy+hash(xx,shape.seed)*5,baseY=-19-i*4,mx=x*.55,my=y+8;
 line(c,0,baseY,mx,my,4,'#3d4036');line(c,mx,my,x,y,3,'#3d4036');
 line(c,-1,baseY,mx-1,my,2,birch?'#bfc3af':'#83674b');line(c,mx-1,my,x,y,1,birch?'#d3d5bf':'#967755');
 if(!pine){const sign=x<0?-1:1;for(let j=0;j<3;j++){const t=.35+j*.24,bx=mx+(x-mx)*t,by=my+(y-my)*t;
 const tx=bx+sign*(4+hash(i,j+shape.seed)*5),ty=by-5-hash(j,i)*5;
 line(c,bx,by,tx,ty,1,birch?'#c5c9b7':'#665a47');line(c,tx,ty,tx-sign*2,ty-4,1,'#575547');}}
 });
}
const foliageCache=new Map();
const foliageClusters=type=>type==='pine'?[[-4,-27,25,14],[4,-39,22,14],[-3,-51,19,15],[2,-63,13,14],[-1,-75,7,11]]:type==='birch'?[[-10,-39,12,16],[9,-48,14,18],[-8,-63,12,17],[5,-76,11,13]]:[[-24,-35,19,16],[22,-40,21,18],[-19,-52,22,20],[13,-59,25,19],[-5,-73,23,17]];
function leafTextureFrame(layer,phase){
 layer.frames??=[];if(layer.frames[phase])return layer.frames[phase];
 const source=layer.canvas,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const pen=canvas.getContext('2d');pen.imageSmoothingEnabled=false;
 // Tiny internal row shifts and scattered displaced leaf pixels. All frames
 // use the source colors and source alpha; no noise can escape into bark/sky.
 for(let y=0;y<canvas.height;y+=3){const shift=Math.sin(y*.7+phase*Math.PI/2)>0?1:-1;pen.drawImage(source,0,y,canvas.width,Math.min(3,canvas.height-y),shift,y,canvas.width,Math.min(3,canvas.height-y));}
 for(let n=0;n<18;n++){const x=2+Math.floor(hash(n+phase*3,layer.x)*Math.max(1,canvas.width-5)),y=2+Math.floor(hash(n+phase*5,layer.y)*Math.max(1,canvas.height-5));pen.drawImage(source,x,y,2,2,x+(phase%2?1:-1),y,2,2);}
 pen.globalCompositeOperation='destination-in';pen.drawImage(source,0,0);layer.frames[phase]=canvas;return canvas;
}
export function drawTreeFoliage(c,p,time,g={}){
 if(p.kind==='leafless_tree')return;
 if(typeof document==='undefined'){paintTreeFoliage(c,p,time,g);return;}
 if(treeSeason(p,g)==='winter'&&leafHabit(p)==='deciduous')return;
 const shape=treeStructure(p),key=[treeType(p),treeSeason(p,g),leafHabit(p),p.x,p.y,shape.branchSpread].join(':');
 let layers=foliageCache.get(key);
 if(!layers){
  layers=foliageClusters(treeType(p)).map(([cx,cy,rx,ry],i)=>{
   // Each cached fan has a generous two-pixel border for scalloped tips/snow.
   const x=Math.floor((cx*shape.branchSpread-rx-8)/2)*2,y=Math.floor((cy-ry-9)/2)*2;
   const canvas=document.createElement('canvas');canvas.width=Math.ceil((rx*2+18)/2)*2;canvas.height=Math.ceil((ry*2+20)/2)*2;
   const ctx=canvas.getContext('2d');ctx.translate(-x,-y);paintTreeFoliage(ctx,p,0,g,i);
   return {canvas,x,y};
  });
  if(foliageCache.size>=128)foliageCache.delete(foliageCache.keys().next().value);
  foliageCache.set(key,layers);
 }
 const strength=vegetationWindStrength(g)*forestSettings.wind;
 c.save();c.imageSmoothingEnabled=false;
 layers.forEach((layer,i)=>{const motion=leafClusterMotion(p.x,p.y,time,i,strength),phase=((Math.floor(time*6*forestSettings.leafFlutter)+i+Math.floor(shape.seed||0))%4+4)%4;c.drawImage(leafTextureFrame(layer,phase),layer.x+Math.round(motion.x*forestSettings.canopySway),layer.y+Math.round(motion.y*forestSettings.canopySway));});
 c.restore();
}
function paintTreeFoliage(c,p,time,g,onlyCluster=null){
 const type=treeType(p),season=treeSeason(p,g);if(season==='winter'&&leafHabit(p)==='deciduous')return;
 const autumn=season==='autumn'&&leafHabit(p)==='deciduous',colors=autumn?['#534d35','#877139','#b5a148','#d6c96b']:type==='pine'?['#204b43','#326652','#54845f','#91aa73']:type==='birch'?['#355941','#527944','#83a151','#bdc97b']:['#234d39','#386d43','#668c47','#a5b962'];
 const seed=hash(p.x,p.y),sway=0;
 const clusters=foliageClusters(type);
 // Interlocking lobes carry broad shaded planes instead of horizontal stripes.
 const mass=(x,y,rx,ry,color,phase=0)=>{
  c.fillStyle=color;
  for(let row=-ry;row<=ry;row+=2){
   const half=Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx;
   const tooth=Math.floor(hash(Math.floor(row/4)+phase,seed)*3)*2;
   c.fillRect(Math.round((x-half+tooth*.35)/2)*2,Math.round((y+row)/2)*2,Math.max(2,Math.round((half*2-tooth*.3)/2)*2),2);
  }
 };
 clusters.forEach(([cx,cy,rx,ry],i)=>{
  if(onlyCluster!==null&&i!==onlyCluster)return;
  const x=cx*treeStructure(p).branchSpread+(hash(i,seed)-.5)*4,y=cy+(hash(seed,i)-.5)*4;
  mass(x,y,rx,ry,colors[0],i);
  for(let n=0;n<5;n++){const a=n*1.3+i*.4;mass(x+Math.cos(a)*rx*.67,y+Math.sin(a)*ry*.62,rx*.4,ry*.46,colors[0],i+n);}
  mass(x-2,y-3,rx*.91,ry*.83,colors[1],i+10);
  mass(x-rx*.22,y-ry*.27,rx*.64,ry*.5,colors[2],i+21);
  mass(x-rx*.39,y-ry*.47,rx*.19,ry*.18,colors[3],i+32);
 });
 if(season==='winter')clusters.forEach(([cx,cy,rx,ry],i)=>{
  if(onlyCluster!==null&&i!==onlyCluster)return;
  const x=cx*treeStructure(p).branchSpread+(hash(i,seed)-.5)*4,y=cy+(hash(seed,i)-.5)*4;
  // Overlapping drifts follow individual branch tips, not wide horizontal slabs.
  // Their cool undersides and scalloped silhouettes are baked into the foliage cache.
  const lobes=Math.max(3,Math.round(rx/5));
  for(let n=0;n<lobes;n++){
   const u=lobes===1?0:n/(lobes-1)*2-1,lx=x+u*rx*.72;
   const ly=y-ry*(.40+.20*(1-u*u))+(hash(seed+i,n)-.5)*5;
   const w=rx/lobes*(.75+hash(i+n,seed)*.45)+1,h=3+hash(seed,n+i*9)*3;
   crown(c,lx,ly+1,w,h,'#8caeb9',seed+i+n);
   crown(c,lx-.5,ly-1,w*.92,h*.80,'#d3e8eb',seed+i+n);
   crown(c,lx-1,ly-2,w*.73,h*.58,'#f0faf5',seed+i+n);
  }
 });
}
const woodSprites=new WeakMap();
function drawTreeWood(c,p,part){
 const paint=part==='trunk'?drawTreeTrunk:drawTreeBranches;
 if(typeof document==='undefined'){paint(c,p);return;}
 const signature=[p.seed,p.x,p.y,treeType(p)].join(':');
 let entry=woodSprites.get(p);
 if(!entry||entry.signature!==signature){entry={signature};woodSprites.set(p,entry);}
 if(!entry[part]){
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;
  const pen=canvas.getContext('2d');pen.translate(48,80);paint(pen,p);entry[part]=canvas;
 }
 c.drawImage(entry[part],-48,-80);
}
export function drawForestTree(c,p,time,g={}){
 const b=treeBase(p),s=p.size/64;c.save();c.translate(Math.round(b.x),Math.round(b.y));c.scale(s,s);
 const shape=treeStructure(p);c.transform(shape.width,0,shape.lean,shape.height,0,0);
 drawSplitTree(c,p,()=>drawTreeWood(c,p,'trunk'),()=>{drawTreeWood(c,p,'branches');drawTreeFoliage(c,p,time,g);});c.restore();
}
export function drawPalmTree(c,p,time){
 const b=palmBase(p),s=p.size/64;c.save();c.translate(Math.round(b.x),Math.round(b.y));c.scale(s,s);
 drawSplitTree(c,p,()=>drawPalmTrunk(c,p),()=>drawPalmFronds(c,p,time));c.restore();
}
function drawSplitTree(c,p,trunk,upper){
 if(p.fallen){drawStump(c,p);return;}
 if(!p.falling){trunk();upper();return;}
 const pose=treeFallPose(p);
 c.save();c.beginPath();c.rect(-96,pose.cutY-1,192,48);c.clip();trunk();drawStump(c,p);c.restore();
 c.save();c.translate(0,pose.cutY);applyTreeFall(c,p,pose.angle);c.translate(0,-pose.cutY);
 c.globalAlpha*=pose.alpha;c.beginPath();c.rect(-160,-200,320,200+pose.cutY);c.clip();trunk();upper();c.restore();
}
export function drawStump(c,p){
 const colors=treeStumpPalette(p);
 drawTreeRoots(c,p);
 crown(c,0,-4,treeType(p)==='birch'?5:7,5,colors.shadow,3);
 crown(c,-1,-4,treeType(p)==='birch'?4:5,4,colors.bark,3);
 crown(c,0,TREE_CUT_Y+1,treeType(p)==='birch'?5:6,2,colors.highlight,1);
 line(c,-3,TREE_CUT_Y+1,3,TREE_CUT_Y+1,1,colors.rings);
 rect(c,-1,TREE_CUT_Y,2,2,colors.rings);
 line(c,3,-5,3,-1,1,colors.shadow);
 if(treeType(p)==='birch'){
  rect(c,-6,-2,3,1,colors.rings);
  rect(c,2,-1,4,1,colors.rings);
 }
}
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
function drawBankReeds(c,p,time,g){
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
export function drawFallingLeaves(c,g,visible=()=>true){
 if(!forestSettings.fallingLeaves)return;
 for(const p of g.scenery||[])if(p.kind==='tree'&&!p.fallen&&!p.falling&&leafHabit(p)==='deciduous'&&treeSeason(p,g)!=='winter'&&visible(p)){
 const b=treeBase(p);for(let i=0;i<2;i++){const u=((g.time||0)*.09+hash(i+p.x,p.y))%1;if(u>.8)continue;const x=b.x+Math.sin(u*8+i)*12+(i-.5)*p.size*.3+forestWind(b.x,b.y,g.time)*u*18,y=b.y-p.size*.7+u*p.size*.88;rect(c,x,y,Math.sin(u*20)>0?3:1,2,treeSeason(p,g)==='autumn'?'#c29451':'#839854');}}
}
export function drawBush(c,p,time,{dynamicShadows=false,windStrength=1}={}){const s=p.size/40,b=p.y+p.size*.19;c.save();c.translate(p.x,b);c.scale(s,s);if(!dynamicShadows){c.fillStyle='#17392e66';c.beginPath();c.ellipse(0,1,17,5,0,0,Math.PI*2);c.fill();}const sway=Math.sin(time*24+p.x)*(p.rustle||0)*3+forestWind(p.x,b,time,windStrength)*.8;for(let i=0;i<3;i++){crown(c,(i-1)*10+sway,-8-(i===1?5:0),11,9,'#274f35',i);crown(c,(i-1)*10-2+sway,-12-(i===1?5:0),8,5,'#5e8247',i);for(let j=0;j<5;j++)rect(c,(i-1)*10-7+j*3+sway,-13+hash(j,i)*7,2,2,'#92a65b');}c.restore();}
