import { clearShot, navigateEnemy } from './navigation.mjs';
import * as items from './items.mjs';
import { rules, creatures } from './definitions.mjs';
import { lightAt, emitNoise, loudestNoise } from './night-cycle.mjs';
import { creatureCue } from './sound-bank.mjs';
const {stat}=items;

/** Integration: dispatch before generic AI; tick hazards once per simulation frame.
 * Persist e.night and g.nightEnemies (plain JSON, already included by snapshot).
 * Uses night-cycle.mjs directly for light, noise emission and investigation.
 * Render each enemy with nightEnemyOpacity(g,e), then draw effects in world space.
 * Call hitNightEnemyVines for melee/projectile hits on the tether. Flower HP loss
 * also releases its captive automatically. Solo captives escape after 3 seconds.
 * onHunterObjective({enemyId,status,elapsed}) is optional; parent owns rewards.
 * Tick hazards before dead-enemy removal so a killed hunter completes its objective.
 */
const specs = [
  ['night_stalker','Footsteps without a shadow',1,85,80,16],
  ['carrion_pack','The hungry circle',4,48,72,10],
  ['burrower','Something below',2,80,64,18],
  ['mimic_vine','The path uncurls',2,65,0,12],
  ['carnivorous_flower','A hungry bloom',1,115,0,14],
  ['poison_pod','A bristling garden',3,45,0,7],
  ['hunter','The longest two minutes',1,210,68,24],
  ['elephant','Heavy footsteps',1,260,44,24],
  ['zebra','Stripes in motion',3,65,110,9],
  ['pelican','A low sweep',2,55,85,10],
];
const warnings = {
  night_stalker: ['The leaves lie still. The footsteps creep.\nSomething hungry will not sleep.', 'Listen for footsteps. Light reveals the stalker and drives it back; dodge its warned pounce.'],
  carrion_pack: ['A wounded trail, a hungry ring.\nStay close to those still breathing.', 'The pack follows wounded explorers. Guard anyone helping a downed friend.'],
  burrower: ['The earth grows restless underfoot.\nA hungry mouth comes through the root.', 'Follow the moving dirt trail. Step clear of the emergence ring, then strike while it is exposed.'],
  mimic_vine: ['A harmless fern beside the way\nHas other plans for you today.', 'The leafy tendril lashes nearby explorers. Cut its tether or strike its root.'],
  carnivorous_flower: ['A golden bloom, a waiting maw.\nThose reaching roots obey no law.', 'Strike the flower or its vines to rescue a friend. Captives can fight back and escape after three seconds.'],
  poison_pod: ['A purple garden starts to sway.\nFive squares is far enough to stay.', 'Watch the swelling pods. Poison barbs travel no farther than five tiles.'],
  hunter: ['A measured step, a rifle gleam.\nTwo minutes end the hunter\'s scheme.', 'Survive 120 seconds or defeat the hunter. Dodge his locked aim line and watch for traps.'],
};
export const NIGHT_EVENTS = specs.map(([kind,name,count,hp,speed,damage]) => ({
  kind,name,type:'enemy',count,hp,speed,damage,weight:['elephant','zebra','pelican'].includes(kind)?0:kind==='hunter'?1:3,
  ...(kind==='hunter'?{}:{environments:kind==='burrower'?['forest','temple','desert']:kind==='night_stalker'?['forest','temple','house']:['forest','temple']}),
  times:['night_stalker','carrion_pack','burrower','mimic_vine'].includes(kind)?['night','dusk']:['day','dusk','night','dawn'],
  ...(kind==='hunter'?{duration:120,objective:'survive-or-kill'}:{}),
  verse:warnings[kind]?.[0] || 'The wild wakes beneath the sky.\nStand aside and let it by.',
  tip:warnings[kind]?.[1] || 'Stand clear of the stampede. Animals retaliate only if provoked.',
}));
const kinds = new Set(specs.map(s=>s[0]));
// Read live editor settings on every tick; absent flags preserve default behavior.
const enabled = (e,key)=>(e.behaviors?.[key]??creatures[e.kind]?.behaviors?.[key])!==false;
const distance = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const active = (g,dt)=>Number.isFinite(dt)&&dt>0&&!g.paused&&(g.phase==null||['play','won'].includes(g.phase));
const sameRoom = (a,b)=>(a.room||null)===(b.room||null);
const visible = (g,a,b)=>!!b&&sameRoom(a,b)&&clearShot(g,a,b,3);
const valid = (e,p)=>p&&p.hp>0&&!p.room&&sameRoom(e,p);
const state = g=>g.nightEnemies??={shots:[],traps:[],objectives:[]};
function brain(e) { return e.night??={phase:'idle',timer:0,cooldown:0,trail:[],trailTimer:0,lastHp:e.hp}; }
function face(e,p) { const d=distance(e,p)||1;e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d; }
function move(g,e,p,dt,speed=e.speed||60) {
  if(!enabled(e,'hunt'))return;
  face(e,p);
  if(visible(g,e,p)) {
    const step=Math.min(distance(e,p),speed*dt);g.moveActor(e,e.faceX*step,e.faceY*step);
  } else { const old=e.speed;e.speed=speed;navigateEnemy(g,e,p,dt);e.speed=old; }
}
function damage(g,p,source,amount) {
  if(!valid(source,p)||p.invuln>0||!visible(g,source,p)||g.shieldBlocks?.(p,source))return false;
  const hp=p.hp;g.hurt(p,amount,source);return p.hp<hp;
}
function release(e) { const n=brain(e);delete n.captiveId;n.phase='recover';n.timer=1.2;n.cooldown=2; }
function equipHunter(e) {
  if(brain(e).equipped)return;
  e.equipment={...(items.SAFARI_HUNTER_GEAR||items.SAFARI_HUNTER_SET),...e.equipment,hand1:'rifle',hand2:'occupied'};
  brain(e).equipped=true;
}
function retreat(g,e,p,dt) {
  let best=null,score=Infinity;
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,q={x:e.x+Math.cos(a)*96,y:e.y+Math.sin(a)*96};
    if(g.blocked(q.x,q.y,8)||!visible(g,e,q))continue;
    const value=lightAt(g,q)*300-(p?distance(q,p)*.2:0);
    if(value<score){score=value;best=q;}
  }
  if(best)move(g,e,best,dt,95);
}
function trail(e,dt) {
  const n=brain(e);n.trail=n.trail.filter(t=>(t.life-=dt)>0);n.trailTimer-=dt;
  if(n.trailTimer<=0){n.trail.push({x:e.x,y:e.y,life:1.3});n.trailTimer=.16;}
}
function windup(e,p,seconds,phase='windup') {
  const n=brain(e);face(e,p);n.phase=phase;n.timer=seconds;n.aim={x:p.x,y:p.y,room:p.room||null};n.targetId=p.id;
  e.state='windup';e.attack=seconds;
}
function melee(g,e,p,dt,{range=42,warning=.6,recovery=1,speed=e.speed||60}={}) {
  const n=brain(e);
  if(!enabled(e,'melee')){n.phase='idle';if(valid(e,p)&&distance(e,p)>range)move(g,e,p,dt,speed);return;}
  if(n.phase==='windup') {
    if(n.timer<=0){if(valid(e,p)&&p.id===n.targetId&&distance(e,p)<=range&&visible(g,e,p))damage(g,p,e,e.damage||10);n.phase='recover';n.timer=recovery;}
    return;
  }
  if(n.phase==='recover'){if(n.timer<=0)n.phase='idle';return;}
  if(!valid(e,p))return;
  if(distance(e,p)<=range&&visible(g,e,p))windup(e,p,warning);
  else move(g,e,p,dt,speed);
}
function shoot(g,e,p,kind,speed,range) {
  if(!visible(g,e,p))return;
  const d=distance(e,p)||1;
  state(g).shots.push({kind,x:e.x,y:e.y,vx:(p.x-e.x)/d*speed,vy:(p.y-e.y)/d*speed,
    room:e.room||null,ownerId:e.id,damage:e.damage||7,remaining:range,life:range/speed});
  emitNoise(g,e,kind,kind==='rifle'?650:120);
  if(kind==='rifle')g.onSound?.('rifle',e);
  brain(e).fire=.2;
}
function completeHunter(g,e,status) {
  const n=brain(e);if(n.objective.status!=='active')return;
  n.objective.status=status;
  const result={enemyId:e.id,status,elapsed:n.objective.elapsed};state(g).objectives.push(result);
  state(g).shots=state(g).shots.filter(s=>s.ownerId!==e.id);
  state(g).traps=state(g).traps.filter(t=>t.ownerId!==e.id);
  if(status==='survived')e.escaped=true;
  g.onHunterObjective?.({...result});
}
function hunter(g,e,p,dt) {
  equipHunter(e);
  const n=brain(e);n.objective??={elapsed:0,status:'active'};
  if(n.objective.status!=='active')return;
  if(e.hp<=0){completeHunter(g,e,'killed');return;}
  n.trapTimer=(n.trapTimer??4)-dt;
  if(n.trapTimer<=0){
    if(!g.projectileBlocked(e.x,e.y,8))state(g).traps.push({x:e.x,y:e.y,room:e.room||null,ownerId:e.id,life:18,arm:1,damage:8});
    n.trapTimer=7;
  }
  if(n.phase==='aim'){
    // Same ballistics as the player's rifle; the longer locked aim is the dodge window.
    if(n.timer<=0){if(valid(e,p))shoot(g,e,n.aim,'rifle',items.ITEMS.rifle.shot.speed,items.ITEMS.rifle.shot.range);n.phase=n.fire>0?'fire':'recover';n.timer=items.ITEMS.rifle.shot.cooldown;}
    return;
  }
  if(n.phase==='fire'){if(n.fire>0)return;n.phase='recover';}
  if(n.phase==='recover'){if(n.timer<=0)n.phase='idle';}
  if(!valid(e,p))return;
  if(distance(e,p)<180&&enabled(e,'hunt')){face(e,p);g.moveActor(e,-e.faceX*(e.speed||68)*dt,-e.faceY*(e.speed||68)*dt);}
  else if(distance(e,p)>400||!visible(g,e,p))move(g,e,p,dt);
  if(n.phase==='idle'&&distance(e,p)<=items.ITEMS.rifle.shot.range&&visible(g,e,p))windup(e,p,1.15,'aim');
}

function stepNightEnemy(g,e,target,dt) {
  if(!kinds.has(e.kind))return false;
  if(!active(g,dt))return true;
  if(e.state==='stampede'&&!e.aggro)return true; // Hazard system owns peaceful runners.
  const n=brain(e);e.moving=false;
  if(e.state==='snared') {e.timer-=dt;if(e.timer<=0)e.hp=0;if(e.hp<=0&&e.kind==='hunter'){n.objective??={elapsed:0,status:'active'};completeHunter(g,e,'killed');}return true;}
  const trap=(g.traps||[]).find(t=>t.life>0&&sameRoom(e,t)&&distance(e,t)<30&&visible(g,e,t));
  if(trap&&e.hp>0){
    if(trap.variant==='slow'){e.rooted=Math.max(e.rooted||0,.5);g.moveActor(e,(trap.x-e.x)*dt*.1,(trap.y-e.y)*dt*.1);return true;}
    trap.life=0;
    if(n.captiveId!=null)release(e);
    if(trap.variant==='interrupt'){n.phase='recover';n.timer=1.8;n.cooldown=1.8;n.interrupted=1.8;e.state='recover';}
    else {e.state='snared';e.timer=rules.captureTime*(trap.capture||1);}
    return true;
  }
  n.timer-=dt;n.cooldown=Math.max(0,n.cooldown-dt);
  n.fire=Math.max(0,(n.fire||0)-dt);
  if(e.hp>0&&(e.frozen>0||e.stun>0))return true;
  if(n.interrupted>0){n.interrupted=Math.max(0,n.interrupted-dt);if(n.interrupted===0)n.phase='idle';return true;}
  if(e.kind==='hunter') {hunter(g,e,target,dt);return true;}
  if(e.hp<=0){if(n.captiveId!=null)release(e);return true;}
  let p=valid(e,target)?target:null;
  if(e.kind==='carrion_pack') {
    p=(g.players||[]).filter(q=>!q.room&&sameRoom(e,q)).sort((a,b)=>
      (a.hp/Math.max(1,a.maxHp||100))-(b.hp/Math.max(1,b.maxHp||100))||distance(e,a)-distance(e,b))[0];
    n.targetId=p?.id;
    if(p?.hp<=0){
      n.preyId=p.id;
      const rescuer=(g.players||[]).filter(q=>valid(e,q)&&distance(q,p)<140&&visible(g,e,q)).sort((a,b)=>distance(e,a)-distance(e,b))[0];
      if(rescuer){p=rescuer;n.targetId=p.id;}
      else {if(distance(e,p)>48)move(g,e,p,dt);return true;}
    }
    melee(g,e,p,dt);return true;
  }
  if(e.kind==='carnivorous_flower'||e.kind==='mimic_vine') {
    if(!enabled(e,'melee')){if(n.captiveId!=null||n.phase==='grab')release(e);n.lastHp=e.hp;return true;}
    if(n.phase==='recover'&&n.cooldown<=0)n.phase='idle';
    if(n.captiveId!=null){
      const captive=(g.players||[]).find(q=>q.id===n.captiveId);
      if(e.hp<n.lastHp||!valid(e,captive)||!visible(g,e,captive)||captive.invuln>0||n.timer<=0){release(e);}
      else {
        face(e,captive);const pull=Math.min(Math.max(0,distance(e,captive)-24),42*dt);
        g.moveActor(captive,-e.faceX*pull,-e.faceY*pull);
        if(distance(e,captive)<=28&&n.timer<2.2){damage(g,captive,e,e.damage||14);release(e);}
      }
    } else if(n.phase==='grab') {
      if(n.timer<=0){
        if(valid(e,p)&&p.id===n.targetId&&distance(e,p)<=115&&visible(g,e,p)&&!(p.invuln>0)&&!g.shieldBlocks?.(p,e)){
          n.captiveId=p.id;n.phase='holding';n.timer=3;
        }else release(e);
      }
    }else if(n.cooldown<=0&&p&&distance(e,p)<=105&&visible(g,e,p))windup(e,p,.8,'grab');
    n.lastHp=e.hp;return true;
  }
  if(e.kind==='poison_pod') {
    if(n.phase==='barbs'){
      if(n.timer<=0){if(p&&distance(e,p)<=160)shoot(g,e,n.aim,'barb',180,160);n.phase='idle';n.cooldown=2.4;}
    }else if(p&&n.cooldown<=0&&distance(e,p)<=160&&visible(g,e,p))windup(e,p,.75,'barbs');
    return true;
  }
  if(e.kind==='burrower') {
    trail(e,dt);
    if(n.phase==='idle'){n.phase='burrow';n.timer=1.5;}
    if(n.phase==='burrow'){
      // The timer is a minimum underground duration, never a movement deadline.
      if(p)move(g,e,p,dt);
      if(enabled(e,'melee')&&n.timer<=0&&p&&distance(e,p)<80&&visible(g,e,p))windup(e,p,.85,'emerge');
    }else if(n.phase==='emerge'&&n.timer<=0){
      if(enabled(e,'melee')&&p&&distance(e,p)<48)damage(g,p,e,e.damage||18);
      n.phase='exposed';n.timer=1;
    }else if(n.phase==='exposed'&&n.timer<=0){n.phase='burrow';n.timer=1.5;}
    e.state=n.phase;return true;
  }
  if(e.kind==='night_stalker') {
    if(!enabled(e,'melee')&&['windup','pounce'].includes(n.phase)){n.phase='recover';n.timer=1.5;}
    trail(e,dt);
    n.soundTimer=(n.soundTimer||0)-dt;
    if(n.soundTimer<=0){
      const cue=n.phase==='windup'?creatureCue('lion','attack'):e.moving?'grass':{...creatureCue('panther','spawn'),gain:.08,maxDuration:.5};
      g.onSound?.(cue,e);n.soundTimer=n.phase==='windup'?1:1.7;
    }
    const noise=loudestNoise(g,e,5);
    if(noise){n.investigate={x:noise.x,y:noise.y,room:noise.room||null};n.memory=3;}
    n.memory=Math.max(0,(n.memory||0)-dt);
    if(n.phase==='pounce'){
      move(g,e,n.aim,dt,260);
      if(p&&distance(e,p)<34&&damage(g,p,e,e.damage||16)){n.phase='recover';n.timer=1.5;}
      else if(n.timer<=0){n.phase='recover';n.timer=1.5;}
    }else if(n.phase==='windup'){
      if(n.timer<=0){n.phase='pounce';n.timer=.38;}
    }else if(n.phase==='recover'){retreat(g,e,p,dt);if(n.timer<=0)n.phase='idle';}
    else if(lightAt(g,e)>.4){n.phase='recover';n.timer=.8;retreat(g,e,p,dt);}
    else if(enabled(e,'melee')&&p&&distance(e,p)<100&&visible(g,e,p)){windup(e,p,.7);g.onSound?.(creatureCue('lion','attack'),e);}
    else if(n.memory>0&&n.investigate)move(g,e,n.investigate,dt);
    else if(p&&distance(e,p)<220&&visible(g,e,p))move(g,e,p,dt,35);
    e.opacity=nightEnemyOpacity(g,e);return true;
  }
  // Wildlife stays passive until provoked; zebra flees and pelican swoops.
  if(!e.aggro&&e.hp>=n.lastHp){n.lastHp=e.hp;return true;}
  e.aggro=true;n.lastHp=e.hp;
  if(e.kind==='zebra'&&p&&enabled(e,'hunt')){face(e,p);g.moveActor(e,-e.faceX*(e.speed||110)*dt,-e.faceY*(e.speed||110)*dt);}
  else melee(g,e,p,dt,{range:e.kind==='elephant'?60:38,warning:e.kind==='elephant'?.9:.6});
  return true;
}

// Match night-rigs.mjs's state selector without overriding death/hit clips.
export function tickNightEnemy(g,e,target,dt) {
  const handled=stepNightEnemy(g,e,target,dt);
  if(!handled||!active(g,dt)||e.state==='snared'||(e.state==='stampede'&&!e.aggro)||e.hp<=0||!e.night)return handled;
  const n=e.night;
  if(e.kind==='night_stalker'&&e.moving){n.footTimer=(n.footTimer||0)-dt;if(n.footTimer<=0){g.onSound?.(g.house?'wood':'grass',e);n.footTimer=.42;}}
  e.underground=e.kind==='burrower'&&n.phase==='burrow';
  e.state=n.fire>0?'fire':({aim:'windup',grab:'windup',barbs:'windup',emerge:'windup',
    holding:'swallow',pounce:'charge',burrow:'underground',exposed:'bite',
    windup:'windup',recover:'recover'})[n.phase]||(e.moving?'hunt':'idle');
  e.motionDuration=n.phase==='aim'?1.15:n.phase==='emerge'?.85:n.phase==='grab'?.8:.7;
  // Core decrements attack/flash/cooldown before dispatch; the AI owns only night timers.
  e.timer=n.timer;
  return handled;
}

/** Swept, four-pixel projectile steps check both walls and actors (no tunnelling). */
export function tickNightEnemyHazards(g,dt) {
  if(!active(g,dt))return;
  const s=state(g);
  for(const e of g.enemies||[]) {
    if(e.kind==='hunter'){
      const n=brain(e);n.objective??={elapsed:0,status:'active'};
      if(e.hp<=0)completeHunter(g,e,'killed');
      else if(n.objective.status==='active'&&(g.players||[]).some(p=>p.hp>0&&!p.room)){
        n.objective.elapsed=Math.min(120,n.objective.elapsed+dt);
        if(n.objective.elapsed>=120)completeHunter(g,e,'survived');
      }
    }
    if(e.night?.captiveId!=null&&e.hp<=0)release(e);
  }
  for(const b of s.shots){
    const speed=Math.hypot(b.vx,b.vy),travel=Math.min(b.remaining,speed*Math.min(dt,b.life));
    const steps=Math.max(1,Math.ceil(travel/4));
    for(let i=0;i<steps&&b.life>0;i++){
      const x=b.x+b.vx/(speed||1)*travel/steps,y=b.y+b.vy/(speed||1)*travel/steps;
      if(g.projectileBlocked(x,y,3)){b.life=0;break;}
      b.x=x;b.y=y;b.remaining-=travel/steps;
      for(const p of g.players||[])if(valid(b,p)&&distance(b,p)<14&&visible(g,b,p)){
        if(damage(g,p,b,b.damage)&&b.kind==='barb'){
          const resist=Math.max(0,1-stat(p,'poisonResist'));
          p.poison=Math.max(p.poison||0,4*resist);p.poisonDamage=2;p.poisonTick=1;
        }
        b.life=0;break;
      }
    }
    b.life-=dt;
  }
  s.shots=s.shots.filter(b=>b.life>0&&b.remaining>1e-8);
  for(const t of s.traps){
    t.life-=dt;t.arm-=dt;if(t.life<=0||t.arm>0)continue;
    for(const p of g.players||[])if(valid(t,p)&&distance(t,p)<20&&visible(g,t,p)){
      if(damage(g,p,t,t.damage)){p.stun=Math.max(p.stun||0,.8);t.life=0;break;}
    }
  }
  s.traps=s.traps.filter(t=>t.life>0);
}
export const tickHunterProjectilesAndTraps = tickNightEnemyHazards;
export const tickNightEnemies = tickNightEnemyHazards;
export function startNightEvent(g,event,group=[]) {
  if(!kinds.has(event.kind))return false;
  state(g);
  for(const e of group){const n=brain(e);if(e.kind==='hunter'){equipHunter(e);n.objective??={elapsed:0,status:'active'};}}
  return true;
}

export function hitNightEnemyVines(g,attacker,damageAmount,reach=60) {
  if(!(damageAmount>0)||attacker.hp<=0||attacker.room||g.paused)return 0;
  let rescued=0;
  for(const e of g.enemies||[]){
    if(e.night?.captiveId==null||!sameRoom(e,attacker))continue;
    const p=(g.players||[]).find(q=>q.id===e.night.captiveId);if(!p)continue;
    const dx=p.x-e.x,dy=p.y-e.y,l=dx*dx+dy*dy;
    const t=l?Math.max(0,Math.min(1,((attacker.x-e.x)*dx+(attacker.y-e.y)*dy)/l)):0;
    const point={x:e.x+dx*t,y:e.y+dy*t,room:e.room};
    if(distance(attacker,point)<=reach&&visible(g,attacker,point)&&visible(g,e,p)) {release(e);rescued++;}
  }
  return rescued;
}
export function nightEnemyOpacity(g,e) {
  if(e.kind==='mimic_vine'&&e.hp>0&&!(e.flash>0)&&!(e.hit>0)&&(!e.night||e.night.phase==='idle'))return .15;
  if(e.kind==='burrower'&&e.night?.phase==='burrow')return .12;
  if(e.kind!=='night_stalker')return 1;
  const light=lightAt(g,e);
  return ['windup','pounce','recover'].includes(e.night?.phase)||e.flash>0?1:light<.35?.09:.8;
}
export function drawNightEnemyEffects(ctx,g) {
  ctx.save();
  for(const e of g.enemies||[]){
    if(e.hp<=0||e.room)continue;const n=e.night;if(!n)continue;
    for(const t of n.trail||[]){ctx.fillStyle=`rgba(195,177,133,${Math.max(0,t.life/2)})`;ctx.fillRect(t.x-2,t.y-2,4,3);}
    if(['windup','emerge','grab','barbs','aim'].includes(n.phase)){
      ctx.strokeStyle=n.phase==='aim'?'#ff6156':'#efcf78';ctx.lineWidth=2;ctx.beginPath();
      if(n.phase==='aim'&&n.aim){ctx.moveTo(e.x,e.y);ctx.lineTo(n.aim.x,n.aim.y);}
      else ctx.arc(e.x,e.y,n.phase==='emerge'?48:24,0,Math.PI*2);
      ctx.stroke();
    }
    const p=(g.players||[]).find(q=>q.id===n.captiveId);
    if(p&&visible(g,e,p)){ctx.strokeStyle='#91b64a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(p.x,p.y);ctx.stroke();}
  }
  for(const t of g.nightEnemies?.traps||[]){if(t.room)continue;ctx.strokeStyle=t.arm>0?'#eac87b':'#cf765c';ctx.strokeRect(t.x-9,t.y-9,18,18);}
  for(const b of g.nightEnemies?.shots||[]){if(b.room)continue;ctx.fillStyle=b.kind==='barb'?'#a9e55e':'#ffe6a1';ctx.fillRect(b.x-2,b.y-2,4,4);}
  ctx.restore();
}
