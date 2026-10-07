import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {portalVisualSample, drawPortal, PORTAL_PARTICLE_COUNT} from '../src/portal-art.mjs';
const setup=()=>{const g=new Game(),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');p.x=p.y=400;return {g,p};};
test('Outside owner button toggles an empty portal off without touching other rooms or chest data',()=>{
 const {g,p}=setup();p.chests[0]=[{type:'sword',qty:1}];g.portal(p);assert.equal(p.room,null);const other={id:99,temple:true,owner:p.id,closing:null};g.portals.push(other);g.portal(p);assert.deepEqual(g.portals,[other]);assert.equal(p.chests[0][0].type,'sword');
 g.portals=[];g.portal(p);assert.equal(g.portals.length,1);
});
test('Outside closure gives guests the same ten-second escape, repeated presses never reset it',()=>{
 const {g,p}=setup(),q=g.addPlayer('pad:0');g.portal(p);const d=g.portals[0];q.x=d.x;q.y=d.y;g.enterRoom(q,d);const hp=q.hp;
 g.portal(p);assert.equal(d.closing,10);g.tickAdventure(3,{});g.portal(p);assert.equal(d.closing,7);assert.equal(q.room,d.id);
 g.tickAdventure(6.9,{});assert.equal(q.room,d.id);g.tickAdventure(.2,{});assert.equal(q.room,null);assert.equal(q.hp,hp-q.maxHp*.5);assert.equal(g.portals.length,0);
});
test('Guests can safely leave before an outside closure expires and owner reentry still cancels collapse',()=>{
 const {g,p}=setup(),q=g.addPlayer('pad:0');g.portal(p);const d=g.portals[0];q.x=d.x;q.y=d.y;g.enterRoom(q,d);g.portal(p);p.x=d.x;p.y=d.y;g.enterRoom(p,d);assert.equal(d.closing,null);g.leaveRoom(p);const hp=q.hp;g.leaveRoom(q);assert.equal(q.hp,hp);assert.equal(g.portals.length,0);
});
test('Portal swirl and square particles move with bounded deterministic geometry and collapse safely',()=>{
 const d={x:0,y:0,color:'#22bb99',closing:null},a=portalVisualSample(d,0),b=portalVisualSample(d,.5);
 assert.equal(a.particles.length,PORTAL_PARTICLE_COUNT);assert.equal(a.spiral.length,108);assert.equal(a.rim.length,64);assert.notDeepEqual(a.spiral,b.spiral);assert.notDeepEqual(a.particles,b.particles);
 for(const t of [0,.5,1e6,NaN])for(const c of [null,10,0,-1]){const v=portalVisualSample({...d,closing:c},t);for(const p of [...v.rim,...v.spiral,...v.particles])assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y)&&Math.abs(p.x)<30&&p.y>-60&&p.y<25);}
 const calls=[],ctx={save(){},restore(){},translate(){},beginPath(){},ellipse(){},fill(){},fillRect(...r){calls.push(r);},fillText(s){calls.push(s);}};drawPortal(ctx,{...d,closing:7.4},1);assert.ok(calls.length<400);assert.ok(calls.includes('8s TO COLLAPSE'));assert.equal(ctx.shadowBlur,0);assert.equal(ctx.globalAlpha,1);
});
