import {ITEMS,SLOTS,socketCount,socketTrinket,removeTrinket,gearStat} from './items.mjs';
export function socketTarget(p){const s=p.ui?.socket;if(!s)return null;return s.target.mode==='gear'?{type:p.equipment[s.target.slot],sockets:p.equipmentSockets?.[s.target.slot]||[]}:p.inventory[s.target.index];}
export function socketChoices(p){const item=socketTarget(p);if(!item)return [];const filled=(item.sockets||[]).map((type,index)=>({kind:'remove',type,index}));
 return [...filled,...((item.sockets||[]).length<socketCount(item.type)?p.inventory.flatMap((g,index)=>ITEMS[g?.type]?.trinket?[{kind:'insert',type:g.type,index}]:[]):[])];}
export function socketAction(g,p,action){
 const u=p.ui;
 if(!u.socket){
  if(action!=='sockets'&&action!=='offhand')return false;
  const type=u.panel==='gear'?p.equipment[SLOTS[u.index]]:u.panel==='pack'?p.inventory[u.index]?.type:null;
  if(!socketCount(type))return action==='sockets';
  u.socket={target:u.panel==='gear'?{mode:'gear',slot:SLOTS[u.index]}:{mode:'pack',index:u.index},type,index:0};u.notice='';g.uiRevision=(g.uiRevision||0)+1;return true;
 }
 const s=u.socket,item=socketTarget(p);if(item?.type!==s.type){delete u.socket;return true;}
 const choices=socketChoices(p);
 if(action==='close'){if(s.confirm)s.confirm=false;else delete u.socket;}
 else if(['next','down','prev','up'].includes(action)){s.confirm=false;s.index=(s.index+(['next','down'].includes(action)?1:-1)+Math.max(1,choices.length))%Math.max(1,choices.length);}
 else if(action.startsWith('socketSelect:')){s.index=Math.max(0,Math.min(choices.length-1,Number(action.split(':')[1])||0));s.confirm=false;}
 else if(action==='use'){
  const choice=choices[s.index];if(!choice){u.notice='Find a mana trinket or craft one in Field Kit.';}
  else if(!s.confirm)s.confirm=true;
  else{const ok=choice.kind==='insert'?socketTrinket(p,s.target,choice.index):removeTrinket(p,s.target,choice.index);u.notice=ok?(choice.kind==='insert'?'Trinket socketed.':'Trinket returned to backpack.'):'No change: make room in your backpack, or split this gear stack first.';s.confirm=false;s.index=0;if(ok){g.onSound?.('loot',p);g.persist();}}
 }
 g.uiRevision=(g.uiRevision||0)+1;return true;
}
export function drawSocketWorkshop(panel,g,p,button,el){
 const s=p.ui.socket,item=socketTarget(p);if(!item)return;
 const root=el('section',null,'socket-workshop'),choices=socketChoices(p),choice=choices[s.index],mana=gearStat(item.type,item.sockets,'maxMana');
 root.append(el('h2',ITEMS[item.type].name),el('p',`${(item.sockets||[]).length} / ${socketCount(item.type)} sockets · Item mana +${mana}`));
 const slots=el('div',null,'socket-slots');for(let i=0;i<socketCount(item.type);i++)slots.append(el('span',item.sockets?.[i]?`◆ ${ITEMS[item.sockets[i]]?.name}`:'◇ Empty'));root.append(slots);
 root.append(el('p','D-pad: choose · A / Enter: select, then confirm · B / Esc: back. Removing a trinket is free.'));
 const list=el('div',null,'socket-choices');choices.forEach((c,i)=>{const b=button(`${c.kind==='insert'?'Insert':'Remove'} ${ITEMS[c.type].name} · ${c.kind==='insert'?'+':'−'}${ITEMS[c.type].maxMana} mana`,'socket-'+i,()=>g.inventoryAction(p,'socketSelect:'+i));b.classList.toggle('selected',i===s.index);list.append(b);});root.append(list);
 if(!choices.length)root.append(el('p','No trinkets in your backpack. Craft mana trinkets in Field Kit or find them in enemy loot.'));
 if(choice){const next=mana+(choice.kind==='insert'?1:-1)*ITEMS[choice.type].maxMana;root.append(el('strong',`Item mana: +${mana} → +${next}`, 'socket-preview'));
  if(s.target.mode==='pack')root.append(el('p','Character stats change when this item is equipped.'));
  root.append(button(s.confirm?'Confirm '+(choice.kind==='insert'?'insertion':'removal'):'Choose trinket','socket-confirm',()=>g.inventoryAction(p,'use')));}
 root.append(button(s.confirm?'Cancel':'Back to equipment','socket-back',()=>g.inventoryAction(p,'close')),el('p',p.ui.notice||''));panel.append(root);
 list.querySelector('.selected')?.scrollIntoView({block:'nearest'});
}
