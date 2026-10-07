import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {MUSIC_TRACKS,LEVEL_MUSIC_PAIRS,levelMusicPair} from '../src/music.mjs';
import {AdaptiveMusic} from '../src/adaptive-music.mjs';
import {CombatMusicThreat,audioDistance,activeHostile} from '../src/adaptive-music-threat.mjs';
import {GameAudio,AUDIO_LIMITS,footstepMaterial,landingCue} from '../src/audio.mjs';
import {CUES,SOUND_FILES,creatureCue} from '../src/sound-bank.mjs';
const root=new URL('../',import.meta.url);
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const world=()=>({phase:'play',seed:1,environment:'forest',time:1,players:[{id:1,x:100,y:100,hp:100}],enemies:[]});
const enemy=extra=>({kind:'lion',hp:100,x:160,y:100,state:'hunt',moving:false,...extra});
const ticks=(threat,g,n=10,options={})=>{let value;for(let i=0;i<n;i++)value=threat.update(g,.1,true,options);return value;};
test('eight fixed pairs reference existing assets and keep explicit/random options',()=>{
 assert.deepEqual(Object.keys(LEVEL_MUSIC_PAIRS),['forest','desert','ice','temple','house','tv','lobby','beach']);
 for(const level of Object.keys(LEVEL_MUSIC_PAIRS)){
  const a=levelMusicPair(level),b=levelMusicPair(level);
  assert.equal(a.calm.id,b.calm.id);assert.notEqual(a.calm.id,a.combat.id);assert.equal(a.approximate,true);
  for(const t of [a.calm,a.combat])assert.ok(existsSync(new URL(t.file,root)));
 }
 assert.equal(levelMusicPair('forest','village-gate').calm.id,'village-gate');
 assert.equal(levelMusicPair('forest','random',()=>0).calm.id,MUSIC_TRACKS[0].id);
});
test('hostility excludes friendly, neutral, owned, dead and practice actors including owner zero',()=>{
 for(const fields of [{faction:'ally'},{faction:'neutral'},{owner:0},{allyOwner:0},{pet:true},{hp:0},{practiceTarget:true},{friendly:true},{hostile:false}])assert.equal(activeHostile(enemy(fields)),false);
 assert.equal(activeHostile(enemy({aggro:true})),true);
});
test('combat needs nearby active hostility; distant/default-hunt/resting actors do not count',()=>{
 const g=world(),t=new CombatMusicThreat();g.enemies=[enemy()];assert.equal(ticks(t,g),0);
 g.enemies=[enemy({x:900,aggro:true,attack:1})];assert.equal(ticks(t,g),0);
 g.enemies=[enemy({state:'lie',aggro:true})];assert.equal(ticks(t,g),0);
 g.enemies=[enemy({moving:true})];assert.equal(t.update(g,.1),0);assert.equal(ticks(t,g,3),1);
});
test('combat holds through gaps, releases after 4.5 seconds and resets on pause/world changes',()=>{
 const g=world(),t=new CombatMusicThreat();g.enemies=[enemy({attack:.3})];assert.equal(ticks(t,g),1);
 g.enemies=[];assert.equal(ticks(t,g,20),1);assert.equal(ticks(t,g,30),0);
 g.enemies=[enemy({aggro:true})];assert.equal(ticks(t,g),1);assert.equal(t.update(g,.1,false),0);
 assert.equal(t.update(world(),.1),0);
});
test('hurt raises combat only in the hostile/player room; walls and rooms isolate threats',()=>{
 const g=world(),t=new CombatMusicThreat(),e=enemy();g.enemies=[e];ticks(t,g);e.hp=90;assert.equal(ticks(t,g,3),1);
 t.reset();g.players[0].room='storage';g.players[0].roomX=100;g.players[0].roomY=100;e.attack=1;assert.equal(ticks(t,g),0);
 assert.equal(audioDistance(e,g.players[0]),Infinity);
 g.players[0].room=null;g.house={};g.projectileBlocked=()=>true;t.reset();assert.equal(ticks(t,g),0);
});
test('player hurt and TV pursuit raise combat without distant TV patrol threat',()=>{
 const g=world(),t=new CombatMusicThreat();g.enemies=[enemy()];ticks(t,g);g.players[0].hp-=10;assert.equal(ticks(t,g,3),1);
 const tv={players:new Map([[1,{hp:3,x:100,y:437}]]),enemies:[{alive:true,hp:2,kind:'lion',x:250,y:437}]};
 assert.equal(ticks(t,tv,10,{tv:true}),1);tv.enemies[0].x=1000;assert.equal(ticks(t,tv,55,{tv:true}),0);
});
test('small lobby TV actors use local platform coordinates and require close active movement',()=>{
 const t=new CombatMusicThreat(),tv={players:new Map([[1,{alive:true,x:100,y:108}]]),enemies:new Map([[1,{alive:true,x:130,y:108,vx:-21}]])};
 assert.equal(ticks(t,tv,10,{tv:true}),1);tv.enemies.get(1).x=200;assert.equal(ticks(t,tv,55,{tv:true}),0);
 tv.enemies.get(1).x=120;tv.enemies.get(1).vx=0;assert.equal(ticks(t,tv,10,{tv:true}),0);
});
function mediaFactory({deferred=false}={}){
 const made=[];
 return {made,create:file=>{const a={src:file,currentTime:17,volume:0,paused:true,plays:0,pauses:0,play(){this.plays++;this.paused=false;return deferred?new Promise(r=>this.resolve=r):Promise.resolve();},pause(){this.paused=true;this.pauses++;},removeAttribute(){this.src='';},load(){}};made.push(a);return a;}};
}
const fade=(m,options,n=120)=>{for(let i=0;i<n;i++)m.update({enabled:true,volume:.4,...options},.016);};
test('combat crossfade keeps both timelines and sources through rapid toggles',async()=>{
 const f=mediaFactory(),m=new AdaptiveMusic(f.create);m.setPair(levelMusicPair('forest'));m.resume();await settle();
 fade(m,{intensity:0});assert.ok(f.made[0].volume>.39);assert.equal(f.made[1].volume,0);
 fade(m,{intensity:1});assert.ok(f.made[1].volume>.35);assert.ok(f.made[0].volume<.05);
 for(let i=0;i<60;i++)fade(m,{intensity:i%2},1);
 assert.equal(f.made.length,2);assert.deepEqual(f.made.map(a=>a.plays),[1,1]);assert.deepEqual(f.made.map(a=>a.currentTime),[17,17]);
 fade(m,{intensity:0},650);assert.ok(f.made[0].volume>.39);
});
test('routing has a bounded media pool and stale play promises cannot revive released/muted voices',async()=>{
 const f=mediaFactory({deferred:true}),m=new AdaptiveMusic(f.create);m.setPair(levelMusicPair('forest'));m.resume();
 for(const level of ['desert','ice','temple','house','tv','lobby']){m.setPair(levelMusicPair(level));assert.ok(m.voices.length<=4);}
 m.update({enabled:false,volume:.4});for(const a of f.made)a.resolve?.();await settle();assert.ok(f.made.every(a=>a.paused));
 assert.ok(f.made.filter(a=>!a.src).length>=8);m.dispose();assert.equal(m.voices.length,0);
});
test('preview, ducking, zero volume and resume preserve the mix and do not restart tracks',async()=>{
 const f=mediaFactory(),m=new AdaptiveMusic(f.create);m.setPair(levelMusicPair('house'));m.resume();await settle();fade(m,{});
 fade(m,{preview:true,duck:.4});assert.ok(f.made[0].volume<.025);
 m.update({enabled:true,volume:0});assert.ok(f.made.every(a=>a.paused&&a.volume===0));
 fade(m,{});await settle();assert.ok(f.made[0].volume>.39);assert.equal(f.made[0].currentTime,17);
});
const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){}});
const node=()=>({gain:param(),pan:param(),connect(){},disconnect(){}});
function fakeAudio(){
 const a=new GameAudio();a.unlocked=true;a.ctx={currentTime:1,createBufferSource(){return {...node(),playbackRate:param(),start(){this.started=true;},stop(t){if(t==null)this.stopped=true;}};},createGain:node,createStereoPanner:node};
 a.buses={sfx:node(),ui:node(),ambience:node()};a.listeners=[{x:100,y:100,hp:100}];a.buffer=async()=>({duration:1});return a;
}
test('all effects and creature cues use available CC0 recordings with distinct mix priorities',()=>{
 for(const file of SOUND_FILES)assert.ok(existsSync(new URL(file,root)),file);
 assert.ok(CUES.hurt.priority>CUES.attack.priority);assert.ok(CUES.attack.priority>CUES.grass.priority);
 assert.equal(CUES.magic.bus,'sfx');assert.equal(creatureCue('wolf','death').group,'critical');assert.equal(CUES.swing,CUES.attack);
});
test('distance attenuation, nearest party listener and room isolation apply before loading',()=>{
 const a=fakeAudio(),e={x:160,y:100};assert.ok(a.spatial(CUES.hit,e).attenuation>.5);
 assert.equal(a.spatial(CUES.hit,{x:900,y:100}).attenuation,0);
 assert.equal(a.spatial(CUES.hit,{...e,room:'storage'}).attenuation,0);
 a.listeners.push({x:800,y:100,room:'storage',roomX:10,roomY:10});assert.equal(a.spatial(CUES.hit,{room:'storage',roomX:10,roomY:10}).attenuation,1);
});
test('footsteps and landings select biome, terrain, house, room and wet materials',()=>{
 const g=world(),p=g.players[0];for(const [environment,expected] of [['forest','grass'],['desert','sand'],['ice','snow'],['temple','stone']]){g.environment=environment;assert.equal(footstepMaterial(g,p),expected);}
 g.environment='forest';g.terrain=Array(2500).fill('water');assert.equal(footstepMaterial(g,p),'water');assert.equal(landingCue(g,p).key,'land:water');
 g.terrain.fill('mud');assert.equal(footstepMaterial(g,p),'mud');g.terrain.fill('bridge');assert.equal(footstepMaterial(g,p),'wood');
 p.room='temple-upper';assert.equal(footstepMaterial(g,p),'stone');p.room='storage';assert.equal(footstepMaterial(g,p),'wood');p.room=null;
 g.terrain.fill('grass');g.house={floors:[{x:0,y:0,w:200,h:200}]};assert.equal(footstepMaterial(g,p),'wood');p.x=400;assert.equal(footstepMaterial(g,p),'grass');
 g.house=null;g.environment='ice';p.groundHeight=24;assert.equal(footstepMaterial(g,p),'snow');
});
test('decoded requests cannot leak after mute, room changes, cancellation or priority stealing',async()=>{
 const a=fakeAudio();let resolve;a.buffer=()=>new Promise(r=>resolve=r);
 const p={x:100,y:100},pending=a.play('attack',p);assert.equal(a.pending.size,1);a.cancelPending();resolve({duration:1});await pending;assert.equal(a.voices.size,0);
 const roomPending=a.play('bow',p);p.room='storage';resolve({duration:1});await roomPending;assert.equal(a.voices.size,0);
 p.room=null;const muted=a.play('magic',p);a.enabled=false;resolve({duration:1});await muted;assert.equal(a.voices.size,0);
});
test('priority reserves critical cues under saturation and caps pending plus active polyphony',async()=>{
 const a=fakeAudio(),custom=(key,priority=10,group='bulk')=>({...CUES.attack,key,priority,group,polyphony:24,cooldown:0});
 await Promise.all(Array.from({length:24},(_,i)=>a.play(custom('low:'+i),{x:100,y:100})));
 assert.equal(a.voices.size,24);assert.equal(await a.play(custom('extra')),undefined);
 assert.ok(await a.play('hurt',{x:100,y:100}));assert.equal(a.voices.size,24);
 const b=fakeAudio();b.buffer=()=>new Promise(()=>{});
 for(let i=0;i<80;i++)b.play(custom('pending:'+i),{x:100,y:100});assert.equal(b.pending.size,24);
 const c=fakeAudio();await Promise.all(Array.from({length:12},(_,i)=>c.play('grass',{id:i,x:100,y:100})));assert.equal(c.voices.size,4);
});
test('anonymous cooldowns and variation history stay bounded; actor history uses weak ownership',async()=>{
 const a=fakeAudio();for(let i=0;i<400;i++)await a.play({...CUES.click,key:'unique:'+i,cooldown:0});
 assert.equal(a.last.size,AUDIO_LIMITS.cooldowns);assert.equal(a.variants.size,AUDIO_LIMITS.variants);assert.ok(a.actorLast instanceof WeakMap);assert.ok(a.previous instanceof WeakMap);
});
test('decoder cache is bounded, rejects non-library paths and does not amplify quiet recordings',async()=>{
 const original=globalThis.fetch,a=new GameAudio();let calls=0,last;
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});
 a.ctx={decodeAudioData:async()=>{calls++;last=new Float32Array([.05,-.05]);return {numberOfChannels:1,getChannelData:()=>last};}};
 try{
  const files=[...SOUND_FILES];assert.ok(files.length>AUDIO_LIMITS.cache);
  for(const file of files.slice(0,AUDIO_LIMITS.cache+12))await a.buffer(file);
  assert.equal(a.cache.size,AUDIO_LIMITS.cache);assert.ok(Math.abs(last[0]-.05)<1e-7);
  const before=calls;assert.equal(await a.buffer('https://invalid.example/audio.wav'),null);assert.equal(calls,before);
  await a.buffer(files[AUDIO_LIMITS.cache+11]);assert.equal(calls,before);
 }finally{globalThis.fetch=original;}
});
test('observed movement/jump/landing/death/repair cues fire once and skip airborne footsteps',()=>{
 const a=fakeAudio(),g=world(),p=g.players[0],events=[];a.play=(name)=>events.push(typeof name==='object'?name.key:name);a.ambient=()=>{};
 a.update(g,true);p.x+=31;a.update(g,true);assert.ok(events.includes('grass'));events.length=0;
 p.jumpHeight=5;p.jumpVelocity=100;p.x+=40;a.update(g,true);assert.deepEqual(events,['jump']);events.length=0;
 p.jumpHeight=0;p.landTime=.22;a.update(g,true);assert.deepEqual(events,['land:grass']);events.length=0;
 p.robotRepaired=true;p.robotRepair={progress:.8};a.update(g,true);assert.deepEqual(events,['repairDone','repair']);events.length=0;
 p.robotRepair=null;p.hp=0;a.update(g,true);a.update(g,true);assert.deepEqual(events,['death']);
});
