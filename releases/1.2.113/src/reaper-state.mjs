export const REAPER_DRAIN_SECONDS=5;
export const REAPER_DRAIN_COOLDOWN=18;
export function interruptReaper(e){
 if(e?.kind!=='grim_reaper'||!e.reaperDrain)return false;
 delete e.reaperDrain;e.reaperCooldown=Math.max(e.reaperCooldown||0,REAPER_DRAIN_COOLDOWN);
 e.reaperRecovery=.6;e.animationAction='hurt';e.poseTime=0;e.state='recover';return true;
}
