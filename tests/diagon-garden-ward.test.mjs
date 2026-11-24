import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {alleyGate,alleyBlocked} from '../src/diagon-alley.mjs';
import {GARDEN_POOL,gardenPondContains} from '../src/diagon-garden-layout.mjs';
import {gardenManaWardRemaining,gardenPondSoak,inGardenPond,tickGardenManaWards,tickGardenPond} from '../src/diagon-garden-ward.mjs';
import {waterAt} from '../src/environment.mjs';
import {Profiles} from '../src/profiles.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {leaveTrainTest} from '../src/train-test.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

const dt=.05;
const tick=(g,input={},count=1)=>{for(let i=0;i<count;i++)g.update(dt,{keyboard:input});};
const jumpIntoPond=(g,p)=>{
 Object.assign(p,{x:GARDEN_POOL.x,y:GARDEN_POOL.y+64});
 tick(g,{y:-1,jump:true},7);
 tick(g);
 for(let i=0;i<12&&!inGardenPond(p);i++)tick(g);
 assert.ok(inGardenPond(p),`pond landing at ${p.x}, ${p.y}, height ${p.jumpHeight}`);
};

function visitGarden({persistent=true}={}){
 const g=new Game(()=>.5);g.addPlayer('keyboard','Pond tester');g.start();g.openingBoard=false;
 g.persist=()=>{};g.onSound=()=>{};
 assert.ok(enterWildLands(g,{persistent}).ok);
 const p=g.players[0],gate=alleyGate(g);
 Object.assign(p,{x:gate.x,y:gate.y+55});p.equipment.hand1='starter_wand';
 tick(g,{interact:true});tick(g,{},16);tick(g,{interact:true});
 assert.equal(g.trainTest.design.activeRoom,'diagon');
 return {g,p};
}

test('pond rim preserves the dry walking route and accepts a native jump with a walkable exit',()=>{
 const {g,p}=visitGarden(),{x,y}=GARDEN_POOL;
 Object.assign(p,{x,y:y+64});tick(g,{y:-1},12);
 assert.ok(p.y>y+48);
 assert.equal(p.swimming,false);
 assert.equal(alleyBlocked(g,x,y,7),true);
 assert.equal(waterAt(g,x,y),'water');
 assert.equal(waterAt(g,x,y+41),'grass');
 jumpIntoPond(g,p);
 assert.ok(gardenPondContains(p.x,p.y));
 assert.ok(p.swimming&&!p.underBridge&&!p.trainDeck);
 const initialY=p.y;
 tick(g,{y:1},32);
 assert.ok(p.y>initialY+55);
 assert.ok(!inGardenPond(p)&&!p.swimming);
 assert.equal(gardenPondSoak(p),0);
 assert.equal(gardenManaWardRemaining(p),0);
});

test('continuous soaking restores mana once and the ten-minute ward expires through native vitals',()=>{
 const {g,p}=visitGarden();jumpIntoPond(g,p);
 const capacity=p.maxMana;
 let saves=0;g.persist=()=>saves++;
 p.mana=3;tick(g,{},96);
 assert.equal(p.maxMana,capacity);assert.equal(gardenManaWardRemaining(p),0);
 assert.ok(gardenPondSoak(p)>4.7&&gardenPondSoak(p)<5);
 for(let i=0;i<5&&!gardenManaWardRemaining(p);i++)tick(g);
 assert.equal(gardenManaWardRemaining(p),600);
 assert.equal(p.maxMana,capacity+30);assert.equal(p.mana,p.maxMana);
 assert.equal(saves,1);
 tick(g,{},4);assert.ok(Math.abs(gardenManaWardRemaining(p)-599.8)<1e-8);assert.equal(saves,1);
 const saved=JSON.parse(JSON.stringify(saveSession(g))),loaded=restoreSession(saved),copy=loaded.players[0];
 assert.equal(gardenManaWardRemaining(copy),gardenManaWardRemaining(p));
 assert.equal(copy.maxMana,capacity+30);
 assert.equal(gardenPondSoak(copy),0,'an in-progress soak is not saved');
 const profiles=new Profiles();profiles.save=()=>{};
 const hero=profiles.create('Pond tester');p.profileId=hero.id;
 profiles.capture(g);profiles.assign(copy,hero);
 assert.equal(gardenManaWardRemaining(copy),gardenManaWardRemaining(p));
 assert.equal(copy.maxMana,capacity+30);
 tick(g,{y:1},32);
 g.phase='lobby';const remaining=gardenManaWardRemaining(p);tick(g,{},4);
 assert.equal(gardenManaWardRemaining(p),remaining);
 g.phase='play';p.mana=p.maxMana;
 tickGardenManaWards(g,remaining-.01);assert.equal(p.maxMana,capacity+30);assert.equal(saves,1);
 tick(g);assert.equal(gardenManaWardRemaining(p),0);assert.equal(p.maxMana,capacity);assert.equal(p.mana,capacity);
 assert.equal(saves,2);
});

test('leaving the real Wild Lands preview keeps the ward and its remaining duration',()=>{
 const {g,p}=visitGarden({persistent:false});jumpIntoPond(g,p);
 tick(g,{},105);
 const remaining=gardenManaWardRemaining(p),capacity=p.maxMana;
 assert.ok(remaining>599&&remaining<600);
 leaveTrainTest(g);
 const original=g.players[0];
 assert.notEqual(original,p);assert.equal(gardenManaWardRemaining(original),remaining);
 assert.equal(original.maxMana,capacity);assert.equal(original.mana,capacity);
});

test('dry breaks and riding or flying above the pond cannot complete a soak',()=>{
 const p={...GARDEN_POOL,field:{},hp:100,swimming:true,maxMana:100,mana:0},g={players:[p]};
 tickGardenPond(g,4);
 p.jumpHeight=5;tickGardenPond(g,4);
 p.jumpHeight=0;p.broomMount={};tickGardenPond(g,4);
 assert.equal(gardenPondSoak(p),0);assert.equal(gardenManaWardRemaining(p),0);
 delete p.broomMount;tickGardenPond(g,4.99);
 assert.equal(gardenManaWardRemaining(p),0);
 tickGardenPond(g,.01);assert.equal(gardenManaWardRemaining(p),600);
});
