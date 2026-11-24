import test from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio,footstepMaterial} from '../src/audio.mjs';
import {ALLEY_SHOPS} from '../src/diagon-alley.mjs';
import {DIAGON_AMBIENCE,DIAGON_FOLEY,DIAGON_FOUNTAIN_AUDIO} from '../src/diagon-alley-audio.mjs';
import {tickDiagonFootprints} from '../src/diagon-footprints.mjs';
import {worldAmbienceEmitters} from '../src/world-ambience.mjs';

function fixture(){
 const p={id:'visitor',x:8010,y:4195,hp:50,moving:true};
 const game={phase:'play',seed:13,time:0,players:[p],trainTest:{design:{activeRoom:'diagon'},time:0}};
 const audio=new GameAudio();
 audio.unlocked=true;
 audio.ctx={currentTime:1};
 audio.ambient=()=>{};
 audio.updateWeatherBed=()=>{};
 audio.updateWorldAmbience=()=>{};
 return {audio,game,p};
}

test('Diagon sounds come from the visible props and the street is isolated from interiors',()=>{
 const {game,p}=fixture();
 for(const source of DIAGON_AMBIENCE){
  Object.assign(p,{x:source.x+15,y:source.y});
  const emitter=worldAmbienceEmitters(game,[p]).find(e=>e.key===source.key);
  assert.equal(emitter?.distance,15,source.key);
 }
 const {x,y,radius}=DIAGON_FOUNTAIN_AUDIO;
 Object.assign(p,{x:x+radius+1,y});
 assert.ok(!worldAmbienceEmitters(game,[p]).some(e=>e.key===DIAGON_FOUNTAIN_AUDIO.key));
 const bank=ALLEY_SHOPS.find(shop=>shop.id==='gringotts');
 Object.assign(p,{x:bank.x,y:bank.y});
 assert.deepEqual(worldAmbienceEmitters(game,[p]),[]);
 Object.assign(p,{x:x+16,y});
 game.trainTest.design.activeRoom='quidditch';
 assert.deepEqual(worldAmbienceEmitters(game,[p]),[]);
});

test('a delayed street sound is discarded on a scene change',async()=>{
 const {audio,game,p}=fixture();
 const source=DIAGON_FOLEY.find(e=>e.cue==='alleyKettle');
 Object.assign(p,{x:source.x+12,y:source.y});
 audio.update(game,true);
 let resolve;
 audio.buffer=()=>new Promise(done=>resolve=done);
 const sound=audio.play(source.cue,source);
 assert.equal(audio.pending.size,1);
 game.trainTest.design.activeRoom='quidditch';
 audio.update(game,true);
 resolve({duration:1});
 assert.equal(await sound,undefined);
 assert.equal(audio.voices.size,0);
 assert.equal(audio.alleyCueAt.size,0);
});

test('Diagon surface footstep sounds are emitted once on the same mark as the footprint',()=>{
 const {audio,game,p}=fixture(),events=[];
 audio.play=cue=>events.push(typeof cue==='string'?cue:cue.key);
 const tick=()=>{
  game.trainTest.time+=.2;
  tickDiagonFootprints(game);
  audio.update(game,true);
 };
 tick();
 p.x+=24;tick();
 assert.deepEqual(events,[]);
 p.x+=6;tick();tick();
 assert.deepEqual(events,['diagon-step:stone']);
 p.broomMount={};p.x+=45;tick();
 assert.deepEqual(events,['diagon-step:stone']);
 delete p.broomMount;
 for(const [id,material] of [['flourish','wood'],['apothecary','tile'],['gringotts','stone']]){
  const shop=ALLEY_SHOPS.find(shop=>shop.id===id);
  Object.assign(p,{x:shop.x,y:shop.y});
  assert.equal(footstepMaterial(game,p),material,id);
 }
 Object.assign(p,{x:7410,y:3990});
 assert.equal(footstepMaterial(game,p),'stone');
 Object.assign(p,{x:7170,y:4240});
 assert.equal(footstepMaterial(game,p),'grass');
});
