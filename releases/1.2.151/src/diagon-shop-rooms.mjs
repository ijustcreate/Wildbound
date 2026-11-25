import books from './diagon-shop-books.mjs';
import robes from './diagon-shop-robes.mjs';
import quidditch from './diagon-shop-quidditch.mjs';
import apothecary from './diagon-shop-apothecary.mjs';
import owlery from './diagon-shop-owlery.mjs';
import iceCream from './diagon-shop-ice-cream.mjs';
import bank from './diagon-shop-bank.mjs';
import borgin from './diagon-shop-borgin.mjs';
import {nocturneCurios,nightglass} from './diagon-nocturne-shops.mjs';
import {OLLIVANDERS_LAYOUT as layout} from './diagon-wand-shop-layout.mjs';
import {bellglassRoom,meridianRoom} from './diagon-garden-shops.mjs';
import {LOCKSMITH_ROOM} from './diagon-locksmith.mjs';
import {NIGHTGLASS_REAR_DOOR} from './diagon-nocturne-rear.mjs';
import {shopLocalPosition} from './alley-street-layout.mjs';

export {shopEntrySide,mirroredShopPoint,shopLocalPosition} from './alley-street-layout.mjs';

export const ALLEY_SHOP_ROOMS={
  flourish:books,malkins:robes,quidditch,apothecary,eeylops:owlery,floreans:iceCream,gringotts:bank,
  'nocturne-curios':nocturneCurios,nightglass,'borgin-burkes':borgin,bellglass:bellglassRoom,'meridian-hall':meridianRoom,
  'wrong-turn':LOCKSMITH_ROOM,
};

export function shopCutawayOpen(shop,party) {
  return party.some(actor=>{
    if(actor.ui?.alleyShop===shop.id)return true;
    const {x,y}=shopLocalPosition(shop,actor.x,actor.y);
    if(shop.frontEntrance)return Math.abs(x)<layout.halfWidth&&y>-layout.halfDepth&&
      (y<layout.halfDepth||Math.abs(x)<layout.entranceHalf&&y<layout.halfDepth+8);
    if(Math.abs(y)>=layout.halfDepth)return false;
    return Math.abs(x)<layout.halfWidth ||
      (x>=layout.halfWidth&&x<layout.halfWidth+8&&Math.abs(y)<layout.entranceHalf);
  });
}

export function shopServiceReach(shop,actor) {
  const {x,y}=shopLocalPosition(shop,actor.x,actor.y);
  if(shop.frontEntrance)return Math.abs(x)<61&&y>5&&y<58;
  return (x>=-42&&x<=98&&y>=-7&&y<=51) ||
    (x>98&&x<=140&&Math.abs(y)<layout.entranceHalf);
}

export function shopSolidAt(shop,wx,wy,radius,nightglassDoorOpen=false) {
  const {x,y}=shopLocalPosition(shop,wx,wy);
  const {halfWidth:W,halfDepth:D,wall,entranceHalf:E}=layout;
  const pad=radius+wall;
  if(Math.abs(x)>W+pad||Math.abs(y)>D+pad)return false;
  if(shop.frontEntrance){
    if(Math.abs(Math.abs(x)-W)<pad||Math.abs(y+D)<pad||Math.abs(y-D)<pad&&Math.abs(x)>E-radius)return true;
  }else if(Math.abs(Math.abs(y)-D)<pad||Math.abs(x+W)<pad&&
    !(shop.id==='nightglass'&&nightglassDoorOpen&&Math.abs(y-NIGHTGLASS_REAR_DOOR.offsetY)<NIGHTGLASS_REAR_DOOR.halfSpan-radius)||
    Math.abs(x-W)<pad&&Math.abs(y)>E-radius)return true;
  return ALLEY_SHOP_ROOMS[shop.id].props.some(({x:px,y:py,solid})=>
    solid&&Math.abs(x-px)<solid.width/2+radius&&y>py-solid.depth-radius&&y<py+radius);
}
