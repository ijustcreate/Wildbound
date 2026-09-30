export function createGameDebug({getGame,events,items,give}) {
  let root, status;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const open=()=>{
    if(!root){
      root=el('section',null,'game-debug-console');
      root.style.cssText='position:fixed;z-index:1000;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100vw - 32px));max-height:80vh;overflow:auto;background:#171b2b;color:#f4eaff;border:2px solid #c76cf0;border-radius:10px;padding:18px;box-shadow:0 0 40px #5b167b;font:14px system-ui';
      const game=getGame();
      root.append(el('h2','GM field console'),el('p','Debug access: spawn events, protect the party, and inject any item. These controls are intentionally unrestricted while testing.'));
      const eventLabel=el('label','Event '),event=document.createElement('select');event.style='width:100%;margin:6px 0 12px';events.forEach((e,i)=>{const o=el('option',`${i}: ${e.name||e.kind||e.type}`);o.value=i;event.append(o);});eventLabel.append(event);root.append(eventLabel);
      const spawn=el('button','Spawn selected event');spawn.onclick=()=>{getGame().spawnEvent(Number(event.value));say('Spawned '+(events[event.value]?.name||'event'));};root.append(spawn);
      const inv=el('label','');const check=document.createElement('input');check.type='checkbox';check.onchange=()=>{for(const p of getGame().players)p.invincible=check.checked;say(check.checked?'Party invincibility enabled':'Party invincibility disabled');};inv.append(check,' Party invincible');root.append(inv);
      const itemLabel=el('label','Item '),item=document.createElement('select');item.style='width:100%;margin:6px 0 12px';Object.entries(items).filter(([,v])=>v).forEach(([id,v])=>{const o=el('option',`${v.name||id} (${id})`);o.value=id;item.append(o);});itemLabel.append(item);root.append(itemLabel);
      const amount=document.createElement('input');amount.type='number';amount.min='1';amount.value='1';amount.style='width:70px';root.append(el('span','Amount '),amount);
      const add=el('button','Add to every player');add.onclick=()=>{let n=Math.max(1,Number(amount.value)||1);for(const p of getGame().players){for(let i=0;i<n;i++)give(p.inventory,item.value);};say(`Added ${n} × ${item.value} to every player`);};root.append(add);
      const close=el('button','Close');close.style='float:right';close.onclick=()=>root.remove();root.append(close);
      status=el('p','Ready.');status.style='color:#efb6ff';root.append(status);document.body.append(root);
    } else if(!root.isConnected) document.body.append(root);
    root.querySelector('select')?.focus();
  };
  const say=text=>{if(status)status.textContent=text;};
  return {open};
}
