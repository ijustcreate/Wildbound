// Drive companion feet from real displacement, not a hostile phase/countdown.
export function companionMovement(actor,dt){
  const local=actor.room&&Number.isFinite(actor.roomX)&&Number.isFinite(actor.roomY),x=local?actor.roomX:actor.x,y=local?actor.roomY:actor.y,step=actor.step||0;
  return ()=>{
    const dx=(local?actor.roomX:actor.x)-x,dy=(local?actor.roomY:actor.y)-y,d=Math.hypot(dx,dy);
    if(!Number.isFinite(d))return;
    // Teleports are catch-up placement, not a many-metre sprint animation.
    actor.moving=actor.hp>0&&d>.01&&d<Math.max(80,(actor.speed||100)*dt*2);
    actor.locomotionSpeed=actor.moving?d/Math.max(.001,dt):0;
    if(actor.moving){
      if((actor.step||0)===step)actor.step=step+d*.13;
      actor.faceX=dx/d;actor.faceY=dy/d;
    }
  };
}
export function companionVisualActor(actor,model){
  if(!(actor.faction==='ally'||actor.hunterPet===true)||!actor.moving||actor.hp<=0||actor.hit>0||actor.flash>0||actor.attack>0||actor.frozen>0||actor.state==='snared'||actor.jumpHeight>0||actor.summonPulse>0||actor.healEffect>0||actor.animationAction)return actor;
  const clips=model?.clips;if(!clips)return actor;
  const preferred=['bat','pelican','dragon'].includes(actor.kind)?['fly','run','walk']:actor.kind==='snake'?['slither','walk','run']:(actor.locomotionSpeed??actor.speed??90)<=110?['walk','run','stalk']:['run','walk','stalk'];
  const action=preferred.find(name=>clips[name]);if(!action)return actor;
  const clip=clips[action],stride=actor.kind==='beetle'?(action==='walk'?54:70):action==='walk'?70:100;
  // Flying loops are time-driven; footed gaits cover a consistent distance/cycle.
  const playerFrame=action==='fly'?undefined:((actor.step||0)/(.13*stride))*clip.length;
  return {...actor,animationAction:action,playerFrame,poseTime:undefined,animationProgress:undefined,animationTime:undefined};
}
