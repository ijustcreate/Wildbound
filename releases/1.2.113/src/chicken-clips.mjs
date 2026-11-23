const supportsCarry=model=>!!model?.clips&&['head','chest','shoulderL','elbowL','handL','shoulderR','elbowR','handR'].every(name=>Array.isArray(model.joints?.[name]?.position));
// Add missing clips or replace only the exact previous shipping keys.
// User-authored keys remain editable and survive this default-pose correction.
function chickenClipDefaults(model){
 const rest=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position]));
 const key=(frame,forward,height,bob=0,legacy=false)=>{
  const joints={chest:[0,0,bob],head:[0,0,bob]};
  for(const [side,sign]of [['L',-1],['R',1]]){
   const shoulder=rest['shoulder'+side];
   const hand=[sign*5,forward,(legacy?rest.chest[2]-4:rest.head[2])+height+bob];
   const elbow=legacy?[sign*8,forward*.35,rest.chest[2]-5+height*.4+bob]:[shoulder[0]+sign*2,forward*.35,shoulder[2]+4+height*.15+bob];
   for(const [name,v]of [['hand'+side,hand],['elbow'+side,elbow]])joints[name]=v.map((x,i)=>x-rest[name][i]);
  }
  return {frame,joints};
 };
 const hold={fps:8,length:16,loop:true,keys:[key(0,1,2),key(8,1,2,.35),key(15,1,2)]};
 const toss={fps:24,length:12,loop:false,keys:[key(0,1,2),key(3,-2,3),key(5,10,1),key(8,13,-4),key(11,4,-12)]};
 const previous={
  chicken_hold:{fps:8,length:16,loop:true,keys:[key(0,9,0,0,true),key(8,9,0,.35,true),key(15,9,0,0,true)]},
  chicken_throw:{fps:24,length:12,loop:false,keys:[key(0,9,0,0,true),key(3,5,3,0,true),key(5,15,2,0,true),key(8,16,-1,0,true),key(11,4,-5,0,true)]},
 };
 return {current:{chicken_hold:hold,chicken_throw:toss},previous};
}
export function isDefaultChickenClip(model,name){
 if(!supportsCarry(model))return false;
 const {current,previous}=chickenClipDefaults(model),clip=JSON.stringify(model.clips[name]);
 return !model.clips[name]||clip===JSON.stringify(current[name])||clip===JSON.stringify(previous[name]);
}
export function addChickenClips(model){
 if(!supportsCarry(model))return model;
 const {current,previous}=chickenClipDefaults(model);
 for(const [name,clip]of Object.entries(current))
  if(!model.clips[name]||JSON.stringify(model.clips[name])===JSON.stringify(previous[name]))model.clips[name]=clip;
 return model;
}
