import {block as b,shape as p,line as l} from './diagon-shop-brush.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';

export function drawOllivandersPassage(c,{x,y,w,h},visible){
 if(!visible(x+w/2,y+h/2,w/2,h/2))return;
 b(c,x,y,w,h,'#696a5b');
 b(c,x,y+2,w,3,'#9b987d');b(c,x,y+h-4,w,4,'#4d594d');
 for(let row=0;row<4;row++)for(let dx=(row%2)*9;dx<w-5;dx+=19){
  const dy=y+5+row*10,width=Math.min(17,w-dx-2),colors=['#898977','#979481','#a5a08a','#807e6d'];
  const sx=x+dx;
  p(c,colors[(row+dx)%colors.length],[[sx,dy+1],[sx+2,dy],[sx+width-2,dy],[sx+width,dy+2],[sx+width-1,dy+8],[sx+1,dy+8]]);
  b(c,sx+3,dy+1,Math.max(1,width-6),1,'#b7af94');
 }
}

const threshold={x:8129,y:5181,w:129,h:105};
let thresholdRaster;
function paintNocturneThreshold(c){
 const {w,h}=threshold;
 const slate=['#858278','#79796f','#70736e','#686c6c','#5f6568','#555e63','#4b535a'];
 for(let row=0;row<Math.ceil(h/12);row++){
  const y=row*12,shift=(row%2)*7;
  for(let col=-1;col<9;col++){
   const x=col*16+shift,index=Math.max(0,Math.min(slate.length-1,Math.floor((x+15+((col*13+row*7)%13))/21)));
   p(c,slate[index],[[x,y+2],[x+2,y],[x+13,y],[x+15,y+3],[x+15,y+10],[x+12,y+11],[x+1,y+11]]);
   b(c,x+3,y+1,Math.min(9,3+(row+col+1)%9),1,'#c4c0a246');
  }
 }
 // A narrow iron gutter ties the tan slabs and the blue cobbles together.
 for(const [x,y] of [[59,10],[59,46],[59,80]]){
  b(c,x-3,y,10,15,'#3c403d');b(c,x-2,y+1,7,12,'#77796b');
  for(let i=2;i<=10;i+=3)b(c,x-1,y+i,5,1,'#363d3c');
 }
 b(c,0,0,w,2,'#918f7b');b(c,0,h-3,w,3,'#535b57');
}

export function queueNocturneConnectorWall(c,connector,visible,objects){
 const y=connector.y+1,start=connector.x+20,end=8943;
 for(let x=start;x<end;x+=74){
  if(!visible(x+37,y,45,51))continue;
  objects.push({depth:y,paint:()=>{
   const w=Math.min(74,end-x);
   b(c,x,y-31,w,35,'#383c41');
   for(let row=0;row<4;row++)for(let dx=(row%2)*8-6;dx<w;dx+=16){
    const left=Math.max(0,dx),width=Math.min(w,dx+15)-left;
    if(width>0)b(c,x+left,y-29+row*8,width,7,['#5f6063','#53585f','#606266','#666468'][(dx+row*3+x+6)%4]);
   }
   b(c,x-1,y-33,w+2,4,'#827d76');b(c,x,y-31,w,1,'#a09a89');
   b(c,x+2,y-32,5,35,'#575a5c');b(c,x+2,y-33,8,3,'#817b73');
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
 {x:8077,y:5588,night:false,boards:[['DIAGON ALLEY','up'],['NOCTURNE ALLEY','right']]},
 {x:9165,y:5234,night:true,boards:[['OLD WIZARD CEMETERY','right'],['DIAGON ALLEY','left']]},
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
