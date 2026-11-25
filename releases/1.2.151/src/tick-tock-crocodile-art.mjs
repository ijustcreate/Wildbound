import {TICK_TOCK_SCALE} from './tick-tock-crocodile.mjs';

export function drawTickTockCrocodile(c,animator,a,time,size){
 const {x,y}=a,dx=a.faceX||0,dy=a.faceY||0,wake=a.state==='charge'?1:a.moving?.65:.3;
 c.save();c.globalAlpha*=.4*wake;
 for(const side of [-1,1])for(let i=0;i<13;i++){
  const flow=(time*.8+i*.071)%1,back=16+i*9+flow*7,spread=12+i*2.2;
  const px=Math.round(x-dx*back-dy*spread*side),py=Math.round(y-dy*back+dx*spread*side*.65);
  c.fillStyle=i%4===0?'#bcebc6':'#6cbea8';
  c.fillRect(px,py,Math.max(2,8-Math.floor(i*.4)),i%3?2:3);
 }
 c.restore();
 animator.draw(c,a,time,size*TICK_TOCK_SCALE);
}
