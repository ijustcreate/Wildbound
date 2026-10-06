import {RIG_SUBJECTS,rigSubject} from './src/rig-subjects.mjs';
import {creatures} from './src/definitions.mjs';
import {ITEMS,itemKind} from './src/items.mjs';
import {Assets} from './src/assets.mjs';
import {Animator} from './src/animation.mjs';
import {drawPlayer,playerMotion,directionVector} from './src/player-motion.mjs';
import {paintItem} from './src/item-art.mjs';
import {DEFAULT_APPEARANCE} from './src/appearance.mjs';

const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),assets=new Assets(),animator=new Animator(assets);
const directions=['South','Southwest','West','Northwest','North','Northeast','East','Southeast'];
const nice=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const units=[
  {id:'player',label:'Explorer',family:'Playable hero',description:'The player rig used by every explorer appearance.'},
  ...Object.keys(RIG_SUBJECTS).filter(id=>id!=='player').map(id=>({id,label:RIG_SUBJECTS[id].name||nice(id),family:creatures[id]?.type||'Game unit',description:creatures[id]?.description||`${nice(id)} rig · authored runtime animation.`})),
  {id:'goomba',label:'Goomba',family:'TV world enemy',description:'The small mushroom enemy from the board-game TV world.'},
].filter((item,index,list)=>list.findIndex(other=>other.id===item.id)===index);
const gear=Object.entries(ITEMS).filter(([,def])=>def.slot||def.relic).map(([id,def])=>({id,label:def.name||nice(id),family:def.relic?'Relic':nice(itemKind(id)||def.slot),description:def.description||`${nice(itemKind(id)||def.slot)} · actual fitted game art.`,def}));
const slots=[...new Set(gear.map(item=>item.def.slot||'relic'))];
let mode='units',records=units,chosen=0,playing=true,elapsed=0,angle=0,last=0,scale=5.5,renderError='';
const pressed=id=>document.getElementById(id)?.getAttribute('aria-pressed')==='true';
const setPressed=(id,value)=>{const e=$(id);e.setAttribute('aria-pressed',String(value));e.classList.toggle('active',value)};
function modelFor(unit){return unit.id==='player'?playerMotion:rigSubject(unit.id)?.data||creatures[unit.id]?.rig||null}
function actionsFor(item){if(mode==='gear')return ['idle','run','slash','block'].filter(name=>playerMotion.clips?.[name]);if(item.id==='goomba')return ['walk','squash'];const names=Object.keys(modelFor(item)?.clips||{});return names.length?names:[rigSubject(item.id)?.clip||'idle']}
function action(){return $('action-select').value}
function actionClip(item){return modelFor(item)?.clips?.[action()]||null}
function frameTotal(){const item=records[chosen];return mode==='gear'?playerMotion.clips[action()]?.length||1:item.id==='goomba'?8:Math.max(1,Math.floor(actionClip(item)?.length||1))}
function frameRate(){const item=records[chosen];return mode==='gear'?playerMotion.clips[action()]?.fps||8:item.id==='goomba'?8:actionClip(item)?.fps||8}
function frameIndex(){return Math.min(frameTotal()-1,Math.floor(elapsed*frameRate()))}
function face(){return Math.round((((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2))/(Math.PI/4))%8}
function drawGoomba(c,time){const stride=action()==='walk'?Math.sin(time*12)*2:0,squash=action()==='squash'?Math.min(1,time*2):0;c.save();c.scale(1,1-squash*.68);c.fillStyle='#432d24';c.fillRect(-11,-9+stride,8,8);c.fillRect(3,-9-stride,8,8);c.fillStyle='#9c6040';c.beginPath();c.ellipse(0,-14,14,13,0,0,Math.PI*2);c.fill();c.fillStyle='#c89460';c.fillRect(-9,-19,18,8);c.fillStyle='#f5efda';c.fillRect(-7,-18,5,6);c.fillRect(3,-18,5,6);c.fillStyle='#28261f';c.fillRect(-4,-17,2,4);c.fillRect(4,-17,2,4);c.restore()}
function drawRecord(c,item,time,d,unitScale=scale){
  const [faceX,faceY]=directionVector(d),frame=time*frameRate();
  if(mode==='gear'){
    const def=item.def,actor={faceX,faceY,appearance:DEFAULT_APPEARANCE,equipment:def.slot?{[def.slot]:item.id}:{},inventory:def.relic?[{type:item.id,qty:1}]:[],animationAction:action(),playerFrame:frame};
    c.save();c.scale(unitScale,unitScale);drawPlayer(c,actor,0,playerMotion);c.restore();return;
  }
  if(item.id==='goomba'){c.save();c.scale(Math.max(1,unitScale*.28),Math.max(1,unitScale*.28));drawGoomba(c,time);c.restore();return}
  const subject=rigSubject(item.id);
  if(item.id==='player'){const actor={faceX,faceY,appearance:DEFAULT_APPEARANCE,equipment:{},inventory:[],animationAction:action(),playerFrame:frame};c.save();c.scale(unitScale,unitScale);drawPlayer(c,actor,0,playerMotion);c.restore();return}
  const actor={kind:item.id,sprite:subject?.sprite||item.id,skin:item.id,faceX,faceY,animationAction:action()||subject?.clip||'idle',playerFrame:frame,moving:true,hp:100,maxHp:100,equipment:{}};
  if(subject){c.save();c.scale(unitScale,unitScale);subject.draw(c,actor,time,subject.data);c.restore()}
  else animator.draw(c,{...actor,x:0,y:0,playerFrame:undefined},time,Math.max(28,52*unitScale/5));
}
function paintStage(){
  const w=canvas.width,h=canvas.height,item=records[chosen];ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#163c38');bg.addColorStop(.65,'#0b2728');bg.addColorStop(1,'#071a1b');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#4a807433';ctx.lineWidth=1;for(let x=w/2%42;x<w;x+=42){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=h/2%42;y<h;y+=42){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  ctx.fillStyle='#d4b97620';ctx.beginPath();ctx.ellipse(w/2,h*.79,162,22,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d4b97677';ctx.stroke();ctx.fillStyle='#d4b976';ctx.fillRect(0,h*.84,w,2);
  ctx.save();ctx.translate(w/2,h*.78);ctx.imageSmoothingEnabled=false;
  try{drawRecord(ctx,item,elapsed,face(),scale*(canvas.getBoundingClientRect().width<600?1.3:1));renderError=''}catch(error){renderError=error.message}
  ctx.restore();if(renderError)$('status').textContent=`Preview unavailable: ${renderError}`;
  const n=frameIndex()+1;$('frame-label').textContent=`FRAME ${String(n).padStart(2,'0')}`;$('frame-count').textContent=`${n} / ${frameTotal()}`;$('frame-slider').max=String(frameTotal()-1);$('frame-slider').value=String(n-1);$('facing-label').textContent=`${directions[face()].toUpperCase()} · ${String(face()+1).padStart(2,'0')} / 08`;
}
function paintThumb(canvasEl,item){const c=canvasEl.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvasEl.width,canvasEl.height);c.translate(canvasEl.width/2,canvasEl.height*.79);try{if(mode==='gear'){c.save();c.scale(3.1,3.1);drawPlayer(c,{faceX:0,faceY:1,appearance:DEFAULT_APPEARANCE,equipment:item.def.slot?{[item.def.slot]:item.id}:{},inventory:item.def.relic?[{type:item.id,qty:1}]:[],animationAction:'idle'},0,playerMotion);c.restore();}else drawRecord(c,item,0,0,item.id==='player'?1.3:.68)}catch{if(mode==='gear'){c.save();c.scale(4,4);paintItem(c,item.id);c.restore()}}}
function makeCards(){const list=$('carousel');list.replaceChildren();for(const [index,item]of records.entries()){const b=document.createElement('button');b.type='button';b.className='unit-card';b.setAttribute('role','option');b.setAttribute('aria-label',`Select ${item.label}`);b.setAttribute('aria-selected',String(index===chosen));b.tabIndex=index===chosen?0:-1;const art=document.createElement('canvas');art.width=112;art.height=94;const name=document.createElement('span');name.textContent=item.label;b.append(art,name);b.onclick=()=>selectItem(index);list.append(b);paintThumb(art,item)}}
function selectItem(index){chosen=(index+records.length)%records.length;elapsed=0;angle=0;playing=true;const item=records[chosen];$('selection-name').textContent=item.label;$('selection-kind').textContent=item.family;$('selection-description').textContent=item.description||'';$('selection-label').textContent=mode==='gear'?'SELECTED GEAR':'SELECTED UNIT';$('position-label').textContent=`${String(chosen+1).padStart(2,'0')} / ${String(records.length).padStart(2,'0')}`;
  const options=actionsFor(item);$('action-select').replaceChildren(...options.map(name=>new Option(nice(name),name)));const preferred=mode==='gear'?'idle':rigSubject(item.id)?.clip||options[0];$('action-select').value=options.includes(preferred)?preferred:options[0];$('stage-overline').textContent=mode==='gear'?`${nice(item.def.slot||'relic').toUpperCase()} · GEAR TURNAROUND`:'UNIT TURNAROUND';$('roster-overline').textContent=mode==='gear'?'EQUIPMENT CATALOG':'FIELD ROSTER';$('roster-title').textContent=mode==='gear'?'Gear':'Units';$('stage-hint').textContent=mode==='gear'?'Equipped on the explorer · eight authored facings':'Eight authored facings · pixel-accurate runtime render';$('status').textContent='';makeCards();paintStage();const list=$('carousel'),card=list.children[chosen];if(card){const cr=card.getBoundingClientRect(),lr=list.getBoundingClientRect();list.scrollTo({left:list.scrollLeft+cr.left-lr.left-(list.clientWidth-cr.width)/2,behavior:'smooth'})}updateControls()}
function updateControls(){ $('play-button').innerHTML=playing?'Ⅱ <span>Pause</span>':'▶ <span>Play</span>';setPressed('play-button',playing);for(const b of document.querySelectorAll('.direction-row button'))b.setAttribute('aria-pressed',String(Number(b.dataset.direction)===face()));}
function setMode(next){mode=next;records=next==='gear'?filteredGear():units;chosen=0;$('turnaround-view').hidden=false;$('screens-view').hidden=true;$('gear-filter-wrap').hidden=next!=='gear';document.querySelectorAll('.view-tabs [data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===next)));selectItem(0);$('collection-count').textContent=next==='gear'?`${gear.length} gear turnarounds`:`${units.length} unit turnarounds`}
function filteredGear(){const filter=$('slot-filter').value;return gear.filter(item=>filter==='all'||(item.def.slot||'relic')===filter)}
function drawScreenGrid(filter='all'){const grid=$('screen-grid');grid.replaceChildren();fetch('./screenshots/manifest.json').then(r=>r.ok?r.json():[]).then(entries=>{const shown=entries.filter(item=>filter==='all'||item.category===filter);$('screen-total').textContent=String(entries.length);$('collection-count').textContent=`${entries.length} game screenshots`;for(const item of shown){const b=document.createElement('button');b.className='screen-card';b.type='button';const img=document.createElement('img');img.src=`./screenshots/${item.file}`;img.alt=item.title;img.loading='lazy';const copy=document.createElement('div');copy.className='card-copy';const type=document.createElement('span');type.className='type';type.textContent=item.category;const title=document.createElement('strong');title.textContent=item.title;const detail=document.createElement('small');detail.textContent=item.detail;b.append(img,copy);copy.append(type,title,detail);b.onclick=()=>openScreen(item);grid.append(b)}}).catch(()=>{grid.innerHTML='<p>Screenshot atlas is unavailable.</p>'})}
function openScreen(item){$('screen-image').src=`./screenshots/${item.file}`;$('screen-image').alt=item.title;$('screen-caption').textContent=`${item.title} · ${item.detail}`;$('screen-dialog').showModal()}
function showScreens(){mode='screens';$('turnaround-view').hidden=true;$('screens-view').hidden=false;document.querySelectorAll('.view-tabs [data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='screens')));drawScreenGrid();}
function tick(now){const dt=Math.min(.06,Math.max(0,(now-last)/1000||0));last=now;const n=frameTotal();if(playing){elapsed+=dt;if(!pressed('loop-toggle')&&elapsed>=(n-1)/frameRate()){elapsed=(n-1)/frameRate();playing=false;updateControls()}if(pressed('loop-toggle')&&elapsed>=n/frameRate())elapsed%=n/frameRate()}if(pressed('spin-toggle'))angle=(angle+dt*1.15)%(Math.PI*2);paintStage();requestAnimationFrame(tick)}
function setFrame(i){elapsed=Math.max(0,Math.min(frameTotal()-1,i))/frameRate();playing=false;updateControls();paintStage()}

document.querySelectorAll('.view-tabs [data-view]').forEach(button=>button.addEventListener('click',()=>button.dataset.view==='screens'?showScreens():setMode(button.dataset.view)));
document.querySelectorAll('.screen-filters button').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.screen-filters button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));drawScreenGrid(button.dataset.filter)}));
for(const slot of slots){const option=new Option(nice(slot),slot);$('slot-filter').append(option)}
$('slot-filter').addEventListener('change',()=>{records=filteredGear();chosen=0;selectItem(0)});
$('action-select').addEventListener('change',()=>{elapsed=0;playing=true;makeCards();paintStage()});
$('play-button').addEventListener('click',()=>{playing=!playing;updateControls()});$('spin-toggle').addEventListener('click',()=>setPressed('spin-toggle',!pressed('spin-toggle')));$('loop-toggle').addEventListener('click',()=>setPressed('loop-toggle',!pressed('loop-toggle')));
$('frame-slider').addEventListener('input',e=>setFrame(Number(e.target.value)));$('frame-prev').onclick=()=>setFrame(frameIndex()-1);$('frame-next').onclick=()=>setFrame(frameIndex()+1);
$('previous').onclick=()=>selectItem(chosen-1);$('next').onclick=()=>selectItem(chosen+1);
document.querySelectorAll('.direction-row button').forEach(b=>b.addEventListener('click',()=>{angle=Number(b.dataset.direction)*Math.PI/4;setPressed('spin-toggle',false);updateControls();paintStage()}));
$('scale-control').addEventListener('input',e=>{scale=Number(e.target.value);$('scale-label').value=`${scale.toFixed(1)}×`;paintStage()});$('close-screen').onclick=()=>$('screen-dialog').close();$('screen-dialog').addEventListener('click',e=>{if(e.target===$('screen-dialog'))$('screen-dialog').close()});
document.addEventListener('keydown',e=>{if($('screen-dialog').open)return;if(e.code==='Space'){e.preventDefault();$('play-button').click()}else if(e.key==='ArrowLeft')selectItem(chosen-1);else if(e.key==='ArrowRight')selectItem(chosen+1);else if(e.key==='ArrowUp'){$('frame-prev').click()}else if(e.key==='ArrowDown'){$('frame-next').click()}});
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);canvas.dataset.x=String(e.clientX);canvas.dataset.angle=String(angle)});canvas.addEventListener('pointermove',e=>{if(!canvas.hasPointerCapture(e.pointerId))return;const dx=e.clientX-Number(canvas.dataset.x);angle=(Number(canvas.dataset.angle)+dx*.015)%(Math.PI*2);setPressed('spin-toggle',false);paintStage();updateControls()});
try{await assets.load()}catch(error){$('status').textContent=`Some game art could not load: ${error.message}`}
$('unit-total').textContent=String(units.length);$('gear-total').textContent=String(gear.length);setMode('units');requestAnimationFrame(tick);


