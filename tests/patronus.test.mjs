import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {interactLupin,LUPIN_OUTSIDE,LUPIN_MIDNIGHT} from '../src/remus-lupin.mjs';
import {npcDialogueAction,npcDialogueView} from '../src/npc-quests.mjs';
import {activePatronuses,learnPatronus,patronusLesson,tickPatronuses,PATRONUS_DURATION} from '../src/patronus.mjs';
import {tickCryptWorld,upgradeCryptWorld} from '../src/crypt-world.mjs';
import {generateMausoleumCrypt} from '../src/mausoleum-crypt.mjs';

function setup(wild=false) {
  const g=new Game(()=>.4),p=g.addPlayer('keyboard','Explorer');
  g.persist=()=>{};
  if(wild){
    assert.ok(enterWildLands(g,{persistent:true}).ok);
    Object.assign(p,{x:LUPIN_OUTSIDE.x+13,y:LUPIN_OUTSIDE.y+6});
    g.sky.elapsed=100;
  } else {
    g.start();
    Object.assign(g,{openingBoard:false,projectileBlocked:()=>false,canHitBoard:()=>false});
    Object.assign(p,{x:535,y:535,faceX:1,faceY:0});
  }
  g.enemies=[];
  g.random=()=>0;
  return {g,p};
}

test('Lupin teaches an equipped wand, and practice summons one form for thirty seconds',()=>{
  const {g,p}=setup(true);
  p.equipment.hand1=null;
  p.equipment.hand2=null;
  assert.equal(interactLupin(g,p),true);
  assert.equal(npcDialogueView(g,p).choices[0].disabled,true);
  npcDialogueAction(g,p,'choice:0');
  assert.equal(patronusLesson(p),undefined);
  p.equipment.hand2='starter_wand';
  npcDialogueAction(g,p,'choice:0');
  assert.equal(patronusLesson(p).learned,true);
  npcDialogueAction(g,p,'close');
  p.consumeInput=false;
  g.attack(p);
  const [first]=activePatronuses(g);
  assert.equal(first.kind,'stag');
  assert.equal(first.expiresAt-g.time,PATRONUS_DURATION);
  assert.equal(g.spells.length,0,'practice casts should not throw a bolt through the teacher');
  p.attack=0;
  g.attack(p);
  assert.equal(activePatronuses(g)[0],first);
  assert.equal(first.expiresAt,first.summonedAt+PATRONUS_DURATION);
  g.time=first.expiresAt;
  tickPatronuses(g,.05);
  assert.equal(activePatronuses(g).length,0);
  p.attack=0;
  g.attack(p);
  assert.equal(activePatronuses(g)[0].kind,first.kind);
});

test('a confirmed relearn excludes the former animal, and saved forms survive a reload',()=>{
  const {g,p}=setup(true);
  p.equipment.hand1='starter_wand';
  learnPatronus(g,p);
  g.attack(p);
  assert.equal(patronusLesson(p).form,'stag');
  assert.equal(interactLupin(g,p),true);
  npcDialogueAction(g,p,'patronus:offer');
  assert.match(npcDialogueView(g,p).text,/different animal/);
  npcDialogueAction(g,p,'patronus:relearn');
  assert.equal(patronusLesson(p).previousForm,'stag');
  assert.equal(activePatronuses(g).length,0);
  npcDialogueAction(g,p,'close');
  p.attack=0;p.consumeInput=false;
  g.attack(p);
  assert.equal(patronusLesson(p).form,'wolf');
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.equal(patronusLesson(restored.players[0]).form,'wolf');
  assert.equal(activePatronuses(restored).length,0,'an active 30-second spell is never stored in a checkpoint');
  g.sky.elapsed=LUPIN_MIDNIGHT;
  g.time+=PATRONUS_DURATION;
  p.attack=0;
  g.attack(p);
  assert.equal(activePatronuses(g).length,0,'a moonlit attack near the Shack is not a lesson cast');
});

test('only a learned wand hitting hostile spirits summons, then the companion fights them for its owner',()=>{
  const {g,p}=setup();
  const other=g.addPlayer('pad:0','Other explorer');
  p.equipment.hand1='starter_wand';
  other.equipment.hand1='starter_wand';
  Object.assign(other,{x:530,y:575,faceX:1,faceY:0});
  assert.equal(learnPatronus(g,p),true);
  const targetAt=(id,bolt,kind,extra={})=>({id,kind,hp:150,maxHp:150,x:bolt.x+8,y:bolt.y,faceX:0,faceY:1,...extra});
  const fire=(hero,kind,extra)=>{
    hero.mana=100;
    assert.equal(g.fireSpell(hero),true);
    const enemy=targetAt(g.nextId++,g.spells.at(-1),kind,extra);
    g.enemies=[enemy];
    g.tickProjectiles(.05);
    return enemy;
  };
  fire(p,'boar');
  assert.equal(activePatronuses(g).length,0);
  fire(other,'ghost');
  assert.equal(activePatronuses(g).length,0);
  const dementor=fire(p,'ghost',{happinessDevourer:true});
  const [a]=activePatronuses(g);
  assert.equal(a.owner,p);
  const hp=dementor.hp;
  for(let i=0;i<12;i++){g.time+=.05;tickPatronuses(g,.05);}
  assert.ok(dementor.hp < hp);
  const oldExpiry=a.expiresAt;
  fire(p,'ghost');
  assert.equal(activePatronuses(g).length,1);
  assert.equal(a.expiresAt,oldExpiry);
  g.time=oldExpiry+.01;
  fire(p,'ghost',{happinessDevourer:true});
  assert.equal(activePatronuses(g).length,1);
  assert.equal(activePatronuses(g)[0].kind,a.kind);
});

test('a crypt ghost hit summons inside the room and a single companion follows back outside',()=>{
  const {g,p}=setup();
  p.equipment.hand1='starter_wand';
  learnPatronus(g,p);
  const well=generateMausoleumCrypt(75),door={id:'test-crypt',well};
  upgradeCryptWorld(well);
  well.tiles.fill(1);
  Object.assign(p,{room:door.id,roomX:220,roomY:220});
  const ghost=well.enemies.find(e=>e.kind==='ghost');
  Object.assign(ghost,{x:250,y:220});
  well.enemies=[ghost];
  well.worldRuntime.spells=[{x:235,y:220,vx:260,vy:0,life:1,remaining:260,damage:15,size:5,owner:p.id,patronusWand:true}];
  tickCryptWorld(g,door,[p],{},.05);
  const [a]=activePatronuses(g,door.id);
  assert.equal(a.owner,p);
  assert.equal(activePatronuses(g).length,0);
  p.room=null;
  g.time+=.2;
  tickPatronuses(g,.05);
  assert.equal(activePatronuses(g)[0],a);
  assert.equal(activePatronuses(g,door.id).length,0);
});
