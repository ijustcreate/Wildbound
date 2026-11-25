// Opt-in visual/gameplay slice. Not enabled in normal expeditions or saved overrides.
import {realmProp} from './realm-layout.mjs';
import {drawRealmSprite} from './realm-art.mjs';
import {swampNoise as noise} from './swamp-terrain.mjs';
import {cavernContourStone} from './cave-wall-art.mjs';
import {drawCaveFloorCell} from './cave-floor-art.mjs';
export const CAVERN_SLICE={spawn:{x:1030,y:530},rooms:[{x:435,y:600,rx:270,ry:250},{x:1035,y:520,rx:240,ry:230}],passage:[{x:620,y:575},{x:735,y:510},{x:845,y:555}],palette:{void:'#111b26',floor:'#46565d',wet:'#38545b'}};
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const seg=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a.x-dx*t,y-a.y-dy*t);};
export function cavernSliceDistance(x,y){const room=Math.min(...CAVERN_SLICE.rooms.map(p=>(Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)-1)*Math.min(p.rx,p.ry)));const points=CAVERN_SLICE.passage;const corridor=Math.min(seg(x,y,points[0],points[1]),seg(x,y,points[1],points[2]))-64;const rough=(noise(x/80,y/80)-.5)*48+(noise(x/26,y/26)-.5)*13;return Math.min(room,corridor)+rough;}
const pool=(x,y)=>Math.min(Math.hypot((x-355)/123,(y-660)/104)-1,Math.hypot((x-440)/86,(y-705)/66)-1)+(noise(x/60,y/60)-.5)*.18;
export function installCavernSlice(g,renderer,sprites){
 const walls=[],props=[];
 for(let y=0;y<50;y++)for(let x=0;x<50;x++){const wx=x*32+16,wy=y*32+16,d=cavernSliceDistance(wx,wy),wet=pool(wx,wy);g.terrain[y*50+x]=d>0?'cave_void':wet<-.16?'water':wet<.06?'shallow':'cave_floor';}
 // Back walls stand upright in the same screen axes as ordinary Wildbound props.
 for(let x=180,i=0;x<1270;x+=95,i++){
  for(let y=230;y<820;y+=8)if(cavernSliceDistance(x,y)<0&&cavernSliceDistance(x,y-12)>=0){walls.push({kind:i%3===1?'slice_wall_b':'slice_wall_a',x,y:y+10,size:150+(hash(i,4)-.5)*24});break;}
 }
 for(const [kind,x,y,size]of [['limestone_shelf',255,520,100],['stalagmite',500,430,90],['stalagmite',260,790,100],['limestone_shelf',560,760,96],['cave_crystal',1050,375,88],['cave_crystal',1200,520,76],['cave_crystal',1010,680,62],['stalagmite',865,635,76],['cave_mushroom',340,450,48],['cave_mushroom',1120,620,48],['cave_drip',350,640,25]])props.push(realmProp(kind,x,y,props.length,{size}));
 props.push(realmProp('ceiling_stalactite',740,535,props.length,{warning:1.6,damage:5,hazardState:'idle'}));
 g.scenery=props;g.realmState={version:1,env:'caverns',seed:42,settings:{hazardWarning:1.6,hazardDamage:5},chambers:CAVERN_SLICE.rooms.map(p=>({...p,r:200})),links:[[0,1]],animals:[],event:null};
 g.spriteLibrary={...g.spriteLibrary,...sprites};
 const floorCanvas=document.createElement('canvas');floorCanvas.width=floorCanvas.height=800;const c=floorCanvas.getContext('2d');
 c.save();c.scale(.5,.5);
 for(let ty=0;ty<50;ty++)for(let tx=0;tx<50;tx++){
  const x=tx*32,y=ty*32;
  if(cavernSliceDistance(x+16,y+16)<56)drawCaveFloorCell(c,x,y,32,g.seed,tx,ty);
 }
 c.restore();
 for(let y=0;y<800;y++)for(let x=0;x<800;x++){
  const wx=x*2,wy=y*2,d=cavernSliceDistance(wx,wy),wet=pool(wx,wy),n=noise(wx/86,wy/76);let col;
  if(d>0)col=cavernContourStone(wx,wy,d,n);
  else if(wet<-.16)col=wet<-.5?'#204d59':'#296b70';
  else if(wet<.06)col='#568785';
  else if(wet<.13)col='#738a81';
  else if(d>-9)col='rgba(21,37,44,.28)';
  else continue;
  c.fillStyle=col;c.fillRect(x,y,1,1);
 }
 for(let i=0;i<4500;i+=4){const wx=hash(i,3)*1600,wy=hash(i,7)*1600;if(pool(wx,wy)>=0||cavernSliceDistance(wx,wy)>-12)continue;c.fillStyle='#639b9b';c.fillRect(wx/2,wy/2,3+hash(i,6)*6,1);}
 renderer.floor=(ctx)=>{ctx.imageSmoothingEnabled=false;ctx.drawImage(floorCanvas,0,0,1600,1600);
  for(const wall of walls)drawRealmSprite(ctx,wall.kind,wall.x,wall.y,wall.size,g.spriteLibrary);
  // A small wall seep, in the same screen-vertical direction as game props.
  ctx.fillStyle='#769b9d';ctx.fillRect(335,430,2,54);ctx.fillStyle='#547d86';ctx.fillRect(339,433,3,46);
 };
 return {walls,props,spawn:CAVERN_SLICE.spawn};
}
