import assert from 'node:assert/strict';
import test from 'node:test';
import {castleSurface} from '../src/wild-castle-site.mjs';
import {castleInteriorBlocked,toCastleWorld} from '../src/wild-castle.mjs';
import {
  greyhavenDuelDeckAt, greyhavenOutlawActor, greyhavenOutlawActorHidden, greyhavenOutlawProfiles,
  greyhavenOutlawPrompt, greyhavenOutlawSubjects, interactGreyhavenOutlaw, startGreyhavenOutlaw,
  tickGreyhavenOutlawPlayer, tickGreyhavenOutlaws,
} from '../src/greyhaven-outlaws.mjs';

const [robin,john,marian] = greyhavenOutlawProfiles;
const dt = .02;

function hero(id, at) {
  return {id, name:`Explorer ${id}`, hp:10, maxHp:10, device:'keyboard', isPlayer:true,
    x:at.x, y:at.y, faceX:0, faceY:1, equipment:{hand1:'sword'}, inventory:[{type:'fruit',qty:1}]};
}

function visit(players, room=null) {
  return {players, trainTest:{design:{wildLands:true,activeRoom:room}}, time:0, effects:[],
    sounds:[], onSound(cue){this.sounds.push(cue);}};
}

function advance(g, seconds, inputs=()=>({})) {
  g.previous ??= new Map();
  for (let t=0;t<seconds;t+=dt) {
    g.time += dt;
    tickGreyhavenOutlaws(g,dt);
    for (const p of g.players) {
      const input = inputs(p,t);
      tickGreyhavenOutlawPlayer(g,p,input,g.previous.get(p.id) || {},dt);
      g.previous.set(p.id,input);
    }
  }
}

test('Robin loans his appearance and uses aiming, then lets another explorer signal and the archer take the pay chest', () => {
  const p = hero(1,{x:robin.x,y:robin.y+26}), q = hero(2,{x:17554,y:2390}), g = visit([p,q]);
  assert.equal(startGreyhavenOutlaw(g,p,robin.id),true);
  assert.deepEqual([p.x,p.y],[robin.x,robin.y]);
  assert.equal(greyhavenOutlawActor(g,p).equipment.hand1,'bow');
  assert.equal(greyhavenOutlawActorHidden(g,robin.id),true);
  assert.match(greyhavenOutlawPrompt(g,p).text,/GATE ROPE/);
  advance(g,.7,actor=>actor===p?{attack:true,x:-1,y:-1}:{});
  advance(g,.5);
  assert.match(greyhavenOutlawPrompt(g,p).text,/BRASS KEY/);
  advance(g,.8,actor=>actor===p?{attack:true,x:0,y:-1}:{});
  advance(g,.5);
  assert.equal(greyhavenOutlawActor(g,p),p);
  Object.assign(p,{x:17550,y:2224});
  assert.match(greyhavenOutlawPrompt(g,p),/FALLEN KEY/);
  assert.equal(interactGreyhavenOutlaw(g,p),true);
  assert.equal(interactGreyhavenOutlaw(g,q),true);
  advance(g,3.6);
  assert.match(greyhavenOutlawPrompt(g,q),/KEEP WATCH/);
  Object.assign(p,{x:17680,y:2410});
  assert.equal(interactGreyhavenOutlaw(g,p),false);
  assert.equal(interactGreyhavenOutlaw(g,q),true);
  assert.equal(interactGreyhavenOutlaw(g,p),true);
  assert.equal(p.npcQuests.greyhavenOutlaws[robin.id],true);
  assert.equal(q.npcQuests.greyhavenOutlaws[robin.id],true);
  assert.deepEqual(p.equipment,{hand1:'sword'});
  assert.deepEqual(p.inventory,[{type:'fruit',qty:1}]);
});

test('Little John lets a second player join, then blocking and staff hits decide who drifts in the moat', () => {
  const p = hero(1,john), q = hero(2,john), g = visit([p,q]);
  assert.equal(greyhavenDuelDeckAt(17405,1870),8);
  assert.equal(castleSurface(17405,1870),'water');
  assert.equal(greyhavenDuelDeckAt(17405,1885),0);
  const [log] = greyhavenOutlawSubjects(g,0);
  const planks = [];
  log.paint({fillRect:(x,y,w,h)=>planks.push({x,y,w,h})});
  assert.ok(planks.some(rect=>rect.x<=17405&&rect.x+rect.w>=17405&&rect.y<=1870&&rect.y+rect.h>=1870));
  assert.equal(startGreyhavenOutlaw(g,p,john.id),true);
  assert.equal(greyhavenOutlawPrompt(g,q),'JOIN THE STAFF DUEL');
  assert.equal(interactGreyhavenOutlaw(g,q),true);
  advance(g,3.3);
  advance(g,.4,actor=>actor===p?{x:1}:{});
  advance(g,.8,(actor,t)=>actor===q?{block:true}:t<.02?{attack:true}:{});
  assert.match(greyhavenOutlawPrompt(g,q).text,/BALANCE 3/);
  for (let i=0;i<3;i++) advance(g,.85,(actor,t)=>actor===p&&t<.02?{attack:true}:{});
  assert.equal(q.swimming,true);
  const fallY = q.y;
  advance(g,.3);
  assert.ok(q.y>fallY);
  assert.equal(p.swimming,false);
  advance(g,1.6);
  assert.equal(q.swimming,false);
  assert.equal(castleSurface(q.x,q.y),null);
  assert.equal(q.npcQuests.greyhavenOutlaws[john.id],true);
  assert.deepEqual(q.equipment,{hand1:'sword'});
});

function walkLocal(g,p,path) {
  for (const [x,y] of path) {
    const at = toCastleWorld({x,y});
    let distance = Math.hypot(at.x-p.x,at.y-p.y);
    while (distance>.02) {
      const step = Math.min(distance,2);
      p.x += (at.x-p.x)*step/distance;
      p.y += (at.y-p.y)*step/distance;
      assert.equal(castleInteriorBlocked(1,p.x,p.y,7),false);
      advance(g,dt);
      distance = Math.hypot(at.x-p.x,at.y-p.y);
    }
  }
  advance(g,.35);
}

test('Marian resets an exposed guest and allows a solo guide to escort all three during the reel', () => {
  const p = hero(1,toCastleWorld(marian)), g = visit([p],'castle-greyhaven-1');
  assert.equal(startGreyhavenOutlaw(g,p,marian.id),true);
  const exit = [[653,295],[653,454],[651,464],[605,464]];
  Object.assign(p,toCastleWorld({x:683,y:287}));
  assert.equal(interactGreyhavenOutlaw(g,p),true);
  walkLocal(g,p,[[653,295],[653,337]]);
  assert.equal(p.npcQuests,undefined);
  assert.equal(greyhavenOutlawSubjects(g,1).find(a=>a.id==='greyhaven-refugee-0').y,287);
  for (const [x,y] of [[683,287],[738,286],[760,278]]) {
    Object.assign(p,toCastleWorld({x:712,y:274}));
    advance(g,8);
    assert.equal(interactGreyhavenOutlaw(g,p),true);
    walkLocal(g,p,[[x,y]]);
    assert.match(greyhavenOutlawPrompt(g,p),/WAVE/);
    assert.equal(interactGreyhavenOutlaw(g,p),true);
    walkLocal(g,p,exit);
  }
  assert.equal(g.sounds.filter(cue=>cue?.key==='greyhaven-banquet-reel').length,3);
  assert.equal(p.npcQuests.greyhavenOutlaws[marian.id],true);
});
