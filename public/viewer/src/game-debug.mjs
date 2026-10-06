import {ITEMS,give as giveItem} from './items.mjs';

export function spawnDebugItem(game,ownerId,type,amount,destination='inventory') {
 const p=game.players.find(p=>String(p.id)===String(ownerId));
 const qty=Number(amount);
 if(!p)return {ok:false,message:'No explorer is associated with this menu. Reopen it from your player.'};
 if(!ITEMS[type])return {ok:false,message:'Unknown item.'};
 if(!Number.isInteger(qty)||qty<1||qty>999)return {ok:false,message:'Choose a whole amount from 1 to 999.'};
 if(!['inventory','ground'].includes(destination))return {ok:false,message:'Choose inventory or ground.'};
 if(destination==='inventory'){
  if(!giveItem(p.inventory,type,qty))return {ok:false,message:'Backpack full. Nothing added. Free space or choose Spawn on ground.'};
 }else game.dropLoot(p.x,p.y+28,type,qty,'Dev console · '+p.name,true);
 game.uiRevision=(game.uiRevision||0)+1;game.persist();
 const where=destination==='inventory'?p.name+'’s backpack':p.room?'the ground outside your storage portal':'the ground near '+p.name;
 return {ok:true,message:`Spawned ${qty} × ${ITEMS[type].name} in ${where}.`};
}

export function createGameDebug({getGame,events,items}) {
 let root,status,target,ownerId,returnFocus;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const say=result=>{status.textContent=result.message;status.dataset.error=String(!result.ok);};
 const open=(host=document.body,opener)=>{
  returnFocus=document.activeElement;
  const game=getGame(),requested=opener?.id??opener??host.dataset.debugOwnerId;
  const owner=requested!=null?game.players.find(p=>String(p.id)===String(requested)||p.device===requested):game.players.find(p=>p.device==='keyboard')||game.current||(game.players.length===1?game.players[0]:null);
  ownerId=owner?.id;
  if(!root){
   root=el('section',null,'game-debug-console');root.setAttribute('aria-label','Developer field console');
   root.style.cssText='position:fixed;z-index:1000;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100vw - 32px));max-height:80vh;overflow:auto;padding:18px;font:14px system-ui';
   root.append(el('h2','GM field console'),el('p','Testing tools: spawn events, protect the party and create items.'));
   target=el('p',null,'debug-target');root.append(target);
   const eventLabel=el('label','Event'),event=el('select');event.dataset.debug='event';
   events.forEach((e,i)=>{const o=el('option',`${i}: ${e.name||e.kind||e.type}`);o.value=i;event.append(o);});eventLabel.append(event);root.append(eventLabel);
   const tools=el('div',null,'debug-tools'),spawn=el('button','Spawn selected event');spawn.onclick=()=>{getGame().spawnEvent(Number(event.value));say({ok:true,message:'Spawned '+(events[event.value]?.name||'event')});};tools.append(spawn);
   const inv=el('label'),check=el('input');check.type='checkbox';check.onchange=()=>{for(const p of getGame().players)p.invincible=check.checked;say({ok:true,message:check.checked?'Party invincibility enabled':'Party invincibility disabled'});};inv.append(check,' Party invincible');tools.append(inv);root.append(tools);
   const itemLabel=el('label','Item'),item=el('select');item.dataset.debug='item';
   Object.entries(items).filter(([,v])=>v).sort((a,b)=>(a[1].name||a[0]).localeCompare(b[1].name||b[0])).forEach(([id,v])=>{const o=el('option',`${v.name||id} (${id})`);o.value=id;item.append(o);});itemLabel.append(item);root.append(itemLabel);
   const amountLabel=el('label','Amount'),amount=el('input');amount.type='number';amount.min='1';amount.max='999';amount.step='1';amount.value='1';amount.dataset.debug='amount';amountLabel.append(amount);root.append(amountLabel);
   const actions=el('div',null,'debug-item-actions');
   for(const [mode,label]of [['inventory','Give to my inventory'],['ground','Spawn on ground']]){
    const b=el('button',label);b.dataset.debugSpawn=mode;b.onclick=()=>say(spawnDebugItem(getGame(),ownerId,item.value,amount.value,mode));actions.append(b);
   }
   root.append(actions);status=el('p','Ready.','debug-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
   const close=el('button','Close');close.onclick=()=>{root.remove();if(returnFocus?.isConnected)returnFocus.focus();};root.append(close);
  }
  target.textContent=owner?'Item target: '+owner.name+' · only your backpack is changed':'No player selected. Reopen this menu from your explorer.';
  status.textContent='Choose an item, amount and destination.';status.dataset.error='false';
  host.append(root);root.querySelector('select')?.focus();
 };
 return {open};
}
