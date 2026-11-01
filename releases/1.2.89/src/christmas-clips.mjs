import {applyIK} from './ik.mjs';
export function addSantaLaugh(model){
 if(model.clips.santa_laugh)return model;
 const rest=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position]));
 const length=32,keys=Array.from({length},(_,frame)=>{
  const t=frame/(length-1),hold=Math.sin(Math.min(1,t/.18)*Math.PI/2)*Math.sin(Math.min(1,(1-t)/.18)*Math.PI/2),bounce=Math.sin(t*Math.PI*8)*hold*.6,p=structuredClone(rest);
  for(const[name,v]of Object.entries(p))if(!/^(foot|knee)/.test(name))v[2]+=bounce;
  for(const side of['L','R']){const sign=side==='L'?-1:1,target=[sign*4,6,rest.pelvis[2]+3+bounce];p['hand'+side]=p['hand'+side].map((v,i)=>v+(target[i]-v)*hold);}
  p.head[1]-=hold*.5;p.head[2]+=hold*.8;applyIK(model,p);
  return{frame,joints:Object.fromEntries(Object.entries(p).map(([n,v])=>[n,v.map((x,i)=>x-rest[n][i])]))};
 });model.clips.santa_laugh={length,fps:24,loop:false,keys};return model;
}
