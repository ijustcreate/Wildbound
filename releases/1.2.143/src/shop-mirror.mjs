import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {shopCutawayOpen} from './diagon-shop-rooms.mjs';
import {playerAction,playerFrame} from './player-motion.mjs';

const oppositeTurn=direction=>Number.isFinite(direction)?(direction+4)%8:null;

export function drawShopMirror(c,shop,glass,x,y,g,animator){
 if(!g||!animator)return;
 let viewer=null,closest=Infinity;
 for(const p of g.players){
  const dx=p.x-x,dy=p.y-y;
  if(p.hp<=0||p.room||p.swimming||p.vehicleId||p.trainRide||dy<10||dy>74||Math.abs(dx)>36||!shopCutawayOpen(shop,[p]))continue;
  const distance=Math.hypot(dx,dy);
  if(distance<closest){viewer=p;closest=distance;}
 }
 if(!viewer)return;
 const reflectedX=Math.round(x+(viewer.x-x)*.2);
 const size=PLAYER_RENDER_SIZE*(.91-(viewer.y-y)*.0023);
 const action=playerAction(viewer),frame=playerFrame(viewer,g.time);
 const pose=animator.locomotionHistory?.sample(viewer,g.time,action,frame)||{};
 const actor={...viewer,...pose,id:`shop-mirror:${shop.id}:${viewer.id}`,x:reflectedX,y:y-6,
  faceX:-(viewer.faceX||0),faceY:-(viewer.faceY??1),
  animationAction:action,playerFrame:frame,
  bowVisualAngle:Number.isFinite(viewer.bowVisualAngle)?viewer.bowVisualAngle+Math.PI:viewer.bowVisualAngle,
  locomotionVisualDirection:oppositeTurn(pose.locomotionVisualDirection),
  locomotionHeadDirection:oppositeTurn(pose.locomotionHeadDirection)};
 c.save();c.imageSmoothingEnabled=false;c.beginPath();
 glass.forEach(([gx,gy],i)=>i?c.lineTo(x+gx,y+gy):c.moveTo(x+gx,y+gy));
 c.closePath();c.clip();
 c.save();c.translate(reflectedX*2,0);c.scale(-1,1);
 c.globalAlpha*=.78;c.filter='brightness(.82) saturate(.62)';
 animator.draw(c,actor,g.time,size);
 c.restore();
 c.fillStyle='#739bbc2e';c.fillRect(x-12,y-43,24,42);
 c.restore();
}
