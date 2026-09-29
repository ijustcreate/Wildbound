import test from 'node:test';import assert from 'node:assert/strict';
import {treeBase,treeType,treeStructure,forestSettings,treeSeason,forestDecor,tickForest,waterBodyAt} from '../src/forest.mjs';
import {propBase,tickEnvironment} from '../src/environment.mjs';
import {Game} from '../src/core.mjs';import {defaultHouse} from '../src/house-design.mjs';
import {capeRows} from '../src/cape-motion.mjs';
test('Felling keeps full-sized tree root and stump at exactly the same ground position',()=>{
 for(const kind of ['tree','snow_tree','palm']){const g=new Game();g.addPlayer('keyboard');g.start();const tree={x:400,y:360,size:112,kind,procedural:true,falling:1.4,depleted:true};g.scenery=[tree];const base=propBase(tree);tickEnvironment(g,.2);assert.ok(tree.fallen);assert.deepEqual(propBase(tree),base);assert.equal(tree.size,112);}
});
test('Three seeded tree types vary structure reproducibly and support winter',()=>{
 const kinds=new Set();for(let i=0;i<50;i++){const p={x:i*32,y:300,size:100,kind:'tree'};kinds.add(treeType(p));assert.deepEqual(treeStructure(p),treeStructure({...p}));}
 assert.equal(kinds.size,3);assert.notDeepEqual(treeStructure({x:1,y:2}),treeStructure({x:3,y:4}));assert.equal(treeSeason({kind:'snow_tree'}),'winter');
});
test('Natural forest water gets reeds and pads; explicitly tagged pools never do',()=>{
 const g={seed:1,generatedEnvironment:'forest',terrain:Array(2500).fill('grass'),scenery:[]};for(let y=2;y<48;y++)for(let x=5;x<8;x++)g.terrain[y*50+x]='water';
 assert.equal(waterBodyAt(g,200,300),'natural');assert.ok(forestDecor(g).banks.some(p=>p.kind==='reeds'));assert.ok(forestDecor(g).banks.some(p=>p.kind==='lily'));
 g.house={pools:[{x:160,y:64,w:96,h:1472,waterType:'pool'}]};assert.equal(waterBodyAt(g,200,300),'pool');assert.equal(forestDecor(g).banks.length,0);assert.ok(defaultHouse().pools.every(p=>p.waterType==='pool'));
});
test('Walking disturbs leaves and bushes, then movement settles',()=>{
 const g={seed:1,time:1,terrain:Array(2500).fill('grass'),scenery:[{kind:'tree',treeType:'oak',x:300,y:300,size:100},{kind:'bush',x:300,y:330,size:40}],players:[]};const leaf=forestDecor(g).leaves[0];
 g.players=[{x:leaf.x-3,y:leaf.y,hp:100,moving:true,faceX:1}];tickForest(g,.1);assert.ok(leaf.dx>0);
 g.players[0].x=300;g.players[0].y=337;tickForest(g,.1);assert.equal(g.scenery[1].rustle,1);g.players=[];tickForest(g,1);assert.equal(g.scenery[1].rustle,0);
});
test('Cape collar follows asymmetric shoulder joints and upper fabric moves below the pins',()=>{
 const pins={left:[-6,1,27],right:[5,0,24]},top=pins.left.map((v,i)=>(v+pins.right[i])/2),bottom=[0,0,15];
 const a=capeRows(top,bottom,{moving:true},0,'',pins),b=capeRows(top,bottom,{moving:true},.4,'',pins);
 assert.deepEqual(a[0].left,[-6,-2,27]);assert.deepEqual(a[0].right,[5,-3,24]);assert.deepEqual(a[0].left,b[0].left);assert.notDeepEqual(a[3].left,b[3].left);
});
