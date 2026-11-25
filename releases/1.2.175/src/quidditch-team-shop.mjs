import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {mirroredShopPoint,shopLocalPosition,shopCutawayOpen} from './diagon-shop-rooms.mjs';

export const QUIDDITCH_TEAM_SHOP='quidditch-team-kit';
const name='Elspeth Trewick';
const greeting='Gold or violet? I keep both sides match-ready.';
const counter={x:-25,y:44};
const stock=[['quidditch_gold_robe',70],['quidditch_gold_scarf',24],
 ['quidditch_violet_robe',70],['quidditch_violet_scarf',24],['broom_speed_potion',18]];

export function quidditchKitMerchantActor(shop){
 return {id:QUIDDITCH_TEAM_SHOP,name,kind:'player',sprite:'player',hp:100,unattackable:true,
  ...mirroredShopPoint(shop,counter),faceX:-.65,faceY:.76,
  appearance:{...DEFAULT_APPEARANCE,skin:'#b48469',hair:'topknot',hairColor:'#714e44',shirt:'#6c517e',pants:'#343144',shoes:'#31252c'},
  equipment:{chest:'quidditch_violet_robe',back:'quidditch_violet_scarf'}};
}

export function nearQuidditchKitMerchant(shop,p){
 if(p.room||p.trainRide||!shopCutawayOpen(shop,[p]))return false;
 const {x,y}=shopLocalPosition(shop,p.x,p.y);
 return y>=21&&y<62&&Math.hypot(x-counter.x,y-counter.y)<41;
}

export function openQuidditchKitShop(g,p,shop){
 if(!nearQuidditchKitMerchant(shop,p))return false;
 const visual=quidditchKitMerchantActor(shop);
 const merchants=g.trainTest.alleyMerchants??={};
 merchants[QUIDDITCH_TEAM_SHOP]??={id:QUIDDITCH_TEAM_SHOP,name,shopTitle:'Quidditch Team Outfitter',
  x:visual.x,y:visual.y,visual,greeting,trainTailor:true,alleyShop:true,revision:0,
  stock:stock.map(([type,price])=>({item:{type,qty:1},price}))};
 p.ui={shop:'merchant',alleyShop:QUIDDITCH_TEAM_SHOP,panel:'stock',index:0,page:0,notice:greeting};
 return true;
}
