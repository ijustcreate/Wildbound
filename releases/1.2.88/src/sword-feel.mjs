import {applyIK} from './ik.mjs';
import {itemKind,ITEMS} from './items.mjs';
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
export function paintSwordRibbon(c,points,heavy=false){
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
