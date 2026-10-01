import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {generateWorld} from '../src/world.mjs';
import {spawnMerchant,tickMerchant,openMerchant} from '../src/traveling-merchant.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {ITEMS,sellValue} from '../src/items.mjs';
import {victoryRewards,victoryChestBlocked} from '../src/victory-chest.mjs';
import {tickWetWeather,wetWeatherState,rainExposed} from '../src/wet-weather.mjs';
import {initLivingEcosystem,livingAnimals,updateLivingEcosystem,catchCritter} from '../src/living-ecosystem.mjs';
import {waterAt,tickEnvironment} from '../src/environment.mjs';
import {startJump,tickJump} from '../src/jumping.mjs';
import {bridgeAt,terrainSupport,terrainActorDepth} from '../src/terrain-support.mjs';
import {thunderSamples} from '../src/thunder.mjs';
function setup(env='forest'){const g=new Game(()=>.37);g.addPlayer('keyboard');g.start();Object.assign(g,generateWorld(42,env),{generatedEnvironment:env,environment:env,openingBoard:false,bloom:3,phase:'play'});return g;}
test('Merchant camps are dry, reachable candidates away from the board in every biome',()=>{
 for(const env of ['forest','desert','ice','house','temple']){const g=setup(env);assert.ok(spawnMerchant(g),env);const m=g.merchant;assert.ok(Math.hypot(m.x-800,m.y-800)>230,env);assert.notEqual(waterAt(g,m.x,m.y),'water');assert.equal(g.blocked(m.x,m.y,24,false,false,false,0),false);const first=m;spawnMerchant(g);assert.equal(g.merchant,first);}
});
test('Merchant controller trades preserve full metadata and exact buyback price across saves',()=>{
 const g=setup(),p=g.players[0];spawnMerchant(g);Object.assign(p,{x:g.merchant.x,y:g.merchant.y,coins:100});p.inventory=[{type:'iron_sword',qty:1,sockets:['ruby'],custom:'kept'}];const original=structuredClone(p.inventory[0]);assert.ok(openMerchant(g,p));g.inventoryAction(p,'panel');assert.equal(p.ui.panel,'pack');g.inventoryAction(p,'use');const paid=sellValue(original.type);assert.equal(p.coins,100+paid);assert.equal(p.inventory[0],null);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),q=restored.players[0];assert.deepEqual(restored.merchant.stock.at(-1).item,original);assert.ok(openMerchant(restored,q));for(let n=0;n<3;n++)restored.inventoryAction(q,'next');restored.inventoryAction(q,'use');assert.deepEqual(q.inventory[0],original);assert.equal(q.coins,100);assert.equal(restored.merchant.stock.length,3);restored.inventoryAction(q,'close');assert.equal(q.ui,null);restored.newExpedition();assert.equal(restored.merchant,null);
});
test('Horse follows a moving merchant with real gait and no teleport',()=>{
 const g=setup();g.scenery=[];g.terrain.fill('grass');g.house=null;spawnMerchant(g);const m=g.merchant;m.horse.x=m.x+120;m.horse.y=m.y;const before=m.horse.x;g.players[0].x=50;g.players[0].y=50;
 for(let i=0;i<60;i++){g.time+=1/60;tickMerchant(g,1/60);}assert.ok(m.horse.x<before-10);assert.ok(m.horse.step>0);assert.ok(Math.abs(m.horse.x-before)<30);assert.ok(Math.hypot(m.x-m.campX,m.y-m.campY)>1);
});
test('Rain respects roofs, produces bounded puddles, and puddles dry after a minute',()=>{
 const g=setup('temple');g.weather={type:'thunderstorm'};assert.equal(rainExposed(g,{x:800,y:700}),false);assert.equal(rainExposed(g,{x:200,y:200}),true);
 for(let i=0;i<60;i++){g.time+=.1;tickWetWeather(g,.1);}const s=wetWeatherState(g);assert.ok(s.puddles.some(p=>p.x===610&&p.y===610));assert.ok(s.puddles.length<=160);g.weather=null;for(let i=0;i<601;i++)tickWetWeather(g,.1);assert.equal(s.puddles.length,0);
});
test('Players and enemies drip briefly after water, rain and shelter transitions',()=>{
 const g=setup();g.terrain.fill('grass');g.scenery=[];const p=g.players[0];Object.assign(p,{x:200,y:200});g.terrain[6*50+6]='water';const e={id:88,x:200,y:200,hp:10};g.enemies=[e];tickWetWeather(g,.1);p.x=e.x=250;tickWetWeather(g,.2);assert.ok(wetWeatherState(g).drops.length>=2);for(let i=0;i<60;i++)tickWetWeather(g,.1);assert.equal(wetWeatherState(g).drops.length,0);
 g.weather={type:'monsoon'};tickWetWeather(g,.1);g.house={floors:[{x:240,y:150,w:100,h:100}]};tickWetWeather(g,.2);assert.ok(wetWeatherState(g).drops.length>0);g.weather=null;
});
test('Frogs start beside water, swim and hop; catching consumes containers atomically and persists',()=>{
 const g=setup();g.scenery=[];g.terrain.fill('grass');for(let y=1;y<49;y++)for(let x=10;x<15;x++)g.terrain[y*50+x]='water';initLivingEcosystem(g);const frog=livingAnimals(g).find(a=>a.kind==='frog');assert.ok(frog);assert.ok([[32,0],[-32,0],[0,32],[0,-32]].some(([dx,dy])=>['water','shallow'].includes(waterAt(g,frog.x+dx,frog.y+dy))));const p=g.players[0];Object.assign(p,{x:frog.x,y:frog.y,faceX:1,faceY:0});p.equipment.hand1='critter_net';p.inventory=[];assert.ok(catchCritter(g,p));assert.ok(livingAnimals(g).some(a=>a.id===frog.id));p.inventory=[{type:'empty_jar',qty:1}];catchCritter(g,p);assert.equal(p.inventory[0].type,'caught_frog');assert.equal(livingAnimals(g).some(a=>a.id===frog.id),false);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(livingAnimals(restored).some(a=>a.id===frog.id),false);let swim=false,hop=false,pad=false;for(let n=0;n<400;n++){g.time+=.1;updateLivingEcosystem(g,.1);for(const a of livingAnimals(g).filter(a=>a.kind==='frog')){swim||=!!a.swimming;hop||=!!a.hop;pad||=!!a.pad;}}assert.ok(swim);assert.ok(hop);assert.ok(pad);
});
test('Victory rewards scale to six players and promote tiers at 5 and 10',()=>{
 for(const n of [1,3,6])for(const level of [1,5,10,15]){const items=victoryRewards(Array.from({length:n},()=>({level})),()=>.3);assert.equal(items.length,3+n*2);assert.ok(items.every(i=>ITEMS[i.type]&&i.qty===1));const tiers=items.map(i=>ITEMS[i.type].rarity);assert.ok(tiers.includes('rare'));if(level>=10){assert.ok(tiers.filter(t=>t==='rare').length>=2);assert.ok(tiers.includes('legendary'));}else assert.equal(tiers.includes('legendary'),false);}
});
test('Victory chest blocks its visible body and sealed maps have no bridge support',()=>{const g=setup();g.victoryChest=true;assert.ok(victoryChestBlocked(g,800,910,8,0,null));assert.equal(victoryChestBlocked(g,800,875,8,0,null),false);assert.equal(terrainSupport(g,{x:800,y:915}),20);assert.ok(terrainActorDepth(g,{x:800,y:915,groundHeight:20})>927);g.terrain[10*50+10]='bridge';assert.ok(bridgeAt(g,330,330));g.phase='won';assert.equal(bridgeAt(g,330,330),false);});
test('Jumping produces only takeoff and landing marks, aligned to feet',()=>{const g=setup(),p=g.players[0];g.scenery=[];g.terrain.fill('grass');Object.assign(p,{x:400,y:400,faceX:1,faceY:0});tickEnvironment(g,.01);startJump(p);tickEnvironment(g,.01);const before=g.footprints.length;assert.equal(before,2);for(let i=0;i<15;i++){p.x+=2;tickJump(p,.02,g);tickEnvironment(g,.02);}assert.equal(g.footprints.length,before);for(let i=0;i<80;i++){tickJump(p,.02,g);tickEnvironment(g,.02);}assert.equal(g.footprints.filter(f=>f.impact==='landing').length,2);assert.ok(g.footprints.every(f=>Math.abs(f.y-p.y)<=3&&f.scale>1));});
test('Thunder synthesis is bounded and fades to a quiet tail',()=>{const samples=thunderSamples();assert.ok(samples.every(n=>Number.isFinite(n)&&Math.abs(n)<1));const power=a=>a.reduce((s,x)=>s+x*x,0)/a.length;assert.ok(power(samples.slice(1000,10000))>power(samples.slice(-10000))*10);});
