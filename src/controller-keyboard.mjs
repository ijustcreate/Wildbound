export function openControllerKeyboard(input) {
  if(document.querySelector('#controller-keyboard'))return;
  let text=input.value, upper=true;
  const dialog=document.createElement('dialog');dialog.id='controller-keyboard';
  dialog.dataset.ownerDevice=input.closest('dialog')?.dataset.ownerDevice || input.closest('.player-slot')?.dataset.device || '';
  const title=document.createElement('h2');title.textContent='Name your explorer';
  const output=document.createElement('output');output.className='keyboard-text';output.setAttribute('aria-live','polite');
  const hint=document.createElement('p');hint.textContent='D-pad / stick: move · A: choose · X: delete · Y: shift · Start: done · B: cancel';
  const grid=document.createElement('div');grid.className='controller-keyboard-grid';
  const refresh=()=>{output.textContent=text+'▏';grid.querySelectorAll('[data-letter]').forEach(b=>b.textContent=upper?b.dataset.letter.toUpperCase():b.dataset.letter.toLowerCase());};
  const finish=(apply)=>{if(apply){input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}dialog.close();dialog.remove();input.focus();};
  const actions={Shift:()=>{upper=!upper;},Space:()=>{text=(text+' ').slice(0,input.maxLength>0?input.maxLength:20);},Delete:()=>{text=text.slice(0,-1);},Clear:()=>{text='';},Done:()=>finish(true),Cancel:()=>finish(false)};
  for(const key of [...'1234567890QWERTYUIOPASDFGHJKL-ZXCVBNM._ ',...Object.keys(actions)]) {
    const b=document.createElement('button');b.type='button';b.textContent=key===' '?'Space':key;
    if(key.length===1)b.dataset.letter=key;
    else b.dataset.keyboardAction=key;
    b.onclick=()=>{if(actions[key])actions[key]();else text=(text+(upper?key.toUpperCase():key.toLowerCase())).slice(0,input.maxLength>0?input.maxLength:20);refresh();};grid.append(b);
  }
  dialog.append(title,output,hint,grid);document.body.append(dialog);dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.showModal();refresh();grid.querySelector('button').focus();
}
export function navigateControllerKeyboard(dialog,{left,right,up,down,accept,back},pad,previous) {
  const buttons=[...dialog.querySelectorAll('button')];let index=Math.max(0,buttons.indexOf(document.activeElement));
  if(left)index=(index+buttons.length-1)%buttons.length;
  if(right)index=(index+1)%buttons.length;
  if(up)index=index>=10?index-10:index;
  if(down)index=Math.min(buttons.length-1,index+10);
  buttons[index].focus();buttons[index].scrollIntoView({block:'nearest'});
  const action=name=>dialog.querySelector(`[data-keyboard-action="${name}"]`).click();
  if(back)action('Cancel');else if(pad.buttons[9]?.pressed&&!previous[9])action('Done');
  else if(pad.buttons[2]?.pressed&&!previous[2])action('Delete');else if(pad.buttons[3]?.pressed&&!previous[3])action('Shift');else if(accept)buttons[index].click();
}
