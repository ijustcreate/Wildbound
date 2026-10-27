import {applyIK} from './ik.mjs';
const legacyScythe=new Set(['9204:2617838756:2977235602','9531:857134317:4077486811','13762:1287894670:3296479666','14027:1365908038:2412315010']);
export function scytheClipSignature(clip){const text=JSON.stringify(clip);let a=2166136261,b=5381;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i);}return [text.length,a>>>0,b>>>0].join(':');}
function scytheKey(model,rest,name,t){
 const sign=name==='scythe_reap'?-1:1,stages=[[0,-.25,.9],[.2,-1.05,.75],[.34,-1.05,.7],[.48,.4,.32],[.6,1.15,.22],[.75,1.32,.38],[1,-.25,.9]];
 let index=stages.findIndex(s=>s[0]>=t);if(index<0)index=stages.length-1;
 const a=stages[Math.max(0,index-1)],b=stages[index],u=b[0]===a[0]?0:(t-a[0])/(b[0]-a[0]),smooth=u*u*(3-2*u);
 const angle=(a[1]+(b[1]-a[1])*smooth)*sign,lift=a[2]+(b[2]-a[2])*smooth,p=structuredClone(rest),dip=Math.sin(t*Math.PI)*1.8,yaw=angle*.32;
 for(const [joint,v]of Object.entries(p)){if(/^(foot|knee)/.test(joint))continue;const x=v[0]-rest.pelvis[0],y=v[1]-rest.pelvis[1],turn=/^(head|eye|ear|nose|mouth)/.test(joint)?yaw*.35:yaw;v[0]=rest.pelvis[0]+x*Math.cos(turn)-y*Math.sin(turn);v[1]=rest.pelvis[1]+x*Math.sin(turn)+y*Math.cos(turn)+Math.sin(t*Math.PI);v[2]-=dip;}
 const shaft=[Math.sin(angle)*Math.sqrt(1-lift*lift),Math.cos(angle)*Math.sqrt(1-lift*lift),lift];
 p.handR=[Math.sin(angle)*5,5+Math.cos(angle)*2,rest.chest[2]-5-dip];p.handL=p.handR.map((v,i)=>v+shaft[i]*6);
 p.elbowR=[rest.shoulderR[0]+2,rest.shoulderR[1]+3,rest.shoulderR[2]-5];p.elbowL=[rest.shoulderL[0]-2,rest.shoulderL[1]+4,rest.shoulderL[2]-5];
 p.footL[1]+=1.5*Math.sin(t*Math.PI);p.footR[1]-=1.5*Math.sin(t*Math.PI);
 applyIK(model,p);return {joints:Object.fromEntries(Object.entries(p).map(([n,v])=>[n,v.map((x,i)=>x-rest[n][i])]))};
}
// Ordinary editable humanoid keys; never alter an existing authored clip.
export function addReaperClips(model){
 const rest=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position]));
 for(const name of ['scythe_sweep','scythe_reap','reaper_raise','reaper_channel']){
  if(model.clips[name]&&(!name.startsWith('scythe_')||!legacyScythe.has(scytheClipSignature(model.clips[name]))))continue;
  const channel=name.startsWith('reaper_'),loop=name==='reaper_channel',length=channel?16:20;
  const keys=Array.from({length},(_,frame)=>{
   const t=frame/(length-1),p=structuredClone(rest);
   if(!channel)return {frame,...scytheKey(model,rest,name,t)};
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
  if(!channel)model.scytheRevision=2;
 }
 return model;
}
