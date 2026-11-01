import {dialogNeighbour} from './dialog-navigation.mjs';

// The item grid and its footer are one owned menu, not separate input systems.
export function routeLootController(panel,game,player,pad,previous=[]){
 if(!panel||!player.ui?.loot||!['victory','tv-victory'].includes(player.ui.storage)||player.ui.ownerDevice!==player.device)return false;
 const u=player.ui,edge=i=>!!pad.buttons[i]?.pressed&&!previous[i];
 const controls=[...panel.querySelectorAll('button[data-mode],.chest-menu-footer button')].filter(b=>!b.disabled&&b.getClientRects().length);
 let current=u.footerAction?controls.find(b=>b.dataset.action===u.footerAction):controls.find(b=>b.dataset.mode===u.panel&&Number(b.dataset.index)===u.index);
 current ||= u.footerAction?controls.find(b=>!b.dataset.mode)||controls[0]:controls[0];if(!current)return true;
 const x=edge(14)?-1:edge(15)?1:Math.abs(pad.axes[0]||0)>.65&&Math.abs(u.lootAxisX||0)<=.65?Math.sign(pad.axes[0]):0;
 const y=edge(12)?-1:edge(13)?1:Math.abs(pad.axes[1]||0)>.65&&Math.abs(u.lootAxisY||0)<=.65?Math.sign(pad.axes[1]):0;
 u.lootAxisX=pad.axes[0]||0;u.lootAxisY=pad.axes[1]||0;
 if(x||y){
  const next=dialogNeighbour(controls,current,x,y);
  // The footer is sequential after the grid. A wide gap or disabled Take
  // button must not make the nearer Restart row bypass Loot all.
  current=y>0&&current.dataset.mode&&!next.dataset.mode?controls.find(b=>!b.dataset.mode)||next:next;
  if(current.dataset.mode){delete u.footerAction;current.click();}else u.footerAction=current.dataset.action;
 }
 for(const b of panel.querySelectorAll('.controller-focus'))b.classList.remove('controller-focus');
 current.classList.add('controller-focus');current.focus({preventScroll:true});current.scrollIntoView({block:'nearest'});
 if(edge(1)){game.inventoryAction(player,'close');return true;}
 if(edge(0)){if(current.dataset.mode)game.inventoryAction(player,'use');else current.click();}
 return true;
}
