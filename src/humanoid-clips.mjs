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
 const down={pelvis:[0,3,-5],chest:[0,5,-6],head:[0,7,-7],kneeL:[-2,4,-1],kneeR:[2,4,-1],handL:[-4,5,-2],handR:[4,5,-2]};
 const itemUp={chest:[0,0,2],head:[0,0,3],handL:[-2,5,17],handR:[2,5,17],elbowL:[-1,3,8],elbowR:[1,3,8]};
 const overhead={chest:[0,1,1],head:[0,1,2],handL:[-3,4,20],handR:[3,4,20],elbowL:[-2,3,11],elbowR:[2,3,11]};
 const strike={chest:[0,5,-2],head:[0,6,-1],handL:[-5,11,4],handR:[5,11,4],elbowL:[-3,6,2],elbowR:[3,6,2]};
 const sideSwing={chest:[-2,3,-1],head:[-2,4,0],handR:[-13,7,10],elbowR:[-8,4,6],handL:[2,2,6]};
 return {
  walk:{...structuredClone(base.run),fps:7},
  swipe_one:sweep(1),swipe_two:sweep(-1),swipe_big:sweep(1,true),
  punch_left:punch('L'),punch_right:punch('R'),uppercut:punch('R',true),
  cast:clip([{handL:[1,5,8],handR:[-1,5,8],elbowL:[0,2,4],elbowR:[0,2,4]},{handL:[1,8,10],handR:[-1,8,10]},{}],7),
  jump_takeoff:clip([crouch,air],4),jump_air:clip([air],4,true),jump_fall:clip([{...air,handL:[-4,1,8],handR:[4,1,8],footL:[0,0,3],footR:[0,0,3]}],4,true),land:clip([crouch,{}],5),
  interact:clip([{}, {chest:[0,4,-3],head:[0,4,-3],handL:[2,9,1],handR:[-2,9,1]},{}],8),
  pickup:clip([down,{...down,handL:[-3,7,2],handR:[3,7,2]},itemUp,{}],9),
  carry:clip([{chest:[0,1,0],head:[0,1,1],handL:[-6,3,9],handR:[6,3,9],elbowL:[-4,1,5],elbowR:[4,1,5]},{chest:[0,1,1],head:[0,1,2],handL:[-6,3,10],handR:[6,3,10],elbowL:[-4,1,6],elbowR:[4,1,6]}],8,true),
  found_unique:clip([itemUp,{...itemUp,handL:[-1,4,23],handR:[1,4,23],chest:[0,0,3],head:[0,0,5]}, {...itemUp,handL:[-2,4,19],handR:[2,4,19]}],10),
  mine:clip([overhead,{...overhead,handL:[-4,8,12],handR:[4,8,12]},strike,{}],10),
  woodcut:clip([overhead,{...overhead,handL:[-5,6,14],handR:[5,6,14]},sideSwing,{}],10),
  shield:clip([{chest:[0,2,0],head:[0,2,1],handL:[-2,6,13],handR:[2,5,8],elbowL:[-1,4,7],elbowR:[1,3,4]}],4,true),
  parry:clip([{chest:[0,3,1],head:[0,4,2],handL:[-3,8,16],handR:[3,7,14],elbowL:[-2,5,9],elbowR:[2,4,8]},{chest:[0,0,0],head:[0,0,1],handL:[-2,3,8],handR:[2,3,8]}],6),
  ranged:clip([{chest:[0,2,0],head:[0,3,1],handL:[-3,6,12],handR:[3,8,13],elbowL:[-2,3,7],elbowR:[2,4,8]},{chest:[0,4,-1],head:[0,5,0],handL:[-4,9,14],handR:[4,10,15],elbowL:[-3,5,8],elbowR:[3,6,9]},{}],7),
  sword_combo:clip([{chest:[0,-2,0],head:[0,-1,1],handR:[5,-2,14],elbowR:[4,-1,8]},{chest:[0,3,-1],head:[0,4,0],handR:[-13,9,7],elbowR:[-8,5,5]},{chest:[0,0,0],head:[0,0,1]}],8),
  get_up:clip([{pelvis:[0,0,-10],chest:[6,0,-16],head:[10,0,-22],handL:[4,0,-8],handR:[4,0,-8]},crouch,{}],8),
  revive:clip([{chest:[0,3,-6],head:[0,3,-6],pelvis:[0,0,-5],handL:[2,10,-3],handR:[-2,10,-3]},{}],8),
  swim:clip([{handL:[-6,6,8],handR:[6,-4,8],footL:[0,-5,3]},{handL:[-6,-4,8],handR:[6,6,8],footR:[0,-5,3]}],8,true),
  death:clip([{}, {pelvis:[0,0,-12],chest:[8,0,-18],head:[15,0,-25],shoulderL:[8,0,-18],shoulderR:[8,0,-18],elbowL:[9,0,-14],elbowR:[9,0,-14],handL:[10,0,-11],handR:[10,0,-11],kneeL:[-5,0,-5],kneeR:[-5,0,-5],footL:[-8,0,0],footR:[-8,0,0]}],8),
 };
}
