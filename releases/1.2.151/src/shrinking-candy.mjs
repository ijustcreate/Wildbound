export const SHRINKING_CANDY='shrinking_candy';
export const SHRINKING_SECONDS=60;
export const shrinkingScale=actor=>actor?.field?.shrinkingCandyRemaining>0 ? .5 : 1;

export function eatShrinkingCandy(g,p,index){
 const item=p.inventory?.[index];
 if(p.hp<=0||item?.type!==SHRINKING_CANDY||item.qty<=0)return false;
 if(--item.qty===0)p.inventory[index]=null;
 (p.field??={}).shrinkingCandyRemaining=SHRINKING_SECONDS;
 const notice='Shrinking Candy · half size and half physical attack damage for one minute.';
 if(p.ui)p.ui.notice=notice;
 g.message?.(notice);g.onSound?.('magic',p);g.persist?.();
 return true;
}

export function tickShrinkingCandy(p,dt){
 if(!(p.field?.shrinkingCandyRemaining>0))return;
 p.field.shrinkingCandyRemaining=Math.max(0,p.field.shrinkingCandyRemaining-dt);
}
