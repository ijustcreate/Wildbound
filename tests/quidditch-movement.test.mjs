import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {rules} from '../src/definitions.mjs';
import {ALLEY_PITCH_PORTKEY,switchAlleyLayer} from '../src/diagon-alley.mjs';
import {useBroom} from '../src/broom-mount.mjs';
import {playerAction} from '../src/player-motion.mjs';
import {QUIDDITCH_PITCH,QUIDDITCH_RACK,QUIDDITCH_ROOM,QUIDDITCH_TRUNK,quidditchFieldBlocked} from '../src/quidditch-layout.mjs';
import {QUIDDITCH_COACH,quidditchVisualActor,visitQuidditchPitch} from '../src/quidditch-scene.mjs';
import {quidditchDialogueView} from '../src/quidditch-dialogue.mjs';
import {WING_HOVER_HEIGHT} from '../src/wing-flight.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

function pitch(){
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Pitch explorer');
 g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 switchAlleyLayer(g,'diagon');
 assert.ok(visitQuidditchPitch(g,p,ALLEY_PITCH_PORTKEY));
 assert.equal(g.trainTest.design.activeRoom,QUIDDITCH_ROOM);
 Object.assign(p,{x:7600,y:4800,equipment:{}});
 const step=(input={},frames=1)=>{
  for(let i=0;i<frames;i++)g.update(.025,{keyboard:input});
 };
 return {g,p,step};
}

test('pitch movement advances the native walk and run animations',()=>{
 const {p,step}=pitch();
 const start=p.x;
 step({x:.5},8);
 const walked=p.x-start;
 assert.ok(walked>0);
 assert.equal(playerAction(quidditchVisualActor(p)),'walk');
 assert.ok(p.step>0);

 const walkEnd=p.x,walkStep=p.step;
 step({x:1},8);
 assert.ok(p.x-walkEnd>walked);
 assert.equal(playerAction(quidditchVisualActor(p)),'run');
 assert.ok(p.step>walkStep);
 step({},8);
 assert.equal(playerAction(quidditchVisualActor(p)),'idle');
});

function jump(hold){
 const {p,step}=pitch();
 step({jump:true});
 assert.ok(p.jumpHeight>0&&p.jumpVelocity>0);
 assert.equal(playerAction(quidditchVisualActor(p)),'jump_takeoff');
 let peak=p.jumpHeight,landed=false,falls=false;
 for(let frame=0;frame<52;frame++){
  step({jump:hold});
  peak=Math.max(peak,p.jumpHeight);
  if(playerAction(quidditchVisualActor(p))==='jump_fall')falls=true;
  if(playerAction(quidditchVisualActor(p))==='land')landed=true;
  if(landed)assert.equal(p.jumpHeight,0,'holding Jump cannot launch a second jump');
 }
 assert.ok(falls&&landed);
 return peak;
}

test('pitch jump uses takeoff, fall, and landing clips, with a higher arc when held',()=>{
 const tapped=jump(false);
 assert.ok(jump(true)>tapped*1.2);
});

test('pitch dodge uses the standard dash movement and clip',()=>{
 const {p,step}=pitch(),start=p.x;
 step({x:1});
 const runDistance=p.x-start,dodgeStart=p.x;
 step({x:1,dodge:true});
 assert.ok(p.x-dodgeStart>runDistance&&p.dashTime>0);
 assert.equal(playerAction(quidditchVisualActor(p)),'dash');
 step({dodge:true},80);
 assert.equal(p.dashTime,0);
 assert.equal(playerAction(quidditchVisualActor(p)),'idle');
});

test('equipped wings hover at their standard height, clear low fixtures, and still respect the pitch edge',()=>{
 const {p,step}=pitch();
 Object.assign(p,{x:QUIDDITCH_TRUNK.x-76,y:QUIDDITCH_TRUNK.y});
 step({x:1},30);
 assert.ok(p.x<QUIDDITCH_TRUNK.x,'the trunk blocks ground movement');
 const groundX=p.x;
 p.equipment.shoulders='succubus_wings';
 step({jump:true},24);
 assert.equal(p.jumpHeight,WING_HOVER_HEIGHT);
 assert.equal(p.x,groundX);
 assert.equal(playerAction(quidditchVisualActor(p)),'wing_hover');
 step({jump:true,x:1},36);
 assert.ok(p.x>QUIDDITCH_TRUNK.x+30,'a hovering explorer can clear the low trunk');

 p.x=QUIDDITCH_PITCH.right-32;
 step({jump:true,x:1},16);
 assert.ok(p.x<QUIDDITCH_PITCH.right);
 step();
 assert.ok(!p.wingHover&&p.jumpHeight<WING_HOVER_HEIGHT);
 step({},24);
 assert.equal(p.jumpHeight,0);
 assert.equal(quidditchFieldBlocked(p.x,p.y),false);
});

test('practice broom controls still rise and descend when flight wings are equipped',()=>{
 const {p,step}=pitch();
 Object.assign(p,{x:QUIDDITCH_RACK.x,y:QUIDDITCH_RACK.y+26,equipment:{shoulders:'succubus_wings'}});
 step({interact:true});
 assert.ok(p.broomMount&&p.quidditchLoaner);
 step({},16);
 const base=p.jumpHeight;
 step({jump:true},16);
 const altitude=p.jumpHeight;
 assert.ok(altitude>base&&altitude>WING_HOVER_HEIGHT);
 assert.equal(playerAction(quidditchVisualActor(p)),'broom_ride');
 assert.ok(!p.wingHover);
 step({broomDescend:true},16);
 assert.ok(p.jumpHeight<altitude);
 step({block:true});
 assert.ok(!p.broomMount);
 assert.equal(p.jumpHeight,0);
});

test('pitch broom dash boosts horizontal flight at the same altitude with model-specific cooldowns',()=>{
 for(const [type,multiplier] of [['flying_broom',1],['nimbus_2000',.9],['firebolt',.75]]){
  const {g,p,step}=pitch();
  p.inventory=[{type,qty:1}];
  assert.ok(useBroom(g,p,0));
  Object.assign(p,{jumpHeight:64,quidditchAltitude:64});
  const start=p.x;
  step({x:1});
  const cruising=p.x-start;
  const dashStart=p.x;
  step({x:1,dodge:true});
  assert.ok(p.x-dashStart>cruising*1.5,type+' gets a quick boost');
  assert.equal(p.dodge,rules.dashCooldown*multiplier);
  assert.equal(p.jumpHeight,64);
  assert.equal(playerAction(quidditchVisualActor(p)),'broom_ride');
  step({x:-1,dodge:true});
  assert.ok(p.x-dashStart>rules.dashSpeed*.04,'active dash keeps its direction');
  step({dodge:true},130);
  assert.equal(p.dashTime,0,'holding dash after the cooldown does not restart it');
  step();
  const previousY=p.y;
  step({y:1,dodge:true});
  assert.ok(p.dashTime>0&&p.y>previousY,'releasing dash makes the next press available');
  step({block:true});
  assert.equal(p.broomMount,undefined);
  assert.equal(p.dashTime,0);
  assert.ok(p.dodge>0,'dismounting preserves the remaining cooldown');
 }
});

test('a broom dash respects the edge of the pitch',()=>{
 const {g,p,step}=pitch();
 p.inventory=[{type:'flying_broom',qty:1}];
 assert.ok(useBroom(g,p,0));
 p.x=QUIDDITCH_PITCH.right-32;
 step({x:1,dodge:true},10);
 assert.ok(p.dashTime>0&&p.x<QUIDDITCH_PITCH.right);
});

test('wing flight does not act as a Quidditch broom when the ball is in reach',()=>{
 const {g,p,step}=pitch();
 Object.assign(p,{x:QUIDDITCH_TRUNK.x-38,y:QUIDDITCH_TRUNK.y});
 step({interact:true});
 const match=g.trainTest.quidditch;
 assert.equal(match.phase,'playing');

 Object.assign(p,{x:7600,y:4800,equipment:{shoulders:'succubus_wings'}});
 step({jump:true},24);
 assert.ok(p.wingHover);
 Object.assign(match.quaffle,{x:p.x+10,y:p.y,z:p.jumpHeight,vx:0,vy:0,vz:0,holderId:null});
 step({jump:true,quidditchBall:true});
 assert.notEqual(match.quaffle.holderId,String(p.id));
});

test('Madam Hooch can reset an active match and restore the midfield chest',()=>{
 const {g,p,step}=pitch();
 const {x,y}=QUIDDITCH_TRUNK;
 Object.assign(p,{x:x-38,y});
 assert.ok(g.blocked(x,y,7));
 step({interact:true});
 const match=g.trainTest.quidditch;
 assert.equal(match.phase,'playing');
 assert.equal(g.blocked(x,y,7),false);
 match.scores.gold=2;match.snitch.holderId=String(p.id);
 step();
 Object.assign(p,{x:QUIDDITCH_COACH.x,y:QUIDDITCH_COACH.y+21});
 step({interact:true});
 const view=quidditchDialogueView(g,p);
 assert.equal(view.npc.name,'Madam Hooch');
 g.inventoryAction(p,'choice:'+view.choices.findIndex(choice=>choice.action==='quidditch:ask-reset'));
 assert.equal(match.phase,'playing');
 g.inventoryAction(p,'choice:0');
 assert.equal(match.phase,'waiting');
 assert.deepEqual(match.scores,{gold:0,violet:0});
 assert.equal(match.snitch.holderId,null);
 assert.ok([match.quaffle,match.snitch,...match.bludgers].every(ball=>ball.x===x&&ball.y===y));
 assert.ok(g.blocked(x,y,7));
 step();Object.assign(p,{x:x-38,y});step({interact:true});
 assert.equal(match.phase,'playing');
 assert.equal(g.blocked(x,y,7),false);
});
