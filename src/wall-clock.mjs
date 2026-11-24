import { pixelLine } from './pixel-shapes.mjs';

export const CLOCK_FACE_SIZE = 16;

// Wall plates cannot straddle a window, doorway, or the end of a panel.
export function findClockWall(walls,x,y,{maxDistance=56,accepts=()=>true}={}){
 const clearance=CLOCK_FACE_SIZE/2+5;
 let mount=null,distance=maxDistance;
 for(const wall of walls||[]){
  if((wall.kind&&wall.kind!=='wall')||wall.w<=wall.h||wall.w<clearance*2)continue;
  const anchor=Math.max(wall.x+clearance,Math.min(wall.x+wall.w-clearance,x));
  if(!accepts(wall,anchor))continue;
  const offset=Math.hypot(x-anchor,y-(wall.y+wall.h/2));
  if(offset<=distance){mount={wall,x:anchor};distance=offset;}
 }
 return mount;
}

export function houseClockMount(h,f){
 if(!h?.floors?.length)return null;
 return findClockWall(h.walls,f.x+f.w/2,f.y+f.h/2,{
  accepts(wall,x){
   const y=wall.y+wall.h+2;
   return h.floors.some(floor=>x>=floor.x&&x<floor.x+floor.w&&y>=floor.y&&y<floor.y+floor.h);
  },
 });
}

// Local computer time, shared by the house and station.
export function localClockAngles(date=new Date()){
 return {hour:((date.getHours()%12)+date.getMinutes()/60)*Math.PI/6,minute:(date.getMinutes()+date.getSeconds()/60)*Math.PI/30,second:date.getSeconds()*Math.PI/30};
}

const faceRadius=size=>Math.max(5,Math.min(CLOCK_FACE_SIZE/2,Math.round(size/2)));

export function drawWallClock(c,x,y,size=CLOCK_FACE_SIZE,date=new Date()){
 const r=faceRadius(size);
 const angles=localClockAngles(date);
 c.save();c.translate(Math.round(x),Math.round(y));
 const circle=(radius,color,dx=0,dy=0)=>{
  c.fillStyle=color;
  for(let yy=-radius;yy<=radius;yy++){
   const width=Math.floor(Math.sqrt(radius*radius-yy*yy));
   c.fillRect(dx-width,dy+yy,width*2+1,1);
  }
 };
 circle(r+1,'#273a365a',2,2);
 circle(r+1,'#3d4235');
 circle(r,'#aa8857');
 circle(r-2,'#eddcb5');
 circle(r-3,'#ddc798');
 c.fillStyle='#736550';
 for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]])c.fillRect(dx*(r-3),dy*(r-3),1,1);
 const hand=(angle,length,color,width)=>pixelLine(c,{x:0,y:0},{
  x:Math.round(Math.sin(angle)*length),y:Math.round(-Math.cos(angle)*length),
 },color,width);
 hand(angles.hour,r*.38,'#3b493f',2);
 hand(angles.minute,r*.58,'#3b493f',1);
 hand(angles.second,r*.63,'#a55a43',1);
 c.fillStyle='#aa8857';c.fillRect(0,0,1,1);
 c.restore();
}

export function drawMountedClock(c,x,y,size=CLOCK_FACE_SIZE){
 const cap=Math.round(y)-faceRadius(size);
 c.fillStyle='#504638';c.fillRect(Math.round(x)-2,cap-4,5,5);
 c.fillStyle='#ae9461';c.fillRect(Math.round(x),cap-3,1,2);
 drawWallClock(c,x,y,size);
}

export function drawPostClock(c,x,y,size=CLOCK_FACE_SIZE){
 const column=Math.round(x), foot=Math.round(y), face=foot-37;
 c.fillStyle='#27383166';c.fillRect(column-6,foot-1,16,3);
 c.fillStyle='#34463c';c.fillRect(column-5,foot-4,11,4);c.fillRect(column-2,face+5,5,foot-face-7);
 c.fillStyle='#758274';c.fillRect(column-4,foot-4,8,1);c.fillRect(column-1,face+6,1,foot-face-10);
 c.fillStyle='#b19361';c.fillRect(column-3,face+8,7,2);
 drawWallClock(c,column,face,size);
}
