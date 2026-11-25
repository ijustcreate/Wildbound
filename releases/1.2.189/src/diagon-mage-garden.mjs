import {block as b,shape,line} from './diagon-shop-brush.mjs';
import {drawForestAsset} from './forest-props.mjs';
import {paintForestCanopy} from './forest-canopy-art.mjs';
import {drawTreeBranches,drawTreeTrunk} from './forest-tree-art.mjs';
import {makeTreeForm,treeStemAt} from './forest-tree-form.mjs';
import {drawSnowyOwl} from './snowy-owl-art.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {GARDEN_BENCHES,GARDEN_LAMPS,GARDEN_LAWN,GARDEN_PATHS,GARDEN_POOL,GARDEN_SHOP_APPROACH,GARDEN_STREET_APPROACH,GARDEN_TREES,MAGE_GARDEN_AREAS,gardenPathAt} from './diagon-garden-layout.mjs';
import {DIAGON_STREET} from './alley-street-layout.mjs';
import {drawGardenPool,paintGardenPoolStone} from './diagon-garden-pool.mjs';
import {gardenCatsFor} from './diagon-garden-cats.mjs';
import {inGardenPond} from './diagon-garden-ward.mjs';
import {drawGardenWardWater} from './diagon-garden-ward-art.mjs';

export {MAGE_GARDEN_AREAS,insideMageGarden,mageGardenBlocked,mageGardenFootstep} from './diagon-garden-layout.mjs';

const turf=['#3b523e','#425b43','#496247','#4e6649','#54714f','#5c7650'];
const treeStyles={
 cedar:{type:'oak',spread:1.55,width:1.32,height:1.14,colors:['#263e35','#304d41','#3a5a47','#476952','#577a5c','#71926b','#94a97e']},
 laurel:{type:'oak',spread:1.35,width:1.28,height:1.18,colors:['#2a402e','#385136','#45603c','#536f43','#66844e','#829957','#a1af6d']},
 lilac:{type:'maple',spread:1.62,width:1.44,height:1.24,colors:['#323744','#444659','#56566b','#66637d','#7d7492','#9988ab','#bca5c6']},
};
const spark=['#c5f2c9','#e8ddff','#a5ddc2','#b4bde4'];
const slabs=['#747c70','#807e72','#898776','#958d78','#9c957e'];
const gardenView={x:7395,y:4026,rx:450,ry:325};
const gardenLeft=Math.min(...MAGE_GARDEN_AREAS.map(a=>a.x));
const gardenRight=Math.max(...MAGE_GARDEN_AREAS.map(a=>a.x+a.w));
const beds=[
 {x:7198,y:4009,kind:'catmint',seed:2},{x:7236,y:3865,kind:'heather',seed:8},
 {x:7328,y:3951,kind:'daisy',seed:19},{x:7460,y:3987,kind:'catmint',seed:10},
 {x:7345,y:4040,kind:'reed',seed:22},{x:7428,y:4029,kind:'reed',seed:35},
 {x:7454,y:4093,kind:'reed',seed:17},{x:7352,y:4119,kind:'iris',seed:27},
 {x:7320,y:4130,kind:'heather',seed:40},{x:7250,y:4162,kind:'fern',seed:5},
 {x:7444,y:4215,kind:'iris',seed:41},{x:7448,y:3850,kind:'fern',seed:11},
 {x:7516,y:3950,kind:'daisy',seed:45},{x:7212,y:4103,kind:'heather',seed:6},
];

function grain(x,y){
 let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);
 n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}

function stroke(c,pts,width,ink){
 c.beginPath();c.moveTo(...pts[0]);for(const pt of pts.slice(1))c.lineTo(...pt);
 c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.strokeStyle=ink;c.stroke();
}

function paving(c){
 for(const [pad,ink] of [[7,'#2f493e'],[2,'#667466'],[0,'#777c6a']])for(const {points,width} of GARDEN_PATHS){
  stroke(c,points,width+pad,ink);
 }
 for(let y=GARDEN_LAWN.y+3;y<4294;y+=10){
  let x=gardenLeft-18+Math.floor(grain(y,271)*20);
  while(x<gardenRight){
   const n=grain(x,y),w=9+Math.round(n*12),h=7+(x%3===0?1:0);
   if(gardenPathAt(x+w/2,y+h/2,5)&&gardenPathAt(x+2,y+2,2)&&gardenPathAt(x+w-2,y+h-2,2)){
    shape(c,slabs[Math.floor(n*slabs.length)],[[x+2,y],[x+w-3,y],[x+w,y+2],[x+w-1,y+h-1],[x+3,y+h],[x,y+h-3]]);
    if(n>.29)b(c,x+3,y+1,w-8,1,'#aaa28a');
    if(n<.22)b(c,x+2,y+h-1,4,1,'#555e53');
   }
   x+=w+2;
  }
 }
}

function gardenGround(c){
 const lawn=GARDEN_LAWN;
 const {x,y,h}=GARDEN_STREET_APPROACH,mouth=DIAGON_STREET.x+7;
 const wing=[[x,y],[mouth-102,y],[mouth-77,y+4],[mouth-57,y+3],[mouth-34,y+9],[mouth-17,y+12],
  [mouth+3,y+16],[mouth+3,y+h-16],[mouth-20,y+h-14],[mouth-49,y+h-8],[mouth-73,y+h-4],
  [mouth-98,y+h],[x,y+h]];
 c.save();c.beginPath();for(const a of MAGE_GARDEN_AREAS)c.rect(a.x,a.y,a.w,a.h);c.clip();
 c.beginPath();c.rect(lawn.x,lawn.y,lawn.w,lawn.h);
 c.rect(GARDEN_SHOP_APPROACH.x,GARDEN_SHOP_APPROACH.y,GARDEN_SHOP_APPROACH.w,GARDEN_SHOP_APPROACH.h);
 c.moveTo(...wing[0]);for(const point of wing.slice(1))c.lineTo(...point);c.closePath();c.clip();
 b(c,gardenLeft,lawn.y,mouth+3-gardenLeft,lawn.h,turf[2]);
 for(let y=lawn.y+6;y<lawn.y+lawn.h;y+=15)for(let x=lawn.x+4;x<mouth;x+=16){
  const n=grain(x,y),px=x+Math.floor(n*8),py=y+Math.floor(grain(y,x)*7);
  if(n<.2)continue;
  b(c,px,py,3+Math.floor(n*9),2,turf[Math.floor(grain(y,x)*turf.length)]);
  if(n>.49){b(c,px+2,py-3,2,3,turf[4]);b(c,px+5,py-5,2,4,turf[n>.83?5:3]);}
  if(n>.92&&!gardenPathAt(px,py,4))b(c,px+4,py-6,2,2,n>.96?'#a59baf':'#82966d');
 }
 for(const {x,y,size} of GARDEN_TREES){
  shape(c,'#263e3760',[[x-size*.52,y],[x-size*.32,y-15],[x+size*.28,y-18],[x+size*.63,y-4],[x+size*.41,y+12],[x-size*.36,y+12]]);
 }
 for(const {x,y,kind} of beds){
  if(kind==='reed')continue;
  shape(c,'#384b3b',[[x-21,y-8],[x-9,y-15],[x+15,y-11],[x+23,y-1],[x+17,y+7],[x-12,y+7],[x-23,y+1]]);
  b(c,x-17,y+6,32,2,'#3d5441');
 }
 paving(c);
 for(let x=lawn.x+12;x<lawn.x+lawn.w-14;x+=21){
  const t=grain(x,254),y=lawn.y+5+Math.round(t*7);
  b(c,x,y,20,8,'#3e4c44');b(c,x+1,y-2,18,6,t>.7?'#687a6c':'#52665a');b(c,x+4,y-1,10,1,'#829480');
  if(t>.43){
   shape(c,'#314c3e',[[x-4,y+2],[x-1,y-5],[x+6,y-7],[x+14,y-4],[x+22,y],[x+17,y+7],[x+3,y+8]]);
   b(c,x+2,y-4,10,3,t>.72?'#71906b':'#536e53');b(c,x+12,y+1,6,2,'#647e5b');
   if(t>.86)b(c,x+6,y-3,2,2,'#b498bc');
  }
 }
 for(let y=lawn.y+17;y<lawn.y+lawn.h-15;y+=24){
  if(y<GARDEN_SHOP_APPROACH.y+GARDEN_SHOP_APPROACH.h&&y+20>GARDEN_SHOP_APPROACH.y)continue;
  b(c,lawn.x+4,y,8,20,'#43554a');b(c,lawn.x+5,y+2,4,17,'#61745f');
 }
 paintGardenPoolStone(c);
 c.restore();
}

function makeCanvas(w,h){
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');
 canvas.width=w;canvas.height=h;return canvas;
}

let terrain;
const treeRasters=new WeakMap();
function gardenTreeArt(o,index){
 const {type,spread,width,height,colors}=treeStyles[o.kind];
 const seed=grain(o.x,o.y)*1000,form=makeTreeForm(type,seed,spread);
 const trunk=form.trunk.map(([x,y,w])=>[x,y*height,w*1.18]);
 const branches=form.branches.map(branch=>({...branch,y:branch.y*height,elbowY:branch.elbowY*height,tipY:branch.tipY*height}));
 const crowns=form.crowns.map(([x,y,rx,ry])=>[x,y*height,rx*width,ry*1.08]);
 const side=index%2?-1:1;
 const perchY=-49+(grain(seed,31)-.5)*6,startY=-39+(grain(seed,32)-.5)*8;
 const perch={side,x:side*(19+index%3*6),y:perchY,startX:treeStemAt(trunk,startY)[0],startY,width:4+(grain(seed,33)-.5)*2};
 return {frames:[],seed,prop:{...o,seed,treeType:type},form:{trunk,branches},crowns,colors,perch};
}
function paintTree(c,sway,{prop,form,crowns,seed,colors}){
 drawTreeBranches(c,prop,form);
 drawTreeTrunk(c,prop,form);
 for(const [i,[x,y,rx,ry]] of crowns.entries()){
  const exposure=Math.min(.32,(-y-55)*.014)+(grain(seed,i)-.5)*.16;
  paintForestCanopy(c,x+sway,y,rx,ry,colors,seed+i*7.3,{exposure});
 }
}

function drawTree(c,o,time,index,owl=true){
 const phase=Math.floor(time*3+index*.7)%4,scale=o.size/110;
 let art=treeRasters.get(o);
 if(!art){art=gardenTreeArt(o,index);treeRasters.set(o,art);}
 const {frames}=art;
 if(!frames[phase]){
  const canvas=makeCanvas(180,130),pen=canvas.getContext('2d');pen.translate(90,120);
  paintTree(pen,[0,1,0,-1][phase],art);frames[phase]=canvas;
 }
 c.save();c.translate(o.x,o.y);c.scale(scale,scale);c.imageSmoothingEnabled=false;
 c.drawImage(frames[phase],-90,-120);
 if(owl&&[0,2,3,6].includes(index)){
  const {side,x,y,startX,startY,width}=art.perch;
  line(c,'#786f56',startX,startY,x+side*9,y-3,width);
  line(c,'#9c8860',startX,startY-2,x+side*5,y-2,1);
  drawSnowyOwl(c,{hp:1,x,y,faceX:-side,faceY:1,owlPhase:'perch',visualSeed:index+3},time,30);
 }
 c.restore();
}

const flowers={catmint:['#8585a5','#b5a1ca','#d8c0dc'],heather:['#926988','#c080a7','#e7a8bf'],
 daisy:['#d8b86f','#e9dec4','#f4e8c5'],iris:['#7168a9','#9e97cd','#ccc0e9']};
function drawBed(c,bed,g,time=g.time){
 const {x,y,kind,seed}=bed;
 if(kind==='fern'){
  drawForestAsset(c,{kind:'bush',forestAsset:'forest_round_shrub_small',x:x-12,y,rootY:y,size:41,variant:seed},time,g);
  for(let i=0;i<7;i++){
   const d=(i-3)*6,h=14+grain(seed,i)*14;
   line(c,'#3f674d',x,y,x+d,y-h,2);
   for(let j=1;j<5;j++){
    const px=x+d*j/5,py=y-h*j/5;
    line(c,j%2?'#71996a':'#567f55',px-5,py-2,px+5,py,2);
   }
  }
  return;
 }
 for(let i=0;i<(kind==='reed'?9:11);i++){
  const n=grain(seed,i),px=x-18+grain(i,seed)*36,py=y+Math.round(n*7)-4;
  const h=kind==='reed'?17+n*15:7+n*17,tip=px+Math.sin(time*.8+n*3)*1.8;
  line(c,'#384d41',px,py,tip,py-h,2);line(c,'#7c9c63',px,py-2,tip,py-h+2,1);
  line(c,'#648458',px,py-4,px+(i%2?5:-4),py-10,2);
  if(kind==='reed'){
   if(i%3===0){b(c,tip-1,py-h-4,3,7,'#6f614a');b(c,tip,py-h-4,1,4,'#ac9271');}
   continue;
  }
  const colors=flowers[kind],tone=i%3;
  b(c,tip-2,py-h-1,5,3,colors[tone]);b(c,tip-1,py-h-3,3,6,colors[(tone+1)%3]);
  if(kind==='daisy')b(c,tip,py-h,1,2,colors[0]);
 }
}

function drawBench(c,{x,y,w}){
 shape(c,'#20382c80',[[x-w-4,y-6],[x+w-6,y-6],[x+w+8,y+5],[x-w+5,y+8]]);
 for(const side of [-1,1]){
  const a=x+side*(w-6);
  b(c,a-3,y-21,6,24,'#383e3c');b(c,a-2,y-16,2,21,'#717a6d');
  shape(c,'#465554',[[a-7,y-12],[a+5,y-12],[a+7,y-8],[a+2,y-6],[a-5,y-7]]);
 }
 b(c,x-w+1,y-22,w*2-2,6,'#574537');b(c,x-w+2,y-21,w*2-4,3,'#ad8a60');
 b(c,x-w+2,y-13,w*2-4,9,'#6b4d3c');b(c,x-w+3,y-13,w*2-6,3,'#b29269');
 b(c,x-w+3,y-8,w*2-6,2,'#997954');
}

function drawLamp(c,{x,y},time){
 const pulse=(Math.sin(time*2.7+x)*.5+.5)*.18;
 b(c,x-7,y-2,14,5,'#384940');b(c,x-3,y-44,6,44,'#4c5961');b(c,x-2,y-44,2,42,'#8d9890');
 shape(c,'#35474e',[[x-11,y-56],[x,y-64],[x+11,y-56],[x+7,y-41],[x-7,y-41]]);
 c.save();c.globalAlpha=.4+pulse;b(c,x-9,y-56,18,15,'#7cbbb0');c.restore();
 b(c,x-5,y-55,10,11,'#a5d8c8');b(c,x-1,y-55,2,9,'#e8edcd');b(c,x-8,y-58,16,2,'#afae91');
}

function gardenSign(c){
 const x=7632,y=3982,name='WANDMAKER’S GARDEN';
 for(const side of [-1,1]){b(c,x+side*56-3,y-27,6,33,'#393f37');b(c,x+side*56-2,y-28,2,30,'#a08c61');}
 shape(c,'#303e34',[[x-64,y-36],[x-58,y-42],[x+58,y-42],[x+64,y-36],[x+61,y-24],[x-61,y-24]]);
 b(c,x-59,y-39,118,12,'#546d55');b(c,x-56,y-38,112,1,'#96a373');
 drawPixelChatText(c,name,x-pixelChatTextWidth(name)/2,y-36,'#e3d9a8');
}

export function prepareMageGardenGround(){
 if(terrain||typeof document==='undefined'&&typeof OffscreenCanvas==='undefined')return;
 terrain=makeCanvas(gardenRight-gardenLeft,GARDEN_LAWN.h);
 const pen=terrain.getContext('2d');pen.translate(-gardenLeft,-GARDEN_LAWN.y);gardenGround(pen);
}

export function drawMageGardenGround(c,g,visible,animator){
 const {x,y,rx,ry}=gardenView;
 if(!visible(x,y,rx,ry))return;
 prepareMageGardenGround();
 if(terrain){c.imageSmoothingEnabled=false;c.drawImage(terrain,gardenLeft,GARDEN_LAWN.y);}else gardenGround(c);
 if(!visible(GARDEN_POOL.x,GARDEN_POOL.y,74,58))return;
 const donors=[];
 for(const [i,tree] of GARDEN_TREES.entries()){
  if(Math.abs(tree.x-GARDEN_POOL.x)>120||tree.y<GARDEN_POOL.y-112||tree.y>GARDEN_POOL.y)continue;
  donors.push({...tree,half:tree.size*.8,paint:(pen,time)=>drawTree(pen,tree,time,i,false)});
 }
 for(const bed of beds)if(bed.kind==='reed'&&bed.y<=GARDEN_POOL.y){
  donors.push({...bed,half:24,depth:34,paint:(pen,time)=>drawBed(pen,bed,g,time)});
 }
 if(animator)for(const p of g.players)if(p.hp>0&&!inGardenPond(p)&&Math.abs(p.x-GARDEN_POOL.x)<88&&p.y>=GARDEN_POOL.y-78&&p.y<GARDEN_POOL.y){
  donors.push({x:p.x,y:p.y,half:30,depth:56,paint:pen=>animator.draw(pen,p,g.time,43)});
 }
 drawGardenPool(c,g.time,donors,g);
 drawGardenWardWater(c,g.players,g.time);
}

export function queueMageGarden(c,g,visible,world){
 const {x,y,rx,ry}=gardenView;
 if(!visible(x,y,rx,ry))return;
 for(const [i,o] of GARDEN_TREES.entries())if(visible(o.x,o.y,105,140))world.push({depth:o.y,paint:()=>drawTree(c,o,g.time,i)});
 for(const o of GARDEN_BENCHES)if(visible(o.x,o.y,34,29))world.push({depth:o.y,paint:()=>drawBench(c,o)});
 for(const o of GARDEN_LAMPS)if(visible(o.x,o.y,22,69))world.push({depth:o.y,paint:()=>drawLamp(c,o,g.time)});
 for(const bed of beds)if(visible(bed.x,bed.y,24,40))world.push({depth:bed.y,paint:()=>drawBed(c,bed,g)});
 if(visible(7632,3982,65,48))world.push({depth:3986,paint:()=>gardenSign(c)});
 for(const actor of gardenCatsFor(g)){
  if(visible(actor.x,actor.y,35,48))world.push({depth:actor.y,player:actor,size:36});
 }
 for(let i=0;i<34;i++){
  const x=7160+grain(i,1)*407+Math.sin(g.time*.8+i)*15,y=3830+grain(i,2)*385,age=(g.time*.36+grain(i,11))%1;
  if(!visible(x,y,15,62))continue;
  world.push({depth:y,paint:()=>{
   const py=y-9-age*51;
   c.save();c.globalAlpha=Math.sin(age*Math.PI)*.74;
   b(c,x,py,i%5===0?3:2,2,spark[i%spark.length]);
   if(i%5===0){b(c,x-2,py+1,7,1,spark[i%spark.length]);b(c,x+1,py-2,1,6,spark[i%spark.length]);}
   c.restore();
  }});
 }
}
