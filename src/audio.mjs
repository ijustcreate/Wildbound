import { waterAt } from './environment.mjs';
import {CUES,creatureCue} from './sound-bank.mjs';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
export class GameAudio {
 constructor(){
  this.settings={master:.8,sfx:.8,ui:.65,ambience:.45,night:false};
  try{Object.assign(this.settings,JSON.parse(localStorage.getItem('wildbound-mixer')||'{}'));}catch{}
  this.cache=new Map();this.last=new Map();this.voices=new Set();this.previous=new Map();this.enabled=true;this.unlocked=false;
 }
 unlock(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.compressor=this.ctx.createDynamicsCompressor();this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);this.buses={};for(const b of ['sfx','ui','ambience']){this.buses[b]=this.ctx.createGain();this.buses[b].connect(this.master);}this.apply();}this.unlocked=true;this.ctx.resume().catch(()=>{});}
 apply(){if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.enabled?clamp(this.settings.master):0,t,.03);for(const b of Object.keys(this.buses))this.buses[b].gain.setTargetAtTime(clamp(this.settings[b]),t,.03);this.compressor.threshold.value=this.settings.night?-28:-12;this.compressor.ratio.value=this.settings.night?8:4;}
 set(k,v){this.settings[k]=k==='night'?!!v:clamp(v);localStorage.setItem('wildbound-mixer',JSON.stringify(this.settings));this.apply();}
 async buffer(file){if(!this.cache.has(file))this.cache.set(file,fetch(file).then(r=>{if(!r.ok)throw Error(file);return r.arrayBuffer();}).then(b=>this.ctx.decodeAudioData(b)).then(b=>{let peak=0;for(let c=0;c<b.numberOfChannels;c++)for(const v of b.getChannelData(c))peak=Math.max(peak,Math.abs(v));const scale=peak>.001?Math.min(4,.8/peak):1;for(let c=0;c<b.numberOfChannels;c++){const a=b.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=scale;}return b;}).catch(e=>{console.warn('Audio asset',file,e);return null;}));return this.cache.get(file);}
 async play(name,actor){
  if(!this.enabled||!this.unlocked||this.voices.size>=24)return;
  const cue=typeof name==='object'?name:CUES[name];if(!cue)return;
  const key=(typeof name==='string'?name:cue.files[0])+':'+(actor?.id??'ui'),now=performance.now();if(now-(this.last.get(key)||-10000)<(cue.bus==='ui'?65:160))return;this.last.set(key,now);
  let attenuation=1,pan=0;if(actor&&this.listener){const dx=actor.x-this.listener.x,dy=actor.y-this.listener.y,d=Math.hypot(dx,dy);attenuation=Math.max(0,1-d/1100);pan=Math.max(-.85,Math.min(.85,dx/600));if(attenuation<=0)return;}
  const previous=this.lastFile,choices=cue.files.filter(f=>f!==previous);const file=(choices.length?choices:cue.files)[Math.floor(Math.random()*(choices.length||cue.files.length))];this.lastFile=file;
  const buffer=await this.buffer(file);if(!buffer||!this.enabled||this.voices.size>=24)return;
  const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),p=this.ctx.createStereoPanner();s.buffer=buffer;s.playbackRate.value=(cue.rate||1)*(cue.bus==='ui'?1:.96+Math.random()*.08);p.pan.value=pan;
  const duration=Math.min(buffer.duration/s.playbackRate.value,cue.maxDuration||4),t=this.ctx.currentTime,volume=(cue.gain||.25)*attenuation;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.setValueAtTime(volume,t+Math.max(.01,duration-.09));g.gain.linearRampToValueAtTime(0,t+duration);s.connect(g);g.connect(p);p.connect(this.buses[cue.bus||'sfx']);this.voices.add(s);s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();p.disconnect();};s.start();s.stop(t+duration);
  if(['event','win','lose'].includes(name))this.duckUntil=performance.now()+1800;
 }
 async ambient(name){if(this.ambientName===name)return;this.ambientName=name;const serial=(this.ambientSerial||0)+1;this.ambientSerial=serial;if(this.ambientSource){const old=this.ambientSource;old.g.gain.setTargetAtTime(0,this.ctx.currentTime,.3);old.s.stop(this.ctx.currentTime+1);this.ambientSource=null;}if(!name||!this.unlocked)return;const cue=CUES[name],raw=await this.buffer(cue.files[0]);if(!raw||serial!==this.ambientSerial)return;
  // Seamless overlap: fold the final second into the first with complementary fades.
  const overlap=Math.min(raw.sampleRate,Math.floor(raw.length/4)),length=raw.length-overlap,b=this.ctx.createBuffer(raw.numberOfChannels,length,raw.sampleRate);
  for(let c=0;c<b.numberOfChannels;c++){const a=raw.getChannelData(c),out=b.getChannelData(c);out.set(a.subarray(0,length));for(let i=0;i<overlap;i++){const f=i/overlap;out[i]=a[i]*f+a[length+i]*(1-f);}}
  const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=b;s.loop=true;s.connect(g);g.connect(this.buses.ambience);g.gain.value=0;g.gain.setTargetAtTime(cue.gain,this.ctx.currentTime,.6);s.onended=()=>{s.disconnect();g.disconnect();};s.start();this.ambientSource={s,g};
 }
 update(game,active){
  if(!this.unlocked)return;this.listener=game.players?.find(p=>p.hp>0)||game.players?.[0];
  this.ambient(active?(game.weather?.type==='monsoon'?'rain':'wind'):null);
  if(!active)return;
  if(this.game!==game||this.seed!==game.seed){this.previous.clear();this.playerState=new WeakMap();this.game=game;this.seed=game.seed;}
  const next=new Map();for(const e of game.enemies||[]){const old=this.previous.get(e.id);if(!old)this.play(creatureCue(e.kind,'spawn'),e);else{if(old.kind!==e.kind)this.play('hatch',e);if((e.attack||0)>old.attack+.03||e.state!==old.state&&['windup','breath','rocklift'].includes(e.state))this.play(creatureCue(e.kind,'attack'),e);if(e.hp<old.hp)this.play(creatureCue(e.kind,'hurt'),e);}next.set(e.id,{kind:e.kind,attack:e.attack||0,state:e.state,hp:e.hp});}this.previous=next;
  this.playerState??=new WeakMap();for(const p of game.players||[]){const old=this.playerState.get(p);if(old){const distance=Math.hypot(p.x-old.x,p.y-old.y);old.distance+=distance<100?distance:0;if(old.distance>24&&p.hp>0){this.play(['water','shallow','floodbridge'].includes(waterAt(game,p.x,p.y))?'water':game.environment==='ice'?'snow':game.environment==='desert'?'sand':game.environment==='house'?'wood':'grass',p);old.distance=0;}if(old.ui&&!p.ui)this.play('close',p);if(JSON.stringify(p.inventory)!==old.inventory&&p.ui)this.play('loot',p);if((p.burning||0)>old.burning+.1)this.play('hurt',p);if((p.slow||0)>old.slow+.1)this.play('web',p);if(p.level>old.level)this.play('level',p);if(JSON.stringify(p.equipment)!==old.gear)this.play('equip',p);if(p.hp<=0&&old.hp>0)this.play('lose',p);}this.playerState.set(p,{x:p.x,y:p.y,distance:old?.distance||0,level:p.level,hp:p.hp,ui:!!p.ui,inventory:JSON.stringify(p.inventory),burning:p.burning||0,slow:p.slow||0,gear:JSON.stringify(p.equipment)});}
 }
}

