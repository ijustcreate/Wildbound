import {drawFriendshipHeart} from './friendship-hearts.mjs';
export function finishMagicBolt(g,bolt,hit=false){
 if(bolt.finished)return;bolt.finished=true;
 const duration=hit?.32:.4;
 g.effects.push({magicBolt:true,hit,friendship:!!bolt.friendship,x:bolt.x,y:bolt.y-16,room:bolt.room||null,color:bolt.color||'#ace3ff',life:duration,duration});
}
export function drawMagicBurst(c,fx){
 if(fx.healingRise){drawHealingRise(c,fx);return;}
 const t=Math.max(0,Math.min(1,1-fx.life/fx.duration)),count=fx.hit?13:7;
 c.save();c.globalAlpha*=1-t;c.globalCompositeOperation='source-over';
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count,reach=(fx.hit?24:12)*t*(.7+(i%3)*.18);
  const x=fx.x+Math.cos(a)*reach,y=fx.y+Math.sin(a)*reach-(fx.hit?0:t*9);
  if(fx.friendship){if(i<3)drawFriendshipHeart(c,x,y-t*8,8*(1-t*.4));continue;}
  const size=t>.7?1:i%3===0?3:2;c.fillStyle=fx.color;
  c.fillRect(Math.round(x/size)*size,Math.round(y/size)*size,size,size);
  if(fx.hit&&t<.5&&i%2===0)c.fillRect(Math.round((x+Math.cos(a)*3)/2)*2,Math.round((y+Math.sin(a)*3)/2)*2,2,2);
 }
 c.restore();
}

export function drawHealingRise(c,fx){
 const t=Math.max(0,Math.min(1,1-fx.life/fx.duration));
 c.save();c.globalAlpha*=1-t;c.globalCompositeOperation='source-over';
 for(let i=0;i<14;i++){
  const size=t>.65?1:2,x=fx.x+((i*17)%23)-11+Math.sin(i+t*3)*2;
  const y=fx.y-((i*7)%19)-t*(19+(i%4)*4);
  c.fillStyle=i%4===0?'#dcf5ff':fx.color;
  c.fillRect(Math.round(x),Math.round(y),size,size);
 }
 c.restore();
}
