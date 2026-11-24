import {ITEMS} from './items.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {clearShot} from './navigation.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';

export const PATRONUS_DURATION = 30;
export const PATRONUS_FORMS = Object.freeze({
  stag: 'Stag', wolf: 'Wolf', fox: 'Fox', golden_retriever: 'Golden retriever', river_otter: 'River otter',
});
const companions = new WeakMap();
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const roomOf = actor => actor.room || null;
const point = actor => actor.room ? {x:actor.roomX,y:actor.roomY} : actor;

export const patronusLesson = player => player.npcQuests?.patronus;
export function isPatronusWand(id) {
  const item = ITEMS[id];
  return !!(item?.magic && (item.base === 'wand' || (!item.base && /(?:^|_)wand$/.test(id))));
}
export const holdsPatronusWand = player => ['hand1','hand2'].some(slot => isPatronusWand(player.equipment?.[slot]));
export const isPatronusTarget = actor => actor?.hp > 0 && actor.faction !== 'ally' && actor.faction !== 'neutral' &&
  (actor.kind === 'ghost' || actor.kind === 'dementor' || actor.happinessDevourer === true);

export function learnPatronus(g,player,{relearn=false}={}) {
  if (!holdsPatronusWand(player)) return false;
  const lesson = (player.npcQuests ??= {}).patronus ??= {};
  if (relearn && !Object.hasOwn(PATRONUS_FORMS,lesson.form)) return false;
  if (relearn) {
    lesson.previousForm = lesson.form;
    delete lesson.form;
    companions.delete(player);
  }
  lesson.learned = true;
  g.persist?.();
  return true;
}

function activeFor(g,player) {
  const companion = companions.get(player);
  return companion?.expiresAt > g.time && companion.summonedAt<=g.time+.25 ? companion : null;
}

export function activePatronuses(g,room=null) {
  const actors=[];
  for (const owner of g.players||[]) {
    const a=activeFor(g,owner);
    if (a && a.room===room && owner.hp>0 && roomOf(owner)===room) actors.push(a);
  }
  return actors;
}

export function summonPatronus(g,player) {
  const lesson = patronusLesson(player);
  if (!lesson?.learned || !(player.hp>0) || activeFor(g,player)) return false;
  if (!Object.hasOwn(PATRONUS_FORMS,lesson.form)) {
    const forms = Object.keys(PATRONUS_FORMS).filter(form=>form!==lesson.previousForm);
    lesson.form = forms[Math.min(forms.length-1,Math.max(0,Math.floor((g.random?.() ?? Math.random())*forms.length)))];
    delete lesson.previousForm;
    g.persist?.();
  }
  const at=point(player),now=g.time;
  companions.set(player,{
    id:`patronus:${player.id}`, owner:player, patronus:true, kind:lesson.form, hp:1,
    x:at.x, y:at.y, room:g.patronusRoom||roomOf(player), faceX:player.faceX??0, faceY:player.faceY??1,
    summonedAt:now, expiresAt:now+PATRONUS_DURATION, step:0, moving:false,
  });
  emitGameplayFx(g,'magic',player,{scale:.55});
  g.onSound?.('magic',player);
  g.message?.(`${player.name} summons a ${PATRONUS_FORMS[lesson.form].toLowerCase()} Patronus.`);
  return true;
}

export function patronusOnWandHit(g,player,target) {
  return !!(player && isPatronusTarget(target) && summonPatronus(g,player));
}

function movePatronus(a,goal,dt,speed) {
  const gap=distance(a,goal);
  a.moving=gap>2;
  if (!a.moving) return;
  a.faceX=(goal.x-a.x)/gap;
  a.faceY=(goal.y-a.y)/gap;
  const travel=Math.min(gap,speed*dt);
  a.x+=a.faceX*travel;
  a.y+=a.faceY*travel;
  a.step+=travel*.13;
}

function advance(g,a,dt,targets,sight,hit) {
  const owner=a.owner,at=point(owner);
  if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return;
  const scene=g.trainTest?.design?.activeRoom || null, room=g.patronusRoom||roomOf(owner);
  if (a.scene!==scene || a.room!==room || distance(a,at)>350) {
    Object.assign(a,{x:at.x,y:at.y,scene,room,target:null,scanAt:0});
  }
  if (!isPatronusTarget(a.target) || distance(a.target,at)>200) a.target=null;
  if (!(a.scanAt>g.time)) {
    a.scanAt=g.time+.22;
    let range=176;
    a.target=null;
    for (const candidate of targets) {
      if (!isPatronusTarget(candidate)) continue;
      const d=distance(at,candidate);
      if (d<range && sight(at,candidate)) {a.target=candidate;range=d;}
    }
  }
  if (a.target) {
    const range=distance(a,a.target);
    if (range>32) movePatronus(a,a.target,dt,135);
    else {
      a.moving=false;
      if (!(a.strikeAt>g.time) && sight(a,a.target)) {
        a.strikeAt=g.time+.9;
        a.attackUntil=g.time+.25;
        hit(a.target,owner);
        emitGameplayFx(g,'hit',a.target,{scale:.65,room:a.room});
      }
    }
  } else {
    const dx=owner.faceX??0,dy=owner.faceY??1,angle=g.time*1.5;
    const foot={x:at.x-dx*29+Math.cos(angle)*7,y:at.y-dy*29+Math.sin(angle)*5};
    if (distance(a,foot)>8) movePatronus(a,foot,dt,120);
    else a.moving=false;
  }
  a.attack=Math.max(0,(a.attackUntil||0)-g.time);
  a.state=a.attack>0?'charge':'hunt';
}

export function tickPatronuses(g,dt) {
  for (const owner of g.players||[]) {
    const a=companions.get(owner);
    if (!a) continue;
    if (!activeFor(g,owner) || owner.hp<=0 || !['play','won'].includes(g.phase)) {
      companions.delete(owner);
    } else if (!owner.room) {
      advance(g,a,dt,g.enemies||[],(from,to)=>clearShot(g,from,to),(target,player)=>{
        if (damageEnemy(target,17,'spectral',{g,p:player,secondary:true})>0) {
          target.killedBy=player.id;
          target.ritualKill=false;
        }
      });
    }
  }
}

export function tickRoomPatronuses(g,room,dt,targets,sight,hit) {
  for (const owner of g.players||[]) {
    const a=activeFor(g,owner);
    if (a && owner.room===room && owner.hp>0) advance(g,a,dt,targets,sight,hit);
  }
}
