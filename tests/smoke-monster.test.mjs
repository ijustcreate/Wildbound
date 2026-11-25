import assert from 'node:assert/strict';
import test from 'node:test';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {beginTrial} from '../src/expedition-trials.mjs';
import {settleSmokeMonsterDefeat,smokeMonsterProjectileHit,spawnSmokeMonster,tickSmokeMonster} from '../src/smoke-monster.mjs';

function scene(blocked=()=>false){
  const player={id:1,x:196,y:0,hp:200};
  const g={nextId:2,players:[player],enemies:[],time:0,blocked,hits:[],loot:[],
    hurt(target,amount){this.hits.push({target,amount});target.hp-=amount;},
    dropLoot(...args){this.loot.push(args);}};
  const core=spawnSmokeMonster(g,{x:0,y:0});
  const nodes=g.enemies.slice(1);
  function advance(seconds,check){
    const dt=.025;
    for(let i=0;i<Math.round(seconds/dt);i++){
      g.time+=dt;
      for(const e of g.enemies){
        tickSmokeMonster(g,e,dt);
        if(e.defeated)e.deathTimer+=dt;
      }
      check?.();
    }
  }
  return {g,player,core,nodes,advance};
}

test('Cinder Wraith forms one limb first and takes damage only when fully formed',()=>{
  const {g,player,core,nodes,advance}=scene();
  player.x=0;
  advance(.8);
  assert.equal(core.smokeMonsterParts.filter(part=>part.role==='wisp'&&!part.hidden).length,1);
  assert.equal(damageEnemy(core,300),0);
  assert.equal(damageEnemy(nodes[0],300),0);
  assert.equal(core.hp,core.maxHp);
  assert.equal(g.hits.length,0);
  advance(3);
  assert.equal(core.smokeMonsterGrowth,1);
  assert.ok(nodes.every(node=>!node.unattackable));
  assert.ok(g.hits.length>0);
  assert.equal(damageEnemy(nodes[0],12),12);
});

test('Each wisp can break and shrink the body, and only the core defeat pays loot and trial credit',()=>{
  const {g,core,nodes,advance}=scene();
  const trial=beginTrial(g,{kind:core.kind,name:'When the Smoke Walks',role:'boss'},[core]);
  advance(4);
  const [node]=nodes;
  damageEnemy(node,node.hp);
  assert.equal(settleSmokeMonsterDefeat(g,node),true);
  advance(.75);
  assert.ok(nodes.slice(1).every(part=>part.hp===part.maxHp));
  assert.ok(core.smokeMonsterScale<.94);
  assert.ok(core.smokeMonsterParts.find(part=>part.id===node.id).hidden);
  assert.equal(core.hp,core.maxHp);
  assert.equal(g.loot.length,0);
  assert.equal(trial.complete,false);
  damageEnemy(core,core.hp);
  assert.equal(settleSmokeMonsterDefeat(g,core),true);
  assert.equal(settleSmokeMonsterDefeat(g,core),true);
  assert.ok(nodes.every(part=>part.defeated&&part.hp===0));
  assert.equal(trial.complete,true);
  assert.deepEqual(g.loot,[[core.x,core.y,'dark_essence',3,'Cinder Wraith',true]]);
});

test('The wraith folds through an open doorway without nodes or smoke crossing closed cover',()=>{
  let opened=false;
  const wall=(x,y,r)=>Math.abs(x-96)<4+r&&(!opened||Math.abs(y-49)>15-r);
  const {g,core,advance}=scene(wall);
  advance(7.5);
  assert.ok(core.x<92);
  assert.equal(g.hits.length,0);

  opened=true;
  let folded=false;
  advance(5.5,()=>{
    for(const part of core.smokeMonsterParts){
      assert.equal(wall(part.x,part.y,part.role==='core'?7:5),false);
      for(const point of part.link||[])assert.equal(wall(point.x,point.y,1),false);
    }
    if(Math.abs(core.x-96)<7){
      const span=Math.max(...core.smokeMonsterParts.map(part=>Math.hypot(core.x-part.x,core.y-part.y)));
      folded||=span<96;
    }
  });
  assert.ok(folded);
  assert.ok(core.x>150);
  assert.ok(g.hits.length>0);
});

test('A living smoke link can damage a player away from any orange core or wisp',()=>{
  const {g,player,core,advance}=scene();
  player.x=1000;
  advance(4.3);
  const part=core.smokeMonsterParts.find(p=>p.link&&Math.hypot(p.x-core.x,p.y-core.y)>91);
  assert.ok(part);
  const [base,joint,end]=part.link;
  Object.assign(player,{x:joint.x,y:joint.y});
  assert.ok(Math.hypot(base.x-player.x,base.y-player.y)>40);
  assert.ok(Math.hypot(end.x-player.x,end.y-player.y)>40);
  advance(.025);
  assert.equal(g.hits.length,1);
  assert.equal(g.hits[0].target,player);
});

test('Wand bolts and arrows land on the visible raised wisps and core',()=>{
  const {core,nodes,advance}=scene();
  advance(4.3);
  for(const actor of [core,...nodes]){
    const visibleY=actor.y-actor.smokeMonsterHeight;
    assert.ok(smokeMonsterProjectileHit(actor,{x:actor.x,y:visibleY+16},16,3));
    assert.ok(smokeMonsterProjectileHit(actor,{x:actor.x,y:visibleY+32},32,1));
    assert.equal(smokeMonsterProjectileHit(actor,{x:actor.x+30,y:visibleY+16},16,3),false);
  }
});
