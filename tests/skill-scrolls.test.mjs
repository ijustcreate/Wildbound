import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ITEMS} from '../src/items.mjs';
import {SKILLS,SCROLL_BOSSES,skillScrollId,skillAvailable,trainSkill} from '../src/field-skills.mjs';
import {initializeField} from '../src/field-systems.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {createPauseCheatTracker} from '../src/debug-code.mjs';

test('each guild skill needs its scroll before training and discovery survives a save',()=>{
  const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();p.xp=1000;
  for(const s of SKILLS){
    assert.equal(ITEMS[skillScrollId(s.id)].skillScroll,s.id);
    assert.equal(skillAvailable(p,s.id),false);
    const xp=p.xp;trainSkill(p,s.id);assert.equal(p.xp,xp);assert.equal(p.field.skills[s.id],undefined);
    // Discovery does not require an empty inventory slot.
    p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));
    g.dropLoot(p.x,p.y,skillScrollId(s.id),1,'Test',true);
    const loot=g.loot.at(-1);Object.assign(loot,{x:p.x,y:p.y});
    assert.equal(g.collect(p,loot),true);assert.equal(p.inventory.length,24);
    assert.equal(g.collect(p,loot),false);assert.equal(skillAvailable(p,s.id),true);
    trainSkill(p,s.id);assert.equal(p.field.skills[s.id],1);assert.equal(p.xp,xp-s.cost);
  }
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  for(const s of SKILLS)assert.equal(skillAvailable(restored.players[0],s.id),true);
});
test('bosses drop a scroll; ordinary enemies do not, and missing skills are favored',()=>{
  const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();
  for(const s of SKILLS)initializeField(p).skillScrolls[s.id]=s.id!=='long_jump';
  for(const kind of [...SCROLL_BOSSES,'skeleton']){
    g.loot=[];g.enemyLoot({kind,id:999,x:400,y:400,maxHp:100});
    const scrolls=g.loot.filter(l=>ITEMS[l.type]?.skillScroll);
    assert.equal(scrolls.length,kind==='skeleton'?0:1);
    if(scrolls.length)assert.equal(scrolls[0].type,skillScrollId('long_jump'));
  }
});
test('previously trained skills remain available in legacy profiles',()=>{
  const p={field:{skills:{long_jump:1}},xp:100};initializeField(p);
  trainSkill(p,'long_jump');assert.equal(p.field.skills.long_jump,2);
  assert.equal(skillAvailable(p,'second_wind'),false);
});
test('pause cheat requires ten presses and resets when leaving pause',()=>{
  const tracker=createPauseCheatTracker();
  for(let i=0;i<9;i++)assert.equal(tracker.press(true),false);
  assert.equal(tracker.press(true),true);assert.equal(tracker.press(true),false);
  tracker.press(false);
  for(let i=0;i<9;i++)assert.equal(tracker.press(true),false);
  tracker.reset();assert.equal(tracker.press(true),false);
});
