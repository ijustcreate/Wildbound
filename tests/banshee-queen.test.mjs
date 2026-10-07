import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {ITEMS,BANSHEE_SET,BANSHEE_EQUIPMENT,stat,setProgress,equip,unequip,rollGear} from '../src/items.mjs';
import {BANSHEE_EVENT,initializeBansheeQueen,tickBansheeQueen,bansheeArrowBonus,bansheeArrowImpact} from '../src/banshee-queen.mjs';
import {bansheeMotion,bansheeVisualActor,drawBanshee,validateBansheeMotion} from '../src/banshee-motion.mjs';
import {sampleBansheeSteps,drawBansheeSteps,BANSHEE_STEP_LIMIT} from '../src/banshee-steps.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';
import {creatures,applyDefinitions,definitionPack} from '../src/definitions.mjs';
import {rigPack} from '../src/project-rigs.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {befriendCreature} from '../src/friendly-creatures.mjs';
import {paintItem} from '../src/item-art.mjs';
import {usesDoors} from '../src/navigation.mjs';
import {playerAction} from '../src/player-motion.mjs';

function field(){const g=new Game(()=>.5),p=g.addPlayer('keyboard','Frost tester');g.phase='play';g.openingBoard=false;g.house=null;g.scenery=[];g.terrain.fill('grass');g.enemies=[];Object.assign(p,{x:300,y:300,hp:100,faceX:1,faceY:0});return {g,p};}
function wear(p,ids=BANSHEE_SET){p.equipment={};for(const id of ids)p.equipment[ITEMS[id].slot]=id;if(ITEMS[p.equipment.hand1]?.twoHanded)p.equipment.hand2='occupied';}
function queen(g,extra={}){const e={kind:'banshee_queen',id:g.nextId++,x:500,y:300,hp:340,maxHp:340,speed:44,damage:24,state:'hunt',flash:0,cooldown:0,tacticTime:1,faceX:-1,faceY:0,...extra};initializeBansheeQueen(e);g.enemies.push(e);return e;}
function tick(g,e,p,seconds){for(let n=0;n<Math.ceil(seconds/.05);n++){e.cooldown-=.05;tickBansheeQueen(g,e,p,.05,creatures.banshee_queen.stats);g.time+=.05;}}

test('Banshee event appends without shifting existing indices, spawns one queen and exactly five bones',()=>{
 assert.equal(EVENTS[0].kind,'lion');assert.equal(EVENTS[2].kind,'snake');assert.equal(EVENTS[54].name,BANSHEE_EVENT.name);
 assert.equal(EVENTS.filter(e=>e.kind==='banshee_queen'&&e.environment!=='graveyard').length,1);
 const {g}=field();g.spawnEvent(EVENTS.findIndex(e=>e.kind==='banshee_queen'));
 assert.equal(g.enemies.length,6);assert.equal(g.eventSpawnCount,6);assert.equal(g.enemies.filter(e=>e.kind==='banshee_queen').length,1);
 assert.equal(g.enemies.filter(e=>['skeleton','skeleton_unarmed'].includes(e.kind)).length,5);
 const e=g.enemies.find(e=>e.kind==='banshee_queen');assert.deepEqual(e.equipment,BANSHEE_EQUIPMENT);assert.equal(e.arrowsLeft,36);assert.equal(e.hp,340);
 assert.equal(g.enemies.filter(e=>e.boss).length,1);assert.equal(creatures.banshee_queen.rig.type,'humanoid');assert.ok(usesDoors(e));
 const old=EVENTS.filter(e=>e.kind!=='banshee_queen'),imported=structuredClone(EVENTS);applyDefinitions({version:1,events:old},imported,{});
 assert.deepEqual(imported.slice(0,old.length).map(e=>e.name),old.map(e=>e.name));assert.equal(imported.at(-1).kind,'banshee_queen');
});
test('every distinct pair activates freeze, and only all five activate cosmetic steps',()=>{
 const {p}=field();for(const id of BANSHEE_SET){wear(p,[id]);assert.equal(stat(p,'arrowFreezeChance'),0);}
 for(let a=0;a<5;a++)for(let b=a+1;b<5;b++){wear(p,[BANSHEE_SET[a],BANSHEE_SET[b]]);assert.equal(stat(p,'arrowFreezeChance'),.2);assert.equal(stat(p,'icySteps'),0);}
 wear(p);assert.equal(setProgress(p,'banshee').count,5);assert.equal(stat(p,'icySteps'),1);assert.equal(stat(p,'arrowFreezeChance'),.2);
 p.equipment.hand2='banshee_bow';p.equipment.head=null;assert.equal(setProgress(p,'banshee').count,4);assert.equal(stat(p,'icySteps'),0);
 p.equipment={hand1:'banshee_bow',hand2:'banshee_bow'};assert.equal(stat(p,'arrowFreezeChance'),0);
});
test('new gear equips separately in head, cape, shoulders, back and both hands; not random loot',()=>{
 const {p}=field();p.inventory=BANSHEE_SET.map(type=>({type,qty:1}));
 for(const id of BANSHEE_SET){assert.ok(equip(p,p.inventory.findIndex(i=>i?.type===id)));assert.equal(p.equipment[ITEMS[id].slot],id);}
 assert.equal(p.equipment.hand2,'occupied');assert.ok(unequip(p,'back'));assert.equal(stat(p,'icySteps'),0);assert.equal(stat(p,'arrowFreezeChance'),.2);
 for(const rarity of ['common','rare','unique','legendary'])for(let n=0;n<100;n++)assert.ok(!ITEMS[rollGear(()=>n/100,rarity)]?.bansheeGear);
});
test('Queen is the shared humanoid rig, with a pure visual costume adapter and authored-rig round trip',()=>{
 const a={kind:'banshee_queen',hp:340,moving:true},before=structuredClone(a),v=bansheeVisualActor(a);
 assert.deepEqual(a,before);assert.deepEqual(v.equipment,BANSHEE_EQUIPMENT);assert.equal(v.appearance.skin,'#85b9cd');assert.equal(v.appearance.eyeColor,'#ee627f');
 assert.equal(rigSubject('banshee_queen').data,bansheeMotion);assert.equal(bansheeMotion.artGeneration,3);assert.ok(validateBansheeMotion(bansheeMotion));
 assert.ok(validateBansheeMotion(rigPack(EVENTS,ITEMS).banshee));assert.ok(validateBansheeMotion(definitionPack(EVENTS,ITEMS).banshee));
 const events=structuredClone(EVENTS);assert.doesNotThrow(()=>applyDefinitions({version:1,banshee:structuredClone(bansheeMotion)},events,{}));
 assert.throws(()=>applyDefinitions({version:1,banshee:{type:'skeleton'}},events,{}),/Banshee/);
});
test('all eight views have native pixel idle, walk, draw, ranged, hurt and death; icons are distinct',()=>{
 const rasters=new Set();for(let d=0;d<8;d++)for(const action of ['idle','walk','draw','ranged','hurt','death']){
  let pixels=0;const c={save(){},restore(){},fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));pixels+=w*h;}};
  const pose=drawBanshee(c,{hp:340,faceX:Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction:action,playerFrame:3},1);
  assert.ok(pose.head&&pose.handL&&pose.footR);assert.ok(pixels>100&&pixels<16000);
 }
 for(const type of BANSHEE_SET){const pixels=[];paintItem({fillRect(x,y,w,h){pixels.push([x,y,w,h,this.fillStyle]);}},type);assert.ok(pixels.length>20);rasters.add(JSON.stringify(pixels));}
 assert.equal(rasters.size,5);
 const a={hp:340,bansheeDrawLeft:.4,bansheeDrawDuration:.8};assert.equal(playerAction(bansheeVisualActor(a)),'draw');
 assert.equal(bansheeVisualActor({...a,frozen:1}).animationAction,'idle');assert.equal(bansheeVisualActor({...a,flash:.1}).animationAction,'hurt');assert.equal(bansheeVisualActor({...a,hp:0}).animationAction,'death');
});
test('bow telegraph delays shooting, locks aim, consumes one arrow and recovers',()=>{
 const {g,p}=field(),e=queen(g);tick(g,e,p,.05);assert.ok(e.bansheeDrawLeft>0);assert.equal(g.arrows.length,0);
 const direction=structuredClone(e.bansheeAim);p.y+=75;tick(g,e,p,.4);assert.equal(g.arrows.length,0);tick(g,e,p,.45);
 assert.equal(g.arrows.length,1);assert.equal(e.arrowsLeft,35);assert.equal(g.arrows[0].hostile,true);assert.equal(g.arrows[0].vx,direction.x*300);assert.equal(g.arrows[0].vy,direction.y*300);
 assert.ok(e.cooldown>1.9);tick(g,e,p,.5);assert.equal(g.arrows.length,1);
});
test('frozen, hit, trapped, dead or friendly Queens cannot release a hostile shot',()=>{
 for(const condition of [{frozen:1},{flash:.1},{hp:0},{state:'snared',timer:1},{faction:'ally'}]){
  const {g,p}=field(),e=queen(g);tick(g,e,p,.05);Object.assign(e,condition);tick(g,e,p,1);
  assert.equal(g.arrows.length,0);
 }
 const {g,p}=field(),e=queen(g);tick(g,e,p,.05);g.projectileBlocked=()=>true;tick(g,e,p,1);assert.equal(g.arrows.length,0);assert.equal(e.bansheeDrawLeft,0);
});
test('empty quiver never fires; the Queen retains the existing arrow retrieval behavior',()=>{
 const {g,p}=field(),e=queen(g,{arrowsLeft:0});tick(g,e,p,2);assert.equal(g.arrows.length,0);
 g.loot=[{id:99,x:e.x,y:e.y,type:'arrow',qty:3}];tick(g,e,p,.05);assert.equal(e.arrowsLeft,3);assert.equal(g.loot.length,0);
});
test('two-piece arrows snapshot bonus at release, freeze on impact, and do not change ammunition',()=>{
 const {g,p}=field();wear(p,['banshee_bow','banshee_quiver']);p.inventory=[{type:'arrow',qty:3}];assert.ok(g.fireArrow(p,1));
 const a=g.arrows[0];assert.equal(a.bansheeFreezeChance,.2);assert.equal(a.ammoType,'arrow');assert.equal(a.ice,undefined);
 wear(p,[]);const e=queen(g,{hp:1000,maxHp:1000});Object.assign(a,{x:e.x,y:e.y,z:20,vx:0,vy:0,vz:0});g.random=()=>.1;g.tickAdventure(.01,{});
 assert.equal(e.frozen,1.5);assert.equal(e.killedBy,p.id);assert.ok(a.stuck);assert.equal(a.bansheeFreezeRolled,true);
});
test('freeze proc threshold, once-per-arrow guard, exclusions and longer ice duration are preserved',()=>{
 const {g,p}=field(),e=queen(g);wear(p,['banshee_hood','banshee_cape']);let rolls=0;g.random=()=>{rolls++;return .19;};
 const a={...bansheeArrowBonus(p)};assert.ok(bansheeArrowImpact(g,a,e));assert.equal(e.frozen,1.5);assert.equal(bansheeArrowImpact(g,a,e),false);assert.equal(rolls,1);
 e.frozen=4;assert.ok(bansheeArrowImpact(g,{...bansheeArrowBonus(p)},e));assert.equal(e.frozen,4);
 g.random=()=>.2;assert.equal(bansheeArrowImpact(g,{...bansheeArrowBonus(p)},e),false);
 for(const [a,target]of [[{hostile:true},e],[{},p],[{},{...e,practiceTarget:true}],[{},{...e,hp:0}],[{},{...e,faction:'ally'}]])assert.equal(bansheeArrowImpact(g,{...a,bansheeFreezeChance:1},target),false);
});
test('one-piece arrows do not gain bonuses by equipping a second piece after release',()=>{
 const {g,p}=field();wear(p,['banshee_bow']);p.inventory=[{type:'arrow',qty:2}];g.fireArrow(p,1);const a=g.arrows[0];wear(p,['banshee_bow','banshee_hood']);
 assert.equal(a.bansheeFreezeChance,0);g.random=()=>0;assert.equal(bansheeArrowImpact(g,a,queen(g)),false);
});
test('five Queen drops and experience are rewarded once, including reload; allies give no rewards',()=>{
 const {g,p}=field(),e=queen(g);p.x=100;p.y=100;e.hp=0;g.update(.05,{});
 for(const type of BANSHEE_SET)assert.equal(g.loot.filter(l=>l.type===type).reduce((n,l)=>n+l.qty,0),1);
 const rewards=JSON.stringify(g.loot),cleared=g.cleared;g.update(.05,{});assert.equal(JSON.stringify(g.loot),rewards);assert.equal(g.cleared,cleared);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));restored.update(.05,{});assert.equal(restored.loot.filter(l=>BANSHEE_SET.includes(l.type)).length,5);assert.equal(restored.cleared,cleared);
 const ally=queen(restored);befriendCreature(ally,p.id);ally.hp=0;restored.update(.05,{});assert.equal(restored.cleared,cleared);assert.equal(restored.loot.filter(l=>BANSHEE_SET.includes(l.type)).length,5);
});
test('save/reload retains the Queen draw, ammunition, costume, player set and projectile proc state',()=>{
 const {g,p}=field(),e=queen(g);wear(p);p.inventory=[{type:'arrow',qty:2}];tick(g,e,p,.05);g.fireArrow(p,.5);g.arrows[0].bansheeFreezeRolled=true;
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),q=restored.players[0],boss=restored.enemies[0];
 assert.deepEqual(boss.equipment,e.equipment);assert.equal(boss.bansheeDrawLeft,e.bansheeDrawLeft);assert.equal(boss.arrowsLeft,36);assert.equal(stat(q,'icySteps'),1);assert.equal(restored.arrows[0].bansheeFreezeRolled,true);
});
test('icy footsteps are bounded floor-plane cosmetics, not saved actors, damage or terrain',()=>{
 const {g,p}=field();wear(p);const terrain=JSON.stringify(g.terrain),hp=p.hp;sampleBansheeSteps(g);
 for(let n=0;n<200;n++){p.x+=10;g.time+=.01;sampleBansheeSteps(g);}
 assert.equal(sampleBansheeSteps(g).length,BANSHEE_STEP_LIMIT);assert.equal(JSON.stringify(g.terrain),terrain);assert.equal(p.hp,hp);assert.equal(g.enemies.length,0);
 const saved=JSON.stringify(saveSession(g));let pixels=0;drawBansheeSteps({save(){},restore(){},fillRect(){pixels++;}},g);assert.ok(pixels>0);assert.equal(JSON.stringify(saveSession(g)),saved);
 g.time+=3;assert.equal(sampleBansheeSteps(g).length,0);
});
test('standing, jumps, teleports and partial gear never leave new footprints; rooms stay separate',()=>{
 const {g,p}=field();wear(p);sampleBansheeSteps(g);g.time=.1;assert.equal(sampleBansheeSteps(g).length,0);
 p.jumpHeight=20;p.x+=20;g.time+=.1;assert.equal(sampleBansheeSteps(g).length,0);p.jumpHeight=0;p.x+=20;g.time+=.1;sampleBansheeSteps(g);
 p.x+=100;g.time+=.1;assert.equal(sampleBansheeSteps(g).length,0);
 p.x+=20;g.time+=.1;assert.equal(sampleBansheeSteps(g).length,2);
 p.room=1;p.roomX=100;p.roomY=100;sampleBansheeSteps(g,{room:1});p.roomX+=20;g.time+=.1;assert.equal(sampleBansheeSteps(g,{room:1}).length,2);assert.equal(sampleBansheeSteps(g).length,2);
 delete p.equipment.head;p.roomX+=20;g.time+=.1;assert.equal(sampleBansheeSteps(g,{room:1}).length,2);
});
