import {limb,ellipse} from './player-motion.mjs';

// Bones follow the same animated attachment points as the living humanoid.
// Paired forearm/shin bones and open rib gaps distinguish this from a grey body.
function bone(c,a,b,p,width=2){
 limb(c,a,b,width+1,p.outline);limb(c,a,b,width,p.headShade);
 limb(c,{x:a.x-.4,y:a.y-.4},{x:b.x-.4,y:b.y-.4},Math.max(.7,width-.7),p.head);
 for(const q of [a,b])ellipse(c,q.x,q.y,width/2+.3,width/2,p.head);
}
function paired(c,a,b,p){
 const length=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/length*.7,ny=(b.x-a.x)/length*.7;
 for(const s of [-1,1])bone(c,{x:a.x+nx*s,y:a.y+ny*s},{x:b.x+nx*s,y:b.y+ny*s},p,1);
}
export function drawSkeletonLimb(c,p,side,pal,leg=false){
 const [a,b,end]=leg?['hip','knee','foot']:['shoulder','elbow','hand'];
 bone(c,p[a+side],p[b+side],pal,leg?2.3:2);paired(c,p[b+side],p[end+side],pal);
 if(!leg){const q=p[end+side];ellipse(c,q.x,q.y,1.6,1.5,pal.headShade);c.fillStyle=pal.head;c.fillRect(Math.round(q.x)-1,Math.round(q.y)-1,2,2);}
 return true;
}
export function drawSkeletonTorso(c,p,d,pal){
 bone(c,p.pelvis,p.chest,pal,1.7);bone(c,p.chest,{x:p.head.x,y:p.head.y+3.5},pal,1.5);
 const point=(t,x)=>({x:p.chest.x+(p.pelvis.x-p.chest.x)*t+x,y:p.chest.y+(p.pelvis.y-p.chest.y)*t});
 const width=d===2||d===6?2.6:4.3;
 for(let i=0;i<4;i++){
  const t=.12+i*.17,w=width*(1-i*.1);
  for(const s of [-1,1]){
   const a=point(t,s*.6),b=point(t+.06,s*w),end=point(t+.17,s*(w-.8));
   bone(c,a,b,pal,1);bone(c,b,end,pal,1);
  }
 }
 for(const s of [-1,1])bone(c,p.chest,p['shoulder'+(s<0?'L':'R')],pal,1.4);
 bone(c,p.hipL,p.hipR,pal,2);
 for(const side of ['L','R']){
  const h=p['hip'+side],edge={x:h.x+(side==='L'?-1.3:1.3),y:h.y-1.5};
  bone(c,p.pelvis,edge,pal,1.8);bone(c,edge,h,pal,1.8);
 }
}
export function drawSkeletonSkull(c,p,d,pal,visible,scale=1){
 const h=p.head;c.save();c.translate(h.x,h.y);c.scale(scale,scale);c.translate(-h.x,-h.y);
 const points=scale===1?p:Object.fromEntries(Object.entries(p).map(([key,v])=>[key,{...v,x:h.x+(v.x-h.x)/scale,y:h.y+(v.y-h.y)/scale}]));
 try{return paintSkeletonSkull(c,points,d,pal,visible);}finally{c.restore();}
}
function paintSkeletonSkull(c,p,d,pal,visible){
 const h=p.head,profile=d===2||d===6,back=d>=3&&d<=5;
 const rect=(x,y,w,height,color)=>{c.fillStyle=color;c.fillRect(Math.round(h.x+x),Math.round(h.y+y),w,height);};
 const width=profile?6.3:7.6,ink='#302b29',cream='#f5ebd1',shadow='#aaa38e';
 ellipse(c,h.x,h.y-1,width+.7,7.5,ink);
 ellipse(c,h.x,h.y-1.2,width,6.8,shadow);
 ellipse(c,h.x-.8,h.y-1.8,width-1,6,cream);
 ellipse(c,h.x-2,h.y-3,width-3,3.6,'#fff7e0');
 if(back){rect(-3,3,6,2,shadow);return;}
 // Cheek pads and three little teeth finish a fitted skeletal jaw.
 rect(-4,3,8,3,ink);rect(-3,3,6,3,cream);rect(-2,6,4,1,shadow);
 for(const name of ['eyeL','eyeR'])if(visible(name)){
  const q=p[name],x=Math.round(Math.max(h.x-width+2,Math.min(h.x+width-2,q.x))),y=Math.round(q.y);
  c.fillStyle='#262523';
  // Separate round-ended socket clusters; no brow bar joining the eyes.
  c.fillRect(x-1,y-1,3,1);c.fillRect(x-2,y,4,3);c.fillRect(x-1,y+3,3,1);
  c.fillStyle=shadow;c.fillRect(x-1,y+3,1,1);
 }
 if(visible('nose')){const q=p.nose;c.fillStyle=ink;c.fillRect(Math.round(q.x)-.5,Math.round(q.y),1.5,1);}
 rect(-2,4,4,1,shadow);
 for(const x of [-2,0,2])rect(x,4,1,2,cream);
}

// Broad, readable witch-hat silhouette for the wizard study. The stepped
// crown bends toward the facing in profile; rear views keep the brim closed.
export function drawSkeletonWizardHat(c,h,d){
 const px=(x,y,w,color)=>{c.fillStyle=color;c.fillRect(Math.round(h.x+x),Math.round(h.y+y),w,1);};
 const ink='#211e2b',shade='#382b43',body='#51405e',light='#9a7daf',teal='#54d8c8';
 const profile=d===2||d===6,sign=d===2?-1:1;
 if(profile){
  px(-sign*8,-8,16,ink);px(-sign*7,-7,14,shade);
  px(-sign*7,-10,9,body);px(-sign*6,-12,8,body);px(-sign*4,-14,7,shade);px(-sign*1,-16,6,shade);px(sign*3,-18,4,ink);
  px(sign*4,-18,2,light);px(-sign*6,-12,4,light);px(-sign*7,-7,9,light);
  px(-sign*9,-6,18,ink);px(-sign*8,-6,15,teal);
 }else{
  px(-8,-9,16,ink);px(-7,-8,14,shade);
  px(-4,-10,9,body);px(-6,-11,13,body);px(-7,-12,14,shade);px(-6,-13,12,shade);px(-5,-14,9,body);px(-4,-15,6,body);px(-3,-16,3,light);
  px(-9,-7,18,ink);px(-8,-7,16,teal);px(-7,-8,10,light);
  if(d===4){px(-6,-9,12,shade);px(-5,-12,9,body);}
 }
}
