import {combatPhase,combatWeaponVector,SWING_ACTIONS} from './combat-animation.mjs';

export const WHIP_SEGMENTS=18;
const smooth=(a,b,t)=>{const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v);};
// A fixed-size rope: delayed orientation sends a wave from the wrist to the tip.
// Reuse the caller's rope buffer; no persistent particles or growing simulation lists.
export function sampleWhip(action,t,side='R',out=new Float32Array((WHIP_SEGMENTS+1)*3)){
 const active=SWING_ACTIONS.includes(action),phase=active?combatPhase(action,t):{t:0,reverse:false},s=(phase.reverse?-1:1)*(side==='L'?-1:1),rest=active?null:combatWeaponVector('slash',0,'sword',side);
 const extension=active?smooth(.26,.48,phase.t)*(1-smooth(.59,.95,phase.t)):0;
 const reach=14+extension*31;
 out[0]=out[1]=out[2]=0;
 for(let n=1;n<=WHIP_SEGMENTS;n++){
  const u=n/WHIP_SEGMENTS,lag=u*.10;
  const v=active?combatWeaponVector(action,Math.max(0,t-lag),'sword',side):rest;
  const scale=reach/Math.hypot(...v),coil=(1-extension),wave=Math.sin(u*Math.PI*2.3-phase.t*7)*Math.sin(u*Math.PI)*coil*8;
  out[n*3]=v[0]*scale*u+s*(Math.sin(u*Math.PI*2)*coil*6+wave);
  out[n*3+1]=v[1]*scale*u+Math.sin(u*Math.PI)*coil*5;
  out[n*3+2]=v[2]*scale*u-Math.sin(u*Math.PI*.72)*coil*17;
 }
 return {points:out,extension,crack:active?smooth(.45,.49,phase.t)*(1-smooth(.54,.59,phase.t)):0};
}

const points=new Float32Array((WHIP_SEGMENTS+1)*3);
const projected=new Float32Array((WHIP_SEGMENTS+1)*2);
export function drawWhip(c,hand,action,t,side,d,project,color='#d35b54'){
 const shape=sampleWhip(action,t,side,points);
 for(let i=0;i<=WHIP_SEGMENTS;i++){
  const q=project([points[i*3],points[i*3+1],points[i*3+2]],d);
  projected[i*2]=hand.x+q.x;projected[i*2+1]=hand.y+q.y;
 }
 c.save();c.lineCap='round';c.lineJoin='round';
 // One outline and two tapered strokes; a readable braided lash, not a beaded line.
 const path=(from,to)=>{
  c.beginPath();
  for(let i=from;i<=to;i++){
   if(i===from)c.moveTo(projected[i*2],projected[i*2+1]);else c.lineTo(projected[i*2],projected[i*2+1]);
  }
  c.stroke();
 };
 c.strokeStyle='#352923';c.lineWidth=3;path(0,WHIP_SEGMENTS);
 c.strokeStyle=color;c.lineWidth=1.9;path(0,11);c.lineWidth=1;path(11,WHIP_SEGMENTS);
 c.strokeStyle='#efa590';c.lineWidth=.65;path(1,9);
 const grip={x:projected[2]-hand.x,y:projected[3]-hand.y};
 c.strokeStyle='#573d2a';c.lineWidth=4;c.beginPath();c.moveTo(hand.x,hand.y);c.lineTo(hand.x+grip.x,hand.y+grip.y);c.stroke();
 c.strokeStyle='#e4bc75';c.lineWidth=1.4;c.beginPath();c.moveTo(hand.x+grip.x*.75,hand.y+grip.y*.75);c.lineTo(hand.x+grip.x,hand.y+grip.y);c.stroke();
 if(shape.crack>.12){
  const x=projected[WHIP_SEGMENTS*2],y=projected[WHIP_SEGMENTS*2+1];
  c.globalAlpha*=shape.crack;c.strokeStyle='#fff2cb';c.lineWidth=1;
  c.beginPath();c.moveTo(x-3,y);c.lineTo(x+3,y);c.moveTo(x,y-3);c.lineTo(x,y+3);c.stroke();
 }
 c.restore();
}
