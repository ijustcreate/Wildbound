export const CHAMPION_DRINK='vault_champion_draught';
export const CHAMPION_DRINK_SECONDS=90;
export const championPower=p=>p?.field?.championDrinkRemaining>0?1.15:1;
export const championUnlocked=p=>(p?.npcQuests?.lamplit_vault?.knockouts||0)>0;

export const ARENA_DRINK_ITEMS={
 vault_smoke_cider:{name:'Smoky Orchard Cider',base:'potion',food:true,heal:16,stack:10,color:'#ce8a55',rarity:'common',description:'Brindle’s spiced cider restores up to 16 health.'},
 vault_ember_mead:{name:'Ember Honey Mead',base:'potion',food:true,heal:28,stack:10,color:'#f0be71',rarity:'uncommon',description:'A deep amber honey drink restores up to 28 health.'},
 [CHAMPION_DRINK]:{name:'Champion’s Draught',base:'potion',food:true,stack:6,color:'#e2af58',rarity:'rare',description:'Drink to grow 15% larger and deal 15% more damage for 90 seconds. Another draught refreshes the duration.'},
};

export function recordChampionKnockout(player){
 if(!player)return;
 const records=player.npcQuests??={},vault=records.lamplit_vault??={knockouts:0};
 vault.knockouts++;
}

export function drinkChampionDraught(g,p,item,index){
 if(p.hp<=0||item?.type!==CHAMPION_DRINK||item.qty<=0)return false;
 if(--item.qty===0)p.inventory[index]=null;
 (p.field??={}).championDrinkRemaining=CHAMPION_DRINK_SECONDS;
 g.effects?.push({x:p.x,y:p.y-30,text:'CHAMPION’S DRAUGHT',color:'#f4ca6f',life:.9});
 g.onSound?.('heal',p);
 g.message?.('Champion’s Draught · +15% size and damage for 90 seconds.');
 g.persist?.();
 return true;
}

export function tickChampionDraught(p,dt){
 if(p.field?.championDrinkRemaining>0)p.field.championDrinkRemaining=Math.max(0,p.field.championDrinkRemaining-dt);
}
