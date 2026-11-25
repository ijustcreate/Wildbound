import {drawPixelFx,PIXELFX_EFFECTS} from './pixelfx-runtime.mjs';
import {drawEnergyScorch} from './energy-blade-art.mjs';
import {zonkoGroundMarks} from './zonko-consumables.mjs';

const rocket={...PIXELFX_EFFECTS['pfx-explosions-firework-rocket'],pxScale:.44,pxOptions:{
 palette:['#321d2b','#773647','#cf5c3f','#ff9b56','#ffd578','#fff2bc','#ffffff'],
 tips:['#242752','#414989','#7757c8','#b77ffd','#eed3ff','#ffffff'],
}};

export function drawZonkoFirework(c,fx){
 c.save();c.translate(Math.round(fx.x),Math.round(fx.y));
 if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)c.globalAlpha*=.62;
 drawPixelFx(c,rocket,Math.max(0,fx.duration-fx.life),fx.seed,.8);c.restore();
}

export function drawFlamingFootprints(c,g,visible){
 const {flames,scorch}=zonkoGroundMarks(g);
 for(const mark of scorch)if(visible(mark,15))drawEnergyScorch(c,mark,g.time,.44);
 if(!flames.length)return;
 c.save();
 for(const mark of flames){
  if(!visible(mark,24))continue;
  const age=g.time-mark.born,alpha=Math.min(1,(mark.expires-g.time)*1.8),height=5+(Math.floor(age*18+mark.x+mark.y)%4);
  const x=mark.x,y=mark.y,bend=(Math.floor(age*12+mark.x)%3)-1;
  c.globalAlpha=alpha*.48;c.fillStyle='#883c27';c.fillRect(x-4,y-1,8,3);
  c.globalAlpha=alpha;c.fillStyle='#be502f';c.fillRect(x-3,y-height+3,7,height-3);c.fillRect(x+bend-1,y-height,3,4);
  c.fillStyle='#eb8941';c.fillRect(x-2,y-height+4,5,height-4);c.fillRect(x+bend,y-height+1,1,5);
  c.fillStyle='#ffce69';c.fillRect(x-1,y-4,3,3);c.fillRect(x,y-height+3,1,3);
  if(height>6){c.fillStyle='#ffeaa8';c.fillRect(x,y-3,1,2);c.fillRect(x+bend+1,y-height-3,1,1);}
 }
 c.restore();
}
