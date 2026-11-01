export const isUndergroundRoom=(game,room)=>!!room&&!!game?.portals?.some(d=>d.id===room&&d.oldWell);

// Short, damped reflections leave attacks and footsteps clear. One shared
// bounded graph handles every underground SFX voice; music/UI remain dry.
export function createUndergroundReverb(ctx,bus){
 const send=ctx.createGain(),delay=ctx.createDelay(.25),filter=ctx.createBiquadFilter(),feedback=ctx.createGain();
 send.gain.value=.18;delay.delayTime.value=.065;filter.type='lowpass';filter.frequency.value=2600;filter.Q.value=.3;feedback.gain.value=.28;
 send.connect(delay);delay.connect(filter);filter.connect(bus);filter.connect(feedback);feedback.connect(delay);
 return {input:send,dispose(){for(const n of [send,delay,filter,feedback])n.disconnect();}};
}
