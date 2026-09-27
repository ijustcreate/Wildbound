import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRigStore } from '../project-rig-store.cjs';
import { rigPack, loadProjectRigs } from '../src/project-rigs.mjs';
import { lionMotion } from '../src/lion-motion.mjs';

test('Desktop saves survive a fresh checkout and packaged build without local storage', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-rigs-'));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  const repo = path.join(root, 'computer-a');
  fs.mkdirSync(path.join(repo, '.git'), {recursive:true});
  fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({name:'wildbound'}));
  const store = createRigStore({appPath:path.join(repo,'dist','game','resources','app.asar'),exePath:path.join(repo,'dist','game','Wildbound.exe'),userData:path.join(root,'profile-a'),packaged:true});
  const pack = rigPack([], {});
  pack.lion.boneSprites = {Body:{6:{width:1,height:1,x:0,y:0,palette:['transparent','#abcdef'],pixels:[1]}}};
  assert.equal(await store.save(pack), 'Saved to game and project.');
  assert.equal(store.file, path.join(repo,'authored','rigs.json'));
  const bundle = path.join(root,'computer-b','resources','app');
  fs.mkdirSync(path.join(bundle,'authored'),{recursive:true});
  fs.copyFileSync(store.file,path.join(bundle,'authored','rigs.json'));
  const other = createRigStore({appPath:bundle,exePath:path.join(root,'computer-b','Wildbound.exe'),userData:path.join(root,'profile-b'),packaged:true});
  assert.deepEqual(other.load().lion.boneSprites.Body[6],pack.lion.boneSprites.Body[6]);
  const isolated = createRigStore({appPath:bundle,exePath:path.join(repo,'dist','game','Wildbound.exe'),userData:path.join(root,'test-profile'),packaged:true,testMode:true});
  assert.equal(isolated.load(),null);
  assert.notEqual(isolated.file,store.file);
});

test('Pulled rig artwork overrides stale local sprites, including restored defaults', async t => {
  const previousWindow=globalThis.window, previousStorage=globalThis.localStorage;
  const oldSprites=structuredClone(lionMotion.boneSprites);
  t.after(()=>{globalThis.window=previousWindow;globalThis.localStorage=previousStorage;if(oldSprites)lionMotion.boneSprites=oldSprites;else delete lionMotion.boneSprites;});
  const pack=rigPack([],{});
  const sprite={width:1,height:1,x:0,y:0,palette:['transparent','#abcdef'],pixels:[1]};
  pack.lion.boneSprites={Body:{6:sprite}};
  globalThis.localStorage={getItem:()=>JSON.stringify({tiger:{Body:{6:{...sprite,palette:['transparent','#000000']}}}})};
  globalThis.window={desktop:{loadProjectRigs:async()=>pack}};
  await loadProjectRigs([],{});
  assert.deepEqual(lionMotion.boneSprites.Body[6],sprite);
  delete pack.lion.boneSprites;
  await loadProjectRigs([],{});
  assert.equal(lionMotion.boneSprites,undefined);
});
