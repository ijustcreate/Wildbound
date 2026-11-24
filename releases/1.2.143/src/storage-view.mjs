export const STORAGE_VIEW={x:15,y:25,width:290,height:197};
export const STORAGE_CHROME=68;
export const privateStorageRoom=(game,p)=>{const d=game.portals?.find(d=>d.id===p.room);return !!(d&&!d.oldWell&&!d.temple);};
export function storageRoomRepresentative(game,p){
 return !privateStorageRoom(game,p)||game.players.find(q=>q.room===p.room&&!q.ui)?.id===p.id;
}
export function storagePanelBox(game,p,bounds,rail){
 const shared=game.players.length>0&&game.players.every(q=>q.room===p.room);
 const maxWidth=shared?960:Math.max(1,Math.min(420,bounds.width*.32,rail.width));
 const maxHeight=Math.max(1,Math.min(shared?760:rail.height,bounds.height-36));
 const width=Math.max(1,Math.min(maxWidth,bounds.width-36,(maxHeight-STORAGE_CHROME)*290/197+18));
 const height=Math.min(maxHeight,(width-18)*197/290+STORAGE_CHROME);
 return {...rail,width,height,side:shared?'center':rail.side,x:shared?(bounds.width-width)/2:rail.side==='left'?18:bounds.width-width-18,y:Math.max(18,(bounds.height-height)/2)};
}
export function storageRoomCamera(game,p,width,height,zoom){
 // Fit the actual room artwork, excluding the old empty canvas margins.
 return {x:160,y:123.5,zoom:Math.max(width/STORAGE_VIEW.width,height/STORAGE_VIEW.height)};
}
