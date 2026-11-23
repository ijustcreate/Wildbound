import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';

const outline=[[-1,-16],[4,-15],[8,-11],[11,-5],[12,2],[10,8],[7,13],[3,16],[-3,16],[-7,13],[-10,8],[-12,2],[-11,-5],[-8,-11],[-4,-15]];
const poly=(points)=>points.map(([x,y])=>({x,y}));

export function drawSpiderEgg(ctx,actor){
 const phase=actor.eggPhase||0,burst=phase%6.2,motion=burst<.8?Math.sin(burst/.8*Math.PI):0;
 const dx=Math.round(Math.sin(phase*22)*2.15*motion),dy=Math.round(Math.cos(phase*22+1)*1.1*motion);
 ctx.save();ctx.translate(Math.round(actor.x)+dx,Math.round(actor.y)+dy);

 // Grounded silk tethers and a blocky shadow anchor the egg to its nest.
 pixelPolygon(ctx,poly([[-10,9],[-7,7],[7,7],[11,9],[9,11],[-8,11]]),'#18182766');
 for(let i=0;i<7;i++){
  const end=poly([[Math.round(Math.cos(i*Math.PI*2/7)*17),Math.round(Math.sin(i*Math.PI*2/7)*10+10)]])[0];
  pixelLine(ctx,{x:Math.round(Math.cos(i*Math.PI*2/7)*5),y:Math.round(Math.sin(i*Math.PI*2/7)*5+6)},end,'#cbc5d477',1);
 }

 const shell=poly(outline);
 pixelPolygon(ctx,shell,'#34334b');
 pixelPolygon(ctx,poly([[-9,-10],[-5,-14],[1,-14],[6,-11],[9,-5],[10,2],[7,9],[3,13],[-3,14],[-8,10],[-10,4],[-10,-4]]),'#77748d');
 pixelPolygon(ctx,poly([[-7,-10],[-4,-13],[1,-12],[5,-9],[7,-4],[6,1],[3,5],[-3,6],[-7,3],[-9,-2],[-8,-7]]),'#aaa7ba');
 pixelPolygon(ctx,poly([[-5,-10],[-2,-12],[2,-10],[4,-7],[3,-4],[-2,-4],[-6,-6]]),'#d6d2dd');

 // Overlapping chitin plates form shallow pixel bands across the cocoon.
 for(const [a,b,col] of [
  [[-9,-5],[8,-8],'#4d4b67'],[[-11,0],[10,-2],'#5c5875'],[[-10,5],[8,3],'#55516f'],[[-7,10],[5,9],'#4c4967'],
  [[-8,-4],[7,-7],'#d4d0dd'],[[-9,1],[8,-1],'#c0bdce'],[[-8,6],[7,4],'#bbb7c9'],
 ])pixelLine(ctx,{x:a[0],y:a[1]},{x:b[0],y:b[1]},col,1);

 // Fine silk wraps the shell in a stepped X seam; square glints keep it crisp.
 pixelLine(ctx,{x:-7,y:-11},{x:5,y:11},'#eeeaf0a8',1);
 pixelLine(ctx,{x:6,y:-11},{x:-5,y:11},'#ded9e89a',1);
 ctx.fillStyle='#f7f3f7';
 for(const [x,y] of [[-5,-10],[-4,-11],[-7,-6],[1,-12],[5,-6],[7,1],[2,6],[-6,4],[-3,10]])ctx.fillRect(x,y,1,1);
 ctx.fillStyle='#625d78';ctx.fillRect(7,7,2,3);ctx.fillRect(-9,3,2,3);
 ctx.restore();
}
