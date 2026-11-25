import {block as b,shape as p,line as l} from './diagon-shop-brush.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {DIAGON_PAVER_LANE,DIAGON_STREET,NOCTURNE_CONNECTOR,NOCTURNE_PAVEMENT_START,diagonLaneX,nocturneLaneX} from './alley-street-layout.mjs';
import {GARDEN_STREET_APPROACH} from './diagon-garden-layout.mjs';

const passageSlabs=['#898977','#979481','#a5a08a','#807e6d'];
const gardenMouth=(GARDEN_STREET_APPROACH.y+GARDEN_STREET_APPROACH.h/2);
export const GARDEN_STREET_CURB_OPENING=[gardenMouth-27,gardenMouth+27];

function joinStone(c,x,y,w,h,color){
 p(c,color,[[x,y+1],[x+2,y],[x+w-3,y],[x+w-1,y+2],[x+w-2,y+h-2],[x+1,y+h-2]]);
 b(c,x+3,y+1,Math.max(1,w-7),1,'#c1b79b76');
}

export function drawGardenStreetJunction(c,visible){
 const start=DIAGON_STREET.x-4,end=DIAGON_PAVER_LANE.x;
 const [top,bottom]=GARDEN_STREET_CURB_OPENING;
 if(!visible((start+end)/2,gardenMouth,(end-start)/2,31))return;
 p(c,'#62685b',[[start,top],[end-7,top],[end,top+4],[end,bottom-4],[end-7,bottom],[start,bottom]]);
 for(let row=0;row<4;row++){
  let x=start+(row%2)*5;
  const y=top+2+row*13;
  for(let col=0;x<end;col++){
   const w=Math.min(end-x,12+(row*11+col*5)%7);
   if(w>4)joinStone(c,x,y,w,12,passageSlabs[(row+col)%passageSlabs.length]);
   x+=Math.max(1,w);
  }
 }
 for(const y of [top-1,bottom-2]){
  b(c,end-13,y,13,3,'#727462');b(c,end-12,y,11,1,'#9d987e');
 }
}

export function drawOllivandersPassage(c,{x,y,w,h},visible){
 w=Math.min(w,DIAGON_PAVER_LANE.x-x);
 if(!visible(x+w/2,y+h/2,w/2,h/2))return;
 b(c,x,y,w,h,'#696a5b');
 b(c,x,y+2,w-5,3,'#9b987d');b(c,x,y+h-4,w-5,4,'#4d594d');
 for(let row=0;row<4;row++)for(let dx=(row%2)*9;dx<w-5;dx+=19){
  const dy=y+5+row*10,width=Math.min(19,w-dx);
  joinStone(c,x+dx,dy,width,10,passageSlabs[(row+dx)%passageSlabs.length]);
 }
}

const threshold={x:DIAGON_PAVER_LANE.x+DIAGON_PAVER_LANE.w-2,y:NOCTURNE_CONNECTOR.y,h:NOCTURNE_CONNECTOR.h,
 w:NOCTURNE_PAVEMENT_START-DIAGON_PAVER_LANE.x-DIAGON_PAVER_LANE.w+24};
let thresholdRaster;
function paintNocturneThreshold(c){
 const {w,h}=threshold;
 const slate=['#858278','#79796f','#70736e','#686c6c','#5f6568','#555e63','#4b535a'];
 const mortar=c.createLinearGradient(0,0,w,0);
 mortar.addColorStop(0,'#6a6d63');mortar.addColorStop(1,'#373d48');
 for(let row=0;row<Math.ceil(h/12);row++){
  const y=row*12,start=(row%2)*3,end=w-4-(row*13)%12;
  b(c,start,y,end-start,Math.min(12,h-y),mortar);
  for(let x=start,col=0;x<end-3;col++){
   const width=Math.min(end-x,14+(row*13+col*3)%8);
   const index=Math.min(slate.length-1,Math.floor((x+row%3*2)/10));
   joinStone(c,x,y,width,13,slate[index]);
   x+=width;
  }
 }
 // A narrow iron gutter ties the tan slabs and the blue cobbles together.
 for(const [x,y] of [[59,10],[59,46],[59,80]]){
  b(c,x-3,y,10,15,'#3c403d');b(c,x-2,y+1,7,12,'#77796b');
  for(let i=2;i<=10;i+=3)b(c,x-1,y+i,5,1,'#363d3c');
 }
 b(c,2,0,w-16,2,'#918f7b');b(c,2,h-3,w-16,3,'#535b57');
}

export const NOCTURNE_CONNECTOR_WALL=Object.freeze({start:NOCTURNE_CONNECTOR.x+20,end:8943,baseY:NOCTURNE_CONNECTOR.y+1,
 capY:NOCTURNE_CONNECTOR.y-36});

export function queueNocturneConnectorWall(c,visible,objects){
 const {baseY:y,start,end}=NOCTURNE_CONNECTOR_WALL;
 for(let x=start;x<end;x+=74){
  if(!visible(x+37,y,45,51))continue;
  objects.push({depth:y,paint:()=>{
   const w=Math.min(74,end-x);
   b(c,x,y-31,w,35,'#383c41');
   for(let row=0;row<4;row++)for(let dx=(row%2)*8-6;dx<w;dx+=16){
    const left=Math.max(0,dx),width=Math.min(w,dx+15)-left;
    if(width>0)b(c,x+left,y-29+row*8,width,7,['#5f6063','#53585f','#606266','#666468'][(dx+row*3+x+6)%4]);
   }
   b(c,x+2,y-30,5,33,'#575a5c');
   b(c,x-1,y-40,w+2,12,'#666a68');b(c,x,y-38,w,6,'#8b8c7f');
   for(let dx=1;dx<w;dx+=18){
    const sw=Math.min(17,w-dx),tone=['#929185','#99968a','#888c81'][(x+dx)%3];
    b(c,x+dx,y-38,sw,6,tone);b(c,x+dx,y-38,sw,1,'#ada99a');
    if(sw>8)b(c,x+dx+3,y-34,sw-6,1,'#787d74');
   }
   b(c,x-1,y-32,w+2,3,'#74756f');b(c,x-1,y-32,w+2,1,'#a5a394');
   b(c,x+1,y-33,9,4,'#868679');b(c,x+1,y-33,9,1,'#a4a193');
   for(let i=0;i<3;i++)b(c,x+13+(x*i+19)%49,y-10+i*2,2+i%3,2,'#55624d');
  }});
  if((x-start)%148===0)objects.push({depth:y+12,paint:()=>{
   const u=x+26;b(c,u-9,y+7,18,5,'#322e30');b(c,u-7,y+3,14,6,'#67514b');
   for(let i=-1;i<=1;i++){l(c,'#687c5d',u,y+4,u+i*7,y-8-(i+1)%2*4,2);b(c,u+i*7-2,y-10,5,4,'#677960');}
  }});
 }
}

export function drawNocturneThreshold(c,visible){
 const {x,y,w,h}=threshold;
 if(!visible(x+w/2,y+h/2,w/2,h/2))return;
 if(!thresholdRaster){
  thresholdRaster=document.createElement('canvas');thresholdRaster.width=w;thresholdRaster.height=h;
  paintNocturneThreshold(thresholdRaster.getContext('2d'));
 }
 c.drawImage(thresholdRaster,x,y);
}

export function drawNocturneRatHoles(c,holes,visible){
 for(const {x,y,side} of holes){
  if(!visible(x,y,16,15))continue;
  const dx=x+side*7;
  p(c,'#535456',[[dx-8,y],[dx-7,y-5],[dx-4,y-7],[dx+3,y-7],[dx+6,y-5],[dx+7,y]]);
  p(c,'#22282c',[[dx-6,y],[dx-6,y-4],[dx-3,y-6],[dx+3,y-6],[dx+5,y-4],[dx+5,y]]);
  b(c,dx-8,y,16,1,'#313538');b(c,dx+side*6,y-2,2,1,'#71716a');
 }
}

const posts=[
 {x:diagonLaneX(8077),y:5588,night:false,boards:[['DIAGON ALLEY','up'],['NOCTURNE ALLEY','right']]},
 {x:nocturneLaneX(9165),y:5234,night:true,boards:[['OLD WIZARD CEMETERY','right'],['DIAGON ALLEY','left']]},
 {x:9448,y:5390,night:true,boards:[['OLD WIZARD CEMETERY','down'],['NOCTURNE ALLEY','up']]},
];

function paint(c,{x,y,night,boards}){
 const timber=night?'#433c42':'#5e4530',edge=night?'#29282f':'#352d25',light=night?'#747168':'#ae8856';
 b(c,x-8,y-2,16,5,'#242a284d');b(c,x-3,y-48,6,48,edge);b(c,x-2,y-46,2,45,light);
 for(const [index,[label,direction]] of boards.entries()){
  const w=pixelChatTextWidth(label)+14,l=x-Math.floor(w/2),r=l+w,top=y-49+index*17;
  const arrow=direction==='left'?-1:direction==='right'?1:0;
  p(c,edge,[[l,top],[r,top],[r+(arrow>0?8:0),top+7],[r,top+14],[l,top+14],[l-(arrow<0?8:0),top+7]]);
  b(c,l+2,top+2,w-4,10,timber);b(c,l+3,top+2,w-6,1,light);
  drawPixelChatText(c,label,l+5,top+4,night?'#c5d0a8':'#f0d8a3');
  if(!arrow){const bottom=top+(direction==='up'?10:6),tip=top+(direction==='up'?4:11);p(c,'#b5aa77',[[r-10,bottom],[r-5,tip],[r,bottom]]);}
 }
}

export function queueAlleyWayfinding(c,visible,objects){
 for(const post of posts)if(visible(post.x,post.y,78,54))objects.push({depth:post.y,paint:()=>paint(c,post)});
}
