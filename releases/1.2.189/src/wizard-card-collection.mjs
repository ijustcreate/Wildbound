export const WIZARD_CARD_COLLECTION='wizard_card_collection';
export const WIZARD_CARD_COLLECTION_SIZE=20;
export const WIZARD_CARD_COLLECTION_ITEM={
 name:'Chocolate Card Collection',base:'bag',wizardCardCollection:true,bag:{slots:WIZARD_CARD_COLLECTION_SIZE,category:'wizardCards'},
 stack:1,supplyOnly:true,rarity:'uncommon',color:'#886653',artColor:'#886653',
 description:'One album for all 20 wizard cards from Chocolate Frogs. Use to browse the collected cards.',
};

function cardIds(contents){
 return Array.isArray(contents)?contents.flatMap(card=>typeof card?.type==='string'?[card.type]:[]):[];
}

export function wizardCardIds(item){
 return item?.type===WIZARD_CARD_COLLECTION?[...new Set(cardIds(item.contents))]:[];
}

export const wizardCardCount=item=>wizardCardIds(item).length;

export function mergeWizardCardCollection(album,incoming){
 const ids=new Set([...cardIds(album.contents),...cardIds(incoming.contents)]);
 album.contents=[...ids].map(type=>({type,qty:1}));
}

export function mergeWizardCardCollectionSlots(list){
 let album;
 for(const [index,item] of (list||[]).entries()){
  if(item?.type!==WIZARD_CARD_COLLECTION)continue;
  if(!album){album=item;continue;}
  mergeWizardCardCollection(album,item);
  list[index]=null;
 }
 return album;
}
