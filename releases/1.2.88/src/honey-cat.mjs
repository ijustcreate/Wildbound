import data from './graveyard_cat-donor-data.mjs';
import {poseAt,projectPoint,facingIndex,validateMotion} from './player-motion.mjs';
import {pixelVolume,pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
export function defaultHoneyCat(){return {version:1,type:'graveyard_cat',name:'Cemetery cat / Honey rig',...structuredClone(data),palette:{body:'#3e4147',shade:'#272f35',light:'#646d70',outline:'#222c30',cream:'#ebe4cd',eye:'#b7ce77',nose:'#ce9b89'},shape:{bodyWidth:4,headRadius:4.5,limbWidth:2.5,tailWidth:2},visibility:Object.fromEntries(Object.keys(data.joints).map(n=>[n,Array.from({length:8},(_,d)=>!n.startsWith('eye')||(![3,4,5].includes(d)&&!(n==='eyeR'&&d===2)&&!(n==='eyeL'&&d===6)))]))};}
export const honeyCatMotion=defaultHoneyCat();
export const validateHoneyCat=m=>m?.type==='graveyard_cat'&&validateMotion(m,defaultHoneyCat());
export function replaceHoneyCat(m){if(!validateHoneyCat(m))throw Error('Invalid cemetery cat rig');Object.assign(honeyCatMotion,structuredClone(m));}
export function drawHoneyCat(c,a,time=0,model=honeyCatMotion,supplied=null){
 const action=a.animationAction||(a.hp<=0&&a.hp!==undefined?'death':a.moving?(a.idle==='run'?'run':'walk'):a.idle==='sleep'?'sleep':a.idle==='sit'?'sit':'idle');
 const chosen=model.clips[action]?action:'idle',clip=model.clips[chosen],frame=a.playerFrame??(['sit','sleep'].includes(chosen)?clip.length-1:time*clip.fps),pose=supplied||poseAt(model,chosen,frame),d=facingIndex(a.faceX,a.faceY),p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[],pal=model.palette;
 const fur={body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline},white={...fur,body:pal.cream,light:'#fff4da',shade:'#a9b7a7'};
 const add=(id,bone,fn,depth=p[bone].depth)=>{if(model.visibility[bone]?.[d]!==false)q.push({id,bone,bones:[bone],depth,fn});};
 add('Cat flexible tail','tailMid',()=>{pixelLine(c,p.tailBase,p.tailMid,pal.outline,3);pixelLine(c,p.tailMid,p.tailTip,pal.body,2);});
 for(const side of['L','R'])for(const[a,b,end]of[['shoulder','elbow','frontPaw'],['hip','knee','rearPaw']])add('Cat '+end+' '+side,end+side,()=>{pixelLine(c,p[a+side],p[b+side],pal.body,3);pixelLine(c,p[b+side],p[end+side],pal.shade,2);pixelVolume(c,pose[end+side],1.8,2.4,1.6,d,white);});
 add('Cat body','chest',()=>{const mid=pose.pelvis.map((v,i)=>(v+pose.chest[i])/2);pixelVolume(c,mid,4,9,4.5,d,fur);});
 add('Cat white bib','neck',()=>pixelVolume(c,pose.neck,3,3.5,4,d,white));
 add('Cat head','head',()=>pixelVolume(c,pose.head,4.6,4,4.4,d,fur));
 for(const side of['L','R'])add('Cat ear '+side,'ear'+side,()=>{const e=pose['ear'+side],shape=v=>projectPoint(v,d);pixelPolygon(c,[[e[0]-2,e[1],e[2]-1],[e[0],e[1]-1,e[2]+4],[e[0]+2,e[1],e[2]-1]].map(shape),pal.body);pixelPolygon(c,[[e[0]-1,e[1]+.4,e[2]],[e[0],e[1],e[2]+2],[e[0]+1,e[1]+.4,e[2]]].map(shape),pal.nose);});
 if(![3,4,5].includes(d))add('Cat cream muzzle','jaw',()=>{pixelVolume(c,pose.jaw,3,2.3,1.8,d,white);const j=p.jaw;c.fillStyle=pal.nose;c.fillRect(Math.round(j.x),Math.round(j.y)-1,2,1);for(const sign of[-1,1])pixelLine(c,{x:j.x+sign*2,y:j.y},{x:j.x+sign*5,y:j.y-1},pal.cream,1);},p.head.depth+.2);
 for(const side of['L','R'])if(model.visibility['eye'+side]?.[d]!==false)add('Cat eye '+side,'eye'+side,()=>{const e=p['eye'+side];c.fillStyle=pal.outline;c.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,3,2);if(chosen!=='sleep'){c.fillStyle=pal.eye;c.fillRect(Math.round(e.x)-1,Math.round(e.y),2,1);}},p.head.depth+.8);
 paintLayers(q,model,d,c,p);return p;
}
