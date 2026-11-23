import {projectPoint,facingIndex} from './actor-projection.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
import {ravenPose,drawRavenWing} from './raven-art.mjs';
const colors={ink:'#424c56',black:'#e9eadc',shade:'#a5b6bc',sheen:'#cbd6d0',glint:'#fff9e9'};
const palette={body:colors.black,shade:colors.shade,light:colors.glint,outline:colors.ink};
export function drawSnowyOwl(c,a,time=0,size=38){const d=facingIndex(a.faceX||0,a.faceY??1),pose=ravenPose({...a,id:Number(a.visualSeed)||1,faction:null,raven:{phase:a.owlPhase||'perch',phaseTime:a.owlPhaseTime||0}},time),p=v=>projectPoint(v,d),near=d<=3?-1:1;
 c.save();c.translate(Math.round(a.x),Math.round(a.y));c.fillStyle='#26343b44';c.fillRect(-7,-1,14,3);c.translate(0,-Math.round(a.owlHeight||0));c.scale(size/48,size/48);
 // Same articulated shoulder/elbow/wrist strokes as the raven. The owl has
 // a round body, short tail, broad facial disc and tucked hook beak.
 for(const side of [-1,1]){pixelLine(c,p([side*3,0,4]),p([side*3,1,1]),'#e3e5d9',3);pixelLine(c,p([side*3,1,0]),p([side*3,4,0]),'#8f8470');}
 pixelPolygon(c,[p([-5,-6,8]),p([-5,-16,4]),p([5,-16,4]),p([5,-6,8])],colors.shade);
 drawRavenWing(c,p,-near,pose,false,colors);
 pixelVolume(c,[0,0,13],7,8,8,d,palette);drawRavenWing(c,p,near,pose,true,colors);
 const z=(pose.flight?18:24)+pose.headTilt,hy=pose.flight?8:5;
 pixelVolume(c,[0,hy,z],7,5,6,d,palette);
 if(d!==4){const disk=[p([-5,hy+4,z+3]),p([5,hy+4,z+3]),p([6,hy+4,z-2]),p([2,hy+5,z-5]),p([-2,hy+5,z-5]),p([-6,hy+4,z-2])];pixelPolygon(c,disk,'#fff9e9');
 for(const side of [-1,1]){if((d===2||d===3)&&side>0||(d===5||d===6)&&side<0)continue;const eye=p([side*3,hy+5,z+1]);c.fillStyle='#d8b84c';c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,3,3);c.fillStyle='#242f39';c.fillRect(Math.round(eye.x),Math.round(eye.y)-1,1,3);}
 pixelPolygon(c,[p([-1,hy+5,z-1]),p([1,hy+5,z-1]),p([0,hy+7,z-4])],'#565447');}
 for(const [x,y,z]of [[-4,-2,17],[3,-4,14],[-3,-2,10],[3,0,9]])pixelLine(c,p([x-1,y,z]),p([x+1,y,z-1]),'#82959c');
 c.restore();return true;}
// Station cargo contract: integer clusters, a walnut tray, aged brass frame,
// dark warm outer contour, broad upper-left highlights. No stroked curves.
export function drawCagedSnowyOwl(c,a,time=0){return drawSnowyOwl(c,{...a,hp:1,faceX:0,faceY:1,owlPhase:'perch',owlHeight:9},time,58);}
export function drawOwlCage(c,a,open=false,layer='front'){
 const x=Math.round(a.x),y=Math.round(a.y),r=(dx,dy,w,h,color)=>{c.fillStyle=color;const left=Math.round(dx*.84),top=Math.round(dy*.76);c.fillRect(x+left,y+top,Math.round((dx+w)*.84)-left,Math.round((dy+h)*.76)-top);};
 const shape=(points,color)=>pixelPolygon(c,points.map(([dx,dy])=>({x:x+Math.round(dx*.84),y:y+Math.round(dy*.76)})),color);
 const ink='#35382f',shade='#786044',brass='#b7955e',light='#dfc58b';
 if(layer==='back'){
  r(-24,0,56,5,'#20352c44');
  shape([[-25,0],[-25,-44],[-22,-44],[-22,-54],[-17,-54],[-17,-60],[-10,-60],[-10,-65],[11,-65],[11,-61],[18,-61],[18,-55],[23,-55],[23,-45],[27,-45],[27,0]],ink);
  shape([[-20,-4],[-20,-43],[-17,-43],[-17,-51],[-11,-57],[10,-57],[17,-51],[21,-43],[21,-4]],'#263d3b');
  shape([[23,-44],[29,-49],[33,-43],[33,-3],[25,2],[25,-38]],shade);
  r(28,-39,3,35,'#ad8856');r(29,-37,1,29,'#c7a36a');
  for(const dx of [-14,-6,5,13])r(dx,-43,2,36,'#60694f');
  r(-18,-15,37,4,'#86603f');r(-16,-15,33,1,'#b9925c');
  return;
 }
 // Stepped arch and handle are resolved on the same native pixel grid as trunks.
 for(const [dx,dy,w,h]of [[-25,-45,5,43],[-22,-54,5,12],[-17,-60,6,8],[-11,-65,23,7],[10,-60,8,7],[17,-54,6,12],[22,-45,5,43]])r(dx,dy,w,h,ink);
 for(const [dx,dy,w,h]of [[-23,-44,3,41],[-20,-53,3,11],[-15,-58,5,5],[-9,-63,20,4],[11,-58,5,5],[18,-53,3,11],[23,-43,2,40]])r(dx,dy,w,h,brass);
 r(-23,-43,1,36,light);r(-20,-52,1,8,light);r(-14,-58,5,1,light);r(-9,-63,17,1,light);
 r(-7,-74,15,3,ink);r(-9,-71,4,9,ink);r(6,-71,4,9,ink);r(-5,-72,11,2,light);r(-7,-69,2,5,brass);r(7,-69,1,5,brass);
 // A broad tray shows its top, front and right planes; no fine wood grain.
 shape([[-27,-5],[-20,-10],[26,-10],[33,-5],[26,2],[-27,2]],ink);
 shape([[-23,-5],[-18,-8],[25,-8],[29,-5],[23,-2],[-23,-2]],'#bc9b67');
 r(-27,-2,53,7,ink);r(-25,-1,49,4,'#805a3b');r(-24,-1,47,1,'#b48b56');
 shape([[26,-2],[33,-6],[33,1],[26,5]],'#5a4935');r(-22,4,6,3,ink);r(17,4,6,3,ink);
 // Front door pivots at the right post. Open bars are foreshortened beyond it.
 if(open){
  shape([[24,-48],[42,-42],[42,-38],[24,-44]],ink);shape([[24,-9],[42,-3],[42,1],[24,-5]],ink);r(24,-46,3,40,ink);r(40,-41,3,40,ink);
  for(const dx of [26,33,40])r(dx,-39+(dx-26)/7*2,2,35,brass);
  shape([[25,-47],[41,-42],[41,-39],[25,-44]],light);
  shape([[25,-10],[41,-4],[41,-1],[25,-7]],shade);
  r(24,-41,4,6,light);r(24,-16,4,6,light);
 }else{
  for(const dx of [-18,-9,9,18]){r(dx,-44,3,38,shade);r(dx,-43,1,35,'#ceb27b');}
  r(-21,-11,44,3,brass);
  r(-19,-29,9,9,ink);r(-18,-28,7,6,'#d4af63');r(-16,-27,3,2,'#f1d993');r(-15,-25,2,3,'#69543b');
  r(20,-40,5,6,shade);r(20,-18,5,6,shade);r(21,-39,3,2,light);
 }
}
