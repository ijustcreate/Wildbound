import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyShadowMaps,encodeHeightPlane,decodeHeightPlane,validShadowMaps,shadowMapPlanes,buildShadowMask,paintShadowMap,generateSceneShadowMaps,rayMarchShadow,runtimeSun,resampleShadowMaps} from '../src/realtime-shadows.mjs';

test('shadow asset stores independent ground, detail and back height planes',()=>{
 const maps=emptyShadowMaps(16,16);assert.equal(validShadowMaps(maps),true);
 const sample=Uint8Array.from([0,32,255]);assert.deepEqual([...decodeHeightPlane(encodeHeightPlane(sample),3)],[0,32,255]);
 assert.ok(encodeHeightPlane(new Uint8Array(1000)).startsWith('rle:'));
 const legacy={...maps};for(const key of ['ground','detail','back'])legacy[key]=Buffer.from(decodeHeightPlane(legacy[key],256)).toString('base64');assert.equal(validShadowMaps(legacy),true,'older raw-base64 assets remain valid');
 const painted=paintShadowMap(maps,'back',[{x:4,y:4}],{radius:1,value:180}),planes=shadowMapPlanes(painted);
 assert.equal(planes.back[4*16+4],180);assert.equal(planes.detail[4*16+4],0);assert.equal(planes.ground[4*16+4],0);
});

test('default maps use high-resolution samples and legacy maps can be enlarged smoothly',()=>{
 const defaults=emptyShadowMaps();assert.equal(defaults.width,512);assert.equal(defaults.height,512);assert.equal(validShadowMaps(defaults),true);
 const coarse=emptyShadowMaps(8,8),layer=new Uint8Array(64);layer[3*8+3]=255;coarse.detail=encodeHeightPlane(layer);
 const large=resampleShadowMaps(coarse,32,32),plane=shadowMapPlanes(large).detail;
 assert.equal(large.cellSize,50);assert.equal(validShadowMaps(large),true);assert.ok(plane[12*32+12]>0&&plane[12*32+12]<255,'bilinear upgrade smooths old map texels');
});

test('ray marcher uses stable ground baseline and finds either overlapping caster layer',()=>{
 const maps=emptyShadowMaps(16,16);maps.cellSize=1;maps.darkness=.5;maps.detail=encodeHeightPlane(new Uint8Array(256));
 const back=new Uint8Array(256);back[8*16+8]=120;maps.back=encodeHeightPlane(back);
 const mask=buildShadowMask(maps,{azimuth:0,elevation:38,steps:12});
 assert.equal(mask[8*16+5],128,'sunward ray encounters the supplemental back layer');
 assert.equal(mask[8*16+10],0,'the opposite side is outside this caster shadow');
 const ground=new Uint8Array(256);ground[8*16+5]=80;maps.ground=encodeHeightPlane(ground);
 assert.equal(buildShadowMask(maps,{azimuth:0,elevation:38,steps:12})[8*16+5],128,'ground baseline is considered separately from fine detail');
 const planes=shadowMapPlanes(maps);assert.equal(rayMarchShadow(maps,planes,5,8,{dx:1,dy:0,elevation:38*Math.PI/180,steps:12}),1);
 const ramp=emptyShadowMaps(16,16),stableGround=new Uint8Array(256);ramp.cellSize=1;ramp.darkness=.5;stableGround[8*16+8]=120;ramp.ground=encodeHeightPlane(stableGround);
 assert.equal(buildShadowMask(ramp,{azimuth:0,elevation:38,steps:12})[8*16+5],128,'smooth ground elevation itself participates as an occluder');
});

test('scene generation builds front and hidden height layers at the authored world anchor',()=>{
 const scene={x:1100,y:760,props:[{kind:'tree',dx:40,dy:-20,size:100,height:130,depth:80}]};
 const maps=generateSceneShadowMaps(scene,32,32);assert.equal(validShadowMaps(maps),true);
 const p=shadowMapPlanes(maps),cx=Math.round((scene.x+40)/50),cy=Math.round((scene.y-20)/50);
 assert.ok(p.detail[cy*32+cx]>0);assert.ok(p.back.some(v=>v>0));
});

test('sun heading changes over the day while the ray marcher remains bounded',()=>{
 const morning=runtimeSun({sky:{elapsed:0}}),midday=runtimeSun({sky:{elapsed:120}}),late=runtimeSun({sky:{elapsed:239}});
 assert.notEqual(morning.azimuth,midday.azimuth);assert.notEqual(midday.azimuth,late.azimuth);
 const maps=emptyShadowMaps(8,8);maps.raySteps=151;assert.equal(validShadowMaps(maps),false);
});
