import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaultPlayerMotion,upgradePlayerMotion,bowRigGeometry} from '../src/player-motion.mjs';
import {addReaperClips} from '../src/reaper-clips.mjs';
import {updateBowAimBlend} from '../src/ranged-aim.mjs';
import {setTreeFallDirection,treeFallVector,applyTreeFall} from '../src/tree-fall.mjs';
import {tickVehicleEffects} from '../src/house-vehicles.mjs';
import {drawVehicleEffects} from '../src/house-render.mjs';
test('bow plane rotates continuously and perpendicular to the world aim at all angles',()=>{
 let old;
 for(let degrees=0;degrees<=360;degrees+=.5){const d=degrees/45,a=d*Math.PI/4,actor={equipment:{hand1:'bow'},faceX:-Math.sin(a),faceY:Math.cos(a),bowAiming:true,hp:100,bowVisualAngle:2};updateBowAimBlend(actor,{},1/60);assert.ok(Math.abs(Math.sin(actor.bowVisualAngle-a))<1e-9);const q=bowRigGeometry({x:0,y:0},d);assert.ok(Math.abs((q.top.x-q.bottom.x)*actor.faceX+(q.top.y-q.bottom.y)*actor.faceY)<1e-8);if(old)assert.ok(Math.hypot(q.top.x-old.x,q.top.y-old.y)<.12,'no facing-boundary snap');old=q.top;}
});
test('only recognized shipping scythe clips migrate; edited keys and joints survive',()=>{
 const authored=JSON.parse(fs.readFileSync(new URL('../authored/rigs.json',import.meta.url))).player,old=JSON.stringify(authored),up=upgradePlayerMotion(authored);
 assert.equal(JSON.stringify(authored),old);assert.notDeepEqual(up.clips.scythe_sweep.keys,authored.clips.scythe_sweep.keys);
 const custom=defaultPlayerMotion();custom.clips.scythe_sweep.keys[2].joints.handR[0]+=.123;const clip=JSON.stringify(custom.clips.scythe_sweep),joints=JSON.stringify(custom.joints);addReaperClips(custom);assert.equal(JSON.stringify(custom.clips.scythe_sweep),clip);assert.equal(JSON.stringify(custom.joints),joints);
});
test('tree falls keep all eight impact directions and preserve the cut pivot',()=>{
 for(let d=0;d<8;d++){const a=d*Math.PI/4,t={};setTreeFallDirection(t,Math.cos(a),Math.sin(a));const v=treeFallVector(t);assert.ok(Math.abs(v.x-Math.cos(a))<1e-10&&Math.abs(v.y-Math.sin(a))<1e-10);let matrix;applyTreeFall({transform(...m){matrix=m;}},t,Math.PI/2);assert.equal(matrix[4],0);assert.equal(matrix[5],0);assert.ok(matrix.every(Number.isFinite));}
 assert.deepEqual(treeFallVector({fallDirection:-1}),{x:-1,y:0});
});
test('rear-wheel tracks follow both axles, expire, and preserve camera transforms',()=>{
 const v={x:300,y:300,w:96,h:144,heading:0,speed:100},g={onSound(){}};tickVehicleEffects(g,v,.1);v.y-=20;tickVehicleEffects(g,v,.1);assert.equal(v.effects.tracks.length,2);assert.ok(v.effects.tracks[0].x<300&&v.effects.tracks[1].x>300);assert.ok(v.effects.tracks.every(t=>t.y2<t.y));
 const calls=[],c=new Proxy({globalAlpha:1,save(){},restore(){},setTransform(){throw Error('World transform reset');}},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});drawVehicleEffects(c,v);assert.ok(calls.some(([k])=>k==='stroke'));v.speed=0;tickVehicleEffects(g,v,7);assert.equal(v.effects.tracks.length,0);
});
