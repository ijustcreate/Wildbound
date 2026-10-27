// One view per actual room instance, not one view per controller. Personal
// inventory remains independent; the live surface world always stays behind.
export function isSharedWorldRoom(game,player){
 const portal=game.portals?.find(d=>d.id===player.room);return !!(player.room&&(portal?.temple||portal?.oldWell));
}
export function sharedRoomGroups(game){
 const groups=new Map();
 for(const p of game.players||[]){if(!isSharedWorldRoom(game,p))continue;
  let group=groups.get(p.room);if(!group){group={id:p.room,portal:game.portals.find(d=>d.id===p.room),players:[]};groups.set(p.room,group);}group.players.push(p);
 }
 return [...groups.values()];
}
export function roomWindowLayout(groups,width,height){
 const mx=Math.max(8,width*.12),my=Math.max(8,height*.1),gap=8,columns=groups.length>1?2:1,rows=Math.ceil(groups.length/columns);
 const w=(width-mx*2-gap*(columns-1))/columns,h=(height-my*2-gap*(rows-1))/Math.max(1,rows);
 return groups.map((group,i)=>({...group,x:mx+i%columns*(w+gap),y:my+Math.floor(i/columns)*(h+gap),width:w,height:h}));
}
export function sharedRoomCamera(players,width,height,preferredZoom=2.6){
 const xs=players.map(p=>p.roomX),ys=players.map(p=>p.roomY);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 return {focus:{roomX:(minX+maxX)/2,roomY:(minY+maxY)/2},zoom:Math.max(.1,Math.min(preferredZoom,width/(maxX-minX+100),height/(maxY-minY+110)))};
}
