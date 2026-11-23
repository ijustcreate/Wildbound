import {groundShadowPolygon} from './world-lighting.mjs';
import {spriteToRgba} from './pixels.mjs';
import lanternFrames from './winter-lantern-frames.mjs';

const base=p=>({x:p.x,y:p.y+p.size*.19});
const lanternLoopMs = lanternFrames.reduce((total, frame) => total + frame.duration, 0);
const lanternCanvases = new WeakMap();

export function winterLanternFrame(time = 0) {
 let elapsed = Math.floor(Math.max(0, time) * 1000) % lanternLoopMs;
 for (const {duration, sprite} of lanternFrames) {
  if (elapsed < duration) return sprite;
  elapsed -= duration;
 }
 return lanternFrames[0].sprite;
}

function drawAnimatedWinterLantern(c, time) {
 const sprite = winterLanternFrame(time);
 let canvas = lanternCanvases.get(sprite);
 if (!canvas) {
  canvas = typeof OffscreenCanvas === 'function'
   ? new OffscreenCanvas(sprite.width, sprite.height)
   : Object.assign(document.createElement('canvas'), {width: sprite.width, height: sprite.height});
  canvas.getContext('2d').putImageData(new ImageData(spriteToRgba(sprite), sprite.width, sprite.height), 0, 0);
  lanternCanvases.set(sprite, canvas);
 }
 c.imageSmoothingEnabled = false;
 c.drawImage(canvas, sprite.x, sprite.y);
}

export function winterLightSources(g){
 if(g.generatedEnvironment!=='ice')return [];
 return (g.scenery||[]).filter(p=>!p.destroyed&&!p.depleted&&['winter_lodge','winter_lantern'].includes(p.kind)).flatMap(p=>{
  const b=base(p),s=p.size/64;
  return p.kind==='winter_lodge'?[-19,18].map(dx=>({x:b.x+dx*s,y:b.y-6*s,height:20*s,radius:170,intensity:.95,color:'#ffd181',owner:'prop:'+p.id})):
   [{x:b.x,y:b.y,height:42*s,radius:155,intensity:.9,color:'#ffd797',owner:'prop:'+p.id}];
 });
}

// Native pixel scenery, sorted and lit through the regular prop renderer.
export function drawWinterFixture(c,p,time=0){
 if(!['winter_lodge','winter_lantern'].includes(p.kind))return false;
 const b=base(p),s=p.size/64;c.save();c.translate(Math.round(b.x),Math.round(b.y));c.scale(s,s);
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 // This existing fixture is the animated one on the route from spawn to the lodge.
 if(p.kind==='winter_lantern'&&p.id==='winter:lantern:0'){
  drawAnimatedWinterLantern(c,time);
 }else if(p.kind==='winter_lantern'){
  r(-9,-2,18,4,'#cbdde9');r(-4,-8,8,8,'#394455');r(-2,-43,4,38,'#344052');r(-1,-40,1,32,'#8091a1');
  r(-7,-55,14,13,'#322f35');r(-5,-53,10,9,'#d89145');r(-3,-52,6,8,'#ffe9a4');r(-1,-53,2,11,'#fff3bc');
  r(-8,-56,16,3,'#263444');poly([[-10,-56],[0,-63],[10,-56]],'#a8c2d5');r(-7,-58,13,2,'#e1edf0');r(-6,-43,12,2,'#3c3b3d');
 }else{
  r(-36,-5,72,7,'#586978');r(-33,-43,66,39,'#51443e');
  for(let y=-39;y<-6;y+=6){r(-33,y,66,2,'#302e33');r(-30,y+2,2,3,'#8a7462');r(30,y+1,3,4,'#2a2e35');}
  r(-5,-28,15,26,'#272c36');r(-3,-25,11,22,'#725039');r(5,-14,2,2,'#f5c274');
  for(const x of [-26,15]){r(x-2,-32,18,17,'#302d32');r(x,-30,14,13,'#e6ac53');r(x+2,-29,10,10,'#ffdc85');r(x+6,-30,2,13,'#76533b');r(x,-24,14,2,'#76533b');r(x-3,-15,20,3,'#d4e3e7');}
  poly([[-41,-43],[-28,-65],[21,-69],[41,-44],[28,-40],[-29,-39]],'#3c4a5c');
  poly([[-42,-45],[-28,-68],[20,-71],[42,-46],[30,-43],[17,-47],[5,-43],[-10,-47],[-29,-42]],'#bdcfdc');
  poly([[-36,-48],[-26,-64],[19,-67],[32,-52],[15,-55],[-4,-51],[-19,-54]],'#e3ecee');
  for(const [x,y,w]of [[-30,-59,15],[-9,-63,18],[11,-58,13],[-24,-48,10],[3,-47,12]])r(x,y,w,2,'#9eb8cc');
  for(const x of [-31,-12,12,29]){r(x,-43,2,5,'#b1d6e1');r(x,-43,1,8,'#d8e9ec');}
  r(19,-77,10,17,'#4c4850');r(17,-79,14,4,'#dce9ed');r(21,-75,3,9,'#87776f');
  r(-19,-41,38,9,'#302e33');c.fillStyle='#e4bc7a';c.font='5px monospace';c.textAlign='center';c.fillText('LODGE',0,-34);
  for(const [x,w]of [[-37,17],[-16,9],[12,25]]){r(x,-5,w,5,'#d8e6e9');r(x+2,-7,w-4,2,'#edf2ee');}
  r(-8,-1,22,3,'#8a9aaa');r(-10,2,26,3,'#b9ceda');
 }
 c.restore();return true;
}

let veil,pool,warmth;
// Half-resolution, bounded buffers. Cut light into the blue veil rather than
// drawing a bright disc over the scene. Ground casters retain their shadows.
export function drawWinterNight(c,g,camera,w,h,dark,sources,field){
 if(g.generatedEnvironment!=='ice'||dark<=0||typeof document==='undefined')return false;
 const width=Math.ceil(w/2),height=Math.ceil(h/2);
 veil??=document.createElement('canvas');pool??=document.createElement('canvas');warmth??=document.createElement('canvas');
 for(const canvas of [veil,pool,warmth])if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const v=veil.getContext('2d'),p=pool.getContext('2d'),warm=warmth.getContext('2d'),zoom=camera.zoom/2;
 warm.clearRect(0,0,width,height);
 v.globalCompositeOperation='source-over';v.clearRect(0,0,width,height);v.fillStyle=`rgba(3,22,68,${dark*.88})`;v.fillRect(0,0,width,height);
 for(const source of sources){
  const x=width/2+(source.x-camera.x)*zoom,y=height/2+(source.y-camera.y)*zoom,r=source.radius*zoom;
  if(x+r<0||y+r<0||x-r>width||y-r>height)continue;
  p.globalCompositeOperation='source-over';p.clearRect(0,0,width,height);const glow=p.createRadialGradient(x,y,0,x,y,r);
  for(const [stop,alpha]of [[0,.92],[.18,.83],[.5,.38],[1,0]])glow.addColorStop(stop,`rgba(0,0,0,${alpha*(source.intensity??1)})`);
  p.fillStyle=glow;p.fillRect(x-r,y-r,r*2,r*2);
  if(field){p.save();p.translate(width/2,height/2);p.scale(zoom,zoom);p.translate(-camera.x,-camera.y);p.globalCompositeOperation='destination-out';p.fillStyle='#000';
   for(const volume of field.near(source)){if(volume.owner===source.owner)continue;const points=groundShadowPolygon(source,volume);if(!points.length)continue;p.globalAlpha=volume.opacity??1;p.beginPath();points.forEach(([px,py],i)=>i?p.lineTo(px,py):p.moveTo(px,py));p.closePath();p.fill();}p.restore();}
  v.globalCompositeOperation='destination-out';v.drawImage(pool,0,0);
  p.globalCompositeOperation='source-in';p.globalAlpha=dark*.38;p.fillStyle=source.color||'#ffd181';p.fillRect(0,0,width,height);p.globalAlpha=1;warm.drawImage(pool,0,0);
 }
 v.globalCompositeOperation='source-over';
 c.save();c.imageSmoothingEnabled=true;c.drawImage(veil,0,0,w,h);c.drawImage(warmth,0,0,w,h);
 const edge=c.createRadialGradient(w*.5,h*.46,Math.min(w,h)*.22,w*.5,h*.46,Math.max(w,h)*.68);
 edge.addColorStop(0,'#02091600');edge.addColorStop(1,`rgba(2,9,22,${dark*.48})`);c.fillStyle=edge;c.fillRect(0,0,w,h);c.restore();return true;
}
