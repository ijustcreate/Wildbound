import {tickSwimming} from './swimming.mjs';
export const CONTROLLED_WATER_FIELDS=['swimming','diveDepth','breath','breathVisible','drownClock','waterEmit','underBridge','wasWaterAirborne','groundHeight'];
export function tickControlledWater(game,owner,actor,input,dt){
 // The owner is an input/position proxy during control. Keep drowning damage
 // and the air reservoir on the active creature, never the following hero.
 const swimmer={...actor,x:owner.x,y:owner.y,room:owner.room,ui:owner.ui,consumeInput:owner.consumeInput,moving:owner.moving};
 tickSwimming(game,swimmer,input,dt);
 for(const key of CONTROLLED_WATER_FIELDS){actor[key]=swimmer[key];owner[key]=swimmer[key];}
 actor.hp=swimmer.hp;actor.hit=swimmer.hit;
 if(actor.hp<=0)actor.defeated=true;
}
