import {drawParticleEffect} from './particles.mjs';

const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};

// Small native pixel-art campsite prop. The animated fire/smoke uses the shared
// particle renderer so it keeps the same crisp, seeded look as forest effects.
export function drawCampfire(c,x,y,time=0,seed=0){
  c.save();c.translate(Math.round(x),Math.round(y));
  c.fillStyle='#15261f88';c.beginPath();c.ellipse(0,7,34,11,0,0,Math.PI*2);c.fill();
  for(const [dx,dy,w,h,shade] of [[-24,2,13,8,'#4c5147'],[-13,7,15,8,'#64685a'],[2,7,15,8,'#4f584c'],[15,1,13,8,'#70715d'],[-19,-4,12,7,'#5b6255'],[8,-4,13,7,'#5e6657']]){
    pixel(c,dx,dy,w,h,'#293b32');pixel(c,dx+1,dy-1,w-2,h-2,shade);
  }
  pixel(c,-18,-1,36,5,'#3c2922');pixel(c,-15,-3,30,4,'#77452d');
  pixel(c,-15,3,30,5,'#2e2824');pixel(c,-12,2,24,3,'#9a5b32');
  pixel(c,-3,-15,7,18,'#4b2e22');pixel(c,-1,-20,3,7,'#8f4d2c');
  drawParticleEffect(c,'campfire-smoke',0,-22,time,seed);
  drawParticleEffect(c,'campfire-flame',0,-15,time,seed+17);
  c.restore();
}

export function drawCampfireLabel(c,x,y,label='CAMPFIRE'){
  c.save();c.textAlign='center';c.font='8px monospace';c.fillStyle='#f0d79a';c.fillText(label,x,y+28);c.restore();
}
