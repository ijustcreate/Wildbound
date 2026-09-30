import {count,take} from './items.mjs';

export const ARROW_TYPES=['arrow','starter_arrow','ice_arrow'];
export function quiverType(p){
 const chosen=p.field?.quiver;
 return ARROW_TYPES.includes(chosen)?chosen:ARROW_TYPES.find(t=>count(p,t)>0)||'arrow';
}
export function loadQuiver(p,type){
 if(!ARROW_TYPES.includes(type))return false;
 (p.field||={}).quiver=type;return true;
}
export function consumeQuiver(p){const type=quiverType(p);return take(p.inventory,type,1)?type:null;}
