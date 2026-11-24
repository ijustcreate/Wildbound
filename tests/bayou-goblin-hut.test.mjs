import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {trainPrompt} from '../src/train-test.mjs';
import {npcDialogueView} from '../src/npc-quests.mjs';
import {BAYOU_GOBLIN_HUT as HUT} from '../src/bayou-goblin-hut-layout.mjs';
import {BACKPACK_SLOTS} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {wildLandsGround,wildLandsSurfaceAt} from '../src/wild-lands-world.mjs';

function step(g,n,input={}){for(let i=0;i<n;i++)g.update(.05,{keyboard:input});}
const press=(g,input)=>{step(g,1,input);step(g,1);};
const count=p=>p.inventory.filter(i=>i?.type==='energy_blade_green').length;

test('The Bayou hut has a walkable door, an original conversation, and one green energy blade per hero',()=>{
 const g=new Game(()=>.4,{deferWorld:true}),p=g.addPlayer('keyboard','Rowan'),other=g.addPlayer('pad:0','Wren');
 g.persist=()=>{};g.onSound=()=>{};
 assert.ok(enterWildLands(g,{persistent:true,homeStart:true}).ok);
 const d=g.trainTest.design;
 Object.assign(p,{x:HUT.cx,y:HUT.front+40});
 assert.equal(wildLandsGround(d,p.x,p.y),'swamp');
 assert.equal(wildLandsSurfaceAt(d,p.x,p.y),'grass');
 assert.equal(g.blocked(HUT.x+6,HUT.front-29,8),true);
 assert.equal(g.blocked(HUT.cx-38,HUT.front-6,8),true);
 assert.equal(g.blocked(HUT.cx,HUT.front-6,8),false);
 assert.doesNotMatch(trainPrompt(g,p),/WISE LITTLE GOBLIN/);
 step(g,10,{y:-1});
 assert.ok(p.y<HUT.front-20&&!p.swimming,'Ordinary movement crosses the open hut threshold');
 assert.match(trainPrompt(g,p),/WISE LITTLE GOBLIN/);

 press(g,{interact:true});
 assert.equal(npcDialogueView(g,p).npc.name,'Wise Little Goblin');
 press(g,{interact:true});
 assert.match(npcDialogueView(g,p).text,/reeds all go quiet/);
 press(g,{interact:true});
 assert.match(npcDialogueView(g,p).text,/Light inside this hilt/);
 p.inventory=Array.from({length:BACKPACK_SLOTS},()=>({type:'fruit',qty:1}));
 press(g,{down:true});press(g,{interact:true});
 assert.match(npcDialogueView(g,p).text,/one pocket empty/);
 assert.equal(p.npcQuests?.wiseLittleGoblin,undefined);
 p.inventory[0]=null;
 press(g,{down:true});press(g,{interact:true});
 assert.match(npcDialogueView(g,p).text,/green blade is/);
 assert.equal(count(p),1);assert.equal(count(other),0);
 assert.equal(p.npcQuests.wiseLittleGoblin.bladeClaimed,true);
 press(g,{close:true});step(g,13,{y:1});assert.ok(p.y>HUT.front+20,'The same doorway stays usable to exit');

 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),hero=restored.players[0];
 restored.persist=()=>{};restored.onSound=()=>{};
 Object.assign(hero,{x:HUT.cx,y:HUT.front-33});
 press(restored,{interact:true});press(restored,{down:true});press(restored,{interact:true});
 assert.match(npcDialogueView(restored,hero).text,/empty hook/);
 assert.equal(count(hero),1);
 assert.ok(!npcDialogueView(restored,hero).choices.some(choice=>choice.action==='take'));
});
