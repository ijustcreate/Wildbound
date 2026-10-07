const floors=new WeakMap();
function floorKey(h){return (h.floors||[]).map(r=>[r.x,r.y,r.w,r.h].join(',')).join('|');}
function paintFloor(c,h,x,y,w,height){
 c.save();c.beginPath();for(const r of h.floors||[])c.rect(r.x,r.y,r.w,r.h);c.clip();
 c.fillStyle='#694a32';c.fillRect(x,y,w,height);
 const colors=['#b58b54','#c09b63','#aa7e49','#c5a06b'];
 for(let row=Math.floor(y/16);row<Math.ceil((y+height)/16);row++)for(let col=Math.floor(x/64)-1;col<Math.ceil((x+w)/64);col++){
  const px=col*64+(row%2)*32,py=row*16,shade=((row*13+col*7)%4+4)%4;
  c.fillStyle=colors[shade];c.fillRect(px+1,py+1,62,14);c.fillStyle='#e5c78b55';c.fillRect(px+2,py+1,60,1);
  c.fillStyle='#684b3338';c.fillRect(px+8,py+7,26,1);c.fillRect(px+35,py+11,18,1);
  c.fillStyle='#614c35';c.fillRect(px+4,py+5,1,1);c.fillRect(px+59,py+10,1,1);
 }
 for(const r of h.floors||[]){c.strokeStyle='#4b3828';c.lineWidth=8;c.strokeRect(r.x+4,r.y+4,r.w-8,r.h-8);c.strokeStyle='#d1ae73';c.lineWidth=2;c.strokeRect(r.x+9,r.y+9,r.w-18,r.h-18);}
 c.restore();
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
 const horizontal=d.w>d.h,w=d.open?(horizontal?7:48):d.w,h=d.open?(horizontal?48:7):d.h;
 c.save();c.fillStyle='#18212066';c.fillRect(d.x+2,d.y+4,w,h);c.fillStyle='#5d412d';c.fillRect(d.x,d.y,w,h);
 c.fillStyle=d.open?'#b99b64':'#b18a51';c.fillRect(d.x+1,d.y+1,Math.max(1,w-2),Math.max(1,h-2));
 c.fillStyle='#eed39a';c.fillRect(d.x+1,d.y+1,Math.max(1,w-2),2);
 if(!d.open){for(let n=12;n<(horizontal?w:h)-5;n+=12){c.fillStyle='#6c4c30';c.fillRect(d.x+(horizontal?n:2),d.y+(horizontal?3:n),horizontal?1:Math.max(1,w-4),horizontal?Math.max(1,h-5):1);}}
 c.fillStyle='#493d2c';c.fillRect(d.x+(horizontal?w-9:2),d.y+(horizontal?5:h-9),5,5);c.fillStyle='#efd17d';c.fillRect(d.x+(horizontal?w-8:3),d.y+(horizontal?5:h-8),3,3);
 c.restore();
}
