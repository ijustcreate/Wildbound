import {projectPoint,facingIndex} from './player-motion.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
const frames=new Map();export const TSETSE_FRAME_LIMIT=96;
export function drawTsetsePose(c,a,time){
 const d=facingIndex(a.faceX,a.faceY),flap=Math.floor((time*24+(a.id||0)*.19)%4),dead=a.hp<=0,p=v=>projectPoint(v,d);
 const pal={body:'#7396a5',shade:'#3f5665',light:'#b3ccd0',outline:'#253b49'};
 for(const sign of [-1,1]){
  if(!dead){
   const rise=[2,7,1,-4][flap],root=p([sign*3,5,14]),wing=[root,p([sign*15,9,14+rise]),p([sign*25,-1,14+rise]),p([sign*16,-10,12+rise]),p([sign*5,-6,12])];
   pixelPolygon(c,wing,'#536a86');pixelPolygon(c,[root,p([sign*15,8,14+rise]),p([sign*23,-1,14+rise]),p([sign*15,-8,12+rise])],'#64627b');
   pixelLine(c,wing[0],wing[1],'#a0c0d3');pixelLine(c,wing[1],wing[2],'#88b0ca');
   for(let i=1;i<4;i++){const tip=p([sign*(8+i*4),-8+i*2,13+rise]);pixelLine(c,root,tip,'#508786');pixelLine(c,tip,p([sign*(12+i*3),3,14+rise]),'#4d7a82');}
  }
  for(let i=0;i<3;i++){
   const twitch=dead?0:Math.sin(time*8+i+sign)*1.1,root=p([sign*3,5-i*4,10]),knee=p([sign*(8+i),6-i*6+twitch,3]),foot=p([sign*(11+i),10-i*8+twitch,dead?4:-5]);
   pixelLine(c,root,knee,pal.shade,3);pixelLine(c,root,knee,pal.body,2);pixelLine(c,knee,foot,pal.light,2);pixelLine(c,foot,{x:foot.x+sign*3,y:foot.y-2},pal.body);
  }
 }
 pixelVolume(c,[0,-5,11],3.5,11,3,d,pal);
 for(let i=0;i<5;i++){const y=-13+i*4;pixelLine(c,p([-3,y,12]),p([0,y,15]),pal.light);pixelLine(c,p([0,y,15]),p([3,y,12]),pal.shade);}
 pixelVolume(c,[0,5,13],5,6,4,d,pal);
 for(const [x,y]of [[-2,3],[2,4],[-1,7],[2,8]]){const q=p([x,y,17]);c.fillStyle='#b87e91';c.fillRect(Math.round(q.x),Math.round(q.y),1,1);}
 pixelVolume(c,[0,13,10],3.5,4,3,d,pal);
 for(const sign of [-1,1]){const eye=[sign*3,14,12];pixelVolume(c,eye,2,2.5,2,d,{...pal,body:'#9f556f',shade:'#603e59',light:'#d997a2'});}
 const snout=p([0,16,8]),tip=p([0,28,5]);pixelLine(c,snout,tip,pal.shade,2);pixelLine(c,{x:snout.x-1,y:snout.y},tip,pal.light);pixelLine(c,p([-1,15,13]),p([-3,19,15]),pal.body);pixelLine(c,p([1,15,13]),p([3,19,15]),pal.body);
}
export function drawTsetse(c,a,time,size=34){
 const flap=Math.floor((time*24+(a.id||0)*.19)%4),key=[facingIndex(a.faceX,a.faceY),flap,a.hp<=0].join(':');let surface=frames.get(key);
 if(!surface&&globalThis.document){surface=document.createElement('canvas');surface.width=surface.height=80;const cc=surface.getContext('2d');cc.translate(40,40);drawTsetsePose(cc,{...a,id:0},flap/24);if(frames.size>=TSETSE_FRAME_LIMIT)frames.delete(frames.keys().next().value);frames.set(key,surface);}
 const bob=a.hp<=0?0:Math.round(Math.sin(time*6+(a.id||0))*1.5);c.save();c.imageSmoothingEnabled=false;
 if(surface)c.drawImage(surface,Math.round(a.x-size*5/6),Math.round(a.y-size*5/6-16+bob),size*5/3,size*5/3);
 else{c.translate(a.x,a.y-16+bob);c.scale(size/48,size/48);drawTsetsePose(c,a,time);}c.restore();
}
