
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Game } from '../src/core.mjs';
import { GameAudio } from '../src/audio.mjs';
import { travelHouseWorlds } from '../src/house-worlds.mjs';
import { saveSession, restoreSession } from '../src/session.mjs';
import { Profiles, prepareCharacterBackup } from '../src/profiles.mjs';
import { freshCharacter } from '../src/items.mjs';
import { enterWildLands } from '../src/wild-lands.mjs';
import { createLocalWorld, restoreLocalWorld, saveLocalWorld } from '../src/world-instances.mjs';
import { BUILTIN_PACKS, MAX_REGIONS } from '../src/world-simulation.mjs';
import { tickLocalWorld } from '../src/world-runtime.mjs';
import store from '../save-store.cjs';
import worldStore from '../world-store.cjs';

const saved = game => JSON.parse(JSON.stringify(saveSession(game)));
const expedition = (name = 'QA Explorer') => {
  const game = new Game(() => .1);
  game.addPlayer('keyboard', name);
  game.start();
  return game;
};
const localWorld = (game = expedition()) => createLocalWorld({
  id:'qa-world', name:'QA World', seed:45, pack:BUILTIN_PACKS[0], now:1000,
  party:game.players, sharedStash:game.sharedStash,
});
async function withFiles(fn) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wildbound-checkpoint-qa-'));
  try { await fn(root); }
  finally { await rm(root, {recursive:true, force:true}); }
}
async function withDesktop(desktop, fn) {
  const before = globalThis.window;
  globalThis.window = { desktop };
  try { await fn(); } finally { if (before) globalThis.window = before; else delete globalThis.window; }
}

test('current and legacy encounter checkpoints resume pending actions once', () => {
  const game = expedition();
  game.event = {name:'Studio encounter', chainRuntime:2, chain:[
    {trigger:'delay', delay:1, action:'message', message:'Already executed'},
    {trigger:'delay', delay:3, action:'message', message:'New action'},
  ]};
  game.eventActionRun = new Set([0]);
  const checkpoint = saved(game);
  assert.deepEqual(checkpoint.state.eventActionRun, [0]);
  for (const encoded of [[0], {}]) {
    const resumed = restoreSession(structuredClone({...checkpoint, state:{...checkpoint.state, eventActionRun:encoded}}));
    resumed.event.chainRuntime = 3;
    resumed.runEventActions('delay');
    resumed.runEventActions('delay');
    assert.deepEqual([...resumed.eventActionRun], [0,1]);
    assert.equal(resumed.log.filter(message => message === 'New action').length, 1);
    assert.ok(!resumed.log.includes('Already executed'));
  }
});

test('Classic and persistent Wild Lands save collected loot, equipment and used supplies in both stores', async () => {
  for (const wilds of [false, true]) await withFiles(async root => {
    const profilePath=path.join(root,'characters-v1.json'), sessionPath=path.join(root,'session-v1.json');
    await withDesktop({
      loadProfiles:()=>store.read(profilePath,'profiles'),
      saveProfiles:data=>store.write(profilePath,data,'profiles'),
    }, async () => {
      const game=expedition(), player=game.players[0], profiles=new Profiles();
      const hero=freshCharacter('inventory-qa','Inventory QA');
      profiles.data.heroes.push(hero);
      profiles.assign(player,hero);
      if(wilds)assert.equal(enterWildLands(game,{persistent:true}).ok,true);
      game.persist=()=>profiles.capture(game);
      const collect=(type,qty)=>{
        const loot={id:game.nextId++,x:player.x,y:player.y,type,qty};
        game.loot.push(loot);
        assert.equal(game.collect(player,loot),true);
      };
      collect('sword',1);
      collect('potion',2);
      game.openInventory(player);
      game.inventoryAction(player,'select:'+player.inventory.findIndex(item=>item?.type==='sword'));
      game.inventoryAction(player,'equip');
      player.hp=10;
      game.usePotion(player);
      await profiles.savePromise;
      await store.write(sessionPath,saved(game),'session');

      const loadedProfiles=await new Profiles().load();
      const resumed=restoreSession(await store.read(sessionPath,'session'));
      loadedProfiles.reconcileCheckpoint(resumed);
      assert.equal(!!resumed.trainTest?.persistent,wilds);
      for(const record of [loadedProfiles.data.heroes[0],resumed.players[0]]){
        assert.equal(record.equipment.hand1,'sword');
        assert.equal(record.inventory.find(item=>item?.type==='potion')?.qty,1);
        assert.equal(record.inventory.some(item=>item?.type==='sword'),false);
      }
    });
  });
});

test('travel preserves runtime audio outside active and cached persisted maps', () => {
  const game = expedition();
  game.houseWorldsEnabled = true;
  game.persist = () => {};
  game.start();
  const audio = new GameAudio();
  game.trainAudio = audio;
  audio.game = game;
  assert.ok(travelHouseWorlds(game,5));
  assert.equal(game.trainAudio,audio);
  assert.ok(!Object.hasOwn(game.houseWorlds.worlds.house, 'trainAudio'));
  game.houseWorlds.worlds.house.trainAudio = audio;
  const checkpoint = saved(game);
  assert.ok(!Object.hasOwn(checkpoint.state.houseWorlds.worlds.house,'trainAudio'));
  const restored = restoreSession(checkpoint);
  restored.trainAudio = audio;
  assert.ok(travelHouseWorlds(restored,8));
  assert.equal(restored.trainAudio,audio);
  assert.equal(saved(restored).state.generatedEnvironment,'house');
});

test('full backpack backups retain metadata and an explicitly selected stash', () => {
  for(const number of [24, 25, 32]){
    const hero=freshCharacter('traveler','Traveler');
    hero.inventory=Array.from({length:number},()=>({type:'hat',qty:1}));
    hero.inventory[0]={type:'armor_bag',qty:1,contents:[{type:'hat',qty:1,sockets:['azure_bead']}]};
    const data={version:1,heroes:[hero],sharedStash:[{type:'potion',qty:8}]};
    const current={version:1,heroes:[],sharedStash:[{type:'arrow',qty:4}]};
    assert.deepEqual(prepareCharacterBackup(data,current).data.sharedStash,current.sharedStash);
    const restored=prepareCharacterBackup(data,current,{restoreStash:true});
    assert.equal(restored.data.heroes[0].inventory.length,number);
    assert.deepEqual(restored.data.heroes[0].inventory[0],hero.inventory[0]);
    assert.deepEqual(restored.data.sharedStash,data.sharedStash);
  }
});

test('an import write failure leaves the roster unchanged and can be retried', async () => {
  let reject = true, written;
  await withDesktop({saveProfiles:async data => {
    if(reject) throw Error('Test disk is offline');
    written=structuredClone(data);
  }}, async () => {
    const profiles=new Profiles(), hero=freshCharacter('new','New Explorer');
    const backup={version:1,heroes:[hero],sharedStash:[{type:'potion',qty:2}]};
    await assert.rejects(profiles.importBackup(backup,{restoreStash:true}),/disk is offline/);
    assert.deepEqual(profiles.data.heroes,[]);
    assert.deepEqual(profiles.data.sharedStash,[]);
    reject=false;
    assert.equal((await profiles.importBackup(backup,{restoreStash:true})).added,1);
    assert.equal(written.heroes[0].id,hero.id);
    assert.deepEqual(written.sharedStash,backup.sharedStash);
  });
});

test('a failed roster load cannot be saved over during an ordinary lobby flush', async () => {
  await withFiles(async root => {
    const file=path.join(root,'characters-v1.json'), damaged='{"version":1,"heroes":[';
    await writeFile(file,damaged);
    await withDesktop({loadProfiles:()=>store.read(file,'profiles'),saveProfiles:data=>store.write(file,data,'profiles')}, async () => {
      const profiles=await new Profiles().load();
      assert.ok(profiles.loadError);
      await profiles.capture(new Game());
      await profiles.save();
      assert.equal(await readFile(file,'utf8'),damaged);
      const hero=freshCharacter('backup','Backup Hero');
      await profiles.importBackup({version:1,heroes:[hero]});
      const copy=(await readdir(root)).find(entry=>entry.startsWith('characters-v1.json.damaged-'));
      assert.equal(await readFile(path.join(root,copy),'utf8'),damaged);
      assert.equal(await store.read(file,'profiles').then(data=>data.heroes[0].id),hero.id);
    });
  });
});

test('recovering a backup validates and changes only the selected record', async () => {
  await withFiles(async root => {
    const profile=path.join(root,'profile.json'), session=path.join(root,'session.json');
    const first={version:1,heroes:[],sharedStash:[]};
    await store.write(profile,first,'profiles');
    await store.write(profile,{...first,sharedStash:[{type:'arrow',qty:1}]},'profiles');
    await writeFile(session,JSON.stringify(saved(expedition())));
    const expeditionBefore=await readFile(session,'utf8');
    await assert.rejects(store.readBackup(session,'session'));
    assert.deepEqual(await store.readBackup(profile,'profiles'),first);
    await store.restore(profile,'profiles');
    assert.deepEqual(await store.read(profile,'profiles'),first);
    assert.equal(await readFile(session,'utf8'),expeditionBefore);
  });
});

test('a malformed newest named world uses its intact prior checkpoint', async () => {
  await withFiles(async root => {
    const disk=worldStore.createWorldStore(root), game=localWorld();
    await disk.save(saveLocalWorld(game,1000));
    await disk.save(saveLocalWorld(game,2000));
    const file=path.join(root,game.localWorld.id,'save.snapshot');
    const broken=JSON.parse(await readFile(file,'utf8'));
    broken.session.state.localWorld.seconds='yesterday';
    await writeFile(file,JSON.stringify(broken));
    const recovered=await disk.load(game.localWorld.id);
    assert.equal(recovered.savedAt,1000);
    assert.ok(restoreLocalWorld(recovered,1000));
  });
});

test('the local world can keep moving and saving after the region journal is full', () => {
  const game=localWorld(), region=game.localWorld.regions['0,0'];
  game.localWorld.regions=Object.fromEntries(Array.from({length:MAX_REGIONS},(_,i)=>[
    (i+2)+',0',{...region,x:i+2},
  ]));
  game.players[0].x=1610;
  assert.doesNotThrow(()=>tickLocalWorld(game,0));
  assert.equal(Object.keys(game.localWorld.regions).length,MAX_REGIONS);
  assert.match(game.log[0],/journal is full/);
  assert.ok(saveLocalWorld(game,1000));
});

test('fresh named worlds retain shared stash and older checkpoints keep newer explorer progression', () => {
  const game=expedition(), profiles=new Profiles(), player=game.players[0];
  const hero=freshCharacter('qa-explorer','QA Explorer');
  profiles.data.heroes=[hero];profiles.save=async()=>{};
  profiles.assign(player,hero);
  player.coins=20;game.sharedStash=[{type:'potion',qty:2}];
  profiles.capture(game);
  const earlier=saved(game);
  player.coins=140;game.sharedStash=[{type:'potion',qty:44}];
  profiles.capture(game);
  assert.deepEqual(localWorld(game).sharedStash,game.sharedStash);
  const newer=saved(game), old=restoreSession(earlier);
  const originalPosition=old.players.map(p=>[p.x,p.y,p.hp]);
  assert.equal(profiles.reconcileCheckpoint(old),true);
  profiles.capture(old);
  assert.equal(profiles.data.heroes[0].coins,140);
  assert.deepEqual(profiles.data.sharedStash,[{type:'potion',qty:44}]);
  assert.deepEqual(old.players.map(p=>[p.x,p.y,p.hp]),originalPosition);
  const staleLibrary=new Profiles();
  staleLibrary.data.heroes=[{...structuredClone(hero),coins:20,revision:earlier.state.profileRevisions.heroes[hero.id]}];
  const recent=restoreSession(newer);
  staleLibrary.reconcileCheckpoint(recent);
  assert.equal(recent.players[0].coins,140);
});

test('starter chest ownership survives same-type deposits, save and character selection', async () => {
  const game=new Game(), player=game.addPlayer('keyboard');
  const profiles=new Profiles(), hero=freshCharacter('qa-explorer','QA Explorer');
  profiles.data.heroes=[hero];profiles.save=async()=>{};
  profiles.assign(player,hero);
  game.openInventory(player,'starter');
  player.inventory=[{type:'arrow',qty:1},{type:'potion',qty:1}];
  game.inventoryAction(player,'panel:pack');
  game.inventoryAction(player,'lootAll');
  assert.ok(player.starterChest.some(item=>item?.type==='arrow'&&item.starterStock));
  assert.ok(player.starterChest.some(item=>item?.type==='arrow'&&!item.starterStock));
  await profiles.capture(game);
  profiles.assign(player,hero);
  assert.deepEqual(player.field.overflow,[{type:'arrow',qty:1},{type:'potion',qty:1}]);
  profiles.assign(player,hero);
  assert.equal(player.field.overflow.length,2);
});

