import {hasSetSkill} from './items.mjs';
import {companionReserve,switchHunterCompanion,tamePet,feedPet,renamePet} from './hunter-pets.mjs';
import {drawHunterPet} from './hunter-pet-render.mjs';
import {openControllerKeyboard} from './controller-keyboard.mjs';
import {emporiumOwlVariant} from './owl-emporium.mjs';
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export function petCard(g,p){
 const hasCompanions=!!p.hunterPet||companionReserve(p).length>0;
 if(!hasCompanions&&!hasSetSkill(p,'tame_pet'))return null;
 const card=node('section');card.className='hunter-pet-card';card.style.setProperty('--pet-color',p.color||'#79c79c');
 const pet=p.hunterPet;
 if(pet){
  const portrait=node('canvas');portrait.width=70;portrait.height=62;portrait.setAttribute('aria-label',pet.name+' portrait');
  drawHunterPet(portrait.getContext('2d'),{...pet,x:35,y:46,roostHeight:0,jumpHeight:0,groundHeight:0,owlHeight:0,owlPhase:'perch',faceX:.3,faceY:1,animationAction:'idle'},p,0,40);
  const info=node('div'),label=node('strong',pet.name),health=node('progress');health.max=pet.maxHp;health.value=pet.hp;health.setAttribute('aria-label',pet.name+' health');
  info.append(label,node('small',pet.hp>0?`${Math.ceil(pet.hp)} / ${pet.maxHp} HP`:`Revive · ${Math.ceil(pet.downedRemaining??60)}s`),health);card.append(portrait,info);
 }
 const care=node('button',hasCompanions?'Companion care':'Tame · R / RB');care.type='button';care.onclick=()=>hasCompanions?openPetCare(g,p):g.remoteAuthoritative?g.serverAction(p,'tamePet').catch(()=>{}):tamePet(g,p);card.append(care);return card;
}
export function openPetCare(g,p){
 const pet=p.hunterPet,reserve=companionReserve(p);if(!pet&&!reserve.length)return;
 const dialog=node('dialog');dialog.className='pet-care-dialog';dialog.dataset.ownerDevice=p.device;dialog.append(node('h2','Companion care'));
 const status=node('p');status.setAttribute('role','status');
 let focus;
 if(pet){
 dialog.append(node('p',`${emporiumOwlVariant(pet.owlVariant)?.name||pet.kind} · ${Math.ceil(pet.hp)} / ${pet.maxHp} HP`));
 const label=node('label','Name'),name=node('input');name.value=pet.name;name.maxLength=24;label.append(name);dialog.append(label);
 focus=name;
 const keyboard=node('button','Enter name with controller');keyboard.type='button';keyboard.onclick=()=>openControllerKeyboard(name);dialog.append(keyboard);
 const collarLabel=node('label','Collar color'),collar=node('input');collar.type='color';collar.value=pet.collar||'#79c79c';collarLabel.append(collar);dialog.append(collarLabel);
 const food=pet.kind==='bat'?'fruit':'meat',feed=node('button','Feed '+food+' · heal 35%');feed.type='button';feed.disabled=pet.hp<=0;
 feed.onclick=async()=>{if(g.remoteAuthoritative){try{status.textContent=await g.serverAction(p,'feedPet');}catch(error){status.textContent=error.message;}return;}status.textContent=feedPet(g,p)?`${pet.name} loved the ${food}.`:`Stand beside your pet with ${food} in your bag.`;};dialog.append(feed);
 dialog.append(node('p','Hold Interact beside a downed pet for 1.6 seconds. Revive within 60 seconds or the companion is lost.'));
 const save=node('button','Save name & collar');save.type='button';save.onclick=async()=>{if(g.remoteAuthoritative){try{status.textContent=await g.serverAction(p,'renamePet',{name:name.value,collar:collar.value});dialog.close();}catch(error){status.textContent=error.message;}return;}if(renamePet(g,p,name.value,collar.value))dialog.close();else status.textContent='Enter a name.';};dialog.append(save);
 }
 for(const [index,companion]of reserve.entries()){
  const swap=node('button',`Switch to ${companion.name}`);swap.type='button';
  swap.onclick=()=>{if(switchHunterCompanion(g,p,index)){dialog.close();openPetCare(g,p);}else status.textContent='Return to your explorer before switching companions.';};
  dialog.append(swap);focus??=swap;
 }
 dialog.append(status);
 const close=node('button','Close');close.type='button';close.onclick=()=>dialog.close();dialog.append(close);
 dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();focus?.focus();
}
