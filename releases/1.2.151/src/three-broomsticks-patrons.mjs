import {block as b,shape as p} from './diagon-shop-brush.mjs';
import {drawTavernTankard} from './three-broomsticks-art.mjs';
import {HOGSMEADE_BUILDINGS} from './hogsmeade-layout.mjs';

const inn=HOGSMEADE_BUILDINGS[0];
export const THREE_BROOMSTICKS_PATRONS=[
 {id:'tavern-aberforth',name:'Aberforth Dumbledore',dx:-80,dy:49,faceX:0,faceY:-1,
  tavernPatron:'bite',beat:.8,seat:'bench',appearance:{hair:'waves',hairColor:'#c7b8a0',facialHair:'fullbeard',shirt:'#5c6150',pants:'#4a4548'}},
 {id:'tavern-fudge',name:'Cornelius Fudge',dx:57,dy:22,faceX:0,faceY:1,
  tavernPatron:'sip',beat:2.9,appearance:{hair:'sidepart',hairColor:'#675348',shirt:'#729572',pants:'#424743'}},
 {id:'tavern-flitwick',name:'Filius Flitwick',dx:78,dy:57,faceX:-.65,faceY:-1,
  tavernPatron:'sip',beat:4.9,renderSize:40,appearance:{hair:'sidepart',hairColor:'#d2c2ab',facialHair:'moustache',shirt:'#695b86',pants:'#474355'}},
].map(({dx,dy,...npc})=>({
 ...npc,x:inn.x+dx,y:inn.y+dy,building:inn.id,sprite:'player',kind:'player',hp:1,maxHp:1,
 equipment:{},animationAction:'train_sit',
 appearance:{skin:'#c79978',eyeColor:'#3f4945',...npc.appearance}
}));

export function tavernGesture(actor,time){
 const cycle=((time+actor.beat)%6.8+6.8)%6.8;
 if(cycle>1.8)return 0;
 const ease=t=>t*t*(3-2*t);
 if(cycle<.55)return ease(cycle/.55);
 if(cycle>1.18)return ease((1.8-cycle)/.62);
 return 1;
}

export function poseTavernPatron(pose,actor,time){
 const amount=tavernGesture(actor,time);
 if(!amount)return false;
 const mouth=pose.mouth,hand=pose.handR,elbow=pose.elbowR;
 const aim=[mouth[0]+3,mouth[1]+1.6,mouth[2]-(actor.tavernPatron==='sip'?2.7:0)];
 pose.handR=hand.map((v,i)=>v+(aim[i]-v)*amount);
 pose.elbowR=[elbow[0]+amount,elbow[1]+amount*1.5,elbow[2]+amount*1.8];
 return true;
}

export function drawPatronService(c,actor,hand,time){
 if(tavernGesture(actor,time)<.09)return;
 const {x,y}=hand;
 if(actor.tavernPatron==='sip')drawTavernTankard(c,x+1,y+2);
 else{
  b(c,x-3,y-3,6,3,'#855337');b(c,x-2,y-4,4,2,'#dbac70');b(c,x+1,y-3,1,1,'#f0c286');
 }
}

export function drawTavernPatronStool(c,npc){
 const {x,y}=npc;
 b(c,x-8,y+3,16,2,'#33282955');
 for(const dx of [-5,4]){
  b(c,x+dx,y-4,3,8,'#49362f');b(c,x+dx+1,y-3,1,6,'#926c4d');
 }
 p(c,'#473631',[[x-9,y-6],[x-5,y-10],[x+6,y-10],[x+9,y-5],[x+6,y-3],[x-7,y-3]]);
 b(c,x-6,y-9,12,3,'#ad8057');b(c,x-6,y-7,13,1,'#d1a272');b(c,x-7,y-5,15,1,'#6d4940');
}
