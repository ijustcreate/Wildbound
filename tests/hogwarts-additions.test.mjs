import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {give,ITEMS,stat,setProgress} from '../src/items.mjs';
import {useChocolateFrog} from '../src/train-students.mjs';import {escapedChocolateFrogs,tickChocolateFrogs} from '../src/chocolate-frogs.mjs';
import {enterTrainTest,leaveTrainTest,trainInteraction} from '../src/train-test.mjs';import {trainCars,trainWorld} from '../src/train-track.mjs';import {trainTailor,HOGWARTS_CATALOG} from '../src/train-tailor.mjs';import {merchantAction,merchantRows} from '../src/traveling-merchant.mjs';import {ScarfInertia} from '../src/school-scarves.mjs';
const count=(p,t)=>p.inventory.filter(i=>i?.type===t).reduce((n,i)=>n+i.qty,0);
const setup=()=>{const g=new Game(()=>.75),p=g.addPlayer('keyboard');g.phase='play';g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.onSound=()=>{};g.persist=()=>{};return {g,p};};
test('half the uniform probability range heals fully and half escapes; both branches always sparkle',()=>{
 for(let i=0;i<20;i++){const {g,p}=setup();g.random=()=>i/20;give(p.inventory,'chocolate_frog');p.hp=12;p.ui={panel:'pack',index:p.inventory.findIndex(i=>i?.type==='chocolate_frog')};g.inventoryAction(p,'use');assert.equal(p.hp,i<10?12:p.maxHp);assert.equal(escapedChocolateFrogs(g).length,i<10?1:0);assert.equal(count(p,'chocolate_frog'),0);assert.ok(p.chocolateSparkleUntil>g.time);assert.ok(!p.happyUntil);}
});
test('a real net and bottle capture the escaped brown frog, and using the bottle can heal or escape again',()=>{
 const {g,p}=setup();g.random=()=>0;p.hp=10;give(p.inventory,'chocolate_frog');give(p.inventory,'empty_jar');p.ui={panel:'pack',index:p.inventory.findIndex(i=>i?.type==='chocolate_frog')};g.inventoryAction(p,'use');const frog=escapedChocolateFrogs(g)[0];assert.ok(frog.chocolate);assert.equal(frog.kind,'frog');assert.equal(frog.x,p.x);p.ui=null;p.equipment.hand1='critter_net';assert.ok(g.attack(p));assert.equal(count(p,'caught_chocolate_frog'),1);assert.equal(count(p,'empty_jar'),0);assert.equal(escapedChocolateFrogs(g).length,0);
 p.ui={panel:'pack',index:p.inventory.findIndex(i=>i?.type==='caught_chocolate_frog')};g.inventoryAction(p,'use');assert.equal(p.hp,10);assert.equal(count(p,'empty_jar'),1);assert.equal(escapedChocolateFrogs(g).length,1);p.ui=null;g.attack(p);g.random=()=>.99;p.ui={panel:'pack',index:p.inventory.findIndex(i=>i?.type==='caught_chocolate_frog')};g.inventoryAction(p,'use');assert.equal(p.hp,p.maxHp);assert.equal(count(p,'empty_jar'),1);assert.equal(count(p,'caught_chocolate_frog'),0);
});
test('no bottle means the frog stays free; hopping is bounded and moves the existing frog species',()=>{
 const {g,p}=setup();g.random=()=>0;give(p.inventory,'chocolate_frog');useChocolateFrog(g,p);const frog=escapedChocolateFrogs(g)[0];p.equipment.hand1='critter_net';g.attack(p);assert.equal(escapedChocolateFrogs(g).length,1);const x=frog.x;for(let n=0;n<60;n++)tickChocolateFrogs(g,.05);assert.ok(Number.isFinite(frog.x)&&Number.isFinite(frog.hopHeight));assert.notEqual(frog.x,x);
});
test('outfitter opens from train Interact, sells exactly the robe set and four back scarves, and purchases persist',()=>{
 const {g,p:original}=setup();original.coins=500;enterTrainTest(g);const p=g.players[0],cs=trainCars(g.trainTest),n=trainTailor(g,cs);p.trainRide={car:n.car.index,...n.local};Object.assign(p,trainWorld(n.car,n.local.x,n.local.y));assert.ok(trainInteraction(g,p,cs));assert.equal(p.ui.trainTailor,true);assert.equal(merchantRows(g,p).length,8);
 const before=p.coins;merchantAction(g,p,'use');assert.equal(count(p,'hogwarts_student_robes'),1);assert.equal(p.coins,before-45);merchantAction(g,p,'select:6');merchantAction(g,p,'use');assert.equal(count(p,'hogwarts_scarf_red'),1);leaveTrainTest(g);assert.equal(count(original,'hogwarts_student_robes'),1);assert.equal(count(original,'hogwarts_scarf_red'),1);assert.equal(original.coins,435);
 for(const color of ['yellow','green','red','blue']){const def=ITEMS['hogwarts_scarf_'+color];assert.equal(def.slot,'back');assert.equal(def.scarf.length,2);}assert.equal(HOGWARTS_CATALOG.length,8);
});
test('the robe pieces form a real gear set, while each scarf has two independent damped cloth tails',()=>{
 const {p}=setup();Object.assign(p.equipment,{chest:'hogwarts_student_robes',pants:'hogwarts_trousers',feet:'hogwarts_shoes',gloves:'hogwarts_cuffs'});assert.ok(setProgress(p,'hogwarts').complete);assert.equal(stat(p,'maxMana'),10);assert.equal(stat(p,'manaRegen'),1);
 const spring=new ScarfInertia();p.x=p.y=100;spring.sample(p,0);let motion;for(let i=1;i<20;i++){p.x+=3;motion=spring.sample(p,i/60);}assert.equal(motion.tails.length,2);assert.notDeepEqual(motion.tails[0],motion.tails[1]);assert.ok(motion.tails.every(t=>Object.values(t).every(Number.isFinite)));assert.equal(spring.sample(p,19/60),motion);p.x+=1000;assert.ok(spring.sample(p,1).tails.every(t=>Math.abs(t.x)<1));
});

test('a frog bottled on the train and its consumed bottle transfer once to the returning hero',()=>{
 const {g,p:original}=setup();give(original.inventory,'chocolate_frog');give(original.inventory,'empty_jar');enterTrainTest(g);const p=g.players[0];g.random=()=>0;p.hp=15;useChocolateFrog(g,p);p.equipment.hand1='critter_net';assert.ok(g.attack(p));assert.equal(count(p,'caught_chocolate_frog'),1);leaveTrainTest(g);assert.equal(count(original,'chocolate_frog'),0);assert.equal(count(original,'empty_jar'),0);assert.equal(count(original,'caught_chocolate_frog'),1);assert.ok(original.chocolateSparkleUntil>g.time);
});

test('the outfitter does not charge for an unaffordable or full-backpack purchase',()=>{
 const {g}=setup();enterTrainTest(g);const p=g.players[0],cs=trainCars(g.trainTest),n=trainTailor(g,cs);p.trainRide={car:n.car.index,...n.local};Object.assign(p,trainWorld(n.car,n.local.x,n.local.y));trainInteraction(g,p,cs);p.coins=0;merchantAction(g,p,'use');assert.equal(count(p,'hogwarts_student_robes'),0);assert.ok(!g.trainTest.tailorPurchases?.[p.id]);p.coins=500;p.inventory=Array.from({length:32},()=>({type:'sword',qty:1}));merchantAction(g,p,'use');assert.equal(p.coins,500);assert.ok(!g.trainTest.tailorPurchases?.[p.id]);
});
