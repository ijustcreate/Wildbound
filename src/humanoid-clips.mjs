// Offsets in rig space; shared by the player and skeleton animation editors.
export function humanoidClips(base){
 const rest=Object.fromEntries(Object.keys(base.run.keys[0].joints).map(n=>[n,[0,0,0]]));
 const clip=(poses,length=8,loop=false)=>({fps:16,length,loop,keys:poses.map((joints,i)=>({frame:Math.round(i*(length-1)/Math.max(1,poses.length-1)),joints:{...structuredClone(rest),...joints}}))});
 const punch=(side,upper=false)=>clip([
  {[`hand${side}`]:[0,-3,5],[`elbow${side}`]:[0,-2,3]},
  {[`hand${side}`]:[0,upper?7:13,upper?22:9],[`elbow${side}`]:[0,5,upper?10:5],chest:[0,2,1]},{}
 ],6);
 const sweep=(sign,big=false)=>clip([
  {handR:[sign*8,-4,14],elbowR:[sign*4,-2,6],handL:[-2,0,5]},
  {handR:[-sign*(big?14:10),12,big?8:4],elbowR:[-sign*5,6,4],chest:[-sign*2,2,-1],handL:[2,3,4]},{}
 ],big?10:7);
 const crouch={pelvis:[0,0,-4],chest:[0,2,-4],head:[0,2,-4],kneeL:[-1,3,0],kneeR:[1,3,0],handL:[0,-3,2],handR:[0,-3,2]};
 const air={kneeL:[0,3,5],kneeR:[0,-2,4],footL:[0,2,7],footR:[0,-3,6],handL:[-3,0,12],handR:[3,0,12]};
 return {
  walk:{...structuredClone(base.run),fps:7},
  swipe_one:sweep(1),swipe_two:sweep(-1),swipe_big:sweep(1,true),
  punch_left:punch('L'),punch_right:punch('R'),uppercut:punch('R',true),
  cast:clip([{handL:[1,5,8],handR:[-1,5,8],elbowL:[0,2,4],elbowR:[0,2,4]},{handL:[1,8,10],handR:[-1,8,10]},{}],7),
  jump_takeoff:clip([crouch,air],4),jump_air:clip([air],4,true),jump_fall:clip([{...air,handL:[-4,1,8],handR:[4,1,8],footL:[0,0,3],footR:[0,0,3]}],4,true),land:clip([crouch,{}],5),
  interact:clip([{}, {chest:[0,4,-3],head:[0,4,-3],handL:[2,9,1],handR:[-2,9,1]},{}],8),
  get_up:clip([{pelvis:[0,0,-10],chest:[6,0,-16],head:[10,0,-22],handL:[4,0,-8],handR:[4,0,-8]},crouch,{}],8),
  revive:clip([{chest:[0,3,-6],head:[0,3,-6],pelvis:[0,0,-5],handL:[2,10,-3],handR:[-2,10,-3]},{}],8),
  swim:clip([{handL:[-6,6,8],handR:[6,-4,8],footL:[0,-5,3]},{handL:[-6,-4,8],handR:[6,6,8],footR:[0,-5,3]}],8,true),
  death:clip([{}, {pelvis:[0,0,-12],chest:[8,0,-18],head:[15,0,-25],shoulderL:[8,0,-18],shoulderR:[8,0,-18],elbowL:[9,0,-14],elbowR:[9,0,-14],handL:[10,0,-11],handR:[10,0,-11],kneeL:[-5,0,-5],kneeR:[-5,0,-5],footL:[-8,0,0],footR:[-8,0,0]}],8),
 };
}
