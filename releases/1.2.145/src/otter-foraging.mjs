// Saved actor fields resume a dive after reload without duplicating finds.
export const OTTER_FORAGE_STAGES=Object.freeze([{action:'dive',duration:.9},{action:'underwater',duration:2.4},{action:'surface',duration:.9},{action:'roll',duration:1},{action:'belly_float',duration:6},{action:'eat',duration:2.4},{action:'return',duration:1}]);
export function resetOtterForage(e){delete e.otterForage;delete e.otterFind;delete e.otterDiveDepth;delete e.otterAnimationProgress;if(['dive','underwater','surface','roll','belly_float','eat','return'].includes(e.animationAction))e.animationAction=null;}
export function tickOtterForage(e,dt,{threatened=false}={}){
 if(e.kind!=='river_otter')return false;
 if(!e.swimming||e.hp<=0||threatened){resetOtterForage(e);return false;}
 if(e.frozen>0||e.state==='snared')return !!e.otterForage?.stage;
 const f=e.otterForage??={stage:0,age:0,wait:8+(Number(e.id)||0)%5*2};
 let remaining=Math.max(0,Math.min(dt,1));
 if(!f.stage){f.wait-=remaining;if(f.wait>0)return false;remaining=Math.max(0,-f.wait);f.stage=1;f.age=0;}
 while(remaining>0&&f.stage){const spec=OTTER_FORAGE_STAGES[f.stage-1],step=Math.min(remaining,spec.duration-f.age);f.age+=step;remaining-=step;if(f.age>=spec.duration-1e-8){f.stage++;f.age=0;if(f.stage>OTTER_FORAGE_STAGES.length){f.stage=0;f.wait=12+(Number(e.id)||0)%7;delete e.otterFind;break;}}}
 if(!f.stage){e.animationAction='swim';delete e.otterAnimationProgress;e.otterDiveDepth=0;return false;}
 const spec=OTTER_FORAGE_STAGES[f.stage-1],progress=f.age/spec.duration;e.animationAction=spec.action;e.moving=false;
 if(['underwater','belly_float','eat'].includes(spec.action))delete e.otterAnimationProgress;else e.otterAnimationProgress=progress;
 e.otterDiveDepth=spec.action==='dive'?progress:spec.action==='underwater'?1:spec.action==='surface'?1-progress:0;
 if(f.stage>=3&&f.stage<7)e.otterFind='clam';else delete e.otterFind;
 return true;
}
