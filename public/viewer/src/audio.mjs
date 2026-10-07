import {waterAt} from './environment.mjs';
import {boardTableSupport} from './board-table.mjs';
import {playThunder} from './thunder.mjs';
import {CUES,creatureCue,SOUND_FILES} from './sound-bank.mjs';
import {audioDistance,audioPosition,sameAudioRoom} from './adaptive-music-threat.mjs';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
export const AMBIENT_TRACKS={forest:'forest_ambient',desert:null,ice:null,house:null,temple:null};
export const AUDIO_LIMITS=Object.freeze({voices:24,cache:96,cooldowns:128,variants:96});
function boundedSet(map,key,value,limit){map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);}
export function footstepMaterial(game,p){
 if(p.room)return p.room==='temple-upper'||game.portals?.find(d=>d.id===p.room)?.oldWell?'stone':'wood';
 const ground=waterAt(game,p.x,p.y),biome=game.generatedEnvironment||game.environment;
 if(['water','shallow','floodbridge'].includes(ground))return 'water';
 if(ground==='mud')return 'mud';
 if(['bridge','wood'].includes(ground)||boardTableSupport(game,p.x,p.y)>0&&p.groundHeight>=16)return 'wood';
 if(game.house?.floors?.some(f=>p.x>=f.x&&p.y>=f.y&&p.x<f.x+f.w&&p.y<f.y+f.h))return 'wood';
 if(['stone','path','tile'].includes(ground)||biome==='temple')return 'stone';
 if(biome==='ice'||['snow','ice'].includes(ground))return 'snow';
 if(biome==='desert'||['sand','quicksand'].includes(ground))return 'sand';
 return 'grass';
}
export function landingCue(game,p){
 const material=footstepMaterial(game,p);
 return {...CUES[material],key:'land:'+material,group:'movement',priority:40,cooldown:220,gain:material==='water'?.24:.2,rate:.83,maxDuration:.55};
}
export class GameAudio {
 constructor(){
  this.settings={master:.8,sfx:.8,ui:.65,ambience:.45,night:false};
  try{const saved=JSON.parse(localStorage.getItem('wildbound-mixer')||'{}');for(const k of Object.keys(this.settings))if(k in saved)this.settings[k]=k==='night'?!!saved[k]:clamp(saved[k]);}catch{}
  this.cache=new Map();this.last=new Map();this.variants=new Map();this.actorLast=new WeakMap();this.voices=new Set();this.voiceInfo=new WeakMap();this.pending=new Set();this.previous=new WeakMap();this.playerState=new WeakMap();this.listeners=[];this.enabled=true;this.unlocked=false;this.epoch=0;
 }
 unlock(){
  if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.compressor=this.ctx.createDynamicsCompressor();this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);this.buses={};for(const b of ['sfx','ui','ambience']){this.buses[b]=this.ctx.createGain();this.buses[b].connect(this.master);}this.apply();}
  this.unlocked=true;this.ctx.resume().catch(()=>{});
 }
 cancelPending(){this.epoch++;this.pending.clear();}
 apply(){
  if(!this.ctx)return;
  const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.enabled?clamp(this.settings.master):0,t,.03);
  for(const b of Object.keys(this.buses))this.buses[b].gain.setTargetAtTime(clamp(this.settings[b]),t,.03);
  this.compressor.threshold.value=this.settings.night?-28:-14;this.compressor.knee.value=18;this.compressor.ratio.value=this.settings.night?8:4;
  if(!this.enabled||!this.settings.master){this.cancelPending();for(const s of this.voices)this.stopVoice(s);this.ambient(null);}
 }
 set(k,v){if(!(k in this.settings))return;this.settings[k]=k==='night'?!!v:clamp(v);try{localStorage.setItem('wildbound-mixer',JSON.stringify(this.settings));}catch{}this.apply();}
 async buffer(file){
  if(!this.ctx||!SOUND_FILES.has(file))return null;
  if(this.cache.has(file)){const promise=this.cache.get(file);boundedSet(this.cache,file,promise,AUDIO_LIMITS.cache);return promise;}
  const promise=fetch(file).then(r=>{if(!r.ok)throw Error(file);return r.arrayBuffer();}).then(b=>this.ctx.decodeAudioData(b)).then(b=>{
   let peak=0;for(let c=0;c<b.numberOfChannels;c++)for(const v of b.getChannelData(c))peak=Math.max(peak,Math.abs(v));
   // Reduce hot recordings without amplifying quiet background/noise to the same level.
   const scale=peak>.001?Math.min(1,.8/peak):1;
   for(let c=0;c<b.numberOfChannels;c++){const a=b.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=scale;}
   return b;
  }).catch(e=>{console.warn('Audio asset',file,e);return null;});
  boundedSet(this.cache,file,promise,AUDIO_LIMITS.cache);return promise;
 }
 spatial(cue,actor){
  if(!actor||cue.spatial===false||cue.bus==='ui')return {attenuation:1,pan:0};
  let listener=null,distance=Infinity;
  for(const p of this.listeners.length?this.listeners:this.listener?[this.listener]:[]){const d=audioDistance(actor,p);if(d<distance){listener=p;distance=d;}}
  if(!listener)return {attenuation:0,pan:0};
  const radius=cue.distance??650,falloff=clamp((distance-45)/(radius-45));
  const a=audioPosition(actor),p=audioPosition(listener);
  return {attenuation:(1-falloff)**2,pan:Math.max(-.8,Math.min(.8,(a.x-p.x)/450))};
 }
 stopVoice(source){try{source.stop();}catch{}this.voices.delete(source);}
 reserve(token){
  const all=[...this.pending,...[...this.voices].map(source=>this.voiceInfo.get(source)||{source,priority:10,group:'weather',at:0})];
  const group=all.filter(v=>v.group===token.group),same=all.filter(v=>v.key===token.key&&v.actor===token.actor);
  const pool=same.length>=2?same:group.length>=token.polyphony?group:all.length>=AUDIO_LIMITS.voices?all:null;
  if(pool){
   const low=pool.slice().sort((a,b)=>a.priority-b.priority||a.at-b.at)[0];
   if(!low||low.priority>token.priority||low.priority===token.priority&&token.priority<60)return false;
   if(low.source)this.stopVoice(low.source);else this.pending.delete(low);
  }
  this.pending.add(token);return true;
 }
 async play(name,actor){
  if(!this.enabled||!this.unlocked||!this.settings.master)return;
  const cue=typeof name==='object'?name:CUES[name];if(!cue?.files?.length||!clamp(this.settings[cue.bus||'sfx']))return;
  const {attenuation}=this.spatial(cue,actor);if(attenuation<=.002)return;
  const key=cue.key|| (typeof name==='string'?name:cue.files[0]),now=performance.now();
  let cooldowns=this.last;
  if(actor&&typeof actor==='object'){if(!this.actorLast.has(actor))this.actorLast.set(actor,new Map());cooldowns=this.actorLast.get(actor);}
  if(now-(cooldowns.get(key)??-10000)<(cue.cooldown??160))return;
  boundedSet(cooldowns,key,now,AUDIO_LIMITS.cooldowns);
  const previous=this.variants.get(key),choices=cue.files.filter(f=>f!==previous),pool=choices.length?choices:cue.files;
  const file=pool[Math.floor(Math.random()*pool.length)];boundedSet(this.variants,key,file,AUDIO_LIMITS.variants);
  const token={key,group:cue.group||'action',priority:cue.priority??45,polyphony:cue.polyphony??6,at:now,epoch:this.epoch,room:actor?.room||null,actor,cue};
  if(!this.reserve(token))return;
  const buffer=await this.buffer(file);
  if(!this.pending.delete(token)||!buffer||!this.enabled||token.epoch!==this.epoch||!clamp(this.settings[cue.bus||'sfx'])||token.room!==(actor?.room||null))return;
  const pos=this.spatial(cue,actor);if(pos.attenuation<=.002)return;
  // Re-reserve after decode, including active voices created by other completed loads.
  if(!this.reserve(token))return;this.pending.delete(token);
  const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),p=this.ctx.createStereoPanner();
  s.buffer=buffer;s.playbackRate.value=(cue.rate||1)*(cue.bus==='ui'?1:.97+Math.random()*.06);p.pan.value=pos.pan;
  const duration=Math.min(buffer.duration/s.playbackRate.value,cue.maxDuration||2.5),t=this.ctx.currentTime,volume=(cue.gain??.25)*pos.attenuation;
  const attack=Math.min(.008,duration/4),release=Math.min(.07,duration/3);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+attack);g.gain.setValueAtTime(volume,t+duration-release);g.gain.linearRampToValueAtTime(0,t+duration);
  s.connect(g);g.connect(p);p.connect(this.buses[cue.bus||'sfx']);this.voices.add(s);this.voiceInfo.set(s,{...token,source:s});
  s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();p.disconnect();};s.start();s.stop(t+duration);
  if(['event','win','lose','death'].includes(name))this.duckUntil=now+1200;
  return s;
 }
 async ambient(name){
  if(!this.enabled||!this.settings.master||!this.settings.ambience)name=null;
  if(!this.unlocked){this.ambientName=null;return;}
  if(this.ambientName===name)return;this.ambientName=name;const serial=(this.ambientSerial||0)+1;this.ambientSerial=serial;
  if(this.ambientSource){if(this.ambientRetired){try{this.ambientRetired.s.stop();}catch{}}const old=this.ambientSource;this.ambientRetired=old;old.g.gain.setTargetAtTime(0,this.ctx.currentTime,.25);try{old.s.stop(this.ctx.currentTime+.8);}catch{}this.ambientSource=null;}
  if(!name)return;const cue=CUES[name];if(!cue)return;const raw=await this.buffer(cue.files[0]);
  if(!raw||serial!==this.ambientSerial||!this.enabled||!this.settings.ambience)return;
  const overlap=Math.min(raw.sampleRate,Math.floor(raw.length/4)),length=raw.length-overlap,b=this.ctx.createBuffer(raw.numberOfChannels,length,raw.sampleRate);
  for(let c=0;c<b.numberOfChannels;c++){const a=raw.getChannelData(c),out=b.getChannelData(c);out.set(a.subarray(0,length));for(let i=0;i<overlap;i++){const f=i/overlap;out[i]=a[i]*f+a[length+i]*(1-f);}}
  const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=b;s.loop=true;s.connect(g);g.connect(this.buses.ambience);g.gain.value=0;g.gain.setTargetAtTime(cue.gain,this.ctx.currentTime,.6);s.onended=()=>{if(this.ambientRetired?.s===s)this.ambientRetired=null;s.disconnect();g.disconnect();};s.start();this.ambientSource={s,g};
 }
 update(game,active){
  if(!this.unlocked)return;
  if(this.game!==game||this.seed!==game.seed){
   this.cancelPending();this.previous=new WeakMap();this.playerState=new WeakMap();this.actorLast=new WeakMap();this.last.clear();this.game=game;this.seed=game.seed;
   for(const s of this.voices)if(this.voiceInfo.get(s)?.group!=='ui')this.stopVoice(s);
  }
  this.listeners=(game.players||[]).filter(p=>p.hp>0);this.listener=this.listeners[0];
  for(const s of this.voices){const info=this.voiceInfo.get(s);if(info?.actor&&this.spatial(info.cue,info.actor).attenuation<=.002)this.stopVoice(s);}
  const biome=game.generatedEnvironment||game.environment||'forest';
  const ambientCue=['monsoon','thunderstorm'].includes(game.weather?.type)?'rain':(AMBIENT_TRACKS[biome]||'wind');
  this.ambient(active&&!['won','lost','lobby'].includes(game.phase)&&this.listeners.some(p=>!p.room)?ambientCue:null);
  const thunder=active&&game.phase==='play'&&game.weather?.type==='thunderstorm'&&this.listeners.some(p=>!p.room)?game.seed+':'+Math.floor(game.time/9):null;
  if(thunder&&thunder!==this.thunderCycle&&this.voices.size+this.pending.size<AUDIO_LIMITS.voices)playThunder(this);this.thunderCycle=thunder;
  if(!active&&this.wasActive)this.cancelPending();this.wasActive=active;
  if(!active&&game.phase!=='lobby')return;
  for(const e of active?game.enemies||[]:[]){
   const old=this.previous.get(e);
   if(e.hp>0&&!e.practiceTarget){if(!old)this.play(creatureCue(e.kind,'spawn'),e);else{
    if(old.kind!==e.kind)this.play('hatch',e);
    if(e.kind!=='panther'&&((e.attack||0)>old.attack+.03||e.state!==old.state&&['windup','breath','rocklift'].includes(e.state)))this.play(creatureCue(e.kind,'attack'),e);
    if(e.hp<old.hp)this.play(creatureCue(e.kind,'hurt'),e);
   }}
   this.previous.set(e,{kind:e.kind,attack:e.attack||0,state:e.state,hp:e.hp});
  }
  for(const p of game.players||[]){
   const old=this.playerState.get(p),pos=audioPosition(p),air=(p.jumpHeight||0)>0;
   let distance=old?.distance||0;
   if(old){
    if(sameAudioRoom(old,p)&&p.hp>0){
     const moved=Math.hypot(pos.x-old.x,pos.y-old.y);
     if(!air&&!old.air&&moved<80)distance+=moved;
     if(distance>=30){this.play(footstepMaterial(game,p),p);distance%=30;}
     if(air&&!old.air&&(p.jumpVelocity||0)>0)this.play('jump',p);
     if(!air&&old.air&&p.landTime>0)this.play(landingCue(game,p),p);
    }else distance=0;
    if(old.ui&&!p.ui)this.play('close',p);
    if(p.ui&&JSON.stringify(p.inventory)!==old.inventory)this.play('loot',p);
    if((p.burning||0)>old.burning+.1)this.play('hurt',p);
    if((p.slow||0)>old.slow+.1)this.play('web',p);
    if(p.level>old.level)this.play('level',p);
    if(JSON.stringify(p.equipment)!==old.gear)this.play('equip',p);
    if(p.hp<=0&&old.hp>0)this.play('death',p);
    if(p.robotRepaired&&!old.robotRepaired)this.play('repairDone',p);
   }
   if(p.robotRepair?.progress>0)this.play('repair',p);
   this.playerState.set(p,{x:pos.x,y:pos.y,room:p.room||null,air,distance,level:p.level,hp:p.hp,ui:!!p.ui,inventory:p.ui?JSON.stringify(p.inventory):null,burning:p.burning||0,slow:p.slow||0,gear:JSON.stringify(p.equipment),robotRepaired:!!p.robotRepaired});
  }
 }
}

