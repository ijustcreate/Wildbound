import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enemyCanSeeTarget,forgetHiddenTarget} from '../src/enemy-sight.mjs';
import {renderLOD} from '../src/render-lod.mjs';
import {cameraTarget} from '../src/core.mjs';
test('underwater hides players from ground and flying enemies, except crocodiles',()=>{
 const p={hp:100,swimming:true,diveDepth:.6};
 for(const kind of ['wolf','bat','wasp','panther'])assert.equal(enemyCanSeeTarget({kind},p),false);
 assert.equal(enemyCanSeeTarget({kind:'crocodile'},p),true);
 assert.equal(enemyCanSeeTarget({kind:'wolf'},{...p,diveDepth:0}),true);
});
test('bridges and buried quicksand hide even from crocodiles; cancel queued attacks',()=>{
 for(const state of [{underBridge:true},{quicksandUnder:true}])assert.equal(enemyCanSeeTarget({kind:'crocodile'},{hp:100,...state}),false);
 const e={attack:1,throwTime:1,target:{},night:{phase:'aim',timer:3}};forgetHiddenTarget(e);assert.equal(e.attack,0);assert.equal(e.target,null);assert.equal(e.night.phase,'idle');
});
test('event reveal never zooms out more than fifteen percent and keeps party center',()=>{
 const players=[{x:600,y:600},{x:700,y:700}],party=cameraTarget(players,1200,800),event=cameraTarget(players,1200,800,{x:1500,y:1500});
 assert.ok(event.zoom>=party.zoom*.85);assert.equal(event.x,party.x);assert.equal(event.y,party.y);
});
test('rendering has three deterministic tiers',()=>{assert.equal(renderLOD(2),0);assert.equal(renderLOD(.8),1);assert.equal(renderLOD(.3),2);});
