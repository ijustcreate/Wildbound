import {HOLLOW_BOUNDS,HOLLOW_EXIT,HOLLOW_NAV,HOLLOW_OUTLINE,HOLLOW_ROCKS,HOLLOW_WATER,HOLLOW_GATE,MOUNTAIN_ASCENT,MOUNTAIN_BOUNDS,MOUNTAIN_CAVE_TRAIL,MOUNTAIN_DESCENTS,MOUNTAIN_OCEAN_DESCENT,MOUNTAIN_OUTLINE,MOUNTAIN_SUMMIT,MOUNTAIN_UPPER_HEIGHT,MOUNTAIN_UPPER_START,mountainHeight} from './wild-mountain-layout.mjs';
import {drawMountainPennant,mountainPines,paintHollowPathDetails,paintMountainPines,paintMountainSlopeDetails,paintMountainTrailDetails,paintMountainTrailVerges} from './wild-mountain-details.mjs';
import {railwayStream,streamImage} from './railway-stream.mjs';
import {drawGreywakeShore,drawGreywakeShoreMap,GREYWAKE_SHORE_BOUNDS} from './wild-mountain-shore.mjs';

const mountainStone=['#27353a','#34434a','#3f5054','#475a56','#526360','#5f6b66'];
const caveStone=['#192b33','#203840','#28454a','#355258','#426267','#4d6f71'];
const mountainRidges=[
 [[14960,6530],[15680,6180],[15970,6650],[15610,7400],[15360,7670]],
 [[15350,6250],[16270,5710],[16560,6080],[16060,6950],[15690,7530]],
 [[15930,5940],[16600,5610],[16920,5900],[16690,6590],[15930,7290]],
 [[16710,5650],[17450,5690],[17150,6380],[16890,7110],[16450,7790],[16020,7920]],
 [[17350,5700],[18000,5840],[17770,6350],[17590,6990],[16720,8190],[16410,8120]],
 [[17930,5890],[18530,6170],[18250,6730],[17720,7180],[17410,8070],[16920,8280]],
 [[18440,6190],[18820,6760],[18560,7340],[18140,7730],[17500,8220],[17260,8310]],
];
function grain(x,y){
 let n=Math.imul(x|0,1911520717)^Math.imul(y|0,148694059);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967296;
}
const rasterSize=2;
const upperBounds={left:16220,top:5650,right:18280,bottom:7470};
const lowerAscent=MOUNTAIN_ASCENT.slice(0,MOUNTAIN_UPPER_START+1),upperAscent=MOUNTAIN_ASCENT.slice(MOUNTAIN_UPPER_START);
const visible=(bounds,scene)=>bounds.left<scene.right&&bounds.right>scene.left&&bounds.top<scene.bottom&&bounds.bottom>scene.top;
const box=(ctx,x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
function trace(ctx,points){
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
}
function fill(ctx,points,color){trace(ctx,points);ctx.fillStyle=color;ctx.fill();}
function line(ctx,points,width,color){
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
}
function insideRaster(bounds,draw){
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(Math.ceil((bounds.right-bounds.left)/rasterSize),Math.ceil((bounds.bottom-bounds.top)/rasterSize)):document.createElement('canvas');
 canvas.width=Math.ceil((bounds.right-bounds.left)/rasterSize);canvas.height=Math.ceil((bounds.bottom-bounds.top)/rasterSize);
 const c=canvas.getContext('2d');c.scale(1/rasterSize,1/rasterSize);c.translate(-bounds.left,-bounds.top);draw(c);return canvas;
}
function paintRaster(ctx,bounds,art){
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(art,bounds.left,bounds.top,art.width*rasterSize,art.height*rasterSize);ctx.restore();
}
function scree(c,bounds,palette,step,seed){
 for(let y=bounds.top;y<bounds.bottom;y+=step)for(let x=bounds.left;x<bounds.right;x+=step){
  const n=grain(x+seed,y),m=grain(x,y+seed),px=x+Math.floor(n*step/4)*4,py=y+Math.floor(m*step/4)*4;
  if(n<.22)continue;
  const w=4+Math.floor(m*4)*4;
  box(c,px,py,w,4,palette[Math.floor(n*palette.length)]);
  if(m>.62)box(c,px+4,py+4,Math.floor(w/2),4,palette[1]);
 }
}
const trailCenters=trail=>trail.map(([x,y])=>[x,y]);
function trailStrip(trail,start,end,offset=0){
 const [ax,ay,az,aw]=trail[start],[bx,by,bz,bw]=trail[end],length=Math.hypot(bx-ax,by-ay);
 const nx=(ay-by)/length,ny=(bx-ax)/length;
 return [[ax+nx*aw,ay-az+ny*aw+offset],[bx+nx*bw,by-bz+ny*bw+offset],[bx-nx*bw,by-bz-ny*bw+offset],[ax-nx*aw,ay-az-ny*aw+offset]];
}
const trailTop=(height,high)=>high?(height>430?'#95a5a6':height>375?'#9b9e92':height>330?'#a2947b':height>130?'#9a8266':'#93795a'):'#977758';

function trailTexture(c,a,b,high){
 const [ax,ay,az,aw]=a,[bx,by,bz,bw]=b,dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
 const nx=dy/length,ny=-dx/length;
 for(let d=14;d<length-5;d+=12){
  const t=d/length,insideWidth=aw+(bw-aw)*t,rootX=ax+dx*t,rootY=ay+dy*t-(az+(bz-az)*t);
  const height=az+(bz-az)*t;
  for(let lane=-3;lane<=3;lane++){
   const n=grain(Math.round(rootX)+lane*31,Math.round(rootY)+lane*7);
   if(n<(Math.abs(lane)>1?.48:.25))continue;
   const frost=height>=399||height>=324&&Math.abs(lane)>1&&n>1-(height-324)/77;
   const offset=(lane*.245+(n-.5)*.17)*insideWidth;
   const x=Math.round((rootX+nx*offset)/2)*2,y=Math.round((rootY+ny*offset)/2)*2;
   if(Math.abs(lane)<=1&&n>.58){
    const w=7+Math.floor(n*10),h=4+Math.floor(grain(y,x)*6);
    fill(c,[[x-w,y+1],[x-w+4,y-h],[x+2,y-h-2],[x+w,y-2],[x+w-3,y+h],[x-3,y+h+1]],'#675a4e');
    const stone=frost?(n>.83?'#b3c4c2':'#a0afb0'):(n>.83?'#baa589':'#a99277');
    const crest=frost?(n>.83?'#d4deda':'#bccdcc'):(n>.83?'#cfb99a':'#bda385');
    fill(c,[[x-w+1,y],[x-w+5,y-h],[x+2,y-h-2],[x+w,y-2],[x+w-4,y+h-3],[x-3,y+h-2]],stone);
    line(c,[[x-w+6,y-h+1],[x+1,y-h-1]],2,crest);
    if(n>.89)line(c,[[x+1,y-h+1],[x+4,y],[x+1,y+3]],1,'#83725d');
   }else if(frost&&n>.73&&Math.abs(lane)>1){
    box(c,x-6,y,14,4,'#b4c5c4');
    box(c,x-2,y-2,8,2,'#d2dad4');
    box(c,x+5,y+2,7,2,'#859a9b');
   }else{
    box(c,x,y,2+Math.floor(n*4)*2,n>.8?4:2,n>.6?(frost?'#bdccca':high?'#baa78e':'#bb9c75'):'#756554');
    if(n>.74)box(c,x+2,y+2,2,2,'#635a4e');
   }
  }
 }
}

function paintTrail(c,trail,high){
 for(let i=1;i<trail.length;i++){
  const a=trail[i-1],b=trail[i],strip=trailStrip(trail,i-1,i);
  const north=strip[0][1]+strip[1][1]<strip[2][1]+strip[3][1];
  const [p,q]=north?[strip[3],strip[2]]:[strip[0],strip[1]];
  const height=(a[2]+b[2])*.5,depth=high?18+height*.25:11;
  fill(c,[p,q,[q[0]-13,q[1]+depth+12],[p[0]-15,p[1]+depth+12]],high?'#20302d7c':'#394638');
  fill(c,[p,q,[q[0]-6,q[1]+depth],[p[0]-8,p[1]+depth]],high?'#313f3e':'#495346');
  if(high&&depth>24){
   const layers=[{at:.18,color:'#829184',w:3},{at:.4,color:'#576661',w:7},{at:.68,color:'#46554e',w:6}];
   for(const {at,color,w}of layers)line(c,[[p[0],p[1]+depth*at],[q[0],q[1]+depth*at-4]],w,color);
   const segments=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/49);
   for(let j=1;j<segments;j++){
    const fraction=j/segments,x=p[0]+(q[0]-p[0])*fraction,y=p[1]+(q[1]-p[1])*fraction;
    const n=grain(x,y);
    line(c,[[x,y+depth*.09],[x-10+n*9,y+depth*.48],[x-5,y+depth*(.55+n*.34)]],2+n*4,n>.53?'#293a37':'#65736a');
   }
  }
 }
 for(let i=1;i<trail.length;i++){
  const a=trail[i-1],b=trail[i],strip=trailStrip(trail,i-1,i),height=(a[2]+b[2])*.5;
  fill(c,strip,trailTop(height,high));
  line(c,[strip[0],strip[1]],5,height>399?'#d5e0da':high?'#c4b599':'#b19371');
  line(c,[strip[2],strip[3]],4,height>399?'#60777c':high?'#62594f':'#655745');
 }
 // Round each switchback with the same surface width the movement system uses.
 for(let i=0;i<trail.length-(high?1:0);i++){
  const [x,y,z,r]=trail[i];
  c.beginPath();c.arc(x,y-z,r,0,Math.PI*2);c.fillStyle=trailTop(z,high);c.fill();
 }
 const center=trail.map(([x,y,z])=>[x,y-z]);
 c.save();c.lineCap='round';c.lineJoin='round';
 line(c,center,high?68:59,high?'#877258':'#84664f');
 line(c,center,high?53:44,high?'#ad9073':'#ad8966');
 const frostStart=trail.findIndex(point=>point[2]>=399);
 if(frostStart>=0&&frostStart<trail.length-1){
  const frozenTread=center.slice(frostStart);
  line(c,frozenTread,64,'#7c8886');
  line(c,frozenTread,50,'#adb5a9');
 }
 c.restore();
 for(let i=1;i<trail.length;i++)trailTexture(c,trail[i-1],trail[i],high);
 paintMountainTrailVerges(c,trail,high);
}
function mountainFoot(c){
 const center=[17040,7000];
 for(const [i,a]of MOUNTAIN_OUTLINE.entries()){
  const b=MOUNTAIN_OUTLINE[(i+1)%MOUNTAIN_OUTLINE.length];
  if(i<6||i>13)continue;
  const outside=([x,y],n)=>[x+(x-center[0])*n,y+(y-center[1])*n];
  fill(c,[a,b,outside(b,.036),outside(a,.048)],'#465650');
  fill(c,[outside(a,.033),outside(b,.036),outside(b,.068),outside(a,.064)],'#686e5c');
  line(c,[outside(a,.062),outside(b,.066)],5,'#8b8770');
  for(let j=1;j<10;j++){
   const t=j/10,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,n=grain(x,y),q=outside([x,y],.014+n*.04);
   const w=12+Math.floor(n*27);
   fill(c,[[q[0]-w,q[1]],[q[0]-w*.4,q[1]-12],[q[0]+w*.58,q[1]-19],[q[0]+w,q[1]+5],[q[0],q[1]+12]],n>.5?'#596b61':'#4e5d50');
   line(c,[[q[0]-w*.4,q[1]-12],[q[0]+w*.58,q[1]-19]],3,'#9a9980');
  }
 }
}
function paintDescentMarks(c,upper){
 for(const {launch:[x,y],landing:[lx,ly],water}of [...MOUNTAIN_DESCENTS,MOUNTAIN_OCEAN_DESCENT]){
  const z=mountainHeight({},x,y),endZ=mountainHeight({},lx,ly);
  if((z>=MOUNTAIN_UPPER_HEIGHT)!==upper)continue;
  const dx=lx-x,dy=ly-y+(water?0:z-endZ),span=Math.hypot(dx,dy),u=dx/span,v=dy/span;
  for(const offset of [-13,3]){
   const sx=x+u*offset,sy=y-z+v*offset;
   const points=[[sx-u*6-v*9,sy-v*6+u*9],[sx+u*3,sy+v*3],[sx-u*6+v*9,sy-v*6-u*9]];
   line(c,points,7,'#49564c');line(c,points,3,'#e1c997');
  }
  if(water)continue;
  for(const side of [-1,1]){
   const px=lx-16*v*side,py=ly-endZ+16*u*side;
   fill(c,[[px-7,py+3],[px-3,py-3],[px+4,py-5],[px+10,py+1],[px+2,py+6]],'#848675');
   line(c,[[px-3,py-3],[px+4,py-5]],2,'#bdb191');
  }
 }
}
function mountainBase(c){
 mountainFoot(c);
 fill(c,MOUNTAIN_OUTLINE,'#4a5a4e');
 c.save();trace(c,MOUNTAIN_OUTLINE);c.clip();
 for(const [i,r]of mountainRidges.entries()){
  fill(c,r,mountainStone[(i+2)%mountainStone.length]);
  line(c,r.slice(0,5),10,mountainStone[(i+1)%mountainStone.length]);
  for(let j=0;j<4;j++)line(c,r.slice(1,5).map(([x,y],k)=>[x-16-j*15-((j+k)%3)*7,y+12+j*21]),6,j%2?'#77827333':'#1f302d55');
 }
 for(const [i,ledge]of [
  [[15760,6060],[16340,5790],[16730,5770],[17110,5910],[16700,5965],[16290,6020]],
  [[17360,5900],[17790,5870],[18250,6190],[18340,6360],[17940,6200],[17540,6110]],
  [[17840,6640],[18460,6390],[18680,6640],[18540,6870],[18210,6860]],
  [[16180,7560],[16570,7460],[16870,7570],[16660,7710],[16340,7780]],
  [[17220,7960],[17650,7720],[18020,7700],[17890,7940],[17530,8130]],
 ].entries()){
  fill(c,ledge,i<2?'#62706a':'#536254');
  line(c,ledge.slice(1,4),8,i<2?'#899586':'#76836c');
  line(c,ledge.slice(3).map(([x,y])=>[x-9,y+13]),10,'#30453f');
 }
 scree(c,MOUNTAIN_BOUNDS,['#3d503c','#3e5346','#46564b','#6b7668','#667767','#4b604c'],20,17);
 for(let y=MOUNTAIN_BOUNDS.top;y<MOUNTAIN_BOUNDS.bottom;y+=96)for(let x=MOUNTAIN_BOUNDS.left;x<MOUNTAIN_BOUNDS.right;x+=112){
  const n=grain(x,y),px=x+Math.floor(n*23)*4,py=y+Math.floor(grain(x-11,y)*17)*4,w=22+Math.floor(n*17)*4;
  if(n<.72)continue;
  fill(c,[[px-w*.45,py-12],[px-w*.31,py-w*.51],[px+w*.2,py-w*.6],[px+w*.51,py-w*.36],[px+w*.55,py+5],[px+w*.1,py+15]],'#2e3d39');
  fill(c,[[px-w*.45,py-12],[px-w*.31,py-w*.51],[px+w*.2,py-w*.6],[px+w*.39,py-w*.36],[px-7,py-5]],'#708072');
  line(c,[[px-w*.24,py-w*.41],[px+w*.12,py-w*.5],[px+w*.26,py-w*.37]],4,'#82907c');
 }
 paintMountainSlopeDetails(c);
 c.restore();
 paintTrail(c,MOUNTAIN_CAVE_TRAIL,false);paintTrail(c,lowerAscent,true);
 paintMountainPines(c,false);
 paintMountainTrailDetails(c,false);
 paintDescentMarks(c,false);
}
function summitRim(c,rim){
 for(const i of [3,4,5]){
  const a=rim[i],b=rim[(i+1)%rim.length],deep=i===4?53:42;
  const lower=([x,y],delta=0)=>[x-4,y+deep+delta];
  fill(c,[a,b,lower(b),lower(a,6)],i===4?'#4a5753':'#414d4d');
  line(c,[[a[0],a[1]+4],[b[0],b[1]+4]],5,'#a2b5b4');
  line(c,[[a[0]-2,a[1]+deep*.56],[b[0]-4,b[1]+deep*.65]],5,'#5a7073');
  for(let j=1;j<=Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/38);j++){
   const t=j*38/Math.hypot(b[0]-a[0],b[1]-a[1]),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
   const n=grain(x,y);line(c,[[x,y+10],[x-6,y+19+n*10],[x-2,y+deep-3]],n>.65?4:2,'#303f3e');
   if(n>.46)fill(c,[[x-11,y-4],[x+9,y],[x+3,y+9+n*11],[x-1,y+12+n*9],[x-5,y+6]],'#92acb1');
  }
 }
}
function summitIce(c,rim,x,y){
 fill(c,rim,'#637578');
 c.save();trace(c,rim);c.clip();c.translate(x,y);
 // Wind packs powder against the north rim and scours the center back to blue ice.
 fill(c,[[-165,-36],[-143,-64],[-113,-74],[-107,-99],[-77,-128],[-25,-150],[46,-152],
  [82,-135],[107,-122],[116,-100],[151,-89],[166,-58],[151,-32],[127,-25],[100,-29],[75,-12],
  [49,-16],[31,0],[-1,-5],[-21,10],[-61,-3],[-80,12],[-109,4],[-125,-9],[-153,-8]],'#91acb5');
 fill(c,[[-150,-47],[-120,-80],[-92,-89],[-86,-114],[-57,-130],[-28,-130],[2,-150],
  [61,-146],[85,-126],[115,-105],[145,-88],[158,-56],[138,-52],[113,-63],[94,-50],
  [57,-44],[29,-56],[5,-44],[-33,-51],[-55,-42],[-89,-54],[-107,-37],[-138,-37]],'#b0c6cd');
 fill(c,[[-130,-63],[-115,-78],[-90,-83],[-83,-108],[-54,-126],[-28,-125],[-9,-134],[24,-145],
  [61,-143],[84,-126],[106,-120],[118,-105],[141,-92],[140,-80],[121,-86],[106,-80],[83,-93],
  [61,-88],[41,-98],[16,-89],[-2,-99],[-25,-87],[-50,-93],[-61,-79],[-90,-76],[-107,-62]],'#d5e1df');
 fill(c,[[-97,-11],[-63,-26],[-43,-19],[-15,-31],[20,-27],[47,-41],[70,-31],[102,-43],
  [126,-32],[153,-35],[164,-5],[161,30],[114,44],[90,38],[62,57],[24,53],[5,71],[-22,67],[-43,76],
  [-66,65],[-57,41],[-81,31],[-74,15]],'#819fa9');
 fill(c,[[-61,12],[-29,-7],[-5,1],[22,-13],[54,-12],[78,-23],[108,-20],[143,-29],[156,-13],
  [136,5],[113,11],[93,8],[74,26],[46,19],[23,32],[-1,28],[-24,38],[-45,30]],'#a3bdc2');
 fill(c,[[11,56],[35,43],[61,46],[87,33],[115,42],[153,30],[172,20],[172,54],[88,91],[12,92],[-18,77]],'#bacdd0');
 fill(c,[[20,65],[35,52],[64,54],[89,44],[112,48],[144,39],[169,35],[158,52],[126,60],
  [112,72],[87,72],[63,84],[34,84],[8,78]],'#d0dedc');
 // Fractures and tiny wind-polished facets break up the two broad materials.
 for(const [a,b,d,e]of [[[61,-29],[36,-11],[21,-3],[14,11]],[[73,24],[55,35],[44,37],[33,49]],
  [[132,-9],[123,-1],[119,19],[103,25]],[[-54,23],[-31,19],[-16,8],[-4,10]]]){
  line(c,[a,b,d,e],3,'#638792');
  line(c,[b,d,e].map(([px,py])=>[px+1,py+2]),2,'#c7d6d4');
 }
 for(let i=0;i<96;i++){
  const px=Math.floor(-157+grain(i,23)*327),py=Math.floor(-151+grain(i,-7)*238),w=4+Math.floor(grain(px,py)*7)*2;
  const colors=py<-76?['#e1ebe5','#cee1dd','#b4cdd0']:['#bbd0d3','#97b4ba','#829da5'];
  box(c,px,py,w,i%7===0?4:2,colors[i%3]);
 }
 line(c,[[-82,-115],[-48,-133],[-17,-134],[40,-148],[64,-137]],3,'#edf3ec');
 c.restore();
}
function mountainUpper(c){
 paintTrail(c,upperAscent,true);
 paintMountainPines(c,true);
 const [x,y,z]=MOUNTAIN_ASCENT.at(-1);
 const rim=MOUNTAIN_SUMMIT.map(([px,py])=>[px,py-z]);
 summitRim(c,rim);
 summitIce(c,rim,x,y-z);
 paintMountainTrailDetails(c,true);
 paintDescentMarks(c,true);
}
const caveLamps=[
 {x:8060,y:5572,z:46},{x:7970,y:5370,z:44},{x:7720,y:5351,z:53},{x:7367,y:5148,z:45},
 {x:7462,y:4825,z:62},{x:7808,y:4745,z:48},{x:8138,y:4737,z:63},{x:8618,y:4766,z:48},
 {x:8935,y:4934,z:59},{x:8867,y:5317,z:53},{x:8548,y:5453,z:49},
];
const gateLamps=[{x:HOLLOW_GATE.x-86,y:HOLLOW_GATE.y+17,z:53},{x:HOLLOW_GATE.x+88,y:HOLLOW_GATE.y+17,z:53}];
function paintHollowExit(c){
 const {x,y}=HOLLOW_EXIT;
 c.save();c.translate(x,y);
 fill(c,[[-75,-35],[-39,-13],[51,-12],[76,6],[62,102],[-76,108],[-87,48]],'#11272e');
 fill(c,[[-60,-22],[-25,-30],[52,-19],[63,7],[43,92],[-46,95],[-66,46]],'#243b3e');
 line(c,[[-62,-13],[-17,-23],[51,-13]],4,'#6f7b69');
 fill(c,[[-87,37],[-77,10],[-52,12],[-49,78],[-58,115],[-90,96]],'#30494e');
 fill(c,[[83,40],[65,0],[48,10],[46,81],[63,114],[89,101]],'#30494e');
 line(c,[[-77,10],[-52,12],[-49,44]],6,'#496268');line(c,[[65,0],[48,10],[46,49]],6,'#496268');
 fill(c,[[-49,78],[-34,69],[23,73],[46,81],[57,132],[-60,132]],'#0b1820');
 c.restore();
}
function paintMouth(c,{x,y}){
 c.save();c.translate(x,y);
 fill(c,[[-114,33],[-111,-60],[-69,-139],[-13,-168],[70,-145],[115,-89],[124,-3],[94,28]],'#293539');
 fill(c,[[-107,-18],[-93,-81],[-69,-139],[-13,-168],[-15,-124],[-62,-102],[-83,-22]],'#596760');
 fill(c,[[-13,-168],[70,-145],[115,-89],[124,-3],[89,11],[67,-78],[32,-113],[-15,-124]],'#43524f');
 fill(c,[[-81,31],[-78,-40],[-49,-91],[-5,-112],[46,-105],[76,-58],[82,30]],'#091920');
 fill(c,[[-65,27],[-62,-24],[-36,-66],[3,-85],[38,-66],[61,-31],[62,27]],'#071419');
 fill(c,[[-90,31],[-72,13],[76,13],[97,32],[72,50],[-78,47]],'#706b58');
 line(c,[[-110,-43],[-91,-38],[-74,-59]],4,'#718276');
 line(c,[[79,-92],[99,-80],[110,-53]],5,'#58685e');
 line(c,[[-79,29],[-34,32],[64,28]],4,'#a59b7f');
 c.restore();
}
function wall(c,a,b,k,outer){
 const [ax,ay]=a,[bx,by]=b,mx=(ax+bx)/2,my=(ay+by)/2;
 const z=outer?34+grain(ax,by)*78:39+grain(ax,by)*47;
 const points=[[ax,ay],[bx,by],[bx-8,by-z*.92],[mx+9,my-z],[ax+5,ay-z*.68]];
 const shade=by>ay?1:2;
 fill(c,points,caveStone[shade]);
 fill(c,[[ax,ay],[mx,my-7],[mx+9,my-z],[ax+5,ay-z*.68]],caveStone[shade+1]);
 line(c,points.slice(2),5,caveStone[shade+2]);
 if(k%3!==1)line(c,[[ax+3,ay-z*.38],[mx+1,my-z*.54],[bx-3,by-z*.45]],4,caveStone[shade+1]);
 line(c,[a,b],8,'#10252b');
}
function hollowBase(c){
 fill(c,HOLLOW_OUTLINE,'#253e43');
 c.save();trace(c,HOLLOW_OUTLINE);c.clip();
 for(let y=HOLLOW_BOUNDS.top;y<HOLLOW_BOUNDS.bottom;y+=32)for(let x=HOLLOW_BOUNDS.left;x<HOLLOW_BOUNDS.right;x+=40){
  const n=grain(x,y),w=20+Math.floor(n*5)*8,h=12+Math.floor(grain(x-40,y)*6)*4;
  fill(c,[[x+8,y],[x+w-7,y-3],[x+w+2,y+h-8],[x+w-10,y+h],[x,y+h-4],[x-5,y+8]],caveStone[n>.78?3:n>.44?2:1]);
 }
 // A damp path leads between lamp posts without drawing a hard road around the bay.
 line(c,HOLLOW_NAV,42,'#53645c48');line(c,HOLLOW_NAV,22,'#69776c3d');
 scree(c,HOLLOW_BOUNDS,['#253f43','#2f494b','#405653','#526661'],16,81);
 c.restore();
 trace(c,HOLLOW_WATER);c.lineJoin='bevel';c.strokeStyle='#172e35';c.lineWidth=28;c.stroke();
 c.fillStyle='#145763';c.fill();c.strokeStyle='#397a79';c.lineWidth=8;c.stroke();
 c.save();trace(c,HOLLOW_WATER);c.clip();
 const light=c.createRadialGradient(8040,5030,20,8040,5050,710);light.addColorStop(0,'#32b7a16e');light.addColorStop(.65,'#22889155');light.addColorStop(1,'#143e5388');
 box(c,7400,4780,1540,620,light);
 c.globalAlpha=.58;scree(c,{left:7470,top:4790,right:8880,bottom:5370},['#19555d','#2c7979','#358d87','#59ad98'],20,42);c.restore();
 for(const [i,a]of HOLLOW_OUTLINE.entries())wall(c,a,HOLLOW_OUTLINE[(i+1)%HOLLOW_OUTLINE.length],i,true);
 for(const [i,r]of HOLLOW_ROCKS.entries()){
  fill(c,r,caveStone[0]);
  r.forEach((a,j)=>wall(c,a,r[(j+1)%r.length],i+j,false));
 }
 // The cavern exit reads as a low passage in the south wall.
 paintHollowExit(c);
 paintHollowPathDetails(c);
}
function lamp(c,p,time){
 const top=p.y-p.z,phase=Math.floor(time*7+p.x)%5;
 box(c,p.x-12,p.y-4,24,8,'#10252b');box(c,p.x-3,top+8,6,p.z-8,'#3e3b36');
 box(c,p.x-3,top+8,2,p.z-8,'#6e6450');box(c,p.x-9,top-6,18,20,'#242a27');
 box(c,p.x-6,top-4,12,13,phase===1?'#f4b868':'#ed9947');box(c,p.x-3,top-2,6,8,phase===3?'#fff1bf':'#ffd894');
 box(c,p.x-11,top-8,22,3,'#6c624c');box(c,p.x-8,top+9,16,3,'#806046');
}
function glow(c,p,t,strength){
 const x=p.x,y=p.y-p.z,r=76+(Math.floor(t*6+p.x)%4)*3;
 const color=c.createRadialGradient(x,y,1,x,y,r);color.addColorStop(0,`rgba(238,154,81,${strength})`);color.addColorStop(.32,`rgba(222,133,50,${strength*.40})`);color.addColorStop(1,'#e28b3c00');
 box(c,x-r,y-r,r*2,r*2,color);
}
function hollowRipples(c,bounds,t){
 c.save();trace(c,HOLLOW_WATER);c.clip();
 for(let y=Math.max(4790,Math.floor(bounds.top/16)*16);y<Math.min(5370,bounds.bottom+20);y+=16){
  for(let x=Math.max(7480,Math.floor(bounds.left/52)*52);x<Math.min(8880,bounds.right+32);x+=52){
   const n=grain(x,y),phase=(Math.floor(t*3+n*10)%9),length=8+Math.floor(n*8)*4;
   if(n<.40||phase>6)continue;
   box(c,x+Math.floor(n*7)*4+phase*2,y,length,2,phase>3?'#4b9f9370':'#8de0bb58');
   if(n>.82)box(c,x+phase*3,y+4,length*.6,2,'#297d81a0');
  }
 }
 for(const p of caveLamps){
  if(p.x<bounds.left-70||p.x>bounds.right+70)continue;
  for(let i=0;i<6;i++){
   const sign=p.y<5090?1:-1,y=p.y+sign*(30+13*i),x=p.x-15+8*Math.round(Math.sin(t*2+i)*2),width=28-i*3;
   box(c,x,y,width,2,'#e6b37562');
  }
 }
 c.restore();
}
const mountainRasters=new Map(),focusBuffers=new WeakMap();
let hollowRaster,actorBuffer;
export function buildMountainRaster(layer='all'){
 if(layer==='upper')return insideRaster(upperBounds,mountainUpper);
 return insideRaster(MOUNTAIN_BOUNDS,layer==='lower'?mountainBase:c=>{mountainBase(c);mountainUpper(c);});
}
function mountainLayer(t,layer){
 let art=mountainRasters.get(layer);
 if(art)return art;
 if(t&&railwayStream(t))return streamImage(t,'mountain','mountain:'+layer,{layer},145);
 art=buildMountainRaster(layer);mountainRasters.set(layer,art);return art;
}
function fallbackTrail(c,trail,upper){
 for(let i=1;i<trail.length;i++)fill(c,trailStrip(trail,i-1,i),'#777b65');
 for(const [x,y,z,r] of trail.slice(0,upper?-1:trail.length)){
  c.beginPath();c.arc(x,y-z,r,0,Math.PI*2);c.fillStyle='#777b65';c.fill();
 }
}
export function drawWildMountain(c,bounds,time,t,deferUpper=false){
 if(!visible(bounds,MOUNTAIN_BOUNDS)){
  if(visible(bounds,GREYWAKE_SHORE_BOUNDS))drawGreywakeShore(c,bounds);
  return;
 }
 const art=mountainLayer(t,'lower');
 if(art)paintRaster(c,MOUNTAIN_BOUNDS,art);
 else{
  fill(c,MOUNTAIN_OUTLINE,'#536050');
  fallbackTrail(c,MOUNTAIN_CAVE_TRAIL,false);fallbackTrail(c,lowerAscent,true);
  paintDescentMarks(c,false);
 }
 drawGreywakeShore(c,bounds);
 if(!deferUpper)drawWildMountainUpper(c,bounds,time,t,MOUNTAIN_UPPER_HEIGHT,false);
 if(visible(bounds,{left:HOLLOW_GATE.x-156,top:HOLLOW_GATE.y-185,right:HOLLOW_GATE.x+156,bottom:HOLLOW_GATE.y+73})){
  paintMouth(c,HOLLOW_GATE);for(const p of gateLamps)lamp(c,p,time);
 }
}
function softenMountainFloor(c){
 const {canvas}=c,w=Math.ceil(canvas.width*.6),h=Math.ceil(canvas.height*.6);
 let buffer=focusBuffers.get(c);
 if(!buffer){buffer=document.createElement('canvas');focusBuffers.set(c,buffer);}
 if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;}
 const pen=buffer.getContext('2d');pen.imageSmoothingEnabled=true;pen.drawImage(canvas,0,0,w,h);
 c.save();c.resetTransform();c.globalAlpha*=.72;c.imageSmoothingEnabled=true;c.drawImage(buffer,0,0,canvas.width,canvas.height);c.restore();
}
export function drawWildMountainUpper(c,bounds,time,t,viewerHeight,depthFocus=true){
 if(!visible(bounds,upperBounds))return null;
 const art=mountainLayer(t,'upper'),viewerAbove=viewerHeight>=MOUNTAIN_UPPER_HEIGHT;
 if(depthFocus&&viewerAbove)softenMountainFloor(c);
 c.save();
 if(depthFocus&&!viewerAbove)c.filter='blur(1.4px)';
 if(art)paintRaster(c,upperBounds,art);
 else{
  fallbackTrail(c,upperAscent,true);
  const z=MOUNTAIN_ASCENT.at(-1)[2],rim=MOUNTAIN_SUMMIT.map(([x,y])=>[x,y-z]);
  summitRim(c,rim);fill(c,rim,'#a8c1c5');paintDescentMarks(c,true);
 }
 drawMountainPennant(c,bounds,time);c.restore();
 return art;
}
export function drawMountainForegroundActor(c,art,actor,height,paint){
 const altitude=height+(actor.jumpHeight||0)+(actor.groundHeight||0);
 const left=Math.floor(actor.x-96),top=Math.floor(actor.y-(actor.jumpHeight||0)-(actor.groundHeight||0)-148);
 if(!art||actor.trainRide||actor.pirateRide||altitude>=MOUNTAIN_UPPER_HEIGHT-2||
  !visible({left,top,right:left+192,bottom:top+192},upperBounds)){paint(c);return;}
 actorBuffer??=document.createElement('canvas');
 if(actorBuffer.width!==192){actorBuffer.width=actorBuffer.height=192;}
 const pen=actorBuffer.getContext('2d');pen.resetTransform();pen.clearRect(0,0,192,192);
 pen.save();pen.translate(-left,-top);pen.imageSmoothingEnabled=false;
 paint(pen);
 pen.globalCompositeOperation='destination-out';paintRaster(pen,upperBounds,art);pen.restore();
 c.drawImage(actorBuffer,left,top);
}
export function drawWildHollow(c,bounds,time){
 box(c,bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top,'#0b1820');
 if(!visible(bounds,HOLLOW_BOUNDS))return;
 hollowRaster??=insideRaster(HOLLOW_BOUNDS,hollowBase);paintRaster(c,HOLLOW_BOUNDS,hollowRaster);
 hollowRipples(c,bounds,time);
 for(const p of caveLamps)if(visible(bounds,{left:p.x-10,top:p.y-p.z-10,right:p.x+10,bottom:p.y+10}))lamp(c,p,time);
}
export function drawMountainLights(c,bounds,time,hollow,dark){
 const lamps=hollow?caveLamps:gateLamps;
 for(const p of lamps)if(visible(bounds,{left:p.x-83,top:p.y-p.z-83,right:p.x+83,bottom:p.y-p.z+83}))glow(c,p,time,hollow?.43:.13+dark*.32);
}
export function drawHollowMap(c,x,y,w,h){
 c.save();c.translate(x,y);c.scale(w/(HOLLOW_BOUNDS.right-HOLLOW_BOUNDS.left),h/(HOLLOW_BOUNDS.bottom-HOLLOW_BOUNDS.top));c.translate(-HOLLOW_BOUNDS.left,-HOLLOW_BOUNDS.top);
 box(c,HOLLOW_BOUNDS.left,HOLLOW_BOUNDS.top,HOLLOW_BOUNDS.right-HOLLOW_BOUNDS.left,HOLLOW_BOUNDS.bottom-HOLLOW_BOUNDS.top,'#10232b');
 fill(c,HOLLOW_OUTLINE,'#426565');fill(c,HOLLOW_WATER,'#287d85');
 for(const r of HOLLOW_ROCKS)fill(c,r,'#273e46');
 box(c,HOLLOW_EXIT.x-22,HOLLOW_EXIT.y-12,44,24,'#ecc685');c.restore();
}
export function drawMountainMap(c){
 fill(c,MOUNTAIN_OUTLINE,'#60705e');
 c.save();trace(c,MOUNTAIN_OUTLINE);c.clip();
 for(const [i,ridge] of mountainRidges.entries())fill(c,ridge,i%2?'#62706b':'#536967');
 fill(c,[[17030,5770],[17390,5840],[17240,6010],[17580,6015],[17750,5870],[18040,6010],[18220,6180],[18310,6360],
  [18280,6550],[18140,6700],[17940,6605],[17770,6630],[17670,6450],[17510,6380],[17400,6220],[17080,6115]],'#879da0');
 fill(c,[[17100,5800],[17340,5850],[17230,6020],[17010,6060],[16880,5980]],'#a7bec2');
 fill(c,[[17790,5930],[18010,6050],[18235,6260],[18260,6490],[18110,6590],[17880,6480],[17750,6260]],'#adbec0');
 for(const tree of mountainPines){
  const {x,worldY:y}=tree;
  fill(c,[[x-22,y+11],[x,y-35],[x+21,y+11]],tree.season==='winter'?'#719398':'#374e43');
 }
 c.restore();
 drawGreywakeShoreMap(c);
 line(c,trailCenters(MOUNTAIN_ASCENT),64,'#aaa08b');
 line(c,trailCenters(MOUNTAIN_CAVE_TRAIL),54,'#9f8d6a');
 fill(c,MOUNTAIN_SUMMIT,'#cadbdd');
}

export function mountainActorLift(d,p){return p.trainRide||p.pirateRide?0:mountainHeight(d,p.x,p.y);}
