import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {hogsmeadePrompt,interactHogsmeade} from '../src/hogsmeade.mjs';
import {HOGSMEADE_SHACK,hogsmeadeDoor} from '../src/hogsmeade-layout.mjs';
import {LUPIN_DAWN,LUPIN_MIDNIGHT,LUPIN_OUTSIDE,lupinDialogueNpc,lupinNpc,lupinWolf,nearbyLupin} from '../src/remus-lupin.mjs';

const door=hogsmeadeDoor(HOGSMEADE_SHACK);
const nearTown={x:9150,y:4330};
const tick=(g,frames=1)=>{for(let i=0;i<frames;i++)g.update(.05,{keyboard:{}});};

function town(){
 const g=new Game(()=>.44,{deferWorld:true}),p=g.addPlayer('keyboard','Test explorer');
 g.persist=()=>{};g.onSound=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.streamDisabled=true;g.trainTest.preparing=false;
 Object.assign(p,nearTown);
 return {g,p};
}

function midnight(g){
 g.sky.elapsed=LUPIN_MIDNIGHT;
 tick(g);
 const wolf=lupinWolf(g);
 assert.ok(wolf);
 return wolf;
}

test('Lupin can be spoken to at the Shrieking Shack until the midnight change',()=>{
 const {g,p}=town();
 g.sky.elapsed=LUPIN_MIDNIGHT-.2;
 Object.assign(p,{x:LUPIN_OUTSIDE.x+16,y:LUPIN_OUTSIDE.y+24});
 tick(g);
 assert.equal(hogsmeadePrompt(g,p),'TALK TO REMUS LUPIN');
 assert.ok(interactHogsmeade(g,p));
 assert.equal(lupinDialogueNpc(g,p)?.name,'Remus Lupin');
 assert.equal(lupinDialogueNpc(g,{...p,device:'pad:0'}),null);
 Object.assign(p,{x:door.x+39,y:door.y-7});
 assert.equal(nearbyLupin(g,p),null,'the shack front blocks talk from the opposite side');
 midnight(g);
 assert.equal(p.ui,null);
 assert.equal(lupinNpc(g),null);
 assert.equal(g.enemies.filter(e=>e.lupinWerewolf).length,1);
 assert.ok(g.log.some(line=>line.includes('A howl rises from the Shrieking Shack')));
});

test('the werewolf patrols, uses its native pounce against monsters and players, and can be hurt by a monster',()=>{
 const {g,p}=town(),wolf=midnight(g);
 const start={x:wolf.x,y:wolf.y};
 tick(g,36);
 assert.ok(Math.hypot(wolf.x-start.x,wolf.y-start.y)>27,'without a visible opponent he patrols instead of standing still');
 assert.equal(g.blocked(wolf.x,wolf.y,8),false);
 const monster={id:g.nextId++,kind:'skeleton_unarmed',faction:'enemy',x:wolf.x-37,y:wolf.y+12,
  hp:100,maxHp:100,speed:0,damage:0,state:'hunt',frozen:10,flash:0,attack:0,cooldown:0,step:0};
 g.enemies.push(monster);
 const oldHp=wolf.hp;
 g.hurt(wolf,6,monster);
 assert.ok(wolf.hp<oldHp);
 tick(g,56);
 assert.ok(monster.hp<100,'the actual werewolf attack lands on the enemy');
 monster.hp=0;
 Object.assign(p,{x:wolf.x+40,y:wolf.y+10});
 const heroHp=p.hp;
 tick(g,78);
 assert.ok(p.hp<heroHp,'the same native attack also targets a nearby player');
});

test('beating the werewolf leaves Lupin injured and saves the result without awarding a kill',()=>{
 const {g,p}=town(),wolf=midnight(g);
 const {x,y}=wolf;
 const before={cleared:g.cleared,loot:g.loot.length,ghosts:g.ghosts.length};
 damageEnemy(wolf,1000,'physical',{g,p,secondary:true});
 tick(g);
 assert.ok(!g.enemies.some(e=>e.lupinWerewolf));
 assert.deepEqual({cleared:g.cleared,loot:g.loot.length,ghosts:g.ghosts.length},before);
 Object.assign(p,{x:x+12,y:y+18});
 assert.equal(lupinNpc(g)?.injured,true);
 assert.ok(interactHogsmeade(g,p));
 assert.equal(lupinDialogueNpc(g,p)?.injured,true);
 const resumed=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 resumed.trainTest.preparing=false;resumed.trainTest.streamDisabled=true;
 resumed.persist=()=>{};resumed.onSound=()=>{};
 tick(resumed,6);
 assert.equal(lupinNpc(resumed)?.injured,true);
 assert.equal(lupinWolf(resumed),null,'continuing the same night does not respawn the defeated wolf');
});

test('dawn sends the unchallenged wolf back into the Shack without changing the boarded door',()=>{
 const {g}=town(),wolf=midnight(g);
 tick(g,80);
 const fromDoor=Math.hypot(wolf.x-door.x,wolf.y-door.y);
 g.sky.elapsed=LUPIN_DAWN;
 tick(g,22);
 assert.equal(g.trainTest.hogsmeade.remusLupin.form,'returning');
 assert.ok(Math.hypot(wolf.x-door.x,wolf.y-door.y)<fromDoor);
 tick(g,60);
 assert.equal(lupinNpc(g)?.building,HOGSMEADE_SHACK.id);
 assert.equal(g.trainTest.hogsmeade[HOGSMEADE_SHACK.id],undefined);
 assert.ok(!g.enemies.some(e=>e.lupinWerewolf));
 g.sky.elapsed=480;
 g.time+=14;
 tick(g);
 assert.equal(lupinNpc(g)?.building,undefined);
 assert.equal(lupinNpc(g)?.x,LUPIN_OUTSIDE.x);
});
