import {poseAt,projectPoint,facingIndex,ellipse} from './player-motion.mjs';
import {paintLayers} from './render-order.mjs';

const TAU=Math.PI*2;
const sides=['L','R'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const key=(model,frame,changes={})=>({frame,joints:Object.fromEntries(Object.keys(model.joints).map(n=>[n,changes[n]||[0,0,0]]))});
function clip(model,fps,length,loop,poses){return {fps,length,loop,keys:poses.map(([f,p])=>key(model,f,p))};}
function bodyPose(z=0,y=0,x=0){return {pelvis:[x,y,z],chest:[x,y,z],head:[x,y,z],antennaL:[x,y,z],antennaR:[x,y,z],jawL:[x,y,z],jawR:[x,y,z]};}

export function defaultBeetleMotion(){
 const model={version:1,artGeneration:2,type:'beetle',name:'Jade scarab / articulated six-leg rig',
  palette:{body:'#285e73',shade:'#142c3e',light:'#63b8ad',face:'#30485a',eye:'#e6b36c',outline:'#101d2a',highlight:'#a1d9c5',rim:'#9a895b',joint:'#476d7a'},
  shape:{bodyWidth:10,headRadius:4.5,legWidth:2,shellLength:12,shellHeight:6},
  joints:{pelvis:{parent:'',position:[0,-5,8]},chest:{parent:'pelvis',position:[0,6,8]},head:{parent:'chest',position:[0,14,7]}},visibility:{},clips:{}};
 for(const side of sides){const sign=side==='L'?-1:1;
  for(let i=0;i<3;i++){
   const root='leg'+i+side,knee='knee'+i+side,foot='foot'+i+side;
   model.joints[root]={parent:'pelvis',position:[sign*7,[7,0,-7][i],7]};
   model.joints[knee]={parent:root,position:[sign*[12,14,12][i],[11,0,-11][i],4]};
   model.joints[foot]={parent:knee,position:[sign*[17,19,17][i],[15,0,-15][i],1]};
  }
  model.joints['antenna'+side]={parent:'head',position:[sign*9,23,11]};
  model.joints['jaw'+side]={parent:'head',position:[sign*4,20,5]};
 }
 for(const n of Object.keys(model.joints))model.visibility[n]=Array(8).fill(true);
 model.clips.idle=clip(model,6,16,true,Array.from({length:16},(_,f)=>{const a=f*TAU/16,p=bodyPose(Math.sin(a)*.3);
  for(const side of sides){const sign=side==='L'?-1:1,phase=a+sign*.7;p['antenna'+side]=[sign*(.5+Math.sin(phase)*1.6),Math.cos(phase)*1.2,Math.sin(phase)*1.2];p['jaw'+side]=[sign*Math.max(0,Math.sin(a))*.35,0,0];}return [f,p];}));
 for(const action of ['walk','run','charge']){
  const stride=action==='walk'?5:action==='run'?7:9,lift=action==='walk'?2.4:3.6;
  model.clips[action]=clip(model,action==='walk'?12:action==='run'?18:22,12,true,Array.from({length:12},(_,f)=>{
   const t=f/12,bob=.35*Math.sin(t*TAU*2),p=bodyPose(bob,action==='charge'?1:0,Math.sin(t*TAU)*.25);
   for(const side of sides){const sign=side==='L'?-1:1;
    for(let i=0;i<3;i++){
     // Tripod A: left front + right middle + left rear. The opposite three
     // remain planted; the return stroke lifts, rather than sliding all feet.
     const u=(t+((i+(side==='L'?0:1))%2)*.5)%1,stance=u<.6;
     const swing=stance?0:(u-.6)/.4,ease=swing*swing*(3-2*swing);
     const y=stance?stride*(.5-u/.6):stride*(-.5+ease),z=stance?0:Math.sin(swing*Math.PI)*lift;
     p['leg'+i+side]=[0,0,bob];p['knee'+i+side]=[sign*z*.15,y*.6,z*.5+bob*.3];p['foot'+i+side]=[0,y,z];
    }
    p['antenna'+side]=[sign*Math.sin(t*TAU+sign*.8)*1.2,-(action==='charge'?3:0),bob+Math.cos(t*TAU+sign*.8)];
   }return [f,p];
  }));
 }
 const crouch=(amount,spread=0)=>{const p=bodyPose(-amount,-amount*.25);for(const side of sides){const sign=side==='L'?-1:1;p['jaw'+side]=[sign*spread,-amount*.25,-amount];p['antenna'+side]=[-sign*amount*.3,-amount,-amount];for(let i=0;i<3;i++){p['leg'+i+side]=[0,0,-amount];p['knee'+i+side]=[sign*amount*.4,0,-amount*.3];}}return p;};
 model.clips.windup=clip(model,14,8,false,[[0,{}],[3,crouch(1,1.5)],[7,crouch(2,3)]]);
 const bite=(reach,spread,z=0)=>{const p=bodyPose(z,reach);for(const side of sides){const sign=side==='L'?-1:1;p['jaw'+side]=[sign*spread,reach+1,z];p['antenna'+side]=[-sign,reach-2,z-1];p['knee0'+side]=[0,reach*.45,1];p['foot0'+side]=[-sign,reach*.6,1];}return p;};
 model.clips.attack=clip(model,26,8,false,[[0,crouch(1,2.8)],[2,bite(4,2,1)],[3,bite(5,-2,0)],[5,bite(2,-1)],[7,{}]]);
 model.clips.recover=clip(model,12,8,false,[[0,crouch(1.5)],[3,crouch(.8)],[7,{}]]);
 model.clips.hurt=clip(model,22,6,false,[[0,{}],[1,bodyPose(-1,-2,2)],[3,bodyPose(-.5,-1,-1)],[5,{}]]);
 model.clips.snared=clip(model,10,10,true,Array.from({length:10},(_,f)=>{const p=crouch(1.5);for(const side of sides)for(let i=0;i<3;i++){const a=f*TAU/10+i*1.3+(side==='L'?0:Math.PI);p['foot'+i+side]=[Math.sin(a)*1.4,Math.cos(a),1+Math.max(0,Math.sin(a))*2];}return [f,p];}));
 const fallen={...bodyPose(-5,-1,2)};for(const side of sides){const sign=side==='L'?-1:1;fallen['antenna'+side]=[-sign*5,-4,-7];fallen['jaw'+side]=[0,-2,-4];for(let i=0;i<3;i++){fallen['leg'+i+side]=[0,0,-4];fallen['knee'+i+side]=[-sign*4,0,-1];fallen['foot'+i+side]=[-sign*8,(1-i)*3,3+(side==='R'?1:0)];}}
 model.clips.death=clip(model,14,10,false,[[0,{}],[2,bodyPose(1,-1,-2)],[5,fallen],[9,fallen]]);
 return model;
}

// Old shared rigs were the shipped default. Upgrade only unchanged fields;
// retain painted bone views, custom keys, proportions, palettes and ordering.
export function upgradeBeetleMotion(saved,legacy){
 const copy=structuredClone(saved);if(copy.artGeneration===2)return copy;
 const fresh=defaultBeetleMotion();
 for(const field of ['palette','shape','joints','visibility','clips']){
  copy[field]={...fresh[field],...copy[field]};
  for(const [name,value]of Object.entries(fresh[field]))if(same(saved[field]?.[name],legacy[field]?.[name]))copy[field][name]=structuredClone(value);
 }
 if(copy.name===legacy.name)copy.name=fresh.name;
 copy.artGeneration=2;return copy;
}

export function beetleAction(actor){
 if(actor.animationAction)return actor.animationAction==='bite'?'attack':actor.animationAction;
 if(actor.hp<=0||actor.dead)return 'death';
 if(actor.flash>0||actor.hit>0)return 'hurt';
 if(actor.state==='snared')return 'snared';
 if(actor.attack>0)return 'attack';
 if(['windup','charge','recover'].includes(actor.state))return actor.state;
 return actor.moving?(actor.walking||(actor.locomotionSpeed??actor.speed??90)<=110?'walk':'run'):'idle';
}
export function beetleFrame(actor,time,model){
 const action=beetleAction(actor),clip=model.clips[action]||model.clips.idle;
 if(Number.isFinite(actor.playerFrame))return actor.playerFrame;
 if(Number.isFinite(actor.poseTime))return actor.poseTime*(clip.length-1);
 if(Number.isFinite(actor.animationProgress))return actor.animationProgress*(clip.length-1);
 if(action==='hurt')return Math.max(0,1-Math.max(actor.flash||0,actor.hit||0)/.2)*(clip.length-1);
 if(action==='attack')return Math.max(0,1-(actor.attack||0)/(actor.faction==='ally'?.34:.25))*(clip.length-1);
 if(action==='death')return (actor.deathAge??actor.deathTimer??actor.stateAge??1)*clip.fps;
 if(!clip.loop&&Number.isFinite(actor.timer)&&actor.motionDuration>0)return Math.max(0,1-actor.timer/actor.motionDuration)*(clip.length-1);
 if(['walk','run','charge'].includes(action))return (actor.step||0)/(.13*(action==='walk'?54:70))*clip.length;
 return (time+(actor.id||0)*.071)*clip.fps;
}

// Eight small pixel shell views, reused across poses and actors. The analytic
// surface is baked only when a palette/shape changes: no per-frame pixel reads,
// shader, gradients, filtered rotation, or texture allocations.
const shellViews=new WeakMap();
export function clearBeetleArtCache(model){shellViews.delete(model);}
function bakeShell(d,rx,ry,rz,pal,split=false){
 const angle=d*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle),pixels=[];
 const limit=Math.ceil(Math.max(rx,ry)+rz+2);
 for(let sy=-limit;sy<=limit;sy++)for(let sx=-limit;sx<=limit;sx++){
  // Camera ray: projected x fixed; depth advances while height rises .5/depth.
  const bx=sx*co,by=-sx*si,bz=-sy;
  const A=si*si/(rx*rx)+co*co/(ry*ry)+.25/(rz*rz);
  const B=2*(bx*si/(rx*rx)+by*co/(ry*ry)+bz*.5/(rz*rz));
  const C=bx*bx/(rx*rx)+by*by/(ry*ry)+bz*bz/(rz*rz)-1,disc=B*B-4*A*C;
  if(disc<0)continue;
  const depth=(-B+Math.sqrt(disc))/(2*A),x=bx+si*depth,y=by+co*depth,z=bz+.5*depth;
  const nx=x/(rx*rx),ny=y/(ry*ry),nz=z/(rz*rz),n=Math.hypot(nx,ny,nz);
  const light=(-.48*nx-.32*ny+.82*nz)/n;
  let color=light>.7?pal.light:light>.2?pal.body:pal.shade;
  const edge=Math.sqrt(disc)/A;
  if(edge<2)color=pal.outline;
  else if(split&&Math.abs(x)<.8)color=pal.outline;
  else if(split&&Math.abs(x)<1.6&&x<0&&z>0)color=pal.rim;
  else if(split&&z>rz*.25&&Math.abs(x)>rx*.68)color=light>.25?pal.rim:pal.shade;
  else if(light>.88&&z>0&&y<ry*.45)color=pal.highlight;
  // Two restrained engraved longitudinal ridges, shaded not emissive.
  else if(split&&z>rz*.45&&Math.abs(Math.abs(x)-rx*.47)<.45&&y<ry*.75&&y>-ry*.8)color=light>.35?pal.light:pal.shade;
  pixels.push([sx,sy,color]);
 }
 // Merge same-colour row spans; far fewer fill calls than one per shell pixel.
 const spans=[];for(const [x,y,color]of pixels){const last=spans.at(-1);if(last&&last[1]===y&&last[3]===color&&last[0]+last[2]===x)last[2]++;else spans.push([x,y,1,color]);}return spans;
}
function shellArt(model,d){
 const signature=JSON.stringify([model.palette,model.shape]);let cache=shellViews.get(model);
 if(!cache||cache.signature!==signature){cache={signature,views:{}};shellViews.set(model,cache);}
 if(!cache.views[d]){const s=model.shape,p=model.palette;cache.views[d]={shell:bakeShell(d,s.bodyWidth,s.shellLength,s.shellHeight,p,true),thorax:bakeShell(d,s.bodyWidth*.7,4.5,3.5,p),head:bakeShell(d,s.headRadius,s.headRadius*.85,3,{...p,body:p.face})};}
 return cache.views[d];
}
function blit(c,spans,anchor){const x=Math.round(anchor.x),y=Math.round(anchor.y);for(const [dx,dy,w,color]of spans){c.fillStyle=color;c.fillRect(x+dx,y+dy,w,1);}}
// Bresenham-style square pixels make the articulated chitin legs crisp, cheap,
// and editable through the same layer capture as every other rig.
function segment(c,a,b,width,color){
 let x=Math.round(a.x),y=Math.round(a.y);const tx=Math.round(b.x),ty=Math.round(b.y),dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;
 const w=Math.max(1,Math.round(width)),o=Math.floor(w/2);let err=dx+dy;c.fillStyle=color;
 for(let n=0;n<160;n++){c.fillRect(x-o,y-o,w,w);if(x===tx&&y===ty)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}
}
export function drawBeetle(c,actor,time,model,suppliedPose=null){
 const d=facingIndex(actor.faceX,actor.faceY),pose=suppliedPose||poseAt(model,beetleAction(actor),beetleFrame(actor,time,model));
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),pal=model.palette,s=model.shape,art=shellArt(model,d),layers=[];
 const visible=n=>model.visibility[n]?.[d]!==false;
 for(const side of sides)for(let i=0;i<3;i++){
  const root='leg'+i+side,knee='knee'+i+side,foot='foot'+i+side;
  if(!visible(foot))continue;
  layers.push({id:foot,bone:root,bones:[root,knee,foot],depth:p[root].depth+(p[foot].depth-p[root].depth)*.25,fn:()=>{
   if(visible(root))segment(c,p[root],p[knee],s.legWidth+1,pal.outline);
   if(visible(knee))segment(c,p[knee],p[foot],s.legWidth,pal.outline);
   if(visible(root))segment(c,p[root],p[knee],s.legWidth,pal.shade);
   if(visible(knee)){segment(c,{x:p[knee].x-1,y:p[knee].y-1},{x:p[foot].x-1,y:p[foot].y-1},1,pal.joint);ellipse(c,p[knee].x,p[knee].y,1.1,1.1,pal.light);}
   c.fillStyle=pal.rim;c.fillRect(Math.round(p[foot].x),Math.round(p[foot].y),2,1);
  }});
 }
 if(visible('pelvis'))layers.push({id:'Body',bone:'pelvis',bones:['pelvis'],depth:p.pelvis.depth,fn:()=>blit(c,art.shell,p.pelvis)});
 if(visible('chest'))layers.push({id:'Thorax',bone:'chest',bones:['chest'],depth:p.chest.depth,fn:()=>blit(c,art.thorax,p.chest)});
 if(visible('head'))layers.push({id:'Head',bone:'head',bones:['head'],depth:p.head.depth,fn:()=>{
  blit(c,art.head,p.head);
  for(const side of sides){const sign=side==='L'?-1:1,eye=projectPoint([pose.head[0]+sign*3.5,pose.head[1]+1,pose.head[2]+1.7],d);
   // Far eyes are hidden in profile and from behind, not painted on the shell.
   if(d===3||d===4||d===5||(d===2&&side==='R')||(d===6&&side==='L'))continue;
   c.fillStyle=pal.outline;c.fillRect(Math.round(eye.x)-1,Math.round(eye.y),3,2);c.fillStyle=pal.eye;c.fillRect(Math.round(eye.x),Math.round(eye.y),2,1);
  }
 }});
 for(const side of sides){
  const sign=side==='L'?-1:1,jaw='jaw'+side,antenna='antenna'+side;
  if(visible(jaw))layers.push({id:jaw,bone:'head',bones:['head',jaw],depth:p[jaw].depth,fn:()=>{const base=projectPoint([pose.head[0]+sign*2.5,pose.head[1]+2,pose.head[2]-.5],d),tip=projectPoint([pose[jaw][0]-sign*1.5,pose[jaw][1]+1.5,pose[jaw][2]],d);segment(c,base,p[jaw],3,pal.outline);segment(c,p[jaw],tip,2,pal.rim);}});
  if(visible(antenna))layers.push({id:antenna,bone:'head',bones:['head',antenna],depth:p[antenna].depth,fn:()=>{const base=projectPoint([pose.head[0]+sign*3,pose.head[1],pose.head[2]+1],d),elbow={x:base.x+(p[antenna].x-base.x)*.6,y:base.y+(p[antenna].y-base.y)*.25-2};segment(c,base,elbow,2,pal.outline);segment(c,elbow,p[antenna],1,pal.joint);ellipse(c,p[antenna].x,p[antenna].y,1.4,1.1,pal.rim);}});
 }
 paintLayers(layers,model,d,c,p);return p;
}
