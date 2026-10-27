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
 if(!a.flightTrail?.length)for(let i=0;i<5;i++){c.globalAlpha=.28*(1-i/5);c.fillStyle='#e9e1bd';c.fillRect(-length-4-i*5,-.5,5,1);}
 c.restore();
 c.fillStyle='#ba9763';c.fillRect(-length,-.7,length-2,1.4);drawArrowFletching(c,-length+1);
 c.fillStyle='#c6d2c8';c.beginPath();c.moveTo(0,0);c.lineTo(-5,-2);c.lineTo(-4,0);c.lineTo(-5,2);c.closePath();c.fill();
 if(a.bansheeFrost){c.fillStyle='#80ddff';c.fillRect(-length,-1,length-3,2);c.fillStyle='#e8ffff';c.fillRect(-8,-1,8,2);for(let i=0;i<5;i++){const x=-5-i*7;c.fillStyle=i%2?'#9ce7ff':'#e0fbff';c.fillRect(x,Math.sin(time*18+i*2)*3,2,2);}}
}
// World-space history includes projectile height: curved shots leave curved
// trails, not an arbitrary straight line glued behind the arrow graphic.
export function recordArrowTrail(a,time){
 if(a.stuck||a.rock||a.ice)return;
 const history=a.flightTrail||=[];history.push({x:a.x,y:a.y-(a.z||0),time});
 while(history.length>18||history.length&&time-history[0].time>.16)history.shift();
}
export function drawArrowTrail(c,a,time){
 const history=a.flightTrail;if(!history?.length||a.rock||a.ice)return;
 c.save();c.strokeStyle=a.bansheeFrost?'#b8eeff':'#eee1bd';c.lineCap='round';
 for(let i=1;i<history.length;i++){
  const from=history[i-1],to=history[i],fade=Math.max(0,1-(time-to.time)/.16);
  if(!fade)continue;c.globalAlpha=.38*fade*fade;c.lineWidth=.6+fade;
  c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();
 }
 c.restore();
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
