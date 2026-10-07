import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ITEMS} from '../src/items.mjs';
import {tickWingFlight,hasFlightWings,WING_HOVER_HEIGHT} from '../src/wing-flight.mjs';
import {tickJump} from '../src/jumping.mjs';
import {playerAction,defaultPlayerMotion,drawPlayer} from '../src/player-motion.mjs';
import {actorContact} from '../src/contact-shadow.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function field(){
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Wing tester');
 g.phase='play';g.openingBoard=false;g.scenery=[];g.house=null;g.terrain.fill('grass');g.enemies=[];
 Object.assign(p,{x:300,y:300,hp:100,equipment:{shoulders:'succubus_wings'}});
 return {g,p};
}
const frames=(g,p,n,input={jump:true})=>{for(let i=0;i<n;i++){if(!tickWingFlight(g,p,input,.05))tickJump(p,.05,g);}};

test('Only equipped flight wings enable held-Jump hover, not backpack ownership or unrelated shoulder gear',()=>{
 const {g,p}=field();assert.ok(ITEMS.succubus_wings.wingFlight);assert.ok(hasFlightWings(p));
 p.equipment={};p.inventory=[{type:'succubus_wings',qty:1}];assert.equal(hasFlightWings(p),false);assert.equal(tickWingFlight(g,p,{jump:true},.05),false);
 p.equipment.shoulders='iron_shoulders';assert.equal(hasFlightWings(p),false);
});

test('Hold Jump rises smoothly to a bounded hover and never moves the ground anchor',()=>{
 const {g,p}=field(),start={x:p.x,y:p.y};
 assert.ok(tickWingFlight(g,p,{jump:true},.05));assert.ok(p.jumpHeight>0&&p.jumpHeight<10);
 frames(g,p,500);assert.equal(p.jumpHeight,WING_HOVER_HEIGHT);assert.equal(p.jumpVelocity,0);assert.ok(p.wingHover);
 assert.deepEqual({x:p.x,y:p.y},start);assert.equal(playerAction(p),'jump_air');
 assert.equal(defaultPlayerMotion().joints.wingTipL,undefined);
});

test('Release Jump or unequip the wings immediately stops hovering and falls onto the real ground',()=>{
 for(const unequip of [false,true]){
  const {g,p}=field();frames(g,p,20);if(unequip)p.equipment.shoulders=null;
  assert.equal(tickWingFlight(g,p,{jump:unequip},.05),false);assert.equal(p.wingHover,false);
  const old=p.jumpHeight;tickJump(p,.05,g);assert.ok(p.jumpHeight<old);
  frames(g,p,30,{});assert.equal(p.jumpHeight,0);assert.equal(p.groundHeight,0);
 }
});

test('Ordinary held jumps still land once without wings; wing input can engage during an existing jump',()=>{
 const {g,p}=field();p.equipment={};for(let i=0;i<40;i++)g.update(.05,{keyboard:{jump:true}});
 assert.equal(p.jumpHeight,0);assert.ok(!p.wingHover);
 p.equipment.shoulders='succubus_wings';g.update(.05,{keyboard:{jump:true}});assert.ok(p.wingHover&&p.jumpHeight>0);
});

test('Hover can move under real Game input, but cannot pass through solid geometry',()=>{
 const {g,p}=field();for(let i=0;i<30;i++)g.update(.05,{keyboard:{jump:true,x:1}});
 assert.equal(p.jumpHeight,WING_HOVER_HEIGHT);assert.ok(p.x>300);assert.equal(p.y,300);
 const x=p.x;g.blocked=()=>true;for(let i=0;i<10;i++)g.update(.05,{keyboard:{jump:true,x:1}});
 assert.equal(p.x,x);assert.equal(p.jumpHeight,WING_HOVER_HEIGHT);
});

test('UI, rooms, death, roots, stun, sleep, freeze, charm and the opening board cannot start flight',()=>{
 for(const block of [{ui:{}},{room:'storage'},{hp:0},{rooted:1},{stun:1},{sleeping:1},{frozen:1},{state:'snared'},{consumeInput:true},{succubusCharm:{remaining:5}}]){
  const {g,p}=field();Object.assign(p,block);assert.equal(tickWingFlight(g,p,{jump:true},.05),false,JSON.stringify(block));assert.ok(!p.wingHover);
 }
 const {g,p}=field();g.openingBoard=true;assert.equal(tickWingFlight(g,p,{jump:true},.05),false);
});

test('Pause and zero-time checks do not advance hover or wing takeoff',()=>{
 const {g,p}=field();frames(g,p,20);const old=p.jumpHeight;g.paused=true;
 assert.equal(tickWingFlight(g,p,{},.05),true);assert.equal(p.jumpHeight,old);assert.equal(p.wingHover,true);
 g.paused=false;assert.equal(tickWingFlight(g,p,{jump:true},0),true);assert.equal(p.jumpHeight,old);
});

test('Hover respects raised support height and lands on the same support after release',()=>{
 const {g,p}=field();g.house={furniture:[{type:'table',kind:'table',x:270,y:270,w:60,h:60}]};
 // Use the board's authored support, independent of furniture schema versions.
 p.x=800;p.y=800;frames(g,p,30);assert.ok(p.jumpHeight>WING_HOVER_HEIGHT);
 const hovered=p.jumpHeight;frames(g,p,40,{});assert.equal(p.jumpHeight,0);assert.ok(p.groundHeight>0&&p.groundHeight<hovered);
});

test('Existing contact shadow remains on the ground while the humanoid rig is elevated',()=>{
 const {g,p}=field();frames(g,p,20);const contact=actorContact(g,p,80,true);
 assert.equal(contact.y,p.y+1);assert.equal(contact.surface,0);assert.equal(contact.separation,WING_HOVER_HEIGHT);
 const canvas={save(){},restore(){},translate(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},closePath(){},fillText(){},fillRect(){}};
 const pose=drawPlayer(canvas,p,1);assert.ok(pose.wingTipL&&pose.wingTipR);assert.equal(pose.tailTip,undefined);
});

test('Airborne height and equipped wings survive JSON reload; released controls cannot leave permanent flight',()=>{
 const {g,p}=field();frames(g,p,20);
 const reload=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),q=reload.players[0];
 assert.equal(q.equipment.shoulders,'succubus_wings');assert.equal(q.jumpHeight,WING_HOVER_HEIGHT);
 frames(reload,q,20,{});assert.equal(q.wingHover,false);assert.equal(q.jumpHeight,0);
});
