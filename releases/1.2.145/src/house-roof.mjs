const cache=new Map();let pixels=0;
const MAX_PIXELS=4*1024*1024;
const inside=(f,p)=>!p.room&&p.hp>0&&p.x>=f.x&&p.x<f.x+f.w&&p.y>=f.y&&p.y<f.y+f.h;
export function houseRoofSections(g){return !g.house||g.house.temple?[]:(g.house.floors||[]).map(f=>({floor:f,visible:!(g.players||[]).some(p=>inside(f,p))}));}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export function houseRoofGeometry(f){
 const x=f.x-12,y=f.y-12,w=f.w+24,h=f.h+24,eave=24,rise=Math.min(80,Math.min(w,h)*.24),hip=Math.min(w,h)*.22,cx=x+w/2;
 const nw=[x,y-eave],ne=[x+w,y-eave],se=[x+w,y+h-eave],sw=[x,y+h-eave],a=[cx,y+hip-rise-eave],b=[cx,y+h-hip-rise-eave];
 return {bounds:{x:x-4,y:y-eave-4,w:w+8,h:h+8},perimeter:[nw,ne,se,sw,nw],planes:[[nw,ne,a],[nw,a,b,sw],[a,ne,se,b],[sw,b,se]],ridge:[a,b]};
}
function paintRoof(c,geometry){
 const colors=['#344a4b','#49615e','#65766a','#778171'];
 for(const [i,plane]of geometry.planes.entries()){
  poly(c,plane,colors[i]);c.save();c.beginPath();plane.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
  const b=geometry.bounds;
  for(let y=b.y;y<b.y+b.h;y+=18){c.fillStyle=i===2?'#87917b':'#2e4b4860';c.fillRect(b.x,y,b.w,2);for(let x=b.x+((Math.round((y-b.y)/18)%2)*15);x<b.x+b.w;x+=32){c.fillStyle='#263c3c38';c.fillRect(x,y+2,1,16);}}
  c.restore();
 }
 c.strokeStyle='#293d3d';c.lineWidth=3;c.beginPath();geometry.perimeter.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
 c.strokeStyle='#b2ad8a';c.lineWidth=3;c.beginPath();c.moveTo(...geometry.ridge[0]);c.lineTo(...geometry.ridge[1]);c.stroke();
 c.strokeStyle='#81907a';c.lineWidth=2;for(const [from,to]of [[geometry.perimeter[0],geometry.ridge[0]],[geometry.perimeter[1],geometry.ridge[0]],[geometry.perimeter[2],geometry.ridge[1]],[geometry.perimeter[3],geometry.ridge[1]]]){c.beginPath();c.moveTo(...from);c.lineTo(...to);c.stroke();}
}
export function drawRoofChristmasLights(c,geometry){
 const colors=['#d76350','#e9c575','#71a874','#78aeb3'];let serial=0;
 c.save();c.strokeStyle='#293f37';c.lineWidth=1;
 for(let edge=1;edge<geometry.perimeter.length;edge++){
  const [a,b]=[geometry.perimeter[edge-1],geometry.perimeter[edge]],distance=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.max(1,Math.floor(distance/25));
  c.beginPath();c.moveTo(a[0],a[1]+3);c.lineTo(b[0],b[1]+3);c.stroke();
  for(let i=0;i<count;i++){const t=(i+.5)/count,x=Math.round(a[0]+(b[0]-a[0])*t),y=Math.round(a[1]+(b[1]-a[1])*t+5);c.fillStyle='#263c34';c.fillRect(x,y-3,1,3);c.fillStyle=colors[serial++%4];c.fillRect(x-1,y,3,4);c.fillStyle='#ffe7ac';c.fillRect(x,y,1,1);}
 }c.restore();
}
export function houseRoofCacheStats(){return {surfaces:cache.size,pixels,limit:MAX_PIXELS};}
export function drawHouseRoof(c,g,visible=()=>true,lights=true){
 for(const {floor,visible:shown}of houseRoofSections(g)){
  if(!shown||!visible({x:floor.x+floor.w/2,y:floor.y+floor.h/2},Math.hypot(floor.w,floor.h)/2+120))continue;
  const geometry=houseRoofGeometry(floor),b=geometry.bounds,key=JSON.stringify(floor);let entry=cache.get(key);
  if(!entry&&typeof document!=='undefined'&&b.w*b.h<=MAX_PIXELS){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(b.w);canvas.height=Math.ceil(b.h);const p=canvas.getContext('2d');p.translate(-b.x,-b.y);paintRoof(p,geometry);entry={canvas,pixels:canvas.width*canvas.height};
   while(cache.size&&(cache.size>=8||pixels+entry.pixels>MAX_PIXELS)){const first=cache.keys().next().value;pixels-=cache.get(first).pixels;cache.delete(first);}cache.set(key,entry);pixels+=entry.pixels;
  }
  c.save();c.imageSmoothingEnabled=false;if(entry)c.drawImage(entry.canvas,b.x,b.y);else paintRoof(c,geometry);if(lights)drawRoofChristmasLights(c,geometry);c.restore();
 }
}
export function drawHouseRoofLights(c,g,visible=()=>true){for(const {floor,visible:shown}of houseRoofSections(g))if(shown&&visible({x:floor.x+floor.w/2,y:floor.y+floor.h/2},Math.hypot(floor.w,floor.h)/2+120))drawRoofChristmasLights(c,houseRoofGeometry(floor));}
