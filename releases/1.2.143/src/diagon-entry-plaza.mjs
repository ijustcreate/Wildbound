import {block as b,shape as p,line as l,casework} from './diagon-shop-brush.mjs';

export const DIAGON_PORTAL_COLOR='#a56bfa';
const mouth={x:8000,y:5660};
const walls=[{x:7809,y:5659,w:130},{x:8061,y:5659,w:130}];
const masonry=['#6c625b','#786c61','#887668','#958272','#645b55'];

export function diagonEntryBlocked(x,y,r){
 return walls.some(wall=>x>=wall.x-r&&x<wall.x+wall.w+r&&Math.abs(y-wall.y)<6+r);
}

export function paintDiagonBrickWing(c,x,y,w,height){
 b(c,x-3,y-height-2,w+6,height+4,'#4f443e');
 for(let row=0;row<height;row+=9)for(let dx=(row%2)?-7:0;dx<w;dx+=17){
  const left=Math.max(0,dx),width=Math.min(w,dx+16)-left;if(width<1)continue;
  const top=y-height+row;
  b(c,x+left,top,width,Math.min(8,height-row),masonry[(row*3+left*7)%masonry.length]);
  if(width>5)b(c,x+left+2,top+1,width-4,1,'#c4ab88a6');
 }
 b(c,x-4,y-height-4,w+8,6,'#998b77');b(c,x-3,y-height-4,w+6,2,'#b6a087');
 b(c,x-3,y-2,w+6,4,'#5b534b');
}

export function queueDiagonEntryPlaza(c,visible,objects){
 if(!visible(mouth.x,mouth.y,263,164))return;
 for(const {x,y,w} of walls){
  objects.push({depth:y,paint:()=>{
   paintDiagonBrickWing(c,x,y,w,47);
   for(const dx of [3,w-13]){b(c,x+dx,y-52,10,54,'#776756');b(c,x+dx,y-51,2,47,'#aea18a');b(c,x+dx-3,y-55,16,4,'#b7a488');}
   const hitch=x+(x<mouth.x?w-24:24);
   l(c,'#473737',hitch,y-42,hitch,y-30,2);b(c,hitch-5,y-33,10,14,'#55415b');b(c,hitch-3,y-31,6,10,'#d9b2ff');b(c,hitch-2,y-30,2,7,'#eddbff');
  }});
 }
 for(const [x,y,ramp] of [[7836,5696,['#443e36','#615144','#8a775b','#a38b5e','#dbc59a']],
                          [7858,5701,['#3f3632','#674c3c','#8b6650','#ac8c66','#cdaf87']],
                          [8157,5700,['#3c3b38','#57564a','#746f59','#919179','#c8c298']]]){
  objects.push({depth:y,paint:()=>{casework(c,x-12,y,24,18,5,ramp);l(c,ramp[1],x-9,y-12,x+7,y-3,2);b(c,x-7,y-8,2,2,ramp[4]);}});
 }
 for(const [x,y] of [[7791,5740],[7872,5744],[8112,5744],[8205,5740]])objects.push({depth:y,paint:()=>{
  b(c,x-9,y-4,18,6,'#423d35');b(c,x-7,y-5,14,4,'#7c6c57');
  p(c,'#445345',[[x-8,y-6],[x-11,y-12],[x-4,y-12],[x-3,y-19],[x+2,y-16],[x+7,y-20],[x+8,y-13],[x+11,y-10],[x+6,y-5]]);
  l(c,'#9da176',x-4,y-13,x+2,y-8,1);l(c,'#89966b',x-1,y-15,x-2,y-8,1);
 }});
}
