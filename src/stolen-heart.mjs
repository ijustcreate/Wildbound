export const STOLEN_HEART='stolen_heart';
export const BORGIN_HEART_PRICE=50;

export function stolenHeartOwnerKey(player){
 if(player?.profileId!==undefined&&player.profileId!==null&&player.profileId!=='')return 'profile:'+player.profileId;
 return player?.id!==undefined&&player.id!==null?'player:'+player.id:null;
}

export function stolenHeartMetadata(player){
 const ownerKey=stolenHeartOwnerKey(player);
 if(!ownerKey)return {};
 const ownerName=String(player.name||'Explorer').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,64)||'Explorer';
 return {stolenHeart:{ownerKey,ownerName}};
}

export function storedHeartMetadata(type,metadata){
 const heart=metadata?.stolenHeart;
 if(type!==STOLEN_HEART||typeof heart?.ownerKey!=='string'||!heart.ownerKey||typeof heart.ownerName!=='string'||!heart.ownerName)return {};
 return {stolenHeart:{ownerKey:heart.ownerKey,ownerName:heart.ownerName}};
}

export function ownsStolenHeart(player,item){
 const owner=stolenHeartOwnerKey(player);
 return !!owner&&item?.type===STOLEN_HEART&&item.qty===1&&item.stolenHeart?.ownerKey===owner;
}

export function stolenHeartName(item){
 if(item?.type!==STOLEN_HEART)return null;
 const ownerName=item.stolenHeart?.ownerName;
 return ownerName?`${ownerName}’s Stolen Heart`:'Stolen Heart';
}

export function dropStolenHeart(g,x,y,metadata){
 const heart=storedHeartMetadata(STOLEN_HEART,metadata);
 if(!heart.stolenHeart)return null;
 return g.dropLoot(x,y,STOLEN_HEART,1,'Borgin’s mirror',true,heart);
}
