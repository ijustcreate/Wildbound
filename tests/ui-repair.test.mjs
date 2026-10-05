import test from 'node:test';
import assert from 'node:assert/strict';
import {dialogNeighbour} from '../src/dialog-navigation.mjs';
import {spawnDebugItem} from '../src/game-debug.mjs';
import {Game} from '../src/core.mjs';
import {count} from '../src/items.mjs';
import {purchaseVending,vendingStock} from '../src/shops.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {treeFallPose,TREE_CUT_Y,drawForestTree,drawPalmTree} from '../src/forest.mjs';
import {sampleWhip,WHIP_SEGMENTS} from '../src/whip-visual.mjs';

const button=(left,top,width=100,height=40)=>({getBoundingClientRect:()=>({left,top,width,height})});
test('pause menu directions follow columns, volume pairs and full-width footer',()=>{
 const a=button(0,0),b=button(120,0),c=button(0,60),d=button(120,60),e=button(0,120,220),controls=[a,b,c,d,e];
 assert.equal(dialogNeighbour(controls,a,1,0),b);assert.equal(dialogNeighbour(controls,b,0,1),d);
 assert.equal(dialogNeighbour(controls,d,-1,0),c);assert.equal(dialogNeighbour(controls,c,0,1),e);
 assert.equal(dialogNeighbour(controls,d,1,0),d);assert.equal(dialogNeighbour(controls,null,0,1),a);
});
function setup(){const g=new Game(()=>.5),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:1');g.start();g.terrain.fill('grass');g.scenery=[];p.inventory=[];q.inventory=[];p.x=400;p.y=400;q.x=900;q.y=900;return {g,p,q};}
test('dev item inventory spawn targets only the opener, is atomic and survives a save',()=>{
 const {g,p,q}=setup();assert.equal(spawnDebugItem(g,q.id,'sword_of_a_thousand_truths',1).ok,true);
 assert.equal(count(p,'sword_of_a_thousand_truths'),0);assert.equal(count(q,'sword_of_a_thousand_truths'),1);
 q.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));const before=structuredClone(q.inventory);
 assert.equal(spawnDebugItem(g,q.id,'potion',3).ok,false);assert.deepEqual(q.inventory,before);
 q.inventory=[];assert.equal(spawnDebugItem(g,q.id,'arrow',999).ok,true);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(count(restored.players[1],'arrow'),999);
});
test('dev ground spawn uses opener position, leaves inventory untouched and rejects invalid requests',()=>{
 const {g,p,q}=setup();assert.equal(spawnDebugItem(g,q.id,'potion',5,'ground').ok,true);
 assert.equal(g.loot.at(-1).qty,5);assert.ok(Math.hypot(g.loot.at(-1).x-q.x,g.loot.at(-1).y-q.y)<100);
 assert.equal(g.loot.at(-1).manualPickup,true);assert.equal(count(q,'potion'),0);
 for(const [id,type,amount,dest]of [[99,'sword',1,'inventory'],[p.id,'invalid',1,'inventory'],[p.id,'sword',1.5,'inventory'],[p.id,'sword',1000,'ground'],[p.id,'sword',1,'party']])assert.equal(spawnDebugItem(g,id,type,amount,dest).ok,false);
 assert.equal(g.loot.length,1);
});
test('vending resets on new expedition, not session resume, and preserves paid purchases',()=>{
 const {g,p}=setup();p.coins=100;p.vendingStock=vendingStock();purchaseVending(p,p,0);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.players[0].vendingStock[0].qty,4);
 assert.equal(restored.players[0].vendingOrders.length,1);assert.equal(restored.players[0].coins,90);
 g.start();assert.ok(p.vendingStock.every(s=>s.qty===5));assert.equal(p.vendingOrders.length,1);assert.equal(p.coins,90);
});
const mockCanvas=()=>{
 const ops=[],c={globalAlpha:1,save(){ops.push(['save']);},restore(){ops.push(['restore']);},translate(...a){ops.push(['translate',...a]);},scale(){},transform(){},rotate(...a){ops.push(['rotate',...a]);},beginPath(){},rect(...a){ops.push(['clip-rect',...a]);},clip(){},fillRect(...a){ops.push(['pixel',this.fillStyle,...a]);}};
 return {c,ops};
};
test('all tree families split above stationary roots, with bounded falling pose and gradual acceleration',()=>{
 for(const kind of ['oak','birch','pine','palm']){
  const p={kind:kind==='palm'?'palm':'tree',treeType:kind,x:100,y:100,size:64,falling:.6,fallDirection:-1};
  const {c,ops}=mockCanvas();(kind==='palm'?drawPalmTree:drawForestTree)(c,p,0);
  const rotation=ops.findIndex(o=>o[0]==='rotate'),rootClip=ops.findIndex(o=>o[0]==='clip-rect');
  assert.ok(rootClip>=0&&rootClip<rotation);assert.equal(ops.filter(o=>o[0]==='rotate').length,1);
  assert.deepEqual(ops[rotation-1],['translate',0,TREE_CUT_Y]);
  assert.equal(ops.filter(o=>o[0]==='clip-rect')[1].at(-1),200+TREE_CUT_Y);
  assert.ok(treeFallPose({...p,falling:.55}).angle>-Math.PI/4);
  assert.equal(treeFallPose({...p,falling:1.5}).alpha,0);
  assert.equal(treeFallPose({...p,falling:1.5}).angle,-Math.PI/2);
 }
});
test('winter tree snow uses small scalloped drifts instead of broad rectangular tiers',()=>{
 const {c,ops}=mockCanvas();drawForestTree(c,{kind:'snow_tree',x:100,y:100,size:64},0,{generatedEnvironment:'ice'});
 const snow=ops.filter(o=>o[0]==='pixel'&&['#8caeb9','#d3e8eb','#f0faf5'].includes(o[1]));
 assert.ok(snow.length>50);assert.ok(snow.every(o=>o[4]<26));
});
test('whip has wind-up, extension, snap and recovery and reuses a fixed rope buffer',()=>{
 const buffer=new Float32Array((WHIP_SEGMENTS+1)*3);
 for(const action of ['idle','slash','swipe_one','swipe_two','swipe_big','sword_combo'])for(let n=0;n<=100;n++){
  const s=sampleWhip(action,n/100,'R',buffer);assert.equal(s.points,buffer);assert.ok([...buffer].every(Number.isFinite));assert.deepEqual([...buffer.slice(0,3)],[0,0,0]);
  assert.ok(s.extension>=0&&s.extension<=1);assert.ok(s.crack>=0&&s.crack<=1);
 }
 const load=sampleWhip('swipe_one',.2),snap=sampleWhip('swipe_one',.5),recovery=sampleWhip('swipe_one',1);
 assert.ok(snap.extension>load.extension+.9);assert.ok(snap.crack>.9);assert.equal(recovery.extension,0);
 assert.ok(Math.hypot(...snap.points.slice(-3))>Math.hypot(...load.points.slice(-3))*2);
});
