import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {QuicksandSurface,QUICKSAND_LIMITS,buildQuicksandTopology,quicksandEdge,quicksandCoverage,quicksandVisible,quicksandBounds} from '../src/quicksand-surface.mjs';
import {generateWorld} from '../src/world.mjs';
import {Renderer} from '../src/render.mjs';

function game(){return {terrain:Array(2500).fill('sand'),seed:42,phase:'play',bloom:3,time:0,generatedEnvironment:'desert'};}
function fill(g,sx,sy,ex,ey){for(let y=sy;y<ey;y++)for(let x=sx;x<ex;x++)g.terrain[y*50+x]='quicksand';return g;}
function canvasMock(){
 const calls={};const c=new Proxy({calls,createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(target,key)=>key in target?target[key]:(...args)=>{if(key==='getImageData')throw Error('Runtime readback');(calls[key]||=[]).push(args);},set:(t,k,v)=>{t[k]=v;return true;}});
 const events={},canvas={width:300,height:150,getContext:kind=>kind==='2d'?c:null,addEventListener:(name,fn)=>{events[name]=fn;},events};c.canvas=canvas;return canvas;
}
function withDocument(fn){const previous=globalThis.document;globalThis.document={createElement:canvasMock};try{fn();}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}}

test('one bounded 50x50 topology encodes connected-patch centers without mutating terrain',()=>{
 const g=fill(game(),7,8,13,12);g.terrain[12*50+13]='quicksand';const before=JSON.stringify(g),t=buildQuicksandTopology(g.terrain);
 assert.equal(t.data.byteLength,QUICKSAND_LIMITS.maskBytes);assert.equal(t.labels.length,2500);assert.equal(t.patches.length,2);assert.equal(t.patches[0].tiles,24);
 assert.deepEqual([...t.data.slice((8*50+7)*4,(8*50+7)*4+4)],[...t.data.slice((11*50+12)*4,(11*50+12)*4+4)]);
 assert.notEqual(t.labels[8*50+7],t.labels[12*50+13]);assert.equal(JSON.stringify(g),before);
 for(const seed of [1,42,999]){const world=generateWorld(seed,'desert'),topology=buildQuicksandTopology(world.terrain);assert.equal(topology.patches.length,4);assert.ok(topology.patches.every(p=>p.tiles>=20));}
});
test('union distance and ragged shore are continuous across shared tile boundaries',()=>{
 const t=buildQuicksandTopology(fill(game(),10,10,14,14).terrain);
 assert.equal(quicksandEdge(t,11*32,11*32+16),32);assert.equal(quicksandCoverage(t,11*32,11*32+16),1);
 for(let y=320;y<448;y+=.5)for(const x of [352,384,416]){
  assert.ok(Math.abs(quicksandEdge(t,x-.001,y)-quicksandEdge(t,x+.001,y))<.003);
  assert.ok(Math.abs(quicksandCoverage(t,x-.001,y)-quicksandCoverage(t,x+.001,y))<=.25);
 }
 const edgeValues=new Set();for(let y=326;y<442;y+=2)edgeValues.add(quicksandCoverage(t,324,y));assert.ok(edgeValues.size>=3,'shore should vary along an edge');
 assert.equal(quicksandCoverage(t,319,370),0);assert.equal(quicksandCoverage(t,-1,370),0);
});
test('view bounds, bloom, pools and won phase follow terrain-floor boundaries',()=>{
 assert.deepEqual(quicksandBounds({sx:-20,sy:-5,ex:500,ey:100}),{sx:0,sy:0,ex:50,ey:50});
 const g=game();g.bloom=.1;assert.equal(quicksandVisible(g,25,25),true);assert.equal(quicksandVisible(g,9,9),false);
 g.bloom=3;assert.equal(quicksandVisible(g,9,9),true);g.house={pools:[{x:288,y:288,w:32,h:32}]};assert.equal(quicksandVisible(g,9,9),false);
 g.phase='won';assert.equal(quicksandVisible(g,25,25),false);
});
test('Canvas masks bake once, animate on bounded surfaces and invalidate visible terrain edits',()=>withDocument(()=>{
 const surface=new QuicksandSurface({backend:'canvas'}),g=fill(game(),10,10,14,14),canvas=canvasMock(),ctx=canvas.getContext('2d'),bounds={sx:9,sy:9,ex:15,ey:15},before=JSON.stringify(g);
 surface.draw(ctx,g,bounds);const mask=surface.mask;
 for(let i=0;i<50;i++){g.time=i/24;surface.draw(ctx,g,bounds);}
 assert.equal(surface.stats.topologyBuilds,1);assert.equal(surface.stats.maskBuilds,1);assert.equal(surface.stats.textureUploads,0);assert.equal(surface.mask,mask);assert.ok(surface.stats.canvasPasses>=49);
 assert.equal(surface.stage.width,64);assert.equal(surface.stage.height,64);assert.equal(mask.width,800);assert.equal(mask.height,800);
 g.time=0;assert.equal(JSON.stringify(g),before);
 g.terrain[10*50+10]='sand';surface.draw(ctx,g,bounds);assert.equal(surface.stats.topologyBuilds,2);assert.equal(surface.stats.maskBuilds,2);
 g.quicksandVisualRevision=1;surface.draw(ctx,g,bounds);assert.equal(surface.stats.topologyBuilds,3);
 surface.draw(ctx,g,{sx:0,sy:0,ex:50,ey:50});assert.ok(surface.stage.width<=800&&surface.stage.height<=800);
 g.terrain=Array(2500).fill('grass');assert.equal(surface.draw(ctx,g,bounds),false);assert.equal(surface.topology,null);assert.equal(surface.mask,null);assert.equal(surface.stage.width,1);
}));
test('empty, offscreen and unrevealed sand never initializes a shader or mask',()=>withDocument(()=>{
 const surface=new QuicksandSurface(),g=fill(game(),1,1,3,3),c=canvasMock().getContext('2d');g.bloom=.1;
 assert.equal(surface.draw(c,g,{sx:0,sy:0,ex:50,ey:50}),false);assert.equal(surface.tried,undefined);assert.equal(surface.stats.topologyBuilds,0);
 g.bloom=3;assert.equal(surface.draw(c,g,{sx:20,sy:20,ex:30,ey:30}),false);assert.equal(surface.stats.maskBuilds,0);
 surface.draw(c,g,{sx:0,sy:0,ex:5,ey:5});assert.equal(surface.backend,'canvas','missing WebGL should fall back');assert.equal(surface.stats.maskBuilds,1);
 g.phase='won';assert.equal(surface.draw(c,g,{sx:0,sy:0,ex:5,ey:5}),false);assert.equal(surface.topology,null);
}));
test('terrain floor delegates exactly its camera bounds without changing co-op camera',()=>withDocument(()=>{
 const g=fill(game(),20,20,30,30),canvas=canvasMock(),r=new Renderer(canvas,{library:{}});r.camera={x:800,y:800,zoom:.5};r.ground=()=>{};
 let passed;r.quicksandSurface={draw:(ctx,game,bounds)=>{passed={game,bounds};}};const before=JSON.stringify(r.camera);
 r.floor(canvas.getContext('2d'),600,400,g);assert.equal(passed.game,g);assert.deepEqual(passed.bounds,{sx:6,sy:12,ex:44,ey:38});assert.equal(JSON.stringify(r.camera),before);
}));
test('animated runtime has no pixel readbacks, completion stalls or repeating texture wrap',()=>{
 const source=fs.readFileSync(new URL('../src/quicksand-surface.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/getImageData|readPixels|\.finish\(|gl\.REPEAT/);
 assert.match(source,/gl\.CLAMP_TO_EDGE/);assert.equal((source.match(/texImage2D\(/g)||[]).length,1);
 const render=fs.readFileSync(new URL('../src/render.mjs',import.meta.url),'utf8');assert.doesNotMatch(render,/ctx\.fillStyle = "#8e6a45"/);
});
