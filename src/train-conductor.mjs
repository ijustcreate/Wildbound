import {requestTrainStationStop} from './train-autostop.mjs';
import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {give} from './items.mjs';
import {trainRiderWorld,trainWorld} from './train-track.mjs';
import {drawPixelChat} from './pixel-chat.mjs';
import {trainChatPlacement,rememberTrainChat} from './train-chat-placement.mjs';

const coaches=cs=>cs.filter(c=>['compartments','seats','caboose'].includes(c.kind));
const aisle=c=>c.kind==='compartments'?c.width/2-13:0;
function state(g,cs){const cars=coaches(cs);if(!cars.length)return null;const c=cars[0];return g.trainTest.conductor??={car:c.index,x:0,y:aisle(c),direction:1,phase:'walk',step:0,waitUntil:0,faceX:-1,faceY:0};}
export function tickTrainConductor(g,cs,dt,blocked){
 const t=g.trainTest;if(!t||t.derailed)return;const n=state(g,cs),cars=coaches(cs);if(!n)return;const c=cs[n.car];if(!c){delete t.conductor;return;}
 n.moving=false;if(t.time<n.waitUntil)return;
 const visitor=g.players.find(p=>p.hp>0&&p.trainRide&&!p.trainRide.seat&&!p.trainRide.gangway&&p.trainRide.car===n.car&&Math.hypot(p.trainRide.x-n.x,p.trainRide.y-n.y)<28);
 if(visitor){const a=Math.atan2(visitor.trainRide.y-n.y,visitor.trainRide.x-n.x)+c.a;n.faceX=Math.cos(a);n.faceY=Math.sin(a);return;}
 const sign=-n.direction,end=sign*(c.length/2-14),speed=26;
 if(n.gangway){const [a,b]=[trainWorld(c,sign*(c.length/2-14),0),trainWorld(cs[n.gangway.to],-sign*(cs[n.gangway.to].length/2-14),0)],length=Math.hypot(b.x-a.x,b.y-a.y);n.gangway.progress=Math.min(1,n.gangway.progress+speed*dt/Math.max(1,length));n.moving=true;n.step+=speed*dt*.13;n.faceX=(b.x-a.x)/Math.max(1,length);n.faceY=(b.y-a.y)/Math.max(1,length);if(n.gangway.progress>=1){n.car=n.gangway.to;n.x=-sign*(cs[n.car].length/2-14);n.y=0;delete n.gangway;n.phase='enter';}return;}
 const goal=n.phase==='enter'?{x:n.x,y:aisle(c)}:n.phase==='align'?{x:end,y:0}:{x:end,y:aisle(c)},dx=goal.x-n.x,dy=goal.y-n.y,length=Math.hypot(dx,dy),step=Math.min(length,speed*dt);
 if(length>.1){const x=n.x+dx/length*step,y=n.y+dy/length*step;if(!blocked(t,c,x,y)){n.x=x;n.y=y;n.moving=true;n.step+=step*.13;n.faceX=Math.cos(c.a)*dx/length-Math.sin(c.a)*dy/length;n.faceY=Math.sin(c.a)*dx/length+Math.cos(c.a)*dy/length;}else n.waitUntil=t.time+1;return;}
 if(n.phase==='enter')n.phase='walk';else if(n.phase==='walk')n.phase='align';else{const next=cars[cars.findIndex(q=>q.index===n.car)+n.direction];if(next&&Math.abs(next.index-n.car)===1){n.gangway={to:next.index,direction:sign,progress:0};}else{n.direction*=-1;n.phase='enter';n.waitUntil=t.time+2.5;}}
}
export function trainConductor(g,cs){
 const t=g.trainTest;if(!t||t.derailed)return null;const n=state(g,cs);if(!n||!cs[n.car])return null;const car=cs[n.car],q=trainRiderWorld(cs,n),local={x:n.x,y:n.y};
 const actor={id:'train-conductor',name:'The Conductor',sprite:'player',kind:'player',hp:1,invincible:true,unattackable:true,x:q.x,y:q.y-20-q.z,faceX:n.faceX,faceY:n.faceY,moving:n.moving,walking:true,step:n.step,moveSpeed:n.moving?26:0,equipment:{},appearance:{...DEFAULT_APPEARANCE,trainConductor:true,hair:'sidepart',hairColor:'#67523d',skin:'#dbb08a',shirt:'#293c55',pants:'#26364b',shoes:'#282a32'}};
 return {id:'conductor',name:actor.name,car,local,ride:{car:n.car,x:n.x,y:n.y,...(n.gangway?{gangway:{...n.gangway}}:{})},actor};
}
export function nearbyTrainConductor(g,p,cs){const n=trainConductor(g,cs),r=p.trainRide;return n&&r&&p.hp>0&&!r.seat&&!r.driving&&!r.gangway&&!n.ride.gangway&&r.car===n.car.index&&Math.hypot(r.x-n.local.x,r.y-n.local.y)<30?n:null;}
export function interactTrainConductor(g,p,cs){
 const n=nearbyTrainConductor(g,p,cs);if(!n)return false;const t=g.trainTest;speech('Tickets, please! Keep your golden ticket for 10% more experience.');
 p.npcQuests??={};const s=p.npcQuests.train_students??={received:{},pending:[]};s.received??={};
 if(s.received.conductor||p.inventory.some(i=>i?.type==='golden_train_ticket'&&i.qty>0)){const request=requestTrainStationStop(g);speech(request.ok?request.message:'Your ticket is in order. Ask me for a stop once the engine is running.');}
 else if(!give(p.inventory,'golden_train_ticket',1))speech('Make one space in your backpack, then come back for your golden ticket.');
 else{s.received.conductor=true;t.studentRewards??={};(t.studentRewards[p.id]??=[]).push({id:'conductor',type:'golden_train_ticket',qty:1});g.onSound?.('pickup',p);}
 t.conductor.waitUntil=t.time+7;return true;
 function speech(text){t.conductorSpeech={text,started:t.time,until:t.time+7};}
}
export function drawConductorSpeech(c,g,cs,camera,w,h,actors){const n=trainConductor(g,cs),s=g.trainTest.conductorSpeech;if(!n||!s||s.until<g.trainTest.time||!g.players.some(p=>p.trainRide?.car===n.car.index))return;const b=drawPixelChat(c,{text:s.text,name:'Conductor',style:'box',anchorX:w/2+(n.actor.x-camera.x)*camera.zoom,anchorY:h/2+(n.actor.y-camera.y-36)*camera.zoom,width:w,height:h,topInset:62,theme:'night',page:Math.floor((g.trainTest.time-(s.started??s.until-7))/2.7),...trainChatPlacement(g,cs,camera,w,h,actors||[n.actor],n.id)});rememberTrainChat(g,n.id,b);return b;}
