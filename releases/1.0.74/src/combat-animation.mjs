import {applyIK} from './ik.mjs';

export const SWING_ACTIONS=['slash','swipe_one','swipe_two','swipe_big','sword_combo'];
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const clamp=t=>Math.max(0,Math.min(1,t));
const turn=([x,y,z],yaw,pitch=0,roll=0)=>{
  [y,z]=[y*Math.cos(pitch)+z*Math.sin(pitch),z*Math.cos(pitch)-y*Math.sin(pitch)];
  [x,z]=[x*Math.cos(roll)+z*Math.sin(roll),z*Math.cos(roll)-x*Math.sin(roll)];
  return [x*Math.cos(yaw)-y*Math.sin(yaw),x*Math.sin(yaw)+y*Math.cos(yaw),z];
};
function sample(stages,t){
  t=clamp(t);
  const right=stages.findIndex(s=>s[0]>=t),i=right<0?stages.length-1:right;
  const [a,pa]=stages[Math.max(0,i-1)],[b,pb]=stages[i];
  return mix(pa,pb,b===a?0:(t-a)/(b-a));
}

// Offline authoring only. Runtime continues to sample ordinary editable keys.
export function buildCombatPass(source){
  const m=structuredClone(source),rest=Object.fromEntries(Object.entries(m.joints).map(([n,j])=>[n,j.position]));
  m.combatRevision=4;m.name='Wildbound hero / generation 4 combat';
  function pose({root=[0,0,-1],yaw=0,pitch=0,roll=0,hands={},feet={},elbows={}}={}){
    const p=structuredClone(rest);
    for(const [name,value] of Object.entries(p)){
      if(/^(foot|knee)/.test(name))continue;
      const twist=/^(pelvis|hip)/.test(name)?yaw*.35:/^(head|eye|ear|nose|mouth)/.test(name)?0:yaw;
      p[name]=add(add(turn(sub(value,rest.pelvis),twist,pitch,roll),rest.pelvis),root);
    }
    for(const side of ['L','R']){
      p['foot'+side]=feet[side]||[side==='L'?-4:4,side==='L'?4:-4,1];
      p['knee'+side]=[side==='L'?-4:4,side==='L'?5:-1,7+root[2]*.3];
      p['hand'+side]=add(hands[side]||[side==='L'?-5:5,5,23],root);
      if(elbows[side])p['elbow'+side]=add(elbows[side],root);
    }
    return applyIK(m,p);
  }
  const guard=pose({yaw:-.12,hands:{L:[-5,5,23],R:[5,4,23]}});
  function clip(name,stages){
    const old=m.clips[name];if(!old)return;
    const length=Math.max(old.length,Math.min(16,Math.floor(30*old.length/old.fps))),fps=old.fps*length/old.length;
    const keys=Array.from({length},(_,frame)=>{
      const p=Object.fromEntries(Object.keys(rest).map(n=>[n,sample(stages.map(([t,p])=>[t,p[n]]),frame/(length-1))]));
      applyIK(m,p);
      return {frame,joints:Object.fromEntries(Object.keys(rest).map(n=>[n,sub(p[n],rest[n])]))};
    });
    m.clips[name]={...old,length,fps,loop:false,keys};
  }
  const cut=sign=>({
    load:pose({root:[-sign,-2,-2.5],yaw:-sign*.55,pitch:-.04,roll:-sign*.09,hands:{R:sign>0?[10,-3,29]:[-7,4,28],L:[-5,5,24]},feet:{L:[-4,2,2],R:[4,-4,1]}}),
    break:pose({root:[0,0,-1],yaw:-sign*.3,pitch:.06,hands:{R:sign>0?[9,5,29]:[-4,9,26],L:[-6,5,23]}}),
    hit:pose({root:[0,2,-1],yaw:sign*.1,pitch:.14,roll:sign*.06,hands:{R:sign>0?[2,11,25]:[4,11,23],L:[-6,4,24]},elbows:{R:[sign*7,5,24]}}),
    follow:pose({root:[sign,2,-2],yaw:sign*.65,pitch:.15,roll:sign*.09,hands:{R:sign>0?[-8,5,19]:[11,2,20],L:[-6,3,24]},feet:{R:[4,-4,2]}}),
    recover:pose({root:[sign*.4,0,-1.5],yaw:sign*.2,pitch:.05,hands:{R:sign>0?[-1,5,22]:[8,3,23],L:[-5,5,24]}})
  });
  const a=cut(1),b=cut(-1);
  for(const name of ['slash','swipe_one','swipe_two']){
    const s=name==='swipe_two'?b:a;
    clip(name,[[0,guard],[.18,s.load],[.28,s.load],[.36,s.break],[.43,s.hit],[.49,s.hit],[.67,s.follow],[.85,s.recover],[1,guard]]);
  }
  const heavyLoad=pose({root:[0,-2,-4],yaw:-.2,pitch:-.08,hands:{R:[4,-1,35],L:[-5,6,24]},feet:{L:[-5,3,1],R:[5,-4,1]}});
  const heavyHit=pose({root:[0,3,-4],yaw:.15,pitch:.35,hands:{R:[3,11,20],L:[-7,5,22]},feet:{L:[-5,5,1],R:[5,-4,2]}});
  const heavyFollow=pose({root:[1,3,-5],yaw:.25,pitch:.42,hands:{R:[4,9,14],L:[-7,4,22]},feet:{L:[-5,5,1],R:[5,-4,2]}});
  clip('swipe_big',[[0,guard],[.22,heavyLoad],[.36,heavyLoad],[.46,heavyHit],[.53,heavyHit],[.65,heavyFollow],[.86,a.recover],[1,guard]]);
  // One continuous combination: the first follow-through coils into the return cut.
  clip('sword_combo',[[0,guard],[.10,a.load],[.18,a.load],[.25,a.hit],[.29,a.hit],[.38,a.follow],[.48,b.load],[.55,b.load],[.63,b.hit],[.67,b.hit],[.79,b.follow],[.9,b.recover],[1,guard]]);
  for(const name of ['punch','punch_left','punch_right','uppercut']){
    const left=name==='punch_left',s=left?-1:1,key=left?'L':'R',other=left?'R':'L',upper=name==='uppercut';
    const load=pose({root:[-s*.7,-1.5,upper?-5:-2],yaw:-s*(left?.22:.4),pitch:upper?.2:.04,roll:-s*.06,hands:{[key]:[s*7,upper?2:0,upper?15:24],[other]:[-s*5,6,25]}});
    const hit=pose({root:[s*.6,upper?1:2.5,upper?0:-1],yaw:s*(left?.12:.3),pitch:upper?-.08:.15,roll:s*.08,hands:{[key]:[s*3,upper?8:12,upper?33:25],[other]:[-s*5,5,25]},elbows:{[key]:[s*7,5,upper?24:23]}});
    const follow=pose({root:[s,2,upper?-.5:-2],yaw:s*.38,pitch:upper?-.04:.2,hands:{[key]:[s*2,upper?7:10,upper?34:24],[other]:[-s*5,5,25]},feet:{R:[4,-4,2]}});
    clip(name,[[0,guard],[.2,load],[.3,load],[.41,hit],[.48,hit],[.6,follow],[.82,guard],[1,guard]]);
  }
  const aim=pose({root:[0,0,-1],yaw:.15,hands:{L:[-3,11,25],R:[3,0,28]},elbows:{L:[-6,5,24],R:[10,-3,26]}});
  clip('draw',[[0,guard],[.2,pose({hands:{L:[-3,7,24],R:[3,5,24]}})],[.55,pose({yaw:.08,hands:{L:[-3,10,25],R:[3,2,27]},elbows:{R:[9,-2,25]}})],[.85,aim],[1,aim]]);
  const release=pose({root:[0,-.7,-1],yaw:.12,pitch:-.035,hands:{L:[-3,11,25],R:[7,-3,29]},elbows:{L:[-6,5,24],R:[10,-3,26]}});
  clip('ranged',[[0,aim],[.12,release],[.24,release],[.5,aim],[.8,pose({hands:{L:[-3,8,24],R:[5,3,25]}})],[1,guard]]);
  const gather=pose({root:[-1,-1,-3],yaw:-.3,pitch:.05,hands:{R:[7,0,29],L:[-3,6,24]}});
  const cast=pose({root:[1,2,-1],yaw:.28,pitch:.18,hands:{R:[3,12,27],L:[-9,3,22]},elbows:{R:[7,6,26]}});
  clip('cast',[[0,guard],[.2,gather],[.34,gather],[.46,cast],[.56,cast],[.7,pose({root:[1,2,-2],yaw:.4,pitch:.16,hands:{R:[2,10,25],L:[-9,2,22]}})],[.88,guard],[1,guard]]);
  const brace=pose({root:[0,-1,-3],yaw:-.18,pitch:.13,hands:{L:[-4,7,25],R:[5,4,24]}});
  for(const name of ['block','shield']){
    const old=m.clips[name];clip(name,[[0,brace],[.5,pose({root:[0,-1,-3.5],yaw:-.18,pitch:.1,hands:{L:[-4,7,25],R:[5,4,24]}})],[1,brace]]);m.clips[name].loop=old.loop;
  }
  clip('parry',[[0,brace],[.18,pose({root:[0,-2,-3],yaw:-.35,hands:{L:[-2,6,26],R:[5,4,24]}})],[.35,pose({root:[-1,1,-2],yaw:.25,hands:{L:[-9,9,25],R:[5,5,25]}})],[.48,pose({root:[-1,1,-2],yaw:.3,hands:{L:[-10,6,24],R:[5,5,25]}})],[.72,brace],[1,guard]]);
  return m;
}

export function combatPhase(action,t){
  if(action!=='sword_combo')return {t:clamp(t),reverse:action==='swipe_two'};
  return t<.43?{t:clamp(t/.43),reverse:false}:{t:clamp((t-.43)/.57),reverse:true};
}

export function castWandVector(t,side='R'){
  const v=sample([[0,[2,2,9]],[.25,[4,-3,10]],[.34,[4,-3,10]],[.46,[0,11,3]],[.56,[0,11,3]],[.72,[-2,9,4]],[1,[2,2,9]]],t);
  if(side==='L')v[0]*=-1;
  return v;
}

// Blade orientation lives in model space, so every camera direction sees the same arc.
export function combatWeaponVector(action,t,kind='sword',side='R'){
  const phase=combatPhase(action,t),s=(phase.reverse?-1:1)*(side==='L'?-1:1);
  let angles;
  if(kind==='dagger')angles=sample([[0,[.2*s,.9]],[.25,[.9*s,.6]],[.43,[0,.05]],[.52,[0,.05]],[.7,[-.4*s,.25]],[1,[.2*s,.9]]],phase.t);
  else if(action==='swipe_big')angles=sample([[0,[.15,.9]],[.3,[.1,2.1]],[.36,[.1,2.1]],[.47,[0,-.15]],[.65,[.2,-.9]],[1,[.15,.9]]],t);
  else angles=sample([[0,[.2*s,.95]],[.22,[1.7*s,.65]],[.3,[1.7*s,.65]],[.43,[.05,.15]],[.49,[.05,.15]],[.68,[-1.6*s,-.3]],[.85,[-.5*s,.6]],[1,[.2*s,.95]]],phase.t);
  const [yaw,pitch]=angles,length=kind==='dagger'?9:16;
  return [Math.sin(yaw)*Math.cos(pitch)*length,Math.cos(yaw)*Math.cos(pitch)*length,Math.sin(pitch)*length];
}

export function fitCombatLoadout(p,model,action,t,kinds){
  if(model.combatRevision!==4)return p;
  const swing=SWING_ACTIONS.includes(action),dual=['sword','dagger','wand'].includes(kinds[0])&&['sword','dagger','wand'].includes(kinds[1]);
  if(swing&&kinds[0]==='dagger'){
    const f=combatPhase(action,t),s=f.reverse?-1:1;
    p.handR=add(p.chest,sample([[0,[5,5,-1]],[.25,[s*7,-2,0]],[.43,[2,12,-1]],[.52,[2,12,-1]],[.72,[-s*3,6,-3]],[1,[5,5,-1]]],f.t));
    p.elbowR=add(p.chest,[7,4,-4]);
  }
  if(dual&&(swing||action==='cast')){
    const f=combatPhase(action,t),active=f.reverse||action==='cast'&&t>.5;
    if(active){
      const old=[...p.handR];p.handR=add(p.chest,[6,3,-1]);
      p.handL=[p.chest[0]-(old[0]-p.chest[0]),old[1],old[2]];p.elbowL=add(p.chest,[-7,4,-4]);
    }else p.handL=add(p.chest,[-7,3,-1]);
  }
  return applyIK(model,p);
}
