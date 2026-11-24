import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';
import {defaultTrainDesign,packTrainDesign,unpackTrainDesign,validateTrainDesign} from '../src/train-design.mjs';
import {compartmentSeatStandY,defaultInterior,nativeCompartmentAisle,trainInterior} from '../src/train-interior.mjs';
import {trainCars,trainWorld} from '../src/train-track.mjs';
import {trainInteraction,trainInteriorBlocked,trainPrompt} from '../src/train-test.mjs';
import {nearbyTrainStudent} from '../src/train-students.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

function setup(){
 const g=new Game(()=>.4),p=g.addPlayer('keyboard','Explorer');
 g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const t=g.trainTest,cs=trainCars(t);
 return {g,p,t,cs,car:cs.find(c=>c.kind==='compartments')};
}

test('the wider native aisle is clear along its length and partition doors use the same geometry',()=>{
 const {g,p,t,cs,car}=setup();
 const aisle=nativeCompartmentAisle(t.design,car);
 assert.equal(aisle.wallY,13);
 for(let x=-130;x<=128;x+=4)for(const y of [23,31,40])
  assert.equal(trainInteriorBlocked(t,car,x,y),false,`aisle at ${x}, ${y}`);
 const door=trainInterior(t.design,car).find(o=>o.id==='door-3');
 p.trainRide={car:car.index,x:door.x,y:31};
 Object.assign(p,trainWorld(car,p.trainRide.x,p.trainRide.y));
 function walkAcross(distance){return g.moveActor(p,-Math.sin(car.a)*distance,Math.cos(car.a)*distance);}
 walkAcross(-25);
 assert.ok(p.trainRide.y>=door.y+9.5);
 assert.ok(trainInteraction(g,p,cs));
 assert.equal(t.doors[car.id+':'+door.id],true);
 walkAcross(-19);
 assert.ok(p.trainRide.y<door.y&&p.trainRide.y>2,'the player crosses to the room side through the actual opening');
 const firstDoor=trainInterior(t.design,car).find(o=>o.id==='door-0');
 Object.assign(p.trainRide,{x:firstDoor.x,y:23});
 assert.equal(nearbyTrainStudent(g,p,cs),null,'the widened corridor cannot trigger a conversation through a partition');
});

test('native furniture identities and authored compartment overrides stay unchanged',()=>{
 const design=defaultTrainDesign(),car=design.cars.find(c=>c.kind==='compartments');
 const legacy=defaultInterior(car,{legacyCompartment:true}),native=trainInterior(design,car);
 assert.deepEqual(native.map(o=>o.id),legacy.map(o=>o.id));
 assert.deepEqual(native.filter(o=>['seat','table'].includes(o.kind)),legacy.filter(o=>['seat','table'].includes(o.kind)));
 const authored=[{id:'custom-table',kind:'table',x:0,y:4,w:22,h:19}];
 design.interiors[car.id]=authored;
 assert.equal(nativeCompartmentAisle(design,car),null);
 assert.strictEqual(trainInterior(design,car),authored);
 delete design.interiors[car.id];
 design.art['compartments:furniture:7']={width:1,height:1,palette:['transparent'],pixels:[0]};
 assert.equal(nativeCompartmentAisle(design,car),null);
 assert.deepEqual(trainInterior(design,car),legacy);
 design.wideCompartmentArt=true;
 const repainted=validateTrainDesign(unpackTrainDesign(packTrainDesign(design)));
 assert.equal(nativeCompartmentAisle(repainted,car).wallY,13);
 assert.deepEqual(trainInterior(repainted,car),native);
});

test('every sofa allows standing and the room-side doors do not steal the seat prompt',()=>{
 const {g,p,t,car}=setup();
 for(const width of [100,86]){
  t.design.cars[car.index].width=width;
  const cars=trainCars(t),coach=cars[car.index],objects=trainInterior(t.design,coach);
  for(const table of objects.filter(o=>o.kind==='table'))t.cocoaTaken.add(coach.id+':'+table.id);
  for(const seat of objects.filter(o=>o.kind==='seat')){
   const key=coach.id+':'+seat.id,y=compartmentSeatStandY(seat);
   const setRide=ride=>{p.trainRide=ride;Object.assign(p,trainWorld(coach,ride.x,ride.y));};
   const stand={car:coach.index,x:seat.x,y};
   if(seat.id.startsWith('sofa-3-')){
    setRide({...stand});
    assert.match(trainPrompt(g,p),/SIT$/);
    assert.ok(trainInteraction(g,p,cars));assert.equal(p.trainRide.seat,key);
   }else setRide({car:coach.index,x:seat.x,y:seat.y,seat:key,facing:(seat.facing??0)*Math.PI/2});
   assert.match(trainPrompt(g,p),/STAND/);
   assert.ok(trainInteraction(g,p,cars));
   assert.equal(p.trainRide.seat,undefined);
   assert.deepEqual([p.trainRide.x,p.trainRide.y],[stand.x,stand.y]);
   assert.equal(trainInteriorBlocked(t,coach,stand.x,stand.y),false);
  }
 }
});

test('checkpoint restore frees a rider caught by the moved partition and keeps other riders in place',()=>{
 const {g,p,t,car}=setup();
 const other=g.addPlayer('pad:0','Aisle rider'),seated=g.addPlayer('pad:1','Seated rider');
 const [door,seat]=['door-2','sofa-3-15.625'].map(id=>trainInterior(t.design,car).find(o=>o.id===id));
 p.trainRide={car:car.index,x:door.x,y:door.y};
 other.trainRide={car:car.index,x:door.x,y:36};
 seated.trainRide={car:car.index,x:seat.x,y:seat.y,seat:car.id+':'+seat.id,facing:Math.PI};
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),carAfter=trainCars(restored.trainTest)[car.index];
 const [a,b,c]=restored.players;
 assert.equal(a.trainRide.x,door.x);
 assert.equal(trainInteriorBlocked(restored.trainTest,carAfter,a.trainRide.x,a.trainRide.y),false);
 assert.notEqual(a.trainRide.y,door.y);
 assert.deepEqual(b.trainRide,other.trainRide);
 assert.deepEqual(c.trainRide,seated.trainRide);
});
