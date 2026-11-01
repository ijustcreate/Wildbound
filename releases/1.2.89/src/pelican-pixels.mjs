import {projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export function drawPelicanPixels(c,model,pose,d){
 const points=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),p=v=>projectPoint(v,d),queue=[];
 const pal={body:'#e4e3cd',shade:'#91a8a4',light:'#fff5db',outline:'#354f53'},bill='#d7aa58',billLight='#f0cb78';
 const add=(id,bone,depth,fn)=>{if(model.visibility[bone]?.[d]!==false)queue.push({id,bone,bones:[bone],depth,fn});};
 const shape=(v,color)=>pixelPolygon(c,v.map(p),color);
 for(const[side,sign]of[['L',-1],['R',1]]){
  const root=pose['shoulder'+side],elbow=pose['elbow'+side],tip=pose['wingTip'+side];
  add('Pelican wing '+side,'wingTip'+side,(points['wingTip'+side].depth+points['shoulder'+side].depth)/2,()=>{
   const trailing=[elbow[0],elbow[1]-10,elbow[2]-2];shape([root,elbow,tip,trailing,[sign*4,-7,11]],pal.outline);shape([root,elbow,[tip[0]-sign,tip[1],tip[2]],trailing],pal.body);
   for(let i=0;i<4;i++){const t=(i+1)/5,base=elbow.map((v,n)=>v+(tip[n]-v)*t),end=[tip[0]+sign*(i+1),tip[1]-4-i*2,tip[2]-1-i*.7];shape([base,end,[end[0]-sign*2,end[1]-2,end[2]-1]],'#40585b');}
   pixelLine(c,p(root),p(elbow),pal.light,2);
  });
  add('Pelican webbed foot '+side,'foot'+side,points['foot'+side].depth,()=>{pixelLine(c,points['hip'+side],points['knee'+side],bill,2);pixelLine(c,points['knee'+side],points['foot'+side],bill,2);const f=pose['foot'+side];shape([[f[0]-3,f[1]+4,f[2]],[f[0],f[1],f[2]+1],[f[0]+3,f[1]+4,f[2]]],bill);});
 }
 add('Pelican body','chest',(points.chest.depth+points.pelvis.depth)/2,()=>pixelVolume(c,[0,-1,12],7,12,7,d,pal));
 add('Pelican tail','tailTip',points.tailTip.depth,()=>shape([[-4,-8,13],pose.tailTip,[4,-8,13]],pal.shade));
 add('Pelican neck','neck',points.neck.depth,()=>{pixelLine(c,points.chest,points.neck,pal.outline,7);pixelLine(c,points.chest,points.neck,pal.body,5);pixelLine(c,points.neck,points.head,pal.body,5);});
 add('Pelican head','head',points.head.depth,()=>pixelVolume(c,pose.head,4.2,5,4,d,pal));
 add('Pelican bill and pouch','beak',points.beak.depth+.2,()=>{const h=pose.head,b=pose.beak,q=pose.pouch;shape([[h[0]-2,h[1]+3,h[2]-1],q,[b[0],b[1]-1,b[2]-2],[h[0]+2,h[1]+3,h[2]-1]],'#a9834d');shape([[h[0]-1,h[1]+3,h[2]-1],[q[0],q[1],q[2]+1],b,[h[0]+1,h[1]+3,h[2]-1]],bill);shape([[h[0]-2,h[1]+3,h[2]],b,[h[0]+2,h[1]+3,h[2]]],billLight);pixelLine(c,p([0,h[1]+3,h[2]-1]),points.beak,'#8c703d');});
 for(const side of['L','R'])add('Pelican eye '+side,'eye'+side,points.head.depth+.8,()=>{const q=points['eye'+side];c.fillStyle='#34474a';c.fillRect(Math.round(q.x)-1,Math.round(q.y)-1,2,2);c.fillStyle='#fff9e5';c.fillRect(Math.round(q.x)-1,Math.round(q.y)-1,1,1);});
 paintLayers(queue,model,d,c,points);return points;
}
