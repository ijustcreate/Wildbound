import {block as b,shape as p} from './diagon-shop-brush.mjs';

export const WRONG_TURN_KEY='wrong_turn_key';
export const WRONG_TURN_KEY_OFFER=[WRONG_TURN_KEY,24];
export const WRONG_TURN_KEY_ITEM={name:'Mystery key',stack:10,rarity:'uncommon',supplyOnly:true,color:'#c9aa73',sellPrice:8,
 description:'Unlock one of the three doors at Wrong Turn Door & Key. The key is spent when the door opens. Step through for an unknown destination.'};

export function drawWrongTurnKeyIcon(c){
 const edge='#44333a',low='#815d4a',brass='#be9859',shine='#e2c286';
 p(c,edge,[[8,2],[12,2],[15,5],[15,10],[13,13],[13,17],[17,17],[17,19],[15,19],[15,22],[10,22],[10,13],[7,12],[5,9],[5,5]]);
 p(c,brass,[[8,3],[12,3],[14,5],[14,9],[12,12],[12,17],[16,17],[16,18],[14,18],[14,21],[11,21],[11,12],[8,11],[6,9],[6,5]]);
 p(c,low,[[8,5],[12,5],[13,7],[12,10],[8,10],[7,8],[7,6]]);
 p(c,'#3e666b',[[9,5],[12,6],[12,9],[10,10],[8,9],[8,7]]);
 b(c,9,6,2,2,'#a7d3b7');b(c,7,5,1,3,shine);b(c,8,3,3,1,shine);
 b(c,11,13,1,6,shine);b(c,12,20,2,1,low);
}
