import {ellipse} from './player-motion.mjs';
// Shared by the expedition and lobby: identical core, sparks and age-limited trail.
export function drawMagicBolt(ctx,bolt){
 const size=bolt.size||6,color=bolt.color||'#ace3ff',age=bolt.age??1;
 ctx.save();
 ctx.globalAlpha*=Math.min(1,Math.max(0,bolt.remaining??40)/40,Math.max(0,bolt.life??1)/.15);
 if(bolt.fire||bolt.water){
  for(let i=3;i>=0;i--)ellipse(ctx,bolt.x-bolt.vx*Math.min(age,i*.012),bolt.y-16-bolt.vy*Math.min(age,i*.012),Math.max(1,size*.7-i),Math.max(1,size*.7-i),bolt.water?(i>1?'#237e9b':'#55d5db'):(i>1?'#bb3928':'#ff782b'));
  ellipse(ctx,bolt.x,bolt.y-16,size*.4,size*.4,bolt.water?'#d8ffff':'#ffd654');
  ellipse(ctx,bolt.x+1,bolt.y-17,size*.18,size*.18,'#fff3b0');
 }else{
  ctx.fillStyle=color;ctx.fillRect(Math.round(bolt.x-size/2),Math.round(bolt.y-16-size/2),size,size);
  ctx.fillStyle='#f2efff';ctx.fillRect(Math.round(bolt.x)-1,Math.round(bolt.y)-17,2,2);
  ctx.fillStyle=color;ctx.fillRect(Math.round(bolt.x-bolt.vx*Math.min(age,.03))-1,Math.round(bolt.y-bolt.vy*Math.min(age,.03))-17,2,2);
 }
 ctx.restore();
}
