import {forestHash} from './forest-landscape.mjs';
import {drawCastleStack} from './wild-castle-stack.mjs';

const oak = ['#342622','#563926','#775135','#a4744a'];
const edge = ['#463025','#69462e','#946740','#c39661'];
const bronze = ['#42352c','#725239','#9d7044','#d5ae6b'];
const slate = ['#343330','#4b4840','#6d6759','#9e9078'];
const steel = ['#313639','#50595b','#727e7e','#a4abaa'];
const ruby = ['#48282a','#6c3935','#985047','#c77f63'];
const wool = ['#877756','#a59670','#c0b48e','#e0cf9b'];
const moss = ['#2f3a31','#4d6044','#6d7d55','#8f9768'];
const leaves = ['#303e31','#486247','#668257','#8d9a65'];
const clay = ['#56392b','#865441','#ba7b58','#d4986c'];
const blueStone = ['#30323d','#424852','#565f71','#838c9e'];
const bookRamps = [ruby, moss, bronze, blueStone, wool];
const models = new Map();

// The model uses footprint-relative coordinates. Positive depth points toward the player.
function makeModel(kind, w, h, variant) {
 const layers = [];
 function slice(z, x, y, width, depth, color) {
  if (width <= 0 || depth <= 0) return;
  (layers[z] ??= []).push([x-w/2,y-h,width,depth,color]);
 }
 function block(x, y, width, depth, z, height, ramp) {
  for (let i=0;i<height;i++) {
   const face=z+i, top=i===height-1;
   slice(face,x,y,width,depth,ramp[0]);
   if (width>2 && depth>2) {
    slice(face,x+1,y,width-2,depth-1,top?ramp[2]:ramp[1]);
    if (top) slice(face,x+1,y+1,width-2,1,ramp[3]);
    else if (i>0) slice(face,x+1,y+depth-1,width-2,1,ramp[1]);
   }
  }
 }
 function oval(cx, cy, rx, ry, z, height, ramp) {
  const rows = Math.ceil(ry);
  for (let i=0;i<height;i++)for(let row=-rows;row<=rows;row++){
   const t=(row+.5)/ry;
   if (Math.abs(t)>=1) continue;
   const half=Math.max(1,Math.round(rx*Math.sqrt(1-t*t)));
   const color=i===height-1?(row<-ry*.4?ramp[3]:ramp[2]):(row>ry*.55?ramp[0]:ramp[1]);
   slice(z+i,cx-half,cy+row,half*2,1,color);
  }
 }
 const shadow = (left=0, top=0, width=w, depth=h) => slice(0,left+2,top+1,width,depth,'#211a17a8');
 function peg(x,y,width,depth,height,ramp){
  slice(0,x-1,y-1,width+2,depth+2,'#181612c0');
  block(x,y,width,depth,0,height,ramp);
 }

 switch (kind) {
  case 'table': {
   const rise = 9;
   shadow(2,2,w-4,h-2);
   for(const x of [2,w-7])for(const y of [3,h-7])peg(x,y,5,4,rise,edge);
   block(3,3,w-6,h-6,5,3,oak);
   block(0,0,w,h,rise,3,oak);
   for(let y=5;y<h-4;y+=7) {
    slice(11,2,y,w-4,1,'#4e3529');
    const start=4+Math.floor(forestHash(w,y)*Math.max(0,w-19));
    slice(11,start,y+2,Math.min(11,w-6),1,'#a376506f');
   }
   slice(11,2,h-3,w-4,1,edge[3]);
   break;
  }
  case 'roundTable': {
   const cx=w/2, cy=h/2+3;
   oval(cx+2,cy+3,w*.46,h*.43,0,1,['#211a178d','#211a178d','#211a178d','#211a178d']);
   oval(cx,cy,w*.25,h*.23,0,3,oak);
   oval(cx,cy,w*.11,h*.12,3,6,edge);
   oval(cx,cy,w*.47,h*.45,9,3,oak);
   oval(cx,cy,w*.40,h*.37,12,1,edge);
   break;
  }
  case 'chair': {
   shadow(1,0,w-1,h);
   for(const x of [1,w-4])for(const y of [1,h-4])peg(x,y,3,3,7,edge);
   block(0,1,w,h-1,6,3,oak);
   block(2,3,w-4,h-4,9,2,ruby);
   for(const x of [0,w-3])block(x,0,3,4,9,12,edge);
   block(2,0,w-4,3,13,4,ruby);
   block(0,0,w,4,20,2,edge);
   break;
  }
  case 'stool': {
   for(const x of [3,w-7])for(const y of [3,h-7])peg(x,y,4,4,8,edge);
   oval(w/2,h/2,w*.48,h*.42,8,3,oak);
   oval(w/2,h/2,w*.35,h*.29,11,2,ruby);
   break;
  }
  case 'bed': {
   const cloth = variant ? moss : ruby;
   shadow(0,1,w,h);
   for(const x of [1,w-5])for(const y of [1,h-5])peg(x,y,4,4,5,edge);
   block(0,1,w,h-1,4,3,oak);
   block(4,3,w-8,h-4,7,3,wool);
   const pillows=variant?[[5,h-10]]:[[5,(h-14)/2],[h/2+2,(h-14)/2]];
   for(const [y,depth] of pillows){
    block(9,y,17,depth,10,3,wool);
    slice(12,12,y+2,9,2,'#eadbb2');
    slice(12,23,y+4,2,depth-7,'#a39778');
   }
   block(30,4,w-37,h-5,10,4,cloth);
   block(29,3,7,h-4,13,2,variant?wool:bronze);
   for(let y=7;y<h-3;y+=4) {
    slice(13,37,y,5,2,cloth[3]);
    slice(13,w-12,y+(y%3),2,2,cloth[1]);
   }
   for(let x=38;x<w-15;x+=6)for(let y=8;y<h-4;y+=7) {
    if((x+y)%5<3)slice(13,x,y+(x%2),3,1,variant?'#89947383':'#cd896b94');
   }
   block(0,0,6,h,4,12,edge);
   block(w-5,1,4,h-1,3,8,oak);
   break;
  }
  case 'bedsideChest': {
   const width=Math.min(23,w),depth=Math.min(18,h),x=(w-width)/2,y=h-depth-1;
   for(const u of [x+2,x+width-5])for(const v of [y+2,y+depth-5])peg(u,v,3,3,3,edge);
   block(x,y,width,depth,3,7,oak);
   block(x-1,y-1,width+2,depth+1,10,2,edge);
   for(let z=4;z<12;z++)for(const u of [x+3,x+width-5])slice(z,u,y+depth-1,2,1,bronze[z>8?2:1]);
   slice(8,w/2-2,y+depth-1,4,2,bronze[3]);
   break;
  }
  case 'shelves': {
   const vertical = h>w;
   shadow(1,1,w-1,h);
   block(0,0,w,h,0,3,oak);
   if(vertical) {
    const back = variant ? w-4 : 0, open = variant ? 3 : w-8;
    block(back,0,4,h,3,11,oak);
    for(const y of [0,h-4])block(0,y,w,4,0,15,edge);
    for(let y=5;y<h-4;y+=11) {
     const size=Math.min(h-y-3,9);
     block(open,y,5,size,4,5,bookRamps[Math.floor(forestHash(y,w)*5)]);
     block(open,y+1,4,Math.max(1,size-2),9,4,bookRamps[Math.floor(forestHash(w,y)*5)]);
    }
    block(back,3,4,h-6,14,3,edge);
    for(let y=7;y<h-4;y+=11)slice(16,back+1,y,2,1,oak[3]);
   } else {
    block(0,5,w,3,3,16,oak);
    for(const x of [0,w-4])block(x,4,4,h-4,2,18,edge);
    for(const z of [3,11]) {
     block(3,5,w-6,h-6,z,2,edge);
     for(let x=6;x<w-7;){
      const n=forestHash(x,w+z);
      const width=3+Math.floor(n*3);
      if(w>65&&Math.abs(x-w*.52)<5){
       block(x,6,3,h-7,z+2,9,edge);
       x+=5;continue;
      }
      if(n>.83){
       block(x,7,Math.min(8,w-x-4),h-9,z+2,2,wool);
       slice(z+4,x+1,h-3,4,2,bronze[2]);
      }else if(n>.17){
       const top=4+Math.floor(n*4),cover=bookRamps[Math.floor(n*5)];
       if(n>.66){
        for(let i=0;i<top;i++){
         const lean=Math.floor(i/2);
         slice(z+2+i,x+lean,7,width,h-9,cover[i===top-1?2:1]);
         slice(z+2+i,x+lean,h-3,width,1,cover[0]);
        }
       }else block(x,7,width,h-9,z+2,top,cover);
       slice(z+3,x,h-3,width,2,cover[3]);
       if(n>.52)slice(z+top-1,x,h-3,width,2,cover[3]);
      }
      x+=n>.83?10:width+1;
     }
    }
     block(0,5,w,5,19,3,edge);
     for(let x=5;x<w-3;x+=11)slice(21,x,6,Math.min(8,w-x-3),2,oak[1]);
   }
   break;
  }
  case 'plant': {
   const cx=w/2, cy=h*.71;
   oval(cx+2,cy+3,w*.40,h*.31,0,1,['#221d167f','#221d167f','#221d167f','#221d167f']);
   oval(cx,cy,w*.25,h*.23,0,3,clay);
   oval(cx,cy,w*.31,h*.27,3,5,clay);
   oval(cx,cy,w*.38,h*.30,8,3,clay);
   oval(cx,cy,w*.28,h*.19,11,1,oak);
   for(let v=0;v<7;v++) {
    const dx=(forestHash(v+variant,w)-.5)*w*1.26, dy=(forestHash(w,v+variant)-.5)*h*.56;
    const rise=7+Math.floor(forestHash(v,w+variant+10)*10);
    for(let z=0;z<=rise;z++){
     const t=z/rise;
     const rx=1+Math.sin(t*Math.PI)*2.8;
     const color=leaves[Math.min(3,(v%3)+Number(t>.58))];
     slice(11+z,Math.round(cx+dx*t-rx),Math.round(cy+dy*t-2),Math.round(rx*2),2+Math.floor(3*(1-t)),color);
    }
   }
   break;
  }
  case 'knight': {
   const cx=w/2, cy=h*.72;
   oval(cx+2,cy+3,w*.48,h*.37,0,1,['#2525219f','#2525219f','#2525219f','#2525219f']);
   oval(cx,cy,w*.49,h*.38,0,4,slate);
   oval(cx,cy,w*.44,h*.34,4,2,slate);
   for(const x of [cx-6,cx+1]){
    block(x,cy-2,5,7,5,4,steel);
    block(x+1,cy-3,4,5,9,11,steel);
   }
   block(cx-6,cy-5,12,8,20,4,steel);
   oval(cx,cy-3,7,4,24,10,steel);
   block(cx-9,cy-5,5,6,23,9,steel);
   block(cx+5,cy-5,4,6,25,8,steel);
   block(cx-5,cy-5,9,7,34,9,steel);
   block(cx-3,cy-4,6,5,43,2,steel);
   slice(40,cx-4,cy+2,7,1,'#222827');
   slice(41,cx-3,cy+2,4,1,'#272a2a');
   slice(38,cx-1,cy+2,2,1,steel[3]);
   slice(36,cx-3,cy+2,1,1,steel[3]);
   // Forward shield and blade retain readable profiles at 1×.
   const shield=cx+(variant?-7:7),blade=cx+(variant?8:-8);
   for(let z=18;z<31;z++){
    const width=z<24?3+Math.floor((z-18)*.8):8;
    block(shield-width/2,cy+3,width,3,z,1,bronze);
    if(z>20&&z<30)slice(z,shield-width/2+1,cy+5,width-2,1,ruby[z>26?2:1]);
    if(z>=24&&z<29)slice(z,shield-1,cy+5,2,1,bronze[3]);
   }
   for(let z=10;z<35;z++)slice(z,blade,cy+2,2,2,z%4===0?steel[3]:steel[2]);
   block(blade-2,cy+1,6,4,28,2,bronze);
   break;
  }
  case 'orb': {
   const cx=w/2, cy=h/2+5;
   oval(cx,cy,w*.47,h*.38,0,4,blueStone);
   oval(cx,cy,w*.41,h*.33,4,3,slate);
   oval(cx,cy,w*.34,h*.27,7,5,blueStone);
   oval(cx,cy,w*.39,h*.30,12,3,blueStone);
   oval(cx,cy,w*.32,h*.23,15,2,blueStone);
   for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    const x=Math.round(cx+Math.cos(angle)*w*.30),y=Math.round(cy+Math.sin(angle)*h*.21);
    slice(17,x-1,y,3,2,'#86aad1');
    slice(17,x,y+1,1,1,'#a6dbec');
   }
   break;
  }
  case 'hearth': {
   const cx=w/2;
   shadow(-2,2,w+3,h+2);
   block(-2,h-10,w+4,12,0,4,slate);
   block(0,h-16,w,8,2,22,slate);
   // Dark firebox is behind the two projecting piers and stays open below the lintel.
   block(w*.17,h-11,w*.66,2,2,18,['#241e1d','#281f1b','#362920','#423429']);
   for(const x of [0,w*.81]) {
    block(x,h-15,w*.19,10,2,24,slate);
    for(let z=7;z<26;z+=6)slice(z,x+1,h-6,w*.19-2,2,'#71624f');
   }
   block(-2,h-18,w+4,16,24,5,slate);
   for(let x=4;x<w-2;x+=15){
    slice(28,x,h-16,10,4,'#7b725e');
    slice(28,x+2,h-11,10,2,'#5c574a');
   }
   for(let z=20;z<26;z++)slice(z,w*.31,h-9,w*.38,1,'#35302d');
   slice(28,cx-2,h-16,4,7,bronze[2]);
   break;
  }
  case 'sconce': {
   const cx=w/2;
   block(cx-2,h-6,4,5,0,10,bronze);
   block(cx-3,h-7,6,4,10,7,bronze);
   oval(cx,h-4,4,3,17,3,bronze);
   break;
  }
  case 'lever': {
   shadow(0,0,w,h);
   block(-1,h-11,w+2,12,0,4,slate);
   block(0,h-13,w,13,4,7,oak);
   block(2,h-11,w-3,9,11,4,bronze);
   slice(15,2,h-9,w-4,5,'#343238');
   slice(15,3,h-8,2,2,bronze[3]);
   slice(15,w-5,h-8,2,2,bronze[3]);
   break;
  }
  case 'banner': {
   const cx=w/2;
   for(let z=0;z<26;z++) {
    const width=Math.min(w,4+z*3);
    slice(z,cx-width/2,h, width,2,ruby[1]);
    if(width>6){
     slice(z,cx-width/2+2,h+1,1,1,bronze[2]);
     slice(z,cx+width/2-3,h+1,1,1,bronze[2]);
    }
   }
   block(-3,h-1,w+6,4,25,3,bronze);
   break;
  }
  case 'doors': {
   shadow(-4,0,w+8,h);
   for(const x of [-5,w-2])block(x,h-9,7,9,0,31,slate);
   block(-5,h-9,w+10,9,29,4,slate);
   block(1,h-9,w-2,7,0,29,oak);
   for(let z=1;z<28;z++)for(let x=7;x<w-6;x+=9){
    slice(z,x,h-2,2,1,oak[0]);
    slice(z,x+2,h-2,1,1,oak[3]);
   }
   break;
  }
  case 'copper': {
   block(0,h*.33,w,4,4,14,oak);
   for(let x=6;x<w-4;x+=11){
    const rim=3+Math.floor(forestHash(x,w)*3),depth=3+Math.floor(forestHash(w,x)*3),z=7+x%3;
    oval(x,h*.64,rim,depth,z,4,clay);
    block(x-1,h*.44,2,3,z+3,7,bronze);
    slice(z+3,x-2,h*.56,3,2,clay[3]);
   }
   break;
  }
  case 'barrel': {
   const cx=w/2,cy=h/2+1;
   for(let z=0;z<=10;z++){
    const bulge=1-Math.abs(z-5)*.043;
    oval(cx,cy,w*.48*bulge,h*.38*bulge,z,1,z===2||z===8?steel:edge);
   }
   oval(cx,cy,w*.36,h*.29,11,1,oak);
   slice(11,cx-1,cy-1,3,2,bronze[1]);
   break;
  }
  case 'crate': {
   block(0,2,w,h-2,0,8,oak);
   block(0,2,w,h-2,8,2,edge);
   for(let y=5;y<h-3;y+=4)slice(9,2,y,w-4,1,oak[0]);
   for(const x of [2,w-4])slice(9,x,3,2,h-4,oak[3]);
   break;
  }
 }
 return Array.from(layers,layer=>layer??[]);
}

export function drawGreyhavenFixture(c, prop, kind, variant=0) {
 const w=Math.round(prop.w),h=Math.round(prop.h);
 const key=`${kind}:${w}:${h}:${variant}`;
 if(!models.has(key)) {
  if(models.size>=96)models.delete(models.keys().next().value);
  models.set(key,makeModel(kind,w,h,variant));
 }
 drawCastleStack(c,prop.x+prop.w/2,prop.y+prop.h,models.get(key),{lift:kind==='knight'?.72:1});
}

const storeStrips = {barrels:{file:'barrel.png',count:18,width:15},crates:{file:'crate.png',count:16,width:19}};
const storeImages = new Map();
const storeBakes = new Map();

export function drawGreyhavenStore(c, kind, x, y, width, depth, height) {
 if(typeof Image==='undefined'||typeof document==='undefined')return false;
 const {file,count,width:tileWidth} = storeStrips[kind];
 if(!storeImages.has(kind)){
  const image=new Image();
  image.src=new URL('../assets/greyhaven-stacks/'+file,import.meta.url).href;
  storeImages.set(kind,image);
 }
 const strip=storeImages.get(kind);
 if(!strip.complete||strip.naturalWidth!==count*tileWidth)return false;
 const w=Math.round(width),d=Math.round(depth),h=Math.round(height);
 const key=kind+':'+w+':'+d+':'+h;
 let baked=storeBakes.get(key);
 if(!baked){
  baked=document.createElement('canvas');baked.width=w;baked.height=d+h;
  const pixels=baked.getContext('2d');pixels.imageSmoothingEnabled=false;
  // Existing authored strip cells are equally sized, with the ground cell first.
  for(let z=0;z<count;z++)pixels.drawImage(strip,z*tileWidth,0,tileWidth,strip.naturalHeight,
   0,h-Math.round(h*z/(count-1)),w,d);
  if(storeBakes.size>=24)storeBakes.delete(storeBakes.keys().next().value);
  storeBakes.set(key,baked);
 }
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(baked,Math.round(x-w/2),Math.round(y-h-d/2));
 c.restore();
 return true;
}
