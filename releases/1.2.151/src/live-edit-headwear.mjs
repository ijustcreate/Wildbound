import {ITEMS} from './items.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';

export const DEFAULT_HEADWEAR_FIT = Object.freeze({x:0,y:0,scale:1,rotation:0});

const games = new WeakMap();
function stateFor(game) {
  if (!games.has(game)) games.set(game,{picking:false,rendered:new Map(),fits:new Map(),hasFrame:false});
  return games.get(game);
}

function labelFor(actor, player) {
  if (player) return player.name || 'Explorer';
  return actor.name || actor.label || String(actor.npcId || actor.villagerId || actor.kind || 'Character').replaceAll('_',' ');
}

function wornHeadwear(actor) {
  const cosmetics = actor.field?.cosmetics;
  if (cosmetics?.hideHelmet) return null;
  const chest = ITEMS[cosmetics?.chest]?.slot === 'chest' ? cosmetics.chest : actor.equipment?.chest;
  if (ITEMS[chest]?.blankExplorer) return null;
  const id = ITEMS[cosmetics?.head]?.slot === 'head' ? cosmetics.head : actor.equipment?.head;
  return ITEMS[id]?.slot === 'head' ? id : null;
}

function subjectFor(game, actor) {
  if (!actor || actor.id == null || actor.controlledBy != null) return null;
  const player = game.players?.find(candidate=>candidate.id===actor.id);
  const kind = actor.sprite || actor.kind || 'character';
  const stableNpcId = actor.npcId || actor.villagerId || actor.id;
  const id = player ? 'player:'+player.id : 'npc:'+kind+':'+stableNpcId;
  const itemId = wornHeadwear(actor);
  let key = null;
  if (itemId) {
    const owner = player?.profileId ? ['profile',String(player.profileId)] :
      player ? ['player',String(game.seed ?? ''),String(player.id)] :
      ['npc',String(game.seed ?? ''),kind,String(stableNpcId)];
    key = JSON.stringify([...owner,itemId]);
  }
  return {id,label:labelFor(actor,player),itemId,key,fit:key&&games.get(game)?.fits.get(key)};
}

function validKey(key) {
  if (typeof key !== 'string') return false;
  try {
    const parts = JSON.parse(key);
    return Array.isArray(parts) && parts.every(part=>typeof part==='string') &&
      parts.length === ({profile:3,player:4,npc:5}[parts[0]]) && ITEMS[parts.at(-1)]?.slot === 'head';
  } catch { return false; }
}

function adjusted(number, low, high, fallback) {
  return Number.isFinite(number) ? Math.max(low,Math.min(high,number)) : fallback;
}

export function applyHeadwear(game,key,values) {
  if (!game || !validKey(key) || (values!==null && (!values || typeof values!=='object'))) return false;
  const state = stateFor(game);
  if (values===null) state.fits.delete(key);
  else state.fits.set(key,{
    x:adjusted(values.x,-30,30,0),
    y:adjusted(values.y,-30,30,0),
    scale:adjusted(values.scale,.25,3,1),
    rotation:adjusted(values.rotation,-180,180,0),
  });
  return true;
}

export function setHeadwearPicking(game, picking) {
  if (!game) return;
  const state = picking ? stateFor(game) : games.get(game);
  if (!state) return;
  if (state.picking === picking) return;
  state.picking = picking;
  state.hasFrame = false;
  state.rendered.clear();
}

export function beginHeadwearFrame(game) {
  const state = games.get(game);
  if (!state?.picking) return;
  state.hasFrame = true;
  state.rendered.clear();
}

export function headwearDrawSubject(game,actor) {
  const state = games.get(game);
  if (!state || (!state.picking && !state.fits.size)) return null;
  const subject = subjectFor(game,actor);
  return subject && {...subject,picking:state.picking};
}

export function recordHeadwearTarget(game,subject,bounds,hatBounds) {
  const state = games.get(game);
  if (state?.picking) state.rendered.set(subject.id,{...subject,bounds,hatBounds});
}

function boxCenter(box) {
  return {x:box.x+box.width/2,y:box.y+box.height/2};
}

function within(point, box, margin = 0) {
  return point.x >= box.x-margin && point.x <= box.x+box.width+margin &&
    point.y >= box.y-margin && point.y <= box.y+box.height+margin;
}

function estimatedSubject(game,player) {
  const subject = subjectFor(game,player);
  if (!subject) return null;
  const size = PLAYER_RENDER_SIZE/48;
  const x = player.x;
  const y = player.y-(player.trainVisualLift||player.pirateVisualLift||player.trainGround||0)-
    (player.jumpHeight||0)-(player.groundHeight||0);
  return {...subject,bounds:{x:x-13*size,y:y-44*size,width:26*size,height:48*size},
    hatBounds:subject.itemId?{x:x-12*size,y:y-45*size,width:24*size,height:21*size}:null};
}

export function headwearTargets(game,point) {
  const state = games.get(game);
  const subjects = state?.hasFrame ? [...state.rendered.values()] : (game.players||[]).map(actor=>estimatedSubject(game,actor));
  return subjects.filter(subject=>subject&&(!point||within(point,subject.bounds,3)||
    (subject.hatBounds&&within(point,subject.hatBounds,3))))
    .map(({id,label,bounds})=>({id,label,bounds,...boxCenter(bounds),category:'characters'}));
}

export function headwearFor(game,id) {
  const player = game.players?.find(actor=>'player:'+actor.id===id);
  const rendered = games.get(game)?.rendered.get(id);
  const subject = player ? estimatedSubject(game,player) : rendered;
  if (!subject?.itemId) return null;
  const bounds = rendered?.itemId===subject.itemId ? rendered.hatBounds : subject.hatBounds;
  return {id,key:subject.key,label:ITEMS[subject.itemId].name,itemId:subject.itemId,
    direction:'all',bounds,values:{...DEFAULT_HEADWEAR_FIT,...games.get(game)?.fits.get(subject.key)}};
}

export function fittedHeadwearPoint(x,y,fit) {
  if (!fit) return [x,y];
  const angle = fit.rotation*Math.PI/180;
  const cos = Math.cos(angle)*fit.scale, sin = Math.sin(angle)*fit.scale;
  return [fit.x+x*cos-y*sin,fit.y+x*sin+y*cos];
}

export function withHeadwearFit(context,anchor,fit,paint) {
  if (!fit) return paint();
  context.save();
  context.translate(anchor.x+fit.x,anchor.y+fit.y);
  if (fit.rotation) context.rotate(fit.rotation*Math.PI/180);
  if (fit.scale!==1) context.scale(fit.scale,fit.scale);
  context.translate(-anchor.x,-anchor.y);
  try { return paint(); } finally { context.restore(); }
}
