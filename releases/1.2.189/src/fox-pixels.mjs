import {projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export function drawFoxPixels(c,model,pose,d){
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[],pal=model.palette;
 const fur={body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline},cream={...fur,body:'#eee0bd',light:'#fff0cf',shade:'#bea77e'};
 const add=(id,bone,fn,depth=p[bone].depth)=>{if(model.visibility[bone]?.[d]!==false)q.push({id,bone,bones:[bone],depth,fn});};
 const shape=(points,color)=>pixelPolygon(c,points.map(v=>projectPoint(v,d)),color);
 add('Fox bushy tail','tailMid',()=>{
  if(d===4){
   // Rear view: the donor rig's centered tail vector collapses into a thin
   // vertical stripe. Draw the connected plume in screen space so its broad
   // curl reads behind the rump at the native sprite density.
   const {x,y}=p.pelvis,poly=pts=>pts.map(([dx,dy])=>({x:x+dx,y:y+dy}));
   pixelPolygon(c,poly([[1,3],[5,1],[8,-3],[9,-9],[7,-14],[9,-17],[13,-19],[12,-23],[7,-25],[3,-23],[0,-19],[-2,-14],[-3,-8],[-2,-3]]),pal.outline);
   pixelPolygon(c,poly([[2,1],[5,-1],[7,-5],[7,-10],[5,-14],[7,-17],[10,-19],[9,-22],[6,-22],[3,-20],[1,-16],[0,-11],[-1,-7],[0,-3]]),pal.body);
   pixelPolygon(c,poly([[2,-3],[5,-6],[5,-10],[4,-13],[6,-16],[9,-18],[8,-20],[6,-19],[3,-16],[2,-12],[1,-8]]),pal.light);
   pixelPolygon(c,poly([[7,-21],[10,-23],[11,-22],[10,-19],[8,-18],[6,-19]]),'#eee0bd');
  }else{
   const base=pose.tailBase,midJoint=pose.tailMid,tipJoint=pose.tailTip,mid=base.map((v,i)=>(v+midJoint[i])/2),tip=midJoint.map((v,i)=>v*.25+tipJoint[i]*.75);
   pixelLine(c,projectPoint(base,d),projectPoint(midJoint,d),pal.outline,9);pixelLine(c,projectPoint(base,d),projectPoint(midJoint,d),pal.body,7);pixelLine(c,projectPoint(midJoint,d),projectPoint(tipJoint,d),pal.outline,7);pixelLine(c,projectPoint(midJoint,d),projectPoint(tipJoint,d),pal.body,5);pixelVolume(c,mid,5,9,5,d,fur);pixelVolume(c,midJoint,5,7,5,d,fur);pixelVolume(c,tip,3.5,6,3.5,d,cream);
  }
 }); for(const side of['L','R'])for(const [label,a,b,foot]of[['front','shoulder','elbow','frontPaw'],['rear','hip','knee','rearPaw']])add('Fox '+label+' leg '+side,foot+side,()=>{pixelLine(c,p[a+side],p[b+side],pal.body,4);pixelLine(c,p[b+side],p[foot+side],pal.shade,3);pixelVolume(c,pose[foot+side],2.2,3.2,2,d,cream);});
 add('Fox body','chest',()=>{const mid=pose.pelvis.map((v,i)=>(v+pose.chest[i])/2);pixelVolume(c,mid,6,12,6,d,fur);},(p.chest.depth+p.pelvis.depth)/2); add('Fox neck ruff','neck',()=>pixelVolume(c,pose.neck,5,5,6,d,cream));
 add('Fox head','head',()=>pixelVolume(c,pose.head,7,6,7,d,fur));
 for(const side of['L','R'])add('Fox tall ear '+side,'ear'+side,()=>{const e=pose['ear'+side];shape([[e[0]-3,e[1],e[2]-8],[e[0],e[1]-1,e[2]+3],[e[0]+3,e[1],e[2]-8]],pal.outline);shape([[e[0]-2,e[1]+.3,e[2]-7],[e[0],e[1],e[2]+1],[e[0]+2,e[1]+.3,e[2]-7]],pal.light);shape([[e[0]-1,e[1]+.6,e[2]-6],[e[0],e[1]+.5,e[2]-1],[e[0]+1,e[1]+.6,e[2]-6]],'#aa6655');});
 add('Fox cream muzzle','jaw',()=>{pixelVolume(c,pose.jaw,4,4,2.4,d,cream);const n=projectPoint([pose.jaw[0],pose.jaw[1]+3,pose.jaw[2]+1],d);c.fillStyle=pal.outline;c.fillRect(Math.round(n.x)-1,Math.round(n.y)-1,3,2);});
 for(const side of['L','R'])add('Fox eye '+side,'eye'+side,()=>{const e=p['eye'+side];c.fillStyle='#25392d';c.fillRect(Math.round(e.x)-2,Math.round(e.y)-1,4,3);c.fillStyle='#86ba58';c.fillRect(Math.round(e.x)-1,Math.round(e.y),2,2);c.fillStyle='#fff0ce';c.fillRect(Math.round(e.x),Math.round(e.y)-1,1,1);},p.head.depth+.7);
 paintLayers(q,model,d,c,p);return p;
}
