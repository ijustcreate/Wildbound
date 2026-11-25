import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {npcDialogueAction,npcDialogueView} from '../src/npc-quests.mjs';
import {lagoonMermaids} from '../src/lagoon-mermaids.mjs';
import {trainPrompt,trainWorldBlocked} from '../src/train-test.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {mermaidLagoonSurface} from '../src/wild-mermaid-lagoon.mjs';

test('all four lagoon conversations are accessible from the water and stay local to the coast',()=>{
 const g=new Game(()=>.5,{deferWorld:true});
 g.addPlayer('keyboard');
 assert.ok(enterWildLands(g).ok);
 const t=g.trainTest,[p]=g.players;
 for(const [x,y,name,pose] of [
  [17345,5424,'Vespera','brush'],[17410,5424,'Luma','harp'],
  [17546,5454,'Coralie','rest'],[17473,5460,'Neri','swim'],
 ]){
  assert.notEqual(mermaidLagoonSurface(x,y),'grass');
  assert.equal(trainWorldBlocked(g,x,y,9,false,true),false);
  Object.assign(p,{x,y});
  assert.match(trainPrompt(g,p),new RegExp('TALK TO '+name.toUpperCase()));
  g.update(.05,{keyboard:{interact:true}});
  g.update(.05,{keyboard:{}});
  const first=npcDialogueView(g,p);
  assert.equal(first.npc.name,name);
  assert.equal(first.npc.mermaidPose,pose);
  assert.match(first.text,/\bdrown(?:ing)? you\b/i);
  assert.ok(npcDialogueAction(g,p,'use'));
  assert.notEqual(npcDialogueView(g,p).text,first.text);
  assert.ok(npcDialogueAction(g,p,'use'));
  assert.equal(p.ui,null);
 }
 const [, ,friend,first]=lagoonMermaids(t);
 t.time+=3;
 const [, , ,later]=lagoonMermaids(t);
 assert.notDeepEqual([first.x,first.y],[later.x,later.y]);
 for(const actor of [first,later]){
  assert.equal(mermaidLagoonSurface(actor.x,actor.y),'water');
  assert.ok(Math.abs(actor.faceX*(friend.y-actor.y)-actor.faceY*(friend.x-actor.x))<1e-8);
  assert.ok(actor.faceX*(friend.x-actor.x)+actor.faceY*(friend.y-actor.y)>0);
 }
 t.design.activeRoom='castle-greyhaven-1';
 assert.equal(lagoonMermaids(t).length,0);
});
