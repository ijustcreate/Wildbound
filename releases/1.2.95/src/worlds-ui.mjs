import {BUILTIN_PACKS,advanceWorld,WORLD_DAY,simulationTier} from './world-simulation.mjs';
export function mountWorldsUI({getGame,create,load,save,action,onOpen,onClose,chooseParty}) {
  const dialog=document.createElement('dialog');dialog.id='worlds-dialog';
  dialog.innerHTML=`<header><div><small>WILDBOUND · OFFLINE WORLDS</small><h2>Your living worlds</h2></div><button data-world-close>Close</button></header>
    <p>Worlds live on this computer. No account, internet connection or running server is needed. One real minute advances one world hour, including time away.</p>
    <div class="worlds-columns"><section><h3>Create an ecosystem</h3><label>World name<input data-world-name maxlength="80" value="My Wildbound World"></label><label>Content pack<select data-world-pack></select></label><p data-pack-description></p><label>World seed<input data-world-seed type="number" step="1" value="8675309"></label><button data-world-create>Create & explore</button><button data-world-party>Choose explorers in lobby</button><button data-world-import>Install content pack…</button><button data-world-folder>Open save folder</button></section>
    <section><h3>Saved worlds</h3><div data-world-list></div><p data-world-notice role="status" aria-live="polite"></p></section></div>
    <section data-world-inspector hidden><h3 data-world-title></h3><p data-world-clock></p><div class="worlds-actions"><button data-world-save>Save world now</button><button data-world-nest>Search local nests</button><button data-world-trade>Visit settlement trader</button><button data-world-repair>Repair settlement</button></div><details><summary>Simulation test controls</summary><p>Advance this world by one day to test regrowth, populations and director events. This changes the saved world.</p><button data-world-day>Advance one world day</button></details><div class="worlds-regions"></div><h3>Recent world events</h3><ol data-world-events></ol><p data-world-quests></p></section>`;
  document.body.append(dialog);const $=s=>dialog.querySelector(s),notice=text=>{$('[data-world-notice]').textContent=text;};
  let packs=BUILTIN_PACKS,busy=false;
  const run=async fn=>{if(busy)return;busy=true;for(const b of dialog.querySelectorAll('button'))b.disabled=true;try{await fn();}catch(e){notice(e.message);}finally{busy=false;for(const b of dialog.querySelectorAll('button'))b.disabled=false;}};
  const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
  async function list(){
    packs=window.desktop?.listWorldPacks?await window.desktop.listWorldPacks():BUILTIN_PACKS;
    const select=$('[data-world-pack]'),prior=select.value;select.replaceChildren();
    for(const pack of packs){const option=text('option',pack.name);option.value=pack.id;select.append(option);}if(packs.some(p=>p.id===prior))select.value=prior;
    select.onchange=()=>{$('[data-pack-description]').textContent=packs.find(p=>p.id===select.value)?.description||'';};select.onchange();
    const records=window.desktop?.listWorlds?await window.desktop.listWorlds():JSON.parse(localStorage.getItem('wildbound-world-index')||'[]');
    const root=$('[data-world-list]');root.replaceChildren();
    if(!records.length)root.append(text('p','No local worlds yet. Choose explorers, then create your first world.'));
    for(const record of records){
      const row=document.createElement('article');row.append(text('strong',record.name));
      row.append(text('p',record.error?'Save needs recovery: '+record.error:`${record.pack} · seed ${record.seed} · ${record.regions} region(s)`));
      const button=text('button','Explore saved world');button.disabled=!!record.error;
      button.onclick=()=>run(async()=>{await load(record.id);notice('World loaded from this computer.');inspect();await list();});row.append(button);root.append(row);
    }
  }
  function inspect(){
    const g=getGame(),s=g.localWorld;$('[data-world-inspector]').hidden=!s;if(!s)return;
    $('[data-world-title]').textContent=s.name+' · '+s.pack.name;
    $('[data-world-clock]').textContent=`Day ${1+Math.floor(s.seconds/WORLD_DAY)} · hour ${Math.floor(s.seconds/3600)%24} · seed ${s.seed} · ${g.saving?'saving…':g.saveError?'Save error: '+g.saveError:'local autosave every five seconds'}`;
    const root=$('.worlds-regions');root.replaceChildren();
    const table=document.createElement('table'),head=document.createElement('tr');
    for(const v of ['Region','Simulation','Prey','Predators','Food','Water','Weather','Shelter'])head.append(text('th',v));table.append(head);
    for(const [key,r]of Object.entries(s.regions).slice(-24)){
      const row=document.createElement('tr');
      for(const v of [key,simulationTier(r,g.players),Math.floor(r.prey),r.predators.toFixed(1),Math.round(r.food*100)+'%',Math.round(r.water*100)+'%',r.weather,Math.round(r.settlement.condition*100)+'%'])row.append(text('td',String(v)));table.append(row);
    }root.append(table);
    const history=$('[data-world-events]');history.replaceChildren();
    for(const e of s.events.slice(-12).reverse())history.append(text('li',`Day ${1+Math.floor(e.hour/24)} · ${e.region} · ${e.type.replaceAll('-',' ')}`));
    if(!s.events.length)history.append(text('li','Explore, harvest, or advance a day to leave history.'));
    $('[data-world-quests]').textContent=(s.pack.quests||[]).map(q=>`${q.name}: ${s.quests[q.id]?.progress||0}/${q.target}${s.quests[q.id]?.completed?' · complete':''}`).join(' · ');
  }
  $('[data-world-create]').onclick=()=>run(async()=>{const pack=packs.find(p=>p.id===$('[data-world-pack]').value);await create({name:$('[data-world-name]').value,seed:Number($('[data-world-seed]').value),pack});notice('World created and saved. Close this panel to explore.');inspect();await list();});
  $('[data-world-save]').onclick=()=>run(async()=>{await save();notice('Saved successfully.');inspect();await list();});
  for(const [selector,id]of [['nest','nest'],['trade','trade'],['repair','repair']])$(`[data-world-${selector}]`).onclick=()=>run(async()=>{notice(await action(id));inspect();});
  $('[data-world-day]').onclick=()=>run(async()=>{const g=getGame();if(!g.localWorld)return;advanceWorld(g.localWorld,WORLD_DAY);await save();notice('Advanced one world day and saved.');inspect();});
  $('[data-world-import]').onclick=()=>run(async()=>{if(!window.desktop?.importWorldPack)throw Error('Pack installation requires the desktop build.');const p=await window.desktop.importWorldPack();if(p){notice('Installed '+p.name+'. New worlds can now use this pack.');await list();}});
  $('[data-world-folder]').onclick=()=>run(async()=>{if(!window.desktop?.openWorldFolder)throw Error('Browser worlds use this browser’s local storage.');await window.desktop.openWorldFolder();});
  $('[data-world-party]').onclick=()=>{dialog.close();chooseParty();};
  $('[data-world-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',onClose);
  const open=async()=>{if(dialog.open)return;onOpen();dialog.showModal();notice('');try{await list();inspect();}catch(e){notice(e.message);}};
  return {open,inspect,dialog};
}
