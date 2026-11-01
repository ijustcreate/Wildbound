import {projectPoint,facingIndex} from './player-motion.mjs';
const frames=new Map();
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function line(c,a,b,color,width=1){const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=steps;i++)rect(c,a.x+(b.x-a.x)*i/Math.max(1,steps),a.y+(b.y-a.y)*i/Math.max(1,steps),width,width,color);}
function volume(c,d,center,rx,ry,rz,stripes=false){
 const a=d*Math.PI/4,co=Math.cos(a),si=Math.sin(a),anchor=projectPoint(center,d),lim=Math.ceil(Math.max(rx,ry)+rz+2);
 for(let sy=-lim;sy<=lim;sy++)for(let sx=-lim;sx<=lim;sx++){
  const bx=sx*co,by=-sx*si,bz=-sy,A=si*si/rx**2+co*co/ry**2+.25/rz**2,B=2*(bx*si/rx**2+by*co/ry**2+bz*.5/rz**2),C=bx**2/rx**2+by**2/ry**2+bz**2/rz**2-1,disc=B*B-4*A*C;if(disc<0)continue;
  const depth=(-B+Math.sqrt(disc))/(2*A),x=bx+si*depth,y=by+co*depth,z=bz+.5*depth;
  const dark=stripes&&Math.floor((y+ry)/3)%2===0,light=(-x/rx-y/ry+z/rz*2.5)/3;
  const color=Math.sqrt(disc)/A<1.3?'#2b2528':dark?light>.3?'#4a4243':'#24242a':light>.55?'#f7d884':light>.0?'#dba64c':'#9c672f';
  rect(c,anchor.x+sx,anchor.y+sy,1,1,color);
 }
}
export function drawBeePose(c,actor,time){
 const d=facingIndex(actor.faceX,actor.faceY),flap=Math.floor((time*24+(actor.id||0)*.17)%4),dead=actor.hp<=0,sting=actor.attack>0||actor.state==='sting';
 const p=v=>projectPoint(v,d);
 // Wing pairs sit behind the fuzzy thorax; four silhouettes beat at 24 Hz.
 if(!dead)for(const side of [-1,1])for(let wing=0;wing<2;wing++){
  const span=[9,13,10,5][flap],root=p([side*3,wing?0:5,12]),tip=p([side*span,wing?-6:9,12+[3,5,1,-1][flap]]);
  c.save();c.globalAlpha*=.8;line(c,{x:root.x,y:root.y-1},{x:tip.x,y:tip.y-1},'#abc6c5',4);line(c,root,tip,'#dfe9d6',2);line(c,{x:root.x+side,y:root.y},{x:tip.x,y:tip.y},'#6d9295');c.restore();
 }
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const swing=dead?2:Math.sin(time*8+i*1.7+side)*1,root=p([side*4,5-i*4,7]),knee=p([side*7,5-i*5+swing,4]),foot=p([side*(dead?5:9),6-i*6+swing,dead?4:2]);line(c,root,knee,'#3c3030',2);line(c,knee,foot,'#665142');
 }
 volume(c,d,[0,-4,sting?7:9],6.5,9,4.5,true);volume(c,d,[0,6,10],5.5,5,4);
 const head=p([0,12,9]);volume(c,d,[0,12,9],4,3.5,3);
 for(const side of [-1,1]){
  const eye=p([side*2.5,14,10]);rect(c,eye.x,eye.y,2,2,'#24252a');if(d!==4)rect(c,eye.x,eye.y,1,1,'#e9f0d4');
  const base=p([side*2,14,10]),tip=p([side*5,19,11+(dead?-3:Math.sin(time*4+side))]);line(c,base,tip,'#39302c');rect(c,tip.x,tip.y,2,1,'#9c672f');
 }
 const tail=p([0,-12,7]),tip=p([0,-16,sting?2:6]);line(c,tail,tip,'#33282a',sting?2:1);
 // Tiny chitin/fur highlights, never a luminous or translucent body.
 const collar=p([-2,6,14]);rect(c,collar.x,collar.y,3,1,'#f3d892');
}
export function drawBee(c,a,time,size=34){
 const d=facingIndex(a.faceX,a.faceY),flap=Math.floor((time*24+(a.id||0)*.17)%4),sting=a.attack>0||a.state==='sting',dead=a.hp<=0,key=[d,flap,sting,dead].join(':');let image=frames.get(key);
 if(!image&&globalThis.document){image=document.createElement('canvas');image.width=image.height=64;const ctx=image.getContext('2d');ctx.translate(32,32);drawBeePose(ctx,{...a,id:0},flap/24);if(frames.size>=128)frames.delete(frames.keys().next().value);frames.set(key,image);}
 const bob=dead?0:Math.round(Math.sin(time*7+(a.id||0))*1.5);
 c.save();c.imageSmoothingEnabled=false;
 if(image)c.drawImage(image,Math.round(a.x-size*2/3),Math.round(a.y-size*2/3-8+bob),size*4/3,size*4/3);
 else {c.translate(a.x,a.y-8+bob);c.scale(size/48,size/48);drawBeePose(c,a,time);}
 c.restore();
}
export function drawBeeHive(c,a,time,size=48){
 c.save();c.translate(Math.round(a.x),Math.round(a.y-(a.hp>0?a.hiveLift||0:0)));c.scale(size/48,size/48);
 // Woven hanging-skep silhouette, with a small support rather than a sign.
 if(!(a.hiveLift>0)||a.hp<=0){rect(c,-18,-2,36,4,'#7e653f');rect(c,-11,-7,22,6,'#6e5439');}
 else{rect(c,-1,-52,2,13,'#876842');rect(c,0,-51,1,12,'#c1a56d');rect(c,-12,-52,24,3,'#635441');rect(c,-10,-52,20,1,'#a3915f');}
 if(a.hp<=0){for(let i=0;i<9;i++){const x=-19+(i*11)%37,y=-3-(i%3)*3;rect(c,x,y,6,3,i%2?'#c7974e':'#8c642f');rect(c,x+1,y-1,4,1,'#e2bc76');}c.restore();return;}
 const bands=[[8,-38,6],[13,-32,6],[17,-26,6],[20,-20,6],[21,-14,6],[19,-8,5]];
 for(const [w,y,h]of bands){rect(c,-w,y,w*2,h,'#a57537');rect(c,-w+2,y,w*2-4,2,'#e4bc76');rect(c,-w+1,y+2,w,2,'#c99b54');rect(c,w-5,y+3,4,h-3,'#805b32');for(let x=-w+5;x<w-5;x+=7)rect(c,x,y+2,1,2,'#b78a46');}
 rect(c,-7,-14,14,10,'#583d29');rect(c,-5,-14,10,9,'#292826');rect(c,-7,-5,14,2,'#e1b26b');rect(c,5,-11,1,3,'#aa7c40');
 rect(c,-2,-42,4,5,'#715035');rect(c,-1,-42,1,4,'#d2ae72');
 if(a.flash>0){c.globalAlpha*=.35;rect(c,-15,-30,28,23,'#fff0bb');}
 c.restore();
}
