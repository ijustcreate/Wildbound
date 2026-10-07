import {take} from './items.mjs';

export const ARROW_TYPES=Object.freeze(['arrow']);
export function quiverType(){return 'arrow';}
export function loadQuiver(p,type){
 if(p.field)delete p.field.quiver;
 return type==='arrow';
}
export function consumeQuiver(p){return take(p.inventory,'arrow',1)?'arrow':null;}
