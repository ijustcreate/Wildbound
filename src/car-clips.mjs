import {applyIK} from './ik.mjs';
import {addTrainSeat} from './train-clips.mjs';

// Ordinary editable clips; existing authored car poses are never replaced.
export function addCarSeats(model){
 addTrainSeat(model);
 if(!model.clips.train_sit)return model;
 model.clips.car_sit??=structuredClone(model.clips.train_sit);
 if(model.clips.car_drive)return model;
 const clip=structuredClone(model.clips.car_sit),rest=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position]));
 for(const key of clip.keys){
  const pose=Object.fromEntries(Object.entries(rest).map(([n,p])=>[n,p.map((v,i)=>v+(key.joints[n]?.[i]||0))]));
  for(const side of ['L','R']){const sign=side==='L'?-1:1;
   pose['hand'+side]=[sign*4.2,7,pose.pelvis[2]+7];
   pose['elbow'+side]=[sign*7,3,pose.pelvis[2]+6];
  }
  applyIK(model,pose);
  key.joints=Object.fromEntries(Object.entries(pose).map(([n,p])=>[n,p.map((v,i)=>v-rest[n][i])]));
 }
 model.clips.car_drive=clip;return model;
}
