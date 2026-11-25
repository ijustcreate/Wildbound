import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {mossbellPathAt} from './wild-lands-geography.mjs';
import {WILD_SLIME_HOLLOW} from './wild-slime-hollow-site.mjs';

const {x,y}=WILD_SLIME_HOLLOW;
const groundBounds={left:x-320,top:y-288,right:x+320,bottom:y+300};
const fernBeds=[[-212,-118,1],[-157,-178,-1],[-79,-224,1],[76,-224,-1],
 [185,-152,1],[217,-62,-1],[206,84,1],[151,161,-1],[74,221,1],
 [-99,207,-1],[-178,151,1],[-222,39,-1]];
const coatedRoots=[[-233,-68,-1],[-164,-181,1],[190,-130,-1],[226,51,1],
 [160,155,-1],[-197,140,1]];
const groundColors=['#62754e','#65764f','#6b7b52','#707e55','#75825a'];
const treadColors=['#777953','#7d7d57','#85815a','#8a845c','#91865e'];
let groundRaster;

function noise(x,y){
 let n=Math.imul(x,374761393)^Math.imul(y,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967296;
}

function paintFern(c,x,y,direction,index){
 const point=(dx,dy)=>({x:x+dx*direction,y:y+dy});
 const colors=['#576e49','#627d50','#6a8658'];
 for(const [i,[dx,dy]] of [[20,-7],[25,-1],[17,7],[7,10]].entries()){
  const color=colors[(index+i)%colors.length];
  pixelLine(c,point(-3,3),point(dx,dy+2),'#455d42',2);
  pixelLine(c,point(-2,2),point(dx,dy),color,2);
  for(let j=1;j<=3;j++){
   const u=j/4,px=dx*u,py=dy*u;
   pixelLine(c,point(px-3,py-2-j%2),point(px+3,py),color,2);
   pixelLine(c,point(px-2,py+4-j*.4),point(px+3,py),color,2);
  }
 }
}

function paintCoatedRoot(c,x,y,direction){
 const point=(dx,dy)=>({x:x+dx*direction,y:y+dy});
 const fill=(color,points)=>pixelPolygon(c,points.map(([dx,dy])=>point(dx,dy)),color);
 fill('#4d5941',[[-18,-2],[-9,-7],[-1,-5],[9,-2],[17,-3],[21,0],[32,4],
  [23,8],[13,6],[8,5],[-2,6],[-14,2]]);
 fill('#796e4d',[[-17,-2],[-9,-5],[2,-2],[9,2],[16,0],[21,3],[29,5],[22,6],
  [14,5],[8,4],[-2,4],[-12,1]]);
 fill('#536b44',[[1,-3],[7,-5],[14,-3],[20,-2],[18,1],[21,3],[17,7],[11,7],
  [9,3],[4,2]]);
 pixelLine(c,point(3,-3),point(10,-4),'#819765',2);
 pixelLine(c,point(11,5),point(15,5),'#a0ac75',1);
 pixelLine(c,point(-16,-2),point(-9,-4),'#918560',1);
}

function paintGround(c){
 const {left,top,right,bottom}=groundBounds;
 for(let wy=top;wy<bottom;wy+=4)for(let wx=left;wx<right;wx+=4){
  const dx=wx-x,dy=wy-y;
  const edge=Math.hypot(dx,dy)+Math.sin(dx*.034+dy*.021)*15+Math.sin(dy*.051)*9;
  const fade=Math.max(0,Math.min(1,(264-edge)/86));
  if(!fade)continue;
  const grain=noise(wx>>2,wy>>2);
  const bands=Math.sin(dx*.014+dy*.032)*.95+Math.sin(dx*.059-dy*.022)*.46;
  const index=Math.max(0,Math.min(4,Math.round(2+bands+(grain-.5)*1.25)));
  c.globalAlpha=fade;
  c.fillStyle=(mossbellPathAt(wx+2,wy+2)?treadColors:groundColors)[index];
  c.fillRect(wx,wy,4,4);
 }
 c.globalAlpha=1;
 fernBeds.forEach(([dx,dy,dir],i)=>paintFern(c,x+dx,y+dy,dir,i));
 coatedRoots.forEach(([dx,dy,dir])=>paintCoatedRoot(c,x+dx,y+dy,dir));
}

export function drawMossbellGround(c,bounds){
 const {left,top,right,bottom}=groundBounds;
 if(bounds.left>=right||bounds.top>=bottom||bounds.right<=left||bounds.bottom<=top)return;
 if(!groundRaster){
  const width=right-left,height=bottom-top;
  groundRaster=new OffscreenCanvas(width/2,height/2);
  const pen=groundRaster.getContext('2d');
  pen.scale(.5,.5);pen.translate(-left,-top);
  paintGround(pen);
 }
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(groundRaster,left,top,right-left,bottom-top);c.restore();
}
