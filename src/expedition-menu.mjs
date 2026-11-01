// Illustrated skins are generated from the user's Expedition reference.
// Real controls own selection, focus and the transaction; artwork owns chrome.
export function buildExpeditionMenu({panel,member,game,select,mode,drawIcon,accept,close,highlight,details,tooltip}){
 panel.replaceChildren();panel.classList.add('expedition-menu');panel.setAttribute('aria-label','Expedition · Choose Your Adventure');
 const draft=member.expeditionDraft||={wild:!!game.houseWorldsEnabled,boundless:mode.value==='boundless',map:select.value};
 const node=(tag,cls,text,parent=panel)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;parent.append(n);return n;};
 for(const [kind,file]of [['unrolled','frame-unrolled-v1.png'],['rolled','frame-rolled-v2.png']]){const img=node('img','expedition-skin '+kind);img.src=new URL('../assets/ui/expedition/'+file,import.meta.url).href;img.alt='';img.draggable=false;}
 node('h2','expedition-heading','Choose Your Adventure');
 const btn=(cls,label,fn,parent=panel)=>{const b=node('button',cls,'',parent);b.type='button';b.setAttribute('aria-label',label);b.onclick=()=>{member.focus=[...panel.querySelectorAll('button')].indexOf(b);fn();};return b;};
 const finish=()=>accept({...draft});
 const exit=btn('expedition-close','Cancel expedition choices',close);exit.textContent='×';
 node('div','expedition-adventure-label','Adventure Mode');
 const icon=(button,id)=>{const c=node('canvas','expedition-icon',null,button);c.width=c.height=64;drawIcon(c.getContext('2d'),id,0,0,64);return c;};
 const copy=(button,title,desc)=>{const wrap=node('span','expedition-copy',null,button);node('strong','',title,wrap);if(desc)node('small','',desc,wrap);};
 const wild=btn('expedition-mode expedition-wild wildbound-mode-choice','Wildbound · A connected, evolving world',()=>{draft.wild=true;draft.boundless=false;update();});icon(wild,'forest');copy(wild,'Wildbound','A connected, evolving world');
 const classic=btn('expedition-mode expedition-classic','Classic · A single destination',()=>{draft.wild=false;update();});
 const sign=node('img','expedition-sign',null,classic);sign.src=new URL('../assets/ui/expedition/classic-sign-v1.png',import.meta.url).href;sign.alt='';copy(classic,'Classic','A single destination');
 for(const b of [wild,classic])node('span','expedition-check','✓',b).setAttribute('aria-hidden','true');
 const toggle=btn('expedition-boundless map-mode-toggle','Boundless World',()=>{draft.boundless=!draft.boundless;if(draft.boundless)draft.wild=false;update();});toggle.setAttribute('role','switch');copy(toggle,'Boundless World','Explore without world boundaries.');node('i','expedition-switch',null,toggle).setAttribute('aria-hidden','true');const state=node('span','expedition-switch-state','Off',toggle);
 const starting=node('section','expedition-starting');starting.setAttribute('aria-label','Starting Map');node('h3','expedition-map-heading','Starting Map',starting);
 const list=node('div','expedition-map-list',null,starting);list.setAttribute('role','group');list.setAttribute('aria-label','Choose starting map');
 const preview=node('div','expedition-map-preview',null,starting),previewName=node('strong','expedition-map-name','',preview),previewDetail=node('span','expedition-map-detail','',preview);
 const options=[...select.options].sort((a,b)=>a.value==='random'?1:b.value==='random'?-1:0);
 const optionName=option=>option.value==='random'?'Random':option.text;
 const describe=option=>details?.[option.value]||(option.value==='random'?'Choose a surprise destination.':'Explore '+optionName(option)+'.');
 const revealMap=button=>{if(!button||!list.contains(button))return;const box=list.getBoundingClientRect(),row=button.getBoundingClientRect(),scale=list.offsetHeight?box.height/list.offsetHeight:1,top=box.top+(list.clientTop+3)*scale,bottom=box.top+(list.clientTop+list.clientHeight-3)*scale;if(row.bottom>bottom)list.scrollTop+=(row.bottom-bottom)/scale;else if(row.top<top)list.scrollTop-=(top-row.top)/scale;};
 const showPreview=option=>{if(!option)return;previewName.textContent=optionName(option);previewDetail.textContent=describe(option);};
 const selectedOption=()=>options.find(option=>option.value===draft.map)||options[0];
 for(const option of options){const label=optionName(option),b=btn('expedition-map map-choice',label,()=>{draft.map=option.value;select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));update();showPreview(option);},list);b.dataset.map=option.value;b.dataset.mapName=label;b.dataset.mapDetail=describe(option);b.setAttribute('aria-label',`${label}. ${describe(option)}`);b.title=label;b.addEventListener('pointerenter',()=>{showPreview(option);tooltip?.(b);});b.addEventListener('pointerleave',()=>{tooltip?.(null);if(!list.querySelector(':focus'))showPreview(selectedOption());});b.addEventListener('focus',()=>{showPreview(option);tooltip?.(b);});b.addEventListener('blur',()=>{tooltip?.(null);if(!list.matches(':hover'))showPreview(selectedOption());});icon(b,option.value);copy(b,label);node('span','expedition-map-selected','✓',b).setAttribute('aria-hidden','true');}
 const done=btn('expedition-accept','Accept expedition choices',finish);done.textContent='✓  Accept';
 const update=()=>{
  panel.classList.toggle('is-wildbound',draft.wild);panel.classList.toggle('is-classic',!draft.wild);
  wild.setAttribute('aria-pressed',String(draft.wild));classic.setAttribute('aria-pressed',String(!draft.wild));
  toggle.setAttribute('aria-checked',String(draft.boundless));toggle.setAttribute('aria-pressed',String(draft.boundless));toggle.setAttribute('aria-label','Boundless World '+(draft.boundless?'On':'Off'));state.textContent=draft.boundless?'On':'Off';
  panel.dataset.mapPreview=draft.wild?'house':draft.map;
  starting.inert=draft.wild;starting.setAttribute('aria-hidden',String(draft.wild));
  for(const b of list.querySelectorAll('button')){b.tabIndex=draft.wild?-1:0;b.setAttribute('aria-pressed',String(b.dataset.map===draft.map));}
  showPreview(selectedOption());revealMap(list.querySelector(`[data-map="${CSS.escape(draft.map)}"]`));
  // Never leave controller selection in the rolled-away map list.
  const all=[...panel.querySelectorAll('button')];if(draft.wild&&list.contains(all[member.focus]))member.focus=all.indexOf(done);
  highlight();
 };
 panel.expeditionButtons=()=>[...panel.querySelectorAll('button')].filter(b=>!b.closest('[inert]'));
 panel.expeditionNavigate=({x=0,y=0,accept=false,back=false})=>{
  if(back){close();return;}const all=[...panel.querySelectorAll('button')],visible=panel.expeditionButtons();let at=Math.max(0,visible.indexOf(all[member.focus]));
  if(x||y){const current=visible[at],maps=[...list.querySelectorAll('button')],mapIndex=maps.indexOf(current);let next;if(mapIndex>=0){next=spatialNeighbor(visible,current,x,y);}else if(y>0&&current===classic)next=toggle;else if(y>0&&current===toggle)next=maps[0];else if(y<0&&current===maps[0])next=toggle;else if(y<0&&current===done)next=maps.at(-1);else next=spatialNeighbor(visible,current,x,y);member.focus=all.indexOf(next);revealMap(next);highlight();}
  if(accept)visible[at]?.click();
 };
 // Open on the chosen mode; the close decoration does not steal initial focus.
 member.focus=[...panel.querySelectorAll('button')].indexOf(draft.wild?wild:classic);update();
}

function spatialNeighbor(buttons,current,x,y){
 if(!current||(!x&&!y))return current;
 const rect=current.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
 let nearest=current,best=Infinity;
 for(const button of buttons){if(button===current||button.disabled||!button.getClientRects().length)continue;const box=button.getBoundingClientRect(),dx=box.left+box.width/2-cx,dy=box.top+box.height/2-cy,forward=x?dx*x:dy*y;if(forward<=2)continue;const cross=x?Math.abs(dy):Math.max(0,box.left-(rect.left+rect.width),rect.left-(box.left+box.width))+Math.abs(dx)*.01,score=forward+cross*3;if(score<best){best=score;nearest=button;}}
 return nearest;
}
