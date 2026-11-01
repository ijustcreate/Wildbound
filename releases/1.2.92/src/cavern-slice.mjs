// Opt-in visual/gameplay slice. Not enabled in normal expeditions or saved overrides.
import {realmProp} from './realm-layout.mjs';
import {drawRealmSprite} from './realm-art.mjs';
import {swampNoise as noise} from './swamp-terrain.mjs';
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
 const sites=new Map();for(let y=-1;y<33;y++)for(let x=-1;x<26;x++)sites.set(x+','+y,{x:x*70+hash(x,y)*45,y:y*54+hash(y+81,x)*33,tone:Math.floor(hash(x+13,y+19)*4)});
 for(let y=0;y<800;y++)for(let x=0;x<800;x++){
  const wx=x*2,wy=y*2,d=cavernSliceDistance(wx,wy),wet=pool(wx,wy),n=noise(wx/86,wy/76);let col;
  if(d>0)col=d<12?'#24333e':d<35?'#192833':'#101923';
  else if(wet<-.16)col=wet<-.5?'#204d59':'#296b70';
  else if(wet<.06)col='#568785';
  else if(wet<.13)col='#738a81';
  else if(d>-9)col='#2d414b';
  else{
   let first=Infinity,second=Infinity,nearest;
   const ix=Math.floor(wx/70),iy=Math.floor(wy/54);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const s=sites.get((ix+dx)+','+(iy+dy));if(!s)continue;const dist=(wx-s.x)**2+(wy-s.y)**2;if(dist<first){second=first;first=dist;nearest=s;}else if(dist<second)second=dist;}
   col=['#4b5b60','#506064','#526366','#47585f'][nearest?.tone||0];
   if(second-first<55&&n>.32)col='#394e57';
   else if(second-first<150&&n>.6)col='#687570';
  }
  c.fillStyle=col;c.fillRect(x,y,1,1);
 }
 for(let i=0;i<4500;i++){const wx=hash(i,3)*1600,wy=hash(i,7)*1600;if(cavernSliceDistance(wx,wy)>-12)continue;const wet=pool(wx,wy);c.fillStyle=wet<0?'#639b9b':i%3?'#647777':'#344b56';if(wet<0&&i%4||wet>=0&&i%3===0)continue;c.fillRect(wx/2,wy/2,wet<0?3+hash(i,6)*6:2+hash(i,8)*3,1);}
 renderer.floor=(ctx)=>{ctx.imageSmoothingEnabled=false;ctx.drawImage(floorCanvas,0,0,1600,1600);
  for(const wall of walls)drawRealmSprite(ctx,wall.kind,wall.x,wall.y,wall.size,g.spriteLibrary);
  // A small wall seep, in the same screen-vertical direction as game props.
  ctx.fillStyle='#769b9d';ctx.fillRect(335,430,2,54);ctx.fillStyle='#547d86';ctx.fillRect(339,433,3,46);
 };
 return {walls,props,spawn:CAVERN_SLICE.spawn};
}
