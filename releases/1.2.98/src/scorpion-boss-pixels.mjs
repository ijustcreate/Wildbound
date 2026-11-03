import {projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export function drawScorpionBossPixels(c,model,pose,d){
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[],pal=model.palette,armor={body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline};
 const add=(id,bone,fn,depth=p[bone].depth)=>{if(model.visibility[bone]?.[d]!==false)q.push({id,bone,bones:[bone],depth,fn});};
 for(const side of['L','R'])for(let i=0;i<4;i++)add('Scorpion leg '+i+' '+side,'foot'+i+side,()=>{for(const[a,b]of[['leg','knee'],['knee','foot']]){pixelLine(c,p[a+i+side],p[b+i+side],pal.outline,4);pixelLine(c,p[a+i+side],p[b+i+side],pal.body,2);}pixelVolume(c,pose['knee'+i+side],2,2,2,d,armor);});
 for(const[a,b,w]of[['pelvis','tailBase',8],['tailBase','tailMid',7],['tailMid','tailBend',6],['tailBend','tailCurve',5],['tailCurve','tailTip',4]])add('Scorpion tail '+b,b,()=>{pixelLine(c,p[a],p[b],pal.outline,w+2);pixelLine(c,p[a],p[b],pal.body,w);pixelVolume(c,pose[b],w*.55,w*.55,w*.55,d,armor);});
 add('Scorpion venom barb','tailTip',()=>{const a=pose.tailTip,base=projectPoint(a,d),end=projectPoint([a[0],a[1]+6,a[2]-5],d);pixelLine(c,base,end,pal.outline,4);pixelLine(c,base,end,pal.face,2);});
 add('Scorpion armored carapace','chest',()=>{const mid=pose.pelvis.map((v,i)=>(v+pose.chest[i])/2);pixelVolume(c,mid,10,17,7,d,armor);for(const offset of[-8,-2,4,10]){const a=projectPoint([mid[0]-7,mid[1]+offset,mid[2]+3],d),b=projectPoint([mid[0]+7,mid[1]+offset,mid[2]+3],d);pixelLine(c,a,b,pal.shade,1);}pixelLine(c,p.chest,p.head,pal.body,11);});
 add('Scorpion head','head',()=>pixelVolume(c,pose.head,6,6,4,d,armor));
 for(const side of['L','R']){
  add('Scorpion pincer '+side,'claw'+side,()=>{pixelLine(c,p['clawRoot'+side],p['clawElbow'+side],pal.outline,7);pixelLine(c,p['clawRoot'+side],p['clawElbow'+side],pal.body,5);pixelLine(c,p['clawElbow'+side],p['claw'+side],pal.outline,10);pixelLine(c,p['clawElbow'+side],p['claw'+side],pal.body,8);pixelVolume(c,pose['claw'+side],5,7,4,d,armor);for(const end of['clawTip','clawFixed']){pixelLine(c,p['claw'+side],p[end+side],pal.outline,4);pixelLine(c,p['claw'+side],p[end+side],pal.light,2);}});
  if(model.visibility['eye'+side]?.[d]!==false)add('Scorpion eye '+side,'eye'+side,()=>{const e=p['eye'+side];c.fillStyle=pal.outline;c.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,3,3);c.fillStyle=pal.detail;c.fillRect(Math.round(e.x),Math.round(e.y),1,1);},p.head.depth+.8);
 }
 paintLayers(q,model,d,c,p);return p;
}
