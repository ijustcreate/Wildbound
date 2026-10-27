import test from 'node:test';
import assert from 'node:assert/strict';
import {tickProvokedFauna} from '../src/provoked-fauna.mjs';
function fixture(kind,range=150){
 const e={id:20,kind,x:300,y:300,hp:200,maxHp:200,damage:10,speed:110,aggro:true,state:'hunt'},p={id:1,x:300+range,y:300,hp:1000};
 const g={phase:'play',players:[p],enemies:[e],traps:[],blocked:()=>false,projectileBlocked:()=>false,shieldBlocks:()=>false,hurt(p,n){p.hp-=n;},moveActor(a,dx,dy){a.x+=dx;a.y+=dy;return Math.hypot(dx,dy);}};
 const tick=(seconds)=>{for(let t=0;t<seconds-1e-8;t+=.02)tickProvokedFauna(g,e,p,.02);};return {g,e,p,tick};
}
test('peaceful wildlife keeps crossing; aggro uses distinct warned attacks',()=>{
 for(const [kind,d]of [['rhino',150],['pelican',150],['zebra',40]]){const{g,e,p,tick}=fixture(kind,d);e.aggro=false;e.state='stampede';tick(.5);assert.equal(e.state,'stampede');assert.equal(p.hp,1000);e.aggro=true;tick(.1);assert.equal(e.faunaCombat.phase,'windup');tick(.2);assert.equal(p.hp,1000,kind+' has an anticipation before damage');}
});
test('rhino commits to its charge, hits once per pass, then offers recovery',()=>{
 const{e,p,tick}=fixture('rhino');tick(.8);assert.equal(e.faunaCombat.phase,'charge');const dy=e.faunaCombat.dy;p.y+=100;tick(.1);assert.equal(e.faunaCombat.dy,dy,'cannot home during charge');p.y=300;tick(.6);assert.equal(p.hp,990,'one hit despite overlap across frames');tick(.8);assert.equal(e.faunaCombat.phase,'recover');
});
test('rhino stops at obstacles; leap, shield and moved targets avoid the hit',()=>{
 const wall=fixture('rhino');wall.tick(.8);wall.g.moveActor=()=>0;wall.tick(.02);assert.equal(wall.e.faunaCombat.phase,'recover');
 for(const avoid of ['leap','shield','room']){const{g,e,p,tick}=fixture('rhino',40);if(avoid==='leap')p.jumpHeight=30;if(avoid==='shield')g.shieldBlocks=()=>true;if(avoid==='room')p.room='shop';tick(1.5);assert.equal(p.hp,1000,avoid);}
});
test('zebra retaliates with a hind kick, briefly retreats, and reengages',()=>{
 const{e,p,tick}=fixture('zebra',40);tick(.2);assert.ok(e.faceX<0,'hindquarters face aggressor');tick(.5);assert.equal(p.hp,990);tick(5);assert.ok(p.hp<990,'retreat does not last forever');
 const dodge=fixture('zebra',40);dodge.tick(.2);dodge.p.x=260;dodge.tick(.5);assert.equal(dodge.p.hp,1000,'kick is directional');
});
test('pelican makes a passing swoop and peels away rather than hovering on target',()=>{
 const{e,p,tick}=fixture('pelican');tick(.6);assert.equal(e.faunaCombat.phase,'charge');for(let i=0;i<100&&e.faunaCombat.phase!=='peel';i++)tick(.02);assert.equal(p.hp,990);assert.equal(e.faunaCombat.phase,'peel');const x=e.x;tick(.4);assert.notEqual(e.x,x);tick(4);assert.ok(p.hp<990,'bird returns for another pass');
});
test('interrupts, dead targets, rooms and edited behavior flags cancel combat safely',()=>{
 for(const kind of ['rhino','zebra','pelican']){const{g,e,p,tick}=fixture(kind,40);tick(.1);g.traps.push({x:e.x,y:e.y,life:1,variant:'interrupt'});tick(.02);assert.equal(e.state,'recover');assert.equal(p.hp,1000);g.traps=[];p.hp=0;tick(2);assert.equal(e.moving,false);e.behaviors={melee:false};p.hp=1000;tick(3);assert.equal(p.hp,1000);}
});
