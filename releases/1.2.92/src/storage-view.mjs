import {centeredPopupBox} from './player-panel-layout.mjs';
export const privateStorageRoom=(game,p)=>{const d=game.portals?.find(d=>d.id===p.room);return !!(d&&!d.oldWell&&!d.temple);};
export function storageRoomRepresentative(game,p){
 return !privateStorageRoom(game,p)||game.players.find(q=>q.room===p.room&&!q.ui)?.id===p.id;
}
export function storagePanelBox(game,p,bounds,rail){
 const shared=game.players.length>0&&game.players.every(q=>q.room===p.room);
 if(shared)return {...centeredPopupBox(bounds.width,bounds.height,960,760,18),side:'center'};
 const width=Math.max(1,Math.min(420,bounds.width*.32,rail.width)),height=Math.min(rail.height,bounds.height-36,760);
 return {...rail,width,height,x:rail.side==='left'?18:bounds.width-width-18,y:Math.max(18,(bounds.height-height)/2)};
}
export function storageRoomCamera(game,p,width,height,zoom){
 const members=game.players.filter(q=>q.room===p.room),xs=members.map(q=>q.roomX),ys=members.map(q=>q.roomY);
 const clampCenter=(value,size,span)=>span>=size?size/2:Math.max(span/2,Math.min(size-span/2,value));
 return {x:clampCenter((Math.min(...xs)+Math.max(...xs))/2,320,width/zoom),y:clampCenter((Math.min(...ys)+Math.max(...ys))/2,240,height/zoom),zoom};
}
