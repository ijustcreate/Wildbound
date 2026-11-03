import {projectPoint} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export const DRAGON_PALETTES={red:{body:'#ab423d',shade:'#652d38',light:'#dc7454',outline:'#342b34',face:'#be5340',detail:'#efd19a',eye:'#f9d45a'},blue:{body:'#497eae',shade:'#354b79',light:'#80b9d0',outline:'#26364b',face:'#609bbf',detail:'#d8eddf',eye:'#d4ffff'},bone:{body:'#c7bba0',shade:'#827967',light:'#eee1bf',outline:'#363542',face:'#e1d4b4',detail:'#fff0cf',eye:'#bc85f3'}};
export function drawDragonPixels(c,actor,model,pose,d){
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[],pal=actor.dragonVariant?DRAGON_PALETTES[actor.dragonVariant]:model.palette,bone=actor.dragonVariant==='bone';
 const add=(id,name,fn,depth=p[name].depth)=>q.push({id,bone:name,bones:[name],depth,fn});
 const line=(a,b,w,col)=>pixelLine(c,p[a],p[b],col,w);
 for(const side of['L','R']){
  const root='wingRoot'+side,tip='wingTip'+side,finger='wingFinger'+side;
  add('Dragon wing '+side,root,()=>{const a=p[root],b=p[tip],e=p[finger],h=p.pelvis,mid={x:(b.x+e.x)/2,y:(b.y+e.y)/2};if(!bone){pixelPolygon(c,[a,b,mid,e,h],pal.outline);pixelPolygon(c,[a,{x:b.x-1,y:b.y+1},mid,{x:e.x-1,y:e.y+1},h],pal.shade);pixelPolygon(c,[a,b,mid],pal.body);}for(const end of[b,mid,e,h])pixelLine(c,a,end,pal.light,bone?2:1);pixelLine(c,a,b,pal.detail,2);},(p[root].depth+p[tip].depth)/2);
 }
 add('Dragon tail','tailMid',()=>{line('pelvis','tailBase',bone?4:8,pal.shade);line('tailBase','tailMid',bone?3:6,pal.body);line('tailMid','tailTip',bone?2:3,pal.light);for(let i=1;i<7;i++){const a=p.tailBase,b=p.tailTip,t=i/7,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;pixelPolygon(c,[{x:x-2,y},{x,y:y-4},{x:x+2,y}],pal.detail);}});
 for(const side of['L','R'])for(const[a,b,foot]of[['shoulder','elbow','frontPaw'],['hip','knee','rearPaw']])add('Dragon '+foot+' '+side,foot+side,()=>{for(const[x,y]of[[a,b],[b,foot]]){line(x+side,y+side,bone?4:7,pal.outline);line(x+side,y+side,bone?2:5,pal.body);}pixelVolume(c,pose[foot+side],3,5,2,d,pal);const f=p[foot+side];for(let i=-1;i<=1;i++){c.fillStyle=pal.detail;c.fillRect(Math.round(f.x+i*2),Math.round(f.y)+1,1,2);}});
 add('Dragon ribcage','chest',()=>{line('pelvis','chest',bone?7:18,pal.outline);line('pelvis','chest',bone?4:15,pal.body);if(bone){for(let i=0;i<5;i++){const t=(i+1)/6,center=pose.pelvis.map((v,n)=>v+(pose.chest[n]-v)*t);const a=projectPoint([center[0]-7,center[1],center[2]-1],d),b=projectPoint([center[0]+7,center[1],center[2]-1],d);pixelLine(c,a,b,pal.light,2);}}else{line('pelvis','chest',7,pal.light);}line('chest','neck',bone?3:8,pal.body);});
 add('Dragon neck','neck',()=>{line('neck','head',bone?3:7,pal.outline);line('neck','head',bone?2:5,pal.body);});
 add('Dragon skull','head',()=>{pixelVolume(c,pose.head,5,7,5,d,pal);line('head','snout',bone?5:7,pal.body);pixelVolume(c,pose.snout,4,4,2.5,d,pal);line('head','jaw',bone?2:3,pal.shade);const j=p.jaw;c.fillStyle=pal.detail;for(let i=-2;i<=2;i+=2)c.fillRect(Math.round(j.x+i),Math.round(j.y),1,2);});
 for(const side of['L','R']){
  add('Dragon horn '+side,'horn'+side,()=>{line('horn'+side,'hornTip'+side,3,pal.outline);line('horn'+side,'hornTip'+side,1,pal.detail);});
  if(model.visibility['eye'+side]?.[d]!==false)add('Dragon eye '+side,'eye'+side,()=>{const e=p['eye'+side];c.fillStyle=pal.outline;c.fillRect(Math.round(e.x)-2,Math.round(e.y)-1,4,3);c.fillStyle=pal.eye;c.fillRect(Math.round(e.x)-1,Math.round(e.y),2,1);},p.head.depth+.8);
 }
 paintLayers(q,model,d,c,p);return p;
}
