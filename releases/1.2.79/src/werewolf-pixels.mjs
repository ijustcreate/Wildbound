import {projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export function drawWerewolfPixels(c,model,pose,d){
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[],pal=model.palette,fur={body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline};
 const add=(id,bone,fn,depth=p[bone].depth)=>{if(model.visibility[bone]?.[d]!==false)q.push({id,bone,bones:[bone],depth,fn});};
 for(const side of['L','R']){
  add('Werewolf leg '+side,'foot'+side,()=>{pixelLine(c,p['hip'+side],p['knee'+side],pal.outline,7);pixelLine(c,p['hip'+side],p['knee'+side],pal.body,5);pixelLine(c,p['knee'+side],p['foot'+side],pal.shade,4);pixelVolume(c,pose['foot'+side],3,4,2,d,fur);const foot=p['foot'+side];for(let i=-1;i<=1;i++){c.fillStyle=pal.face;c.fillRect(Math.round(foot.x+i*2),Math.round(foot.y)+1,1,2);}});
  add('Werewolf arm '+side,'hand'+side,()=>{pixelLine(c,p['shoulder'+side],p['elbow'+side],pal.outline,8);pixelLine(c,p['shoulder'+side],p['elbow'+side],pal.body,6);pixelLine(c,p['elbow'+side],p['hand'+side],pal.shade,5);pixelVolume(c,pose['hand'+side],3.3,3,3.5,d,fur);const h=pose['hand'+side];for(let i=-1;i<=1;i++){const end=projectPoint([h[0]+i*2,h[1]+3,h[2]-5],d);pixelLine(c,p['hand'+side],end,pal.outline,2);pixelLine(c,{x:end.x,y:end.y-1},end,pal.face,1);}});
 }
 add('Werewolf torso','chest',()=>{pixelLine(c,p.pelvis,p.chest,pal.outline,13);pixelLine(c,p.pelvis,p.chest,pal.body,11);pixelVolume(c,pose.chest,8,5,6,d,fur);pixelLine(c,p.chest,p.neck,pal.body,8);const h=p.pelvis;pixelPolygon(c,[{x:h.x-6,y:h.y-2},{x:h.x+6,y:h.y-2},{x:h.x+3,y:h.y+8},{x:h.x-2,y:h.y+6}], '#886846');pixelLine(c,{x:h.x-6,y:h.y-2},{x:h.x+6,y:h.y-2},'#b7995f',2);});
 add('Werewolf head','head',()=>{pixelLine(c,p.neck,p.head,pal.body,7);pixelVolume(c,pose.head,5,5,5,d,fur);});
 for(const side of['L','R'])add('Werewolf ear '+side,'ear'+side,()=>{const e=pose['ear'+side],v=v=>projectPoint(v,d);pixelPolygon(c,[[e[0]-3,e[1],e[2]-4],[e[0],e[1]-1,e[2]+3],[e[0]+2,e[1],e[2]-4]].map(v),pal.outline);pixelPolygon(c,[[e[0]-2,e[1],e[2]-3],[e[0],e[1],e[2]+1],[e[0]+1,e[1],e[2]-3]].map(v),pal.light);});
 if(![3,4,5].includes(d))add('Werewolf muzzle and fangs','jaw',()=>{pixelLine(c,p.head,p.muzzle,pal.shade,5);pixelVolume(c,pose.muzzle,3.5,3,2,d,{...fur,body:pal.face,light:'#d7c6a1'});pixelLine(c,p.head,p.jaw,pal.outline,2);const j=p.jaw;c.fillStyle='#efe0bb';c.fillRect(Math.round(j.x)-2,Math.round(j.y),1,3);c.fillRect(Math.round(j.x)+2,Math.round(j.y),1,3);const m=p.muzzle;c.fillStyle=pal.outline;c.fillRect(Math.round(m.x)-1,Math.round(m.y)-1,3,1);},p.head.depth+.2);
 for(const side of['L','R'])if(model.visibility['eye'+side]?.[d]!==false)add('Werewolf eye '+side,'eye'+side,()=>{const e=p['eye'+side];c.fillStyle=pal.outline;c.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,3,2);c.fillStyle=pal.detail;c.fillRect(Math.round(e.x),Math.round(e.y),1,1);},p.head.depth+.8);
 paintLayers(q,model,d,c,p);return p;
}
