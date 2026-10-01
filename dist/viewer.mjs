import {RIG_SUBJECTS, rigSubject} from './src/rig-subjects.mjs';
import {creatures, applyDefinitions} from './src/definitions.mjs';
import {Assets} from './src/assets.mjs';
import {Animator} from './src/animation.mjs';

const $ = id => document.getElementById(id);
const stage = $('stage');
const ink = stage.getContext('2d');
const carousel = $('carousel');
const select = $('animation-select');
const assets = new Assets();
const animator = new Animator(assets);
const units = [
  {id:'player', label:'Player', family:'Hero rig'},
  ...Object.keys(creatures).map(id => ({id,label:id.replaceAll('_',' ').replace(/\b\w/g, letter=>letter.toUpperCase()),family:'Game unit'})),
  {id:'trap',label:'Trap',family:'Rigged unit'},
  {id:'goomba',label:'Goomba',family:'TV platform enemy'},
];
let chosen = 0;
let playing = true;
let elapsed = 0;
let angle = 0;
let last = 0;
let renderError = false;

function modelFor(unit){
  return rigSubject(unit.id)?.data || creatures[unit.id]?.rig || null;
}
function clipsFor(unit){
  if(unit.id==='goomba')return ['walk','squash'];
  const names=Object.keys(modelFor(unit)?.clips || {});
  return names.length ? names : ['idle'];
}
function clipFor(unit){return modelFor(unit)?.clips?.[select.value] || null;}
function label(name){return name.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());}
function drawGoomba(c,time,action){
  const stride=action==='walk'?Math.sin(time*12)*2:0;
  const squash=action==='squash' ? Math.min(1,time*2) : 0;
  c.save();c.scale(1,1-squash*.68);c.fillStyle='#432d24';c.fillRect(-11,-9+stride,8,8);c.fillRect(3,-9-stride,8,8);
  c.fillStyle='#9c6040';c.beginPath();c.ellipse(0,-14,14,13,0,0,Math.PI*2);c.fill();
  c.fillStyle='#c89460';c.fillRect(-9,-19,18,8);c.fillStyle='#f5efda';c.fillRect(-7,-18,5,6);c.fillRect(3,-18,5,6);
  c.fillStyle='#28261f';c.fillRect(-4,-17,2,4);c.fillRect(4,-17,2,4);c.restore();
}
function drawUnit(c,unit,time,facing,scale=1){
  const subject=rigSubject(unit.id);
  const actor={kind:unit.id,sprite:unit.id,skin:unit.id,faceX:Math.sin(facing),faceY:Math.cos(facing),animationAction:select.value || subject?.clip || 'idle',playerFrame:time*(subject?.data?.clips?.[select.value]?.fps || 8),moving:true,hp:100,maxHp:100,equipment:{}};
  if(unit.id==='goomba') {c.save();c.scale(scale,scale);drawGoomba(c,time,actor.animationAction);c.restore();return;}
  if(subject){
    c.save();c.scale(scale,scale);subject.draw(c,actor,time,subject.data);c.restore();
  }else{
    animator.draw(c,{...actor,x:0,y:0,playerFrame:undefined},time,Math.max(28,52*scale));
  }
}
function paintStage(){
  const w=stage.width,h=stage.height,unit=units[chosen];
  ink.clearRect(0,0,w,h);
  const background=ink.createLinearGradient(0,0,0,h);background.addColorStop(0,'#163c38');background.addColorStop(.65,'#0b2728');background.addColorStop(1,'#071a1b');ink.fillStyle=background;ink.fillRect(0,0,w,h);
  ink.strokeStyle='#4a807444';ink.lineWidth=1;
  for(let x=w/2%42;x<w;x+=42){ink.beginPath();ink.moveTo(x,0);ink.lineTo(x,h);ink.stroke();}
  for(let y=h/2%42;y<h;y+=42){ink.beginPath();ink.moveTo(0,y);ink.lineTo(w,y);ink.stroke();}
  ink.fillStyle='#d4b97622';ink.beginPath();ink.ellipse(w/2,h*.79,160,23,0,0,Math.PI*2);ink.fill();
  ink.strokeStyle='#d4b97688';ink.beginPath();ink.ellipse(w/2,h*.79,160,23,0,0,Math.PI*2);ink.stroke();
  ink.fillStyle='#d4b976';ink.fillRect(0,h*.84,w,2);
  ink.save();ink.translate(w/2,h*.78);ink.imageSmoothingEnabled=false;
  const subject=rigSubject(unit.id),scale=subject ? (subject.scale || 5) : 4.2;
  try{drawUnit(ink,unit,elapsed,angle,scale);renderError=false;}
  catch(error){if(!renderError){$('status').textContent=`Preview unavailable for ${unit.label}: ${error.message}`;renderError=true;}}
  ink.restore();
  const clip=clipFor(unit);
  const frame=clip?Math.min(clip.length,Math.floor(elapsed*(clip.fps || 8))+1):1;
  $('frame-label').textContent=`FRAME ${String(frame).padStart(2,'0')}`;
  $('facing-label').textContent=`FACING ${String(Math.round(((angle%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI/4))%8+1).padStart(2,'0')} / 08`;
}
function selectUnit(index){
  chosen=(index+units.length)%units.length;elapsed=0;angle=0;playing=true;
  const unit=units[chosen],subject=rigSubject(unit.id);
  $('unit-name').textContent=unit.label;
  $('unit-kind').textContent=subject?.name || unit.family;
  $('position-label').textContent=`${String(chosen+1).padStart(2,'0')} / ${String(units.length).padStart(2,'0')}`;
  select.replaceChildren(...clipsFor(unit).map(name=>new Option(label(name),name)));
  select.value=clipsFor(unit).includes(subject?.clip)?subject.clip:clipsFor(unit)[0];
  $('status').textContent='';
  updatePlayButton();
  [...carousel.children].forEach((card,i)=>{card.setAttribute('aria-selected',String(i===chosen));card.tabIndex=i===chosen?0:-1;});
  const card=carousel.children[chosen];
  if(card){
    if(card.offsetLeft<carousel.scrollLeft)carousel.scrollTo({left:card.offsetLeft-10,behavior:'smooth'});
    else if(card.offsetLeft+card.offsetWidth>carousel.scrollLeft+carousel.clientWidth)
      carousel.scrollTo({left:card.offsetLeft+card.offsetWidth-carousel.clientWidth+10,behavior:'smooth'});
  }
  paintStage();
}
function updatePlayButton(){
  $('play-button').textContent=playing?'Stop animation':'Play animation';
  $('play-button').setAttribute('aria-pressed',String(playing));
}
function makeCards(){
  for(const [index,unit] of units.entries()){
    const button=document.createElement('button');button.type='button';button.className='unit-card';button.setAttribute('role','option');button.setAttribute('aria-label',`Select ${unit.label}`);
    const art=document.createElement('canvas');art.width=120;art.height=108;
    const name=document.createElement('span');name.textContent=unit.label;
    button.append(art,name);button.addEventListener('click',()=>selectUnit(index));carousel.append(button);
    const ctx=art.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.translate(60,83);
    const subject=rigSubject(unit.id);const scale=subject?(subject.scale||5)*.34:1.3;
    try{drawUnit(ctx,unit,0,0,scale);}catch{ctx.fillStyle='#d2b568';ctx.font='34px serif';ctx.fillText('✦',-16,-15);}
  }
}
function tick(timestamp){
  const dt=Math.min(.06,Math.max(0,(timestamp-last)/1000 || 0));last=timestamp;
  const unit=units[chosen],clip=clipFor(unit);
  if(playing){
    elapsed+=dt;
    if(clip && !$('loop-toggle').checked && elapsed>=(clip.length-1)/(clip.fps||8)){elapsed=(clip.length-1)/(clip.fps||8);playing=false;updatePlayButton();}
    if(clip && $('loop-toggle').checked && elapsed>clip.length/(clip.fps||8))elapsed%=clip.length/(clip.fps||8);
    if(unit.id==='goomba' && !$('loop-toggle').checked && elapsed>=1){elapsed=1;playing=false;updatePlayButton();}
    if(unit.id==='goomba' && $('loop-toggle').checked && elapsed>1)elapsed%=1;
  }
  if($('spin-toggle').checked)angle=(angle+dt*1.15)%(Math.PI*2);
  paintStage();requestAnimationFrame(tick);
}

$('previous').addEventListener('click',()=>selectUnit(chosen-1));
$('next').addEventListener('click',()=>selectUnit(chosen+1));
$('play-button').addEventListener('click',()=>{if(!playing){const clip=clipFor(units[chosen]);if(clip && elapsed>=(clip.length-1)/(clip.fps||8))elapsed=0;}playing=!playing;updatePlayButton();});
select.addEventListener('change',()=>{elapsed=0;playing=true;updatePlayButton();paintStage();});
carousel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();selectUnit(chosen+(event.key==='ArrowRight'?1:-1));carousel.children[chosen]?.focus();}});

try{
  const [rigs]=await Promise.all([fetch('./authored/rigs.json').then(response=>{if(!response.ok)throw Error('Shared rigs could not be loaded');return response.json();}),assets.load()]);
  applyDefinitions(rigs,[],{},{spriteOverrides:false});
  $('roster-count').textContent=`${units.length} units`;
  makeCards();selectUnit(0);requestAnimationFrame(tick);
}catch(error){$('unit-name').textContent='Viewer could not load';$('status').textContent=error.message;console.error(error);}
