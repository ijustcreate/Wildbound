export const BROOM_SPEED_POTION='broom_speed_potion';
export const BROOM_SPEED_POTION_SECONDS=300;

export const BROOM_SPEED_POTION_ITEM={
 name:'Broom Speed Potion',base:'potion',food:true,stack:10,supplyOnly:true,rarity:'uncommon',
 color:'#83d2bc',artColor:'#83d2bc',
 description:'Drink to fly 10% faster on any broom for five minutes of gameplay. A second dose refreshes the timer.',
};

export const broomSpeedPotionMultiplier=p=>p.field?.broomSpeedRemaining>0?1.1:1;

export function drinkBroomSpeedPotion(g,p,index){
 const item=p.inventory?.[index];
 if(p.hp<=0||item?.type!==BROOM_SPEED_POTION||item.qty<=0)return false;
 if(--item.qty===0)p.inventory[index]=null;
 (p.field??={}).broomSpeedRemaining=BROOM_SPEED_POTION_SECONDS;
 const notice='Broom speed +10% for five minutes.';
 if(p.ui)p.ui.notice=notice;
 g.message?.(notice);
 g.onSound?.('heal',p);
 g.persist?.();
 return true;
}

export function tickBroomSpeedPotion(p,dt){
 if(p.field?.broomSpeedRemaining>0)p.field.broomSpeedRemaining=Math.max(0,p.field.broomSpeedRemaining-dt);
}
