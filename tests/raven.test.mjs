import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {structureBlocked} from '../src/expansion.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {spawnRavenFlock,tickRaven,dropRavenLoot,RAVEN_WORLD_CAP} from '../src/raven.mjs';
import {drawRaven,drawRavenPose,ravenPose} from '../src/raven-art.mjs';

function field() {
  const g=new Game(()=>.42);
  Object.assign(g,{phase:'play',openingBoard:false,enemies:[],players:[],loot:[],scenery:[],house:null});
  g.terrain.fill('grass');g.persist=()=>{};g.onSound=()=>{};
  return g;
}
function player(g,x=500,y=500) {
  const p=g.addPlayer(g.players.length ? `pad:${g.players.length-1}` : 'keyboard','Raven tester');Object.assign(p,{x,y,hp:1000,maxHp:1000});return p;
}
function flock(g,options={}) {return spawnRavenFlock(g,{x:500,y:500,...options});}
function advance(g,seconds,dt=.05) {
  let left=seconds;
  while (left>1e-8) {
    const step=Math.min(dt,left);g.time+=step;
    for (const e of [...g.enemies]) tickRaven(g,e,step);
    left-=step;
  }
}
function airborne(e) {e.raven.phase='fly';e.raven.phaseTime=1;e.raven.height=24;}
function recordingCanvas() {
  const stack=[],marks=[];
  const c={fillStyle:'#000000',globalAlpha:1,imageSmoothingEnabled:true,tx:0,ty:0,sx:1,sy:1,
    save(){stack.push({fillStyle:this.fillStyle,globalAlpha:this.globalAlpha,imageSmoothingEnabled:this.imageSmoothingEnabled,tx:this.tx,ty:this.ty,sx:this.sx,sy:this.sy});},
    restore(){assert.ok(stack.length);Object.assign(this,stack.pop());},
    translate(x,y){this.tx+=x*this.sx;this.ty+=y*this.sy;},
    scale(x,y){this.sx*=x;this.sy*=y;},
    fillRect(x,y,w,h){
      assert.ok([x,y,w,h,this.tx,this.ty,this.sx,this.sy].every(Number.isFinite));
      assert.ok([x,y,w,h].every(Number.isInteger),'art uses integer pixel marks');
      marks.push({x:this.tx+x*this.sx,y:this.ty+y*this.sy,w:w*this.sx,h:h*this.sy,color:this.fillStyle,alpha:this.globalAlpha});
    }};
  return {c,marks,stack};
}

test('normal spawn is three distinct bounded raven actors with JSON-only metadata',()=>{
  const g=field(),before=g.nextId,birds=flock(g);
  assert.equal(birds.length,3);assert.equal(g.enemies.length,3);
  assert.equal(new Set(birds.map(e=>e.id)).size,3);
  assert.equal(new Set(birds.map(e=>e.raven.flock.id)).size,1);
  assert.ok(birds.every(e=>e.kind==='raven'&&e.hp>0&&e.id>=before&&e.x>=24&&e.x<=1576&&e.y>=24&&e.y<=1576));
  assert.deepEqual(JSON.parse(JSON.stringify(birds)),birds);
  assert.equal(flock(g,{count:100}).length,3);assert.equal(flock(g,{count:0}).length,0);
});

test('murder always requests six crows and all spawns respect the global cap and blocked geometry',()=>{
  const g=field(),m=flock(g,{murder:true,count:1});
  assert.equal(m.length,6);assert.ok(m.every(e=>e.kind==='crow'&&e.raven.flock.murder&&e.aggro));
  for (let i=0;i<30;i++) flock(g,{murder:true});
  assert.equal(g.enemies.length,RAVEN_WORLD_CAP);assert.deepEqual(flock(g),[]);
  const sealed=field();sealed.blocked=()=>true;
  assert.deepEqual(flock(sealed),[]);assert.equal(sealed.enemies.length,0);
  const edge=field();assert.ok(flock(edge,{x:-1e9,y:1e9}).every(e=>e.x>=24&&e.y<=1576));
});

test('perches recognize leafless trees, gravestones, mausoleums and safe ground fallback',()=>{
  for (const [kind,height] of [['leafless_tree',44],['gravestone',20],['mausoleum',48]]) {
    const g=field();g.scenery=[{id:70,kind,x:500,y:500,rootY:500,size:80}];
    const birds=flock(g);assert.equal(birds.length,3);
    for (const e of birds) {assert.equal(e.raven.perch.kind,kind);assert.equal(e.raven.height,height);assert.equal(e.raven.phase,'perch');}
  }
  const g=field();g.scenery=[{kind:'tree',x:500,y:500,size:80}];
  assert.ok(flock(g).every(e=>e.raven.perch.kind==='ground'&&e.raven.height===0));
  const explicit=field();explicit.ravenPerches=[{id:'roof',x:500,y:500,height:35}];
  assert.ok(flock(explicit).every(e=>e.raven.perch.key==='roof'&&e.raven.height===35));
});

test('graveyard perches use native foot anchors, stone caps and the actual mausoleum roof',()=>{
  for(const [kind,size,height] of [['leafless_tree',126,69.3],['gravestone',44,39],['mausoleum',136,122]]) {
    const g=field();g.scenery=[{id:80,kind,graveyard:true,x:500,y:500,size,height:120,variant:0}];
    const birds=flock(g);
    assert.ok(birds.every(e=>e.raven.perch.y===500));
    assert.ok(birds.every(e=>Math.abs(e.raven.height-height)<1e-8));
  }
});

test('idle perches stay still, relocate around sixty seconds, then land back at rest',()=>{
  const g=field(),e=flock(g,{count:1})[0],start={x:e.x,y:e.y};
  advance(g,59,.25);assert.equal(e.raven.phase,'perch');assert.deepEqual({x:e.x,y:e.y},start);
  advance(g,1,.25);assert.equal(e.raven.phase,'wing_open');
  const destination={...e.raven.perch};assert.ok(Math.hypot(destination.x-start.x,destination.y-start.y)>18);
  advance(g,10,.05);assert.equal(e.raven.phase,'perch');assert.equal(e.raven.height,0);
  assert.ok(Math.hypot(e.x-destination.x,e.y-destination.y)<=4);
});

test('a fallen branch releases a raven and does not leave a floating perch',()=>{
  const g=field(),tree={id:10,kind:'leafless_tree',x:500,y:500,size:80,rootY:500};g.scenery=[tree];
  const e=flock(g)[0];tree.fallen=true;tickRaven(g,e,.05);
  assert.equal(e.raven.phase,'wing_open');assert.equal(e.raven.perch.kind,'ground');
  advance(g,10);assert.equal(e.raven.phase,'perch');assert.equal(e.raven.height,0);
});

test('only one leader replenishes one/two idle survivors, at most once per sixty seconds',()=>{
  const g=field(),original=flock(g);original[1].hp=original[2].hp=0;
  const lead=original[0];tickRaven(g,lead,59.9);assert.equal(g.enemies.filter(e=>e.hp>0).length,1);
  tickRaven(g,lead,.1);assert.equal(g.enemies.filter(e=>e.hp>0).length,3);
  for (const e of g.enemies.filter(e=>e.hp>0)) tickRaven(g,e,0);
  assert.equal(g.enemies.filter(e=>e.hp>0).length,3);
  const survivors=g.enemies.filter(e=>e.hp>0);lead.hp=0;
  tickRaven(g,survivors[1],59);assert.equal(g.enemies.filter(e=>e.hp>0).length,2);
  tickRaven(g,survivors[1],1);assert.equal(g.enemies.filter(e=>e.hp>0).length,3);
});

test('zero survivors never auto-spawn and idle replenishment is blocked by aggro or world cap',()=>{
  const g=field(),birds=flock(g);birds.forEach(e=>e.hp=0);advance(g,180,1);
  assert.equal(g.enemies.length,3);
  const hot=field(),p=player(hot,540,500),h=flock(hot);h[1].hp=h[2].hp=0;
  advance(hot,61,.25);assert.equal(hot.enemies.filter(e=>e.hp>0).length,1);assert.ok(h[0].aggro);assert.ok(p.hp<1000);
  const full=field(),f=flock(full);f[1].hp=0;for(let i=0;i<16;i++)flock(full);
  advance(full,61,1);assert.equal(full.enemies.filter(e=>e.hp>0).length,RAVEN_WORLD_CAP);
});

test('JSON reload retains leader election and refill interval without shared references',()=>{
  const g=field(),birds=flock(g);birds[0].hp=0;
  advance(g,40,.25);g.enemies=JSON.parse(JSON.stringify(g.enemies));
  const live=g.enemies.filter(e=>e.hp>0);assert.notEqual(live[0].raven.flock,live[1].raven.flock);
  advance(g,19,.25);assert.equal(g.enemies.filter(e=>e.hp>0).length,2);
  advance(g,1,.25);assert.equal(g.enemies.filter(e=>e.hp>0).length,3);
});

test('nearby players provoke wing opening, takeoff, flight and a telegraphed peck',()=>{
  const g=field(),p=player(g,540,500),e=flock(g)[0],phases=new Set();
  for(let i=0;i<90;i++){advance(g,.05);phases.add(e.raven.phase);}
  for(const phase of ['wing_open','takeoff','fly','attack','recover'])assert.ok(phases.has(phase),phase);
  assert.ok(e.aggro);assert.equal(e.raven.targetId,p.id);assert.ok(p.hp<1000);
  const stop=field(),s=flock(stop,{count:1})[0],victim=player(stop,s.x+20,s.y);airborne(s);s.cooldown=0;
  tickRaven(stop,s,.05);assert.equal(s.raven.phase,'attack');assert.equal(victim.hp,1000);
  victim.y+=90;tickRaven(stop,s,.25);assert.equal(victim.hp,1000,'sidestep evades the attack');
});

test('players away beyond disengage range release pursuit and birds fly/land to a perch',()=>{
  const g=field(),p=player(g,550,500),e=flock(g)[0];advance(g,2);
  Object.assign(p,{x:1500,y:1500});tickRaven(g,e,.05);assert.equal(e.aggro,false);
  advance(g,15);assert.equal(e.raven.phase,'perch');assert.equal(e.raven.targetId,null);
});

test('dead/hidden/room players are ignored, allies defer to shared AI, freezes and pauses stop birds',()=>{
  const g=field(),p=player(g,510,500),e=flock(g)[0];
  for(const hide of [{room:'storage'},{hp:0},{quicksandUnder:true},{underBridge:true},{swimming:true,diveDepth:.4}]) {
    Object.assign(p,{hp:1000,room:null,quicksandUnder:false,underBridge:false,swimming:false,diveDepth:0},hide);
    tickRaven(g,e,.05);assert.equal(e.aggro,false);
  }
  e.faction='ally';assert.equal(tickRaven(g,e,.05),false);e.faction=null;
  e.frozen=1;const before=JSON.stringify(e.raven);tickRaven(g,e,.05);assert.equal(JSON.stringify(e.raven),before);
  e.frozen=0;g.paused=true;tickRaven(g,e,100);assert.equal(JSON.stringify(e.raven),before);
  assert.equal(tickRaven(g,{kind:'bat'},.05),false);e.hp=0;assert.equal(tickRaven(g,e,.05),true);
});

test('idle flight takes only visible rare-or-better loose loot, players have priority',()=>{
  const g=field(),e=flock(g)[0];airborne(e);
  const common={id:100,x:e.x+10,y:e.y,type:'sword',qty:1};
  const embedded={id:101,x:e.x+8,y:e.y,type:'moon_boomerang',qty:1,embedded:true};
  const rare={id:102,x:e.x+12,y:e.y,type:'moon_boomerang',qty:1,sockets:['moon_prism']};
  g.loot=[common,embedded,rare];tickRaven(g,e,.05);
  assert.deepEqual(e.raven.carrying,rare);assert.deepEqual(g.loot,[common,embedded]);
  const priority=field(),r=flock(priority)[0];airborne(r);priority.loot=[{...rare,x:r.x+2,y:r.y}];player(priority,r.x+40,r.y);
  tickRaven(priority,r,.05);assert.ok(r.aggro);assert.equal(r.raven.carrying,null);assert.equal(priority.loot.length,1);
});

test('a loot approach persists across frames and competing birds cannot duplicate the stack',()=>{
  const g=field(),birds=flock(g);birds.forEach(airborne);
  const first=birds[0],rare={id:1000,x:first.x+115,y:first.y,type:'sun_boomerang',qty:2,contents:[],custom:'preserve'};
  g.loot=[rare];advance(g,5);
  assert.equal(g.loot.length,0);assert.equal(birds.filter(e=>e.raven.carrying).length,1);
  assert.deepEqual(birds.find(e=>e.raven.carrying).raven.carrying,rare);
});

test('carried loot death recovery is exact-once and preserves stack/sockets/contents through JSON',()=>{
  const g=field(),e=flock(g)[0],l={id:500,type:'moon_boomerang',qty:4,x:12,y:18,sockets:['moon_prism'],contents:[{type:'fruit',qty:3}],custom:{rune:'blue'}};
  e.raven.carrying=l;assert.equal(dropRavenLoot(g,e),false);assert.equal(g.loot.length,0);
  e.hp=0;assert.equal(dropRavenLoot(g,e),true);assert.equal(dropRavenLoot(g,e),false);
  assert.equal(g.loot.length,1);assert.notEqual(g.loot[0].id,l.id);assert.deepEqual(g.loot[0].sockets,l.sockets);
  assert.deepEqual(g.loot[0].contents,l.contents);assert.deepEqual(g.loot[0].custom,l.custom);assert.equal(g.loot[0].qty,4);
  const restored=JSON.parse(JSON.stringify(e));assert.equal(dropRavenLoot(g,restored),false);
  assert.equal(restored.raven.carrying,null);assert.equal(restored.raven.lootDropped,true);
  const empty=flock(g)[0];empty.hp=0;assert.equal(dropRavenLoot(g,empty),false);assert.ok(empty.raven.lootDropped);
});

test('real session snapshot preserves flock, carrying item, phase, and once-only death recovery',()=>{
  const g=field();player(g,1400,1400);const birds=flock(g),e=birds[0];
  e.raven.carrying={id:800,type:'moon_boomerang',qty:1,sockets:['moon_prism'],x:400,y:400};
  airborne(e);e.raven.flock.refillIn=17;
  const saved=JSON.parse(JSON.stringify(saveSession(g))),restored=restoreSession(saved),r=restored.enemies.find(q=>q.id===e.id);
  assert.deepEqual(r.raven,e.raven);r.hp=0;assert.equal(dropRavenLoot(restored,r),true);assert.equal(dropRavenLoot(restored,r),false);
  const twice=restoreSession(JSON.parse(JSON.stringify(saveSession(restored))));
  assert.equal(dropRavenLoot(twice,twice.enemies.find(q=>q.id===r.id)),false);
});

test('murder hunts distant reachable players beyond thirty seconds',()=>{
  const g=field(),p=player(g,1450,1450),birds=flock(g,{murder:true});advance(g,35,.1);
  assert.ok(birds.every(e=>e.raven.flock.murder&&e.aggro&&e.raven.targetId===p.id));
  assert.ok(birds.every(e=>e.raven.flock.unreachableFor===0));
});

test('murder prioritizes a reachable party member over the closest player behind a wall',()=>{
  const g=field(),birds=flock(g,{x:390,y:500,murder:true}),e=birds[0];
  g.house={walls:[{x:440,y:24,w:12,h:1552,kind:'wall'}],doors:[],furniture:[],floors:[]};
  const hidden=player(g,475,500),reachable=player(g,390,1100);
  tickRaven(g,e,.05);assert.equal(e.raven.targetId,reachable.id);assert.notEqual(e.raven.targetId,hidden.id);
  assert.equal(e.raven.flock.unreachableFor,0);
});

test('murder requires thirty continuously unreachable seconds and reachability resets its clock',()=>{
  const g=field(),p=player(g,510,500),birds=flock(g,{murder:true}),leader=birds[0];p.room='storage';
  for(let i=0;i<20;i++)tickRaven(g,leader,1);
  assert.equal(leader.raven.flock.unreachableFor,20);assert.ok(leader.raven.flock.murder);
  p.room=null;tickRaven(g,leader,.05);assert.equal(leader.raven.flock.unreachableFor,0);
  p.room='storage';for(let i=0;i<29;i++)tickRaven(g,leader,1);assert.ok(leader.raven.flock.murder);
  tickRaven(g,leader,1);assert.ok(birds.every(e=>!e.raven.flock.murder&&!e.aggro&&e.kind==='crow'));
  assert.equal(birds.length,6,'conversion does not destroy the original six');
});

test('normal flight and attacks cannot cross or hit through a thin intact wall',()=>{
  const g=field(),birds=flock(g,{x:400,y:500}),e=birds[0];
  g.house={walls:[{x:450,y:24,w:3,h:1552,kind:'wall'}],doors:[],furniture:[],floors:[]};
  const p=player(g,470,500);airborne(e);advance(g,4,.1);
  assert.ok(birds.every(q=>q.x<450-6));assert.equal(p.hp,1000);
  assert.equal(structureBlocked(g,451,500,6,false,0,24),true);
});

test('birds use open doors and broken windows but cannot open doors or break glass',()=>{
  for(const type of ['door','window'])for(const open of [false,true]) {
    const g=field(),e=flock(g,{x:390,y:500,count:1})[0];
    const opening={x:440,y:465,w:12,h:70,...(type==='window'?{kind:'window',broken:open}:{open})};
    g.house={walls:[{x:440,y:24,w:12,h:441,kind:'wall'},{x:440,y:535,w:12,h:1041,kind:'wall'},...(type==='window'?[opening]:[])],doors:type==='door'?[opening]:[],furniture:[],floors:[]};
    const p=player(g,530,500);airborne(e);advance(g,4,.05);
    if(open) {assert.ok(e.x>452,`${type} passage`);assert.ok(p.hp<1000);}
    else {assert.ok(e.x<434);assert.equal(p.hp,1000);}
    assert.equal(type==='window'?opening.broken:opening.open,open);
  }
});

test('bounded navigation finds an offset doorway rather than bypassing the separating walls',()=>{
  const g=field(),e=flock(g,{x:390,y:500,count:1})[0],positions=[];
  g.house={walls:[{x:440,y:24,w:12,h:270,kind:'wall'},{x:440,y:366,w:12,h:1210,kind:'wall'}],doors:[{x:440,y:294,w:12,h:72,open:true}],furniture:[],floors:[]};
  player(g,550,500);airborne(e);e.raven.flock.disengageRange=900;
  for(let i=0;i<180;i++){advance(g,.05);positions.push({x:e.x,y:e.y});}
  assert.ok(e.x>452);assert.ok(positions.some(p=>p.x>=434&&p.x<=458&&p.y>=300&&p.y<=360));
  for(const p of positions)assert.equal(structureBlocked(g,p.x,p.y,6,false,0,24),false);
});

test('a sealed murder times out, an opened doorway resets actual geometry reachability',()=>{
  const g=field(),birds=flock(g,{x:390,y:500,murder:true}),leader=birds[0];
  const door={x:440,y:465,w:12,h:70,open:false};
  g.house={walls:[{x:440,y:24,w:12,h:441,kind:'wall'},{x:440,y:535,w:12,h:1041,kind:'wall'}],doors:[door],furniture:[],floors:[]};
  for(const [i,e] of birds.entries()) {e.x=390;e.y=480+i*8;}
  player(g,550,500);for(let i=0;i<20;i++)tickRaven(g,leader,1);
  assert.equal(leader.raven.flock.unreachableFor,20);door.open=true;tickRaven(g,leader,.05);
  assert.equal(leader.raven.flock.unreachableFor,0);door.open=false;
  for(let i=0;i<30;i++)tickRaven(g,leader,1);assert.ok(birds.every(e=>!e.raven.flock.murder));
});

test('rare loot behind a solid wall is neither targeted nor stolen',()=>{
  const g=field(),e=flock(g,{x:410,y:500})[0];airborne(e);
  g.house={walls:[{x:440,y:24,w:12,h:1552,kind:'wall'}],doors:[],furniture:[],floors:[]};
  g.loot=[{id:91,x:480,y:500,type:'moon_boomerang',qty:1}];advance(g,4,.1);
  assert.equal(e.raven.carrying,null);assert.equal(g.loot.length,1);
});

test('route misses are bounded and expire when a non-house blocker disappears',()=>{
  const g=field(),e=flock(g,{x:390,y:500,count:1})[0],p=player(g,530,500),base=g.blocked.bind(g);
  let sealed=true;
  g.blocked=(x,y,...rest)=>base(x,y,...rest) || sealed&&x>434&&x<458;
  airborne(e);advance(g,2,.05);assert.ok(e.x<434);assert.ok(e.raven.failedRoutes.length<=8);
  sealed=false;advance(g,3,.05);assert.ok(e.x>458);assert.ok(p.hp<1000);
});

test('native raven art uses black feather geometry, eight facings and all articulated phases',()=>{
  const g=field(),e=flock(g)[0],outputs=new Set();
  for(const phase of ['idle','perch','wing_open','takeoff','fly','flap','attack','landing','death']) {
    e.raven.phase=phase;e.raven.phaseTime=.18;e.hp=phase==='death'?0:36;
    for(let d=0;d<8;d++) {
      e.faceX=Math.sin(d*Math.PI/4);e.faceY=Math.cos(d*Math.PI/4);
      const {c,marks,stack}=recordingCanvas();assert.equal(drawRaven(c,e,1.2,48),true);
      assert.equal(stack.length,0);assert.equal(c.globalAlpha,1);assert.equal(c.imageSmoothingEnabled,true);
      assert.ok(marks.length>40);assert.ok(marks.length<5000,'bounded primitive work');
      assert.ok(marks.some(m=>m.color==='#080b10'));assert.ok(marks.some(m=>m.color==='#293947'));
      assert.ok(marks.every(m=>m.w>0&&m.h>0));outputs.add(JSON.stringify(marks));
    }
  }
  assert.ok(outputs.size>=50,'direction and motion change native pixel geometry');
  const {c,marks}=recordingCanvas();assert.equal(drawRaven(c,{kind:'bat'},0),false);assert.equal(marks.length,0);
});

test('folded/glossy wings articulate over time, crow beak differs, draw never mutates metadata',()=>{
  const g=field(),e=flock(g)[0];
  const pose=phase=>{e.raven.phase=phase;return ravenPose(e,1);};
  assert.equal(pose('perch').spread,0);e.raven.phaseTime=.22;assert.ok(pose('wing_open').spread>.7);
  pose('fly');assert.notEqual(ravenPose(e,.1).lift,ravenPose(e,.2).lift);
  const render=a=>{const {c,marks}=recordingCanvas();drawRavenPose(c,a,.1);return JSON.stringify(marks);};
  const before=JSON.stringify(e);assert.notEqual(render(e),render({...e,kind:'crow'}));assert.equal(JSON.stringify(e),before);
  const widths=[];
  for(const phase of ['perch','fly']) {
    e.raven.phase=phase;e.faceX=0;e.faceY=1;
    const {c,marks}=recordingCanvas();drawRavenPose(c,e,.15);
    widths.push(Math.max(...marks.map(m=>m.x+m.w))-Math.min(...marks.map(m=>m.x)));
  }
  assert.ok(widths[1]>widths[0]*2,'primaries visibly spread beyond the body');
});

test('befriended bird art follows shared locomotion despite stale hostile perch metadata',()=>{
  const g=field(),e=flock(g)[0];e.raven.height=60;e.raven.phase='perch';e.faction='ally';
  assert.equal(ravenPose(e).phase,'perch');e.moving=true;assert.equal(ravenPose(e).phase,'fly');
  e.attack=.2;assert.equal(ravenPose(e).phase,'attack');
  const before=JSON.stringify(e),{c}=recordingCanvas();drawRaven(c,e,.2);
  assert.equal(JSON.stringify(e),before);assert.equal(tickRaven(g,e,.05),false);
});
