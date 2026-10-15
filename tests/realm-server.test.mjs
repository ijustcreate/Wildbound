import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {startForestServer} from '../realm-server.mjs';
import {boundlessBiomeAt,boundlessTerrainAt} from '../src/boundless-world.mjs';
import {getNpcQuestConfig,validateNpcQuestConfig} from '../src/npc-quest-data.mjs';
import {expeditionCameraTarget} from '../src/core.mjs';

async function connect(realm,id,creator=false){
  const s=new WebSocket(`ws://127.0.0.1:${realm.port}/realm`),queue=[];
  s.on('message',raw=>queue.push(JSON.parse(raw)));
  await new Promise((resolve,reject)=>{s.once('open',resolve);s.once('error',reject);});
  s.send(JSON.stringify({type:'hello',characterId:id,name:id.slice(0,10),playKey:realm.config.playKey,creatorKey:creator?realm.config.creatorKey:''}));
  const wait=async predicate=>{
    const end=Date.now()+3000;
    while(Date.now()<end){const i=queue.findIndex(predicate);if(i>=0)return queue.splice(i,1)[0];await new Promise(r=>setTimeout(r,10));}
    throw Error('Timed out waiting for server message.');
  };
  const welcome=await wait(d=>d.type==='welcome');await wait(d=>d.type==='state');
  return {s,wait,welcome,send:data=>s.send(JSON.stringify(data)),close:()=>new Promise(resolve=>{s.once('close',resolve);s.close();})};
}

test('forest authority, two clients, live authoring, access control, sleep, loot and restart',async()=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-realm-test-'));
  let realm=await startForestServer({folder,port:0,host:'127.0.0.1',manual:true});const clients=[];
  try{
    assert(validateNpcQuestConfig(getNpcQuestConfig()));
    const a=await connect(realm,'creator123456789012345',true),b=await connect(realm,'explorer12345678901234');clients.push(a,b);
    assert.notEqual(a.welcome.playerId,b.welcome.playerId);assert.equal(realm.g.players.length,2);
    const view={...realm.g,realmViewerId:a.welcome.playerId,players:realm.g.players.map(p=>({...p}))};
    const cameraBefore=expeditionCameraTarget(view,1000,700);view.players[1].x+=10000;
    assert.deepEqual(expeditionCameraTarget(view,1000,700),cameraBefore,'each realm client camera follows its own explorer');
    const p=realm.g.players.find(p=>p.id===a.welcome.playerId),initial=p.x;
    a.send({type:'input',input:{x:Infinity,y:0,aimX:NaN,aimY:0,attack:false}});
    await new Promise(r=>setTimeout(r,20));realm.step();assert(Number.isFinite(p.x));
    a.send({type:'input',input:{x:1,y:0}});await new Promise(r=>setTimeout(r,20));
    for(let i=0;i<4;i++)realm.step();assert(p.x>initial);
    await new Promise(r=>setTimeout(r,320));const after=p.x;realm.step();assert.equal(p.x,after,'stale input stops movement');
    b.send({type:'edit',requestId:1,edit:{type:'landmark',name:'Forbidden',x:1200,y:1000}});
    assert.match((await b.wait(d=>d.type==='error'&&d.requestId===1)).message,/creator/i);
    assert(!realm.g.realm.landmarks.some(l=>l.name==='Forbidden'));
    a.send({type:'edit',requestId:2,edit:{type:'landmark',name:'Remember Me',x:1200,y:1000}});
    await a.wait(d=>d.type==='result'&&d.requestId===2);
    const state=await b.wait(d=>d.type==='state'&&d.state.realm.revision===1);
    assert(state.state.realm.landmarks.some(l=>l.name==='Remember Me'));
    a.send({type:'edit',requestId:3,edit:{type:'landmark',name:'Bad',x:null,y:0}});
    await a.wait(d=>d.type==='error'&&d.requestId===3);assert.equal(realm.g.realm.revision,1);
    a.send({type:'edit',requestId:4,edit:{type:'npc',name:'Keeper',x:1120,y:1090}});
    await a.wait(d=>d.type==='result'&&d.requestId===4);assert.equal(realm.g.questNpcs[0].x,1120);
    a.send({type:'undo',requestId:5});await a.wait(d=>d.type==='result'&&d.requestId===5);assert.equal(realm.g.questNpcs[0].x,1060);
    assert.equal(realm.g.hitTable(p),false,'persistent realm cannot reset through board rolls');
    for(let i=0;i<4;i++)realm.step();assert(realm.g.enemies.some(e=>e.realmTerritory==='forest-edge'));
    // The real pickup path resolves one shared drop once, even with both players beside it.
    const q=realm.g.players.find(p=>p.id===b.welcome.playerId);
    Object.assign(q,{x:p.x,y:p.y});realm.g.loot.push({id:realm.g.nextId++,type:'stone',qty:1,x:p.x,y:p.y});
    const before=n=>n.inventory.filter(i=>i?.type==='stone').reduce((s,i)=>s+(i.qty||1),0);
    const stones=before(p)+before(q);
    a.send({type:'input',input:{loot:true}});b.send({type:'input',input:{loot:true}});
    await new Promise(r=>setTimeout(r,20));realm.step(.05);
    assert.equal(before(p)+before(q),stones+1);
    const tile=boundlessTerrainAt(realm.g,-73,87);assert.equal(boundlessBiomeAt(realm.g,8800,-800),'forest');
    await a.close();await b.close();clients.length=0;await new Promise(r=>setTimeout(r,30));
    const time=realm.g.time;realm.step();assert.equal(realm.g.time,time,'empty realm sleeps');
    const revision=realm.g.realm.revision;await realm.close();
    realm=await startForestServer({folder,port:0,host:'127.0.0.1',manual:true});
    assert.equal(realm.g.realm.revision,revision);assert(realm.g.realm.landmarks.some(l=>l.name==='Remember Me'));
    assert.equal(boundlessTerrainAt(realm.g,-73,87),tile);
    const rejoined=await connect(realm,'creator123456789012345',true);clients.push(rejoined);
    assert.equal(rejoined.welcome.playerId,a.welcome.playerId);assert.equal(realm.g.players.length,1);
    assert.equal(before(realm.g.players[0]),before(p));
    const denied=await fetch(`http://127.0.0.1:${realm.port}/backup`,{method:'POST'});assert.equal(denied.status,403);
    const backup=await fetch(`http://127.0.0.1:${realm.port}/backup`,{method:'POST',headers:{'x-creator-key':realm.config.creatorKey}});
    assert(fs.existsSync(path.join(folder,(await backup.json()).backup)));
  }finally{for(const c of clients)await c.close();await realm.close();}
});
