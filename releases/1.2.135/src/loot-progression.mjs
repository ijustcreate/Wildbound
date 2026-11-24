import {ITEMS} from './items.mjs';

// Equipment rarity is the shared progression ladder. Zone caps keep a high
// level party from skipping the identity and rewards of earlier regions.
const RARITY_RANK=Object.freeze({common:0,uncommon:1,rare:2,unique:3,legendary:4});
const RANK_RARITY=Object.freeze(['common','uncommon','rare','unique','legendary']);
const ZONE_CAP=Object.freeze({
 forest:2,beach:2,swamp:2,house:2,
 graveyard:3,caverns:3,desert:3,
 ice:4,shadow:4,temple:4,
 general:4,
});
const ZONE_FAVORITES=Object.freeze({
 forest:['fern_pauldron','moss_cape','hunter_coat','hunter_bow','thorn_dagger','fern_pendant','ranger_hood','ranger_jacket','ranger_bracers','ranger_trailboots','ranger_quiver','waykeeper_shield'],
 beach:['sunstone_pendant','hunter_bow','iron_sword','leather_hood','hunter_coat','iron_shield'],
 swamp:['fern_pendant','fern_pauldron','moss_cape','thorn_dagger','jungle_mask','jade_pendant','bogglass_charm','mender_focus'],
 graveyard:['ghost_hood','ghost_robe','ghost_gloves','ghost_mist','ghost_cape','bone_dagger','iron_coif','iron_sword'],
 caverns:['storm_wand','iron_gauntlets','iron_coif','iron_sword','iron_shield','scale_pants','arcanist_circlet','arcanist_robe','arcanist_gloves','waykeeper_shield'],
 desert:['sunstone_pendant','jungle_mask','scale_pants','thorn_dagger','sun_blade','sun_boomerang','wayfinder_quiver','waykeeper_shield'],
 ice:['snowflake_pendant','ice_wand','moon_helm','moon_shoulders','moon_blade','moon_bow','moon_shield','moon_steps'],
 shadow:['night_cape','violet_wand','umbral_bow','moon_blade','moon_helm','moon_shield','arcanist_circlet','arcanist_robe','arcanist_gloves','groveheart_focus','bastion_shield'],
 temple:['jade_pendant','sun_wand','sun_crown','sun_plate','sun_blade','sun_bow','sun_shield','dawn_cape','groveheart_focus','bastion_shield'],
 house:['hearth_pendant','linen_cap','linen_shirt','linen_pants','sandals'],
});
const BLOCKED=new Set(['devOnly','supplyOnly','npcOnly','bossOnly','questReward']);
const rankOf=id=>RARITY_RANK[ITEMS[id]?.rarity]??-1;
const medianLevel=party=>{
 const levels=(party||[]).map(p=>Math.max(1,Number(p?.level)||1)).sort((a,b)=>a-b);
 return levels.length?levels[Math.floor((levels.length-1)/2)]:1;
};
// Uncommon equipment is currently supply-only, so normal world drops use the
// four tiers that have actual progression gear: common, rare, unique, legendary.
const stageRank=level=>level<=3?0:level<=6?2:level<=10?3:4;

function fitsCurrentParty(id,party,rank){
 const item=ITEMS[id],slot=item?.slot;
 if(!slot||!party?.length)return false;
 // A duplicate cannot improve a slot, unless the whole party still has a
 // chance to use it. Weapon families are treated as distinct play styles.
 return party.some(player=>{
  const equipped=player?.equipment?.[slot],current=rankOf(equipped);
  if(!equipped||equipped==='occupied')return true;
  if(rankOf(id)>current)return true;
  if(slot==='hand1'&&(ITEMS[equipped]?.base||equipped)===(item.base||id))return false;
  return false;
 });
}

/** Pick one normal-world gear reward with zone, stage and party context.
 * `minRarity` asks for a particular chest tier; it is still capped by the
 * region so a low-tier map cannot hand out endgame equipment prematurely.
 */
export function rollProgressionGear(random=Math.random,options={}){
 const {party=[],slot=null,exclude=[],minRarity=null,boss=false,threat=0,preferredBase=null}=options;
 const biome=options.biome||'general';
 const zoneCap=ZONE_CAP[biome]??2;
 const partyStage=stageRank(medianLevel(party));
 const threatStage=Number(threat)>=320?4:Number(threat)>=180?3:Number(threat)>=95?2:0;
 let target=Math.min(zoneCap,Math.max(partyStage,threatStage)+(boss?1:0));
 if(minRarity){const requested=RARITY_RANK[minRarity];if(requested!=null)target=Math.min(zoneCap,requested);}
 const eligible=Object.keys(ITEMS).filter(id=>{
  const d=ITEMS[id];
  return d?.slot&&(!slot||d.slot===slot)&&![...BLOCKED].some(flag=>d[flag])&&rankOf(id)>=0&&rankOf(id)<=target&&!exclude.includes(id);
 });
 if(!eligible.length)return null;
 const exact=eligible.filter(id=>rankOf(id)===target);
 let pool=exact.length?exact:eligible;
 const preferred=preferredBase?pool.filter(id=>ITEMS[id].base===preferredBase||ITEMS[id].slot==='chest'):[];
 if(preferred.length)pool=preferred;
 const usable=pool.filter(id=>fitsCurrentParty(id,party,target));
 if(usable.length)pool=usable;
 const favorites=ZONE_FAVORITES[biome]||[];
 const themed=pool.filter(id=>favorites.includes(id));
 // Keep named regional gear discoverable while retaining a broad shared pool.
 if(themed.length&&random()<.62)pool=themed;
 return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]||null;
}

export function lootStageForParty(party=[]){
 const level=medianLevel(party);
 return RANK_RARITY[stageRank(level)];
}

