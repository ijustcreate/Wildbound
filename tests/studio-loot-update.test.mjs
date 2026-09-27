import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.mjs';
import { defaultPlayerMotion, poseAt, validatePlayerMotion } from '../src/player-motion.mjs';
import { insertFrame, removeFrame, moveGraphKey } from '../src/animation-graph.mjs';
import { paintLayers, renderLayers } from '../src/render-order.mjs';
import { drawPortal } from '../src/portal-art.mjs';
test('First and fourth-space rolls do not manufacture loot',()=>{
 const g=new Game(()=>0.1),p=g.addPlayer('keyboard');g.start();
 assert.equal(g.loot.length,0);
 g.hitTable(p);g.resolveRoll();assert.equal(g.loot.length,0);
 p.progress=2;g.roll=null;g.turnOrder=[];g.hitTable(p);g.resolveRoll();assert.equal(p.progress,4);assert.equal(g.loot.length,0);
});
test('Victory gathers all unclaimed loot without a 24-slot cap or duplicate awards',()=>{
 const g=new Game(),p=g.addPlayer('keyboard');g.start();
 g.loot=Array.from({length:60},(_,i)=>({type:i%2?'potion':'sword',qty:i+1,x:50,y:50}));
 const expected=g.loot.map(({type,qty})=>({type,qty}));
 g.completeVictory();assert.deepEqual(g.victoryRewards,expected);assert.equal(g.loot.length,0);
 g.completeVictory();assert.deepEqual(g.victoryRewards,expected);
 g.openInventory(p,'victory');g.inventoryAction(p,'panel:chest');g.inventoryAction(p,'select:50');assert.equal(p.ui.index,50);
 g.newExpedition();assert.equal(g.loot.length,0);assert.deepEqual(g.victoryRewards,expected);assert.ok(g.victoryChest);
});
test('Graph frame changes preserve keys and outgoing easing affects the game pose',()=>{
 const m=defaultPlayerMotion(),c=m.clips.idle;
 c.keys=[{frame:0,joints:{head:[0,0,0]},interpolation:{head:'hold'}},{frame:4,joints:{head:[8,0,0]}}];
 assert.equal(poseAt(m,'idle',2).head[0],0);
 c.keys[0].interpolation.head='linear';assert.equal(poseAt(m,'idle',2).head[0],4);
 c.keys[0].interpolation.head='smooth';assert.equal(poseAt(m,'idle',1).head[0],1.25);
 insertFrame(c,3);assert.equal(c.keys[1].frame,5);removeFrame(c,3);assert.equal(c.keys[1].frame,4);
 assert.ok(moveGraphKey(c,'head',4,6,0,9));assert.equal(c.keys.find(k=>k.frame===6).joints.head[0],9);
 assert.ok(validatePlayerMotion(JSON.parse(JSON.stringify(m))));
});
test('Per-facing layer order survives JSON and leaves other facings automatic',()=>{
 const model=JSON.parse(JSON.stringify({renderOrder:{2:['front','back']}}));const painted=[];
 const queue=[{id:'back',depth:0,fn:()=>painted.push('back')},{id:'front',depth:1,fn:()=>painted.push('front')}];
 paintLayers(queue,model,2);assert.deepEqual(painted,['front','back']);assert.deepEqual(renderLayers(model,2),painted);
 painted.length=0;paintLayers(queue,model,6);assert.deepEqual(painted,['back','front']);
});
test('Portal outline and glow use the owning player highlight',()=>{
 const c={save(){},restore(){},translate(){},beginPath(){},ellipse(){},stroke(){},fill(){},fillText(){}};
 drawPortal(c,{x:0,y:0,color:'#22bb99',closing:null},0);
 assert.equal(c.shadowColor,'#22bb99');assert.equal(c.strokeStyle,'#22bb99');
});
