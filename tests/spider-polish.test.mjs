import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultSpiderMotion,upgradeSpiderMotion,drawSpider,spiderAction} from '../src/spider-motion.mjs';
import {legacyInsectMotion,validateBeastMotion,BEAST_KINDS} from '../src/beast-motion.mjs';
import {poseAt,directionVector} from '../src/player-motion.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';
import {Game,EVENTS} from '../src/core.mjs';
import {isSpider,webSlow,tickSpider,maintainSpiderWebs} from '../src/expansion.mjs';
import {creatures} from '../src/definitions.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

test('Black spider and sandy tarantula are separate eight-leg native rigs and enemy definitions',()=>{
 for(const kind of ['spider','tarantula']){
  const m=defaultSpiderMotion(kind);assert.ok(BEAST_KINDS.includes(kind));assert.ok(validateBeastMotion(kind,m));
  assert.equal(Object.keys(m.joints).filter(n=>n.startsWith('foot')).length,8);
  assert.equal(rigSubject(kind).data.type,kind);assert.ok(creatures[kind]);
 }
 assert.notEqual(creatures.spider.stats.speed,creatures.tarantula.stats.speed);
 assert.notEqual(defaultSpiderMotion().palette.body,defaultSpiderMotion('tarantula').palette.body);
 assert.ok(defaultSpiderMotion('tarantula').shape.bodyWidth>defaultSpiderMotion().shape.bodyWidth);
});
test('Walking feet alternate grounded tetrapods; idle is not an in-place walk',()=>{
 for(const kind of ['spider','tarantula']){
  const m=defaultSpiderMotion(kind),a=poseAt(m,'walk',0),b=poseAt(m,'walk',3),idle=poseAt(m,'idle',0);
  const feet=Object.keys(m.joints).filter(n=>n.startsWith('foot'));
  assert.ok(feet.some(n=>a[n][1]!==b[n][1]));assert.ok(feet.some(n=>b[n][2]>0));
  assert.ok(feet.filter(n=>b[n][2]===0).length>=4);
  for(const n of feet)assert.deepEqual(idle[n],poseAt(m,'idle',5)[n]);
  assert.notDeepEqual(poseAt(m,'attack',3).head,idle.head);
  assert.ok(poseAt(m,'death',9).foot0L[0]>idle.foot0L[0]);
 }
});
test('Old stock spider rig upgrades without replacing authored palettes, poses or painted bone views',()=>{
 const legacy=legacyInsectMotion('spider'),saved=structuredClone(legacy);
 saved.palette.body='#123456';saved.clips.walk.keys[1].joints.foot0L=[2,3,4];saved.boneSprites={Body:{0:{custom:true}}};saved.renderOrder={0:['Head','Body']};
 const before=JSON.stringify(saved),m=upgradeSpiderMotion(saved,legacy);
 assert.equal(JSON.stringify(saved),before);assert.equal(m.palette.body,'#123456');assert.deepEqual(m.clips.walk,saved.clips.walk);
 assert.deepEqual(m.boneSprites,saved.boneSprites);assert.deepEqual(m.renderOrder,saved.renderOrder);
 assert.deepEqual(m.joints.foot3R,defaultSpiderMotion().joints.foot3R);assert.ok(m.clips.attack&&m.clips.death);
 assert.ok(validateBeastMotion('spider',legacy));
});
test('All eight facings and every action draw crisp integer pixels without blurred shapes',()=>{
 const ctx={fillStyle:'',save(){},restore(){},scale(){},fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(w>0&&h>0);this.calls++;},calls:0};
 for(const kind of ['spider','tarantula']){const m=defaultSpiderMotion(kind);
  for(let d=0;d<8;d++)for(const animationAction of Object.keys(m.clips)){const [faceX,faceY]=directionVector(d);drawSpider(ctx,{kind,faceX,faceY,hp:70,animationAction,playerFrame:3},0,m);}
 }
 assert.ok(ctx.calls>1000);
});
test('Companions walk by movement and spider hurt/death/bite poses have precedence',()=>{
 assert.equal(spiderAction({moving:true,locomotionSpeed:44,faction:'ally'}),'walk');assert.equal(spiderAction({moving:false}),'idle');
 assert.equal(spiderAction({moving:true,flash:.1}),'hurt');assert.equal(spiderAction({hp:0,attack:.2}),'death');assert.equal(spiderAction({attack:.2}),'attack');
});
test('Tarantula encounter spawns distinct enemies, owns webs and hatches tarantula juveniles after reload',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;
 g.spawnEvent(EVENTS.findIndex(e=>e.kind==='tarantula'));const adults=g.enemies.filter(e=>e.kind==='tarantula');
 assert.equal(adults.length,2);assert.ok(adults.every(e=>e.hp===110&&e.speed===48&&e.damage===16));assert.ok(g.webs.length);
 assert.ok(isSpider(adults[0]));const web=g.webs[0];assert.ok(webSlow(g,{kind:'human',...web}));assert.equal(webSlow(g,{kind:'tarantula',...web}),false);
 maintainSpiderWebs(g,.1);assert.ok(g.webs.length);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));const egg=restored.enemies.find(e=>e.kind==='spider_egg');
 assert.equal(egg.hatchSprite,'tarantula');tickSpider(restored,egg,21,[]);assert.equal(egg.kind,'baby_spider');assert.equal(egg.sprite,'tarantula');assert.equal(egg.hp,38);
});
