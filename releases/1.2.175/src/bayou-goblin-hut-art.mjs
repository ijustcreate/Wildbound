import {pixelPolygon} from './pixel-shapes.mjs';
import {BAYOU_GOBLIN_HUT as HUT,BAYOU_GOBLIN_HUT_BENCH as BENCH,BAYOU_GOBLIN_HUT_WALLS as WALLS,inBayouGoblinHut,isBayouHutSurface} from './bayou-goblin-hut-layout.mjs';
import {WISE_LITTLE_GOBLIN} from './bayou-goblin-hut.mjs';

const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
const shape=(c,color,points)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
const roof={ink:'#172922',shade:'#263b2b',body:'#41513a',light:'#68724a',reed:'#92875c'};
const wood={ink:'#2a261e',shade:'#49392b',body:'#67523a',light:'#816544',edge:'#9a7b4b'};
const lamp={x:HUT.x+HUT.w-24,y:HUT.front-19};
const apportion=(d,visible)=>isBayouHutSurface(d)&&visible({x:HUT.cx,y:HUT.y+46},165);

export function drawBayouGoblinHutGround(c,d,visible){
 if(!apportion(d,visible))return;
 const {x,y,w,h,cx,front}=HUT;
 rect(c,'#172b216b',x-7,y+9,w+21,h+9);
 rect(c,wood.ink,x+7,y+8,w-14,h-9);
 for(let i=0;i<10;i++){
  const yy=y+8+i*9;
  rect(c,i%4===2?wood.body:wood.light,x+9,yy,w-18,8);
  rect(c,wood.body,x+9,yy+7,w-18,1);
  for(let j=0;j<4;j++)rect(c,wood.shade,x+26+(j*31+i*11)%110,yy+2,1,5);
 }
 rect(c,wood.ink,cx-25,front-5,50,12);
 rect(c,wood.edge,cx-23,front-3,46,5);rect(c,wood.body,cx-22,front+2,44,3);
 for(let i=0;i<5;i++){
  const yy=front+8+i*8,offset=[-3,-6,0,2,-4][i];
  rect(c,'#303b2d',cx-22+offset,yy,46-i*3,7);
  rect(c,i%2?'#4b5440':'#56604a',cx-20+offset,yy,42-i*3,5);
 }
 rect(c,'#382d25',cx-26,y+49,54,29);rect(c,'#5b3c32',cx-24,y+51,50,25);
 rect(c,'#8d6043',cx-19,y+54,40,2);rect(c,'#8d6043',cx-19,y+71,40,2);
}

function wall(c,b,height){
 const {x,y,w,h}=b;
 rect(c,wood.ink,x,y-height,w,h+height);
 rect(c,wood.shade,x+1,y-height+2,w-2,h+height-5);
 for(let i=0;i<w-3;i+=7){rect(c,i%3===0?wood.light:wood.body,x+2+i,y-height+3,4,h+height-8);}
 rect(c,wood.edge,x,y-height,w,3);rect(c,wood.ink,x,y+h-4,w,4);
}

function furniture(c,hasGift){
 const {x,y,w,h}=BENCH;
 rect(c,'#271f19',x+1,y+h-6,4,6);rect(c,'#271f19',x+w-5,y+h-6,4,6);
 rect(c,wood.ink,x,y-13,w,h+10);rect(c,wood.body,x+2,y-12,w-4,h+5);
 rect(c,wood.edge,x+2,y-12,w-4,2);rect(c,wood.shade,x+2,y+h-14,w-4,3);
 rect(c,'#3a493a',x+6,y+3,12,7);rect(c,'#73816c',x+7,y+1,9,3);
 rect(c,'#a57e4c',x+7,y+22,7,3);rect(c,'#d0ad79',x+8,y+20,5,2);
 if(hasGift){
  rect(c,'#2d322b',x+5,y+h-29,13,5);rect(c,'#8c8a71',x+6,y+h-28,11,3);
  rect(c,'#bfc3a4',x+7,y+h-28,4,1);rect(c,'#64ac68',x+15,y+h-28,2,2);
 }
}

function roofApex(c){
 const {x,y,w,front,cx}=HUT,l=x-17,r=x+w+17;
 shape(c,roof.ink,[[l-2,y-12],[cx-8,y-78],[cx+7,y-78],[r+3,y-13],[r+3,front-54],[l-2,front-54]]);
 shape(c,roof.body,[[l,y-13],[cx-7,y-74],[cx+5,y-74],[r,y-13],[r,front-58],[l,front-58]]);
 shape(c,roof.light,[[l+6,y-11],[cx-6,y-72],[cx-3,y-72],[cx-3,front-59],[l+6,front-59]]);
 shape(c,roof.shade,[[cx+4,y-74],[r,y-13],[r,front-58],[cx+6,front-58]]);
 for(let i=0;i<9;i++){
  const yy=y-10+i*5;
  rect(c,roof.shade,l+6+i,yy,cx-l-13-i,1);rect(c,roof.ink,cx+10,yy+1,r-cx-15-i,1);
 }
 for(let i=0;i<12;i++){
  const px=l+i*16;
  rect(c,i%3?roof.reed:roof.light,px+1,front-61,10+(i%3),3+(i%4));
 }
 rect(c,roof.shade,cx-4,y-73,8,front-y+14);rect(c,roof.reed,cx-2,y-73,2,front-y+12);
}

function lampPost(c){
 const {x,y}=lamp;
 rect(c,wood.ink,x-2,y-20,4,21);rect(c,wood.edge,x-1,y-20,1,17);
 rect(c,'#373023',x-5,y-24,10,9);rect(c,'#d18b49',x-3,y-23,6,6);
 rect(c,'#ffe09d',x-2,y-22,4,4);rect(c,'#8d7947',x-5,y-25,10,2);
}

export function bayouGoblinHutSubjects(g,party,visible){
 if(!apportion(g.trainTest.design,visible))return [];
 const inside=party.some(p=>inBayouGoblinHut(p.x,p.y,-5)),viewer=party.find(p=>p.ui?.bayouGoblin);
 const subjects=[
  {depth:HUT.y+12,paint:c=>wall(c,WALLS[0],35)},
  {depth:HUT.front,paint:c=>{
   for(const b of WALLS.slice(1))wall(c,b,inside?16:31);
   lampPost(c);
   if(!inside)roofApex(c);
  }},
 ];
 if(inside){
  subjects.push({depth:BENCH.y+BENCH.h,paint:c=>furniture(c,!party.every(p=>p.npcQuests?.wiseLittleGoblin?.bladeClaimed))});
  const {x,y}=WISE_LITTLE_GOBLIN,dx=viewer?.x-x,dy=viewer?.y-y;
  subjects.push({depth:y,npc:{...WISE_LITTLE_GOBLIN,faceX:dx||0,faceY:dy||1,animationAction:viewer?'talk':'idle'}});
 }
 return subjects;
}

export function drawBayouGoblinHutLamp(c,d,visible,dark){
 if(dark<.08||!apportion(d,visible))return;
 const {x,y}=lamp,light=c.createRadialGradient(x,y-17,0,x,y-17,31);
 light.addColorStop(0,'#ffd38b80');light.addColorStop(.35,'#d9994350');light.addColorStop(1,'#d9994300');
 c.save();c.globalAlpha=dark;c.fillStyle=light;c.fillRect(x-31,y-48,62,62);c.restore();
}
