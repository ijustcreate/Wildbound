import { applyIK } from './ik.mjs';

const faceNames=['eyeL','eyeR','earL','earR','nose','mouth'];
const rest={pelvis:[0,0,14],chest:[0,0,24],head:[0,0,31],
  eyeL:[-2,3,32.5],eyeR:[2,3,32.5],earL:[-4,0,31],earR:[4,0,31],nose:[0,4,31],mouth:[0,3,29.5],
  shoulderL:[-6,-1.5,24],shoulderR:[6,-1.5,24],elbowL:[-7,-1,17],elbowR:[7,-1,17],handL:[-7,0,12],handR:[7,0,12],
  hipL:[-3,0,13],hipR:[3,0,13],kneeL:[-3,1,7],kneeR:[3,1,7],footL:[-3,1,1],footR:[3,1,1]};
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function rotate(v,pitch=0,twist=0,roll=0){
  let [x,y,z]=v;
  [y,z]=[y*Math.cos(pitch)+z*Math.sin(pitch),z*Math.cos(pitch)-y*Math.sin(pitch)];
  [x,z]=[x*Math.cos(roll)+z*Math.sin(roll),z*Math.cos(roll)-x*Math.sin(roll)];
  return [x*Math.cos(twist)-y*Math.sin(twist),x*Math.sin(twist)+y*Math.cos(twist),z];
}

// Offline pose authoring: every generated joint remains an ordinary editable key.
export function buildHeroGeneration(source){
  const model=structuredClone(source);
  model.artGeneration=3;model.name='Wildbound hero / sculpted generation 3';
  for(const [name,position] of Object.entries(rest))model.joints[name].position=[...position];
  model.palette={...model.palette,body:'#66744e',bodyShade:'#394c37',arms:'#66744e',armShade:'#394c37',legs:'#79634a',legShade:'#4b4236',outline:'#292c2a'};
  model.ik={...model.ik};
  for(const side of ['L','R'])for(const [root,mid,end] of [['shoulder','elbow','hand'],['hip','knee','foot']])
    model.ik[end+side]={root:root+side,mid:mid+side,end:end+side,bend:1,enabled:true};
  function pose(o={}){
    const p=structuredClone(rest),shift=o.shift||[0,0,0];
    for(const [name,value] of Object.entries(o.joints||{}))p[name]=[...value];
    for(const name of Object.keys(p)){
      if(/^(knee|foot)/.test(name))continue;
      p[name]=add(add(rotate(sub(p[name],rest.pelvis),o.pitch||0,o.twist||0,o.roll||0),rest.pelvis),shift);
    }
    // Facial handles inherit the head transform, not an independent face pose.
    for(const name of faceNames)p[name]=add(p.head,rotate(sub(rest[name],rest.head),o.pitch||0,o.twist||0,o.roll||0));
    return applyIK(model,p);
  }
  function ground(sleep=false){
    const p=pose(),points={pelvis:[0,0,4],chest:[8,0,4],head:[16,0,4],
      shoulderL:[8,-5.5,4],shoulderR:[8,5.5,4],elbowL:[11,-9,3],elbowR:[5,9,3],handL:[16,-8,3],handR:[1,9,3],
      hipL:[0,-3,4],hipR:[0,3,4],kneeL:[-6,-4,3],kneeR:[-5,5,3],footL:[-12,-3,2],footR:[-11,6,2]};
    if(sleep){points.elbowL=[14,-6,3];points.handL=[18,-2,3];points.elbowR=[14,6,3];points.handR=[18,2,3];points.kneeR=[-3,7,3];points.footR=[-8,10,2];}
    for(const [name,value] of Object.entries(points))p[name]=rotate(value,0,.3,0);
    for(const name of faceNames)p[name]=add(p.head,rotate(sub(rest[name],rest.head),0,.3,Math.PI/2));
    return applyIK(model,p);
  }
  const standing=pose();
  function clip(name,stages,{loop,frames}={}){
    const old=model.clips[name];if(!old)return;
    const length=frames||old.length;
    // Retain real-time duration if a clip needs more in-between samples.
    const fps=frames?Math.min(30,old.fps*length/old.length):old.fps;
    const keys=[];
    for(let f=0;f<length;f++){
      const t=f/(length-1),right=stages.findIndex(s=>s[0]>=t);
      const i=right<0?stages.length-1:right,left=Math.max(0,i-1);
      const [a,pa]=stages[left],[b,pb]=stages[i],u=b===a?0:(t-a)/(b-a);
      const positions=Object.fromEntries(Object.keys(rest).map(n=>[n,mix(pa[n],pb[n],u)]));
      applyIK(model,positions);
      keys.push({frame:f,joints:Object.fromEntries(Object.keys(rest).map(n=>[n,sub(positions[n],rest[n])]))});
    }
    model.clips[name]={...old,length,fps,loop:loop??old.loop,keys};
  }
  function cycle(name,make){
    const old=model.clips[name];if(!old)return;
    model.clips[name]={...old,loop:true,keys:Array.from({length:old.length},(_,f)=>{
      const p=make(f/old.length*Math.PI*2);
      return {frame:f,joints:Object.fromEntries(Object.keys(rest).map(n=>[n,sub(p[n],rest[n])]))};
    })};
  }
  cycle('idle',a=>pose({roll:Math.sin(a)*.025,shift:[.25,0,-.35+.4*Math.sin(a)],joints:{handL:[-6,1,11.5],handR:[6,2,12]}}));
  for(const name of ['walk','run'])cycle(name,a=>{
    const run=name==='run',joints={},stride=run?6.5:4;
    for(const [side,phase] of [['L',a],['R',a+Math.PI]]){
      const s=Math.sin(phase),lift=Math.max(0,Math.cos(phase));
      joints['foot'+side]=[side==='L'?-3:3,s*stride,1+lift*(run?5:2)];
      joints['knee'+side]=[side==='L'?-3.5:3.5,s*2+2,8+lift*2];
      joints['hand'+side]=[side==='L'?-6:6,-s*(run?5:3),run?17+Math.max(0,-s)*2:12];
      joints['elbow'+side]=[side==='L'?-7:7,-s*3-2,18];
    }
    return pose({joints,pitch:run?.15:.025,twist:Math.sin(a)*(run?.12:.07),shift:[Math.cos(a)*.35,0,-1+Math.cos(a*2)*(run?.9:.35)]});
  });
  const crouch=pose({shift:[0,0,-5],pitch:.2,joints:{handL:[-6,-2,14],handR:[6,-2,14],kneeL:[-4,4,8],kneeR:[4,4,8]}});
  const air=pose({pitch:.12,twist:.08,joints:{handL:[-8,1,23],handR:[8,-1,20],kneeL:[-3,6,11],kneeR:[3,-2,10],footL:[-3,4,9],footR:[3,-4,7]}});
  const fall=pose({pitch:-.08,joints:{handL:[-9,1,20],handR:[9,1,19],footL:[-3,3,3],footR:[3,-1,2]}});
  clip('jump_takeoff',[[0,standing],[.35,crouch],[.65,pose({pitch:.16,joints:{handL:[-6,-3,12],handR:[6,-3,12]}})],[1,air]]);
  clip('jump_air',[[0,air],[.5,pose({pitch:.04,joints:{handL:[-8,2,23],handR:[8,0,21],footL:[-3,3,8],footR:[3,-3,7]}})],[1,air]],{loop:true});
  clip('jump_fall',[[0,air],[.6,fall],[1,fall]],{loop:false});
  clip('land',[[0,fall],[.25,crouch],[.7,pose({shift:[0,0,-1],pitch:.05})],[1,standing]]);
  clip('dash',[[0,crouch],[.3,pose({shift:[0,2,-3],pitch:.48,joints:{handL:[-6,-6,18],handR:[6,-5,18],footL:[-3,5,2],footR:[3,-6,4]}})],[.65,pose({shift:[0,3,-2],pitch:.35,joints:{footL:[-3,6,2],footR:[3,-5,3]}})],[1,standing]]);
  clip('hurt',[[0,pose({pitch:-.3,roll:-.12,shift:[0,-1,-2],joints:{handL:[-8,2,18],handR:[8,2,18],footR:[4,-3,1]}})],[.4,pose({pitch:-.2,shift:[0,-2,-2]})],[1,standing]]);
  const prone=ground(),resting=ground(true);
  clip('death',[[0,standing],[.2,pose({shift:[0,0,-4],roll:.18,pitch:.15})],[.5,pose({shift:[2,0,-9],roll:.65,pitch:.12,joints:{handR:[8,2,10],footL:[-4,0,1],footR:[5,1,1]}})],[.8,prone],[1,prone]]);
  model.clips.sleep={...model.clips.sleep,length:8,fps:4};
  cycle('sleep',a=>{const p=structuredClone(resting);p.chest[2]+=.45*Math.cos(a);return p;});
  const kneel=pose({shift:[0,1,-7],pitch:.35,joints:{handL:[-6,6,12],handR:[6,6,12],footL:[-3,-5,1],footR:[4,4,1],kneeL:[-3,0,2]}});
  clip('get_up',[[0,prone],[.2,pose({shift:[3,0,-9],roll:.65,pitch:.45,joints:{handL:[-5,6,8],handR:[6,6,8]}})],[.5,kneel],[.8,crouch],[1,standing]]);
  clip('revive',[[0,kneel],[.3,pose({shift:[0,1,-7],pitch:.4,joints:{handL:[-3,9,12],handR:[3,9,12],footL:[-3,-5,1],footR:[4,4,1]}})],[.8,kneel],[1,standing]]);
  const guard=pose({shift:[0,0,-1.5],twist:-.12,joints:{handL:[-3,6,23],handR:[4,4,21],footL:[-4,3,1],footR:[4,-3,1]}});
  for(const name of ['block','shield'])clip(name,[[0,guard],[.5,pose({shift:[0,-.4,-2],twist:-.14,joints:{handL:[-3,6,24],handR:[4,4,21],footL:[-4,3,1],footR:[4,-3,1]}})],[1,guard]],{loop:true});
  clip('parry',[[0,guard],[.25,pose({twist:.2,shift:[0,-1,-1],joints:{handL:[-7,9,24],handR:[5,6,25],footL:[-4,3,1],footR:[4,-3,1]}})],[.5,guard],[1,standing]]);
  for(const name of ['punch','punch_left','punch_right','uppercut']){
    const side=name==='punch_left'?'L':'R',sign=side==='L'?-1:1,other=side==='L'?'R':'L',upper=name==='uppercut';
    const prep=pose({shift:[0,-1,upper?-4:-2],twist:sign*-.22,pitch:.08,joints:{['hand'+side]:[sign*6,-3,upper?17:24],['hand'+other]:[-sign*4,5,24],footL:[-4,3,1],footR:[4,-3,1]}});
    const hit=pose({shift:[0,1,upper?0:-1],twist:sign*.22,pitch:upper?-.06:.14,joints:{['hand'+side]:[sign*2,upper?7:12,upper?33:24],['elbow'+side]:[sign*6,5,23],['hand'+other]:[-sign*4,5,24],footL:[-4,4,1],footR:[4,-3,1]}});
    clip(name,[[0,guard],[.2,prep],[.4,hit],[.55,hit],[.8,guard],[1,standing]]);
  }
  const swing=(sign,big=false)=>[
    pose({shift:[0,-1,big?-3:-1],twist:-sign*.35,pitch:.07,joints:{handR:[sign*8,-3,30],handL:[-4,4,22],elbowR:[sign*8,-3,23],footL:[-4,3,1],footR:[4,-3,1]}}),
    pose({shift:[0,2,big?-2:-1],twist:sign*.45,pitch:.18,joints:{handR:[-sign*6,10,23],handL:[-3,3,22],elbowR:[3,7,23],footL:[-4,5,1],footR:[4,-3,1]}}),
    pose({shift:[0,1,-1],twist:sign*.55,pitch:.1,joints:{handR:[-sign*9,5,17],handL:[-3,4,22],footL:[-4,4,1],footR:[4,-3,1]}})
  ];
  for(const name of ['slash','swipe_one','swipe_two','swipe_big']){
    const [prep,hit,follow]=swing(name==='swipe_two'?-1:1,name==='swipe_big');
    clip(name,[[0,guard],[.25,prep],[.42,hit],[.65,follow],[1,guard]]);
  }
  const a=swing(1),b=swing(-1);
  clip('sword_combo',[[0,a[0]],[.2,a[1]],[.35,a[2]],[.5,b[0]],[.65,b[1]],[.8,b[2]],[1,guard]],{frames:12});
  const aim=pose({twist:.12,pitch:.04,joints:{handL:[-2,12,25],elbowL:[-4,6,25],handR:[2,1,29],elbowR:[9,-2,26],footL:[-4,3,1],footR:[4,-3,1]}});
  clip('draw',[[0,guard],[.4,pose({joints:{handL:[-2,9,24],handR:[2,7,25]}})],[.9,aim],[1,aim]]);
  clip('ranged',[[0,aim],[.2,pose({shift:[0,-.5,0],twist:.1,joints:{handL:[-2,12,25],handR:[4,-2,29],elbowR:[9,-3,26]}})],[.5,aim],[1,guard]]);
  clip('cast',[[0,pose({shift:[0,-1,-2],joints:{handL:[-3,4,23],handR:[3,3,22]}})],[.35,pose({twist:-.2,joints:{handL:[-5,7,24],handR:[7,-1,29]}})],[.55,pose({pitch:.18,twist:.2,joints:{handL:[-6,5,22],handR:[3,12,25]}})],[.75,pose({pitch:.1,joints:{handR:[4,10,24]}})],[1,standing]]);
  const reach=pose({pitch:.3,shift:[0,1,-3],joints:{handR:[3,10,19],handL:[-5,3,17],footL:[-4,3,1],footR:[4,-2,1]}});
  clip('interact',[[0,standing],[.35,reach],[.65,reach],[1,standing]]);
  const pickup=pose({shift:[0,1,-8],pitch:.55,joints:{handL:[-3,6,10],handR:[3,7,9],kneeL:[-4,5,7],kneeR:[4,5,7],footL:[-4,2,1],footR:[4,-1,1]}});
  const carry=pose({pitch:-.06,shift:[0,0,-1],joints:{handL:[-4,7,20],handR:[4,7,20],elbowL:[-7,2,19],elbowR:[7,2,19]}});
  clip('pickup',[[0,standing],[.3,pickup],[.45,pickup],[.8,carry],[1,standing]]);
  cycle('carry',a=>pose({pitch:-.06,shift:[Math.sin(a)*.2,0,-1+Math.sin(a)*.3],joints:{handL:[-4,7,20],handR:[4,7,20],elbowL:[-7,2,19],elbowR:[7,2,19]}}));
  const present=pose({pitch:-.08,joints:{handL:[-3,4,34],handR:[3,4,34],elbowL:[-7,2,29],elbowR:[7,2,29]}});
  clip('found_unique',[[0,carry],[.35,present],[.8,present],[1,carry]]);
  clip('salvage',[[0,carry],[.2,pose({pitch:.12,joints:{handL:[-2,7,24],handR:[2,7,24]}})],[.45,pose({twist:.08,pitch:.1,joints:{handL:[-2,6,23],handR:[2,8,25]}})],[.65,pose({twist:-.08,pitch:.1,joints:{handL:[-2,8,25],handR:[2,6,23]}})],[.8,pose({joints:{handL:[-6,7,23],handR:[6,7,23]}})],[1,standing]]);
  for(const name of ['mine','woodcut']){
    const chop=name==='woodcut';
    clip(name,[[0,carry],[.3,pose({twist:chop?-.4:0,pitch:-.1,joints:{handL:[-1,2,34],handR:[2,3,32],elbowL:[-6,0,28],elbowR:[7,0,27]}})],[.5,pose({pitch:.32,twist:chop?.4:0,shift:[0,1,-3],joints:{handL:[-1,10,21],handR:[2,9,19],footL:[-4,3,1],footR:[4,-3,1]}})],[.65,pose({pitch:.4,twist:chop?.5:0,shift:[0,1,-3],joints:{handL:[-1,9,17],handR:[2,8,15]}})],[1,carry]]);
  }
  cycle('swim',a=>{
    const p=pose({pitch:.5,shift:[0,0,-4],joints:{handL:[-6-4*Math.sin(a),7+4*Math.cos(a),23],handR:[6+4*Math.sin(a),7+4*Math.cos(a),23],footL:[-3,-3,4+Math.sin(a+Math.PI)*2],footR:[3,-3,4+Math.sin(a)*2]}});
    return p;
  });
  return model;
}

export function fitHeroGrip(pose,actor,model,action){
  if(model.artGeneration!==3||!['draw','ranged'].includes(action)||actor.equipment?.hand1!=='rifle')return pose;
  const shoulder=pose.shoulderR,axis=sub(pose.shoulderR,pose.shoulderL),length=Math.hypot(axis[0],axis[1])||1;
  const right=[axis[0]/length,axis[1]/length,0],forward=[-right[1],right[0],0];
  const point=(x,y,z)=>shoulder.map((v,i)=>v+right[i]*x+forward[i]*y+(i===2?z:0));
  pose.handR=point(-1,3,-1);pose.handL=point(-3,10,-1);
  pose.elbowR=point(3,-2,-5);pose.elbowL=point(-6,5,-5);
  return applyIK(model,pose);
}
