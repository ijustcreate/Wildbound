import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultNativePlayerMotion,playerPose} from '../src/player-motion.mjs';
import {addCarSeats} from '../src/car-clips.mjs';
import {carOccupantActor,carCabinWindows} from '../src/car-interior.mjs';
import {drawWeather} from '../src/hazards.mjs';

test('car occupants sit on bent knees with fixed limb lengths and driver hands at the wheel',()=>{
 const model=defaultNativePlayerMotion(),rest=model.joints;
 for(const seat of ['driver','front','rear-left','rear-right']){
  const actor=carOccupantActor({vehicleSeat:seat,equipment:{},hp:100},{heading:0}),pose=playerPose(actor,0,model);
  assert.equal(actor.animationAction,seat==='driver'?'car_drive':'car_sit');
  for(const side of ['L','R']){
   const hip=pose['hip'+side],knee=pose['knee'+side],foot=pose['foot'+side];
   assert.ok(knee[1]-hip[1]>4);assert.ok(knee[2]-foot[2]>4);
   for(const [a,b]of [['hip','knee'],['knee','foot'],['shoulder','elbow'],['elbow','hand']]){
    const length=(x,y)=>Math.hypot(...x.map((v,i)=>v-y[i]));
    assert.ok(Math.abs(length(pose[a+side],pose[b+side])-length(rest[a+side].position,rest[b+side].position))<1e-4);
   }
   if(seat==='driver'){assert.ok(Math.abs(pose['hand'+side][1]-7)<.1);assert.ok(Math.abs(pose['hand'+side][2]-(pose.pelvis[2]+7))<.1);}
  }
 }
});

test('car seating registration preserves edited clips and all side panes share the cabin bounds',()=>{
 const model=defaultNativePlayerMotion();model.clips.car_drive.keys[0].joints.handL=[1,2,3];const before=structuredClone(model.clips);addCarSeats(model);assert.deepEqual(model.clips,before);
 for(const [heading,id]of [[Math.PI/2,'right'],[3*Math.PI/2,'left']]){
  const windows=carCabinWindows({w:80,h:128,heading});assert.deepEqual(windows.map(w=>w.id),['front','rear',id]);
  for(const window of windows)for(const point of window.corners)assert.ok(point.every(Number.isFinite));
 }
});

function snowCanvas(){const flakes=[];return {flakes,save(){},restore(){},fillText(){},fillRect(...args){flakes.push(args);}};}
test('snow level has gentle moving snowfall without requiring or changing a hazard',()=>{
 const g={generatedEnvironment:'ice',time:0,weather:null,snowDepth:0},c=snowCanvas();drawWeather(c,g,640,480);
 assert.equal(c.flakes.length,85);const first=c.flakes[0];g.time=1;const next=snowCanvas();drawWeather(next,g,640,480);assert.notDeepEqual(first,next.flakes[0]);assert.equal(g.weather,null);assert.equal(g.snowDepth,0);
 for(const env of ['forest','house','desert']){const c=snowCanvas();drawWeather(c,{...g,generatedEnvironment:env},640,480);assert.equal(c.flakes.length,0);}
 const storm=snowCanvas();drawWeather(storm,{...g,weather:{type:'blizzard',life:30,intensity:1}},640,480);assert.equal(storm.flakes.length,142);
});
