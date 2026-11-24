import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {throwBoomerang} from '../src/boomerang.mjs';
import {tryEquipmentAttack} from '../src/night-equipment.mjs';
import {HOGSMEADE_NPCS} from '../src/hogsmeade.mjs';
import {trainInteraction} from '../src/train-test.mjs';
import {npcDialogueAction,npcDialogueView} from '../src/npc-quests.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {SHRINKING_CANDY,SHRINKING_SECONDS,shrinkingScale} from '../src/shrinking-candy.mjs';

function setup(wild=true){
 const g=new Game(()=>.38,{deferWorld:wild});g.addPlayer('keyboard','Candy tester');g.phase='play';g.openingBoard=false;
 if(wild){assert.ok(enterWildLands(g,{persistent:true}).ok);g.trainTest.preparing=false;}
 g.persist=()=>{};g.onSound=()=>{};g.enemies=[];g.scenery=[];
 const p=g.players[0];
 Object.assign(p,{x:wild?7860:900,y:wild?4207:815,faceX:1,faceY:0,equipment:{hand1:'dagger'},mana:100,coins:50});
 return {g,p};
}

function eat(g,p){
 const slot=p.inventory.findIndex(item=>item?.type===SHRINKING_CANDY);
 p.ui={panel:'pack',index:slot};
 g.inventoryAction(p,'use');p.ui=null;
}

test('Zonko stocks all three novelties and shrinking refreshes rather than stacking across a checkpoint',()=>{
 const {g,p}=setup(),zonko=HOGSMEADE_NPCS.find(npc=>npc.id==='zonko');
 Object.assign(p,{x:zonko.x,y:zonko.y+34});
 assert.ok(trainInteraction(g,p));
 const choices=npcDialogueView(g,p).choices;
 assert.deepEqual(choices.filter(c=>['zonko_firework','flaming_footprints',SHRINKING_CANDY].includes(c.item)).map(c=>[c.item,c.price]),
  [['zonko_firework',8],['flaming_footprints',12],[SHRINKING_CANDY,10]]);
 const index=choices.findIndex(c=>c.item===SHRINKING_CANDY);
 npcDialogueAction(g,p,'choice:'+index);npcDialogueAction(g,p,'choice:'+index);
 assert.equal(p.coins,30);
 for(const type of ['zonko_firework','flaming_footprints']){
  assert.ok(npcDialogueAction(g,p,'choice:'+choices.findIndex(c=>c.item===type)));
  assert.ok(p.inventory.some(item=>item?.type===type&&item.qty===1));
 }
 assert.equal(p.coins,10);
 eat(g,p);assert.equal(shrinkingScale(p),.5);assert.equal(p.field.shrinkingCandyRemaining,SHRINKING_SECONDS);
 g.tickHeroVitals(p,17);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),hero=restored.players[0];
 assert.equal(hero.field.shrinkingCandyRemaining,43);
 eat(restored,hero);assert.equal(hero.field.shrinkingCandyRemaining,60);assert.equal(shrinkingScale(hero),.5);
 hero.field.shrinkingCandyRemaining=.02;restored.update(.05);
 assert.equal(shrinkingScale(hero),1);
});

test('shrinking halves physical damage at release and keeps spell strength intact',()=>{
 const measure=shrink=>{
  const {g,p}=setup();
  if(shrink){p.inventory=[{type:SHRINKING_CANDY,qty:1}];eat(g,p);}
  const enemy={id:g.nextId++,x:p.x+29,y:p.y+8,hp:100,maxHp:100,kind:'wolf',faction:'enemy',state:'idle',flash:0};
  g.enemies=[enemy];
  g.resolveMelee(p,0,{damage:2,reach:1,arc:120});
  const melee=100-enemy.hp;
  p.equipment={hand1:'bow'};p.inventory=[{type:'arrow',qty:1}];assert.ok(g.fireArrow(p,0));
  p.equipment={hand1:'wand'};assert.ok(g.fireSpell(p,0));
  p.equipment={hand1:'boomerang'};assert.ok(throwBoomerang(g,p));
  p.equipment={hand1:'rifle'};p.attack=0;p.inventory=[{type:'cartridge',qty:1}];assert.ok(tryEquipmentAttack(g,p,1.2));
  return {melee,arrow:g.arrows.at(-1).damage,spell:g.spells.at(-1).damage,boomerang:g.boomerangs.at(-1).damage,rifle:g.rifleShots.at(-1).damage};
 };
 const full=measure(false),small=measure(true);
 for(const kind of ['melee','arrow','rifle','boomerang']){assert.ok(full[kind]>0);assert.equal(small[kind],full[kind]/2,kind);}
 assert.equal(small.spell,full.spell);
});

test('the usual Classic world update advances and expires the same timer',()=>{
 const {g,p}=setup(false);
 p.inventory=[{type:SHRINKING_CANDY,qty:1}];eat(g,p);
 p.field.shrinkingCandyRemaining=.02;g.update(.05);
 assert.equal(shrinkingScale(p),1);
});
