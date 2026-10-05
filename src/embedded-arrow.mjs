export function arrowVisualAngle(a){
 return a.stuck||a.embedded?a.angle??0:Math.atan2((a.vy||0)-(a.vz||0),a.vx||0);
}
export function arrowImpactWobble(a,time=0){
 const age=time-(a.impactTime??-100);
 return age>=0&&age<.65?Math.sin(age*52)*.16*Math.exp(-age*7):0;
}
export function embeddedArrowGeometry(a,time=0){
 const length=Math.max(6,(a.shaftLength||24)-Math.max(3,Math.min(15,a.embedDepth||7)));
 const angle=(a.angle??0)+arrowImpactWobble(a,time),y=a.y-(a.z||0);
 return {x:a.x,y,tailX:a.x-Math.cos(angle)*length,tailY:y-Math.sin(angle)*length,length,angle};
}
export function drawArrowFletching(c,tail){
 // Two swept fins, tied to the shaft, not a solid white block.
 c.fillStyle='#e3dfc2';c.beginPath();c.moveTo(tail,0);c.lineTo(tail-1,-3);c.lineTo(tail+3,-2);c.lineTo(tail+6,0);c.closePath();c.fill();
 c.fillStyle='#8dafa1';c.beginPath();c.moveTo(tail,0);c.lineTo(tail-1,3);c.lineTo(tail+3,2);c.lineTo(tail+6,0);c.closePath();c.fill();
 c.fillStyle='#746447';c.fillRect(tail+4,-1,2,2);
}
export function drawFlyingArrow(c,a={},time=0){
 const length=a.shaftLength||24;
 // A short tapered wake stays faint and follows the actual flight orientation.
 c.save();
 for(let i=0;i<5;i++){c.globalAlpha=.13*(1-i/5);c.fillStyle=a.ammoType==='ice_arrow'?'#bcecf3':'#e9e1bd';c.fillRect(-length-4-i*5,-.5,5,1);}
 c.restore();
 c.fillStyle='#ba9763';c.fillRect(-length,-.7,length-2,1.4);drawArrowFletching(c,-length+1);
 c.fillStyle=a.ammoType==='ice_arrow'?'#6cd8ff':'#c6d2c8';c.beginPath();c.moveTo(0,0);c.lineTo(-5,-2);c.lineTo(-4,0);c.lineTo(-5,2);c.closePath();c.fill();
 if(a.ammoType==='ice_arrow'){
  const glow=c.createRadialGradient(-2,0,0,-2,0,5);glow.addColorStop(0,'#bcf7ff88');glow.addColorStop(1,'#69d9ff00');
  c.fillStyle=glow;c.beginPath();c.arc(-2,0,5,0,Math.PI*2);c.fill();c.fillStyle='#ceffff';
  for(let i=0;i<3;i++){const phase=time*9+i*2.1;c.fillRect(-3-Math.abs(Math.sin(phase))*6,Math.cos(phase)*4,1,1);}
 }
}
export function drawEmbeddedArrow(c,a,time=0,showQuantity=false){
 c.save();
 if(!a.surfaceEmbedded&&!a.enemy){c.fillStyle='#07100d66';c.beginPath();c.ellipse(a.x,a.y+1,2,1,0,0,Math.PI*2);c.fill();}
 const bundle=Math.min(3,a.qty||1);
 // A small fan communicates a bundle without hiding the impact point.
 for(let i=bundle-1;i>=0;i--)drawLodgedArrow(c,{...a,angle:(a.angle??0)+(i-(bundle-1)/2)*.13,shaftLength:(a.shaftLength||24)+i*2},time);
 if(showQuantity&&(a.qty||1)>1){
  const p=embeddedArrowGeometry(a,time),label=`×${a.qty}`,x=Math.round((p.x+p.tailX)/2),y=Math.round(Math.max(p.y,p.tailY)+7);
  c.font='bold 9px system-ui';c.textAlign='center';c.textBaseline='middle';
  const width=Math.ceil(c.measureText(label).width)+8;
  c.fillStyle='#0c211dee';c.fillRect(x-width/2,y,width,13);
  c.strokeStyle='#80957b';c.lineWidth=1;c.strokeRect(x-width/2+.5,y+.5,width-1,12);
  c.fillStyle='#fff0ca';c.fillText(label,x,y+6.5);
 }
 c.restore();
}
// Visual-only grouping: preserve individual projectile records and recoverable ammo.
export function groupLodgedArrows(arrows){
 const groups=new Map(),result=[];
 for(const a of arrows){
  if(!a.stuck||a.enemy==null||a.rock||a.ice){result.push(a);continue;}
  const key=`${a.enemy}:${a.ammoType||'arrow'}`;
  const group=groups.get(key);
  if(group){group.qty+=(a.qty||1);if((a.impactTime??0)>(group.impactTime??0))Object.assign(group,{impactTime:a.impactTime});}
  else {const copy={...a,qty:a.qty||1};groups.set(key,copy);result.push(copy);}
 }
 return result;
}
export function drawLodgedArrow(c,a,time=0){
 const p=embeddedArrowGeometry(a,time);
 c.save();c.translate(p.x,p.y);c.rotate(p.angle);
 c.fillStyle='#ba9763';c.fillRect(-p.length,-.7,p.length,1.4);drawArrowFletching(c,-p.length+1);
 // The point is hidden beneath the struck surface.
 c.fillStyle='#514735';c.fillRect(-.5,-1.2,1,2.4);c.restore();
}
