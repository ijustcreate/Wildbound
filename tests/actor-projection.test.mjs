import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {facingIndex,projectPoint} from '../src/actor-projection.mjs';

test('low-level art math preserves all eight facing and projection conventions',()=>{
 assert.deepEqual([[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]].map(([x,y])=>facingIndex(x,y)),[0,1,2,3,4,5,6,7]);
 for(const [d,expected]of [[0,[7,-18.5,-11]],[2,[11,-9.5,7]],[4,[-7,-7.5,11]],[6,[-11,-16.5,-7]]]){const point=projectPoint([7,-11,13],d);for(const [i,key]of ['x','y','depth'].entries())assert.ok(Math.abs(point[key]-expected[i])<1e-9,`direction ${d} ${key}`);}
});
test('bird and pixel art can load before the player rig without a JOINTS initialization cycle',()=>{
 const result=spawnSync(process.execPath,['--input-type=module','-e',"await import('./src/snowy-owl-art.mjs'); await import('./src/raven-art.mjs'); await import('./src/pixel-shapes.mjs'); await import('./src/player-motion.mjs'); await import('./src/core.mjs'); console.log('ready'); process.exit(0);"],{cwd:fileURLToPath(new URL('..',import.meta.url)),encoding:'utf8',timeout:120000,windowsHide:true});
 assert.equal(result.status,0,result.stderr||result.error?.message);assert.ok(result.stdout.includes('ready'));
});
