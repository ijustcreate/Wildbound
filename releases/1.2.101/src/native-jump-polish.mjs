import {applyIK} from './ik.mjs';
const copy=v=>structuredClone(v),canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x),same=(a,b)=>canonical(a)===canonical(b);
const names=['jump_takeoff','jump_air','jump_fall','land'];
// Exact shared generation-4 clips were previously classified as custom during
// retargeting. Recognize those originals, preserving all other authored edits.
const sharedHashes={jump_takeoff:'ca2683de',jump_air:'614c8dd',jump_fall:'7986a6c5',land:'7921c073'};
export function isSharedBaseJump(name,clip){
 if(!clip||!sharedHashes[name])return false;
 let hash=2166136261;for(const x of canonical(clip))hash=Math.imul(hash^x.charCodeAt(0),16777619);
 return (hash>>>0).toString(16)===sharedHashes[name];
}
// Replace only the recognized generated jump. User-authored clips stay intact.
export function refineNativeJumpPolish(model,shipping,shared={}){
 if(model.nativeHumanoidRevision!==1||model.jumpPolishRevision===1||!same(model.joints,shipping.joints))return model;
 const target=copy(model),source={};
 const neutral=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,[...j.position]]));
 const pose=(compression=0,tuck=0,arms=0)=>{
  const p=copy(neutral);
  for(const [n,v]of Object.entries(p))if(!/^(knee|foot)/.test(n))v[2]-=.65+compression;
  for(const side of ['L','R']){
   const hip=p['hip'+side],foot=p['foot'+side];
   foot[1]-=tuck*.35;foot[2]+=tuck;
   p['knee'+side]=[hip[0],hip[1]+3+tuck*.5,hip[2]-6];
   const shoulder=p['shoulder'+side],sign=side==='L'?-1:1;
   p['elbow'+side]=[shoulder[0]+sign*1.1,shoulder[1]+.3,shoulder[2]-4.1+arms*.45];
   p['hand'+side]=[shoulder[0]+sign*1.6,shoulder[1]+.3,shoulder[2]-7.8+arms];
  }
  applyIK(model,p);
  const angles={};
  for(let d=0;d<8;d++){
   const a=d*Math.PI/4,project=v=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),(v[0]*Math.sin(a)+v[1]*Math.cos(a))*.5-v[2]];
   angles[d]={};
   for(const side of ['L','R']){
    const foot=project(p['foot'+side]),knee=project(p['knee'+side]);
    angles[d]['foot'+side]=-Math.atan2(knee[0]-foot[0],foot[1]-knee[1])*180/Math.PI;
   }
  }
  return {joints:Object.fromEntries(Object.entries(p).map(([n,v])=>[n,v.map((x,i)=>x-model.joints[n].position[i])])),angles};
 };
 const rest=pose(),push=pose(0,0,1),tuck=pose(0,2.2,2.6),extend=pose(0,.25,1),compressed=pose(1.4,0,-.4);
 const stages={jump_takeoff:[rest,push],jump_air:[push,tuck],jump_fall:[tuck,extend],land:[extend,compressed,rest]};
 for(const name of names){
  if(!same(model.clips[name],shipping.clips[name])&&!same(model.clips[name],shared[name]))continue;
  source[name]=copy(model.clips[name]);
  const clip=target.clips[name];clip.loop=false;
  clip.keys=stages[name].map((pose,i,all)=>({frame:Math.round(i*(clip.length-1)/(all.length-1)),...copy(pose)}));
 }
 if(!Object.keys(source).length)return model;
 target.jumpPolishRevision=1;target.jumpPolishSource=source;return target;
}
