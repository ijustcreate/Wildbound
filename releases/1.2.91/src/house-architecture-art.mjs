import {houseFloorZones} from './house-surfaces.mjs';
const floors=new WeakMap();
function floorKey(h){return JSON.stringify([h.floors,houseFloorZones(h)]);}
function paintMaterial(c,r,material){
 c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
 if(material==='carpet'){
  c.fillStyle='#526d67';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#9baf97';c.lineWidth=2;c.strokeRect(r.x+5,r.y+5,r.w-10,r.h-10);
  for(let y=r.y+10;y<r.y+r.h-8;y+=9)for(let x=r.x+9;x<r.x+r.w-8;x+=13){c.fillStyle=(x+y)%2?'#688178':'#48625e';c.fillRect(x,y,2,1);}
 }else if(material==='checker'){
  c.fillStyle='#687774';c.fillRect(r.x,r.y,r.w,r.h);
  for(let row=Math.floor(r.y/16);row<Math.ceil((r.y+r.h)/16);row++)for(let col=Math.floor(r.x/16);col<Math.ceil((r.x+r.w)/16);col++){
   const x=col*16,y=row*16;c.fillStyle=(row+col)%2?'#47635f':'#d8d4b5';c.fillRect(x+1,y+1,15,15);c.fillStyle=(row+col)%2?'#698078':'#ebe5c7';c.fillRect(x+2,y+1,13,1);
  }
 }else if(material==='cement'){
  c.fillStyle='#8c9186';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#717c74';c.lineWidth=1;
  for(let y=r.y+40;y<r.y+r.h;y+=40){c.beginPath();c.moveTo(r.x,y);c.lineTo(r.x+r.w,y);c.stroke();}
 }else{
  c.fillStyle='#72583e';c.fillRect(r.x,r.y,r.w,r.h);
  const colors=['#ad8858','#b99768','#a98051','#c09b68'];
  for(let row=Math.floor(r.y/8);row<Math.ceil((r.y+r.h)/8);row++)for(let col=Math.floor(r.x/40)-1;col<Math.ceil((r.x+r.w)/40);col++){
   const x=col*40+(row%2)*20,y=row*8,k=((row*13+col*7)%4+4)%4;c.fillStyle=colors[k];c.fillRect(x+1,y+1,39,7);c.fillStyle='#e3c59350';c.fillRect(x+2,y+1,37,1);
   if((row+col)%3===0){c.fillStyle='#74533740';c.fillRect(x+7,y+5,13,1);}
  }
 }
 c.restore();
}
function paintFloor(c,h){
 for(const r of h.floors||[])paintMaterial(c,r,r.material||'wood');
 c.save();c.beginPath();for(const r of h.floors||[])c.rect(r.x,r.y,r.w,r.h);c.clip();
 for(const r of houseFloorZones(h))paintMaterial(c,r,r.material);
 c.restore();
 for(const r of h.floors||[]){c.strokeStyle='#66523c';c.lineWidth=3;c.strokeRect(r.x+2,r.y+2,r.w-4,r.h-4);}
}
export function drawHouseFloor(c,h){
 if(!h?.floors?.length)return;
 const key=floorKey(h);let cached=floors.get(h);
 if(!cached||cached.key!==key){
  const x=Math.max(0,Math.floor(Math.min(...h.floors.map(r=>r.x)))),y=Math.max(0,Math.floor(Math.min(...h.floors.map(r=>r.y))));
  const w=Math.min(1600,Math.ceil(Math.max(...h.floors.map(r=>r.x+r.w))-x)),height=Math.min(1600,Math.ceil(Math.max(...h.floors.map(r=>r.y+r.h))-y));
  if(typeof document==='undefined'){paintFloor(c,h,x,y,w,height);return;}
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=height;const cc=canvas.getContext('2d');cc.translate(-x,-y);paintFloor(cc,h,x,y,w,height);
  cached={key,canvas,x,y,w,height};floors.set(h,cached);
 }
 c.save();c.imageSmoothingEnabled=false;c.drawImage(cached.canvas,cached.x,cached.y);c.restore();
}
export const houseFloorCacheInfo=h=>{const cached=floors.get(h);return cached?{width:cached.w,height:cached.height}:null;};
export function drawHouseWall(c,b){
 const {x,y,w,h}=b,horizontal=w>h;c.save();
 c.fillStyle='#19232466';c.fillRect(x+3,y+5,w,h+3);
 if(b.kind==='fence'){
  c.fillStyle='#674a32';c.fillRect(x,y,w,h);c.fillStyle='#bd955c';c.fillRect(x+2,y+2,Math.max(1,w-4),Math.max(1,h-4));
  const length=horizontal?w:h;for(let n=0;n<length;n+=24){const px=x+(horizontal?n:0),py=y+(horizontal?0:n);c.fillStyle='#674a32';c.fillRect(px,py,Math.min(10,w),Math.min(20,h));c.fillStyle='#d4ae71';c.fillRect(px+2,py+1,Math.min(5,w-3),Math.min(17,h-2));c.fillStyle='#4f3d2b';c.fillRect(px+3,py+4,2,2);}c.restore();return;
 }
 c.fillStyle='#817e67';c.fillRect(x,y,w,h);c.fillStyle='#d9cdaa';c.fillRect(x+2,y+2,Math.max(1,w-4),Math.max(1,h-4));
 c.fillStyle='#f0e2b8';c.fillRect(x+2,y+1,Math.max(1,w-4),2);c.fillStyle='#64503b';c.fillRect(x+1,y+h-4,Math.max(1,w-2),3);
 const length=horizontal?w:h;for(let n=0;n<length;n+=32){const px=x+(horizontal?n:0),py=y+(horizontal?0:n);c.fillStyle='#a49a7c';c.fillRect(px+(horizontal?0:3),py+(horizontal?3:0),horizontal?1:Math.max(1,w-6),horizontal?Math.max(1,h-7):1);}
 for(const end of [0,Math.max(0,length-5)]){const px=x+(horizontal?end:0),py=y+(horizontal?0:end);c.fillStyle='#725235';c.fillRect(px,py,horizontal?5:w,horizontal?h:5);c.fillStyle='#ba9460';c.fillRect(px+1,py+1,horizontal?2:Math.max(1,w-2),horizontal?Math.max(1,h-2):2);}
 c.restore();
}
export function drawHouseDoor(c,d){
 // Swing the whole authored leaf: dimensions, panels and handle stay together.
 if(d.open&&d.kind!=='garage'){c.save();c.translate(d.x+d.h,d.y);c.rotate(Math.PI/2);drawHouseDoor(c,{...d,x:0,y:0,open:false});c.restore();return;}
 const horizontal=d.w>d.h,w=d.w,h=d.h;
 c.save();c.fillStyle='#18212066';c.fillRect(d.x+2,d.y+4,w,h);if(d.kind==='garage'){c.fillStyle=d.open?'#465b55':'#586064';c.fillRect(d.x,d.y,w,h);c.fillStyle='#a5aaa0';for(let n=8;n<(horizontal?w:h)-4;n+=14)c.fillRect(d.x+(horizontal?n:3),d.y+(horizontal?3:n),horizontal?Math.max(1,w-6):2,horizontal?2:Math.max(1,h-6));if(d.open)c.globalAlpha=.3;c.fillStyle='#172522';c.fillRect(d.x,d.y,w,h);c.restore();return;}c.fillStyle='#5d412d';c.fillRect(d.x,d.y,w,h);
 c.fillStyle=d.open?'#b99b64':'#b18a51';c.fillRect(d.x+1,d.y+1,Math.max(1,w-2),Math.max(1,h-2));
 c.fillStyle='#eed39a';c.fillRect(d.x+1,d.y+1,Math.max(1,w-2),2);
 if(!d.open){for(let n=12;n<(horizontal?w:h)-5;n+=12){c.fillStyle='#6c4c30';c.fillRect(d.x+(horizontal?n:2),d.y+(horizontal?3:n),horizontal?1:Math.max(1,w-4),horizontal?Math.max(1,h-5):1);}}
 c.fillStyle='#493d2c';c.fillRect(d.x+(horizontal?w-9:2),d.y+(horizontal?5:h-9),5,5);c.fillStyle='#efd17d';c.fillRect(d.x+(horizontal?w-8:3),d.y+(horizontal?5:h-8),3,3);
 c.restore();
}
