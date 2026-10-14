import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {WebSocket,WebSocketServer} from 'ws';
import {Game,EVENTS} from '../src/core.mjs';
import {ITEMS} from '../src/items.mjs';
import {applyDefinitions} from '../src/definitions.mjs';
import {ensureFootprint,generateWorld} from '../src/world.mjs';
import {restoreForestLandscape} from '../src/forest-landscape.mjs';
import {checkpointBoundlessWorld} from '../src/boundless-world.mjs';
import {snapshot} from '../src/rooms.mjs';
import {root,validateConfig} from './config.mjs';
import {WorldStore,encode} from './persistence.mjs';
import {PROTOCOL_VERSION,MAX_MESSAGE_BYTES,MAX_SNAPSHOT_BYTES,parseMessage} from './protocol.mjs';
import {performAction} from './actions.mjs';
import {startPublicTunnel} from './public-tunnel.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const equalSecret = (a,b) => typeof a === 'string' && timingSafeEqual(Buffer.from(digest(a),'hex'),Buffer.from(digest(b),'hex'));
const isLoopback = host => ['localhost','127.0.0.1','::1','[::1]'].includes(host);
const json = (res,status,body) => {res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(body));};
export function validateWorld(data) {
  if (data?.version !== 1 || typeof data.instanceId !== 'string' || !Number.isInteger(data.rngState) || !Number.isSafeInteger(data.tick) || data.tick < 0) throw Error('Unsupported or invalid world save.');
  const g = data.state;
  if (!g || !Number.isInteger(g.seed) || !Array.isArray(g.players) || g.players.length>6 || !Array.isArray(g.scenery) || !Array.isArray(g.terrain) || g.terrain.length!==2500 || !Number.isFinite(g.time)) throw Error('Invalid world state.');
  for (const p of g.players) if (!Number.isSafeInteger(p.id) || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Array.isArray(p.inventory)) throw Error('Invalid saved player.');
  if (!Array.isArray(data.identities) || data.identities.length!==g.players.length || new Set(data.identities.map(i=>i.hash)).size!==data.identities.length || new Set(data.identities.map(i=>i.playerId)).size!==data.identities.length) throw Error('Invalid saved identity roster.');
  for (const identity of data.identities) if (!/^[a-f0-9]{64}$/.test(identity.hash) || !g.players.some(p=>p.id===identity.playerId)) throw Error('Invalid saved identity.');
}
async function listen(server,port,host) {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.removeListener('error',reject);resolve();});});
}
async function closeHttp(server) {
  if (!server.listening) return;
  server.closeIdleConnections?.();
  await new Promise(resolve=>server.close(resolve));
}
export async function createPersistentServer(config, {manualTicks=false}={}) {
  validateConfig(config);
  const store = new WorldStore(path.resolve(config.savePath));
  await fs.mkdir(path.dirname(store.file),{recursive:true});
  const lock = store.file+'.lock';
  const lockId = randomUUID();
  for (let attempt=0;;attempt++) {
    try {await fs.writeFile(lock,JSON.stringify({pid:process.pid,id:lockId}),{flag:'wx',mode:0o600});break;}
    catch (error) {
      if(error.code!=='EEXIST'||attempt>0)throw Error(`World already in use or locked: ${lock}. ${error.message}`);
      const owner = JSON.parse(await fs.readFile(lock,'utf8'));
      try {process.kill(owner.pid,0);throw Error('World already in use by a running server.');}
      catch (probe) {if(probe.code!=='ESRCH')throw probe;}
      await fs.unlink(lock);
    }
  }
  const unlock = async()=>{
    try {const owner=JSON.parse(await fs.readFile(lock,'utf8'));if(owner.id===lockId)await fs.unlink(lock);}
    catch(error){if(error.code!=='ENOENT')throw error;}
  };
  let gameServer,adminServer,wss,gameTimer,saveTimer,probeTimer,tunnel;
  try {
    // Both server and client use the checked-in authored rules/rigs and footprints.
    const authored = JSON.parse(await fs.readFile(path.join(root,'authored','rigs.json'),'utf8'));
    applyDefinitions(authored,EVENTS,ITEMS,{spriteOverrides:false});
    let rngState=config.seed+1;
    const random=()=>{rngState=(rngState+0x6D2B79F5)>>>0;let t=rngState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
    const saved=await store.load(validateWorld);
    const game=new Game(random);
    let tick=saved?.tick??0,instanceId=saved?.instanceId??randomUUID(),worldStarted=saved?.started??saved?.state?.serverStarted??false;
    const identities=new Map((saved?.identities??[]).map(i=>[i.hash,i.playerId]));
    if(saved){
      Object.assign(game,saved.state);rngState=saved.rngState;
      game.explored=new Set(saved.state.explored);
      restoreForestLandscape(game,saved.state.forestLandscapeVersion);
      for(const p of game.players){p.netDisconnected=true;p.previousInput={};p.charge=0;}
    } else {
      game.seed=config.seed;Object.assign(game,generateWorld(config.seed,'forest'));
      game.mapMode='boundless';game.phase='play';
    }
    game.random=random;
    game.persistentWorld=true;
    game.spriteLibrary={};
    for(const file of ['library.json','parts.json','animal-parts.json'])Object.assign(game.spriteLibrary,JSON.parse(await fs.readFile(path.join(root,'assets',file),'utf8')));
    for(const [name,sprite] of Object.entries(game.spriteLibrary))ensureFootprint(sprite,name);
    // No client profile or browser storage is used by this process.
    const peers=new Map(),byPlayer=new Map();
    let stopping=false,closed=false,fault=null,lastSave=saved?.savedAt??null,saveError=null,publicHealth=false,tunnelError=null;
    const startedAt=Date.now();
    const packet=(socket,value)=>{if(socket.readyState===WebSocket.OPEN){if(socket.bufferedAmount>MAX_SNAPSHOT_BYTES){socket.close(1013,'Client too slow. Reconnect.');return;}socket.send(encode(value));}};
    const broadcast=value=>{const body=encode(value);for(const [s,peer]of peers)if(peer.ready&&s.readyState===WebSocket.OPEN){if(s.bufferedAmount>MAX_SNAPSHOT_BYTES)s.close(1013,'Client too slow. Reconnect.');else s.send(body);}};
    const save=async()=>{
      checkpointBoundlessWorld(game);
      const savedAt=new Date().toISOString();
      try{await store.write({version:1,instanceId,rngState,tick,started:worldStarted,savedAt,identities:[...identities].map(([hash,playerId])=>({hash,playerId})),state:snapshot(game)});lastSave=savedAt;saveError=null;return {message:'World saved.',lastSave};}
      catch(error){saveError=error.message;throw error;}
    };
    game.persist=()=>{}; // Simulation calls are coalesced by the periodic save.
    const statePacket=()=>{
      const state={...snapshot(game)};
      delete state.boundlessChunkChanges;
      if(state.forestJourney)state.forestJourney={active:state.forestJourney.active};
      return {type:'state',version:PROTOCOL_VERSION,tick,state};
    };
    const publish=()=>{
      const state=statePacket();
      if(Buffer.byteLength(encode(state))>MAX_SNAPSHOT_BYTES)throw Error('World snapshot exceeds supported size.');
      broadcast(state);
    };
    const advance=(steps=1)=>{
      if(stopping||fault||!byPlayer.size)return;
      for(let n=0;n<steps;n++){
        const inputs={};
        for(const peer of peers.values())if(peer.playerId)inputs['server:'+peer.playerId]=Date.now()-peer.inputAt<600?peer.input:{};
        try{game.update(1/30,inputs);tick++;if(tick%3===0)publish();}
        catch(error){fault=error.stack||error.message;console.error('Server simulation paused:',fault);broadcast({type:'server-error',message:'The server paused after a simulation error. Contact the operator.'});break;}
      }
    };
    gameServer=http.createServer((req,res)=>{
      if(req.method==='GET'&&req.url==='/health')json(res,fault?503:200,{version:PROTOCOL_VERSION,instanceId,healthy:!fault&&!stopping,tick});
      else json(res,404,{error:'Not found.'});
    });
    gameServer.requestTimeout=5000;
    wss=new WebSocketServer({noServer:true,maxPayload:MAX_MESSAGE_BYTES,perMessageDeflate:false});
    gameServer.on('upgrade',(req,socket,head)=>{
      if(req.url!=='/game'||stopping||peers.size>=24){socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');return;}
      wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
    });
    wss.on('connection',socket=>{
      const peer={playerId:null,lastSeq:-1,input:{},inputAt:0,rateAt:Date.now(),rate:0};
      peers.set(socket,peer);
      packet(socket,{type:'server-info',version:PROTOCOL_VERSION,instanceId});
      const timeout=setTimeout(()=>{if(!peer.playerId)socket.close(1008,'Handshake required.');},5000);
      socket.on('error',()=>{});
      socket.on('close',()=>{
        clearTimeout(timeout);peers.delete(socket);
        if(peer.playerId&&byPlayer.get(peer.playerId)===socket){byPlayer.delete(peer.playerId);const p=game.players.find(p=>p.id===peer.playerId);if(p){p.netDisconnected=true;p.previousInput={};p.charge=0;}if(!stopping)save().catch(error=>console.error('Disconnect save failed:',error.message));}
      });
      socket.on('message',raw=>{
        try{
          if(Date.now()-peer.rateAt>=1000){peer.rate=0;peer.rateAt=Date.now();}
          if(++peer.rate>90)throw Error('Too many messages.');
          const message=parseMessage(raw);
          if(message.type==='probe'){
            if(peer.playerId)throw Error('Probe unavailable during play.');
            packet(socket,{type:'probe',version:PROTOCOL_VERSION,instanceId,nonce:message.nonce,healthy:!fault&&!stopping});socket.close();return;
          }
          if(message.type==='hello'){
            if(peer.playerId)throw Error('Already connected.');
            if(!equalSecret(message.joinToken,config.joinToken))throw Error('Incorrect server join key.');
            let player,token;
            if(message.resumeToken){
              const playerId=identities.get(digest(message.resumeToken));
              player=game.players.find(p=>p.id===playerId);
              if(!player)throw Error('Reconnect credential does not belong to this world.');
              if(byPlayer.has(player.id))throw Error('This explorer is already connected.');
              token=message.resumeToken;
            } else {
              if(game.players.length>=config.maxPlayers)throw Error('Server roster is full. Reconnect with an existing explorer.');
              const wasLocked=game.locked;game.locked=false;
              try{player=game.addPlayer('pending:'+randomUUID(),message.name);}finally{game.locked=wasLocked;}
              if(!player)throw Error('Cannot add another explorer.');
              if(game.locked)game.turnOrder.push(player.id);
              token=randomBytes(32).toString('hex');identities.set(digest(token),player.id);
              if(!worldStarted){game.start();worldStarted=true;}
              player.x=800;player.y=900;player.faceX=0;player.faceY=-1;
            }
            player.device='server:'+player.id;player.netDisconnected=false;
            player.previousInput={};player.charge=0;
            peer.playerId=player.id;byPlayer.set(player.id,socket);clearTimeout(timeout);
            // Persist the reconnect identity before returning its credential.
            save().then(()=>{peer.ready=true;packet(socket,{type:'welcome',version:PROTOCOL_VERSION,peer:String(player.id),playerId:player.id,resumeToken:token,instanceId,tick});packet(socket,statePacket());})
              .catch(error=>{packet(socket,{type:'rejected',message:'Unable to save your explorer. Contact the operator.'});socket.close(1011,'Save failed.');});
            return;
          }
          if(!peer.playerId||!peer.ready)throw Error('Wait for the welcome handshake.');
          if(fault)throw Error('Server simulation is paused.');
          if(message.seq<=peer.lastSeq)return;
          peer.lastSeq=message.seq;
          const player=game.players.find(p=>p.id===peer.playerId);
          if(message.type==='input'){peer.input=message.input;peer.inputAt=Date.now();return;}
          const result=performAction(game,player,message.action,message.arg);
          if(result?.message)packet(socket,{type:'notice',message:result.message});
          packet(socket,{type:'ack',seq:message.seq,tick,...(message.requestId!==undefined?{requestId:message.requestId}:{}),message:result?.message||'Server action accepted.'});
        }catch(error){packet(socket,{type:'rejected',message:error.message});socket.close(1008,error.message.slice(0,100));}
      });
    });
    const status=()=>({version:PROTOCOL_VERSION,instanceId,uptimeSeconds:(Date.now()-startedAt)/1000,playerCount:byPlayer.size,
      players:game.players.filter(p=>byPlayer.has(p.id)).map(p=>({id:p.id,name:p.name,location:game.forestJourney?.active==='forest'?'Heartwood Clearing':'Forest expedition'})),
      worldSeed:game.seed,lastSave,authorityCount:stopping?0:1,tunnelCount:tunnel?.running?1:0,localHealth:!fault&&!stopping,publicHealth,
      publicAddress:config.publicAddress,localAddress:`ws://${config.bind==='0.0.0.0'?'127.0.0.1':config.bind==='::'?'[::1]':config.bind}:${gameServer.address()?.port}/game`,tick,saveError,tunnelError,fault:fault?'Simulation paused. See the server log.':null,rosterCount:game.players.length});
    let closePromise;
    const close=()=>{
      if(closePromise)return closePromise;
      closePromise=(async()=>{
        stopping=true;clearInterval(gameTimer);clearInterval(saveTimer);clearInterval(probeTimer);
        broadcast({type:'stopping',message:'Server is saving and stopping. Reconnect when it returns.'});
        try{await save();}
        catch(error){stopping=false;closePromise=null;fault='Shutdown save failed: '+error.message;throw error;}
        for(const socket of peers.keys())socket.terminate();
        tunnel?.close();
        await new Promise(resolve=>wss.close(resolve));
        await Promise.all([closeHttp(gameServer),closeHttp(adminServer)]);
        await unlock();closed=true;
      })();return closePromise;
    };
    adminServer=http.createServer(async(req,res)=>{
      try{
        if(!equalSecret(req.headers['x-wildbound-admin-token'],config.adminToken))return json(res,401,{error:'Invalid admin token.'});
        if(req.method==='GET'&&req.url==='/admin/status')return json(res,200,status());
        if(req.method!=='POST')return json(res,404,{error:'Not found.'});
        let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096){json(res,413,{error:'Request too large.'});return;}}
        let data={};if(body){try{data=JSON.parse(body);}catch{return json(res,400,{error:'Malformed JSON.'});}}
        if(req.url==='/admin/save')return json(res,200,await save());
        if(req.url==='/admin/announce'){
          if(typeof data.message!=='string'||!data.message.trim()||data.message.length>240)return json(res,400,{error:'Announcement must contain 1 to 240 characters.'});
          const message=data.message.trim();game.message('Server: '+message);broadcast({type:'announcement',message});return json(res,200,{message:'Announcement sent.'});
        }
        if(req.url==='/admin/stop'){
          await save();json(res,200,{message:'World saved. Server stopping.'});
          setImmediate(()=>close().catch(error=>console.error('Safe stop failed:',error.message)));return;
        }
        json(res,404,{error:'Not found.'});
      }catch(error){json(res,500,{error:error.message});}
    });
    adminServer.requestTimeout=5000;
    const probePublic=async()=>{
      publicHealth=false;
      if(!config.publicAddress||stopping||fault)return;
      const url=new URL(config.publicAddress);if(isLoopback(url.hostname))return;
      const nonce=randomBytes(16).toString('hex');
      await new Promise(resolve=>{
        const socket=new WebSocket(url,{handshakeTimeout:4000,maxPayload:4096});
        const timer=setTimeout(()=>{socket.terminate();resolve();},5000);
        socket.on('open',()=>socket.send(JSON.stringify({type:'probe',nonce})));
        socket.on('message',raw=>{try{const data=JSON.parse(raw);if(data.type!=='probe')return;publicHealth=data.version===PROTOCOL_VERSION&&data.nonce===nonce&&data.instanceId===instanceId&&data.healthy===true;}catch{publicHealth=false;}socket.close();});
        socket.on('error',()=>{});socket.on('close',()=>{clearTimeout(timer);resolve();});
      });
    };
    await listen(gameServer,config.port,config.bind);
    await listen(adminServer,config.adminPort,config.adminHost);
    await save();
    try{tunnel=await startPublicTunnel(config,gameServer.address().port);}catch(error){tunnelError=error.message;console.error('Public tunnel unavailable:',tunnelError);}
    if(tunnel)config.publicAddress=tunnel.address;
    if(!manualTicks)gameTimer=setInterval(()=>advance(),1000/30);
    saveTimer=setInterval(()=>save().catch(error=>console.error('Autosave failed:',error.message)),10000);
    probeTimer=setInterval(()=>probePublic().catch(()=>{publicHealth=false;}),30000);
    probePublic().catch(()=>{});
    return {game,save,close,advance,publish,status,get closed(){return closed;},gamePort:gameServer.address().port,adminPort:adminServer.address().port};
  }catch(error){
    clearInterval(gameTimer);clearInterval(saveTimer);clearInterval(probeTimer);tunnel?.close();
    if(wss)for(const socket of wss.clients)socket.terminate();
    if(gameServer)await closeHttp(gameServer);if(adminServer)await closeHttp(adminServer);
    await unlock();throw error;
  }
}
