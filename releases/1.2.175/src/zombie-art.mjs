import {mixGearColor} from './gear-art.mjs';

const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const skullContours=[
  [[-3.4,-6.8],[-1.5,-7.5],[2.5,-7.2],[4.8,-5.4],[5.5,-3],[5.4,.2],[4.5,2.6],[2.7,4.1],[-2.6,4.1],[-4.3,2.9],[-5.4,.6],[-5.5,-3.2],[-4.7,-5.6]],
  [[-3.6,-6.8],[-1.2,-7.5],[2.5,-7.25],[4.6,-5.7],[5.5,-3.1],[5.4,.2],[4.2,2.3],[2,3.9],[-2.8,4.1],[-4.4,2.8],[-5.3,1],[-5.65,-1],[-5.3,-4.35]],
  [[-3.3,-6.7],[-.8,-7.45],[2.7,-7.3],[4.8,-5.6],[5.6,-2.9],[5.4,.3],[3.7,2.6],[1.8,3.9],[-2.8,4],[-4.5,2.6],[-4.8,1.05],[-5.8,.6],[-5.8,-.25],[-4.85,-1.2],[-4.95,-4.55]],
  [[-3.7,-6.55],[-1.6,-7.35],[2.5,-7.25],[4.7,-5.5],[5.5,-2.9],[5.2,.4],[3.65,2.7],[1.45,3.8],[-2.6,3.75],[-4.5,2],[-5.35,-.8],[-5.25,-3.9]],
  [[-3.2,-6.8],[-1.2,-7.5],[2.4,-7.4],[4.6,-5.65],[5.45,-3],[5.3,.1],[4,2.5],[2.25,3.8],[-2.25,3.8],[-4,2.55],[-5.3,.2],[-5.45,-3],[-4.5,-5.55]],
];
const skullTiles=new Map();
const skullLeft=-6,skullTop=-8,skullWidth=24,skullHeight=25;
const skullOutline='#2d332e',socket='#333d34',mouth='#30332c',tooth='#d8c9a3';

function zombieTones(actor){
 const color=actor.appearance?.skin;
 const skin=/^#[0-9a-f]{6}$/i.test(color||'')?color:'#8d9b7e';
 return {skin,light:mixGearColor(skin,'#d3c99e',.38),
  shade:mixGearColor(skin,'#35473c',.47),bruise:mixGearColor(skin,'#4a3c43',.56)};
}

function insideContour(contour,x,y){
 let inside=false;
 for(let i=0,j=contour.length-1;i<contour.length;j=i++){
  const [ax,ay]=contour[i],[bx,by]=contour[j];
  if((ay>y)!==(by>y)&&x<ax+(bx-ax)*(y-ay)/(by-ay))inside=!inside;
 }
 return inside;
}

function paintSkull(c,d,tones,left,top,cell){
 const contour=skullContours[d<=4?d:8-d],mirror=d>4?-1:1,back=d>=3&&d<=5;
 const inside=(x,y)=>insideContour(contour,x*mirror,y);
 for(let row=0;row<skullHeight;row++)for(let col=0;col<skullWidth;col++){
  const x=skullLeft+col/2+.25,y=skullTop+row/2+.25;
  if(!inside(x,y))continue;
  const edge=!inside(x-.5,y)||!inside(x+.5,y)||!inside(x,y-.5)||!inside(x,y+.5);
  const under=y>2.45+x*.12,side=x>2.1+(y+4)*.24;
  const light=x<-1.2+(y+4)*.24&&y<(back?-.5:1.3);
  const wound=back?x>1.8&&x<3.4&&y>-.7&&y<1.7:x*mirror>2.65&&x*mirror<4.6&&y>-.25&&y<1.45;
  c.fillStyle=edge?skullOutline:wound?tones.bruise:under||side?tones.shade:light?tones.light:tones.skin;
  c.fillRect(left+col*cell,top+row*cell,cell,cell);
 }
}

export function drawZombieSkull(c,points,d,actor){
 const {head}=points,tones=zombieTones(actor),left=head.x+skullLeft,top=head.y+skullTop;
 if(!c.drawImage||typeof document==='undefined'){
  paintSkull(c,d,tones,left,top,.5);
  return;
 }
 const key=d+':'+tones.skin;
 let tile=skullTiles.get(key);
 if(!tile){
  tile=document.createElement('canvas');tile.width=skullWidth;tile.height=skullHeight;
  paintSkull(tile.getContext('2d'),d,tones,0,0,1);
  if(skullTiles.size>=32)skullTiles.delete(skullTiles.keys().next().value);
  skullTiles.set(key,tile);
 }
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(tile,left,top,skullWidth/2,skullHeight/2);
 c.restore();
}

export function drawZombieFace(c,p,d,actor,time,visible=()=>true){
 if(d>=3&&d<=5)return;
 const {head}=p,profile=d===2||d===6,turn=d===0?0:d<4?-1:1,dead=actor.hp<=0;
 const {light,shade,bruise}=zombieTones(actor);
 const farEye=d===1?'eyeL':d===7?'eyeR':null;
 for(const name of ['eyeL','eyeR']){
  if(!visible(name)||profile&&name!==(d===2?'eyeL':'eyeR'))continue;
  const eye=p[name],far=name===farEye;
  const width=far?2:3;
  const y=head.y-1.8;
  const x=eye.x-(far?1:1.5);
  pixel(c,x,y,width,2,socket);
  pixel(c,x,y+2,width-1,1,far?shade:bruise);
  pixel(c,x+(turn>0||!turn?1:0),y+1,1,1,dead?'#68775e':'#e0d587');
 }
 if(visible('nose')){
  const x=p.nose.x,y=head.y+.1;
  pixel(c,x,y,1,1,light);
  pixel(c,x+(turn||1),y+1,1,1,shade);
 }
 if(!visible('mouth'))return;
 const y=head.y+1.85,x=p.mouth.x-(profile?1:2);
 if(actor.zombieVariant==='broken_jaw'){
  const wag=dead||actor.frozen>0?0:Math.round(Math.sin(time*2)*.7);
  const width=profile?3:5,jawX=x+(turn||1);
  pixel(c,x,y-.6,width,2,mouth);
  pixel(c,jawX,y+1.1+wag,width-1,1,shade);
  pixel(c,x+1,y-.6,1,1,tooth);
  if(!profile)pixel(c,x+3,y+.4,1,1,tooth);
 }else{
  const width=profile?2:4;
  pixel(c,x,y,width,1,mouth);
  if(!profile)pixel(c,x+1,y+1,2,1,shade);
  pixel(c,x+1,y,1,1,tooth);
 }
}
export function drawZombieClaws(c,hand,d){
 const turn=d===2?-1:d===6?1:0;
 for(let n=0;n<3;n++)pixel(c,hand.x-2+n*2+turn,hand.y+1+n%2,1,3,'#d4c8a6');
}
export function drawZombieRags(c,p,d){
 const x=p.chest.x,y=p.chest.y,back=d>=3&&d<=5;
 pixel(c,x-3,y+2,3,3,'#83917b');pixel(c,x-2,y+3,2,2,'#586856');pixel(c,x+3,y+4,2,5,'#302e3e');
 pixel(c,p.pelvis.x-4,p.pelvis.y+2,2,4,'#74785c');pixel(c,p.pelvis.x+2,p.pelvis.y+1,3,2,'#47423d');
 if(back){pixel(c,x-1,y-2,4,2,'#727467');pixel(c,x+2,y,1,4,'#b3aa8c');}
}
