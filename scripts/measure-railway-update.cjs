const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const run=spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,...process.argv.slice(2),'--mute-audio'],
  {cwd:root,env,encoding:'utf8',timeout:180000});
 process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');
 if(run.error)console.error(run.error);
 process.exit(run.status??1);
}

const {app,BrowserWindow}=require('electron');
const source=process.env.WILDBOUND_VERIFY_APP||root,stage=process.argv[2]||'candidate';
const out=path.join(root,'test-output/railway-update',stage);
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const timeout=setTimeout(()=>app.exit(1),175000);

async function sample(){
 window.requestAnimationFrame=()=>0;
 const {Game}=await import('./src/core.mjs');
 const {enterWildLands}=await import('./src/wild-lands.mjs');
 const {trainCars,trainRiderWorld}=await import('./src/train-track.mjs');
 const {nativeWildProps}=await import('./src/wild-native-biomes.mjs');
 const {prepareRailwayView,railwayStarting,stopRailwayStream}=await import('./src/railway-stream.mjs');
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const inspect=values=>{
  values.sort((a,b)=>a-b);
  const q=f=>+values[Math.min(values.length-1,Math.floor(values.length*f))].toFixed(3);
  return {median:q(.5),p95:q(.95),p99:q(.99),max:q(1),over16ms:values.filter(v=>v>16.67).length};
 };
 const wait=async(condition,message)=>{
  const start=performance.now();
  while(!condition()){
   if(performance.now()-start>32000)throw Error(message);
   await sleep(12);
  }
  return +(performance.now()-start).toFixed(2);
 };
 const boundsAround=p=>({left:p.x-520,top:p.y-345,right:p.x+520,bottom:p.y+345});
 async function ride(fallback){
  const g=new Game(()=>.5);
  for(let i=0;i<4;i++)g.addPlayer(i?'pad:'+i:'keyboard','Rider '+i);
  g.start();g.openingBoard=false;g.persist=()=>{};g.onSound=()=>{};
  if(!enterWildLands(g).ok)throw Error('The Wild Lands failed to enter');
  const t=g.trainTest;
  t.distance+=730;t.engine=true;t.throttle=.8;t.speed=140;
  const cars=trainCars(t);
  for(const [i,p] of g.players.entries()){
   p.trainRide={car:2,x:i*14-21,y:12};p.invulnerable=999;
   Object.assign(p,trainRiderWorld(cars,p.trainRide));
  }
  const p=g.players[0],bounds=boundsAround(p);
  let firstFloorMs=null,visibleRegionsMs=null;
  if(fallback){t.streamDisabled=true;t.preparing=false;}
  else{
   prepareRailwayView(t,bounds,g.players);
   await wait(()=>t.terrainStream?.hasWorkerReply&&!railwayStarting(t,true),'Native terrain worker did not prepare collision');
   const stream=t.terrainStream;
   if(stream.failed)throw Error(stream.errors.join('; '));
   const col=Math.floor(p.x/512),row=Math.floor(p.y/512),key='floor:surface:512:'+col+':'+row;
   const regions=[];
   for(let y=Math.floor(bounds.top/1600);y<=Math.floor((bounds.bottom-.1)/1600);y++){
    for(let x=Math.floor(bounds.left/1600);x<=Math.floor((bounds.right-.1)/1600);x++)regions.push('region:surface:'+x+':'+y);
   }
   const start=performance.now();
   await wait(()=>{
    prepareRailwayView(t,bounds,g.players);
    const elapsed=+(performance.now()-start).toFixed(2);
    if(firstFloorMs===null&&stream.ready.has(key))firstFloorMs=elapsed;
    if(visibleRegionsMs===null&&regions.every(id=>stream.ready.has(id)))visibleRegionsMs=elapsed;
    return firstFloorMs!==null&&visibleRegionsMs!==null;
   },'Visible floor or scenery regions never arrived');
  }
  g.scenery=nativeWildProps(t,{left:p.x-790,top:p.y-550,right:p.x+790,bottom:p.y+550});
  const dt=1/60;
  for(let i=0;i<130;i++)g.update(dt,{});
  const playerUpdates=[],stageTimes={};
  for(let i=0;i<600;i++){
   const began=performance.now();
   g.update(dt,{});
   playerUpdates.push(performance.now()-began);
   for(const [name,value] of Object.entries(t.updateCosts||{}))(stageTimes[name]??=[]).push(value);
   if(!fallback&&i%12===0){
    prepareRailwayView(t,boundsAround(p),g.players);
    await sleep(5);
   }
  }
  const stream=t.terrainStream;
  if(stream?.failed)throw Error(stream.errors.join('; '));
  const report={samples:playerUpdates.length,speed:t.speed,scenery:g.scenery.length,cats:t.stationCats?.size||0,
   firstFloorMs,visibleRegionsMs,update:inspect(playerUpdates),stages:Object.fromEntries(Object.entries(stageTimes).map(([key,times])=>[key,inspect(times)])),
   worker:stream?{worlds:t.wildNativeWorlds?.size||0,ready:stream.ready.size,queue:stream.queue.size}:null};
  stopRailwayStream(t);
  return report;
 }
 return {nativeWorker:await ride(false),localFallback:await ride(true)};
}

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 try{
  await window.loadFile(path.join(source,'index.html'));
  await window.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await window.webContents.executeJavaScript('('+sample.toString()+')().catch(error=>({error:error.stack}))');
  if(result.error)throw Error(result.error);
  const report={...result,muted:window.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  clearTimeout(timeout);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
