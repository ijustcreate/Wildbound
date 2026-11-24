import {waterAt} from './environment.mjs';
import {boardTableSupport} from './board-table.mjs';
import {contains} from './house-design.mjs';
import {houseFloorZones} from './house-surfaces.mjs';
import {waterBelowBridge} from './swimming.mjs';
import {nativeWildBiome,nativeWildWorld} from './wild-native-biomes.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';
import {wildLandmarkBuildings} from './wild-landmark-buildings.mjs';
import {clearingDistance,forestNoise,forestPavingAt,routeDistance} from './forest-landscape.mjs';
import {nearestTrainTrack,railElevation} from './train-track.mjs';
import {inRainPuddle} from './wet-weather.mjs';
import {playThunder} from './thunder.mjs';
import {CUES,creatureCue,SOUND_FILES} from './sound-bank.mjs';
import {audioDistance,audioPosition,sameAudioRoom} from './adaptive-music-threat.mjs';
import {isUndergroundRoom,createUndergroundReverb} from './underground-audio.mjs';
import {worldAmbienceEmitters,weatherAudioState} from './world-ambience.mjs';
import {DIAGON_FOLEY,diagonFloorMaterial,diagonStreetListeners,fillCascade,inDiagonAudio} from './diagon-alley-audio.mjs';
import {alleyResidentsFor} from './diagon-residents.mjs';
import {latestDiagonFootfall} from './diagon-footprints.mjs';
import {HOLLOW_ROOM,mountainLand} from './wild-mountain-layout.mjs';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
export const AMBIENT_TRACKS={forest:'forest_ambient',desert:'desert_ambient',ice:'ice_ambient',house:'house_ambient',temple:'temple_ambient',graveyard:'graveyard_ambient',beach:'beach_ambient',swamp:'swamp_ambient',caverns:'cave_ambient',shadow:'shadow_ambient',diagon:'alley_ambient'};
const ambienceCutoff={water:1900,cascade:4200,steam:3100,fire:3600,rain:4800};
export const AUDIO_LIMITS=Object.freeze({voices:24,cache:96,cooldowns:128,variants:96});
function boundedSet(map,key,value,limit){map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);}
const surfaceCues=new Map(Object.entries({
 grass:'grass',marsh_grass:'grass',dirt:'dirt',path:'gravel',gravel:'gravel',
 wood:'wood',bridge:'wood',stone:'stone',temple_stone:'stone',cave_floor:'stone',shadow_soil:'stone',cement:'stone',
 tile:'tile',checker:'tile',carpet:'carpet',snow:'snow',ice:'ice',sand:'sand',quicksand:'sand',
 mud:'mud',water:'water',shallow:'water',floodbridge:'water',
}));
function floorCue(h,x,y){
 if(!h)return;
 if(h.furniture?.some(f=>f.kind==='rug'&&!f.destroyed&&contains(f,x,y)))return 'carpet';
 const floor=h.floors?.findLast(f=>contains(f,x,y));
 if(!floor)return;
 if(h.temple)return 'stone';
 const zone=houseFloorZones(h).findLast(f=>contains(f,x,y));
 return surfaceCues.get(zone?.material||floor.material)||'wood';
}
function railwayFootstep(t,x,y){
 const d=t.design;
 if(d.wildLands&&(d.activeRoom===HOLLOW_ROOM||!d.activeRoom&&mountainLand(x,y)))return 'stone';
 if(!d.activeRoom&&t.route){
  for(const route of [t.route,...(t.otherRoutes||[])]){
   const rail=nearestTrainTrack(route,x,y);
   if(rail.distance<d.gauge/2+16&&railElevation(d,rail)<=2)return 'gravel';
  }
 }
 if(!d.wildLands)return 'grass';
 for(const h of wildLandmarkBuildings(d)){
  const floor=floorCue(h,x,y);
  if(floor)return floor;
 }
 if(!d.activeRoom&&wildLandsPathAt(x,y))return 'dirt';
 const biome=nativeWildBiome(d,x,y);
 if(biome==='jungle'||biome==='house'||biome==='forest')return 'grass';
 const record=nativeWildWorld(t,x,y,biome);
 const ground=record?.world.terrain[(Math.floor(y/32)-record.cy*50)*50+Math.floor(x/32)-record.cx*50];
 if(['ice','snow','sand','mud','marsh_grass','cave_floor','shadow_soil','path'].includes(ground)||d.activeRoom&&['water','shallow'].includes(ground))return surfaceCues.get(ground);
 return ({ice:'snow',beach:'sand',swamp:'grass',caverns:'stone',shadow:'stone'})[biome]||'grass';
}
export function footstepMaterial(game,p){
 const {x,y}=p;
 if(p.pirateRide||p.trainRide||p.trainDeck||p.playLogId)return 'wood';
 if(p.room){
  const portal=game.portals?.find(d=>d.id===p.room);
  return p.room==='temple-upper'||portal?.oldWell||portal?.mausoleum||portal?.crypt?'stone':'wood';
 }
 if(game.trainTest){
  if(inDiagonAudio(game))return surfaceCues.get(diagonFloorMaterial(x,y))||'stone';
  if(p.swimming||p.underBridge||waterAt(game,x,y)!=='grass')return 'water';
  return railwayFootstep(game.trainTest,x,y);
 }
 if(p.groundHeight>=16&&boardTableSupport(game,x,y)>0)return 'wood';
 const ground=p.underBridge?waterBelowBridge(game,x,y):waterAt(game,x,y);
 if(['water','shallow','floodbridge'].includes(ground)||!p.groundHeight&&inRainPuddle(game,x,y))return 'water';
 const plan=game.forestLandscape;
 if(ground==='grass'&&plan?.routeField&&x>=0&&y>=0&&x<1600&&y<1600){
  if(forestPavingAt(plan,x,y))return 'stone';
  if(clearingDistance(x,y,plan.seed)>1&&routeDistance(plan,x,y)<13+forestNoise(x/70,y/70,plan.seed)*16)return 'dirt';
 }
 return floorCue(game.house,x,y)||surfaceCues.get(ground)||'grass';
}
export function landingCue(game,p){
 const material=footstepMaterial(game,p);
 return {...CUES[material],key:'land:'+material,group:'movement',priority:40,cooldown:220,gain:material==='water'?.24:.2,rate:.83,maxDuration:.55};
}
export class GameAudio {
 constructor(){
  this.settings={master:.8,sfx:.8,ui:.65,ambience:.45,night:false};
  try{const saved=JSON.parse(localStorage.getItem('wildbound-mixer')||'{}');for(const k of Object.keys(this.settings))if(k in saved)this.settings[k]=k==='night'?!!saved[k]:clamp(saved[k]);}catch{}
  this.cache=new Map();this.last=new Map();this.variants=new Map();this.actorLast=new WeakMap();this.voices=new Set();this.voiceInfo=new WeakMap();this.pending=new Set();this.previous=new WeakMap();this.playerState=new WeakMap();this.listeners=[];this.engineLoops=new Map();this.worldLoops=new Map();this.worldScanAt=0;this.enabled=true;this.unlocked=false;this.epoch=0;
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
  const listeners=cue.alleyStreet?(this.alleyListeners||[]):this.listeners.length?this.listeners:this.listener?[this.listener]:[];
  for(const p of listeners){const d=audioDistance(actor,p);if(d<distance){listener=p;distance=d;}}
  if(!listener)return {attenuation:0,pan:0};
  const radius=cue.distance??650,falloff=clamp((distance-45)/(radius-45));
  const a=audioPosition(actor),p=audioPosition(listener);
  return {attenuation:(1-falloff)**2,pan:Math.max(-.8,Math.min(.8,(a.x-p.x)/450))};
 }
 stopVoice(source){try{source.stop();}catch{}this.voices.delete(source);}
 updateVehicleEngines(game,active){
  const live=new Set();
  if(active&&this.enabled&&this.settings.master&&this.settings.sfx)for(const v of game.house?.vehicles||[])if(v.engineOn&&!v.submerging&&Math.abs(v.sink||0)<.8){
   live.add(v);let loop=this.engineLoops.get(v);
   if(!loop){const ctx=this.ctx,low=ctx.createOscillator(),high=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),pan=ctx.createStereoPanner();low.type='sawtooth';high.type='triangle';filter.type='lowpass';low.connect(filter);high.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(this.buses.sfx);low.start();high.start();gain.gain.value=0;loop={low,high,filter,gain,pan};this.engineLoops.set(v,loop);}
   const speed=Math.min(1,Math.abs(v.speed||0)/(v.maxSpeed||280)),throttle=Math.max(0,Math.min(1,v.throttle||0)),rpm=48+speed*82+throttle*48,t=this.ctx.currentTime;
   loop.low.frequency.setTargetAtTime(rpm,t,.12);loop.high.frequency.setTargetAtTime(rpm*2.03,t,.12);loop.filter.frequency.setTargetAtTime(240+speed*650+throttle*520,t,.15);
   const pos=this.spatial({distance:560},v);loop.pan.pan.setTargetAtTime(pos.pan,t,.2);loop.gain.gain.setTargetAtTime((.014+speed*.022+throttle*.015)*pos.attenuation,t,.18);
  }
  for(const [v,l]of this.engineLoops)if(!live.has(v)){const t=this.ctx.currentTime;l.gain.gain.setTargetAtTime(0,t,.08);try{l.low.stop(t+.4);l.high.stop(t+.4);}catch{}setTimeout(()=>{l.low.disconnect();l.high.disconnect();l.filter.disconnect();l.gain.disconnect();l.pan.disconnect();},500);this.engineLoops.delete(v);}
 }
 noiseBuffer(kind){
  this.worldNoise||=new Map();if(this.worldNoise.has(kind))return this.worldNoise.get(kind);
  const c=this.ctx,b=c.createBuffer(1,c.sampleRate*(kind==='cascade'?5:2),c.sampleRate),a=b.getChannelData(0);
  if(kind==='cascade')fillCascade(a,c.sampleRate);
  else {let last=0;for(let i=0;i<a.length;i++){const white=Math.random()*2-1;last=last*.28+white*.72;a[i]=last*.72+white*.28;}}
  const overlap=Math.min(1024,Math.floor(a.length/8)),edge=a.length-overlap,anchor=a[edge-1],first=a[0];
  for(let i=0;i<overlap;i++){const f=i/(overlap-1);a[edge+i]=anchor*(1-f)+first*f;}
  this.worldNoise.set(kind,b);return b;
 }
 updateWorldAmbience(game,active){
  const t=this.ctx.currentTime,desired=new Map(),scene=game.trainTest?.design?.activeRoom;
  if(scene!==this.worldScene){this.worldScene=scene;this.worldScanAt=0;}
  if(active&&game.phase==='play'&&this.enabled&&this.settings.master>0&&this.settings.ambience>0){
   if(t>=this.worldScanAt){this.worldEmitters=worldAmbienceEmitters(game,this.listeners);this.worldScanAt=t+.35;}
   const listeners=scene==='diagon'?this.alleyListeners||[]:this.listeners;
   for(const e of this.worldEmitters||[]){
    let nearest=null,distance=e.radius;
    for(const p of listeners){
     if(p.hp<=0||p.room)continue;
     const d=Math.hypot(p.x-e.x,p.y-e.y);
     if(d<distance){nearest=p;distance=d;}
    }
    if(!nearest)continue;
    const attenuation=1-distance/e.radius,pan=Math.max(-.85,Math.min(.85,(e.x-nearest.x)/420));
    desired.set(e.key,{kind:e.kind,pan,gain:(e.gain??(e.kind==='water'?.055:.025))*attenuation*attenuation});
   }
  }
  for(const [key,target]of desired){let loop=this.worldLoops.get(key);
   if(!loop){const noise=this.noiseBuffer(target.kind),source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain(),pan=this.ctx.createStereoPanner();
    source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=ambienceCutoff[target.kind]||1250;
    source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(this.buses.ambience);gain.gain.value=0;source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};source.start(0,Math.random()*noise.duration);loop={source,filter,gain,pan,kind:target.kind};this.worldLoops.set(key,loop);
   }
   loop.retireAt=0;loop.pan.pan.setTargetAtTime(target.pan,t,.22);loop.gain.gain.setTargetAtTime(target.gain,t,.32);
  }
  for(const [key,loop]of this.worldLoops)if(!desired.has(key)){if(!loop.retireAt){loop.retireAt=t+.85;loop.gain.gain.setTargetAtTime(0,t,.25);}if(t>=loop.retireAt){try{loop.source.stop(t);}catch{}this.worldLoops.delete(key);}}
 }
 updateDiagonFoley(game){
  if(!this.alleyListeners?.length||!this.enabled||!this.settings.master||!this.settings.sfx){
   this.alleyCueAt?.clear();return;
  }
  this.alleyCueAt??=new Map();
  this.alleyResidentSteps??=new WeakMap();
  const now=this.ctx.currentTime;
  for(const source of DIAGON_FOLEY){
   if(this.spatial(CUES[source.cue],source).attenuation<.02){this.alleyCueAt.delete(source);continue;}
   const next=this.alleyCueAt.get(source);
   if(next===undefined)this.alleyCueAt.set(source,now+1.1+Math.random()*2.4);
   else if(now>=next){
    this.alleyCueAt.set(source,now+source.interval*(.8+Math.random()*.45));
    this.play(source.cue,source);
   }
  }
  for(const resident of alleyResidentsFor(game)){
   const stride=Math.floor(resident.step/3);
   const previous=this.alleyResidentSteps.get(resident);
   this.alleyResidentSteps.set(resident,stride);
   if(resident.moving&&previous!==undefined&&stride!==previous)this.play('alleyStep',resident);
  }
 }
 async updateWeatherBed(game,active){
  const state=active&&game.phase==='play'&&this.enabled&&this.settings.master&&this.settings.ambience>0?weatherAudioState(game,this.listeners):null;
  const file=state?.type==='monsoon'||state?.type==='thunderstorm'?CUES.rain.files[0]:state?.type==='blizzard'||state?.type==='sandstorm'?CUES.wind.files[0]:null;
  const t=this.ctx.currentTime;
  if(this.weatherAmbient&&this.weatherAmbient.file===file){
   const shelter=state?.sheltered ? .2 : 1,baseGain=file===CUES.rain.files[0] ? .14 : .075;
   this.weatherAmbient.g.gain.setTargetAtTime(state?Math.min(.2,state.intensity*baseGain)*shelter:0,t,.45);
   return;
  }
  if(this.weatherLoading===file)return;
  const serial=(this.weatherSerial||0)+1;this.weatherSerial=serial;this.weatherLoading=file||null;
  if(this.weatherAmbient){const old=this.weatherAmbient;old.g.gain.setTargetAtTime(0,t,.35);try{old.s.stop(t+1.1);}catch{}this.weatherAmbient=null;}
  if(!file){this.weatherLoading=null;return;}
  const raw=await this.buffer(file);if(!raw||serial!==this.weatherSerial||!this.enabled||!this.settings.ambience)return;
  const overlap=Math.min(raw.sampleRate,Math.floor(raw.length/4)),length=raw.length-overlap,b=this.ctx.createBuffer(raw.numberOfChannels,length,raw.sampleRate);
  for(let c=0;c<b.numberOfChannels;c++){const a=raw.getChannelData(c),out=b.getChannelData(c);out.set(a.subarray(0,length));for(let i=0;i<overlap;i++){const f=i/overlap;out[i]=a[i]*f+a[length+i]*(1-f);}}
  const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();s.buffer=b;s.loop=true;filter.type='lowpass';filter.frequency.value=file===CUES.rain.files[0]?6200:2600;s.connect(filter);filter.connect(g);g.connect(this.buses.ambience);g.gain.value=0;s.onended=()=>{s.disconnect();filter.disconnect();g.disconnect();};s.start();
  const current=weatherAudioState(game,this.listeners),shelter=current?.sheltered ? .2 : 1,baseGain=file===CUES.rain.files[0] ? .14 : .075;
  const volume=current?Math.min(.2,current.intensity*baseGain)*shelter:0;
  g.gain.setTargetAtTime(volume,this.ctx.currentTime,.6);this.weatherAmbient={file,s,g};this.weatherLoading=null;
 }
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
  if(cue.group==='notification')this.duckUntil=now+1200;
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
  const duration=Math.min(buffer.duration/s.playbackRate.value,cue.maxDuration||2.5),t=this.ctx.currentTime,volume=(cue.gain??.25)*pos.attenuation*(cue.key?.endsWith(':spawn')&&now<this.duckUntil?.2:1);
  const attack=Math.min(.008,duration/4),release=Math.min(.07,duration/3);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+attack);g.gain.setValueAtTime(volume,t+duration-release);g.gain.linearRampToValueAtTime(0,t+duration);
  s.connect(g);g.connect(p);p.connect(this.buses[cue.bus||'sfx']);
  const room=actor?actor.room||null:(this.listeners.length&&this.listeners.every(q=>q.room===this.listeners[0].room)?this.listeners[0].room:null);
  if((cue.bus||'sfx')==='sfx'&&(isUndergroundRoom(this.game,room)||this.game?.trainTest?.design?.activeRoom===HOLLOW_ROOM)){
    this.undergroundFx??=createUndergroundReverb(this.ctx,this.buses.sfx);p.connect(this.undergroundFx.input);
  }
  this.voices.add(s);this.voiceInfo.set(s,{...token,source:s});
  s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();p.disconnect();};s.start();s.stop(t+duration);
  if(cue.group==='notification'||['event','win','lose','death'].includes(name))this.duckUntil=now+1200;
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
  const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=cue.lowpass?this.ctx.createBiquadFilter():null;s.buffer=b;s.loop=true;s.playbackRate.value=cue.rate||1;s.connect(filter||g);if(filter){filter.type='lowpass';filter.frequency.value=cue.lowpass;filter.connect(g);}g.connect(this.buses.ambience);g.gain.value=0;g.gain.setTargetAtTime(cue.gain,this.ctx.currentTime,.6);s.onended=()=>{if(this.ambientRetired?.s===s)this.ambientRetired=null;s.disconnect();filter?.disconnect();g.disconnect();};s.start();this.ambientSource={s,g};
 }
 update(game,active){
  if(!this.unlocked)return;
  if(this.game!==game||this.seed!==game.seed){
   this.cancelPending();this.previous=new WeakMap();this.playerState=new WeakMap();this.actorLast=new WeakMap();this.last.clear();this.worldScanAt=0;this.worldEmitters=[];this.game=game;this.seed=game.seed;
   this.alleyCueAt?.clear();
   for(const s of this.voices)if(this.voiceInfo.get(s)?.group!=='ui')this.stopVoice(s);
  }
  this.listeners=(game.players||[]).filter(p=>p.hp>0);this.listener=this.listeners[0];
  const inAlley=inDiagonAudio(game);
  this.alleyListeners=inAlley&&active&&game.phase==='play'?diagonStreetListeners(this.listeners):[];
  this.updateVehicleEngines(game,active&&game.phase==='play');
  for(const s of this.voices){const info=this.voiceInfo.get(s);if(info?.actor&&this.spatial(info.cue,info.actor).attenuation<=.002)this.stopVoice(s);}
  const biome=inAlley?'diagon':game.trainTest?game.trainTest.design?.activeRoom===HOLLOW_ROOM?'caverns':'forest':game.generatedEnvironment||game.environment||'forest';
  const ambientCue=AMBIENT_TRACKS[biome]||'wind';
  const inLobby=game.phase==='lobby',inRooms=this.listeners.length&&this.listeners.every(p=>p.room);
  const roomAmbient=biome==='temple'?'temple_ambient':this.listeners.some(p=>isUndergroundRoom(game,p.room))?'cave_ambient':'house_ambient';
  this.ambient(inLobby?'house_ambient':active&&!['won','lost'].includes(game.phase)&&this.listeners.length?(inRooms?roomAmbient:ambientCue):null);
  this.updateWorldAmbience(game,active&&game.phase==='play');
  this.updateDiagonFoley(game);
  this.updateWeatherBed(game,active&&game.phase==='play'&&!inAlley);
  const thunder=active&&game.phase==='play'&&!inAlley&&game.weather?.type==='thunderstorm'&&this.listeners.some(p=>!p.room)?game.seed+':'+Math.floor(game.time/9):null;
  if(thunder&&thunder!==this.thunderCycle&&this.voices.size+this.pending.size<AUDIO_LIMITS.voices)playThunder(this);this.thunderCycle=thunder;
  if(!active&&this.wasActive)this.cancelPending();this.wasActive=active;
  if(!active&&game.phase!=='lobby')return;
  for(const e of active&&!game.trainTest?game.enemies||[]:[]){
   const old=this.previous.get(e);
   if(e.hp>0&&!e.practiceTarget){if(!old)this.play(creatureCue(e.kind,'spawn'),e);else{
    if(old.kind!==e.kind)this.play('hatch',e);
    if(e.kind!=='panther'&&((e.attack||0)>old.attack+.03||e.state!==old.state&&['windup','breath','rocklift'].includes(e.state)))this.play(creatureCue(e.kind,'attack'),e);
    if(e.hp<old.hp)this.play(creatureCue(e.kind,'hurt'),e);
   }}
   if(old&&old.hp>0&&e.hp<=0&&!e.practiceTarget)this.play(creatureCue(e.kind,'death'),e);
   let stepDistance=old?.stepDistance||0;
   if(old&&e.hp>0&&e.moving){stepDistance+=Math.hypot(e.x-old.x,e.y-old.y);if(stepDistance>=86){if(this.spatial(CUES.creatureStep,e).attenuation>.015)this.play('creatureStep',e);stepDistance%=86;}}
   this.previous.set(e,{kind:e.kind,attack:e.attack||0,state:e.state,hp:e.hp,x:e.x,y:e.y,stepDistance});
  }
  for(const p of game.players||[]){
    const old=this.playerState.get(p),pos=audioPosition(p),air=(p.jumpHeight||0)>0,flying=!!(p.wingHover||p.broomMount),now=performance.now();let flightAt=old?.flightAt||now;
   const offFoot=flying||!!p.vehicleId;
   const footfall=inAlley?latestDiagonFootfall(game,p):null;
   let distance=inAlley?0:old?.distance||0;
   if(old){
    if(sameAudioRoom(old,p)&&p.hp>0){
     if(inAlley){
      if(footfall&&footfall!==old.footfall){
       const material=footstepMaterial(game,p);
       this.play({...CUES[material],key:'diagon-step:'+material,cooldown:100},p);
      }
     }else{
      const moved=p.trainRide?(old.trainCar===p.trainRide.car?Math.hypot(p.trainRide.x-old.trainX,p.trainRide.y-old.trainY):0):Math.hypot(pos.x-old.x,pos.y-old.y);
      if(offFoot||old.offFoot||moved>=80||old.trainCar!==p.trainRide?.car)distance=0;
      else if(!air&&!old.air)distance+=moved;
      if(distance>=30){this.play(footstepMaterial(game,p),p);distance%=30;}
     }
     if(air&&!old.air&&(p.jumpVelocity||0)>0)this.play('jump',p);
     if(!offFoot&&!air&&old.air&&p.landTime>0)this.play(landingCue(game,p),p);
    }else distance=0;
    if(old.ui&&!p.ui)this.play('close',p);
    if(p.ui&&JSON.stringify(p.inventory)!==old.inventory)this.play('loot',p);
    if((p.burning||0)>old.burning+.1)this.play('hurt',p);
    if((p.slow||0)>old.slow+.1)this.play('web',p);
    if(p.level>old.level)this.play('level',p);
    if(JSON.stringify(p.equipment)!==old.gear)this.play('equip',p);
    if(p.hp<=0&&old.hp>0)this.play('death',p);
    if(p.robotRepaired&&!old.robotRepaired)this.play('repairDone',p);
    if(flying&&now-flightAt>(p.broomMount?760:520)){this.play(p.broomMount?'broomFlight':'flight',p);flightAt=now;}
   }
   if(p.robotRepair?.progress>0)this.play('repair',p);
   this.playerState.set(p,{trainCar:p.trainRide?.car,trainX:p.trainRide?.x,trainY:p.trainRide?.y,x:pos.x,y:pos.y,room:p.room||null,air,offFoot,distance,footfall,level:p.level,hp:p.hp,ui:!!p.ui,inventory:p.ui?JSON.stringify(p.inventory):null,burning:p.burning||0,slow:p.slow||0,gear:JSON.stringify(p.equipment),robotRepaired:!!p.robotRepaired,flightAt:flying?flightAt:0});
  }
 }
}

