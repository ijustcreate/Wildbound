import {count,take} from './items.mjs';
import {EMPORIUM_OWLS,PIRATE_PARROT_CAGE} from './owl-emporium.mjs';
import {activateHunterCompanion,companionReserve,newEmporiumHunterPet,ownsCompanionVariant,recordPreviewCompanions,switchHunterCompanion} from './hunter-pets.mjs';

export function emporiumOwlOffer(p,item){
 return p.ui?.alleyShop==='eeylops'&&p.ui.panel==='stock'&&Object.hasOwn(EMPORIUM_OWLS,item?.type)?EMPORIUM_OWLS[item.type]:null;
}

export function owlAdoptionReason(g,p,owl,price){
 if(p.hp<=0)return 'Recover before adopting a companion.';
 if(p.controlledFollowerId)return 'Return to your explorer before adopting a companion.';
 if(ownsCompanionVariant(p,owl.variant))return `You already have a ${owl.name}.`;
 if((p.coins||0)<price)return `You need ${price-(p.coins||0)} more gold.`;
 const t=g?.trainTest,original=t?.returnPlayers?.find(hero=>hero.id===p.id),receipt=t?.alleyPurchases?.[p.id];
 if(original&&(original.coins||0)+(receipt?.gold||0)-(receipt?.spent||0)<price)return 'Bring gold from your expedition to adopt a lasting companion.';
 return '';
}

export function purchaseEmporiumOwl(g,p,type,price){
 const pet=newEmporiumHunterPet(type,p.color),owl=EMPORIUM_OWLS[type];
 if(!owl||!pet||owlAdoptionReason(g,p,owl,price))return false;
 p.coins-=price;
 activateHunterCompanion(p,pet);
 const receipt=recordPreviewCompanions(g,p);
 if(receipt)receipt.spent+=price;
 return true;
}

export function claimEmporiumOwl(g,p,type){
 if(type===PIRATE_PARROT_CAGE)return callPirateParrot(g,p);
 const pet=newEmporiumHunterPet(type,p.color),owl=EMPORIUM_OWLS[type];
 if(!pet)return false;
 const tell=text=>{if(p.ui)p.ui.notice=text;else g.message?.(text);};
 const reason=owlAdoptionReason(g,p,owl,0);
 if(reason){tell(reason);return true;}
 if(!take(p.inventory,type))return false;
 activateHunterCompanion(p,pet);
 if(p.npcQuests?.owl_emporium?.active===type)delete p.npcQuests.owl_emporium.active;
 const receipt=recordPreviewCompanions(g,p);
 if(receipt)receipt.delta[type]=(receipt.delta[type]||0)-1;
 tell(`${owl.name} is your companion. Open Companion care to give it a name.`);
 g.uiRevision=(g.uiRevision||0)+1;
 g.persist?.();
 return true;
}

function callPirateParrot(g,p){
 if(!count(p,PIRATE_PARROT_CAGE))return false;
 const tell=text=>{if(p.ui)p.ui.notice=text;else g.message?.(text);};
 if(p.hp<=0||p.controlledFollowerId){
  tell('Return to your explorer before calling your parrot.');
  return true;
 }
 if(p.hunterPet?.owlVariant==='parrot'){
  tell(`${p.hunterPet.name} is already with you.`);
  return true;
 }
 const reserveIndex=companionReserve(p).findIndex(pet=>pet.owlVariant==='parrot');
 if(reserveIndex>=0){
  if(!switchHunterCompanion(g,p,reserveIndex))return false;
 }else{
  const pet=newEmporiumHunterPet(PIRATE_PARROT_CAGE,p.color);
  const previous=p.npcQuests?.owl_emporium?.lostParrot;
  if(previous)Object.assign(pet,previous);
  activateHunterCompanion(p,pet);
  recordPreviewCompanions(g,p);
  g.uiRevision=(g.uiRevision||0)+1;
  g.persist?.();
 }
 tell(`${p.hunterPet.name} takes wing beside you.`);
 return true;
}
