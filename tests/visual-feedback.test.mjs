import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {bowRigGeometry} from '../src/player-motion.mjs';
import {arrowImpactWobble,embeddedArrowGeometry} from '../src/embedded-arrow.mjs';
import {tickFern} from '../src/fern-art.mjs';
import {resizeGameSurface} from '../src/render-settings.mjs';
test('Opening attack works on press with an empty bow and keeps all six heroes facing inward',()=>{
 const g=new Game(()=>.5);for(let i=0;i<6;i++)g.addPlayer('pad:'+i);g.start();
 for(const p of g.players){assert.ok(g.canHitBoard(p));const before=[p.x,p.y];g.update(.016,{[p.device]:{x:1,y:1,aimX:1,aimY:1}});assert.deepEqual([p.x,p.y],before);assert.ok(g.canHitBoard(p));}
 const p=g.players[0];p.equipment.hand1='bow';p.inventory=[];g.update(.016,{[p.device]:{attack:true,x:-1,y:1}});
 assert.equal(g.roll.playerId,p.id);assert.equal(g.arrows.length,0);
});
test('Bow keeps nonzero curve width in all eight directions',()=>{for(let d=0;d<8;d++){const b=bowRigGeometry({x:0,y:0},d);assert.ok(Math.abs(b.top.x)>=2.5);assert.equal(b.bottom.y-b.top.y,20);}});
test('Embedded arrow settles without moving its point of contact',()=>{const a={x:10,y:20,z:2,angle:.5,impactTime:2};assert.notEqual(arrowImpactWobble(a,2.05),0);assert.equal(arrowImpactWobble(a,3),0);const p=embeddedArrowGeometry(a,2.05);assert.equal(p.x,10);assert.equal(p.y,18);assert.equal(embeddedArrowGeometry(a,3).angle,.5);});
test('Walking pushes fern fronds and the spring settles; airborne players do not disturb them',()=>{const p={x:20,y:20},actor={x:18,y:20,hp:100,moving:true,faceX:1};for(let i=0;i<10;i++)tickFern(p,[actor],.016);assert.ok(p.fernX>0);for(let i=0;i<240;i++)tickFern(p,[],.016);assert.ok(Math.abs(p.fernX)<.01);const fresh={x:20,y:20};tickFern(fresh,[{...actor,jumpHeight:20}],.016);assert.equal(fresh.fernX,0);});
test('Shared render surface preserves aspect ratio and native resolution',()=>{const canvas={clientWidth:1280,clientHeight:720},c={setTransform(){}};const v=resizeGameSurface(canvas,c);assert.equal(v.w/v.h,1280/720);assert.equal(canvas.width/canvas.height,1280/720);assert.equal(c.imageSmoothingEnabled,false);});
