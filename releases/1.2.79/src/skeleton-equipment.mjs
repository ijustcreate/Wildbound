export const SKELETON_COSTUME_KINDS=Object.freeze(['skeleton','archer','skeleton_unarmed','skeleton_boss','frost_skeleton_mage','skeleton_wizard']);
export const SKELETON_EQUIPMENT=Object.freeze({head:'skeleton_skull',chest:'skeleton_ribcage',gloves:'skeleton_arms',pants:'skeleton_legs',feet:'skeleton_feet'});
export const SKELETON_ARMOR_ITEMS=Object.fromEntries(Object.entries(SKELETON_EQUIPMENT).map(([slot,id])=>[id,{name:{head:'Skeleton skull',chest:'Skeleton ribcage',gloves:'Skeleton arms',pants:'Skeleton legs',feet:'Skeleton feet'}[slot],slot,base:{head:'hat',chest:'armor',gloves:'gloves',pants:'pants',feet:'boots'}[slot],stack:1,armor:0,supplyOnly:true,boneArmor:true,color:'#e0dab9',artColor:'#e0dab9',description:'Skeleton costume armor fitted to the regular human rig. Remove or replace this piece to reveal the human underneath.'}]));
export function ensureSkeletonEquipment(a){
 if(!SKELETON_COSTUME_KINDS.includes(a.kind||a.sprite)||a.skeletonEquipmentVersion===1)return a;
 const defaults={...SKELETON_EQUIPMENT};
 if(a.kind==='archer')Object.assign(defaults,{hand1:'bow',hand2:'occupied'});
 else if(a.kind==='skeleton')defaults.hand1='sword';
 else if(a.kind==='skeleton_wizard')defaults.hand1='warlock_staff';
 else if(a.kind==='frost_skeleton_mage')defaults.hand1='ice_wand';
 else if(a.kind==='skeleton_boss')Object.assign(defaults,{hand1:'sun_blade',hand2:'sun_shield'});
 a.equipment={...defaults,...a.equipment};a.skeletonEquipmentVersion=1;
 if(a.kind==='archer'){
  a.inventory??=[];
  if(!a.controlArrowsInitialized){const arrows=Number.isFinite(a.arrowsLeft)?a.arrowsLeft:36;if(arrows>0&&!a.inventory.some(i=>i?.type==='arrow'))a.inventory.push({type:'arrow',qty:arrows});a.controlArrowsInitialized=true;}
 }
 return a;
}
export const BONE_PALETTE=Object.freeze({head:'#e0dab9',headShade:'#999d87',outline:'#344039'});
