import {poseAt,projectPoint,facingIndex} from './player-motion.mjs';
import {pixelLine,pixelVolume} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';

const sides=['L','R'],TAU=Math.PI*2;
const key=(m,frame,changes={})=>({frame,joints:Object.fromEntries(Object.keys(m.joints).map(n=>[n,changes[n]||[0,0,0]]))});
const clip=(m,fps,length,loop,poses)=>({fps,length,loop,keys:poses.map(([frame,p])=>key(m,frame,p))});
const body=z=>Object.fromEntries(['pelvis','chest','head','jawL','jawR'].map(n=>[n,[0,0,z]]));
export function defaultSpiderMotion(kind='spider') {
 const furry=kind==='tarantula';
 const m={version:1,artGeneration:2,type:kind,name:furry?'Sandy tarantula / eight articulated legs':'Black spider / eight articulated legs',
  palette:furry?{body:'#bf8655',shade:'#805135',light:'#efbd81',face:'#bc804a',eye:'#fff2c3',outline:'#352620',band:'#e6ad72',fur:'#f5c797',fang:'#ecd9ac'}:
   {body:'#3c4755',shade:'#222934',light:'#62738a',face:'#36414f',eye:'#d2e1d8',outline:'#131a21',band:'#58687c',fur:'#69798a',fang:'#d4d7bf'},
  shape:{bodyWidth:furry?12:9,abdomenLength:furry?13:11,abdomenHeight:furry?9:6,headRadius:furry?5.5:4,legWidth:furry?3:2,fur:furry?1:.5},
  joints:{pelvis:{parent:'',position:[0,-6,furry?10:8]},chest:{parent:'pelvis',position:[0,7,7]},head:{parent:'chest',position:[0,14,6]}},visibility:{},clips:{}};
 for(const side of sides){const sign=side==='L'?-1:1;
  for(let i=0;i<4;i++){
   m.joints['leg'+i+side]={parent:'pelvis',position:[sign*6,7-i*4,6]};
   m.joints['knee'+i+side]={parent:'leg'+i+side,position:[sign*(furry?12:14),[17,8,-5,-15][i],furry?8:6]};
   m.joints['foot'+i+side]={parent:'knee'+i+side,position:[sign*([16,22,22,17][i]-(furry?2:0)),[24,11,-9,-23][i],0]};
  }
  m.joints['jaw'+side]={parent:'head',position:[sign*3,19,3]};
 }
 for(const n of Object.keys(m.joints))m.visibility[n]=Array(8).fill(true);
 m.clips.idle=clip(m,6,12,true,Array.from({length:12},(_,f)=>{const a=f*TAU/12,p=body(Math.sin(a)*.25);for(const side of sides)p['jaw'+side]=[0,Math.sin(a)*.4,0];return [f,p];}));
 for(const action of ['walk','run','charge']){
  const stride=action==='walk'?4:action==='run'?6:8,lift=furry?2.5:3.5;
  m.clips[action]=clip(m,action==='walk'?12:18,12,true,Array.from({length:12},(_,f)=>{
   const t=f/12,p=body(Math.sin(t*TAU*2)*.35);
   for(const side of sides)for(let i=0;i<4;i++){
    // Alternating tetrapods: half the feet support the body during each swing.
    const u=(t+((i+(side==='L'?0:1))%2)*.5)%1,stance=u<.6,swing=stance?0:(u-.6)/.4;
    const y=stance?stride*(.5-u/.6):stride*(-.5+swing*swing*(3-2*swing)),z=stance?0:Math.sin(swing*Math.PI)*lift;
    p['knee'+i+side]=[0,y*.55,z*.5];p['foot'+i+side]=[0,y,z];
   }
   return [f,p];
  }));
 }
 const poised=(amount,reach=0)=>{const p=body(-amount);for(const side of sides){const sign=side==='L'?-1:1;p['head']=[0,reach,-amount];p['jaw'+side]=[sign*amount*.4,reach,-amount];p['knee0'+side]=[-sign*2,reach,amount*2];p['foot0'+side]=[-sign*4,reach,amount*3];}return p;};
 m.clips.windup=clip(m,14,8,false,[[0,{}],[4,poised(1)],[7,poised(2)]]);
 m.clips.attack=clip(m,24,8,false,[[0,poised(2)],[2,poised(.5,5)],[4,poised(.3,4)],[7,{}]]);
 m.clips.bite=structuredClone(m.clips.attack);
 m.clips.recover=clip(m,12,8,false,[[0,poised(1,2)],[7,{}]]);
 m.clips.hurt=clip(m,20,6,false,[[0,{}],[1,{...body(-1),pelvis:[2,-2,-1],chest:[2,-1,-1]}],[5,{}]]);
 m.clips.snared=clip(m,8,8,true,Array.from({length:8},(_,f)=>{const p=body(-1);for(const side of sides)for(let i=0;i<4;i++)p['foot'+i+side]=[0,Math.sin(f*Math.PI/4+i)*1.3,1];return [f,p];}));
 const dead=body(-5);for(const side of sides)for(let i=0;i<4;i++){const sign=side==='L'?-1:1;dead['knee'+i+side]=[-sign*5,0,-2];dead['foot'+i+side]=[-sign*13,(1.5-i)*3,3];}
 m.clips.death=clip(m,12,10,false,[[0,{}],[3,body(-2)],[6,dead],[9,dead]]);
 return m;
}
export function upgradeSpiderMotion(saved,legacy) {
 const m=structuredClone(saved);if(m.artGeneration===2)return m;
 const fresh=defaultSpiderMotion(saved.type);
 for(const field of ['palette','shape','joints','visibility','clips']){
  m[field]={...fresh[field],...m[field]};
  for(const [name,value] of Object.entries(fresh[field]))if(JSON.stringify(saved[field]?.[name])===JSON.stringify(legacy[field]?.[name]))m[field][name]=structuredClone(value);
 }
 if(m.name===legacy.name)m.name=fresh.name;m.artGeneration=2;return m;
}
export function spiderAction(a) {
 if(a.animationAction)return a.animationAction;
 if(a.hp<=0||a.dead)return 'death';if(a.flash>0||a.hit>0)return 'hurt';if(a.state==='snared')return 'snared';
 if(a.attack>0)return 'attack';if(['windup','charge','recover'].includes(a.state))return a.state;
 return a.moving?(a.walking||(a.locomotionSpeed??a.speed??70)<=85?'walk':'run'):'idle';
}
export function drawSpider(c,a,time,m,suppliedPose=null) {
 const action=spiderAction(a),cl=m.clips[action]||m.clips.idle;
 const frame=Number.isFinite(a.playerFrame)?a.playerFrame:Number.isFinite(a.poseTime)?a.poseTime*(cl.length-1):
  action==='attack'?Math.max(0,1-(a.attack||0)/.25)*(cl.length-1):action==='hurt'?Math.max(0,1-(a.flash||a.hit||0)/.2)*(cl.length-1):
  a.moving?(a.step||0)/14*cl.length:(time+(a.id||0)*.071)*cl.fps;
 const pose=suppliedPose||poseAt(m,action,frame),d=facingIndex(a.faceX,a.faceY),p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),pal=m.palette,s=m.shape,layers=[];
 const visible=n=>m.visibility[n]?.[d]!==false;
 for(const side of sides)for(let i=0;i<4;i++){
  const r='leg'+i+side,k='knee'+i+side,f='foot'+i+side;
  if(!visible(f))continue;
  layers.push({id:f,bone:r,bones:[r,k,f],depth:p[r].depth+(p[f].depth-p[r].depth)*.45,fn:()=>{
   if(visible(r)){pixelLine(c,p[r],p[k],pal.outline,s.legWidth+2);pixelLine(c,p[r],p[k],pal.shade,s.legWidth);}
   if(visible(k)){pixelLine(c,p[k],p[f],pal.outline,s.legWidth+1);pixelLine(c,p[k],p[f],pal.body,s.legWidth-1);
    for(const t of s.fur>.5?[.15,.45,.8]:[.2]){const q={x:p[k].x+(p[f].x-p[k].x)*t,y:p[k].y+(p[f].y-p[k].y)*t};c.fillStyle=pal.band;c.fillRect(Math.round(q.x)-1,Math.round(q.y)-1,Math.round(s.legWidth),2);}
   }
   if(s.fur>.5&&visible(r))for(let t=1;t<4;t++){const x=Math.round(p[r].x+(p[k].x-p[r].x)*t/4),y=Math.round(p[r].y+(p[k].y-p[r].y)*t/4);c.fillStyle=pal.fur;c.fillRect(x-1,y-2,1,2);}
  }});
 }
 if(visible('pelvis'))layers.push({id:'Body',bone:'pelvis',bones:['pelvis'],depth:p.pelvis.depth,fn:()=>{
  pixelVolume(c,pose.pelvis,s.bodyWidth,s.abdomenLength,s.abdomenHeight,d,pal);
  if(s.fur>.5)for(let i=0;i<9;i++){const a=i*TAU/9,q=projectPoint([pose.pelvis[0]+Math.cos(a)*s.bodyWidth*.85,pose.pelvis[1]+Math.sin(a)*s.abdomenLength*.8,pose.pelvis[2]+4],d);c.fillStyle=pal.fur;c.fillRect(Math.round(q.x),Math.round(q.y),2,1);}
 }});
 if(visible('chest'))layers.push({id:'Thorax',bone:'chest',bones:['chest'],depth:p.chest.depth,fn:()=>pixelVolume(c,pose.chest,s.headRadius+1,6,4.5,d,{...pal,body:pal.face})});
 if(visible('head'))layers.push({id:'Head',bone:'head',bones:['head'],depth:p.head.depth,fn:()=>{
  pixelVolume(c,pose.head,s.headRadius,4,3,d,{...pal,body:pal.face});
  if(d!==3&&d!==4&&d!==5)for(const side of sides){if(d===2&&side==='R'||d===6&&side==='L')continue;const sign=side==='L'?-1:1,q=projectPoint([pose.head[0]+sign*3,pose.head[1]+2,pose.head[2]+2],d);c.fillStyle=pal.eye;c.fillRect(Math.round(q.x)-1,Math.round(q.y)-1,3,3);c.fillStyle=pal.outline;c.fillRect(Math.round(q.x),Math.round(q.y),2,2);}
 }});
 for(const side of sides){const jaw='jaw'+side,sign=side==='L'?-1:1;if(visible(jaw))layers.push({id:jaw,bone:'head',bones:['head',jaw],depth:p[jaw].depth,fn:()=>{
  const base=projectPoint([pose.head[0]+sign*2,pose.head[1]+2,pose.head[2]-1],d),tip={x:p[jaw].x-sign,y:p[jaw].y+2};
  pixelLine(c,base,p[jaw],pal.outline,3);pixelLine(c,p[jaw],tip,pal.fang,2);
 }});}
 c.save();if(a.kind==='baby_spider')c.scale(.62,.62);paintLayers(layers,m,d,c,p);c.restore();return p;
}
