import {playerInput} from './inventory-input.mjs';
import {tickStorageRoom} from './storage-room.mjs';

// Real heroes own the storage and UI. Practice clones must never own chest edits.
export function tickLobbyStorage(game,practice,state,inputs,dt){
  const members=state.members,players=game.players.filter(p=>members.get(p.id)?.spawned);
  const worldDoors=game.portals.filter(d=>!d.lobby);
  const context=Object.create(game);
  context.portals=game.portals.filter(d=>d.lobby);
  context.blocked=(...args)=>practice.blocked?.(...args)??false;
  context.message=text=>game.message(text);
  let changed=false;
  context.persist=()=>{changed=true;};
  const originals=players.map(p=>{
    const s=members.get(p.id),world=s.storageWorldPosition||{x:p.x,y:p.y};
    // The room's visible Return button can leave between simulation frames.
    if(s.storageRoom&&!p.room){s.x=p.x;s.y=p.y;s.inventoryRelease=true;}
    p.x=s.x;p.y=s.y;
    return {p,s,world,room:p.room};
  });
  try{
    for(const d of [...context.portals])if(d.closing!==null){
      d.closing-=dt;
      if(d.closing<=0){for(const p of players.filter(p=>p.room===d.id))context.leaveRoom(p,true);context.portals=context.portals.filter(q=>q!==d);}
    }
    for(const {p,s} of originals){
      if(s.panel||p.lobbyDisconnected)continue;
      const input=playerInput(game.players,p,inputs),edge=key=>!!input[key]&&!s.held[key];
      if(!p.ui&&!p.room&&p.hp>0)for(const door of context.portals){
        door.entryReady||=[];
        const distance=Math.hypot(p.x-door.x,p.y-door.y);
        if(distance>34&&!door.entryReady.includes(p.id))door.entryReady.push(p.id);
        if(distance<=26&&door.entryReady.includes(p.id)){context.enterRoom(p,door);break;}
      }
      if(edge('portal')&&!p.ui&&(p.room||!s.inventoryRelease)){
        if(!p.room){p.faceX=s.faceX;p.faceY=s.faceY;}
        context.portal(p);
        for(const door of context.portals)door.lobby=true;
        state.invalidate(game.players);
      }
      if(p.room&&!p.ui){tickStorageRoom(context,p,input,dt,edge('interact')||edge('lobbyInteract'));if(p.ui){s.storageUiOpened=true;s.inventoryRelease=true;}}
      for(const order of p.vendingOrders||[])if(!order.ready){order.elapsed+=dt;if(order.elapsed>=1.6){order.ready=true;changed=true;}}
    }
  }finally{
    game.portals=[...worldDoors,...context.portals];game.nextId=context.nextId;
    for(const {p,s,world,room} of originals){
      if(p.room&&!s.storageRoom){s.storageWorldPosition=world;state.invalidate(game.players);}
      if(!p.room&&(room||s.storageRoom)){s.x=p.x;s.y=p.y;s.inventoryRelease=true;delete s.storageWorldPosition;}
      s.storageRoom=p.room;
      p.x=world.x;p.y=world.y;
    }
  }
  // Persist only after restoring expedition coordinates and the real portal list.
  if(changed)game.persist();
}
