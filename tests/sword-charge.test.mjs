import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {swordChargeReach,swordCharging} from '../src/sword-feel.mjs';
const setup=()=>{const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.weather=null;g.event=null;g.persist=()=>{};Object.assign(p,{x:600,y:600,faceX:1,faceY:0,equipment:{hand1:'sword'},invincible:true});g.enemies=[];return {g,p};};
const tick=(g,input={},n=1)=>{for(let i=0;i<n;i++)g.update(.02,{keyboard:input});};
const charge=(g,n=60,hold='block')=>tick(g,{attack:true,[hold]:true,aimX:1},n);
const enemy=(g,x,y)=>{const e={id:900+g.enemies.length,kind:'lion',x,y,hp:1000,maxHp:1000,speed:0,damage:0,frozen:100,state:'hunt',cooldown:99,faceX:-1,faceY:0};g.enemies.push(e);return e;};
test('held aim grows a capped stationary sword lane; release travels its reach and cuts once',()=>{
 const {g,p}=setup();const a=enemy(g,650,600),b=enemy(g,755,600),side=enemy(g,690,630),beyond=enemy(g,795,600);
 charge(g);assert.equal(p.charge,1.2);assert.ok(swordCharging(p));assert.equal(p.x,600);assert.equal(swordChargeReach(p.charge),180);
 tick(g,{block:true});assert.ok(p.swordDash);tick(g,{block:true},45);
 assert.ok(Math.abs(p.x-780)<.01,p.x);assert.ok(a.hp<1000);assert.equal(a.hp,b.hp);assert.equal(side.hp,1000);assert.equal(beyond.hp,1000);assert.equal(p.spin,0);assert.equal(p.swordDash,undefined);
});
test('partial charge and hold-position use the same bounded preview distance',()=>{
 const {g,p}=setup();charge(g,15,'holdPosition');const length=swordChargeReach(p.charge);tick(g,{holdPosition:true});tick(g,{holdPosition:true},40);assert.ok(Math.abs(p.x-600-length)<.01);assert.ok(length<180);
});
test('dash sweeps collisions and interruption cancels remaining damage',()=>{
 const {g,p}=setup();const move=g.moveActor.bind(g);g.moveActor=(a,x,y)=>{if(a===p&&a.x+x>680)return;return move(a,x,y);};const e=enemy(g,730,600);charge(g);tick(g,{block:true});tick(g,{},40);assert.ok(p.x<=680);assert.equal(e.hp,1000);
 for(const cancel of [p=>p.ui={panel:'gear'},p=>p.stun=2,p=>p.equipment.hand1='bow']){const {g,p}=setup();charge(g);tick(g,{block:true});const x=p.x;cancel(p);tick(g,{},35);assert.ok(p.x<=x+.01);assert.equal(p.swordDash,undefined);}
});
test('ordinary sword charge retains its existing attack and no dash',()=>{const {g,p}=setup();tick(g,{attack:true},40);assert.ok(!swordCharging(p));tick(g);assert.equal(p.swordDash,undefined);});

test('hit pauses with a shield never mistake subpixel rounding for a wall',()=>{const {g,p}=setup();p.x=650;p.y=650;p.equipment.hand2='shield';const a=enemy(g,705,650),b=enemy(g,800,650);charge(g,67);tick(g,{block:true});tick(g,{block:true},48);assert.ok(Math.abs(p.x-830)<.01,p.x);assert.ok(a.hp<1000&&b.hp<1000);});
