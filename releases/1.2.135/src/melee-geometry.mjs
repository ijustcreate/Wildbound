import { ITEMS, itemKind } from './items.mjs';
import {anacondaMeleeSections} from './anaconda-body.mjs';

export function meleeProfile(actor) {
  const ids = [actor.equipment?.hand1, actor.equipment?.hand2].filter(Boolean);
  const weaponId = ids.find(id => ITEMS[id]?.damage && !ITEMS[id]?.magic && !ITEMS[id]?.ranged);
  const base = weaponId ? itemKind(weaponId) : 'unarmed';
  const def = weaponId ? ITEMS[weaponId] : null;
  const range = Number(def?.reach ?? ITEMS[base]?.reach) || (weaponId ? 76 : 49);
  return { weaponId, kind: base, range: range * (Number(actor.attackReach) || 1), arc: Number(actor.attackArc) || 90, whip: def?.style === 'whip' };
}

// Combat bodies are wider than the small foot colliders used for navigation.
export function meleeBodyRadius(target) {
  if(Number.isFinite(target.hitRadius))return Math.max(0,target.hitRadius);
  return ({dragon:42,elephant:38,rhino:34,golem:26,gorilla:26,lion:24,white_lion:24,tiger:24,panther:22,snow_leopard:22,wolf:18,baby_spider:6})[target.kind]??(target.kind?14:target.device?12:0);
}
export function meleeContact(actor,target,profile=meleeProfile(actor)) {
  if(target.kind==='anaconda'&&!Number.isFinite(target.hitRadius)){
    for(const p of anacondaMeleeSections(target)){const hit=meleeContact(actor,{...p,hitRadius:p.radius},profile);if(hit)return hit;}
    return null;
  }
  const dx=target.x-actor.x,dy=target.y-actor.y;
  const facing=Math.atan2(actor.faceY||0,actor.faceX||0);
  const relative=Math.atan2(Math.sin(Math.atan2(dy,dx)-facing),Math.cos(Math.atan2(dy,dx)-facing));
  const half=Math.min(Math.PI,profile.arc*Math.PI/360),angle=facing+Math.max(-half,Math.min(half,relative));
  const distance=Math.max(0,Math.min(profile.range,dx*Math.cos(angle)+dy*Math.sin(angle)));
  const point={x:actor.x+Math.cos(angle)*distance,y:actor.y+Math.sin(angle)*distance};
  return Math.hypot(point.x-target.x,point.y-target.y)<=meleeBodyRadius(target)+1e-7?point:null;
}
export function meleeTargetInArc(actor,target,profile=meleeProfile(actor)) {
  return !!meleeContact(actor,target,profile);
}
export function meleeCanHit(actor,target,profile,visible) {
  if(target.kind==='anaconda'&&!Number.isFinite(target.hitRadius)){
    for(const p of anacondaMeleeSections(target))if(meleeCanHit(actor,{...p,hitRadius:p.radius},profile,visible))return true;
    return false;
  }
  const contact=meleeContact(actor,target,profile);if(!contact)return false;
  const radius=meleeBodyRadius(target);
  // Stop at the near surface of the body, not at a center hidden behind a frame.
  const toward=Math.atan2(target.y-actor.y,target.x-actor.x),near={x:target.x-Math.cos(toward)*radius,y:target.y-Math.sin(toward)*radius};
  const pointInside=point=>meleeContact(actor,{...point,hitRadius:0},{...profile})!==null;
  if(pointInside(near)&&visible(near))return true;
  if(visible(contact))return true;
  // A shoulder or flank can be exposed through an opening while the center is occluded.
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,point={x:target.x+Math.cos(a)*radius,y:target.y+Math.sin(a)*radius};
    if(pointInside(point)&&visible(point))return true;
  }
  return false;
}
