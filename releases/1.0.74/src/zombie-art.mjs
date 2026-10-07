const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawZombieFace(c,p,d,a,time){
 if(d>=3&&d<=5)return;const h=p.head,profile=d===2||d===6,turn=d===2?-1:1,dead=a.hp<=0;
 for(const side of ['L','R'])if(!profile||(d===2?side==='R':side==='L')){
  const eye=p['eye'+side];pixel(c,eye.x-1,eye.y-1,3,3,'#384441');pixel(c,eye.x,eye.y,1,dead?1:2,dead?'#667466':'#d9dd88');
 }
 pixel(c,h.x+(d===2?-2:2),h.y+1,2,2,'#6b7662');
 const x=p.mouth.x-(profile?0:2),y=p.mouth.y;
 if(a.zombieVariant==='broken_jaw'){
  const wag=dead||a.frozen>0?0:Math.floor(Math.sin(time*2)*.9);
  pixel(c,x,y-1,profile?3:5,4,'#303a36');pixel(c,x+(profile?turn:1),y+3+wag,profile?3:5,2,'#637361');
  pixel(c,x+1,y,1,1,'#d9ceb0');pixel(c,x+3,y+1,1,1,'#d9ceb0');pixel(c,x+2,y+3+wag,2,1,'#a7ac87');
 }else{pixel(c,x,y,profile?2:4,2,'#38433d');pixel(c,x+1,y,1,1,'#d9ceb0');if(!profile)pixel(c,x+3,y,1,1,'#d9ceb0');}
}
export function drawZombieClaws(c,hand,d){
 const turn=d===2?-1:d===6?1:0;
 for(let n=0;n<3;n++)pixel(c,hand.x-2+n*2+turn,hand.y+1+n%2,1,3,'#d4c8a6');
}
export function drawZombieRags(c,p,d){
 const x=p.chest.x,y=p.chest.y,back=d>=3&&d<=5;
 pixel(c,x-3,y+2,3,3,'#83917b');pixel(c,x-2,y+3,2,2,'#586856');pixel(c,x+3,y+4,2,5,'#302e3e');
 pixel(c,p.pelvis.x-4,p.pelvis.y+2,2,4,'#74785c');pixel(c,p.pelvis.x+2,p.pelvis.y+1,3,2,'#47423d');
 if(back){pixel(c,x-1,y-2,4,2,'#727467');pixel(c,x+2,y,1,4,'#b3aa8c');}
}
