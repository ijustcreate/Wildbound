import {poseAt,playerPose} from './player-motion.mjs';
import {applyIK} from './ik.mjs';
const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const blend=(a,b,t)=>Object.fromEntries(Object.entries(a).map(([n,v])=>[n,b[n]?v.map((x,i)=>x+(b[n][i]-x)*t):[...v]]));
const upper=/^(chest|neck|head|eye|ear|nose|mouth|shoulder|elbow|hand)/;
export function tacticalHumanoidAnimation(a,model){
  const s=a.tactics;if(!s||a.hp<=0)return a;
  const actor={...a},t=clamp(1-s.remaining/Math.max(.01,s.duration)),age=Math.max(0,s.duration-s.remaining);
  actor.hit=a.flash>0&&!a.tacticalBlocked?a.flash:0;actor.blocking=false;
  let action=null,frame=0;
  if(s.phase==='stagger'){action='hurt';frame=ease(t);}
  else if(a.combatRole==='archer'&&a.bowBash){
    action=model.clips.punch_left?'punch_left':'swipe_one';
    frame=s.phase==='windup'?.25*ease(t/.8):s.phase==='active'?.25+.65*ease(t/.8):s.phase==='recover'?.9+.1*ease(age/.2):0;
  }else if(a.combatRole==='archer'){
    if(s.phase==='windup'){action='draw';frame=ease(t/.6);actor.charge=frame;}
    else if(s.phase==='recover'&&a.attack>0){action=model.clips.ranged?'ranged':'draw';frame=action==='ranged'?ease(age/.24):1-ease(age/.24);}
  }else if(a.combatRole==='shield'){
    actor.blocking=s.phase==='approach';
    if(s.phase==='windup'){action='swipe_big';frame=.30*ease(t/.8);}
    if(s.phase==='active'){action='swipe_big';frame=.30+.60*ease(t/.72);}
    if(s.phase==='recover'&&age<.24){action='swipe_big';frame=.9+.1*ease(age/.24);}
  }
  if(action&&model.clips[action]){actor.animationAction=action;actor.playerFrame=frame*(model.clips[action].length-1);}
  return actor;
}
export function tacticalHumanoidPose(a,time,model){
  let pose=playerPose(a,time,model);const s=a.tactics;
  if(!s||a.rigOverride)return pose;
  const progress=clamp(1-s.remaining/Math.max(.01,s.duration));
  if(s.phase==='approach'&&a.moving&&!(a.hit>0)){
    // Feet keep their own gait while shield/bow and gaze stay on the opponent.
    const gait=playerPose({...a,blocking:false,animationAction:a.walking?'walk':'run',playerFrame:undefined},time,model);
    const m=a.roleMind||{},yaw=Math.atan2(m.moveY||0,m.moveX||0)-Math.atan2(a.faceY||0,a.faceX||0),cos=Math.cos(yaw),sin=Math.sin(yaw);
    for(const n of Object.keys(gait))if(/^(hip|knee|foot)/.test(n)&&model.joints[n]){
      const rest=model.joints[n].position,x=gait[n][0]-rest[0],y=gait[n][1]-rest[1];
      gait[n][0]=rest[0]+x*cos-y*sin;gait[n][1]=rest[1]+x*sin+y*cos;
    }
    if(a.combatRole==='archer'){
      const ready=poseAt(model,'draw',.12*(model.clips.draw.length-1));
      for(const n of Object.keys(gait))if(upper.test(n)&&ready[n])gait[n]=ready[n];
    }else for(const n of Object.keys(gait))if(upper.test(n)&&pose[n])gait[n]=pose[n];
    pose=gait;
  }
  if(s.phase==='approach'&&a.combatRole==='shield'){
    const recoil=Math.max(0,a.guardFlash||0)/.18,low=Math.max(0,1-(a.roleMind?.guard??100)/40);
    for(const name of ['handL','elbowL'])if(pose[name]){pose[name][1]-=recoil*1.3;pose[name][2]-=low*1.5;}
  }
  if(s.phase==='recover'&&a.combatRole==='shield'){
    const age=s.duration-s.remaining;
    if(age>=.24){
      const idle=poseAt(model,'idle',0),end=poseAt(model,'swipe_big',model.clips.swipe_big.length-1);
      pose=blend(end,idle,ease((age-.24)/.22));
      const fatigue=1-ease((age-.24)/Math.max(.01,s.duration-.24));
      for(const n of Object.keys(pose))if(upper.test(n)){pose[n][1]+=fatigue*1.5;pose[n][2]-=fatigue*.8;}
    }
  }
  if(s.phase==='stagger'){
    // A clear initial recoil, a held opening, then a gradual return to guard.
    const recoil=poseAt(model,'hurt',.25*(model.clips.hurt.length-1)),idle=poseAt(model,'idle',0);
    pose=blend(recoil,idle,ease((progress-.6)/.4));
  }
  applyIK(model,pose);return pose;
}
