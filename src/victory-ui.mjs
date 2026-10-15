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
 const table=document.createElement('table');table.setAttribute('aria-labelledby',heading.id);
 const labels=['Explorer','Loot recovered','Damage taken','Rescues','Objectives'];
 const head=document.createElement('thead'),titles=document.createElement('tr');
 for(const label of labels){const cell=node('th',label);cell.scope='col';titles.append(cell);}head.append(titles);table.append(head);
 const body=document.createElement('tbody');
 const players=game.debrief?.length?game.debrief:game.players;
 for(const p of players){
  const row=document.createElement('tr'),name=node('th',p.name||'Explorer');name.scope='row';row.append(name);
  [p.lootRecovered,p.damageTaken,p.rescues,p.objectives].forEach((value,i)=>{const cell=node('td',number(value));cell.dataset.label=labels[i+1];row.append(cell);});body.append(row);
 }
 table.append(body);report.append(table);
}
export function scrollVictoryReport(dialog,direction){dialog.querySelector('.victory-content')?.scrollBy({top:direction*100,behavior:'instant'});}
