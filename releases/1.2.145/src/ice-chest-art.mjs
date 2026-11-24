import {pixelPolygon} from './pixel-shapes.mjs';

const iron={edge:'#273944',deep:'#425b65',mid:'#67848d',light:'#a3bdc1'};
const oak={edge:'#2c3439',shadow:'#3d494c',dark:'#48565a',body:'#57696c',light:'#6b7f80'};

// Width 44, with the runners ending six pixels below the placement anchor.
export function drawIceChest(c,x,y,opened,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const shape=(points,color)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
 shape([[-23,4],[-14,1],[15,1],[23,4],[21,8],[-20,8]],'#31586242');
 r(-20,-9,40,14,oak.edge);r(-19,-8,37,11,oak.body);r(15,-7,4,10,oak.dark);
 r(-18,-7,31,1,oak.light);r(-18,-4,33,1,oak.shadow);r(-18,0,33,1,oak.shadow);
 r(-16,-3,7,1,oak.light);r(2,1,9,1,oak.light);r(-17,3,35,1,iron.deep);
 for(const x of [-15,11]){
  r(x,-9,4,14,iron.edge);r(x+1,-8,2,11,iron.mid);r(x+1,-7,1,10,iron.light);
  r(x+1,-5,2,1,'#334953');r(x+1,1,2,1,'#b4cbcc');r(x-1,4,6,2,iron.edge);
 }
 if(opened){
  shape([[-19,-8],[-16,-16],[15,-16],[20,-8],[17,-6],[-18,-6]],iron.light);
  shape([[-17,-9],[-15,-15],[14,-15],[17,-9]],'#182d36');
  r(-14,-13,28,1,'#425961');r(-16,-9,33,1,'#769296');
  shape([[-17,-15],[-20,-29],[-17,-32],[16,-32],[19,-29],[16,-15]],iron.edge);
  shape([[-15,-17],[-17,-28],[-15,-30],[14,-30],[16,-28],[14,-17]],oak.shadow);
  r(-14,-28,29,2,iron.deep);r(-13,-25,27,1,oak.body);r(-12,-20,26,2,iron.deep);
  r(-17,-31,31,2,'#b8d5da');r(-15,-32,26,1,'#e7f6f6');r(10,-31,4,2,'#a2c6cd');
  r(-13,-18,4,2,iron.mid);r(9,-18,4,2,iron.mid);r(-3,-16,6,2,'#9f8055');
 }else{
  shape([[-22,-10],[-20,-16],[-16,-20],[15,-20],[19,-16],[22,-10],[21,-8],[-21,-8]],iron.edge);
  shape([[-19,-13],[-16,-19],[14,-19],[18,-15],[19,-12],[-19,-12]],'#849c9e');
  r(-20,-12,40,3,iron.deep);r(-19,-12,38,1,iron.mid);r(-19,-9,38,1,'#a8b9aa');
  for(const x of [-15,11]){r(x,-18,4,9,iron.mid);r(x+1,-17,1,8,iron.light);r(x+1,-11,2,1,'#40565e');}
  shape([[-17,-19],[-13,-21],[6,-21],[8,-20],[14,-20],[17,-17],[13,-17],[10,-18],[3,-17],[-5,-18],[-10,-17],[-15,-17],[-18,-16]],'#e7f6f6');
  r(-19,-16,8,1,'#b2d2d7');r(6,-17,4,1,'#b2d2d7');r(12,-17,2,2,'#cee7e9');
  r(-4,-11,8,7,'#373e3a');r(-3,-10,6,5,'#bca373');r(-2,-10,4,1,'#dfcaa0');r(0,-8,1,2,'#504d43');
 }
 c.restore();
}
