import test from 'node:test';
import assert from 'node:assert/strict';
import {SLOTS,freshCharacter,ITEMS,refreshVitals,stat,equip,unequip,give,socketTrinket,removeTrinket,transfer,setProgress,moveInventoryItem,hasSetSkill} from '../src/items.mjs';
import {summonNecromancerPet,tickGhosts,summonNecromancerOnKill} from '../src/temple.mjs';
import {Game} from '../src/core.mjs';
import {Profiles} from '../src/profiles.mjs';
import {applyLoadout,initializeField} from '../src/field-systems.mjs';
import {socketAction} from '../src/socket-workshop.mjs';
const hero=()=>({...freshCharacter('test','Tester'),inventory:[],hp:100,mana:100});
test('level and gear increase maximum resources without swap healing',()=>{
 const p=hero();p.level=5;refreshVitals(p);assert.equal(p.maxHp,132);assert.equal(p.maxMana,124);
 p.equipment.head='moon_circlet';refreshVitals(p);assert.equal(p.maxMana,139);assert.equal(p.hp,100);assert.equal(p.mana,100);
 p.mana=139;p.equipment.head=null;refreshVitals(p);assert.equal(p.mana,124);
});
test('Moon set counts distinct requirements and grants three/full bonuses',()=>{
 const p=hero();p.equipment={head:'moon_circlet',shoulders:'moon_shoulders',feet:'moon_steps'};
 assert.equal(setProgress(p,'moon').count,3);assert.equal(stat(p,'maxMana'),75);assert.equal(stat(p,'manaDiscount'),0);
 p.equipment.hand1='moon_blade';p.equipment.hand2='moon_shield';assert.equal(setProgress(p,'moon').count,4);assert.equal(stat(p,'manaDiscount'),.25);assert.equal(stat(p,'castHeal'),3);
});
test('Necromancer set unlocks a sword-wielding skeleton companion',()=>{
 const p=hero();p.equipment.hand1='necromancer_dagger';p.equipment.hand2='necromancer_wand';
 assert.equal(setProgress(p,'necromancer').complete,true);assert.equal(hasSetSkill(p,'necromancer_pet'),true);
 const enemy={x:170,y:100,hp:40,faction:'beast',kind:'wolf',speed:0};
 const g={players:[p],enemies:[enemy],ghosts:[],nextId:1,onSound(){},message(){},house:{walls:[]},time:0,traps:[],blocked(){return false;},projectileBlocked(){return false;},moveActor(a,dx,dy){a.x+=dx;a.y+=dy;return Math.hypot(dx,dy);}};p.x=100;p.y=100;p.faceX=1;p.faceY=0;p.hp=100;
 assert.equal(summonNecromancerPet(g,p),true);assert.equal(g.ghosts[0].kind,'skeleton');assert.equal(g.ghosts[0].equipment.hand1,'sword');
 tickGhosts(g,.1);for(let i=0;i<24;i++){g.time+=.1;tickGhosts(g,.1);}assert.ok(enemy.hp<40);
});
test('Necromancer summon requires both set pieces',()=>{
 const p=hero();p.equipment.hand1='necromancer_dagger';assert.equal(hasSetSkill(p,'necromancer_pet'),false);
});
test('Necromancer kills summon once, require both equipped pieces, and replace a dead skeleton without cooldown',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');
 const kill={hp:0,kind:'wolf',killedBy:p.id};
 p.inventory=[{type:'necromancer_wand',qty:1}];p.equipment.hand1='necromancer_dagger';
 assert.equal(summonNecromancerOnKill(g,kill),false);
 p.equipment.hand2='necromancer_wand';assert.equal(summonNecromancerOnKill(g,{...kill,killedBy:q.id}),false);
 assert.equal(summonNecromancerOnKill(g,{...kill,hp:1}),false);
 assert.equal(summonNecromancerOnKill(g,kill),true);const first=g.ghosts.find(a=>a.pet);
 assert.equal(first.owner,p.id);assert.equal(summonNecromancerOnKill(g,kill),false);
 g.hurt(first,200,{kind:'wolf'});assert.equal(first.hp,0);assert.ok(p.necromancerCooldown>0);
 assert.equal(summonNecromancerOnKill(g,kill),true);assert.equal(g.ghosts.filter(a=>a.pet&&a.hp>0).length,1);
 p.equipment.hand2=null;g.ghosts.forEach(a=>a.hp=0);assert.equal(summonNecromancerOnKill(g,kill),false);
});
test('three mana trinkets only grant stats inside equipped gear',()=>{
 const p=hero();for(const type of ['azure_bead','moon_prism','starheart'])give(p.inventory,type);refreshVitals(p);assert.equal(p.maxMana,100);
 p.equipment.hand1='bow';assert.equal(socketTrinket(p,{mode:'gear',slot:'hand1'},0),true);assert.equal(p.maxMana,115);assert.equal(p.inventory[0],null);
 assert.equal(socketTrinket(p,{mode:'gear',slot:'hand1'},1),true);assert.equal(p.maxMana,140);assert.equal(socketTrinket(p,{mode:'gear',slot:'hand1'},2),false);
});
test('socketed instances survive equip, swaps, chest transfers and drag',()=>{
 const p=hero();give(p.inventory,'sword',1,24,{sockets:['starheart']});give(p.inventory,'sword',1,24,{sockets:['azure_bead']});
 assert.ok(equip(p,0));assert.equal(p.maxMana,140);assert.ok(equip(p,1));assert.equal(p.maxMana,115);assert.deepEqual(p.inventory[0].sockets,['starheart']);
 const chest=[];assert.ok(transfer(p.inventory,chest,0));assert.ok(moveInventoryItem(p,chest,{mode:'chest',index:0},{mode:'gear',slot:'hand2'}));assert.equal(p.maxMana,155);
 assert.ok(unequip(p,'hand2'));assert.equal(p.maxMana,115);assert.deepEqual(p.inventory.find(i=>i?.sockets?.includes('starheart')).sockets,['starheart']);
});
test('extraction with a full backpack is atomic and legacy gear has no gems',()=>{
 const p=hero();p.equipment.hand1='sword';p.equipmentSockets={hand1:['moon_prism']};p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));
 const before=structuredClone(p);assert.equal(removeTrinket(p,{mode:'gear',slot:'hand1'},0),false);assert.deepEqual(p,before);
 p.inventory[4]=null;assert.ok(removeTrinket(p,{mode:'gear',slot:'hand1'},0));assert.equal(p.inventory[4].type,'moon_prism');
 const profile=new Profiles();const old=hero();old.level=3;profile.assign(p,old);assert.deepEqual(p.equipmentSockets,{});assert.equal(p.maxMana,112);
});
test('loadout selection consumes the exact matching socketed instance',()=>{
 const p=hero();give(p.inventory,'sword',1,24,{sockets:['starheart']});give(p.inventory,'sword',1,24,{sockets:['azure_bead']});
 initializeField(p).loadouts=[{name:'Test',gear:{hand1:'sword'}}];const g={sharedStash:[],players:[p],portals:[]};
 assert.match(applyLoadout(g,p,0),/equipped/);assert.deepEqual(p.equipmentSockets.hand1,['starheart']);assert.deepEqual(p.inventory.find(Boolean).sockets,['azure_bead']);
});
test('controller socket workflow requires confirm, supports cancel and removal',()=>{
 const p=hero();p.equipment.hand1='sword';give(p.inventory,'azure_bead');p.ui={panel:'gear',index:SLOTS.indexOf('hand1')};const g={persist(){}};
 assert.equal(socketAction(g,p,'offhand'),false);assert.ok(socketAction(g,p,'sockets'));assert.ok(p.ui.socket);socketAction(g,p,'use');assert.ok(p.ui.socket.confirm);socketAction(g,p,'close');assert.equal(p.inventory[0].type,'azure_bead');
 socketAction(g,p,'use');socketAction(g,p,'use');assert.deepEqual(p.equipmentSockets.hand1,['azure_bead']);socketAction(g,p,'use');socketAction(g,p,'use');assert.equal(p.inventory[0].type,'azure_bead');assert.deepEqual(p.equipmentSockets.hand1,[]);
});
