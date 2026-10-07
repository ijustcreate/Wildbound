import {creationFamily,creationHelp} from './creation-preview.mjs';
import {controllerFamily} from './controls.mjs';

export function openControllerKeyboard(input) {
  if(document.querySelector('#controller-keyboard'))return;
  let text=input.value, upper=true;
  const dialog=document.createElement('dialog');dialog.id='controller-keyboard';
  dialog.dataset.ownerDevice=input.closest('dialog')?.dataset.ownerDevice || input.closest('[data-owner-device]')?.dataset.ownerDevice || input.closest('.player-slot')?.dataset.device || '';
  dialog.dataset.controllerFamily=input.closest('[data-controller-family]')?.dataset.controllerFamily||creationFamily({device:dialog.dataset.ownerDevice});
  const title=document.createElement('h2');title.textContent='Name your explorer';
  const output=document.createElement('output');output.className='keyboard-text';output.setAttribute('aria-live','polite');
  const hint=document.createElement('p');hint.className='keyboard-help';
  dialog.updateControllerFamily=family=>{dialog.dataset.controllerFamily=family;hint.textContent=creationHelp(family,true);};dialog.updateControllerFamily(dialog.dataset.controllerFamily);
  const grid=document.createElement('div');grid.className='controller-keyboard-grid';
  const refresh=()=>{output.textContent=text+'▏';grid.querySelectorAll('[data-letter]').forEach(b=>b.textContent=b.dataset.letter===' '?'Space':upper?b.dataset.letter.toUpperCase():b.dataset.letter.toLowerCase());};
  const finish=(apply)=>{if(apply){input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}dialog.close();dialog.remove();input.focus();};
  const actions={Shift:()=>{upper=!upper;},Space:()=>{text=(text+' ').slice(0,input.maxLength>0?input.maxLength:20);},Delete:()=>{text=text.slice(0,-1);},Clear:()=>{text='';},Done:()=>finish(true),Cancel:()=>finish(false)};
  const highlight=target=>grid.querySelectorAll('button').forEach(b=>{b.classList.toggle('keyboard-selected',b===target);b.setAttribute('aria-current',b===target?'true':'false');});
  dialog.highlightCursor=highlight;
  for(const key of [...'1234567890QWERTYUIOPASDFGHJKL-ZXCVBNM._ ',...Object.keys(actions)]) {
    const b=document.createElement('button');b.type='button';b.textContent=key===' '?'Space':key;
    if(key.length===1)b.dataset.letter=key;
    else b.dataset.keyboardAction=key;
    b.onclick=()=>{highlight(b);if(actions[key])actions[key]();else text=(text+(upper?key.toUpperCase():key.toLowerCase())).slice(0,input.maxLength>0?input.maxLength:20);refresh();};grid.append(b);
  }
  grid.addEventListener('focusin',e=>highlight(e.target));
  dialog.addEventListener('keydown',e=>{
    if(dialog.dataset.ownerDevice.startsWith('pad:')){e.preventDefault();return;}
    const movement={ArrowLeft:-1,ArrowRight:1,ArrowUp:-10,ArrowDown:10}[e.key];
    if(movement){e.preventDefault();const list=[...grid.querySelectorAll('button')],index=Math.max(0,list.indexOf(document.activeElement)),next=list[Math.max(0,Math.min(list.length-1,index+movement))];next.focus();highlight(next);next.scrollIntoView({block:'nearest'});}
    if(e.key==='Backspace'&&!e.ctrlKey){e.preventDefault();actions.Delete();refresh();}
    if(e.ctrlKey&&e.key==='Enter'){e.preventDefault();finish(true);}
  });
  dialog.append(title,output,hint,grid);document.body.append(dialog);dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.showModal();refresh();grid.querySelector('button').focus();highlight(grid.querySelector('button'));
}
export function navigateControllerKeyboard(dialog,{left,right,up,down,accept,back},pad,previous) {
  if(dialog.dataset.ownerDevice&&dialog.dataset.ownerDevice!=='pad:'+pad.index)return;
  dialog.updateControllerFamily?.(controllerFamily(pad));
  const buttons=[...dialog.querySelectorAll('button')];let index=Math.max(0,buttons.indexOf(document.activeElement));
  if(left)index=(index+buttons.length-1)%buttons.length;
  if(right)index=(index+1)%buttons.length;
  if(up)index=index>=10?index-10:index;
  if(down)index=Math.min(buttons.length-1,index+10);
  buttons[index].focus();buttons[index].scrollIntoView({block:'nearest'});
  dialog.highlightCursor?.(buttons[index]);
  const action=name=>dialog.querySelector(`[data-keyboard-action="${name}"]`).click();
  if(back)action('Cancel');else if(pad.buttons[9]?.pressed&&!previous[9])action('Done');
  else if(pad.buttons[2]?.pressed&&!previous[2])action('Delete');else if(pad.buttons[3]?.pressed&&!previous[3])action('Shift');else if(accept)buttons[index].click();
}
