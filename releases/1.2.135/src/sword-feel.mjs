import {applyIK} from './ik.mjs';
import {itemKind,ITEMS} from './items.mjs';
import {drawSwordChargeLane,drawSwordBladeCharge,drawSwordChargeRibbon} from './sword-charge-art.mjs';
import {swordChargeReach,swordChargeWidth,swordFloorLift,swordDashWake,finishSwordRelease} from './sword-charge-state.mjs';
export {swordChargeReach,swordChargeWidth} from './sword-charge-state.mjs';
import {meleeBodyRadius} from './melee-geometry.mjs';
import {anacondaMeleeSections} from './anaconda-body.mjs';
const clamp=t=>Math.max(0,Math.min(1,t));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const swordLoadout=p=>['hand1','hand2'].some(k=>p.equipment?.[k]!=='stick'&&itemKind(p.equipment?.[k])==='sword'&&!ITEMS[p.equipment[k]]?.ranged&&!ITEMS[p.equipment[k]]?.utility&&ITEMS[p.equipment[k]]?.style!=='whip')&&!['hand1','hand2'].some(k=>ITEMS[p.equipment?.[k]]?.magic);
export function swordTiming(clip){return clip==='swipe_big'?{contact:.38,stepStart:.23,stepEnd:.48,distance:10}:{contact:.30,stepStart:.16,stepEnd:.40,distance:7};}
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
export function swordStep(clip,from,to){const t=swordTiming(clip);return t.distance*(ease((to-t.stepStart)/(t.stepEnd-t.stepStart))-ease((from-t.stepStart)/(t.stepEnd-t.stepStart)));}
// Editable native keys. Never replace an authored combat clip or rest geometry.
export function refineNativeSword(model,shipping){
 if(model.nativeSwordRevision===1||model.nativeHumanoidRevision!==1||!same(model.joints,shipping.joints))return model;
 const next=structuredClone(model),saved={};
 for(const name of ['slash','swipe_one','swipe_two','swipe_big']){
  if(!same(model.clips[name],shipping.clips[name]))continue;
  saved[name]=structuredClone(model.clips[name]);const heavy=name==='swipe_big',sign=name==='swipe_two'?-1:1;
  const poses=[
   [0,-.10,0,4,3,20],
   [heavy?.23:.19,-.55,-.7,sign*7,-2,heavy?29:25],
   [heavy?.30:.23,-.55,-.7,sign*7,-2,heavy?29:25],
   [heavy?.38:.30,.12,1,1,10,heavy?18:23],
   [heavy?.53:.47,.62,1.3,-sign*7,5,heavy?14:18],
   [.78,.25,.4,0,4,20],
   [1,-.10,0,4,3,20]
  ];
  const keys=Array.from({length:12},(_,frame)=>{
   const t=frame/11,ri=poses.findIndex(p=>p[0]>=t),b=poses[Math.max(0,ri)],a=poses[Math.max(0,ri-1)],u=a===b?0:(t-a[0])/(b[0]-a[0]),v=a.map((n,i)=>n+(b[i]-n)*u);
   const p=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,[...j.position]])),pivot=[...p.pelvis],yaw=v[1]*sign;
   for(const [n,q]of Object.entries(p))if(!/^(foot|knee)/.test(n)){
    const factor=/^(pelvis|hip)/.test(n)?.32:/^(head|eye|ear|nose|mouth)/.test(n)?.4:1,angle=yaw*factor,x=q[0]-pivot[0],y=q[1]-pivot[1];
    q[0]=pivot[0]+x*Math.cos(angle)-y*Math.sin(angle);q[1]=pivot[1]+x*Math.sin(angle)+y*Math.cos(angle)+v[2];q[2]-=heavy?2.2:1.5;
   }
   p.handR=[v[3],v[4],v[5]];p.elbowR=[sign*6,2,22];p.handL=[-5,4,22];p.elbowL=[-7,1,22];
   for(const side of ['L','R'])p['knee'+side]=[p['hip'+side][0],2,8];
   applyIK(model,p);
   const angles={};
   for(let d=0;d<8;d++){
    const a=d*Math.PI/4,project=q=>[q[0]*Math.cos(a)-q[1]*Math.sin(a),(q[0]*Math.sin(a)+q[1]*Math.cos(a))*.5-q[2]];angles[d]={};
    for(const side of ['L','R']){const n='foot'+side;if(Object.hasOwn(model.jointAngles?.[d]||{},n))continue;const f=project(p[n]),k=project(p['knee'+side]);angles[d][n]=-Math.atan2(k[0]-f[0],f[1]-k[1])*180/Math.PI;}
   }
   return {frame,angles,joints:Object.fromEntries(Object.entries(p).map(([n,q])=>[n,q.map((v,i)=>v-model.joints[n].position[i])]))};
  });
  next.clips[name]={...next.clips[name],length:12,fps:heavy?26:30,loop:false,keys};
 }
 if(!Object.keys(saved).length)return model;
 next.nativeSwordRevision=1;next.nativeSwordSource=saved;return next;
}

// Pixel crescent follows the same model-space blade vector as the fitted sword.
// Caller supplies projected tip/hand history, keeping all eight views coherent.
export function paintSwordRibbon(c,points,heavy=false,power){
 if(power!=null){drawSwordChargeRibbon(c,points,power);return;}
 if(points.length<2)return;
 const edge=points.map(p=>p.tip),inner=points.map(p=>({x:p.hand.x+(p.tip.x-p.hand.x)*.64,y:p.hand.y+(p.tip.y-p.hand.y)*.64}));
 c.fillStyle=heavy?'#ffd86b':'#ffe792';c.beginPath();edge.forEach((p,i)=>i?c.lineTo(Math.round(p.x),Math.round(p.y)):c.moveTo(Math.round(p.x),Math.round(p.y)));inner.reverse().forEach(p=>c.lineTo(Math.round(p.x),Math.round(p.y)));c.closePath();c.fill();
 c.strokeStyle='#fff9d6';c.lineWidth=1.5;c.beginPath();edge.forEach((p,i)=>i?c.lineTo(Math.round(p.x),Math.round(p.y)):c.moveTo(Math.round(p.x),Math.round(p.y)));c.stroke();
}

export function paintSwordImpact(c,fx){
 const t=clamp(1-fx.life/.16),r=3+t*7;c.save();c.translate(Math.round(fx.x),Math.round(fx.y));c.globalAlpha=1-t;c.strokeStyle='#fff9dd';c.lineWidth=2;
 for(let i=0;i<4;i++){const a=fx.angle+i*Math.PI/2;c.beginPath();c.moveTo(Math.round(Math.cos(a)*r*.25),Math.round(Math.sin(a)*r*.25));c.lineTo(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r));c.stroke();}c.fillStyle='#ffe27d';c.fillRect(-1,-1,3,3);c.restore();
}

export const swordBladeTime=(t,action)=>action==='swipe_big'?(t<.30?t/.30*.36:t<.53?.36+(t-.30)/.23*.29:.65+(t-.53)/.47*.35):t<.23?t/.23*.30:t<.47?.30+(t-.23)/.24*.38:.68+(t-.47)/.53*.32;

// The telegraph and release share one world-space lane. Charge caps at 1.2s.
export const swordCharging=p=>!!(p.swordChargeAim&&p.charge>0&&swordLoadout(p)&&p.hp>0&&!p.ui&&!p.room&&!p.swimming&&!p.stun&&!p.frozen&&!p.sleeping);
export function paintSwordCharge(c,p,time,lift=swordFloorLift(p)){
 if(!swordCharging(p))return;
 drawSwordChargeLane(c,{...p,y:p.y-lift},time);
}
// Body-to-swept-rectangle contact. Checking only the enemy's center misses visible flanks;
// the ordinary melee cone also excludes bodies already alongside the moving player.
export function swordDashContact(actor,target){
 const dash=actor.swordDash;if(!dash)return null;
 const project=q=>(q.x-dash.originX)*dash.x+(q.y-dash.originY)*dash.y;
 const end=project(dash.sweepTo||actor),start=project(dash.sweepFrom||actor),lo=Math.max(0,Math.min(start,end)),hi=Math.min(dash.length,Math.max(start,end));
 if(hi<lo)return null;
 const sections=target.kind==='anaconda'&&!Number.isFinite(target.hitRadius)?anacondaMeleeSections(target).map(p=>({...p,hitRadius:p.radius})):[target];
 for(const body of sections){
  const dx=body.x-dash.originX,dy=body.y-dash.originY,along=dx*dash.x+dy*dash.y,across=-dx*dash.y+dy*dash.x;
  const x=Math.max(lo,Math.min(hi,along)),y=Math.max(-swordChargeWidth/2,Math.min(swordChargeWidth/2,across));
  if(Math.hypot(along-x,across-y)<=meleeBodyRadius(body)+1e-7)return {x:dash.originX+dash.x*x-dash.y*y,y:dash.originY+dash.y*x+dash.x*y};
 }
 return null;
}
export function paintSwordChargeSpark(c,hand,tip,charge,time){
 drawSwordBladeCharge(c,hand,tip,charge,time);
}
export function tickSwordDash(g,p){
 const dash=p.swordDash;if(!dash)return;
 if(!p.swordStrike||p.hp<=0||p.ui||p.room||p.consumeInput||p.stun||p.frozen||p.sleeping||p.swimming||p.dashTime||!swordLoadout(p)||dash.hand1!==p.equipment.hand1||dash.hand2!==p.equipment.hand2){delete p.swordDash;delete p.swordStrike;delete p.swordFacing;return;}
 const progress=1-p.attack/(p.attackDuration||.46),wanted=dash.length*ease((progress-.12)/.46),distance=Math.max(0,wanted-dash.travelled);
 p.faceX=dash.x;p.faceY=dash.y;p.spin=0;p.blocking=false;
 if(p.swordPolish&&progress>=.12)p.swordPolish.phase='dash';
 for(let moved=0;moved<distance-1e-6;moved+=4){
  const step=Math.min(4,distance-moved),x=p.x,y=p.y;
  g.moveActor(p,dash.x*step,dash.y*step);
  const actual=Math.hypot(p.x-x,p.y-y);dash.travelled+=step;
  dash.sweepFrom={x,y};dash.sweepTo={x:p.x,y:p.y};
  if(actual>1e-6){g.resolveMelee(p,p.swordStrike.charge,p.swordStrike.combo);swordDashWake(g,p,dash,{x,y});}
  if(actual<step*.5){dash.travelled=dash.length;dash.blocked=true;break;}
 }
 if(progress>=.62||!p.attack){finishSwordRelease(g,p,!!dash.blocked);delete p.swordStrike;delete p.swordDash;}
}
