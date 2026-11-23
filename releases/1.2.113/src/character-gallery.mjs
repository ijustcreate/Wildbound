import {drawPlayer} from './player-motion.mjs';
import {freshCharacter} from './items.mjs';

export function openCharacterGallery({profiles,game,player,onChange,onNew}) {
  const host=document.querySelector(`[data-device="${player.device}"]`);
  if(!host || host.querySelector('.character-gallery'))return;
  player.ready=false;
  const panel=document.createElement('section');panel.className='character-gallery';panel.dataset.ownerDevice=player.device;
  panel.style.setProperty('--picker-color',player.color||'#ffdc84');
  panel.setAttribute('aria-label','Choose character for '+player.name);
  let selected=profiles.data.heroes.find(h=>h.id===player.profileId)?.id, active=null, axes=[0,0], confirming=false, saving=false;
  const heroes=()=>[...profiles.data.heroes].sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base',numeric:true})||a.id.localeCompare(b.id));
  const available=h=>!game.players.some(p=>p!==player&&p.profileId===h.id);
  selected ||= heroes().find(available)?.id;
  const close=()=>{panel.remove();onChange();document.querySelector(`[data-lobby-focus="${player.id}-saved"]`)?.focus();};
  const focus=button=>{
    if(!button||button.disabled)return;
    active=button;
    panel.querySelectorAll('.picker-focus').forEach(b=>b.classList.remove('picker-focus'));
    button.classList.add('picker-focus');
    if(button.dataset.character)preview(profiles.data.heroes.find(h=>h.id===button.dataset.character));
    button.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  let portrait, previewName, details, useButton, removeButton, previousButton, nextButton, dots;
  const preview=hero=>{
    if(!hero)return;
    selected=hero.id;panel.dataset.selected=hero.id;previewName.dataset.character=hero.id;
    panel.querySelectorAll('.character-card').forEach(b=>{const chosen=b.dataset.character===selected;b.classList.toggle('picker-selected',chosen);b.setAttribute('aria-pressed',String(chosen));});
    if(useButton){useButton.disabled=!available(hero);useButton.setAttribute('aria-label','Use '+hero.name);}
    if(removeButton){removeButton.disabled=!available(hero);removeButton.setAttribute('aria-label','Delete '+hero.name);}
    const c=portrait.getContext('2d');c.clearRect(0,0,110,125);c.save();c.imageSmoothingEnabled=false;c.translate(55,113);c.scale(2.5,2.5);
    drawPlayer(c,{...hero,faceX:0,faceY:1,animationAction:'idle',playerFrame:0},0);c.restore();
    if(previousButton){const list=heroes(),i=list.findIndex(h=>h.id===selected);previousButton.hidden=i<=0;nextButton.hidden=i>=list.length-1;dots.textContent=list.length>1?'•'.repeat(Math.min(i,2))+' ● '+'•'.repeat(Math.min(list.length-i-1,2)):'';dots.setAttribute('aria-label','Character '+(i+1)+' of '+list.length);}
    previewName.dataset.character=hero.id;previewName.disabled=!available(hero);previewName.textContent=hero.name;details.textContent='Lv '+(hero.level||1)+' · '+(hero.coins||0)+' gold';
  };
  const button=(text,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;b.onfocus=()=>focus(b);return b;};
  const confirmDelete=()=>{
    const hero=profiles.data.heroes.find(h=>h.id===selected);
    if(!hero||!available(hero))return;
    confirming=true;panel.classList.add('confirming');panel.replaceChildren();
    const title=document.createElement('strong');title.textContent='Delete '+hero.name+'?';
    const message=document.createElement('p');message.textContent='Permanently removes this character, gear and personal storage. Shared storage stays.';
    const status=document.createElement('p');status.setAttribute('role','alert');
    const cancel=button('Cancel · B',()=>{if(!saving)render();});
    const remove=button('Delete character',async()=>{
      if(saving)return;saving=true;cancel.disabled=remove.disabled=true;
      try {
        if(!available(hero))throw Error('Another player is using this character.');
        await profiles.remove(hero.id);
        if(player.profileId===hero.id)profiles.assign(player,freshCharacter(null,'Scout'));
        selected=heroes().find(available)?.id;saving=false;render();onChange();
      }catch(e){saving=false;status.textContent=e.message;cancel.disabled=remove.disabled=false;focus(cancel);}
    });
    remove.className='danger';panel.append(title,message,status,cancel,remove);focus(cancel);
  };
  panel.deleteSelected=confirmDelete;
  panel.refreshAvailability=()=>{
    if(confirming)return;
    panel.querySelectorAll('.character-card').forEach(b=>{
      const hero=profiles.data.heroes.find(h=>h.id===b.dataset.character);
      b.disabled=!hero||!available(hero);b.title=b.disabled?'In use by another player':'';
    });
    const hero=profiles.data.heroes.find(h=>h.id===selected);
    if(useButton)useButton.disabled=!hero||!available(hero);
    if(removeButton)removeButton.disabled=!hero||!available(hero);
  };
  const render=()=>{
    confirming=false;panel.classList.remove('confirming');panel.replaceChildren();
    const display=document.createElement('div');display.className='character-gallery-preview';
    const owner=document.createElement('small');owner.className='picker-owner';owner.textContent=player.device==='keyboard'?'Keyboard':'P'+(Number(player.device.split(':')[1])+1);
    portrait=document.createElement('canvas');portrait.width=110;portrait.height=125;
    previewName=button('',()=>{const hero=heroes().find(h=>h.id===selected);if(hero&&available(hero)){profiles.assign(player,hero);close();}});previewName.className='character-card carousel-name';details=document.createElement('span');
    const row=document.createElement('div');row.className='carousel-row';
    const shift=delta=>{const list=heroes(),i=list.findIndex(h=>h.id===selected);const hero=list[Math.max(0,Math.min(list.length-1,i+delta))];if(hero){preview(hero);focus(previewName);}};
    panel.shiftCharacter=shift;
    previousButton=button('‹',()=>shift(-1));previousButton.className='carousel-arrow';previousButton.setAttribute('aria-label','Previous character');
    nextButton=button('›',()=>shift(1));nextButton.className='carousel-arrow';nextButton.setAttribute('aria-label','Next character');
    row.append(previousButton,portrait,nextButton);dots=document.createElement('div');dots.className='carousel-dots';dots.setAttribute('role','status');
    display.append(row,previewName,details,dots);
    const footer=document.createElement('footer');footer.className='gallery-footer';
    const create=button('+ New',()=>{close();onNew();});
    removeButton=button('Delete · X',confirmDelete);removeButton.disabled=true;
    footer.append(removeButton,create,button('Back · B',close));
    if(!profiles.data.heroes.length){previewName.textContent='New explorer';details.textContent='Create your first character.';}
    panel.append(display,footer,owner);
    preview(profiles.data.heroes.find(h=>h.id===selected));
    focus(!previewName.disabled&&selected?previewName:create);
  };
  panel.handleController=(pad,previous)=>{
    panel.refreshAvailability();
    const edge=i=>pad.buttons[i]?.pressed&&!previous[i];
    const x=Math.abs(pad.axes[0]||0)>.65?Math.sign(pad.axes[0]):0,y=Math.abs(pad.axes[1]||0)>.65?Math.sign(pad.axes[1]):0;
    const left=edge(14)||(x<0&&axes[0]>=0),right=edge(15)||(x>0&&axes[0]<=0),up=edge(12)||(y<0&&axes[1]>=0),down=edge(13)||(y>0&&axes[1]<=0);axes=[x,y];
    if(saving)return;
    if(edge(1)){if(confirming)render();else close();return;}
    if(!confirming&&edge(2)){confirmDelete();return;}
    const buttons=[...panel.querySelectorAll('button:not(:disabled):not([hidden])')],cards=[...panel.querySelectorAll('.character-card')];
    if(!active?.isConnected||active.disabled)focus(buttons[0]);
    if(!confirming&&(left||right)){panel.shiftCharacter(left?-1:1);return;}
    if(up||down||left||right){const i=buttons.indexOf(active);focus(buttons[(i+(up||left?buttons.length-1:1))%buttons.length]);return;}
    if(edge(0))active?.click();
  };
  panel.onkeydown=e=>{if(!confirming&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();panel.shiftCharacter(e.key==='ArrowLeft'?-1:1);}if(e.key==='Escape'){e.preventDefault();if(confirming)render();else close();}};
  host.replaceChildren(panel);render();onChange();
}
