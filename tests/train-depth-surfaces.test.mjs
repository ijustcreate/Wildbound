import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterTrainTest,trainPrompt,trainInteriorBlocked,trainInteraction} from '../src/train-test.mjs';
import {trainCars,trainWorld} from '../src/train-track.mjs';
import {trainInterior} from '../src/train-design.mjs';
import {trainStudents} from '../src/train-students.mjs';
import {trainActorDepth,trainCarDepth} from '../src/train-visibility.mjs';
import {trainFurnitureForegroundFaces} from '../src/train-furniture-order.mjs';
import {trainSeatBack} from '../src/train-surfaces.mjs';

function setup(){const g=new Game(()=>.5);g.addPlayer('keyboard');g.phase='play';g.openingBoard=false;g.onSound=()=>{};g.persist=()=>{};assert.ok(enterTrainTest(g).ok);g.trainTest.preparing=false;g.trainTest.speed=0;g.trainTest.engine=false;g.enemies=[];return {g,p:g.players[0],t:g.trainTest};}

test('one reachable position can claim all three students and cycle every conversation',()=>{
 const {g,p,t}=setup(),cs=trainCars(t),n=trainStudents(g,cs)[0];
 p.trainRide={car:n.car.index,x:n.room.table.x,y:12};t.cocoaTaken.add(n.car.id+':'+n.room.table.id);
 const seen=[];
 for(let i=0;i<6;i++){seen.push(trainPrompt(g,p));g.update(.02,{keyboard:{interact:true}});g.update(.02,{keyboard:{}});}
 for(const name of ['HARRY POTTER','HERMIONE GRANGER','RON WEASLEY'])assert.ok(seen.some(s=>s.includes(name)),name);
 assert.deepEqual(Object.keys(p.npcQuests.train_students.received).sort(),['harry','hermione','ron']);
 for(const type of ['nimbus_2000','standard_book_of_spells','chocolate_frog'])assert.equal(p.inventory.filter(i=>i?.type===type).reduce((n,i)=>n+i.qty,0),1);
});

test('riders keep ground-depth order throughout the far and near halves in eight views',()=>{
 for(let v=0;v<8;v++){const c={index:2,a:v*Math.PI/4,x:1000,y:1000,z:0,length:320,width:100};
  const riders=[[-60,-25],[-60,0],[-60,25],[20,-25],[20,0],[20,25]].map(([x,y])=>({...trainWorld(c,x,y),trainRide:{car:2,x,y}})).sort((a,b)=>a.y-b.y);
  for(let i=1;i<riders.length;i++)if(riders[i].y-riders[i-1].y>.001)assert.ok(trainActorDepth(riders[i], [c])>trainActorDepth(riders[i-1],[c]),'view '+v);
  assert.ok(riders.every(p=>trainActorDepth(p,[c])>trainCarDepth(c)));
 }
});

test('actual jump input lands on a moving tabletop, can jump again, and falls when walking off',()=>{
 const {g,p,t}=setup(),c=trainCars(t)[2],table=trainInterior(t.design,c).find(o=>o.kind==='table');
 p.trainRide={car:c.index,x:table.x,y:table.y+table.h/2+9};
 const ca=Math.cos(c.a),sa=Math.sin(c.a),toward={x:sa,y:-ca,jump:true};
 assert.ok(trainInteriorBlocked(t,c,table.x,table.y,null,0));assert.ok(!trainInteriorBlocked(t,c,table.x,table.y,null,14));
 // Approach with actual held jump and movement input, then stop steering.
 for(let i=0;i<30&&p.trainRide.y>table.y+9;i++)g.update(.02,{keyboard:toward});
 assert.ok(Math.abs(p.trainRide.y-table.y)<table.h/2,'moved over table');
 t.engine=true;t.throttle=.2;
 for(let i=0;i<80;i++)g.update(.02,{keyboard:{}});
 assert.equal(p.jumpHeight,0);assert.equal(p.groundHeight,14,JSON.stringify({ride:p.trainRide,table,h:p.jumpHeight,v:p.jumpVelocity}));const before={x:p.x,y:p.y};
 g.update(.1,{keyboard:{}});assert.ok(Math.hypot(p.x-before.x,p.y-before.y)>0,'car carries supported player');
 g.update(.02,{keyboard:{jump:true}});assert.ok(p.jumpHeight>14,'jump from support');
 for(let i=0;i<80;i++)g.update(.02,{keyboard:{}});assert.equal(p.groundHeight,14);
 for(let i=0;i<15;i++)g.update(.02,{keyboard:{x:-Math.sin(trainCars(t)[2].a),y:Math.cos(trainCars(t)[2].a)}});
 for(let i=0;i<30;i++)g.update(.02,{keyboard:{}});assert.equal(p.groundHeight,0);assert.equal(p.jumpHeight,0);assert.ok(p.trainRide,'still on carriage floor');
});

test('furniture covers grounded far-side bodies but not a player standing above its top',()=>{
 const table={kind:'table',x:0,y:0,w:30,h:30};
 assert.ok(trainFurnitureForegroundFaces(table,0,{x:0,y:-30,height:0}).length);
 assert.equal(trainFurnitureForegroundFaces(table,0,{x:0,y:30,height:0}).length,0);
 assert.equal(trainFurnitureForegroundFaces(table,0,{x:0,y:-30,height:31}).length,0);
 const seat={kind:'seat',x:0,y:0,w:22,h:34,facing:0};assert.ok(trainFurnitureForegroundFaces(seat,0,{x:0,y:-30}).length);
});

test('taking a seat clears prior tabletop or airborne elevation',()=>{
 const {g,p,t}=setup(),cs=trainCars(t),c=cs[4],seat=trainInterior(t.design,c).find(o=>o.kind==='seat');
 p.trainRide={car:c.index,x:seat.x,y:seat.y};p.groundHeight=8;p.jumpHeight=16;p.jumpVelocity=-20;
 assert.ok(trainInteraction(g,p,cs));assert.equal(p.trainRide.seat,c.id+':'+seat.id);assert.equal(p.groundHeight,0);assert.equal(p.jumpHeight,0);assert.equal(p.jumpVelocity,0);
});

test('landing on a seat back uses its actual raised top instead of falling into its collider',()=>{
 const {g,p,t}=setup(),c=trainCars(t)[4],seat=trainInterior(t.design,c).find(o=>o.kind==='seat'),back=trainSeatBack(seat);
 p.trainRide={car:c.index,x:back.x,y:back.y};p.jumpHeight=25;p.jumpVelocity=-25;
 for(let i=0;i<30;i++)g.update(.02,{keyboard:{}});
 assert.equal(p.jumpHeight,0);assert.equal(p.groundHeight,19);assert.ok(!trainInteriorBlocked(t,c,back.x,back.y,null,19));
});
