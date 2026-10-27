import {drawPumpkin} from './pumpkin-art.mjs';
import {projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';

export function drawSquashlingPixels(c,model,pose,d,time=0){
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),queue=[],pal=model.palette;
 const add=(id,bone,fn,depth=p[bone].depth)=>{if(model.visibility[bone]?.[d]!==false)queue.push({id,bone,bones:[bone],depth,fn});};
 const vine=(a,b,width=3)=>{pixelLine(c,p[a],p[b],pal.outline,width+1);pixelLine(c,p[a],p[b],pal.body,width);pixelLine(c,{x:p[a].x-1,y:p[a].y},{x:p[b].x-1,y:p[b].y},pal.light,1);};
 for(const side of ['L','R'])for(const [base,mid,end]of[['hip','knee','foot'],['root','rootMid','rootTip']])add('Pumpkin walking root '+base+' '+side,end+side,()=>{vine(base+side,mid+side,3);vine(mid+side,end+side,2);});
 add('Pumpkin twisted stalk','chest',()=>{vine('pelvis','chest',6);vine('chest','neck',5);vine('neck','head',4);});
 for(const side of['L','R']){
  add('Pumpkin vine arm '+side,'hand'+side,()=>{vine('shoulder'+side,'elbow'+side,3);vine('elbow'+side,'hand'+side,2);const hand=p['hand'+side];for(const sign of[-1,1])pixelLine(c,hand,{x:hand.x+sign*3,y:hand.y+3},pal.shade,1);});
  add('Pumpkin shoulder leaf '+side,'shoulder'+side,()=>{const a=p['shoulder'+side],b=p['elbow'+side],sign=side==='L'?-1:1;pixelPolygon(c,[a,{x:a.x+sign*8,y:a.y-4},{x:b.x+sign*4,y:b.y+1},b],pal.shade);pixelLine(c,a,b,pal.light,1);});
 }
 add('Pumpkin shell','head',()=>drawPumpkin(c,p.head.x,p.head.y,{direction:d,time,carved:false}));
 for(const side of['L','R'])if(model.visibility['eye'+side]?.[d]!==false)add('Pumpkin glowing eye '+side,'eye'+side,()=>{const e=p['eye'+side],sign=side==='L'?-1:1;pixelPolygon(c,[{x:e.x-sign*3,y:e.y-3},{x:e.x+sign*2,y:e.y},{x:e.x-sign*3,y:e.y+1}],'#35251d');c.fillStyle=Math.sin(time*9)>0?'#ffe49a':'#f9bc43';c.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,2,2);},p.head.depth+1);
 if(![3,4,5].includes(d))add('Pumpkin jagged grin','jaw',()=>{const a=p.jaw,w=d===2||d===6?6:12;pixelLine(c,{x:a.x-w/2,y:a.y},{x:a.x+w/2,y:a.y},'#39271e',4);for(let i=0;i<w;i++){c.fillStyle='#ffd16b';c.fillRect(Math.round(a.x-w/2+i),Math.round(a.y)+(i%4<2?-1:0),1,1);}},p.head.depth+1.2);
 paintLayers(queue,model,d,c,p);return p;
}
