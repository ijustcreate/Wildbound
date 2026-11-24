import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {insideHouse} from '../src/expansion.mjs';
import {wolfPack,tickWolf} from '../src/wolf-pack.mjs';
import {wolfMotion,defaultWolfMotion,validateWolfMotion} from '../src/wolf-motion.mjs';
import {drawWolfTail} from '../src/wolf-tail-art.mjs';
import {poseAt,projectPoint} from '../src/player-motion.mjs';
import {lionMotion} from '../src/lion-motion.mjs';
import {RIG_SUBJECTS} from '../src/rig-subjects.mjs';
import {creatureCue} from '../src/sound-bank.mjs';
import {existsSync} from 'node:fs';
const setup=environment=>{const g=new Game();g.environment=environment;g.addPlayer('keyboard');g.start();g.openingBoard=false;return g;};
test('the wolf brush stays connected in eight views and follows idle and walk poses',()=>{
 const model=defaultWolfMotion();
 const pixelsAt=(clip,frame,direction)=>{
  const pose=poseAt(model,clip,frame);
  const p=Object.fromEntries(['pelvis','tailBase','tailMid','tailTip'].map(name=>[name,projectPoint(pose[name],direction)]));
  const pixels=new Set();
  drawWolfTail({fillRect(x,y){pixels.add(x+','+y);}},p,model.palette);
  const root=[...pixels].find(pixel=>{
   const [x,y]=pixel.split(',').map(Number);
   return Math.hypot(x-p.pelvis.x,y-p.pelvis.y)<3.5;
  });
  assert.ok(root,'Brush reaches the rump');
  const connected=new Set([root]),queue=[root];
  for(const pixel of queue){
   const [x,y]=pixel.split(',').map(Number);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const next=(x+dx)+','+(y+dy);
    if(pixels.has(next)&&!connected.has(next)){connected.add(next);queue.push(next);}
   }
  }
  assert.equal(connected.size,pixels.size,`${clip} in direction ${direction} at ${frame}`);
  return [...pixels];
 };
 for(const clip of ['idle','walk']){
  let moving=0;
  for(let direction=0;direction<8;direction++){
   const frames=[0,1,2,4,6,7].map(frame=>pixelsAt(clip,frame,direction));
   if(frames.some(frame=>frame.join('|')!==frames[0].join('|')))moving++;
  }
  assert.equal(moving,8);
 }
});
test('first house lion appears on a clear interior floor; later lions use exterior',()=>{
 const g=setup('house'),i=EVENTS.findIndex(e=>e.kind==='lion');g.spawnEvent(i);
 const lion=g.enemies.at(-1);assert.ok(insideHouse(lion.x,lion.y,g.house));assert.equal(g.blocked(lion.x,lion.y),false);
 g.spawnEvent(i);const next=g.enemies.at(-1);assert.equal(insideHouse(next.x,next.y,g.house),false);
});
test('wolf has independent model and renderer, and dedicated sound assets',()=>{
 assert.notEqual(wolfMotion,lionMotion);assert.ok(validateWolfMotion(defaultWolfMotion()));assert.notEqual(RIG_SUBJECTS.wolf.draw,RIG_SUBJECTS.lion.draw);
 for(const action of ['spawn','attack','hurt','death']){const cue=creatureCue('wolf',action);assert.ok(cue.files[0].includes('/wolf/'));assert.ok(existsSync(cue.files[0]));}
});
test('pack shares alpha target, splits pursuit roles and elects a successor',()=>{
 const g=setup('forest');g.spawnEvent(EVENTS.findIndex(e=>e.kind==='wolf'));const wolves=g.enemies.filter(e=>e.kind==='wolf');const {alpha}=wolfPack(g,wolves[0]);assert.equal(wolves.filter(e=>e.alpha).length,1);
 const target=g.players[0];Object.assign(target,{x:800,y:800});wolves.forEach((e,i)=>Object.assign(e,{x:300+i*25,y:300+i*20}));
 for(const e of wolves)tickWolf(g,e,[target],.05);
 assert.ok(wolves.every(e=>e.packTargetId===target.id));assert.equal(wolves[0].packRole,'hunter');assert.equal(wolves[1].packRole,'lead');assert.ok(new Set(wolves.map(e=>e.packRole)).size>=2);
 alpha.hp=0;assert.notEqual(wolfPack(g,wolves[1]).alpha.id,alpha.id);assert.equal(wolves.filter(e=>e.hp>0&&e.alpha).length,1);
});
test('wolf bite has a windup, only one attacker, and respects walls',()=>{
 const g=setup('house');g.spawnEvent(EVENTS.findIndex(e=>e.kind==='wolf'));const pack=g.enemies.filter(e=>e.kind==='wolf'),p=g.players[0];g.time=0;
 Object.assign(p,{x:640,y:580});pack.forEach(e=>Object.assign(e,{x:640,y:610,cooldown:0}));
 for(const e of pack)tickWolf(g,e,[p],.01);assert.equal(pack.filter(e=>e.state==='windup').length,1);
 const e=pack[0],hp=p.hp;Object.assign(e,{x:460,y:580,timer:0});p.x=490;tickWolf(g,e,[p],.01);assert.equal(p.hp,hp);
});
