import {drawGameplayTransient} from './gameplay-fx.mjs';
import {drawRoomChocolateFrogs} from './chocolate-frogs.mjs';
import {drawHappySparkles} from './hot-chocolate.mjs';
import {drawMagicBurst} from './magic-bolt-effects.mjs';
// Room positions are local coordinates. Call inside the room camera transform.
export function drawRoomSpellEffects(c,g,room){
  drawRoomChocolateFrogs(c,g,room);
  for(const p of g.players||[])if(p.room===room)drawHappySparkles(c,{...p,x:p.roomX,y:p.roomY-(p.roomJumpHeight||0)},g.time||0);
  c.save();
  for(const fx of g.effects||[]){
    if(fx.room!==room||!(fx.life>0))continue;
    c.globalAlpha=Math.min(1,fx.life*2);c.fillStyle=fx.color||'#75ef93';
    if(fx.gameplayFx)drawGameplayTransient(c,g,fx);
    else if(fx.magicBolt)drawMagicBurst(c,fx);
    else if(fx.text){c.font='bold 10px monospace';c.textAlign='center';c.strokeStyle='#111a20';c.lineWidth=2;c.strokeText(fx.text,fx.x,fx.y-(1-Math.min(1,fx.life))*16);c.fillText(fx.text,fx.x,fx.y-(1-Math.min(1,fx.life))*16);}
  }
  c.restore();
}
