// Approved bayou art vocabulary, with a small composition fixture for visual review.
// Logical pixel density: 2 world pixels. Positions, silhouettes and palette remain editable.
export const SWAMP_STUDY = {
  width:960,height:640,pixelSize:2,
  trees:[
    {x:38,y:104,type:'cypress',scale:1.12,seed:3},
    {x:121,y:69,type:'mangrove',scale:.82,seed:19},
    {x:166,y:115,type:'cypress',scale:.48,seed:52},
    {x:342,y:82,type:'cypress',scale:1.02,seed:8},
    {x:432,y:114,type:'mangrove',scale:1.05,seed:21},
    {x:91,y:203,type:'cypress',scale:1.12,seed:31},
    {x:39,y:254,type:'mangrove',scale:.95,seed:15},
    {x:349,y:296,type:'mangrove',scale:1.12,seed:25},
    {x:449,y:307,type:'cypress',scale:1.23,seed:11},
    {x:138,y:340,type:'cypress',scale:1.25,seed:39},
  ],
  palette:{deep:'#244947',water:'#345d54',shallow:'#506d53',silt:'#65694c',bank:'#7c7953',grass:'#5d734a'},
};
const hash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const mix=(a,b,t)=>a+(b-a)*t;
function noise(x,y){const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return mix(mix(hash(a,b),hash(a+1,b),s),mix(hash(a,b+1),hash(a+1,b+1),s),t);}
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
function poly(c,points,color){for(let y=Math.floor(Math.min(...points.map(p=>p[1])));y<=Math.ceil(Math.max(...points.map(p=>p[1])));y++){const cuts=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[j],b=points[i];if((a[1]>y+.5)!==(b[1]>y+.5))cuts.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}cuts.sort((a,b)=>a-b);for(let i=0;i<cuts.length;i+=2)rect(c,Math.ceil(cuts[i]),y,Math.ceil(cuts[i+1])-Math.ceil(cuts[i]),1,color);}}
function line(c,x1,y1,x2,y2,width,color){const d=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));for(let i=0;i<=d;i++){const t=d?i/d:0;rect(c,mix(x1,x2,t)-width/2,mix(y1,y2,t)-width/2,width,width,color);}}
function cluster(c,x,y,rx,ry,color,seed=0){for(let row=-ry;row<=ry;row++){const half=Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx,jag=hash(Math.floor(row/2),seed)*2;rect(c,x-half+jag,y+row,half*2-jag,1,color);}}
export function swampStudyDepth(x,y){
  const center=202+48*Math.sin((y-33)/73)+14*Math.sin(y/29),width=20+8*Math.sin(y/83);
  const bankNoise=(noise(x/18,y/18)-.5)*10+(noise(x/7,y/7)-.5)*3;
  let d=Math.abs(x-center)-width+bankNoise;
  // An inlet curls around the back of the eastern bank; it never becomes a road.
  const inlet=Math.hypot((x-333)*.83,(y-42)*1.8)-39;
  d=Math.min(d,inlet+9);
  if(x>238&&x<352)d=Math.min(d,Math.abs(y-(55+14*Math.sin((x-240)/40)))-7+bankNoise*.4);
  const pool=Math.hypot((x-352)*.8,(y-181)*1.15)-23+bankNoise;
  d=Math.min(d,Math.max(-4,pool));
  return d;
}
function ground(c){
 const p=SWAMP_STUDY.palette;
 for(let y=0;y<320;y++)for(let x=0;x<480;x++){
  const d=swampStudyDepth(x,y),n=noise(x/27,y/23),f=noise(x/9,y/9);
  let color=d<-7?(n>.53?'#294f49':p.deep):d<0?p.water:d<12?(f>.55?'#536e54':p.shallow):d<17?p.silt:d<20?p.bank:n<.34?'#556c47':n>.65?'#677a4d':p.grass;
  if(d>24&&noise(x/48+7,y/38)>.68)color=f>.5?'#767a50':'#70774e';
  rect(c,x,y,1,1,color);
 }
 // Surface accents follow shoreline habitat, without a repeating tile motif.
 for(let i=0;i<1600;i++){
  const x=hash(i,6)*480,y=hash(i,7)*320,d=swampStudyDepth(x,y);
  if(d<-8&&i%4===0){rect(c,x,y,3+hash(i,3)*9,1,'#41675c');if(i%12===0)rect(c,x+2,y+2,3,1,'#365c53');}
  else if(d>25&&hash(i,4)>.55){const col=i%3?'#708052':'#485f42';rect(c,x,y,2,1,col);if(i%4===0)rect(c,x+2,y-1,1,1,col);}
  else if(d>14&&d<22&&i%2===0)rect(c,x,y,2,1,'#8b8860');
 }
}
function reeds(c,x,y,seed){
 for(let i=0;i<7;i++){const dx=(hash(seed,i)-.5)*12,h=5+hash(i,seed)*9,lean=(hash(i,seed+7)-.5)*6;line(c,x+dx,y,x+dx+lean,y-h,1,i%2?'#718852':'#405e40');if(i%3===0){line(c,x+dx,y-1,x+dx-4,y-h*.6,1,'#94a065');rect(c,x+dx+lean,y-h-2,2,3,'#725b38');}}
}
function lily(c,x,y,seed){cluster(c,x,y+1,4,2,'#23483f',seed);cluster(c,x,y,4,2,'#7d985b',seed);rect(c,x+1,y-1,2,1,'#b0b679');rect(c,x,y+1,1,1,'#345d54');if(seed%5===0){rect(c,x-1,y-3,3,2,'#ded0a0');rect(c,x,y-4,1,2,'#f0dfb1');}}
function groundPlants(c){for(let i=0;i<380;i++){const x=hash(i,41)*480,y=hash(i,43)*320,d=swampStudyDepth(x,y);if(d>8&&d<27&&noise(x/25+11,y/30)>.47)reeds(c,x,y,i);else if(d<9&&d>-8&&i%3===0)lily(c,x,y,i);}
 for(const [x,y]of [[65,118],[110,206],[148,140],[312,104],[397,125],[392,247],[73,273]]){
  for(let k=0;k<5;k++){const dx=(k-2)*4,h=7-Math.abs(k-2);line(c,x,y,x+dx,y-h,1,'#2e5438');for(let j=1;j<4;j++){const t=j/4,bx=x+dx*t,by=y-h*t;line(c,bx-3,by-2,bx+2,by,1,j%2?'#82994f':'#557b41');}}
 }
 for(const [x,y,h]of [[151,126,8],[176,217,6],[294,95,7],[278,257,9],[304,254,5]]){
  if(swampStudyDepth(x,y)<0)continue;
  cluster(c,x+2,y+1,6,2,'#3c5540',x);poly(c,[[x-4,y],[x-2,y-h],[x,y-h-3],[x+2,y-h],[x+4,y]],'#50533d');poly(c,[[x-3,y],[x-1,y-h],[x,y-h-1],[x,y]],'#9a8d60');
 }
}
function bridge(c){
 // One narrow, weathered crossing at the bend, drawn once instead of tiled bridges.
 const y=157,left=192,right=280;
 poly(c,[[left-3,y+6],[right+7,y+6],[right+10,y+11],[left,y+11]],'#263f35');
 line(c,left-3,y-6,right+4,y-6,3,'#514c36');line(c,left-3,y+6,right+4,y+6,3,'#514c36');
 for(let x=left;x<right;x+=5){const off=hash(x,3)>.7?1:0;rect(c,x,y-7+off,4,13,'#8c7951');rect(c,x,y-7+off,2,12,'#ad9867');if(x%3===0)rect(c,x,y,3,1,'#716443');}
 for(const x of [left-2,right+2]){rect(c,x,y-11,3,10,'#494936');rect(c,x,y-12,3,2,'#b2a079');rect(c,x,y+3,3,9,'#514c37');rect(c,x,y+2,3,2,'#b2a079');}
}
function foliage(c,clusters,seed,type){
  const ramp=type==='cypress'?['#263f35','#3d5d40','#65824b','#9ca567']:['#203e33','#345c3e','#5c8749','#9caf68'];
 // Merge silhouette first; internal masses are lit clusters, not separately outlined ovals.
 for(const [x,y,rx,ry]of clusters){cluster(c,x,y,rx,ry,ramp[0],seed+x);for(let j=0;j<13;j++){const a=j*Math.PI*2/13;cluster(c,x+Math.cos(a)*rx*.88,y+Math.sin(a)*ry*.85,2+hash(j,seed)*3,2+hash(seed,j)*3,ramp[0],seed+j);}}
 for(const [x,y,rx,ry]of clusters){cluster(c,x-1,y-2,rx-2,ry-2,ramp[1],seed+x);
  cluster(c,x-rx*.15,y-ry*.28,rx*.72,ry*.58,ramp[2],seed+x+4);
  for(let i=0;i<37;i++){const dx=(hash(seed+x,i)-.5)*rx*1.8,dy=(hash(i,seed+y)-.5)*ry*1.6;if(dx*dx/(rx*rx)+dy*dy/(ry*ry)>.85)continue;const col=dy<0&&i%4===0?ramp[3]:i%3?ramp[2]:ramp[1];rect(c,x+dx,y+dy,3+hash(i,seed)*4,2,col);rect(c,x+dx+2,y+dy-2,3,3,col);}
 }
}
export function swampTreeStructure(type,seed){
 const cy=type==='cypress',base=[],count=3+Math.floor(hash(seed,76)*3);
 const lean=(hash(seed,73)-.5)*16,width=.82+hash(seed,74)*.3;
 // A small branch grammar, not a resized copy of one finished crown. Seeded
 // leaders choose their own height, reach and leaf mass; roots stay registered.
 for(let i=0;i<count;i++){
  const side=(i%2?1:-1)*(hash(seed,75)>.5?1:-1);
  base.push(cy?[side*(12+hash(seed,i+140)*15),-52-i*(45/Math.max(1,count-1)),14+hash(seed,i+150)*6,12+hash(seed,i+160)*5]
   :[side*(18+hash(seed,i+140)*17),-40-i*7-hash(seed,i+145)*14,17+hash(seed,i+150)*7,10+hash(seed,i+160)*5]);
 }
 if(cy)base.push([lean,-108,9,11]);
 const clusters=base.map(([x,y,rx,ry],i)=>{rx*=.8+hash(seed,i+100)*.35;ry*=.82+hash(seed,i+110)*.3;return [Math.max(-57+rx,Math.min(57-rx,x+(hash(seed,i+80)-.5)*10+lean*(-y/110))),Math.max(-118+ry,y+(hash(seed,i+90)-.5)*9),rx,ry];});
 return {lean,width,clusters};
}
export function swampMossCurtains(type,seed=31,varied=false){
 if(varied)return swampTreeStructure(type,seed).clusters.map(([x,y,rx,ry],i)=>[Math.round(x+(i%2?-.65:.65)*rx),Math.round(y+ry*.65),Math.round(11+hash(seed,i+130)*12)]);
 return type==='cypress'?[[-34,-55,17],[-20,-52,12],[31,-63,20],[19,-60,11],[-22,-79,15],[13,-91,12]]:[[-42,-40,13],[-22,-34,18],[39,-47,18],[23,-39,12]];
}
export function drawSwampStudyTree(c,p,time=0){
 c.save();c.translate(Math.round(p.x),Math.round(p.y));c.scale(p.scale,p.scale);
 const cy=p.type==='cypress',seed=p.seed,plan=p.varied?swampTreeStructure(p.type,seed):null;
 const trunk=(points,color)=>poly(c,plan?points.map(([x,y])=>[x*plan.width+plan.lean*Math.max(0,-y)/100,y]):points,color);
 // No ground ellipse baked into artwork. The renderer owns contact/cast shadows.
 if(p.part!=='moss'){
 if(cy){
  trunk([[-19,3],[-8,-10],[-6,-40],[-8,-66],[-3,-81],[2,-80],[5,-49],[8,-18],[17,2],[6,0],[-1,-12],[-6,2]],'#343f33');
  trunk([[-13,1],[-5,-12],[-4,-43],[-6,-68],[-2,-77],[0,-51],[4,-19],[10,0],[3,-3],[-1,-17],[-4,-1]],'#7c7152');
  trunk([[-8,0],[-3,-17],[-3,-55],[-1,-48],[0,-19],[-4,-3]],'#a39466');
  line(c,2,-14,3,-45,2,'#514e3b');
  for(const [x,y,b]of plan?plan.clusters.map(([x,y])=>[x,y,-Math.min(65,-y*.65)]):[[-27,-56,-37],[25,-65,-43],[-15,-82,-59],[17,-90,-67]]){line(c,0,b,x*.58,y+4,4,'#444a36');line(c,x*.58,y+4,x,y,2,'#817654');}
  foliage(c,plan?.clusters||[[-23,-58,18,13],[20,-70,20,15],[-12,-84,18,18],[7,-99,15,17],[-2,-112,8,9]],seed,p.type);
 }else{
  for(const [x,y]of [[-28,3],[26,4],[-18,-1],[18,-4]]){const mid=x*.8+(hash(seed,x)-.5)*7;line(c,x,y,mid,-10,3,'#374334');line(c,mid,-10,x*.48,-22,3,'#5c5c42');line(c,x*.48,-22,x*.25,-28,4,'#5c5c42');line(c,x,y-1,mid,-10,1,'#a29567');line(c,mid,-10,x*.48,-22,1,'#a29567');}
  trunk([[-8,1],[-5,-23],[-16,-40],[-12,-46],[-1,-31],[8,-43],[14,-41],[4,-23],[7,1],[1,-4],[-2,-19],[-4,1]],'#3b4434');
  line(c,-3,-2,-1,-26,4,'#857851');line(c,-1,-26,-13,-42,3,'#857851');line(c,1,-26,11,-42,3,'#726c48');
  for(const [x,y]of plan?.clusters||[[-35,-40],[32,-47],[-19,-60],[17,-66]]){line(c,-1,-26,x*.6,y+3,3,'#655e43');line(c,x*.6,y+3,x,y,2,'#92805a');}
  foliage(c,plan?.clusters||[[-31,-43,20,12],[29,-50,23,13],[-17,-60,22,15],[10,-70,22,14],[0,-48,20,11]],seed,p.type);
 }
 }
 // Separate moss curtains preserve openings around the trunk and between crowns.
 const moss=swampMossCurtains(p.type,seed,p.varied);
 if(p.part!=='body')for(const [x,y,h]of moss){const sway=Math.round(Math.sin(time+x)*.7);line(c,x,y,x+sway,y+h,2,'#718268');line(c,x+2,y+1,x+sway+2,y+h-4,1,'#94a080');line(c,x-1,y+4,x-2+sway,y+h-3,1,'#4a6651');}
 c.restore();
}
function fallenLog(c){c.save();c.translate(124,235);poly(c,[[-25,0],[22,-12],[29,-8],[-20,7]],'#344133');poly(c,[[-23,0],[22,-10],[26,-8],[-20,4]],'#7c7150');line(c,-17,0,19,-9,2,'#a18c5e');line(c,-11,-3,-16,-11,3,'#615c43');cluster(c,25,-8,4,4,'#ad976a',4);rect(c,24,-9,2,3,'#625640');for(let i=0;i<5;i++)rect(c,-17+i*6,-2-i,5,2,'#637f48');c.restore();}
export function drawSwampStudy(c,{time=0,drawPlayer}={}){
 const layer=document.createElement('canvas');layer.width=480;layer.height=320;const p=layer.getContext('2d');p.imageSmoothingEnabled=false;
 ground(p);groundPlants(p);bridge(p);fallenLog(p);
 const objects=SWAMP_STUDY.trees.map(tree=>({y:tree.y,draw:()=>drawSwampStudyTree(p,tree,time)}));
 if(drawPlayer)objects.push({y:188,draw:()=>drawPlayer(p,294,188)});
 objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 c.imageSmoothingEnabled=false;c.drawImage(layer,0,0,960,640);
}

// Rasterize native geometry directly into the same editable indexed format as Studio.
// No DOM dependency: generation, tests and the editor receive identical pixels.
export function makeSwampTreeSprite(kind,{seed=kind==='old_cypress'?31:21,varied=false,part='all'}={}){
 const s={width:128,height:128,palette:['transparent'],pixels:Array(16384).fill(0),footprint:Array(16384).fill(0),occludes:true,nativeSwampTree:true};
 let transform={x:0,y:0,sx:1,sy:1},stack=[];
 const c={fillStyle:'#000000',save(){stack.push({...transform});},restore(){transform=stack.pop();},translate(x,y){transform.x+=x*transform.sx;transform.y+=y*transform.sy;},scale(x,y){transform.sx*=x;transform.sy*=y;},fillRect(x,y,w,h){
  let index=s.palette.indexOf(this.fillStyle);if(index<0){index=s.palette.length;s.palette.push(this.fillStyle);}
  const left=Math.round(transform.x+x*transform.sx),top=Math.round(transform.y+y*transform.sy),right=Math.round(transform.x+(x+w)*transform.sx),bottom=Math.round(transform.y+(y+h)*transform.sy);
  for(let yy=Math.max(0,top);yy<Math.min(128,bottom);yy++)for(let xx=Math.max(0,left);xx<Math.min(128,right);xx++)s.pixels[yy*128+xx]=index;
 }};
 drawSwampStudyTree(c,{x:64,y:122,scale:1,type:kind==='old_cypress'?'cypress':'mangrove',seed,varied,part});
 return s;
}
