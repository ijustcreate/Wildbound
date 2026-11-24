import {trainEngineProfile} from './train-construction.mjs';
// Native train craft: the shop's stepped contours and compact material planes,
// kept inside the existing furniture, wall and machinery support footprints.
const shade=(hex,k)=>'#'+[1,3,5].map(i=>Math.round(Math.min(255,parseInt(hex.slice(i,i+2),16)*k)).toString(16).padStart(2,'0')).join('');
const ring=(x,y,z,rx,ry=rx,n=16)=>Array.from({length:n},(_,i)=>{const a=i*Math.PI*2/n;return[x+Math.cos(a)*rx,y+Math.sin(a)*ry,z];});
function collar(p,x,y,z,rx,ry,height,color,angle=0){
 const low=ring(x,y,z,rx,ry),high=ring(x,y,z+height,rx,ry);
 for(let i=0;i<16;i++){const mid=(i+.5)*Math.PI/8;if(Math.sin(angle)*Math.cos(mid)/rx+Math.cos(angle)*Math.sin(mid)/ry<=0)continue;const j=(i+1)%16;p.poly([low[i],low[j],high[j],high[i]],shade(color,.7+.2*Math.sin(i*Math.PI/8)));}
 p.poly(high,color,true);
}
export function paintTrainTable(p,o,P){
 const {x,y,w,h}=o,cut=Math.min(3,w/5,h/5);
 p.box(x,y,20,Math.min(w-2,16),4,2,'#3e3331');
 p.box(x,y,20,4,Math.min(h-2,16),2,'#3e3331');
 p.box(x,y,22,5,5,9,'#584035');
 p.box(x,y,29,Math.min(w-3,12),Math.min(h-3,10),2,'#79513b');
 p.box(x,y,31,w,h,2,'#654436',true);
 const top=(inset,z)=>[[x-w/2+cut,y-h/2+inset,z],[x+w/2-cut,y-h/2+inset,z],[x+w/2-inset,y-h/2+cut,z],[x+w/2-inset,y+h/2-cut,z],[x+w/2-cut,y+h/2-inset,z],[x-w/2+cut,y+h/2-inset,z],[x-w/2+inset,y+h/2-cut,z],[x-w/2+inset,y-h/2+cut,z]];
 p.poly(top(0,33),shade(P.wood,.72),true);p.poly(top(1,34),P.wood);
 p.line([[x-w/2+3,y-h/2+2,34],[x+w/2-3,y-h/2+2,34]],shade(P.wood,1.24),1);
 p.line([[x-w/2+3,y+h*.12,34],[x+w/2-3,y+h*.12,34]],shade(P.wood,.9),1);
}
export function paintTrainSeat(p,o,kind,P,details=true){
 const {x,y,w,h}=o,a=(o.facing??0)*Math.PI/2,dx=Math.round(Math.cos(a)),dy=Math.round(Math.sin(a)),bx=x-dx*w*.38,by=y-dy*h*.38,bw=dx?5:w,bh=dy?5:h;
 const cloth=kind==='seats'?'#7d8565':P.seats,wood='#614238';
 for(const sx of[-1,1])for(const sy of[-1,1])p.box(x+sx*(w/2-3),y+sy*(h/2-3),20,4,4,4,'#46372f',false,o.id);
 p.box(x,y,24,w,h,2,wood,true,o.id);
 p.box(x,y,26,w-3,h-3,1,shade(cloth,.66),false,o.id);
 p.box(x,y,27,w-5,h-5,1,shade(cloth,1.18),false,o.id);
 p.box(bx,by,25,bw,bh,14,wood,true);
 if(details){
 p.box(bx+dx,by+dy,28,dx?3:w-4,dy?3:h-4,9,shade(cloth,.92));
 p.box(bx+dx*1.5,by+dy*1.5,36,dx?3:w-5,dy?3:h-5,1,shade(cloth,1.22));
 const along=dx?h:w;
 for(const n of[-.22,.22]){const xx=bx+(dy?along*n:dx*2),yy=by+(dx?along*n:dy*2);p.box(xx,yy,32,2,2,1,shade(cloth,.66));}
 }
 // Narrow timber end caps; no taller cushion or new collision volume.
 for(const side of[-1,1]){const xx=x+(dy?side*(w/2-2):0),yy=y+(dx?side*(h/2-2):0);p.box(xx,yy,26,dy?3:w-4,dx?3:h-4,3,wood);p.line([[xx-(dy?0:w/2-3),yy-(dx?0:h/2-3),29],[xx+(dy?0:w/2-3),yy+(dx?0:h/2-3),29]],'#a87c56',1);}
}
export function paintTrainMachinery(p,car,P){
 const L=car.length,W=car.width,x0=-L*.02,x1=L*.42,{radius:R,centerZ:zc,stackTop}=trainEngineProfile(car);
 const pipe=side=>{for(const x of[L*.04,L*.25])p.box(x,side*(R+1),zc-5,3,5,5,'#4b5655');p.line([[-L*.06,side*(R+2),zc-2],[L*.23,side*(R+2),zc-2],[L*.27,side*(R+2),zc-12],[L*.4,side*(R+2),zc-12]],shade(P.lining,.62),4);p.line([[-L*.06,side*(R+2),zc-1],[L*.23,side*(R+2),zc-1],[L*.27,side*(R+2),zc-11],[L*.4,side*(R+2),zc-11]],P.lining,2);};
 for(const x of[L*.04,L*.28])p.box(x,0,7,18,R*2+4,10,'#2e3e43',true);
 for(const side of[-1,1].filter(side=>side*Math.cos(car.a)<-1e-6))pipe(side);
 for(let j=0;j<24;j++){const a=j*Math.PI/12,b=(j+1)*Math.PI/12,mid=(a+b)/2;if(Math.cos(car.a)*Math.cos(mid)+Math.sin(mid)<=0)continue;const k=Math.max(.5,Math.round((.7+.48*Math.sin(mid))*8)/8);p.poly([[x0,Math.cos(a)*R,zc+Math.sin(a)*R],[x1,Math.cos(a)*R,zc+Math.sin(a)*R],[x1,Math.cos(b)*R,zc+Math.sin(b)*R],[x0,Math.cos(b)*R,zc+Math.sin(b)*R]],shade(P.body,k));}
 for(const x of[L*.04,L*.25])for(let j=0;j<24;j++){const a=j*Math.PI/12,b=(j+1)*Math.PI/12;if(Math.cos(car.a)*Math.cos((a+b)/2)+Math.sin((a+b)/2)<=0)continue;const pts=[[x,Math.cos(a)*R,zc+Math.sin(a)*R],[x,Math.cos(b)*R,zc+Math.sin(b)*R]];p.line(pts,shade(P.lining,.64),5);p.line(pts,P.lining,2);}
 // Rounded smokebox face, with a recessed door rather than a square block.
 const face=(x,r)=>Array.from({length:20},(_,i)=>{const a=i*Math.PI*2/20;return[x,Math.cos(a)*r,zc+Math.sin(a)*r];});
 if(Math.sin(car.a)>=-1e-6){
 p.poly(face(x1+1,R*.92),'#202d34',true);p.poly(face(x1+2,R*.74),'#405056',true);p.poly(face(x1+3,R*.61),'#2c3a41');
 p.line([[x1+4,-8,zc],[x1+4,8,zc]],'#81918b',2);p.line([[x1+4,0,zc-8],[x1+4,0,zc+8]],'#81918b',2);
 }else{
  const back=x0-.5;
  p.poly(face(back,R),'#252b32',true);
  p.poly(face(back-.5,R*.9),'#56625f');
  p.poly(face(back-1,R*.82),'#373f43');
  for(const a of[Math.PI/6,Math.PI/2,Math.PI*5/6]){
   const y=Math.cos(a)*R*.86,z=zc+Math.sin(a)*R*.86;
   p.line([[back-1.5,y-1,z],[back-1.5,y+1,z]],'#a29471',2);
  }
 }
 const fittings=[{x:L*.07,kind:'dome'},{x:L*.29,kind:'dome'},{x:L*.39,kind:'stack'}].sort((a,b)=>Math.sin(car.a)*(a.x-b.x));
 for(const fitting of fittings){const x=fitting.x,skin=zc+R;
  if(fitting.kind==='dome'){collar(p,x,0,skin-.5,8,8,1.5,shade(P.lining,.66),car.a);collar(p,x,0,skin+1,6,6,5,P.lining,car.a);p.poly(ring(x,0,skin+7,4,4),'#ead09b');continue;}
  collar(p,x,0,skin-.5,8,9,stackTop-6-(skin-.5),'#293940',car.a);
  const low=ring(x,0,stackTop-7,8,9),high=ring(x,0,stackTop-1,13,14);
  for(let i=0;i<16;i++){const mid=(i+.5)*Math.PI/8;if(Math.sin(car.a)*Math.cos(mid)+Math.cos(car.a)*Math.sin(mid)<=0)continue;const j=(i+1)%16;p.poly([low[i],low[j],high[j],high[i]],i<8?'#536365':'#34464b');}
  p.poly(high,'#6d7d79',true);p.poly(ring(x,0,stackTop-.5,10,11),'#142127');p.poly(ring(x+1,0,stackTop,7,8),'#080f15');
 }
 const front=L/2;p.poly([[front+18,0,7],[front,-W*.46,18],[front,W*.46,18]],'#26383d',true);
 for(let y=-30;y<=30;y+=10)p.line([[front+16,0,8],[front,y,18]],'#7a8980',2);
 if(Math.sin(car.a)>=-1e-6){collar(p,front-7,0,35,9,9,7,'#88734d',car.a);p.box(front-3,0,44,4,10,7,'#ffe7a2');p.box(front-2,-2,48,3,4,2,'#fff3c5');}
 for(const side of[-1,1].filter(side=>side*Math.cos(car.a)>=-1e-6))pipe(side);
}
export function paintTrainCoachPanels(p,car,P){
 const L=car.length,W=car.width,limit=L/2-42;
 for(const side of[-1,1]){const y=side*(W/2+.2);
  for(let x=-limit+19;x<limit;x+=34){p.wallBox(x,y,22,28,1,9,shade(P.body,.72));p.wallBox(x,y,30,25,1,1,shade(P.body,1.16));}
  p.wallBox(0,side*(W/2-1),55,L-16,2,2,shade(P.lining,.72));
 }
}
export function paintTrainCoachLining(p,car,P,wallLength,wallY){
 const facing=Math.cos(car.a);
 if(Math.abs(facing)<.08||wallLength<20)return;
 // The camera sees the inside of the far wall. Seat-height decoration is
 // painted onto its existing face, below the windows and clear of the doors.
 const side=facing>0?-1:1,y=side*(wallY-3.2),half=wallLength/2;
 const face=(x0,x1,z0,z1,color)=>p.poly([[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],color);
 const panel=car.kind==='caboose'?'#76503f':car.kind==='compartments'?'#704939':'#74583f';
 const recess=shade(panel,.78),warm=shade(panel,1.22),mid=shade(panel,1.04);
 face(-half,half,20,36,recess);
 face(-half,half,34,36,shade(P.lining,.76));
 face(-half,half,20,22,shade(panel,.63));
 for(let x=-half+5,index=0;x+9<half;x+=25,index++){
  const end=Math.min(x+21,half-4);
  face(x,end,23,33,panel);
  face(x+1,end-1,26,32,index%3===0?warm:mid);
  face(x+3,end-2,24,25,recess);
  face(x+3,end-4,31,32,warm);
  if(index%3===1) {
   face(x+6,Math.min(end,x+15),28,29,shade(panel,.87));
   face(x+9,Math.min(end,x+17),27,28,panel);
  }
 }
}

export function paintTrainAisleCloth(p,car,P,aisle){
 const {length:L,width:W,kind}=car;
 if(kind!=='compartments'&&kind!=='seats'&&kind!=='caboose')return;
 const x0=-L/2+32,x1=L/2-32;
 const center=aisle?.center??(kind==='compartments'?W/2-16:0),half=aisle?.half??(kind==='compartments'?6:7);
 const y0=center-half,y1=center+half;
 // The edge is flush with the deck. Its horizontal graphic never casts an
 // occlusion silhouette over someone using the gangway or sitting nearby.
 const edge=shade(P.seats,.48),cloth=shade(P.seats,kind==='compartments'?.65:.72);
 const knot=shade(P.lining,.79),z=20.4;
 p.poly([[x0,y0+2,z],[x0+3,y0,z],[x1-3,y0,z],[x1,y0+2,z],
  [x1,y1-2,z],[x1-3,y1,z],[x0+3,y1,z],[x0,y1-2,z]],edge);
 p.poly([[x0+3,y0+2,z],[x1-3,y0+2,z],[x1-3,y1-2,z],[x0+3,y1-2,z]],cloth);
 for(const y of[y0+2,y1-2])p.line([[x0+4,y,z],[x1-4,y,z]],shade(P.lining,.66),1);
 for(let x=x0+12,i=0;x<x1-8;x+=21,i++){
  p.poly([[x-4,center,z],[x,center-2,z],[x+4,center,z],[x,center+2,z]],knot);
  const y=center+(i%2===0?-3:3);
  p.line([[x+7,y,z],[Math.min(x+13,x1-4),y,z]],shade(P.seats,.84),1);
 }
}
export function paintTrainRoofDetails(p,car,P,x0,x1){
 const W=car.width;
 // Long rolled gutters and two restrained slate highlight strips.
 for(const side of[-1,1])p.line([[x0+2,side*(W/2+2),65],[x1-2,side*(W/2+2),65]],shade(P.roof,.52),3);
 for(const y of[-W*.18,-W*.27]){const z=64+12*Math.cos(y/W*Math.PI);p.line([[x0+8,y,z+.5],[x1-8,y,z+.5]],shade(P.roof,1.18),1);}
 if(car.kind!=='engine')for(const x of[-car.length*.23,car.length*.23])for(const dx of[-6,-2,2,6])p.line([[x+dx,-5,80.2],[x+dx,5,80.2]],'#596c6c',1);
}
export function paintTrainPartition(p,o,P,details=true){
 const {x,y,w,h}=o,across=w>=h,long=across?w:h;
 p.wallBox(x,y,20,w,h,27,'#514039',true);
 if(!details)return;
 for(const side of[-1,1])for(const offset of[-.24,.24]){
  const xx=across?x+offset*long:x+side*(w/2+.1),yy=across?y+side*(h/2+.1):y+offset*long;
  p.wallBox(xx,yy,24,across?long*.4:.5,across?.5:long*.4,17,'#6b493b');
  p.wallBox(xx,yy,26,across?long*.4-3:.6,across?.6:long*.4-3,13,'#795443');
 }
 p.wallBox(x,y,44,w,h,3,'#8d674b');
 p.wallBox(x,y,46,w,h,1,'#b08a60');
}
export function paintTrainCabWindows(p,car,P){
 const x=-car.length*.06+3.5;
 for(const side of[-1,1]){
  p.wallBox(x,side*car.width*.24,39,1,20,15,'#372e2c');
  p.wallBox(x+.5,side*car.width*.24,41,1,16,11,'#638b8b');
  p.wallBox(x+.7,side*car.width*.24-4,43,1,5,8,'#98b6a8');
  p.wallBox(x+1,side*car.width*.24,54,1,21,1,P.lining);
 }
}
export function paintTrainControls(p,o,P,running,details=true){
 const {x,y,w,h}=o,x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2;
 p.box(x,y,20,w,h,10,'#344347',true);
 p.poly([[x0,y0,30],[x1,y0,37],[x1,y1,37],[x0,y1,30]],'#596b68',true);
 p.poly([[x1,y0,30],[x1,y1,30],[x1,y1,37],[x1,y0,37]],'#29373c');
 p.line([[x-7,y-2,32],[x-7+(running?3:0),y-2,44]],P.lining,2);
 p.box(x-7+(running?3:0),y-2,44,4,5,3,'#653d35',true);
 if(!details)return;
 const surface=xx=>30+7*(xx-x0)/w;
 for(const dy of[-4,4]){
  const dial=r=>Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,xx=x+5+Math.cos(a)*r;return[xx,y+dy+Math.sin(a)*r,surface(xx)+.4];});
  p.poly(dial(3.6),P.lining,true);p.poly(dial(2.6),'#e5d5aa');
  p.line([[x+5,y+dy,surface(x+5)+.7],[x+6,y+dy-1.8,surface(x+6)+.7]],'#3b514e',1);
 }
 p.box(x-6,y+5,31,3,3,2,running?'#b6c28a':'#af7652');
 const wheel=Array.from({length:17},(_,i)=>[x-2+Math.cos(i*Math.PI/8)*3.5,y+7,36+Math.sin(i*Math.PI/8)*3.5]);
 p.line(wheel,'#b29562',1);for(const a of[0,Math.PI/2])p.line([[x-2-Math.cos(a)*3,y+7,36-Math.sin(a)*3],[x-2+Math.cos(a)*3,y+7,36+Math.sin(a)*3]],'#b29562',1);
}
export function paintTrainFirebox(p,o,lit,frontVisible=true){
 const {x,y,w,h}=o,front=x-w/2-.5,ry=Math.min(12,h*.35);
 p.box(x,y,20,w,h,25,'#2b383d',true);
 p.line([[x-w*.3,y-h/2+2,45],[x+w*.3,y-h/2+2,45]],'#65766d',1);
 if(!frontVisible)return;
 const opening=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return[front,y+Math.cos(a)*ry,33+Math.sin(a)*9];});
 p.poly(opening,'#111e26',true);
 const ember=opening.map(([xx,yy,zz])=>[xx-.2,y+(yy-y)*.75,33+(zz-33)*.73]);p.poly(ember,lit?'#a94c32':'#422f2c');
 if(lit){p.poly([[front-.3,y-ry*.5,28],[front-.3,y-ry*.6,33],[front-.3,y-ry*.2,36],[front-.3,y,32],[front-.3,y+ry*.35,37],[front-.3,y+ry*.5,28]],'#edb55d');p.line([[front-.5,y-4,29],[front-.5,y,33],[front-.5,y+4,29]],'#ffe29a',2);}
 else p.line([[front-.4,y-4,28],[front-.4,y-1,29],[front-.4,y+4,28]],'#a44b32',2);
 for(const dy of[-.55,0,.55])p.line([[front-.6,y+ry*dy,26],[front-.6,y+ry*dy,39]],'#263337',2);
 p.line([[front-1,y+ry+1,29],[front-1,y+ry+1,36]],'#b19463',2);
}
export function paintTrainWallLining(p,car,P){
 const L=car.length,W=car.width,limit=L/2-42;
 for(const side of[-1,1]){
  for(let x=-limit+17;x<limit;x+=34){p.wallBox(x,side*(W/2-6.5),20,30,1,13,'#70503e');p.wallBox(x,side*(W/2-7),23,24,.6,7,'#825e46');}
  p.wallBox(0,side*(W/2-6.5),33,limit*2,1,2,'#b08a5b');
 }
}
