import {forestHash} from './forest-landscape.mjs';
import {drawCastleStack} from './wild-castle-stack.mjs';
import {drawGreyhavenFixture,drawGreyhavenStore} from './wild-castle-furniture-stacks.mjs';

const stone=['#373e3a','#515752','#575e56','#60635b','#666963'];
const wood=['#482d21','#513624','#5d3e29','#684630','#755338'];
const masonry={base:'#2a2a27',shade:'#484438',face:'#645b4a',edge:'#99866a',crest:'#83765f'};
const brass={edge:'#413223',deep:'#795230',mid:'#b48445',lit:'#e4c180'};
const carpets={
 lion:['#552c2a','#743631','#8d4739','#b58549'],crest:['#4b292a','#68302c','#8d4837','#c09250'],
 runner:['#552d29','#783c33','#995744','#bf955c'],arcaneRug:['#353247','#48405b','#66516d','#96809a'],
};
const cachedFloor=new WeakMap();
const slabStamps=new Map();

function fill(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function polygon(c,color,points){
 c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();
}
function foot(c,color,x,y,rx,ry){
 polygon(c,color,[[x-rx,y-ry*.5],[x-rx*.6,y-ry],[x+rx*.6,y-ry],[x+rx,y-ry*.5],[x+rx,y+ry*.5],[x+rx*.6,y+ry],[x-rx*.6,y+ry],[x-rx,y+ry*.5]]);
}
function footprint(plan){
 const p=new Path2D();
 for(const f of plan.floors){
  if(!f.r){p.rect(f.x,f.y,f.w,f.h);continue;}
  for(let i=0;i<48;i++){
   const a=i*Math.PI/24,x=Math.round((f.x+Math.cos(a)*f.r)/2)*2,y=Math.round((f.y+Math.sin(a)*f.r)/2)*2;
   if(i===0)p.moveTo(x,y);else p.lineTo(x,y);
  }
  p.closePath();
 }
 return p;
}
function flagstones(c,x,y,w,h,palette=stone,cellW=26,cellH=21){
 fill(c,palette[0],x,y,w,h);
 const woodGrain=palette===wood;
 for(let py=y,row=0;py<y+h;row++){
  const height=woodGrain?cellH:cellH-4+Math.floor(forestHash(py,x)*8);
  for(let px=x-Math.floor(cellW*forestHash(row,y));px<x+w;){
   const width=cellW-5+Math.floor(forestHash(px,py+11)*11);
   const rx=Math.max(x,px+1),ry=py+1,rw=Math.min(x+w,px+width-1)-rx,rh=Math.min(y+h,py+height-1)-ry;
   const n=forestHash(px,py),shade=palette[1+Math.floor(n*(palette.length-1))];
   px+=width;
   if(rw<=1||rh<=1)continue;
   if(rw<6||rh<6){fill(c,shade,rx,ry,rw,rh);continue;}
   drawCastleStack(c,rx,ry+2,slabLayers(rw,rh,shade,palette[0],woodGrain,woodGrain?0:Math.floor(n*4)));
   fill(c,woodGrain?'#d7a77923':'#bec4a928',rx+Math.floor(n*(rw-5)),ry+3+Math.floor(n*(rh-5)),2+Math.floor(n*4),1);
   if(n>.74){
    const markX=rx+2+Math.floor(n*(rw-7)),markY=ry+rh-4;
    fill(c,'#252a253b',markX,markY,4,1);
    if(!woodGrain)fill(c,'#252a253b',markX-2,markY-1,2,1);
   }
  }
  py+=height;
 }
}
function slabLayers(w,h,shade,grout,woodGrain,variant){
 const key=`${w},${h},${shade},${grout},${woodGrain},${variant}`;
 let layers=slabStamps.get(key);
 if(!layers){
  const chip=woodGrain?1:1+variant, opposite=woodGrain?1:4-variant;
  const topPixels=[
   [chip,0,w-chip-opposite,1,shade],[Math.max(0,chip-2),1,w-Math.max(0,chip-2)-Math.max(0,opposite-2),1,shade],
   [0,2,w,h-5,shade],[opposite,h-3,w-opposite-1,1,shade],
   [opposite+1,h-2,w-opposite-3,1,shade],
   [chip,0,w-chip-opposite,1,woodGrain?'#d2a27852':'#c1c8a855'],[0,2,1,h-6,'#e1d6ab26'],
  ];
  layers=[
   [[0,0,w,h-2,grout],[1,0,w-2,h-2,'#151c1b40']],
   [[0,1,w,h-3,shade],[1,0,w-2,h-1,shade],[1,h-3,w-2,2,'#2225215c']],
   topPixels,
  ];
  if(slabStamps.size>=512)slabStamps.delete(slabStamps.keys().next().value);
  slabStamps.set(key,layers);
 }
 return layers;
}
function planks(c,x,y,w,h){
 flagstones(c,x,y,w,h,wood,44,9);
 for(let row=7;row<h-3;row+=9)for(let col=5;col<w-4;col+=23){
  const n=forestHash(x+col,y+row);
  fill(c,n>.59?'#dcb47331':'#2c281e42',x+col,y+row,Math.min(w-col,3+Math.floor(n*12)),1);
 }
}
const motif=[
 '       ##   ','      ####  ','   #  ###   ','  ## ##### #','   #####  ##','     ### ## ','     ###### ','    ######  ',
 '   ### ##   ','  ###  ##   ','  ##   ###  ',' ###    ### ',' ##      #  ',
];
const crestMotif=[
 '          ## ##   ','         #######  ','        #### #### ','  ##    ########  ',
 ' ###    #######   ','   ##    ##### ## ','    ##  ####  ### ','     ### #####    ',
 '       ####### ## ','       ########## ','      ######      ','     ##### #      ',
 '    #######       ','    #######       ','   ###  ###       ','  ###    ###      ',
 ' ###      ###     ','####       ####   ',
];
function lion(c,x,y,s,color){
 const crest=s>=3?crestMotif:motif,width=crest[0].length;
 crest.forEach((line,row)=>[...line].forEach((pixel,col)=>{if(pixel==='#'){
  const xx=x+(col-width/2)*s,yy=y+(row-crest.length/2)*s;
  fill(c,color,xx,yy,s,s);
  if(s>=3&&forestHash(row,col)>.64)fill(c,'#5d3a2b37',xx+s-1,yy,1,s);
 }}));
}
function rug(c,{x,y,w,h,kind},dim=false){
 const [border,body,highlight,gold]=carpets[kind];
 c.save();if(dim)c.globalAlpha=.46;
 fill(c,'#251f1c9c',x-2,y+4,w+5,h);
 const felt=[[0,2,w,h-4,border],[2,0,w-4,h,border],[3,3,w-6,h-6,gold],[5,5,w-10,h-10,body]];
 drawCastleStack(c,x,y+2,[[[1,0,w-2,h-1,'#332522']],[[0,1,w,h-2,border]],felt]);
 fill(c,highlight,x+9,y+9,w-18,2);fill(c,highlight,x+9,y+h-11,w-18,2);
 fill(c,highlight,x+9,y+9,2,h-18);fill(c,highlight,x+w-11,y+9,2,h-18);
 for(let i=12;i<h-12;i+=7)for(const d of [0,w-19]){
  fill(c,highlight,x+7+d,y+i+1,5,1);fill(c,highlight,x+9+d,y+i,1,3);
  if(i%14===5)fill(c,gold,x+9+d,y+i+1,1,1);
 }
 for(let i=12;i<w-12;i+=8)for(const d of [0,h-20])fill(c,highlight,x+i,y+8+d,3,3);
 for(let row=15;row<h-14;row+=5)for(let col=15;col<w-14;col+=9){
  const wear=1-Math.min(1,Math.abs(col-w/2)/(w*.39)),n=forestHash(col+x,row+y);
  if(n>.69-wear*.23)fill(c,n>.91?'#40242542':'#edc49523',x+col+(row%4),y+row,2+Math.floor(n*3),1);
 }
 if(kind==='crest'||kind==='arcaneRug'){
  const rx=w*.30,ry=h*.33,cx=x+w/2,cy=y+h/2;
  foot(c,highlight,cx,cy,rx+4,ry+4);foot(c,body,cx,cy,rx,ry);
  foot(c,gold,cx,cy,rx-6,ry-6);foot(c,body,cx,cy,rx-8,ry-8);
 }
 if(kind==='lion'||kind==='crest')lion(c,x+w/2,y+h/2,Math.max(1,Math.floor(Math.min(w,h)/(kind==='crest'?27:24))),gold);
 for(let i=4;i<w-4;i+=3){
  const length=2+Math.floor(forestHash(x+i,y)*3);
  fill(c,border,x+i,y-length,2,length);fill(c,border,x+i,y+h,2,length+1);
  fill(c,i%2===0?gold:highlight,x+i,y-length+1,1,length-1);
  fill(c,i%2===0?gold:highlight,x+i,y+h,1,length);
 }
 c.restore();
}
function radialLight(c,x,y,r,color){
 const g=c.createRadialGradient(x,y,4,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#dd9b4900');
 fill(c,g,x-r,y-r,r*2,r*2);
}
function floorLight(c,x,y,w,h,core,edge){
 c.save();c.translate(x,y);c.scale(1,h/w);
 const g=c.createRadialGradient(0,0,6,0,0,w);
 g.addColorStop(0,core);g.addColorStop(.45,edge);g.addColorStop(1,'#f5c17600');
 fill(c,g,-w,-w,w*2,w*2);c.restore();
}
function wearPaving(c,plan){
 const lanes=plan.story===2?[[345,373,97],[615,373,97],[485,593,94]]:[[481,610,93],[352,393,154],[608,393,154]];
 for(const [x,y,length] of lanes)for(let i=0;i<length;i+=5){
  const n=forestHash(x+i,y),dx=Math.round((n-.5)*34),py=y+i-length/2;
  fill(c,n>.36?'#bdad8b27':'#2a2d392f',x+dx,py,3+Math.floor(n*8),1+(i%3===0));
 }
}
function threshold(c,{x,y,w,h}){
 fill(c,'#261f22a3',x-4,y+2,w+9,h-1);fill(c,'#5e594d',x-3,y+1,w+6,h-1);
 for(let i=4;i<h-4;i+=14){
  fill(c,'#938575',x-2,y+i,w+4,1);fill(c,'#27282a75',x-2,y+i+11,w+4,1);
 }
 fill(c,'#b8a280',x-3,y+1,2,h-1);fill(c,'#3e3d38',x+w+2,y+1,2,h-1);
}
function architectureShadows(c,plan){
 for(const p of plan.walls){
  const {x,y,w,h,kind,profile}=p;
  const cast=kind==='rail'?11:kind==='tower'?6:profile==='rear'?16:profile==='cutaway'?8:12;
  const skew=Math.ceil(cast*.52);
  const right=x+w,bottom=y+h;
  polygon(c,'#24253055',[[x,y+1],[right,y+1],[right+skew,bottom+cast],[x+skew,bottom+cast],[x,bottom+2]]);
  polygon(c,'#171a2194',[[x,y+1],[right,y+1],[right+Math.ceil(skew*.47),bottom+4],[x+2,bottom+4]]);
  if(kind==='rail'&&w>h){
   for(let i=7;i<w-4;i+=12)fill(c,'#191a2270',x+i+4,bottom+4,2,7);
  }
 }
}
function sourceLights(c,plan){
 fill(c,'#171f3249',48,46,866,683);
 for(const p of plan.furniture){
  const x=p.x+p.w/2,y=p.y+p.h*.65;
  if(p.kind==='sconce')floorLight(c,x+3,y+8,63,75,'#ffd18480','#cf863337');
  if(p.kind==='hearth'||p.kind==='greatHearth'){
   const great=p.kind==='greatHearth';
   floorLight(c,x,y+(great?31:18),great?103:76,great?128:74,'#ffd0789a','#df7e363e');
   floorLight(c,x,y+8,great?39:29,41,'#ffb9555b','#dd753718');
  }
  if(p.kind==='feast'||p.kind==='dining'||p.kind==='roundTable')floorLight(c,x,y,61,47,'#e9a45248','#a6652928');
  if(p.kind==='orb')floorLight(c,x,y,69,63,'#91d9ff88','#4384d250');
 }
}
function drawLanding(c,{x,y,w,h},outer=false){
 const rows=4,depth=Math.ceil(h/rows),maxRise=outer?4:8,layers=Array.from({length:maxRise+1},()=>[]);
 fill(c,'#171e26ad',x+4,y+6,w+6,h+4);
 for(let i=0;i<rows;i++){
  const localY=i*depth,slabDepth=Math.min(depth,h-localY),rise=(rows-i)*(outer?1:2);
  const edge=i%2?'#a39276':'#ad9f83',face=i%2?'#6b6356':'#766d5e';
  for(let z=0;z<rise;z++)layers[z].push([0,localY,w,slabDepth,z%2?'#4f4b44':'#47443c']);
  layers[rise].push([0,localY,w,slabDepth,face],
   [1,localY,w-2,1,edge],[1,localY+slabDepth-1,w-2,1,'#373734'],[w-2,localY,2,slabDepth,'#544c41']);
  for(let joint=1;joint<6;joint++){
   const jx=Math.floor(joint*w/6)+(i%2)*3;
   layers[rise].push([jx,localY+1,1,slabDepth-2,'#4b463f'],[jx+2,localY+2,3,1,'#8d806644']);
  }
 }
 drawCastleStack(c,x,y,layers);
}
function drawAtrium(c,{x,y,w,h},runner){
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
 flagstones(c,x,y,w,h,['#171923','#242730','#2b2d33','#33343b','#39373a']);
 if(runner)rug(c,runner,true);
 floorLight(c,x+26,y+h*.49,72,63,'#af76484d','#9660382c');
 floorLight(c,x+w-26,y+h*.49,72,63,'#af76484d','#9660382c');
 const drop=33;
 polygon(c,'#22252b',[[x,y],[x+w,y],[x+w-12,y+drop],[x+12,y+drop]]);
 polygon(c,'#30323a',[[x,y],[x+14,y+drop],[x+14,y+h-15],[x,y+h]]);
 polygon(c,'#1d2029',[[x+w,y],[x+w-14,y+drop],[x+w-14,y+h-15],[x+w,y+h]]);
 for(let i=8;i<drop;i+=7){
  const inset=Math.floor(i*.42);
  fill(c,i%2?'#3c3d43':'#171a22',x+inset,y+i,w-2*inset,1);
  for(let j=23+(i%2)*11;j<w-15;j+=26)fill(c,'#151821a0',x+j,y+i,1,6);
 }
 fill(c,'#9a866563',x+7,y+1,w-14,2);
 fill(c,'#090b10aa',x+14,y+drop,w-28,3);
 fill(c,'#11121c',x,y+h-2,w,4);
 const g=c.createLinearGradient(x,y,x,y+h);
 g.addColorStop(0,'#10111a7f');g.addColorStop(.54,'#1513231a');g.addColorStop(1,'#090d19ad');
 fill(c,g,x,y,w,h);c.restore();
}
function throneDais(c,{x,y,w,h}){
 const corners=[[x+14,y],[x+w-14,y],[x+w,y+14],[x+w,y+h-16],[x,y+h-16],[x,y+14]];
 polygon(c,'#2520218c',corners.map(([px,py])=>[px+7,py+10]));
 polygon(c,'#655d50',corners.map(([px,py])=>[px,py+5]));
 c.save();c.beginPath();c.moveTo(...corners[0]);
 for(const corner of corners.slice(1))c.lineTo(...corner);
 c.closePath();c.clip();
 flagstones(c,x,y,w,h-15,['#6c6355','#796e5c','#897d67','#948871','#a09376'],29,21);
 fill(c,'#b1a489',x+14,y,w-28,2);
 fill(c,'#5d574e',x,y+h-22,w,3);
 fill(c,'#44252b9a',x+29,y+11,w-58,h-34);
 fill(c,'#a4744c',x+31,y+12,2,h-36);
 fill(c,'#a4744c',x+w-33,y+12,2,h-36);
 fill(c,'#6e343c',x+33,y+12,w-66,h-36);
 c.restore();
 drawLanding(c,{x:x+8,y:y+h-25,w:w-16,h:24});
}
function paintFloor(c,plan){
 const shape=footprint(plan);
 c.save();c.clip(shape);
 flagstones(c,50,49,860,682);
 for(const f of plan.zones){
  if(f.kind==='timber'||f.kind==='cellar')planks(c,f.x,f.y,f.w,f.h);
  else if(f.kind==='kitchen')flagstones(c,f.x,f.y,f.w,f.h,['#4a4135','#564839','#645342','#6f5945','#786049'],18,15);
  else if(f.kind==='solar')flagstones(c,f.x,f.y,f.w,f.h,['#4a443d','#585043','#655747','#75644f','#7c6b56']);
  else if(f.kind==='banquet')flagstones(c,f.x,f.y,f.w,f.h,['#484238','#594c3d','#615440','#6b5b46','#77634b']);
 }
 wearPaving(c,plan);
 for(const r of plan.rugs)rug(c,r);
 if(plan.dais)throneDais(c,plan.dais);
 for(const doorway of plan.doorways)threshold(c,doorway);
 if(plan.entrance)drawLanding(c,{x:431,y:698,w:98,h:24},true);
 if(plan.steps){
  const {x,y,w,h}=plan.steps;
  polygon(c,'#141b25aa',[[x-6,y-4],[x+w+12,y-4],[x+w+14,y+h+10],[x-3,y+h+10]]);
  fill(c,'#746b58',x-6,y-7,w+12,2);fill(c,'#41423d',x-6,y-5,w+12,3);
  drawLanding(c,plan.steps);
 }
 for(const tower of plan.towerCenters)drawCastleSpiral(c,tower,plan.stairs.filter(stairs=>stairs.link===tower.link));
 architectureShadows(c,plan);
 sourceLights(c,plan);
 for(const atrium of plan.voids)drawAtrium(c,atrium,plan.lowerHallRug);
 c.restore();
}
export function drawCastleFloor(c,plan){
 if(typeof document==='undefined'){paintFloor(c,plan);return;}
 let layer=cachedFloor.get(plan);
 if(!layer){
  layer=document.createElement('canvas');layer.width=960;layer.height=768;
  paintFloor(layer.getContext('2d'),plan);cachedFloor.set(plan,layer);
 }
 c.drawImage(layer,0,0);
}

const stairShade=['#3c4142','#545550','#696357','#7b715f','#918267'];
const spiralStamps=new Map();
function spiralLayers(startAngle){
 let layers=spiralStamps.get(startAngle);
 if(layers)return layers;
 const count=21,radius=64,stepSize=2,turn=Math.PI*2;
 layers=Array.from({length:15},()=>[]);
 for(let y=-radius;y<radius;y+=stepSize){
  let left=-radius,last=-1;
  for(let x=-radius;x<=radius;x+=stepSize){
   const distance=Math.hypot(x+1,y+1);
   const tread=((Math.atan2(y+1,x+1)-startAngle+turn*2)%turn)/turn*count;
   const lip=tread%1<.12?1:distance>60?2:0;
   const part=x<radius&&distance>11&&distance<=radius?Math.floor(tread)*3+lip:-1;
   if(part===last)continue;
   if(last>=0){
     const index=Math.floor(last/3),shaft=index<3,rise=shaft?1+index:Math.min(14,3+Math.floor((index-2)*.74));
     const color=shaft?(last%3===1?'#686358':last%3===2?'#3b4044':'#40424a'):last%3===1?(index<9?'#79766b':'#b3a384'):
     last%3===2?'#474840':stairShade[Math.floor(index/count*stairShade.length)];
    for(let z=0;z<rise;z++)layers[z].push([left,y,x-left,stepSize,z%3===0?'#393a38':'#57564d']);
    layers[rise].push([left,y,x-left,stepSize,color]);
   }
   left=x;last=part;
  }
 }
 spiralStamps.set(startAngle,layers);
 return layers;
}
const newelLayers=Array.from({length:22},(_,z)=>{
 const w=z<2?21:z<17?15:19,shade=z<2?'#373935':z===21?'#a69679':z%6===0?'#574f45':'#786f5d';
 const r=Math.floor(w/2);
 return [[-r+2,-r,w-4,w,shade],[-r,-r+3,w,w-6,shade],[r-3,-r+2,2,w-4,'#413e35'],[-r+2,-r+2,1,w-4,'#aa9b7f']];
});
function drawCastleSpiral(c,{x,y,side},stairs){
 const entryAngle=Math.atan2(y<380?29:-29,side*41),startAngle=entryAngle+.29;
 foot(c,'#171c238c',x+2,y+5,64,63);
 drawCastleStack(c,x,y,spiralLayers(startAngle));
 const at=(radius,delta,dy=0)=>[x+Math.cos(entryAngle+delta)*radius,y+Math.sin(entryAngle+delta)*radius+dy];
 polygon(c,'#3d3b37',[at(35,-.30),at(78,-.27),at(78,.32),at(35,.30)]);
 polygon(c,'#88816e',[at(35,-.28,-3),at(77,-.25,-3),at(77,.30,-3),at(35,.28,-3)]);
 polygon(c,'#aa9f88',[at(45,-.20,-3),at(77,-.21,-3),at(77,-.19,-3),at(45,-.17,-3)]);
 foot(c,'#25252bca',x+3,y+5,15,11);
 drawCastleStack(c,x,y,newelLayers,{lift:.7});
 for(const s of stairs){
  const cx=s.x+s.w/2+side*7,cy=s.y+s.h/2+(Math.abs(s.y+s.h/2-y)<15?13:0);
  foot(c,'#4c463d',cx,cy+1,7,4);foot(c,'#938164',cx,cy,6,3);
  polygon(c,'#edce9a',[[cx-4,cy+s.direction],[cx,cy-s.direction*3],[cx+4,cy+s.direction]]);
 }
}

const masonryStamps=new Map();
function wallLayers(w,h,kind,profile='side'){
 const key=`${kind},${profile},${w},${h}`;
 let layers=masonryStamps.get(key);
 if(layers)return layers;
 const major=kind==='outer',horizontal=w>=h;
 const height=kind==='jamb'?18:profile==='rear'?(major?27:22):profile==='cutaway'?(major?12:10):major?18:14;
 layers=Array.from({length:height+1},(_,z)=>{
  const footing=z<2,shoulder=z===height-1,face=z%5===0?'#4a4943':kind==='jamb'?'#847664':masonry.face;
  const layer=[[footing||shoulder?-1:0,0,w+(footing||shoulder?2:0),h,footing?masonry.base:face]];
  if(!footing){
   layer.push([0,0,2,h,major?'#817967':'#766a58'],[w-2,0,2,h,'#4a463d']);
   const jointSpacing=horizontal?23:7;
   for(let joint=6+Math.floor(z/5)%2*8;joint<w-1;joint+=jointSpacing){
    layer.push([joint,h-1,1,1,'#424039']);
    if(z%5===2)layer.push([joint+2,h-1,4,1,'#9d8b6b5e']);
   }
  }
  return layer;
 });
 const coping=[[0,0,w,h,profile==='cutaway'?'#746f62':masonry.crest],[1,0,w-2,1,'#ae9d7f'],[0,1,1,h-2,masonry.edge],[1,h-2,w-2,2,'#5c5345']];
 if(kind==='jamb')coping.push([1,0,w-2,h,'#a6977e'],[1,0,w-2,1,'#c5b797']);
 const run=horizontal?w:h;
 for(let joint=13;joint<run-5;joint+=21){
  coping.push(horizontal?[joint,1,1,h-3,'#635a4c']:[1,joint,w-3,1,'#635a4c']);
  coping.push(horizontal?[joint+2,2,7,1,'#ac9d7d87']:[2,joint+2,w-6,1,'#ac9d7d87']);
 }
 layers[height]=coping;
 if(major&&horizontal&&profile==='rear'){
  for(let z=0;z<6;z++){
   const crenels=[];
   for(let i=0;i<w;i+=36){
    const width=Math.min(16,w-i),dark=z<2||z===3;
    crenels.push([i,0,width,Math.min(h-1,7),dark?masonry.shade:masonry.crest]);
    if(z===5)crenels.push([i,0,width,1,'#b0a182']);
   }
   layers.push(crenels);
  }
 }
 masonryStamps.set(key,layers);
 return layers;
}
function post(c,x,y,w,h){
 drawCastleStack(c,x,y,wallLayers(w,h,'post'));
}

const railingStamps=new Map();
function railingLayers(w,h){
 const key=`${w},${h}`;
 let layers=railingStamps.get(key);
 if(layers)return layers;
 const vertical=h>w,length=vertical?h:w,offset=Math.floor((Math.min(w,h)-5)/2);
 const railTop=vertical?[offset,0,5,h]:[0,offset,w,5];
 const balusters=[],piers=[];
 for(let i=6;i<length-5;i+=12)balusters.push(vertical?[offset+1,i,3,3]:[i,offset+1,3,3]);
 for(let i=4;i<length;i+=72)piers.push(vertical?[offset-1,Math.min(i,length-7),7,6]:[Math.min(i,length-7),offset-1,6,7]);
 piers.push(vertical?[offset-1,length-7,7,6]:[length-7,offset-1,6,7]);
 layers=[[[0,0,w,h,'#423d35']],[[0,1,w,h-1,'#74634b']]];
 for(let z=2;z<15;z++){
  const body=z%5===0?'#65513e':'#95805f';
  const layer=balusters.flatMap(([x,y,width,depth])=>[
   [x,y,width,depth,body],[x,y,1,depth,'#bca079'],[x+width-1,y,1,depth,'#584832'],
  ]);
  if(z===5||z===6)layer.push([...railTop,z===5?'#514235':'#8d7555']);
  for(const pier of piers)layer.push([...pier,z%7===0?'#554a3a':'#8b7a61']);
  layers.push(layer);
 }
 layers.push([[...railTop,'#6e5a44']],[[...railTop,'#a38860'],
  [railTop[0],railTop[1],vertical?1:w,vertical?h:1,'#c4ac85']],
  piers.map(pier=>[...pier,'#8a785e']),piers.flatMap(([x,y,width,depth])=>[
   [x-1,y-1,width+2,depth+1,'#a49377'],[x,y-1,width,1,'#d2bc97'],
  ]));
 railingStamps.set(key,layers);
 return layers;
}
function rail(c,{x,y,w,h}){
 fill(c,'#251f1ca8',x+2,y+2,w+3,h+2);
 drawCastleStack(c,x,y,railingLayers(w,h));
}
export function castleWall(c,p){
 const {x,y,w,h,kind,profile}=p;
 if(kind==='rail'){rail(c,p);return;}
 if(kind==='tower'){
  drawCastleStack(c,x,y,wallLayers(w,h,kind,y>p.towerY?'cutaway':'rear'));
  fill(c,'#514940',x+2,y+h-4,w-3,2);return;
 }
 drawCastleStack(c,x,y,wallLayers(w,h,kind,profile));
}

function plate(c,x,y,r,type){
 foot(c,'#3828219f',x+1,y+1,r+1,r*.65);
 foot(c,'#8d7e69',x,y,r,r*.65);foot(c,'#c4b58f',x,y-1,r-1,r*.56);foot(c,'#685a45',x,y,r-3,r*.38);
 if(type<0)return;
 if(type%4===0){foot(c,'#a3583b',x,y-1,r*.61,r*.35);fill(c,'#db9762',x-r*.39,y-2,r*.59,2);}
 else if(type%4===1){foot(c,'#c2874c',x,y-1,r*.55,r*.33);fill(c,'#edbd77',x-r*.3,y-2,r*.54,1);}
 else if(type%4===2){foot(c,'#6f7844',x,y-1,r*.65,r*.37);fill(c,'#b99b54',x-2,y-2,2,2);fill(c,'#b26345',x+2,y-1,3,2);}
 else{foot(c,'#b56343',x-2,y-1,r*.39,r*.3);foot(c,'#d09551',x+2,y,r*.38,r*.32);}
}
function candle(c,x,y,time,i){
 fill(c,brass.deep,x-2,y-2,5,3);fill(c,'#d9c38e',x-1,y-8,3,7);
 const f=Math.floor(time*9+i)%3;
 fill(c,'#c47933',x-1+Number(f===1),y-12,3,4);fill(c,'#ffdf98',x,y-11-Number(f===0),2,4);
}
function chair(c,p){
 const {x,y,w,h,faceX,faceY,variant}=p;
 if(variant==='stool'){drawGreyhavenFixture(c,p,'stool');return;}
 if(faceY===1){drawGreyhavenFixture(c,p,'chair');return;}
 const oak='#755038',edge='#392d2a',light='#a57852',velvet='#7f4139';
 c.save();c.translate(x,y);
 if(faceX<0){c.translate(w,0);c.scale(-1,1);}
 foot(c,'#261f2091',w/2+2,h-2,w/2+1,4);
 for(const xx of [1,w-4]){
  fill(c,edge,xx,5,3,h-5);
  fill(c,oak,xx,5,2,h-7);
 }
 fill(c,edge,1,4,w-2,9);fill(c,oak,2,3,w-4,8);
 fill(c,velvet,3,3,w-6,6);fill(c,'#ad6050',4,3,w-8,1);
 if(faceX){
  fill(c,edge,-1,-8,5,22);fill(c,oak,0,-7,3,18);
  fill(c,light,0,-7,2,3);fill(c,velvet,2,-5,2,9);
 }else{
  fill(c,edge,0,-1,w,11);fill(c,oak,1,0,w-2,8);
  fill(c,light,1,0,w-2,2);fill(c,velvet,3,2,w-6,4);
  fill(c,light,1,-2,2,3);fill(c,oak,w-3,-2,2,3);
 }
 c.restore();
}
function pitcher(c,x,y){
 foot(c,'#2e221c8f',x+1,y+1,5,3);
 fill(c,'#473b33',x+3,y-6,4,5);fill(c,'#a88960',x+5,y-5,1,3);
 foot(c,'#80684a',x,y-2,4,4);fill(c,'#bda07a',x-3,y-5,4,6);
 fill(c,'#69513c',x-2,y-8,4,3);fill(c,'#dfc093',x-2,y-8,3,1);
}
function breadBasket(c,x,y){
 foot(c,'#452d21',x,y+1,9,4);foot(c,'#a07243',x,y,8,4);
 for(const [dx,dy] of [[-4,1],[0,-2],[4,1]]){
  foot(c,'#d1a264',x+dx,y+dy-2,3,3);fill(c,'#f0cd86',x+dx-1,y+dy-3,2,1);
 }
 fill(c,'#bc8e57',x-6,y+2,12,1);
}
function platter(c,x,y){
 foot(c,'#4c4037',x,y+1,10,6);foot(c,'#d1b383',x,y,9,5);
 foot(c,'#6c7949',x,y,7,4);foot(c,'#a76144',x-1,y-1,5,4);
 fill(c,'#d38e5c',x-4,y-3,5,1);fill(c,'#e9d7b0',x+3,y-1,4,2);
}
function tableSettings(c,p){
 const {x,w,h,kind}=p,y=p.y-10;
 const cx=x+w/2,cy=y+h/2;
 if(kind==='desk'){
  fill(c,'#947451',x+11,y+11,28,19);fill(c,'#d2b882',x+10,y+9,27,18);
  polygon(c,'#ead1a0',[[x+17,y+7],[x+38,y+5],[x+40,y+20],[x+20,y+23]]);
  for(let i=0;i<11;i+=3)fill(c,'#816142',x+22,y+9+i,12-i%4,1);
  fill(c,'#382c2b',x+48,y+10,8,7);fill(c,'#526476',x+50,y+9,4,2);
  fill(c,'#b49a70',x+53,y+16,8,1);
  polygon(c,'#e3cba6',[[x+53,y+16],[x+64,y+4],[x+66,y+3],[x+63,y+10]]);
  fill(c,'#a95142',x+31,y+24,4,3);
  fill(c,'#6e543f',x+55,y+h-11,15,2);fill(c,'#b68b61',x+55,y+h-12,14,1);
  return;
 }
 if(kind==='feast'){
  fill(c,'#753e32',cx-7,y+2,14,h-4);
  fill(c,'#ad7d48',cx-7,y+2,1,h-4);fill(c,'#ad7d48',cx+6,y+2,1,h-4);
  platter(c,cx,y+57);breadBasket(c,cx,y+91);pitcher(c,cx+2,y+130);
  for(const [side,offset,food] of [[-1,16,1],[1,30,2],[-1,81,0],[1,105,3],[-1,124,2],[1,141,-1]]){
   const px=cx+side*11,py=y+offset;
   plate(c,px,py,food<0?4:6,food);
   fill(c,'#dbc9a0',px+side*6-1,py-3,1,6);
  }
  return;
 }
 if(kind==='prep'){
  fill(c,'#a5754a',x+6,y+7,29,18);fill(c,'#deab70',x+8,y+8,25,1);
  fill(c,'#d08348',x+12,y+14,12,3);fill(c,'#617951',x+9,y+13,5,4);
  fill(c,'#c78649',x+15,y+19,8,2);fill(c,'#ce9670',x+24,y+15,2,3);
  fill(c,'#352923',x+28,y+15,4,8);fill(c,'#9ea8a0',x+27,y+9,6,7);
  foot(c,'#5f4330',x+w-16,y+16,9,6);foot(c,'#ac7148',x+w-16,y+13,8,5);
  foot(c,'#713d32',x+w-16,y+12,6,3);
  for(const [dx,dy] of [[-3,-1],[0,1],[3,-1]])fill(c,'#d09456',x+w-17+dx,y+11+dy,3,2);
  breadBasket(c,x+53,y+h-9);pitcher(c,x+10,y+h-7);
  return;
 }
 if(kind==='sideboard'){
  for(let i=12;i<w-6;i+=22)(i%4===0?pitcher:breadBasket)(c,x+i,cy);
  return;
 }
 for(let i=13;i<w-8;i+=19){
  if(i%3!==0)plate(c,x+i,y+h-8,6,i);
  if(h>=40&&i%4<2)plate(c,x+i,y+9,5,i+1);
 }
 platter(c,cx,cy-1);pitcher(c,x+10,cy);if(w>=78)breadBasket(c,x+w-16,cy);
}
const bakedTableSettings=new WeakMap();
function table(c,p,time){
 const {x,y,w,h,kind}=p,cx=x+w/2,cy=y+h/2-10;
 drawGreyhavenFixture(c,p,'table');
 if(typeof document==='undefined')tableSettings(c,p);
 else {
  const inset=20;
  if(!bakedTableSettings.has(p)){
   const layer=document.createElement('canvas');
   layer.width=w+inset*2;layer.height=h+inset*2;
   const pixels=layer.getContext('2d');
   pixels.translate(inset-x,inset-y);
   tableSettings(pixels,p);
   bakedTableSettings.set(p,layer);
  }
  c.drawImage(bakedTableSettings.get(p),x-inset,y-inset);
 }
 if(kind==='desk')candle(c,x+w-9,y,time,0);
 if(kind==='feast'){candle(c,cx,y+37,time,1);candle(c,cx,y+108,time,2);}
 if(kind==='dining'){candle(c,cx-w*.23,cy-2,time,1);candle(c,cx+w*.23,cy-2,time,2);}
}
function roundTable(c,p,time){
 const {x,y,w,h}=p,cx=x+w/2,cy=y+h/2-4;
 if(w<=30){drawGreyhavenFixture(c,p,'stool');return;}
 drawGreyhavenFixture(c,p,'roundTable');
 plate(c,cx-5,cy+4,7,2);pitcher(c,cx+7,cy+4);candle(c,cx+7,cy-7,time,0);
}
function stores(c,{x,y,w,h,kind}){
 const cols=Math.max(1,Math.round(w/25)),rows=Math.max(1,Math.round(h/23)),cw=w/cols,ch=h/rows;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const px=x+i*cw+3,py=y+j*ch+3;
  if(kind==='barrels'){
    const size=forestHash(px,py),radius=Math.min(cw*.44,ch*.50)*(.77+size*.27),cx=px+cw*.39,cy=py+ch*.62;
   foot(c,'#241d178c',cx+2,cy+2,radius+1,radius*.55);
    if(!drawGreyhavenStore(c,kind,cx,cy,radius*2,radius*.96,radius*(1.02+size*.45))){
    drawGreyhavenFixture(c,{x:cx-radius,y:cy-radius*.70,w:radius*2,h:radius*1.40},'barrel');
   }
   continue;
  }
   const size=forestHash(py,px),ww=(cw-5)*(.82+size*.18),hh=(ch-4)*(.8+size*.21);
  const cx=px+ww/2,cy=py+hh*.69;
  foot(c,'#241d178c',cx+2,cy+2,ww*.49,hh*.35);
   const lift=hh*(.47+size*.36);
   if(!drawGreyhavenStore(c,kind,cx,cy,ww,hh*.74,lift))drawGreyhavenFixture(c,{x:px,y:py,w:ww,h:hh},'crate');
   if(size>.67)drawGreyhavenStore(c,kind,cx-1,cy-lift+1,ww*.73,hh*.55,hh*.34);
 }
}
function hearth(c,p,time,flooGreen){
 const {x,y,w,h}=p;
 drawGreyhavenFixture(c,p,'hearth');
 const innerX=x+Math.floor(w*.19),innerW=Math.floor(w*.62),base=y+h-9;
 fill(c,'#392820',innerX+3,base-8,innerW-6,7);
 fill(c,'#563624',innerX+5,base-4,innerW-10,6);
 fill(c,'#242321',innerX+2,base+2,innerW-4,2);
 fill(c,'#906344',innerX+2,base+4,innerW-4,1);
 polygon(c,'#412923',[[innerX+3,base+3],[innerX+innerW-4,base-3],[innerX+innerW-4,base],[innerX+4,base+5]]);
 polygon(c,'#6d422e',[[innerX+5,base-3],[innerX+innerW-6,base-1],[innerX+innerW-6,base+2],[innerX+6,base]]);
 const [edge,flame,lit,core]=flooGreen?['#248653','#37af66','#66ee8f','#c1ffd7']:
  ['#ad5332','#bf6535','#e79246','#ffdb8d'];
 if(flooGreen)radialLight(c,x+w/2,base-5,20,'#54f18160');
 const phase=Math.floor(time*9);
 for(let i=0;i<innerW-6;i+=5){
  const ht=3+Math.floor(forestHash(i+phase,x)*10),xx=innerX+3+i,tip=xx+1+(phase+i)%2;
  fill(c,edge,xx,base-ht*.68,5,ht*.68);
  fill(c,flame,tip,base-ht,2,ht);
  fill(c,lit,xx+1,base-ht*.72,3,ht*.72);
  fill(c,core,tip,base-ht*.43,2,ht*.43);
 }
}
function banner(c,p){
 const {x,y,w}=p;
 drawGreyhavenFixture(c,p,'banner');
 lion(c,x+w/2,y+3,1,'#e1ad65');
}
function sconce(c,p,time){
 const {x,y,w}=p;
 const cx=x+w/2,phase=Math.floor(time*10+x)%3;
 drawGreyhavenFixture(c,p,'sconce');
 fill(c,'#c86c33',cx-2,y-15-phase,5,6+phase);fill(c,'#fdd284',cx-1,y-13-phase,3,5+phase);
 fill(c,'#fbe5ab',cx,y-12,1,4);
}
function throne(c,{x,y,w,h}){
 const cx=x+w/2;
 foot(c,'#231d22ad',cx+3,y+h-2,w*.59,9);
 polygon(c,'#3b2726',[[x+5,y+23],[x+5,y-20],[x+12,y-25],[x+16,y-34],
  [cx-9,y-37],[cx,y-43],[cx+9,y-37],[x+w-16,y-34],[x+w-12,y-25],[x+w-5,y-20],[x+w-5,y+23]]);
 polygon(c,'#966238',[[x+9,y+22],[x+9,y-19],[x+15,y-23],[x+19,y-31],
  [cx-7,y-34],[cx,y-39],[cx+8,y-34],[x+w-19,y-31],[x+w-15,y-23],[x+w-9,y-19],[x+w-9,y+22]]);
 polygon(c,'#512532',[[x+15,y+18],[x+15,y-18],[x+22,y-26],[cx,y-33],
  [x+w-22,y-25],[x+w-15,y-18],[x+w-15,y+18]]);
 polygon(c,'#733441',[[x+17,y+15],[x+17,y-18],[x+23,y-24],[cx,y-30],
  [x+w-23,y-23],[x+w-18,y-16],[x+w-18,y+15]]);
 fill(c,'#9d4f51',x+18,y-11,2,26);fill(c,'#4f2934',x+w-20,y-10,2,26);
 lion(c,cx,y-10,2,'#d9a967');
 polygon(c,'#e2b572',[[cx,y-44],[cx+5,y-38],[cx+2,y-33],[cx,y-35],[cx-2,y-33],[cx-5,y-38]]);
 fill(c,'#f3d093',cx-1,y-40,2,3);
 fill(c,'#382827',x+5,y+20,w-10,12);fill(c,'#93643b',x+8,y+22,w-16,9);
 fill(c,'#653432',x+10,y+19,w-20,9);fill(c,'#a34b50',x+12,y+19,w-24,5);
 fill(c,'#bd6a64',x+14,y+20,w-28,1);
 fill(c,'#c99b5a',x+11,y+29,w-22,2);
 for(const sx of [x+1,x+w-11]){
  polygon(c,'#523a30',[[sx,y+7],[sx+4,y+2],[sx+11,y+4],[sx+10,y+16],[sx+7,y+22],[sx+8,y+33],[sx+1,y+33]]);
  fill(c,'#99683d',sx+2,y+8,6,18);fill(c,'#ad7947',sx+2,y+27,5,5);
  fill(c,'#67433a',sx,y+9,13,5);fill(c,'#c29255',sx,y+6,13,4);
  fill(c,'#e6b67a',sx+2,y+6,8,1);fill(c,'#e0ac68',sx+2,y+31,4,1);
 }
}
function lever(c,p,raised){
 const {x,y,w}=p;
 drawGreyhavenFixture(c,p,'lever');
 const sx=x+w/2,sy=y-2,end=sx+(raised?9:-9);
 foot(c,'#28292c',sx,sy+4,6,4);foot(c,'#696862',sx,sy+3,5,3);
 fill(c,'#312d30',sx-2,sy+2,4,3);fill(c,brass.lit,sx-1,sy+2,2,1);
 polygon(c,'#302d2d',[[sx-2,sy+3],[sx+2,sy+5],[end+2,sy-8],[end-1,sy-9]]);
 polygon(c,'#c2a171',[[sx-1,sy+2],[sx,sy+3],[end+1,sy-8],[end,sy-9]]);
 fill(c,'#562d28',end-3,sy-12,6,5);fill(c,'#c67b54',end-3,sy-12,5,2);
 fill(c,'#f0b086',end-2,sy-12,2,1);
}
function orb(c,p,time){
 const {x,y,w,h}=p;
 const cx=x+w/2,cy=y+h/2;
 drawGreyhavenFixture(c,p,'orb');
 for(let index=0;index<8;index++){
  const a=index*Math.PI/4,px=cx+Math.cos(a)*w*.28,py=cy-10+Math.sin(a)*h*.20;
  fill(c,'#6495be',px-2,py-1,4,1);
  fill(c,'#a5daee',px+(index%2?1:-1),py-2,1,3);
 }
 const oy=cy-13-Math.floor((Math.sin(time*2.1)+1)*2);
 radialLight(c,cx,oy,21,'#79c8ff68');
 fill(c,'#a7deec',cx-5,cy-4,9,1);
 foot(c,'#315481',cx,oy,11,10);foot(c,'#497db5',cx,oy-1,9,8);foot(c,'#80bbe4',cx-1,oy-2,7,6);
 foot(c,'#b3e4f4',cx-2,oy-4,4,3);fill(c,'#e0f3f3',cx-4,oy-6,3,2);
}
export function castleFurniture(c,p,time,bridgeRaised,flooGreen=false){
 switch(p.kind){
  case 'shelves': drawGreyhavenFixture(c,p,'shelves',Number(p.x>480));break;
  case 'barrels': case 'crates': stores(c,p);break;
  case 'plant': drawGreyhavenFixture(c,p,'plant',Math.floor(forestHash(p.x,p.y)*4));break;
  case 'greatHearth': case 'hearth': hearth(c,p,time,flooGreen);break;
  case 'feast': case 'sideboard': case 'prep': case 'dining': case 'desk': table(c,p,time);break;
  case 'roundTable': roundTable(c,p,time);break;
  case 'chair': chair(c,p);break;
  case 'greenBed': case 'redBed': drawGreyhavenFixture(c,p,'bed',Number(p.kind==='greenBed'));break;
  case 'bedsideChest': case 'copper': drawGreyhavenFixture(c,p,p.kind);break;
  case 'knight': drawGreyhavenFixture(c,p,'knight',Number(p.x>480));break;
  case 'lever': lever(c,p,bridgeRaised);break;
  case 'banner': banner(c,p);break;
  case 'sconce': sconce(c,p,time);break;
  case 'throne': throne(c,p);break;
  case 'orb': orb(c,p,time);break;
  case 'post': post(c,p.x,p.y,p.w,p.h);break;
 }
}
