import {drawPixelChat} from './pixel-chat.mjs';
import {trainChatPlacement,rememberTrainChat} from './train-chat-placement.mjs';
import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {ITEMS,give,take} from './items.mjs';
import {trainInterior} from './train-design.mjs';
import {trainCars,trainWorld} from './train-track.mjs';
import {TRAIN_SEAT_HEIGHT} from './train-surfaces.mjs';
import {TRAIN_SEATED_PELVIS_HEIGHT} from './train-clips.mjs';
import {spawnChocolateFrog,CHOCOLATE_FROG_LIMIT} from './chocolate-frogs.mjs';

export const TRAIN_STUDENT_RENDER_SIZE=52;
export const TRAIN_STUDENTS=Object.freeze([
 {id:'harry',name:'Harry Potter',gift:'nimbus_2000',hair:'shag',hairColor:'#28272c',face:'harry_potter',eyeColor:'#56866b',lines:["I hope we get a clear view of the castle from here.","A quiet train ride makes a nice change, honestly.","Think there'll be time for a flight before supper?"],offer:"I repaired my old Nimbus 2000. It still flies beautifully. Would you like it?",thanks:"Take her out for a flight when we arrive."},
 {id:'hermione',name:'Hermione Granger',gift:'standard_book_of_spells',hair:'waves',hairColor:'#775139',face:'classic',eyeColor:'#79593c',lines:["I've read the first chapter twice. Just to be prepared.","Does anyone remember which carriage has the snack trolley?","I packed an extra quill. Someone always forgets theirs."],offer:"I have a spare Standard Book of Spells. Socket it into your gear for three extra spell damage. Would you like it?",thanks:"I bookmarked the useful chapters for you."},
 {id:'ron',name:'Ron Weasley',gift:'chocolate_frog',hair:'sidepart',hairColor:'#b75d2d',face:'freckles',eyeColor:'#6486a1',lines:["Do you reckon there's still anything left on the trolley?","I wonder who'll be on my next Chocolate Frog card.","Wake me up when we're nearly at Hogwarts, will you?"],offer:"Fancy a Chocolate Frog? Best eat it before it makes a jump for the window.",thanks:"Go on, see who you got on the card!"},
]);
const state=p=>{p.npcQuests??={};return p.npcQuests.train_students??={received:{},pending:[]};};
export function studentCompartment(t,cs){
 const car=cs.find(c=>c.kind==='compartments');if(!car)return null;
 const objects=trainInterior(t.design,car),tables=objects.filter(o=>o.kind==='table').sort((a,b)=>a.x-b.x);
 for(const table of tables){const walls=objects.filter(o=>o.kind==='wall'&&o.h>car.width*.4).map(o=>o.x).sort((a,b)=>a-b),left=walls.filter(x=>x<table.x).at(-1)??-car.length/2+8,right=walls.find(x=>x>table.x)??car.length/2-8;
  const seats=objects.filter(o=>o.kind==='seat'&&o.x>left&&o.x<right).sort((a,b)=>a.x-b.x);if(seats.length>=2)return {car,table,seats:[seats[0],seats.at(-1)],left,right};
 }return null;
}
export function trainStudents(g,cs){
 const t=g.trainTest;if(!t||t.derailed)return [];const room=studentCompartment(t,cs);if(!room)return [];
 const [left,right]=room.seats,spots=[{seat:left,offset:-left.h*.25},{seat:right,offset:0},{seat:left,offset:left.h*.25}];
 // The pose already raises the pelvis above its origin. Align the lower
 // edge of the seated body to the cushion at the actual character scale.
 const seatHeight=TRAIN_SEAT_HEIGHT+2-TRAIN_SEATED_PELVIS_HEIGHT*TRAIN_STUDENT_RENDER_SIZE/48;
 return TRAIN_STUDENTS.map((student,i)=>{const spot=spots[i],local={x:spot.seat.x,y:spot.seat.y+spot.offset},q=trainWorld(room.car,local.x,local.y,seatHeight),a=room.car.a+(spot.seat.facing||0)*Math.PI/2;
  return {...student,local,seatHeight,car:room.car,room,seatId:room.car.id+':'+spot.seat.id,actor:{id:'train-student:'+student.id,name:student.name,kind:'player',sprite:'player',hp:1,maxHp:1,isPlayer:true,faction:'neutral',invincible:true,unattackable:true,x:q.x,y:q.y-20-q.z,faceX:Math.cos(a),faceY:Math.sin(a),animationAction:'train_sit',moving:false,step:0,equipment:{chest:'hogwarts_student_robes',back:'hogwarts_scarf_red'},appearance:{...DEFAULT_APPEARANCE,skin:i===1?'#dcaf8c':'#e6bd9c',shirt:'#99969a',pants:'#3c3943',shoes:'#393137',hair:student.hair,hairColor:student.hairColor,face:student.face,eyeColor:student.eyeColor}}};
 });
}
function reachableStudents(g,p,cs){
 const r=p.trainRide;if(!r||r.seat||r.gangway||r.driving||p.hp<=0)return null;
 return trainStudents(g,cs).filter(n=>n.car.index===r.car&&r.x>n.room.left+2&&r.x<n.room.right-2&&r.y<n.car.width/2-20&&Math.hypot(r.x-n.local.x,r.y-n.local.y)<64);
}
export function nearbyTrainStudent(g,p,cs){
 const candidates=reachableStudents(g,p,cs);
 if(!candidates?.length)return null;
 const r=p.trainRide;
 // A nearer friend must not permanently consume Interact for the whole bench.
 // Unclaimed gifts come first; after that, repeated presses from one spot let
 // every reachable passenger speak. Moving restores ordinary nearest targeting.
 const received=p.npcQuests?.train_students?.received||{},unclaimed=candidates.filter(n=>!received[n.id]);
 const focus=g.trainTest.studentConversations?.[p.id];
 const pool=unclaimed.length?unclaimed:candidates;
 if((!unclaimed.length||focus?.declined)&&focus?.car===r.car&&Math.hypot(r.x-focus.x,r.y-focus.y)<8){const i=pool.findIndex(n=>n.id===focus.id);if(i>=0)return pool[(i+1)%pool.length];}
 return pool.sort((a,b)=>Math.hypot(r.x-a.local.x,r.y-a.local.y)-Math.hypot(r.x-b.local.x,r.y-b.local.y))[0];
}
function sayStudent(g,npc,text){
 const t=g.trainTest;
 delete t.conductorSpeech;
 t.studentSpeech={id:npc.id,text,started:t.time,until:t.time+7};
 t.notice=npc.name+': '+text;t.noticeUntil=t.time+7;
}
function rememberStudent(t,p,npc,declined=false){
 const r=p.trainRide;
 (t.studentConversations??={})[p.id]={id:npc.id,car:r.car,x:r.x,y:r.y,declined};
}
export function interactTrainStudent(g,p,cs){
 if(p.ui)return false;
 const npc=nearbyTrainStudent(g,p,cs);if(!npc)return false;
 const t=g.trainTest;
 if(p.npcQuests?.train_students?.received?.[npc.id]){
  rememberStudent(t,p,npc);
  sayStudent(g,npc,npc.lines[Math.floor(t.time/7)%npc.lines.length]);
 }else{
  delete t.conductorSpeech;delete t.studentSpeech;
  p.ui={shop:'npc-dialogue',ownerDevice:p.device,npcId:npc.actor.id,trainStudentGift:npc.id,node:'gift',index:0};
  p.consumeInput=true;p.charge=0;p.interactUsed=true;p.moving=false;
  g.onSound?.('ui',p);
 }
 return true;
}

const giftChoices=Object.freeze([
 {label:'Yes, please.',action:'take-student-gift'},
 {label:'No, thank you.',action:'decline-student-gift'},
]);
function offeredStudent(g,p){
 if(!g.trainTest||g.trainTest.derailed)return null;
 return reachableStudents(g,p,trainCars(g.trainTest))?.find(n=>n.id===p.ui.trainStudentGift);
}
export function trainStudentGiftView(g,p){
 const npc=offeredStudent(g,p);
 return npc?{npc:npc.actor,text:npc.offer,choices:giftChoices,notice:p.ui.notice||''}
  :{text:'The conversation has ended.',choices:[{label:'Close',action:'close'}]};
}
export function trainStudentGiftAction(g,p,action){
 const u=p.ui;
 const close=()=>{p.ui=null;p.consumeInput=true;return true;};
 if(action==='close'||u.ownerDevice!==p.device||g.players.filter(q=>q.device===p.device).length!==1)return close();
 const npc=offeredStudent(g,p);
 if(!npc||p.npcQuests?.train_students?.received?.[npc.id])return close();
 if(['next','prev','down','up'].includes(action)){u.index=1-(u.index||0);return true;}
 if(action==='use')action=giftChoices[u.index||0]?.action;
 if(action?.startsWith('choice:'))action=giftChoices[Number(action.slice(7))]?.action;
 const t=g.trainTest;
 if(action==='decline-student-gift'){rememberStudent(t,p,npc,true);return close();}
 if(action!=='take-student-gift')return true;
 if(!give(p.inventory,npc.gift,1)){u.notice='Your backpack is full. Make a little room and come back.';return true;}
 const s=state(p);(s.received??={})[npc.id]=true;
 ((t.studentRewards??={})[p.id]??=[]).push({id:npc.id,type:npc.gift,qty:1});
 rememberStudent(t,p,npc);
 sayStudent(g,npc,npc.thanks);
 close();g.onSound?.('pickup',p);g.persist?.();return true;
}
export function deliverStudentParcels(g){
 if(g.trainTest)return;
 for(const p of g.players||[]){const pending=p.npcQuests?.train_students?.pending;if(!pending?.length)continue;let delivered=false;
  p.npcQuests.train_students.pending=pending.filter(item=>{if(give(p.inventory,item.type,item.qty)){delivered=true;g.message?.('Received '+ITEMS[item.type].name+'.');return false;}return true;});if(delivered)g.persist?.();
 }
}
export function transferTrainStudentGifts(g,t){
 let changed=false;
 for(const original of t.returnPlayers){const rewards=t.studentRewards?.[original.id]||[],used=t.studentFrogs?.[original.id];if(!rewards.length&&!used)continue;changed=true;const s=state(original);s.received??={};s.pending??=[];
  for(const reward of rewards){s.received[reward.id]=true;if(reward.qty>0&&!give(original.inventory,reward.type,reward.qty))s.pending.push({type:reward.type,qty:reward.qty});}
  if(used){for(const [type,delta]of Object.entries(used.deltas||{}).filter(([,n])=>n<0)){let remaining=-delta;for(const parcel of s.pending.filter(i=>i.type===type)){const n=Math.min(remaining,parcel.qty);parcel.qty-=n;remaining-=n;}s.pending=s.pending.filter(i=>i.qty>0);if(remaining)take(original.inventory,type,remaining);}for(const [type,delta]of Object.entries(used.deltas||{}).filter(([,n])=>n>0))if(!give(original.inventory,type,delta))s.pending.push({type,qty:delta});original.hp=Math.min(original.maxHp,original.hp+used.healed);const active=g.players.find(p=>p.id===original.id);if(active?.chocolateSparkleUntil>g.time)original.chocolateSparkleUntil=t.returnTime+active.chocolateSparkleUntil-g.time;}
 }return changed;
}
export function useChocolateFrog(g,p){
 if(p.hp<=0)return false;const selected=p.ui?.index,type=p.inventory[selected]?.type==='caught_chocolate_frog'?'caught_chocolate_frog':'chocolate_frog',copy=structuredClone(p.inventory);
 if(!take(copy,type))return false;if(type==='caught_chocolate_frog'&&!give(copy,'empty_jar',1))return false;
 const escapes=(g.random?.()??Math.random())<.5;
 if(escapes&&(g.chocolateFrogs||[]).length>=CHOCOLATE_FROG_LIMIT){if(p.ui)p.ui.notice='Catch a few escaped Chocolate Frogs first.';return false;}
 p.inventory=copy;const healed=escapes?0:Math.max(0,p.maxHp-p.hp);p.hp+=healed;p.chocolateSparkleUntil=(g.time||0)+300;if(escapes)spawnChocolateFrog(g,p);
 if(g.trainTest){const t=g.trainTest,r=(t.studentFrogs??={})[p.id]??={deltas:{},healed:0};r.deltas[type]=(r.deltas[type]||0)-1;if(type==='caught_chocolate_frog')r.deltas.empty_jar=(r.deltas.empty_jar||0)+1;r.healed+=healed;}
 if(p.ui)p.ui.notice=escapes?'It escaped! You still sparkle. Catch the brown frog with a net and an empty bottle.':'Health refilled! You sparkle for 5 minutes.';g.message?.(p.ui?.notice|| (escapes?'The Chocolate Frog escaped!':'Chocolate Frog: health refilled.'));g.onSound?.(escapes?'pickup':'heal',p);g.persist?.();return true;
}
export function studentSpeech(g,cs){
 const students=trainStudents(g,cs),t=g.trainTest;if(!students.length)return null;
 if(t.conductorSpeech?.until>t.time)return null;
 const forced=t.studentSpeech?.until>t.time?t.studentSpeech:null,npc=forced?students.find(n=>n.id===forced.id):students[Math.floor(t.time/7)%students.length];
 if(!npc||!g.players.some(p=>!p.ui?.trainStudentGift&&p.trainRide?.car===npc.car.index&&Math.abs(p.trainRide.x-npc.local.x)<110))return null;
 if(!forced&&t.time%7>5.5)return null;return {npc,text:forced?.text||npc.lines[Math.floor(t.time/21)%npc.lines.length],elapsed:forced?t.time-(forced.started??forced.until-7):t.time%7};
}
export function drawStudentSpeech(c,g,cs,camera,w,h,actors=trainStudents(g,cs).map(n=>n.actor)){
 const speech=studentSpeech(g,cs);if(!speech)return;const {npc,text}=speech;
 const b=drawPixelChat(c,{text,name:npc.name.split(' ')[0],style:'box',anchorX:w/2+(npc.actor.x-camera.x)*camera.zoom,anchorY:h/2+(npc.actor.y-camera.y-35)*camera.zoom,width:w,height:h,maxWidth:120,topInset:62,page:Math.floor(speech.elapsed/2.7),...trainChatPlacement(g,cs,camera,w,h,actors,npc.id)});rememberTrainChat(g,npc.id,b);return b;
}
