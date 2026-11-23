import test from 'node:test';
import assert from 'node:assert/strict';
import {drawShadowGroundFog,shadowFogDiagnostics,sampleShadowGroundFog,sampleShadowFogVelocity} from '../src/shadow-ground-fog.mjs';

// The numerical simulation is real; only the Canvas raster sink is stubbed.
const context=()=>({save(){},restore(){},beginPath(){},rect(){},clip(){},drawImage(){},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}});
globalThis.document={createElement:()=>({getContext:context})};
const bounds={sx:0,sy:0,ex:19,ey:12};
const fixture=()=>({generatedEnvironment:'shadow',seed:42,time:1,players:[{x:200,y:320,hp:100,faceX:1,faceY:0}],enemies:[]});
function frame(g,dt=1/30){g.time+=dt;drawShadowGroundFog(context(),g,bounds);}

test('movement carves a persistent trail that replenishes after the actor leaves',()=>{
 const g=fixture();frame(g);const before=sampleShadowGroundFog(g,400,320);
 for(let i=0;i<20;i++){g.players[0].x+=10;frame(g);}
 const cleared=sampleShadowGroundFog(g,400,320);assert.ok(cleared<before*.65);
 g.players[0].x=600;frame(g);for(let i=0;i<180;i++)frame(g);
 assert.ok(sampleShadowGroundFog(g,400,320)>cleared);
});
test('a final half-pixel landing and a new attack each inject one disturbance',()=>{
 const g=fixture();frame(g);g.players[0].jumpHeight=.5;frame(g);g.players[0].jumpHeight=0;frame(g);
 g.players[0].attack=.34;frame(g);g.players[0].attack=.3;frame(g);
 const d=shadowFogDiagnostics(g);assert.equal(d.landings,1);assert.equal(d.attacks,1);
});
test('teleports do not carve a long streak across the realm',()=>{
 const g=fixture();frame(g);g.players[0].x+=400;frame(g);assert.equal(shadowFogDiagnostics(g).wakes,0);
});
test('running adds a stronger rolling wake than slow walking',()=>{
 const walk=fixture(),run=fixture();frame(walk);frame(run);
 for(let i=0;i<12;i++){walk.players[0].x+=1;run.players[0].x+=8;frame(walk);frame(run);}
 assert.equal(shadowFogDiagnostics(walk).swirls,0);assert.ok(shadowFogDiagnostics(run).swirls>0);
 const speed=g=>{const p=g.players[0],v=sampleShadowFogVelocity(g,p.x-25,p.y+30);return Math.hypot(v.x,v.y);};
 assert.ok(speed(run)>speed(walk)+.5);
});
test('fluid clock is independent of repeated render passes and render frame rate',()=>{
 const a=fixture(),b=fixture();drawShadowGroundFog(context(),a,bounds);drawShadowGroundFog(context(),b,bounds);
 for(let i=0;i<60;i++){frame(a,1/60);drawShadowGroundFog(context(),a,bounds);}
 for(let i=0;i<30;i++)frame(b,1/30);
 assert.equal(shadowFogDiagnostics(a).steps,30);assert.equal(shadowFogDiagnostics(b).steps,30);
 const density=sampleShadowGroundFog(a,400,320);drawShadowGroundFog(context(),a,bounds);assert.equal(sampleShadowGroundFog(a,400,320),density);
});
test('camera travel, negative coordinates and extreme zoom retain a bounded cache',()=>{
 const g=fixture();for(let i=0;i<16;i++){g.time+=1/30;drawShadowGroundFog(context(),g,{sx:-1000+i*73,sy:-400,ex:-960+i*73,ey:-370});}
 drawShadowGroundFog(context(),g,{sx:-50000,sy:-50000,ex:50000,ey:50000});
 assert.ok(shadowFogDiagnostics(g).fields<=8);assert.ok(Number.isFinite(sampleShadowGroundFog(g,-1000,-1000)));
 const outside=fixture();outside.generatedEnvironment='forest';assert.equal(drawShadowGroundFog(context(),outside,bounds),0);assert.equal(shadowFogDiagnostics(outside),null);
});
