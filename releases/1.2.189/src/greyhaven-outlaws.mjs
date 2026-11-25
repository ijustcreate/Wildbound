import {actionFeedback} from './action-feedback.mjs';
import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {drawBowAim} from './bow-aim.mjs';
import {rules} from './definitions.mjs';
import {arrowVisualAngle, drawFlyingArrow} from './embedded-arrow.mjs';
import {greyhavenCastLook} from './greyhaven-cast-art.mjs';
import {arrowFlightGravity} from './projectile-range.mjs';
import {rangedLaunchOrigin} from './ranged-launch.mjs';
import {updateAimFacing, updateBowAimBlend} from './ranged-aim.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {castleInteriorBlocked, castleStory, CASTLE_INTERIOR_ORIGIN, toCastleWorld} from './wild-castle.mjs';
import {drawGreyhavenOutlawProp} from './greyhaven-outlaw-art.mjs';

const robin = {id:'greyhaven-robin', name:'Robin Hood', title:'The Greyhaven road', story:0, x:17545, y:2315, faceX:-1, faceY:1};
const john = {id:'greyhaven-little-john', name:'Little John', title:'Willow crossing', story:0, x:17318, y:1870, faceX:1, faceY:0};
const marian = {id:'greyhaven-marian', name:'Maid Marian', title:'Banquet room', story:1, x:660, y:272, faceX:1, faceY:1};
export const greyhavenOutlawProfiles = Object.freeze([robin, john, marian].map(Object.freeze));

const rope = {x:17486, y:2246, z:21};
const hook = {x:17550, y:2224, z:24};
const signal = {x:17554, y:2390};
const cargo = {x:17680, y:2410};
const trainY = 2434;
const log = {left:17318, right:17519, y:1870, halfWidth:12, lift:8};
const fiddler = {x:712, y:274};
const escape = [
  {x:653, y:295}, {x:653, y:454}, {x:651, y:464}, {x:605, y:464},
];
const evacuees = [
  {name:'Bess', x:683, y:287, shirt:'#955d5a', hairColor:'#534048', hair:'bun', skin:'#b87962'},
  {name:'Owen', x:738, y:286, shirt:'#5d7277', hairColor:'#ad8456', hair:'short', skin:'#d49a72'},
  {name:'Alys', x:760, y:278, shirt:'#a88a59', hairColor:'#503337', hair:'long', skin:'#8f5c49'},
];
const outlaws = new WeakMap();
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const phase = g => g.trainTest?.design.activeRoom ?? null;
const surface = g => !phase(g);
const firstFloor = g => castleStory(phase(g)) === 1;
const current = g => outlaws.get(g.trainTest);
const player = (g, id) => id === null ? undefined : g.players.find(p => p.id === id);
const available = p => p?.hp > 0 && !p.room && !p.trainRide && !p.pirateRide && !p.vehicleId &&
  !p.broomMount && !p.wingHover && !p.spectator && !p.disconnected;
const local = p => ({x:p.x - CASTLE_INTERIOR_ORIGIN.x, y:p.y - CASTLE_INTERIOR_ORIGIN.y});
const pending = text => ({text, interact:false});
const beatWindow = 8;
const reel = Object.freeze({key:'greyhaven-banquet-reel',files:['assets/sfx/ambience/greyhaven-banquet-reel.wav'],bus:'ambience',
  gain:.4,group:'greyhaven-banquet',polyphony:1,cooldown:320,maxDuration:beatWindow,distance:225,priority:32});

function notice(g, p, text, kind='success') {
  const t = g.trainTest;
  if (surface(g)) Object.assign(t, {notice:text, noticeUntil:(t.time || 0) + 4.5});
  actionFeedback(g, p, {key:'greyhaven-outlaw', text, kind});
  if (p?.ui) p.ui.notice = text;
}

function complete(g, visitors, id, text) {
  for (const p of visitors.filter(Boolean)) {
    const done = (p.npcQuests ??= {}).greyhavenOutlaws ??= {};
    if (!done[id]) {
      done[id] = true;
      p.coins = (p.coins || 0) + 15;
    }
    notice(g, p, text);
  }
  g.onSound?.('win', visitors[0]);
  g.persist?.();
}

function activeParticipants(g, spot, radius) {
  return g.players.filter(p => available(p) && gap(p, spot) < radius);
}

function currentRefugee(set) {
  return set.refugees[set.index];
}

function human(appearance, id, x, y, extras={}) {
  return {id, x, y, hp:1, kind:'player', sprite:'explorer-teal', appearance:{...DEFAULT_APPEARANCE, ...appearance},
    faceX:0, faceY:1, ...extras};
}

function startMarian(p) {
  return {owner:p.id, index:0, music:0, musicOffset:0, escorts:new Set([p.id]),
    refugees:evacuees.map(({x,y,name,...style},i) => human(style, `greyhaven-refugee-${i}`, x, y, {name})),
  };
}

function startJohn(p) {
  return {fighters:[
    {id:p.id, x:17399, y:log.y, face:1, balance:3, recovery:0, guard:false},
    {id:null, x:17449, y:log.y, face:-1, balance:3, recovery:0, guard:false},
  ], ready:3.2, elapsed:0};
}

const encounterKey = id => id === robin.id ? 'archery' : id === john.id ? 'duel' : id === marian.id ? 'banquet' : null;

export function startGreyhavenOutlaw(g, p, id) {
  const t = g.trainTest, key = encounterKey(id);
  if (!t?.design.wildLands || !key || !available(p) || p.swimming) return false;
  const data = current(g) || {};
  if ((id === marian.id && !firstFloor(g)) || (id !== marian.id && !surface(g))) return false;
  if (data[key]) {
    notice(g, p, 'The challenge is already underway.', 'failure');
    return true;
  }
  if (id === robin.id) {
    data.archery = {owner:p.id, step:'rope', charge:0, aim:false, shots:[], participants:new Set([p.id])};
    Object.assign(p, {x:robin.x, y:robin.y, faceX:0, faceY:-1});
    notice(g, p, 'Aim at the rope. Hold attack to draw, then release.');
  } else if (id === john.id) {
    data.duel = startJohn(p);
    notice(g, p, 'A partner can join at the log. Move along it, block and strike.');
  } else {
    data.banquet = startMarian(p);
    notice(g, p, 'Ask the fiddler for a reel, then escort each guest through the lower door.');
  }
  outlaws.set(t, data);
  Object.assign(p, {ui:null, consumeInput:true, interactUsed:true, attack:0, charge:0});
  return true;
}

export function greyhavenOutlawStatus(g, p, id) {
  const active = current(g)?.[encounterKey(id)];
  if (active) return id === robin.id ? 'The range and the pay train are both waiting on us.'
    : id === john.id ? 'There’s still someone on that log. Want to watch from the bank?'
    : 'The fiddler can play another reel. I’ll keep the last guests in the room until you’re ready.';
  return p.npcQuests?.greyhavenOutlaws?.[id] ? (id === robin.id ? 'Word is the toll keeper is still counting empty sacks.'
    : id === john.id ? 'That water wakes you up better than a bucket outside the kitchen.'
    : 'All three made it past the south door. Bess says she can still hear the fiddle.') : null;
}

export function greyhavenDuelDeckAt(x, y) {
  return x >= log.left && x <= log.right && Math.abs(y - log.y) <= log.halfWidth ? log.lift : 0;
}

function robinPrompt(set, p, time) {
  if (set.owner === p.id && gap(p, robin) < 160) {
    if (set.step === 'rope') return pending('AIM NORTHWEST · SHOOT THE GATE ROPE');
    if (set.step === 'hook') return pending('AIM NORTH · SHOOT THE BRASS KEY');
  }
  if (set.step === 'key' && gap(p, hook) < 39) return 'TAKE THE FALLEN KEY';
  if (set.step === 'signal' && gap(p, signal) < 43) return 'LOWER THE LANTERN FOR THE PAY TRAIN';
  if (set.step !== 'arrival') return '';
  const age = time - set.arrival;
  if (gap(p, signal) < 43 && age >= 3.4 && age < 13) return 'KEEP WATCH FOR THE CREW';
  if (gap(p, cargo) < 43 && age >= 3.4 && age < 13) return (set.lookout || 0) > time ? 'UNLOCK THE PAY CHEST' : pending('THE LOOKOUT MUST SIGNAL AGAIN');
  if (gap(p, signal) < 60) return pending(age < 3.4 ? 'THE PAY TRAIN IS APPROACHING' : 'THE PAY TRAIN IS PULLING AWAY');
  return '';
}

function marianAction(set, p) {
  const at = local(p), guest = currentRefugee(set), musicDistance = gap(at,fiddler);
  const guestDistance = guest && set.guide === undefined ? gap(at,guest) : Infinity;
  if (guestDistance < 26 && (musicDistance >= 25 || guestDistance < musicDistance)) return 'guide';
  if (musicDistance < 25) return 'music';
  return '';
}

function marianPrompt(set, p) {
  const action = marianAction(set,p), guest = currentRefugee(set);
  if (action === 'guide') return `WAVE ${guest.name.toUpperCase()} OVER`;
  if (action === 'music') return set.music > .1 ? pending('THE REEL IS PLAYING') : 'ASK THE FIDDLER FOR A REEL';
  if (set.guide === p.id) return pending(`GUIDE ${guest.name.toUpperCase()} TO THE LOWER DOOR · ${set.index}/3 SAFE`);
  return '';
}

function johnPrompt(set, p) {
  const fighter = set.fighters.find(f => f.id === p.id);
  if (!fighter && set.ready > 0 && set.fighters[1].id === null && gap(p, john) < 42) return 'JOIN THE STAFF DUEL';
  if (!fighter || set.fall) return '';
  if (set.ready > 0) return pending(`HOLD STEADY · ${Math.ceil(set.ready)}`);
  return pending(`BALANCE ${fighter.balance}/3 · STRIKE OR BLOCK`);
}

export function greyhavenOutlawPrompt(g, p) {
  const data = current(g);
  if (!data || !available(p) || p.ui) return '';
  if (firstFloor(g) && data.banquet) return marianPrompt(data.banquet, p);
  if (!surface(g)) return '';
  return (data.duel && johnPrompt(data.duel, p)) || (data.archery && robinPrompt(data.archery,p,g.time || 0)) || '';
}

function interactRobin(g, set, p, time) {
  if (set.step === 'key' && gap(p, hook) < 39) {
    set.step = 'signal';
    set.participants.add(p.id);
    notice(g, p, 'Take the key to the signal lantern by the rails.');
    return true;
  }
  if (set.step === 'signal' && gap(p, signal) < 43) {
    Object.assign(set, {step:'arrival', arrival:time});
    set.participants.add(p.id);
    notice(g, p, 'The pay train is coming. One of you can keep watch at the lantern.');
    return true;
  }
  if (set.step !== 'arrival' || time - set.arrival < 3.4 || time - set.arrival >= 13) return false;
  if (gap(p, signal) < 43) {
    set.lookout = time + 5.3;
    set.participants.add(p.id);
    notice(g, p, 'All clear. Unlock the chest at the back of the wagon.');
    return true;
  }
  if (gap(p, cargo) >= 43 || (set.lookout || 0) <= time) return false;
  set.step = 'done';
  set.participants.add(p.id);
  complete(g, [...set.participants].map(id => player(g, id)), robin.id, 'Pay chest recovered. Robin is returning the toll money to the village.');
  return true;
}

function interactMarian(g, set, p) {
  const action = marianAction(set,p);
  if (action === 'music') {
    if (set.music > .1) return false;
    set.music = beatWindow;
    set.musicOffset = g.time || 0;
    set.escorts.add(p.id);
    notice(g, p, 'The reel has started. Move behind the dancers while the guards are watching them.');
    g.onSound?.(reel,toCastleWorld(fiddler));
    return true;
  }
  if (action !== 'guide') return false;
  set.guide = p.id;
  set.route = 0;
  set.escorts.add(p.id);
  notice(g, p, `${currentRefugee(set).name} will follow you to the lower door.`);
  return true;
}

export function interactGreyhavenOutlaw(g, p) {
  const data = current(g);
  if (!data || !available(p) || p.ui) return false;
  if (firstFloor(g) && data.banquet) return interactMarian(g, data.banquet, p);
  if (!surface(g)) return false;
  const duel = data.duel;
  if (duel?.ready > 0 && duel.fighters[1].id === null && duel.fighters[0].id !== p.id && gap(p, john) < 42) {
    duel.fighters[1].id = p.id;
    duel.ready = Math.max(1.2, duel.ready);
    notice(g, p, 'You’re on the log. Stay balanced, block and strike.');
    return true;
  }
  return !!data.archery && interactRobin(g, data.archery, p, g.time || 0);
}

export function hitGreyhavenArrow(g, a, previousX, previousY) {
  const set = current(g)?.archery;
  if (!set || !surface(g) || a.hostile || a.rock || a.ice || a.z <= 0) return false;
  const target = set.step === 'rope' ? rope : set.step === 'hook' ? hook : null;
  const owner = player(g, a.owner);
  if (!target || !owner || gap(owner, robin) > 190 || Math.abs(a.z - target.z) > 22) return false;
  const dx = a.x - previousX, dy = a.y - previousY;
  const along = clamp(((target.x - previousX) * dx + (target.y - previousY) * dy) / (dx * dx + dy * dy || 1),0,1);
  if (Math.hypot(previousX + dx * along - target.x, previousY + dy * along - target.y) > 15) return false;
  set.participants.add(a.owner);
  set.step = target === rope ? 'hook' : 'key';
  const after = {x:previousX + dx * along, y:previousY + dy * along};
  if (target === rope) set.pin = {...after, z:target.z, angle:arrowVisualAngle(a), shaftLength:21};
  if (target === hook) set.keyDropped = g.time || 0;
  notice(g, owner, target === rope ? 'Rope pinned. Knock the brass key off its hook.' : 'Key down. Pick it up below the hook.');
  g.onSound?.('hit', target);
  return true;
}

function movePracticeArrows(g, set, dt) {
  for (const a of set.shots) {
    const steps = Math.ceil(Math.hypot(a.vx,a.vy) * dt / 5) || 1;
    const step = dt / steps;
    for (let i = 0; i < steps && !a.remove; i++) {
      const x = a.x, y = a.y;
      a.x += a.vx * step;
      a.y += a.vy * step;
      a.z += a.vz * step - .5 * a.gravity * step * step;
      a.vz -= a.gravity * step;
      a.remove = hitGreyhavenArrow(g, a, x, y) || a.z <= 0 || gap(a,robin) > 260 ||
        g.projectileBlocked?.(a.x, a.y, 1, true, a);
    }
  }
  set.shots = set.shots.filter(a => !a.remove);
}

function loanedArcher(actor, set) {
  return greyhavenCastLook({...actor, charge:set.charge, bowAiming:set.aim,
    bowVisualAngle:set.shown?.bowVisualAngle, bowAimBlend:set.shown?.bowAimBlend},robin.id);
}

function firePracticeArrow(g, p, set) {
  const shot = loanedArcher(p, set);
  const power = Math.min(1, set.charge / 1.2);
  const speed = rules.bowSpeed + power * rules.bowBonusSpeed;
  const at = rangedLaunchOrigin(shot,g.time,'bow',{charge:set.charge});
  const target = set.step === 'rope' ? rope : hook;
  const dx = target.x - at.x, dy = target.y - at.y, distance = Math.hypot(dx,dy);
  const assisted = distance>0 && (p.faceX*dx+p.faceY*dy)/distance >= .975;
  const angle = assisted ? Math.atan2(dy,dx) : Math.atan2(p.faceY,p.faceX);
  set.shots.push({...at, owner:p.id, vx:Math.cos(angle) * speed, vy:Math.sin(angle) * speed,
    vz:20 + power * 70, gravity:arrowFlightGravity(speed,set.charge,at.z), shaftLength:21});
  g.onSound?.('bow', p);
}

function tickRobinPlayer(g, p, input, old, dt, set) {
  if (p.id !== set.owner || gap(p,robin) > 165 || p.swimming) return false;
  if (!['rope','hook'].includes(set.step)) return false;
  set.aim = !!(input.block || input.attack);
  if (input.aimX || input.aimY || set.aim) updateAimFacing(p,input);
  if (input.attack) set.charge = Math.min(1.2,set.charge + dt);
  else if (old.attack && set.charge > 0) firePracticeArrow(g,p,set);
  if (!input.attack) set.charge = 0;
  set.shown = loanedArcher(p,set);
  updateBowAimBlend(set.shown,input,dt);
  if (!set.aim && !old.attack) return false;
  Object.assign(p, {moving:false, walking:false, moveSpeed:0, charge:0, bowAiming:false});
  return true;
}

function strike(fighter, against) {
  if (Math.abs(fighter.x - against.x) > 42 || Math.abs(fighter.y - against.y) > 19) return;
  if (against.guard) {
    fighter.recovery = Math.max(fighter.recovery, .68);
    against.recovery = Math.min(against.recovery, .14);
    return;
  }
  against.balance--;
  against.x = clamp(against.x + fighter.face * 5,log.left+30,log.right-30);
  against.y += fighter.face * 7;
  against.hit = .34;
}

function readyAttack(fighter, delay) {
  if (fighter.recovery > 0 || fighter.windup || fighter.guard) return false;
  fighter.windup = delay;
  fighter.recovery = delay + .51;
  return true;
}

function finishDuel(g, data) {
  const {duel} = data, loser = duel.fall.loser;
  for (const [i,f] of duel.fighters.entries()) {
    const p = player(g,f.id);
    if (p) Object.assign(p, {x:17309, y:loser === i ? 1913 : 1843, trainDeck:false, underBridge:false,
      trainGround:0, trainVisualLift:0, swimming:false, moving:false, walking:false});
  }
  const winner = duel.fighters[1-loser];
  complete(g, duel.fighters.map(f => player(g,f.id)), john.id,
    winner.id === null ? 'Little John wins. The current brought you to the bank.' : 'A clean win. The current brought the loser to the bank.');
  delete data.duel;
}

function setDuelPlayer(p, fighter, afloat=false) {
  Object.assign(p, {x:fighter.x, y:fighter.y, moving:Math.abs(fighter.move || 0) > .1,
    moveSpeed:Math.abs(fighter.move || 0), walking:true, faceX:fighter.face, faceY:0,
    trainGround:afloat ? 0 : log.lift, trainVisualLift:afloat ? 0 : log.lift,
    swimming:afloat, trainDeck:!afloat, underBridge:false, jumpHeight:0, jumpVelocity:0,
    attack:0, charge:0, bowAiming:false, blocking:false, dashTime:0, dashRecovery:0});
  p.step = (p.step || 0) + (fighter.stride || 0) * .13;
}

function tickDuel(g, data, dt) {
  const {duel} = data;
  const first = player(g,duel.fighters[0].id), second = player(g,duel.fighters[1].id);
  if (!surface(g) || !available(first) || (duel.fighters[1].id !== null && !available(second))) {
    if (surface(g)) for (const p of [first,second].filter(available)) {
      Object.assign(p,{x:17309,y:p===first?1843:1913,trainDeck:false,trainGround:0,trainVisualLift:0,swimming:false});
    }
    delete data.duel;
    return;
  }
  if (duel.ready > 0) {
    duel.ready = Math.max(0,duel.ready-dt);
    return;
  }
  duel.elapsed += dt;
  const fighters = duel.fighters;
  if (duel.fall) {
    const fall = duel.fall, fell = fighters[fall.loser];
    fall.age += dt;
    fell.y += dt * 44;
    fell.x = Math.min(17470, fell.x + dt * 8);
    const floating = player(g,fell.id);
    if (floating) setDuelPlayer(floating,fell,true);
    if (fall.age >= 1.7) finishDuel(g,data);
    return;
  }
  const ai = fighters[1], challenger = fighters[0];
  if (ai.id === null) {
    ai.guard = duel.elapsed % 2.7 > 2.25 && !ai.windup;
    ai.move = Math.abs(ai.x - challenger.x) > 34 && !ai.windup && !ai.guard ? ai.face * 49 : 0;
    ai.x = clamp(ai.x + ai.move * dt,log.left+30,log.right-30);
    ai.stride = Math.abs(ai.move * dt);
    ai.y += clamp(log.y-ai.y,-8*dt,8*dt);
    if (Math.abs(ai.x - challenger.x) < 40 && duel.elapsed % 1.4 < .22) readyAttack(ai, .35);
  }
  for (const [i,f] of fighters.entries()) {
    const other = fighters[1-i];
    f.face = Math.sign(other.x - f.x) || f.face;
    f.recovery = Math.max(0,f.recovery - dt);
    f.hit = Math.max(0,(f.hit || 0) - dt);
    if (f.windup) {
      f.windup = Math.max(0,f.windup - dt);
      if (!f.windup) {
        f.swing = .23;
        const before = other.balance;
        strike(f,other);
        if (other.balance < before) g.onSound?.('hit',other);
      }
    }
    f.swing = Math.max(0,(f.swing || 0) - dt);
    if (f.balance > 0 && Math.abs(f.y - log.y) <= log.halfWidth + 2) continue;
    Object.assign(f, {x:clamp(f.x,17392,17471),y:log.y+19,move:0,windup:0});
    duel.fall = {loser:i, age:0};
    g.effects?.push({particle:'jump-splash', x:f.x, y:f.y, life:1, duration:1, seed:i});
    g.onSound?.('splash',f);
    break;
  }
}

function tickDuelPlayer(g, p, input, old, dt, duel) {
  const f = duel.fighters.find(actor => actor.id === p.id);
  if (!f) return false;
  if (duel.ready <= 0 && !duel.fall) {
    const other = duel.fighters.find(actor => actor !== f);
    f.guard = !!input.block && !f.windup;
    f.move = f.guard || f.windup ? 0 : (input.x || 0) * 65;
    const wanted = clamp(f.x + f.move * dt,log.left+30,log.right-30);
    const separated = f.x < other.x ? Math.min(other.x - 16,wanted) : Math.max(other.x + 16,wanted);
    f.stride = Math.abs(f.x - separated);
    f.x = clamp(separated,log.left+30,log.right-30);
    f.y += input.y ? input.y * dt * 15 : clamp(log.y - f.y,-9*dt,9*dt);
    if (input.attack && !old.attack) f.request = .16;
    if (f.request > 0) f.request = readyAttack(f,.19) ? 0 : Math.max(0,f.request-dt);
  }
  setDuelPlayer(p,f,duel.fighters[duel.fall?.loser] === f);
  return true;
}

function stepGuest(guest, dest, dt, speed) {
  const distance = gap(guest,dest);
  if (distance < .3) return true;
  const x = (dest.x - guest.x) / distance, y = (dest.y - guest.y) / distance;
  const step = Math.min(distance,dt*speed), next = {x:guest.x+x*step,y:guest.y+y*step};
  const world = toCastleWorld(next);
  if (castleInteriorBlocked(1,world.x,world.y,5)) return false;
  Object.assign(guest, {...next,faceX:x,faceY:y,moving:true,walking:true,
    moveSpeed:speed,movementGait:'walk',step:(guest.step || 0)+step*.13});
  return step === distance;
}

function resetGuest(set) {
  const guest = currentRefugee(set), {x,y} = evacuees[set.index];
  Object.assign(guest,{x,y,moving:false,faceX:0,faceY:1});
  delete set.guide;
  set.route = 0;
}

function tickMarian(g, data, dt) {
  if (!firstFloor(g)) { delete data.banquet; return; }
  const set = data.banquet, guest = currentRefugee(set);
  set.music = Math.max(0,set.music - dt);
  if (set.guide === undefined || !guest) return;
  const guide = player(g,set.guide);
  if (!available(guide)) { resetGuest(set); return; }
  const at = local(guide), dest = escape[set.route], separation = gap(at,guest);
  guest.moving = false;
  const attention = (guest.y >= 302 && guest.y < 328) || (guest.y > 434 && guest.y < 458);
  if ((attention && !set.music) || separation > 145) {
    notice(g, guide, attention && !set.music ? 'The music stopped. The guest slipped back to the banquet.' : 'The guest lost sight of you and went back to the banquet.','failure');
    resetGuest(set);
    return;
  }
  if (separation > 90 || gap(at,dest) > gap(guest,dest) + 16) return;
  if (!stepGuest(guest,dest,dt,set.music ? 97 : 72)) return;
  if (++set.route < escape.length) return;
  set.index++;
  delete set.guide;
  if (set.index < set.refugees.length) {
    notice(g, guide, `${guest.name} is safe. ${set.index} of 3 guests out.`);
    return;
  }
  complete(g,[...set.escorts].map(id => player(g,id)),marian.id,'All three guests escaped during the banquet.');
  delete data.banquet;
}

function tickRobin(g, data, dt) {
  const set = data.archery, time = g.time || 0, owner = player(g,set.owner);
  if (!surface(g) || ((!available(owner) || gap(owner,robin) > 360) && !activeParticipants(g,signal,310).length)) {
    delete data.archery;
    return;
  }
  movePracticeArrows(g,set,dt);
  if (set.step === 'arrival' && time - set.arrival >= 16) {
    set.step = 'signal';
    notice(g,owner,'The pay train left. Signal again to try the next one.');
  }
  if (set.step === 'done' && time - set.arrival >= 16) delete data.archery;
}

export function tickGreyhavenOutlaws(g, dt) {
  const data = current(g);
  if (!data) return;
  if (data.archery) tickRobin(g,data,dt);
  if (data.duel) tickDuel(g,data,dt);
  if (data.banquet) tickMarian(g,data,dt);
}

export function tickGreyhavenOutlawPlayer(g, p, input, old, dt) {
  if (!surface(g)) return false;
  const data = current(g);
  if (data?.duel && tickDuelPlayer(g,p,input,old,dt,data.duel)) return true;
  return !!data?.archery && tickRobinPlayer(g,p,input,old,dt,data.archery);
}

export function greyhavenOutlawActorHidden(g, id) {
  const set = current(g)?.archery;
  return id === robin.id && ['rope','hook'].includes(set?.step) || id === john.id && current(g)?.duel?.fighters[1].id === null;
}

function duelActor(actor, f) {
  const animationAction = f.windup || f.swing ? 'slash' : f.guard ? 'block' : undefined;
  const animationProgress = f.windup ? clamp(1 - f.windup / .36,0,.49) : .5 + .5 * (1 - (f.swing || 0) / .23);
  return {...actor, equipment:{}, greyhavenCostume:'john', animationAction, animationProgress,
    faceX:f.face, faceY:0, moving:Math.abs(f.move || 0) > .1,
    walking:true, movementGait:f.move ? 'walk' : 'idle',
    flash:f.hit || 0};
}

export function greyhavenOutlawActor(g, actor) {
  const data = current(g), duel = data?.duel;
  const f = surface(g) && duel?.fighters.find(fighter => fighter.id === actor.id);
  if (f && duel.fighters[duel.fall?.loser] !== f) return duelActor(actor,f);
  const set = data?.archery;
  if (set?.owner === actor.id && ['rope','hook'].includes(set.step) && gap(actor,robin) <= 165) return loanedArcher(actor,set);
  return actor;
}

function subject(spot, kind, details={}) {
  return {...spot, depth:spot.y, paint:c=>drawGreyhavenOutlawProp(c,kind,spot,details)};
}

function humanoidSubject(actor, animator, time, size=PLAYER_RENDER_SIZE) {
  return {...actor, depth:actor.y, paint:c=>{
    c.fillStyle='#1a181745';c.fillRect(Math.round(actor.x-9),Math.round(actor.y-1),18,3);
    animator?.draw(c,actor,time,size);
  }};
}

function surfaceSubjects(g, data, animator) {
  const time = g.time || 0, set = data.archery, duel = data.duel;
  const result = [subject({x:(log.left+log.right)/2,y:log.y-1},'log',{log}),
    subject(rope,'rope',{pin:set?.pin}),subject(hook,'hook',{step:set?.step,keyDropped:set?.keyDropped,time}),
    subject(signal,'signal',{down:['arrival','done'].includes(set?.step),lookout:(set?.lookout || 0)>time}),
    {...subject(robin,'archeryMark'),depth:robin.y-6},
    {...subject({x:17605,y:trainY},'rail'),depth:trainY-51}];
  if (set?.step === 'arrival' || set?.step === 'done') {
    const age = time - set.arrival, travel = age < 3.4 ? (3.4-age)*65 : -Math.max(0,age-13)*80;
    result.push(subject({x:17680+travel,y:trainY},'train',{time,travel,open:set.step==='done'}));
    if (age >= 3.4 && age < 13) result.push({...subject(cargo,'payChest',{open:set.step==='done'}),depth:trainY+1});
  }
  if (duel?.fighters[1].id === null) {
    const f = duel.fighters[1], inWater = duel.fall?.loser === 1;
    if (inWater) result.push(subject(f,'johnFloat',{time}));
    else result.push(humanoidSubject(duelActor(greyhavenCastLook(human({},john.id,f.x,f.y-log.lift),john.id),f),animator,time,47));
  }
  for (const p of g.players) {
    if (p.id !== set?.owner || gap(p,robin)>165 || !set.aim || !['rope','hook'].includes(set.step)) continue;
    result.push({x:p.x,y:p.y,depth:p.y-.1,paint:c=>drawBowAim(c,loanedArcher(p,set),1,time,g)});
  }
  for (const a of set?.shots || []) result.push({x:a.x,y:a.y,depth:a.y,paint:c=>{
    c.save();c.translate(a.x,a.y-a.z);c.rotate(arrowVisualAngle(a));drawFlyingArrow(c,a,time);c.restore();
  }});
  return result;
}

function banquetSubjects(g, set, animator) {
  const time = g.time || 0, result = [];
  const active = (set?.music || 0) > 0;
  const beat = (time - (set?.musicOffset || 0)) * Math.PI * 2.7;
  result.push(humanoidSubject(human({shirt:'#756087',hair:'curly',hairColor:'#59414a'},'greyhaven-fiddler',fiddler.x,fiddler.y-19,
    {animationAction:active?'interact':undefined,animationProgress:active?.5+.35*Math.sin(beat):0}),animator,time));
  if (set) result.push(subject(fiddler,'music',{active,time}));
  result.push(humanoidSubject(human({shirt:'#72414c',hair:'short',hairColor:'#75654d'},'greyhaven-banquet-guard',751,429,{faceX:-1,faceY:0}),animator,time));
  for (const [i,[x,y]] of [[670,316],[692,319],[757,461],[738,479]].entries()) {
    const sway = active ? Math.sin(beat + i * Math.PI * .67) : 0;
    result.push(humanoidSubject(human({shirt:['#69866e','#8e596a','#98774c','#6d718f'][i],hair:i%2?'long':'short'},
      `greyhaven-dancer-${i}`,x+sway*5,y+Math.cos(beat)*Math.abs(sway)*2,
      {faceX:i%2?-1:1,faceY:0,moving:active,walking:true,movementGait:active?'walk':'idle',step:active?time*9+i:0}),animator,time,40));
  }
  if (!set) return result;
  for (const guest of set.refugees.slice(set.index)) result.push(humanoidSubject(guest,animator,time,41));
  result.push(subject(escape.at(-1),'escape',{active:true}));
  return result;
}

export function greyhavenOutlawSubjects(g, story, animator) {
  if (!g.trainTest?.design.wildLands) return [];
  const data = current(g) || {};
  if (story === 1 && firstFloor(g)) return banquetSubjects(g,data.banquet,animator);
  if (story === 0 && surface(g)) return surfaceSubjects(g,data,animator);
  return [];
}
