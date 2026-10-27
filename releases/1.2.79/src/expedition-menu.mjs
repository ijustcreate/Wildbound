// Illustrated skins are generated from the user's Expedition reference.
// Real controls own selection, focus and the transaction; artwork owns chrome.
export function buildExpeditionMenu({panel,member,game,select,mode,drawIcon,accept,close,highlight,details,tooltip}){
 panel.replaceChildren();panel.classList.add('expedition-menu');panel.setAttribute('aria-label','Expedition · Choose Your Adventure');
 const draft=member.expeditionDraft||={wild:!!game.houseWorldsEnabled,boundless:mode.value==='boundless',map:select.value};
 const node=(tag,cls,text,parent=panel)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;parent.append(n);return n;};
 for(const [kind,file]of [['unrolled','frame-unrolled-v1.png'],['rolled','frame-rolled-v2.png']]){const img=node('img','expedition-skin '+kind);img.src=new URL('/Wildbound/releases/1.2.78/assets/ui/expedition/'+file,import.meta.url).href;img.alt='';img.draggable=false;}
 node('h2','expedition-heading','Choose Your Adventure');
 const btn=(cls,label,fn,parent=panel)=>{const b=node('button',cls,'',parent);b.type='button';b.setAttribute('aria-label',label);b.onclick=()=>{member.focus=[...panel.querySelectorAll('button')].indexOf(b);fn();};return b;};
 const finish=()=>accept({...draft});
 const exit=btn('expedition-close','Cancel expedition choices',close);exit.textContent='×';
 node('div','expedition-adventure-label','Adventure Mode');
 const icon=(button,id)=>{const c=node('canvas','expedition-icon',null,button);c.width=c.height=64;drawIcon(c.getContext('2d'),id,0,0,64);return c;};
 const copy=(button,title,desc)=>{const wrap=node('span','expedition-copy',null,button);node('strong','',title,wrap);if(desc)node('small','',desc,wrap);};
 const wild=btn('expedition-mode expedition-wild wildbound-mode-choice','Wildbound · A connected, evolving world',()=>{draft.wild=true;draft.boundless=false;update();});icon(wild,'forest');copy(wild,'Wildbound','A connected, evolving world');
 const classic=btn('expedition-mode expedition-classic','Classic · A single destination',()=>{draft.wild=false;update();});
 const sign=node('img','expedition-sign',null,classic);sign.src=new URL('/Wildbound/releases/1.2.78/assets/ui/expedition/classic-sign-v1.png',import.meta.url).href;sign.alt='';copy(classic,'Classic','A single destination');
 for(const b of [wild,classic])node('span','expedition-check','✓',b).setAttribute('aria-hidden','true');
 const toggle=btn('expedition-boundless map-mode-toggle','Boundless World',()=>{draft.boundless=!draft.boundless;if(draft.boundless)draft.wild=false;update();});toggle.setAttribute('role','switch');copy(toggle,'Boundless World','Explore without world boundaries.');node('i','expedition-switch',null,toggle).setAttribute('aria-hidden','true');const state=node('span','expedition-switch-state','Off',toggle);
 const starting=node('section','expedition-starting');starting.setAttribute('aria-label','Starting Map');node('h3','expedition-map-heading','Starting Map',starting);
 const list=node('div','expedition-map-list map-choices',null,starting);list.setAttribute('role','group');list.setAttribute('aria-label','Choose starting map');
 for(const option of [...select.options].sort((a,b)=>a.value==='random'?1:b.value==='random'?-1:0)){const b=btn('expedition-map map-choice',option.text,()=>{draft.map=option.value;update();},list);b.dataset.map=option.value;b.dataset.mapDetail=details?.[option.value]||'';b.addEventListener('pointerenter',()=>tooltip?.(b));b.addEventListener('pointerleave',()=>tooltip?.(null));b.addEventListener('focus',()=>tooltip?.(b));icon(b,option.value);node('strong','',option.value==='random'?'Random · All ten maps':option.text,b);}
 const done=btn('expedition-accept','Accept expedition choices',finish);done.textContent='✓  Accept';
 const update=()=>{
  panel.classList.toggle('is-wildbound',draft.wild);panel.classList.toggle('is-classic',!draft.wild);
  wild.setAttribute('aria-pressed',String(draft.wild));classic.setAttribute('aria-pressed',String(!draft.wild));
  toggle.setAttribute('aria-checked',String(draft.boundless));toggle.setAttribute('aria-pressed',String(draft.boundless));toggle.setAttribute('aria-label','Boundless World '+(draft.boundless?'On':'Off'));state.textContent=draft.boundless?'On':'Off';
  starting.inert=draft.wild;starting.setAttribute('aria-hidden',String(draft.wild));
  for(const b of list.querySelectorAll('button')){b.tabIndex=draft.wild?-1:0;b.setAttribute('aria-pressed',String(b.dataset.map===draft.map));}
  // Never leave controller selection in the rolled-away map list.
  const all=[...panel.querySelectorAll('button')];if(draft.wild&&list.contains(all[member.focus]))member.focus=all.indexOf(done);
  highlight();
 };
 panel.expeditionButtons=()=>[...panel.querySelectorAll('button')].filter(b=>!b.closest('[inert]'));
 panel.expeditionNavigate=({x=0,y=0,accept=false,back=false})=>{
  if(back){close();return;}const all=[...panel.querySelectorAll('button')],visible=panel.expeditionButtons();let at=Math.max(0,visible.indexOf(all[member.focus]));
  if(x||y){at=(at+(y||x)+visible.length)%visible.length;member.focus=all.indexOf(visible[at]);highlight();}
  if(accept)visible[at]?.click();
 };
 // Open on the chosen mode; the close decoration does not steal initial focus.
 member.focus=[...panel.querySelectorAll('button')].indexOf(draft.wild?wild:classic);update();
}
