import {drawParticleEffect} from './particles.mjs';

const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};

// Small native pixel-art campsite prop. The animated fire/smoke uses the shared
// particle renderer so it keeps the same crisp, seeded look as forest effects.
export function drawCampfire(c,x,y,time=0,seed=0){
  c.save();c.translate(Math.round(x),Math.round(y));
  c.fillStyle='#15261f88';c.beginPath();c.ellipse(0,7,34,11,0,0,Math.PI*2);c.fill();
  const glow=c.createRadialGradient(0,-8,1,0,-8,58+Math.sin(time*5+seed)*4);glow.addColorStop(0,'#ffb84d66');glow.addColorStop(.42,'#ff79251c');glow.addColorStop(1,'#ff792500');c.fillStyle=glow;c.fillRect(-62,-70,124,92);
  for(const [dx,dy,w,h,shade] of [[-24,2,13,8,'#4c5147'],[-13,7,15,8,'#64685a'],[2,7,15,8,'#4f584c'],[15,1,13,8,'#70715d'],[-19,-4,12,7,'#5b6255'],[8,-4,13,7,'#5e6657']]){
    pixel(c,dx,dy,w,h,'#293b32');pixel(c,dx+1,dy-1,w-2,h-2,shade);
  }
  c.save();c.translate(-2,2);c.rotate(-.22);pixel(c,-19,-2,38,6,'#38251e');pixel(c,-17,-2,34,3,'#9a5b32');pixel(c,-14,-1,7,2,'#c37c42');c.restore();
  c.save();c.translate(2,4);c.rotate(.2);pixel(c,-18,-2,36,6,'#30231f');pixel(c,-16,-2,32,3,'#765039');pixel(c,7,-1,7,2,'#b57542');c.restore();
  pixel(c,-4,-16,8,19,'#4b2e22');pixel(c,-2,-20,4,8,'#8f4d2c');
  drawParticleEffect(c,'campfire-smoke',0,-22,time,seed);
  drawParticleEffect(c,'campfire-flame',0,-15,time,seed+17);
  drawParticleEffect(c,'campfire-embers',0,-16,time,seed+39);
  c.restore();
}

export function drawCampfireLabel(c,x,y,label='CAMPFIRE'){
  c.save();c.textAlign='center';c.font='8px monospace';c.fillStyle='#f0d79a';c.fillText(label,x,y+28);c.restore();
}
