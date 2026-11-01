// An inline picker exposes highlight and close events consistently for mouse,
// keyboard and controller; native select popups do not expose hovered options.
export function mountMusicPicker(select, tracks, {preview, stop}) {
  const picker=document.createElement('details');picker.className='music-picker';
  const summary=document.createElement('summary');summary.setAttribute('aria-label','Choose level music');
  const list=document.createElement('div');list.className='music-picker-options';list.setAttribute('role','group');list.setAttribute('aria-label','Level music tracks');
  picker.append(summary,list);select.after(picker);select.hidden=true;
  const update=()=>{summary.textContent=select.selectedOptions[0]?.textContent||'Choose level music';};
  const close=()=>{picker.open=false;stop();};
  for(const option of select.options){
    const button=document.createElement('button');button.type='button';button.textContent=option.textContent;button.dataset.track=option.value;
    const listen=()=>{if(picker.open)preview(tracks.find(t=>t.id===option.value)||null);};
    button.onfocus=listen;button.onpointerenter=listen;
    button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));close();summary.focus();};
    list.append(button);
  }
  picker.addEventListener('toggle',()=>{if(picker.open){const id=list.contains(document.activeElement)?document.activeElement.dataset.track:select.value;preview(tracks.find(t=>t.id===id)||null);}else stop();});
  picker.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();summary.focus();return;}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
    e.preventDefault();picker.open=true;const buttons=[...list.children],index=buttons.indexOf(document.activeElement);
    const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+(e.key==='ArrowDown'?1:-1)));
    buttons[next].focus();
  });
  document.addEventListener('pointerdown',e=>{if(picker.open&&!picker.contains(e.target))close();});
  picker.addEventListener('focusout',e=>{if(e.relatedTarget&&!picker.contains(e.relatedTarget))close();});
  select.addEventListener('change',update);update();
  return {close,picker};
}
