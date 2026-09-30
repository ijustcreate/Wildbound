// Ordered, serializable joint masks. Clips retain independent playback clocks.
export function upperJoints(model){
 return Object.keys(model.joints).filter(name=>{let n=name;const seen=new Set();while(n&&!seen.has(n)){if(n==='chest')return true;seen.add(n);n=model.joints[n]?.parent;}return false;});
}
export function defaultAnimationLayers(model){return [{name:'Airborne combat',enabled:true,condition:'airborne',base:'$current',overlay:'$combat',weight:1,joints:upperJoints(model)}];}
export function validAnimationLayers(model){
 return model.animationLayers===undefined||(Array.isArray(model.animationLayers)&&model.animationLayers.length<=16&&model.animationLayers.every(l=>
  l&&typeof l.name==='string'&&typeof l.enabled==='boolean'&&['airborne','moving','combat','always'].includes(l.condition)&&
  (l.base==='$current'||!!model.clips[l.base])&&(l.overlay==='$combat'||!!model.clips[l.overlay])&&
  Number.isFinite(l.weight)&&l.weight>=0&&l.weight<=1&&Array.isArray(l.joints)&&l.joints.every(n=>!!model.joints[n])));
}
export function blendJointMask(base,overlay,layer){
 const out={...base},a=base.pelvis||[0,0,0],b=overlay.pelvis||[0,0,0];
 for(const n of layer.joints)if(base[n]&&overlay[n])out[n]=base[n].map((v,i)=>v+(overlay[n][i]+(n==='pelvis'?0:a[i]-b[i])-v)*layer.weight);
 return out;
}
