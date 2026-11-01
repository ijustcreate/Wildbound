// Additive rig migrations: authored walk/combat clips remain intact.
export function withCompanionClips(model,bat=false){
 if(!model?.joints||!model.clips)return model;
 const name=bat?'hang':'sit';if(model.clips[name])return model;
 const frames=[0,4,7].map(frame=>{
  const breath=Math.sin(frame/8*Math.PI*2)*.35,joints={};
  for(const [name,joint] of Object.entries(model.joints)){
   const [x,y,z]=joint.position;let target=[x,y,z];
   if(bat){
    target=[x,y,24-z];
    if(/wingTip|finger|innerFinger|wrist|elbow/.test(name)){target[0]=x*.19;target[1]=-5;target[2]=-6+breath;}
    else if(!name.startsWith('foot'))target[0]+=breath;
   }else{
    if(/pelvis|hip/.test(name))target=[x,y-1,Math.max(3,z-8)];
    else if(/knee|hock|rearPaw/.test(name))target=[x*1.15,-3,Math.max(1,z*.35)];
    else if(/tail/.test(name))target=[x+Math.sin(frame/8*Math.PI*2)*2,y,Math.max(1,z-8)];
    else if(/chest|neck|head|ear|eye|muzzle|nose|face/.test(name))target=[x,y-3,z+2+breath];
    else if(/shoulder|elbow/.test(name))target=[x,y-2,z+1];
   }
   joints[name]=target.map((v,i)=>v-joint.position[i]);
  }
  return {frame,joints};
 });
 model.clips[name]={fps:4,length:8,loop:true,keys:frames};return model;
}
