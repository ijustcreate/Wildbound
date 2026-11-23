import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ITEMS,BACKPACK_SLOTS,give,stat,socketTrinket} from '../src/items.mjs';
import {enterTrainTest,leaveTrainTest,trainInteraction,trainPrompt} from '../src/train-test.mjs';
import {trainCars} from '../src/train-track.mjs';
import {TRAIN_STUDENTS,trainStudents,studentSpeech,useChocolateFrog,deliverStudentParcels} from '../src/train-students.mjs';
import {useBroom,dismountBroom,broomProfileInventory} from '../src/broom-mount.mjs';
const count=(p,type)=>p.inventory.filter(i=>i?.type===type).reduce((n,i)=>n+i.qty,0);
function setup(){const g=new Game(()=>.5),original=g.addPlayer('keyboard','Student visitor');g.phase='play';g.openingBoard=false;g.onSound=()=>{};g.persist=()=>{};assert.ok(enterTrainTest(g).ok);return {g,p:g.players[0],original};}
function approach(g,p,id){const cs=trainCars(g.trainTest),n=trainStudents(g,cs).find(n=>n.id===id);p.trainRide={car:n.car.index,x:n.local.x,y:n.local.y};return {n,cs};}

test('the three native students share one compartment, with opposing seats and rotating idle chatter',()=>{
 const {g,p}=setup(),cs=trainCars(g.trainTest),students=trainStudents(g,cs);assert.equal(students.length,3);assert.equal(new Set(students.map(n=>n.car.index)).size,1);assert.equal(new Set(students.map(n=>n.room.table.id)).size,1);assert.equal(new Set(students.map(n=>n.seatId)).size,2);
 for(const n of students){assert.equal(n.actor.animationAction,'train_sit');assert.equal(n.actor.sprite,'player');assert.ok(n.local.x>n.room.left&&n.local.x<n.room.right);assert.ok(Number.isFinite(n.actor.y));}
 approach(g,p,'harry');const speakers=[];for(const time of [0,7,14]){g.trainTest.time=time;speakers.push(studentSpeech(g,cs).npc.id);}assert.deepEqual(speakers,['harry','hermione','ron']);
});

test('real train Interact gives each gift once per hero and gifts survive leaving and re-entering',()=>{
 const {g,p,original}=setup();for(const student of TRAIN_STUDENTS){const {cs}=approach(g,p,student.id);assert.ok(trainPrompt(g,p).includes(student.name.toUpperCase()));assert.ok(trainInteraction(g,p,cs));assert.equal(count(p,student.gift),1);trainInteraction(g,p,cs);assert.equal(count(p,student.gift),1);}
 leaveTrainTest(g);assert.equal(g.players[0],original);for(const n of TRAIN_STUDENTS)assert.equal(count(original,n.gift),1);
 enterTrainTest(g);const p2=g.players[0],{cs}=approach(g,p2,'harry');trainInteraction(g,p2,cs);assert.equal(count(p2,'nimbus_2000'),1);
});

test('a full bag does not consume a student gift, and train-only free space becomes a saved parcel on return',()=>{
 const {g,p,original}=setup(),full=()=>Array.from({length:BACKPACK_SLOTS},()=>({type:'sword',qty:1}));p.inventory=full();original.inventory=full();const {cs}=approach(g,p,'hermione');trainInteraction(g,p,cs);assert.ok(!p.npcQuests?.train_students?.received?.hermione);
 p.inventory.pop();trainInteraction(g,p,cs);assert.equal(count(p,'standard_book_of_spells'),1);leaveTrainTest(g);assert.equal(original.npcQuests.train_students.pending[0].type,'standard_book_of_spells');original.inventory.pop();deliverStudentParcels(g);assert.equal(count(original,'standard_book_of_spells'),1);assert.equal(original.npcQuests.train_students.pending.length,0);
});

test('students cannot be interacted with from another compartment or outside the train',()=>{
 const {g,p}=setup(),{n}=approach(g,p,'harry');p.trainRide.x=n.room.left-3;assert.ok(!trainPrompt(g,p).includes('HARRY'));delete p.trainRide;assert.ok(!trainPrompt(g,p).includes('HARRY'));assert.equal(count(p,'nimbus_2000'),0);
});

test('a table cup still wins when it is closer than a student, preserving hot chocolate interaction',()=>{
 const {g,p}=setup(),cs=trainCars(g.trainTest),n=trainStudents(g,cs)[0];p.trainRide={car:n.car.index,x:n.room.table.x,y:n.room.table.y};assert.ok(trainPrompt(g,p).includes('HOT CHOCOLATE'));trainInteraction(g,p,cs);assert.equal(count(p,'hot_chocolate'),1);assert.equal(count(p,'nimbus_2000'),0);
});

test('the Nimbus mounts and dismounts as its own item and profile snapshots preserve its identity',()=>{
 const {g,p}=setup();delete p.trainRide;give(p.inventory,'nimbus_2000');const index=p.inventory.findIndex(i=>i?.type==='nimbus_2000');p.ui={};assert.ok(useBroom(g,p,index));assert.equal(p.broomMount.item.type,'nimbus_2000');assert.equal(broomProfileInventory(p)[index].type,'nimbus_2000');assert.ok(dismountBroom(g,p));assert.equal(p.inventory[index].type,'nimbus_2000');
});

test('the book adds exactly three to real uncharged spells when socketed, without boosting physical damage',()=>{
 const {g,p}=setup();p.equipment.hand1='wand';p.equipmentSockets={};p.mana=1000;p.faceX=1;p.faceY=0;g.spells=[];g.fireSpell(p,0);const baseline=g.spells.at(-1).damage;
 give(p.inventory,'standard_book_of_spells');assert.ok(socketTrinket(p,{mode:'gear',slot:'hand1'},p.inventory.findIndex(i=>i?.type==='standard_book_of_spells')));assert.equal(stat(p,'spellDamage'),3);assert.equal(stat(p,'damageBonus'),0);g.fireSpell(p,0);assert.equal(g.spells.at(-1).damage,baseline+3);p.equipmentSockets.hand1=[];give(p.inventory,'standard_book_of_spells');assert.equal(stat(p,'spellDamage'),0);
});

test('Ron’s frog refills health on the successful roll and consumed train gifts do not reappear',()=>{
 const {g,p,original}=setup(),{cs}=approach(g,p,'ron');trainInteraction(g,p,cs);p.hp=40;original.hp=40;p.ui={panel:'pack',index:p.inventory.findIndex(i=>i?.type==='chocolate_frog')};g.inventoryAction(p,'use');assert.equal(p.hp,p.maxHp);assert.equal(count(p,'chocolate_frog'),0);assert.ok(p.chocolateSparkleUntil>g.time);leaveTrainTest(g);assert.equal(original.hp,original.maxHp);assert.equal(count(original,'chocolate_frog'),0);assert.ok(original.npcQuests.train_students.received.ron);
});

test('a healthy hero can use a frog for sparkles, without gaining the hot-chocolate damage buff',()=>{
 const {g,p}=setup();give(p.inventory,'chocolate_frog');p.hp=p.maxHp;assert.equal(useChocolateFrog(g,p),true);assert.equal(count(p,'chocolate_frog'),0);assert.ok(p.chocolateSparkleUntil>g.time);assert.ok(!p.happyUntil);assert.equal(ITEMS.standard_book_of_spells.spellDamage,3);
});

test('co-op claims belong to each explorer independently, including after a session round trip',async()=>{
 const {g,p,original}=setup();const other={...structuredClone(p),id:2,name:'Second visitor',inventory:[],npcQuests:{}};g.players.push(other);const originalOther={...structuredClone(original),id:2,inventory:[],npcQuests:{}};g.trainTest.returnPlayers.push(originalOther);
 for(const player of [p,other]){const {cs}=approach(g,player,'harry');trainInteraction(g,player,cs);assert.equal(count(player,'nimbus_2000'),1);}
 leaveTrainTest(g);assert.equal(count(original,'nimbus_2000'),1);assert.equal(count(originalOther,'nimbus_2000'),1);
 const {saveSession,restoreSession}=await import('../src/session.mjs');const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.ok(restored.players.every(p=>p.npcQuests.train_students.received.harry));
});
