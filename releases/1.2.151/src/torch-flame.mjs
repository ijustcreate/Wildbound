import {drawParticleEffect,effects} from './particles.mjs';
// Keep the real fixture/held torch; the imported effect supplies only flame, smoke and embers.
export function drawTorchFlame(c,x,y,time,seed=0){
 const e=effects.torch;drawParticleEffect(c,'torch',x,y+(e.pixelfx==='fire/torch'?16*e.pxScale:0),time,seed);
}
