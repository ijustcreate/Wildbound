import {ENCOUNTERS,BLESSINGS,previewEncounters,arenaLoadout,ammoCapacity} from './tv-arena-run.mjs';
import {ARENA_BOARD_X,ARENA_FLOOR} from './tv-arena-level.mjs';
import {controllerButtonNames} from './controls.mjs';
import {TV_NEW_ENEMIES,arenaRosterTheme} from './tv-arena-roster.mjs';
const colors={A:'#77d5c6',B:'#e6b575',C:'#c1a2ef'};
function panel(c,x,y,w,h,accent='#b89557'){
  c.fillStyle='#0b2025f2';c.fillRect(x,y,w,h);c.strokeStyle=accent;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);
}
function text(c,value,x,y,size=12,color='#f2e3bb',align='left',max=1000){c.fillStyle=color;c.font=`${size>=16?'bold ':''}${size}px system-ui`;c.textAlign=align;c.fillText(value,x,y,max);}
function wrap(c,value,x,y,width,size=12){
  let line='',row=0;c.font=`${size}px system-ui`;
  for(const word of value.split(' ')){const next=line?line+' '+word:word;if(c.measureText(next).width>width&&line){text(c,line,x,y+row*16,size,'#b9c9be');row++;line=word;}else line=next;}text(c,line,x,y+row*16,size,'#b9c9be');
}
function actionPrompt(c,m,player,x,y,action,key,button){
  const owner=m.owners.get(player.id);
  const label=owner?.device==='keyboard'?key:controllerButtonNames(owner?.controllerFamily)[button]||key;
  const caption=label+' · '+action;
  c.font='700 13px system-ui';
  const width=c.measureText(caption).width+18;
  panel(c,x-width/2,y-17,width,23);
  text(c,caption,x,y,13,'#fff2cb','center');
}
export function drawArenaRunWorld(c,m,left,right){
  for(const h of m.hazards){
    const active=h.age>=1.25&&h.age<1.65;c.fillStyle=active?'#c5dd88':'#aa73c06a';c.fillRect(h.x-h.width/2,h.y-3,h.width,4);
    const source=(m.thornRoots||[]).find(r=>r.id===h.source&&r.hp>0);if(source&&!active){c.save();c.strokeStyle='#bc87bd';c.globalAlpha=.6;c.setLineDash([3,4]);c.beginPath();c.moveTo(source.x,source.y-25);c.lineTo(h.x,h.y-5);c.stroke();c.restore();}
    if(active)for(let x=h.x-h.width/2;x<h.x+h.width/2;x+=12){c.beginPath();c.moveTo(x,h.y);c.lineTo(x+5,h.y-34);c.lineTo(x+10,h.y);c.fill();}
    else{text(c,'THORNS',h.x,h.y-13,10,'#ead4f7','center');c.strokeStyle='#d9b0eb';c.strokeRect(h.x-h.width/2,h.y-40,h.width,40);}
  }
  for(const t of m.tubes){
    c.fillStyle='#122b26';c.fillRect(t.x-20,t.y+7,40,8);c.fillStyle=colors[t.rune];c.fillRect(t.x-18,t.y+8,36,5);
  }
  for(const root of m.thornRoots||[])if(root.hp>0){
    c.fillStyle='#122b26';c.fillRect(root.x-21,root.y-11,42,11);
    for(const sign of [-1,1]){c.fillStyle='#507b48';c.fillRect(root.x+sign*14-5,root.y-24,10,18);c.fillStyle='#96b758';c.fillRect(root.x+sign*19-3,root.y-29,6,12);}
    c.fillStyle='#654565';c.fillRect(root.x-13,root.y-42,26,30);c.fillStyle='#c69bcb';c.fillRect(root.x-9,root.y-39,18,20);c.fillStyle='#f2d598';c.fillRect(root.x-4,root.y-35,8,12);
    text(c,'BRIAR HEART',root.x,root.y-61,9,'#efc5e8','center');text(c,'STRIKE / INTERACT TO UPROOT',root.x,root.y-49,8,'#e1d3af','center');
    for(let i=0;i<root.hp;i++){c.fillStyle='#f0c0cf';c.fillRect(root.x-7+i*9,root.y-7,6,3);}
  }
  const players=[...m.players.values()].filter(p=>!p.unavailable&&!p.menuPaused);
  for(const tube of m.tubes){
    if(tube.x<left-95||tube.x>right+95)continue;
    const passenger=players.find(p=>p.grounded&&Math.abs(p.x-tube.x)<58&&Math.min(Math.abs(p.y-tube.y),Math.abs(p.y-(tube.y+tube.h)))<15);
    if(passenger)actionPrompt(c,m,passenger,tube.x,tube.y-28,'Travel through tube','E',m.interactButton??3);
  }
  const roller=players.find(p=>Math.abs(p.x-ARENA_BOARD_X)<125&&Math.abs(p.y-ARENA_FLOOR)<55);
  if(roller&&!m.won&&!m.rollView){
    if(m.progress>=48)actionPrompt(c,m,roller,ARENA_BOARD_X,ARENA_FLOOR-112,'Call Wildbound','E',m.interactButton??3);
    else actionPrompt(c,m,roller,ARENA_BOARD_X,ARENA_FLOOR-112,'Strike board to roll','X',2);
  }
  for(const w of m.tubeWarnings){
    const pulse=.5+Math.sin(m.time*20)*.25;c.save();c.globalAlpha=pulse;c.strokeStyle='#fff0ba';c.lineWidth=3;c.strokeRect(w.x-34,w.y-64,68,66);c.restore();
    text(c,w.kind==='player'?'ALLY ARRIVING':w.kind==='shell'?'SHELL INCOMING':'SHOT INCOMING',w.x,w.y-70,9,'#fff0ba','center');
  }
  for(const drop of m.supplyDrops)if(drop.x>left-20&&drop.x<right+20){
    c.fillStyle=drop.kind==='arrow'?'#f3d797':drop.kind==='thorn'?'#b9da83':'#b3b2ff';c.fillRect(drop.x-3,drop.y-5,6,10);c.fillStyle='#102b29';c.fillRect(drop.x-1,drop.y-2,2,4);
  }
  for(const seed of m.roundObjects)if(!seed.collected){c.fillStyle='#ffe19b';c.fillRect(seed.x-6,seed.y-8,12,16);c.strokeStyle='#fff5cb';c.strokeRect(seed.x-10,seed.y-12,20,24);text(c,'SEEK',seed.x,seed.y-19,9,'#fff0bc','center');}
  for(const e of m.enemies)if(e.alive&&e.x>left-80&&e.x<right+80){
    if(e.intent){
      const color=TV_NEW_ENEMIES[e.kind]?.color||'#eed499';text(c,e.intent.kind.toUpperCase()+'!',e.x,e.y-e.h-15,9,color,'center');
      c.save();c.strokeStyle=color;c.globalAlpha=.55;c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.moveTo(e.x,e.y-e.h*.6);
      if(['arrow','venom','ember'].includes(e.intent.kind))c.lineTo(e.x+e.intent.dx*190,e.y-e.h*.6+e.intent.dy*190);
      else c.lineTo(e.x+e.face*90,e.y-e.h*.6);c.stroke();c.restore();
    }
    if(e.kind==='sporecap')text(c,'SPORECAP',e.x,e.y-e.h-12,9,'#e5b6ee','center');
    if(e.kind==='thornwing')text(c,e.swoop&&e.swoop.time<.55?'SWOOP!':'THORNWING',e.x,e.y-36,9,'#f5d899','center');
    if(e.cast){
      c.save();c.setLineDash([6,6]);c.strokeStyle='#dbb5eb';c.lineWidth=2;c.beginPath();c.moveTo(e.x,e.y-e.h/2);c.lineTo(e.x+e.cast.dx*190,e.y-e.h/2+e.cast.dy*190);c.stroke();c.restore();
    }
    if(e.champion){text(c,'MOSSROOT SHELLKEEPER',e.x,e.y-e.h-19,11,'#f9c780','center');c.fillStyle='#17282a';c.fillRect(e.x-34,e.y-e.h-11,68,5);c.fillStyle='#e0a760';c.fillRect(e.x-34,e.y-e.h-11,68*Math.max(0,e.hp/10),5);}
  }
  for(const p of m.players.values()){
    if(p.dashing){c.fillStyle='#a9e5d855';c.fillRect(p.x-p.vx*.045-9,p.y-48,18,46);}
    if(p.attackTime>0&&arenaLoadout(m,p).role==='spear'){
      const a=p.aim||{x:p.face,y:0},hand=p.y-(p.bodyHeight||58)*.5;c.strokeStyle='#312c24';c.lineWidth=6;c.beginPath();c.moveTo(p.x,hand);c.lineTo(p.x+a.x*100,hand+a.y*100);c.stroke();c.strokeStyle='#dbc487';c.lineWidth=3;c.stroke();c.fillStyle='#d3ebe3';c.fillRect(p.x+a.x*100-4,hand-4+a.y*100,8,8);
    }
  }
}
export function drawArenaRunHud(c,m,left,width){
  const active=[...m.players.values()];
  panel(c,left+16,65,218,66,'#8f995d');text(c,'THE LIVING BOARD',left+28,82,10,'#ebd799');
  for(let i=0;i<48;i++){c.fillStyle=i<m.progress?'#edcd83':'#355751';c.fillRect(left+28+i*4,91,3,i%6===0?9:6);}
  text(c,`${m.progress}/48 - Hit the center board to advance`,left+28,123,10,'#d9d8b4');
  const offscreen=active.filter(p=>!p.unavailable&&(p.x<m.camera+left||p.x>m.camera+left+width));
  for(const [index,p] of offscreen.entries()){
    const west=p.x<m.camera+left,edge=west?left+18:left+width-18;
    text(c,west?`‹ ${p.hero.name}`:`${p.hero.name} ›`,edge,118+index*18,12,'#f4d795',west?'left':'right',140);
  }
  if(m.roundState==='active'){
    const info=ENCOUNTERS[m.encounter.kind],n=m.enemies.filter(e=>e.alive).length+m.waveQueue.length;
    const x=left+width-342;panel(c,x,62,322,66,info.color);text(c,info.name.toUpperCase(),x+161,79,13,info.color,'center');
    const extra=m.encounter.kind==='treasure'?` · ${m.roundObjects.filter(s=>s.collected).length}/5 marked seeds`:'';
    text(c,`${n} creatures${extra} · roll again anytime`,x+161,96,10,'#d3d9be','center');
    text(c,m.encounter.kind==='hazard'?'Uproot Briar Hearts to stop their thorn lanes.':'Creatures and marked seeds are bonus challenges.',x+161,115,10,'#d5d9c4','center');
  }
  if(m.roundState!=='blessing'&&m.progress<48&&!m.won&&!m.rollView&&active.some(p=>Math.abs(p.x-ARENA_BOARD_X)<240&&p.y>355)){
    const x=left+width-302;panel(c,x,m.roundState==='active'?137:65,282,129);
    c.save();if(m.roundState==='active')c.translate(0,72);
    text(c,'THE NEXT ROLL',x+14,85,14);text(c,'Attack the board - roll to reach space 48',x+14,103,11,'#b5c9bd');
    const faces=previewEncounters(m);for(let i=0;i<6;i++){const col=i%2,row=Math.floor(i/2),label=faces[i]==='skirmish'?'Creatures':faces[i]==='treasure'?'Treasure hunt':faces[i]==='hazard'?'Thornstorm':'Miniboss';text(c,`${i+1}  ${label}`,x+14+col*134,124+row*23,11,ENCOUNTERS[faces[i]].color);}
    text(c,m.pendingBlessing&&m.roundState==='idle'?'Up + Interact: optional blessing':arenaRosterTheme(m.roundsCleared).name,x+14,185,9,'#afc7b3');c.restore();
  }
  // One concise supply line per explorer; the world map owns the bottom right.
  const supplyWidth=Math.min(width-325,600),column=supplyWidth/Math.max(1,active.length);
  for(const [i,p]of active.entries()){
    const x=left+12+i*column,l=arenaLoadout(m,p);panel(c,x,462,column-6,42,'#466e66');
    text(c,`${p.hero.name||'Explorer'} · ${l.role}${l.heavy?' · armored':''}`,x+7,477,10,'#dfdfbb','left',column-18);
    text(c,`${l.role==='rifle'?'Ammo':'↑'} ${p.arenaAmmo}/${ammoCapacity(p)}  ✦ ${p.thorns}  ◇ ${p.charges}${l.heavy?`  guard ${p.guard>0?Math.ceil(p.guard)+'s':'ready'}`:''}`,x+7,494,10,'#9cd3c3','left',column-18);
  }
  if(m.roundState!=='blessing'&&!m.won)text(c,'Down: crouch · Down + Jump: drop · Up + Attack: kit · Down + Attack: thorn',480,455,10,'#c2d2bd','center');
  if(m.roundState!=='blessing')return;
  c.fillStyle='#05181af5';c.fillRect(left,0,width,540);
  text(c,'A GIFT FROM THE LIVING BOARD',480,38,23,'#f4d795','center');
  text(c,`Round ${m.roundsCleared} cleared · Board ${m.progress}/48 · choose together, build individually`,480,61,12,'#b9cfbe','center');
  const rowH=Math.min(126,410/Math.max(1,active.length));
  for(const [i,p]of active.entries()){
    const ch=p.blessingChoice;if(!ch)continue;const y=82+i*rowH;
    text(c,p.hero.name||'Explorer',28,y+24,14,'#e7d8ad','left',135);
    text(c,(ch.done?'READY':'CHOOSE')+` · ${Object.keys(p.blessings).length}/3`,28,y+42,10,ch.done?'#99d8b0':'#e7bd79');
    for(const [n,[key,rank]]of Object.entries(p.blessings).entries())text(c,BLESSINGS[key].name+(rank===2?' II':' I'),28,y+58+n*12,9,'#9cb4a9','left',140);
    const w=744/ch.offers.length;
    for(const [j,key]of ch.offers.entries()){
      const x=183+j*w,focused=j===ch.index,b=BLESSINGS[key],rank=(p.blessings[key]||0)+1;
      panel(c,x,y,w-12,rowH-12,focused?'#f1cf86':'#355450');
      if(focused){c.fillStyle='#ecd19b';c.fillRect(x,y,3,rowH-12);}
      text(c,b.name+(key==='supplies'?'':rank===2?' II':' I'),x+14,y+23,14,focused?'#ffe7b0':'#c4d2bf','left',w-36);
      wrap(c,b.text,x+14,y+45,w-36,11);
      if(ch.done&&focused)text(c,'BOUND',x+w-25,y+rowH-24,10,'#a9e3b4','right');
    }
  }
  text(c,'Left / Right: select · Attack / Interact / Jump: confirm · release first',480,515,12,'#d5cbaa','center');
}
