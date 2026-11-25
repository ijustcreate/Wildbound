const clone=value=>structuredClone(value);

// Adjust only the authored rig's ground anchor; leave every art layer and clip
// delta intact. The snail's body is a 3px half-height volume centred at z=10,
// so its lowest visible pixels begin seven pixels above its ground contact.
export function applyCreaturePackRuntimeAdjustments(subjects){
  const snail=subjects?.snail?.data;
  if(!snail||snail.runtimeGroundAnchorRevision===1)return subjects;
  const model=clone(snail);
  for(const joint of Object.values(model.joints||{}))if(Array.isArray(joint.position)&&joint.position.length===3)joint.position[2]-=7;
  model.runtimeGroundAnchorRevision=1;
  Object.assign(snail,model);
  return subjects;
}
