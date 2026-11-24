import {projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export function drawChickenPixels(c,model,pose,d){
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[],pal={body:model.palette.body,shade:model.palette.shade,light:model.palette.light,outline:model.palette.outline};
 const add=(id,bone,fn,depth=p[bone].depth)=>{if(model.visibility[bone]?.[d]!==false)q.push({id,bone,bones:[bone],depth,fn});};
 for(const side of['L','R'])add('Chicken leg '+side,'foot'+side,()=>{pixelLine(c,p['hip'+side],p['knee'+side],'#bd883c',2);pixelLine(c,p['knee'+side],p['foot'+side],'#d6a44b',1);const foot=pose['foot'+side];for(const shift of[-1,1])pixelLine(c,p['foot'+side],projectPoint([foot[0]+shift*2,foot[1]+3,foot[2]],d),'#d6a44b',1);});
 add('Chicken tail','tailTip',()=>{const base=p.tailBase,tip=p.tailTip;pixelPolygon(c,[{x:base.x-3,y:base.y},tip,{x:tip.x+3,y:tip.y-4},{x:base.x+3,y:base.y}],pal.shade);pixelLine(c,base,{x:tip.x+1,y:tip.y-3},pal.light,2);});
 add('Chicken body','chest',()=>{const center=pose.chest.map((v,i)=>(v+pose.pelvis[i])/2);pixelVolume(c,center,5.5,8,6,d,pal);});
 for(const side of['L','R'])add('Chicken wing '+side,'wingTip'+side,()=>{const a=pose['shoulder'+side],b=pose['wingTip'+side],center=a.map((v,i)=>(v+b[i])/2);pixelVolume(c,center,2.3,5.5,3,d,{...pal,body:'#d0d5be',shade:'#8c9c8e'});pixelLine(c,p['elbow'+side],p['wingTip'+side],pal.light,1);});
 add('Chicken neck','neck',()=>{pixelLine(c,p.chest,p.head,pal.body,5);});
 add('Chicken head','head',()=>{pixelVolume(c,pose.head,3.2,3.2,3.4,d,pal);});
 add('Chicken beak','beak',()=>{const h=p.head,b=p.beak;pixelPolygon(c,[{x:h.x-2,y:h.y+1},b,{x:h.x+2,y:h.y+1}],'#dba03e');});
 add('Chicken red comb','comb',()=>{const a=p.comb;c.fillStyle='#a53538';c.fillRect(Math.round(a.x)-2,Math.round(a.y),4,3);c.fillStyle='#d65a4c';for(let i=-1;i<=1;i++)c.fillRect(Math.round(a.x+i*2),Math.round(a.y)-1-(i===0?1:0),1,3);});
 if(![3,4,5].includes(d))add('Chicken wattle','wattle',()=>{const a=p.wattle;c.fillStyle='#bc4140';c.fillRect(Math.round(a.x)-1,Math.round(a.y),2,3);});
 for(const side of['L','R'])if(model.visibility['eye'+side]?.[d]!==false)add('Chicken eye '+side,'eye'+side,()=>{const a=p['eye'+side];c.fillStyle='#293b35';c.fillRect(Math.round(a.x),Math.round(a.y),1,1);},p.head.depth+.7);
 paintLayers(q,model,d,c,p);return p;
}
