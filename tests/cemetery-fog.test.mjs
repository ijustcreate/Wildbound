import test from 'node:test';
import assert from 'node:assert/strict';
import {cemeteryFogActive,cemeteryFogLights,cemeteryFogShadowSlice,CemeteryFogRenderer} from '../src/cemetery-fog.mjs';

test('cemetery mist is surface-only and never leaks into lobby, crypt, victory or other biomes',()=>{
 const g={generatedEnvironment:'graveyard',graveyard:{},phase:'play',players:[{hp:100}]};
 assert.equal(cemeteryFogActive(g),true);
 for(const change of [{generatedEnvironment:'forest'},{phase:'lobby'},{phase:'won'},{openingBoard:true},{players:[{hp:100,room:'crypt'}]},{players:[{hp:0}]}])assert.equal(cemeteryFogActive({...g,...change}),false);
 const fog=new CemeteryFogRenderer();assert.equal(fog.prepare({...g,phase:'lobby'},{x:0,y:0,zoom:1},100,100),false);assert.equal(fog.status().ready,false);
});
test('bounded mist lights prioritize carried lanterns and omit room/invalid sources',()=>{
 const g={scenery:Array.from({length:100},(_,id)=>({id,graveyard:true,kind:'grave_candles',x:id,y:0}))};
 const lights=cemeteryFogLights(g,{x:0,y:0},{sources:[{x:0,y:0,radius:280,inventoryLight:true,color:'#ff0000'}, {x:0,y:0,radius:280,room:'crypt'}, {x:NaN,y:0,radius:100}]});
 assert.equal(lights.length,4);assert.equal(lights[0].inventoryLight,true);assert.ok(lights.every(s=>!s.room&&Number.isFinite(s.x)));
});
test('polar shadow cache separates low fog behind a grave from lit air above it',()=>{
 const source={x:0,y:0,height:20,radius:160,owner:'lantern'},open=cemeteryFogShadowSlice(source,[]);
 assert.equal(open.length,1024);assert.ok(open.every((v,i)=>i%4===2?v===0:v===255));
 const volumes=[{owner:'grave',x:40,y:0,rx:10,ry:24,minZ:0,maxZ:24,shape:'box'}];
 const data=cemeteryFogShadowSlice(source,volumes),angle=16,ring=4,index=(ring*32+angle)*4;
 assert.equal(data[index],0);assert.equal(data[index+1],255);
 assert.equal(data[(4*32+0)*4],255,'opposite direction stays illuminated');
 const owned=cemeteryFogShadowSlice({...source,owner:'grave'},volumes);assert.equal(owned[index],255,'source does not shadow itself');
 assert.deepEqual(volumes,[{owner:'grave',x:40,y:0,rx:10,ry:24,minZ:0,maxZ:24,shape:'box'}]);
});
test('cemetery mist illumination registers to actual candle flames and skips unlit small gates',()=>{
 const g={scenery:[{id:'gate',graveyard:true,kind:'cemetery_gate',x:800,y:1200},{id:'small',graveyard:true,kind:'cemetery_gate',small:true,x:0,y:0}]};
 const lights=cemeteryFogLights(g,{x:800,y:1200},{sources:[]});
 assert.equal(lights.length,2);assert.deepEqual(lights.map(s=>s.x).sort((a,b)=>a-b),[699,901]);assert.ok(lights.every(s=>s.height===74));
});
