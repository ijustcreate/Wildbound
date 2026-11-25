import {GREYHAVEN,castleChamfer,castleSiteIntersects,castleSurface} from './wild-castle-site.mjs';
import {castleDrawbridgeProjection,paintCastleDrawbridge} from './wild-castle-drawbridge-art.mjs';
import {paintCastleOuterBank} from './wild-castle-outer-bank.mjs';
import {drawCastleStack} from './wild-castle-stack.mjs';
import {drawCastleArch,drawCastleBankBlock,drawCastleGrassTuft,drawCastleLantern,drawCastleLily,
 drawCastleRoofShoulders,drawCastleSlateRoof,drawCastleStoneCourses,drawCastleTowerShaft,
 drawCastleTurretCover} from './wild-castle-exterior-stacks.mjs';

// Static stacks are baked into the native keep and ground passes at their existing world anchors.
const {castle,island,moat,drawbridge,bridge,door,towers}=GREYHAVEN;
const burgundy='#782e31',gold='#d6a656';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const noise=(x,y)=>((Math.imul(x|0,19349663)^Math.imul(y|0,83492791))>>>0)%997/997;
function path(c,points){
 c.beginPath();c.moveTo(...points[0]);
 for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
 c.closePath();
}
function poly(c,points,color){path(c,points);c.fillStyle=color;c.fill();}
function oval(c,x,y,rx,ry,color){
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function ring(b,k,d=0){
 const {left:l,top:t,right:r,bottom:s}=b;
 return [[l+k,t-d],[r-k,t-d],[r+d,t+k],[r+d,s-k],[r-k,s+d],[l+k,s+d],[l-d,s-k],[l-d,t+k]];
}
function rim(c,b,k,color,w,d=0){
 path(c,ring(b,k,d));c.lineWidth=w;c.strokeStyle=color;c.stroke();
}
function wall(c,l,top,r,bottom,w=30,h=13){
 drawCastleStoneCourses(c,l,top,r,bottom,w,h);
 for(let y=top,row=0;y<bottom;y+=h,row++)for(let x=l-(row%2)*w/2;x<r;x+=w){
  const a=Math.max(l,x),b=Math.min(r,x+w-1.5);
  if(b-a<9||bottom-y<h-1)continue;
  const n=noise(x,y);
  if(n>.64)rect(c,a+4,y+5,Math.round(2+n*w*.23),2,'#4d57494f');
  if(n<.25)rect(c,b-5,y+2,5,1,'#d8caa070');
  if(y>bottom-h*2&&n>.35){
   rect(c,a+3,y+h-3,b-a-6,3,'#5a684557');
   if(n>.67)rect(c,a+4,y+h-5,7,3,'#6570458f');
  }
 }
}
function slit(c,x,y,h=28,lit=false){
 drawCastleArch(c,x,y+h-1,6,h-4,lit);
}
function arrowLoop(c,x,y){
 rect(c,x-4,y-25,8,24,'#969987');rect(c,x-2,y-22,4,19,'#293735');
 rect(c,x-6,y-11,12,3,'#293735');rect(c,x-5,y-1,10,2,'#b6b49a');
}
function windowPair(c,x,y){
 for(const side of [-1,1])drawCastleArch(c,x+side*6,y,3,18,false);
 rect(c,x-15,y-1,31,3,'#5d665d');rect(c,x-14,y-1,29,1,'#bbba9e');
}
function hipPlane(c,points,palette,originX,originY){
 c.save();path(c,points);c.clip();
 const l=Math.min(...points.map(q=>q[0])),r=Math.max(...points.map(q=>q[0]));
 const t=Math.min(...points.map(q=>q[1])),b=Math.max(...points.map(q=>q[1]));
 rect(c,l,t,r-l,b-t,palette[0]);
 for(let y=t,row=0;y<b;y+=11,row++)for(let x=l-34-(row%2)*17,col=0;x<r;x+=34,col++){
  const group=noise(Math.floor((x-originX)/90),Math.floor((y-originY)/37)),n=noise(col+originX,y);
  const tone=Math.min(3,Math.floor(group*3.2)+(n>.79?1:0));
  rect(c,x,y+1,33,10,palette[tone+1]);
  if(n>.6)rect(c,x+3,y+1,17+Math.round(n*6),1,palette[5]);
  if(n<.26)rect(c,x+24,y+8,8,1,'#253a4538');
 }
 c.restore();
}
function hipEdge(c,a,b,color,weight=2){
 const dx=b[0]-a[0],dy=b[1]-a[1],steps=Math.ceil(Math.hypot(dx,dy)/5);
 for(let i=0;i<steps;i++){
  const x=a[0]+dx*i/steps,y=a[1]+dy*i/steps;
  rect(c,x,y,Math.max(weight,Math.ceil(Math.abs(dx)/steps)+1),Math.max(weight,Math.ceil(Math.abs(dy)/steps)+1),color);
 }
}
function roof(c,l,t,r,b){
 const backL=[l+27,t+30],backR=[r-27,t+30],frontL=[l-12,b],frontR=[r+12,b];
 const ridgeL=[l+125,t+102],ridgeR=[r-111,t+102];
 poly(c,[backL,backR,frontR,frontL],'#243943');
 hipPlane(c,[backL,backR,ridgeR,ridgeL],['#394b50','#445b60','#496066','#4d6469','#53686c','#758988'],l,t);
 hipPlane(c,[backL,ridgeL,frontL],['#405761','#58737d','#607a83','#647e84','#688188','#93aaa8'],l,t);
 hipPlane(c,[ridgeR,backR,frontR],['#283b46','#334954','#384d57','#3d525b','#42585e','#637b7e'],l,t);
 hipPlane(c,[frontL,ridgeL,ridgeR,frontR],['#354b54','#4e636c','#526872','#566d74','#5a7078','#72888b'],l,t);
 hipEdge(c,frontL,ridgeL,'#91a4a280');hipEdge(c,ridgeR,frontR,'#273b45',3);
 hipEdge(c,backL,ridgeL,'#78918f',2);hipEdge(c,backR,ridgeR,'#273b45',2);
 rect(c,ridgeL[0]-3,ridgeL[1]-3,ridgeR[0]-ridgeL[0]+6,7,'#455861');
 rect(c,ridgeL[0]+1,ridgeL[1]-4,ridgeR[0]-ridgeL[0]-2,2,'#9aada6');
 for(let x=ridgeL[0]+8;x<ridgeR[0];x+=16)rect(c,x,ridgeL[1]-1,2,4,'#627676');
 rect(c,frontL[0],b-1,frontR[0]-frontL[0],7,'#263a41');
 rect(c,frontL[0]+2,b-1,frontR[0]-frontL[0]-4,2,'#87958a');
}
function pennant(c,x,y,side){
 rect(c,x-1,y-9,2,14,'#5d6659');
 poly(c,[[x+side,y-7],[x+side*8,y-8],[x+side*27,y-5],[x+side*19,y],[x+side*25,y+5],[x+side*7,y+3],[x+side,y+2]],burgundy);
 poly(c,[[x+side*2,y-7],[x+side*11,y-7],[x+side*20,y-5],[x+side*9,y-2],[x+side*4,y-3]],'#a94743');
 rect(c,x+side*6-1,y-5,3,6,gold);
}
function towerCollar(c,x,y,r){
 oval(c,x,y+1,r+8,13,'#4d5b58');oval(c,x,y-2,r+7,11,'#a4a594');
 oval(c,x,y-2,r-1,8,'#667675');
 for(let i=0;i<=10;i++){
  const angle=i*Math.PI/10,px=x+Math.cos(angle)*(r+2),py=y+Math.sin(angle)*10;
  const width=(i===0||i===10)?8:12,half=width/2;
  rect(c,px-half,py-11,width,11,i>4?'#949989':'#727e76');
  rect(c,px-half,py-12,width,3,i>4?'#b0ae99':'#9ca192');
  rect(c,px+half-2,py-9,2,9,'#566561');
 }
}
function tower(c,t,rear){
 const {x,y,r}=t,h=rear?141:162,eave=y-h-6;
 oval(c,x+7,y+6,r+8,21,'#25392b56');oval(c,x,y+4,r+3,13,'#6d7564');
 drawCastleTowerShaft(c,x,y,r,h);
 for(const offset of [8,49,95]){
  oval(c,x,y-offset+1,r+1,9,'#596762');oval(c,x,y-offset,r+1,7,'#8a9082');
  rect(c,x-r+7,y-offset-1,Math.round(r*1.3),2,'#aea891');
 }
 windowPair(c,x-5,y-111);slit(c,x-5,y-87,30,!rear);arrowLoop(c,x-4,y-14);
 const cover=rear?86:99;
 drawCastleTurretCover(c,x,eave+2,r+4,cover);
 towerCollar(c,x,eave+9,r);
 pennant(c,x,eave-cover+1,x<door.x?-1:1);
}
const lion=[
 '....xx....x.', '....xxx..x..', '...xx.x.xx..', '.x..xx.xx...', '..xxxxx.....',
 '....xxx.xx..', '....xx..xxx.', '...xx.x...x.', '.xxx..xx....', '.xx....xxx..',
];
function shield(c,x,y){
 const shape=[[x-16,y-15],[x+16,y-15],[x+16,y+7],[x+11,y+14],[x,y+20],[x-12,y+13],[x-16,y+6]];
 poly(c,shape,'#343b38');
 poly(c,[[x-14,y-15],[x+14,y-15],[x+14,y+6],[x+10,y+12],[x,y+18],[x-10,y+11],[x-14,y+6]],'#9b794b');
 poly(c,[[x-12,y-13],[x+12,y-13],[x+12,y+5],[x+7,y+11],[x,y+16],[x-8,y+10],[x-12,y+5]],burgundy);
 for(let i=0;i<lion.length;i++)for(let j=0;j<lion[i].length;j++){
  if(lion[i][j]==='x')rect(c,x-10+j*1.7,y-8+i*1.7,2,2,gold);
 }
}
function gatehouse(c,b){
 const {x}=door,width=72,top=b-149;
 poly(c,[[x-width-10,top-2],[x-width,top+4],[x-width,b+3],[x-width-10,b-3]],'#767e71');
 poly(c,[[x+width,top+4],[x+width+11,top-3],[x+width+11,b-4],[x+width,b+3]],'#4e5d57');
 wall(c,x-width,top,x+width,b+3,23,12);
 drawCastleSlateRoof(c,x-width-10,top-42,x+width+10,top+5);
 rect(c,x-width-7,top+2,width*2+14,5,'#455752');
 rect(c,x-width-7,top+2,width*2+14,1,'#b8b29a');
 for(const side of [-1,1]){
  const post=x+side*(width-9);
  wall(c,post-7,top+11,post+7,b+4,14,13);
  rect(c,post-9,b-12,18,16,side<0?'#a19e86':'#777e6e');
  rect(c,post-10,b-13,20,3,'#b4ac91');
  rect(c,post-11,b+3,22,3,'#526458');
 }
 drawCastleArch(c,x,b+2,43,86,false,true);
 for(let i=0;i<9;i++){
  const angle=Math.PI*i/8,px=x+46*Math.cos(angle),py=b-53-34*Math.sin(angle);
  rect(c,px-2,py-1,4,2,'#746b59');
  rect(c,px-2,py-2,3,1,'#c7bfa2');
 }
 rect(c,x-5,b-91,10,7,'#d0c3a3');
 shield(c,x,b-113);
 for(const side of [-1,1])drawCastleLantern(c,x+side*62,b-43,false);
}
function paintKeep(c){
 const {left:l,top:t,right:r,bottom:b}=castle;
 for(const q of towers.slice(0,2))tower(c,q,true);
 c.save();path(c,[[l+16,t-51],[r-16,t-51],[r+4,b-127],[l-5,b-127]]);c.clip();
 drawCastleRoofShoulders(c,l-5,t-51,r-l+9,b-t-76);c.restore();
 wall(c,l,b-150,r,b);
 for(const y of [b-104,b-58,b-7]){
  rect(c,l,y,r-l,4,'#58635e');rect(c,l,y,r-l,1,'#bac0a688');
 }
 for(const x of [l+90,l+149,l+208,r-208,r-149,r-90]){
  windowPair(c,x,b-113);slit(c,x,b-99,34,noise(x,b)>.3);arrowLoop(c,x,b-24);
 }
 roof(c,l-3,t-107,r+3,b-144);
 for(const x of [l+58,l+170,r-170,r-58]){
  wall(c,x-7,b-147,x+7,b-3,14,16);
  rect(c,x-8,b-14,16,12,'#939987');
  rect(c,x-9,b-15,18,3,'#b1ad91');
 }
 for(let i=0;i<28;i++){
  const x=l+27+i*18;
  if(Math.abs(x-door.x)>55&&noise(i,44)>.34)drawCastleGrassTuft(c,x,b-4+i%5,i%4);
 }
 gatehouse(c,b);
 for(const q of towers.slice(2))tower(c,q,false);
}

function masonryPath(c,l,t,r,b){
 drawCastleStoneCourses(c,l,t,r,b,19,13,true);
}
function paintIslandBank(c){
 const points=ring(island,48,2).reverse();
 for(let i=0;i<points.length;i++){
  const [x,y]=points[i],[nx,ny]=points[(i+1)%points.length],dx=nx-x,dy=ny-y,length=Math.hypot(dx,dy);
  const angle=Math.atan2(dy,dx),front=(-dy)/length,down=dx/length,steps=Math.ceil(length/22);
  for(let j=0;j<steps;j++){
   const u=j/steps,px=x+dx*u+front,py=y+dy*u+down;
   if(Math.abs(px-door.x)<40&&py>island.bottom-17)continue;
   const n=noise(j+2,i+island.top),depth=(down>.25?10:6)+Math.round(n*9);
   const xx=px+dx/steps,yy=py+dy/steps;
   const middle=[px+dx/steps*.64+front*(depth-2),py+dy/steps*.64+down*(depth-2)];
   poly(c,[[px,py],[xx,yy],[xx+front*depth*.65,yy+down*depth*.65],
    middle,[px+front*depth,py+down*depth]],n>.66?'#857151':n<.27?'#5d5c51':'#6d6450');
   poly(c,[[px,py],[px+dx/steps*.22,py+dy/steps*.22],
    [px+dx/steps*.24+front*depth,py+dy/steps*.24+down*depth],
    [px+front*depth,py+down*depth]],'#3b4b4375');
   if(n>.21)drawCastleBankBlock(c,px+front*(n-.5)*7,py+down*(n-.5)*7,Math.floor(n*3),angle);
   if(j%5===1&&n>.47)drawCastleGrassTuft(c,px-front*7,py-down*7,j%4);
  }
 }
}
function paintLilies(c){
 const beds=[[island.left-63,island.top+100],[island.left-34,island.bottom-104],
  [island.right+45,island.top+110],[island.right+69,island.bottom-131],
  [island.left+75,island.bottom+52],[island.right-99,island.bottom+45]];
 for(const [x,y] of beds)for(let i=0;i<5;i++){
  const px=x+Math.round((noise(i,x)-.5)*43),py=y+Math.round((noise(y,i)-.5)*23),r=3+Math.round(noise(i,y)*4);
  if(castleSurface(px,py)==='water')drawCastleLily(c,px,py,r,i===2);
 }
}
const shrubLayers=[
 [[-11,-3,21,6,'#374f3e'],[-8,-5,15,9,'#425c44']],
 [[-10,-3,20,6,'#527049'],[-8,-6,13,5,'#45634a'],[-2,-4,10,7,'#5d774e']],
 [[-8,-3,12,5,'#6c8452'],[-4,-5,9,4,'#68814f'],[2,-3,6,4,'#577349']],
 [[-6,-3,5,3,'#84935c'],[1,-4,5,2,'#758952'],[-1,0,6,2,'#7d9157']],
];
function paintPlantCluster(c,x,y,seed,flowers=false){
 oval(c,x+3,y+2,16,5,'#35492c75');
 if(Math.abs(seed)%3===0)drawCastleStack(c,x+4,y-2,shrubLayers);
 for(let i=0;i<8;i++){
  const px=x+(noise(seed,i)-.5)*33,py=y+(noise(i,seed)-.5)*17;
  drawCastleGrassTuft(c,px,py,i%4);
  if(!flowers||i%3!==1)continue;
  rect(c,px,py-5,1,5,'#59724a');
  rect(c,px-1,py-7,3,2,i===4?'#dba696':'#e9dba6');
  rect(c,px,py-8,1,5,'#f0ca91');
 }
}
function paintKeepShadows(c){
 const {left:l,right:r,bottom:b}=castle;
 poly(c,[[l-30,b-26],[r-9,b-29],[r+83,b+8],[r+81,b+39],[l+84,b+58],[l+11,b+31]],'#374b3650');
 poly(c,[[l+21,b-18],[r-4,b-22],[r+53,b+7],[r+56,b+26],[l+49,b+40]],'#2e453b41');
 for(const t of towers){
  poly(c,[[t.x-t.r,t.y],[t.x+t.r-6,t.y-2],[t.x+t.r+53,t.y+29],[t.x+t.r+39,t.y+40],
   [t.x-t.r+45,t.y+42],[t.x-t.r+20,t.y+25]],'#34483a40');
  oval(c,t.x+6,t.y+4,t.r-2,12,'#33493965');
 }
}
const pierLayers=Array.from({length:18},(_,z)=>{
 const w=z<5?14:z>12?12:10,h=z<5?13:10;
 return [[-w/2,-2,w,h,'#566058'],[-w/2,-2,3,h-1,'#969580'],[w/2-2,-2,2,h,'#354947'],
  [-w/2+3,6,w-5,2,z%6===0?'#617069':'#818775']];
});
function paintBridgeFootings(c){
 const l=bridge.left,r=bridge.right,a=bridge.top-10,b=bridge.bottom-8;
 const shadow='#1c3d486d';
 poly(c,[[l-13,a+13],[r-1,a+9],[r+28,b-9],[r+18,b+20],[l-22,b+17]],shadow);
 for(const x of [l-4,r+4]){
  for(const y of [a+26,a+57,b-6])drawCastleStack(c,x,y+12,pierLayers);
  for(const y of [a+31,a+62]){
   poly(c,[[x-4,y-6],[x+5,y-6],[x+6,y+9],[x+4,y+14],[x-2,y+14],[x-5,y+10]],'#657065');
   poly(c,[[x-4,y+3],[x-1,y-1],[x+2,y-1],[x+5,y+3],[x+4,y+13],[x-4,y+13]],'#263f43');
  }
 }
 poly(c,[[l-10,b-12],[r+10,b-12],[r+12,b+9],[r+2,b+13],[l-3,b+13],[l-11,b+8]],'#4b5a53');
 wall(c,l-11,b-9,r+12,b+9,23,10);
 poly(c,[[l-11,b+6],[l-3,b+8],[l+12,b+8],[l+12,b+13],[l-3,b+13]],'#929582');
 poly(c,[[r+11,b+6],[r+3,b+8],[r-12,b+8],[r-12,b+13],[r+3,b+13]],'#808777');
}
function paintLanding(c){
 const x=door.x,y=bridge.bottom-9;
 const landing=[[x-36,y],[x+36,y],[x+63,y+31],[x+61,y+37],[x+29,y+47],
  [x-36,y+44],[x-62,y+36],[x-59,y+30]];
 poly(c,landing,'#666c58');
 c.save();path(c,landing);c.clip();masonryPath(c,x-63,y-1,x+63,y+48);
 rect(c,x-70,y+28,141,21,'#88836255');c.restore();
}
function paintFixedBridge(c){
 paintLanding(c);paintBridgeFootings(c);
 const l=bridge.left,r=bridge.right,a=bridge.top-10,b=bridge.bottom-8;
 masonryPath(c,l,a,r,b);
 for(const x of [l-4,r-4]){
  wall(c,x,a-9,x+8,b-2,9,16);
  rect(c,x,a-11,8,b-a+5,'#a6a48f');
  rect(c,x+1,a-9,6,b-a+6,'#818776');
  for(let y=a+3;y<b-2;y+=14){
   rect(c,x,y-8,8,3,'#c1b69a');rect(c,x+6,y-7,2,6,'#5a665b');
  }
 }
}
function paintGround(c){
 paintCastleOuterBank(c);
 rim(c,island,48,'#1b3f4b6c',42,9);rim(c,island,48,'#254b51a0',17,3);
 poly(c,ring(island,48),'#648050');
 rim(c,island,48,'#354a3b',8,3);rim(c,island,48,'#748061',5,0);rim(c,island,48,'#a2a57888',2,-3);
 paintIslandBank(c);
 paintLilies(c);
 for(let i=0;i<145;i++){
  const x=island.left+8+noise(i,245)*(island.right-island.left-16);
  const y=island.top+7+noise(345,i)*(island.bottom-island.top-14);
  if(Math.min(x-island.left,island.right-x)+Math.min(y-island.top,island.bottom-y)<54)continue;
  drawCastleGrassTuft(c,x,y,Math.floor(noise(i,89)*4));
 }
 for(const side of [-1,1]){
  const x=door.x+side*(castle.right-castle.left)/2+side*29;
  for(let i=0;i<8;i++){
   const px=x+side*(noise(i+48,side)*21-7),y=castle.top+39+i*54+noise(i,side)*19;
   if(castleChamfer(island,px,y,61))paintPlantCluster(c,px,y,i+side*11,i%3===1);
  }
  for(let i=0;i<4;i++){
   const px=door.x+side*(88+51*i),y=island.bottom-16-noise(i,side)*13;
   if(castleChamfer(island,px,y,54))paintPlantCluster(c,px,y,i+side*9,i%2===0);
  }
  const px=door.x+side*(72+noise(side,33)*19),y=bridge.bottom+25;
  paintPlantCluster(c,px,y,side*7,true);
 }
 paintKeepShadows(c);
 masonryPath(c,door.x-31,castle.bottom-1,door.x+31,drawbridge.top);
 paintFixedBridge(c);
 for(let i=0;i<30;i++){
  const side=i%4,t=noise(i,island.top),x=side<2?island.left+80+t*(island.right-island.left-160):side===2?island.left:island.right;
  const y=side<2?(side===0?island.top:island.bottom):island.top+79+t*(island.bottom-island.top-158);
  if(Math.abs(x-door.x)<58)continue;
  if(i%3===0)drawCastleGrassTuft(c,x,y,i%4);
 }
}

let groundImage,keepImage;
function cached(c,b,paint,saved){
 if(typeof document==='undefined'){paint(c);return saved;}
 if(!saved){
  const canvas=document.createElement('canvas');
  canvas.width=b.right-b.left;canvas.height=b.bottom-b.top;
  const ctx=canvas.getContext('2d');ctx.translate(-b.left,-b.top);paint(ctx);saved=canvas;
 }
 c.drawImage(saved,b.left,b.top);
 return saved;
}
const groundBounds={left:moat.left-36,top:moat.top-36,right:moat.right+36,bottom:Math.max(moat.bottom+36,bridge.bottom+55)};
const keepBounds={left:castle.left-75,top:castle.top-267,right:castle.right+76,bottom:castle.bottom+27};

export function drawCastleGround(c,bounds,time,bridgeProgress=0){
 if(!castleSiteIntersects(bounds.left,bounds.top,bounds.right,bounds.bottom,55))return;
 groundImage=cached(c,groundBounds,paintGround,groundImage);
 const shadow=1-bridgeProgress*.7,span=(drawbridge.bottom-drawbridge.top)*shadow;
 if(shadow>0)poly(c,[[drawbridge.left+5,drawbridge.top+8],[drawbridge.right+9,drawbridge.top+5],
  [drawbridge.right+17,drawbridge.top+span+7],[drawbridge.left+12,drawbridge.top+span+5]],'#1d3a40a0');
 for(let i=0;i<35;i++){
  const side=i%4,offset=noise(i,41),x=side<2?moat.left+100+offset*(moat.right-moat.left-200):side===2?island.left-39:island.right+38;
  const y=side<2?(side===0?island.top-40:island.bottom+51):island.top+18+offset*(island.bottom-island.top-36);
  if(castleSurface(x,y)!=='water'||Math.abs(x-door.x)<55&&y>=island.bottom)continue;
  const wave=Math.sin(time*.92+i*1.7),length=5+Math.round((wave+1)*3.5)+i%4;
  rect(c,x+wave*4,y+2+i%4,length,1,wave>.45?'#b2cbbc83':'#759f9a58');
  if(i%5===0&&wave>.1)rect(c,x+length+4,y+3+i%4,3,1,'#a8c6b56b');
 }
}

function paintBridgeWithCutaway(c,progress,viewers){
 if(!viewers.length){paintCastleDrawbridge(c,progress);return;}
 const {tipY}=castleDrawbridgeProjection(progress);
 const left=Math.max(drawbridge.left+7,Math.min(...viewers.map(p=>p.x))-13);
 const right=Math.min(drawbridge.right-7,Math.max(...viewers.map(p=>p.x))+13);
 const top=Math.max(tipY-14,Math.min(...viewers.map(p=>p.y))-53);
 const bottom=Math.min(drawbridge.top,Math.max(...viewers.map(p=>p.y))+3);
 if(left>=right||top>=bottom){paintCastleDrawbridge(c,progress);return;}
 c.save();c.beginPath();
 c.rect(drawbridge.left-28,tipY-44,drawbridge.right-drawbridge.left+56,drawbridge.bottom-tipY+70);
 c.rect(left,top,right-left,bottom-top);c.clip('evenodd');
 paintCastleDrawbridge(c,progress);c.restore();
 c.save();c.beginPath();c.rect(left,top,right-left,bottom-top);c.clip();
 c.globalAlpha*=.24;paintCastleDrawbridge(c,progress);c.restore();
}
export function castleExteriorSubjects(bounds,bridgeProgress=0,party=[]){
 if(!castleSiteIntersects(bounds.left,bounds.top,bounds.right,bounds.bottom,192))return [];
 const viewers=bridgeProgress>.4?party.filter(p=>p.hp>0&&!p.trainRide&&!p.swimming&&
  Math.abs(p.x-door.x)<38&&p.y<drawbridge.top&&p.y>door.y-14):[];
 return [
  {x:GREYHAVEN.x,y:castle.bottom,depth:castle.bottom+3,castleExterior:true,
   paint(c){keepImage=cached(c,keepBounds,paintKeep,keepImage);}},
  {x:door.x,y:drawbridge.top,depth:bridgeProgress>.08?drawbridge.top+1:drawbridge.top-80,castleExterior:true,
   paint(c){paintBridgeWithCutaway(c,bridgeProgress,viewers);}},
  ...[bridge.top+17,bridge.bottom-9].flatMap(y=>[bridge.left+4,bridge.right-4].map(x=>({
   x,y,depth:y,castleExterior:true,paint(c){drawCastleLantern(c,x,y-8,true);},
  }))),
 ];
}

function lamplight(c,x,y,r,squash){
 c.save();c.translate(x,y);c.scale(1,squash);
 const light=c.createRadialGradient(0,0,0,0,0,r);
 light.addColorStop(0,'#d9a264');light.addColorStop(.38,'#986047');light.addColorStop(1,'#0000');
 rect(c,-r,-r,r*2,r*2,light);c.restore();
}
export function drawCastleLights(c,bounds,dark,time=0){
 if(dark<=.1||!castleSiteIntersects(bounds.left,bounds.top,bounds.right,bounds.bottom,40))return;
 c.save();c.globalCompositeOperation='screen';c.globalAlpha=Math.min(.44,dark*.54);
 for(const side of [-1,1]){
  const x=door.x+side*62,glass=door.y-50;
  lamplight(c,x,glass,13,1);
  c.save();path(c,[[x-side*12,glass-9],[x+side*17,glass-12],[x+side*38,door.y],
   [x-side*10,door.y],[x-side*17,glass+17]]);c.clip();
  lamplight(c,x+side*8,glass+18,38,1.16);c.restore();
  for(const y of [bridge.top+17,bridge.bottom-9]){
   const px=side<0?bridge.left+4:bridge.right-4;
   lamplight(c,px,y-43,12,1);
   c.save();c.beginPath();c.rect(bridge.left,y-40,bridge.right-bridge.left,46);c.clip();
   lamplight(c,px-side*11,y-16,32,.55);c.restore();
   for(let i=0;i<5;i++){
    const ry=y-10+i*4,rx=px+side*(15+i*2)+Math.sin(time*2+i)*2;
    if(castleSurface(rx,ry)==='water')rect(c,rx,ry,Math.max(2,8-i),1,i%2?'#c68c5265':'#dba66888');
   }
  }
 }
 c.restore();
}

export function drawCastleMapMark(c,x,y,s=1){
 c.save();c.translate(x,y);c.scale(s,s);drawCastleStack(c,0,0,castleMapIcon);c.restore();
}

const castleMapIcon=[
 [[-7,0,14,5,'#a98656']],
 [[-7,0,14,5,'#e7c887'],[-1,2,2,4,'#4d6354']],
 [[-5,-3,3,4,'#efd59b'],[2,-3,3,4,'#efd59b'],[-2,0,4,1,'#efd59b']],
];
