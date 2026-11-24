export const CRAB_PINCER_PHASES=Object.freeze({
 windup:{clip:'raise-claws',duration:.48},
 attack:{clip:'pinch',duration:.16},
 recover:{clip:'recover',duration:.65},
});

export function stopCrabPincer(actor){
 const phase=CRAB_PINCER_PHASES[actor.wildlifeBehaviorPhase];
 delete actor.wildlifeBehaviorPhase;
 delete actor.wildlifeBehaviorTime;
 if(phase?.clip===actor.animationAction)delete actor.animationAction;
 if(phase)actor.state='hunt';
}
