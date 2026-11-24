export const RETURNED_HEART_GLOW_SECONDS=60;

export function tickReturnedHeartGlow(p,dt){
 if(!(p.field?.returnedHeartGlow>0))return;
 const remaining=p.field.returnedHeartGlow-dt;
 if(remaining>1e-8)p.field.returnedHeartGlow=remaining;
 else delete p.field.returnedHeartGlow;
}

export function drawReturnedHeartGlow(c,actor,time,x,y,size,layer){
 const remaining=actor.field?.returnedHeartGlow;
 if(actor.hp<=0||!(remaining>0))return;
 const elapsed=RETURNED_HEART_GLOW_SECONDS-remaining;
 const scale=size/43,fade=Math.min(1,remaining*2),opening=Math.max(0,1-elapsed/1.7);
 c.save();
 c.translate(Math.round(x),Math.round(y));
 const alpha=c.globalAlpha;
 if(layer==='back'){
  c.globalAlpha*=fade*(.27+opening*.42);
  c.strokeStyle='#ffd693';c.lineWidth=1.3;
  c.beginPath();c.ellipse(0,-2,scale*(13+opening*5),scale*5,0,0,Math.PI*2);c.stroke();
 }else{
  const count=5+Math.round(opening*9);
  for(let i=0;i<count;i++){
   const phase=(time*(.81+i%3*.17)+i*.382)%1,angle=i*2.39996+time*1.7;
   const spread=scale*(12+phase*6+opening*(i+3));
   const x=Math.round(Math.cos(angle)*spread),y=Math.round(-scale*(7+i%4*7)-phase*(9+opening*12)),w=i%3===0?2:1;
   c.globalAlpha=alpha*fade*Math.sin(Math.PI*phase)*(.69+opening*.26);
   c.fillStyle=i%3===1?'#f69aa8':'#ffdda5';c.fillRect(x-w,y,2*w+1,1);c.fillRect(x,y-w,1,2*w+1);
   c.fillStyle='#fff4d1';c.fillRect(x,y,1,1);
  }
 }
 c.restore();
}
