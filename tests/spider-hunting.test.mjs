import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {creatures} from '../src/definitions.mjs';
import {tickSpider} from '../src/expansion.mjs';

function setup(kind='spider') {
  const g=new Game(()=>.5),p=g.addPlayer('keyboard');
  g.phase='play';g.house=null;g.scenery=[];g.terrain.fill('grass');g.traps=[];
  const e={id:10,group:20,kind,x:650,y:600,hp:70,speed:68,damage:11,cooldown:0,state:'hunt',step:0};
  g.webs=[{group:20,x:500,y:600,radius:145}];g.enemies=[e];
  Object.assign(p,{x:850,y:600});
  return {g,p,e};
}
test('adult spiders and tarantulas leave the web and reach nearby prey',()=>{
  for(const kind of ['spider','tarantula']){
    const {g,p,e}=setup(kind),hp=p.hp;
    for(let n=0;n<90;n++){g.time+=.05;tickSpider(g,e,.05,[p]);}
    assert.ok(e.x>800,'web return movement must not cancel hunting');
    assert.ok(p.hp<hp,'adult reaches and bites the player beyond the web');
  }
});
test('adult detection follows creature settings; distant, hidden, dead and room players do not keep it hunting',()=>{
  const original=creatures.spider.stats.detection;
  try{
    creatures.spider.stats.detection=100;
    for(const excluded of ['distant','hidden','dead','room']){
      const {g,p,e}=setup();
      p.x=excluded==='distant'?850:690;
      if(excluded==='dead')p.hp=0;
      if(excluded==='room')p.room='storage';
      const before=e.x;tickSpider(g,e,.1,excluded==='hidden'?[]:[p]);
      assert.ok(e.x<before,excluded+' target should allow the adult to return home');
    }
  }finally{creatures.spider.stats.detection=original;}
});
test('adult hunts within a bounded distance of its own web then returns',()=>{
  const {g,p,e}=setup();e.x=1300;p.x=1340;
  tickSpider(g,e,.1,[p]);assert.ok(e.x<1300);
});
test('adult spider pathfinds around a wall while chasing beyond the web',()=>{
  const {g,p,e}=setup();e.x=620;p.x=820;
  g.house={walls:[{x:710,y:520,w:20,h:160}],doors:[],furniture:[],floors:[]};
  for(let n=0;n<240;n++){g.time+=.05;tickSpider(g,e,.05,[p]);}
  assert.ok(e.x>760,'spider should route around the wall');
  assert.ok(Math.hypot(e.x-p.x,e.y-p.y)<45);
});
