import {paintTrainFrame,paintTrainDeckEdge,paintTrainEndFrames,paintTrainRoofEnd} from './train-construction.mjs';
import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {paintTrainSeat,paintTrainTable,paintTrainMachinery,paintTrainCoachPanels,paintTrainCoachLining,paintTrainAisleCloth,paintTrainRoofDetails,paintTrainPartition,paintTrainCabWindows,paintTrainControls,paintTrainFirebox,paintTrainWallLining} from './train-craft.mjs';
import {clipTrainFace,clipTrainLine} from './train-depth-clip.mjs';
import {drawTrainWreath} from './holiday-decor.mjs';
import {trainFurniturePainter} from './train-furniture-order.mjs';
import {trainWallOccludes} from './train-visibility.mjs';
import {drawTenderCoal,coalClusters} from './train-coal.mjs';
import {vehicleReflectionColors} from './car-art.mjs';
import {TRAIN_PARTS,TRAIN_VIEWS,trainInterior,tenderLayout,trainDoorGeometry,trainSideDoorSpans} from './train-design.mjs';
import {nativeCompartmentAisle} from './train-interior.mjs';
import {trainWorld} from './train-track.mjs';
export const TRAIN_ART_SIZE={width:560,height:300,x:280,y:210};
export const trainViewAngle=i=>Math.PI/2+i*Math.PI/4;
export const trainViewIndex=a=>((Math.round((a-Math.PI/2)/(Math.PI/4))%8)+8)%8;
const shades=new Map();
function shade(hex,k){
 const key=hex+':'+Math.round(k*1024);
 if(shades.has(key))return shades.get(key);
 const value='#'+[1,3,5].map(i=>Math.round(Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)*k))).toString(16).padStart(2,'0')).join('');
 if(shades.size>=4096)shades.delete(shades.keys().next().value);
 shades.set(key,value);
 return value;
}
const pixel=n=>Math.round(n);
function painter(ctx,car,{riders=[],world=null,occlusionOnly=false,exteriorFront=false,signatureOnly=false,visibilityBits=null,riderClip=null,maskFaces=null,actorMask=false,opaqueFaces=null,opaqueLines=null,wallVisibility=null,primitiveSink=null,occlusionCapture=false}={}){
 let wallDrawing=false;const a=car.a,ca=Math.cos(a),sa=Math.sin(a),project=([x,y,z=0])=>[pixel(ca*x-sa*y),pixel(sa*x+ca*y-z)];
 const opaque=color=>actorMask&&opaqueFaces&&ctx.globalAlpha*(typeof color==='string'&&/^#[a-f0-9]{8}$/i.test(color)?parseInt(color.slice(7,9),16)/255:1)>=.999;
 const maskTransform=opaqueFaces?ctx.getTransform():null;
 const record=points=>{const m=maskTransform,face=points.map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);if(face.every(p=>p[0]<-1)||face.every(p=>p[0]>ctx.canvas.width+1)||face.every(p=>p[1]<-1)||face.every(p=>p[1]>ctx.canvas.height+1))return;opaqueFaces.push(face);};
 const path=points=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();};
 function line(vertices,color,width=2,seatCushionId=null){
  if(signatureOnly||occlusionOnly&&!wallDrawing)return;
  if(primitiveSink){primitiveSink({kind:'line',points:vertices,color,width,alpha:ctx.globalAlpha,seatCushionId});return;}
  if(!riderClip&&!maskFaces&&!actorMask){const points=vertices.map(project);for(let i=1;i<points.length;i++)pixelLine(ctx,{x:points[i-1][0],y:points[i-1][1]},{x:points[i][0],y:points[i][1]},color,width);return;}
  const segments=riderClip?clipTrainLine(vertices,a,riderClip):vertices.slice(1).map((p,i)=>[vertices[i],p]);
  for(const segment of segments){
   const points=segment.map(project),[[x0,y0],[x1,y1]]=points,len=Math.hypot(x1-x0,y1-y0)||1,nx=-(y1-y0)/len*width/2,ny=(x1-x0)/len*width/2,quad=[[x0+nx,y0+ny],[x1+nx,y1+ny],[x1-nx,y1-ny],[x0-nx,y0-ny]];
   if(maskFaces){maskFaces.push(quad);continue;}if(opaque(color)){if(opaqueLines){const m=maskTransform,segment=points.map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]),pad=width/2+1;if(segment.every(p=>p[0]<-pad)||segment.every(p=>p[0]>ctx.canvas.width+pad)||segment.every(p=>p[1]<-pad)||segment.every(p=>p[1]>ctx.canvas.height+pad))continue;let lines=opaqueLines.get(width);if(!lines){lines=[];opaqueLines.set(width,lines);}lines.push(segment);}else record(quad);continue;}
   if(actorMask)ctx.globalCompositeOperation='source-atop';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();
  }
 }
 function poly(vertices,color,outline=false,seatCushionId=null){
  if(signatureOnly||occlusionOnly&&!wallDrawing)return;
  if(primitiveSink){primitiveSink({kind:'poly',points:vertices,color,alpha:ctx.globalAlpha,seatCushionId});if(outline)line([...vertices,vertices[0]],outline===true?'#20242c':outline,1.5,seatCushionId);return;}
  const clipped=riderClip?clipTrainFace(vertices,a,riderClip):vertices;if(clipped.length<3)return;const points=clipped.map(project);
  if(maskFaces)maskFaces.push(points);else if(opaque(color))record(points);else {if(actorMask)ctx.globalCompositeOperation='source-atop';pixelPolygon(ctx,points.map(([x,y])=>({x,y})),color);}
  if(outline){const ink=outline===true?'#20242c':outline;if(riderClip||actorMask||maskFaces)line([...vertices,vertices[0]],ink,1.5);else{for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];pixelLine(ctx,{x:a[0],y:a[1]},{x:b[0],y:b[1]},ink,1);}}}
 }
 const outsideBox=(x,y,z,w,h,depth)=>{if(!riderClip)return false;const cx=ca*x-sa*y,cy=sa*x+ca*y,hx=Math.abs(ca)*w/2+Math.abs(sa)*h/2,hy=Math.abs(sa)*w/2+Math.abs(ca)*h/2;if(cy+hy<sa*riderClip.x+ca*riderClip.y-1e-6)return true;if(actorMask&&maskTransform&&maskTransform.a===1&&maskTransform.d===1&&!maskTransform.b&&!maskTransform.c){const sx=cx+maskTransform.e,sy=cy+maskTransform.f;return sx+hx<-2||sx-hx>ctx.canvas.width+2||sy+hy-z<-2||sy-hy-z-depth>ctx.canvas.height+2;}return false;};
 const box=(x,y,z,w,h,depth,color,outline=false,seatCushionId=null)=>{if(signatureOnly||occlusionOnly&&!wallDrawing||seatCushionId&&seatCushionId===riderClip?.seatCushionId||outsideBox(x,y,z,w,h,depth))return;const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z1=z+depth,faces=[{v:[[x0,y0,z],[x1,y0,z],[x1,y0,z1],[x0,y0,z1]],n:-ca},{v:[[x0,y1,z],[x1,y1,z],[x1,y1,z1],[x0,y1,z1]],n:ca},{v:[[x0,y0,z],[x0,y1,z],[x0,y1,z1],[x0,y0,z1]],n:-sa},{v:[[x1,y0,z],[x1,y1,z],[x1,y1,z1],[x1,y0,z1]],n:sa}];for(const f of faces.filter(f=>f.n>0).sort((a,b)=>a.n-b.n))poly(f.v,shade(color,.68+f.n*.12),outline,seatCushionId);poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],color,outline,seatCushionId);};
 const obscures=(x,y,z,w,h,depth)=>{const key=wallVisibility?[car.a,x,y,z,w,h,depth].join(':'):null;let fade=key?wallVisibility.get(key):undefined;if(fade===undefined){fade=trainWallOccludes(car,riders,x,y,z,w,h,depth);if(key)wallVisibility.set(key,fade);}visibilityBits?.push(fade?1:0);return fade;};
 const wallBox=(x,y,z,w,h,depth,color,outline=false)=>{const fade=obscures(x,y,z,w,h,depth);if(signatureOnly)return;if(occlusionOnly&&!fade&&!exteriorFront)return;if(exteriorFront&&sa*x+ca*y<0)return;if(fade&&!occlusionOnly&&!riderClip&&!occlusionCapture)return;wallDrawing=true;if(!fade)box(x,y,z,w,h,depth,color,outline);else{ctx.save();for(let dz=0;dz<depth;dz+=3){const height=z+dz;ctx.globalAlpha=height<27?1:Math.max(.12,.7-.57*((height-20)/45));box(x,y,height,w,h,Math.min(3,depth-dz),color,dz===0&&height<27?outline:false);}ctx.restore();}wallDrawing=false;};
 const windowPane=(x,y,z,w,h)=>{if(outsideBox(x,y,z,w,2,h))return;const fade=obscures(x,y,z,w,2,h);if(signatureOnly)return;if(occlusionOnly&&!fade&&!exteriorFront||fade&&!occlusionOnly&&!riderClip&&!occlusionCapture)return;if(exteriorFront&&sa*x+ca*y<0)return;wallDrawing=true;ctx.save();if(fade)ctx.globalAlpha*=.2;poly([[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y,z+h],[x-w/2,y,z+h]],'#457881');const colors=vehicleReflectionColors(car,world||{time:0,scenery:[]});ctx.globalAlpha*=.4;for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x0=x-w/2+w*col/5,x1=x-w/2+w*(col+1)/5,z0=z+h*row/3,z1=z+h*(row+1)/3;poly([[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],colors[(2-row)*8+Math.floor(col*8/5)]);}ctx.globalAlpha=fade?.2:1;
  for(const side of[-1,1]){const edge=x+side*(w/2-1);poly([[edge-.7,y,z],[edge+.7,y,z],[edge+.7,y,z+h],[edge-.7,y,z+h]],'#736347');}
  line([[x-w/2+1,y,z+h],[x+w/2-1,y,z+h]],'#c6b184',1);line([[x-w/2+1,y,z+1],[x+w/2-1,y,z+1]],'#344f53',1);
  ctx.restore();wallDrawing=false;};
 return {project,poly,line,box,wallBox,windowPane};
}
function wheelSpokes(p,x,y,phase,r,from=0){
 const z=r-1;
 for(let i=0;i<6;i++){
  const a=phase+i*Math.PI/3,dx=Math.cos(a),dz=Math.sin(a);
  p.line([[x+dx*from,y-.4,z+dz*from],[x+dx*r*.7,y-.4,z+dz*r*.7]],'#99a1a0',2);
 }
}
function wheel(p,x,y,phase,large=true,details=true){const r=large?14:9,z=r-1,points=[];for(let i=0;i<16;i++){const a=i*Math.PI/8;points.push([x+Math.cos(a)*r,y,z+Math.sin(a)*r]);}p.poly(points,'#1c2630',true);const rim=points.map(v=>[x+(v[0]-x)*.82,y-.1,z+(v[2]-z)*.82]);p.poly(rim,'#78858a');p.poly(rim.map(v=>[x+(v[0]-x)*.72,y-.2,z+(v[2]-z)*.72]),'#37434d');if(details)wheelSpokes(p,x,y,phase,r);p.box(x,y,z-2,5,3,4,'#b4a78b');}
export function drawTrainPart(ctx,d,car,part,{time=0,distance=0,speed=0,engine=false,doors={},painted=true,staticArt=false,riders=[],world=null,occlusionOnly=false,exteriorFront=false,signatureOnly=false,visibilityBits=null,cocoaTaken=new Set(),tablesOnly=false,furnitureForeground=false,riderClip=null,maskFaces=null,actorMask=false,opaqueFaces=null,opaqueRaster=null,opaqueLines=null,wallVisibility=null,primitiveSink=null,occlusionCapture=false,omitFurnitureId=null,wheelPass='all',wheelMotionOnly=false}={}){
 const key=car.kind+':'+part+':'+trainViewIndex(car.a),custom=painted&&d.art?.[key];
 if(custom&&!occlusionOnly&&!riderClip){drawTrainPixelSprite(ctx,custom,-TRAIN_ART_SIZE.x,-TRAIN_ART_SIZE.y);if(part==='machinery'&&car.kind==='engine')drawTrainWreath(painter(ctx,car),car);if(part==='wheels')drawWheelMotion(painter(ctx,car),car,distance);return;}
 if(custom&&riderClip){const faces=[];drawTrainPart(ctx,d,car,part,{time,distance,speed,engine,doors,painted:false,staticArt,riders,world,riderClip,maskFaces:faces,tablesOnly,furnitureForeground});if(!faces.length)return;ctx.save();ctx.beginPath();for(const face of faces){const area=face.reduce((sum,[x,y],i)=>{const b=face[(i+1)%face.length];return sum+x*b[1]-y*b[0];},0);if(area<0)face.reverse();face.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}ctx.clip();if(actorMask)ctx.globalCompositeOperation='source-atop';drawTrainPixelSprite(ctx,custom,-TRAIN_ART_SIZE.x,-TRAIN_ART_SIZE.y);ctx.restore();if(actorMask&&opaqueRaster&&ctx.globalAlpha>=.999&&custom.palette.every(color=>color==='transparent'||color.length===7||color.endsWith('ff'))){opaqueRaster.save();opaqueRaster.beginPath();for(const face of faces){face.forEach(([x,y],i)=>i?opaqueRaster.lineTo(x,y):opaqueRaster.moveTo(x,y));opaqueRaster.closePath();}opaqueRaster.clip();drawTrainPixelSprite(opaqueRaster,custom,-TRAIN_ART_SIZE.x,-TRAIN_ART_SIZE.y);opaqueRaster.restore();}return;}
 const p=painter(ctx,car,{riders,world,occlusionOnly,exteriorFront,signatureOnly,visibilityBits,riderClip,maskFaces,actorMask,opaqueFaces,opaqueLines,wallVisibility,primitiveSink,occlusionCapture}),L=car.length,W=car.width,P=d.paint,phase=-distance/14,details=!(primitiveSink||actorMask||maskFaces||signatureOnly||occlusionCapture);
 if(part==='chassis'){
  paintTrainFrame(p,car,P);
  p.box(0,0,5,L+4,W-8,8,'#29333b',true);p.box(0,0,11,L-12,W-3,4,'#4c5555');
  for(const x of[-L/2-9,L/2+9]){p.box(x,0,5,20,12,7,'#212a32');for(const y of[-W*.32,W*.32])p.box(x,y,10,8,12,5,'#676e6a');}
 }
 if(part==='wheels'){
  const xs=car.kind==='engine'?[-L*.2,-L*.02,L*.16,L*.34]:car.kind==='tender'?[-L*.28,L*.28]:[-L*.34-12,-L*.34+12,L*.34-12,L*.34+12];
  const engineWheel=car.kind==='engine';
  const sides=[-1,1].filter(side=>wheelPass==='all'||(side*Math.cos(car.a)>=-1e-6?wheelPass==='near':wheelPass==='far')).sort((a,b)=>a*Math.cos(car.a)-b*Math.cos(car.a));
  for(const side of sides){
   const y=side*(W/2+1);
   for(const x of xs){
    if(wheelMotionOnly)wheelSpokes(p,x,y,phase,engineWheel?14:9,2.8);
    else wheel(p,x,y,phase,engineWheel,!staticArt);
   }
   if(engineWheel&&!staticArt){
    const z=13+Math.sin(phase)*7,crank=Math.cos(phase)*7;
    p.line([[xs[0]+crank,y,z],[xs.at(-1)+crank,y,z]],'#c1c1ac',4);
    p.box(L*.35,side*(W/2-4),9,30,13,13,'#4c565c');
    p.line([[L*.35,side*(W/2+2),15],[L*.15+Math.cos(phase)*9,side*(W/2+2),z]],'#a9aaa2',3);
   }
  }
 }
 if(part==='body'){
  const aisle=nativeCompartmentAisle(d,car);
  if(!d.art?.[car.kind+':trim:'+trainViewIndex(car.a)])for(const side of[-1,1].filter(side=>side*Math.cos(car.a)<-1e-6))p.line([[-L/2+6,side*(W/2+1),22],[L/2-6,side*(W/2+1),22]],P.lining,2);
  p.box(0,0,14,L-5,W,5,['seats','caboose'].includes(car.kind)?P.wood:'#64727b',true);
  if(['seats','caboose'].includes(car.kind)){for(let x=-L/2+12,i=0;x<L/2-5;x+=16,i++){p.line([[x,-W/2+5,20],[x,W/2-5,20]],shade(P.wood,.75),1);const y=i%2?W*.12:-W*.2;p.line([[x+1,y,20],[Math.min(x+14,L/2-6),y,20]],shade(P.wood,.84),1);p.line([[x+3,-W*.31,20],[x+3,-W*.12,20]],shade(P.wood,1.08),1);}}
  paintTrainDeckEdge(p,car,P);
  if(car.kind==='compartments'){
   p.box(0,0,19,L-18,W-15,1,'#526d72');
   const center=aisle?.center??W/2-16,half=aisle?.half??6;
   p.box(0,center,20,L-24,2*half+2,.2,shade(P.seats,.55));
   for(const y of[center-half,center+half])p.line([[-L/2+14,y,20.3],[L/2-14,y,20.3]],shade(P.lining,.73),1);
  }
  if(details&&!occlusionOnly)paintTrainAisleCloth(p,car,P,aisle);
  if(car.kind==='tender'){
   const bunker=tenderLayout(car),BW=bunker.bunkerWidth,BL=bunker.bunkerLength;
   p.box(0,0,19,L-5,W-7,2,'#a58c64',true);
   // Raised, brass-edged grating visibly follows the playable perimeter.
   for(const side of[-1,1]){const y=side*(BW/2+13);p.box(0,y,21,L-10,23,2,'#69756c');for(let x=-L/2+8;x<L/2-5;x+=9)p.line([[x,y-9,24],[x,y+9,24]],'#89968a',1);p.line([[-L/2+5,side*(W/2-6),24],[L/2-5,side*(W/2-6),24]],P.lining,2);p.wallBox(0,side*(W/2-3),20,L-8,4,10,P.body,true);}
   for(const x of[-L/2+13,L/2-13]){p.box(x,0,21,23,W-12,2,'#89907a');for(let y=-W/2+8;y<W/2-6;y+=9)p.line([[x-8,y,24],[x+8,y,24]],'#97a18a',1);}
   p.box(0,0,23,BL,BW,7,'#232c31');
   const bunkerWalls=[...[-BW/2,BW/2].map(y=>({x:0,y,w:BL+4,h:4})),...[-BL/2,BL/2].map(x=>({x,y:0,w:4,h:BW+4}))],near=o=>Math.sin(car.a)*o.x+Math.cos(car.a)*o.y>=-1e-6,paintWall=o=>{p.wallBox(o.x,o.y,23,o.w,o.h,18,P.body,true);p.wallBox(o.x,o.y,40,o.w+1,o.h+1,3,shade(P.body,.7),true);};
   for(const wall of bunkerWalls.filter(o=>!near(o)))paintWall(wall);
   if(primitiveSink&&!occlusionOnly)primitiveSink({kind:'coal'});else if(!occlusionOnly&&!(maskFaces?false:drawTenderCoal(actorMask&&opaqueRaster?opaqueRaster:ctx,car,time,speed,riderClip)))paintCoalFallback(p,car,time,speed);
   for(const wall of bunkerWalls.filter(near))paintWall(wall);

  }else if(car.kind==='engine'){
   paintTrainEndFrames(p,car,P);
   // Cab ends stay open at the footboards; doors match the boarding geometry.
   for(const y of[-W/2+3,W/2-3]){const doorway=trainSideDoorSpans(car)[0],front=-L*.12,rear=doorway.max;p.wallBox((rear+front)/2,y,19,front-rear,6,18,P.body,true);p.wallBox((rear+front)/2,y,48,front-rear,5,5,P.lining);for(const x of[doorway.min-2,doorway.max+2,-L*.15])p.wallBox(x,y,36,4,6,28,P.body);p.windowPane((rear+front)/2,y,39,Math.max(12,front-rear-10),10);}
   p.wallBox(-L*.08,0,19,9,W-6,41,P.body,true);
  }else{
   paintTrainEndFrames(p,car,P);
   const wallY=W/2-3;
   const doors=trainSideDoorSpans(car),middle=doors[1].min;for(const side of[-1,1]){p.wallBox(0,side*wallY,19,middle*2,6,18,P.body,true);p.wallBox(0,side*wallY,57,L-7,6,7,P.body);for(const end of[-1,1])p.wallBox(end*(L/2-4),side*wallY,19,6,6,38,P.body,true);for(let x=-middle+11;x<middle-27;x+=34){p.wallBox(x,side*wallY,37,4,6,20,P.body);p.windowPane(x+15,side*(wallY+.3),40,25,14);p.line([[x+3,side*(wallY+1),53],[x+22,side*(wallY+1),53]],'#d4e5ce',1.5);}p.line([[-middle,side*(wallY+1),34],[middle,side*(wallY+1),34]],P.lining,2);}
   if(details){
    paintTrainCoachPanels(p,car,P);
    if(!occlusionOnly)paintTrainCoachLining(p,car,P,middle*2,wallY);
   }
   // End wall door opening remains traversable between coaches.
   for(const x of[-L/2+4,L/2-4])for(const side of[-1,1])p.wallBox(x,side*(W/4+10),20,6,W/2-20,37,P.body,true);
  }
 }
 if(part==='furniture'&&signatureOnly){for(const o of trainInterior(d,car)){if(o.kind==='wall')p.wallBox(o.x,o.y,20,o.w,o.h,27,'#51433e',true);else if(o.kind==='door'){const panel=trainDoorGeometry(o,doors[car.id+':'+o.id]??o.open);p.wallBox(panel.x,panel.y,20,o.w,o.h,25,'#6f4d3c',true);}}return;}
 if(part==='furniture'){
  const furniture=actorMask||maskFaces?p:trainFurniturePainter(p,car),cupIds=new Set(trainInterior(d,car).filter(q=>q.kind==='table').slice(0,2).map(q=>q.id)),objects=trainInterior(d,car).filter(o=>o.id!==omitFurnitureId&&(!tablesOnly||o.kind==='table')&&(!furnitureForeground||['table','seat','console','firebox'].includes(o.kind))).slice().sort((a,b)=>Math.sin(car.a)*(a.x-b.x)+Math.cos(car.a)*(a.y-b.y));
  for(const o of objects){const {x,y,w,h}=o;
   if(o.kind==='wall'){if(car.kind==='engine')furniture.wallBox(x,y,20,w,h,27,shade(P.body,.82),true);else paintTrainPartition(furniture,o,P,details);}
   if(o.kind==='door'){const open=doors[car.id+':'+o.id]??o.open,panel=trainDoorGeometry(o,open);furniture.wallBox(panel.x,panel.y,20,w,h,25,'#6f4d3c',true);furniture.box(panel.x+w*.3,y,34,3,4,3,P.lining);}
   if(o.kind==='table'){paintTrainTable(furniture,o,P);if(car.kind==='compartments'&&cupIds.has(o.id)&&!cocoaTaken.has(car.id+':'+o.id)){const ring=(radius,z)=>Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return[x+Math.cos(a)*radius,y+Math.sin(a)*radius,z];});furniture.poly(ring(6,34.5),'#d9c49c',true);furniture.poly(ring(4.5,35),'#eee1bf');const low=ring(3.4,35),high=ring(3.8,41);for(let i=0;i<12;i++){const j=(i+1)%12;furniture.poly([low[i],low[j],high[j],high[i]],i<6?'#c1b18f':'#eee4c7');}furniture.poly(ring(3.8,41),'#fff2cf',true);furniture.poly(ring(2.8,41.5),'#754532');furniture.poly([[x-1.5,y-1,41.7],[x+.5,y-1,41.7],[x+1,y,41.7],[x-1,y+.4,41.7]],'#b27d50');const handle=Array.from({length:10},(_,i)=>{const a=i*Math.PI*2/9;return[x+4.7+Math.cos(a)*2.2,y,38+Math.sin(a)*2.5];});furniture.line(handle,'#f2e4c4',1.6);for(let i=0;i<2;i++){const drift=Math.sin(time*2+i)*1.5;furniture.line([[x-1+i*2,y,43],[x+drift-1+i*2,y,46],[x-drift+i*2,y,49]],'#d8e5d16a',1);}}}

   if(o.kind==='seat'){
    paintTrainSeat(furniture,o,car.kind,P,details);
   }
   if(o.kind==='console')paintTrainControls(furniture,o,P,engine,details);
   if(o.kind==='firebox')paintTrainFirebox(furniture,o,engine,Math.sin(car.a)<=1e-6);
   if(o.kind==='lamp'){furniture.box(x,y,20,3,3,24,'#bda05d');furniture.box(x,y,44,9,9,7,'#e9cd87');}
  }
  if(details&&car.kind==='engine')paintTrainCabWindows(furniture,car,P);
  furniture.flush?.();
 }
 if(part==='machinery'&&car.kind==='engine'){
  paintTrainMachinery(p,car,P);if(Math.sin(car.a)>=-1e-6)drawTrainWreath(p,car);
 }
 if(part==='trim'){
  if(car.kind==='caboose'){if(Math.sin(car.a)<=1e-6)for(const side of[-1,1]){p.box(-L/2-2,side*(W*.34),36,5,8,8,'#50232b',true);p.box(-L/2-5,side*(W*.34),39,3,5,4,'#f37557');}p.line([[-L/2+16,-W*.36,29],[-L/2+16,-W*.36,50],[-L/2+16,-15,50]],P.lining,2);p.line([[-L/2+16,W*.36,29],[-L/2+16,W*.36,50],[-L/2+16,15,50]],P.lining,2);}
  for(const side of[-1,1].filter(side=>side*Math.cos(car.a)>=-1e-6)){p.line([[-L/2+6,side*(W/2+1),22],[L/2-6,side*(W/2+1),22]],P.lining,2);if(car.kind!=='engine'&&car.kind!=='tender'){p.box(0,side*(W/2+2),26,46,1,7,'#5c2f38');p.line([[-16,side*(W/2+3),29],[16,side*(W/2+3),29]],'#e3cc93',2);}}
 }
 if(part==='roof'&&car.kind!=='tender'){
  const x0=car.kind==='engine'?-L/2-4:-L/2+1,x1=car.kind==='engine'?-L*.08:L/2-1;
  paintTrainRoofEnd(p,car,P,x0,x1);
  for(let j=0;j<8;j++){const y0=-W/2-4+(W+8)*j/8,y1=-W/2-4+(W+8)*(j+1)/8,z0=64+12*Math.sin(j*Math.PI/8),z1=64+12*Math.sin((j+1)*Math.PI/8);p.poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1]],shade(P.roof,.7+.5*Math.sin((j+.5)*Math.PI/8)),j===0||j===7);}
  for(let x=x0+18;x<x1;x+=42)p.line([[x,-W/2-2,65],[x,-W/4,73],[x,0,77],[x,W/4,73],[x,W/2+2,65]],shade(P.roof,.78),1.5);
  if(car.kind!=='engine')for(const x of[-L*.23,L*.23])p.box(x,0,76,22,16,4,'#27343d',true);
  if(details)paintTrainRoofDetails(p,car,P,x0,x1);
  if(car.kind==='caboose'){p.box(0,0,70,66,W*.68,6,shade(P.roof,.65),true);p.box(0,0,74,60,W*.64,27,P.body,true);for(const side of[-1,1]){p.box(0,side*(W*.32+.5),82,38,2,12,'#85b2b5',true);p.line([[-19,side*(W*.32+2),96],[19,side*(W*.32+2),96]],P.lining,2);}p.box(0,0,100,70,W*.74,2,shade(P.roof,.65),true);for(let j=0;j<6;j++){const y0=-W*.37+W*.74*j/6,y1=-W*.37+W*.74*(j+1)/6,z0=102+5*Math.sin(j*Math.PI/6),z1=102+5*Math.sin((j+1)*Math.PI/6);p.poly([[-35,y0,z0],[35,y0,z0],[35,y1,z1],[-35,y1,z1]],shade(P.roof,.78+.34*Math.sin((j+.5)*Math.PI/6)));}p.box(L*.26,0,76,8,8,15,'#26323a',true);}
 }
}
function paintCoalFallback(p,car,time,speed){for(const q of coalClusters(car)){const jitter=speed>0?Math.round(Math.sin(time*19+q.seed)*Math.min(1,speed/35)):0;p.box(q.x+jitter,q.y,q.z,q.r*2,q.r*1.5,4,'#3d484e',true);p.box(q.x+jitter-1,q.y-1,q.z+4,q.r,2,1,'#687078');}}
export function drawTrainCoalFallback(ctx,car,time=0,speed=0,options={}){paintCoalFallback(painter(ctx,car,options),car,time,speed);}
const spriteCanvases=new WeakMap();
export function drawTrainPixelSprite(ctx,s,x,y){let canvas=spriteCanvases.get(s);if(!canvas){canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const c=canvas.getContext('2d'),image=c.createImageData(s.width,s.height);for(let i=0;i<s.pixels.length;i++){const hex=s.palette[s.pixels[i]];if(!hex||hex==='transparent')continue;image.data[i*4]=parseInt(hex.slice(1,3),16);image.data[i*4+1]=parseInt(hex.slice(3,5),16);image.data[i*4+2]=parseInt(hex.slice(5,7),16);image.data[i*4+3]=hex.length===9?parseInt(hex.slice(7,9),16):255;}c.putImageData(image,0,0);spriteCanvases.set(s,canvas);}ctx.drawImage(canvas,x,y);}
export function trainPartSprite(d,car,part,view){const existing=d.art[car.kind+':'+part+':'+view];if(existing)return structuredClone(existing);const s=TRAIN_ART_SIZE,canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const c=canvas.getContext('2d');c.translate(s.x,s.y);drawTrainPart(c,d,{...car,a:trainViewAngle(view)},part,{painted:false,staticArt:true});const rgba=c.getImageData(0,0,s.width,s.height).data,palette=['transparent'],map=new Map(),pixels=[];for(let i=0;i<rgba.length;i+=4){if(rgba[i+3]<128){pixels.push(0);continue;}const hex='#'+[rgba[i],rgba[i+1],rgba[i+2]].map(v=>(Math.round(v/8)*8>255?255:Math.round(v/8)*8).toString(16).padStart(2,'0')).join('');if(!map.has(hex)){map.set(hex,palette.length);palette.push(hex);}pixels.push(map.get(hex));}return{width:s.width,height:s.height,palette,pixels};}
const livePartCaches=new WeakMap();
const signatureContext={save(){},restore(){},globalAlpha:1};
const ENGINE_REAR_PARTS=['chassis','wheels','body','machinery','furniture','trim','roof'];
export function trainPaintOrder(d,car){
 if(car.kind!=='engine'||Math.sin(car.a)>=-1e-6)return TRAIN_PARTS;
 const view=trainViewIndex(car.a);
 if(d.art?.['engine:furniture:'+view]||d.art?.['engine:machinery:'+view])return TRAIN_PARTS;
 // On the cab side the boiler is behind the bulkhead, grate and cab controls.
 return ENGINE_REAR_PARTS;
}
export function trainPartPhase(car,part,time=0){
 const offset=car.index*.19||0;
 if(part==='body'&&car.kind==='tender')return Math.floor((time+offset)*6);
 if(part==='body'&&car.kind!=='tender')return Math.floor((time+offset)*1.25);
 if(part==='furniture'&&car.kind==='compartments')return Math.floor((time+offset)*2);
 return 0;
}
export function trainVisualPartCar(d,car,part){
 if(d.art?.[car.kind+':'+part+':'+trainViewIndex(car.a)])return car;
 return {...car,a:Math.round(car.a/(Math.PI*2)*256)/256*Math.PI*2};
}
function livePart(ctx,d,car,part,options){
 if(typeof document==='undefined'||d.art?.[car.kind+':'+part+':'+trainViewIndex(car.a)]){drawTrainPart(ctx,d,car,part,options);return;}
 if(part==='machinery'&&car.kind!=='engine'||part==='roof'&&car.kind==='tender')return;
 const angle=Math.round(car.a/(Math.PI*2)*256),posed=trainVisualPartCar(d,car,part),bits=[];
 if(options.riders?.length&&['body','furniture'].includes(part))drawTrainPart(signatureContext,d,posed,part,{...options,occlusionOnly:true,signatureOnly:true,visibilityBits:bits});
 const phase=trainPartPhase(car,part,options.time||0),furniture=part==='furniture';
 const doors=furniture?Object.entries(options.doors||{}).filter(([k])=>k.startsWith(car.id+':')).map(([k,v])=>k+':'+v).join(','):'';
 const cups=furniture?[...(options.cocoaTaken||[])].filter(k=>k.startsWith(car.id+':')).join(','):'';
 const key=[d.trackRevision||0,car.id,part,angle,car.length,car.width,phase,furniture&&car.kind==='engine'&&options.engine?1:0,options.occlusionOnly?1:0,options.exteriorFront?1:0,bits.join(''),doors,cups,part==='wheels'?options.wheelPass:'',part==='body'&&car.kind==='tender'&&options.speed>0?1:0].join('|');
 let cache=livePartCaches.get(d);if(!cache){cache={images:new Map(),pixels:0};livePartCaches.set(d,cache);}let image=cache.images.get(key);
 if(!image){const ca=Math.abs(Math.cos(posed.a)),sa=Math.abs(Math.sin(posed.a)),half=Math.ceil((ca*(car.length+35)+sa*(car.width+20))/2)+12,ground=Math.ceil((sa*(car.length+35)+ca*(car.width+20))/2)+12,top=ground+(part==='wheels'?20:116),canvas=document.createElement('canvas');canvas.width=half*2;canvas.height=top+ground+20;const pen=canvas.getContext('2d');pen.translate(half,top);drawTrainPart(pen,d,posed,part,part==='wheels'?{...options,staticArt:true}:options);image={canvas,half,top,pixels:canvas.width*canvas.height};cache.images.set(key,image);cache.pixels+=image.pixels;while(cache.pixels>12*1024*1024&&cache.images.size>1){const first=cache.images.keys().next().value;cache.pixels-=cache.images.get(first).pixels;cache.images.delete(first);}}
 else{cache.images.delete(key);cache.images.set(key,image);}ctx.imageSmoothingEnabled=false;ctx.drawImage(image.canvas,-image.half,-image.top);
 if(part==='wheels'&&!options.staticArt)drawTrainPart(ctx,d,posed,part,{...options,wheelMotionOnly:true});
}
export function drawTrainCar(ctx,d,car,options={},occupants){ctx.save();ctx.translate(car.x,car.y-car.z);for(const part of trainPaintOrder(d,car)){if(part==='furniture'&&car.kind!=='engine'&&car.kind!=='tender'&&!options.riders?.length&&(options.roofAlpha??1)>=.995)continue;if(part==='roof'){occupants?.();if(!options.riders?.length)livePart(ctx,d,car,'body',{...options,occlusionOnly:true,exteriorFront:true});if(options.riders?.length)for(const wallPart of['body','furniture'])livePart(ctx,d,car,wallPart,{...options,occlusionOnly:true});ctx.globalAlpha=options.roofAlpha<.025?0:options.roofAlpha??1;}if(ctx.globalAlpha>0)livePart(ctx,d,car,part,{...options,wheelPass:part==='wheels'&&!d.art?.[car.kind+':wheels:'+trainViewIndex(car.a)]?'far':'all'});if(part==='body'&&!d.art?.[car.kind+':wheels:'+trainViewIndex(car.a)])livePart(ctx,d,car,'wheels',{...options,wheelPass:'near'});ctx.globalAlpha=1;}ctx.restore();}
export function drawTrainTurnaround(canvas,d,{cutaway=false}={}){const c=canvas.getContext('2d');canvas.width=1120;canvas.height=960;c.fillStyle='#20352f';c.fillRect(0,0,1120,960);for(let v=0;v<8;v++){const ox=(v%2)*560+280,oy=Math.floor(v/2)*240+165;c.fillStyle='#e9d6aa';c.font='14px monospace';c.fillText(TRAIN_VIEWS[v],ox-250,oy-143);c.save();c.translate(ox,oy);c.scale(.95,.95);const car={...d.cars[0],a:trainViewAngle(v)};for(const part of trainPaintOrder(d,car)){c.globalAlpha=cutaway&&part==='roof'?.12:1;drawTrainPart(c,d,car,part,{engine:true,time:.5,distance:7,wheelPass:part==='wheels'&&!d.art?.[car.kind+':wheels:'+v]?'far':'all'});if(part==='body'&&!d.art?.[car.kind+':wheels:'+v])drawTrainPart(c,d,car,'wheels',{engine:true,time:.5,distance:7,wheelPass:'near'});}c.restore();}}

function drawWheelMotion(p,car,distance){const L=car.length,W=car.width,phase=-distance/14,xs=car.kind==='engine'?[-L*.2,-L*.02,L*.16,L*.34]:car.kind==='tender'?[-L*.28,L*.28]:[-L*.34-12,-L*.34+12,L*.34-12,L*.34+12],r=car.kind==='engine'?14:9;for(const side of[-1,1]){const y=side*(W/2-4);for(const x of xs)for(let i=0;i<6;i++){const a=phase+i*Math.PI/3;p.line([[x,y,r-1],[x+Math.cos(a)*r*.7,y,r-1+Math.sin(a)*r*.7]],'#99a1a0',2);}if(car.kind==='engine'){const z=13+Math.sin(phase)*7;p.line([[xs[0]+Math.cos(phase)*7,side*(W/2+1),z],[xs.at(-1)+Math.cos(phase)*7,side*(W/2+1),z]],'#c1c1ac',4);p.line([[L*.35,side*(W/2+2),15],[L*.15+Math.cos(phase)*9,side*(W/2+2),z]],'#a9aaa2',3);}}}

export function drawTrainForeground(ctx,d,car,options){ctx.save();ctx.translate(car.x,car.y-car.z);for(const part of ['body','furniture'])livePart(ctx,d,car,part,{...options,occlusionOnly:true});ctx.restore();}

export function drawTrainTableForeground(ctx,d,car,rider,options={}){
 return drawRiderFurniture(ctx,d,car,rider,options,true);
}
export function drawTrainRiderFurnitureForeground(ctx,d,car,rider,options={}){
 return drawRiderFurniture(ctx,d,car,rider,options,false);
}
function drawRiderFurniture(ctx,d,car,rider,options,tablesOnly){
 ctx.save();ctx.translate(car.x,car.y-car.z);drawTrainPart(ctx,d,car,'furniture',{...options,tablesOnly,furnitureForeground:true,riderClip:rider});ctx.restore();return true;
}
