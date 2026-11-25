import {BELLGLASS_CRYSTAL_BALL,BELLGLASS_MAGIC_MUSHROOM,CRYSTAL_BALL_ID,CRYSTAL_BALL_ITEM,MAGIC_MUSHROOM_ID,MAGIC_MUSHROOM_ITEM} from './divination-content.mjs';
import {WRONG_TURN_KEY_OFFER} from './wrong-turn-key.mjs';
import {FORTESCUE_ICE_CREAM_ITEMS,FORTESCUE_ICE_CREAM_STOCK} from './fortescue-ice-cream.mjs';
export {FORTESCUE_ICE_CREAM_STOCK} from './fortescue-ice-cream.mjs';

const compatibleGear='Socket into compatible gear.';

export const WIZARDING_SHOP_GOODS={
 ...FORTESCUE_ICE_CREAM_ITEMS,
 [CRYSTAL_BALL_ID]:CRYSTAL_BALL_ITEM,
 [MAGIC_MUSHROOM_ID]:MAGIC_MUSHROOM_ITEM,
 firebolt:{name:'Firebolt',base:'flying_broom',stack:1,color:'#bd8655',rarity:'unique',mount:true,
  broomSpeed:225,broomDashCooldownMultiplier:.75,supplyOnly:true,sellPrice:180,
  description:'A racing broom with a polished ebony shaft and curved iron footrests. Flies 7% faster and has a 25% shorter dash cooldown. Use outdoors to mount.'},
 alley_battle_charms:{name:'Practical Battle Charms',base:'trinket',trinket:true,spellDamage:5,stack:1,
  supplyOnly:true,rarity:'rare',color:'#b26c45',sellPrice:47,
  description:`An ember-bound dueling manual. ${compatibleGear}`},
 alley_efficient_casting:{name:'Principles of Efficient Casting',base:'trinket',trinket:true,manaDiscount:.14,stack:1,
  supplyOnly:true,rarity:'rare',color:'#4d8769',sellPrice:55,
  description:`Precise lessons for stretching your reserves. ${compatibleGear}`},
 alley_healing_charms:{name:'A Field Guide to Healing Charms',base:'trinket',trinket:true,outgoingSpellHealing:.18,stack:1,
  supplyOnly:true,rarity:'rare',color:'#608ab0',sellPrice:52,
  description:`An illustrated healer’s handbook. ${compatibleGear}`},
 alley_mana_runes:{name:'Runes of Mana Renewal',base:'trinket',trinket:true,maxMana:12,manaRegen:1.2,stack:1,
  supplyOnly:true,rarity:'rare',color:'#8872a7',sellPrice:56,
  description:`A silver-clasped grimoire of restorative runes. ${compatibleGear}`},
};

export const FLOURISH_SPELLBOOK_STOCK=[
 ['alley_battle_charms',95],['alley_efficient_casting',110],['alley_healing_charms',105],['alley_mana_runes',115],
];
export const FIREBOLT_STOCK=['firebolt',360];
export const MALKINS_WITCH_HAT_STOCK=[['witch_hat_plum',30],['witch_hat_slate',30],['witch_hat_russet',30],['witch_hat_parchment',30]];
const newStock={flourish:FLOURISH_SPELLBOOK_STOCK,quidditch:[FIREBOLT_STOCK],malkins:MALKINS_WITCH_HAT_STOCK,bellglass:[BELLGLASS_CRYSTAL_BALL,BELLGLASS_MAGIC_MUSHROOM],
 'wrong-turn':[WRONG_TURN_KEY_OFFER],floreans:FORTESCUE_ICE_CREAM_STOCK};

// Merchant stock belongs to the expedition checkpoint once a shop has opened.
// Carry new standard offers into those shops without duplicating existing rows.
export function syncWizardingShopStock(merchant,shop){
 const additions=newStock[shop.id];
 if(!additions)return;
 const existing=new Set(merchant.stock.filter(entry=>entry&&entry.seller==null).map(entry=>entry.item?.type));
 for(const [type,price] of additions){
  if(existing.has(type))continue;
  merchant.stock.push({item:{type,qty:1},price});
  merchant.revision=(merchant.revision||0)+1;
 }
}
