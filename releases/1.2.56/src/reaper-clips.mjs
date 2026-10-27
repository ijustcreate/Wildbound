import {applyIK} from './ik.mjs';
// Ordinary editable humanoid keys; never alter an existing authored clip.
export function addReaperClips(model){
 const rest=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position]));
 for(const name of ['scythe_sweep','scythe_reap','reaper_raise','reaper_channel']){
  if(model.clips[name])continue;
  const channel=name.startsWith('reaper_'),loop=name==='reaper_channel',length=channel?16:20;
  const keys=Array.from({length},(_,frame)=>{
   const t=frame/(length-1),p=structuredClone(rest);
   if(channel){
    const lift=loop?1:Math.sin(t*Math.PI/2),breath=loop?Math.sin(t*Math.PI*2)*.25:0;
    for(const [n,v]of Object.entries(p))if(!/^(foot|knee)/.test(n))v[2]+=lift*.8+breath;
    // Right hand keeps the scythe grounded beside the body; left palm rises.
    p.handR=[7,5,15+breath];p.elbowR=[9,1,20+breath];
    p.handL=[-6,8*lift,12+21*lift+breath];p.elbowL=[-9,3*lift,18+9*lift];
   }else{
    const reverse=name==='scythe_reap',s=reverse?-1:1;
    const swing=t<.3?-1.1:t<.65?-1.1+(t-.3)/.35*2.3:1.2-(t-.65)/.35*1.2;
    p.handR=[s*(5-Math.sin(swing)*10),5+Math.cos(swing)*4,23+(reverse?Math.sin(t*Math.PI)*6:0)];
    const shaft=(t<.3?-.9:t<.65?-.9+(t-.3)/.35*2.2:1.3-(t-.65)/.35*1.3)*s;
    p.handL=[p.handR[0]-Math.sin(shaft)*5,p.handR[1],p.handR[2]-Math.cos(shaft)*5];
    p.elbowR=[8,2,21];p.elbowL=[-8,3,20];
    p.chest[0]+=s*Math.sin(swing)*1.5;
   }
   applyIK(model,p);
   return {frame,joints:Object.fromEntries(Object.entries(p).map(([n,v])=>[n,v.map((x,i)=>x-rest[n][i])]))};
  });
  model.clips[name]={length,fps:loop?12:name==='reaper_raise'?24:24,loop,keys};
 }
 return model;
}
