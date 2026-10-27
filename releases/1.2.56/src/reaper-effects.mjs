import {playerPose,poseAt,projectPoint,facingIndex} from './player-motion.mjs';
import {reaperMotion,reaperVisualActor} from './reaper-motion.mjs';
import {rigSubject} from './rig-subjects.mjs';
import {PLAYER_RENDER_SIZE,creatureRenderSize} from './render-settings.mjs';
// Use the same pose, facing, world scale and elevation as Animator.draw.
export function reaperJointWorld(actor,joint,time,{model,size}={}){
 model??=actor.kind==='grim_reaper'?reaperMotion:rigSubject(actor.sprite||actor.kind||'player')?.data;
 size??=actor.kind?creatureRenderSize(actor.kind):PLAYER_RENDER_SIZE;
 const a=actor.kind==='grim_reaper'?reaperVisualActor(actor):actor;
 let point;
 if(model){
  const humanoid=!!(model.joints.handL&&model.joints.footL&&!model.skeleton&&!model.robot);
  const action=a.animationAction||(a.moving?(model.clips.run?'run':'walk'):'idle'),clip=model.clips[action]||model.clips.idle;
  const pose=humanoid?playerPose(a,time,model):poseAt(model,action,Number.isFinite(a.playerFrame)?a.playerFrame:Number.isFinite(a.poseTime)?a.poseTime*(clip.length-1):time*clip.fps);
  const v=[...(pose[joint]||pose.chest||pose.body||pose.pelvis||[0,0,12])];
  if(humanoid&&a.appearance?.build&&a.appearance.build!=='standard')v[0]*=a.appearance.build==='broad'?1.12:.9;
  point=projectPoint(v,facingIndex(a.faceX,a.faceY));
 }else point={x:0,y:-8};
 return {x:a.x+point.x*size/48,y:a.y-(a.jumpHeight||0)-(a.groundHeight||0)-(a.succubusFlightHeight||a.impFlightHeight||a.roostHeight||0)+point.y*size/48};
}
export function reaperBeamAnchors(e,target,time=0){
 return {source:reaperJointWorld(e,'handL',time),target:target.critter?{x:target.a.x,y:target.a.y-3}:reaperJointWorld(target.a,'chest',time)};
}

