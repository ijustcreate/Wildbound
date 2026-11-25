import {ITEMS} from './items.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {facingIndex} from './actor-projection.mjs';

export const DEFAULT_HEADWEAR_FIT = Object.freeze({x:0,y:0,scale:1,rotation:0});
export const HEADWEAR_FACINGS = Object.freeze(['S','SW','W','NW','N','NE','E','SE']);

const games = new WeakMap();
function stateFor(game) {
  if (!games.has(game)) games.set(game,{picking:false,rendered:new Map(),fits:new Map(),hasFrame:false,preview:null});
  return games.get(game);
}

function labelFor(actor, player) {
  if (player) return player.name || 'Explorer';
  return actor.name || actor.label || String(actor.npcId || actor.villagerId || actor.kind || 'Character').replaceAll('_',' ');
}

export function wornHeadwear(actor) {
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
  return {id,label:labelFor(actor,player),itemId,key};
}

function fitScope(key) {
  if (typeof key !== 'string') return null;
  try {
    const parts = JSON.parse(key);
    if (!Array.isArray(parts) || !parts.every(part=>typeof part==='string')) return null;
    const length = {profile:3,player:4,npc:5}[parts[0]];
    if (ITEMS[parts[length-1]]?.slot !== 'head') return null;
    if (parts.length===length) return {baseKey:JSON.stringify(parts),direction:'all'};
    if (parts.length===length+1 && HEADWEAR_FACINGS.includes(parts[length])) {
      return {baseKey:JSON.stringify(parts.slice(0,length)),direction:parts[length]};
    }
    return null;
  } catch { return null; }
}

function adjusted(number, low, high, fallback) {
  return Number.isFinite(number) ? Math.max(low,Math.min(high,number)) : fallback;
}

export function applyHeadwear(game,key,values) {
  const scope = fitScope(key);
  if (!game || !scope || (values!==null && (!values || typeof values!=='object'))) return false;
  const state = stateFor(game);
  const {baseKey,direction} = scope;
  const views = state.fits.get(baseKey) || new Map();
  if (values===null) views.delete(direction);
  else views.set(direction,{
    x:adjusted(values.x,-30,30,0), y:adjusted(values.y,-30,30,0),
    scale:adjusted(values.scale,.25,3,1), rotation:adjusted(values.rotation,-180,180,0),
  });
  if (views.size) state.fits.set(baseKey,views);
  else state.fits.delete(baseKey);
  return true;
}

export function renderedHeadwearFit(game,baseKey,direction) {
  const views = games.get(game)?.fits.get(baseKey);
  return views?.get(HEADWEAR_FACINGS[direction]) ?? views?.get('all');
}

export function setHeadwearPreview(game,id,direction) {
  if (!game) return false;
  const state = games.get(game);
  if (direction===null) {
    if (state?.preview && (id==null || state.preview.id===id)) state.preview = null;
    return true;
  }
  const view = HEADWEAR_FACINGS.indexOf(direction);
  if (!state?.picking || typeof id!=='string' || view<0) return false;
  state.preview = {id,direction,view};
  return true;
}

export function setHeadwearPicking(game, picking) {
  if (!game) return;
  const state = picking ? stateFor(game) : games.get(game);
  if (!state) return;
  if (state.picking === picking) return;
  state.picking = picking;
  if (!picking) state.preview = null;
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
  if (!subject || (!state.picking && !state.fits.has(subject.key))) return null;
  const previewView = state.preview?.id===subject.id ? state.preview.view : null;
  return {...subject,picking:state.picking,previewView};
}

export function recordHeadwearTarget(game,subject,bounds,hatBounds,view) {
  const state = games.get(game);
  if (state?.picking) state.rendered.set(subject.id,{...subject,bounds,hatBounds,direction:HEADWEAR_FACINGS[view]});
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

export function headwearFor(game,id,requestedDirection) {
  const player = game.players?.find(actor=>'player:'+actor.id===id);
  const state = games.get(game);
  const rendered = state?.rendered.get(id);
  const subject = player ? estimatedSubject(game,player) : rendered;
  if (!subject?.itemId) return null;
  const bounds = rendered?.itemId===subject.itemId ? rendered.hatBounds : subject.hatBounds;
  const preview = state?.preview?.id===id ? state.preview.direction : undefined;
  const direction = requestedDirection ?? preview ?? rendered?.direction ?? HEADWEAR_FACINGS[facingIndex(player?.faceX,player?.faceY)];
  if (direction!=='all' && !HEADWEAR_FACINGS.includes(direction)) return null;
  const baseKey = subject.key;
  const key = direction==='all' ? baseKey : JSON.stringify([...JSON.parse(baseKey),direction]);
  const fits = state?.fits.get(baseKey);
  const savedValues = fits?.get(direction);
  const values = savedValues ?? fits?.get('all') ?? DEFAULT_HEADWEAR_FIT;
  return {id,key,baseKey,label:ITEMS[subject.itemId].name,itemId:subject.itemId,direction,bounds,
    values:{...values},savedValues:savedValues?{...savedValues}:null};
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
