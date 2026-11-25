import {poseAt,projectPoint,facingIndex} from './player-motion.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
import {ARENA_PROP_SUBJECTS} from './tv-arena-art.mjs';
import {makeArenaRigV2 as makeRig} from './tv-arena-creature-design.mjs';
const clone=v=>structuredClone(v);
export function arenaCreatureAction(a){return a.animationAction||(a.hp<=0?'death':a.emerging>0?'emerge':a.shell?(a.shellSpeed?'slide':'shell'):a.hit>0?'hurt':a.attack>0?'attack':a.moving?'walk':'idle');}
function paint(c,a,time,m,supplied){
 const d=facingIndex(a.faceX??0,a.faceY??1),profile=d===2||d===6,rear=[3,4,5].includes(d),diagonal=d%2===1,side=d<4?-1:1,kind=m.type,turtle=kind==='mossback',action=arenaCreatureAction(a),clip=m.clips[action]||m.clips.idle;
 const frame=Number.isFinite(a.playerFrame)?a.playerFrame:Number.isFinite(a.poseTime)?a.poseTime*(clip.length-1):['walk','run'].includes(action)&&Number.isFinite(a.step)?a.step*2:time*clip.fps;
 const pose=supplied||poseAt(m,action,frame),p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),pal=m.palette,layers=[];
 const poly=(points,color,x=0,y=0)=>pixelPolygon(c,points.map(([xx,yy])=>({x:Math.round(xx+x),y:Math.round(yy+y)})),color);
 const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const add=(id,bone,depth,fn)=>layers.push({id,bone,bones:[bone],depth,fn});
 const progress=Math.max(0,Math.min(1,frame/(clip.length-1)));
 const withdrawn=turtle&&(['shell','slide'].includes(action)||action==='retract'&&progress>.74||action==='wake'&&progress<.24);
 for(const name of withdrawn?[]:turtle?['footL','footR','rearFootL','rearFootR']:['footL','footR']){
  add('Root foot '+name,name,p[name].depth,()=>{if(withdrawn)return;const x=p[name].x,y=p[name].y;
   poly([[-7,1],[-7,-3],[-4,-6],[1,-7],[5,-4],[7,-1],[8,2],[-6,2]],pal.outline,x,y);
   poly([[-5,0],[-5,-3],[-2,-5],[2,-5],[5,-2],[6,0]],pal.shade,x,y);
   poly([[-5,0],[-4,-3],[-1,-5],[2,-4],[3,0]],pal.body,x,y);r(pal.light,x-3,y-3,3,3);
   if(turtle){r(pal.light,x+2,y-1,2,2);r(pal.shade,x+1,y-4,2,2);}
  });
 }
 if(turtle&&!withdrawn)add('Short tail','tail',p.tail.depth,()=>{poly([[-2,0],[0,-5],[3,-1],[2,2]],pal.body,p.tail.x,p.tail.y);});
 add('Stem body','chest',p.chest.depth+.1,()=>{
  if(turtle){const {x,y}=p.pelvis;if(withdrawn){poly([[-13,0],[-9,-2],[9,-2],[13,0],[9,2],[-9,2]],pal.outline,x,p.crown.y+7);return;}poly([[-14,-2],[-10,-6],[9,-5],[14,0],[9,6],[-8,6]],pal.outline,x,y);poly([[-11,-2],[-8,-4],[8,-3],[11,0],[7,4],[-7,4]],pal.shade,x,y);poly([[-10,-2],[5,-3],[7,1],[3,4],[-6,3]],pal.cream,x,y);return;}
  const {x,y}=p.chest,w=turtle?11:9;
  poly([[-w,-8],[w,-8],[w+3,3],[w,8],[3,10],[-6,8],[-w-3,3]],pal.outline,x,y);
  poly([[-w+1,-7],[w-1,-7],[w+1,3],[w-2,6],[2,8],[-6,6],[-w-1,2]],pal.stemShade,x,y);
  poly([[-w+1,-7],[2,-7],[5,2],[1,7],[-6,5],[-w,1]],pal.stem,x,y);
  r(pal.cream,x-6,y-5,5,3);
 });
 if(!withdrawn&&(!turtle||!rear))add(turtle?'Ochre head':'Stem face','head',p.head.depth+.3,()=>{
  if(withdrawn)return;const {x,y}=p.head,w=turtle?(profile?9:10):(profile?7:9),h=turtle?7:8;
  poly([[-w+2,-h], [w-2,-h],[w,-h+2],[w,h-1],[w-3,h+2],[-w+2,h+1],[-w,h-2],[-w,-h+2]],pal.outline,x,y);
  poly([[-w+2,-h+1],[w-2,-h+1],[w-1,h-1],[w-3,h],[-w+2,h-1]],turtle?pal.body:pal.stem,x,y);
  poly([[-w+3,-h+1],[1,-h+1],[3,-h+4],[-1,-h+5],[-w+2,-h+4]],turtle?pal.light:pal.cream,x,y);
  if(profile&&turtle){poly([[side*6,0],[side*11,-1],[side*13,2],[side*10,5],[side*6,4]],pal.outline,x,y);r(pal.shade,x+side*9-1,y+1,3,2);}
 });
 add(turtle?'Emerald shell':'Chestnut crown','crown',p.crown.depth+.2,()=>{
  const {x,y}=p.crown,w=turtle?(profile?17:18):(profile?18:20),h=turtle?14:12;
  poly([[-w,5],[-w-1,1],[-w+2,-4],[-w+7,-9],[-6,-h],[3,-h],[10,-h+3],[w-3,-5],[w,-1],[w+1,5],[w-3,8],[-w+3,8]],pal.outline,x,y);
  poly([[-w+1,4],[-w+1,0],[-w+4,-5],[-6,-h+1],[3,-h+1],[10,-h+4],[w-2,-3],[w-1,4],[w-4,6],[-w+4,6]],pal.capShade,x,y);
  poly([[-w+1,2],[-w+4,-4],[-6,-h+1],[3,-h+1],[9,-h+4],[w-5,-2],[w-3,3],[3,4],[-w+3,4]],pal.cap,x,y);
  poly([[-w+3,0],[-w+6,-5],[-6,-h+2],[1,-h+2],[3,-h+5],[-5,-5],[-9,0]],pal.capLight,x,y);
  if(turtle){
   for(const [xx,yy,ww] of (profile?[[-4,-8,11],[-13,-2,8],[8,-1,7]]:diagonal?[[side*2-4,-9,11],[-side*10-3,-1,8],[side*11-2,-1,6]]:[[-5,-9,11],[-14,-1,9],[7,-1,9]])){
    poly([[xx-2,yy],[xx,yy-3],[xx+ww-3,yy-3],[xx+ww,yy],[xx+ww-2,yy+5],[xx,yy+5]],pal.capShade,x,y);
    poly([[xx-1,yy],[xx+1,yy-2],[xx+ww-4,yy-2],[xx+ww-1,yy],[xx+ww-3,yy+3],[xx+1,yy+3]],yy< -4?pal.capLight:pal.cap,x,y);
   }
   poly([[-w+2,4],[-8,5],[0,4],[10,5],[w-2,3],[w-3,6],[8,7],[-2,6],[-10,7],[-w+3,6]],pal.body,x,y);
   r(pal.light,x-w+4,y+4,9,2);r(pal.capShade,x-1,y-h-4,2,5);r(pal.moss,x+1,y-h-6,4,3);r(pal.capLight,x-4,y-h-5,4,3);
  }else{
   if(!rear){const spot=profile?side*5:diagonal?side*6:-6;poly([[spot-3,-8],[spot,-10],[spot+4,-9],[spot+2,-7],[spot,-5],[spot+2,-4],[spot+4,-5],[spot+3,-2],[spot,-2],[spot-3,-4]],pal.cream,x,y);}
   const mx=profile?-side*8:rear?side*6:10;r(pal.capShade,x+mx-2,y-8,7,4);r(pal.moss,x+mx-2,y-9,5,3);r(pal.capLight,x-w+4,y+3,9,2);
  }
 });
 // Faces are hidden on rear views, foreshortened on diagonals and single-eyed in profile.
 if(!rear&&!withdrawn)add('Eyes and brow','head',p.head.depth+30,()=>{
  const {x,y}=p.head,shift=profile?side*4:diagonal?side*2:0;
  for(const s of profile?[side]:[-1,1]){const ex=x+shift+s*(profile?0:4);r(pal.stemShade,ex-3,y-5,6,7);r(pal.cream,ex-2,y-5,5,6);r(pal.eye,ex+(profile?side:0),y-4,2,4);r(pal.outline,ex-3,y-7+(s===side&&diagonal?1:0),6,2);}
  if(!profile){r(pal.shade,x-2,y+4,4,1);r(pal.outline,x-1,y+3,2,1);}else if(!turtle)r(pal.outline,x+side*4-1,y+4,3,1);
 });
 if(withdrawn){const source=m.boneSprites?.['Stem body']?.[d],body=layers.find(l=>l.id==='Stem body');if(source&&body){const low=Math.round(p.crown.y)+6,high=low+2;body.sprite={...source,pixels:source.pixels.map((v,i)=>{const y=Math.round(p.chest.y)+source.y+Math.floor(i/source.width);return y>=low&&y<=high?v:0;})};}}
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
