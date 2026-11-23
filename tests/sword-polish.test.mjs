import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {swordChargeReach} from '../src/sword-feel.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function scene(){
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();
 Object.assign(g,{openingBoard:false,scenery:[],weather:null,event:null,house:null});g.terrain.fill('grass');g.enemies=[];g.persist=()=>{};g.onSound=()=>{};
 Object.assign(p,{x:600,y:600,faceX:1,faceY:0,equipment:{hand1:'sword',hand2:'shield'},invincible:true});
 const seen=new WeakSet(),events=[];
 const tick=(input={},count=1,dt=.02)=>{for(let i=0;i<count;i++){
  g.update(dt,{keyboard:input});
  for(const fx of g.effects)if(fx.swordPolish&&!seen.has(fx)){seen.add(fx);events.push({...fx});}
 }};
 const charge=(count=60,direction={aimX:1,aimY:0})=>tick({attack:true,holdPosition:true,...direction},count);
 return {g,p,tick,charge,events};
}
const enemy=(g,x,y)=>{const e={id:900+g.enemies.length,kind:'skeleton',x,y,hp:1000,maxHp:1000,speed:0,damage:0,stationary:true,stun:100,state:'hunt',cooldown:99};g.enemies.push(e);return e;};

test('sword preview predicts a solid obstruction and the release cannot damage through it',()=>{
 const {g,p,tick,charge}=scene();
 const original=g.blocked.bind(g);g.blocked=(x,y,radius=0,...rest)=>x+radius>=690||original(x,y,radius,...rest);
 const behind=enemy(g,730,600);charge();
 assert.equal(p.swordChargePreview.blocked,true);
 assert.ok(p.swordChargePreview.length>0&&p.swordChargePreview.length<swordChargeReach(p.charge));
 const stop=p.x+p.swordChargePreview.length;
 tick({holdPosition:true});tick({holdPosition:true},45);
 assert.ok(p.x<=690,'player never traverses the obstruction');
 assert.ok(Math.abs(p.x-stop)<=8,'preview and four-pixel swept stop agree');
 assert.equal(behind.hp,1000,'the blade cannot damage through the wall');
});

test('turning charge recomputes the obstruction without rotating an old release lane',()=>{
 const {g,p,tick,charge}=scene();const original=g.blocked.bind(g);
 g.blocked=(x,y,radius=0,...rest)=>x+radius>=690||original(x,y,radius,...rest);
 charge();assert.equal(p.swordChargePreview.blocked,true);
 tick({attack:true,holdPosition:true,aimX:0,aimY:-1});
 assert.equal(p.swordChargePreview.blocked,false);assert.equal(p.swordChargePreview.length,180);
 tick({holdPosition:true,aimY:-1});const x=p.x;
 tick({holdPosition:true,aimX:1},35);assert.ok(Math.abs(p.x-x)<.01);assert.ok(p.y<460);
});

test('full charge readiness cues once per held attack, during long holds',()=>{
 const {p,tick,charge,events}=scene();charge();tick({attack:true,holdPosition:true,aimX:1},180);
 assert.equal(p.charge,1.2);assert.equal(events.filter(f=>f.swordPolish==='ready').length,1);
 tick({holdPosition:true},45);charge(62);
 assert.equal(events.filter(f=>f.swordPolish==='ready').length,2);
});

test('partial release receives one release cue, bounded trail emissions and finite cleanup',()=>{
 const {g,p,tick,charge,events}=scene();charge(15);tick({holdPosition:true});tick({holdPosition:true},45);
 const releases=events.filter(f=>f.swordPolish==='release');assert.equal(releases.length,1);
 assert.ok(releases[0].power>0&&releases[0].power<1);
 assert.ok(events.filter(f=>f.swordPolish==='trail').length<=24,'trail emissions are bounded by distance or time');
 tick({},90);assert.ok(!p.swordDash);assert.ok(!g.effects.some(f=>f.swordPolish),'presentation effects expire');
});

test('a charged swipe has one impact cue per target despite multiple sweep substeps',()=>{
 const {g,p,tick,charge,events}=scene();const a=enemy(g,650,600),b=enemy(g,735,610);charge();tick({holdPosition:true});tick({holdPosition:true},50);
 assert.ok(a.hp<1000&&b.hp<1000);assert.equal(a.hp,b.hp);
 assert.equal(events.filter(f=>f.swordPolish==='impact').length,2);
 assert.ok(!p.swordDash);assert.equal(p.spin,0);
});

test('menu, changed gear and disabled status cancel charge without a readiness or release leak',()=>{
 for(const cancel of [p=>p.ui={panel:'gear'},p=>p.equipment.hand1='bow',p=>p.stun=2,p=>p.sleeping=2]){
  const {p,tick,charge,events}=scene();charge(25);const x=p.x;cancel(p);tick({},80);
  assert.equal(p.charge,0);assert.ok(!p.swordDash);assert.equal(p.x,x);
  assert.ok(!events.some(f=>f.swordPolish==='release'||f.swordPolish==='ready'));
 }
});

test('save restoration drops every active sword presentation phase without phantom damage',()=>{
 for(const release of [false,true]){
  const {g,tick,charge}=scene();charge();if(release)tick({holdPosition:true},5);
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),hero=restored.players[0],x=hero.x;
  assert.equal(hero.swordDash,undefined);assert.equal(hero.swordStrike,undefined);assert.equal(hero.swordPolish,undefined);assert.equal(hero.charge,0);assert.equal(hero.attack,0);
  restored.update(.02,{});assert.equal(hero.x,x);
 }
});

test('buffered ordinary follow-up does not inherit a completed charged sword pose',()=>{
 const {g,p,tick,charge}=scene();charge();tick({holdPosition:true},19);g.attack(p,.1);let followed=false;
 for(let i=0;i<20;i++){tick({holdPosition:true});if(p.attack>0&&p.attackClip!=='swipe_big'){followed=true;assert.equal(p.swordReleasePower,undefined);assert.ok(!p.swordPolish);break;}}
 assert.ok(followed,'ordinary combo was buffered through charged recovery');
});
