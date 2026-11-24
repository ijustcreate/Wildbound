import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterTrainTest,tickTrainTest,tryBoardTrain,trainInteriorBlocked,trainWorldBlocked} from '../src/train-test.mjs';
import {trainCars,trainLocal,trainWorld} from '../src/train-track.mjs';
import {trainSideDoorway,trainSideDoorSpans,trainSideWallHeight} from '../src/train-design.mjs';
import {BROOM_HOVER_HEIGHT,useBroom} from '../src/broom-mount.mjs';
const fixture=(car=3,x=0,side=1)=>{const g=new Game(()=>.5);g.addPlayer('keyboard');g.phase='play';enterTrainTest(g);const t=g.trainTest,p=g.players[0];t.design.interiors[t.design.cars[car].id]=[];const c=trainCars(t)[car];p.trainRide={car,x,y:side*(c.width/2-9)};return{g,t,p,c};};
test('standing against or jumping into full-height coach walls never ejects the rider, parked or moving in eight views',()=>{for(const moving of[false,true])for(let facing=0;facing<8;facing++)for(const side of[-1,1]){const {g,t,p,c}=fixture();t.distance=t.route.length*facing/8;t.engine=moving;t.speed=moving?100:0;t.throttle=moving?.6:0;p.trainRide.y=side*(c.width/2-9);for(let i=0;i<100;i++){const current=trainCars(t)[3];tickTrainTest(g,.025,{keyboard:{x:-Math.sin(current.a)*side,y:Math.cos(current.a)*side,jump:i%24<8}});assert.equal(p.trainRide?.car,3);assert.ok(Math.abs(p.trainRide.y)<=c.width/2-7+.001);}}});
test('approaching a doorway inside the floor does not eject until the actor walks across its outer boundary',()=>{const {g,t,p,c}=fixture(3,-142);p.trainRide.y=c.width/2-18;const input={x:-Math.sin(c.a),y:Math.cos(c.a)};tickTrainTest(g,.025,{keyboard:input});assert.ok(p.trainRide,'the old inset trigger must stay on board');for(let i=0;i<30&&p.trainRide;i++)tickTrainTest(g,.025,{keyboard:input});assert.equal(p.trainRide,undefined);assert.ok(p.trainBoardAfter>t.time);});
test('jump boarding cannot pass through a solid side wall but works through a visible doorway',()=>{const {g,t,p,c}=fixture();delete p.trainRide;Object.assign(p,trainWorld(c,0,c.width/2+5));p.jumpHeight=25;assert.equal(tryBoardTrain(g,p),false);Object.assign(p,trainWorld(c,-c.length/2+17,c.width/2+5));assert.equal(tryBoardTrain(g,p),true);});
test('doorway collision excludes frames and all car side apertures use the same shared spans',()=>{const {t,c}=fixture();for(const span of trainSideDoorSpans(c)){assert.equal(trainSideDoorway(c,(span.min+span.max)/2),true);assert.equal(trainSideDoorway(c,span.min+2),false);}assert.equal(trainInteriorBlocked(t,c,0,c.width/2),true);assert.equal(trainInteriorBlocked(t,c,-142,c.width/2),false);});
test('low tender rails allow a deliberate jump off after the feet clear their real height',()=>{const {g,t,p,c}=fixture(1,0);p.jumpHeight=18;p.jumpVelocity=60;const input={x:-Math.sin(c.a),y:Math.cos(c.a),jump:true};for(let i=0;i<10&&p.trainRide;i++)tickTrainTest(g,.025,{keyboard:input});assert.equal(p.trainRide,undefined);});

test('a mounted broom boards and exits a coach aperture without swapping its inventory item',()=>{
 for(const moving of [false,true]){
  const {g,t,p,c}=fixture();delete p.trainRide;g.openingBoard=false;
  g.enemies=[];t.design.nativeForest=false;t.design.scenery=[];
  const [span]=trainSideDoorSpans(c),doorX=(span.min+span.max)/2;
  Object.assign(p,trainWorld(c,doorX,c.width/2+23));
  p.inventory=[{type:'firebolt',qty:1}];assert.ok(useBroom(g,p,0));
  const mount=p.broomMount,item=p.inventory[0];p.jumpHeight=BROOM_HOVER_HEIGHT;
  t.engine=moving;t.speed=moving?32:0;t.throttle=moving?.35:0;
  const input=(sign,car)=>({x:-Math.sin(car.a)*sign,y:Math.cos(car.a)*sign});
  for(let frame=0;frame<35&&!p.trainRide;frame++){
   const coach=trainCars(t)[c.index];
   const local=trainLocal(coach,p);
   const lead=local.x<doorX-3? .45:0;
   const movement=input(-1,coach);
   movement.x+=Math.cos(coach.a)*lead;movement.y+=Math.sin(coach.a)*lead;
   tickTrainTest(g,.025,{keyboard:movement});
  }
  assert.equal(p.trainRide?.car,c.index);
  assert.equal(p.broomMount,mount);assert.equal(p.inventory[0],item);
  assert.equal(p.jumpHeight,10);
  for(let frame=0;frame<25&&p.trainRide;frame++){
   const coach=trainCars(t)[c.index];tickTrainTest(g,.025,{keyboard:input(1,coach)});
  }
  assert.equal(p.trainRide,undefined);assert.equal(p.broomMount,mount);assert.equal(p.inventory[0],item);
  assert.ok(p.trainBoardAfter>t.time);
 }
});

test('side and end panels block actors at carriage height and allow overflight',()=>{
 const {g,t,p,c}=fixture();delete p.trainRide;
 g.enemies=[];t.design.nativeForest=false;t.design.scenery=[];g.openingBoard=false;
 const side=trainWorld(c,0,c.width/2-2),end=trainWorld(c,c.length/2-2,0);
 const roof=20+c.z+trainSideWallHeight(c);
 for(const target of [side,end]){
  const outside=trainWorld(c,0,c.width/2+30);Object.assign(p,outside,{swimming:false,underBridge:false,trainGround:0});
  for(const elevation of [0,24,roof-1])assert.equal(trainWorldBlocked(g,target.x,target.y,7,false,true,elevation,false,p),true);
  assert.equal(trainWorldBlocked(g,target.x,target.y,7,false,true,roof+12,false,p),false);
 }
 Object.assign(p,side,{jumpHeight:roof+12,broomMount:{item:{type:'flying_broom',qty:1},time:0}});
 assert.equal(tryBoardTrain(g,p),false);
});
