import books from './diagon-shop-books.mjs';
import robes from './diagon-shop-robes.mjs';
import quidditch from './diagon-shop-quidditch.mjs';
import apothecary from './diagon-shop-apothecary.mjs';
import owlery from './diagon-shop-owlery.mjs';
import iceCream from './diagon-shop-ice-cream.mjs';
import bank from './diagon-shop-bank.mjs';
import {OLLIVANDERS_LAYOUT as layout} from './diagon-wand-shop-layout.mjs';

export const ALLEY_SHOP_ROOMS={
  flourish:books,malkins:robes,quidditch,apothecary,eeylops:owlery,floreans:iceCream,gringotts:bank,
};

export const shopEntrySide=shop=>shop.x<8000?1:-1;

export function mirroredShopPoint(shop,point) {
  return {x:shop.x+point.x*shopEntrySide(shop),y:shop.y+point.y};
}

export function shopLocalPosition(shop,x,y) {
  return {x:(x-shop.x)*shopEntrySide(shop),y:y-shop.y};
}

export function shopCutawayOpen(shop,party) {
  return party.some(actor=>{
    if(actor.ui?.alleyShop===shop.id)return true;
    const {x,y}=shopLocalPosition(shop,actor.x,actor.y);
    if(Math.abs(y)>=layout.halfDepth)return false;
    return Math.abs(x)<layout.halfWidth ||
      (x>=layout.halfWidth&&x<layout.halfWidth+8&&Math.abs(y)<layout.entranceHalf);
  });
}

export function shopServiceReach(shop,actor) {
  const {x,y}=shopLocalPosition(shop,actor.x,actor.y);
  return (x>=-42&&x<=98&&y>=-7&&y<=51) ||
    (x>98&&x<=140&&Math.abs(y)<layout.entranceHalf);
}

export function shopSolidAt(shop,wx,wy,radius) {
  const {x,y}=shopLocalPosition(shop,wx,wy);
  const {halfWidth:W,halfDepth:D,wall,entranceHalf:E}=layout;
  const pad=radius+wall;
  if(Math.abs(x)>W+pad||Math.abs(y)>D+pad)return false;
  if(Math.abs(Math.abs(y)-D)<pad||
    Math.abs(x+W)<pad||
    (Math.abs(x-W)<pad&&Math.abs(y)>E-radius))return true;
  return ALLEY_SHOP_ROOMS[shop.id].props.some(({x:px,y:py,solid})=>
    solid&&Math.abs(x-px)<solid.width/2+radius&&y>py-solid.depth-radius&&y<py+radius);
}
