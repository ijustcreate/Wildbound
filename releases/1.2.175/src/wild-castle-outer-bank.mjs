import {CASTLE_OUTER_BANK,GREYHAVEN} from './wild-castle-site.mjs';
import {drawCastleGrassTuft} from './wild-castle-exterior-stacks.mjs';

const turf=['#536b42','#596f43','#617747','#687e4b','#728653'];
const turfFlecks=['#97a76078','#84955790','#384e396b','#bac28273'];
const earth=['#72563e','#856448','#987351','#a47e58','#b4895d'];
const slate=['#4b514b','#5b5e51','#6a6958','#777261','#88806b'];
const seed=(x,y)=>((Math.imul(x|0,19349663)^Math.imul(y|0,83492791))>>>0)%997/997;
const mix=(a,b,t)=>a+(b-a)*t;
const unit=(x,y)=>{const l=Math.hypot(x,y)||1;return [x/l,y/l];};
const at=(p,d)=>[p.x+p.nx*d,p.y+p.ny*d];
const along=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
const ramp=(colors,index)=>colors[Math.max(0,Math.min(colors.length-1,index))];

function trace(c,points){
 c.beginPath();
 points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));
 c.closePath();
}
function fill(c,points,color){trace(c,points);c.fillStyle=color;c.fill();}
function band(c,a,b,a0,b0,a1,b1,color){fill(c,[at(a,a0),at(b,b0),at(b,b1),at(a,a1)],color);}

// Interpolate detail along the authored edge. Only the toe and turf width vary,
// so the crest of every visible face still follows the gameplay water mask.
function sampleBank(){
 const edge=CASTLE_OUTER_BANK.flatMap(([x,y],i)=>{
  const [u,v]=CASTLE_OUTER_BANK[(i+1)%CASTLE_OUTER_BANK.length];
  const pieces=Math.max(1,Math.round(Math.hypot(u-x,v-y)/26));
  return Array.from({length:pieces},(_,j)=>({x:mix(x,u,j/pieces),y:mix(y,v,j/pieces),edge:i}));
 });
 return edge.map((p,i)=>{
  const a=edge[(i+edge.length-1)%edge.length],b=edge[(i+1)%edge.length];
  const [ax,ay]=unit(p.y-a.y,a.x-p.x),[bx,by]=unit(b.y-p.y,p.x-b.x);
  const [nx,ny]=unit(-ax-bx,-ay-by),n=seed(p.x,p.y);
  const cliff=Math.max(0,ny),width=5+22*cliff+7*Math.abs(nx)+n*(5+10*cliff);
  return {...p,nx,ny,depth:Math.round(width),green:Math.round(9+19*seed(p.y,p.x)),n};
 });
}
const sections=sampleBank();
function bridgeMouth(a,b){
 const x=(a.x+b.x)/2,y=(a.y+b.y)/2;
 return y>2050&&x>GREYHAVEN.bridge.left-12&&x<GREYHAVEN.bridge.right+12;
}

function paintFace(c,a,b,i){
 const cliff=(a.ny+b.ny)/2;
 const stone=cliff<.37||seed(a.edge,719)<.27;
 const colors=stone?slate:earth;
 const grade=Math.round(1.7+a.n*1.9+cliff*.8-(a.nx+b.nx)*.42);
 const depthA=a.depth,depthB=b.depth;
 const cut=seed(i,263),ledgeA=depthA*(.48+cut*.2),ledgeB=depthB*(.59-cut*.18);
 band(c,a,b,0,0,depthA,depthB,ramp(colors,grade-1));
 band(c,a,b,0,0,ledgeA,ledgeB,ramp(colors,grade));

 const lipA=at(a,2),lipB=at(b,2),toeA=at(a,depthA),toeB=at(b,depthB);
 const split=.16+seed(i,89)*.42;
 if(cut>.23){
  const front=along(lipA,lipB,split),back=along(toeA,toeB,split+.1);
  fill(c,[lipA,front,back,along(toeA,toeB,.14)],ramp(colors,grade-(cut>.69?2:1)));
 }
 const shelf=along(at(a,ledgeA),at(b,ledgeB),.79);
 const shelfTop=along(at(a,ledgeA-2),at(b,ledgeB-2),.28);
 const shelfFace=along(at(a,ledgeA+3),at(b,ledgeB+2),.46);
 if(cut>.16)fill(c,[shelfTop,at(b,ledgeB-2),shelf,shelfFace],ramp(colors,grade+1));
 if(cut>.68&&cliff>.29){
  const lowerLeft=along(at(a,depthA*.78),at(b,depthB*.62),.26);
  const lowerRight=along(at(a,depthA*.81),at(b,depthB*.8),.92);
  fill(c,[lowerLeft,along(at(a,depthA*.72),at(b,depthB*.52),.61),lowerRight,
   along(toeA,toeB,.8),along(toeA,toeB,.44)],ramp(slate,grade));
 }
 band(c,a,b,depthA-3,depthB-3,depthA+2,depthB+2,'#3a505063');

 if(cliff<.22||cut>.52){
  const ta=along(toeA,toeB,.19),tb=along(toeA,toeB,.7),wa=along(at(a,depthA+8),at(b,depthB+9),.28);
  fill(c,[ta,tb,along(at(a,depthA+7),at(b,depthB+6),.76),wa],'#37565d83');
  if(cut>.65)fill(c,[ta,along(toeA,toeB,.58),along(at(a,depthA+4),at(b,depthB+5),.66),wa],'#596c60');
 }
 if(cut>.21&&cliff>-.55){
  const fo=depthA+3,bo=depthB+4;
  const left=along(at(a,fo),at(b,bo),.19),right=along(at(a,fo),at(b,bo),.39+cut*.38);
  fill(c,[left,right,along(at(a,fo+2),at(b,bo+1),.49),along(at(a,fo+2),at(b,bo+2),.21)],
   cut>.68?'#a6c7bd8a':'#799d9391');
 }

 const count=Math.floor(Math.hypot(b.x-a.x,b.y-a.y)*Math.max(2,depthA)/74);
 for(let j=0;j<count;j++){
  const t=.14+seed(i+23,j)*.7,d=.17+seed(j,i+83)*.68;
  const [x,y]=along(at(a,depthA*d),at(b,depthB*d),t);
  c.fillStyle=seed(i,j)>.49?'#dbbc8a41':'#38443b4b';
  c.fillRect(Math.round(x),Math.round(y),2+(j%3),1+(j%2));
 }
}

function paintTurf(c,a,b,i){
 const green=Math.round(a.n*3);
 const outerA=at(a,-a.green),outerB=at(b,-b.green);
 const notch=along(at(a,-a.green+5),at(b,-b.green+4),.5);
 fill(c,[at(a,1),at(b,1),at(b,-7),outerB,notch,outerA,at(a,-6)],ramp(turf,green)+'aa');
 band(c,a,b,-2,-3,2,2,'#405438cf');
 if(a.n>.22){
  const topA=along(at(a,-4),at(b,-5),.15),topB=along(at(a,-4),at(b,-5),.81);
  fill(c,[topA,topB,along(at(a,-1),at(b,-2),.96),along(at(a,-1),at(b,-2),.24)],ramp(turf,green+1));
 }
 if(a.n>.31){
  const [x,y]=along(at(a,-7-a.n*5),at(b,-7-a.n*6),.3+a.n*.4);
  drawCastleGrassTuft(c,x,y,i%4);
 }
 for(let j=0;j<7;j++){
  const t=.11+seed(i+31,j)*.78,d=.19+seed(j,i+43)*.56;
  const [x,y]=along(at(a,-a.green*d),at(b,-b.green*d),t);
  c.fillStyle=turfFlecks[(i+j)%turfFlecks.length];
  c.fillRect(Math.round(x),Math.round(y),1+j%4,1+j%2);
  if(j%3===0)c.fillRect(Math.round(x+1),Math.round(y-2),1+j%2,3);
 }
 if(a.n>.73){
  const [x,y]=along(at(a,-a.green+2),at(b,-b.green+4),.64);
  fill(c,[[x-6,y+2],[x-3,y-2],[x+4,y-3],[x+7,y],[x+4,y+2]],'#76806a');
  fill(c,[[x-3,y-2],[x+4,y-3],[x+5,y-1],[x-2,y]],'#9c9d7c');
 }
}

export function paintCastleOuterBank(c){
 c.save();trace(c,CASTLE_OUTER_BANK);c.clip();
 sections.forEach((a,i)=>{
  const b=sections[(i+1)%sections.length];
  if(!bridgeMouth(a,b))paintFace(c,a,b,i);
 });
 c.restore();
 sections.forEach((a,i)=>{
  const b=sections[(i+1)%sections.length];
  if(!bridgeMouth(a,b))paintTurf(c,a,b,i);
 });
}
