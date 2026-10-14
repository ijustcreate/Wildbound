import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {createRequire} from 'node:module';
import {createPersistentServer} from '../server/runtime.mjs';
import {loadConfig,validateConfig} from '../server/config.mjs';
import {WorldStore,decode} from '../server/persistence.mjs';
import {parseMessage} from '../server/protocol.mjs';
import {travelThroughForestPortal} from '../src/forest-portal-event.mjs';
import {give} from '../src/items.mjs';
import {updateBoundlessWorld} from '../src/boundless-world.mjs';
const require=createRequire(import.meta.url);
const {ServerTransport}=require('../server-transport.cjs');
const adminToken='a'.repeat(64),joinToken='b'.repeat(64);
async function config(t) {
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'wildbound-server-test-'));
  t.after(()=>fs.rm(directory,{recursive:true,force:true}));
  return {bind:'127.0.0.1',port:0,adminHost:'127.0.0.1',adminPort:0,adminToken,joinToken,savePath:path.join(directory,'world.json'),seed:17,maxPlayers:6,publicAddress:''};
}
async function client(t,server,name='Scout',resumeToken,token=joinToken) {
  const socket=new WebSocket(`ws://127.0.0.1:${server.gamePort}/game`),messages=[];
  t.after(()=>socket.terminate());
  socket.on('message',raw=>messages.push(decode(raw.toString())));
  socket.on('error',()=>{});
  await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
  socket.send(JSON.stringify({type:'hello',version:1,name,joinToken:token,...(resumeToken?{resumeToken}:{})}));
  const until=async predicate=>{
    const deadline=Date.now()+5000;
    while(Date.now()<deadline){const item=messages.find(predicate);if(item)return item;await new Promise(resolve=>setTimeout(resolve,10));}
    throw Error('Timed out waiting for server packet: '+JSON.stringify(messages.map(m=>m.type)));
  };
  return {socket,messages,until,send:data=>socket.send(JSON.stringify(data))};
}
async function admin(server,route='status',token=adminToken,body) {
  const response=await fetch(`http://127.0.0.1:${server.adminPort}/admin/${route}`,{method:route==='status'?'GET':'POST',headers:{'x-wildbound-admin-token':token,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,body:await response.json()};
}
test('protocol rejects version, forged state, invalid axes and arbitrary methods',()=>{
  for(const message of [null,{type:'hello',version:9,name:'Scout',joinToken},{type:'state',seq:0,state:{}},{type:'input',seq:0,input:{x:Infinity}},{type:'input',seq:0,input:{attack:'yes'}},{type:'action',seq:0,action:'dropLoot',arg:999},{type:'action',seq:0,action:'moveInventoryItem',arg:{from:{mode:'pack',index:-1},to:{mode:'pack',index:0}}}])
    assert.throws(()=>parseMessage(JSON.stringify(message)));
  assert.deepEqual(parseMessage(JSON.stringify({type:'input',seq:2,input:{x:1,y:0,attack:true,unknown:true}})).input,{x:1,y:0,attack:true});
  assert.throws(()=>validateConfig({bind:'0.0.0.0',port:4183,adminHost:'0.0.0.0',adminPort:4184}));
});
test('atomic persistence serializes writes, preserves backup and recovers without overwriting it',async t=>{
  const c=await config(t),store=new WorldStore(c.savePath),validate=x=>{assert.equal(x.version,1);};
  await Promise.all([store.write({version:1,n:1,set:new Set([2])}),store.write({version:1,n:2,set:new Set([3])})]);
  assert.equal((await store.load(validate)).n,2);
  assert.equal(decode(await fs.readFile(c.savePath+'.bak','utf8')).n,1);
  await fs.writeFile(c.savePath,'broken');
  const recovered=await store.load(validate);assert.equal(recovered.n,1);assert.deepEqual([...recovered.set],[2]);
  await store.write({version:1,n:3});assert.equal(decode(await fs.readFile(c.savePath+'.bak','utf8')).n,1);
  assert.equal((await fs.readdir(path.dirname(c.savePath))).some(name=>name.endsWith('.tmp')),false);
});
test('initial configuration generates separate secrets and never replaces existing configuration',async t=>{
  const c=await config(t),file=path.join(path.dirname(c.savePath),'config.json');
  const a=await loadConfig(file,{initialize:true}),b=await loadConfig(file,{initialize:true});
  assert.notEqual(a.adminToken,a.joinToken);assert.equal(a.adminToken,b.adminToken);assert.equal(a.adminHost,'127.0.0.1');
});
test('two clients share authoritative movement, inventory, combat, portals and saved progress',async t=>{
  const c=await config(t),server=await createPersistentServer(c,{manualTicks:true});
  t.after(()=>server.close());
  const a=await client(t,server,'Scout'),aw=await a.until(m=>m.type==='welcome');
  const b=await client(t,server,'Ember'),bw=await b.until(m=>m.type==='welcome');
  assert.notEqual(aw.playerId,bw.playerId);assert.notEqual(aw.resumeToken,bw.resumeToken);
  assert.ok(server.game.forestLandscape.routes.length>=2);assert.ok(server.game.forestLandscape.landmarks.length>=2);
  const player=server.game.players.find(p=>p.id===aw.playerId);
  server.game.openingBoard=false;
  const before=player.x;
  a.send({type:'input',seq:0,input:{x:1,y:0}});
  await new Promise(resolve=>setTimeout(resolve,30));server.advance(3);
  assert.ok(player.x>before);assert.equal(server.status().fault,null);
  const aState=await a.until(m=>m.type==='state'&&m.tick===server.status().tick);
  const bState=await b.until(m=>m.type==='state'&&m.tick===server.status().tick);
  assert.deepEqual(aState.state,bState.state);
  assert.equal(aState.state.players.find(p=>p.id===aw.playerId).x,player.x);
  assert.equal(JSON.stringify(aState).includes(aw.resumeToken),false);
  give(player.inventory,'stone',3);
  a.send({type:'action',seq:1,action:'openInventory'});
  await a.until(m=>m.type==='ack'&&m.seq===1);
  const index=player.inventory.findIndex(item=>item?.type==='stone');
  a.send({type:'action',seq:2,action:'inventoryAction',arg:'select:'+index});
  await a.until(m=>m.type==='ack'&&m.seq===2);
  a.send({type:'action',seq:3,action:'inventoryAction',arg:'dropOne'});
  await a.until(m=>m.type==='ack'&&m.seq===3);
  assert.equal(player.inventory[index].qty,2);assert.ok(server.game.loot.some(item=>item.type==='stone'));
  const lootCount=server.game.loot.length;
  a.send({type:'action',seq:3,action:'inventoryAction',arg:'dropOne'});
  await new Promise(resolve=>setTimeout(resolve,25));assert.equal(server.game.loot.length,lootCount);
  a.send({type:'action',seq:4,action:'inventoryAction',arg:'close'});await a.until(m=>m.type==='ack'&&m.seq===4);
  // Enemy/combat fixtures are created on the authority; the client can only
  // press/release Attack, never submit a hit or set enemy health.
  Object.assign(player,{x:500,y:500,faceX:1,faceY:0});player.equipment.hand1='sword';
  const foe={id:server.game.nextId++,kind:'scorpion',x:530,y:500,hp:100,maxHp:100,speed:0,damage:0,faction:'hostile',state:'graze',timer:10,cooldown:999,faceX:-1,faceY:0,flash:0,step:0};
  server.game.enemies.push(foe);
  a.send({type:'input',seq:6,input:{attack:true}});await new Promise(resolve=>setTimeout(resolve,20));server.advance(2);
  a.send({type:'input',seq:7,input:{attack:false}});await new Promise(resolve=>setTimeout(resolve,20));server.advance(2);
  assert.ok(foe.hp<100,'Attack release must damage the enemy on the authority');
  Object.assign(player,{x:800,y:900,faceX:0,faceY:-1,attack:0});
  a.send({type:'action',seq:8,action:'openForestPassage'});await a.until(m=>m.type==='ack'&&m.seq===8);
  const portal=server.game.portals.find(d=>d.forestTravel==='outbound');assert.ok(portal);
  const carried=structuredClone(player.inventory);
  assert.equal(travelThroughForestPortal(server.game,portal),true);
  assert.deepEqual(player.inventory,carried);assert.equal(server.game.forestJourney.active,'forest');
  assert.equal(server.game.players.length,2);
  server.game.boardProgress=7;
  player.hunterPet={kind:'wolf',x:player.x-20,y:player.y,hp:32,maxHp:40};
  const seed=server.game.seed;
  await server.save();
  const disk=decode(await fs.readFile(c.savePath,'utf8'));
  assert.equal(disk.state.boardProgress,7);assert.equal(disk.state.players[0].hunterPet.hp,32);
  // Closing and restoring exercises the real versioned save, not a mocked world.
  a.socket.terminate();b.socket.terminate();await server.close();
  const restored=await createPersistentServer(c,{manualTicks:true});t.after(()=>restored.close());
  assert.equal(restored.game.seed,seed);assert.equal(restored.game.boardProgress,7);
  assert.deepEqual(restored.game.players[0].inventory,carried);
  assert.equal(restored.game.players[0].hunterPet.hp,32);
  const rejoined=await client(t,restored,'ChangedName',aw.resumeToken),welcome=await rejoined.until(m=>m.type==='welcome');
  assert.equal(welcome.playerId,aw.playerId);assert.equal(restored.game.players[0].name,'Scout');
  assert.equal(restored.game.players.length,2);assert.equal(restored.status().playerCount,1);
  const fake=await client(t,restored,'Scout','f'.repeat(64));assert.match((await fake.until(m=>m.type==='rejected')).message,/does not belong/);
});
test('harvested and removed distant chunk scenery survives unload, reload and server restart',async t=>{
  const c=await config(t),server=await createPersistentServer(c,{manualTicks:true});t.after(()=>server.close());
  const a=await client(t,server);await a.until(m=>m.type==='welcome');
  const p=server.game.players[0];server.game.openingBoard=false;p.x=2400;p.y=800;
  for(let n=0;n<12;n++)updateBoundlessWorld(server.game,0);
  const props=server.game.scenery.filter(prop=>prop.id?.startsWith('boundless:1:0:'));
  assert.ok(props.length>2);
  const edited=props[0],removed=props[1];edited.depleted=true;edited.harvested=3;
  server.game.scenery=server.game.scenery.filter(prop=>prop!==removed);
  await server.save();
  p.x=800;p.y=800;for(let n=0;n<12;n++)updateBoundlessWorld(server.game,0);
  p.x=2400;p.y=800;for(let n=0;n<12;n++)updateBoundlessWorld(server.game,0);
  assert.equal(server.game.scenery.find(prop=>prop.id===edited.id)?.harvested,3);
  assert.equal(server.game.scenery.some(prop=>prop.id===removed.id),false);
  p.x=800;p.y=800;for(let n=0;n<12;n++)updateBoundlessWorld(server.game,0);
  await server.close();
  const restored=await createPersistentServer(c,{manualTicks:true});t.after(()=>restored.close());
  restored.game.openingBoard=false;restored.game.players[0].x=2400;
  for(let n=0;n<12;n++)updateBoundlessWorld(restored.game,0);
  assert.equal(restored.game.scenery.find(prop=>prop.id===edited.id)?.harvested,3);
  assert.equal(restored.game.scenery.some(prop=>prop.id===removed.id),false);
});
test('admin requires auth, announcements reach clients, stop saves and loopback remains private',async t=>{
  const c=await config(t),server=await createPersistentServer(c,{manualTicks:true});t.after(()=>server.close());
  const a=await client(t,server);await a.until(m=>m.type==='welcome');
  assert.equal((await admin(server,'status','')).status,401);
  assert.equal((await admin(server,'save','wrong')).status,401);
  const status=await admin(server);assert.equal(status.body.localHealth,true);assert.equal(status.body.publicHealth,false);
  assert.equal((await fetch(`http://127.0.0.1:${server.gamePort}/admin/status`)).status,404);
  assert.equal(JSON.stringify(status.body).includes(joinToken),false);assert.equal(JSON.stringify(status.body).includes(adminToken),false);
  assert.equal(status.body.playerCount,1);assert.equal(status.body.authorityCount,1);assert.equal(c.adminHost,'127.0.0.1');
  assert.equal((await admin(server,'announce',adminToken,{message:''})).status,400);
  assert.equal((await admin(server,'announce',adminToken,{message:'Hello forest'})).status,200);
  assert.equal((await a.until(m=>m.type==='announcement')).message,'Hello forest');
  assert.equal((await admin(server,'save')).status,200);
  assert.equal((await admin(server,'stop')).status,200);
  const deadline=Date.now()+3000;while(!server.closed&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(server.closed,true);assert.ok(decode(await fs.readFile(c.savePath,'utf8')).savedAt);
  await assert.rejects(fetch(`http://127.0.0.1:${server.adminPort}/admin/status`));
});
test('join key, duplicate sessions and exclusive world lock prevent unauthorized ownership',async t=>{
  const c=await config(t),server=await createPersistentServer(c,{manualTicks:true});t.after(()=>server.close());
  await assert.rejects(createPersistentServer(c),/already in use/);
  const bad=await client(t,server,'Scout',undefined,'wrong');assert.match((await bad.until(m=>m.type==='rejected')).message,/join key/);
  assert.equal(server.game.players.length,0);
  const a=await client(t,server),welcome=await a.until(m=>m.type==='welcome');
  const copy=await client(t,server,'Scout',welcome.resumeToken);assert.match((await copy.until(m=>m.type==='rejected')).message,/already connected/);
});
test('desktop transport reconnects with the saved identity and never creates a second explorer',async t=>{
  const c=await config(t),server=await createPersistentServer(c);t.after(()=>server.close());
  const events=[],transport=new ServerTransport(data=>events.push(data));t.after(()=>transport.stop());
  await transport.connect(`ws://127.0.0.1:${server.gamePort}/game`,'Scout',joinToken);
  const id=events.find(m=>m.type==='welcome').playerId;
  transport.socket.terminate();
  const deadline=Date.now()+5000;
  while(events.filter(m=>m.type==='welcome').length<2&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(events.filter(m=>m.type==='welcome').length,2);
  assert.equal(events.filter(m=>m.type==='welcome')[1].playerId,id);
  assert.equal(server.game.players.length,1);assert.equal(server.status().playerCount,1);
  const identity=events.find(m=>m.type==='welcome');
  transport.stop();await server.close();
  const restarted=await createPersistentServer(c);t.after(()=>restarted.close());
  const next=new ServerTransport(()=>{});t.after(()=>next.stop());
  const restored=await next.connect(`ws://127.0.0.1:${restarted.gamePort}/game`,'Scout',joinToken,undefined,[{instanceId:identity.instanceId,resumeToken:identity.resumeToken}]);
  assert.equal(restored.playerId,id);assert.equal(restarted.game.players.length,1);
});
