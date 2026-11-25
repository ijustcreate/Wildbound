import {drawPalmTree} from './forest-tree-art.mjs';
import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {tideglassEdge} from './tideglass-layout.mjs';
import {lagoonMermaids} from './lagoon-mermaids.mjs';
import {drawLagoonMermaid} from './lagoon-mermaid-art.mjs';

export const MERMAID_LAGOON=Object.freeze({
 id:'mermaid-lagoon',name:'Mermaid Lagoon',x:17430,y:5420,
 approach:Object.freeze({x:17078,y:5135}),
});
export const MERMAID_LAGOON_BOUNDS=Object.freeze({left:16855,top:4804,right:18105,bottom:5705});

const coast=[
 [16925,5181],[16964,5075],[17065,5010],[17180,4985],[17293,5015],[17454,4996],
 [17581,5011],[17702,5071],[17810,5142],[17884,5232],[17914,5334],[17883,5440],
 [17856,5506],[17772,5577],[17636,5614],[17498,5632],[17328,5655],[17181,5635],
 [17077,5581],[16996,5493],[16940,5386],
];
// The pool outline runs out through the gap between the two eastern spits.
const pool=[
 [17173,5341],[17202,5279],[17265,5242],[17336,5210],[17431,5205],[17529,5229],
 [17624,5291],[17703,5321],[17791,5336],[17876,5330],[17955,5303],[18024,5353],
 [17968,5434],[17885,5439],[17796,5425],[17707,5446],[17617,5490],[17554,5530],
 [17456,5552],[17342,5533],[17263,5509],[17216,5459],[17180,5405],
];
const approachTrail=[[17117,4995],[17164,5043],[17188,5108],[17179,5172],[17137,5230],[17125,5309]];

function edges(points,close=true){
 return points.slice(0,close?points.length:-1).map(([x,y],i)=>{
  const [endX,endY]=points[(i+1)%points.length],dx=endX-x,dy=endY-y;
  return {x,y,endY,dx,dy,length:dx*dx+dy*dy};
 });
}
const coastEdges=edges(coast),poolEdges=edges(pool),trailEdges=edges(approachTrail,false);
function distanceData(x,y,chain,signed){
 let closest=Infinity,inside=false;
 for(const edge of chain){
  const {x:ax,y:ay,endY,dx,dy,length}=edge;
  if(signed&&((ay>y)!==(endY>y))&&x<ax+(y-ay)*dx/dy)inside=!inside;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length));
  closest=Math.min(closest,(x-ax-dx*t)**2+(y-ay-dy*t)**2);
 }
 return Math.sqrt(closest)*(signed&&!inside?-1:1);
}
function edgeGrain(x,y){
 return 4*Math.sin(x*.037+y*.018)+2.3*Math.sin(x*.1-y*.068);
}
function coastalMargin(x,y){
 return distanceData(x,y,coastEdges,true)+edgeGrain(x,y);
}
function poolMargin(x,y){
 return distanceData(x,y,poolEdges,true)+edgeGrain(x+71,y);
}
export function mermaidLagoonIntersects(left,top,right,bottom){
 const area=MERMAID_LAGOON_BOUNDS;
 return left<area.right&&right>area.left&&top<area.bottom&&bottom>area.top;
}
const inletEdge=17969;
export function mermaidLagoonDepth(x,y){
 // Outside this small basin, the surrounding sea keeps the shared ocean paint.
 if(x<17155||x>inletEdge||y<5185||y>5575)return -Infinity;
 return poolMargin(x,y);
}
export function mermaidLagoonWaterOpacity(x){
 const t=Math.max(0,Math.min(1,(inletEdge-x)/108));
 return t*t*(3-2*t);
}
export function mermaidLagoonSurface(x,y){
 if(x<16855||x>17970||y<4970||y>5705)return null;
 const edge=coastalMargin(x,y);
 if(edge<0){
  if(edge>-54&&y>5180&&tideglassEdge(x,y)<0)return 'shallow';
  return null;
 }
 const depth=mermaidLagoonDepth(x,y);
 return depth<0?'grass':depth<47?'shallow':'water';
}
export function mermaidLagoonGround(x,y){
 if(x<16915||x>17930||y<4970||y>5668)return null;
 const edge=coastalMargin(x,y),depth=mermaidLagoonDepth(x,y);
 if(edge<0||depth>=0)return null;
 if(edge<36||depth>-42)return 'sand';
 return distanceData(x,y,trailEdges,false)<22?'stone':'grass';
}

const sand=['#bda27d','#c8ac83','#d7ba90','#e2c69a','#ebd3a7'];
const grass=['#415849','#50634a','#5d6e4c','#687c52','#748458'];
const stone=['#807565','#8e806b','#9d9076','#aa9b7e','#bcad8b'];
const lagoonWater=['#7fbbb0','#63aca9','#4a939b','#397f90','#316e83','#2a6079','#26566f'];
function pigment(x,y){
 let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967296;
}
export function mermaidLagoonGroundTone(x,y){
 const material=mermaidLagoonGround(x,y);
 if(!material)return null;
 const colors=material==='sand'?sand:material==='stone'?stone:grass;
 const relief=Math.sin(x*.013+y*.016)*.68+Math.sin(x*.051-y*.048)*.44;
 const index=Math.max(0,Math.min(4,Math.floor(2+relief+pigment(x>>2,y>>2)*1.1)));
 return colors[index];
}
export function mermaidLagoonWaterTone(x,y){
 const depth=mermaidLagoonDepth(x,y);
 if(depth<0)return null;
 const variation=Math.sin(x*.052-y*.028)*.24+(pigment(x>>2,y>>2)-.5)*.24;
 const shade=Math.max(0,Math.min(6,Math.round(Math.sqrt(depth/165)*6+variation)));
 return lagoonWater[shade];
}

const pillars=[
 {x:17284,y:5207,w:120,h:134,base:30,seed:4},
 {x:17360,y:5197,w:163,h:192,base:34,seed:8},
 {x:17464,y:5189,w:153,h:215,base:31,seed:15},
 {x:17539,y:5215,w:135,h:171,base:33,seed:18},
 {x:17636,y:5243,w:122,h:143,base:34,seed:22},
 {x:17718,y:5292,w:97,h:106,base:27,seed:24},
];
const rocks=[
 {x:17056,y:5328,w:60,h:41,base:20,seed:3},
 {x:17007,y:5420,w:78,h:55,base:20,seed:6},
 {x:17257,y:5554,w:62,h:42,base:22,seed:20},
 {x:17366,y:5581,w:82,h:50,base:24,seed:29},
 {x:17513,y:5588,w:105,h:67,base:26,seed:21},
 {x:17727,y:5522,w:75,h:54,base:24,seed:17},
 {x:17797,y:5484,w:87,h:56,base:22,seed:30},
 {x:17378,y:5388,w:132,h:31,base:24,seed:32,sunning:true},
 {x:17542,y:5425,w:100,h:27,base:23,seed:15,sunning:true},
];
const palms=[
 {x:17019,rootY:5094,size:114,seed:3},{x:17079,rootY:5046,size:100,seed:15},
 {x:17210,rootY:5076,size:120,seed:18},{x:17347,rootY:5025,size:114,seed:4},
 {x:17583,rootY:5056,size:115,seed:13},{x:17686,rootY:5103,size:108,seed:21},
 {x:17795,rootY:5211,size:125,seed:7},{x:17849,rootY:5254,size:97,seed:11},
 {x:17062,rootY:5410,size:128,seed:27},{x:17096,rootY:5493,size:100,seed:12},
 {x:17172,rootY:5580,size:96,seed:24},{x:17322,rootY:5621,size:118,seed:25},
 {x:17474,rootY:5598,size:95,seed:22},{x:17684,rootY:5527,size:109,seed:26},
];
const hardRock=[...pillars,...rocks];
export function mermaidLagoonBlocked(x,y,radius=0){
 if(!mermaidLagoonIntersects(x-radius,y-radius,x+radius,y+radius))return false;
 for(const {x:cx,y:cy,w,base} of hardRock){
  if(((x-cx)/(w*.42+radius))**2+((y-cy)/(base*.68+radius))**2<1)return true;
 }
 return palms.some(p=>Math.hypot(x-p.x,y-p.rootY)<p.size*.068+radius);
}

const falls=[
 {x:17339,start:5033,end:5248,width:47,seed:4},
 {x:17482,start:5003,end:5232,width:40,seed:19},
 {x:17645,start:5136,end:5304,width:30,seed:27},
];
function shape(c,vertices,color){
 pixelPolygon(c,vertices.map(([x,y])=>({x,y})),color);
}
function rect(c,x,y,w,h,color){
 c.fillStyle=color;
 c.fillRect(Math.round(x),Math.round(y),w,h);
}
const roseStone=['#353542','#514451','#68515b','#825e6a','#a27880','#b99596'];
const slateStone=['#343843','#464955','#565966','#686a76','#85828b','#a7a1a3'];
function sunningShelf(c,{x,y,w,h,base,seed}){
 const palette=seed%3===0?slateStone:roseStone;
 const half=w/2,step=seed%3===0?3:0;
 c.save();c.translate(x,y);
 c.beginPath();c.ellipse(4,5,half+8,base*.7,0,0,Math.PI*2);
 c.fillStyle='#24445178';c.fill();
 const cap=[[-half*.91,-h+11],[-half*.71,-h+5],[-half*.33,-h],
  [half*.21,-h+1+step],[half*.56,-h+2],[half*.79,-h+7],[half*.96,-h+13],
  [half*.83,-h+19],[half*.34,-h+20],[-half*.07,-h+17],[-half*.53,-h+20]];
 shape(c,[...cap.slice(0,7),[half,1],[half*.74,base*.38],[half*.13,base*.45],
  [-half*.47,base*.36],[-half*.88,base*.17],[-half,-5]],palette[0]);
 shape(c,[[-half*.96,-h+14],cap[8],cap[7],[half*.93,0],[half*.71,base*.26],
  [half*.11,base*.39],[-half*.42,base*.28],[-half*.83,base*.12]],palette[2]);
 shape(c,cap,palette[4]);
 shape(c,[cap[0],cap[1],cap[2],cap[3],[half*.41,-h+5],[-half*.21,-h+6],
  [-half*.4,-h+9],[-half*.79,-h+13]],palette[5]);
 shape(c,[[half*.02,-h+14],cap[5],cap[6],cap[7],cap[8],cap[9]],palette[3]);
 shape(c,[[-half*.74,-h+20],[-half*.25,-h+17],[-half*.03,-h+20],[half*.27,-h+18],
  [half*.75,-h+17],[half*.46,-h+12],[half*.05,-h+14],[-half*.28,-h+12]],palette[3]);
 const strata=[[-half*.79,-6],[-half*.51,-3],[-half*.22,-5],[half*.15,-1],[half*.56,-3],[half*.83,0]];
 for(let i=1;i<strata.length;i++){
  const [ax,ay]=strata[i-1],[bx,by]=strata[i];
  pixelLine(c,{x:ax,y:ay},{x:bx,y:by},palette[1],2);
 }
 for(let i=0;i<23;i++){
  const px=(pigment(seed+i,16)-.5)*w*.75,py=-h+6+pigment(i,seed)*9;
  rect(c,px,py,2+i%4,1+i%2,i%4===1?palette[5]:palette[3]);
 }
 for(const [ox,oy] of [[-half*.77,-h+13],[half*.64,-h+13]]){
  shape(c,[[ox-9,oy],[ox-5,oy-3],[ox+3,oy-4],[ox+8,oy],[ox+2,oy+3],[ox-6,oy+2]],'#626b53');
  rect(c,ox-5,oy-2,6,1,'#8e926c');
 }
 for(let i=0;i<6;i++){
  const px=(pigment(seed,i)-.5)*(w+8),py=base*.48+pigment(i,seed)*5;
  rect(c,px,py,3+i%5,1,i%2?'#a3cbc58b':'#6ea7ab87');
 }
 c.restore();
}
function rock(c,{x,y,w,h,base,seed},tall){
 const palette=seed%3===0?slateStone:roseStone;
 const width=w/2,shapeBias=(pigment(seed,13)-.5)*17;
 c.save();
 c.translate(x,y);
 c.beginPath();c.ellipse(4,4,width+7,base*.75,0,0,Math.PI*2);
 c.fillStyle='#27373966';c.fill();
 const silhouette=[[-width,3],[-width-2,-base*.47],[-width*.94,-h*.59],[-width*.71,-h*.89],
  [-width*.36+shapeBias,-h],[width*.33,-h*.96],[width*.74,-h*.76],[width*.94,-h*.48],
  [width,4],[width*.48,base*.45],[-width*.35,base*.51]];
 shape(c,silhouette,palette[0]);
 shape(c,[[-width*.94,-2],[-width*.86,-h*.6],[-width*.64,-h*.86],[-width*.36+shapeBias,-h+2],
  [width*.29,-h*.95],[width*.73,-h*.74],[width*.68,-h*.45],[width*.5,-h*.17],
  [width*.48,base*.34],[-width*.42,base*.44]],palette[2]);
 shape(c,[[-width*.83,-h*.59],[-width*.65,-h*.86],[-width*.36+shapeBias,-h+3],
  [width*.28,-h*.94],[width*.48,-h*.82],[width*.14,-h*.65],[-width*.11,-h*.32],
  [-width*.34,base*.31],[-width*.64,base*.18]],palette[4]);
 shape(c,[[-width*.67,-h*.83],[-width*.34+shapeBias,-h+7],[width*.24,-h*.91],
  [width*.36,-h*.85],[width*.01,-h*.79],[-width*.39,-h*.78],[-width*.69,-h*.6]],palette[5]);
 shape(c,[[width*.72,-h*.76],[width*.93,-h*.47],[width*.98,2],[width*.49,base*.4],
  [width*.42,-h*.09],[width*.55,-h*.41],[width*.64,-h*.53]],palette[1]);
 for(let n=0;n<Math.floor(w*h/134);n++){
  const px=Math.floor((pigment(seed+n,37)-.5)*w*.83),py=-Math.floor(h*(.12+pigment(seed+n,63)*.6));
  const light=px<-w*.12;
  rect(c,px,py,2+Math.floor(pigment(n,seed)*7),2,light?palette[5]:palette[3]);
  if(n%8===0)rect(c,px+1,py+2,2,5,palette[1]);
 }
 for(let n=0;n<3;n++){
  const py=-h*(.35+n*.15)+(pigment(seed,n)-.5)*7;
  const coords=[[-width*.69,py],[-width*.28,py+9],[width*.12,py+5],[width*.63,py+13]];
  for(let j=1;j<coords.length;j++){
   const [a,b]=[coords[j-1],coords[j]];
   pixelLine(c,{x:a[0],y:a[1]},{x:b[0],y:b[1]},palette[n===2?4:1],2);
  }
 }
 if(tall||seed%2===0){
  shape(c,[[-width*.74,-h*.72],[-width*.62,-h*.87],[-width*.35+shapeBias,-h+2],
   [width*.27,-h*.94],[width*.56,-h*.84],[width*.45,-h*.76],[width*.2,-h*.79],
   [width*.13,-h*.71],[-width*.21,-h*.73],[-width*.41,-h*.64]],'#536446');
  for(let n=0;n<Math.floor(width/3);n++){
   const px=(pigment(seed+n,4)-.5)*width*1.2,py=-h*.79+(pigment(seed+n,22)-.5)*13;
   rect(c,px,py,4+n%4,2+n%3,n%3===0?'#8a9356':'#647744');
   if((n+seed)%7===0)rect(c,px-1,py+4,2,Math.floor(h*.19),n%2?'#5b6944':'#6b7447');
  }
 }
 c.restore();
}
function lagoonGround(c){
 const cell=4;
 for(let y=4970;y<5672;y+=cell)for(let x=16908;x<17930;x+=cell){
  const color=mermaidLagoonGroundTone(x+cell/2,y+cell/2);
  if(color)rect(c,x,y,cell,cell,color);
 }
 for(let y=4980;y<5660;y+=14)for(let x=16920;x<17940;x+=14){
  const seed=pigment(x,y);
  if(seed<.58)continue;
  const px=x+Math.round(seed*11),py=y+Math.round(pigment(y,x)*12);
  const material=mermaidLagoonGround(px,py);
  if(!material)continue;
  if(material==='grass'){
   rect(c,px,py,2,6,seed>.82?'#647c4f':'#475947');
   rect(c,px+3,py+1,2,4,'#64784c');
   if(seed>.95)rect(c,px+2,py-2,4,2,'#c09987');
  }else{
   rect(c,px,py,2+(seed>.8?3:0),2,seed>.78?'#a68e70':'#ecd0a0');
   if(seed>.976){
    rect(c,px,py,8,2,'#ae8f7a');rect(c,px+1,py-3,6,4,'#e7bba7');
    rect(c,px+3,py-4,3,2,'#f4dbbf');
   }
  }
 }
}
const spriteScale=2;
let groundRaster;
function lagoonRaster(ctx,bounds,paint){
 const width=Math.ceil((bounds.right-bounds.left)/spriteScale);
 const height=Math.ceil((bounds.bottom-bounds.top)/spriteScale);
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):ctx.canvas?.ownerDocument?.createElement('canvas');
 if(!canvas)return null;
 canvas.width=width;canvas.height=height;
 const c=canvas.getContext('2d');
 c.imageSmoothingEnabled=false;
 c.scale(1/spriteScale,1/spriteScale);c.translate(-bounds.left,-bounds.top);
 paint(c);
 return canvas;
}
function showRaster(c,raster,b){
 if(!raster)return;
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(raster,b.left,b.top,raster.width*spriteScale,raster.height*spriteScale);
 c.restore();
}
export function drawMermaidLagoonGround(c,bounds){
 if(!mermaidLagoonIntersects(bounds.left,bounds.top,bounds.right,bounds.bottom))return;
 groundRaster??=lagoonRaster(c,MERMAID_LAGOON_BOUNDS,lagoonGround);
 showRaster(c,groundRaster,MERMAID_LAGOON_BOUNDS);
}
function waterfall(c,{x,start,end,width,seed},time){
 const half=width/2,height=end-start;
 shape(c,[[x-half,start],[x+half-4,start+3],[x+half+9,end],[x-half-5,end+3]],'#71b8be86');
 shape(c,[[x-half+5,start],[x+half-8,start+1],[x+half+1,end],[x-half+1,end]],'#a6d7d7a9');
 for(let i=0;i<Math.floor(width/3);i++){
  const shift=(pigment(i,seed)-.5)*width,rate=1.4+pigment(seed,i)*.65;
  const movement=(time*rate+pigment(i+31,seed))%1;
  for(let stripe=0;stripe<3;stripe++){
   const y=start+(movement+stripe)%1*height/3+stripe*height/3;
   rect(c,x+shift+(y-start)*.024,y,2+i%3,Math.min(end-y,13+i%19),
    i%3===0?'#e6f8ebba':i%2?'#d8eeea8e':'#7db7c371');
  }
 }
 rect(c,x-half+3,start-2,width-6,4,'#c8eee5cb');
 for(let i=0;i<25;i++){
  const p=pigment(i,seed),age=(time*.8+p)%1,sign=i%2?1:-1;
  rect(c,x+sign*(3+age*(width*.85+p*18)),end+7-age*(1-age)*40+pigment(i,seed+5)*9,
   2+i%6,2+i%3,i%3?'#cfefe8a2':'#f4fff2d5');
 }
 for(let j=0;j<3;j++){
  const age=(time*.54+j/3)%1;
  c.save();c.globalAlpha=(1-age)*.68;c.strokeStyle='#b3e8e5';c.lineWidth=2;
  c.beginPath();c.ellipse(x,end+11,width*.29+age*36,2+age*10,0,.25,Math.PI*1.78);c.stroke();
  c.restore();
 }
}
function subject(prop,kind,depth,left,top,right,bottom){
 return {depth,mermaidLagoonSubject:{prop,kind,bounds:{left,top,right,bottom}}};
}
const lagoonSubjects=[
 ...hardRock.map(p=>subject(p,p.sunning?'shelf':p.h>75?'pillar':'rock',p.y,p.x-p.w/2-16,p.y-p.h-8,p.x+p.w/2+16,p.y+p.base+8)),
 ...palms.map(p=>subject(p,'palm',p.rootY,p.x-p.size,p.rootY-p.size*1.75,p.x+p.size,p.rootY+p.size*.4)),
 ...falls.map(p=>subject(p,'fall',p.end,p.x-80,p.start-5,p.x+80,p.end+30)),
].sort((a,b)=>a.depth-b.depth);
export function mermaidLagoonSubjects(bounds,t){
 if(!mermaidLagoonIntersects(bounds.left,bounds.top,bounds.right,bounds.bottom))return [];
 const visible=({mermaidLagoonSubject:{bounds:b}})=>
  b.left<bounds.right&&b.right>bounds.left&&b.top<bounds.bottom&&b.bottom>bounds.top;
 const subjects=lagoonSubjects.filter(visible);
 for(const p of lagoonMermaids(t)){
  const actor=subject(p,'mermaid',p.depth,p.x-p.size,p.y-p.size*1.3,p.x+p.size,p.y+p.size*.65);
  if(visible(actor))subjects.push(actor);
 }
 return subjects.sort((a,b)=>a.depth-b.depth);
}
const subjectRasters=new WeakMap();
function drawLagoonCastMember(c,npc,time){
 const {x,y}=npc;
 const swimming=npc.mermaidPose==='swim';
 const wave=Math.round(Math.sin(1.8*time));
 if(swimming){
  pixelLine(c,{x:x-12-wave,y:y+1},{x:x-9,y:y-1},'#79b1bc85',1);
  rect(c,x-8,y-2,4+wave,1,'#91c0c680');
  rect(c,x+3,y-2,5+wave,1,'#89bec37b');
  pixelLine(c,{x:x+8+wave,y:y-1},{x:x+12+wave,y:y+1},'#79b1bc75',1);
  rect(c,x-16+wave,y+3,5,1,'#73aeba70');
 }
 drawLagoonMermaid(c,npc,time);
 if(swimming){
  rect(c,x+1,y+3,3,1,'#bbe1d3b0');
  rect(c,x+5,y+3,3+wave,1,'#a1d1ca9c');
 }
}
export function drawMermaidLagoonSubject(c,item,time=0){
 const {prop,kind,bounds}=item;
 if(kind==='fall'){waterfall(c,prop,time);return;}
 if(kind==='mermaid'){drawLagoonCastMember(c,prop,time);return;}
 let raster=subjectRasters.get(item);
 if(!raster){
  const paint=pen=>kind==='palm'?drawPalmTree(pen,prop,0):kind==='shelf'?sunningShelf(pen,prop):rock(pen,prop,kind==='pillar');
  raster=lagoonRaster(c,bounds,paint);
  if(!raster){paint(c);return;}
  subjectRasters.set(item,raster);
 }
 showRaster(c,raster,bounds);
}

export function drawMermaidLagoonMoonlight(c,bounds,time,dark){
 const light=Math.max(0,(dark-.28)/.72);
 if(!light||!mermaidLagoonIntersects(bounds.left,bounds.top,bounds.right,bounds.bottom))return;
 c.save();
 c.globalCompositeOperation='screen';
 c.globalAlpha=light*.48;
 for(const {x,y,w,h,seed} of pillars){
  if(x+w/2<bounds.left||x-w/2>bounds.right||y-h>bounds.bottom||y-h*.73<bounds.top)continue;
  const half=w/2,bias=(pigment(seed,13)-.5)*17;
  const shoulder={x:x-half*.63,y:y-h*.84},peak={x:x-half*.36+bias,y:y-h+4};
  const crest={x:x+half*.04,y:y-h*.95};
  pixelLine(c,shoulder,peak,'#86acce',3);
  pixelLine(c,peak,crest,'#a2cbe4',2);
  pixelLine(c,{x:shoulder.x+2,y:shoulder.y+5},
   {x:shoulder.x-half*.14,y:y-h*.64},'#739ac4',2);
  rect(c,crest.x+6,crest.y+1,5+seed%6,2,'#7099b8');
 }
 for(const {x,start,end,width,seed} of falls){
  if(x+width*1.5<bounds.left||x-width*1.5>bounds.right||start>bounds.bottom||end+24<bounds.top)continue;
  c.globalAlpha=light*.26;
  rect(c,x-width*.27,start-2,width*.45,2,'#b3d8ec');
  for(let i=0;i<15;i++){
   const age=(time*.83+pigment(i+61,seed))%1,side=i%2?1:-1;
   const drift=age*(width*.68+i%5*4),rise=age*(1-age)*(55+i%4*13);
   c.globalAlpha=light*(1-age)*.64;
   rect(c,x+side*(width*.3+drift),end+3-rise+i%4,2+i%3,1+i%2,
    i%4?'#acd8eb':'#d2eff5');
  }
  for(let i=0;i<4;i++){
   const age=(time*.53+pigment(i,seed+8))%1,span=width*.31+age*32;
   c.globalAlpha=light*(1-age)*.34;
   rect(c,x-span/2,end+9+age*12+i%2*3,span,1,'#a7d8eb');
  }
 }
 c.restore();
}
// The full terrain map samples the same contours. Its marker picks out the
// semicircle of falls without replacing any of the drawn coastline.
export function drawMermaidLagoonMap(c){
 const {x,y}=MERMAID_LAGOON;
 for(const offset of [-32,0,32]){
  rect(c,x+offset-10,y-25,20,35,'#27667b');
  rect(c,x+offset-7,y-20,14,28,'#a6d8d4');
 }
 rect(c,x-46,y+12,92,9,'#7bb6b4');
}
