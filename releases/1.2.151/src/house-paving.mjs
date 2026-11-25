import {boundlessGeneratedTile} from './boundless-generation.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const tileAt=(g,tx,ty)=>tx>=0&&tx<50&&ty>=0&&ty<50?g.terrain?.[ty*50+tx]:g.mapMode==='boundless'?boundlessGeneratedTile(g,tx,ty):null;
const pavingCache=new Map();
export function drawPavingTile(c,g,x,y){
 if(typeof document!=='undefined'){
  const tx=Math.floor(x/32),ty=Math.floor(y/32),neighbors=[[-1,0],[1,0],[0,-1],[0,1]].map(([dx,dy])=>tileAt(g,tx+dx,ty+dy)==='grass');
  const key=x+','+y+':'+neighbors.map(Number).join('');let tile=pavingCache.get(key);
  if(!tile){tile=document.createElement('canvas');tile.width=tile.height=32;const pen=tile.getContext('2d');pen.translate(-x,-y);paintPavingTile(pen,g,x,y);if(pavingCache.size>=512)pavingCache.delete(pavingCache.keys().next().value);pavingCache.set(key,tile);}
  c.drawImage(tile,x,y);return;
 }
 paintPavingTile(c,g,x,y);
}
function paintPavingTile(c,g,x,y){
 const colors=['#a3aa91','#b1b49b','#a9b198','#b8baa2'];c.fillStyle='#89917e';c.fillRect(x,y,32,32);
 for(let row=Math.floor(y/16);row<Math.ceil((y+32)/16);row++)for(let col=Math.floor(x/32)-1;col<Math.ceil((x+32)/32);col++){
  const px=col*32+(row%2)*16,py=row*16,n=hash(px,py);c.save();c.beginPath();c.rect(x,y,32,32);c.clip();
  c.fillStyle=colors[Math.floor(n*4)];c.fillRect(px+1,py+1,31,15);c.fillStyle='#d1d4b54c';c.fillRect(px+2,py+1,29,1);c.fillStyle='#68766d35';c.fillRect(px+2,py+15,29,1);
  if(n>.94){c.strokeStyle='#74807180';c.lineWidth=1;c.beginPath();c.moveTo(px+5,py+1);c.lineTo(px+9,py+7);c.lineTo(px+7,py+11);c.stroke();}
  c.restore();
 }
 for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
  const tx=Math.floor(x/32)+dx,ty=Math.floor(y/32)+dy;
  if(tileAt(g,tx,ty)!=='grass')continue;
  for(let n=0;n<4;n++){
   const roll=hash(x+n,y+dx+dy);if(roll<.3)continue;
   const step=n*8+Math.floor(roll*3),depth=1+Math.floor(roll*4),px=dx?(dx<0?x:x+32-depth):x+step,py=dy?(dy<0?y:y+32-depth):y+step;
   c.fillStyle=n%2?'#657e53':'#7f925d';c.fillRect(px,py,dx?depth:2+Math.floor(roll*5),dy?depth:2+Math.floor(roll*5));
   if(n%2===0){c.fillStyle='#9fae72';c.fillRect(px,py-2,1,4);}
  }
 }
}
