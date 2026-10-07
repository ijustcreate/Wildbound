import {RIG_SUBJECTS, rigSubject} from './src/rig-subjects.mjs';
import {creatures} from './src/definitions.mjs';
import {Assets} from './src/assets.mjs';
import {Animator} from './src/animation.mjs';
import {prepareRuntime} from './runtime.mjs';

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
let rigRevision = '';
let pendingRegion = null;
let reviewRegion = null;
let dragStart = null;
let feedbackRequest = 0;
const goodLabels = {silhouette:'Silhouette',motion:'Motion',timing:'Timing',detail:'Detail'};
const badLabels = {pose:'Awkward pose',clipping:'Clipping',jitter:'Jitter',readability:'Hard to read'};
const pressed = id => $(id).getAttribute('aria-pressed') === 'true';
const setPressed = (id,value) => {$(id).setAttribute('aria-pressed',String(value));$(id).classList.toggle('active',value);};

function modelFor(unit){
  return rigSubject(unit.id)?.data || creatures[unit.id]?.rig || null;
}
function clipsFor(unit){
  if(unit.id==='goomba')return ['walk','squash'];
  const names=Object.keys(modelFor(unit)?.clips || {});
  return names.length ? names : ['idle'];
}
function clipFor(unit){return modelFor(unit)?.clips?.[select.value] || null;}
function frameTotal(){return units[chosen].id==='goomba'?8:Math.max(1,Math.floor(clipFor(units[chosen])?.length || 1));}
function frameRate(){return units[chosen].id==='goomba'?8:(clipFor(units[chosen])?.fps || 8);}
function frameIndex(){return Math.min(frameTotal()-1,Math.floor(elapsed*frameRate()));}
function facingIndex(){return Math.round(((angle%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI/4))%8;}
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
  const subject=rigSubject(unit.id),boost=stage.getBoundingClientRect().width<600?1.6:1;
  const scale=(subject ? (subject.scale || 5) : 4.2)*boost;
  try{drawUnit(ink,unit,elapsed,angle,scale);renderError=false;}
  catch(error){if(!renderError){$('status').textContent=`Preview unavailable for ${unit.label}: ${error.message}`;renderError=true;}}
  ink.restore();
  const frame=frameIndex()+1;
  $('frame-label').textContent=`FRAME ${String(frame).padStart(2,'0')}`;
  $('frame-count').textContent=`${frame} / ${frameTotal()}`;
  $('frame-slider').max=String(frameTotal()-1);
  $('frame-slider').value=String(frame-1);
  $('facing-label').textContent=`FACING ${String(facingIndex()+1).padStart(2,'0')} / 08`;
  updateFeedbackContext();
}
function selectUnit(index){
  chosen=(index+units.length)%units.length;elapsed=0;angle=0;playing=true;
  const unit=units[chosen],subject=rigSubject(unit.id);
  $('unit-name').textContent=unit.label;
  $('unit-kind').textContent=subject?.name || unit.family;
  $('position-label').textContent=`${String(chosen+1).padStart(2,'0')} / ${String(units.length).padStart(2,'0')}`;
  select.replaceChildren(...clipsFor(unit).map(name=>new Option(label(name),name)));
  select.value=unit.id==='panther'?'prowl':clipsFor(unit).includes(subject?.clip)?subject.clip:clipsFor(unit)[0];
  $('status').textContent='';
  setPressed('mark-button',false);$('mark-layer').classList.remove('active');$('mark-hint').textContent='SELECT A UNIT BELOW';
  pendingRegion=null;reviewRegion=null;showRegion();resetFeedbackForm();
  updatePlayButton();
  [...carousel.children].forEach((card,i)=>{card.setAttribute('aria-selected',String(i===chosen));card.tabIndex=i===chosen?0:-1;});
  const card=carousel.children[chosen];
  if(card){
    if(card.offsetLeft<carousel.scrollLeft)carousel.scrollTo({left:card.offsetLeft-10,behavior:'smooth'});
    else if(card.offsetLeft+card.offsetWidth>carousel.scrollLeft+carousel.clientWidth)
      carousel.scrollTo({left:card.offsetLeft+card.offsetWidth-carousel.clientWidth+10,behavior:'smooth'});
  }
  updateFeedbackContext();
  loadFeedback();
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
    if(!pressed('loop-toggle') && elapsed>=(frameTotal()-1)/frameRate()){elapsed=(frameTotal()-1)/frameRate();playing=false;updatePlayButton();}
    if(pressed('loop-toggle') && elapsed>=frameTotal()/frameRate())elapsed%=frameTotal()/frameRate();
  }
  if(pressed('spin-toggle'))angle=(angle+dt*1.15)%(Math.PI*2);
  paintStage();requestAnimationFrame(tick);
}

function setFrame(index){
  elapsed=Math.max(0,Math.min(frameTotal()-1,index))/frameRate();
  playing=false;reviewRegion=null;pendingRegion=null;showRegion();updatePlayButton();paintStage();
}
function updateFeedbackContext(){
  $('feedback-context').textContent=`${units[chosen].label} · ${label(select.value)} · frame ${frameIndex()+1} / ${frameTotal()} · facing ${facingIndex()+1}`;
}
function resetFeedbackForm(){
  document.querySelectorAll('.tag-row button').forEach(button=>button.setAttribute('aria-pressed','false'));
  $('feedback-comment').value='';$('feedback-status').textContent='';
}
function showRegion(){
  const region=pendingRegion||reviewRegion,box=$('mark-box');
  box.hidden=!region;
  if(region){box.style.left=`${region.x*100}%`;box.style.top=`${region.y*100}%`;box.style.width=`${region.w*100}%`;box.style.height=`${region.h*100}%`;}
  $('clear-mark').hidden=!pendingRegion&&!reviewRegion;
  $('region-summary').textContent=pendingRegion?'Area marked on preview':reviewRegion?'Viewing a saved area':'No area marked';
}
function normalizedPoint(event){
  const bounds=$('mark-layer').getBoundingClientRect();
  return {x:Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width)),y:Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height))};
}
function regionBetween(start,end){
  const x=Math.min(start.x,end.x),y=Math.min(start.y,end.y);
  const w=Math.abs(start.x-end.x),h=Math.abs(start.y-end.y);
  if(w<.015&&h<.015)return {x:Math.max(0,start.x-.05),y:Math.max(0,start.y-.05),w:Math.min(.1,1-Math.max(0,start.x-.05)),h:Math.min(.1,1-Math.max(0,start.y-.05))};
  const width=Math.max(.005,w),height=Math.max(.005,h);
  return {x:Math.min(x,1-width),y:Math.min(y,1-height),w:width,h:height};
}
function renderFeedback(records){
  const list=$('feedback-list');list.replaceChildren();
  $('feedback-count').textContent=`${records.length} ${records.length===1?'note':'notes'}`;
  if(!records.length){const empty=document.createElement('p');empty.className='empty-notes';empty.textContent='No notes for this animation yet.';list.append(empty);return;}
  for(const record of records){
    const button=document.createElement('button');button.type='button';button.className='feedback-note';
    const meta=document.createElement('span');meta.className='meta';
    const location=document.createElement('span');location.textContent=`Frame ${record.frameIndex+1} · facing ${record.facingIndex+1}${record.regionX!=null?' · marked area':''}`;
    const date=document.createElement('span');date.textContent=new Date(record.createdAt).toLocaleDateString();meta.append(location,date);button.append(meta);
    const tags=document.createElement('span');tags.className='note-tags';
    for(const tag of JSON.parse(record.goodTags||'[]')){const item=document.createElement('em');item.textContent=goodLabels[tag]||tag;tags.append(item);}
    for(const tag of JSON.parse(record.badTags||'[]')){const item=document.createElement('em');item.className='bad';item.textContent=badLabels[tag]||tag;tags.append(item);}
    button.append(tags);
    if(record.comment){const comment=document.createElement('p');comment.textContent=record.comment;button.append(comment);}
    button.addEventListener('click',()=>{
      setFrame(record.frameIndex);angle=record.facingIndex*Math.PI/4;setPressed('spin-toggle',false);
      pendingRegion=null;reviewRegion=record.regionX==null?null:{x:record.regionX,y:record.regionY,w:record.regionW,h:record.regionH};
      showRegion();updateFeedbackContext();paintStage();window.scrollTo({top:0,behavior:'smooth'});
    });
    list.append(button);
  }
}
async function loadFeedback(){
  const requestId=++feedbackRequest,unitId=units[chosen].id,animationId=select.value;
  $('feedback-list').textContent='Loading notes…';
  try{
    const response=await fetch(`/api/feedback?unit=${encodeURIComponent(unitId)}&animation=${encodeURIComponent(animationId)}`);
    const data=await response.json();if(!response.ok)throw Error(data.error||'Could not load notes.');
    if(requestId===feedbackRequest)renderFeedback(data.feedback);
  }catch(error){if(requestId===feedbackRequest){$('feedback-list').textContent='Notes unavailable. Try reselecting this animation.';$('feedback-status').textContent=error.message;}}
}

$('previous').addEventListener('click',()=>selectUnit(chosen-1));
$('next').addEventListener('click',()=>selectUnit(chosen+1));
$('play-button').addEventListener('click',()=>{if(!playing&&elapsed>=(frameTotal()-1)/frameRate())elapsed=0;playing=!playing;updatePlayButton();});
select.addEventListener('change',()=>{elapsed=0;playing=true;setPressed('mark-button',false);$('mark-layer').classList.remove('active');$('mark-hint').textContent='SELECT A UNIT BELOW';pendingRegion=null;reviewRegion=null;showRegion();resetFeedbackForm();updatePlayButton();loadFeedback();paintStage();});
carousel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();selectUnit(chosen+(event.key==='ArrowRight'?1:-1));carousel.children[chosen]?.focus();}});
$('loop-toggle').addEventListener('click',()=>setPressed('loop-toggle',!pressed('loop-toggle')));
$('spin-toggle').addEventListener('click',()=>setPressed('spin-toggle',!pressed('spin-toggle')));
$('frame-prev').addEventListener('click',()=>setFrame(frameIndex()-1));
$('frame-next').addEventListener('click',()=>setFrame(frameIndex()+1));
$('frame-slider').addEventListener('input',event=>setFrame(Number(event.target.value)));
$('mark-button').addEventListener('click',()=>{
  const active=!pressed('mark-button');setPressed('mark-button',active);
  $('mark-layer').classList.toggle('active',active);
  $('mark-hint').textContent=active?'DRAG TO MARK AN AREA':'SELECT A UNIT BELOW';
  if(active){playing=false;updatePlayButton();setPressed('spin-toggle',false);reviewRegion=null;pendingRegion=null;showRegion();}
});
$('clear-mark').addEventListener('click',()=>{pendingRegion=null;reviewRegion=null;showRegion();});
$('mark-layer').addEventListener('pointerdown',event=>{
  if(!pressed('mark-button'))return;
  event.preventDefault();dragStart=normalizedPoint(event);$('mark-layer').setPointerCapture(event.pointerId);
  pendingRegion=regionBetween(dragStart,dragStart);showRegion();
});
$('mark-layer').addEventListener('pointermove',event=>{
  if(!dragStart)return;pendingRegion=regionBetween(dragStart,normalizedPoint(event));showRegion();
});
$('mark-layer').addEventListener('pointerup',event=>{
  if(!dragStart)return;pendingRegion=regionBetween(dragStart,normalizedPoint(event));dragStart=null;showRegion();
  setPressed('mark-button',false);$('mark-layer').classList.remove('active');$('mark-hint').textContent='AREA MARKED';
});
function freezeReview(){playing=false;updatePlayButton();setPressed('spin-toggle',false);paintStage();}
document.querySelectorAll('.tag-row button').forEach(button=>button.addEventListener('click',()=>{
  freezeReview();button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));
}));
$('feedback-comment').addEventListener('focus',freezeReview);
$('feedback-form').addEventListener('submit',async event=>{
  event.preventDefault();freezeReview();
  const goodTags=[...document.querySelectorAll('#good-tags button[aria-pressed=true]')].map(button=>button.dataset.tag);
  const badTags=[...document.querySelectorAll('#bad-tags button[aria-pressed=true]')].map(button=>button.dataset.tag);
  const comment=$('feedback-comment').value.trim();
  if(!goodTags.length&&!badTags.length&&!comment){$('feedback-status').textContent='Choose a tag or write a comment.';return;}
  const button=$('save-feedback');button.disabled=true;$('feedback-status').textContent='Saving…';
  try{
    const response=await fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      unitId:units[chosen].id,animationId:select.value,frameIndex:frameIndex(),facingIndex:facingIndex(),
      region:pendingRegion,goodTags,badTags,comment,rigRevision,
    })});
    const data=await response.json();if(!response.ok)throw Error(data.error||'Could not save feedback.');
    $('feedback-status').textContent='Feedback saved.';resetFeedbackForm();$('feedback-status').textContent='Feedback saved.';
    pendingRegion=null;reviewRegion=null;showRegion();await loadFeedback();
  }catch(error){$('feedback-status').textContent=error.message;}
  finally{button.disabled=false;}
});

try{
  const snapshot=await prepareRuntime(assets);
  rigRevision=snapshot.revision;
  $('roster-count').textContent=`${units.length} units`;
  makeCards();selectUnit(Math.max(0,units.findIndex(unit=>unit.id===(new URLSearchParams(location.search).get('unit')||'player'))));requestAnimationFrame(tick);
}catch(error){$('unit-name').textContent='Viewer could not load';$('status').textContent=error.message;console.error(error);}
