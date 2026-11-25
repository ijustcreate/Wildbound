// Shared tree art has no world/catalog imports, so it can also paint editor sprites.
import {forestSettings} from './forest-settings.mjs';
import {applyTreeFall} from './tree-fall.mjs';
import {vegetationWindStrength,leafClusterMotion} from './vegetation-motion.mjs';
import {MAPLE_BARK,paintMapleFoliageCluster} from './forest-maple-art.mjs';
import {paintForestCanopy} from './forest-canopy-art.mjs';
import {paintPineTier} from './forest-pine-art.mjs';
import {makeTreeForm,treeStemAt,TALL_TREE_LOWER_CROWNS,TALL_TREE_TRUNK_JUNCTION} from './forest-tree-form.mjs';
import {drawPalmFronds,drawPalmWood} from './forest-palm-art.mjs';
export {drawPalmFronds,palmStructure} from './forest-palm-art.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const standardTreeTypes=['oak','birch','pine'];
export const TREE_TYPES=[...standardTreeTypes,'maple'];
const tallCrownTop=162;
export const palmBase=p=>({x:p.x,y:Number.isFinite(p.rootY)?p.rootY:p.y+p.size*.19});
export function drawPalmTrunk(c,p){drawPalmWood(c,p,drawTreeRoots);}
export const treeType=p=>TREE_TYPES.includes(p.treeType)?p.treeType:p.kind==='snow_tree'?'pine':standardTreeTypes[Math.floor(hash(p.x,p.y)*standardTreeTypes.length)];
export const treeBase=p=>({x:p.x,y:Number.isFinite(p.rootY)?p.rootY:p.y+p.size*.35});
export function treeSeason(p,g={}){return p.season|| (forestSettings.season==='auto'?(g.generatedEnvironment==='ice'||p.kind==='snow_tree'?'winter':p.autumnAccent||p.treeType==='maple'?'autumn':'summer'):forestSettings.season);}
export const leafHabit=p=>p.leafHabit||(p.treeType==='maple'?'deciduous':forestSettings[treeType(p)]);
const structureCache=new WeakMap(),formCache=new WeakMap();
export function treeStructure(p){
 const cached=structureCache.get(p),{trunkHeight,canopyWidth,branchSpread}=forestSettings;
 if(cached&&cached.inputSeed===p.seed&&(p.seed!=null||cached.x===p.x&&cached.y===p.y)&&
    cached.trunkHeight===trunkHeight&&cached.canopyWidth===canopyWidth&&cached.spread===branchSpread)return cached.structure;
 const seed=p.seed??hash(p.x,p.y)*1000;
 const structure={height:(.88+hash(seed,2)*.24)*trunkHeight,width:(.85+hash(seed,3)*.3)*canopyWidth,
  lean:(hash(seed,4)-.5)*.16,branchSpread:(.8+hash(seed,5)*.4)*branchSpread,seed};
 structureCache.set(p,{inputSeed:p.seed,x:p.x,y:p.y,trunkHeight,canopyWidth,spread:branchSpread,structure});
 return structure;
}
export const isTwoTierForestTree=p=>p.kind==='tree'&&p.procedural&&p.treeVariant==='two-tier'&&treeType(p)==='oak';
export const twoTierForestTreeHeight=p=>tallCrownTop*p.size/64*treeStructure(p).height;

export function forestTreeForm(p,shape=treeStructure(p)){
 const type=isTwoTierForestTree(p)?'tallOak':treeType(p),cached=formCache.get(shape);
 if(cached?.type===type)return cached.form;
 const form=makeTreeForm(type,shape.seed,shape.branchSpread);
 formCache.set(shape,{type,form});
 return form;
}

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
  const dx=Math.max(0,Math.abs(x-cx)-avatarHalfWidth);
  return (dx/(rx+3))**2+((y-cy)/(ry+3))**2<1;
 };
 const {crowns,trunk}=forestTreeForm(p,shape);
 const lower=crowns.some((crown,i)=>i<TALL_TREE_LOWER_CROWNS&&overlaps(crown));
 const upper=crowns.some((crown,i)=>i>=TALL_TREE_LOWER_CROWNS&&overlaps(crown));
 // The trunk tapers but still covers part of a hero passing behind the fork.
 const trunkY=Math.max(head,Math.min(foot,-27));
 const trunkX=((player.x-base.x)/scale-shape.lean*trunkY)/shape.width;
 const [stemX,stemWidth]=treeStemAt(trunk,trunkY);
 return {lower:lower||(head<-7&&foot>-91&&Math.abs(trunkX-stemX)<stemWidth/2+avatarHalfWidth),upper};
}
export function treeStumpPalette(p){
 if(p.realmPalette==='shadow')return {shadow:'#242137',bark:'#51415f',highlight:'#8c7397',rings:'#352c48',root:'#564961'};
 if(p.kind==='palm')return {shadow:'#403729',bark:'#94734c',highlight:'#c7a171',rings:'#695238',root:'#796043'};
 const type=treeType(p);
 if(type==='maple')return MAPLE_BARK;
 if(type==='birch')return {shadow:'#343b35',bark:'#c9cbb3',highlight:'#ebebcf',rings:'#4f5650',root:'#bfc3af'};
 if(type==='pine')return {shadow:'#39332a',bark:'#6d543d',highlight:'#a38661',rings:'#493d31',root:'#6d5942'};
 return {shadow:'#39352c',bark:'#69513d',highlight:'#ad8c60',rings:'#594330',root:'#6f5840'};
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
  line(c,sign*2,-5,mx,my,2,colors.root);
  line(c,mx,my,end,ey-1,1,sign<0?colors.highlight:colors.root);
  if(i%2)line(c,mx,my,end*.8,ey+2,1,colors.root);
 }
}
function paintTaper(c,x,y,width,endX,endY,endWidth,colors,lit){
 const steps=Math.max(1,Math.ceil(Math.hypot(endX-x,endY-y)));
 for(let i=0;i<=steps;i++){
  const t=i/steps,w=Math.max(1,Math.round(width+(endWidth-width)*t));
  const left=x+(endX-x)*t-w/2,top=y+(endY-y)*t-w*.32;
  rect(c,left,top,w,w,colors.shadow);
  if(w>=3)rect(c,left+1,top,w-2,w-1,colors.bark);
  if(lit&&w>=5)rect(c,left+1,top,1,w-2,colors.highlight);
 }
}

function paintStem(c,trunk,start,end,colors,birch){
 for(let i=start+1;i<=end;i++){
  paintTaper(c,...trunk[i-1],...trunk[i],colors,true);
 }
 const bottom=trunk[start][1]-4,top=trunk[end][1]+5;
 for(let y=bottom,i=0;y>top;y-=birch?5:9,i++){
  const [x,w]=treeStemAt(trunk,y);
  if(w<4)continue;
  rect(c,x+(birch&&i%2===0?-w*.40:0),y,Math.max(1,w*(birch?.43:.19)),birch?1:2,colors.rings);
 }
}

function paintBranches(c,branches,colors,tier){
 for(const b of branches){
  if(tier&&!inTreeTier(b.crown,tier))continue;
  const taper=Math.max(2,Math.round(b.thickness*.58));
  paintTaper(c,b.x,b.y,b.thickness,b.elbowX,b.elbowY,taper,colors,b.tipX<b.x);
  paintTaper(c,b.elbowX,b.elbowY,taper,b.tipX,b.tipY,1,colors,false);
  if(b.fork){
   const side=Math.sign(b.tipX-b.x),rise=Math.min(10,4+Math.abs(b.tipX-b.x)*.14);
   line(c,b.elbowX,b.elbowY,b.elbowX+side*rise*.48,b.elbowY-rise,1,colors.root);
  }
 }
}

export function drawTreeTrunk(c,p,{trunk}=forestTreeForm(p)){
 paintStem(c,trunk,0,trunk.length-1,treeStumpPalette(p),treeType(p)==='birch');
 drawTreeRoots(c,p);
}
export function drawTreeBranches(c,p,{branches}=forestTreeForm(p)){
 paintBranches(c,branches,treeStumpPalette(p));
}
function drawTallOakWood(c,p,tier){
 const {trunk,branches}=forestTreeForm(p),colors=treeStumpPalette(p),upper=tier==='upper';
 paintStem(c,trunk,upper?TALL_TREE_TRUNK_JUNCTION:0,upper?trunk.length-1:TALL_TREE_TRUNK_JUNCTION,colors,false);
 paintBranches(c,branches,colors,tier);
}
const foliageCache=new Map();
const canopyColors={
 oak:['#253d31','#304e36','#3c5b3a','#506c3e','#637e43','#839750','#a5ae5c'],
 birch:['#2e4934','#3f5a39','#506a3d','#608049','#79954d','#96ab5a','#b7bf70'],
 pine:['#223a2e','#304935','#3a573d','#486442','#58744a','#748652','#929c65'],
 snowPine:['#1d3437','#29434a','#365255','#475e5e','#566e67','#6b8575','#8f9a85'],
 autumn:['#4c4330','#615033','#796437','#9a813f','#b19848','#ccae54','#e0c66b'],
 shadow:['#29233e','#372c4e','#47385f','#56446e','#695980','#82719b','#a095ba'],
};
const inTreeTier=(i,tier)=>tier==='upper'?i>=TALL_TREE_LOWER_CROWNS:tier==='lower'?i<TALL_TREE_LOWER_CROWNS:true;
function treeRaster(width,height){
 if(typeof document==='undefined')return new OffscreenCanvas(width,height);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 return canvas;
}
function leafTextureFrame(layer,phase){
 if(phase===0)return layer.canvas;
 layer.frames??=[];if(layer.frames[phase])return layer.frames[phase];
 const source=layer.canvas,canvas=treeRaster(source.width,source.height),pen=canvas.getContext('2d');pen.imageSmoothingEnabled=false;
 // Displace short, staggered patches of leaves by a native pixel. Keep the
 // dark mass intact so the wind can turn leaf tips without striping the crown.
 pen.drawImage(source,0,0);
 for(let y=3;y<canvas.height-5;y+=7)for(let x=3+(y%2)*3;x<canvas.width-6;x+=8){
  const motion=Math.sin(x*.36+y*.25+phase*Math.PI/2);
  if(Math.abs(motion)<.46)continue;
  const width=3+Math.floor(hash(x,y)*3),height=3+Math.floor(hash(y,x)*2);
  pen.drawImage(source,x,y,width,height,x+Math.sign(motion),y,width,height);
 }
 pen.globalCompositeOperation='destination-in';pen.drawImage(source,0,0);layer.frames[phase]=canvas;return canvas;
}
export function drawTreeFoliage(c,p,time,g={},tier){
 if(p.kind==='leafless_tree')return;
 const type=treeType(p),season=treeSeason(p,g),habit=leafHabit(p);
 if(season==='winter'&&habit==='deciduous')return;
 if(typeof document==='undefined'&&typeof OffscreenCanvas==='undefined'){paintTreeFoliage(c,p,time,g,null,tier);return;}
 const shape=treeStructure(p),key=[type,p.treeVariant,season,habit,p.x,p.y,shape.seed,shape.branchSpread,p.realmPalette,p.hangingMoss].join(':');
 let layers=foliageCache.get(key);
 if(!layers){
  const {crowns}=forestTreeForm(p,shape),style=treeFoliageStyle(p,type,season,habit,shape);
  layers=crowns.map(([cx,cy,rx,ry],i)=>{
   // Include the longest leaf tips, overlaps and seasonal snow in the raster.
   const margin=9+Math.ceil(rx*.18),x=Math.floor(cx-rx-margin),y=Math.floor(cy-ry-10);
   const canvas=treeRaster(Math.ceil(rx*2+margin*2+1),Math.ceil(ry*2+22+(style.hangingMoss?9:0)));
   const ctx=canvas.getContext('2d');ctx.translate(-x,-y);paintTreeCluster(ctx,crowns,i,style);
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
function treeFoliageStyle(p,type,season,habit,shape){
 const autumn=season==='autumn'&&habit==='deciduous',shadow=p.realmPalette==='shadow';
 const palette=shadow?'shadow':type==='pine'&&season==='winter'?'snowPine':autumn?'autumn':type;
 const colors=canopyColors[palette]??canopyColors.oak;
 return {type,season,shadow,colors,tall:isTwoTierForestTree(p),seed:hash(shape.seed,hash(p.x,p.y)),hangingMoss:p.hangingMoss};
}
function paintHangingMoss(c,x,y,rx,ry,seed){
 const lean=hash(seed,12)>.5?1:-1;
 const clusterX=x+rx*(hash(seed,5)-.5)*.82;
 for(let strand=0;strand<5;strand++){
  const rootX=clusterX+(strand-2)*2;
  const rootY=y+ry*(.65+hash(seed,strand)*.21);
  const endY=rootY+7+Math.floor(hash(strand+2,seed)*10);
  line(c,rootX,rootY,rootX+lean,endY,2,'#314e39');
  line(c,rootX-1,rootY+1,rootX+lean-1,endY-2,1,'#6a8756');
  if(strand%2===0)rect(c,rootX+lean-1,endY-3,2,2,'#879762');
 }
}

function paintTreeCluster(c,crowns,i,{type,season,shadow,colors,tall,seed,hangingMoss}){
 const [x,y,rx,ry]=crowns[i];
 if(type==='pine'){
  paintPineTier(c,x,y,rx,ry,colors,seed*91+i*7.3,{top:i===crowns.length-1,snow:season==='winter'});
  return;
 }
 if(type==='maple'&&!shadow){paintMapleFoliageCluster(c,x,y,rx,ry,seed,i,season);return;}
 const heightIndex=tall?i%TALL_TREE_LOWER_CROWNS:i;
 paintForestCanopy(c,x,y,rx,ry,colors,seed*91+i*7.3,{
  exposure:Math.min(.34,heightIndex*.15-.24)+(hash(i+11,seed)-.5)*.18,
 });
 if(hangingMoss&&(i===0||i===1||i===3))paintHangingMoss(c,x,y,rx,ry,seed+i*7);
 if(season==='winter'){
  const lobes=Math.max(3,Math.round(rx/5));
  for(let n=0;n<lobes;n++){
   const u=lobes===1?0:n/(lobes-1)*2-1,lx=x+u*rx*.72;
   const ly=y-ry*(.40+.20*(1-u*u))+(hash(seed+i,n)-.5)*5;
   const w=rx/lobes*(.75+hash(i+n,seed)*.45)+1,h=3+hash(seed,n+i*9)*3;
   crown(c,lx,ly+1,w,h,'#8caeb9',seed+i+n);
   crown(c,lx-.5,ly-1,w*.92,h*.80,'#d3e8eb',seed+i+n);
   crown(c,lx-1,ly-2,w*.73,h*.58,'#f0faf5',seed+i+n);
  }
 }
}
export function paintTreeFoliage(c,p,time,g={},onlyCluster=null,tier){
 const type=treeType(p),season=treeSeason(p,g),habit=leafHabit(p);
 if(p.kind==='leafless_tree'||season==='winter'&&habit==='deciduous')return;
 const shape=treeStructure(p),{crowns}=forestTreeForm(p,shape),style=treeFoliageStyle(p,type,season,habit,shape);
 for(let i=0;i<crowns.length;i++){
  if((onlyCluster===null||i===onlyCluster)&&inTreeTier(i,tier))paintTreeCluster(c,crowns,i,style);
 }
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
 if(typeof document==='undefined'&&typeof OffscreenCanvas==='undefined'){paint(c,p);return;}
 const signature=[p.seed,p.x,p.y,treeType(p),p.treeVariant,p.realmPalette,forestSettings.branchSpread].join(':');
 let entry=woodSprites.get(signature);
 if(!entry){woodMisses++;entry={};if(woodSprites.size>=WOOD_SPRITE_LIMIT)woodSprites.delete(woodSprites.keys().next().value);}
 else {woodHits++;woodSprites.delete(signature);}woodSprites.set(signature,entry);
 if(!entry[part]){
  let x=tallPart?56:part==='branches'?48:22;
  const y=tallPart?146:part==='roots'?8:88;
  if(tallPart||part==='branches')for(const branch of forestTreeForm(p).branches){
   x=Math.max(x,Math.ceil(Math.abs(branch.tipX)+branch.thickness+6));
  }
  const canvas=treeRaster(x*2,y+16),pen=canvas.getContext('2d');
  pen.translate(x,y);paint(pen,p);entry[part]=canvas;
 }
 const sprite=entry[part];c.drawImage(sprite,-sprite.width/2,16-sprite.height);
}
let treeTierSurface;
function drawTallTreeTier(c,p,time,g,tier){
 const paint=pen=>{drawTreeWood(pen,p,tier);drawTreeFoliage(pen,p,time,g,tier);};
 if(c.globalAlpha===1||typeof document==='undefined'&&typeof OffscreenCanvas==='undefined'){paint(c);return;}
 // Fade the finished tier as one image so overlapping leaf clumps stay even.
 const x=104,y=163;
 treeTierSurface??=treeRaster(x*2,y+16);
 const pen=treeTierSurface.getContext('2d');
 pen.setTransform(1,0,0,1,0,0);pen.imageSmoothingEnabled=false;pen.clearRect(0,0,treeTierSurface.width,treeTierSurface.height);
 pen.translate(x,y);paint(pen);c.drawImage(treeTierSurface,-x,-y);
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
 const b=palmBase(p),s=p.size/64;c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(b.x),Math.round(b.y));c.scale(s,s);
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
