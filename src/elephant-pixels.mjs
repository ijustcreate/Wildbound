import {projectPoint,ellipse} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';

// Trunks-inspired elephant drawn as connected pixel volumes on the existing
// 29-joint Wildbound rig. Each part remains independently editable in Studio.
export function drawElephantPixels(c,model,pose,d){
 const pal=model.palette,p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)]));
 const visible=n=>model.visibility[n]?.[d]!==false,queue=[];
 const add=(id,bone,bones,depth,fn)=>{if(visible(bone))queue.push({id,bone,bones,depth,fn});};
 const line=(a,b,width,color)=>pixelLine(c,a,b,color,width);
 const blend=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
 const taper=(a,b,start,end,outer,inner)=>{
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const shape=(r0,r1)=>[{x:a.x+nx*r0,y:a.y+ny*r0},{x:b.x+nx*r1,y:b.y+ny*r1},{x:b.x-nx*r1,y:b.y-ny*r1},{x:a.x-nx*r0,y:a.y-ny*r0}];
  pixelPolygon(c,shape(start+1,end+1),outer);pixelPolygon(c,shape(start,end),inner);
  ellipse(c,a.x,a.y,start+1,start+1,outer);ellipse(c,a.x,a.y,start,start,inner);
  ellipse(c,b.x,b.y,end+1,end+1,outer);ellipse(c,b.x,b.y,end,end,inner);
 };
 for(const side of ['L','R']){
  const hip='hip'+side,knee='knee'+side,rear='rearPaw'+side,shoulder='shoulder'+side,elbow='elbow'+side,front='frontPaw'+side;
  for(const [upper,mid,foot,label] of [[hip,knee,rear,'Rear'],[shoulder,elbow,front,'Front']]){
   add(label+' leg '+side,foot,[upper,mid,foot],p[foot].depth,()=>{
    taper(p[upper],p[mid],5,4,pal.outline,pal.body);
    taper(p[mid],p[foot],4,3,pal.outline,pal.shade);
    const f=p[foot],x=Math.round(f.x),y=Math.round(f.y);
    ellipse(c,x,y-1,6,3,pal.outline);ellipse(c,x,y-2,5,2,pal.shade);
    c.fillStyle=pal.light;for(const dx of [-4,0,4])c.fillRect(x+dx-1,y-1,2,1);
   });
   if(queue.at(-1)?.id===label+' leg '+side)queue.at(-1).attachmentOrder={anchors:['Elephant body'],behind:p[foot].depth<(p.chest.depth+p.pelvis.depth)/2};
  }
 }
 const center=blend(pose.pelvis,pose.chest,.51);
 add('Elephant body','chest',['chest','pelvis'],(p.chest.depth+p.pelvis.depth)/2,()=>{
  pixelVolume(c,center,15,20,12,d,{body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline});
  // One broad shoulder mass links the neck and legs without hard capsule seams.
  pixelVolume(c,blend(pose.chest,pose.neck,.25),11,10,10,d,{body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline});
 });
 for(const [a,b,w]of [['pelvis','tailBase',3],['tailBase','tailMid',2],['tailMid','tailTip',2]])
  add('Elephant tail '+b,b,[a,b],p[b].depth,()=>{line(p[a],p[b],w+2,pal.outline);line(p[a],p[b],w,pal.shade);if(b==='tailTip'){c.fillStyle=pal.outline;c.fillRect(Math.round(p[b].x)-2,Math.round(p[b].y)-1,4,3);}});
 // Floppy, tapered ears sit behind the face. Unlike the old ovals they have
 // a broad upper shell and a narrow lower fold in every turn direction.
 for(const side of ['L','R']){
  const s=side==='L'?-1:1,n='ear'+side;
  add('Elephant ear '+side,n,['head',n],p[n].depth,()=>{
   const e=p[n],h=p.head,away=Math.sign(e.x-h.x)||s;
   const point=(dx,dy)=>({x:e.x+away*dx,y:e.y+dy});
   pixelPolygon(c,[point(-5,-7),point(3,-10),point(9,-6),point(10,2),point(6,9),point(-1,10),point(-6,4)],pal.outline);
   pixelPolygon(c,[point(-3,-6),point(3,-8),point(7,-5),point(8,2),point(5,7),point(0,8),point(-4,3)],pal.face);
   line(point(-3,-2),point(1,5),2,pal.shade);
  });
  if(queue.at(-1)?.id==='Elephant ear '+side)queue.at(-1).attachmentOrder={anchors:['Elephant head'],behind:p[n].depth<=p.head.depth+.5};
 }
 add('Elephant head','head',['head','neck'],p.head.depth+.6,()=>{
  pixelVolume(c,pose.head,10,9,9,d,{body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline});
  pixelVolume(c,blend(pose.head,pose.jaw,.5),8,6,5,d,{body:pal.face,shade:pal.shade,light:pal.light,outline:pal.outline});
 });
 for(const side of ['L','R']){
  const n='eye'+side;
  add('Elephant eye '+side,n,['head',n],p.head.depth+.9,()=>{
   const x=Math.round(p[n].x),y=Math.round(p[n].y);
   c.fillStyle=pal.outline;c.fillRect(x-2,y-2,4,3);
   c.fillStyle=pal.eye;c.fillRect(x-1,y-1,2,2);
   c.fillStyle=pal.light;c.fillRect(x-1,y-1,1,1);
  });
 }
 // Two short upward-curved ivory tusks grow beside, not through, the trunk.
 if(d<3||d>5)for(const side of ['L','R']){
  const s=side==='L'?-1:1,n='tusk'+side;
  add('Elephant tusk '+side,n,['head',n],p[n].depth+.8,()=>{
   const h=pose.head,t=pose[n],root=projectPoint([h[0]+s*5,h[1]+5,h[2]-6],d),bend=projectPoint([t[0],t[1]-1,t[2]-3],d);
   line(root,bend,4,pal.outline);line(root,bend,2,pal.detail);line(bend,p[n],3,pal.outline);line(bend,p[n],2,pal.detail);
  });
 }
 for(const [a,b,w,id]of [['head','trunkBase',8,'base'],['trunkBase','trunkMid',7,'middle'],['trunkMid','trunkTip',5,'tip']])
  add('Elephant trunk '+id,b,[a,b],p[b].depth+1,()=>{
   taper(p[a],p[b],w*.62,w*.46,pal.outline,pal.body);
   const q=blend(pose[a],pose[b],.5),v=projectPoint([q[0]-1,q[1],q[2]+1],d);
   c.fillStyle=pal.light;c.fillRect(Math.round(v.x),Math.round(v.y),Math.max(2,w-3),2);
   if(id==='tip'){const x=Math.round(p[b].x),y=Math.round(p[b].y);c.fillStyle=pal.shade;c.fillRect(x-2,y-1,4,2);}
  });
 paintLayers(queue,model,d,c,p);
 return p;
}
