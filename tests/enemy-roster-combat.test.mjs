import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {creatures} from '../src/definitions.mjs';
import {ENEMY_COMBAT_CATALOG,combatPhase,speciesOpeningDamage,reactSpeciesHit,updateEnemyCombatReadability} from '../src/enemy-combat-catalog.mjs';
import {SPECIES_ATTACKS,tickSpeciesCombat,speciesPhase} from '../src/enemy-species-combat.mjs';
import {ELDRITCH_ATTACKS,tickEldritchAttack} from '../src/eldritch-attack-logic.mjs';
import {enemyTelegraph,telegraphContour,drawEnemyTelegraph} from '../src/enemy-telegraphs.mjs';
const setup=kind=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();Object.assign(g,{scenery:[],house:null,enemies:[],traps:[],openingBoard:false,weather:null,time:20});g.terrain.fill('grass');g.onSound=()=>{};g.persist=()=>{};
 Object.assign(p,{x:600,y:600,hp:1000,maxHp:1000});const e={id:g.nextId++,kind,x:660,y:600,hp:1000,maxHp:1000,speed:40,damage:10,state:'hunt',cooldown:0,faceX:-1,faceY:0,group:12,flash:0,tacticTime:0};g.configureCreature(e,false);e.cooldown=0;g.enemies=[e];return {g,p,e};
};
test('every hostile top-down creature has an explicit attack, family and counter contract',()=>{
 const kinds=Object.entries(creatures).filter(([,v])=>v.faction==='enemy').map(([k])=>k);
 assert.ok(kinds.length>90);
 for(const kind of kinds){const profile=ENEMY_COMBAT_CATALOG[kind];assert.ok(profile,kind);assert.ok(profile.attack&&profile.opening,kind);assert.ok(profile.openingMultiplier>=1&&profile.openingMultiplier<=1.35);}
 assert.equal(new Set(kinds.map(k=>ENEMY_COMBAT_CATALOG[k].attack)).size,kinds.length,'attack identities are named per species');
});
for(const [kind,attack]of Object.entries(SPECIES_ATTACKS))test(kind+' prepares, commits and exposes recovery without instant contact damage',()=>{
 const {g,p,e}=setup(kind);e.x=p.x+Math.min(attack.range*.6,180);e.mana=100;e.maxMana=100;
 if(attack.style==='support'){e.healCooldown=0;g.enemies.push({id:900,kind:'skeleton',x:e.x+20,y:e.y,hp:1,maxHp:100,group:e.group});}
 let hits=0;g.hurt=(q,amount)=>{hits++;q.hp-=amount;};tickSpeciesCombat(g,e,.02,[p]);assert.equal(e.speciesCombat.phase,'windup',kind);assert.equal(hits,0);
 const warning=enemyTelegraph(e);if(attack.style==='rush')assert.equal(warning.width,attack.width*2,'lane matches the contact diameter');
 let recovered=false;for(let i=0;i<180;i++){g.time+=.02;tickSpeciesCombat(g,e,.02,[p]);if(combatPhase(e)==='recover'){recovered=true;break;}}
 assert.ok(recovered,kind);assert.ok(hits<=1,'one strike per target per attack');assert.ok(speciesOpeningDamage(g,e,100)>100);
});
test('locked rush misses a sidestep, stops at a wall, and a heavy preparation hit interrupts once',()=>{
 const {g,p,e}=setup('boar');tickSpeciesCombat(g,e,.02,[p]);for(let i=0;i<18;i++){g.time+=.02;tickSpeciesCombat(g,e,.02,[p]);}
 p.y+=150;let hits=0;g.hurt=()=>hits++;for(let i=0;i<60;i++){g.time+=.02;tickSpeciesCombat(g,e,.02,[p]);}assert.equal(hits,0);
 e.faceX=-1;e.faceY=0;speciesPhase(e,'active',.58);g.moveActor=()=>0;tickSpeciesCombat(g,e,.02,[p]);assert.equal(e.speciesCombat.phase,'recover');assert.ok(e.speciesCombat.remaining>1.3);
 speciesPhase(e,'windup',.56);reactSpeciesHit(g,e,20,'physical',{heavy:true,p});assert.equal(e.speciesCombat.phase,'recover');
});
test('a landed boar rush pushes the hero once in the committed direction',()=>{
 const {g,p,e}=setup('boar');
 e.x=p.x+20;e.faceX=-1;e.faceY=0;
 speciesPhase(e,'active',.58);
 const origin=p.x,hp=p.hp;
 tickSpeciesCombat(g,e,.02,[p]);
 assert.ok(p.hp<hp);
 assert.equal(p.x,origin-18);
 for(let i=0;i<12;i++){g.time+=.02;tickSpeciesCombat(g,e,.02,[p]);}
 assert.equal(p.x,origin-18);
 const solid=setup('boar');
 solid.e.x=solid.p.x+20;
 solid.p.invuln=1;
 speciesPhase(solid.e,'active',.58);
 tickSpeciesCombat(solid.g,solid.e,.02,[solid.p]);
 assert.equal(solid.p.x,origin);
});
test('support preparation can be interrupted without healing or spending mana',()=>{
 const {g,p,e}=setup('skeleton_caster');e.mana=50;e.maxMana=70;e.healCooldown=0;const ally={id:900,hp:10,maxHp:100,kind:'skeleton',x:e.x+20,y:e.y,group:e.group};g.enemies.push(ally);
 tickSpeciesCombat(g,e,.02,[p]);assert.equal(e.speciesCombat.support,'heal');reactSpeciesHit(g,e,5,'physical',{p,heavy:true});
 for(let i=0;i<20;i++){g.time+=.02;tickSpeciesCombat(g,e,.02,[p]);}assert.equal(ally.hp,10);assert.ok(e.mana>=50);
});
for(const [kind,s]of Object.entries(ELDRITCH_ATTACKS))test(kind+' resolves a species footprint after its tell and retains a finite recovery',()=>{
 const e={id:1,kind,x:300,y:300,hp:100,speed:0,damage:10,cooldown:0},p={id:2,x:320,y:300,hp:100},g={time:1,projectileBlocked:()=>false,moveActor(a,x,y){a.x+=x;a.y+=y;},hurt(q,n){q.hp-=n;}};
 tickEldritchAttack(g,e,p,.02,[p]);assert.ok(e.eldritchWindup>0);assert.equal(p.hp,100);
 for(let i=0;i<140;i++){g.time+=.02;tickEldritchAttack(g,e,p,.02,[p]);if(e.eldritchRecovery>0)break;}
 assert.ok(e.eldritchRecovery>0,kind);assert.ok(p.hp>=90,'no multiple contact hits in one attack');
});
test('eye beam and tree impact can be evaded after aim locks; blocked hits do not apply statuses',()=>{
 for(const kind of ['arcane_eye','tree_ent']){
  const e={id:1,kind,x:300,y:300,hp:100,speed:0,damage:10,cooldown:0},p={id:2,x:340,y:300,hp:100},g={hurt(q,n){q.hp-=n;},projectileBlocked:()=>false};
  tickEldritchAttack(g,e,p,.02,[p]);for(let i=0;i<30;i++)tickEldritchAttack(g,e,p,.02,[p]);p.y+=130;
  for(let i=0;i<65;i++)tickEldritchAttack(g,e,p,.02,[p]);assert.equal(p.hp,100,kind);
 }
 const e={id:1,kind:'spore',x:300,y:300,hp:100,cooldown:0},p={id:2,x:320,y:300,hp:100},g={hurt(){},projectileBlocked:()=>false};
 for(let i=0;i<80;i++)tickEldritchAttack(g,e,p,.02,[p]);assert.ok(!p.poisoned,'a blocked spore impact cannot poison');
});
test('bespoke phase adapters recognize actual cast clocks and restraint cancels queued dives',()=>{
 assert.equal(combatPhase({kind:'beholder',beholderRayTime:.3,state:'hunt'}),'windup');assert.equal(combatPhase({kind:'imp',impWindup:.3}),'windup');
 assert.equal(combatPhase({kind:'ogre',constructAI:{phase:'recover'}}),'recover');
 const e={kind:'evil_hand',hp:100,frozen:1,eldritchDash:{remaining:.3},eldritchWindup:0};updateEnemyCombatReadability({enemies:[e]},.02);assert.ok(!e.eldritchDash);assert.equal(e.eldritchRecovery,.8);
});
test('explicit edited enemy behavior still owns its AI and saved attack state contains no live targets',()=>{
 const {g,p,e}=setup('snake'),old=creatures.snake.edited;try{creatures.snake.edited=true;assert.equal(tickSpeciesCombat(g,e,.02,[p]),false);}finally{creatures.snake.edited=old;}
 tickSpeciesCombat(g,e,.02,[p]);const saved=JSON.parse(JSON.stringify(e.speciesCombat));assert.equal(saved.targetId,p.id);assert.ok(!Object.values(saved).includes(p));
});
test('adopting the species controller preserves an existing recovery and captures arrivals before they can act',()=>{
 const {g,p,e}=setup('skeleton');e.state='recover';e.timer=.7;tickSpeciesCombat(g,e,.02,[p]);assert.equal(e.speciesCombat.phase,'recover');assert.ok(e.speciesCombat.remaining>.6);
 const arriving=setup('boar');arriving.e.spawnReadyAt=arriving.g.time+1;arriving.g.traps.push({x:arriving.e.x,y:arriving.e.y,life:20});tickSpeciesCombat(arriving.g,arriving.e,.02,[arriving.p]);assert.equal(arriving.e.state,'snared');
});


test('ordinary sword damage waits for the active clip contact instead of its preparation frame',()=>{
 const {g,p,e}=setup('skeleton');e.x=p.x+30;e.faceX=-1;e.faceY=0;
 const s=speciesPhase(e,'active',.2);s.dx=-1;s.dy=0;let hits=0;g.hurt=()=>hits++;
 tickSpeciesCombat(g,e,.02,[p]);assert.equal(hits,0);
 for(let i=0;i<8;i++)tickSpeciesCombat(g,e,.02,[p]);assert.equal(hits,1);
});

test('ordinary enemies reconsider co-op threat between attacks and keep committed targets',()=>{
 const {g,p,e}=setup('boar'),q={...p,id:999,x:e.x+80,y:e.y};p.x=e.x-100;
 e.enemyMind={targetId:p.id,reconsiderAt:0,threat:[{id:q.id,value:220,time:g.time}]};
 tickSpeciesCombat(g,e,.02,[p,q]);assert.equal(e.speciesCombat.targetId,q.id);
 e.enemyMind.threat=[{id:p.id,value:220,time:g.time}];g.time+=1;
 tickSpeciesCombat(g,e,.02,[p,q]);assert.equal(e.speciesCombat.targetId,q.id,'a tell never switches targets');
 q.hp=0;tickSpeciesCombat(g,e,.02,[p,q]);assert.equal(e.speciesCombat.phase,'recover','lost committed target gives a safe opening');
});

test('golem only marks the damaging slam area, not a decorative rock-lift circle',()=>{
 const e={kind:'golem',hp:100,x:1,y:2,state:'rocklift'};assert.equal(enemyTelegraph(e),null);
 e.state='windup';assert.equal(enemyTelegraph(e).range,95);
});

test('warning contours retain footprint dimensions in native world pixels across all facings',()=>{
 for(const shape of ['lane','circle','cone'])for(let facing=0;facing<8;facing++){
  const points=telegraphContour({shape,x:300,y:300,range:95,width:30,arc:.86,angle:facing*Math.PI/4});
  assert.ok(points.every(p=>p.every(Number.isInteger)));assert.ok(points.every(([x,y])=>Math.hypot(x-300,y-300)<=97));
 }
 let pixels=0;const c={save(){},restore(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},fill(){},rect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isInteger));pixels++;},arc(){assert.fail('no smooth warning arcs');},stroke(){assert.fail('no antialiased contour strokes');}};
 drawEnemyTelegraph(c,{kind:'golem',hp:100,x:300,y:300,state:'windup'});assert.ok(pixels>100,'a native pixel contour is drawn');
});

test('a healer left alone closes for its telegraphed staff attack instead of kiting forever',()=>{
 const {g,p,e}=setup('skeleton_caster');e.x=p.x+150;e.speed=60;e.cooldown=0;let prepared=false,hit=0;g.hurt=()=>hit++;
 for(let i=0;i<220;i++){g.time+=.02;tickSpeciesCombat(g,e,.02,[p]);if(e.speciesCombat.phase==='windup')prepared=true;}
 assert.ok(prepared,'the last healer enters a real readable attack');assert.ok(hit>0,'it can reach staff contact');
});
