import {drawForestTree} from './forest-tree-art.mjs';
import {paintWoodlandShrub} from './forest-shrub-art.mjs';
import {TIDEGLASS_BEACON,tideglassEdge,tideglassPathDistance} from './tideglass-layout.mjs';
import {CASTLE_OUTER_BANK,GREYHAVEN,castleOuterBankPoint,castleSurface} from './wild-castle-site.mjs';
import {drawRiverBankGrass,drawRiverCattails} from './wild-river-vegetation.mjs';
import {vegetationWind,vegetationWindStrength} from './vegetation-motion.mjs';
import {footprintHit} from './world.mjs';

// Salt wind bends the evergreen crowns inland. Small rounded shrubs and
// flowers gather behind their roots and in the sheltered moat corners.
const {bridge,door}=GREYHAVEN;
const treeAnchors=[
 [17158,1260,92,.25,'pine',21],[17312,1192,126,.23,'pine',23],
 [17620,1155,142,.27,'pine',31],[17934,1209,109,.24,'pine',37],
 [17230,1452,126,.27,'oak',57],[17245,1710,100,.24,'pine',63],
 // Low meadow opens between these wind-bent shoulders at the last turn.
 [17634,2222,112,.21,'pine',81],[17696,2200,104,.17,'pine',87],
 [18032,2209,117,-.18,'pine',91],[18108,2239,92,-.23,'pine',97],
];
const rockAnchors=[
 [17080,1110,39,11],[18153,1223,45,17],[18365,1495,49,29],[18436,1816,51,37],
];
const shrubBeds=[
 [17117,1342,42,2],[17262,1271,49,6],[17415,1237,49,17],[17687,1214,55,23],
 [17892,1269,41,29],[17288,1519,45,31],[17195,1788,49,5],[17300,1912,37,7],
 [17541,2139,46,47],[18155,2147,42,73],
];
const flowerBeds=[
 [17158,1328,44,16,6],[17435,1257,44,20,11],[17672,1261,51,13,13],
 [17808,1274,49,14,17],[17933,1310,42,15,19],[17221,1542,51,18,23],
 [17275,1818,40,23,29],[17334,1994,46,24,31],[17504,2178,51,18,37],
 [17662,2151,63,19,41],[17743,2172,34,22,43],[17928,2180,48,18,47],
 [18072,2160,51,25,51],[18228,2076,46,16,53],
 [17528,2360,36,10,61],[17681,2361,42,9,67],[17777,2342,27,11,71],[17866,2295,28,12,79],
];
// Each patch follows a single shelf. The crossing and the long exposed
// ledges stay open so the earth and stone faces show between plants.
const mossLedges=[[0,.46],[2,.38],[6,.62],[11,.44],[17,.53],[23,.6],
 [27,.64],[33,.52],[35,.58],[45,.48],[50,.51],[57,.35],[61,.5]];
const reedBeds=[[1,.62],[9,.64],[16,.65],[23,.5],[32,.56],[47,.58],[58,.43],[63,.48]];

const spread=(value,amount)=>value*(amount*2)-amount;
const roll=(x,y)=>((Math.imul(x|0,19349663)^Math.imul(y|0,83492791))>>>0)%997/997;
const near=(bounds,x,y,pad)=>x>bounds.left-pad&&x<bounds.right+pad&&y>bounds.top-pad&&y<bounds.bottom+pad;
const dry=(x,y)=>castleSurface(x,y)!=='water'&&tideglassEdge(x,y)>8;
const offTrail=(x,y,pad=0)=>tideglassPathDistance(x,y)>33+pad;

function broadProp([x,rootY,size,shape,treeType,seed],kind){
 const y=rootY-size*(kind==='tree'?.35:.19);
 return {id:`greyhaven:${kind}:${x}:${rootY}`,kind,x,y,rootY,size,procedural:true,season:'summer',
  treeType,seed,lean:shape};
}
export const CASTLE_LANDSCAPE_TREES=treeAnchors.filter(([x,y,size])=>
 castleSurface(x,y)===null&&dry(x,y)&&offTrail(x,y,size*.28)&&Math.hypot(x-TIDEGLASS_BEACON.x,y-TIDEGLASS_BEACON.y)>132)
 .map(anchor=>broadProp(anchor,'tree'));
const rocks=rockAnchors.filter(([x,y,size])=>castleSurface(x,y)===null&&dry(x,y)&&offTrail(x,y,size*.2))
 .map(([x,y,size,seed])=>broadProp([x,y,size,null,null,seed],'rock'));
const rootedProps=[...CASTLE_LANDSCAPE_TREES,...rocks];

function group(beds,amount,accept){
 const members=[];
 for(const [x,y,rx,ry,seed] of beds){
  for(let i=0;i<amount;i++){
   const px=Math.round(x+spread(roll(seed,i+2),rx)),py=Math.round(y+spread(roll(i+2,seed),ry));
   if(((px-x)/rx)**2+((py-y)/ry)**2>1||!accept(px,py))continue;
   members.push({x:px,y:py,seed:seed*31+i,type:Math.floor(roll(i+seed,41)*4)});
  }
 }
 return members;
}

function bankPlants(shelves,wet){
 const plants=[];
 for(const [edge,at] of shelves){
  const [ax,ay]=CASTLE_OUTER_BANK[edge],[bx,by]=CASTLE_OUTER_BANK[(edge+1)%CASTLE_OUTER_BANK.length];
  const length=Math.hypot(bx-ax,by-ay),landY=(ax-bx)/length;
  // The north shore's exposed face projects deepest over the water. Root the reeds
  // just beyond its toe while lower banks can shelter closer clusters.
  const toe=18+8*(1-Math.abs(landY))+25*Math.max(0,-landY);
  const amount=wet?3+edge%2:5+edge%3;
  for(let i=0;i<amount;i++){
   const seed=edge*47+i+3,t=Math.max(.09,Math.min(.91,at+spread(roll(seed,61),wet?14:21)/length));
   const offset=wet?-toe-spread(roll(seed,73),5):16+spread(roll(seed,73),8);
   const point=castleOuterBankPoint(edge,t,offset),x=Math.round(point.x),y=Math.round(point.y);
   if(y>=bridge.top&&x>bridge.left-40&&x<bridge.right+40)continue;
   const surface=castleSurface(x,y);
   if(wet?surface!=='water':surface!==null||!dry(x,y)||!offTrail(x,y,6))continue;
   if(plants.some(p=>Math.hypot(p.x-x,p.y-y)<(wet?8:4)))continue;
   plants.push({x,y,seed,type:Math.floor(roll(seed,79)*4),side:x<GREYHAVEN.x?1:-1});
  }
 }
 return plants;
}

const shrubs=group(shrubBeds.map(([x,y,r,s])=>[x,y,r,r*.48,s]),5,(x,y)=>dry(x,y)&&castleSurface(x,y)===null&&offTrail(x,y,12));
const flowers=group(flowerBeds,17,(x,y)=>dry(x,y)&&offTrail(x,y,-2));
const moss=bankPlants(mossLedges,false);
const reeds=bankPlants(reedBeds,true);

export function castleLandscapeBlocked(x,y,radius=8,from=null){
 if(x<17010-radius||x>18555+radius||y<1050-radius||y>2250+radius)return false;
 return rootedProps.some(prop=>{
  if(!footprintHit(prop,null,x,y,radius))return false;
  // Return a pre-existing checkpoint to walkable ground if a new root covers it.
  if(!from||!footprintHit(prop,null,from.x,from.y,radius))return true;
  const depth=prop.rootY-prop.size/16;
  return (x-prop.x)**2+(y-depth)**2<(from.x-prop.x)**2+(from.y-depth)**2;
 });
}

export function castleApproachReveal({x,y}){
 const opening=Math.max(0,Math.min(1,(y-2137)/70,(2350-y)/100,(185-Math.abs(x-door.x))/115));
 return opening*opening*(3-2*opening);
}

const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function poly(c,points,color){
 c.beginPath();c.moveTo(...points[0]);
 for(const point of points.slice(1))c.lineTo(...point);
 c.closePath();c.fillStyle=color;c.fill();
}
function oval(c,x,y,rx,ry,color){
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
}

const leaf=['#486542','#5d794a','#75884f','#97a36b'];
const petals=[
 ['#e8d7aa','#c2a170','#ae874a'],['#cb9c9c','#9e727e','#d9b36e'],
 ['#daca8f','#b28d58','#92633e'],['#b1adc6','#887dac','#e0c673'],
];
function blades(c,x,y,size,seed,time){
 const gust=vegetationWind(x,y,time);
 for(let i=-2;i<=2;i++){
  const h=Math.max(3,Math.round(size*(.68+roll(seed,i)*.49)-Math.abs(i)*1.35));
  const root=x+i*2,bend=Math.round(1+gust*1.4+i*.84);
  rect(c,root,y-Math.round(h*.43),2,Math.round(h*.45),leaf[(i+3)%3]);
  rect(c,root+Math.round(bend/2),y-Math.round(h*.78),1,Math.round(h*.46),leaf[(i+5)%3+1]);
  rect(c,root+bend,y-h,1,Math.max(2,Math.round(h*.31)),leaf[(i+5)%3+1]);
 }
}
function drawFlower(c,p,time){
 const {x,y,seed,type}=p,h=5+Math.floor(roll(seed,4)*7);
 const tip=Math.round(vegetationWind(x,y,time)*1.45),tx=x+tip,ty=y-h;
 rect(c,x,y-h/2,1,h/2,'#4e6a46');rect(c,x+Math.round(tip*.5),ty+2,1,h/2,'#718554');
 rect(c,x-2,y-4,3,1,leaf[2]);rect(c,x+1,y-6,2,1,leaf[1]);
 const [light,edge,center]=petals[type];
 rect(c,tx-2,ty,5,2,edge);rect(c,tx-1,ty-1,3,3,light);rect(c,tx,ty,1,1,center);
}
function drawLowLedge(c,p,time){
 const {x,y,seed,type}=p,wide=5+Math.floor(roll(seed,8)*9);
 const color=leaf[type===3?2:type];
 poly(c,[[x-wide,y],[x-wide+3,y-3],[x-1,y-4],[x+wide-2,y-2],[x+wide,y+1],[x+2,y+3],[x-wide+3,y+2]],color);
 rect(c,x-4,y-2,3+type,1,'#9ba66a');
 if(type>1)blades(c,x,y,type+4,seed,time);
}

const shrubSprites=new Map(),shrubWidth=70,shrubRise=40;
function paintShrub(c,type,sway){
 paintWoodlandShrub((points,color)=>poly(c,points,color),
  (x,y,w,h,color)=>rect(c,x,y,w,h,color),type,sway);
}
function drawShrub(c,p,time,strength){
 const scale=.36+roll(p.seed,9)*.36;
 const sway=Math.round(vegetationWind(p.x,p.y,time,Math.min(strength,2.4))*1.6);
 oval(c,p.x+3,p.y+2,28*scale,7*scale,'#2f482f52');
 c.save();c.imageSmoothingEnabled=false;c.translate(p.x,p.y);c.scale(scale,scale);
 if(typeof document==='undefined')paintShrub(c,p.type,sway);
 else{
  const key=p.type+':'+sway;
  let canvas=shrubSprites.get(key);
  if(!canvas){
   canvas=document.createElement('canvas');canvas.width=shrubWidth;canvas.height=shrubRise+10;
   const pen=canvas.getContext('2d');pen.translate(shrubWidth/2,shrubRise);paintShrub(pen,p.type,sway);
   shrubSprites.set(key,canvas);
  }
  c.drawImage(canvas,-shrubWidth/2,-shrubRise);
 }
 c.restore();
}

function drawOutcrop(c,p){
 const {x,rootY:y,size,seed}=p,w=size*.55,h=size*.54;
 const cap=[[x-w,y-h*.37],[x-w*.63,y-h*.89],[x+w*.14,y-h],
  [x+w*.62,y-h*.79],[x+w*.92,y-h*.35],[x+w,y-h*.15],[x-w*.12,y-h*.22]];
 poly(c,[[x-w,y-h*.37],[x-w*.05,y-h*.61],[x+w,y-h*.15],[x+w*.88,y+1],
  [x+w*.33,y+5],[x-w*.68,y+5]],'#465652');
 poly(c,cap,'#7f8b80');
 poly(c,[[x-w,y-h*.37],[x-w*.43,y-h*.61],[x+w*.26,y-h*.6],[x+w*.2,y-h*.33],[x-w*.1,y+2],[x-w*.75,y+3]],'#626f66');
 poly(c,[[x-w*.62,y-h*.85],[x+w*.16,y-h],[x+w*.4,y-h*.81],[x-w*.05,y-h*.67],[x-w*.5,y-h*.64]],'#a4a594');
 poly(c,[[x+w*.26,y-h*.6],[x+w*.62,y-h*.78],[x+w*.93,y-h*.37],[x+w*.89,y+1],
  [x+w*.31,y+4],[x+w*.16,y-h*.26]],'#526362');
 for(let i=0;i<6;i++){
  const px=x+spread(roll(seed,i+21),w*.68),py=y-h*.42+spread(roll(i,seed+51),h*.21);
  rect(c,px,py,2+i%3,1,i%2?'#a4aa88':'#718568');
 }
}
function drawBentTree(c,p,time,game){
 const gust=vegetationWind(p.x,p.rootY,time,vegetationWindStrength(game));
 c.save();
 c.translate(p.x,p.rootY);
 c.transform(1,0,-p.lean-gust*.009,1,0,0);
 c.translate(-p.x,-p.rootY);
 drawForestTree(c,p,time,game);
 c.restore();
}

function landscapeVisible(bounds){
 return bounds.left<18670&&bounds.right>16860&&bounds.top<2390&&bounds.bottom>920;
}
export function drawCastleLandscapeGround(c,bounds,time){
 if(!landscapeVisible(bounds))return;
 for(const p of rootedProps){
  if(!near(bounds,p.x,p.rootY,p.size))continue;
  const s=p.size;
  oval(c,p.x+s*.15,p.rootY+3,s*.39,s*.105,'#2c453940');
  oval(c,p.x+s*.05,p.rootY+2,s*.23,s*.065,'#2b403657');
 }
 for(const p of moss)if(near(bounds,p.x,p.y,18))drawLowLedge(c,p,time);
 for(const p of flowers)if(near(bounds,p.x,p.y,14)){
  if(p.seed%3===0)blades(c,p.x+3,p.y,6,p.seed,time);
  drawFlower(c,p,time);
 }
}

export function castleLandscapeSubjects(bounds,time,game={}){
 if(!landscapeVisible(bounds))return [];
 const out=[],strength=vegetationWindStrength(game);
 function add(x,y,pad,paint){
  if(near(bounds,x,y,pad))out.push({x,y,depth:y,castleExterior:true,paint});
 }
 for(const p of CASTLE_LANDSCAPE_TREES)add(p.x,p.rootY,p.size*1.8,c=>drawBentTree(c,p,time,game));
 for(const p of rocks)add(p.x,p.rootY,p.size,c=>drawOutcrop(c,p));
 for(const p of shrubs)add(p.x,p.y,33,c=>drawShrub(c,p,time,strength));
 for(const p of reeds)add(p.x,p.y,38,c=>{
  if(p.type===2)drawRiverCattails(c,p,time,strength*.78);
  else drawRiverBankGrass(c,p,time,strength*.78);
 });
 return out;
}
