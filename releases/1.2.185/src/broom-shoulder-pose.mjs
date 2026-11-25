import {solveTwoBone} from './ik.mjs';

export function shoulderBroomFor(actor,action){
 const broom=actor.shoulderBroom;
 if(!broom?.type||actor.hp<=0||actor.broomMount||actor.swimming||actor.trainRide?.seat||!['idle','walk','run'].includes(action))return null;
 return broom;
}

export function poseShoulderBroom(pose,model,broom){
 const side=broom.hand==='L'?'L':'R',sign=side==='L'?-1:1;
 const upper='shoulder'+side,middle='elbow'+side,end='hand'+side;
 const shoulder=pose[upper],restUpper=model.joints[upper]?.position,restMiddle=model.joints[middle]?.position,restHand=model.joints[end]?.position;
 if(!shoulder||!restUpper||!restMiddle||!restHand)return;
 const [x,y,z]=shoulder;
 const target=[x+sign*2,y+7.6,z-1.6];
 const elbow=[x+sign*4.2,y+2.2,z-7.5];
 const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const arm=solveTwoBone(shoulder,elbow,target,target,[length(restUpper,restMiddle),length(restMiddle,restHand)]);
 pose[middle]=arm.mid;
 pose[end]=arm.end;
}

// Coordinates are relative to the posed grip on the handle. The brush trails
// out from the shoulder and clears the head as the character turns.
export function shoulderBroomPoint(hand,side,project,d,forward,height=0){
 const sign=side==='L'?-1:1;
 const offset=project([sign*-forward*.37,forward,-forward*.2+height],d);
 return {x:hand.x+offset.x,y:hand.y+offset.y,depth:hand.depth+offset.depth};
}
