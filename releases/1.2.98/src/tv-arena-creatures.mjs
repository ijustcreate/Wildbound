import {poseAt,projectPoint,facingIndex} from './player-motion.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
import {ARENA_PROP_SUBJECTS} from './tv-arena-art.mjs';
const clone=v=>structuredClone(v);
const palettes={bramblecap:{outline:'#302622',body:'#bc7841',shade:'#815035',light:'#dfa75e',cap:'#984c2c',capShade:'#642f26',capLight:'#bc6834',cream:'#f1d7a0',stem:'#d8bb81',stemShade:'#ab8757',moss:'#637f37',eye:'#342622'},mossback:{outline:'#243027',body:'#cc9141',shade:'#94612e',light:'#ebbe66',cap:'#477b3a',capShade:'#294f32',capLight:'#7c9e45',cream:'#f6dd9b',stem:'#cd9143',stemShade:'#95612e',moss:'#a1b751',eye:'#282722'}};
function makeRig(kind){
 const turtle=kind==='mossback';
 const j={pelvis:[0,0,9],chest:[0,0,14],head:[0,turtle?9:7,turtle?10:15],crown:[0,0,turtle?17:23],eyeL:[-3,11,turtle?14:18],eyeR:[3,11,turtle?14:18],footL:[-7,3,2],footR:[7,3,2],rearFootL:[-7,-6,2],rearFootR:[7,-6,2],tail:[0,-11,6]};
 const model={version:1,artGeneration:1,type:kind,name:turtle?'Mossback / ruin shellkeeper':'Bramblecap / rootfoot',palette:clone(palettes[kind]),shape:{width:turtle?30:32,height:turtle?30:34},joints:Object.fromEntries(Object.entries(j).map(([n,position])=>[n,{parent:n==='pelvis'?'':'pelvis',position}])),visibility:Object.fromEntries(Object.keys(j).map(n=>[n,Array.from({length:8},(_,d)=>!n.startsWith('eye')||![3,4,5].includes(d))])),clips:{}};
 for(const action of ['idle','walk','run','attack','hurt','death','jump','emerge','retract','shell','slide','wake']){
  const loop=['idle','walk','run','shell','slide'].includes(action),length=16;
  model.clips[action]={length,fps:action==='walk'?12:action==='run'?20:action==='idle'?6:16,loop,keys:Array.from({length:9},(_,i)=>{
   const t=i/8,phase=t*Math.PI*2,pulse=Math.sin(t*Math.PI),joints={};
   const all=(dx,dy,dz)=>{for(const n of Object.keys(j))joints[n]=[dx,dy,dz];};
   if(action==='idle'){all(0,0,Math.sin(phase)*.6);joints.head=[0,0,Math.sin(phase)*.9];}
   if(action==='walk'||action==='run'){
    const stride=action==='run'?5:3;all(0,0,Math.abs(Math.sin(phase))*1.1);
    for(const [n,offset] of [['footL',0],['footR',Math.PI],['rearFootL',Math.PI],['rearFootR',0]]){const s=Math.sin(phase+offset);joints[n]=[0,s*stride,Math.max(0,s)*2.5];}
    joints.crown=[Math.sin(phase)*.5,0,Math.abs(Math.sin(phase))*1.5];
   }
   if(action==='attack'){all(0,pulse*3,-pulse*2);joints.head=[0,pulse*7,-pulse*3];joints.crown=[0,pulse*2,-pulse*3];}
   if(action==='hurt'){all(Math.sin(phase)*2,0,-pulse*2);}
   if(action==='death'){all(t*4,0,-t*7);joints.crown=[t*4,0,-t*17];joints.head=[t*4,0,-t*9];}
   if(action==='jump'){all(0,0,pulse*7);joints.footL=[-pulse,0,pulse*10];joints.footR=[pulse,0,pulse*10];}
   if(action==='emerge')all(0,0,-(1-t)*26);
   if(['retract','shell','slide','wake'].includes(action)){
    const f=action==='retract'?t:action==='wake'?1-t:1;
    for(const n of ['head','eyeL','eyeR'])joints[n]=[0,-f*8,-f*7];
    for(const n of ['footL','footR','rearFootL','rearFootR'])joints[n]=[-j[n][0]*f*.5,-j[n][1]*f*.6,f*4];
    joints.crown=[0,0,-f*4+(action==='slide'?Math.sin(phase)*.7:0)];
   }
   return {frame:i*2,joints};
  })};
 }
 return model;
}
export function arenaCreatureAction(a){return a.animationAction||(a.hp<=0?'death':a.emerging>0?'emerge':a.shell?(a.shellSpeed?'slide':'shell'):a.hit>0?'hurt':a.attack>0?'attack':a.moving?'walk':'idle');}
function paint(c,a,time,m,supplied){
 const d=facingIndex(a.faceX??0,a.faceY??1),profile=d===2||d===6,rear=[3,4,5].includes(d),diagonal=d%2===1,side=d<4?-1:1,kind=m.type,turtle=kind==='mossback',action=arenaCreatureAction(a),clip=m.clips[action]||m.clips.idle;
 const frame=Number.isFinite(a.playerFrame)?a.playerFrame:Number.isFinite(a.poseTime)?a.poseTime*(clip.length-1):time*clip.fps;
 const pose=supplied||poseAt(m,action,frame),p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),pal=m.palette,layers=[];
 const poly=(points,color,x=0,y=0)=>pixelPolygon(c,points.map(([xx,yy])=>({x:Math.round(xx+x),y:Math.round(yy+y)})),color);
 const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const add=(id,bone,depth,fn)=>layers.push({id,bone,bones:[bone],depth,fn});
 const withdrawn=turtle&&['shell','slide'].includes(action);
 for(const name of withdrawn?[]:turtle?['footL','footR','rearFootL','rearFootR']:['footL','footR']){
  add('Root foot '+name,name,p[name].depth,()=>{if(withdrawn)return;const x=p[name].x,y=p[name].y;
   poly([[-6,0],[-6,-4],[-3,-6],[3,-5],[6,-2],[7,1],[3,3],[-5,3]],pal.outline,x,y);
   poly([[-5,0],[-4,-3],[-1,-4],[3,-3],[5,0],[2,1],[-4,1]],pal.body,x,y);r(pal.light,x-3,y-3,4,2);
   if(!turtle)r(pal.moss,x-3,y-5,6,2);
  });
 }
 if(turtle&&!withdrawn)add('Short tail','tail',p.tail.depth,()=>{poly([[-2,0],[0,-5],[3,-1],[2,2]],pal.body,p.tail.x,p.tail.y);});
 add('Stem body','chest',p.chest.depth+.1,()=>{
  if(turtle){const {x,y}=p.pelvis;poly([[-12,1],[-9,-2],[9,-2],[12,1],[8,5],[-8,5]],pal.outline,x,y);poly([[-9,1],[8,1],[7,3],[-7,3]],pal.shade,x,y);return;}
  const {x,y}=p.chest,w=turtle?11:9;
  poly([[-w,-7],[w,-7],[w+1,5],[6,10],[-6,10],[-w-1,5]],pal.outline,x,y);
  poly([[-w+2,-6],[w-2,-6],[w-1,5],[4,8],[-5,8],[-w+1,4]],pal.stemShade,x,y);
  poly([[-w+2,-6],[3,-6],[5,5],[-3,8],[-w+1,3]],pal.stem,x,y);
 });
 if(!withdrawn&&(!turtle||!rear))add(turtle?'Ochre head':'Stem face','head',p.head.depth+.3,()=>{
  if(withdrawn)return;const {x,y}=p.head,w=turtle?(profile?7:8):(profile?6:8),h=turtle?4:8;
  poly([[-w+2,-h], [w-2,-h],[w,-h+2],[w,h-1],[w-3,h+2],[-w+2,h+1],[-w,h-2],[-w,-h+2]],pal.outline,x,y);
  poly([[-w+2,-h+1],[w-2,-h+1],[w-1,h-1],[w-3,h],[-w+2,h-1]],pal.stem,x,y);
  if(profile&&turtle){r(pal.outline,x+side*7-2,y,5,4);r(pal.body,x+side*7-1,y,3,2);}
 });
 add(turtle?'Emerald shell':'Chestnut crown','crown',p.crown.depth+.2,()=>{
  const {x,y}=p.crown,w=turtle?(profile?15:16):(profile?15:18),h=turtle?12:11;
  poly([[-w,5],[-w,-1],[-w+4,-6],[-7,-h],[4,-h-1],[w-5,-8],[w-1,-3],[w+1,4],[w-3,7],[-w+3,7]],pal.outline,x,y);
  poly([[-w+1,3],[-w+2,-1],[-w+4,-5],[-6,-h+1],[4,-h],[w-6,-7],[w-2,-2],[w,3],[w-3,5],[-w+3,5]],pal.cap,x,y);
  poly([[-w+2,2],[-9,-3],[-4,-h+2],[3,-h+1],[1,-5],[w-5,0],[w-2,3],[-w+3,3]],pal.capLight,x,y);
  poly([[-w+2,4],[w-1,3],[w-3,6],[-w+4,6]],pal.capShade,x,y);
  if(turtle){
   for(const [xx,yy,ww] of (profile?[[0,-8,8],[-10,-3,6],[9,-1,4]]:diagonal?[[side*4,-8,9],[-side*9,-3,6],[side*11,-1,4]]:[[-3,-8,9],[-12,-2,6],[9,-2,6]])){
    poly([[xx-2,yy],[xx,yy-2],[xx+ww-3,yy-2],[xx+ww,yy+1],[xx+ww-2,yy+5],[xx,yy+5]],pal.outline,x,y);
    r(pal.body,x+xx,y+yy,ww-1,4);r(pal.light,x+xx,y+yy,Math.max(2,ww-3),2);
   }
   r(pal.capLight,x-1,y-h-4,2,5);r(pal.moss,x+1,y-h-5,4,2);
  }else{
   const spot=rear?side*8:profile?-4:diagonal?side*7:8;r(pal.cream,x+spot,y-h+3,4,3);r(pal.cream,x+spot+4,y-h+7,3,2);
   if(!rear)r(pal.stemShade,x-w+3,y+4,w*2-6,2);
  }
 });
 // Faces are hidden on rear views, foreshortened on diagonals and single-eyed in profile.
 if(!rear&&!withdrawn)add('Eyes and brow','head',p.head.depth+30,()=>{
  const {x,y}=p.head,shift=profile?side*4:diagonal?side*2:0;
  for(const s of profile?[side]:[-1,1]){const ex=x+shift+s*(profile?0:3);r(pal.cream,ex-1,y-4,3,5);r(pal.eye,ex,y-3,2,4);r(pal.outline,ex-2,y-6+(s===side&&diagonal?1:0),5,2);}
 });
 paintLayers(layers,m,d,c,p);return p;
}
const models=Object.fromEntries(['bramblecap','mossback'].map(k=>[k,makeRig(k)]));
export function replaceArenaRig(kind,model){
 const data=ARENA_SUBJECTS[kind]?.data;if(!data||model?.type!==kind||!model.joints||!model.clips?.idle)throw Error('Invalid arena rig: '+kind);
 for(const name of Object.keys(data.joints))if(!Array.isArray(model.joints[name]?.position)||model.joints[name].position.length!==3||!model.joints[name].position.every(Number.isFinite))throw Error('Invalid arena joint: '+name);
 const next=clone(model);for(const key of Object.keys(data))delete data[key];Object.assign(data,next);
}
export const ARENA_SUBJECTS={...Object.fromEntries(Object.entries(models).map(([kind,data])=>[kind,{name:data.name,data,defaults:()=>makeRig(kind),replace:m=>replaceArenaRig(kind,m),draw:(c,a,t,m=data,p=null)=>paint(c,a,t,m,p),sprite:kind,selected:'crown',palette:Object.keys(data.palette),shapeKeys:Object.keys(data.shape),tracks:['crown','head','footL','footR'],clip:'walk',scale:7}])),...ARENA_PROP_SUBJECTS};
export const arenaRigPack=()=>Object.fromEntries(Object.entries(ARENA_SUBJECTS).map(([k,s])=>[k,clone(s.data)]));
