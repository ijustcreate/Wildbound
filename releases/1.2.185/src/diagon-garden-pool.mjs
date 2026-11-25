import {block as b,shape,line} from './diagon-shop-brush.mjs';
import {GARDEN_POOL as pool,GARDEN_POOL_WATER as water} from './diagon-garden-layout.mjs';
const edge=(angle,rx,ry,dy=0)=>[pool.x+Math.cos(angle)*rx,pool.y+Math.sin(angle)*ry+dy];
const points=(rx,ry,dy=0)=>Array.from({length:32},(_,i)=>edge(i*Math.PI/16,rx,ry,dy));
const edging=['#7b8078','#96988a','#a9aa95','#838c83','#8b9185','#afb09a'];
const width=136,height=80,left=pool.x-width/2,top=pool.y-height/2;
let scene;

function surface(w,h){
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 return {canvas,c:canvas.getContext('2d')};
}

export function paintGardenPoolStone(c){
 shape(c,'#243c32aa',points(pool.rx+10,pool.ry+9,7));
 shape(c,'#454f49',points(pool.rx,pool.ry,5));
 shape(c,'#666c60',points(pool.rx,pool.ry,2));
 shape(c,'#828a80',points(pool.rx,pool.ry));
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12+.013,z=(i+1)*Math.PI/12-.017;
  const face=[edge(a,pool.rx-1,pool.ry-1),edge(z,pool.rx-1,pool.ry-1),edge(z,water.rx+3,water.ry+3),edge(a,water.rx+3,water.ry+3)];
  shape(c,edging[(i*13+(i>>2))%edging.length],face);
  if(i>10)line(c,'#c4bfa6',...face[0],...face[1],1);
  if(i%5===2)line(c,'#6b7768',...edge(a+.06,pool.rx-4,pool.ry-4),...edge(a+.1,water.rx+5,water.ry+5),1);
 }
 shape(c,'#465f5e',points(water.rx+2,water.ry+2));
 shape(c,'#192e39',points(water.rx,water.ry));
}

function clipSurface(c){c.beginPath();c.ellipse(pool.x,pool.y,water.rx,water.ry,0,0,Math.PI*2);c.clip();}

function paintStillWater(c){
 const colors=['#346e72','#2b606a','#255460','#234956','#214651','#264f59','#2a5d64'];
 for(let row=0;row<Math.ceil(water.ry);row++){
  const f=row/water.ry,y=pool.y-water.ry+row*2;
  b(c,pool.x-water.rx,y,water.rx*2,2,colors[Math.min(colors.length-1,Math.floor((f+Math.sin(f*10)*.03)*colors.length))]);
 }
}

function reflections(c,time,donors){
 for(const {x,y,half=48,depth=105,paint} of donors){
  if(x+half<left||x-half>left+width||y>pool.y+water.ry||y+depth*.67<top)continue;
  const scale=-.67;
  c.save();c.beginPath();c.rect(x-half,y,half*2,depth*.67);c.clip();
  c.translate(0,y*(1-scale));c.scale(1,scale);
  paint(c,time);c.restore();
 }
}

function paintEdgeRipples(c,time){
 // Short offset crests follow the rim. Their fade finishes in the outer 8 px.
 for(let i=0;i<13;i++){
  const phase=(time*(.39+i%3*.07)+i*.381)%1;
  const arc=i*Math.PI*2/13+Math.sin(time*.4+i)*.07,length=.15+i%4*.045;
  const dx=1.5+phase*7,dy=1+phase*5;
  c.globalAlpha=Math.sin(phase*Math.PI)*(.28+(i%4)*.08);
  for(let j=0;j<6;j++){
   const a=arc+(j-2.5)*length/5;
   const [x,y]=edge(a,water.rx-dx,water.ry-dy);
   b(c,x,y,j%2?2:3,1,i%4===0?'#b1d8b5':'#7bb4a8');
  }
 }
}

export function drawGardenPool(c,time,donors,owner){
 if(typeof document==='undefined'&&typeof OffscreenCanvas==='undefined')return;
 scene??={source:surface(width,height),water:surface(width,height),frame:-1,donors:0};
 const frame=Math.floor(time*20);
 if(frame!==scene.frame||scene.owner!==owner){
  const mirror=scene.source.c;
  mirror.setTransform(1,0,0,1,-left,-top);mirror.clearRect(left,top,width,height);
  reflections(mirror,frame/20,donors);
  const pen=scene.water.c;pen.setTransform(1,0,0,1,-left,-top);pen.clearRect(left,top,width,height);
  pen.save();clipSurface(pen);paintStillWater(pen);
  pen.imageSmoothingEnabled=false;
  // Like the shoreline renderer, offset horizontal bands from the real mirrored art.
  for(let row=0;row<height;row+=2){
   const shift=Math.round(Math.sin(row*.29+time*2.4)+Math.sin(row*.11-time)*.7);
   pen.globalAlpha=.40+Math.sin(row*.53+time*2)*.10;
   pen.drawImage(scene.source.canvas,0,row,width,2,left+shift,top+row,width,2);
  }
  pen.globalAlpha=.14;b(pen,left,top,width,height,'#347f86');
  paintEdgeRipples(pen,frame/20);
  pen.restore();scene.frame=frame;scene.owner=owner;
 }
 c.drawImage(scene.water.canvas,left,top);
}
