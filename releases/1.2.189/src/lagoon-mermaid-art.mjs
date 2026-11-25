import {facingIndex,poseAt,projectPoint,withPlayerPoseCache} from './player-motion.mjs';
import {drawNativeArm,drawNativeTorso} from './native-humanoid-art.mjs';
import {drawDefaultExplorerEyes,drawDefaultExplorerSkull} from './default-explorer-head.mjs';
import {paintLayers} from './render-order.mjs';
import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {lagoonMermaidMotion} from './lagoon-mermaid-rig.mjs';

// A seated head and shoulders match Wildbound's explorers. A low curved
// tail and contrasting two-fluke silhouette carry the character farther
// along the rock or across the water without enlarging the humanoid parts.
const styles=[
 {hairShape:'waves',pin:'#a7d2a7',skin:'#d39b73',bodice:'#698059',eyes:'#5e7860',
  hair:['#211d2b','#30283a','#433549','#634f60'],
  tail:['#204644','#286a5d','#439a78','#77c393','#a8d5aa']},
 {hairShape:'knot',pin:'#baa9cf',skin:'#e8b690',bodice:'#977491',eyes:'#557879',
  hair:['#59402e','#95704a','#cda569','#edc98c'],
  tail:['#255350','#387c77','#65afa0','#91cfb5','#b8e6c4']},
 {hairShape:'sweep',pin:'#f2cd90',skin:'#bc805c',bodice:'#ad766e',eyes:'#5e7569',
  hair:['#562b31','#8f4240','#c16650','#df8c64'],
  tail:['#24394f','#365977','#5386a4','#82b3c6','#b2d4d0']},
 {hairShape:'braid',pin:'#afc0da',skin:'#e2b28b',bodice:'#748baa',eyes:'#626c9a',
  hair:['#5f4937','#a6804e','#d9b579','#ead29b'],
  tail:['#393a64','#535882','#7778a7','#9b9bc5','#a6ced0']},
];
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const polygon=(c,points,color)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
const offset=(p,x,y)=>[p.x+x,p.y+y];
function line(c,a,b,color,width=1){pixelLine(c,{x:a[0],y:a[1]},{x:b[0],y:b[1]},color,width);}
function mermaidStyle(actor,model){
 const index=Number.isInteger(actor.mermaidStyle)?actor.mermaidStyle:0;
 const style=styles[index]||styles[0];
 if(index!==0)return style;
 const {palette:p}=model;
 return {...style,skin:p.skin,bodice:p.bodice,eyes:p.eyes,
  hair:[p.hairEdge,p.hair,p.hairShade,p.hairLight],
  tail:[p.tailInk,p.tailShade,p.tail,p.tailLight,p.tailGlint]};
}

// Long hair silhouettes are attached at the same skull pivot as the hero's.
// Separate back masses and front locks keep ears, wrists, and the near eye clear.
const hairDesigns={
 waves:{
  back:[[-8,-6],[-4,-9],[4,-9],[9,-5],[10,2],[9,6],[13,12],[10,17],[7,19],[3,17],[-1,16],[-6,19],[-11,17],[-13,13],[-10,7],[-10,0]],
  shade:[[-6,-6],[2,-8],[7,-6],[8,3],[7,8],[11,13],[9,16],[6,17],[3,14],[-3,14],[-6,17],[-10,15],[-11,12],[-8,6]],
  light:[[-8,1],[-5,4],[-6,9],[-9,14],[-11,13],[-9,7]],
  cap:[[-8,-5],[-4,-8],[2,-9],[6,-7],[8,-5],[9,0],[7,1],[5,-1],[4,-4],[0,-2],[-3,-1],[-6,2],[-8,3],[-9,0]],
  lock:[[5,-3],[7,-2],[8,2],[7,6],[10,10],[8,13],[6,11],[5,7],[4,4]],
  highlight:[[-7,-5],[-4,-7],[1,-7],[3,-6],[-1,-4],[-4,-3]],
 },
 knot:{
  back:[[-9,-5],[-5,-8],[-3,-8],[-3,-13],[-1,-16],[4,-17],[8,-14],[8,-10],[6,-7],[9,-3],[9,4],[7,8],[4,8],[2,6],[-6,7],[-10,5],[-10,-1]],
  shade:[[-8,-3],[-5,-7],[2,-7],[5,-5],[6,1],[6,6],[1,4],[-4,6],[-8,4]],
  light:[[-1,-12],[0,-15],[5,-15],[6,-13],[4,-11]],
  cap:[[-9,-3],[-5,-7],[-1,-8],[4,-7],[7,-5],[9,-2],[8,2],[6,1],[5,-3],[2,-4],[0,-1],[-4,0],[-6,2],[-8,1]],
  lock:[[7,-2],[9,1],[8,6],[6,8],[5,6],[6,3],[5,0]],
  highlight:[[-7,-3],[-3,-6],[1,-6],[2,-5],[0,-3],[-4,-2]],
 },
 sweep:{
  back:[[-10,-4],[-6,-8],[0,-9],[4,-8],[8,-6],[10,-1],[10,5],[14,8],[15,12],[11,14],[7,13],[5,11],[3,10],[-5,11],[-8,8],[-10,3]],
  shade:[[-9,-3],[-5,-7],[2,-7],[8,-3],[8,4],[11,8],[13,11],[11,12],[7,10],[4,8],[-4,9],[-8,6]],
  light:[[7,5],[11,7],[14,11],[10,11],[8,9]],
  cap:[[-10,-3],[-8,-6],[-3,-9],[2,-8],[6,-6],[8,-3],[7,0],[4,-1],[2,-4],[-2,-1],[-5,1],[-9,1]],
  lock:[[6,-3],[9,-1],[9,3],[10,6],[12,7],[11,10],[8,7],[6,4],[6,1]],
  highlight:[[-8,-4],[-5,-7],[-1,-7],[1,-6],[-3,-4],[-6,-2]],
 },
 braid:{
  back:[[-10,-4],[-6,-8],[-1,-9],[5,-8],[8,-5],[10,-1],[9,4],[9,8],[12,10],[12,15],[9,18],[10,22],[7,25],[4,24],[3,21],[5,17],[5,13],[2,10],[-5,9],[-8,7],[-10,3]],
  shade:[[-7,-5],[-3,-8],[4,-7],[8,-4],[8,4],[7,8],[10,11],[11,14],[7,17],[9,21],[7,23],[5,22],[6,17],[6,13],[2,9],[-4,7],[-7,6]],
  light:[[7,9],[10,12],[9,14],[6,16],[8,18],[7,20],[5,19],[6,15],[5,12]],
  cap:[[-10,-4],[-6,-8],[0,-9],[5,-7],[8,-5],[9,-1],[7,2],[5,-1],[4,-4],[1,-3],[-2,-1],[-5,2],[-8,3],[-10,0]],
  lock:[[6,-3],[9,-1],[9,4],[7,7],[5,7],[5,4],[6,2],[4,0]],
  highlight:[[-7,-4],[-5,-7],[-1,-7],[0,-5],[-3,-2],[-6,-1]],
 },
};
const backView=d=>d>=3&&d<=5;
function hairPart(c,head,d,styles,frame,back,scale){
 const {hairShape,hair,pin}=styles,h=hairDesigns[hairShape];
 const [edge,base,middle,light]=hair;
 const mirror=d===0||d>=5?1:-1,turn=d===2||d===6?.83:d===1||d===7?.96:1;
 const drift=Math.round(Math.sin(frame*.23)*.7);
 c.save();c.translate(Math.round(head.x),Math.round(head.y));c.scale(mirror*turn*scale,scale);
 if(back){
  polygon(c,h.back.map(([x,y])=>[x+(y>9?drift:0),y]),edge);
  polygon(c,h.shade.map(([x,y])=>[x+(y>9?drift:0),y]),base);
  polygon(c,h.light,middle);
 }else{
  if(backView(d)){
   polygon(c,h.back,edge);polygon(c,h.shade,base);polygon(c,h.light,middle);
   polygon(c,[[-5,-5],[0,-7],[4,-5],[5,4],[1,6],[-4,5]],middle);
  }else{
   polygon(c,h.cap,base);polygon(c,h.highlight,middle);polygon(c,h.lock,base);
   polygon(c,[[6,-1],[7,1],[6,5],[7,8],[6,6],[5,2]],middle);
  }
  const x=hairShape==='knot'?4:hairShape==='sweep'?-6:6,y=hairShape==='knot'?-11:-4;
  rect(c,x-1,y,4,2,edge);rect(c,x,y-1,2,3,pin);
  if(hairShape==='waves'||hairShape==='braid')rect(c,x-1,y+1,4,1,pin);
  rect(c,x,y-1,1,1,light);
 }
 c.restore();
}

function drawFace(c,p,d,style,frame,scale,actor){
 const {head}=p;
 c.save();c.translate(Math.round(head.x),Math.round(head.y));c.scale(scale,scale);
 const eyesClosed=actor.eyesClosed||Math.floor(frame+d*6)%39===30;
 const localPoints=Object.fromEntries(['head','eyeL','eyeR','nose','mouth'].map(name=>[name,{
  x:p[name].x-head.x,y:p[name].y-head.y,
 }]));
 drawDefaultExplorerSkull(c,{x:0,y:0},d,style.skin);
 if(!backView(d)){
  const visible=name=>d!==2&&d!==6||name===(d===2?'eyeR':'eyeL');
  drawDefaultExplorerEyes(c,localPoints,d,{eyeColor:style.eyes,eyesClosed},visible);
  const mouth=localPoints.mouth,x=mouth.x+(d===2?-.45:d===6?.45:0),y=mouth.y+1.25;
  rect(c,x-.7,y,1.8,1,actor.talking&&Math.floor(frame)%3===0?'#935a58':'#784745');
  if(d===0||d===1||d===7)rect(c,d===1?2.3:-3.5,localPoints.nose.y+.8,1.6,.8,'#c27968');
 }
 c.restore();
}

const lerp=(a,b,t)=>a+(b-a)*t;
const between=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});
function curvePoint(a,b,c,d,t){
 const power=t*t, cube=power*t;
 const smooth=(v,w,x,y)=>.5*((2*w)+(-v+x)*t+(2*v-5*w+4*x-y)*power+(-v+3*w-3*x+y)*cube);
 return {x:smooth(a.x,b.x,c.x,d.x),y:smooth(a.y,b.y,c.y,d.y)};
}
function tailProfile(p,shape){
 const joints=[p.pelvis,p.tailBase,p.tailMid,p.tailTip];
 const widths=[shape.tailBaseWidth*.82,shape.tailBaseWidth,shape.tailMidWidth,shape.tailTipWidth];
 const arc=[];
 for(let i=0;i<joints.length-1;i++){
  for(let sample=0;sample<4;sample++){
   const t=sample/4;
   const at=curvePoint(joints[Math.max(0,i-1)],joints[i],joints[i+1],joints[Math.min(joints.length-1,i+2)],t);
   arc.push({...at,w:lerp(widths[i],widths[i+1],t)/2});
  }
 }
 arc.push({...p.tailTip,w:widths.at(-1)/2});
 for(let i=0;i<arc.length;i++){
  const before=arc[Math.max(0,i-1)],after=arc[Math.min(i+1,arc.length-1)];
  const dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy)||1;
  arc[i].nx=dy/length;arc[i].ny=-dx/length;
 }
 return arc;
}
const spreadTail=(arc,s,bias=0)=>arc.map(p=>[p.x+p.nx*(p.w*s+bias),p.y+p.ny*(p.w*s+bias)]);
function paintTail(c,p,shape,colors,d){
 const arc=tailProfile(p,shape),[ink,dark,base,light,glint]=colors;
 const lit=d===2||d===6?(d===2?-1:1):(p.tailTip.x>=p.pelvis.x?1:-1);
 const band=(a,b,bias=0)=>[...spreadTail(arc,a,bias*Math.sign(a)),...spreadTail(arc,b,bias*Math.sign(b)).reverse()];
 polygon(c,band(1,-1,.83),ink);
 polygon(c,band(1,-1),dark);
 polygon(c,band(.91*lit,-.58*lit),base);
 polygon(c,band(.82*lit,.19*lit).slice(1,-1),light);
 for(const i of [2,4,5,7,8,10]){
  const q=arc[i],t=(i%2===0?.23:.62)*lit,x=q.x+q.nx*q.w*t,y=q.y+q.ny*q.w*t;
  rect(c,x,y,i<7?2:1,1,i===4||i===7?glint:light);
  if(i<8&&i%2===0)rect(c,x+1,y+1,1,1,base);
 }
}
function paintFluke(c,base,tip,width,colors,near){
 const [ink,dark,fill,light,glint]=colors;
 const dx=tip.x-base.x,dy=tip.y-base.y,len=Math.hypot(dx,dy)||1,nx=dy/len,ny=-dx/len;
 const at=(t,w)=>[base.x+dx*t+nx*w,base.y+dy*t+ny*w];
 const w=width*(near?.54:.42);
 polygon(c,[at(0,-1.3),at(.21,-w*.64),at(.47,-w*.95),at(.77,-w*.82),at(1,0),at(.83,w*.64),
  at(.62,w),at(.41,w*.85),at(.14,w*.33),at(0,1.6)],ink);
 polygon(c,[at(.07,-.45),at(.27,-w*.48),at(.55,-w*.72),at(.76,-w*.54),at(.91,0),
  at(.67,w*.68),at(.4,w*.62),at(.14,w*.17)],near?fill:dark);
 polygon(c,[at(.18,0),at(.45,w*.15),at(.67,w*.59),at(.87,w*.13),at(.68,-w*.13),at(.42,-w*.12)],near?light:fill);
 line(c,at(.27,w*.12),at(.71,w*.14),near?glint:light);
}
function paintUnderwater(c,swim,paint){
 if(!swim){paint();return;}
 c.save();c.beginPath();c.rect(-110,-110,220,110);c.clip();paint();c.restore();
 c.save();c.beginPath();c.rect(-110,0,220,110);c.clip();
 c.globalAlpha*=.59;paint();c.restore();
}
function paintNecklace(c,chest,d,style){
 if(backView(d))return;
 const x=chest.x+(d===2?-.8:d===6?.8:0),y=chest.y+2.5;
 rect(c,x-3,y-1,2,1,style.pin);rect(c,x+2,y-1,2,1,style.pin);
 rect(c,x-1,y,3,1,style.pin);rect(c,x,y+1,1,2,'#eed5a4');
}
function paintComb(c,p,d,stroke){
 const {x,y}=p.comb,side=d===2||d===3||d===4?-1:1;
 const take=(u,v)=>[x+u*side,y+v];
 const turn=stroke>.5?0:-1;
 polygon(c,[take(-2,-3+turn),take(3,-4),take(5,-3),take(4,-1),take(3,2),
  take(0,2),take(-2,1)],'#704c41');
 polygon(c,[take(-1,-3+turn),take(2,-3),take(4,-2),take(3,0),take(1,1),take(-1,0)],'#eccb9b');
 for(let i=0;i<4;i++)line(c,take(i-1,1),take(i-1,2),'#c08d65');
 rect(c,x+side*2,y-2,1,1,'#fff0bb');
}
function paintHarp(c,p,d,frame){
 const {x,y}=p.harp,mirror=p.harp.x>p.pelvis.x?-1:1;
 const q=(u,v)=>[x+u*mirror,y+v];
 polygon(c,[q(-4,-5),q(-4,-23),q(-2,-23),q(1,-20),q(5,-16),q(10,-13),q(13,-8),q(12,-4)],'#5b403364');
 const active=Math.floor(frame*.6)%6;
 for(let i=0;i<6;i++){
  const dx=-2+i*2.5;
  line(c,q(dx,-22+i*2.31),q(dx+.44,-3.35),i===active?'#fff0b5':'#d2b383');
 }
 polygon(c,[q(-7,-4),q(-6,-22),q(-4,-26),q(-1,-26),q(4,-20),q(8,-17),q(13,-13),q(16,-6),
  q(17,-2),q(14,1),q(12,-2),q(11,-9),q(7,-13),q(3,-16),q(-1,-21),q(-3,-22),q(-4,-18),q(-4,-5)],'#694636');
 polygon(c,[q(-6,-4),q(-5,-21),q(-4,-25),q(-2,-25),q(3,-20),q(8,-16),q(12,-13),q(15,-7),
  q(16,-3),q(14,-2),q(13,-7),q(10,-12),q(6,-15),q(2,-18),q(-2,-23),q(-4,-22),q(-4,-17),q(-5,-5)],'#c99053');
 line(c,q(-4,-24),q(4,-18),'#edc989');line(c,q(4,-18),q(11,-12),'#edc989');
 polygon(c,[q(-6,-5),q(13,-6),q(16,-4),q(16,-1),q(13,1),q(-8,1),q(-9,-1)],'#76513d');
 polygon(c,[q(-6,-4),q(13,-5),q(15,-3),q(13,-1),q(-7,-1)],'#bd8950');
 line(c,q(-6,-4),q(13,-5),'#f0cb86');
 rect(c,x+mirror*11,y-2,2,1,'#8b6243');
 if(d===2||d===6)rect(c,x+mirror*13,y-9,1,4,'#d3a865');
}

function actionFor(npc,model){
 const action=npc.animationAction||npc.mermaidPose||'idle';
 if(action==='rest'||action==='lounge')return 'lay';
 if(action==='swim'&&npc.mermaidPose==='swim'&&!npc.moving)return 'swim_idle';
 return model.clips[action]?action:'idle';
}
function mermaidFrame(npc,time,clip){
 if(Number.isFinite(npc.playerFrame))return npc.playerFrame;
 return Math.max(0,time+(npc.mermaidPhase??npc.phase??0))*clip.fps;
}
function placeSprite(c,npc,scale){
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(npc.x||0),Math.round(npc.y||0));c.scale(scale,scale);
}
function paintPortrait(c,p,d,style,frame,scale,npc){
 c.translate(-p.head.x,-p.head.y);
 hairPart(c,p.head,d,style,frame,true,scale);
 drawFace(c,p,d,style,frame,scale,npc);
 hairPart(c,p.head,d,style,frame,false,scale);
}
// In the world x/y is the pelvis contact point; for portraits it is the center
// of the skull. All dimensions are in native 48-unit rig space.
export function drawLagoonMermaid(c,npc,time=0,{portrait=false,model=lagoonMermaidMotion,pose=null}={}){
 const d=facingIndex(npc.faceX??(portrait?0:.55),npc.faceY??1);
 const action=actionFor(npc,model),style=mermaidStyle(npc,model),clip=model.clips[action];
 const frame=mermaidFrame(npc,time,clip),swim=!portrait&&(action==='swim'||action==='swim_idle');
 const bones=pose||withPlayerPoseCache(()=>poseAt(model,action,frame));
 const p=Object.fromEntries(Object.entries(bones).map(([name,pos])=>[name,projectPoint(pos,d)]));
 const s=model.shape;
 placeSprite(c,npc,(npc.size||48)/48);
 if(portrait){paintPortrait(c,p,d,style,frame,s.headScale,npc);c.restore();return;}
 const parts=[];
 function add(id,bone,bones,depth,draw){
  if(model.visibility?.[bone]?.[d]!==false)parts.push({id,bone,bones,depth,draw});
 }
 add('rear hair','head',['head','neck'],-12,()=>hairPart(c,p.head,d,style,frame,true,s.headScale));
 for(const [n,depth] of [['flukeL',-11],['flukeR',-10]]){
  add('tail '+n,n,['tailTip',n],depth,()=>paintUnderwater(c,swim,
   ()=>paintFluke(c,p.tailTip,p[n],s.flukeWidth,style.tail,n==='flukeR')));
 }
 add('tail body','tailBase',['pelvis','tailBase','tailMid','tailTip'],-9,
  ()=>paintUnderwater(c,swim,()=>paintTail(c,p,s,style.tail,d)));
 const far=p.shoulderL.depth>p.shoulderR.depth?'R':'L';
 for(const side of ['L','R']){
  add('arm '+side,'hand'+side,['shoulder'+side,'elbow'+side,'hand'+side],side===far?-8:4,
   ()=>drawNativeArm(c,bones,side,d,style.bodice,style.skin));
 }
 add('torso','chest',['chest','neck','pelvis'],0,()=>{
  drawNativeTorso(c,bones,d,style.bodice,style.skin,style.pin);
  paintNecklace(c,p.chest,d,style);
 });
 if(action==='harp')add('harp','harp',['harp'],3,()=>paintHarp(c,p,d,frame));
 add('face','head',['head','eyeL','eyeR','earL','earR','nose','mouth'],7,()=>drawFace(c,p,d,style,frame,s.headScale,npc));
 add('front hair','head',['head','neck'],8,()=>hairPart(c,p.head,d,style,frame,false,s.headScale));
 if(action==='brush')add('shell comb','comb',['comb','handR'],9,()=>paintComb(c,p,d,(frame%clip.length)/clip.length));
 paintLayers(parts,model,d,c,p);
 c.restore();
}
export const drawLagoonMermaidRig=(c,npc,time,model,pose)=>drawLagoonMermaid(c,npc,time,{model,pose});
