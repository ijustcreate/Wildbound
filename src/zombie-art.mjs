const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawZombieFace(c,p,d,a,time){
 if(d>=3&&d<=5)return;
 const h=p.head,profile=d===2||d===6,turn=d===0?0:d<4?-1:1,dead=a.hp<=0;
 const socket='#364037',cheek='#7d896a',litSkin='#aeb892',mouth='#30332c',tooth='#d8c9a3';
 const cheekX=h.x+(turn<0?2:-4);
 pixel(c,cheekX,h.y-1,2,1,litSkin);
 pixel(c,cheekX+Number(turn<0),h.y,1,2,cheek);
 for(const side of ['L','R']){
  if(profile&&(d===2?side!=='R':side!=='L'))continue;
  const eye=p['eye'+side],lowerLid=side==='L'?cheek:litSkin;
  pixel(c,eye.x-1,eye.y-1,3,2,socket);
  pixel(c,eye.x-1,eye.y+1,2,1,lowerLid);
  pixel(c,eye.x,eye.y,1,1,dead?'#68775e':'#e4de8c');
 }
 const nose=p.nose;
 pixel(c,nose.x,nose.y,1,1,litSkin);
 pixel(c,nose.x+(profile?turn:1),nose.y+1,1,1,socket);
 const x=p.mouth.x-(profile?Number(turn<0):2),y=p.mouth.y+1;
 if(a.zombieVariant==='broken_jaw'){
  const wag=dead||a.frozen>0?0:Math.round(Math.sin(time*2));
  const width=profile?3:5,jawX=x+(turn||1);
  pixel(c,x,y-1,width,3,mouth);
  pixel(c,jawX,y+2+wag,width-1,2,socket);
  pixel(c,jawX,y+2+wag,width-1,1,cheek);
  pixel(c,x+1,y-1,1,1,tooth);
  if(!profile)pixel(c,x+3,y,1,1,tooth);
 }else{
  pixel(c,x,y,profile?2:5,1,mouth);
  if(!profile)pixel(c,x+1,y+1,3,1,socket);
  pixel(c,x+1,y,1,1,tooth);
 }
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
