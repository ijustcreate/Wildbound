import test from 'node:test';import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {befriendCreature} from '../src/friendly-creatures.mjs';
import {cycleFollowerControl,controlledFollower} from '../src/follower-control.mjs';
import {SKELETON_EQUIPMENT} from '../src/skeleton-equipment.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
const field=()=>{const g=new Game(()=>.3),p=g.addPlayer('pad:0');g.start();g.openingBoard=false;g.scenery=[];g.enemies=[];g.terrain.fill('grass');p.x=p.y=500;g.blocked=()=>false;return {g,p};};
const control=(g,p,kind='archer')=>{g.spawnEvent(EVENTS.findIndex(e=>e.kind===kind));const e=g.enemies.find(a=>a.kind===kind);g.enemies=[e];Object.assign(e,{x:500,y:500,flash:0,cooldown:0});befriendCreature(e,p.id);cycleFollowerControl(g,p);return e;};
test('controlled archer exposes real costume slots, uses its own bow and consumes its own arrows',()=>{
 const {g,p}=field(),main=p.equipment,e=control(g,p);assert.equal(p.equipment.hand1,'bow');for(const[slot,id]of Object.entries(SKELETON_EQUIPMENT))assert.equal(p.equipment[slot],id);
 p.faceX=1;p.faceY=0;const before=p.inventory.find(i=>i.type==='arrow').qty;assert.ok(g.attack(p,.8));assert.equal(g.arrows.length,1);assert.ok(!g.arrows[0].hostile);assert.ok(g.arrows[0].vx>0);assert.equal(p.inventory.find(i=>i.type==='arrow').qty,before-1);
 p.equipment.head=null;controlledFollower(g,p);cycleFollowerControl(g,p);assert.equal(p.equipment,main);assert.equal(e.equipment.head,null);
 const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(r.enemies.find(a=>a.id===e.id).equipment.head,null);
});
test('swim and dive belong to the active controlled actor, while the real hero breathes at the surface',()=>{
 for(const kind of ['archer','lion']){const {g,p}=field(),e=control(g,p,kind);g.terrain.fill('water');const hp=p.hp;
 for(let i=0;i<45;i++)g.update(.05,{'pad:0':{attack:true}});
 assert.ok(e.swimming,kind);assert.ok(e.diveDepth>.5,kind+' dives');assert.ok(e.breath<20);assert.equal(e.breath,p.breath);assert.equal(p.controlPetPosition.diveDepth,0);assert.equal(p.controlPetPosition.breathVisible,0);assert.equal(p.hp,hp);
 e.breath=.01;for(let i=0;i<24;i++)g.update(.05,{'pad:0':{attack:true}});assert.ok(e.hp<e.maxHp);assert.equal(p.hp,hp,'drowning hurts active creature only');
 for(let i=0;i<60;i++)g.update(.05,{});assert.equal(e.diveDepth,0);assert.equal(e.breath,20);cycleFollowerControl(g,p);assert.equal(p.diveDepth,0);assert.equal(p.breathVisible,0);
 }
});
