import {Animator} from './animation.mjs';
import {WIZARD_CARDS,wizardCardActor} from './wizard-cards.mjs';
import {wizardCardIds} from './wizard-card-collection.mjs';

const portraits=new WeakMap();
const node=(tag,text='',className='')=>{
 const element=document.createElement(tag);
 element.className=className;
 element.textContent=text;
 return element;
};

export function wizardCardCollectionPopup(panel,game,p,button){
 const view=p.ui.wizardCards,album=p.inventory[view.packIndex];
 const owned=new Set(wizardCardIds(album)),total=WIZARD_CARDS.length;
 const index=Math.min(Math.max(0,view.index||0),total-1);
 const current=WIZARD_CARDS[index],card=owned.has(current.id)?current:null;
 const popup=node('section','','inventory-popover wizard-card-popover');
 popup.setAttribute('role','dialog');
 popup.setAttribute('aria-label','Chocolate Card Collection');
 popup.tabIndex=-1;
 const dispatch=action=>game.inventoryAction(p,action);
 const header=node('header');
 header.append(node('strong','Chocolate Card Collection'));
 const close=button('×','wizard-card-close',()=>dispatch('close'));
 close.setAttribute('aria-label','Close card collection');header.append(close);popup.append(header);
 const slots=node('nav','','wizard-card-slots');slots.setAttribute('aria-label','All wizard card slots');
 let found=0;
 for(const [slot,entry] of WIZARD_CARDS.entries()){
  const collected=owned.has(entry.id);
  if(collected)found++;
  const label=collected?entry.name:'Uncollected';
  const marker=button(collected?String(slot+1):'?','wizard-card-slot-'+slot,()=>dispatch('wizard-card:'+slot));
  marker.className=`wizard-card-slot ${collected?'is-collected':'is-missing'}`;
  marker.dataset.slot=slot;
  marker.setAttribute('aria-label',`Card ${slot+1} · ${label}`);
  marker.title=label;
  if(slot===index)marker.setAttribute('aria-current','true');
  slots.append(marker);
 }
 popup.append(node('small',`${found} / ${total} collected · ${total-found} missing`,'wizard-card-progress'),slots);
 const copy=node('div','','wizard-card-copy');
 copy.setAttribute('aria-live','polite');
 if(card){
  const portrait=node('canvas','','wizard-card-portrait');
  portrait.width=132;portrait.height=148;
  portrait.setAttribute('role','img');portrait.setAttribute('aria-label',`Animated portrait of ${card.name}`);
  portraits.set(portrait,card);
  drawWizardCardPortrait(portrait,performance.now()/1000);
  copy.append(node('h3',card.name),node('p',card.description));
  popup.append(portrait);
 }else{
  const unknown=node('div','?','wizard-card-placeholder');
  unknown.setAttribute('role','img');unknown.setAttribute('aria-label','Uncollected wizard card');
  copy.append(node('h3','Uncollected card'));
  popup.append(unknown);
 }
 popup.append(copy);
 const nav=node('nav','','wizard-card-navigation');nav.setAttribute('aria-label','Browse wizard card slots');
 const previous=button('‹','wizard-card-prev',()=>dispatch('prev'));
 const next=button('›','wizard-card-next',()=>dispatch('next'));
 previous.dataset.nav='wizard-card-prev';next.dataset.nav='wizard-card-next';
 previous.setAttribute('aria-label','Previous wizard card');next.setAttribute('aria-label','Next wizard card');
 nav.append(previous,node('span',`${index+1} / ${total}`),next);popup.append(nav);
 popup.addEventListener('wheel',event=>{
  if(!event.deltaY)return;
  event.preventDefault();event.stopPropagation();
  dispatch(event.deltaY>0?'next':'prev');
 },{passive:false});
 popup.addEventListener('keydown',event=>{
  const action={ArrowLeft:'prev',ArrowUp:'prev',PageUp:'prev',ArrowRight:'next',ArrowDown:'next',PageDown:'next',Escape:'close'}[event.key];
  if(!action)return;
  event.preventDefault();event.stopPropagation();dispatch(action);
 });
 panel.querySelector('.item-tooltip')?.remove();
 panel.append(popup);
 if(p.device==='keyboard')popup.focus({preventScroll:true});
}

let animator;
export function drawWizardCardPortrait(canvas,time){
 const card=portraits.get(canvas);
 if(!card)return;
 const c=canvas.getContext('2d');
 const {width,height}=canvas;
 c.imageSmoothingEnabled=false;
 c.fillStyle='#221e32';c.fillRect(0,0,width,height);
 c.fillStyle='#c4a875';c.fillRect(2,2,width-4,height-4);
 c.fillStyle='#40394f';c.fillRect(5,5,width-10,height-10);
 c.fillStyle='#35334a';c.fillRect(14,18,104,110);
 c.fillStyle='#29283d';c.fillRect(18,23,96,103);
 c.fillStyle='#4d455e';c.fillRect(25,29,82,86);
 for(let i=0;i<11;i++){
  const x=22+(i*61)%89,y=27+(i*23)%91;
  c.globalAlpha=.24+.36*(1+Math.sin(time*1.7+i))*.5;
  c.fillStyle='#f4d9a0';c.fillRect(x,y,2,1);
 }
 c.globalAlpha=1;
 c.fillStyle='#221f32';c.fillRect(20,119,92,10);
 c.fillStyle='#796884';c.fillRect(20,119,92,1);
 const actor=wizardCardActor(card,time);
 (animator??=new Animator()).draw(c,{...actor,x:width/2,y:129},time,92);
 c.fillStyle='#e1c584';
 for(const [x,y] of [[8,8],[width-13,8],[8,height-13],[width-13,height-13]]){
  c.fillRect(x+2,y,1,5);c.fillRect(x,y+2,5,1);
 }
}
