import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {BOARD_TABLE} from '../src/board-table.mjs';
import {tickJump} from '../src/jumping.mjs';
import {collisionOffset} from '../src/navigation.mjs';
import {structureBlocked} from '../src/expansion.mjs';

function setup(kind){
  const g=kind==='lobby'?new LobbyPractice():new Game();
  g.phase='play';g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');
  let surface;
  if(kind==='lobby')surface=g.house.furniture[2];
  else if(kind==='furniture'){
    surface={kind:'table',x:300,y:300,w:50,h:30,surfaceHeight:16};
    g.house={walls:[],doors:[],furniture:[surface],pools:[]};
  }else{
    g.house=null;g.generatedEnvironment='forest';
    surface=kind==='board'?BOARD_TABLE:{x:293,y:296,w:14,h:7,surfaceHeight:6};
    if(kind==='stump')g.scenery=[{kind:'tree',fallen:true,depleted:true,x:300,y:280,rootY:300,size:64}];
  }
  const p=g.addPlayer('keyboard');
  const offset=kind==='stump'?0:collisionOffset(g,p);
  Object.assign(p,{x:surface.x+surface.w/2,y:surface.y+surface.h/2-(kind==='board'?0:offset),groundHeight:surface.surfaceHeight,jumpHeight:0});
  return {g,p,offset,surface};
}

for(const kind of ['board','furniture','lobby','stump']){
  test(`${kind}: slow frame-by-frame walk-offs clear all edges and corners`,()=>{
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const {g,p,offset}=setup(kind),start={x:p.x,y:p.y};
      // Less than one pixel per frame exposes the overlap that big moves skip.
      for(let frame=0;frame<320;frame++){
        tickJump(p,1/60,g,offset);
        g.moveActor(p,dx*.25,dy*.25);
      }
      assert.equal(p.x,start.x+dx*80,`${kind}: x stuck walking ${dx},${dy}`);
      assert.equal(p.y,start.y+dy*80,`${kind}: y stuck walking ${dx},${dy}`);
      assert.equal(p.jumpHeight,0);assert.equal(p.groundHeight,0);
    }
  });
  test(`${kind}: stopping during a fall can resume outward but cannot enter the side`,()=>{
    const {g,p,offset,surface}=setup(kind);
    p.x=surface.x+surface.w+.25;
    for(let i=0;i<90;i++)tickJump(p,1/60,g,offset);
    const edgeX=p.x;
    assert.equal(g.moveActor(p,-1,0),0,'Must not walk back through the side');
    assert.equal(p.x,edgeX);
    assert.equal(g.moveActor(p,12,0),12,'Must escape after landing beside the edge');
    assert.ok(g.moveActor(p,-20,0)<5,'Approaching the same surface from outside must still collide');
    assert.ok(p.x>=surface.x+surface.w+8);
  });
}

test('Exiting furniture does not bypass nearby walls, closed doors, or projectile collisions',()=>{
  const {g,p,surface}=setup('furniture');
  Object.assign(p,{x:surface.x+surface.w+1,groundHeight:0});
  for(const type of ['walls','doors']){
    g.house[type]=[{x:p.x+8,y:p.y-20,w:10,h:40}];
    assert.equal(g.moveActor(p,1,0),0);
    g.house[type]=[];
  }
  assert.equal(structureBlocked(g,p.x+1,p.y,8,false,0,0,true,p),true);
});
