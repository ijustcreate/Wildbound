import {projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export function drawFoxPixels(c,model,pose,d){
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[],pal=model.palette;
 const fur={body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline},cream={...fur,body:'#eee0bd',light:'#fff0cf',shade:'#bea77e'};
 const add=(id,bone,fn,depth=p[bone].depth)=>{if(model.visibility[bone]?.[d]!==false)q.push({id,bone,bones:[bone],depth,fn});};
 const shape=(points,color)=>pixelPolygon(c,points.map(v=>projectPoint(v,d)),color);
 add('Fox bushy tail','tailMid',()=>{const mid=pose.tailBase.map((v,i)=>(v+pose.tailMid[i])/2),tip=pose.tailMid.map((v,i)=>v*.25+pose.tailTip[i]*.75);pixelLine(c,p.tailBase,p.tailMid,pal.body,7);pixelVolume(c,mid,5,9,5,d,fur);pixelVolume(c,pose.tailMid,5,7,5,d,fur);pixelVolume(c,tip,3.5,6,3.5,d,cream);}); for(const side of['L','R'])for(const [label,a,b,foot]of[['front','shoulder','elbow','frontPaw'],['rear','hip','knee','rearPaw']])add('Fox '+label+' leg '+side,foot+side,()=>{pixelLine(c,p[a+side],p[b+side],pal.outline,5);pixelLine(c,p[a+side],p[b+side],pal.body,3);pixelLine(c,p[b+side],p[foot+side],pal.shade,3);pixelVolume(c,pose[foot+side],2.2,3.2,2,d,cream);});
 add('Fox body','chest',()=>{const mid=pose.pelvis.map((v,i)=>(v+pose.chest[i])/2);pixelVolume(c,mid,6,12,6,d,fur);},(p.chest.depth+p.pelvis.depth)/2); add('Fox neck ruff','neck',()=>pixelVolume(c,pose.neck,5,5,6,d,cream));
 add('Fox head','head',()=>pixelVolume(c,pose.head,7,6,7,d,fur));
 for(const side of['L','R'])add('Fox tall ear '+side,'ear'+side,()=>{const e=pose['ear'+side];shape([[e[0]-3,e[1],e[2]-8],[e[0],e[1]-1,e[2]+3],[e[0]+3,e[1],e[2]-8]],pal.outline);shape([[e[0]-2,e[1]+.3,e[2]-7],[e[0],e[1],e[2]+1],[e[0]+2,e[1]+.3,e[2]-7]],pal.light);shape([[e[0]-1,e[1]+.6,e[2]-6],[e[0],e[1]+.5,e[2]-1],[e[0]+1,e[1]+.6,e[2]-6]],'#aa6655');});
 add('Fox cream muzzle','jaw',()=>{pixelVolume(c,pose.jaw,4,4,2.4,d,cream);const n=projectPoint([pose.jaw[0],pose.jaw[1]+3,pose.jaw[2]+1],d);c.fillStyle=pal.outline;c.fillRect(Math.round(n.x)-1,Math.round(n.y)-1,3,2);});
 for(const side of['L','R'])add('Fox eye '+side,'eye'+side,()=>{const e=p['eye'+side];c.fillStyle='#25392d';c.fillRect(Math.round(e.x)-2,Math.round(e.y)-1,4,3);c.fillStyle='#86ba58';c.fillRect(Math.round(e.x)-1,Math.round(e.y),2,2);c.fillStyle='#fff0ce';c.fillRect(Math.round(e.x),Math.round(e.y)-1,1,1);},p.head.depth+.7);
 paintLayers(q,model,d,c,p);return p;
}
