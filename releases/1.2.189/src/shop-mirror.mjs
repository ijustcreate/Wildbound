import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {shopCutawayOpen} from './diagon-shop-rooms.mjs';
import {drawPlayer,playerAction,playerFrame,playerMotion,playerPose} from './player-motion.mjs';
import {SKELETON_EQUIPMENT} from './skeleton-equipment.mjs';
import {block as pixel} from './diagon-shop-brush.mjs';

const oppositeTurn=direction=>Number.isFinite(direction)?(direction+4)%8:null;

function clipGlass(c,glass,x,y){
 c.beginPath();
 glass.forEach(([gx,gy],i)=>i?c.lineTo(x+gx,y+gy):c.moveTo(x+gx,y+gy));
 c.closePath();c.clip();
}

export function drawShopMirror(c,shop,glass,x,y,g,animator,options){
 if(!g||!animator)return;
 let viewer=options?.viewer||null,closest=Infinity;
 if(!options)for(const p of g.players){
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
 const actor={...viewer,...pose,id:`shop-mirror:${shop.id}:${viewer.id}`,x:reflectedX,y:y-(options?.footOffset??6),
  faceX:-(viewer.faceX||0),faceY:-(viewer.faceY??1),
  animationAction:action,playerFrame:frame,
  bowVisualAngle:Number.isFinite(viewer.bowVisualAngle)?viewer.bowVisualAngle+Math.PI:viewer.bowVisualAngle,
  locomotionVisualDirection:oppositeTurn(pose.locomotionVisualDirection),
  locomotionHeadDirection:oppositeTurn(pose.locomotionHeadDirection)};
 c.save();c.imageSmoothingEnabled=false;clipGlass(c,glass,x,y);
 c.save();c.translate(reflectedX*2,0);c.scale(-1,1);
 c.globalAlpha*=.78;c.filter='brightness(.82) saturate(.62)';
 if(options?.skeletal){
  const scale=size/48,model=playerMotion;
  const exact=playerPose({...viewer,...pose,animationAction:action,playerFrame:frame},g.time,model);
  const bones={...actor,equipment:SKELETON_EQUIPMENT,field:{...actor.field,cosmetics:{}},
   broomMount:null,heldChickenId:null,mirrorHeartVisible:options.heart};
  c.translate(actor.x,actor.y);c.scale(scale,scale);
  drawPlayer(c,bones,g.time,model,exact);
 }else animator.draw(c,actor,g.time,size);
 c.restore();
 c.fillStyle='#739bbc2e';c.fillRect(x-12,y-43,24,42);
 c.restore();
}

export function drawBorginMirror(c,shop,glass,x,y,g,animator,view){
 if(!view||!animator)return;
 const {viewer,skeletal,heart,progress,emergence}=view;
 if(emergence==null||emergence>=1){
  if(viewer)drawShopMirror(c,shop,glass,x,y,g,animator,{viewer,skeletal,heart,footOffset:30});
  if(skeletal&&progress>.4){
   c.save();clipGlass(c,glass,x,y);
   for(let i=0;i<5;i++){
    const pulse=(g.time*.7+i*.29)%1;
    if(pulse<progress)pixel(c,x-10+((i*13)%19),y-32-pulse*32,1+(i%3===0),1,pulse>.46?'#c6838b':'#9d6e8390');
   }
   c.restore();
  }
  return;
 }
 const eased=emergence*emergence*(3-2*emergence);
 const groundY=Math.round(y-30+eased*65);
 c.save();c.imageSmoothingEnabled=false;
 if(emergence<.25)clipGlass(c,glass,x,y);
 c.globalAlpha*=.58+.42*emergence;
 animator.draw(c,{id:`borgin-emergence:${shop.id}`,kind:'skeleton_unarmed',sprite:'skeleton_unarmed',hp:1,
  x,y:groundY,faceX:0,faceY:1,animationAction:'walk',
  playerFrame:emergence*15,mirrorHeartVisible:heart},g.time,PLAYER_RENDER_SIZE*(.85+emergence*.15));
 c.restore();
 for(let i=0;i<6;i++){
  const shimmer=(g.time*3+i*.43)%1,spread=5+12*eased;
  if(shimmer<.7)pixel(c,x+Math.sin(i*3.2+shimmer)*spread,groundY-18-shimmer*19,2,1,'#9bb8adbb');
 }
}
