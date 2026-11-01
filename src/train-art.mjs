import {drawTenderCoal,coalClusters} from './train-coal.mjs';
import {vehicleReflectionColors} from './car-art.mjs';
import {TRAIN_PARTS,TRAIN_VIEWS,trainInterior,tenderLayout} from './train-design.mjs';
import {trainWorld} from './train-track.mjs';
export const TRAIN_ART_SIZE={width:560,height:300,x:280,y:210};
export const trainViewAngle=i=>Math.PI/2+i*Math.PI/4;
export const trainViewIndex=a=>((Math.round((a-Math.PI/2)/(Math.PI/4))%8)+8)%8;
const shade=(hex,k)=>'#'+[1,3,5].map(i=>Math.round(Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)*k))).toString(16).padStart(2,'0')).join('');
const pixel=n=>Math.round(n/1.5)*1.5;
function painter(ctx,car,{riders=[],world=null,occlusionOnly=false,exteriorFront=false}={}){let wallDrawing=false;const a=car.a,ca=Math.cos(a),sa=Math.sin(a),project=([x,y,z=0])=>[pixel(ca*x-sa*y),pixel(sa*x+ca*y-z)];
 const poly=(vertices,color,outline=false)=>{if(occlusionOnly&&!wallDrawing)return;const p=vertices.map(project);ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(outline){ctx.strokeStyle=outline===true?'#20242c':outline;ctx.lineWidth=1.5;ctx.stroke();}};
 const line=(vertices,color,width=2)=>{if(occlusionOnly&&!wallDrawing)return;ctx.beginPath();vertices.map(project).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();};
 const box=(x,y,z,w,h,depth,color,outline=false)=>{const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z1=z+depth,faces=[{v:[[x0,y0,z],[x1,y0,z],[x1,y0,z1],[x0,y0,z1]],n:-ca},{v:[[x0,y1,z],[x1,y1,z],[x1,y1,z1],[x0,y1,z1]],n:ca},{v:[[x0,y0,z],[x0,y1,z],[x0,y1,z1],[x0,y0,z1]],n:-sa},{v:[[x1,y0,z],[x1,y1,z],[x1,y1,z1],[x1,y0,z1]],n:sa}];for(const f of faces.filter(f=>f.n>0).sort((a,b)=>a.n-b.n))poly(f.v,shade(color,.68+f.n*.12),outline);poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],color,outline);};
 const obscures=(x,y,z,w,h,depth)=>{const corners=[[x-w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z+depth],[x+w/2,y-h/2,z+depth]].map(project),left=Math.min(...corners.map(q=>q[0])),right=Math.max(...corners.map(q=>q[0]));return riders.some(r=>{const q=project([r.x,r.y,20]),forward=sa*(x-r.x)+ca*(y-r.y);return forward>-3&&q[0]>left-12&&q[0]<right+12&&Math.abs(sa*(x-r.x)+ca*(y-r.y))<85;});};
 const wallBox=(x,y,z,w,h,depth,color,outline=false)=>{const fade=obscures(x,y,z,w,h,depth);if(occlusionOnly&&!fade&&!exteriorFront)return;if(exteriorFront&&sa*x+ca*y<0)return;if(fade&&!occlusionOnly)return;wallDrawing=true;if(!fade)box(x,y,z,w,h,depth,color,outline);else{ctx.save();box(x,y,z,w,h,Math.min(depth,7),color,outline);for(let dz=7;dz<depth;dz+=3){ctx.globalAlpha=.7-.57*(dz/depth);box(x,y,z+dz,w,h,Math.min(3,depth-dz),color,false);}ctx.restore();}wallDrawing=false;};
 const windowPane=(x,y,z,w,h)=>{const fade=obscures(x,y,z,w,2,h);if(occlusionOnly&&!fade&&!exteriorFront||fade&&!occlusionOnly)return;if(exteriorFront&&sa*x+ca*y<0)return;wallDrawing=true;ctx.save();if(fade)ctx.globalAlpha*=.2;poly([[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y,z+h],[x-w/2,y,z+h]],'#457881');const colors=vehicleReflectionColors(car,world||{time:0,scenery:[]});ctx.globalAlpha*=.4;for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x0=x-w/2+w*col/5,x1=x-w/2+w*(col+1)/5,z0=z+h*row/3,z1=z+h*(row+1)/3;poly([[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],colors[(2-row)*8+Math.floor(col*8/5)]);}ctx.restore();wallDrawing=false;};
 return {project,poly,line,box,wallBox,windowPane};
}
function wheel(p,x,y,phase,large=true,details=true){const r=large?14:9,z=r-1,points=[];for(let i=0;i<16;i++){const a=i*Math.PI/8;points.push([x+Math.cos(a)*r,y,z+Math.sin(a)*r]);}p.poly(points,'#1c2630',true);const rim=points.map(v=>[x+(v[0]-x)*.82,y-.1,z+(v[2]-z)*.82]);p.poly(rim,'#78858a');p.poly(rim.map(v=>[x+(v[0]-x)*.72,y-.2,z+(v[2]-z)*.72]),'#37434d');if(details)for(let i=0;i<6;i++){const a=phase+i*Math.PI/3;p.line([[x,y-.4,z],[x+Math.cos(a)*r*.7,y-.4,z+Math.sin(a)*r*.7]],'#99a1a0',2);}p.box(x,y, z-2,5,3,4,'#b4a78b');}
export function drawTrainPart(ctx,d,car,part,{time=0,distance=0,speed=0,engine=false,doors={},painted=true,staticArt=false,riders=[],world=null,occlusionOnly=false,exteriorFront=false,cocoaTaken=new Set()}={}){
 const key=car.kind+':'+part+':'+trainViewIndex(car.a),custom=painted&&d.art?.[key];
 if(custom&&!occlusionOnly){drawTrainPixelSprite(ctx,custom,-TRAIN_ART_SIZE.x,-TRAIN_ART_SIZE.y);if(part==='wheels')drawWheelMotion(painter(ctx,car),car,distance);return;}
 const p=painter(ctx,car,{riders,world,occlusionOnly,exteriorFront}),L=car.length,W=car.width,P=d.paint,phase=-distance/14;
 if(part==='chassis'){
  p.box(0,0,5,L+4,W-8,8,'#29333b',true);p.box(0,0,11,L-12,W-3,4,'#4c5555');
  for(const x of[-L/2-9,L/2+9]){p.box(x,0,5,20,12,7,'#212a32');for(const y of[-W*.32,W*.32])p.box(x,y,10,8,12,5,'#676e6a');}
 }
 if(part==='wheels'){
  const xs=car.kind==='engine'?[-L*.2,-L*.02,L*.16,L*.34]:car.kind==='tender'?[-L*.28,L*.28]:[-L*.34-12,-L*.34+12,L*.34-12,L*.34+12];
  const sides=[-1,1].sort((a,b)=>a*Math.cos(car.a)-b*Math.cos(car.a));for(const side of sides){for(const x of xs)wheel(p,x,side*(W/2-4),phase,car.kind==='engine',!staticArt);if(car.kind==='engine'&&!staticArt){const z=13+Math.sin(phase)*7;p.line([[xs[0]+Math.cos(phase)*7,side*(W/2+1),z],[xs.at(-1)+Math.cos(phase)*7,side*(W/2+1),z]],'#c1c1ac',4);p.box(L*.35,side*(W/2-4),9,30,13,13,'#4c565c');p.line([[L*.35,side*(W/2+2),15],[L*.15+Math.cos(phase)*9,side*(W/2+2),z]],'#a9aaa2',3);}}
 }
 if(part==='body'){
  p.box(0,0,14,L-5,W,5,car.kind==='seats'?P.wood:'#64727b',true);
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
   for(const y of[-W/2+3,W/2-3]){p.wallBox(-L*.29,y,19,L*.34,6,18,P.body,true);p.wallBox(-L*.29,y,48,L*.34,5,5,P.lining);for(const x of[-L*.44,-L*.15])p.wallBox(x,y,36,6,6,28,P.body);p.windowPane(-L*.29,y,39,L*.24,10);}
   p.wallBox(-L*.08,0,19,9,W-6,41,P.body,true);
  }else{
   const wallY=W/2-3;
   for(const side of[-1,1]){p.wallBox(0,side*wallY,19,L-8,6,18,P.body,true);p.wallBox(0,side*wallY,57,L-7,6,7,P.body);for(let x=-L/2+31;x<L/2-20;x+=34){p.wallBox(x,side*wallY,37,4,6,20,P.body);p.windowPane(x+15,side*(wallY+.3),40,25,14);p.line([[x+3,side*(wallY+1),53],[x+22,side*(wallY+1),53]],'#d4e5ce',1.5);}p.line([[-L/2+8,side*(wallY+1),34],[L/2-8,side*(wallY+1),34]],P.lining,2);}
   // End wall door opening remains traversable between coaches.
   for(const x of[-L/2+4,L/2-4])for(const side of[-1,1])p.wallBox(x,side*(W/4+10),20,6,W/2-20,37,P.body,true);
  }
 }
 if(part==='furniture'){
  const cupIds=new Set(trainInterior(d,car).filter(q=>q.kind==='table').slice(0,2).map(q=>q.id)),objects=trainInterior(d,car).slice().sort((a,b)=>Math.sin(car.a)*(a.x-b.x)+Math.cos(car.a)*(a.y-b.y));
  for(const o of objects){const {x,y,w,h}=o;
   if(o.kind==='wall')p.wallBox(x,y,20,w,h,27,'#51433e',true);
   if(o.kind==='door'){const open=doors[car.id+':'+o.id]??o.open;p.wallBox(x,y,20,open?4:w,h,25,open?'#a8865c':'#6f4d3c',true);if(!open)p.box(x+w*.3,y,34,3,4,3,P.lining);}
   if(o.kind==='table'){p.box(x,y,20,4,4,11,'#544437');p.box(x,y,31,w,h,3,P.wood,true);if(car.kind==='compartments'&&cupIds.has(o.id)&&!cocoaTaken.has(car.id+':'+o.id)){const ring=(radius,z)=>Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return[x+Math.cos(a)*radius,y+Math.sin(a)*radius,z];});p.poly(ring(6,34.5),'#d9c49c',true);p.poly(ring(4.5,35),'#eee1bf');const low=ring(3.4,35),high=ring(3.8,41);for(let i=0;i<12;i++){const j=(i+1)%12;p.poly([low[i],low[j],high[j],high[i]],i<6?'#c1b18f':'#eee4c7');}p.poly(ring(3.8,41),'#fff2cf',true);p.poly(ring(2.8,41.5),'#754532');p.poly([[x-1.5,y-1,41.7],[x+.5,y-1,41.7],[x+1,y,41.7],[x-1,y+.4,41.7]],'#b27d50');const handle=Array.from({length:10},(_,i)=>{const a=i*Math.PI*2/9;return[x+4.7+Math.cos(a)*2.2,y,38+Math.sin(a)*2.5];});p.line(handle,'#f2e4c4',1.6);for(let i=0;i<2;i++){const drift=Math.sin(time*2+i)*1.5;p.line([[x-1+i*2,y,43],[x+drift-1+i*2,y,46],[x-drift+i*2,y,49]],'#d8e5d16a',1);}}}

   if(o.kind==='seat'){
    const a=(o.facing??0)*Math.PI/2;const dx=Math.round(Math.cos(a)),dy=Math.round(Math.sin(a));p.box(x,y,20,w,h,7,car.kind==='seats'?'#927358':P.seats,true);p.box(x-dx*w*.38,y-dy*h*.38,25,Math.abs(dx)>.5?5:w,Math.abs(dy)>.5?5:h,14,car.kind==='seats'?'#73513e':shade(P.seats,.82),true);p.box(x,y,26,w-5,h-5,2,car.kind==='seats'?'#b7956c':shade(P.seats,1.2));
   }
   if(o.kind==='console'){p.box(x,y,20,w,h,17,'#38474b',true);for(const dx of[-7,2,9])p.box(x+dx,y,37,4,5,4,P.lining);p.line([[x-6,y-2,41],[x-6,y-2,47]],'#d6c489',2);}
   if(o.kind==='firebox'){p.box(x,y,20,w,h,25,'#293039',true);p.box(x-2,y,28,w,Math.max(8,h-12),9,engine?'#ed913c':'#503f36');if(engine){p.box(x-4,y,30,w-4,h-20,6,'#ffce71');p.box(x-6,y+Math.sin(time*13)*2,33,6,h-24,3,'#fff1ac');for(const side of[-1,0,1]){p.box(x-4,y+side*6,29,6,5,3,'#542d27');p.box(x-5,y+side*6,32,3,3,2,Math.sin(time*9+side)>0?'#f7bd60':'#d87537');}}}
   if(o.kind==='lamp'){p.box(x,y,20,3,3,24,'#bda05d');p.box(x,y,44,9,9,7,'#e9cd87');}
  }
 }
 if(part==='machinery'&&car.kind==='engine'){
  const x0=-L*.02,x1=L*.42,R=W*.32,zc=40;
  // Curved scarlet boiler, brass bands, and a distinct black front smokebox.
  for(let j=0;j<10;j++){const a0=j*Math.PI/10,a1=(j+1)*Math.PI/10;const y0=Math.cos(a0)*R,y1=Math.cos(a1)*R,z0=zc+Math.sin(a0)*R,z1=zc+Math.sin(a1)*R;p.poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1]],shade(P.body,.65+Math.sin((j+.5)*Math.PI/10)*.55),j===0||j===9);}
  for(const x of[L*.04,L*.25]){const pts=[];for(let j=0;j<=10;j++){const a=j*Math.PI/10;pts.push([x,Math.cos(a)*R,zc+Math.sin(a)*R+1]);}p.line(pts,P.lining,4);}
  p.box(L*.4,0,31,31,W*.66,24,'#303b42',true);
  for(const [x,z,r]of[[L*.29,73,11],[L*.07,71,9]]){p.box(x,0,z-12,r*1.5,r*1.5,12,P.lining,true);p.box(x,0,z,r*2,r*2,4,'#56615b');}
  p.box(L*.39,0,63,15,20,23,'#222d35',true);p.box(L*.39,0,85,23,25,6,'#4b555b',true);
  const front=L/2;p.poly([[front+18,0,7],[front,-W*.46,18],[front,W*.46,18]],'#27343c',true);for(let y=-30;y<=30;y+=10)p.line([[front+16,0,8],[front,y,18]],'#737d7a',2);p.box(front-7,0,41,7,14,12,P.lining);p.box(front-3,0,44,4,10,7,'#ffe7a2');
  for(const side of[-1,1])p.line([[-L*.06,side*R,38],[L*.23,side*R,38],[L*.27,side*R,27],[L*.4,side*R,27]],P.lining,3);
 }
 if(part==='trim'){
  for(const side of[-1,1]){p.line([[-L/2+6,side*(W/2+1),22],[L/2-6,side*(W/2+1),22]],P.lining,2);if(car.kind!=='engine'&&car.kind!=='tender'){p.box(0,side*(W/2+2),26,46,1,7,'#5c2f38');p.line([[-16,side*(W/2+3),29],[16,side*(W/2+3),29]],'#e3cc93',2);}}
 }
 if(part==='roof'&&car.kind!=='tender'){
  const x0=car.kind==='engine'?-L/2-4:-L/2+1,x1=car.kind==='engine'?-L*.08:L/2-1;
  for(let j=0;j<8;j++){const y0=-W/2-4+(W+8)*j/8,y1=-W/2-4+(W+8)*(j+1)/8,z0=64+12*Math.sin(j*Math.PI/8),z1=64+12*Math.sin((j+1)*Math.PI/8);p.poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1]],shade(P.roof,.7+.5*Math.sin((j+.5)*Math.PI/8)),j===0||j===7);}
  for(let x=x0+18;x<x1;x+=42)p.line([[x,-W/2-2,65],[x,-W/4,73],[x,0,77],[x,W/4,73],[x,W/2+2,65]],shade(P.roof,.78),1.5);
  if(car.kind!=='engine')for(const x of[-L*.23,L*.23])p.box(x,0,76,22,16,4,'#27343d',true);
 }
}
const spriteCanvases=new WeakMap();
export function drawTrainPixelSprite(ctx,s,x,y){let canvas=spriteCanvases.get(s);if(!canvas){canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const c=canvas.getContext('2d'),image=c.createImageData(s.width,s.height);for(let i=0;i<s.pixels.length;i++){const hex=s.palette[s.pixels[i]];if(!hex||hex==='transparent')continue;image.data[i*4]=parseInt(hex.slice(1,3),16);image.data[i*4+1]=parseInt(hex.slice(3,5),16);image.data[i*4+2]=parseInt(hex.slice(5,7),16);image.data[i*4+3]=hex.length===9?parseInt(hex.slice(7,9),16):255;}c.putImageData(image,0,0);spriteCanvases.set(s,canvas);}ctx.drawImage(canvas,x,y);}
export function trainPartSprite(d,car,part,view){const existing=d.art[car.kind+':'+part+':'+view];if(existing)return structuredClone(existing);const s=TRAIN_ART_SIZE,canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const c=canvas.getContext('2d');c.translate(s.x,s.y);drawTrainPart(c,d,{...car,a:trainViewAngle(view)},part,{painted:false,staticArt:true});const rgba=c.getImageData(0,0,s.width,s.height).data,palette=['transparent'],map=new Map(),pixels=[];for(let i=0;i<rgba.length;i+=4){if(rgba[i+3]<128){pixels.push(0);continue;}const hex='#'+[rgba[i],rgba[i+1],rgba[i+2]].map(v=>(Math.round(v/8)*8>255?255:Math.round(v/8)*8).toString(16).padStart(2,'0')).join('');if(!map.has(hex)){map.set(hex,palette.length);palette.push(hex);}pixels.push(map.get(hex));}return{width:s.width,height:s.height,palette,pixels};}
export function drawTrainCar(ctx,d,car,options={},occupants){ctx.save();ctx.translate(car.x,car.y-car.z);for(const part of TRAIN_PARTS){if(part==='roof'){occupants?.();if(!options.riders?.length)drawTrainPart(ctx,d,car,'body',{...options,occlusionOnly:true,exteriorFront:true});if(options.riders?.length)for(const wallPart of['body','furniture'])drawTrainPart(ctx,d,car,wallPart,{...options,occlusionOnly:true});ctx.globalAlpha=options.roofAlpha<.025?0:options.roofAlpha??1;}if(ctx.globalAlpha>0)drawTrainPart(ctx,d,car,part,options);ctx.globalAlpha=1;}ctx.restore();}
export function drawTrainTurnaround(canvas,d,{cutaway=false}={}){const c=canvas.getContext('2d');canvas.width=1120;canvas.height=960;c.fillStyle='#20352f';c.fillRect(0,0,1120,960);for(let v=0;v<8;v++){const ox=(v%2)*560+280,oy=Math.floor(v/2)*240+165;c.fillStyle='#e9d6aa';c.font='14px monospace';c.fillText(TRAIN_VIEWS[v],ox-250,oy-143);c.save();c.translate(ox,oy);c.scale(.95,.95);const car=d.cars[0];for(const part of TRAIN_PARTS){c.globalAlpha=cutaway&&part==='roof'?.12:1;drawTrainPart(c,d,{...car,a:trainViewAngle(v)},part,{engine:true,time:.5,distance:7});}c.restore();}}

function drawWheelMotion(p,car,distance){const L=car.length,W=car.width,phase=-distance/14,xs=car.kind==='engine'?[-L*.2,-L*.02,L*.16,L*.34]:car.kind==='tender'?[-L*.28,L*.28]:[-L*.34-12,-L*.34+12,L*.34-12,L*.34+12],r=car.kind==='engine'?14:9;for(const side of[-1,1]){const y=side*(W/2-4);for(const x of xs)for(let i=0;i<6;i++){const a=phase+i*Math.PI/3;p.line([[x,y,r-1],[x+Math.cos(a)*r*.7,y,r-1+Math.sin(a)*r*.7]],'#99a1a0',2);}if(car.kind==='engine'){const z=13+Math.sin(phase)*7;p.line([[xs[0]+Math.cos(phase)*7,side*(W/2+1),z],[xs.at(-1)+Math.cos(phase)*7,side*(W/2+1),z]],'#c1c1ac',4);p.line([[L*.35,side*(W/2+2),15],[L*.15+Math.cos(phase)*9,side*(W/2+2),z]],'#a9aaa2',3);}}}
