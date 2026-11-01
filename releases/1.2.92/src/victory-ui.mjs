import {Animator} from './animation.mjs';
import {drawVictoryChest} from './victory-chest.mjs';
const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
const number=value=>Math.max(0,Math.floor(Number(value)||0)).toLocaleString();
export function renderVictoryReport(dialog,game){
 dialog.classList.toggle('victory-party',game.players.length>3);
 const summary=dialog.querySelector('#victory-summary');summary.replaceChildren();
 for(const [value,label]of [[game.cleared,'Creatures cleared'],[game.round,'Rounds played'],[game.players.length,game.players.length===1?'Explorer returned':'Explorers returned']]){
  const stat=node('div','','victory-stat');stat.append(node('strong',number(value)),node('span',label));summary.append(stat);
 }
 const report=dialog.querySelector('#victory-report');report.replaceChildren();
 const heading=node('h3','Your expedition');heading.id='victory-report-title';report.append(heading);
 const party=node('div','','victory-explorers');
 const records=game.debrief?.length?game.debrief:game.players;
 const animator=new Animator();
 for(const [index,record] of records.entries()){
  const hero=game.players.find(p=>p.name===record.name)||game.players[index];
  const card=node('article','','victory-explorer'),portrait=document.createElement('canvas');portrait.width=portrait.height=144;portrait.className='victory-portrait';portrait.setAttribute('aria-label',(record.name||'Explorer')+' returned from the expedition');
  if(hero){const c=portrait.getContext('2d');c.imageSmoothingEnabled=false;c.translate(72,124);c.scale(2,2);animator.draw(c,{...hero,x:0,y:0,room:null,faceX:0,faceY:1,moving:false,animationAction:'found_unique',foundUnique:.4,attack:0,hit:0,jumpHeight:0,groundHeight:0},.8,43);}
  const intro=node('div','','victory-explorer-name');intro.append(node('small','EXPLORER '+(index+1)),node('h4',record.name||'Explorer'),node('span','Level '+(hero?.level||1)+' · Home safe'));
  const stats=node('dl','','victory-personal-stats');
  for(const [label,value]of [['Loot recovered',record.lootRecovered],['Damage taken',record.damageTaken],['Rescues',record.rescues],['Objectives',record.objectives]]){const stat=node('div');stat.append(node('dt',label),node('dd',number(value)));stats.append(stat);}
  card.append(portrait,intro,stats);party.append(card);
 }
 report.append(party);
 const footer=dialog.querySelector('.victory-footer');let treasure=footer.querySelector('.victory-treasure-art');
 if(!treasure){treasure=document.createElement('canvas');treasure.width=treasure.height=144;treasure.className='victory-treasure-art';treasure.setAttribute('aria-hidden','true');footer.prepend(treasure);}
 const pen=treasure.getContext('2d');pen.clearRect(0,0,144,144);pen.imageSmoothingEnabled=false;pen.save();pen.beginPath();pen.rect(0,0,144,128);pen.clip();pen.translate(72,102);pen.scale(1.8,1.8);pen.translate(-800,-919);drawVictoryChest(pen,{victoryChest:true,victoryRewards:game.victoryRewards||[],players:[],time:1,victoryChestOpened:false,victoryChestArt:{lid:.8,last:1}});pen.restore();
 const count=(game.victoryRewards||[]).filter(Boolean).length;
 const hint=dialog.querySelector('#victory-return-hint');hint.replaceChildren(node('strong',count?number(count)+' treasures waiting':'Your expedition is complete'),node('span',count?'Return to the board and open your victory chest. Your rewards are ready to claim.':'Return to the board to celebrate, explore, or start the next expedition.'));
 dialog.querySelector('#victory-title').textContent='The jungle remembers your names.';
 dialog.querySelector('#victory-continue').textContent=count?'Return to your treasure →':'Return to the board →';

}
export function scrollVictoryReport(dialog,direction){dialog.querySelector('.victory-content')?.scrollBy({top:direction*100,behavior:'instant'});}
