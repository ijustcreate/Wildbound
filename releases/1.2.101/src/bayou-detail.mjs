// Native pixel geometry shared by the playable bayou and its visual review.
// Static habitat detail is baked once per editable ground chunk; motion is bounded.
import {swampNoise,swampSurface} from './swamp-terrain.mjs';
export const bayouHash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
function poly(c,pts,color){
 for(let y=Math.floor(Math.min(...pts.map(p=>p[1])));y<Math.ceil(Math.max(...pts.map(p=>p[1])));y++){
  const cuts=[];for(let i=0,j=pts.length-1;i<pts.length;j=i++){
   const a=pts[j],b=pts[i];if((a[1]>y+.5)!==(b[1]>y+.5))cuts.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2)r(c,Math.ceil(cuts[i]),y,Math.ceil(cuts[i+1])-Math.ceil(cuts[i]),1,color);
 }
}
function line(c,x,y,xx,yy,color,width=1){const n=Math.ceil(Math.max(Math.abs(xx-x),Math.abs(yy-y)));for(let i=0;i<=n;i++){const t=n?i/n:0;r(c,x+(xx-x)*t,y+(yy-y)*t,width,width,color);}}
function grass(c,x,y,seed,light=false){
 for(let j=-2;j<=2;j++){const h=3+bayouHash(seed,j)*7;poly(c,[[x+j*2,y],[x+j*3-1,y-h],[x+j*2+1,y-3],[x+j*2+1,y]],j%2?(light?'#9da968':'#789451'):'#496c43');}
}
export function drawBayouPlant(c,kind,x,y,seed=0){
 if(kind==='duckweed'){
  for(let i=0;i<15;i++){const a=bayouHash(seed,i)*6.28,d=bayouHash(i,seed+8)*12; r(c,x+Math.cos(a)*d,y+Math.sin(a)*d*.4,2,1,i%3?'#78994f':'#abb56b');}
 }else if(kind==='lily'){
  for(let j=0;j<4;j++){const xx=x+(j%2)*9-5,yy=y+Math.floor(j/2)*4,wide=4+bayouHash(seed,j)*2;
   poly(c,[[xx-wide,yy],[xx-3,yy-3],[xx+3,yy-3],[xx+wide,yy],[xx+2,yy+2],[xx-4,yy+2]],'#244d43');
   poly(c,[[xx-wide+1,yy-1],[xx-2,yy-3],[xx+3,yy-3],[xx+wide-1,yy],[xx+1,yy+1],[xx-3,yy+1]],j%2?'#6f914f':'#8eaa60');
   r(c,xx-3,yy-2,4,1,'#b3bd78');line(c,xx,yy+1,xx+2,yy-1,'#315d53');
  }if(seed%3===0){poly(c,[[x-3,y-4],[x-4,y-7],[x-1,y-6],[x+1,y-9],[x+3,y-6],[x+5,y-7],[x+3,y-3]],'#d6bcbd');r(c,x,y-5,2,2,'#eee0a3');}
 }else if(kind==='fern'){
  for(let j=-2;j<=2;j++){const tx=x+j*5,ty=y-13+Math.abs(j)*2;line(c,x,y,tx,ty,'#a0ad63');for(let k=1;k<5;k++){const t=k/5,bx=x+(tx-x)*t,by=y+(ty-y)*t;poly(c,[[bx,by+1],[bx-5*(1-t),by-3],[bx,by-1],[bx+5*(1-t),by-4]],k%2?'#6f914b':'#93a65c');}}
 }else if(kind==='arrowhead'){
  for(let j=-1;j<=1;j++){const xx=x+j*8,yy=y-12-(j===0?5:0);line(c,x,y,xx,yy,'#64844f');poly(c,[[xx,yy-6],[xx+5,yy+4],[xx,yy+1],[xx-5,yy+4]],'#325e43');poly(c,[[xx,yy-5],[xx,yy+1],[xx-4,yy+3]],'#9aac64');}
 }else if(kind==='iris'){
  grass(c,x,y,seed,true);line(c,x,y,x+1,y-15,'#73915b');poly(c,[[x-3,y-18],[x,y-16],[x+2,y-20],[x+4,y-16],[x+7,y-18],[x+5,y-13],[x,y-12]],'#aa98b0');r(c,x+1,y-15,2,2,'#e1c883');
 }else if(kind==='reeds'){
  for(let j=-2;j<=2;j++){const h=9+bayouHash(seed,j)*13,xx=x+j*3;line(c,xx,y,xx+j,y-h,j%2?'#738c56':'#a1ac68');line(c,xx,y,xx-5,y-h*.65,'#5f834e');if(j%2===0){r(c,xx+j-1,y-h-4,2,5,'#5e4e35');r(c,xx+j-1,y-h-4,1,3,'#a18a57');}}
 }else grass(c,x,y,seed,true);
}
export function paintBayouHabitat(c,lookup,ox,oy){
 const surface=(x,y)=>swampSurface(lookup,ox+x*2,oy+y*2);
 // Uneven exposed bank faces, reeds and roots follow the authoritative wet edge.
 for(let y=2;y<126;y+=2)for(let x=1;x<127;x+=2){
  const s=surface(x,y),below=surface(x,y+2),h=bayouHash(ox+x,oy+y);
  if(s.height>=1.05&&below.height<1.05){r(c,x,y,2,2,'#9a9462');r(c,x,y+2,2,2+h*3,'#3b4d3b');if(h>.7){line(c,x,y+1,x+2,y+6,'#726648');r(c,x,y,1,2,'#b1a16a');}}
 }
 for(let i=0;i<680;i++){
  const x=2+Math.floor(bayouHash(i+ox,oy+31)*124),y=3+Math.floor(bayouHash(i+oy,ox+17)*122),s=surface(x,y),patch=swampNoise((ox+x*2)/65,(oy+y*2)/57),seed=Math.floor(bayouHash(ox+i,oy)*10000);
  if(s.kind==='bridge')continue;
  if(s.height>1.13){
   if(patch>.4&&i%3===0)grass(c,x,y,seed,patch>.65);
   else if(i%4===0){r(c,x,y,2+i%3,1,i%2?'#8e9860':'#445f42');if(i%8===0)r(c,x+2,y+1,2,1,'#a69b66');}
   if(i%57===0&&patch>.52)drawBayouPlant(c,i%2?'fern':'iris',x,y,seed);
   if(i%43===0&&patch<.44){r(c,x-2,y,6,2,'#405b47');r(c,x,y,4,1,'#75917a');}
  }else if(s.height>.65&&s.height<1.12&&i%8===0)drawBayouPlant(c,['arrowhead','reeds','sedge','iris'][Math.floor(i/8)%4],x,y,seed);
  else if(s.height>-.5&&s.height<.6&&patch>.54&&i%13===0)drawBayouPlant(c,i%3?'duckweed':'lily',x,y,seed);
  else if(s.height<-.3&&i%11===0){r(c,x,y,3+seed%6,1,'#376c66');if(i%33===0)r(c,x+2,y+2,3,1,'#4c8173');}
 }
}
// Short planks retain solid physical support even where their visible edges chip.
export function paintBayouBridge(c,x,y,seed){
 r(c,x,y,16,16,'#34463a');
 for(let k=0;k<16;k+=4){const dy=bayouHash(seed,k)>.6?1:0;r(c,x+k,y+dy,3,16-dy,'#8d8156');r(c,x+k,y+dy,1,14-dy,'#b6a775');r(c,x+k+1,y+5+(k%3),2,1,'#5d6243');r(c,x+k+1,y+2,1,1,'#414b38');}
 r(c,x,y+14,16,2,'#596747');r(c,x+1,y+14,4,1,'#84935b');
}
function stone(c,x,y,w,h){
 poly(c,[[x,y],[x+2,y-h],[x+w-3,y-h-1],[x+w,y-2],[x+w-2,y+2],[x+2,y+2]],'#334b47');
 poly(c,[[x+2,y-h],[x+w-3,y-h-1],[x+w-2,y-h+4],[x+3,y-h+5]],'#9aab8d');
 r(c,x+2,y-h+5,w-4,h-5,'#647f70');r(c,x+w-4,y-h+5,2,h-4,'#466459');r(c,x+3,y-1,w-7,2,'#485f4d');r(c,x+3,y-h+1,w*.4,1,'#c0c3a0');
 if(w>12){line(c,x+w*.6,y-h+4,x+w*.47,y-3,'#3a574d');r(c,x+2,y-h+3,5,2,'#7b9554');}
}
export function drawBayouLandmark(c,p,time=0){
 if(!['bayou_shrine','bayou_ruin','bayou_snag','bayou_landing'].includes(p.kind))return false;
 const y=p.rootY??p.y,scale=p.size/128;c.save();c.translate(Math.round(p.x),Math.round(y));c.scale(scale,scale);
 if(p.kind==='bayou_snag'){
  poly(c,[[-23,2],[-8,-12],[-6,-47],[-15,-63],[-12,-68],[-1,-53],[2,-89],[7,-96],[10,-85],[6,-66],[20,-77],[23,-74],[9,-56],[8,-20],[23,2],[7,-3],[1,-17],[-7,2]],'#293d36');
  poly(c,[[-15,0],[-4,-14],[-3,-49],[-10,-62],[-1,-51],[5,-88],[6,-67],[4,-25],[10,-7],[16,0],[4,-5],[0,-24],[-5,-8]],'#837858');line(c,-5,-4,-1,-39,'#b4a274',2);r(c,0,-47,4,8,'#1a322e');
  for(let i=0;i<4;i++){r(c,5+i*3,-20+i*2,6,2,'#a7a37b');r(c,7+i*3,-18+i*2,3,1,'#566b48');}
 }else if(p.kind==='bayou_landing'){
  r(c,-37,-6,74,9,'#283f36');for(let x=-36;x<36;x+=6){r(c,x,-13+(x%4?0:1),5,14,'#938358');r(c,x,-13,2,12,'#baaa76');r(c,x+2,-7,2,1,'#555e40');}
  for(const x of [-37,34]){r(c,x,-22,4,27,'#49563c');r(c,x-1,-23,6,3,'#c0ad7b');r(c,x+1,-2,2,6,'#6e844e');}line(c,-35,-17,35,-15,'#b0a078');
 }else{
  // Broken stair apron and offset blocks: an inhabited place reclaimed by water.
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)if((row+col)%5!==0)stone(c,-36+col*18+row*2,8+row*6,17,5);
  if(p.kind==='bayou_ruin'){
   for(let row=0;row<4;row++){stone(c,-28,-row*12,23,12);if(row<2)stone(c,16,-row*12,20,12);}stone(c,-31,-48,29,7);stone(c,19,6,19,9);drawBayouPlant(c,'fern',-29,8,13);
  }else{
   for(const x of [-35,21]){for(let row=0;row<5;row++)stone(c,x,-row*12,17,12);stone(c,x-3,-60,23,7);}
   stone(c,-39,-67,79,12);stone(c,-32,-79,65,9);stone(c,-21,-88,43,10);
   poly(c,[[-17,-3],[-17,-48],[-10,-58],[7,-58],[16,-48],[16,-3]],'#1c3935');
   stone(c,-12,-10,24,16);stone(c,-15,-26,30,5);r(c,-5,-32,10,5,'#557d6b');r(c,-2,-33,4,3,'#acd4a4');
   // Carved eye, fissures and creeping vines echo the supplied ruined gateways.
   poly(c,[[-10,-71],[-4,-76],[5,-76],[12,-71],[5,-67],[-4,-67]],'#486a5e');r(c,-2,-74,4,5,'#b4bf92');
   for(let j=0;j<7;j++){r(c,-29+j%2*2,-61+j*6,3,4,'#5f8149');r(c,28-j%3,-77+j*5,3,3,'#87a15b');}
   for(const x of [-27,29]){r(c,x-3,-20,6,10,'#354a39');r(c,x-2,-19,4,5,Math.sin(time*3+x)>.2?'#efd18b':'#c5b16b');r(c,x-4,-22,8,2,'#99a17a');}
  }
  drawBayouPlant(c,'sedge',30,15,81);drawBayouPlant(c,'iris',-40,12,61);
 }c.restore();return true;
}
export function makeBayouLandmarkSprite(kind){
 const s={width:128,height:128,anchorY:100/128,nativeBayouLandmark:true,palette:['transparent'],pixels:Array(16384).fill(0),footprint:Array(16384).fill(0),occludes:true};
 let t={x:0,y:0,s:1};const stack=[];
 const c={fillStyle:'',save(){stack.push({...t});},restore(){t=stack.pop();},translate(x,y){t.x+=x*t.s;t.y+=y*t.s;},scale(x){t.s*=x;},fillRect(x,y,w,h){
  let v=s.palette.indexOf(this.fillStyle);if(v<0){v=s.palette.length;s.palette.push(this.fillStyle);}
  const left=Math.round(t.x+x*t.s),top=Math.round(t.y+y*t.s),right=Math.round(t.x+(x+w)*t.s),bottom=Math.round(t.y+(y+h)*t.s);
  for(let yy=Math.max(0,top);yy<Math.min(128,bottom);yy++)for(let xx=Math.max(0,left);xx<Math.min(128,right);xx++)s.pixels[yy*128+xx]=v;
 }};
 drawBayouLandmark(c,{kind,x:64,rootY:100,size:128});return s;
}
export function drawBayouWaterMotion(c,g,bounds,at=(x,y)=>g.terrain?.[y*50+x]){
 const time=g.time||0;
 for(let ty=bounds.sy;ty<=bounds.ey;ty++)for(let tx=bounds.sx;tx<=bounds.ex;tx++){
  const tile=at(tx,ty);if(tile!=='water'&&tile!=='shallow')continue;
  const h=bayouHash(tx,ty),x=tx*32+6+h*14,y=ty*32+12+bayouHash(ty,tx)*12,phase=time*.6+h*6.28;
  if(h>.54){const shift=Math.round(Math.sin(phase)*2);r(c,x+shift,y,4+h*8,1,'#67958266');if(h>.87)r(c,x+3-shift,y+3,4,1,'#9bbaa155');}
  if(h>.985){const t=(time*.24+h)%1;c.strokeStyle=`rgba(150,185,150,${(1-t)*.32})`;c.lineWidth=1;c.beginPath();c.ellipse(x,y,2+t*9,1+t*3,0,0,6.29);c.stroke();}
 }
 // Sparse broken root reflections. No readbacks or mirrored canopy covering actors.
 for(const p of g.scenery||[]){if(!['old_cypress','mangrove','bayou_snag'].includes(p.kind)||p.fallen||p.depleted)continue;const y=p.rootY??p.y;
  if(p.x<bounds.sx*32-80||p.x>bounds.ex*32+80||y<bounds.sy*32-100||y>bounds.ey*32+30)continue;
  for(let j=0;j<11;j++){const yy=y+8+j*3,xx=p.x+Math.round(Math.sin(time+j*.8)*2);if(swampSurface(at,xx,yy).height<.7)r(c,xx-4-j*.3,yy,8+j*.6,1,'#173d3690');}
 }
}
