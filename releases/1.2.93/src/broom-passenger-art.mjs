import {registerBroomPassengerPainter} from './player-motion.mjs';
import {BROOM_SEAT_DROP,broomPoint} from './broom-art.mjs';
import {drawFireflyRig} from './firefly-motion.mjs';
import {drawLivingAnimal} from './living-ecosystem.mjs';import {drawGraveyardCritter} from './graveyard-art.mjs';
export function broomPassengerSeat(points,d){const q=broomPoint(d,-26);return {x:points.pelvis.x+q.x,y:points.pelvis.y+BROOM_SEAT_DROP+q.y-2};}
export function drawBroomPassenger(c,actor,points,d,time){if(!actor.broomMount||!actor.broomPet)return;const seat=broomPassengerSeat(points,d),a={...actor.broomPet,x:seat.x,y:seat.y,faceX:actor.faceX,faceY:actor.faceY,broomPerched:true,hopHeight:0,swimming:false,phase:actor.broomPet.phase||0};c.save();if(a.kind==='marsh_firefly'){c.translate(a.x,a.y);drawFireflyRig(c,a,time);c.restore();return;}
 const flip=[1,2,3].includes(d)&&['white_mouse','scavenger','bird'].includes(a.kind);if(flip){c.translate(seat.x*2,0);c.scale(-1,1);}if(!drawGraveyardCritter(c,a,time))drawLivingAnimal(c,a,time);c.restore();}
registerBroomPassengerPainter(drawBroomPassenger);
