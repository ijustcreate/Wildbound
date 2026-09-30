const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export const ICE_PROPS=['snow_tree','ice_rock','snow_drift','frost_shrub','ice_spire','frozen_log','winter_cache'];
export const iceSolid=p=>['snow_tree','ice_rock','ice_spire','frozen_log','winter_cache'].includes(p.kind);
export const iceBase=p=>({x:p.x,y:p.y+p.size*(p.kind==='snow_tree'?.35:.19)});
export function drawWinterTile(c,kind,x,y,size=32){
 const r=hash(x/size,y/size);
 if(kind==='snow'){
  c.fillStyle=['#d8e8eb','#d1e3e7','#c9dde2','#e0ecee'][Math.floor(r*4)];c.fillRect(x,y,size,size);
  c.fillStyle='#b7d0d6';c.fillRect(x,y+size-2,size,2);
  c.fillStyle='#eef8f8';c.fillRect(x+1,y+1,size-2,2);
  c.strokeStyle='#f3fbfb';c.lineWidth=1;c.beginPath();c.moveTo(x+2,y+8+r*4);c.lineTo(x+10+r*8,y+7+r*4);c.lineTo(x+17+r*7,y+9+r*3);c.stroke();
  c.strokeStyle='#b3cdd4';c.beginPath();c.moveTo(x+size-1,y+14+r*6);c.lineTo(x+size-9-r*5,y+17+r*4);c.lineTo(x+size-16-r*4,y+16+r*4);c.stroke();
  if(r>.28){c.fillStyle='#a9c6cf';c.fillRect(x+4+Math.floor(r*17),y+24+Math.floor(r*4),2,1);c.fillRect(x+21+Math.floor(r*6),y+11+Math.floor(r*7),1,2);}
  return;
 }
 c.fillStyle=['#82b6ce','#8ebfd4','#78abc5','#9bc9d9'][Math.floor(r*4)];c.fillRect(x,y,size,size);
 c.fillStyle='#bce3ea';c.fillRect(x+1,y+1,size-2,1);c.fillStyle='#638fae';c.fillRect(x,y+size-2,size,2);
 c.fillStyle='#ccecf0';c.globalAlpha=.42;c.beginPath();c.moveTo(x+3,y+4);c.lineTo(x+13,y+2);c.lineTo(x+25,y+11);c.lineTo(x+17,y+14);c.closePath();c.fill();c.globalAlpha=1;
 c.strokeStyle='#d5f1f3';c.lineWidth=1;c.beginPath();c.moveTo(x+4,y+size-7);c.lineTo(x+11,y+size-12);c.lineTo(x+15,y+size-9);c.lineTo(x+24,y+size-15);c.stroke();
 c.strokeStyle='#5f91ad';c.beginPath();c.moveTo(x+size-3,y+4+r*5);c.lineTo(x+size-11,y+9+r*6);c.lineTo(x+size-15,y+8+r*4);c.stroke();
 c.fillStyle='#eefcff';c.fillRect(x+7+Math.floor(r*15),y+5+Math.floor(r*13),2,1);
}
export function iceWorld(seed){
 const terrain=Array(2500).fill('snow'),scenery=[];
 for(let y=0;y<50;y++)for(let x=0;x<50;x++){
  const px=x*32+16,py=y*32+16,r=hash(x+seed*.07,y);
  const lake=((px-432)/224)**2+((py-448)/176)**2<1||((px-1200)/192)**2+((py-1120)/224)**2<1;
  if(lake||(r>.88&&Math.hypot(px-800,py-800)>170))terrain[y*50+x]='ice';
  if(x>1&&x<48&&y>1&&y<48&&!lake&&Math.hypot(px-800,py-800)>205&&r>.82){
   const n=hash(y+seed,x),kind=n<.26?'snow_tree':n<.43?'ice_rock':n<.59?'snow_drift':n<.72?'frost_shrub':n<.84?'ice_spire':n<.985?'frozen_log':'winter_cache';
   scenery.push({id:'winter:'+x+':'+y,x:px,y:py,kind,size:kind==='snow_tree'?80+Math.floor(n*90):kind==='ice_spire'?54:kind==='frozen_log'?48:36+Math.floor(n*14),procedural:true});
  }
 }
 return {terrain,scenery,house:null,webs:[],snowDepth:0};
}
export function snowAt(g,x,y){if(g.generatedEnvironment!=='ice')return 0;const depth=g.snowDepth||0;return Math.min(1,depth*(.75+hash(Math.floor(x/64),Math.floor(y/64))*.25));}
export function iceMotion(g,p,mx,my,speed,dt){
 const tile=g.terrain?.[Math.floor(p.y/32)*50+Math.floor(p.x/32)];
 if(g.generatedEnvironment!=='ice'||tile!=='ice'){p.slideX=p.slideY=0;return {dx:mx*speed*dt,dy:my*speed*dt};}
 const moving=Math.hypot(mx,my)>.05,snow=snowAt(g,p.x,p.y),grip=1-Math.exp(-dt*(moving?3.8+snow*9:1.7+snow*10));
 p.slideX=(p.slideX||0)+(mx*speed-(p.slideX||0))*grip;p.slideY=(p.slideY||0)+(my*speed-(p.slideY||0))*grip;
 if(Math.hypot(p.slideX,p.slideY)<1)p.slideX=p.slideY=0;
 return {dx:p.slideX*dt,dy:p.slideY*dt};
}
export function interactIce(g,p){
 if(g.generatedEnvironment!=='ice')return false;
 const prop=g.scenery.filter(s=>!s.used&&['frost_shrub','winter_cache'].includes(s.kind)).map(s=>({s,b:iceBase(s)})).filter(({b})=>Math.hypot(p.x-b.x,p.y+14-b.y)<48).sort((a,b)=>Math.hypot(p.x-a.b.x,p.y-a.b.y)-Math.hypot(p.x-b.b.x,p.y-b.b.y))[0]?.s;
 if(!prop)return false;prop.used=true;
 const cache=prop.kind==='winter_cache';
 if(cache){const potions=1+Math.floor(g.random()*2);g.dropLoot(p.x,p.y+18,'potion',potions,'Winter supplies');if(g.random()<.1)g.dropLoot(p.x+14,p.y+4,'santa_hat',1,'Winter supplies');}
 else g.dropLoot(p.x,p.y+18,'frost_berry',3,'Frost berries');
 g.message(cache?'Winter cache opened — supplies found.':'Frost berries gathered — three frost berries.');g.onSound('loot');g.persist();return true;
}
export function tickSnow(g,dt){if(g.generatedEnvironment!=='ice'){g.snowDepth=0;return;}if(g.weather?.type==='blizzard')g.snowDepth=Math.min(1,(g.snowDepth||0)+dt/22);else g.snowDepth=Math.max(0,(g.snowDepth||0)-dt/150);}
export function drawSnowGround(c,g){if(!g.snowDepth)return;c.save();const depth=g.snowDepth;c.fillStyle='#e7f4f7';c.globalAlpha=depth*.18;c.fillRect(0,0,1600,1600);c.globalAlpha=depth*.5;c.strokeStyle='#ffffff';c.lineWidth=1;for(let y=0;y<25;y++)for(let x=0;x<25;x++){const h=hash(x,y);if(h>.58){const ox=hash(x+8,y)-.5,oy=hash(x,y+8)-.5;c.beginPath();c.moveTo(x*64+8+ox*8,y*64+30+oy*5);c.quadraticCurveTo(x*64+28+ox*8,y*64+20-h*6+oy*5,x*64+46+ox*8,y*64+28+oy*5);c.stroke();}}c.restore();}
export function clipSnow(c,g,x,base,width){const d=snowAt(g,x,base)*7;if(d<.1)return;c.beginPath();c.rect(x-width/2,base-300,width,300-d);c.clip();}
export function snowRim(c,g,x,base,width){const d=snowAt(g,x,base)*7;if(d<.1)return;c.fillStyle='#e3f0f3';c.beginPath();c.ellipse(x,base-d+1,width/2,Math.max(1,d*.3),0,0,Math.PI*2);c.fill();}
export function drawIceProp(c,p,time=0){if(!ICE_PROPS.includes(p.kind))return false;
 const b=iceBase(p),scale=p.size/64;c.save();c.translate(Math.round(b.x),Math.round(b.y));c.scale(scale,scale);if(p.falling){c.rotate((p.fallDirection||1)*Math.min(1,p.falling/1.1)*Math.PI/2);c.globalAlpha*=Math.max(0,1-Math.max(0,p.falling-1)*2);}
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 if(p.kind==='snow_tree'){
  r(-4,-35,8,35,'#665550');r(-2,-30,3,30,'#978172');
  for(let i=0;i<4;i++){const y=-61+i*12,w=9+i*5;poly([[0,y-9],[-w,y+15],[w,y+15]],'#285650');poly([[0,y-9],[-w+2,y+10],[-3,y+6],[5,y+11],[w-3,y+10]],i%2?'#d6e9eb':'#edf8f6');r(-w+3,y+13,w*2-6,2,'#86afb6');}
 }else if(['ice_rock','ice_spire'].includes(p.kind)){
  const h=p.kind==='ice_spire'?58:32;poly([[-25,-2],[-21,-h*.55],[-8,-h],[12,-h*.9],[26,-h*.4],[23,0]],'#6ca6bd');poly([[-8,-h],[-2,-3],[12,-h*.9]],'#e1f9ff');poly([[-21,-h*.55],[-8,-h],[-2,-3],[-25,-2]],'#a1d3e3');poly([[12,-h*.9],[26,-h*.4],[-2,-3]],'#84bfd6');r(-23,-2,46,3,'#deedf0');
 }else if(p.kind==='snow_drift'){poly([[-29,0],[-20,-9],[-4,-14],[16,-10],[29,0]],'#c1dce4');poly([[-24,-2],[-17,-8],[-4,-12],[15,-8],[25,-2]],'#edf6f6');}
 else if(p.kind==='frost_shrub'){for(let i=-2;i<=2;i++){r(i*9,-18-Math.abs(i)*3,3,22,'#718d95');r(i*9-6,-24+Math.abs(i)*4,14,7,'#b2d7da');if(!p.used)r(i*9,-15+Math.abs(i)*3,5,5,'#cd6381');}r(-22,-3,46,4,'#eaf5f3');}
 else if(p.kind==='frozen_log'){r(-28,-13,56,14,'#72615c');r(-24,-10,46,4,'#aa9380');r(-30,-17,58,6,'#e7f6f8');r(-27,-11,3,9,'#493f40');r(24,-11,3,9,'#493f40');}
 else if(p.kind==='winter_cache'){r(-20,-24,40,25,'#536775');r(-22,p.used?-36:-26,44,8,'#89a3ac');r(-22,p.used?-38:-28,44,4,'#e7f6f7');r(-16,-22,3,21,'#c4ad74');r(13,-22,3,21,'#c4ad74');r(-4,-18,8,8,p.used?'#283f49':'#e4c77b');}
 c.restore();return true;
}
export function drawBlizzard(c,g,w,h){if(g.weather?.type!=='blizzard')return false;c.save();c.fillStyle='#bedce322';c.fillRect(0,0,w,h);const t=g.time||0;c.fillStyle='#f3fbff';for(let i=0;i<140;i++){const z=.4+hash(i,1),x=((hash(i,2)*w+t*(38+z*42))%(w+20))-10,y=((hash(i,3)*h+t*(36+z*55))%(h+20))-10;c.globalAlpha=.35+z*.4;c.fillRect(x,y,2+z*2,2+z);}c.globalAlpha=1;c.fillStyle='#102f3ed9';c.fillRect(12,h-102,214,26);c.fillStyle='#e7f7fb';c.font='12px sans-serif';c.textAlign='left';c.fillText('BLIZZARD · '+Math.ceil(g.weather.life)+'s · Deepening snow',22,h-85);c.restore();return true;}
export function drawIceHints(c,g){if(g.generatedEnvironment!=='ice')return;for(const p of g.scenery){if(p.used||!['winter_cache','frost_shrub'].includes(p.kind))continue;const b=iceBase(p);if(!g.players.some(a=>a.hp>0&&!a.room&&Math.hypot(a.x-b.x,a.y-b.y)<60))continue;const text=(p.kind==='winter_cache'?'Open winter cache':'Gather frost berries')+' · '+(g.controlLabels?.interact||'E / Y');c.save();c.font='8px sans-serif';c.textAlign='center';const width=c.measureText(text).width;c.fillStyle='#15303dec';c.fillRect(b.x-width/2-5,b.y+8,width+10,15);c.fillStyle='#edf8fb';c.fillText(text,b.x,b.y+18);c.restore();}}


