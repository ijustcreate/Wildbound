// Shared tree art has no world/catalog imports, so it can also paint editor sprites.
import {forestSettings} from './forest-settings.mjs';
import {applyTreeFall} from './tree-fall.mjs';
import {vegetationWindStrength,leafClusterMotion} from './vegetation-motion.mjs';
import {MAPLE_BARK,mapleFoliageClusters,paintMapleFoliageCluster,drawMapleBranches,drawMapleTrunk} from './forest-maple-art.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const standardTreeTypes=['oak','birch','pine'];
export const TREE_TYPES=[...standardTreeTypes,'maple'];
const tallLowerClusters=[[-26,-56,23,17],[24,-62,24,18],[-8,-71,26,18],[19,-78,20,14]];
const tallUpperClusters=[[-24,-105,18,14],[19,-111,19,16],[-2,-118,23,17],[-10,-132,17,16]];
const tallClusters=[...tallLowerClusters,...tallUpperClusters];
const tallCrownTop=154;
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
export const treeType=p=>TREE_TYPES.includes(p.treeType)?p.treeType:p.kind==='snow_tree'?'pine':standardTreeTypes[Math.floor(hash(p.x,p.y)*standardTreeTypes.length)];
export const treeBase=p=>({x:p.x,y:Number.isFinite(p.rootY)?p.rootY:p.y+p.size*.35});
export function treeSeason(p,g={}){return p.season|| (forestSettings.season==='auto'?(g.generatedEnvironment==='ice'||p.kind==='snow_tree'?'winter':p.autumnAccent||p.treeType==='maple'?'autumn':'summer'):forestSettings.season);}
export const leafHabit=p=>p.leafHabit||(p.treeType==='maple'?'deciduous':forestSettings[treeType(p)]);
export function treeStructure(p){const seed=p.seed??hash(p.x,p.y)*1000;return {height:(.88+hash(seed,2)*.24)*forestSettings.trunkHeight,width:(.85+hash(seed,3)*.3)*forestSettings.canopyWidth,lean:(hash(seed,4)-.5)*.16,branchSpread:(.8+hash(seed,5)*.4)*forestSettings.branchSpread,seed};}
export const isTwoTierForestTree=p=>p.kind==='tree'&&p.procedural&&p.treeVariant==='two-tier'&&treeType(p)==='oak';
export const twoTierForestTreeHeight=p=>tallCrownTop*p.size/64*treeStructure(p).height;

export function forestTreeTierOcclusion(p,player){
 const clear={lower:false,upper:false};
 if(!isTwoTierForestTree(p)||p.fallen||p.falling||player.room||player.hp<=0)return clear;
 const base=treeBase(p),scale=p.size/64,shape=treeStructure(p);
 if(player.y>=base.y)return clear;
 const foot=(player.y-(player.jumpHeight||0)-(player.groundHeight||0)-base.y)/(scale*shape.height);
 const head=foot-32/(scale*shape.height),avatarHalfWidth=8/(scale*shape.width);
 const overlaps=([cx,cy,rx,ry])=>{
  const y=Math.max(head,Math.min(foot,cy));
  const x=((player.x-base.x)/scale-shape.lean*y)/shape.width;
  const dx=Math.max(0,Math.abs(x-cx*shape.branchSpread)-avatarHalfWidth);
  return (dx/(rx+3))**2+((y-cy)/(ry+3))**2<1;
 };
 const lower=tallLowerClusters.some(overlaps);
 const upper=tallUpperClusters.some(overlaps);
 // The trunk tapers but still covers part of a hero passing behind the fork.
 const trunkY=Math.max(head,Math.min(foot,-27));
 const trunkX=((player.x-base.x)/scale-shape.lean*trunkY)/shape.width;
 return {lower:lower||(head<-7&&foot>-91&&Math.abs(trunkX)<6+avatarHalfWidth),upper};
}
export function treeStumpPalette(p){
 if(p.realmPalette==='shadow')return {shadow:'#242137',bark:'#51415f',highlight:'#8c7397',rings:'#352c48',root:'#564961'};
 if(p.kind==='palm')return {shadow:'#403729',bark:'#94734c',highlight:'#c7a171',rings:'#695238',root:'#796043'};
 const type=treeType(p);
 if(type==='maple')return MAPLE_BARK;
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
 if(treeType(p)==='maple'){drawMapleTrunk(c);drawTreeRoots(c,p);return;}
 const birch=treeType(p)==='birch',bark=p.realmPalette==='shadow'?'#51415f':birch?'#c9cbb3':'#655044';
 // Square brush strokes end at the ground, not a brush-width below it.
 line(c,0,-43,-1,birch?-7:-11,birch?7:11,'#343b35');line(c,-1,-40,-2,birch?-5:-7,birch?5:7,bark);
 line(c,-2,-33,-3,-3,2,birch?'#ebebcf':'#987652');
 drawTreeRoots(c,p);
 for(let i=0;i<7;i++)rect(c,birch?(i%2?-3:0):1,-5-i*5,birch?4:2,1,birch?'#4f5650':'#403a32');
}
export function drawTreeBranches(c,p){
 const shape=treeStructure(p),pine=treeType(p)==='pine',birch=treeType(p)==='birch';
 if(treeType(p)==='maple'){drawMapleBranches(c,shape);return;}
 const ends=pine?[[-19,-30],[20,-32],[-14,-43],[13,-47],[-6,-58],[6,-60]]:[[-22,-43],[19,-47],[-12,-59],[10,-64]];
 ends.forEach(([xx,yy],i)=>{const x=xx*shape.branchSpread,y=yy+hash(xx,shape.seed)*5,baseY=-19-i*4,mx=x*.55,my=y+8;
 line(c,0,baseY,mx,my,4,'#3d4036');line(c,mx,my,x,y,3,'#3d4036');
 line(c,-1,baseY,mx-1,my,2,birch?'#bfc3af':'#83674b');line(c,mx-1,my,x,y,1,birch?'#d3d5bf':'#967755');
 if(!pine){const sign=x<0?-1:1;for(let j=0;j<3;j++){const t=.35+j*.24,bx=mx+(x-mx)*t,by=my+(y-my)*t;
 const tx=bx+sign*(4+hash(i,j+shape.seed)*5),ty=by-5-hash(j,i)*5;
 line(c,bx,by,tx,ty,1,birch?'#c5c9b7':'#665a47');line(c,tx,ty,tx-sign*2,ty-4,1,'#575547');}}
 });
}
function drawTallOakWood(c,p,tier){
 const upper=tier==='upper',shape=treeStructure(p);
 const bark='#655044',shade='#343b35',face='#987652';
 const limb=(x,y,xx,yy,width)=>{
  line(c,x,y,xx,yy,width,shade);
  line(c,x-1,y,xx-1,yy,Math.max(1,width-2),bark);
  line(c,x-2,y,xx-2,yy,1,face);
 };
 if(upper){
  limb(4,-91,6,-109,6);limb(6,-109,-7,-132,4);
  limb(5,-101,17*shape.branchSpread,-116,4);
  limb(4,-94,-22*shape.branchSpread,-108,4);
 }else{
  limb(-1,-5,-5,-34,12);limb(-5,-34,0,-61,9);limb(0,-61,4,-93,7);
  limb(-4,-32,-13,-49,6);limb(-13,-49,-26*shape.branchSpread,-60,4);
  limb(-2,-42,13,-55,6);limb(13,-55,25*shape.branchSpread,-65,4);
  limb(0,-62,-12*shape.branchSpread,-77,4);limb(3,-72,17*shape.branchSpread,-84,4);
  for(const [x,y] of [[1,-13],[-2,-25],[-4,-40],[-1,-53],[3,-66],[4,-84]])rect(c,x,y,2,2,'#403a32');
 }
}
const foliageCache=new Map();
const speciesClusters={
 oak:[[-24,-35,19,16],[22,-40,21,18],[-19,-52,22,20],[13,-59,25,19],[-5,-73,23,17]],
 birch:[[-10,-39,12,16],[9,-48,14,18],[-8,-63,12,17],[5,-76,11,13]],
 pine:[[-4,-27,25,14],[4,-39,22,14],[-3,-51,19,15],[2,-63,13,14],[-1,-75,7,11]],
 maple:mapleFoliageClusters,
};
const foliageClusters=p=>isTwoTierForestTree(p)?tallClusters:speciesClusters[treeType(p)];
const inTreeTier=(i,tier)=>tier==='upper'?i>=tallLowerClusters.length:tier==='lower'?i<tallLowerClusters.length:true;
function leafTextureFrame(layer,phase){
 layer.frames??=[];if(layer.frames[phase])return layer.frames[phase];
 const source=layer.canvas,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const pen=canvas.getContext('2d');pen.imageSmoothingEnabled=false;
 // Tiny internal row shifts and scattered displaced leaf pixels. All frames
 // use the source colors and source alpha; no noise can escape into bark/sky.
 for(let y=0;y<canvas.height;y+=3){const shift=Math.sin(y*.7+phase*Math.PI/2)>0?1:-1;pen.drawImage(source,0,y,canvas.width,Math.min(3,canvas.height-y),shift,y,canvas.width,Math.min(3,canvas.height-y));}
 for(let n=0;n<18;n++){const x=2+Math.floor(hash(n+phase*3,layer.x)*Math.max(1,canvas.width-5)),y=2+Math.floor(hash(n+phase*5,layer.y)*Math.max(1,canvas.height-5));pen.drawImage(source,x,y,2,2,x+(phase%2?1:-1),y,2,2);}
 pen.globalCompositeOperation='destination-in';pen.drawImage(source,0,0);layer.frames[phase]=canvas;return canvas;
}
export function drawTreeFoliage(c,p,time,g={},tier){
 if(p.kind==='leafless_tree')return;
 if(typeof document==='undefined'){paintTreeFoliage(c,p,time,g,null,tier);return;}
 if(treeSeason(p,g)==='winter'&&leafHabit(p)==='deciduous')return;
 const shape=treeStructure(p),key=[treeType(p),p.treeVariant,treeSeason(p,g),leafHabit(p),p.x,p.y,shape.branchSpread,p.realmPalette].join(':');
 let layers=foliageCache.get(key);
 if(!layers){
  layers=foliageClusters(p).map(([cx,cy,rx,ry],i)=>{
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
 layers.forEach((layer,i)=>{if(!inTreeTier(i,tier))return;const motion=leafClusterMotion(p.x,p.y,time,i,strength),phase=((Math.floor(time*6*forestSettings.leafFlutter)+i+Math.floor(shape.seed||0))%4+4)%4;c.drawImage(leafTextureFrame(layer,phase),layer.x+Math.round(motion.x*forestSettings.canopySway),layer.y+Math.round(motion.y*forestSettings.canopySway));});
 c.restore();
}
export function paintTreeFoliage(c,p,time,g,onlyCluster=null,tier){
 const type=treeType(p),season=treeSeason(p,g);if(season==='winter'&&leafHabit(p)==='deciduous')return;
 const autumn=season==='autumn'&&leafHabit(p)==='deciduous',colors=p.realmPalette==='shadow'?['#29233e','#4b3b65','#71608c','#a095ba']:autumn?['#534d35','#877139','#b5a148','#d6c96b']:type==='pine'?['#204b43','#326652','#54845f','#91aa73']:type==='birch'?['#355941','#527944','#83a151','#bdc97b']:['#234d39','#386d43','#668c47','#a5b962'];
 const seed=hash(p.x,p.y),spread=treeStructure(p).branchSpread;
 const clusters=foliageClusters(p);
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
  if((onlyCluster!==null&&i!==onlyCluster)||!inTreeTier(i,tier))return;
  const x=cx*spread+(hash(i,seed)-.5)*4,y=cy+(hash(seed,i)-.5)*4;
  if(type==='maple'){paintMapleFoliageCluster(c,x,y,rx,ry,seed,i,season);return;}
  mass(x,y,rx,ry,colors[0],i);
  for(let n=0;n<5;n++){const a=n*1.3+i*.4;mass(x+Math.cos(a)*rx*.67,y+Math.sin(a)*ry*.62,rx*.4,ry*.46,colors[0],i+n);}
  mass(x-2,y-3,rx*.91,ry*.83,colors[1],i+10);
  mass(x-rx*.22,y-ry*.27,rx*.64,ry*.5,colors[2],i+21);
  mass(x-rx*.39,y-ry*.47,rx*.19,ry*.18,colors[3],i+32);
 });
 if(season==='winter')clusters.forEach(([cx,cy,rx,ry],i)=>{
  if((onlyCluster!==null&&i!==onlyCluster)||!inTreeTier(i,tier))return;
  const x=cx*spread+(hash(i,seed)-.5)*4,y=cy+(hash(seed,i)-.5)*4;
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
const woodSprites=new Map();
const WOOD_SPRITE_LIMIT=512;let woodHits=0,woodMisses=0;
export function treeWoodCacheStats(){
 let bytes=0;
 for(const entry of woodSprites.values())for(const part of ['trunk','branches','lower','upper','roots']){
  const sprite=entry[part];if(sprite)bytes+=sprite.width*sprite.height*4;
 }
 return {hits:woodHits,misses:woodMisses,entries:woodSprites.size,limit:WOOD_SPRITE_LIMIT,bytes};
}
function drawTreeWood(c,p,part){
 const tallPart=part==='lower'||part==='upper';
 const paint=tallPart?(pen,prop)=>drawTallOakWood(pen,prop,part):part==='trunk'?drawTreeTrunk:part==='roots'?drawTreeRoots:drawTreeBranches;
 if(typeof document==='undefined'){paint(c,p);return;}
 const signature=[p.seed,p.x,p.y,treeType(p),p.treeVariant,p.realmPalette,forestSettings.branchSpread].join(':');
 let entry=woodSprites.get(signature);
 if(!entry){woodMisses++;entry={signature};if(woodSprites.size>=WOOD_SPRITE_LIMIT)woodSprites.delete(woodSprites.keys().next().value);}
 else {woodHits++;woodSprites.delete(signature);}woodSprites.set(signature,entry);
 const x=tallPart?56:part==='roots'?22:48,y=tallPart?142:part==='roots'?8:80;
 if(!entry[part]){
  const canvas=document.createElement('canvas');canvas.width=x*2;canvas.height=y+16;
  const pen=canvas.getContext('2d');pen.translate(x,y);paint(pen,p);entry[part]=canvas;
 }
 c.drawImage(entry[part],-x,-y);
}
let treeTierSurface;
function drawTallTreeTier(c,p,time,g,tier){
 const paint=pen=>{drawTreeWood(pen,p,tier);drawTreeFoliage(pen,p,time,g,tier);};
 if(typeof document==='undefined'||c.globalAlpha===1){paint(c);return;}
 // Fade the finished tier as one image so overlapping leaf clumps stay even.
 if(!treeTierSurface){treeTierSurface=document.createElement('canvas');treeTierSurface.width=176;treeTierSurface.height=168;}
 const pen=treeTierSurface.getContext('2d');
 pen.setTransform(1,0,0,1,0,0);pen.imageSmoothingEnabled=false;pen.clearRect(0,0,176,168);
 pen.translate(88,156);paint(pen);c.drawImage(treeTierSurface,-88,-156);
}

export function drawForestTree(c,p,time,g={},tier){
 // This also runs inside OffscreenCanvas prop rasters. Snap the wood to the
 // same native sampling as the leaves before compositing either layer.
 const b=treeBase(p),s=p.size/64;c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(b.x),Math.round(b.y));c.scale(s,s);
 const shape=treeStructure(p);c.transform(shape.width,0,shape.lean,shape.height,0,0);
 if(isTwoTierForestTree(p)){
  if(p.falling||p.fallen){
   drawSplitTree(c,p,()=>{drawTreeWood(c,p,'lower');drawTreeWood(c,p,'roots');},()=>{
    drawTreeFoliage(c,p,time,g,'lower');drawTallTreeTier(c,p,time,g,'upper');
   });
  }else{
   if(!tier||tier==='lower')drawTallTreeTier(c,p,time,g,'lower');
   if(!tier||tier==='upper')drawTallTreeTier(c,p,time,g,'upper');
   if(!tier||tier==='roots')drawTreeWood(c,p,'roots');
  }
 }else drawSplitTree(c,p,()=>drawTreeWood(c,p,'trunk'),()=>{drawTreeWood(c,p,'branches');drawTreeFoliage(c,p,time,g);});
 c.restore();
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

export {rect as forestRect,crown as forestCrown};
