// Editable, idempotent stance migration. Keep the original rig recoverable.
export function widenHumanoidStance(model){
  if(model.relaxedStanceRevision===1||model.skeleton||model.robot||!model.joints?.handL||!model.joints?.footL)return model;
  const old=structuredClone(model.joints);
  model.relaxedStanceSource=old;
  for(const side of ['L','R']){
    const sign=side==='L'?-1:1;
    for(const [names,amount] of [[['shoulder','elbow','hand'],1],[['hip','knee','foot'],.5]]){
      for(const name of names){
        const joint=name+side;if(!model.joints[joint])continue;
        model.joints[joint].position[0]+=sign*amount;
        for(const [action,clip] of Object.entries(model.clips))for(const key of clip.keys){
          const value=key.joints[joint]||[0,0,0];
          // Preserve deliberately edited player clips at their original positions.
          if(model.nativeHumanoidSource?.preservedClips?.[action]){key.joints[joint]=[value[0]-sign*amount,value[1],value[2]];continue;}
          const point=n=>old[n].position.map((v,i)=>v+(key.joints[n]?.[i]||0));
          const l=point('shoulderL'),r=point('shoulderR'),dx=r[0]-l[0],dy=r[1]-l[1],size=Math.hypot(dx,dy)||1;
          key.joints[joint]=[value[0]+sign*amount*(dx/size-1),value[1]+sign*amount*dy/size,value[2]];
        }
      }
    }
  }
  model.relaxedStanceRevision=1;return model;
}

export function breaststrokeNativePlayer(model,stock=false){
  if(model.nativeHumanoidRevision!==1||model.breaststrokeRevision===1)return model;
  if(!stock)return model;
  const clip=model.clips.swim;if(!clip)return model;
  model.breaststrokeSource=structuredClone(clip);
  clip.keys=Array.from({length:clip.length},(_,frame)=>{
    const a=frame/clip.length*Math.PI*2,sweep=(1+Math.cos(a))/2;
    const joints=Object.fromEntries(Object.keys(model.joints).map(n=>[n,[0,0,-3]]));
    // Upright chest and head remain above the water; paired sweeps and frog kick.
    for(const side of ['L','R']){
      const sign=side==='L'?-1:1;
      joints['hand'+side]=[sign*(1+4*sweep),5+3*Math.sin(a),4+2*sweep];
      joints['elbow'+side]=[sign*(1+2*sweep),3,0];
      joints['knee'+side]=[sign*2*sweep,-3,0];
      joints['foot'+side]=[sign*3*sweep,-5-3*sweep,2];
    }
    return {frame,joints};
  });
  model.breaststrokeRevision=1;return model;
}
