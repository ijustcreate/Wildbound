import {bowHandleWorld,wandTipWorld,heldItemWorld} from './player-motion.mjs';
import {PLAYER_RENDER_SIZE,LOBBY_PLAYER_SIZE} from './render-settings.mjs';
export const rangedRenderSize=g=>g.generatedEnvironment==='lobby'?LOBBY_PLAYER_SIZE:PLAYER_RENDER_SIZE;
// One visual anchor and its collision-plane lift for both guides and launches.
export function rangedLaunchOrigin(actor,time,kind,{slot='hand1',size=PLAYER_RENDER_SIZE,charge=actor.charge??0}={}){
 const ready=kind==='bow'?{...actor,attack:0,charge,bowAiming:true}:actor;
 const tip=kind==='bow'?bowHandleWorld(ready,time,undefined,size):kind==='boomerang'?heldItemWorld({...actor,attack:0,bowAiming:true},slot,time,undefined,size):wandTipWorld(ready,slot,time,undefined,size);
 const z=kind==='bow'?18:16;
 return {x:tip.x,y:tip.y+z,z};
}
