import {startJump,releaseJump,tickJump,jumpMotion,CHICKEN_GLIDE_FALL_SPEED} from '../src/jumping.mjs';
import {heldChickenVisual} from '../src/chicken-visual.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {interactChicken,throwHeldChicken} from '../src/chicken-carry.mjs';
import {playerAction,playerPose,defaultNativePlayerMotion,upgradePlayerMotion,upgradePlayerToNative} from '../src/player-motion.mjs';
import {portalFloorSamples,portalPalette} from '../src/portal-floor.mjs';
const setup=()=>{const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.persist=()=>{};g.onSound=()=>{};Object.assign(p,{x:400,y:400,faceX:1,faceY:0,equipment:{hand1:'sword'}});const chicken={id:901,kind:'chicken',hp:22,x:410,y:400};g.enemies=[chicken];return{g,p,chicken};};
test('sword input winds up, releases once and finishes without a weapon attack',()=>{
 const {g,p,chicken}=setup();assert.ok(interactChicken(g,p));assert.equal(playerAction(p),'chicken_hold');
 g.tickWeaponInput(p,{attack:true},{attack:false},.02);assert.equal(playerAction(p),'chicken_throw');assert.equal(chicken.carriedBy,p.id);
 g.tickPlayerCombatTimers(p,.1);assert.equal(chicken.carriedBy,p.id);assert.equal(throwHeldChicken(g,p),false);
 g.tickPlayerCombatTimers(p,.08);assert.equal(chicken.carriedBy,undefined);assert.equal(p.heldChickenId,undefined);assert.equal(chicken.state,'flee');assert.ok(chicken.jumpHeight>=30);
 const x=chicken.x;g.tickPlayerCombatTimers(p,.3);assert.equal(p.chickenThrowTime,0);assert.equal(chicken.x,x);assert.equal(p.attack,0);
});
test('gentle placement stays calm and carry keeps moving legs',()=>{
 const {g,p,chicken}=setup();interactChicken(g,p);const model=defaultNativePlayerMotion(),still=playerPose(p,0,model),moving=playerPose({...p,moving:true,step:5},.2,model);assert.notDeepEqual(still.footL,moving.footL);
 interactChicken(g,p);assert.equal(chicken.state,'graze');assert.equal(chicken.jumpHeight,0);assert.equal(chicken.calmPlacement,true);
});
test('portal palette follows its owner and floor motes have separate height and ground contact',()=>{
 assert.equal(portalPalette('#79d7ba')[4],'#79d7ba');assert.notDeepEqual(portalPalette('#79d7ba'),portalPalette('#e78b6b'));
 const a=portalFloorSamples(0),b=portalFloorSamples(.4);assert.notDeepEqual(a,b);assert.ok(a.some(p=>p.z>5));assert.ok(a.some(p=>p.groundY<0)&&a.some(p=>p.groundY>0));for(const p of a)assert.ok(Math.abs(p.y-(p.groundY-p.z))<.0001);
});

test('native overhead carry raises both hands above the head and preserves authored keys on import',()=>{
 const model=defaultNativePlayerMotion(),actor={hp:100,heldChickenId:1};
 for(const time of [0,.4,.9]){const pose=playerPose(actor,time,model);assert.ok(pose.handL[2]>pose.head[2]+1);assert.ok(pose.handR[2]>pose.head[2]+1);}
 const missing=structuredClone(model);delete missing.clips.chicken_hold;delete missing.clips.chicken_throw;
 const restored=upgradePlayerMotion(missing),pose=playerPose(actor,0,restored);assert.ok(pose.handL[2]>pose.head[2]+1);
 const edited=structuredClone(model);edited.clips.chicken_hold.keys[0].joints.handL[0]-=1;const clip=structuredClone(edited.clips.chicken_hold);assert.deepEqual(upgradePlayerToNative(edited).clips.chicken_hold,clip);
});

test('carried chicken caps descent without requiring Jump to stay held, and normal falling resumes on release',()=>{
 const a={hp:100,x:0,y:0,jumpHeight:160,jumpVelocity:0,jumpGravity:1200,heldChickenId:1,jumpHeld:false},normal={...a,heldChickenId:undefined};
 for(let i=0;i<60;i++){tickJump(a,1/60);tickJump(normal,1/60);assert.ok(a.jumpVelocity>=-CHICKEN_GLIDE_FALL_SPEED);}
 assert.equal(normal.jumpHeight,0);assert.ok(a.jumpHeight>125);assert.equal(a.jumpVelocity,-CHICKEN_GLIDE_FALL_SPEED);
 const before=a.jumpHeight;delete a.heldChickenId;tickJump(a,.1);assert.ok(a.jumpVelocity < -100);assert.ok(before-a.jumpHeight>7);
});
test('chicken glide is stable across frame rates, steers, and lands on raised supports',()=>{
 const fall=()=>{const a={hp:100,x:0,y:0,jumpHeight:150,jumpVelocity:0,jumpGravity:1200,heldChickenId:1};for(let t=0;t<120;t++)tickJump(a,1/120);return a;};
 const fine=fall();for(const dt of [1/30,1/60]){const a={hp:100,x:0,y:0,jumpHeight:150,jumpVelocity:0,jumpGravity:1200,heldChickenId:1};for(let i=0;i<Math.round(1/dt);i++)tickJump(a,dt);assert.ok(Math.abs(a.jumpHeight-fine.jumpHeight)<.1);}
 const g={house:{furniture:[{kind:'bed',x:-20,y:-20,w:40,h:40,surfaceHeight:12,jumpable:true}]}};const a=fall();const motion=jumpMotion(a,1,0,130,.05);assert.ok(motion.dx>0);
 for(let i=0;i<600&&a.jumpHeight;i++)tickJump(a,1/60,g);assert.equal(a.jumpHeight,0);assert.equal(a.groundHeight,12);assert.equal(a.jumpVelocity,0);
});
test('carried chicken flaps on ascent and descent, then rests on landing',()=>{
 const {g,p,chicken}=setup();interactChicken(g,p);p.jumpHeld=true;startJump(p);assert.equal(heldChickenVisual(p,chicken,0).carriedFlap,true);releaseJump(p);
 while(p.jumpVelocity>0)tickJump(p,1/120);assert.equal(heldChickenVisual(p,chicken,.3).carriedFlap,true);
 for(let i=0;i<600&&p.jumpHeight;i++)tickJump(p,1/120);assert.equal(heldChickenVisual(p,chicken,1).carriedFlap,false);
});

test('a missing carried chicken clears carry state before the next fall step',()=>{
 const {g,p}=setup();interactChicken(g,p);Object.assign(p,{jumpHeight:100,jumpVelocity:-32});g.enemies=[];g.tickPlayerCombatTimers(p,.02);assert.equal(p.heldChickenId,undefined);assert.equal(p.carryingChicken,false);tickJump(p,.05,g);assert.ok(p.jumpVelocity < -CHICKEN_GLIDE_FALL_SPEED);
});
