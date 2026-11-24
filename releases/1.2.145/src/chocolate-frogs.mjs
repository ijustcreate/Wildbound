import {give,take} from './items.mjs';
import {trainCars,trainWorld} from './train-track.mjs';
import {trainInterior} from './train-design.mjs';
import {drawNativeFrog} from './frog-art.mjs';
export const CHOCOLATE_FROG_LIMIT=32;
const samePlace=(a,p)=>(a.room||null)===(p.room||null)&&(a.trainRide?.car??null)===(p.trainRide?.car??null);
export const escapedChocolateFrogs=g=>(g.chocolateFrogs||[]);
export function spawnChocolateFrog(g,p){
 const list=g.chocolateFrogs??=[];if(list.length>=CHOCOLATE_FROG_LIMIT)return false;
 const x=p.room?p.roomX:p.x,y=p.room?p.roomY:p.y;
 list.push({id:g.nextId++,kind:'frog',chocolate:true,x,y,homeX:x,homeY:y,room:p.room||null,trainRide:p.trainRide?{car:p.trainRide.car,x:p.trainRide.x,y:p.trainRide.y}:null,age:0,hopHeight:0,wait:.45});return true;
}
export function tickChocolateFrogs(g,dt){
 dt=Math.min(.05,Math.max(0,dt));const cars=g.trainTest?trainCars(g.trainTest):null;
 for(const a of g.chocolateFrogs||[]){a.age+=dt;a.wait-=dt;const local=a.trainRide||a;
  if(a.hop){a.hop.t=Math.min(1,a.hop.t+dt/.45);const h=a.hop;local.x=h.x+(h.tx-h.x)*h.t;local.y=h.y+(h.ty-h.y)*h.t;a.hopHeight=Math.sin(h.t*Math.PI)*9;if(h.t===1){a.hop=null;a.wait=1.1+(a.id%5)*.17;}}
  else if(a.wait<=0){const angle=a.id*2.4+a.age*.7,dx=Math.cos(angle)*20,dy=Math.sin(angle)*16,tx=local.x+dx,ty=local.y+dy;let valid;
   if(a.trainRide){const c=cars?.[a.trainRide.car];valid=c&&Math.abs(tx)<c.length/2-18&&Math.abs(ty)<c.width/2-15&&!trainInterior(g.trainTest.design,c).some(o=>['wall','door'].includes(o.kind)&&!(o.kind==='door'&&(g.trainTest.doors[c.id+':'+o.id]??o.open))&&Array.from({length:8},(_,i)=>(i+1)/8).some(t=>Math.abs(local.x+(tx-local.x)*t-o.x)<o.w/2+2&&Math.abs(local.y+(ty-local.y)*t-o.y)<o.h/2+2));}
   else if(a.room)valid=tx>25&&tx<295&&ty>42&&ty<215;
   else valid=!g.blocked?.(tx,ty,3,false,true,false,0);
   if(valid)a.hop={x:local.x,y:local.y,tx,ty,t:0};else a.wait=.7;
  }
  if(a.trainRide&&cars?.[a.trainRide.car]){const q=trainWorld(cars[a.trainRide.car],local.x,local.y);a.x=q.x;a.y=q.y;}
 }
}
export function catchChocolateFrog(g,p){
 if(![p.equipment?.hand1,p.equipment?.hand2].includes('critter_net'))return false;
 const px=p.room?p.roomX:p.x,py=p.room?p.roomY:p.y,a=(g.chocolateFrogs||[]).filter(a=>samePlace(a,p)&&Math.hypot(a.x-px,a.y-py)<46&&(a.x-px)*(p.faceX||0)+(a.y-py)*(p.faceY||0)>=-8).sort((a,b)=>Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py))[0];if(!a)return false;
 const copy=structuredClone(p.inventory);if(!take(copy,'empty_jar')){g.message?.('You need an empty bottle to catch the Chocolate Frog.');return true;}
 if(!give(copy,'caught_chocolate_frog',1,32,{captureContainer:'empty_jar'})){g.message?.('Make space for the bottled Chocolate Frog.');return true;}
 p.inventory=copy;g.chocolateFrogs=g.chocolateFrogs.filter(f=>f!==a);if(g.trainTest){const r=((g.trainTest.studentFrogs??={})[p.id]??={deltas:{},healed:0});r.deltas.caught_chocolate_frog=(r.deltas.caught_chocolate_frog||0)+1;r.deltas.empty_jar=(r.deltas.empty_jar||0)-1;}p.attack=p.attackDuration=.34;p.attackClip='punch';g.message?.('Caught the Chocolate Frog! Use the bottle to try again.');g.onSound?.('pickup',p);g.persist?.();return true;
}
export function drawChocolateFrog(c,a,time=0){c.save();if(!a.room){c.globalAlpha=.2;c.fillStyle='#30271f';c.fillRect(Math.round(a.x)-5,Math.round(a.y)+2,10,2);c.globalAlpha=1;}drawNativeFrog(c,a,time);c.restore();}
export function drawRoomChocolateFrogs(c,g,room){for(const a of g.chocolateFrogs||[])if(a.room===room)drawChocolateFrog(c,a,g.time);}
