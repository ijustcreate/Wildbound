import {ITEMS, stat} from './items.mjs';
import {creatures} from './definitions.mjs';
import {clearShot} from './navigation.mjs';
import {wandTipWorld} from './player-motion.mjs';
import {chargedProjectileRange} from './projectile-range.mjs';
import {emitNoise} from './night-cycle.mjs';
import {isCharmed} from './succubus-charm.mjs';
import {finishMagicBolt} from './magic-bolt-effects.mjs';
import {magicBoltGlow} from './magic-bolt-render.mjs';

export const HEALING_COLOR = '#9cddff';
export const HEALING_HOT_AMOUNT = 4;
export const HEALING_HOT_TICKS = 3;
export const HEALING_STACK_LIMIT = 3;
// During the ordinary adventure step, healing bolts are kept out of its damage
// loop. Outside that step they live in the existing saved/rendered spells array.
const pending = new WeakMap();
const playerOwner = (g, source) => (g.players || []).find(p => p === source || p.id === source?.owner);
const actors = g => [...new Set([
  ...(g.players || []), ...(g.enemies || []), ...(g.ghosts || []),
  ...(g.players || []).flatMap(p => [p.hunterPet, p.ritualPet]).filter(Boolean),
])];
const companionOwner = (g, target) => target.allyOwner ?? target.owner ??
  (g.players || []).find(p => p.hunterPet === target || p.ritualPet === target)?.id;

export const spellHealingPoint = target => target.room ?
  {x:target.roomX, y:target.roomY} : {x:target.x, y:target.y};

export function canSpellHeal(g, source, target) {
  const owner = playerOwner(g, source);
  if (!owner || owner.hp <= 0 || isCharmed(owner) || source?.charmShot ||
      !target || !Number.isFinite(target.hp) || !(target.hp > 0) || !Number.isFinite(target.maxHp) || target.maxHp<=0 ||
      target.defeated || target.state === 'death' || isCharmed(target)) return false;
  if ((owner.room || null) !== (target.room || null)) return false;
  // Projectiles/stacks retain their casting room; moving together through a
  // portal cannot transfer an outside projectile or HoT into another space.
  if (source !== owner && Object.hasOwn(source, 'room') &&
      (source.room || null) !== (target.room || null)) return false;
  if (target.room && ![target.roomX,target.roomY].every(Number.isFinite)) return false;
  if ((g.players || []).includes(target)) return target === owner || !g.pvp;
  if (target.wildTiger || target.practiceTarget) return false;
  const petOwner = companionOwner(g, target);
  const friendly = (target.faction ?? creatures[target.kind]?.faction) === 'ally' ||
    (target.faction == null && petOwner != null &&
      ((g.ghosts || []).includes(target) || target.hunterPet || target.ritualPet));
  const present=(g.enemies || []).includes(target) || (g.ghosts || []).includes(target) ||
    (g.players || []).some(p => p.hunterPet===target || p.ritualPet===target);
  return present && friendly && (!g.pvp || petOwner == null || petOwner === owner.id);
}

export function spellHealingTargets(g, source) {
  const owner = playerOwner(g, source);
  return actors(g).filter(a => a !== owner && canSpellHeal(g, source, a));
}

export function applySpellHealing(g, source, target, amount) {
  if (!canSpellHeal(g, source, target) || !Number.isFinite(amount) || amount <= 0) return 0;
  const before = target.hp;
  if (before>=target.maxHp) return 0;
  const requested = amount * (1 + Math.max(0, stat(target, 'incomingSpellHealing')));
  // Hundredths keep halo fractions and floating numbers consistent with HP.
  target.hp = Math.min(target.maxHp, Math.round((before + requested) * 100) / 100);
  const effective = Math.round((target.hp - before) * 100) / 100;
  if (effective <= 0) return 0;
  const point=spellHealingPoint(target), room=target.room || null;
  const height = (room?26:38) + (target.jumpHeight || 0) + (target.groundHeight || 0);
  g.effects ||= [];
  g.effects.push({x:point.x, y:point.y-height, room, text:'+'+effective,
    color:'#75ef93', life:1, spellHealing:true, amount:effective, target:target.id});
  g.effects.push({magicBolt:true, healingRise:true, x:point.x, y:point.y-height+14, room,
    color:HEALING_COLOR, life:.85, duration:.85, target:target.id});
  g.onSound?.('heal', target);
  return effective;
}

export function hitHealingBolt(g, bolt, target) {
  if (!canSpellHeal(g, bolt, target)) return false;
  applySpellHealing(g, bolt, target, bolt.healingAmount);
  // At the cap, new hits never replace or extend existing tick schedules.
  if (bolt.healingHot && Number.isFinite(bolt.healingHotAmount) && bolt.healingHotAmount > 0) {
    target.healingOverTime ||= [];
    if (target.healingOverTime.length < HEALING_STACK_LIMIT)
      target.healingOverTime.push({owner:bolt.owner, room:target.room || null, amount:bolt.healingHotAmount,
        nextTick:1, ticksLeft:HEALING_HOT_TICKS});
  }
  return true;
}

export function tickSpellHealing(g, dt) {
  if (!Number.isFinite(dt) || dt < 0) return;
  for (const target of actors(g)) {
    if (!target.healingOverTime) continue;
    if (!Array.isArray(target.healingOverTime)) {delete target.healingOverTime;continue;}
    const kept = [];
    for (const stack of target.healingOverTime.slice(0, HEALING_STACK_LIMIT)) {
      if (!canSpellHeal(g, stack, target) || !Number.isFinite(stack.amount) || stack.amount <= 0 ||
          !Number.isFinite(stack.nextTick) || !Number.isInteger(stack.ticksLeft) || stack.ticksLeft <= 0) continue;
      stack.ticksLeft = Math.min(HEALING_HOT_TICKS, stack.ticksLeft);
      stack.nextTick = Math.min(1, stack.nextTick) - dt;
      while (stack.nextTick <= 1e-8 && stack.ticksLeft > 0) {
        applySpellHealing(g, stack, target, stack.amount);
        stack.ticksLeft--; stack.nextTick += 1;
      }
      if (stack.ticksLeft > 0) kept.push(stack);
    }
    if (kept.length) target.healingOverTime = kept;
    else delete target.healingOverTime;
  }
}

function healingAim(g, p, origin) {
  const length = Math.hypot(p.faceX || 0, p.faceY || 0) || 1;
  const fx = (p.faceX || 0) / length, fy = (p.faceY || (p.faceX ? 0 : 1)) / length;
  if (p.bowAiming) return {x:fx, y:fy};
  let best;
  for (const a of spellHealingTargets(g, p)) {
    const dx=a.x-origin.x, dy=a.y-origin.y, d=Math.hypot(dx,dy)||1;
    const dot=(dx*fx+dy*fy)/d, score=d*(1.35-dot);
    if (d<=320 && dot>=.55 && clearShot(g,origin,a,4) && (!best || score<best.score))
      best={angle:Math.atan2(dy,dx),score};
  }
  const angle=Math.atan2(fy,fx), delta=best?Math.atan2(Math.sin(best.angle-angle),Math.cos(best.angle-angle)):0;
  const assisted=angle+Math.max(-Math.PI/45,Math.min(Math.PI/45,delta*.18));
  return {x:Math.cos(assisted),y:Math.sin(assisted)};
}

function healingCast(g, p, charge, slot, roomCast=false) {
  const def=ITEMS[p?.equipment?.[slot]];
  if (!['hand1','hand2'].includes(slot) || !def?.healing || !(g.players || []).includes(p) ||
      p.hp<=0 || !!p.room!==roomCast || p.ui || isCharmed(p)) return null;
  const cost=(def.manaCost || 0)*(1-Math.min(.75,Math.max(0,stat(p,'manaDiscount'))));
  const mana=p.mana ?? p.maxMana ?? 100;
  if (!Number.isFinite(mana) || mana<cost) return null;
  const strength=Math.max(0,Math.min(1,(Number.isFinite(charge)?charge:0)/1.2));
  const outgoing=1+Math.max(0,stat(p,'outgoingSpellHealing'));
  return {def,cost,mana,strength,outgoing};
}

function makeHealingBolt(g,p,slot,origin,aim,cast) {
  const {def,strength,outgoing}=cast;
  return {owner:p.id,slot,room:p.room || null,magic:true,age:0,
    visualSeed:(p.id+1)*977+Math.round((g.time||0)*1000)+(slot==='hand2'?479:0),
    ...origin,vx:aim.x*260,vy:aim.y*260,life:3,remaining:chargedProjectileRange(strength*1.2),
    size:6+Math.round(strength*8),damage:0,healing:true,healingAmount:def.healingAmount*(1+strength*.5)*outgoing,
    healingHot:ITEMS[p.equipment.head]?.healingHalo===true,healingHotAmount:HEALING_HOT_AMOUNT*outgoing,
    color:HEALING_COLOR,glow:magicBoltGlow(def)};
}

function payHealingCast(g,p,cast) {
  p.mana=cast.mana-cast.cost;
  if (!p.room) emitNoise(g,p,'magic',260);
  g.onSound?.('magic',p);
  applySpellHealing(g,p,p,stat(p,'castHeal')*cast.outgoing);
}

/** Returns a paid, room-local bolt for the parent's room bolts array, or null.
 * Coordinates are feet/floor coordinates, like world bolts; drawMagicBolt
 * supplies its normal 16-unit visual offset. No world aim/LOS/tip calls occur.
 */
export function createRoomHealingBolt(g,p,charge=0,slot='hand1',options={}) {
  const cast=healingCast(g,p,charge,slot,true);
  if (!cast) return null;
  const origin=options.origin || spellHealingPoint(p);
  const direction=options.aim || {x:p.faceX || 0,y:p.faceY || (p.faceX?0:1)};
  if (![origin.x,origin.y,direction.x,direction.y].every(Number.isFinite)) return null;
  const length=Math.hypot(direction.x,direction.y);
  if (!length) return null;
  const aim={x:direction.x/length,y:direction.y/length};
  const bolt=makeHealingBolt(g,p,slot,origin,aim,cast);
  payHealingCast(g,p,cast);
  return bolt;
}

export function fireHealingSpell(g, p, charge = 0, slot = 'hand1') {
  const cast=healingCast(g,p,charge,slot);
  if (!cast) return false;
  const tip=wandTipWorld(p,slot,g.time || 0), origin={x:tip.x,y:tip.y+16};
  const aim=healingAim(g,p,origin);
  const bolt=makeHealingBolt(g,p,slot,origin,aim,cast);
  payHealingCast(g,p,cast);
  if (pending.has(g)) pending.get(g).push(bolt);
  else {g.spells ||= []; g.spells.push(bolt);}
  return true;
}

function tickHealingBolts(g, bolts, dt) {
  for (const bolt of bolts) {
    bolt.damage=0; bolt.age=(bolt.age || 0)+dt; bolt.life-=dt;
    const speed=Math.hypot(bolt.vx,bolt.vy);
    if (!Number.isFinite(speed) || speed<=0 || !Number.isFinite(bolt.remaining)) bolt.life=0;
    const steps=Math.max(1,Math.ceil(speed*dt/4));
    for (let n=0;n<steps && bolt.life>0;n++) {
      const distance=Math.min(speed*dt/steps,bolt.remaining);
      bolt.x+=bolt.vx/speed*distance; bolt.y+=bolt.vy/speed*distance; bolt.remaining-=distance;
      if (g.projectileBlocked(bolt.x,bolt.y,(bolt.size || 6)/2,true)) {
        bolt.life=0; finishMagicBolt(g,bolt,true); break;
      }
      const target=spellHealingTargets(g,bolt).find(a =>
        Math.hypot(a.x-bolt.x,a.y-bolt.y)<16+(bolt.size || 6)/2 && clearShot(g,bolt,a));
      if (target && hitHealingBolt(g,bolt,target)) {
        bolt.life=0; finishMagicBolt(g,bolt,true); break;
      }
      if (bolt.remaining<=0) bolt.life=0;
    }
    if (bolt.life<=0) finishMagicBolt(g,bolt,false);
  }
  return bolts.filter(b => b.life>0);
}

// Compose in core, leaving the shared adventure implementation available to its
// owner. Saved/in-flight healing is isolated before every ordinary damage loop.
export function healingAdventureMethods(base) {
  return {
    fireSpell(p, charge=0, slot='hand1', comboDamage=1) {
      if (ITEMS[p?.equipment?.[slot]]?.healing) return fireHealingSpell(this,p,charge,slot);
      const before=p.hp, cast=base.fireSpell.call(this,p,charge,slot,comboDamage);
      // Lunar cast-healing is spell healing too; retain ordinary casting while
      // routing that existing self-heal through the halo and effective numbers.
      if (cast && stat(p,'castHeal')>0 && canSpellHeal(this,p,p)) {
        p.hp=before;
        applySpellHealing(this,p,p,stat(p,'castHeal')*(1+Math.max(0,stat(p,'outgoingSpellHealing'))));
      }
      return cast;
    },
    tickAdventure(dt, inputs) {
      const bolts=[...(this.spells || []).filter(b => b.healing),...(this.healingBoltsInStep || [])];
      this.spells=(this.spells || []).filter(b => !b.healing);
      // A persist callback inside the ordinary step must also save these bolts.
      this.healingBoltsInStep=bolts;
      pending.set(this,bolts);
      let completed=false;
      try {
        tickSpellHealing(this,dt);
        base.tickAdventure.call(this,dt,inputs);
        this.spells.push(...tickHealingBolts(this,bolts,dt));
        completed=true;
      } finally {
        if (!completed) this.spells.push(...bolts.filter(b => b.life>0));
        delete this.healingBoltsInStep;
        pending.delete(this);
      }
    },
  };
}
