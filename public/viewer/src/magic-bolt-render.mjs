import {ellipse} from './player-motion.mjs';
import {particleSprite} from './particle-sprites.mjs';
import {drawFriendshipHeart} from './friendship-hearts.mjs';
export const magicBoltGlow=def=>def?.friendship ? .04 : ({common:.055,rare:.11,unique:.16,legendary:.21,gm:.12}[def?.rarity]??.055);
// A saturated core carries the wand's actual colour. Restrained source-over
// halos cannot add up to a white blob where several trails overlap.
export function drawMagicBolt(ctx,bolt){
 const size=Math.max(2,Math.min(18,bolt.size||6)),color=bolt.color||'#90baff',age=Math.max(0,bolt.age??1);
 const alpha=Math.min(1,Math.max(0,bolt.remaining??40)/40,Math.max(0,bolt.life??1)/.15);
 if(!alpha)return;
 const radius=Math.max(2,size*.36),vx=bolt.vx||0,vy=bolt.vy||0,x=bolt.x,y=bolt.y-16;
 ctx.save();ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='source-over';
 const base=ctx.globalAlpha,glow=Math.max(0,Math.min(.22,bolt.glow??.055)),orb=particleSprite('orb',color);
 if(orb&&ctx.drawImage&&glow){ctx.globalAlpha=base*glow;ctx.drawImage(orb,x-radius*2,y-radius*2,radius*4,radius*4);}
 const count=bolt.friendship?3:4;
 for(let i=count;i>=1;i--){
  const t=Math.min(age,i*.019),px=x-vx*t,py=y-vy*t,r=Math.max(.7,radius*(1-i/(count+2)));
  ctx.globalAlpha=base*(1-i/(count+1))*.7;
  if(bolt.friendship)drawFriendshipHeart(ctx,px,py+Math.sin(age*12-i)*2,Math.max(4,size*.6-i));
  else ellipse(ctx,px,py,r,r*.7,color);
 }
 ctx.globalAlpha=base;
 if(bolt.friendship)drawFriendshipHeart(ctx,x,y,Math.max(11,size*1.15));
 else{
  ellipse(ctx,x,y,radius+1,radius+1,'#283044');
  ellipse(ctx,x,y,radius,radius,color);
  ctx.globalAlpha=base*.35;ellipse(ctx,x-radius*.3,y-radius*.3,Math.max(.6,radius*.2),Math.max(.6,radius*.2),color);
 }
 ctx.restore();
}
