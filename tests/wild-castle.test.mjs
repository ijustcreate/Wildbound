import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {trainPrompt,trainWorldBlocked} from '../src/train-test.mjs';
import {castleBridgeIsRaised,castleBridgeProgress,castleBridgeSupport,castleInteriorBlocked,castleStory,toCastleWorld} from '../src/wild-castle.mjs';
import {CASTLE_INTERIOR_SIZE,castleInteriorPlan} from '../src/wild-castle-interior.mjs';
import {castleResidents,tickCastleResidents} from '../src/wild-castle-residents.mjs';
import {GREYHAVEN,castleExteriorBlocked,castleSurface} from '../src/wild-castle-site.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {switchWildLandsLayer} from '../src/wild-lands-world.mjs';
import {castleAtriumPose} from '../src/wild-castle-atrium.mjs';

const pressInteract=g=>{
 g.update(.05,{keyboard:{interact:true}});
 g.update(.05,{keyboard:{}});
};
const atStair=(story,direction)=>castleInteriorPlan(story).stairs.find(s=>s.link==='southwest'&&s.direction===direction);
const stairCenter=s=>toCastleWorld({x:s.x+s.w/2,y:s.y+s.h/2});

test('Greyhaven keeps water beneath both decks and closes the only crossing when raised',()=>{
 const {x,bridge,drawbridge,island}=GREYHAVEN;
 const fixedY=bridge.top+20,spanY=(drawbridge.top+drawbridge.bottom)/2;
 const t={design:{wildLands:true},time:5};
 for(const y of [fixedY,spanY]){
  assert.equal(castleSurface(x,y),'water');
  assert.ok(castleBridgeSupport(t,x,y)>0);
 }
 assert.equal(castleExteriorBlocked(x,spanY,8,false,{x,y:fixedY}),false);
 t.greyhavenBridgeRaised=true;
 assert.ok(castleBridgeSupport(t,x,fixedY)>0);
 assert.equal(castleBridgeSupport(t,x,spanY),0);
 assert.equal(castleExteriorBlocked(x,spanY,8,true,{x,y:fixedY}),true);
 assert.equal(castleExteriorBlocked(x+88,island.bottom-2,8,false,{x:x+88,y:island.bottom+2}),true);
});

function reachableInterior(story,start){
 const step=8,radius=9,{width,height}=CASTLE_INTERIOR_SIZE;
 const cols=Math.ceil(width/step),rows=Math.ceil(height/step),seen=new Set(),queue=[];
 const blocked=(x,y)=>{const world=toCastleWorld({x:x*step,y:y*step});return castleInteriorBlocked(story,world.x,world.y,radius);};
 const visit=(x,y)=>{
  const key=y*cols+x;
  if(x<0||x>=cols||y<0||y>=rows||seen.has(key)||blocked(x,y))return;
  seen.add(key);queue.push({x,y});
 };
 visit(Math.round(start.x/step),Math.round(start.y/step));
 for(let i=0;i<queue.length;i++){
  const {x,y}=queue[i];visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);
 }
 return point=>queue.some(({x,y})=>Math.hypot(x*step-point.x,y*step-point.y)<=24);
}

test('all four tower stairs and their reciprocal landings are reachable from each floor',()=>{
 for(const story of [1,2,3]){
  const plan=castleInteriorPlan(story);
  const reaches=reachableInterior(story,plan.entrance?.spawn??plan.stairs[0].spawn);
  for(const s of plan.stairs){
   assert.ok(reaches({x:s.x+s.w/2,y:s.y+s.h/2}),`Story ${story} ${s.link} direction ${s.direction}`);
   assert.ok(reaches(s.spawn),`Story ${story} ${s.link} landing`);
   assert.ok(castleInteriorPlan(story+s.direction).stairs.some(q=>q.link===s.link&&q.direction===-s.direction));
  }
  if(plan.lever)assert.ok(reaches(plan.lever),'The lever is reachable beside the entry');
 }
 const atrium=castleInteriorPlan(2).voids[0];
 const opening=toCastleWorld({x:atrium.x+atrium.w/2,y:atrium.y+atrium.h/2});
 assert.equal(castleInteriorBlocked(2,opening.x,opening.y,8),true);
});

test('jumping toward the Gallery atrium clears the rail and lands the party safely in the Great Hall',()=>{
 const g=new Game(()=>.5,{deferWorld:true}),p=g.addPlayer('keyboard');
 const visitor=g.addPlayer('gamepad-0','Visitor');
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const t=g.trainTest;
 switchWildLandsLayer(g,'castle-greyhaven-2');
 Object.assign(p,toCastleWorld({x:480,y:553}));
 Object.assign(visitor,toCastleWorld({x:550,y:552}));
 for(let i=0;i<6;i++)g.update(.05,{keyboard:{y:-1}});
 assert.equal(castleStory(t.design.activeRoom),2);
 const start={x:p.x,y:p.y},hp=p.hp;
 assert.ok(start.y>=toCastleWorld({x:0,y:536}).y);
 g.update(.05,{keyboard:{y:-1,jump:true}});
 for(let i=0;i<4;i++)g.update(.05,{keyboard:{y:-1}});
 assert.equal(castleStory(t.design.activeRoom),2);
 assert.deepEqual({x:p.x,y:p.y},start);
 assert.ok(castleAtriumPose(p,g).y<p.y&&p.jumpHeight>10);
 for(let i=0;i<14;i++)g.update(.05,{keyboard:{}});
 assert.equal(castleStory(t.design.activeRoom),1);
 assert.ok(!t.greyhavenAtriumDrop);
 assert.equal(p.hp,hp);
 assert.equal(p.jumpHeight,0);
 assert.ok(Math.hypot(p.x-visitor.x,p.y-visitor.y)>=20);
 for(const hero of g.players)assert.equal(trainWorldBlocked(g,hero.x,hero.y,9),false);
});

test('the open entrance, three stories and raised drawbridge survive a Wilds checkpoint',()=>{
 const g=new Game(()=>.5,{deferWorld:true}),p=g.addPlayer('keyboard');
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const t=g.trainTest;
 Object.assign(p,GREYHAVEN.entry);
 assert.match(trainPrompt(g,p),/ENTER CASTLE GREYHAVEN/);
 pressInteract(g);
 assert.equal(castleStory(t.design.activeRoom),1);
 Object.assign(p,toCastleWorld(castleInteriorPlan(1).lever));
 assert.match(trainPrompt(g,p),/RAISE DRAWBRIDGE/);
 pressInteract(g);
 assert.equal(t.greyhavenBridgeRaised,true);
 assert.equal(castleBridgeIsRaised(t),true);
 assert.ok(castleBridgeProgress(t)<1);
 Object.assign(p,stairCenter(atStair(1,1)));pressInteract(g);
 assert.equal(castleStory(t.design.activeRoom),2);
 Object.assign(p,stairCenter(atStair(2,1)));pressInteract(g);
 assert.equal(castleStory(t.design.activeRoom),3);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),player=restored.players[0];
 assert.equal(castleStory(restored.trainTest.design.activeRoom),3);
 assert.equal(castleBridgeProgress(restored.trainTest),1);
 Object.assign(player,stairCenter(atStair(3,-1)));pressInteract(restored);
 assert.equal(castleStory(restored.trainTest.design.activeRoom),2);
 Object.assign(player,stairCenter(atStair(2,-1)));pressInteract(restored);
 assert.equal(castleStory(restored.trainTest.design.activeRoom),1);
 Object.assign(player,toCastleWorld(castleInteriorPlan(1).entrance));pressInteract(restored);
 assert.equal(castleStory(restored.trainTest.design.activeRoom),0);
 assert.deepEqual({x:player.x,y:player.y},GREYHAVEN.entry);
 const y=(GREYHAVEN.drawbridge.top+GREYHAVEN.drawbridge.bottom)/2;
 assert.equal(trainWorldBlocked(restored,GREYHAVEN.x,y,8,false,true,0,false,player),true);
 assert.match(trainPrompt(restored,player),/ENTER CASTLE GREYHAVEN/);
});

test('perched Archimedes faces the nearest visible explorer and looks along his flight path',()=>{
 const explorer=(x,y,overrides={})=>({hp:10,...toCastleWorld({x,y}),...overrides});
 const direct=explorer(782,343),other=explorer(739,346),dead=explorer(770,340,{hp:0});
 const design={wildLands:true,activeRoom:'castle-greyhaven-3'};
 const g={trainTest:{design},sky:{elapsed:160},time:0,players:[other,dead,direct]};
 const owl=castleResidents(g,3).find(actor=>actor.owlVariant==='archimedes');
 const facing=()=>[owl.faceX,owl.faceY];
 const assertFacing=(dx,dy)=>{
  const length=Math.hypot(dx,dy);
  assert.ok(length>0);
  assert.ok(Math.abs(owl.faceX-dx/length)<1e-9&&Math.abs(owl.faceY-dy/length)<1e-9);
 };
 const assertFacingExplorer=player=>{
  const position=toCastleWorld(owl);
  assertFacing(player.x-position.x,player.y-position.y);
 };
 for(let frame=0;frame<6;frame++)tickCastleResidents(g,.1);
 assert.equal(owl.owlPhase,'perch');
 assertFacingExplorer(direct);

 // The nearer explorer is behind the study desk. The farther one is visible.
 const behindDesk=explorer(768,423),visible=explorer(681,339);
 g.players=[behindDesk,visible];
 tickCastleResidents(g,.1);
 assertFacingExplorer(visible);

 const last=facing();
 g.players=[behindDesk,explorer(769,490)];
 tickCastleResidents(g,.1);
 assert.deepEqual(facing(),last);
 design.activeRoom='castle-greyhaven-2';
 g.players=[direct];
 tickCastleResidents(g,.1);
 assert.deepEqual(facing(),last);

 design.activeRoom='castle-greyhaven-3';
 g.sky.elapsed=265;
 const origin={x:owl.x,y:owl.y};
 tickCastleResidents(g,.1);
 assert.equal(owl.owlPhase,'fly');
 assertFacing(owl.x-origin.x,owl.y-origin.y);
});
