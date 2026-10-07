import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {SUCCUBUS_DROPS,SUCCUBUS_EQUIPMENT,ITEMS,equip,unequip,rollGear} from '../src/items.mjs';
import {SUCCUBUS_EVENT,initializeSuccubus,tickSuccubus} from '../src/succubus.mjs';
import {isCharmed,applyCharm,clearCharm,tickCharmStatuses,charmInputs,tickCharmedPlayer,succubusTargets,playerCombatTargets,charmCanTarget,tickSuccubusKisses,drawSuccubusEffects,CHARM_KISS_LIMIT} from '../src/succubus-charm.mjs';
import {succubusMotion,defaultSuccubusMotion,validateSuccubusMotion,succubusVisualActor,drawSuccubus} from '../src/succubus-motion.mjs';
import {defaultPlayerMotion,validatePlayerMotion,drawPlayer,playerAction,playerPose} from '../src/player-motion.mjs';
import {SUCCUBUS_JOINTS,attachmentPose} from '../src/succubus-attachments.mjs';
import {creatures,applyDefinitions} from '../src/definitions.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';
import {rigPack} from '../src/project-rigs.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {usesDoors,collisionOffset} from '../src/navigation.mjs';
import {eventBoss} from '../src/event-director.mjs';
import {befriendCreature} from '../src/friendly-creatures.mjs';
import {paintItem} from '../src/item-art.mjs';
import {tickHazards} from '../src/hazards.mjs';
import {tickNightEquipment} from '../src/night-equipment.mjs';
import {throwBoomerang,tickBoomerangs} from '../src/boomerang.mjs';
import {tickNightEnemyHazards} from '../src/night-enemies.mjs';

function field(two=false){const g=new Game(()=>.5),p=g.addPlayer('keyboard','Pet');g.phase='play';g.openingBoard=false;g.scenery=[];g.house=null;g.terrain.fill('grass');g.enemies=[];Object.assign(p,{x:300,y:300,hp:100,faceX:1,faceY:0});const q=two?g.addPlayer('pad:9','Friend'):null;if(q)Object.assign(q,{x:370,y:300,hp:100,faceX:-1,faceY:0});return {g,p,q};}
function demon(g,extra={}){const e={id:g.nextId++,kind:'succubus',x:500,y:300,hp:180,maxHp:180,damage:18,speed:56,state:'hunt',flash:0,cooldown:0,tacticTime:1,faceX:-1,faceY:0,...extra};initializeSuccubus(e);g.enemies.push(e);return e;}
function ai(g,e,seconds){for(let n=0;n<Math.ceil(seconds/.05);n++){e.cooldown-=.05;tickSuccubus(g,e,g.players,.05,creatures.succubus.stats,creatures.succubus.behaviors);g.time+=.05;}}
function canvas(){return {save(){},restore(){},translate(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},closePath(){},fillText(){},fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));this.pixels.push([x,y,w,h,this.fillStyle]);},pixels:[]};}

test('Two succubi append as event 55, preserve old indices and register ordinary humanoid stats',()=>{
 assert.equal(EVENTS[0].kind,'lion');assert.equal(EVENTS[54].kind,'banshee_queen');assert.equal(EVENTS[55].name,SUCCUBUS_EVENT.name);assert.equal(EVENTS.filter(e=>e.kind==='succubus').length,1);assert.ok(eventBoss(SUCCUBUS_EVENT));
 const {g}=field();g.spawnEvent(55);assert.equal(g.eventSpawnCount,2);assert.equal(g.enemies.length,2);for(const e of g.enemies){assert.equal(e.kind,'succubus');assert.equal(e.hp,180);assert.deepEqual(e.equipment,SUCCUBUS_EQUIPMENT);assert.equal(collisionOffset(g,e),0);assert.ok(usesDoors(e));}assert.notEqual(g.enemies[0].succubusKissCooldown,g.enemies[1].succubusKissCooldown);
 assert.equal(creatures.succubus.rig.type,'humanoid');const imported=structuredClone(EVENTS);applyDefinitions({version:1,events:EVENTS.slice(0,55)},imported,{});assert.deepEqual(imported.map(e=>e.name),EVENTS.map(e=>e.name));
});
test('Extra bones belong only to the succubus variant; rig and clips validate/export round trip',()=>{
 const player=defaultPlayerMotion();assert.ok(validatePlayerMotion(player));for(const n of Object.keys(SUCCUBUS_JOINTS)){assert.ok(!player.joints[n]);assert.ok(succubusMotion.joints[n]);}
 assert.ok(validateSuccubusMotion(succubusMotion));assert.ok(validateSuccubusMotion(rigPack(EVENTS,ITEMS).succubus));assert.equal(rigSubject('succubus').data,succubusMotion);
 const bad=defaultSuccubusMotion();delete bad.joints.wingTipL;assert.equal(validateSuccubusMotion(bad),false);assert.throws(()=>applyDefinitions({version:1,succubus:bad},[],{}),/succubus/);
 assert.doesNotThrow(()=>applyDefinitions({version:1,succubus:defaultSuccubusMotion()},[],{}));
 for(const action of ['walk','fly','whip','kiss'])assert.ok(succubusMotion.clips[action]);
 const a={hp:180,moving:true},before=structuredClone(a);assert.equal(playerAction(succubusVisualActor(a)),'walk');assert.deepEqual(a,before);assert.equal(playerAction(succubusVisualActor({...a,succubusFlightHeight:16})),'fly');
});
test('Native pixel wings, tail, horns and all six animations render in eight directions',()=>{
 const hashes=new Set();for(let d=0;d<8;d++)for(const action of ['idle','walk','fly','whip','kiss','death']){
  const c=canvas(),p=drawSuccubus(c,{hp:180,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction:action,playerFrame:3},1);
  assert.ok(p.wingTipL&&p.wingTipR&&p.tailTip&&p.head);assert.ok(c.pixels.length>100);hashes.add(JSON.stringify(c.pixels));
 }assert.ok(hashes.size>30);
 const fly={hp:180,succubusFlightHeight:16};assert.notDeepEqual(playerPose(succubusVisualActor(fly),0,succubusMotion).wingTipL,playerPose(succubusVisualActor(fly),.2,succubusMotion).wingTipL);
});
test('Player wings equip in shoulders only, no added tail/bones or automatic flight, and icons are unique',()=>{
 const {p}=field();p.inventory=SUCCUBUS_DROPS.map(type=>({type,qty:1}));for(const type of SUCCUBUS_DROPS){assert.ok(equip(p,p.inventory.findIndex(i=>i?.type===type)));assert.equal(p.equipment[ITEMS[type].slot],type);}
 const c=canvas(),pose=drawPlayer(c,p,1);assert.ok(pose.wingTipL);assert.equal(pose.tailTip,undefined);assert.equal(p.succubusFlightHeight,undefined);assert.ok(!defaultPlayerMotion().joints.wingTipL);
 assert.ok(unequip(p,'shoulders'));assert.equal(drawPlayer(canvas(),p,1).wingTipL,undefined);
 const icons=new Set();for(const id of SUCCUBUS_DROPS){const c=canvas();paintItem(c,id);icons.add(JSON.stringify(c.pixels));assert.ok(c.pixels.length>20);}assert.equal(icons.size,3);
 for(let n=0;n<100;n++)assert.ok(!SUCCUBUS_DROPS.includes(rollGear(()=>n/100,'unique')));
});
test('Charm lasts exactly five simulation seconds, cannot refresh, then restores controls with grace',()=>{
 const {g,p}=field(),e=demon(g),gear=structuredClone(p.equipment);p.faction='ally';assert.ok(applyCharm(g,p,e));assert.equal(p.succubusCharm.remaining,5);assert.equal(applyCharm(g,p,e),false);assert.deepEqual(charmInputs(g,{keyboard:{x:1,attack:true}}).keyboard,{});
 tickCharmStatuses(g,4.9);assert.ok(isCharmed(p));tickCharmStatuses(g,.1);assert.equal(isCharmed(p),false);assert.equal(p.charmGrace,2);assert.equal(p.faction,'ally');assert.deepEqual(p.equipment,gear);assert.equal(applyCharm(g,p,e),false);tickCharmStatuses(g,2);assert.ok(applyCharm(g,p,e));
});
test('Succubi fight uncharmed players in aggro range; otherwise attack the pet',()=>{
 const {g,p,q}=field(true),e=demon(g);assert.ok(applyCharm(g,p,e));assert.deepEqual(succubusTargets(g,e),[q]);assert.equal(charmCanTarget(g,e,p),false);
 q.x=1400;assert.deepEqual(succubusTargets(g,e),[p]);assert.equal(charmCanTarget(g,e,p),true);q.room=1;q.x=350;assert.deepEqual(succubusTargets(g,e),[p]);
 const other=demon(g);assert.equal(succubusTargets(g,other)[0],p);q.room=null;assert.equal(succubusTargets(g,other)[0],q);
});
test('Controlled pet follows, uses real melee against teammate with PvP off, and never attacks succubi',()=>{
 const {g,p,q}=field(true),e=demon(g);p.equipment={hand1:'succubus_whip'};q.x=350;assert.ok(applyCharm(g,p,e));p.succubusCharm.attackCooldown=0;
 const hp=e.hp;tickCharmedPlayer(g,p,.05);assert.ok(q.hp<100);assert.equal(e.hp,hp);assert.equal(!!g.pvp,false);assert.deepEqual(playerCombatTargets(g,p),[q]);
 q.hp=0;p.attack=0;p.x=300;const x=p.x;tickCharmedPlayer(g,p,.05);assert.ok(p.x>x);assert.equal(p.blocking,false);
});
test('Full update ignores held movement/interact/inventory during charm and returns control afterward',()=>{
 const {g,p}=field(),e=demon(g,{x:400,cooldown:99});assert.ok(applyCharm(g,p,e));const x=p.x;g.update(.05,{keyboard:{x:-1,attack:true,inventory:true,portal:true,trap:true}});assert.ok(p.x>x);assert.equal(p.ui,null);assert.equal(g.portals.length,0);assert.equal(g.traps.length,0);
 clearCharm(p);const before=p.x;g.update(.05,{keyboard:{x:-1}});assert.ok(p.x<before);
});
test('Charmed projectile allegiance is snapshotted for arrows, magic and rifle, normal players may fight pets',()=>{
 const {g,p,q}=field(true),e=demon(g);assert.ok(applyCharm(g,p,e));assert.deepEqual(playerCombatTargets(g,q).map(a=>a.id),[e.id,p.id]);
 p.equipment={hand1:'bow',hand2:'occupied'};p.inventory=[{type:'arrow',qty:4}];assert.ok(g.fireArrow(p,.75));const a=g.arrows[0];assert.equal(a.charmShot,true);clearCharm(p);assert.deepEqual(playerCombatTargets(g,a),[q]);Object.assign(a,{x:q.x,y:q.y,z:18,vx:0,vy:0,vz:0});g.tickAdventure(.01,{});assert.ok(q.hp<100);assert.equal(e.hp,180);
 q.hp=100;q.invuln=0;p.charmGrace=0;assert.ok(applyCharm(g,p,e));p.equipment={hand1:'wand'};p.mana=100;assert.ok(g.fireSpell(p,0));assert.equal(g.spells[0].charmShot,true);
 p.equipment={hand1:'rifle'};p.inventory=[{type:'cartridge',qty:2}];p.attack=0;g.attack(p,1);assert.equal(g.rifleShots[0].charmShot,true);
});
test('Whip telegraph locks facing, does not damage early, hits once then recovers',()=>{
 const {g,p}=field(),e=demon(g,{x:380,succubusKissCooldown:99});ai(g,e,.05);assert.equal(e.succubusAttack,'whip');assert.equal(p.hp,100);ai(g,e,.5);assert.equal(p.hp,100);ai(g,e,.3);assert.ok(p.hp<100);const hp=p.hp;ai(g,e,.5);assert.equal(p.hp,hp);assert.ok(e.cooldown>0);
});
test('Kiss windup produces a slow bounded heart; it charms only once on real collision',()=>{
 const {g,p}=field(),e=demon(g,{succubusKissCooldown:0});ai(g,e,.05);assert.equal(e.succubusAttack,'kiss');const aim={...e.succubusAim};ai(g,e,.5);assert.equal(g.succubusKisses,undefined);ai(g,e,.55);assert.equal(g.succubusKisses.length,1);assert.equal(g.succubusKisses[0].vx,aim.x*165);assert.ok(e.succubusKissCooldown>7.9&&e.succubusKissCooldown<=8);
 for(let n=0;n<30&&!isCharmed(p);n++)tickSuccubusKisses(g,.05);assert.ok(isCharmed(p));assert.equal(p.succubusCharm.remaining,5);assert.equal(g.succubusKisses.length,0);
});
test('Hearts are blocked by geometry, shields, dodge invulnerability and airborne clearance',()=>{
 for(const mode of ['wall','shield','dodge','jump']){const {g,p}=field(),e=demon(g);g.succubusKisses=[{owner:e.id,x:p.x,y:p.y,vx:0,vy:0,life:1}];
  if(mode==='wall')g.projectileBlocked=()=>true;if(mode==='shield'){p.blocking=true;p.faceX=1;p.faceY=0;g.succubusKisses[0].x+=5;}if(mode==='dodge')p.invuln=.32;if(mode==='jump')p.jumpHeight=24;
  tickSuccubusKisses(g,.05);assert.equal(isCharmed(p),false,mode);
 }
 const {g,p}=field(),e=demon(g);g.succubusKisses=Array.from({length:100},()=>({owner:e.id,x:100,y:100,vx:0,vy:0,life:1}));tickSuccubusKisses(g,.05);assert.equal(g.succubusKisses.length,CHARM_KISS_LIMIT);p.hp=0;assert.equal(applyCharm(g,p,e),false);
});
test('Frozen/hurt/snared/dead or befriended succubi do not release a kiss',()=>{
 for(const condition of [{frozen:1},{flash:.1},{state:'snared',timer:2},{hp:0},{faction:'ally'}]){const {g}=field(),e=demon(g,{succubusKissCooldown:0});ai(g,e,.05);Object.assign(e,condition);ai(g,e,2);assert.ok(!g.succubusKisses?.length);}
 const {g,p}=field(),e=demon(g,{succubusFlightHeight:16});applyCharm(g,p,e);assert.ok(befriendCreature(e,p.id));tickCharmStatuses(g,0);assert.equal(isCharmed(p),false);assert.equal(e.succubusFlightHeight,0);
});
test('Freeze pauses winged flight phase and telegraph; target changes cancel attack safely',()=>{
 const {g,p,q}=field(true),e=demon(g,{succubusKissCooldown:0});ai(g,e,.05);const left=e.succubusWindup;e.frozen=1;ai(g,e,.5);assert.equal(e.succubusWindup,left);e.frozen=0;applyCharm(g,q,e);ai(g,e,.05);assert.equal(e.succubusAttack,null);assert.equal(g.succubusKisses,undefined);
 assert.equal(succubusVisualActor({...e,frozen:1}).playerFrame,0);assert.equal(succubusVisualActor({...e,hp:0}).animationAction,'death');assert.ok(q.hp>0);
});
test('Owner death, player death, invalid saves, room transitions and victory end charm',()=>{
 for(const mode of ['owner','player','room','won','invalid']){const {g,p}=field(),e=demon(g);applyCharm(g,p,e);if(mode==='owner')e.hp=0;if(mode==='player')p.hp=0;if(mode==='room')p.room=9;if(mode==='won')g.phase='won';if(mode==='invalid')p.succubusCharm.remaining=NaN;tickCharmStatuses(g,.05);assert.equal(p.succubusCharm,undefined,mode);}
 const {g,p}=field(),e=demon(g);applyCharm(g,p,e);g.completeVictory();assert.equal(p.succubusCharm,undefined);
});
test('Charm, gear, windup and kisses save/reload without resetting the five-second clock',()=>{
 const {g,p,q}=field(true),e=demon(g,{succubusKissCooldown:0});ai(g,e,.05);applyCharm(g,p,e);tickCharmStatuses(g,1.25);g.succubusKisses=[{owner:e.id,x:100,y:100,vx:165,vy:0,life:1}];
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.players[0].succubusCharm.remaining,3.75);assert.deepEqual(restored.enemies[0].equipment,e.equipment);assert.equal(restored.enemies[0].succubusWindup,e.succubusWindup);assert.equal(restored.succubusKisses[0].owner,e.id);assert.deepEqual(playerCombatTargets(restored,restored.players[0]).map(a=>a.id),[q.id]);
 restored.enemies[0].hp=0;tickCharmStatuses(restored,0);assert.equal(restored.players[0].succubusCharm,undefined);
});
test('Each succubus drops horns, wings and whip exactly once through the ordinary defeat path',()=>{
 const {g}=field(),e=demon(g);e.hp=0;g.update(.05,{});assert.equal(e.defeated,true);for(const type of SUCCUBUS_DROPS)assert.equal(g.loot.filter(l=>l.type===type).length,1);const cleared=g.cleared;g.update(.05,{});assert.equal(g.cleared,cleared);for(const type of SUCCUBUS_DROPS)assert.equal(g.loot.filter(l=>l.type===type).length,1);
});
test('Hearts and warning effects are stateless and only present during charm/windup',()=>{
 const {g,p}=field(),e=demon(g);const c=canvas();drawSuccubusEffects(c,g);assert.equal(c.pixels.length,0);applyCharm(g,p,e);const before=JSON.stringify(saveSession(g));drawSuccubusEffects(c,g);assert.ok(c.pixels.length>40);assert.equal(JSON.stringify(saveSession(g)),before);clearCharm(p);const empty=canvas();drawSuccubusEffects(empty,g);assert.equal(empty.pixels.length,0);
});
test('Wing/tail anchors follow their torso/pelvis through collapse, without moving the model or source pose',()=>{
 const a=succubusVisualActor({hp:0,deathTime:.5}),pose=playerPose(a,1,succubusMotion),before=structuredClone(pose),attached=attachmentPose(pose,a,1,succubusMotion);
 assert.deepEqual(pose,before);assert.equal(attached.wingRootL[2]-pose.wingRootL[2],pose.chest[2]-succubusMotion.joints.chest.position[2]);assert.equal(attached.tailBase[2]-pose.tailBase[2],pose.pelvis[2]-succubusMotion.joints.pelvis.position[2]);assert.ok(attached.wingRootL[2]<12);
});
test('Low flight alternates with walking and stays blocked on the real ground plane',()=>{
 const {g,p}=field(),e=demon(g,{succubusKissCooldown:99,cooldown:99,succubusFlightTimer:.01});g.blocked=()=>true;const before={x:e.x,y:e.y};ai(g,e,.5);assert.ok(e.succubusFlying&&e.succubusFlightHeight>10);assert.equal(e.x,before.x);assert.equal(e.y,before.y);e.frozen=1;const height=e.succubusFlightHeight;ai(g,e,.5);assert.equal(e.succubusFlightHeight,height);e.frozen=0;ai(g,e,2.6);assert.equal(e.succubusFlying,false);assert.ok(e.succubusFlightHeight<height);assert.ok(p.hp>0);
});
test('Editor hunt/ranged/melee switches and zero whip damage are honored',()=>{
 const {g,p}=field(),e=demon(g,{x:350,damage:0,succubusKissCooldown:0});tickSuccubus(g,e,g.players,.05,{},{});assert.equal(e.succubusAttack,undefined);assert.equal(p.hp,100);
 e.x=600;const x=e.x;tickSuccubus(g,e,g.players,.1,{}, {hunt:false,ranged:false,melee:false});assert.equal(e.x,x);assert.equal(g.succubusKisses,undefined);
});
test('Two simultaneous owners cannot extend charm; both charmed players are enemy-side and nobody attacks a fellow pet',()=>{
 const {g,p,q}=field(true),e=demon(g),second=demon(g);assert.ok(applyCharm(g,p,e));tickCharmStatuses(g,1);assert.equal(applyCharm(g,p,second),false);assert.equal(p.succubusCharm.owner,e.id);assert.equal(p.succubusCharm.remaining,4);assert.ok(applyCharm(g,q,second));assert.deepEqual(playerCombatTargets(g,p),[]);assert.deepEqual(succubusTargets(g,e),[p,q]);
 q.hp=0;tickCharmStatuses(g,0);assert.equal(q.succubusCharm,undefined);for(let i=0;i<80;i++)tickCharmStatuses(g,.05);assert.equal(p.succubusCharm,undefined);
});
test('Normal arrows fired before charm keep normal allegiance, and dead mistress clears charm during the real update',()=>{
 const {g,p,q}=field(true),e=demon(g);p.equipment={hand1:'bow',hand2:'occupied'};p.inventory=[{type:'arrow',qty:2}];g.fireArrow(p,.5);const a=g.arrows[0];assert.equal(a.charmShot,false);applyCharm(g,p,e);assert.ok(playerCombatTargets(g,a).includes(e));assert.ok(!playerCombatTargets(g,a).includes(q));e.hp=0;g.update(.05,{});assert.equal(p.succubusCharm,undefined);
});
test('Magic, rifle and boomerang controlled shots actually hit teammates, not enemy-side actors',()=>{
 for(const kind of ['wand','rifle','boomerang']){
  const {g,p,q}=field(true),e=demon(g);applyCharm(g,p,e);p.equipment={hand1:kind};p.mana=100;p.faceX=1;p.faceY=0;q.x=350;
  if(kind==='wand'){g.fireSpell(p,.3);const b=g.spells[0];Object.assign(b,{x:q.x,y:q.y,vx:0,vy:0});g.tickAdventure(.01,{});}
  if(kind==='rifle'){p.inventory=[{type:'cartridge',qty:2}];g.attack(p,1);for(let n=0;n<10;n++)tickNightEquipment(g,.01);}
  if(kind==='boomerang'){assert.ok(throwBoomerang(g,p));for(let n=0;n<25;n++)tickBoomerangs(g,.01);}
  assert.ok(q.hp<100,kind);assert.equal(e.hp,180,kind);
 }
});
test('Existing enemy projectiles and night traps skip enemy-team pets; terrain/status hazards remain dangerous',()=>{
 const {g,p}=field(),e=demon(g);applyCharm(g,p,e);const projectile={x:p.x,y:p.y,vx:0,vy:0,life:1,damage:9,burnDamage:2,trail:9,duration:4,z:20,vz:0};
 g.fireballs=[{...projectile}];g.poisonShots=[{...projectile}];g.bananas=[{...projectile}];tickHazards(g,.01);assert.equal(p.hp,100);assert.ok(!p.poison&&!p.burning);
 g.nightEnemies={shots:[{...projectile,kind:'barb',remaining:200}],traps:[{x:p.x,y:p.y,life:1,arm:0,damage:9}]};tickNightEnemyHazards(g,.01);assert.equal(p.hp,100);
 g.hurt(p,5);assert.ok(p.hp<100);assert.ok(isCharmed(p));
});
