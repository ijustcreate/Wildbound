import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultWorldDesign,readWorldDesign,validateWorldDesign,writeWorldDesign,scenesInRegion} from '../src/world-authoring.mjs';
import {authoredPropsInRegion,applyAuthoredScenes} from '../src/world-authoring-runtime.mjs';
import {Game} from '../src/core.mjs';

function storage(){const values=new Map();return{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}
test('World Editor defaults are editable, validate cleanly, and save as human-readable JSON',()=>{
 const s=storage(),design=defaultWorldDesign();assert.equal(validateWorldDesign(design),true);
 assert.equal(design.levels.find(x=>x.id==='forest').scenes[0].npcs.filter(n=>n.id!=='rowan').length,3);
 writeWorldDesign(design,s);assert.deepEqual(readWorldDesign(s),design);
 const restored=readWorldDesign(s);restored.levels[0].food=.45;assert.equal(writeWorldDesign(restored,s).levels[0].food,.45);
});
test('authored forest scenes add placed props, three residents and a Keeper quest-giver to local exploration only',()=>{
 const g=new Game(()=>.2);g.environment='forest';g.addPlayer('keyboard','Explorer');g.start();g.openingBoard=false;g.localWorld={id:'test-world'};
 const scenes=scenesInRegion('forest',0,0);assert.equal(scenes.length,1);
 const props=authoredPropsInRegion('forest',0,0);assert.equal(props.length,2);assert.ok(props.every(p=>p.id.startsWith('boundless:0:0:scene:')));
 applyAuthoredScenes(g,0,0);
 assert.deepEqual(g.villagers.map(v=>v.villagerId).sort(),['bram','fern','poppy']);
 assert.equal(g.questNpcs.filter(n=>n.npcId==='rowan').length,1);
 assert.equal(g.villageCampState.fire.x,1120);assert.equal(g.scenery.filter(p=>p.id.startsWith('boundless:0:0:scene:')).length,2);
 applyAuthoredScenes(g,0,0);assert.equal(g.villagers.length,3);assert.equal(g.questNpcs.filter(n=>n.npcId==='rowan').length,1);
});
