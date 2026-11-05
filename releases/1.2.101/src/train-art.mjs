import {trainFurniturePainter} from './train-furniture-order.mjs';
import {trainWallOccludes} from './train-visibility.mjs';
import {drawTenderCoal,coalClusters} from './train-coal.mjs';
import {vehicleReflectionColors} from './car-art.mjs';
import {TRAIN_PARTS,TRAIN_VIEWS,trainInterior,tenderLayout,trainDoorGeometry,trainSideDoorSpans} from './train-design.mjs';
import {trainWorld} from './train-track.mjs';
export const TRAIN_ART_SIZE={width:560,height:300,x:280,y:210};
export const trainViewAngle=i=>Math.PI/2+i*Math.PI/4;
export const trainViewIndex=a=>((Math.round((a-Math.PI/2)/(Math.PI/4))%8)+8)%8;
const shade=(hex,k)=>'#'+[1,3,5].map(i=>Math.round(Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)*k))).toString(16).padStart(2,'0')).join('');
const pixel=n=>Math.round(n/1.5)*1.5;
function painter(ctx,car,{riders=[],world=null,occlusionOnly=false,exteriorFront=false,signatureOnly=false,visibilityBits=null}={}){let wallDrawing=false;const a=car.a,ca=Math.cos(a),sa=Math.sin(a),project=([x,y,z=0])=>[pixel(ca*x-sa*y),pixel(sa*x+ca*y-z)];
 const poly=(vertices,color,outline=false)=>{if(signatureOnly||occlusionOnly&&!wallDrawing)return;const p=vertices.map(project);ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(outline){ctx.strokeStyle=outline===true?'#20242c':outline;ctx.lineWidth=1.5;ctx.stroke();}};
 const line=(vertices,color,width=2)=>{if(signatureOnly||occlusionOnly&&!wallDrawing)return;ctx.beginPath();vertices.map(project).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();};
 const box=(x,y,z,w,h,depth,color,outline=false)=>{if(signatureOnly||occlusionOnly&&!wallDrawing)return;const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z1=z+depth,faces=[{v:[[x0,y0,z],[x1,y0,z],[x1,y0,z1],[x0,y0,z1]],n:-ca},{v:[[x0,y1,z],[x1,y1,z],[x1,y1,z1],[x0,y1,z1]],n:ca},{v:[[x0,y0,z],[x0,y1,z],[x0,y1,z1],[x0,y0,z1]],n:-sa},{v:[[x1,y0,z],[x1,y1,z],[x1,y1,z1],[x1,y0,z1]],n:sa}];for(const f of faces.filter(f=>f.n>0).sort((a,b)=>a.n-b.n))poly(f.v,shade(color,.68+f.n*.12),outline);poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],color,outline);};
 const obscures=(x,y,z,w,h,depth)=>{const fade=trainWallOccludes(car,riders,x,y,z,w,h,depth);visibilityBits?.push(fade?1:0);return fade;};
 const wallBox=(x,y,z,w,h,depth,color,outline=false)=>{const fade=obscures(x,y,z,w,h,depth);if(signatureOnly)return;if(occlusionOnly&&!fade&&!exteriorFront)return;if(exteriorFront&&sa*x+ca*y<0)return;if(fade&&!occlusionOnly)return;wallDrawing=true;if(!fade)box(x,y,z,w,h,depth,color,outline);else{ctx.save();for(let dz=0;dz<depth;dz+=3){const height=z+dz;ctx.globalAlpha=height<27?1:Math.max(.12,.7-.57*((height-20)/45));box(x,y,height,w,h,Math.min(3,depth-dz),color,dz===0&&height<27?outline:false);}ctx.restore();}wallDrawing=false;};
 const windowPane=(x,y,z,w,h)=>{const fade=obscures(x,y,z,w,2,h);if(signatureOnly)return;if(occlusionOnly&&!fade&&!exteriorFront||fade&&!occlusionOnly)return;if(exteriorFront&&sa*x+ca*y<0)return;wallDrawing=true;ctx.save();if(fade)ctx.globalAlpha*=.2;poly([[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y,z+h],[x-w/2,y,z+h]],'#457881');const colors=vehicleReflectionColors(car,world||{time:0,scenery:[]});ctx.globalAlpha*=.4;for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x0=x-w/2+w*col/5,x1=x-w/2+w*(col+1)/5,z0=z+h*row/3,z1=z+h*(row+1)/3;poly([[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],colors[(2-row)*8+Math.floor(col*8/5)]);}ctx.restore();wallDrawing=false;};
 return {project,poly,line,box,wallBox,windowPane};
}
function wheel(p,x,y,phase,large=true,details=true){const r=large?14:9,z=r-1,points=[];for(let i=0;i<16;i++){const a=i*Math.PI/8;points.push([x+Math.cos(a)*r,y,z+Math.sin(a)*r]);}p.poly(points,'#1c2630',true);const rim=points.map(v=>[x+(v[0]-x)*.82,y-.1,z+(v[2]-z)*.82]);p.poly(rim,'#78858a');p.poly(rim.map(v=>[x+(v[0]-x)*.72,y-.2,z+(v[2]-z)*.72]),'#37434d');if(details)for(let i=0;i<6;i++){const a=phase+i*Math.PI/3;p.line([[x,y-.4,z],[x+Math.cos(a)*r*.7,y-.4,z+Math.sin(a)*r*.7]],'#99a1a0',2);}p.box(x,y, z-2,5,3,4,'#b4a78b');}
export function drawTrainPart(ctx,d,car,part,{time=0,distance=0,speed=0,engine=false,doors={},painted=true,staticArt=false,riders=[],world=null,occlusionOnly=false,exteriorFront=false,signatureOnly=false,visibilityBits=null,cocoaTaken=new Set()}={}){
 const key=car.kind+':'+part+':'+trainViewIndex(car.a),custom=painted&&d.art?.[key];
 if(custom&&!occlusionOnly){drawTrainPixelSprite(ctx,custom,-TRAIN_ART_SIZE.x,-TRAIN_ART_SIZE.y);if(part==='wheels')drawWheelMotion(painter(ctx,car),car,distance);return;}
 const p=painter(ctx,car,{riders,world,occlusionOnly,exteriorFront,signatureOnly,visibilityBits}),L=car.length,W=car.width,P=d.paint,phase=-distance/14;
 if(part==='chassis'){
  p.box(0,0,5,L+4,W-8,8,'#29333b',true);p.box(0,0,11,L-12,W-3,4,'#4c5555');
  for(const x of[-L/2-9,L/2+9]){p.box(x,0,5,20,12,7,'#212a32');for(const y of[-W*.32,W*.32])p.box(x,y,10,8,12,5,'#676e6a');}
 }
 if(part==='wheels'){
  const xs=car.kind==='engine'?[-L*.2,-L*.02,L*.16,L*.34]:car.kind==='tender'?[-L*.28,L*.28]:[-L*.34-12,-L*.34+12,L*.34-12,L*.34+12];
  const sides=[-1,1].sort((a,b)=>a*Math.cos(car.a)-b*Math.cos(car.a));for(const side of sides){for(const x of xs)wheel(p,x,side*(W/2-4),phase,car.kind==='engine',!staticArt);if(car.kind==='engine'&&!staticArt){const z=13+Math.sin(phase)*7;p.line([[xs[0]+Math.cos(phase)*7,side*(W/2+1),z],[xs.at(-1)+Math.cos(phase)*7,side*(W/2+1),z]],'#c1c1ac',4);p.box(L*.35,side*(W/2-4),9,30,13,13,'#4c565c');p.line([[L*.35,side*(W/2+2),15],[L*.15+Math.cos(phase)*9,side*(W/2+2),z]],'#a9aaa2',3);}}
 }
 if(part==='body'){
  p.box(0,0,14,L-5,W,5,['seats','caboose'].includes(car.kind)?P.wood:'#64727b',true);
  if(car.kind==='seats'){for(let x=-L/2+12;x<L/2-5;x+=16)p.line([[x,-W/2+5,20],[x,W/2-5,20]],shade(P.wood,.75),1.5);}
  if(car.kind==='compartments')p.box(0,0,19,L-18,W-15,1,'#577d8c');
  if(car.kind==='tender'){
   const bunker=tenderLayout(car),BW=bunker.bunkerWidth,BL=bunker.bunkerLength;
   p.box(0,0,19,L-5,W-7,2,'#a58c64',true);
   // Raised, brass-edged grating visibly follows the playable perimeter.
   for(const side of[-1,1]){const y=side*(BW/2+13);p.box(0,y,21,L-10,23,2,'#69756c');for(let x=-L/2+8;x<L/2-5;x+=7)p.line([[x,y-9,24],[x,y+9,24]],'#bac0a4',2);p.line([[-L/2+5,side*(W/2-6),24],[L/2-5,side*(W/2-6),24]],P.lining,2);p.wallBox(0,side*(W/2-3),20,L-8,4,10,P.body,true);}
   for(const x of[-L/2+13,L/2-13]){p.box(x,0,21,23,W-12,2,'#89907a');for(let y=-W/2+8;y<W/2-6;y+=7)p.line([[x-8,y,24],[x+8,y,24]],'#c9c4a5',2);}
   p.box(0,0,23,BL,BW,7,'#232c31');for(const y of[-BW/2,BW/2])p.wallBox(0,y,23,BL+4,4,18,P.body,true);for(const x of[-BL/2,BL/2])p.wallBox(x,0,23,4,BW+4,18,P.body,true);
   if(!occlusionOnly&&!drawTenderCoal(ctx,car,time,speed))for(const q of coalClusters(car)){const jitter=speed>0?Math.round(Math.sin(time*19+q.seed)*Math.min(1,speed/35)):0;p.box(q.x+jitter,q.y,q.z,q.r*2,q.r*1.5,4,'#3d484e',true);p.box(q.x+jitter-1,q.y-1,q.z+4,q.r,2,1,'#687078');}

  }else if(car.kind==='engine'){
   // Cab ends stay open at the footboards; doors match the boarding geometry.
   for(const y of[-W/2+3,W/2-3]){const doorway=trainSideDoorSpans(car)[0],front=-L*.12,rear=doorway.max;p.wallBox((rear+front)/2,y,19,front-rear,6,18,P.body,true);p.wallBox((rear+front)/2,y,48,front-rear,5,5,P.lining);for(const x of[doorway.min-2,doorway.max+2,-L*.15])p.wallBox(x,y,36,4,6,28,P.body);p.windowPane((rear+front)/2,y,39,Math.max(12,front-rear-10),10);}
   p.wallBox(-L*.08,0,19,9,W-6,41,P.body,true);
  }else{
   const wallY=W/2-3;
   const doors=trainSideDoorSpans(car),middle=doors[1].min;for(const side of[-1,1]){p.wallBox(0,side*wallY,19,middle*2,6,18,P.body,true);p.wallBox(0,side*wallY,57,L-7,6,7,P.body);for(const end of[-1,1])p.wallBox(end*(L/2-4),side*wallY,19,6,6,38,P.body,true);for(let x=-middle+11;x<middle-27;x+=34){p.wallBox(x,side*wallY,37,4,6,20,P.body);p.windowPane(x+15,side*(wallY+.3),40,25,14);p.line([[x+3,side*(wallY+1),53],[x+22,side*(wallY+1),53]],'#d4e5ce',1.5);}p.line([[-middle,side*(wallY+1),34],[middle,side*(wallY+1),34]],P.lining,2);}
   // End wall door opening remains traversable between coaches.
   for(const x of[-L/2+4,L/2-4])for(const side of[-1,1])p.wallBox(x,side*(W/4+10),20,6,W/2-20,37,P.body,true);
  }
 }
 if(part==='furniture'&&signatureOnly){for(const o of trainInterior(d,car)){if(o.kind==='wall')p.wallBox(o.x,o.y,20,o.w,o.h,27,'#51433e',true);else if(o.kind==='door'){const panel=trainDoorGeometry(o,doors[car.id+':'+o.id]??o.open);p.wallBox(panel.x,panel.y,20,o.w,o.h,25,'#6f4d3c',true);}}return;}
 if(part==='furniture'){
  const furniture=trainFurniturePainter(p,car),cupIds=new Set(trainInterior(d,car).filter(q=>q.kind==='table').slice(0,2).map(q=>q.id)),objects=trainInterior(d,car).slice().sort((a,b)=>Math.sin(car.a)*(a.x-b.x)+Math.cos(car.a)*(a.y-b.y));
  for(const o of objects){const {x,y,w,h}=o;
   if(o.kind==='wall')furniture.wallBox(x,y,20,w,h,27,'#51433e',true);
   if(o.kind==='door'){const open=doors[car.id+':'+o.id]??o.open,panel=trainDoorGeometry(o,open);furniture.wallBox(panel.x,panel.y,20,w,h,25,'#6f4d3c',true);furniture.box(panel.x+w*.3,y,34,3,4,3,P.lining);}
   if(o.kind==='table'){furniture.box(x,y,20,4,4,11,'#544437');furniture.box(x,y,31,w,h,3,P.wood,true);if(car.kind==='compartments'&&cupIds.has(o.id)&&!cocoaTaken.has(car.id+':'+o.id)){const ring=(radius,z)=>Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return[x+Math.cos(a)*radius,y+Math.sin(a)*radius,z];});furniture.poly(ring(6,34.5),'#d9c49c',true);furniture.poly(ring(4.5,35),'#eee1bf');const low=ring(3.4,35),high=ring(3.8,41);for(let i=0;i<12;i++){const j=(i+1)%12;furniture.poly([low[i],low[j],high[j],high[i]],i<6?'#c1b18f':'#eee4c7');}furniture.poly(ring(3.8,41),'#fff2cf',true);furniture.poly(ring(2.8,41.5),'#754532');furniture.poly([[x-1.5,y-1,41.7],[x+.5,y-1,41.7],[x+1,y,41.7],[x-1,y+.4,41.7]],'#b27d50');const handle=Array.from({length:10},(_,i)=>{const a=i*Math.PI*2/9;return[x+4.7+Math.cos(a)*2.2,y,38+Math.sin(a)*2.5];});furniture.line(handle,'#f2e4c4',1.6);for(let i=0;i<2;i++){const drift=Math.sin(time*2+i)*1.5;furniture.line([[x-1+i*2,y,43],[x+drift-1+i*2,y,46],[x-drift+i*2,y,49]],'#d8e5d16a',1);}}}

   if(o.kind==='seat'){
    const a=(o.facing??0)*Math.PI/2;const dx=Math.round(Math.cos(a)),dy=Math.round(Math.sin(a));furniture.box(x,y,20,w,h,7,car.kind==='seats'?'#927358':P.seats,true);furniture.box(x-dx*w*.38,y-dy*h*.38,25,Math.abs(dx)>.5?5:w,Math.abs(dy)>.5?5:h,14,car.kind==='seats'?'#73513e':shade(P.seats,.82),true);furniture.box(x,y,26,w-5,h-5,2,car.kind==='seats'?'#b7956c':shade(P.seats,1.2));
   }
   if(o.kind==='console'){furniture.box(x,y,20,w,h,17,'#38474b',true);for(const dx of[-7,2,9])furniture.box(x+dx,y,37,4,5,4,P.lining);furniture.line([[x-6,y-2,41],[x-6,y-2,47]],'#d6c489',2);}
   if(o.kind==='firebox'){furniture.box(x,y,20,w,h,25,'#293039',true);furniture.box(x-2,y,28,w,Math.max(8,h-12),9,engine?'#ed913c':'#503f36');if(engine){furniture.box(x-4,y,30,w-4,h-20,6,'#ffce71');furniture.box(x-6,y+Math.sin(time*13)*2,33,6,h-24,3,'#fff1ac');for(const side of[-1,0,1]){furniture.box(x-4,y+side*6,29,6,5,3,'#542d27');furniture.box(x-5,y+side*6,32,3,3,2,Math.sin(time*9+side)>0?'#f7bd60':'#d87537');}}}
   if(o.kind==='lamp'){furniture.box(x,y,20,3,3,24,'#bda05d');furniture.box(x,y,44,9,9,7,'#e9cd87');}
  }
  furniture.flush();
 }
 if(part==='machinery'&&car.kind==='engine'){
  const x0=-L*.02,x1=L*.42,R=W*.32,zc=40;
  // Curved scarlet boiler, brass bands, and a distinct black front smokebox.
  for(let j=0;j<10;j++){const a0=j*Math.PI/10,a1=(j+1)*Math.PI/10;const y0=Math.cos(a0)*R,y1=Math.cos(a1)*R,z0=zc+Math.sin(a0)*R,z1=zc+Math.sin(a1)*R;p.poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1]],shade(P.body,.65+Math.sin((j+.5)*Math.PI/10)*.55),j===0||j===9);}
  for(const x of[L*.04,L*.25]){const pts=[];for(let j=0;j<=10;j++){const a=j*Math.PI/10;pts.push([x,Math.cos(a)*R,zc+Math.sin(a)*R+1]);}p.line(pts,P.lining,4);}
  p.box(L*.4,0,31,31,W*.66,24,'#303b42',true);
  for(const [x,z,r]of[[L*.29,73,11],[L*.07,71,9]]){p.box(x,0,z-12,r*1.5,r*1.5,12,P.lining,true);p.box(x,0,z,r*2,r*2,4,'#56615b');}
  p.box(L*.39,0,63,15,20,23,'#222d35',true);p.box(L*.39,0,85,23,25,6,'#4b555b',true);p.poly([[L*.39-8,-9,91.3],[L*.39+8,-9,91.3],[L*.39+8,9,91.3],[L*.39-8,9,91.3]],'#10171c',true);p.poly([[L*.39-5,-6,91.5],[L*.39+6,-6,91.5],[L*.39+6,6,91.5],[L*.39-5,6,91.5]],'#080e12');
  const front=L/2;p.poly([[front+18,0,7],[front,-W*.46,18],[front,W*.46,18]],'#27343c',true);for(let y=-30;y<=30;y+=10)p.line([[front+16,0,8],[front,y,18]],'#737d7a',2);p.box(front-7,0,41,7,14,12,P.lining);p.box(front-3,0,44,4,10,7,'#ffe7a2');
  for(const side of[-1,1])p.line([[-L*.06,side*R,38],[L*.23,side*R,38],[L*.27,side*R,27],[L*.4,side*R,27]],P.lining,3);
 }
 if(part==='trim'){
  if(car.kind==='caboose'){for(const side of[-1,1]){p.box(-L/2-2,side*(W*.34),36,5,8,8,'#50232b',true);p.box(-L/2-5,side*(W*.34),39,3,5,4,'#f37557');}p.line([[-L/2+16,-W*.36,29],[-L/2+16,-W*.36,50],[-L/2+16,-15,50]],P.lining,2);p.line([[-L/2+16,W*.36,29],[-L/2+16,W*.36,50],[-L/2+16,15,50]],P.lining,2);}
  for(const side of[-1,1]){p.line([[-L/2+6,side*(W/2+1),22],[L/2-6,side*(W/2+1),22]],P.lining,2);if(car.kind!=='engine'&&car.kind!=='tender'){p.box(0,side*(W/2+2),26,46,1,7,'#5c2f38');p.line([[-16,side*(W/2+3),29],[16,side*(W/2+3),29]],'#e3cc93',2);}}
 }
 if(part==='roof'&&car.kind!=='tender'){
  const x0=car.kind==='engine'?-L/2-4:-L/2+1,x1=car.kind==='engine'?-L*.08:L/2-1;
  for(let j=0;j<8;j++){const y0=-W/2-4+(W+8)*j/8,y1=-W/2-4+(W+8)*(j+1)/8,z0=64+12*Math.sin(j*Math.PI/8),z1=64+12*Math.sin((j+1)*Math.PI/8);p.poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1]],shade(P.roof,.7+.5*Math.sin((j+.5)*Math.PI/8)),j===0||j===7);}
  for(let x=x0+18;x<x1;x+=42)p.line([[x,-W/2-2,65],[x,-W/4,73],[x,0,77],[x,W/4,73],[x,W/2+2,65]],shade(P.roof,.78),1.5);
  if(car.kind!=='engine')for(const x of[-L*.23,L*.23])p.box(x,0,76,22,16,4,'#27343d',true);
  if(car.kind==='caboose'){p.box(0,0,74,60,W*.64,27,P.body,true);for(const side of[-1,1]){p.box(0,side*(W*.32+.5),82,38,2,12,'#85b2b5',true);p.line([[-19,side*(W*.32+2),96],[19,side*(W*.32+2),96]],P.lining,2);}p.box(0,0,101,70,W*.74,5,P.roof,true);p.box(L*.26,0,76,8,8,15,'#26323a',true);}
 }
}
const spriteCanvases=new WeakMap();
export function drawTrainPixelSprite(ctx,s,x,y){let canvas=spriteCanvases.get(s);if(!canvas){canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const c=canvas.getContext('2d'),image=c.createImageData(s.width,s.height);for(let i=0;i<s.pixels.length;i++){const hex=s.palette[s.pixels[i]];if(!hex||hex==='transparent')continue;image.data[i*4]=parseInt(hex.slice(1,3),16);image.data[i*4+1]=parseInt(hex.slice(3,5),16);image.data[i*4+2]=parseInt(hex.slice(5,7),16);image.data[i*4+3]=hex.length===9?parseInt(hex.slice(7,9),16):255;}c.putImageData(image,0,0);spriteCanvases.set(s,canvas);}ctx.drawImage(canvas,x,y);}
export function trainPartSprite(d,car,part,view){const existing=d.art[car.kind+':'+part+':'+view];if(existing)return structuredClone(existing);const s=TRAIN_ART_SIZE,canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const c=canvas.getContext('2d');c.translate(s.x,s.y);drawTrainPart(c,d,{...car,a:trainViewAngle(view)},part,{painted:false,staticArt:true});const rgba=c.getImageData(0,0,s.width,s.height).data,palette=['transparent'],map=new Map(),pixels=[];for(let i=0;i<rgba.length;i+=4){if(rgba[i+3]<128){pixels.push(0);continue;}const hex='#'+[rgba[i],rgba[i+1],rgba[i+2]].map(v=>(Math.round(v/8)*8>255?255:Math.round(v/8)*8).toString(16).padStart(2,'0')).join('');if(!map.has(hex)){map.set(hex,palette.length);palette.push(hex);}pixels.push(map.get(hex));}return{width:s.width,height:s.height,palette,pixels};}
const livePartCaches=new WeakMap();
const signatureContext={save(){},restore(){},globalAlpha:1};
function livePart(ctx,d,car,part,options){
 if(typeof document==='undefined'||d.art?.[car.kind+':'+part+':'+trainViewIndex(car.a)]||part==='wheels'||part==='body'&&car.kind==='tender'){drawTrainPart(ctx,d,car,part,options);return;}
 if(part==='machinery'&&car.kind!=='engine'||part==='roof'&&car.kind==='tender')return;
 const angle=Math.round(car.a/(Math.PI*2)*256),posed={...car,a:angle/256*Math.PI*2},bits=[];
 if(options.riders?.length&&['body','furniture'].includes(part))drawTrainPart(signatureContext,d,posed,part,{...options,occlusionOnly:true,signatureOnly:true,visibilityBits:bits});
 const dynamic=part==='body'||part==='furniture',phase=dynamic?Math.floor((options.time||0)*(part==='body'?2:4)):0,doors=Object.entries(options.doors||{}).filter(([k])=>k.startsWith(car.id+':')).map(([k,v])=>k+':'+v).join(','),cups=[...(options.cocoaTaken||[])].filter(k=>k.startsWith(car.id+':')).join(','),key=[d.trackRevision||0,car.id,part,angle,car.length,car.width,phase,options.engine?1:0,options.occlusionOnly?1:0,options.exteriorFront?1:0,bits.join(''),doors,cups].join('|');
 let cache=livePartCaches.get(d);if(!cache){cache={images:new Map(),pixels:0};livePartCaches.set(d,cache);}let image=cache.images.get(key);
 if(!image){const ca=Math.abs(Math.cos(posed.a)),sa=Math.abs(Math.sin(posed.a)),half=Math.ceil((ca*(car.length+35)+sa*(car.width+20))/2)+12,ground=Math.ceil((sa*(car.length+35)+ca*(car.width+20))/2)+12,top=ground+116,canvas=document.createElement('canvas');canvas.width=half*2;canvas.height=top+ground+20;const pen=canvas.getContext('2d');pen.translate(half,top);drawTrainPart(pen,d,posed,part,options);image={canvas,half,top,pixels:canvas.width*canvas.height};cache.images.set(key,image);cache.pixels+=image.pixels;while(cache.pixels>12*1024*1024&&cache.images.size>1){const first=cache.images.keys().next().value;cache.pixels-=cache.images.get(first).pixels;cache.images.delete(first);}}
 else{cache.images.delete(key);cache.images.set(key,image);}ctx.imageSmoothingEnabled=false;ctx.drawImage(image.canvas,-image.half,-image.top);
}
export function drawTrainCar(ctx,d,car,options={},occupants){ctx.save();ctx.translate(car.x,car.y-car.z);for(const part of TRAIN_PARTS){if(part==='furniture'&&car.kind!=='engine'&&car.kind!=='tender'&&!options.riders?.length&&(options.roofAlpha??1)>=.995)continue;if(part==='roof'){occupants?.();if(!options.riders?.length)livePart(ctx,d,car,'body',{...options,occlusionOnly:true,exteriorFront:true});if(options.riders?.length)for(const wallPart of['body','furniture'])livePart(ctx,d,car,wallPart,{...options,occlusionOnly:true});ctx.globalAlpha=options.roofAlpha<.025?0:options.roofAlpha??1;}if(ctx.globalAlpha>0)livePart(ctx,d,car,part,options);ctx.globalAlpha=1;}ctx.restore();}
export function drawTrainTurnaround(canvas,d,{cutaway=false}={}){const c=canvas.getContext('2d');canvas.width=1120;canvas.height=960;c.fillStyle='#20352f';c.fillRect(0,0,1120,960);for(let v=0;v<8;v++){const ox=(v%2)*560+280,oy=Math.floor(v/2)*240+165;c.fillStyle='#e9d6aa';c.font='14px monospace';c.fillText(TRAIN_VIEWS[v],ox-250,oy-143);c.save();c.translate(ox,oy);c.scale(.95,.95);const car=d.cars[0];for(const part of TRAIN_PARTS){c.globalAlpha=cutaway&&part==='roof'?.12:1;drawTrainPart(c,d,{...car,a:trainViewAngle(v)},part,{engine:true,time:.5,distance:7});}c.restore();}}

function drawWheelMotion(p,car,distance){const L=car.length,W=car.width,phase=-distance/14,xs=car.kind==='engine'?[-L*.2,-L*.02,L*.16,L*.34]:car.kind==='tender'?[-L*.28,L*.28]:[-L*.34-12,-L*.34+12,L*.34-12,L*.34+12],r=car.kind==='engine'?14:9;for(const side of[-1,1]){const y=side*(W/2-4);for(const x of xs)for(let i=0;i<6;i++){const a=phase+i*Math.PI/3;p.line([[x,y,r-1],[x+Math.cos(a)*r*.7,y,r-1+Math.sin(a)*r*.7]],'#99a1a0',2);}if(car.kind==='engine'){const z=13+Math.sin(phase)*7;p.line([[xs[0]+Math.cos(phase)*7,side*(W/2+1),z],[xs.at(-1)+Math.cos(phase)*7,side*(W/2+1),z]],'#c1c1ac',4);p.line([[L*.35,side*(W/2+2),15],[L*.15+Math.cos(phase)*9,side*(W/2+2),z]],'#a9aaa2',3);}}}

export function drawTrainForeground(ctx,d,car,options){ctx.save();ctx.translate(car.x,car.y-car.z);for(const part of ['body','furniture'])livePart(ctx,d,car,part,{...options,occlusionOnly:true});ctx.restore();}
