import {ravenPose} from './raven-art.mjs';
const copy=v=>structuredClone(v);
const parents={pelvis:'',chest:'pelvis',neck:'chest',head:'neck',jaw:'head',beak:'head',pouch:'head',eyeL:'head',eyeR:'head',tailBase:'pelvis',tailMid:'tailBase',tailTip:'tailMid',shoulderL:'chest',shoulderR:'chest',elbowL:'shoulderL',elbowR:'shoulderR',wingTipL:'elbowL',wingTipR:'elbowR',hipL:'pelvis',hipR:'pelvis',kneeL:'hipL',kneeR:'hipR',footL:'kneeL',footR:'kneeR',handL:'wingTipL',handR:'wingTipR'};
export function pelicanRavenPose(action,time=0){
 const phase=action==='death'?'death':['fly','flap','run','charge'].includes(action)?'fly':action==='attack'?'attack':'perch';
 const bird=ravenPose({id:0,hp:action==='death'?0:1,raven:{phase,phaseTime:time}},time),spread=bird.spread,lift=bird.lift;
 const p={pelvis:[0,-4,11],chest:[0,4,13],neck:[0,9,bird.flight?18:22],head:[0,13,bird.flight?22:27],jaw:[0,16,bird.flight?20:25],beak:[0,32,bird.flight?21:26],pouch:[0,23,bird.flight?16:21],eyeL:[-3,16,bird.flight?23:28],eyeR:[3,16,bird.flight?23:28],tailBase:[0,-9,12],tailMid:[0,-14,10],tailTip:[0,-19,9+bird.tail]};
 for(const[side,sign]of[['L',-1],['R',1]]){
  p['shoulder'+side]=[sign*5,3,14];p['elbow'+side]=spread<.05?[sign*7,-3,12]:[sign*(8+spread*7),3,13+lift*.45];p['wingTip'+side]=spread<.05?[sign*5,-15,9]:[sign*(12+spread*13),-2,12+lift];p['hand'+side]=copy(p['wingTip'+side]);
  p['hip'+side]=[sign*3,0,9];p['knee'+side]=[sign*4,2,4+bird.feet];p['foot'+side]=[sign*4,5,bird.flight?4+bird.feet:0];
 }
 if(action==='death')for(const v of Object.values(p)){v[0]*=1.1;v[2]=Math.max(0,v[2]*.15);}
 return p;
}
export function ravenPelicanDefaults(legacy){
 const model=copy(legacy),rest=pelicanRavenPose('idle',0);model.joints=Object.fromEntries(Object.entries(rest).map(([n,position])=>[n,{parent:parents[n],position}]));
 model.clips=Object.fromEntries(Object.keys(legacy.clips).map(action=>{const length=action==='idle'?24:12,fps=action==='idle'?6:12,loop=!['attack','hit','hurt','death'].includes(action);
  return[action,{length,fps,loop,keys:Array.from({length},(_,frame)=>{const p=pelicanRavenPose(action,frame/fps);return{frame,joints:Object.fromEntries(Object.entries(p).map(([n,v])=>[n,v.map((x,i)=>x-rest[n][i])]))};})}];}));
 model.visibility=Object.fromEntries(Object.keys(rest).map(n=>[n,Array.from({length:8},(_,d)=>!n.startsWith('eye')||(d<3||d>5)&&!(n==='eyeL'&&d===6)&&!(n==='eyeR'&&d===2))]));
 model.pelicanRavenRevision=1;model.provenance={source:'Native raven articulated wing and flight rig',art:'Native pelican volumes, independent beak, pouch, eyes, webbed feet and feathers'};return model;
}
export function upgradeRavenPelican(input,legacy){
 if(input.pelicanRavenRevision===1)return copy(input);
 if(JSON.stringify(input.joints)!==JSON.stringify(legacy.joints))return copy(input);
 const next=ravenPelicanDefaults(legacy);
 for(const[key,value]of Object.entries(input))if(!['joints','clips','visibility'].includes(key))next[key]=copy(value);
 for(const[name,clip]of Object.entries(input.clips))if(JSON.stringify(clip)!==JSON.stringify(legacy.clips[name]))next.clips[name]=copy(clip);
 for(const[name,visibility]of Object.entries(input.visibility||{}))if(next.visibility[name])next.visibility[name]=copy(visibility);
 next.pelicanRavenRevision=1;return next;
}
