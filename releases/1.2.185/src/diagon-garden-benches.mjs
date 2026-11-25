import {GARDEN_BENCHES,gardenBenchSeatPoint} from './diagon-garden-layout.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {TRAIN_SEATED_PELVIS_HEIGHT} from './train-clips.mjs';
import {isCharmed} from './succubus-charm.mjs';

function canSit(p){
 return p.hp>0&&!p.trainRide&&!p.pirateRide&&!p.vehicleId&&!p.room&&!p.swimming&&!p.broomMount&&!p.wingHover&&
  !(p.jumpHeight>0)&&!(p.jumpVelocity>0)&&!(p.dashTime>0)&&!(p.stun>0)&&!(p.frozen>0)&&!(p.sleeping>0)&&
  !isCharmed(p)&&!p.controlledFollowerId;
}

export function activeGardenBench(g,p){
 const state=p.gardenBench;
 if(!state||g.trainTest?.design.activeRoom!=='diagon'||!canSit(p)||(state.seat!==-1&&state.seat!==1))return null;
 const bench=GARDEN_BENCHES.find(b=>b.id===state.benchId);
 if(!bench)return null;
 const point=gardenBenchSeatPoint(bench,state.seat);
 return Math.hypot(p.x-point.x,p.y-point.y)<1?bench:null;
}

function openSeat(g,p,blocked){
 if(!canSit(p)||p.ui)return null;
 let choice=null,best=34;
 for(const bench of GARDEN_BENCHES){
  if(p.y<bench.y+15||p.y>bench.y+44||Math.abs(p.x-bench.x)>bench.w+8)continue;
  for(const seat of [-1,1]){
   const point=gardenBenchSeatPoint(bench,seat);
   const distance=Math.hypot(p.x-point.x,p.y-point.y);
   if(distance>=best||g.players.some(q=>q!==p&&q.gardenBench?.benchId===bench.id&&q.gardenBench.seat===seat&&activeGardenBench(g,q)))continue;
   const steps=Math.max(1,Math.ceil(distance/6));
   let clear=true;
   for(let i=1;i<=steps;i++){
    const t=i/steps;
    if(blocked(p.x+(point.x-p.x)*t,p.y+(point.y-p.y)*t,7)){clear=false;break;}
   }
   if(clear){choice={benchId:bench.id,seat,point};best=distance;}
  }
 }
 return choice;
}

export function gardenBenchPrompt(g,p,blocked){
 if(p.ui)return '';
 if(activeGardenBench(g,p))return 'STAND';
 return openSeat(g,p,blocked)?'SIT ON BENCH':'';
}

export function interactGardenBench(g,p,blocked){
 if(activeGardenBench(g,p)){delete p.gardenBench;return true;}
 const choice=openSeat(g,p,blocked);
 if(!choice)return false;
 p.gardenBench={benchId:choice.benchId,seat:choice.seat};
 Object.assign(p,choice.point,{faceX:0,faceY:1,charge:0,blocking:false,bowAiming:false,
  moving:false,walking:false,moveSpeed:0,movementGait:'idle',locomotionTransition:null});
 delete p.playerFrame;
 delete p.poseTime;
 return true;
}

export function tickGardenBench(g,p,input,use,jump){
 if(!p.gardenBench)return false;
 if(!activeGardenBench(g,p)){delete p.gardenBench;return false;}
 if(use||jump){delete p.gardenBench;return true;}
 if(Math.hypot(input.x||0,input.y||0)>.2){delete p.gardenBench;return false;}
 return true;
}

export function gardenBenchActor(g,p){
 const bench=activeGardenBench(g,p);
 if(!bench)return p;
 // Keep the collision point on the lawn and place the drawn pelvis on the slat.
 const y=bench.y-11+TRAIN_SEATED_PELVIS_HEIGHT*PLAYER_RENDER_SIZE/48;
 return {...p,y,faceX:0,faceY:1,animationAction:'train_sit',moving:false,step:0};
}
