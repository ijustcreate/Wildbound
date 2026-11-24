import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {drawJollyRoger} from './pirate-flag-art.mjs';
import {PIRATE_CAVE_BERTH,PIRATE_SHIP_LAYOUT,piratePlankHeight} from './pirate-ship.mjs';
import {WILLY_CHAIR,WRECK_TREASURE_TABLE} from './pirate-wreck-treasure.mjs';

const colors={ink:'#272c2c',hull:['#3d3030','#583b2e','#744d35','#966a43'],deck:['#75513b','#906a48','#ac8357','#c79a66','#dbb581'],rail:['#4b382d','#77583a','#a68455'],gold:['#82603a','#b58d4c','#e0b76c','#f3d18d'],teal:['#29464a','#3b6261','#608580'],cloth:['#938b73','#b6ab8f','#d7c9a9','#eee2c4','#f4ebd2'],iron:['#333943','#4a5357','#737777','#a5a392']};
const wreckColors={ink:'#202e33',hull:['#30383a','#4b4740','#635846','#756951'],deck:['#504943','#685d4f','#7d6e56','#92815f','#a18e6d'],rail:['#33413d','#586053','#6e7560'],gold:['#5f6148','#777856','#9b9569','#bdb889'],teal:['#203e42','#30545a','#4b716d'],cloth:['#555c52','#737866','#8e8e73','#a7a487','#bcbaa0'],iron:['#2e393e','#404b4e','#6c7068','#848477']};
const isWreck=ship=>ship.id===PIRATE_CAVE_BERTH.id;
const {hull,deckZ,holdZ,hatch,nests,cannons,hold,plank}=PIRATE_SHIP_LAYOUT;
const mainMast=nests.find(mast=>mast.id==='main');
const mainMastTip=64;
const originRadius=425;
const rasters=new Map();
const RASTER_LIMIT=16;

function picture(ctx,ship){
 const ca=Math.cos(ship.a),sa=Math.sin(ship.a),lift=ship.z||0;
 const point=([x,y,z=0])=>({x:Math.round(ship.x+ca*x-sa*y),y:Math.round(ship.y+sa*x+ca*y-z-lift)});
 const poly=(vertices,fill)=>pixelPolygon(ctx,vertices.map(point),fill);
 const line=(a,b,fill,width=1)=>pixelLine(ctx,point(a),point(b),fill,width);
 const loop=(vertices,fill,width)=>{
  for(let i=0;i<vertices.length;i++)line(vertices[i],vertices[(i+1)%vertices.length],fill,width);
 };
 const board=(x,y,z,w,d)=>[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]];
 return {ctx,point,poly,line,loop,board,ca,sa,colors:isWreck(ship)?wreckColors:colors};
}

function raster(ctx,ship,layer,variant,paint,box={x:-originRadius,y:-265,w:850,h:565}){
 const angle=Math.round(ship.a*128)/128,key=layer+':'+angle+':'+ship.id+':'+variant;
 let canvas=rasters.get(key);
 if(!canvas){
  if(typeof OffscreenCanvas==='function')canvas=new OffscreenCanvas(box.w,box.h);
  else if(typeof document!=='undefined'){
   canvas=document.createElement('canvas');canvas.width=box.w;canvas.height=box.h;
  }else{paint(picture(ctx,ship));return;}
  paint(picture(canvas.getContext('2d'),{id:ship.id,x:-box.x,y:-box.y,a:angle,z:0}));
  rasters.set(key,canvas);
  if(rasters.size>RASTER_LIMIT)rasters.delete(rasters.keys().next().value);
 }else{rasters.delete(key);rasters.set(key,canvas);}
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(canvas,Math.round(ship.x)+box.x,Math.round(ship.y-(ship.z||0))+box.y);ctx.restore();
}

const deckRim=hull.map(p=>[p.x,p.y,deckZ]);
function nearEdge(p,a,b){
 // Clockwise hull outline. The outside normal points toward the camera when
 // the edge runs toward negative projected screen x.
 return p.ca*(b[0]-a[0])-p.sa*(b[1]-a[1])<0;
}

function waterWake(ctx,ship,time){
 const p=picture(ctx,{...ship,z:0}),wave=Math.floor(time*6)%8,wreck=isWreck(ship);
 for(const [scale,color] of [[1.13,'#213e4668'],[1.06,'#1d3b466f'],[.94,'#18394083']]){
  p.poly(hull.map(v=>[v.x*scale-13,v.y*scale,0]),color);
 }
 for(const side of [-1,1]){
  for(let i=0;i<7;i++){
   const x=-290+i*78+wave*2,y=side*(124+i%3*5);
   p.line([x,y,-1],[x+14+i%4*6,y+side*2,-1],wreck?'#639d918d':i%2?'#a3c8ab98':'#729f92ab',2);
   if(i%2===0)p.line([x+9,y+side*7,-1],[x+33,y+side*9,-1],'#5e939073');
  }
  p.line([296,side*64,0],[326,side*40,0],'#9fc4a68f',2);
  p.line([326,side*40,0],[357,side*9,0],'#a2c9aeb8',2);
  p.line([-352,side*89,0],[-390,side*(72+wave),0],'#93b9a393',2);
 }
}

function sliceHull(p){
 const {colors}=p;
 const [dark,soil,wood,lit]=colors.hull;
 const edge=(p,t)=>[p[0]*(1-.042*t)+t*4,p[1]*(1-.24*t),deckZ-t*(deckZ+9)];
 for(let i=0;i<deckRim.length;i++){
  const a=deckRim[i],b=deckRim[(i+1)%deckRim.length];
  if(!nearEdge(p,a,b))continue;
  const broad=Math.abs(b[0]-a[0])>30;
  for(const [low,high,color] of [[.95,1.05,dark],[.77,.95,soil],[.56,.77,dark],[.35,.56,soil],[.14,.35,broad?wood:soil],[0,.14,lit]]){
   p.poly([edge(a,low),edge(b,low),edge(b,high),edge(a,high)],color);
  }
  for(const t of [.25,.48,.69,.88]){
   const v=edge(a,t),w=edge(b,t);
   p.line(v,w,t===.25?colors.gold[0]:dark,t===.25?3:1);
   if(t===.25)p.line([v[0],v[1],v[2]+1],[w[0],w[1],w[2]+1],colors.gold[1]);
  }
  if(broad)for(let slot=1;slot<8;slot++){
   const v=[a[0]+(b[0]-a[0])*slot/8,a[1]+(b[1]-a[1])*slot/8,deckZ];
   p.line(edge(v,slot%2?.54:.43),edge(v,.69),dark);
   p.line(edge([v[0]+1,v[1],v[2]],.19),edge([v[0]+1,v[1],v[2]],.33),wood);
  }
 }
}

function beamBounds(y){
 const xs=[];
 for(let i=0;i<hull.length;i++){
  const a=hull[i],b=hull[(i+1)%hull.length];
  if(a.y===b.y)continue;
  if(y>=Math.min(a.y,b.y)&&y<=Math.max(a.y,b.y))xs.push(a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y));
 }
 return xs.length?[Math.min(...xs),Math.max(...xs)]:[0,0];
}

function deckBoards(p){
 const {colors}=p;
 p.poly(deckRim,colors.ink);
 for(let y=-122;y<121;y+=8){
  const next=Math.min(y+8,122),[a,b]=beamBounds(y),[c,d]=beamBounds(next);
  const shade=(y+122)/8;
  p.poly([[a+4,y,deckZ],[b-4,y,deckZ],[d-4,next,deckZ],[c+4,next,deckZ]],colors.deck[(shade+2)%4+1]);
  p.line([a+4,y,deckZ],[b-4,y,deckZ],colors.deck[0]);
  p.line([c+5,next-1,deckZ],[d-5,next-1,deckZ],colors.deck[3]);
  for(let x=-300+(shade%3)*26;x<305;x+=78){
   if(x<Math.max(a,c)+8||x>Math.min(b,d)-8)continue;
   p.line([x,y+1,deckZ],[x,next-1,deckZ],colors.deck[0]);
   p.line([x+3,y+2,deckZ],[x+4,y+2,deckZ],colors.hull[0]);
  }
 }
 p.loop(deckRim,colors.rail[0],5);
 p.loop(deckRim.map(([x,y,z])=>[x*.995,y*.973,z+.4]),colors.gold[1],2);
}

function box(p,x,y,z,w,d,h,top,mid,shadow){
 const {colors}=p;
 const a=p.board(x,y,z,w,d),b=p.board(x,y,z+h,w,d);
 for(let i=0;i<a.length;i++){
  const j=(i+1)%a.length;
  if(nearEdge(p,a[i],a[j]))p.poly([a[i],a[j],b[j],b[i]],i%2?shadow:mid);
 }
 p.poly(b,top);p.loop(b,colors.ink);
}

function sternGallery(p){
 const {colors}=p;
 const [dark,mid,bright,shine]=colors.gold;
 const face=(y,z)=>[-341,y,z];
 p.poly([face(-108,deckZ-25),face(-97,49),face(-66,59),face(66,59),face(97,49),face(108,deckZ-25)],colors.hull[0]);
 p.poly([face(-91,20),face(-84,46),face(-61,53),face(61,53),face(84,46),face(91,20)],colors.teal[0]);
 p.line(face(-95,48),face(95,48),mid,3);
 p.line(face(-65,58),face(65,58),bright,2);
 p.line(face(-94,20),face(94,20),mid,4);
 p.line(face(-92,19),face(92,19),dark,2);
 for(const y of [-70,-45,-20,20,45,70]){
  p.poly([face(y-9,25),face(y-9,38),face(y-5,44),face(y+5,44),face(y+9,38),face(y+9,25)],mid);
  p.poly([face(y-6,27),face(y-6,37),face(y-3,41),face(y+4,41),face(y+6,37),face(y+6,27)],colors.teal[1]);
  p.line(face(y-4,36),face(y+4,36),colors.teal[2]);
  p.line(face(y,28),face(y,40),dark);
  p.line(face(y-5,40),face(y-2,43),shine);
 }
 p.poly([face(-9,36),face(0,49),face(9,36),face(0,27)],bright);
 p.poly([face(-5,37),face(0,44),face(5,37),face(0,32)],colors.teal[0]);
 for(const sign of [-1,1]){
  p.line(face(sign*108,deckZ-21),face(sign*96,47),mid,5);
  p.line(face(sign*93,21),face(sign*65,13),bright,2);
  p.line(face(sign*65,13),face(sign*42,16),dark,2);
 }
 const corner=(x,z)=>[x,109+(x+340)*.39,z];
 p.poly([corner(-338,12),corner(-304,12),corner(-304,38),corner(-338,44)],colors.hull[0]);
 p.poly([corner(-335,16),corner(-307,16),corner(-307,34),corner(-335,39)],colors.teal[0]);
 for(const x of [-329,-317]){
  p.poly([corner(x-4,20),corner(x-4,30),corner(x,34),corner(x+4,30),corner(x+4,20)],mid);
  p.line(corner(x-1,22),corner(x-1,30),colors.teal[2],2);
 }
 p.line(corner(-338,42),corner(-303,37),bright,2);
 p.line(corner(-335,15),corner(-306,15),mid,2);
}

function seaOwlFigurehead(p,wreck){
 const {colors}=p;
 const w=(x,z)=>[x,3,z];
 p.poly([w(335,19),w(353,20),w(374,32),w(383,48),w(369,48),w(357,39),w(343,36)],colors.ink);
 p.poly([w(340,22),w(356,23),w(373,35),w(380,46),w(369,46),w(358,38),w(345,34)],colors.gold[1]);
 p.poly([w(354,30),w(362,44),w(369,51),w(376,50),w(380,44),w(374,39),w(366,38)],colors.gold[2]);
 p.poly([w(370,47),w(376,47),w(373,43)],colors.gold[3]);
 p.line(w(371,46),w(372,46),colors.ink,2);
 p.line(w(361,38),w(352,30),colors.gold[3],2);
 const end=wreck?[366,0,deckZ+19]:[401,0,deckZ+33];
 p.line([339,1,deckZ+8],end,colors.hull[0],5);
 p.line([339,1,deckZ+9],[end[0],end[1],end[2]+1],colors.gold[1],2);
}

function railSections(p,near){
 const {colors}=p;
 for(let i=0;i<deckRim.length;i++){
  const a=deckRim[i],b=deckRim[(i+1)%deckRim.length];
  if(nearEdge(p,a,b)!==near)continue;
  const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/18));
  for(let j=0;j<=steps;j++){
   const t=j/steps,x=a[0]*(1-t)+b[0]*t,y=a[1]*(1-t)+b[1]*t;
   if(i===6&&Math.abs(x-plank.x)<plank.width/2+2)continue;
   p.line([x,y,deckZ],[x,y,deckZ+13],colors.rail[0],4);
   p.line([x,y,deckZ+1],[x,y,deckZ+13],colors.gold[0]);
  }
  const cap=(x,y)=>[x,y,deckZ+13];
  const line=(a,b)=>{p.line(a,b,colors.ink,6);p.line(a,b,colors.rail[1],4);p.line([a[0],a[1],a[2]+1],[b[0],b[1],b[2]+1],colors.gold[1],2);};
  if(i===6){line(cap(a[0],a[1]),cap(plank.x+plank.width/2,a[1]));line(cap(plank.x-plank.width/2,a[1]),cap(b[0],b[1]));}
  else line(cap(a[0],a[1]),cap(b[0],b[1]));
 }
}

function hatchFrame(p,open){
 const {colors}=p;
 const {x,y,w,h}=hatch;
 p.poly(p.board(x,y,deckZ,w+7,h+7),colors.ink);
 p.loop(p.board(x,y,deckZ+.5,w,h),colors.gold[0],3);
 p.poly(p.board(x,y,deckZ+.6,w-6,h-4),open?'#302f30':colors.hull[2]);
 for(let z=-h/2+6;z<h/2-3;z+=5)p.line([x-w/2+4,y+z,deckZ+1],[x+w/2-4,y+z,deckZ+1],open?colors.deck[0]:colors.hull[0]);
 p.line([x-6,y+7,deckZ+2],[x+6,y+7,deckZ+2],colors.gold[2],2);
}

function deckFittings(p){
 const {colors}=p;
 for(const mast of nests){
  p.poly(p.board(mast.x,0,deckZ,26,21),colors.hull[0]);
  p.loop(p.board(mast.x,0,deckZ+.5,21,17),colors.hull[2],2);
  p.poly(p.board(mast.x+13,-13,deckZ,28,8),'#4c3e325a');
 }
 for(const [x,y] of [[-264,-54],[-265,57],[218,-39],[227,40]]){
  box(p,x,y,deckZ,15,15,6,colors.deck[1],colors.hull[2],colors.hull[0]);
  p.line([x,y,deckZ+6],[x,y,deckZ+13],colors.hull[0],5);
  p.line([x-6,y,deckZ+11],[x+6,y,deckZ+11],colors.deck[2],3);
 }
 for(const [x,y] of [[-224,-74],[-201,-77],[-199,75]]){
  for(let i=0;i<3;i++)p.loop(p.board(x+i,y+i,deckZ+.5,15-i*4,10-i*2),colors.deck[i]);
 }
 const wheelX=-282;
 box(p,wheelX,0,deckZ,14,17,14,colors.deck[3],colors.hull[2],colors.hull[0]);
 const points=Array.from({length:10},(_,i)=>[wheelX,Math.cos(i*Math.PI/5)*12,deckZ+22+Math.sin(i*Math.PI/5)*12]);
 p.loop(points,colors.hull[0],4);p.loop(points,colors.gold[1],2);
 for(let i=0;i<10;i+=2)p.line([wheelX,0,deckZ+22],points[i],colors.deck[2],2);
}

function gangplank(ctx,ship){
 const p=picture(ctx,{...ship,z:0}),{x,nearY,farY,width}=plank,{colors}=p;
 if(!Number.isFinite(farY)||farY<=nearY)return;
 const at=(y,side,top=0)=>[x+side*width/2,y,piratePlankHeight(ship,y)+top];
 const base=[at(nearY,-1),at(farY,-1),at(farY,1),at(nearY,1)];
 p.poly(base,colors.deck[1]);p.loop(base,colors.hull[0],4);
 for(let y=nearY+6,i=0;y<farY;y+=9,i++){
  p.line(at(y,-1),at(y,1),i%3?colors.deck[0]:colors.deck[3]);
  if(i%2===0)p.line(at(y+2,-1),at(y+2,1),colors.deck[2]);
 }
 for(const side of [-1,1]){
  p.line(at(nearY,side,9),at(farY,side,9),colors.rail[0],3);
  p.line(at(nearY,side,10),at(farY,side,10),colors.deck[2]);
  for(let y=nearY+13;y<farY;y+=29)p.line(at(y,side),at(y,side,12),colors.hull[0],3);
 }
}

function shipHold(p,wreck){
 const {colors}=p;
 const {left,right,top,bottom,partitionX,passageHalf}=hold;
 p.poly(deckRim.map(([x,y])=>[x,y,holdZ-1]),colors.ink);
 p.poly(deckRim.map(([x,y])=>[x*.965,y*.92,holdZ-1]),colors.hull[0]);
 for(const [x,y,width,depth] of [[-296,3,67,134],[199,3,106,113],[271,0,56,55]]){
  p.poly(p.board(x,y,holdZ-1,width,depth),colors.hull[1]);
  for(let offset=-depth/2+5;offset<depth/2;offset+=10)p.line([x-width/2,y+offset,holdZ-1],[x+width/2,y+offset,holdZ-1],colors.hull[0]);
 }
 p.poly([[left,top,holdZ],[right,top,holdZ],[right,bottom,holdZ],[left,bottom,holdZ]],colors.hull[0]);
 for(let y=top+3,i=0;y<bottom-3;y+=9,i++){
  p.poly([[left+3,y,holdZ],[right-3,y,holdZ],[right-3,y+8,holdZ],[left+3,y+8,holdZ]],colors.hull[[1,2,2,3,2][i%5]]);
  for(let x=left+40+i%3*22;x<right-7;x+=63)p.line([x,y,holdZ],[x,y+8,holdZ],colors.hull[0]);
 }
 for(const y of [top,bottom]){
  const high=y===top?34:9;
  p.poly([[left,y,holdZ],[right,y,holdZ],[right,y,holdZ+high],[left,y,holdZ+high]],colors.hull[0]);
  for(let z=5;z<high;z+=8)p.line([left,y,holdZ+z],[right,y,holdZ+z],colors.hull[1]);
  p.line([left,y,holdZ+high],[right,y,holdZ+high],colors.rail[2],3);
  for(let x=left+12;x<right;x+=29){
   p.line([x,y,holdZ],[x,y,holdZ+high],colors.hull[2],4);
   p.line([x-1,y,holdZ+3],[x-1,y,holdZ+high-2],colors.hull[3]);
  }
 }
 for(const [a,b] of [[top,-passageHalf],[passageHalf,bottom]]){
  p.poly([[partitionX,a,holdZ],[partitionX,b,holdZ],[partitionX,b,holdZ+20],[partitionX,a,holdZ+20]],colors.hull[0]);
  p.line([partitionX,a,holdZ+20],[partitionX,b,holdZ+20],colors.rail[2],3);
 }
 for(const y of [-passageHalf,passageHalf])p.line([partitionX,y,holdZ],[partitionX,y,holdZ+22],colors.gold[0],4);
 for(const [x,y] of [[left+19,top+15],[left+40,top+14],[right-21,top+14],[right-19,bottom-12]]){
  box(p,x,y,holdZ,17,13,11,colors.deck[2],colors.hull[2],colors.hull[0]);
  for(const edge of [-4,4])p.line([x+edge,y-6,holdZ+11],[x+edge,y+6,holdZ+11],colors.hull[0],2);
  p.line([x-3,y+6,holdZ+6],[x+3,y+6,holdZ+6],colors.gold[1],2);
 }
 for(const x of [left+77,partitionX+65,right-42]){
  const lit=wreck?'#94c8a5':'#e9b875';
  const height=holdZ+21;
  p.poly([[x-18,top+.5,height-11],[x-9,top+.5,height+7],[x+9,top+.5,height+7],[x+18,top+.5,height-11],[x,top+10,holdZ+1]],wreck?'#67977b35':'#bc774f46');
  p.line([x,top+1,height-4],[x,top+1,height+3],colors.ink,6);
  p.line([x,top+3,height-4],[x,top+3,height+2],lit,3);
  p.line([x-3,top+3,height+3],[x+3,top+3,height+3],colors.gold[1],2);
 }
 p.loop(p.board(hatch.x,hatch.y,holdZ+.5,hatch.w,hatch.h),colors.gold[0],2);
 for(let j=0;j<5;j++)p.line([hatch.x-12,hatch.y-12+j*5,holdZ+j*2],[hatch.x+12,hatch.y-12+j*5,holdZ+j*2],colors.deck[3],2);
 if(wreck){
  wreckGrowth(p,left+28,top+4,holdZ+21,21);
  wreckGrowth(p,left+105,top+7,holdZ+15,15);
  wreckGrowth(p,right-34,bottom-6,holdZ+11,11);
  const rug=p.board(21,2,holdZ,178,87);
  p.poly(rug,'#48333a');
  p.poly(p.board(21,2,holdZ,170,79),'#693f46');
  p.loop(p.board(21,2,holdZ,156,66),'#aa7861',2);
  for(const x of [-53,-12,28,68,95])for(const y of [-29,29]){
   p.poly([[x-5,y,holdZ],[x,y-3,holdZ],[x+5,y,holdZ],[x,y+3,holdZ]],'#916356');
  }
 }
}

const brass=['#76503e','#b7864c','#e7bd65','#fff1a3'];
const gems=[['#274e50','#57958a','#b8e2ba'],['#723d4c','#c46c68','#ffb287'],['#414462','#6f79a3','#b6c4e3']];

function coin(p,x,y,z,r=2){
 p.poly([[x-r,y,z],[x-1,y-r,z],[x+r,y-r,z],[x+r+1,y+1,z],[x+1,y+r,z],[x-r,y+1,z]],brass[1]);
 p.line([x-r+1,y-1,z+.6],[x+r-1,y,z+.6],brass[2],1);
}

function treasureTable(p){
 const {x,y,width:w,depth:d}=WRECK_TREASURE_TABLE,z=holdZ;
 p.poly(p.board(x+2,y+4,z,w+11,d+10),'#292d2c88');
 for(const dx of [-w/2+10,w/2-10])for(const dy of [-d/2+6,d/2-6]){
  box(p,x+dx,y+dy,z,7,7,15,'#a47b5f','#6b4b3d','#352e2c');
 }
 box(p,x,y,z+14,w,d,5,'#a07d56','#64463a','#433637');
 const top=z+19;
 p.poly(p.board(x,y,top,83,27),'#754346');
 p.loop(p.board(x,y,top+.5,79,24),'#a36f56',1);
 // Each cluster combines a few larger silhouettes with scattered coin piles.
 for(const [px,py] of [[-35,7],[-22,-10],[4,14],[19,2],[42,10]]){
  for(const [dx,dy,dz,r] of [[0,0,0,4],[-6,2,1,3],[4,4,1,3],[-2,6,2,3],[2,-2,3,3],[7,-4,0,2]]){
   coin(p,px+dx,py+dy,top+dz,r);
  }
 }
 box(p,-21,-7,top,23,13,7,'#9c704f','#694439','#483535');
 p.loop(p.board(-21,-7,top+7.5,23,13),brass[1],2);
 p.poly(p.board(-21,-7,top+8,17,9),'#443337');
 p.poly([[-32,-13,top+5],[-10,-13,top+5],[-10,-17,top+15],[-32,-17,top+15]],'#98684b');
 p.line([-32,-17,top+15],[-10,-17,top+15],brass[2],2);
 for(const [x,y,i] of [[-24,-5,1],[-18,-7,0],[-35,-3,2],[-5,4,2],[24,7,1],[38,-10,0],[46,3,2]]){
  const color=gems[i];
  p.poly([[x-5,y+1,top],[x-3,y-3,top+2],[x+2,y-4,top+3],[x+5,y,top+1],[x+2,y+3,top]],color[0]);
  p.poly([[x-3,y-3,top+2],[x+2,y-4,top+3],[x+2,y+1,top+2],[x-3,y+1,top+1]],color[1]);
  p.line([x-3,y-3,top+2],[x,y-4,top+3],color[2]);
 }
 for(const [x,y] of [[-7,-13],[30,-7],[56,4]]){
  p.line([x,y,top],[x,y,top+10],brass[1],3);
  p.poly([[x-4,y-3,top+12],[x+4,y-3,top+12],[x+2,y+2,top+8],[x-2,y+2,top+8]],brass[2]);
  p.line([x-4,y-4,top+12],[x+3,y-4,top+12],brass[3]);
 }
 p.loop([[5,-4,top+1],[11,-10,top+1],[19,-12,top+1],[25,-7,top+1],[23,-3,top+1],[15,-2,top+1]],brass[2],2);
}

function willyChair(p){
 const {x,y,width:w,depth:d}=WILLY_CHAIR,z=holdZ;
 p.poly(p.board(x+3,y+3,z,w+8,d+7),'#292d2c88');
 for(const dx of [-8,9])for(const dy of [-8,8]){
  box(p,x+dx,y+dy,z,5,5,16,'#a37b51','#6d4a3e','#3b2d31');
 }
 box(p,x,y,z+14,w,d,4,'#7b4549','#50363b','#382c31');
 box(p,x+10,y,z+15,5,d,31,'#815f4c','#604434','#382c31');
 p.line([x+9,-10,z+45],[x+9,10,z+45],brass[1],3);

 const dark='#4b453e',bone='#c5b58e',light='#e5d5a8';
 const stroke=(a,b,w=3)=>{p.line(a,b,dark,w+2);p.line(a,b,bone,w);};
 for(const side of [-1,1]){
  stroke([x,side*5,z+18],[x-14,side*6,z+17],4);
  stroke([x-14,side*6,z+17],[x-20,side*7,z+4],3);
  p.line([x-20,side*7,z+3],[x-24,side*7,z+3],bone,3);
 }
 p.poly([[x-3,-6,z+17],[x+4,-4,z+17],[x+4,5,z+17],[x-3,5,z+19]],bone);
 stroke([x+2,0,z+16],[x+2,0,z+35],4);
 for(let rib=0;rib<4;rib++){
  const rz=z+23+rib*2.5,hw=4+rib*.8;
  p.loop([[x+2,-hw,rz],[x-3,-hw,rz+1],[x-6,0,rz],[x-3,hw,rz+1],[x+2,hw,rz]],rib%2?light:bone);
 }
 for(const side of [-1,1]){
  stroke([x+1,side*8,z+32],[x-6,side*11,z+23],3);
  stroke([x-6,side*11,z+23],[x-16,side*11,z+19],2);
  p.line([x-16,side*11,z+19],[x-20,side*12,z+18],light,2);
 }
 p.poly([[x-8,-6,z+36],[x-8,5,z+37],[x-5,6,z+45],[x+3,5,z+47],[x+5,-3,z+46],[x+1,-6,z+43]],light);
 p.poly([[x-8,-5,z+36],[x-8,5,z+36],[x-4,4,z+39],[x-3,-4,z+39]],bone);
 p.line([x-8,-5,z+41],[x-8,5,z+41],'#34313a',3);
 p.line([x-9,3,z+42],[x-8,5,z+41],'#29292f',4);
 p.line([x-8,-4,z+37],[x-8,4,z+37],'#655849');
 p.poly([[x-12,-13,z+44],[x-11,-7,z+49],[x+4,-6,z+55],[x+7,4,z+51],[x+3,11,z+46],[x-6,11,z+46]],'#33343a');
 p.line([x-12,-13,z+44],[x-6,11,z+46],'#98714f',2);
 p.line([x-1,-6,z+50],[x+4,-1,z+53],'#56605a',2);
}

export function drawWreckTreasure(ctx,ship,part){
 if(part==='table'){raster(ctx,ship,'treasure',part,treasureTable);return;}
 const {x,y}=WILLY_CHAIR;
 const scale=([px,py,pz])=>[x+(px-x)*.83,y+(py-y)*.83,holdZ+(pz-holdZ)*.75];
 raster(ctx,ship,'treasure',part,p=>willyChair({
  ...p,
  poly:(vertices,color)=>p.poly(vertices.map(scale),color),
  line:(a,b,color,width)=>p.line(scale(a),scale(b),color,width&&width*.84),
  loop:(vertices,color,width)=>p.loop(vertices.map(scale),color,width&&width*.84),
 }));
}

function drawCannon(p,cannon,showFlash,shot){
 const {colors}=p;
 const {x,y,side}=cannon,o=deckZ,recoil=shot&&shot.age<.25?(1-shot.age/.25)*6:0;
 p.poly(p.board(x,y,o,27,37),'#25272963');
 box(p,x,y-side*5,o,19,27,8,colors.deck[2],colors.hull[2],colors.hull[0]);
 for(const sign of [-1,1]){
  const wheel=x+sign*8;
  p.line([wheel,y-7,o+3],[wheel,y+8,o+3],colors.hull[0],7);
  p.line([wheel,y-7,o+5],[wheel,y+8,o+5],colors.gold[0],2);
 }
 const tail=[x,y-side*(14+recoil),o+14],muzzle=[x,y+side*(20-recoil),o+18];
 p.line(tail,muzzle,colors.ink,12);
 p.line([tail[0],tail[1],tail[2]+2],[muzzle[0],muzzle[1],muzzle[2]+1],colors.iron[1],7);
 p.line([x,y-side*(8+recoil),o+19],[x,y+side*(16-recoil),o+22],colors.iron[2],2);
 p.line([x-6,muzzle[1],muzzle[2]],[x+6,muzzle[1],muzzle[2]],colors.ink,7);
 p.line([x-4,muzzle[1],muzzle[2]+2],[x+4,muzzle[1],muzzle[2]+2],colors.gold[0],2);
 if(showFlash&&shot?.age<.12){
  const length=9+shot.age*45,y=muzzle[1],z=muzzle[2];
  p.poly([[x-2,y,z-3],[x-5,y+side*length*.6,z+1],[x,y+side*length,z+2],[x+5,y+side*length*.5,z+4],[x+2,y,z+3]],'#e49d53');
  p.line([x,y,z],[x,y+side*length*.86,z+2],colors.gold[3],3);
 }
}

function basketRim(mast){
 return Array.from({length:16},(_,i)=>[mast.x+Math.cos(i*Math.PI/8)*mast.radius,mast.y+Math.sin(i*Math.PI/8)*mast.radius,mast.z]);
}

function basket(p,mast){
 const {colors}=p,at=basketRim(mast);
 const base=at.map(([x,y,z])=>[mast.x+(x-mast.x)*.72,mast.y+(y-mast.y)*.72,z-12]);
 for(let i=0;i<at.length;i++){
  const j=(i+1)%at.length;
  if(nearEdge(p,at[i],at[j]))p.poly([at[i],at[j],base[j],base[i]],colors.hull[i%2+1]);
 }
 p.poly(at,colors.deck[2]);p.loop(at,colors.gold[0],3);
 const rail=at.map(([x,y,z])=>[x,y,z+10]);
 for(let i=1;i<at.length;i+=2)p.line(at[i],rail[i],colors.rail[0],2);
 p.loop(rail,colors.rail[0],3);p.loop(rail.map(([x,y,z])=>[x,y,z+.7]),colors.gold[1]);
}

function nearBasketRails(p){
 const {colors}=p;
 for(const mast of nests){
  const rim=basketRim(mast);
  for(let i=0;i<rim.length;i++){
   const a=rim[i],b=rim[(i+1)%rim.length];
   if(!nearEdge(p,a,b))continue;
   p.line([a[0],a[1],a[2]+10],[b[0],b[1],b[2]+10],colors.rail[0],3);
   p.line([a[0],a[1],a[2]+11],[b[0],b[1],b[2]+11],colors.gold[1]);
   if(i%2)p.line(a,[a[0],a[1],a[2]+10],colors.rail[0],2);
  }
 }
}

function sail(p,mast,width,high,low,phase){
 const {colors}=p;
 const edge=(t,z,bottom)=>{
  const swell=Math.max(0,1-t*t)*((bottom?.28:.11)*width+phase);
  const sweep=t*width*(bottom?.68:.56),floor=bottom?Math.abs(t)*12:-Math.abs(t)*4;
  return [mast.x+3+sweep+swell,mast.y+t*width,z+floor];
 };
 const panels=[-1,-.78,-.54,-.29,0,.29,.54,.78,1];
 for(let i=0;i<panels.length-1;i++){
  const a=panels[i],b=panels[i+1],q=[edge(a,high,false),edge(b,high,false),edge(b,low,true),edge(a,low,true)];
  p.poly(q,colors.cloth[[1,2,3,4,3,2,1,0][i]]);
  p.line(edge(a,high-4,false),edge(a,low+5,true),colors.cloth[i<4?2:1]);
  if(i%2===0)p.line(edge(a+.055,high-10,false),edge(a+.065,low+14,true),colors.cloth[i<4?3:2]);
 }
 for(let i=0;i<panels.length-1;i++){
  p.line(edge(panels[i],low,true),edge(panels[i+1],low,true),colors.cloth[0],2);
  p.line(edge(panels[i],high,false),edge(panels[i+1],high,false),colors.hull[1],3);
 }
 for(const sign of [-1,1])p.line([mast.x+sign*width*.59,mast.y+sign*width*1.05,high-2],edge(sign,high,false),colors.gold[0],2);
}

function wreckGrowth(p,x,y,z,length){
 const points=[[x,y,z],[x+5,y+3,z-length*.31],[x-2,y+6,z-length*.61],[x+1,y+9,z-length]];
 for(let i=1;i<points.length;i++){
  p.line(points[i-1],points[i],'#294640',3);
  p.line(points[i-1],points[i],'#567955');
  const [a,b,h]=points[i];
  p.poly([[a-6,b,h+1],[a-3,b-2,h+5],[a,b,h+1],[a-3,b+1,h-2]],'#6e9463');
  p.poly([[a,b,h-1],[a+2,b,h+3],[a+6,b-2,h+4],[a+3,b+2,h-1]],'#416652');
 }
}

function deckWeathering(p){
 for(const [x,y,width] of [[-287,-69,43],[-249,102,44],[-187,92,24],[-52,-107,27],[72,-109,31],[115,109,44],[246,58,47],[270,-44,35]]){
  p.poly([[x-width*.5,y,deckZ+1],[x-width*.15,y-4,deckZ+1],[x+width*.22,y-5,deckZ+1],[x+width*.5,y+1,deckZ+1],[x+width*.25,y+5,deckZ+1],[x-width*.4,y+3,deckZ+1]],'#374b41');
  p.line([x-width*.22,y-2,deckZ+1],[x+width*.3,y-3,deckZ+1],'#536c4f');
  p.line([x-width*.2,y+3,deckZ+1],[x+width*.25,y+3,deckZ+1],'#716d58');
 }
 for(const [x,y] of [[-302,-92],[-256,-106],[-205,-116],[-95,-119],[69,-118],[190,-104],[250,-73],[-277,118],[-147,119],[-73,122],[147,122],[230,95]]){
  p.line([x-7,y,deckZ+3],[x+4,y,deckZ+5],'#51765e',4);
  p.line([x-2,y+1,deckZ+5],[x+4,y,deckZ+6],'#7a9a72',2);
 }
}

function wreckNearRail(p){
 for(const [x,y,len] of [[-328,105,31],[-298,117,47],[-271,122,26],[-165,123,45],[-144,123,29],[-15,122,21],[33,123,33],[190,112,32],[257,86,26],[287,69,28]]){
  wreckGrowth(p,x,y,deckZ+13,len);
 }
}

function ruinedSail(p,mast,phase){
 const {colors}=p;
 const z=mast.z+7,x=mast.x,tail=(y,z)=>[x+y*.56+Math.abs(y)*.09+phase*.4,y,z];
 if(mast.id==='main'){
  const stretch=[-91,-56,-29,0,25,47];
  const tatters=[z-9,z-43,z-24,z-65,z-36,z-14];
  for(let i=1;i<stretch.length;i++){
   const left=stretch[i-1],right=stretch[i];
   const topA=tail(left,z+4),topB=tail(right,z+4),edge=tail((left+right)*.5,tatters[i]+8);
   p.poly([topA,topB,tail(right-4,tatters[i]),edge,tail(left+2,tatters[i-1])],colors.cloth[[1,2,3,2,1][i-1]]);
   p.line(topA,edge,colors.cloth[1]);
  }
  p.line(tail(-97,z+4),tail(47,z+4),colors.hull[0],5);
  p.line(tail(-95,z+6),tail(38,z+6),colors.hull[2],2);
  p.poly([tail(40,z+3),tail(53,z+3),tail(49,z+8),tail(40,z+7)],colors.deck[3]);
  p.line(tail(48,z+3),tail(57,z-21),colors.hull[1],2);
 }else if(mast.id==='aft'){
  const a=[x-32,-57,mast.z+19],b=[x+5,44,mast.z+14],c=[x-15,-66,mast.z-34];
  p.poly([a,b,[x-1,-17,mast.z-3],[x-11,-41,mast.z-12],c],colors.cloth[2]);
  p.poly([a,[x-12,-29,mast.z-10],c],colors.cloth[1]);
  p.line(a,b,colors.hull[0],4);p.line(a,c,colors.cloth[0],2);
 }else{
  p.line(tail(-61,z+1),tail(29,z-5),colors.hull[0],5);
  p.line(tail(-57,z+3),tail(27,z-3),colors.hull[2],2);
  p.poly([tail(24,z-8),tail(36,z-5),tail(30,z-1),tail(23,z-1)],colors.deck[3]);
  p.line(tail(29,z-6),tail(35,z-29),colors.hull[1],2);
 }
}

function rig(p,phase,level,wreck){
 const {ctx,colors}=p;
 const ordered=[...nests].sort((a,b)=>p.point([a.x,a.y,0]).y-p.point([b.x,b.y,0]).y);
 for(const mast of ordered){
  const main=mast.id==='main';
  const tip=mast.z+(wreck?(main?47:23):main?mainMastTip:47);
  for(const sign of [-1,1]){
   const attach=[mast.x-24,sign*109,deckZ+9];
   p.line(attach,[mast.x,mast.y,mast.z+15],colors.hull[0],2);
   p.line([mast.x+37,sign*110,deckZ+8],[mast.x,mast.y,mast.z-4],colors.gold[0]);
   for(let step=1;step<11;step++){
    const t=step/12,x=attach[0]*(1-t)+mast.x*t,y=attach[1]*(1-t),z=attach[2]*(1-t)+(mast.z+15)*t;
    p.line([x,y,z],[x+17*(1-t)+2,y,z],colors.hull[1]);
   }
  }
  p.line([mast.x,0,deckZ],[mast.x,0,tip],colors.ink,11);
  p.line([mast.x-2,0,deckZ],[mast.x-2,0,tip],colors.rail[1],6);
  p.line([mast.x-4,0,deckZ],[mast.x-4,0,tip],colors.deck[3],2);
  p.line([mast.x,mast.ropeY,deckZ],[mast.x,mast.y+7,mast.z+4],colors.hull[0],4);
  p.line([mast.x-1,mast.ropeY,deckZ+1],[mast.x-1,mast.y+7,mast.z+4],colors.gold[2],2);
  for(let z=deckZ+8;z<mast.z;z+=8){
   const fraction=(z-deckZ)/(mast.z-deckZ),y=mast.ropeY*(1-fraction)+7*fraction;
   p.line([mast.x-3,y,z],[mast.x+2,y,z],colors.gold[0],2);
  }

  ctx.save();ctx.globalAlpha*=level==='deck'||level==='plank'||level==='rope'?.22:level==='nest'?.56:1;
  if(wreck)ruinedSail(p,mast,phase);
  else if(mast.x<0){
   const a=[mast.x-68,-67,mast.z+29],b=[mast.x+31,54,mast.z+21],c=[mast.x-24,-79,mast.z-38];
   p.poly([a,b,c],colors.cloth[2]);
   p.poly([a,[(b[0]+c[0])/2,(b[1]+c[1])/2,(b[2]+c[2])/2],c],colors.cloth[1]);
   p.line(a,b,colors.hull[1],3);p.line(a,c,colors.cloth[0],2);p.line(b,c,colors.cloth[0],2);
  }else{
   sail(p,mast,main?103:77,mast.z-6,deckZ+37,phase);
   sail(p,mast,main?71:57,mast.z+38,mast.z+3,phase*.5);
  }
  ctx.restore();
  basket(p,mast);
  if(wreck){
   wreckGrowth(p,mast.x+4,mast.radius*.76,mast.z+10,22);
   p.poly([[mast.x-5,0,tip-3],[mast.x-1,0,tip+6],[mast.x+2,0,tip+2],[mast.x+4,0,tip-4]],colors.deck[3]);
   continue;
  }
  if(main)continue;
  const flag=mast.x<0?colors.teal[2]:colors.gold[1];
  p.poly([[mast.x,0,tip+5],[mast.x+25+phase,0,tip+8],[mast.x+45,0,tip+3],[mast.x+29,0,tip-4],[mast.x,0,tip]],flag);
  p.line([mast.x+5,0,tip+3],[mast.x+18,0,tip+4],colors.cloth[3],2);
 }
}

const rigBounds={x:-425,y:-460,w:850,h:725};
const wavePhase=time=>[-3,0,3,0][Math.floor(Math.max(0,time)*4)%4];
const activeShot=(ship,cannon)=>ship.shots?.find(shot=>shot.cannonId===cannon.id&&shot.age<.25);

export function drawPirateShipGround(ctx,ship,{level='shore',time=ship.time||0}={}){
 const wreck=isWreck(ship),phase=wavePhase(time);
 if(level==='hold'){
  raster(ctx,ship,'hold','',p=>shipHold(p,wreck));return;
 }
 waterWake(ctx,ship,time);
 raster(ctx,ship,'hull','',p=>{
  sliceHull(p);deckBoards(p);sternGallery(p);seaOwlFigurehead(p,wreck);railSections(p,false);deckFittings(p);
  if(wreck)deckWeathering(p);
 });
 gangplank(ctx,ship);
 const open=Boolean(ship.openHold);
 if(ship.shots?.some(shot=>shot.age<.25)){
  const p=picture(ctx,ship);
  hatchFrame(p,open);
  for(const cannon of cannons)drawCannon(p,cannon,false,activeShot(ship,cannon));
 }else raster(ctx,ship,'deck-gear',open?1:0,p=>{
  hatchFrame(p,open);
  for(const cannon of cannons)drawCannon(p,cannon,false);
 });
 if(level==='nest')raster(ctx,ship,'rig',level+phase,p=>rig(p,phase,level,wreck),rigBounds);
}

export function drawPirateShipForeground(ctx,ship,{level='shore',time=ship.time||0}={}){
 if(level==='hold')return;
 const wreck=isWreck(ship),phase=wavePhase(time);
 raster(ctx,ship,'near-rail','',p=>{railSections(p,true);if(wreck)wreckNearRail(p);});
 if(level==='nest')raster(ctx,ship,'nest-rail','',nearBasketRails,rigBounds);
 else raster(ctx,ship,'rig',level+phase,p=>rig(p,phase,level,wreck),rigBounds);
 const p=picture(ctx,ship);
 if(!wreck)drawJollyRoger(ctx,p.point([mainMast.x,mainMast.y,mainMast.z+mainMastTip+2]),time);
 for(const cannon of cannons){const shot=activeShot(ship,cannon);if(shot?.age<.12)drawCannon(p,cannon,true,shot);}
}

export function drawPirateShipEffects(ctx,ship,{level='shore'}={}){
 if(level==='hold')return;
 const p=picture(ctx,ship);
 for(const shot of ship.shots||[]){
  const v=p.point([shot.x,shot.y,shot.z]);
  if(shot.impactAge!=null){
   const age=shot.impactAge;
   for(let i=0;i<5;i++){
    const side=i%2===0?1:-1,spread=age*(28+i*8),lift=Math.max(0,(1-age*2)*age*74);
    const fleck=shot.impactWater?(i%2?'#9fd5c8':'#d6eed1'):(i%2?'#b99060':'#d8b481');
    p.line([shot.x+spread*side,shot.y+spread*.4,shot.z+lift],[shot.x+spread*side+2,shot.y+spread*.4+1,shot.z+lift+3],fleck,2);
   }
  }else{
   ctx.fillStyle=colors.ink;ctx.fillRect(v.x-3,v.y-3,6,6);
   ctx.fillStyle=colors.iron[2];ctx.fillRect(v.x-2,v.y-2,3,2);
  }
 }
}
