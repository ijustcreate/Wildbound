import {facingIndex,projectPoint} from './actor-projection.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {drawRavenWing,ravenPose} from './raven-art.mjs';

const red={outline:'#342332',shade:'#8e3545',body:'#c34842',light:'#ef7960'};
const flightFeathers={ink:'#273041',shade:'#244754',black:'#326677',sheen:'#46988c',glint:'#e4ad60'};
const feet='#967b66';

export function drawPirateParrot(c,a,time,size){
 const direction=facingIndex(a.faceX||0,a.faceY??1);
 const project=point=>projectPoint(point,direction);
 const polygon=(vertices,color)=>pixelPolygon(c,vertices.map(project),color);
 const line=(a,b,color,width)=>pixelLine(c,project(a),project(b),color,width);
 const pose=ravenPose({hp:a.hp,id:Number(a.visualSeed)||Number(a.id)||1,
  raven:{phase:a.owlPhase||'perch',phaseTime:a.owlPhaseTime||0}},time);
 const near=direction<=3?-1:1;
 const scale=size*.67/48;
 const shadow=Math.max(3,Math.round(5*scale));
 c.save();
 c.translate(Math.round(a.x),Math.round(a.y));
 c.fillStyle='#26343b44';
 c.fillRect(-shadow,-1,shadow*2,3);
 c.translate(0,-Math.round(a.owlHeight||0));
 c.scale(scale,scale);

 const tailZ=pose.flight?6:1,tailY=-29+pose.tail;
 polygon([[-5,-5,9],[-5,-15,6],[-1,tailY,tailZ],[1,tailY-3,tailZ],[5,-16,6],[4,-6,9]],red.outline);
 polygon([[-4,-6,9],[-4,-15,6],[0,tailY+2,tailZ],[3,-14,6],[3,-6,9]],'#367a79');
 line([0,-8,9],[0,tailY-1,tailZ],'#6b99a0',2);
 for(const side of [-1,1]){
  line([side*3,-1,6],[side*3,2,1],red.shade,2);
  line([side*3,1,1],[side*4,4,0],feet,2);
 }
 drawRavenWing(c,project,-near,pose,false,flightFeathers);
 pixelVolume(c,[0,1,13],6,7,9,direction,red);
 drawRavenWing(c,project,near,pose,true,flightFeathers);

 const hy=pose.flight?8:4,z=(pose.flight?18:23)+pose.headTilt;
 pixelVolume(c,[0,hy,z],5.5,5.5,6,direction,red);
 if(direction!==4){
  for(const side of direction===0?[-1,1]:[near]){
   polygon([[side*2,hy+5,z+3],[side*5,hy+4,z+2],[side*5,hy+5,z-1],[side*2,hy+6,z-2]],'#f1d7ac');
   const eye=project([side*3,hy+5.8,z+1]);
   c.fillStyle='#492b2d';
   c.fillRect(Math.round(eye.x),Math.round(eye.y),2,2);
  }
  polygon([[-3,hy+4,z+1],[3,hy+4,z+2],[2,hy+10,z],[1,hy+11,z-3],[0,hy+8,z-4],[-2,hy+7,z-2]],red.outline);
  polygon([[-2,hy+5,z+1],[2,hy+5,z+1],[1,hy+9,z],[0,hy+10,z-3],[-1,hy+7,z-2]],'#dfb680');
  line([-1,hy+6,z+1],[0,hy+8,z],'#fff0c8');
 }
 c.restore();
 return true;
}
