import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceQuidditchMatch,createQuidditchMatch,quidditchAction,quidditchPrompt,quidditchTeam} from '../src/quidditch-match.mjs';
import {QUIDDITCH_HOOPS,QUIDDITCH_PITCH,QUIDDITCH_TEAMS,QUIDDITCH_TRUNK} from '../src/quidditch-layout.mjs';

const hero=(id,team,more={})=>({id,team,x:7600+id*200,y:4600,faceX:1,faceY:0,hp:95,
 broomMount:{item:{type:'nimbus_2000'}},inventory:[{type:'potion',qty:1}],jumpHeight:38,...more});
const on=(p,v,z=p.jumpHeight)=>Object.assign(p,{x:v.x,y:v.y,jumpHeight:z});
function fixture(){
 const roster=Array.from({length:6},(_,i)=>hero(i,i<3?'gold':'violet'));
 const match=createQuidditchMatch({players:roster}),p=roster[0];
 on(p,QUIDDITCH_TRUNK);
 assert.equal(quidditchAction(match,p,'open'),true);
 return {match,p,roster};
}
function tick(match,seconds,players){for(let i=0;i<Math.ceil(seconds/.05);i++)advanceQuidditchMatch(match,.05,players);}

test('the central trunk opens once and only an airborne rider can claim the Quaffle',()=>{
 const p=hero(0,'gold'),q=hero(1,'violet'),match=createQuidditchMatch({players:[p,q]});
 assert.equal(quidditchAction(match,p,'interact'),false);
 on(p,QUIDDITCH_TRUNK,0);delete p.broomMount;
 assert.equal(quidditchPrompt(match,p),'OPEN BALL TRUNK');
 assert.equal(quidditchAction(match,p,'interact'),true);
 assert.equal(match.bludgers.length,2);
 assert.ok([match.quaffle,match.snitch,...match.bludgers].every(b=>Math.hypot(b.x-QUIDDITCH_TRUNK.x,b.y-QUIDDITCH_TRUNK.y)<10&&b.vz>0));
 assert.equal(quidditchAction(match,p,'open'),false);
 on(p,match.quaffle,0);on(q,match.quaffle);
 assert.equal(quidditchAction(match,p,'catch'),false);
 assert.equal(quidditchAction(match,q,'catch'),true);
 on(p,match.quaffle,38);p.broomMount={};
 assert.equal(quidditchAction(match,p,'catch'),false);
 assert.equal(match.quaffle.holderId,'1');
 assert.deepEqual(q.inventory,[{type:'potion',qty:1}]);
});

test('a flying player throws the Quaffle through the target ring and scores only once',()=>{
 const {match,p,roster}=fixture();
 on(p,match.quaffle);assert.equal(quidditchAction(match,p,'catch'),true);
 const hoop=QUIDDITCH_HOOPS.find(h=>h.team==='violet'&&h.z===98);
 on(p,{x:hoop.x-310,y:hoop.y},hoop.z-14);
 assert.equal(quidditchAction(match,p,'throw',{aimX:1,aimY:0}),true);
 assert.equal(match.quaffle.holderId,null);
 assert.ok(match.quaffle.vx>300);
 tick(match,1,roster);
 assert.deepEqual(match.scores,{gold:1,violet:0});
 assert.equal(match.events.filter(e=>e.type==='goal').length,1);
 assert.ok(match.quaffle.resetAt>match.time);
 tick(match,1,roster);
 assert.deepEqual(match.scores,{gold:1,violet:0});
});

test('a thrown ball can be intercepted and an own-hoop shot cannot award a point',()=>{
 const {match,p,roster}=fixture(),q=roster[3];
 on(p,match.quaffle);assert.equal(quidditchAction(match,p,'catch'),true);
 on(p,{x:7660,y:5110},65);on(q,{x:7510,y:5110},65);
 assert.equal(quidditchAction(match,p,'throw',{aimX:-1,aimY:0}),true);
 tick(match,.35,roster);
 assert.equal(quidditchAction(match,q,'ball',{},roster),true);
 assert.equal(match.quaffle.holderId,'3');
 delete q.broomMount;advanceQuidditchMatch(match,.05,roster);
 assert.equal(match.quaffle.holderId,null);
 on(p,match.quaffle,65);tick(match,.5,roster);
 if(match.quaffle.holderId===null){on(p,match.quaffle,match.quaffle.z<=5?38:match.quaffle.z);quidditchAction(match,p,'catch');}
 assert.equal(match.quaffle.holderId,'0');
 on(p,{x:7570,y:5110},89);
 assert.equal(quidditchAction(match,p,'throw',{aimX:-1,aimY:0}),true);
 tick(match,1,roster);
 assert.deepEqual(match.scores,{gold:0,violet:0});
});

test('Bludgers knock loose the Quaffle and apply transient stagger outside hero health',()=>{
 const {match,p,roster}=fixture();
 on(p,match.quaffle);quidditchAction(match,p,'catch');
 on(p,{x:8210,y:5110},51);
 Object.assign(match.bludgers[0],{x:p.x,y:p.y,z:58,cooldown:0,launchUntil:0});
 advanceQuidditchMatch(match,.025,roster);
 assert.equal(p.hp,95);
 assert.equal(match.quaffle.holderId,null);
 assert.ok(match.stagger['0']>match.time);
 assert.equal(quidditchAction(match,p,'catch'),false);
 assert.equal(match.events.at(-1).type,'stagger');
});

test('catching the Snitch does not score until the correct stand and the winner follows total score',()=>{
 const {match,p,roster}=fixture(),other=roster[3];
 match.scores.violet=4;match.time=4;match.snitch.z=74;
 on(p,match.quaffle);assert.equal(quidditchAction(match,p,'catch'),true);
 on(p,match.snitch,match.snitch.z-3);on(other,p,p.jumpHeight);
 assert.equal(quidditchAction(match,p,'ball',{},roster),true);
 assert.equal(match.snitch.holderId,'0');assert.equal(match.quaffle.holderId,null);
 assert.equal(quidditchAction(match,other,'catch'),true);
 assert.equal(match.snitch.holderId,'0');assert.equal(match.quaffle.holderId,'3');
 assert.deepEqual(match.scores,{gold:0,violet:4});
 const otherStand=QUIDDITCH_TEAMS.violet.home;
 on(p,otherStand);assert.equal(quidditchAction(match,p,'turn-in'),false);
 on(p,QUIDDITCH_TEAMS.gold.home,0);delete p.broomMount;
 assert.equal(quidditchPrompt(match,p),'TURN IN SNITCH');
 assert.equal(quidditchAction(match,p,'interact'),true);
 assert.equal(match.phase,'finished');assert.deepEqual(match.scores,{gold:3,violet:4});
 assert.equal(match.winner,'violet');assert.equal(match.result.snitchTeam,'gold');
 assert.ok([match.quaffle,match.snitch,...match.bludgers].every(b=>b.x===QUIDDITCH_TRUNK.x&&b.y===QUIDDITCH_TRUNK.y&&b.z===0));
 assert.equal(match.quaffle.holderId,null);assert.equal(match.snitch.holderId,null);
 assert.equal(quidditchAction(match,p,'interact'),false);
 const lastEvent=match.events.at(-1).id;
 on(p,QUIDDITCH_TRUNK);assert.equal(quidditchAction(match,p,'rematch'),true);
 assert.equal(match.phase,'playing');assert.equal(match.round,2);
 assert.ok(match.events[0].id>lastEvent);
 assert.deepEqual(match.scores,{gold:0,violet:0});assert.equal(match.winner,null);
 assert.equal(match.snitch.holderId,null);assert.equal(match.bludgers.length,2);
});

test('ball action requires an opposing airborne holder in range, with a short re-steal lock',()=>{
 const {match,p,roster}=fixture(),opponent=roster[3],ally=roster[1];
 on(p,match.quaffle,52);on(opponent,p,80);on(ally,p,52);
 match.quaffle.holderId=String(opponent.id);
 assert.equal(quidditchAction(match,p,'ball',{},roster),false,'opponent is above reach');
 on(opponent,{x:p.x+60,y:p.y},52);
 assert.equal(quidditchAction(match,p,'ball',{},roster),false,'opponent is too far');
 on(opponent,{x:p.x+18,y:p.y},52);
 match.quaffle.holderId=String(ally.id);
 assert.equal(quidditchAction(match,p,'ball',{},roster),false,'a teammate can keep the ball');
 match.quaffle.holderId=String(opponent.id);
 assert.equal(quidditchPrompt(match,p,roster),'STEAL QUAFFLE');
 assert.equal(quidditchAction(match,p,'ball',{},roster),true);
 assert.equal(match.quaffle.holderId,String(p.id));
 assert.equal(match.events.at(-1).fromId,String(opponent.id));
 assert.equal(quidditchAction(match,opponent,'ball',{},roster),false);
 match.time+=.8;
 assert.equal(quidditchAction(match,opponent,'ball',{},roster),true);
});

test('opposing NPCs can be robbed and an unarmed rider can swat a Bludger',()=>{
 const p=hero(1,'gold'),match=createQuidditchMatch({players:[p]});
 on(p,QUIDDITCH_TRUNK);assert.equal(quidditchAction(match,p,'open'),true);
 advanceQuidditchMatch(match,.015,[p]);
 const npc=match.ai.find(a=>a.team==='violet');
 on(p,{x:8100,y:5170},53);Object.assign(npc,{x:8130,y:5170,z:56,jumpHeight:56});
 match.quaffle.holderId=npc.id;
 assert.equal(quidditchAction(match,p,'ball',{},[p]),true);
 assert.equal(match.events.at(-1).fromId,npc.id);
 assert.equal(quidditchAction(match,p,'ball',{aimX:1},[p]),true);
 const ball=match.bludgers[0];Object.assign(ball,{x:8104,y:5170,z:58});
 assert.equal(quidditchAction(match,p,'ball',{aimX:0,aimY:-1},[p]),true);
 assert.equal(match.events.at(-1).type,'bludger-swatted');assert.equal(ball.vy,-325);
 assert.equal(p.hp,95);
});

test('solo fills both teams and cloned match state advances deterministically',()=>{
 const p=hero(0,undefined),match=createQuidditchMatch({players:[p],seed:42});
 assert.equal(quidditchTeam(match,p),'gold');
 on(p,QUIDDITCH_TRUNK);assert.equal(quidditchAction(match,p,'open'),true);
 tick(match,2,[p]);
 assert.equal(match.ai.filter(a=>a.team==='gold').length,2);
 assert.equal(match.ai.filter(a=>a.team==='violet').length,3);
 const clone=JSON.parse(JSON.stringify(match));tick(match,30,[p]);tick(clone,30,[p]);
 assert.deepEqual(match,clone);
 assert.ok(match.events.some(e=>e.type==='throw'||e.type==='goal'||e.type==='snitch-caught'));
 assert.ok(match.ai.every(a=>a.x>QUIDDITCH_PITCH.left&&a.x<QUIDDITCH_PITCH.right&&Number.isFinite(a.z)));
});
