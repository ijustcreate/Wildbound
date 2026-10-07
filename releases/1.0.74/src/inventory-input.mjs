// Panel ownership is captured when opened, not inherited from global DOM focus.
export function playerInput(players,p,inputs){
 if(players.find(q=>q.device===p.device)!==p)return {};
 if(p.ui?.ownerDevice!==undefined&&p.ui.ownerDevice!==p.device)return {};
 return inputs[p.device]||{};
}
export function guardInventoryKeys(event){
 const owner=event.target.closest?.('[data-owner-device]')?.dataset.ownerDevice;
 if(owner&&owner!=='keyboard'&&['Enter',' ','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();event.stopPropagation?.();}
}
