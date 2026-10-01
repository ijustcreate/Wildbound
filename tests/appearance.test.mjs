import test from 'node:test';
import assert from 'node:assert/strict';
import { Profiles } from '../src/profiles.mjs';
import { DEFAULT_APPEARANCE, HAIR_STYLES } from '../src/appearance.mjs';
import { drawPlayer, defaultPlayerMotion, directionVector, validatePlayerMotion } from '../src/player-motion.mjs';
import { RigStudio } from '../src/player-studio.mjs';
test('Appearance persists with a character independently of stat-bearing gear', () => {
  const profiles = new Profiles(); profiles.save = () => {};
  const hero = profiles.create('Cosmetic test', DEFAULT_APPEARANCE), player = {};
  profiles.assign(player,hero);
  assert.deepEqual(player.appearance,DEFAULT_APPEARANCE);
  assert.equal(player.equipment.hair,undefined);
  player.appearance.hair = 'long';
  profiles.capture({players:[player],sharedStash:[]});
  assert.equal(hero.appearance.hair,'long');
});
test('All hairstyles render in eight directions and equipment adjustments round-trip', () => {
  const model=defaultPlayerMotion();
  model.wearables={hat:{0:{x:2,y:-1,scale:1.2,rotation:10,pixels:Array(256).fill('#ffffff')}}};
  assert.ok(validatePlayerMotion(JSON.parse(JSON.stringify(model))));
  let pixels=0;
  const c={save(){},restore(){},translate(){},rotate(){},scale(){},fillRect(...v){assert.ok(v.every(Number.isFinite));pixels++;}};
  for (const hair of Object.keys(HAIR_STYLES)) for(let d=0;d<8;d++) {
    const [faceX,faceY]=directionVector(d);
    drawPlayer(c,{faceX,faceY,appearance:{...DEFAULT_APPEARANCE,hair},equipment:d===0?{head:'hat'}:{}},0,model);
  }
  assert.ok(pixels>100);
});
test('Equipped quivers render saved heroes and inventory-free previews in all directions', (t) => {
  const c=new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
  const originalDocument=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>c})};
  t.after(()=>{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;});
  const model=defaultPlayerMotion();
  for(const inventory of [undefined,[],[{type:'arrow',qty:8}],[{type:'starter_arrow',qty:8}]])for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);
    assert.doesNotThrow(()=>drawPlayer(c,{faceX,faceY,inventory,equipment:{back:'starter_quiver'},appearance:DEFAULT_APPEARANCE},0,model));
  }
});

test('New studios and newly selected rigs start paused', () => {
  const studio=new RigStudio(()=>{});
  assert.equal(studio.playing,false);
  studio.setSubject('water_elemental');
  assert.equal(studio.playing,false);
  assert.ok(studio.model.joints[studio.selected]);
});
