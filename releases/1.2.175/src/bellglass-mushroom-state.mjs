export const BELLGLASS_MUSHROOM='bellglass_magic_mushroom';
const portion=60,maximum=180;

export function consumeBellglassMushroom(g,p,item,index){
 if(p.hp<=0||item?.type!==BELLGLASS_MUSHROOM||item.qty<=0)return false;
 const field=p.field??={},remaining=field.bellglassMushroomRemaining||0;
 if(remaining>maximum-portion){
  if(p.ui)p.ui.notice='Three waves are already passing through you.';
  return false;
 }
 if(--item.qty===0)p.inventory[index]=null;
 field.bellglassMushroomRemaining=Math.min(maximum,remaining+portion);
 if(p.ui)p.ui.notice='The colour starts at the edge of your vision.';
 g.onSound?.('magic',p);
 g.persist?.();
 return true;
}

export function tickBellglassMushroom(p,dt){
 if(p.field?.bellglassMushroomRemaining>0)p.field.bellglassMushroomRemaining=Math.max(0,p.field.bellglassMushroomRemaining-dt);
}

function smoothRamp(seconds){
 const t=Math.max(0,Math.min(1,seconds/4));return t*t*(3-2*t);
}

export function bellglassMushroomStrength(players){
 let remaining=0;
 for(const p of players)remaining=Math.max(remaining,p.field?.bellglassMushroomRemaining||0);
 return smoothRamp(remaining)+smoothRamp(remaining-portion)+smoothRamp(remaining-2*portion);
}
