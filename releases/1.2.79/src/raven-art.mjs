import {projectPoint, facingIndex} from './player-motion.mjs';
import {pixelLine, pixelPolygon, pixelVolume} from './pixel-shapes.mjs';

const ink='#080b10', black='#111720', shade='#0b0f17', sheen='#293947', glint='#455b67';
const palette={body:black,shade,light:sheen,outline:ink};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

/** Discrete animation samples keep all geometry crisp. The state is read-only;
 * no canvas, Image, browser globals or art data enter expedition snapshots.
 */
export function ravenPose(e,time=0) {
  const dead=e.hp<=0,friendly=e.faction==='ally' || e.hunterPet;
  const phase=dead?'death':friendly?(e.attack>0?'attack':e.moving?'fly':'perch'):e.raven?.phase || e.animationAction || (e.moving?'fly':'perch');
  const t=Math.max(0,e.raven?.phaseTime || 0),flight=['fly','flap','attack','recover','takeoff','landing'].includes(phase);
  const sample=Math.floor((time+(e.id || 0)*.071)*(flight?12:6));
  const beat=Math.sin(sample*Math.PI/3),idle=Math.sin(sample*.28);
  let spread=0,lift=0,pitch=0;
  if (phase==='wing_open') {spread=clamp(t/.22,0,1)*.85;lift=5*spread;}
  else if (phase==='takeoff') {spread=.85;lift=beat*12+7;pitch=clamp(t/.4,0,1)*4;}
  else if (phase==='fly' || phase==='flap' || phase==='recover') {spread=.85+beat*.1;lift=beat*14;pitch=2;}
  else if (phase==='attack') {spread=.7;lift=-10;pitch=-4;}
  else if (phase==='landing') {spread=.9-clamp(t/.45,0,1)*.6;lift=8;pitch=4;}
  return {phase,dead,flight,spread,lift,pitch,headTilt:dead?-4:flight?0:idle*1.4,
    feet:phase==='landing'?6:flight?-3:0,tail:flight?beat*2:idle*.5,
    beakOpen:phase==='attack'?3:phase==='perch' && sample%53===0?1:0};
}
function wing(c,p,side,pose,near) {
  const spread=pose.spread;
  if (spread<.05) {
    // Folded coverts overlap the long, pointed primaries along the flanks.
    const root=[side*4,3,14],elbow=[side*6,-3,12],tip=[side*4,-13,8];
    pixelPolygon(c,[p(root),p([side*7,-1,13]),p(tip),p([side*3,-6,8])],ink);
    pixelPolygon(c,[p(root),p(elbow),p(tip)],near?black:shade);
    for (let i=0;i<5;i++) {
      const start=[side*(4+i*.35),2-i*1.5,14-i*.55],end=[side*(4.5+i*.2),-9-i,9-i*.15];
      pixelLine(c,p(start),p(end),i<2?sheen:'#1b2531');
    }
    pixelLine(c,p([side*4,2,15]),p([side*6,-2,13]),glint);
    return;
  }
  // Shoulder -> elbow -> wrist articulates independently of the feather fan.
  const root=[side*4,3,13],elbow=[side*(8+spread*7),3,13+pose.lift*.45],wrist=[side*(12+spread*13),-1,12+pose.lift];
  const trailing=[side*(8+spread*7),-10,11+pose.lift*.4];
  pixelPolygon(c,[p(root),p(elbow),p(wrist),p(trailing),p([side*4,-6,10])],ink);
  pixelPolygon(c,[p(mix(root,elbow,.15)),p(elbow),p(wrist),p(trailing)],near?black:shade);
  // Seven distinct, tapering flight feathers: solid black quills with narrow
  // blue-grey iridescence. Gaps remain between the extended primary tips.
  for (let i=6;i>=0;i--) {
    const base=mix(elbow,wrist,i/7),tip=[side*(15+spread*(17+i*.9)),-5-i*2.3,11+pose.lift*(.75+i*.035)];
    const inner=[base[0],base[1]-2,base[2]-1],edge=[tip[0]-side*2,tip[1]-2,tip[2]-1];
    pixelPolygon(c,[p(base),p(tip),p(edge),p(inner)],ink);
    pixelPolygon(c,[p(base),p([tip[0]-side,tip[1],tip[2]]),p(inner)],i%2?black:'#17202b');
    pixelLine(c,p(base),p(mix(base,tip,.82)),i%3===0?glint:sheen);
  }
  for (let i=0;i<4;i++) {
    const base=mix(root,elbow,(i+1)/5),tip=[base[0]+side*4,-8-i*1.3,base[2]-2];
    pixelPolygon(c,[p(base),p(tip),p([tip[0]-side*2,tip[1]-2,tip[2]])],black);
    pixelLine(c,p(base),p(tip),sheen);
  }
  pixelLine(c,p(root),p(elbow),near?glint:sheen,2);
  pixelLine(c,p(elbow),p(wrist),sheen,2);
}

/** Draws at a local foot anchor, useful to the main actor/studio renderer. */
export function drawRavenPose(c,e,time=0) {
  const pose=ravenPose(e,time),d=facingIndex(e.faceX,e.faceY),p=v=>projectPoint(v,d);
  if (pose.dead) {
    pixelPolygon(c,[p([-6,-10,2]),p([7,-8,3]),p([6,8,4]),p([-4,12,2])],ink);
    pixelVolume(c,[0,0,3],6,9,3,d,palette);
    pixelLine(c,p([-4,-2,5]),p([5,-9,3]),sheen);
    pixelVolume(c,[2,10,3],3.5,4,3,d,palette);
    pixelPolygon(c,[p([2,13,3]),p([2,20,1]),p([4,14,2])],black);
    return;
  }
  // Long wedge tail, layered feather shafts, and raven's shaggy throat profile.
  for (let i=-2;i<=2;i++) {
    const x=i*1.6,length=e.kind==='crow'?17:20;
    pixelPolygon(c,[p([x,-5,10]),p([x+i*.5,-length+Math.abs(i)+pose.tail,6]),p([x+1.5,-8,9])],i%2?ink:black);
    pixelLine(c,p([x,-8,10]),p([x,-length+3+pose.tail,7]),sheen);
  }
  const nearSide=d<=3?-1:1;
  wing(c,p,-nearSide,pose,false);
  for (const side of [-1,1]) {
    const hip=[side*2.5,0,8],knee=[side*3,2,4+pose.feet],foot=[side*3.5,3,pose.flight?4+pose.feet:0];
    pixelLine(c,p(hip),p(knee),'#1f252e',2);
    pixelLine(c,p(knee),p(foot),'#37424a');
    for (let toe=-1;toe<=1;toe++) pixelLine(c,p(foot),p([foot[0]+toe*2,foot[1]+3,foot[2]]),'#3e4850');
    pixelLine(c,p(foot),p([foot[0]-side,foot[1]-2,foot[2]]),'#29323a');
  }
  pixelVolume(c,[0,0,12+pose.pitch*.2],5,8,6,d,palette);
  wing(c,p,nearSide,pose,true);
  const neckY=pose.flight?7:5,headZ=(pose.flight?15:21)+pose.headTilt,headY=neckY+4;
  pixelVolume(c,[0,neckY,headZ-4],3.5,4,5,d,palette);
  for (let i=-2;i<=2;i++) pixelPolygon(c,[p([i*1.1,neckY+1,headZ-3]),p([i*1.4,neckY+4,headZ-8-Math.abs(i)]),p([i*1.1+1,neckY+2,headZ-4])],black);
  pixelVolume(c,[0,headY,headZ],3.8,4.5,3.8,d,palette);
  // Heavy straight black beak, slightly hooked at the tip (shorter for crows).
  const tipY=headY+(e.kind==='crow'?9:11),beakZ=headZ-1;
  pixelPolygon(c,[p([-2,headY+3,beakZ+1]),p([0,tipY,beakZ-1]),p([2,headY+3,beakZ-1])],ink);
  pixelLine(c,p([-1,headY+4,beakZ+1]),p([0,tipY-2,beakZ]),'#3b4852');
  if (pose.beakOpen) pixelLine(c,p([0,headY+4,beakZ-pose.beakOpen]),p([0,tipY-1,beakZ-pose.beakOpen]),black,2);
  for (const side of [-1,1]) {
    if (side!==nearSide && [1,2,3,5,6,7].includes(d)) continue;
    const eye=p([side*3,headY+2,headZ+1]);
    rect(c,eye.x,eye.y,2,2,ink);rect(c,eye.x,eye.y,1,1,'#859095');
  }
  const crown=p([-1,headY,headZ+3]);rect(c,crown.x,crown.y,2,1,glint);
  if (e.raven?.carrying) {
    const q=p([0,tipY-3,beakZ-3]);
    pixelLine(c,p([0,tipY-3,beakZ]),q,'#73664f');
    pixelPolygon(c,[{x:q.x,y:q.y},{x:q.x+3,y:q.y+2},{x:q.x,y:q.y+5},{x:q.x-3,y:q.y+2}],'#5274a6');
    rect(c,q.x-1,q.y+1,2,1,'#bbd8e2');
  }
}

/** World-coordinate renderer. Owns height/shadow, so the caller must not subtract
 * raven.height again. All marks are native integer canvas pixels, with no images.
 */
export function drawRaven(ctx,e,time=0,size=42) {
  if (!e || !['raven','crow'].includes(e.kind)) return false;
  const friendly=e.faction==='ally' || e.hunterPet;
  const height=e.hp<=0?0:friendly?(e.moving?24:0):e.raven?.height || 0;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(e.x),Math.round(e.y));
  ctx.save();ctx.globalAlpha*=.22;
  rect(ctx,-7,-1,14,2,'#05080c');rect(ctx,-5,-2,10,4,'#05080c');
  ctx.restore();
  ctx.translate(0,-Math.round(height));ctx.scale(size/48,size/48);
  drawRavenPose(ctx,e,time);
  ctx.restore();return true;
}
