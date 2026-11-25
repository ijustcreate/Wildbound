import {pixelPolygon} from './pixel-shapes.mjs';

const leathers={charcoal:['#413945','#5d5159','#aa8855'],wine:['#513841','#724b55','#bf9058'],moss:['#414539','#626451','#b39761']};

export function drawWreckPirateHat(c,head,d,variant){
 const [body,light,trim]=leathers[variant]||leathers.charcoal;
 const x=Math.round(head.x),y=Math.round(head.y)-6,profile=d===2||d===6;
 const flip=d>=5?-1:1;
 const shape=(vertices,color)=>pixelPolygon(c,vertices.map(([dx,dy])=>({x:x+dx*flip,y:y+dy})),color);
 if(profile){
  shape([[-9,2],[-9,-1],[-6,-3],[-3,-9],[4,-8],[8,-6],[11,-2],[9,2],[3,3],[-4,3]],'#29272d');
  shape([[-8,1],[-7,-1],[-3,-3],[-2,-8],[3,-7],[7,-5],[9,-2],[8,0],[1,2],[-5,2]],body);
  shape([[-7,0],[-3,-1],[1,0],[6,-1],[9,-3],[8,-1],[6,1],[-2,2]],trim);
 }else{
  shape([[-12,-5],[-6,-3],[-4,-8],[4,-9],[7,-5],[12,-6],[11,-1],[8,2],[-1,4],[-8,2],[-11,0]],'#29272d');
  shape([[-10,-4],[-6,-2],[-4,-7],[4,-8],[7,-4],[10,-5],[10,-2],[7,1],[-1,3],[-7,1]],body);
  shape([[-8,-2],[-4,0],[-1,1],[6,-1],[10,-4],[9,-2],[6,0],[-1,2],[-6,1]],trim);
 }
 c.fillStyle=light;c.fillRect(x-3,y-6,5,1);
 if(d===0||d===1||d===7){c.fillStyle='#d5cfab';c.fillRect(x-1,y-5,3,2);c.fillRect(x,y-3,1,1);}
}
