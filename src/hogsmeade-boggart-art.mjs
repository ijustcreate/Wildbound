import {block,casework,line,shape} from './diagon-shop-brush.mjs';
import {BOGGART_CABINET,SHACK_TRAPDOOR} from './hogsmeade-boggart.mjs';

const wood=['#272721','#3d3c2f','#5a5540','#777353','#a19364'];

export function drawBoggartCabinet(c){
 const {x,y}=BOGGART_CABINET;
 const left=x-19,top=y-49;
 block(c,left-2,y-1,42,4,'#24262170');
 casework(c,left,y,38,49,9,wood);
 block(c,left+3,top+11,28,34,'#333127');
 block(c,left+5,top+13,11,30,'#625840');
 block(c,left+18,top+13,11,30,'#4d4835');
 for(const offset of [6,19]){
  block(c,left+offset,top+15,8,1,'#92835a');
  block(c,left+offset,top+16,1,23,'#77704c');
  block(c,left+offset+2,top+40,6,1,'#302d22');
 }
 for(const dy of [19,34]){
  block(c,left+2,top+dy,4,2,'#9f8757');
  block(c,left+28,top+dy,4,2,'#9f8757');
 }
 block(c,left+13,top+26,8,5,'#312f22');
 block(c,left+14,top+26,6,3,'#b09861');
 block(c,left+17,top+27,1,3,'#2d2a21');
 for(const dx of [0,3,6])line(c,'#ad9b6c',x-9+dx,top+19,x-12+dx,top+24,1);
 block(c,left+2,y-3,5,5,wood[0]);
 block(c,left+29,y-3,5,5,wood[0]);
}

export function drawBoggartRelease(c,elapsed){
 if(!(elapsed>=0&&elapsed<.9))return;
 const {x,y}=BOGGART_CABINET;
 const alpha=1-elapsed/.9;
 c.save();c.globalAlpha*=alpha;
 for(let i=0;i<9;i++){
  const spread=(i%5-2)*(2+elapsed*9),top=y-20+i%3*7-elapsed*(14+i);
  block(c,x+spread,top,i%3===0?3:2,2,i%2?'#d5aeca':'#a284bd');
 }
 c.restore();
}

export function drawShackTrapdoor(c){
 const {x,y,w,h}=SHACK_TRAPDOOR,l=x-w/2,t=y-h/2;
 shape(c,'#2c302b',[[l+4,t],[l+w-4,t],[l+w,t+h-4],[l+w-3,t+h],[l+1,t+h],[l,t+h-4]]);
 shape(c,'#806f51',[[l+5,t+2],[l+w-5,t+2],[l+w-3,t+h-5],[l+3,t+h-5]]);
 block(c,l+5,t+4,w-10,2,'#a48b61');
 for(let i=7;i<h-6;i+=5){
  block(c,l+4,t+i,w-8,1,'#4a4232');
  block(c,l+5,t+i+1,w-10,1,'#95805a');
 }
 for(const dx of [8,24]){
  block(c,l+dx,t+3,4,8,'#393b38');
  block(c,l+dx+1,t+4,2,3,'#8a9181');
 }
 block(c,x-5,y+2,10,6,'#3a382d');
 block(c,x-4,y+2,8,1,'#ab9a72');
 block(c,x-4,y+3,1,3,'#929183');block(c,x+3,y+3,1,3,'#929183');
}

export function boggartBunnyPoint(elapsed){
 return {x:BOGGART_CABINET.x+Math.sin(elapsed*2.35)*27,y:BOGGART_CABINET.y+33+Math.sin(elapsed*1.4)*8};
}

export function drawBoggartBunny(c,point,elapsed){
 const {x,y}=point,face=Math.cos(elapsed*2.35)>=0?1:-1;
 block(c,x-6,y,12,2,'#35312b85');
 const height=Math.max(0,Math.sin(elapsed*9))*4;
 c.save();c.translate(Math.round(x),Math.round(y-height));c.scale(face,1);
 shape(c,'#635d55',[[-8,-1],[-8,-5],[-5,-8],[-1,-8],[0,-10],[2,-10],[2,-16],[5,-17],[6,-12],[8,-15],[10,-14],[8,-8],[10,-6],[9,-2],[5,-1],[2,1],[-5,1]]);
 block(c,-7,-6,8,4,'#dfd5bc');block(c,-4,-8,8,6,'#e8dec4');
 block(c,2,-9,6,6,'#f0e5cd');block(c,4,-15,2,7,'#f0e5cd');block(c,7,-13,2,6,'#e9d7c0');
 block(c,4,-13,1,4,'#c9928d');block(c,6,-7,1,1,'#3d3541');block(c,8,-5,1,1,'#a97576');
 block(c,-9,-6,4,4,'#eddfc1');block(c,-3,-1,4,1,'#c4b6a0');
 c.restore();
}
