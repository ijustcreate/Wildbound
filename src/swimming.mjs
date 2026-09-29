import {waterAt} from './environment.mjs';
export const BREATH_SECONDS=20;
export function inDeepWater(g,p){return !p.room&&waterAt(g,p.x,p.y)==='water';}
export function tickSwimming(g,p,input,dt){
 const deep=inDeepWater(g,p),airborne=(p.jumpHeight||0)>0||(p.groundHeight||0)>0;
 const wasSwimming=!!p.swimming;p.swimming=deep&&!airborne&&p.hp>0;
 p.breath=Number.isFinite(p.breath)?p.breath:BREATH_SECONDS;
 if(p.swimming&&!wasSwimming){
  g.effects||=[];g.effects.push({particle:'splash',x:p.x,y:p.y,life:.8,duration:.8,seed:p.id||0});
  g.onSound?.('splash',p);
 }
 if(p.swimming){
  p.groundHeight=0;p.charge=0;p.attack=0;delete p.queuedAttack;
  const dive=!!input.attack&&!p.ui&&!p.consumeInput;
  p.diveDepth=Math.max(0,Math.min(1,(p.diveDepth||0)+(dive?.6:-.85)*dt));
 }else p.diveDepth=0;
 const underwater=(p.swimming&&p.diveDepth>.12)||!!p.quicksandUnder;
 if(underwater){
  const before=p.breath;p.breath=Math.max(0,p.breath-dt);p.breathVisible=1;
  if(p.breath===0){
   p.drownClock=(p.drownClock||0)+Math.max(0,dt-before);
   while(p.drownClock>=1){p.drownClock-=1;p.hp=Math.max(0,p.hp-(p.maxHp||100)*.25);p.hit=.15;}
  }
 }else{
  p.drownClock=0;p.breath=Math.min(BREATH_SECONDS,p.breath+dt*16);
  p.breathVisible=p.breath<BREATH_SECONDS?1:Math.max(0,(p.breathVisible||0)-dt*3);
 }
 p.waterEmit=Math.max(0,(p.waterEmit||0)-dt);
 if(p.swimming&&p.waterEmit===0&&(underwater||p.moving)){
  p.waterEmit=underwater?.28:.13;g.effects||=[];
  g.effects.push({particle:underwater?'bubbles':'swim-wake',x:p.x-(p.faceX||0)*9,y:p.y-(p.faceY||1)*5,life:.65,duration:.65,seed:p.id||0});
 }
}
