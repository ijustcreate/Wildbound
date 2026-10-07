import { HAIR_STYLES, FACE_STYLES } from './appearance.mjs';
import { drawCreationPreview, creationFamily, creationButtonLabels, creationHelp } from './creation-preview.mjs';
import { openControllerKeyboard } from './controller-keyboard.mjs';
import { characterNameError, suggestCharacterName } from './profiles.mjs';

export const CREATION_COLORS = [
  ['Ivory','#f2d6b3'], ['Sand','#d9ab76'], ['Copper','#a86c48'], ['Umber','#54372c'],
  ['Rose','#ba5867'], ['Ember','#dc814a'], ['Gold','#dec26a'], ['Moss','#829753'],
  ['Forest','#39745b'], ['Lagoon','#479d98'], ['Sky','#629fca'], ['Indigo','#6267ab'],
  ['Plum','#976692'], ['Silver','#d9d4ba'], ['Ink','#272c35'],
];
export function wheelColor(x,y,value=1) {
  const hue=(Math.atan2(y,x)/Math.PI/2+1)%1, saturation=Math.min(1,Math.hypot(x,y));
  const channel=n=>{const k=(n+hue*6)%6;return Math.round(255*value*(1-saturation*Math.max(0,Math.min(k,4-k,1)))).toString(16).padStart(2,'0');};
  return '#'+channel(5)+channel(3)+channel(1);
}
export function colorWheelPoint(color) {
  const [r,g,b]=color.slice(1).match(/../g).map(v=>parseInt(v,16)/255);
  const max=Math.max(r,g,b),delta=max-Math.min(r,g,b);
  const hue=delta===0?0:(max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4)*Math.PI/3;
  const saturation=max?delta/max:0;
  return {x:Math.cos(hue)*saturation,y:Math.sin(hue)*saturation,value:max};
}

export function buildCreationMenu({panel,state:s,profiles,presets,player,onCreate,onBack}) {
  panel.classList.add('creation-menu');
  panel.dataset.controllerFamily=creationFamily(player||{device:panel.dataset.ownerDevice});
  const look=s.creationLook ||= structuredClone(presets[0]);
  s.creationName ??= suggestCharacterName(profiles.data.heroes);
  const body=document.createElement('div');body.className='creation-body';panel.append(body);
  const add=(label,fn,parent=body)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;parent.append(b);return b;};
  const nameRow=document.createElement('div');nameRow.className='creation-name';body.append(nameRow);
  const input=document.createElement('input');input.value=s.creationName;input.maxLength=20;input.setAttribute('aria-label','Explorer name');input.oninput=()=>s.creationName=input.value;nameRow.append(input);
  add('Edit',()=>openControllerKeyboard(input),nameRow).setAttribute('aria-label','Edit explorer name');
  const art=document.createElement('canvas');art.width=240;art.height=116;art.setAttribute('aria-label','Explorer appearance preview');body.append(art);
  const preview=()=>{const time=performance.now()/1000;drawCreationPreview(art.getContext('2d'),look,{width:art.width,height:art.height,time});if(popupPreview)drawCreationPreview(popupPreview.getContext('2d'),look,{width:popupPreview.width,height:popupPreview.height,mode:popupMode,direction:popupDirection,time});};
  const refreshers=[];
  const refresh=()=>{preview();refreshers.forEach(fn=>fn());};
  let popup=null,opener=null,popupFocus=0,wheel=null,popupPreview=null,popupMode='full',popupDirection=0;
  const buttons=()=>[...(popup||body).querySelectorAll('button')];
  const highlight=()=>{const list=buttons();let index=popup?popupFocus:s.focus;index=Math.max(0,Math.min(index,list.length-1));if(popup)popupFocus=index;else s.focus=index;panel.querySelectorAll('button').forEach(b=>b.classList.remove('lobby-focus'));list[index]?.classList.add('lobby-focus');list[index]?.scrollIntoView({block:'nearest'});};
  const close=()=>{popup?.remove();popup=null;wheel=null;popupPreview=null;body.inert=false;highlight();opener?.focus({preventScroll:true});};
  const open=(title,source)=>{
    popup?.remove();wheel=null;popupPreview=null;opener=source;body.inert=true;popupFocus=0;
    popup=document.createElement('div');popup.className='creation-popup';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',title);
    const h=document.createElement('h3');h.textContent=title;popup.append(h);panel.append(popup);return popup;
  };
  const showWheel=(key,source)=>{
    const box=open('Custom color',source),point=colorWheelPoint(look[key]);
    const canvas=document.createElement('canvas');canvas.width=200;canvas.height=200;canvas.className='creation-wheel';canvas.setAttribute('aria-label','Color spectrum. Arrow keys move the pointer; Enter chooses.');box.append(canvas);
    const c=canvas.getContext('2d'),base=c.createImageData(200,200);
    const paint=()=>{
      for(let y=0;y<200;y++)for(let x=0;x<200;x++) {const dx=(x-100)/96,dy=(y-100)/96,i=(y*200+x)*4;if(Math.hypot(dx,dy)>1)continue;const color=wheelColor(dx,dy,point.value);base.data[i]=parseInt(color.slice(1,3),16);base.data[i+1]=parseInt(color.slice(3,5),16);base.data[i+2]=parseInt(color.slice(5,7),16);base.data[i+3]=255;}
      c.putImageData(base,0,0);c.beginPath();c.arc(100+point.x*96,100+point.y*96,5,0,Math.PI*2);c.lineWidth=4;c.strokeStyle='#172b27';c.stroke();c.lineWidth=2;c.strokeStyle='#ffffff';c.stroke();
      choose.style.setProperty('--swatch',wheelColor(point.x,point.y,point.value));
    };
    const move=(x,y)=>{const length=Math.max(1,Math.hypot(x,y));point.x=x/length;point.y=y/length;paint();};
    canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();move(((e.clientX-r.left)/r.width*200-100)/96,((e.clientY-r.top)/r.height*200-100)/96);};
    canvas.onpointermove=e=>{if(canvas.hasPointerCapture(e.pointerId))canvas.onpointerdown(e);};
    const brightness=add('Brightness',()=>{wheel.adjusting=!wheel.adjusting;brightness.textContent=wheel.adjusting?'‹ Brightness ›':'Brightness';},box);
    const choose=add('Choose color',()=>{look[key]=wheelColor(point.x,point.y,point.value);refresh();close();},box);choose.className='creation-color-row';
    const chip=document.createElement('i');choose.append(chip);
    add('Back to palette',()=>showPalette(key,source),box);
    const hint=document.createElement('p');hint.dataset.creationHelp='wheel';box.append(hint);updateLabels();
    wheel={adjusting:false,move:(x,y)=>{if(wheel.adjusting){point.value=Math.max(0,Math.min(1,point.value+(x||-y)*.05));paint();}else move(point.x+x*.06,point.y+y*.06);},accept:()=>{if(wheel.adjusting){wheel.adjusting=false;brightness.textContent='Brightness';}else choose.click();},back:()=>showPalette(key,source)};
    paint();choose.focus({preventScroll:true});
  };
  const showPalette=(key,source)=>{
    const box=open(source.dataset.label,source),grid=document.createElement('div');grid.className='creation-palette';box.append(grid);
    for(const [name,color] of CREATION_COLORS){const b=add('',()=>{look[key]=color;refresh();close();},grid);b.style.background=color;b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(look[key]===color));b.title=name;}
    const rainbow=add('',()=>showWheel(key,source),grid);rainbow.className='creation-rainbow';rainbow.setAttribute('aria-label','Custom spectrum');rainbow.title='Custom spectrum';
    add('Cancel',close,box);highlight();buttons()[0].focus({preventScroll:true});
  };
  const colors=document.createElement('div');colors.className='creation-colors';body.append(colors);
  for(const [key,label] of Object.entries({skin:'Skin',hairColor:'Hair color',shirt:'Shirt',pants:'Pants',shoes:'Shoes'})) {
    const b=add(label,()=>showPalette(key,b),colors);b.className='creation-color-row';b.dataset.label=label;
    const chip=document.createElement('i');chip.setAttribute('aria-hidden','true');b.append(chip);refreshers.push(()=>b.style.setProperty('--swatch',look[key]));
  }
  const select=(key,label,options,fallback)=>{
    const b=add('',()=>{
      const box=open(label,b);box.classList.add('creation-detail-popup');popupMode=key==='face'?'face':'hair';popupDirection=0;
      popupPreview=document.createElement('canvas');popupPreview.width=240;popupPreview.height=190;popupPreview.className='creation-detail-preview';popupPreview.setAttribute('aria-label',label+' close-up preview');box.append(popupPreview);
      const views=document.createElement('div');views.className='creation-preview-views';box.append(views);
      add('↶ View',()=>rotatePreview(-1),views);add('View ↷',()=>rotatePreview(1),views);
      const grid=document.createElement('div');grid.className='creation-option-grid';box.append(grid);
      const selection=()=>grid.querySelectorAll('button').forEach(q=>{const selected=q.dataset.optionValue===(look[key]||fallback);q.setAttribute('aria-pressed',String(selected));q.textContent=(selected?'✓ ':'')+q.dataset.optionName;});
      for(const [value,name] of options){const q=add(name,()=>{look[key]=value;refresh();selection();},grid);q.dataset.optionValue=value;q.dataset.optionName=name;}
      add('Done',close,box);const help=document.createElement('small');help.dataset.creationHelp='detail';box.append(help);updateLabels();selection();refresh();
      popupFocus=buttons().indexOf(grid.querySelector('[aria-pressed="true"]')||grid.firstElementChild);highlight();buttons()[popupFocus]?.focus({preventScroll:true});
    });
    refreshers.push(()=>{b.textContent=label;const value=document.createElement('span');value.textContent=(options.find(([id])=>id===(look[key]||fallback))||options[0])[1]+' ›';b.append(value);});b.className='creation-select-row';
  };
  select('hair','Hair style',Object.entries(HAIR_STYLES),'crop');
  select('face','Face details',Object.entries(FACE_STYLES),'classic');
  const actions=document.createElement('div');actions.className='creation-actions';body.append(actions);
  add('Suggest name',()=>{input.value=s.creationName=suggestCharacterName(profiles.data.heroes);},actions);
  add('Random look',()=>{Object.assign(look,presets[Math.floor(Math.random()*presets.length)]);refresh();},actions);
  const error=document.createElement('p');error.className='lobby-error';error.setAttribute('role','alert');body.append(error);
  add('Create & join',()=>{const problem=characterNameError(input.value,profiles.data.heroes);if(problem){error.textContent=problem;return;}onCreate(input.value,look);}).className='creation-primary';
  add('Back',onBack);
  const hint=document.createElement('small');hint.dataset.creationHelp='menu';body.append(hint);
  function updateLabels(){const family=panel.dataset.controllerFamily,n=creationButtonLabels(family);panel.querySelectorAll('[data-creation-help]').forEach(q=>{q.textContent=q.dataset.creationHelp==='wheel'?`${n.move}: color · ${n.choose}: choose · ${n.back}: palette · ${n.adjust}: brightness`:creationHelp(family)+(q.dataset.creationHelp==='detail'?` · ${n.rotate}: rotate`: '');});}
  const rotatePreview=delta=>{popupDirection=(popupDirection+delta+8)%8;refresh();};
  panel.updateControllerFamily=family=>{panel.dataset.controllerFamily=family;updateLabels();};
  panel.creationNavigate=({x=0,y=0,accept=false,back=false,adjust=false,rotate=0})=>{
    if(rotate&&popupPreview){rotatePreview(rotate);return;}
    if(wheel){if(adjust)popup.querySelector('button').click();else if(back)wheel.back();else if(accept)wheel.accept();else if(x||y)wheel.move(x,y);return;}
    if(back){if(popup)close();else onBack();return;}
    if(x||y){const list=buttons(),grid=popup?.querySelector('.creation-palette');let index=popup?popupFocus:s.focus;
      if(grid)index=y?Math.max(0,Math.min(16,index+y*4)):(index<16?Math.floor(index/4)*4+(index%4+x+4)%4:0);
      else if(popup?.querySelector('.creation-option-grid')){const step=y?y*2:x;index=Math.max(0,Math.min(list.length-1,index+step));}
      else if(!popup&&y&&list[index]?.parentElement===colors){
        const first=list.indexOf(colors.firstElementChild),offset=index-first;
        index=y>0?(offset<2?index+2:offset<4?first+4:first+5):(offset>=2?first+(offset===4?2:offset-2):first-1);
      }else index=(index+(y||x)+list.length)%list.length;
      if(popup)popupFocus=index;else s.focus=index;highlight();
    }
    if(accept)buttons()[popup?popupFocus:s.focus]?.click();
  };
  panel.addEventListener('focusin',e=>{const index=buttons().indexOf(e.target);if(index>=0){if(popup)popupFocus=index;else s.focus=index;highlight();}});
  // Trap Tab within this player's pop-up without blocking other controllers.
  panel.addEventListener('keydown',e=>{if(popup&&e.key==='Tab'){e.preventDefault();const list=buttons(),index=list.indexOf(document.activeElement);list[(index+(e.shiftKey?-1:1)+list.length)%list.length]?.focus();}});
  updateLabels();refresh();
  let lastPreview=-Infinity;
  const animate=t=>{if(!panel.isConnected)return;if(t-lastPreview>100){preview();lastPreview=t;}requestAnimationFrame(animate);};
  requestAnimationFrame(animate);
}
