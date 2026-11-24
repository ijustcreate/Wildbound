import {block as b,shape as p} from './diagon-shop-brush.mjs';
import {diagonLaneX,nocturneLaneX,NOCTURNE_STREET_INSET} from './alley-street-layout.mjs';

export const DIAGON_STREET_LAMPS=Object.freeze([
 ...[4350,4730,5110,5490].flatMap(y=>[7839,8161].map(x=>({x:diagonLaneX(x),y,height:48,district:'diagon'}))),
 ...[[8530,5192],[8760,5277],[8988,5095],[9195,5188],[8998,5410],[9185,5540]].map(([x,y])=>({x:x>=8970?nocturneLaneX(x):x,y,height:48,district:'nocturne'})),
]);
export const NOCTURNE_WALL_CANDLES=Object.freeze([
 [8941,4635],[8943,4875],[8932,5110],[8816,5313,true],[9239,5156,true],
 [9494,4880,true],[9483,5432,true],[9595,5519,true],
].map(([x,y,stand=false])=>({x:x===9239?x-NOCTURNE_STREET_INSET:x>=8900&&x<8970?x+NOCTURNE_STREET_INSET:x,y,height:36,district:'nocturne',stand})));

export function streetLamp(c,x,y,district='diagon',time=0){
 const glass=district==='nocturne'?['#345e50','#5aa581','#9ed9a1','#d4f2bd']:['#755139','#bd8655','#e7bc7c','#fff0b6'];
 c.save();c.translate(x,y);
 p(c,'#252b2a61',[[-11,1],[-7,-5],[8,-5],[15,1],[11,5],[-9,5]]);
 p(c,'#2b3538',[[-9,0],[-9,-5],[-6,-9],[-5,-17],[5,-17],[6,-9],[9,-5],[9,0]]);
 b(c,-7,-4,14,3,'#4b5a55');b(c,-6,-6,12,1,'#89a095');
 b(c,-4,-38,8,24,'#283439');b(c,-2,-37,2,21,'#6b817b');b(c,3,-36,1,19,'#3a4b49');
 b(c,-6,-19,12,3,'#665947');b(c,-5,-19,8,1,'#aa9772');
 p(c,'#2e3a3c',[[-11,-45],[-9,-37],[-4,-33],[5,-33],[10,-37],[11,-45],[-9,-46]]);
 p(c,'#25333a',[[-11,-42],[-13,-55],[-9,-60],[-3,-62],[-2,-65],[2,-65],[3,-62],[9,-60],[13,-55],[11,-42]]);
 p(c,glass[0],[[-9,-44],[-11,-54],[-8,-58],[8,-58],[11,-54],[9,-44]]);
 p(c,glass[1],[[-6,-45],[-8,-54],[-5,-57],[5,-57],[8,-54],[6,-45]]);
 b(c,-4,-54,9,9,glass[2]);b(c,-3,-47,6,2,glass[2]);b(c,-1,-50+(Math.sin(time*8+x)>.48?1:0),3,5,glass[3]);
 b(c,-10,-44,20,2,'#735c4a');b(c,-10,-44,12,1,'#b5966b');
 b(c,-1,-57,2,11,'#484f43');b(c,-8,-57,2,11,'#3d514c');b(c,7,-57,2,11,'#3d514c');
 b(c,-8,-60,16,1,'#98a399');b(c,-2,-64,2,3,'#b18b59');c.restore();
}

export function drawNocturneWallCandles(c,{x,y,height,stand},time){
 c.save();c.translate(x,y-height);
 if(stand){
  p(c,'#202a2d72',[[-10,height-2],[7,height-4],[13,height+2],[7,height+5],[-9,height+4]]);
  b(c,-8,height-4,16,4,'#344443');b(c,-7,height-4,10,1,'#5f7569');
  b(c,-5,10,10,height-13,'#28393b');b(c,-3,11,2,height-15,'#5b7366');
  b(c,-6,height-9,12,3,'#54645b');
 }
 p(c,'#2a3034',[[-16,8],[-12,5],[13,5],[16,8],[13,11],[-13,11]]);
 b(c,-13,6,26,2,'#61746a');b(c,-5,10,10,8,'#343d40');b(c,-3,11,2,6,'#78867b');
 for(const [dx,w,h] of [[-10,6,7],[-2,7,11],[7,5,5]]){
  const top=6-h,flicker=Math.sin(time*8+x*.07+dx)>.35?1:0;
  b(c,dx,top,w,h,'#829181');b(c,dx+1,top+1,2,h-2,'#b8bf9e');b(c,dx+w-1,top+2,1,3,'#546d62');
  p(c,'#659e76',[[dx-1,top],[dx+1,top-5],[dx+3+flicker,top-8],[dx+5,top-3],[dx+4,top+1]]);
  b(c,dx+2,top-4,2,4,'#b9e4a4');b(c,dx+2,top-2,1,3,'#dbf7bb');
 }
 c.restore();
}
