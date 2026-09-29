const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const len=a=>Math.hypot(...a);
const unit=a=>a.map(v=>v/(len(a)||1));
const add=(a,b,s=1)=>a.map((v,i)=>v+b[i]*s);
export function ikChain(model,end){
 const mid=model.joints[end]?.parent,root=model.joints[mid]?.parent;
 return model.joints[root]?{root,mid,end,bend:1,enabled:true}:null;
}
export function solveTwoBone(root,mid,end,target,lengths,bend=1){
 const a=lengths?.[0]??len(sub(mid,root)),b=lengths?.[1]??len(sub(end,mid));
 if(a<1e-6||b<1e-6)return {mid:[...mid],end:[...end]};
 let axis=sub(target,root);if(len(axis)<1e-6)axis=sub(end,root);if(len(axis)<1e-6)axis=[0,0,-1];axis=unit(axis);
 const distance=Math.max(Math.abs(a-b)+1e-6,Math.min(a+b-1e-6,len(sub(target,root))));
 let pole=sub(mid,root);pole=add(pole,axis,-dot(pole,axis));
 if(len(pole)<1e-6){pole=Math.abs(axis[1])<.9?[0,1,0]:[1,0,0];pole=add(pole,axis,-dot(pole,axis));}
 pole=unit(pole);
 const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
 return {mid:add(add(root,axis,along),pole,height*(bend<0?-1:1)),end:add(root,axis,distance)};
}
export function applyIK(model,pose){
 for(const chain of Object.values(model.ik||{})){
  if(!chain||chain.enabled===false)continue;
  const {root,mid,end}=chain;if(!pose[root]||!pose[mid]||!pose[end]||model.joints[mid]?.parent!==root||model.joints[end]?.parent!==mid)continue;
  const rest=model.joints, lengths=[len(sub(rest[mid].position,rest[root].position)),len(sub(rest[end].position,rest[mid].position))];
  // Authored middle-joint keys provide the pole. End-joint keys are targets.
  const result=solveTwoBone(pose[root],pose[mid],pose[end],pose[end],lengths,chain.bend);
  for(const joint of [mid,end]){
   const delta=sub(result[joint===mid?'mid':'end'],pose[joint]);
   pose[joint]=result[joint===mid?'mid':'end'];
   if(joint===end)for(const name of Object.keys(pose)){
    let parent=model.joints[name]?.parent,seen=new Set();
    while(parent&&!seen.has(parent)){if(parent===end){pose[name]=add(pose[name],delta);break;}seen.add(parent);parent=model.joints[parent]?.parent;}
   }
  }
 }
 return pose;
}
