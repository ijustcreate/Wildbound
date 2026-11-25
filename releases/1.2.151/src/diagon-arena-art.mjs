import {ARENA_BOUNDS,ARENA_COUNTER,ARENA_FENCE_EDGES,ARENA_FURNITURE,ARENA_RACK,ARENA_RING,ARENA_RING_GATE,ARENA_RING_VERTICES,ARENA_SEATING,ARENA_STAIRS,ARENA_TORCHES,arenaFighter} from './diagon-arena-layout.mjs';
import {diagonArenaExchange,diagonArenaGuests,diagonArenaPrompt} from './diagon-arena.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {drawBowAim} from './bow-aim.mjs';
import {paintSwordCharge} from './sword-feel.mjs';
import {drawPortalFlash} from './portal-transition.mjs';
import {actionInputLabel} from './action-prompts.mjs';
import {pixelLine} from './pixel-shapes.mjs';
import {drawArenaSpectators} from './arena-spectators.mjs';
import {drawManaWardSparkles} from './diagon-garden-ward-art.mjs';

const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
const tone=(x,y)=>((Math.imul(x+57,0x9e3779b1)^Math.imul(y-33,0x85ebca77))>>>28);
const stones=['#3c3f3b','#3e423c','#454742','#40403c','#484945'];
const trim='#c3a16c';
const lampPositions=[[7601,4516],[7957,4516],[8074,4503],[8296,4503],[7601,4878],[7968,4878],[7974,5052],[8090,5052]];
const fenceSlices=new WeakMap();
let torchHalo;

function octagon(c,offset,color){
 const mx=ARENA_RING.x+ARENA_RING.w/2,my=ARENA_RING.y+ARENA_RING.h/2;
 const fx=1+offset/ARENA_RING.w*2,fy=1+offset/ARENA_RING.h*2;
 c.beginPath();
 for(const [i,point]of ARENA_RING_VERTICES.entries()){
  const x=Math.round(mx+(point.x-mx)*fx),y=Math.round(my+(point.y-my)*fy);
  if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
 }
 c.closePath();c.fillStyle=color;c.fill();
}

function floor(c,bounds){
 const b=ARENA_BOUNDS;
 rect(c,bounds.left,bounds.top,bounds.right-bounds.left+1,bounds.bottom-bounds.top+1,'#151b1c');
 rect(c,b.x-6,b.y-5,b.w+12,b.h+12,'#282c2b');
 rect(c,b.x,b.y,b.w,b.h,'#292c2b');
 for(let y=Math.max(0,Math.floor((bounds.top-b.y)/16));y<Math.min(b.h/16,(bounds.bottom-b.y)/16);y++){
  for(let x=Math.max(0,Math.floor((bounds.left-b.x)/32)-1);x<Math.min(b.w/32,(bounds.right-b.x)/32+1);x++){
   const sx=b.x+x*32+(y%2?16:0),sy=b.y+y*16,sw=Math.min(31,b.x+b.w-sx);
   if(sw<=0)continue;
   const shade=tone(x,y);
   rect(c,sx,sy,sw,15,stones[shade%stones.length]);
   if(shade<7)rect(c,sx+3,sy+2,Math.min(sw-3,12+shade),1,'#53534a');
   if(shade<3)rect(c,sx+3+shade*5,sy+10,3,1,'#303332');
  }
 }
 rect(c,b.x,b.y,b.w,18,'#212827');
 rect(c,b.x,b.y+18,b.w,3,'#595346');
 rect(c,b.x,b.y+b.h-6,b.w,6,'#513d35');
 rect(c,b.x,b.y+18,8,b.h-24,'#383330');
 rect(c,b.x+b.w-8,b.y+18,8,b.h-24,'#302d2a');
}

function arch(c,x,y,w){
 rect(c,x,y+12,w,67,'#4d4940');
 rect(c,x+8,y+5,w-16,13,'#4d4940');
 rect(c,x+17,y,w-34,10,'#585247');
 rect(c,x+7,y+18,w-14,63,'#222b2b');
 rect(c,x+15,y+12,w-30,10,'#222b2b');
 rect(c,x+12,y+27,5,53,'#302f2c');
 rect(c,x+w-17,y+27,5,53,'#171d1f');
 rect(c,x+19,y+28,w-38,3,'#4b4840');
 rect(c,x+5,y+78,w-10,3,'#655c49');
}

function ring(c){
 const {x,y,w,h}=ARENA_RING;
 octagon(c,9,'#242622');
 octagon(c,5,'#4a4036');
 octagon(c,2,'#aa7c59');
 octagon(c,-2,'#734d43');
 octagon(c,-8,'#80584a');
 c.save();c.clip();
 for(let row=0;row<Math.floor(h/12);row++)for(let column=0;column<Math.floor(w/17);column++){
  const mark=tone(column+62,row);
  if(mark<7)rect(c,x+6+column*17+(mark%3),y+7+row*12,6+mark,mark<3?2:1,mark<2?'#895e50':'#694841');
 }
 const cx=x+w/2,cy=y+h/2;
 const stains=[[-112,-54,16],[-49,32,22],[9,-17,21],[100,-57,16],[117,66,14],[16,70,11],[-131,45,10],[-51,-73,12],[72,31,13]];
 for(const [i,[dx,dy,size]]of stains.entries()){
  const sx=cx+dx,sy=cy+dy,ramp=i%3===0?['#724b41','#664239','#885848']:['#755047','#694642','#895951'];
  for(let row=0;row<7;row++){
   const n=tone(i,row+19),width=(row<2||row>5?.49:.8)*size+n%7;
   rect(c,sx-width/2+(n%5-2),sy+row*2,width,2,ramp[row===3||row===4?1:0]);
  }
  rect(c,sx-size*.5-4,sy+8,4,2,ramp[1]);
  rect(c,sx+size*.5+3,sy+3,3,2,ramp[2]);
 }
 for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
  for(let row=0;row<26;row++){
   const px=cx+dx*(26+row*3),py=cy+dy*(26+row*2);
   if(row%3===0)rect(c,px,py,3,1,'#895d4e');
  }
 }
 for(const [dx,dy] of [[-24,0],[-14,-7],[-14,7],[14,-7],[14,7],[24,0]])rect(c,cx+dx-2,cy+dy-1,5,2,'#b18067');
 rect(c,cx-1,cy-9,2,18,'#b18067');
 c.restore();
 const gate=ARENA_RING_GATE;
 rect(c,gate.x-10,gate.top+2,25,gate.bottom-gate.top-4,'#977458');
 for(const xx of [gate.x-9,gate.x+9])rect(c,xx,gate.top+4,2,gate.bottom-gate.top-8,'#c1a077');
}

function fenceSections(edge){
 let result=fenceSlices.get(edge);
 if(result)return result;
 const {a,b}=edge,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),count=Math.ceil(length/15);
 const pieceCount=Math.ceil(count/3);
 result=[];
 for(let piece=0;piece<pieceCount;piece++){
  const i0=piece*3,i1=Math.min(count,i0+3);
  const ax=Math.round(a.x+dx*i0/count),ay=Math.round(a.y+dy*i0/count);
  const bx=Math.round(a.x+dx*i1/count),by=Math.round(a.y+dy*i1/count);
  const minX=Math.min(ax,bx)-7,minY=Math.min(ay,by)-35,w=Math.abs(bx-ax)+15,h=Math.abs(by-ay)+42;
  const art=document.createElement('canvas');art.width=w;art.height=h;
  const p=art.getContext('2d');
  const point=(i,z=0)=>({x:Math.round(a.x+dx*i/count)-minX,y:Math.round(a.y+dy*i/count)-minY-z});
  for(let i=i0;i<i1;i++){
   const aa=point(i),bb=point(i+1);
   const rail=(height,color,weight=1)=>pixelLine(p,point(i,height),point(i+1,height),color,weight);
   rail(1,'#252724',3);rail(5,'#514b42',2);rail(28,'#282e2b',4);rail(29,'#95907b',1);
   pixelLine(p,point(i,6),point(i+1,26),'#545a4e');
   pixelLine(p,point(i,26),point(i+1,6),'#474e43');
   rect(p,aa.x-1,aa.y-28,3,31,'#2e3630');
   rect(p,aa.x,aa.y-26,1,28,'#8b8b73');
   if(i===count-1){rect(p,bb.x-1,bb.y-29,3,32,'#2e3630');rect(p,bb.x,bb.y-26,1,28,'#8b8b73');}
  }
  if(piece===0||piece===pieceCount-1){
   const end=point(piece===0?0:count);
   rect(p,end.x-3,end.y-32,7,34,'#342e29');
   rect(p,end.x-1,end.y-30,3,29,'#77664b');
   rect(p,end.x-3,end.y-34,7,4,'#ae8958');
  }
  result.push({x:minX,y:minY,art,depth:(ay+by)/2+.5});
 }
 fenceSlices.set(edge,result);
 return result;
}

function torchGlow(c,x,y,time){
 if(!torchHalo){
  torchHalo=document.createElement('canvas');torchHalo.width=torchHalo.height=96;
  const p=torchHalo.getContext('2d'),glow=p.createRadialGradient(48,48,2,48,48,48);
  glow.addColorStop(0,'#f7b45b78');glow.addColorStop(.37,'#e3854340');glow.addColorStop(1,'#de6d3100');
  p.fillStyle=glow;p.fillRect(0,0,96,96);
 }
 c.save();c.globalCompositeOperation='screen';c.globalAlpha=.84+Math.sin(time*7+x)*.11;
 c.drawImage(torchHalo,x-63,y-72,126,112);c.restore();
}

function torch(c,x,y,time){
 const sway=Math.round(Math.sin(time*11+x)*2),lift=Math.sin(time*8+y)>0?3:0;
 rect(c,x-8,y-2,16,5,'#2c2a26');
 rect(c,x-5,y-4,10,4,'#595042');rect(c,x-2,y-29,4,28,'#413b30');
 rect(c,x-1,y-24,1,22,'#b18a55');
 rect(c,x-6,y-33,12,5,'#58483a');rect(c,x-5,y-34,10,2,'#b38755');
 rect(c,x-4,y-42,8,8,'#c96d3f');
 rect(c,x-2+sway,y-47-lift,5,12+lift,'#efa95c');
 rect(c,x-1+sway,y-42,3,7,'#ffda89');
 rect(c,x+1+sway,y-40,1,4,'#fff0b4');
 if(lift)rect(c,x+sway+1,y-50-(Math.floor(time*8)%4),1,2,'#e3aa62');
}

function rack(c,{x,y,w=52,h=13}){
 const left=x-w/2;
 rect(c,left-3,y+2,w+6,Math.min(h,8),'#312b25');
 rect(c,left,y-30,w,34,'#493a30');
 rect(c,left+2,y-29,w-4,29,'#59463a');
 rect(c,left+1,y-31,w-2,4,'#98704a');
 rect(c,left+3,y-30,w-7,1,'#bb8d5c');
 for(const [i,dx]of [8,19,30,41].entries()){
  const sx=left+dx;
  pixelLine(c,{x:sx,y:y-2},{x:sx+2,y:y-25},'#3c3630',4);
  pixelLine(c,{x:sx+1,y:y-9},{x:sx+2,y:y-24},i===2?'#9a7c50':'#7e8b8a',2);
  rect(c,sx-2,y-9,8,2,'#b0905f');
  if(i===1||i===3){rect(c,sx-2,y-25,8,6,'#8d9790');rect(c,sx-2,y-25,7,2,'#bcc3af');}
 }
 rect(c,left+1,y-3,w-2,5,'#73563e');
 rect(c,left+2,y-2,w-4,1,'#a68055');
 rect(c,left+3,y+1,4,6,'#3c3028');rect(c,left+w-7,y+1,4,6,'#3c3028');
}

function tavernGround(c){
 const b=ARENA_COUNTER;
 rect(c,b.x-28,b.y-112,b.w+56,179,'#53443b');
 for(let i=0;i<16;i++){
  const x=b.x-28+i*14;
  rect(c,x,b.y-112,13,179,['#674e40','#604a3e','#704f42','#57443b'][tone(i,4)%4]);
  rect(c,x,b.y-112+(i%3)*35,13,1,'#3e3231');
 }
 rect(c,b.x-28,b.y-112,b.w+56,2,'#a48662');
 const stair=ARENA_STAIRS;
 rect(c,stair.x-30,stair.y-31,60,56,'#222728');
 for(let i=0;i<7;i++){
  const w=51+i,top=stair.y-27+i*7;
  rect(c,stair.x-w/2,top,w,6,i%2?'#62594d':'#514b42');
  rect(c,stair.x-w/2,top,w,1,'#989075');
 }
 rect(c,stair.x-31,stair.y-28,3,53,'#92684a');
 rect(c,stair.x+29,stair.y-28,3,53,'#6e5544');
}

function drawTavernCounter(c){
 const {x,y,w,h}=ARENA_COUNTER;
 rect(c,x-4,y+3,w+9,h+3,'#342923');
 rect(c,x,y-3,w,h,'#694c3d');
 rect(c,x,y-5,w,10,'#887052');
 rect(c,x,y-5,w,2,'#b68861');
 rect(c,x+9,y+6,w-18,2,'#946846');
 rect(c,x+4,y+h-1,w-8,2,'#372b25');
 rect(c,x+9,y+h-5,w-18,2,'#a68351');
 rect(c,x+9,y+h-6,Math.floor((w-18)*.7),1,'#c29e65');
 for(let n=0;n<8;n++)rect(c,x+10+n*21,y+9,2,5,'#4d3832');
 for(const offset of [15,35,86,132,148]){
  bottle(c,x+offset,y-5,offset%3?'#74a28c':'#c48e60',11);
 }
}

function bottle(c,x,y,color,size){
 rect(c,x,y-size+3,6,size-3,'#3a3833');
 rect(c,x+1,y-size+3,4,size-4,color);
 rect(c,x+2,y-size,2,4,color);rect(c,x+2,y-size,2,1,'#d3ab79');
 rect(c,x+1,y-4,2,1,'#dab587');
}

function barBack(c){
 const {x,y,w}=ARENA_COUNTER;
 const top=y-94,left=x+9,shelfWidth=w-18;
 rect(c,left-5,top-4,shelfWidth+10,68,'#392b29');
 rect(c,left,top,shelfWidth,61,'#6a4e3e');
 rect(c,left+3,top+3,shelfWidth-6,55,'#363431');
 for(let section=0;section<5;section++){
  const sx=left+section*31;
  rect(c,sx+5,top+7,23,43,'#42403a');
  rect(c,sx+3,top+4,2,49,'#8a6649');
  for(let row=0;row<2;row++)for(let j=0;j<3;j++){
   const px=sx+7+j*7,py=top+24+row*23,n=tone(section*3+j,row+9);
   const color=['#6f9b80','#ad7960','#689490','#b4946f','#858069'][n%5];
   bottle(c,px,py,color,8+n%5);
  }
 }
 for(const rise of [24,47]){
  rect(c,left+2,top+rise,shelfWidth-4,4,'#644936');
  rect(c,left+2,top+rise,shelfWidth-4,1,'#a5825c');
 }
 rect(c,left-2,top-1,shelfWidth+4,3,'#a5835e');
 rect(c,left-1,top+56,shelfWidth+2,3,'#937556');
 for(let i=0;i<4;i++){
  const dx=x+w+10+i%2*17,kegY=y-75+Math.floor(i/2)*18;
  rect(c,dx,kegY,16,16,'#3c2f2b');rect(c,dx+1,kegY+1,13,12,'#866447');
  rect(c,dx+2,kegY+2,9,2,'#ad885c');rect(c,dx+3,kegY+9,10,2,'#4c3d31');
  rect(c,dx+8,kegY+10,3,3,'#b19163');
 }
}

function arenaSeating(c,{x,y,w,h,axis,face}){
 const left=x-w/2,top=y-h/2;
 rect(c,left-5,top+5,w+10,h+5,'#272825');
 rect(c,left,top,w,h,'#4b3a31');
 if(axis==='x'){
  for(const [dy,color]of [[1,'#675041'],[4,'#7c6048'],[7,'#95744e'],[12,'#5a4537'],[17,'#785c43']]){
   rect(c,left+2,top+dy,w-4,3,color);
  }
  for(let sx=left+14;sx<left+w;sx+=29){
   rect(c,sx,top+5,2,h-5,'#4a3a2e');rect(c,sx+1,top+6,1,10,'#796046');
  }
  rect(c,left-3,top+(face===0?1:h-5),w+6,3,'#ac8559');
  for(const sx of [left,left+w-5])rect(c,sx,top+1,5,h-1,'#5d4a38');
 }else{
  for(const [dx,color]of [[1,'#66513e'],[5,'#896a4d'],[10,'#9d7851'],[16,'#624d3a'],[22,'#7d6044']]){
   rect(c,left+dx,top+2,4,h-4,color);
  }
  for(let sy=top+8;sy<top+h;sy+=24){
   rect(c,left+3,sy,w-6,2,'#47392f');rect(c,left+3,sy+1,16,1,'#816449');
  }
  rect(c,left,top-2,3,h+4,'#aa8055');
 }
}

function furniture(c,o){
 const {x,y,w,h}=o;
 if(o.kind==='post'){
  rect(c,x-3,y+15,w+6,7,'#252928');
  rect(c,x,y-32,w,h+28,'#564c40');
  rect(c,x+2,y-31,4,h+20,'#77644d');
  rect(c,x+w-5,y-30,5,h+19,'#3b372f');
  rect(c,x-1,y-34,w+2,4,'#88765a');
  rect(c,x-2,y+12,w+4,6,'#695c4a');
  return;
 }
 rect(c,x+2,y+h-7,w-1,5,'#4e3933');
 rect(c,x+6,y+h-9,4,8,'#2e2422');rect(c,x+w-11,y+h-9,4,8,'#2e2422');
 rect(c,x,y+3,w,h-12,'#614537');
 rect(c,x,y,w,5,'#9c744e');
 rect(c,x+2,y+5,w-4,h-16,'#805d46');
 rect(c,x+4,y+12,w-8,1,'#a57852');
 rect(c,x+w-17,y+1,8,6,'#a68b64');
 rect(c,x+w-15,y+1,5,2,'#c7b08b');
 for(const [dx,dy] of [[10,7],[24,12],[37,5]]){
  rect(c,x+dx,y+dy,7,5,'#634732');rect(c,x+dx+2,y+dy+1,4,3,'#bf9863');
  rect(c,x+dx+1,y+dy,5,1,'#dec494');
 }
 for(const sx of [x-10,x+w+3]){rect(c,sx,y+14,7,11,'#563e31');rect(c,sx,y+14,7,2,'#887050');}
}

function lamp(c,x,y,time,visible){
 if(!visible({x,y},82))return;
 const pulse=.98+Math.sin(time*4.2+x*.09)*.05;
 c.save();
 const glow=c.createRadialGradient(x,y+11,1,x,y+11,67);
 glow.addColorStop(0,'#f3b76542');glow.addColorStop(1,'#ef9e4800');
 c.globalAlpha*=pulse;c.fillStyle=glow;c.fillRect(x-67,y-56,134,134);c.restore();
 rect(c,x-6,y-12,12,14,'#493632');
 rect(c,x-4,y-10,8,10,'#a97343');
 rect(c,x-2,y-9,4,7,'#f0b668');
 rect(c,x-1,y-8,2,4,'#ffe1a1');
 rect(c,x-8,y+2,16,2,'#51423a');
}

function label(c,text,x,y,size,color=trim){
 c.font=size+'px Georgia';c.textAlign='center';c.fillStyle=color;c.fillText(text,x,y);c.textAlign='start';
}

function dialogue(c,talk,w,h,offset=0){
 const lines=[''];
 c.font='11px system-ui';
 const width=Math.min(w-28,410);
 for(const word of talk.line.split(' ')){
  const line=lines.at(-1);
  if(line&&c.measureText(line+' '+word).width>width-23)lines.push(word);
  else lines[lines.length-1]=line?line+' '+word:word;
 }
 const height=30+lines.length*14,x=(w-width)/2,y=h-48-height-offset;
 rect(c,x,y,width,height,'#222321ec');
 rect(c,x,y,width,1,'#af8a56');
 c.fillStyle='#debb80';c.fillText(talk.speaker,x+11,y+15);
 c.fillStyle='#eee0c8';
 for(const [i,line] of lines.entries())c.fillText(line,x+11,y+31+i*14);
 return height+7;
}

export function drawDiagonArena(renderer,g,w,h,bounds){
 const c=renderer.ctx,arena=g.trainTest.arena;
 const visible=(o,pad=100)=>o.x+pad>bounds.left&&o.x-pad<bounds.right&&o.y+pad>bounds.top&&o.y-pad<bounds.bottom;
 floor(c,bounds);
 for(const x of [7436,7570,7704,7838,7972,8106,8240])if(visible({x,y:4414},128))arch(c,x,ARENA_BOUNDS.y-17,111);
 if(visible({x:ARENA_RING.x+ARENA_RING.w/2,y:ARENA_RING.y+ARENA_RING.h/2},245))ring(c);
 tavernGround(c);
 if(visible({x:8192,y:4620},136))barBack(c);
 label(c,'WEAPON RACK',ARENA_RACK.x,ARENA_RACK.y-40,9);
 label(c,'THE LAMPLIT VAULT',8192,4540,15);
 label(c,'MERIDIAN HALL',ARENA_STAIRS.x,ARENA_STAIRS.y+29,10);
 for(const [x,y] of lampPositions)lamp(c,x,y,g.time,visible);
 for(const [x,y]of ARENA_TORCHES)if(visible({x,y},70))torchGlow(c,x,y,g.time);
 renderer.drawWorldLoot(g,w,h);
 for(const p of g.players)if(arenaFighter(g,p)){
  paintSwordCharge(c,p,g.time);drawBowAim(c,p,1,g.time,g);
 }
 const queue=[{depth:ARENA_COUNTER.y+ARENA_COUNTER.h,paint:()=>drawTavernCounter(c)}];
 if(visible(ARENA_RACK,70))queue.push({depth:ARENA_RACK.y+9,paint:()=>rack(c,ARENA_RACK)});
 for(const bench of ARENA_SEATING)if(visible(bench,Math.max(bench.w,bench.h)/2+38))
  queue.push({depth:bench.y-9,paint:()=>arenaSeating(c,bench)});
 drawArenaSpectators(renderer,g,bounds,queue);
 for(const [x,y]of ARENA_TORCHES)if(visible({x,y},70))queue.push({depth:y,paint:()=>torch(c,x,y,g.time)});
 for(const edge of ARENA_FENCE_EDGES){
  const {a,b}=edge;
  if(!visible({x:(a.x+b.x)/2,y:(a.y+b.y)/2},Math.hypot(b.x-a.x,b.y-a.y)/2+44))continue;
  for(const part of fenceSections(edge))if(visible({x:part.x,y:part.y},100))
   queue.push({depth:part.depth,paint:()=>c.drawImage(part.art,part.x,part.y)});
 }
 for(const o of ARENA_FURNITURE)if(visible(o))queue.push({depth:o.y+o.h,paint:()=>furniture(c,o)});
 for(const p of [...diagonArenaGuests(),...g.players])if(visible(p)){
  queue.push({depth:p.y,paint:()=>{
   renderer.animator.draw(c,{...p,y:p.y+(p.role==='bartender'?12:0),kind:p.kind||'player'},g.time,PLAYER_RENDER_SIZE);
   drawManaWardSparkles(c,p,g.time);
  }});
 }
 for(const subject of queue.sort((a,b)=>a.depth-b.depth))subject.paint();
 renderer.drawCombatProjectiles(g,w,h);
 renderer.drawCombatEffects(g);
 c.restore();
 const local=g.players.filter(p=>!renderer.cameraOwnerIds?.length||renderer.cameraOwnerIds.includes(p.id));
 const fighting=local.some(p=>arenaFighter(g,p));
 rect(c,14,13,143,33,'#232321e8');
 c.font='bold 11px system-ui';c.fillStyle=fighting?'#f5b485':'#d7c79d';
 c.fillText(fighting?'RING · PVP ACTIVE':'GALLERY · SAFE',24,32);
 let offset=0;
 for(const p of local){
  const talk=arena?.talk[p.id];
  if(talk?.until>g.time)offset+=dialogue(c,talk,w,h,offset);
 }
 if(!offset){
  const exchange=local.map(p=>diagonArenaExchange(g,p)).find(Boolean);
  if(exchange)dialogue(c,exchange,w,h);
 }
 for(const p of local){
  const prompt=diagonArenaPrompt(g,p);
  if(!prompt)continue;
  c.font='bold 11px system-ui';c.textAlign='center';c.fillStyle='#f0d8a7';
  c.fillText(actionInputLabel(g,p,'interact')+' · '+prompt,w/2,h-23);
  c.textAlign='start';break;
 }
 drawPortalFlash(c,g,w,h,renderer.cameraOwnerIds);
}
