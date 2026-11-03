import {trainWorld} from './train-track.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {actorRadius,flies} from './navigation.mjs';
import {stationaryCreature} from './stationary-creatures.mjs';
import {hunterPets} from './hunter-pets.mjs';
import {damageStructureVehicle} from './structure-destruction.mjs';
import {harvest} from './environment.mjs';
export function trainFrontContact(previous,current,target,radius=8){
 const a=trainWorld(previous,previous.length/2+12,0),b=trainWorld(current,current.length/2+12,0),travel=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(travel/6)),turn=Math.atan2(Math.sin(current.a-previous.a),Math.cos(current.a-previous.a));
 for(let i=0;i<=steps;i++){const f=i/steps,angle=previous.a+turn*f,x=target.x-(a.x+(b.x-a.x)*f),y=target.y-(a.y+(b.y-a.y)*f),forward=Math.cos(angle)*x+Math.sin(angle)*y,side=-Math.sin(angle)*x+Math.cos(angle)*y;if(forward>=-6-radius&&forward<=6+radius&&Math.abs(side)<=current.width*.46+radius)return true;}return false;
}
export function tickTrainImpacts(g,previous,current){
 const t=g.trainTest;if(t.speed<14)return;t.impactCooldown??=new Map();const owner=g.players.find(p=>p.id===t.driver)||g.players[0],amount=5+t.speed*.12+t.speed*t.speed*.002,nose=trainWorld(current,current.length/2+12,0),fx=Math.cos(current.a),fy=Math.sin(current.a);
 const actors=new Set([...g.players,...g.enemies,...(g.ghosts||[]),...(g.villageFollowers||[]),...hunterPets(g)]);
 for(const actor of actors){if(actor.hp<=0||actor.room||actor.trainRide||actor.underBridge||current.z>0&&actor.swimming||flies(actor))continue;const feet=(actor.jumpHeight||0)+(actor.groundHeight||0)+(actor.trainGround||0);if(feet>current.z+64||feet+35<current.z+5||t.time<(t.impactCooldown.get(actor)||0)||!trainFrontContact(previous,current,actor,actorRadius(actor)))continue;t.impactCooldown.set(actor,t.time+.7);if(g.players.includes(actor))g.hurt(actor,amount,{...nose,kind:'train',hostile:true});else damageEnemy(actor,amount,'physical',{g,p:owner});if(!stationaryCreature(actor)&&actor.hp>0){const push=Math.min(80,20+t.speed*.2);g.moveActor(actor,fx*push-fy*18,fy*push+fx*18);actor.stun=Math.max(actor.stun||0,.2);}g.effects.push({x:actor.x,y:actor.y-20,text:'TRAIN HIT',color:'#ffd58a',life:.6});g.onSound?.('carHit',nose);}
 if(t.time>=(t.nextSceneryImpact||0)){const bumper={...nose,faceX:fx,faceY:fy};damageStructureVehicle(g,bumper,t.speed,current.width*.46);const scenery=(g.scenery||[]).filter(o=>!o.depleted&&!o.falling&&trainFrontContact(previous,current,{x:o.x,y:o.rootY??o.y},Math.max(6,(o.size||40)*.1)));if(scenery.length){const view=Object.create(g);view.scenery=scenery;harvest(view,{...owner,x:nose.x-fx*20,y:nose.y-fy*20-14,faceX:fx,faceY:fy},amount,80);}t.nextSceneryImpact=t.time+.18;}
 for(const [actor,until]of t.impactCooldown)if(t.time>until+.7)t.impactCooldown.delete(actor);
}
