import {facingIndex,projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';

// Draft native axolotl study. Separate tail, limbs and gills; no baked frames.
// Logical body length 38px, head width 16px; eight native viewing directions.
export const AXOLOTL_RIG=Object.freeze({id:'olm',views:Object.freeze([0,1,2,3,4,5,6,7]),palette:Object.freeze({outline:'#493544',shade:'#ae738b',body:'#e6adba',light:'#ffe0df',gill:'#e96d9b',gillShade:'#a74770',eye:'#392d40'}),joints:Object.freeze({body:[0,-2,4],head:[0,7,5],tailRoot:[0,-8,4],tailMid:[0,-15,3],tailTip:[0,-24,2],foreL:[-4,4,3],foreR:[4,4,3],hindL:[-4,-6,3],hindR:[4,-6,3]})});
export function axolotlPose(a,time=0){
 const gait=a.moving?Math.max(0,Math.min(1,a.gaitBlend??1)):0,phase=(a.travelDistance||0)*.22,breath=Math.sin(time*1.7+(a.phase||0))*.2;
 const p=Object.fromEntries(Object.entries(AXOLOTL_RIG.joints).map(([k,v])=>[k,[...v]]));
 p.body[2]+=breath;p.head[2]+=breath*.6;
 p.tailMid[0]=Math.sin(time*.9+(a.phase||0)+phase*.4)*(gait?1.7:.6);p.tailTip[0]=Math.sin(time*.9+(a.phase||0)+phase*.4-.8)*(gait?4:1.5);
 for(const [side,sign]of [['L',-1],['R',1]])for(const [name,y]of [['fore',4],['hind',-6]]){
  const f=phase+(sign<0?0:Math.PI)+(name==='hind'?Math.PI:0),s=Math.sin(f)*gait,lift=Math.max(0,Math.cos(f))*1.5*gait;
  p[name+'Elbow'+side]=[sign*6.5,y-s*.8,2.4+lift*.35];p[name+'Foot'+side]=[sign*8,y+s*2.1,1+lift];
 }
 return p;
}
let scratch;
export function drawAxolotl(c,a,time=0,size=48){
 const destination=c;
 if(typeof document!=='undefined'){scratch ||= document.createElement('canvas');scratch.width=scratch.height=64;c=scratch.getContext('2d');c.translate(32,32);}
 const view=facingIndex(a.faceX??0,a.faceY??1),pose=axolotlPose(a,time),pal=AXOLOTL_RIG.palette,parts=[];
 const q=v=>projectPoint(v,view),add=(center,paint)=>parts.push({depth:q(center).depth,paint});
 const line=(u,v,color,width=1)=>pixelLine(c,q(u),q(v),color,width);
 const skin={body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline};
 const tail=[pose.tailRoot,pose.tailMid,pose.tailTip],widths=[3.6,2.4,.4];
 for(let i=0;i<2;i++){
  const u=tail[i],v=tail[i+1],center=u.map((n,k)=>(n+v[k])/2);
  add(center,()=>{
   const points=[[u[0]-widths[i],u[1],u[2]],[v[0]-widths[i+1],v[1],v[2]],[v[0]+widths[i+1],v[1],v[2]],[u[0]+widths[i],u[1],u[2]]];
   pixelPolygon(c,points.map(q),pal.shade);line(u,v,pal.body,i===0?4:2);
   line([u[0],u[1],u[2]+2],[v[0],v[1],v[2]+1],pal.light,1);
  });
 }
 for(const side of ['L','R'])for(const name of ['fore','hind']){
  const root=pose[name+side],elbow=pose[name+'Elbow'+side],foot=pose[name+'Foot'+side],sign=side==='L'?-1:1;
  add(elbow,()=>{line(root,elbow,pal.outline,4);line(elbow,foot,pal.outline,3);line(root,elbow,pal.shade,2);line(elbow,foot,pal.body,2);for(const y of [-1,0,1])line([foot[0],foot[1]+y,foot[2]],[foot[0]+sign*1.7,foot[1]+y*1.8,foot[2]],pal.light,1);});
 }
 add(pose.body,()=>pixelVolume(c,pose.body,5.5,9,3.6,view,skin));
 // Six external gill fans grow from behind the broad head. Far gills are
 // actually behind the face; their silhouette remains legible in rear views.
 for(const sign of [-1,1])for(let i=0;i<3;i++){
  const root=[sign*6,5.7-i*.8,5],sway=Math.sin(time*2+(a.phase||0)+i*.7)*.55;
  const tip=[sign*(10+i*.9),6-i*2,8-i*2+sway];
  add(root,()=>{
   line(root,tip,pal.gillShade,2);line(root,tip,pal.gill,1);
   for(const t of [.45,.75,1]){const base=root.map((v,k)=>v+(tip[k]-v)*t);line(base,[base[0]+sign*1.5,base[1]+1.5,base[2]+1.5],pal.gill,1);line(base,[base[0]+sign*1.5,base[1]-1.4,base[2]-.7],pal.gill,1);}
  });
 }
 add(pose.head,()=>{
  pixelVolume(c,pose.head,7.8,5,3.9,view,skin);
  const visible=view===0?[-1,1]:[1,2,7,6].includes(view)?[view<4?-1:1]:[];
  for(const sign of visible){const eye=[sign*4.7,9.5,6.1];line(eye,[eye[0],eye[1],eye[2]-.7],pal.eye,2);line([eye[0]-.3,eye[1],eye[2]+.5],[eye[0]-.3,eye[1],eye[2]+.5],'#fff3e9',1);}
  if(view===0||view===1||view===7){line([-2,11.1,3.9],[0,11.6,3.5],pal.shade,1);line([0,11.6,3.5],[2,11.1,3.9],pal.shade,1);}
 });
 if(c!==destination){parts.sort((u,v)=>u.depth-v.depth);for(const part of parts)part.paint();destination.save();destination.translate(Math.round(a.x||0),Math.round(a.y||0));destination.scale(size/40,size/40);destination.imageSmoothingEnabled=false;destination.drawImage(scratch,-32,-32);destination.restore();}
 else{c.save();c.translate(Math.round(a.x||0),Math.round(a.y||0));c.scale(size/40,size/40);parts.sort((u,v)=>u.depth-v.depth);for(const part of parts)part.paint();c.restore();}return pose;
}
