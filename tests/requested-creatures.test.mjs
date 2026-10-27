import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {defaultNightMotion,validateNightMotion,legacyNightMotion} from '../src/night-rigs.mjs';
import {defaultCreatureMotion,validateCreatureMotion,legacyCreatureMotion} from '../src/creature-motion.mjs';
import {upgradeRequestedCreature} from '../src/requested-creature-transfer.mjs';
import {poseAt} from '../src/player-motion.mjs';import {dragonBreath} from '../src/dragon-events.mjs';import {EVENTS,Game} from '../src/core.mjs';import {seedWildFauna} from '../src/wild-fauna.mjs';
test('exact requested donors have finite editable motion and preserve custom pixels and keys during default migration',()=>{
 for(const kind of['zebra','fox','dragon']){const factory=kind==='dragon'?defaultCreatureMotion:defaultNightMotion,m=factory(kind),valid=kind==='dragon'?validateCreatureMotion:validateNightMotion;assert.ok(valid(kind,m),kind);assert.match(m.provenance.url,kind==='zebra'?/37719/:kind==='fox'?/171702/:/186455/);assert.equal(m.provenance.sha256.length,64);
  for(const[action,clip]of Object.entries(m.clips))for(let frame=0;frame<clip.length;frame+=.5)assert.ok(Object.values(poseAt(m,action,frame)).flat().every(Number.isFinite),kind+' '+action);
  const old=(kind==='dragon'?legacyCreatureMotion:legacyNightMotion)(kind),copy=structuredClone(old);copy.boneSprites={Head:{custom:'retained'}};copy.clips.idle.keys[0].joints.head=[1,2,3];const upgraded=upgradeRequestedCreature(copy,old);assert.deepEqual(upgraded.boneSprites,copy.boneSprites);assert.deepEqual(upgraded.clips.idle,copy.clips.idle);assert.equal(upgraded.motionDonorRevision,1);
 }
});
test('dragon variants use separate events and elemental cones stop at walls, with exact referenced sound recordings',()=>{
 const events=EVENTS.filter(e=>e.kind==='dragon');assert.equal(events.length,3);assert.equal(events[1].dragonVariant,'blue');assert.equal(events[2].dragonVariant,'bone');
 const target={x:80,y:0,hp:100},e={x:0,y:0,faceX:1,faceY:0,damage:20,dragonVariant:'blue'},g={effects:[],firePatches:[],blocked:()=>false,projectileBlocked:()=>false,hurt:(p,n)=>p.hp-=n};dragonBreath(g,e,[target],{stats:{flameRange:190,burnDamage:4}});assert.equal(target.hp,80);assert.equal(target.frozen,1.25);assert.equal(g.firePatches.length,0);
 e.dragonVariant='bone';dragonBreath(g,e,[target],{stats:{flameRange:190,burnDamage:4}});assert.ok(g.firePatches.every(p=>p.color==='#ac69e3'));assert.equal(target.burning,2);
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/sfx/dragon2/manifest.json',import.meta.url)));for(const f of manifest.files){assert.match(f.url,/wow.zamimg.com\/sound-ids/);assert.equal(fs.readFileSync(new URL('../assets/sfx/dragon2/'+f.key+'.ogg',import.meta.url)).subarray(0,4).toString(),'OggS');}
});
test('forest fox wildlife and the separate hostile fox event coexist without shifting old events',()=>{
 assert.equal(EVENTS[54].kind,'banshee_queen');const g=new Game(()=>.42);g.addPlayer('keyboard');g.start();g.enemies=[];g.generatedEnvironment='forest';g.openingBoard=false;seedWildFauna(g,true);assert.ok(g.enemies.some(e=>e.kind==='fox'&&e.wildlife&&e.faction==='neutral'));const index=EVENTS.findIndex(e=>e.kind==='fox');g.spawnEvent(index,{test:true,force:true});assert.ok(g.enemies.some(e=>e.kind==='fox'&&!e.wildlife));
});
