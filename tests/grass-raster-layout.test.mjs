import test from 'node:test';
import assert from 'node:assert/strict';
import {grassRasterLayout,GRASS_BUFFER_WIDTH,GRASS_BUFFER_HEIGHT} from '../src/grass-raster-layout.mjs';
test('portrait, ultrawide and co-op camera spans fit the fixed GPU buffer',()=>{for(const [w,h]of [[640,480],[1280,850],[1780,1000],[3840,2160],[800,2400]])for(const zoom of [.012,.07,.1,.3,.64,1,1.35,2.6,4]){const a=grassRasterLayout(w,h,zoom);assert.ok(a.width<=GRASS_BUFFER_WIDTH&&a.height<=GRASS_BUFFER_HEIGHT);assert.ok(a.width*a.pixelStep>=w/zoom+128);assert.ok(a.height*a.pixelStep>=h/zoom+128);}});
test('tiny co-op zoom changes do not resize the grass raster each frame',()=>{const sizes=new Set();for(let i=0;i<240;i++){const a=grassRasterLayout(1780,1000,.64+i*.00001);sizes.add(a.width+':'+a.height);}assert.ok(sizes.size<=2);});
test('a substantial camera zoom adjusts the sampled world-pixel density',()=>{const close=grassRasterLayout(1780,1000,1.35),far=grassRasterLayout(1780,1000,.1);assert.ok(far.pixelStep>close.pixelStep);});
