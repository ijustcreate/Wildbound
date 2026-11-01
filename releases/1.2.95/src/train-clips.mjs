import {applyIK} from './ik.mjs';
// Editable seat keys on the existing player skeleton. Add missing clips only.
export function addTrainSeat(model){
 if(model.clips?.train_sit)return model;
 const rest=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position]));if(!rest.pelvis||!rest.kneeL)return model;
 const keys=[0,4].map(frame=>{const p=structuredClone(rest),drop=rest.pelvis[2]-9,bob=frame?.18:0;for(const [n,v]of Object.entries(p))v[2]-=drop;
  for(const side of['L','R']){const hip=p['hip'+side],thigh=Math.hypot(...rest['knee'+side].map((v,i)=>v-rest['hip'+side][i])),shin=Math.hypot(...rest['foot'+side].map((v,i)=>v-rest['knee'+side][i]));p['knee'+side]=[hip[0],hip[1]+thigh*.98,hip[2]-.4];p['foot'+side]=[hip[0],hip[1]+thigh*.98,hip[2]-.4-shin];const shoulder=p['shoulder'+side],sign=side==='L'?-1:1;p['elbow'+side]=[shoulder[0]+sign*.8,shoulder[1]+1,shoulder[2]-4];p['hand'+side]=[hip[0]+sign*.4,hip[1]+thigh*.55,hip[2]+2];}
  for(const n of Object.keys(p))if(!/^(hip|knee|foot)/.test(n))p[n][2]+=bob;
  applyIK(model,p);return{frame,joints:Object.fromEntries(Object.entries(p).map(([n,v])=>[n,v.map((x,i)=>x-rest[n][i])]))};});
 model.clips.train_sit={fps:3,length:8,loop:true,keys};return model;
}
