import {playerPose,projectPoint,facingIndex} from './player-motion.mjs';

export function lobbyFootContacts(actor,time,size=86){
  if((actor.jumpHeight||0)>.5||actor.wingHover)return [];
  const pose=playerPose(actor,time),d=facingIndex(actor.faceX,actor.faceY),scale=size/48;
  const low=Math.min(pose.footL[2],pose.footR[2]);
  return ['footL','footR'].filter(id=>pose[id][2]<=low+1).map(id=>{
    const foot=projectPoint(pose[id],d);
    return {x:actor.x+foot.x*scale,y:actor.y-(actor.groundHeight||0)+(foot.y+1)*scale};
  });
}
export function drawLobbyActorShadow(c,actor,time,size=86){
  c.save();c.globalAlpha*=Math.max(.35,1-(actor.jumpHeight||0)/150);
  drawLobbyCastShadow(c,actor.x,actor.y-5,26,8);
  c.fillStyle='rgba(9,16,18,.36)';
  for(const foot of lobbyFootContacts(actor,time,size)){
    c.beginPath();c.ellipse(foot.x,foot.y,5,2,0,0,Math.PI*2);c.fill();
  }
  c.restore();
}

/** A cool, steady wash from ceiling-mounted fluorescent fixtures. */
export function drawLobbyCeilingWash(c,{left=0,top=70,right=1024,bottom=590}={}){
  c.save();
  for(const x of [176,400,624,848]){
    const width=Math.min(190,(right-left)*.22),light=c.createLinearGradient(x-width/2,0,x+width/2,0);
    light.addColorStop(0,'rgba(191,220,222,0)');
    light.addColorStop(.5,'rgba(191,220,222,.075)');
    light.addColorStop(1,'rgba(191,220,222,0)');
    c.fillStyle=light;c.fillRect(Math.max(left,x-width/2),top,Math.min(width,right-left),bottom-top);
  }
  const ambient=c.createRadialGradient((left+right)/2,(top+bottom)/2,30,(left+right)/2,(top+bottom)/2,(right-left)*.58);
  ambient.addColorStop(0,'rgba(194,219,218,.065)');ambient.addColorStop(1,'rgba(194,219,218,0)');
  c.fillStyle=ambient;c.fillRect(left,top,right-left,bottom-top);c.restore();
}

/** Compact, slightly skewed cast shadow under an object in the top-lit room. */
export function drawLobbyCastShadow(c,x,y,width,depth=14){
  const half=width/2;
  c.save();c.translate(x+2,y+3);
  const falloff=c.createLinearGradient(0,0,0,depth+5);
  falloff.addColorStop(0,'rgba(12,20,22,.25)');falloff.addColorStop(.68,'rgba(12,20,22,.15)');falloff.addColorStop(1,'rgba(12,20,22,0)');
  c.fillStyle=falloff;c.beginPath();
  c.moveTo(-half*.8,0);c.lineTo(-half*.57,depth*.54);c.lineTo(-half*.25,depth);c.lineTo(half*.68,depth*.83);
  c.lineTo(half,depth*.18);c.lineTo(half*.79,0);c.closePath();c.fill();
  c.fillStyle='rgba(9,16,18,.18)';c.beginPath();
  c.moveTo(-half*.5,0);c.lineTo(-half*.37,depth*.24);c.lineTo(half*.44,depth*.23);c.lineTo(half*.55,0);c.closePath();c.fill();
  c.restore();
}
