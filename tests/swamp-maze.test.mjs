import test from 'node:test';
import assert from 'node:assert/strict';
import {realmWorld,realmProp,realmTerrainAt} from '../src/realm-world.mjs';
import {swampSurface} from '../src/swamp-terrain.mjs';
import {waterAt,harvest,tickEnvironment} from '../src/environment.mjs';
import {Game} from '../src/core.mjs';
import {terrainSupport,bridgeAt} from '../src/terrain-support.mjs';
import {REALM_SPRITES} from '../src/realm-art.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
test('bayou has a branching island network, broad shallows, deep channels and no tiled road grid',()=>{
 for(const seed of [1,42,75,917]){const w=realmWorld(seed,'swamp',{authored:false}),count=k=>w.terrain.filter(t=>t===k).length;
  assert.ok(w.realmState.chambers.length>=14);assert.ok(count('shallow')>600);assert.ok(count('water')>250);assert.ok(count('marsh_grass')>200);assert.equal(count('bridge'),0);
  const degree=w.realmState.chambers.map((_,i)=>w.realmState.links.filter(l=>l.includes(i)).length);assert.ok(degree.some(d=>d===1));assert.ok(degree.some(d=>d>=3));
 }
});
test('actual player clearance reaches every island neighborhood through the generated maze',()=>{
 for(const seed of [42,75]){const g=new Game(()=>.5,{deferWorld:true});g.environment='swamp';g.seed=seed;g.addPlayer('keyboard');g.start();g.bloom=3;
  const size=100,seen=new Set(),queue=[],start=61*size+50;seen.add(start);queue.push(start);
  for(let head=0;head<queue.length;head++){const id=queue[head],x=id%size,y=Math.floor(id/size);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,next=ny*size+nx;if(nx<2||ny<2||nx>=98||ny>=98||seen.has(next)||g.blocked(nx*16+8,ny*16+8,12,false,false,false,0))continue;seen.add(next);queue.push(next);}}
  for(const island of g.realmState.chambers)assert.ok([...seen].some(i=>Math.hypot(i%size*16+8-island.x,Math.floor(i/size)*16+8-island.y)<100),'island '+seed+' '+JSON.stringify(island));
 }
});
test('water behavior follows the same continuous bank as rendering and responds to terrain edits',()=>{
 const g={generatedEnvironment:'swamp',phase:'play',terrain:Array(2500).fill('marsh_grass')};for(let y=0;y<50;y++)for(let x=8;x<18;x++)g.terrain[y*50+x]=x<10||x>15?'shallow':'water';
 for(let y=312;y<360;y+=8)for(let x=200;x<650;x+=4)assert.equal(waterAt(g,x,y),swampSurface((tx,ty)=>realmTerrainAt(g,tx,ty),x,y).kind);
 assert.equal(waterAt(g,400,336),'water');g.terrain[10*50+12]='bridge';assert.equal(waterAt(g,400,336),'bridge');assert.ok(bridgeAt(g,400,336));assert.equal(terrainSupport(g,{x:400,y:336}),10);
 g.terrain[10*50+12]='marsh_grass';assert.equal(waterAt(g,400,336),'marsh_grass');assert.equal(realmTerrainAt(g,-1,10),undefined);
});
test('approved tree pixels remain indexed and both tree types cut into saved jumpable stumps',()=>{
 for(const kind of ['mangrove','old_cypress']){assert.equal(REALM_SPRITES[kind].width,128);const g=new Game(()=>.5,{deferWorld:true});g.environment='swamp';const hero=g.addPlayer('keyboard');g.start();g.scenery=[realmProp(kind,500,500)];g.terrain.fill('marsh_grass');Object.assign(hero,{x:500,y:525,faceX:0,faceY:-1});assert.ok(g.blocked(500,493,8,false,false,false,0));assert.ok(harvest(g,hero,999,90));for(let i=0;i<20;i++)tickEnvironment(g,.1);assert.ok(g.scenery[0].fallen);assert.ok(terrainSupport(g,{x:500,y:495})>0);assert.ok(g.loot.some(l=>l.type==='log'));const saved=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.ok(saved.scenery[0].fallen);}
});
