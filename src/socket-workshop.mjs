import {ITEMS,SLOTS,socketCount,socketTrinket,removeTrinket,gearStat} from './items.mjs';
import {drawItem} from './item-art.mjs';
import {controllerButtonNames} from './controls.mjs';
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
 root.setAttribute('aria-label','Trinket sockets');
 const icon=type=>{const canvas=el('canvas');canvas.width=32;canvas.height=32;canvas.setAttribute('aria-hidden','true');drawItem(canvas.getContext('2d'),type,16,16,28);return canvas;};
 const title=el('header',null,'socket-heading'),name=el('div');
 name.append(el('small','TRINKET SOCKETS'),el('h2',ITEMS[item.type].name),el('span',s.target.mode==='gear'?'Equipped':'In backpack'));
 title.append(icon(item.type),name);root.append(title);
 const slots=el('div',null,'socket-slots');
 for(let i=0;i<socketCount(item.type);i++){
  const type=item.sockets?.[i],slot=el('div',null,'socket-slot');
  if(type)slot.append(icon(type));else slot.append(el('span','+','socket-empty'));
  slot.append(el('span',type?ITEMS[type]?.name:'Empty socket'));slots.append(slot);
 }
 root.append(slots);
 const heading=el('header',null,'socket-list-heading');heading.append(el('strong','Trinkets'),el('span',`${item.sockets?.length||0} / ${socketCount(item.type)} filled`));root.append(heading);
 const list=el('div',null,'socket-choices');list.setAttribute('aria-label','Available trinket actions');
 choices.forEach((c,i)=>{
  const b=button('','socket-'+i,()=>g.inventoryAction(p,'socketSelect:'+i));
  b.classList.toggle('selected',i===s.index);b.setAttribute('aria-pressed',String(i===s.index));
  const label=el('span',null,'socket-choice-name');label.append(el('strong',ITEMS[c.type].name),el('small',c.kind==='insert'?'Insert from backpack':'Remove to backpack'));
  b.append(icon(c.type),label,el('span',`${c.kind==='insert'?'+':'-'}${ITEMS[c.type].maxMana} mana`,'socket-delta'));list.append(b);
 });
 if(!choices.length)list.append(el('p','No available trinkets','socket-empty-state'));root.append(list);
 const preview=el('div',null,'socket-preview');preview.setAttribute('aria-live','polite');
 const next=choice?mana+(choice.kind==='insert'?1:-1)*ITEMS[choice.type].maxMana:mana;
 preview.append(el('span','ITEM MANA'),el('strong',`+${mana}  →  +${next}`));root.append(preview);
 if(s.confirm&&choice){const confirmation=el('p',`${choice.kind==='insert'?'Insert':'Remove'} ${ITEMS[choice.type].name}?`,'socket-confirmation');confirmation.setAttribute('role','status');root.append(confirmation);}
 const keys=p.device==='keyboard'?['Enter','Esc']:controllerButtonNames(p.controllerFamily||'generic');
 const actions=el('footer',null,'socket-actions');
 const accept=button(`${keys[0]} · ${s.confirm?'Confirm':choice?.kind==='remove'?'Remove trinket':'Insert trinket'}`,'socket-confirm',()=>g.inventoryAction(p,'use'));accept.disabled=!choice;
 actions.append(accept,button(`${keys[1]} · ${s.confirm?'Cancel':'Back'}`,'socket-back',()=>g.inventoryAction(p,'close')));root.append(actions);
 const notice=el('p',p.ui.notice||'','socket-notice');notice.setAttribute('role','status');root.append(notice);panel.append(root);
 list.querySelector('.selected')?.scrollIntoView({block:'nearest'});
}
