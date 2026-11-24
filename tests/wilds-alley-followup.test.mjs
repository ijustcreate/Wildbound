import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {alleyBlocked,alleyPrompt,interactAlley,tickAlley} from '../src/diagon-alley.mjs';
import {NIGHTGLASS_REAR_DOOR,NOCTURNE_GRAVES} from '../src/diagon-nocturne-rear.mjs';
import {nocturneCatFor} from '../src/diagon-garden-cats.mjs';
import {visitDiagonCritters} from '../src/diagon-critters.mjs';
import {HOGSMEADE_BUILDINGS,HOGSMEADE_PROPS,hogsmeadeDoor} from '../src/hogsmeade-layout.mjs';
import {hogsmeadeDoors,HOGSMEADE_NPCS} from '../src/hogsmeade.mjs';
import {trainInteraction,trainWorldBlocked} from '../src/train-test.mjs';
import {arenaBarView,interactDiagonArena} from '../src/diagon-arena.mjs';
import {ARENA_BAR_SERVICE,ARENA_ENTRANCES,ARENA_RING} from '../src/diagon-arena-layout.mjs';
import {CHAMPION_DRINK,championPower,championUnlocked} from '../src/arena-drink-state.mjs';
import {BELLGLASS_MUSHROOM,bellglassMushroomStrength,consumeBellglassMushroom} from '../src/bellglass-mushroom-state.mjs';
import {npcDialogueView} from '../src/npc-quests.mjs';
import {give} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function setup(room,...devices){
 const g=new Game(()=>.01);
 for(const device of devices.length?devices:['keyboard'])g.addPlayer(device);
 g.phase='play';g.openingBoard=false;g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.preparing=false;
 if(room)g.trainTest.design.activeRoom=room;
 return {g,p:g.players[0]};
}
const melee=(g,p)=>g.resolveMelee(p,0,{damage:1,reach:1,arc:120});
const checkpoint=g=>restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
const ratFor=g=>{let rat;visitDiagonCritters(g,a=>{if(a.kind==='gloamwhisker_rat')rat=a;});return rat;};

test('Nightglass rear door and gate have independent solid closed positions and support readable graves',()=>{
 const {g,p}=setup('diagon');
 const door=NIGHTGLASS_REAR_DOOR;
 Object.assign(p,{x:door.x-16,y:door.y});
 assert.ok(alleyBlocked(g,door.x,door.y));
 assert.match(alleyPrompt(g,p),/OPEN GRAVEYARD DOOR/);
 assert.ok(interactAlley(g,p));
 assert.equal(alleyBlocked(g,door.x,door.y),false);
 for(let x=door.x-12;x<=9453;x+=3)assert.equal(alleyBlocked(g,x,door.y),false,`door approach x=${x}`);
 Object.assign(p,{x:9452,y:5507});
 assert.ok(alleyBlocked(g,9474,5507));
 assert.match(alleyPrompt(g,p),/OPEN CEMETERY GATE/);
 assert.ok(interactAlley(g,p));
 assert.equal(alleyBlocked(g,9474,5507),false);
 assert.ok(alleyBlocked(g,9474,5481));
 for(const grave of NOCTURNE_GRAVES){
  Object.assign(p,{x:grave.x,y:grave.y+17});
  assert.match(alleyPrompt(g,p),/READ/);
  assert.ok(interactAlley(g,p));
  assert.ok(g.trainTest.notice.includes(grave.name));
 }
});

test('real melee breaks a named headstone, releases a hostile ghost, and retains rubble across a save',()=>{
 const {g,p}=setup('diagon'),grave=NOCTURNE_GRAVES[0];
 Object.assign(p,{x:grave.x,y:grave.y+29,faceX:0,faceY:-1,equipment:{hand1:'dagger'}});
 g.enemies=[];
 for(let i=0;i<7&&!g.enemies.some(e=>e.nocturneGraveGhost);i++)melee(g,p);
 const ghost=g.enemies.find(e=>e.nocturneGraveGhost);
 assert.ok(ghost);
 assert.equal(ghost.kind,'ghost');assert.ok(ghost.aggro);
 assert.equal(alleyBlocked(g,grave.x,grave.y),false);
 const saved=checkpoint(g);
 assert.equal(saved.trainTest.nocturneCemetery.damage[grave.id],48);
 assert.equal(alleyBlocked(saved,grave.x,grave.y),false);
 const oldHp=p.hp;
 for(let i=0;i<160&&p.hp===oldHp;i++){g.time+=.05;g.tickCombatActors(.05);}
 assert.ok(p.hp<oldHp,'the released ghost damages the explorer');
});

test('the Nocturne cat chases a rat into a wall, stays outside, then the rat reappears elsewhere',()=>{
 const {g,p}=setup('diagon');Object.assign(p,{x:9110,y:5010});
 tickAlley(g,.05);
 const cat=nocturneCatFor(g),rat=ratFor(g);
 assert.ok(cat&&rat);
 Object.assign(cat,{x:9075,y:5016});Object.assign(rat,{x:9120,y:5020,idle:0});
 let hid;
 for(let i=0;i<85&&!hid;i++){g.time+=.05;g.trainTest.time+=.05;tickAlley(g,.05);hid=g.trainTest.diagonCritterState.wallHides?.[rat.id];}
 assert.ok(hid,'rat took an actual reachable wall hole');assert.equal(ratFor(g),undefined);
 assert.ok(Math.hypot(cat.x-9075,cat.y-5016)>5&&!alleyBlocked(g,cat.x,cat.y,4),JSON.stringify({x:cat.x,y:cat.y,hide:hid}));
 g.trainTest.time=hid.until-1;tickAlley(g,.05);assert.equal(ratFor(g),undefined);
 g.trainTest.time=hid.until+1.1;tickAlley(g,.05);
 const returned=ratFor(g);assert.ok(returned&&Math.hypot(returned.x-hid.x,returned.y-hid.y)>180);
});

test('all 43 Hogsmeade props have stable identities and the Shack supports both opening methods',()=>{
 assert.equal(HOGSMEADE_PROPS.length,43);
 assert.equal(new Set(HOGSMEADE_PROPS.map(p=>p.id)).size,43);
 const {g,p}=setup(),shack=HOGSMEADE_BUILDINGS[2],door=hogsmeadeDoor(shack);
 Object.assign(p,{x:door.x,y:door.y+25,faceX:0,faceY:-1,equipment:{hand1:'dagger'}});
 const blocked=()=>trainWorldBlocked(g,door.x,door.y,7,false,true,0,false,p);
 assert.ok(blocked()); assert.ok(trainInteraction(g,p)); assert.ok(blocked());
 for(let i=0;i<8&&!hogsmeadeDoors(g,shack).unboarded;i++)melee(g,p);
 assert.ok(hogsmeadeDoors(g,shack).unboarded&&blocked());
 assert.ok(trainInteraction(g,p));assert.equal(blocked(),false);
 assert.ok(trainInteraction(g,p));assert.ok(blocked());
 for(let i=0;i<8&&!hogsmeadeDoors(g,shack).broken;i++)melee(g,p);
 assert.ok(hogsmeadeDoors(g,shack).broken);assert.equal(blocked(),false);
 const loaded=checkpoint(g);assert.ok(hogsmeadeDoors(loaded,shack).broken);
 for(const b of HOGSMEADE_BUILDINGS.slice(0,2)){
  const d=hogsmeadeDoor(b);Object.assign(p,{x:d.x,y:d.y+23});
  if(b.tone==='inn')p.equipment.hand2='wand';
  assert.ok(trainInteraction(g,p));assert.equal(trainWorldBlocked(g,d.x,d.y,7,false,true,0,false,p),false);
  const npc=HOGSMEADE_NPCS.find(n=>n.building===b.id);
  Object.assign(p,{x:npc.x,y:npc.y+34,coins:30});
  assert.ok(trainInteraction(g,p));assert.equal(npcDialogueView(g,p).npc.name,npc.name);p.ui=null;
 }
});

test('Celia gives the mirror clue and only real ring winners can buy the reusable unlock',()=>{
 const {g,p}=setup('diagon','keyboard','pad:1'),opponent=g.players[1];
 Object.assign(p,{x:7429,y:3697});assert.ok(interactAlley(g,p));
 g.inventoryAction(p,'use');assert.match(npcDialogueView(g,p).text,/first rule.*broken mirror/);
 p.ui=null;Object.assign(p,ARENA_ENTRANCES['meridian-hall']);assert.ok(interactAlley(g,p));
 Object.assign(p,ARENA_BAR_SERVICE,{coins:90});assert.ok(interactDiagonArena(g,p));
 assert.equal(arenaBarView(g,p).choices.some(choice=>choice.type===CHAMPION_DRINK),false);p.ui=null;
 Object.assign(p,{x:ARENA_RING.x+ARENA_RING.w/2-14,y:ARENA_RING.y+ARENA_RING.h/2});
 Object.assign(opponent,{x:p.x+14,y:p.y,hp:4,invuln:0});
 g.hurt(opponent,100,p);
 assert.ok(championUnlocked(p));assert.equal(championUnlocked(opponent),false);
 Object.assign(p,ARENA_BAR_SERVICE);assert.ok(interactDiagonArena(g,p));
 assert.match(arenaBarView(g,p).text,/earned a Champion/);
 g.inventoryAction(p,'choice:2');assert.equal(p.coins,66);
 p.ui=null;g.openInventory(p);p.ui.panel='pack';p.ui.index=p.inventory.findIndex(item=>item?.type===CHAMPION_DRINK);
 g.inventoryAction(p,'use');assert.equal(championPower(p),1.15);
 assert.equal(checkpoint(g).players[0].npcQuests.lamplit_vault.knockouts,1);
 g.tickHeroVitals(p,91);assert.equal(championPower(p),1);
});

test('Bellglass mushroom caps at three minutes, steps down by minute, and fully expires',()=>{
 const {g,p}=setup(),item={type:BELLGLASS_MUSHROOM,qty:4};p.inventory[0]=item;
 for(let i=1;i<=3;i++){assert.ok(consumeBellglassMushroom(g,p,item,0));assert.equal(bellglassMushroomStrength(g.players),i);}
 assert.equal(consumeBellglassMushroom(g,p,item,0),false);assert.equal(item.qty,1);
 g.tickHeroVitals(p,60);assert.equal(bellglassMushroomStrength(g.players),2);
 g.tickHeroVitals(p,60);assert.equal(bellglassMushroomStrength(g.players),1);
 g.tickHeroVitals(p,58);assert.equal(bellglassMushroomStrength(g.players),.5);
 g.tickHeroVitals(p,2);assert.equal(bellglassMushroomStrength(g.players),0);
});
