import {block as b, shape as p, line as l} from './diagon-shop-brush.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {chipGravestone,nearestGravestone} from './graveyard-world.mjs';
import {NOCTURNE_STREET_INSET} from './alley-street-layout.mjs';

export const NIGHTGLASS_REAR_DOOR=Object.freeze({x:9408-NOCTURNE_STREET_INSET,y:5507,offsetY:7,halfSpan:21});

// Public approach, rear lane, Curios court, and Nightglass graveyard.
export const NOCTURNE_REAR_AREAS=Object.freeze([
 {x:9130,y:5214,w:365,h:72},
 {x:9426,y:4884,w:62,h:662},
 {x:9426,y:4828,w:195,h:150},
 {x:9426,y:5410,w:236,h:190},
 {x:NIGHTGLASS_REAR_DOOR.x-16,y:5486,w:100,h:43},
]);
export const NOCTURNE_GRAVES=Object.freeze([
 {id:'morgana',name:'Morgana le Fay',epitaph:'She kept her own counsel.',x:9505,y:5452,w:37,h:31},
 {id:'merlin',name:'Merlin',epitaph:'May wisdom temper power.',x:9563,y:5446,w:43,h:36},
 {id:'rowena',name:'Rowena Ravenclaw',epitaph:'An open mind outlives stone.',x:9620,y:5460,w:37,h:32},
 {id:'godric',name:'Godric Gryffindor',epitaph:'Courage walks on after us.',x:9535,y:5527,w:40,h:34},
 {id:'helga',name:'Helga Hufflepuff',epitaph:'There was always room at her table.',x:9605,y:5534,w:39,h:33},
]);
const yard={left:9474,right:9651,top:5425,bottom:5588};
const gate={x:yard.left,y:5507,halfSpan:20};
const ghostChance=.25;
const stateFor=g=>g.trainTest.nocturneCemetery??={damage:{},ghosts:[]};
const broken=(g,grave)=>g.trainTest.nocturneCemetery?.damage[grave.id]>=48;
const nearDoor=(p,door,reach=28)=>Math.abs(p.x-door.x)<reach&&Math.abs(p.y-door.y)<door.halfSpan;
const closeEnough=(actor,grave)=>Math.hypot(actor.x-grave.x,actor.y-grave.y)<26;
const checkFence=(x,y,r)=>x>=yard.left-r&&x<=yard.right+r&&y>=yard.top-r&&y<=yard.bottom+r;

export function nocturneGraveBlocked(g,x,y,r){
 if(checkFence(x,y,r)){
  if(Math.abs(y-yard.top)<r+3||Math.abs(y-yard.bottom)<r+3||Math.abs(x-yard.right)<r+3)return true;
  if(Math.abs(x-yard.left)<r+3&&(!g.trainTest.nocturneCemetery?.gate||Math.abs(y-gate.y)>gate.halfSpan-r))return true;
 }
 return NOCTURNE_GRAVES.some(grave=>!broken(g,grave)&&Math.abs(x-grave.x)<grave.w*.48+r&&Math.abs(y-grave.y)<5+r);
}

export function nocturneCemeteryInteraction(g,actor){
 const state=g.trainTest.nocturneCemetery;
 if(nearDoor(actor,NIGHTGLASS_REAR_DOOR))return {label:(state?.door?'CLOSE':'OPEN')+' GRAVEYARD DOOR',key:'door',door:NIGHTGLASS_REAR_DOOR};
 if(nearDoor(actor,gate))return {label:(state?.gate?'CLOSE':'OPEN')+' CEMETERY GATE',key:'gate',door:gate};
 const grave=NOCTURNE_GRAVES.find(grave=>closeEnough(actor,grave));
 return grave?{label:'READ '+grave.name.toUpperCase(),grave}:null;
}

export function interactNocturneCemetery(g,actor){
 const action=nocturneCemeteryInteraction(g,actor);
 if(!action)return false;
 if(action.grave){
  const {name,epitaph}=action.grave;
  g.trainTest.notice=name+' · '+epitaph;
  g.trainTest.noticeUntil=g.trainTest.time+6;
  g.message(g.trainTest.notice);
 }else{
  const state=stateFor(g);
  if(state[action.key]&&[...g.players,...state.ghosts].some(p=>p.hp>0&&nearDoor(p,action.door,12))){
   g.message('The doorway is occupied.');return true;
  }
  state[action.key]=!state[action.key];
  g.onSound?.('ui',actor);
  g.persist?.();
 }
 return true;
}

export function harvestNocturneGravestone(g,actor,damage,range){
 if(g.trainTest?.design.activeRoom!=='diagon'||actor.room||actor.ui||actor.hp<=0||!checkFence(actor.x,actor.y,range))return false;
 const state=stateFor(g);
 const stones=NOCTURNE_GRAVES.map(grave=>({...grave,kind:'gravestone',graveyard:true,rootY:grave.y,maxHp:48,hp:48-(state.damage[grave.id]||0)}));
 const stone=nearestGravestone(stones,actor,range,0);
 if(!stone)return false;
 chipGravestone(g,actor,stone,damage);
 state.damage[stone.id]=stone.harvest;
 if(stone.depleted&&(g.random?.()??Math.random())<ghostChance){
  const ghost={id:g.nextId++,kind:'ghost',skin:'ghost',name:stone.name+"'s ghost",nocturneGraveGhost:true,
   x:stone.x,y:stone.y+19,hp:76,maxHp:76,speed:54,damage:12,state:'hunt',cooldown:.7,attack:0,step:0,
   moving:false,faceX:0,faceY:1,ambientGraveSpawn:true,eventBound:false,aggro:true};
  g.configureCreature?.(ghost,false);
  g.enemies.push(ghost);
  state.ghosts.push(ghost);
  g.onSound?.('magic',ghost);
  g.trainTest.notice='A ghost rises from '+stone.name+"'s grave!";
  g.trainTest.noticeUntil=g.trainTest.time+4;
  g.message(g.trainTest.notice);
 }
 g.persist?.();
 return true;
}

export function restoreNocturneCemeteryGhosts(g){
 const ghosts=g.trainTest.nocturneCemetery?.ghosts;
 if(!ghosts?.length)return;
 for(let i=ghosts.length-1;i>=0;i--){
  const ghost=ghosts[i],live=g.enemies.find(e=>e.nocturneGraveGhost&&e.id===ghost.id);
  if((live||ghost).hp<=0){ghosts.splice(i,1);continue;}
  if(live)ghosts[i]=live;
  else g.enemies.push(ghost);
 }
}

export function drawNocturneRearGround(c,g,visible){
 const inView=NOCTURNE_REAR_AREAS.filter(a=>visible(a.x+a.w/2,a.y+a.h/2,a.w/2,a.h/2));
 if(inView.length){
  c.save();c.beginPath();for(const {x,y,w,h} of inView)c.rect(x+2,y+2,w-4,h-4);
  c.clip();b(c,9130,4828,532,772,'#17212661');c.restore();
 }
 if(visible(9562,5507,98,88)){
  b(c,yard.left+1,yard.top+1,yard.right-yard.left-2,yard.bottom-yard.top-2,'#28352c43');
  b(c,yard.left+2,gate.y-9,47,18,'#4f545055');
 }
 for(const grave of NOCTURNE_GRAVES){
  const {x,y,w}=grave,a=Math.round(w*.5),damaged=broken(g,grave);
  if(!visible(x,y+15,w+7,29))continue;
  p(c,'#292825',[[x-a-3,y],[x+a+2,y],[x+a+4,y+30],[x+a-2,y+36],[x-a,y+36],[x-a-5,y+31]]);
  p(c,damaged?'#6b4836':'#68523e',[[x-a+2,y+4],[x+a-3,y+4],[x+a,y+29],[x+a-4,y+33],[x-a+1,y+33],[x-a-2,y+29]]);
  for(let i=0;i<7;i++){
   const dx=(i*19+w)%Math.max(2,w-8)-a+4,dy=6+(i*13+w)%24;
   b(c,x+dx,y+dy,3+i%4,1,i%3?'#736551':'#3e3a30');
  }
  b(c,x-a+1,y+34,w-3,2,'#746551');
 }
}
function drawGrave(c,g,grave){
 const {x,y,w,h,name}=grave;
 c.save();c.translate(x,y);
 const a=Math.floor(w/2),top=-h;
 if(broken(g,grave)){
  p(c,'#414842',[[-a,-1],[-a+4,-7],[-a+13,-6],[-a+14,-2],[-2,-4],[1,-10],[8,-9],[12,-4],[a-2,-5],[a,1],[4,5],[-a+4,4]]);
  b(c,-a+5,-6,7,2,'#737d72');b(c,2,-9,5,2,'#818b7a');b(c,12,1,6,2,'#5d6a5a');c.restore();return;
 }
 const points=[[-a,0],[-a,top+9],[-a+4,top+3],[-6,top],[6,top],[a-3,top+5],[a,top+9],[a,0]];
 p(c,'#242b31',points);p(c,'#505e63',points.map(([x,y])=>[Math.round(x*.81),y<0?y+2:y-2]));
 l(c,'#87968e',-a+2,-3,-a+2,top+10,2);l(c,'#9aa394',-a+4,top+6,-3,top+2,1);l(c,'#414a4f',a-3,top+8,a-4,-4,2);
 p(c,'#c3af77',[[0,top+5],[2,top+9],[5,top+10],[2,top+11],[0,top+15],[-2,top+11],[-5,top+10],[-2,top+9]]);
 const inscription=name.split(' ')[0];
 drawPixelChatText(c,inscription,-pixelChatTextWidth(inscription)/2,top+17,'#e5ddbe');
 if(g.trainTest.nocturneCemetery?.damage[grave.id])l(c,'#343a3c',a-4,top+8,a-10,top+14,1);
 b(c,-a-3,-2,w+6,5,'#353d3b');b(c,-a-2,-2,w+3,1,'#70827a');b(c,-a,-3,5,3,'#779867');c.restore();
}
function fence(c,x1,y1,x2,y2){
 const length=Math.hypot(x2-x1,y2-y1),dx=(x2-x1)/length,dy=(y2-y1)/length;
 l(c,'#222a2d',x1,y1-16,x2,y2-16,3);l(c,'#49494c',x1,y1-18,x2,y2-18,1);
 l(c,'#252d2c',x1,y1-5,x2,y2-5,3);
 for(let along=0;along<=length;along+=7){
  const x=x1+along*dx,y=y1+along*dy;
  b(c,x-1,y-20,3,21,'#252b30');b(c,x,y-19,1,15,'#5b6065');b(c,x,y-22,1,3,'#848582');
 }
 for(const [x,y] of [[x1,y1],[x2,y2]]){
  b(c,x-3,y-24,7,26,'#252b30');b(c,x-2,y-23,2,23,'#646960');b(c,x-3,y-25,7,2,'#95948a');
 }
}

export function queueNocturneGraves(c,g,visible,objects){
 const {left,right,top,bottom}=yard,lo=gate.y-gate.halfSpan,hi=gate.y+gate.halfSpan;
 const rails=[[left,top,right,top],[left,bottom,right,bottom]];
 for(let y=top;y<bottom;y+=28){rails.push([right,y,right,Math.min(bottom,y+28)]);}
 for(const [start,end] of [[top,lo],[hi,bottom]])for(let y=start;y<end;y+=28)rails.push([left,y,left,Math.min(end,y+28)]);
 rails.push(g.trainTest.nocturneCemetery?.gate?[left,lo,left+22,lo+4]:[left,lo,left,hi]);
 for(const [x1,y1,x2,y2] of rails)if(visible((x1+x2)/2,(y1+y2)/2,Math.abs(x1-x2)/2+5,Math.abs(y1-y2)/2+28))
  objects.push({depth:Math.max(y1,y2),paint:()=>fence(c,x1,y1,x2,y2)});
 for(const grave of NOCTURNE_GRAVES)if(visible(grave.x,grave.y,grave.w+8,grave.h+12))
  objects.push({depth:grave.y,paint:()=>drawGrave(c,g,grave)});
 for(const ghost of g.enemies)if(ghost.nocturneGraveGhost&&visible(ghost.x,ghost.y,38,65))
  objects.push({depth:ghost.y,player:ghost,size:43});
}

export function drawNightglassRearDoor(c,open){
 const {x,y,halfSpan}=NIGHTGLASS_REAR_DOOR;
 b(c,x-5,y-halfSpan,11,halfSpan*2,'#424544');
 b(c,x-6,y-halfSpan,12,2,'#858174');
 b(c,x-6,y+halfSpan-1,12,3,'#26292c');
 for(const end of [-1,1]){
  b(c,x-5,y+end*halfSpan-34,11,34,'#2a3034');
  b(c,x-3,y+end*halfSpan-31,3,31,'#8c8273');
 }
 p(c,'#494c48',[[x-5,y-halfSpan-34],[x+6,y-halfSpan-34],[x+6,y+halfSpan-34],[x-5,y+halfSpan-34]]);
 if(open){
  p(c,'#322e2c',[[x+4,y+halfSpan],[x+22,y+halfSpan+9],[x+22,y+halfSpan-21],[x+4,y+halfSpan-30]]);
  l(c,'#71614d',x+8,y+halfSpan-32,x+20,y+halfSpan-25,2);
 }else{
  p(c,'#473a31',[[x-2,y-halfSpan],[x+5,y-halfSpan],[x+5,y+halfSpan],[x-2,y+halfSpan]]);
  for(let dy=-16;dy<=16;dy+=8)b(c,x,y+dy,3,7,'#665341');
  b(c,x-1,y+11,3,3,'#ccb680');
 }
}
