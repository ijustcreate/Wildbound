import source from './shore-goblin-data.mjs';
import {poseAt,projectPoint,facingIndex,validateMotion,ellipse} from './player-motion.mjs';
import {validateSprite} from './pixels.mjs';
import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export const SHORE_COLORS=Object.freeze([
 {body:'#438f86',shade:'#286459',light:'#79b79c',fin:'#d9653d',finLight:'#ef9955'},
 {body:'#77934c',shade:'#465f38',light:'#b0bb70',fin:'#c9953d',finLight:'#f0c66c'},
 {body:'#7278a8',shade:'#48496b',light:'#a8acd1',fin:'#ae638e',finLight:'#eaa0b4'},
]);
export const defaultShoreGoblinMotion=()=>structuredClone(source);
export const shoreGoblinMotion=defaultShoreGoblinMotion();
export let shoreGoblinRevision=0;
export const loadShoreGoblinArt=()=>Promise.resolve(true);
export const validateShoreGoblinMotion=m=>validateMotion(m,source)&&(!m.visibility||Object.entries(m.visibility).every(([n,v])=>source.joints[n]&&Array.isArray(v)&&v.length===8&&v.every(x=>typeof x==='boolean')))&&(!m.boneSprites||Object.values(m.boneSprites).every(v=>Object.entries(v).every(([d,s])=>Number.isInteger(+d)&&+d>=0&&+d<8&&validateSprite(s)&&Number.isFinite(s.x)&&Number.isFinite(s.y))));
export function replaceShoreGoblinMotion(m){if(!validateShoreGoblinMotion(m))throw Error('Invalid shore goblin rig');const copy=structuredClone(m);for(const k of Object.keys(shoreGoblinMotion))delete shoreGoblinMotion[k];Object.assign(shoreGoblinMotion,copy);shoreGoblinRevision++;}
export function shoreGoblinAction(a){return a.hp<=0?'death':a.animationAction||(a.flash>0?'hurt':a.moving?'run':'idle');}

// One anatomical construction is projected into all eight facings. Native
// joints, named layers and painted overrides remain the editing contract.
export function drawShoreGoblin(c,a,t,m=shoreGoblinMotion,suppliedPose=null){
 const d=facingIndex(a.faceX,a.faceY),action=shoreGoblinAction(a),clip=m.clips[action]||m.clips.idle;
 const frame=Number.isFinite(a.playerFrame)?a.playerFrame:a.hp<=0?Math.min(clip.length-1,(a.deathTimer??a.deathTime??0)*clip.fps):Number.isFinite(a.poseTime)?a.poseTime*(clip.length-1):t*clip.fps;
 const pose=suppliedPose||poseAt(m,action,frame),p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)]));
 const pal={...m.palette,...(a.shoreColor===undefined?{}:SHORE_COLORS[((a.shoreColor%3)+3)%3])},q=[],role=a.shoreRole||'spear';
 const add=(bone,id,bones,fn,depth=p[bone].depth,attachmentOrder)=>{if(m.visibility?.[bone]?.[d]!==false)q.push({bone,id,bones,depth,fn,attachmentOrder});};
 const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],subtract=(a,b)=>a.map((v,i)=>v-b[i]);
 const forward=normalize(subtract(pose.nose,pose.head)),rawUp=subtract(pose.headTop,pose.head),dot=rawUp.reduce((s,v,i)=>s+v*forward[i],0),up=normalize(rawUp.map((v,i)=>v-forward[i]*dot)),side=normalize(cross(forward,up));
 const at=(origin,x,y,z)=>projectPoint(origin.map((v,i)=>v+side[i]*x+forward[i]*y+up[i]*z),d),head=(x,y,z)=>at(pose.head,x,y,z);
 const bodyUp=normalize(subtract(pose.chest,pose.pelvis)),bodySide=normalize(cross(forward,bodyUp)),bodyForward=normalize(cross(bodyUp,bodySide));
 const body=(x,y,z)=>projectPoint(pose.pelvis.map((v,i)=>v+bodySide[i]*x+bodyForward[i]*y+bodyUp[i]*z),d),bodyLength=Math.hypot(...subtract(pose.chest,pose.pelvis));
 const hull=points=>{const sorted=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),turn=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),lo=[],hi=[];for(const v of sorted){while(lo.length>1&&turn(lo.at(-2),lo.at(-1),v)<=0)lo.pop();lo.push(v);}for(const v of sorted.slice().reverse()){while(hi.length>1&&turn(hi.at(-2),hi.at(-1),v)<=0)hi.pop();hi.push(v);}return lo.slice(0,-1).concat(hi.slice(0,-1));};
 const solid=(fn,rx,ry,rz,color)=>{const points=[];for(const z of [-.86,0,.86])for(let i=0;i<12;i++){const a=i*Math.PI/6,r=Math.sqrt(1-z*z);points.push(fn(Math.cos(a)*rx*r,Math.sin(a)*ry*r,z*rz));}points.push(fn(0,0,rz),fn(0,0,-rz));pixelPolygon(c,hull(points),color);};
 const volume=(fn,cx,cy,cz,rx,ry,rz,color)=>solid((x,y,z)=>fn(x+cx,y+cy,z+cz),rx,ry,rz,color);
 const polygon=(points,color)=>pixelPolygon(c,points,color);
 const capsule=(a,b,r1,r2,color)=>{const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1,nx=-dy/n,ny=dx/n;for(const edge of [true,false]){const x=r1+(edge?1:0),y=r2+(edge?1:0),ink=edge?pal.outline:color;polygon([{x:a.x+nx*x,y:a.y+ny*x},{x:b.x+nx*y,y:b.y+ny*y},{x:b.x-nx*y,y:b.y-ny*y},{x:a.x-nx*x,y:a.y-ny*x}],ink);ellipse(c,a.x,a.y,x,x,ink);ellipse(c,b.x,b.y,y,y,ink);}};
 const rear=d>=3&&d<=5;
 for(const s of ['L','R']){
  add('hip'+s,'Shore leg '+s,['hip'+s,'knee'+s,'ankle'+s,'foot'+s],()=>{
   capsule(p['hip'+s],p['knee'+s],m.shape.legWidth*.72,m.shape.legWidth*.5,pal.body);
   capsule(p['knee'+s],p['ankle'+s],m.shape.legWidth*.5,m.shape.legWidth*.33,pal.shade);
   capsule(p['ankle'+s],p['foot'+s],1.4,1.7,pal.body);
   const foot=pose['foot'+s],fwd=normalize(subtract(foot,pose['ankle'+s])),lateral=normalize(cross(fwd,bodyUp));
   const toe=(x,y)=>projectPoint(foot.map((v,i)=>v+lateral[i]*x+fwd[i]*y),d);
   const outline=[[-3,-2],[3,-2],[4.5,4],[2,3],[1.5,5],[0,3.5],[-2,5],[-2.5,3],[-5,4]].map(v=>toe(...v));polygon(outline,pal.outline);
   polygon([[-2,-1],[2,-1],[3.5,3],[1,3],[0,4],[-2,3],[-3.5,3]].map(v=>toe(...v)),pal.fin);
  },(p['hip'+s].depth+p['foot'+s].depth)/2);
  add('shoulder'+s,'Shore arm '+s,['shoulder'+s,'elbow'+s,'hand'+s],()=>{
   capsule(p['shoulder'+s],p['elbow'+s],m.shape.armWidth*.9,m.shape.armWidth*.58,pal.body);
   capsule(p['elbow'+s],p['hand'+s],m.shape.armWidth*.6,m.shape.armWidth*.38,pal.body);
   if(s==='R'){capsule(p.handR,p.gripR,1.3,1.6,pal.body);return;}
   const h=p['hand'+s];ellipse(c,h.x,h.y,2.2,2.6,pal.fin);for(const k of [-1,0,1])pixelLine(c,{x:h.x+k*1.4,y:h.y+1},{x:h.x+k*2,y:h.y+3.5-Math.abs(k)},pal.fin,1.5);
  },(p['hand'+s].depth+p['shoulder'+s].depth)/2);
 }
 add('chest','Shore neck',['chest','head'],()=>{
  for(const edge of [true,false])for(let i=0;i<=8;i++){const t=i/8,r=5.2-t*2+(edge?1:0);ellipse(c,p.chest.x+(p.head.x-p.chest.x)*t,p.chest.y+(p.head.y-p.chest.y)*t,r,r,edge?pal.outline:pal.body);}
 },Math.min(p.head.depth,p.chest.depth)-4);
 add('chest','Shore body',['pelvis','chest'],()=>{
  const w=m.shape.bodyWidth;
  volume(body,0,1,bodyLength*.35,w*.95,6.3,bodyLength*.5+5.5,pal.outline);
  volume(body,0,1,bodyLength*.35,w*.95-1,5.5,bodyLength*.5+4.8,pal.body);
  volume(body,-2,-1,bodyLength*.6,w*.52,4.2,bodyLength*.5+2.5,pal.light);
  for(const s of ['L','R'])capsule(p.pelvis,p['hip'+s],3.3,2.8,pal.body);
  // Cream throat is an anatomical volume, not a diagonal paper wedge.
  if(!rear){volume(body,0,5,-1,w*.63,2.6,5,pal.cream);}
 },(p.pelvis.depth+p.chest.depth)/2);
 add('pelvis','Shore kelp belt',['pelvis'],()=>{
  volume(body,0,0,0,6.5,4.7,1,pal.wood);
  for(const y of [-4.5,4.5])for(const x of [-3.3,0,3.3]){
   polygon([[x-1.8,y,.2],[x+1.8,y,.2],[x+1.2,y,-4.8],[x-.5,y,-7],[x-1.5,y,-4]].map(v=>body(...v)),pal.outline);
   polygon([[x-1.1,y+.1,0],[x+1.1,y+.1,0],[x+.6,y+.1,-4.5],[x-.4,y+.1,-5.7]].map(v=>body(...v)),pal.leaf);
  }
  if(!rear){const b=body(0,5,0);ellipse(c,b.x,b.y,2.5,3,pal.bone);pixelLine(c,{x:b.x-1,y:b.y-1.5},{x:b.x+1,y:b.y+1.5},pal.wood);}
 },p.pelvis.depth+.3);
 add('head','Shore skull',['head','headTop','nose'],()=>{
  const w=m.shape.headWidth*.84,h=m.shape.headHeight*.82;
  volume(head,0,1.5,.8,w,7,h,pal.outline);
  volume(head,0,1.5,1,w-1,6.3,h-.7,pal.body);
  volume(head,-1,1.2,2.2,w-2,5,h*.55,pal.light);
  // Cheeks taper into the same muzzle in front, profile and rear diagonals.
  volume(head,0,5.8,-1.8,w*.75,3.6,3,pal.body);
 });
 if(!rear)add('chest','Shore throat',['chest','jaw'],()=>{
  volume(body,0,6,-.8,m.shape.bodyWidth*.6,2.8,5.7,pal.cream);
  const bottom=body(0,6,0),top=at(pose.jaw,0,0,-1);
  capsule(bottom,top,4.4,3.6,pal.cream);
  // The donor hunch projects its pelvis above the chin in a front view.
  // A rounded lower throat keeps the pale underside readable beneath it.
  volume((x,y,z)=>at(pose.jaw,x,y,z),0,-1,-3,4.8,3.3,5,pal.cream);
 },p.head.depth+.4,{anchors:['Shore skull'],behind:false});
 add('crest','Shore dorsal crest',['crest','crestTip'],()=>{
  const expected=head(0,-3.2,6),offset={x:p.crest.x-expected.x,y:p.crest.y-expected.y},fan=points=>points.map(v=>{const p=head(...v);return {x:p.x+offset.x,y:p.y+offset.y};});
  // Three joined longitudinal spines plus small lateral spines retain thickness
  // and a recognizable silhouette from behind; no single triangular sail.
  const fins=[[[-2,-1,5],[0,-5,13],[2,-7,6]], [[-2,-5,6],[0,-11,14],[2,-12,3]], [[-2,-10,4],[0,-16,10],[2,-14,-1]], [[-2,-3,5],[-8,-7,11],[-5,-5,3]],[[2,-3,5],[8,-7,11],[5,-5,3]]];
  for(const points of fins){const projected=fan(points);polygon(hull(projected.flatMap(p=>[{x:p.x-1,y:p.y},{x:p.x+1,y:p.y}])),pal.outline);polygon(projected,pal.fin);pixelLine(c,projected[0],projected[1],pal.finLight,1);}
 },p.head.depth+(rear?3:-2));
 for(const s of ['L','R']){
  add('fin'+s,'Shore cheek fin '+s,['fin'+s],()=>{
   const sign=s==='L'?1:-1,origin=pose['fin'+s],fn=v=>at(origin,...v);
   polygon([[0,0,-1],[sign*4,-5,3],[sign*3,-3,-1],[sign*2,-5,-3],[0,-1,-3]].map(fn),pal.outline);
   polygon([[sign*.7,-.6,-1],[sign*3,-3.8,1.5],[sign*2,-2.5,-1],[sign*1.5,-3.4,-2]].map(fn),pal.fin);
  },p['fin'+s].depth+.2);
  const eye='eye'+s;add(eye,'Shore eye '+s,[eye],()=>{
   const e=p[eye],visibleFar=(d===1&&s==='R')||(d===7&&s==='L'),width=visibleFar?2.2:3.2;
   ellipse(c,e.x,e.y,width+1,4.6,pal.shade);ellipse(c,e.x,e.y,width,3.7,pal.eye);
   pixelLine(c,{x:e.x+.5,y:e.y-2},{x:e.x+.5,y:e.y+1.8},pal.outline,1.5);
   c.fillStyle=pal.bone;c.fillRect(Math.round(e.x-1),Math.round(e.y-2),1,1);
  },p[eye].depth+2);
 }
 add('jaw','Shore jaw',['jaw'],()=>{
  const jaw=(x,y,z)=>at(pose.jaw,x,y,z);
  volume(jaw,0,2,-.2,6.3,4,2.5,pal.outline);volume(jaw,0,2,0,5.7,3.5,1.9,pal.cream);
 },p.jaw.depth+1);
 add('mouth','Shore mouth',['mouth'],()=>{
  const j=p.mouth,profile=d===2||d===6,diagonal=d===1||d===7,rx=profile?3.8:diagonal?5.2:6.3,ry=2.8;
  const u=normalize([head(0,0,1).x-head(0,0,0).x,head(0,0,1).y-head(0,0,0).y,0]),right={x:-u[1],y:u[0]};
  const mouth=(x,y)=>({x:j.x+right.x*x+u[0]*y,y:j.y+right.y*x+u[1]*y});
  const ring=(x,y,color)=>{const points=[];for(let i=0;i<12;i++){const a=i*Math.PI/6;points.push(mouth(Math.cos(a)*x,Math.sin(a)*y));}polygon(points,color);};
  ring(rx+1,ry+1,pal.outline);ring(rx,ry,pal.mouth);
  for(const x of profile?[-1,1]:[-rx*.65,0,rx*.65])polygon([mouth(x-.7,ry-.5),mouth(x+.7,ry-.5),mouth(x,ry-2)],pal.bone);
  pixelLine(c,mouth(-rx*.5,-ry+.5),mouth(rx*.5,-ry+.5),pal.fin,1);
 },p.mouth.depth+2);
 if(role==='healer')add('chest','Shore healer shells',['chest'],()=>{
  const y=bodyLength*.25;pixelLine(c,body(-5,5,y+2),body(0,6,y),pal.leaf,1);pixelLine(c,body(0,6,y),body(5,5,y+2),pal.leaf,1);
  for(const x of [-3,0,3]){const s=body(x,6,y+(x===0?-1:0));ellipse(c,s.x,s.y,1.4,1.8,pal.bone);}
 },p.head.depth+2.5);
 // The native grip remains the pivot. Carried weapons lean outward from the
 // face; actual attack and cast clips keep the source attachment direction.
 const h=p.gripR,carried=['idle','walk','run','guard','spell_prepare','ready'].includes(action),tipWorld=pose.weaponTipR.map((v,i)=>v+(carried?-side[i]*5-forward[i]*4:0)),tip=projectPoint(tipWorld,d),dx=tip.x-h.x,dy=tip.y-h.y,n=Math.hypot(dx,dy)||1,ux=dx/n,uy=dy/n;
 add('gripR','Shore weapon',['handR','gripR','weaponTipR'],()=>{
  const length=role==='melee'?.48:role==='healer'?.76:.92,end={x:h.x+dx*length,y:h.y+dy*length},base={x:h.x-dx*.22,y:h.y-dy*.22};
  pixelLine(c,base,end,pal.outline,3);pixelLine(c,base,end,pal.wood,1.7);
  const at=(x,y)=>({x:end.x-uy*x+ux*y,y:end.y+ux*x+uy*y});
  if(role==='melee'){
   polygon([at(-3,-3),at(-4,3),at(-2,7),at(2,7),at(4,3),at(3,-3)],pal.outline);
   polygon([at(-2,-2),at(-3,2),at(-1,6),at(1,6),at(3,2),at(2,-2)],pal.wood);
   pixelLine(c,at(-2,2),at(2,2),pal.bone,1);
  }else if(role==='spear'){
   polygon([at(0,10),at(-3,2),at(0,-2),at(3,2)],pal.outline);polygon([at(0,8),at(-2,2),at(0,0),at(2,2)],pal.bone);
   pixelLine(c,at(-2,-1),at(-4,-9),pal.leaf,2);pixelLine(c,at(2,-2),at(3,-6),pal.leaf,1.5);
  }else{
   // Forked kelp crook and an inset shell/stone distinguish it from an eyeball.
   pixelLine(c,at(0,-1),at(-4,4),pal.wood,3);pixelLine(c,at(-4,4),at(-2,9),pal.wood,2);pixelLine(c,at(0,-1),at(4,5),pal.wood,2);
   polygon([at(0,7),at(-2,3),at(0,0),at(2,3)],pal.bone);polygon([at(0,5.5),at(-1,3),at(0,1.5),at(1,3)],pal.light);
   for(const side of [-1,1])polygon([at(side*3,4),at(side*6,7),at(side*5,1),at(side*2,1)],pal.leaf);
  }
 },(p.gripR.depth+p.weaponTipR.depth)/2+.8);
 add('gripR','Shore grip R',['handR','gripR'],()=>{
  ellipse(c,h.x,h.y,3,2.8,pal.outline);ellipse(c,h.x,h.y,2.5,2.2,pal.fin);
  // The shaft passes between the thumb and curled fingers, rather than next
  // to a hanging open hand. Knuckles cross it in all projected views.
  for(const k of [-1,0,1])pixelLine(c,{x:h.x-uy*1.5+ux*k,y:h.y+ux*1.5+uy*k},{x:h.x+uy*1.7+ux*k,y:h.y-ux*1.7+uy*k},pal.finLight,1);
  ellipse(c,h.x+uy*2,h.y-ux*2,1.2,1.4,pal.fin);
 },p.gripR.depth+3,{anchors:['Shore weapon'],behind:false});
 paintLayers(q,m,d,c,p);
}
