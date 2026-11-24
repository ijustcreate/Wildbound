const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const verifyWorker=process.env.WILDBOUND_VERIFY_TERRAIN_WORKER==='1';
const output=path.join(root,'test-output','pirate-harbors',(base===root?'source':'packaged')+(verifyWorker?'-worker':''));
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-harbors-')));
app.commandLine.appendSwitch('mute-audio');

async function verifyStreamedHarbors(){
 window.requestAnimationFrame=()=>0;
 const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
 const {enterWildLands}=await import('./src/wild-lands.mjs');
 const {trainPrompt}=await import('./src/train-test.mjs');
 const {streamRegion,stopRailwayStream}=await import('./src/railway-stream.mjs');
 const {HOLLOW_ROOM,HOLLOW_GATE,HOLLOW_EXIT,HOLLOW_ARRIVAL,HOLLOW_NAV,MOUNTAIN_ASCENT,MOUNTAIN_BOUNDS,EAST_WILDS_WIDTH}=await import('./src/wild-mountain-layout.mjs');
 const {drawWildMountain}=await import('./src/wild-mountain-art.mjs');
 const {wildLandsSurface}=await import('./src/wild-lands-world.mjs');
 const checks=[],pictures={},frames={},workerMessages=new Set(),workerErrors=[];
 const check=(label,pass)=>{if(!pass)throw Error(label);checks.push(label);};
 const assets=wildboundPolishTest.assets,game=new Game(()=>.5,{deferWorld:true});
 game.addPlayer('keyboard','Streamed harbor scout');game.start();game.spriteLibrary=assets.library;
 const entered=enterWildLands(game),world=game.trainTest,design=world.design,player=game.players[0];
 check('The expanded Wild Lands opens through its native entry',entered.ok&&design.width===EAST_WILDS_WIDTH);
 player.invuln=999;
 const canvas=document.createElement('canvas');
 canvas.style.cssText='position:fixed;inset:0;width:960px;height:600px';document.body.append(canvas);
 const renderer=new Renderer(canvas,assets);
 const frame=()=>renderer.draw(game,1/45);
 frame();
 const stream=world.terrainStream;
 check('The renderer starts an actual browser terrain Worker',stream?.worker instanceof Worker);
 stream.worker.addEventListener('message',({data})=>{if(data.error)workerErrors.push(data.error);else workerMessages.add(data.key);});
 stream.worker.addEventListener('error',event=>workerErrors.push(event.message));
 stream.worker.addEventListener('messageerror',()=>workerErrors.push('Malformed worker message'));
 const assertHealthy=(stage='final terrain check')=>{
  if(stream.failed||workerErrors.length)throw Error(workerErrors.concat(stream.errors).join('\n')||'Terrain worker failed');
  if(world.terrainStream!==stream||world.streamDisabled)throw Error(stage+': terrain fell back to synchronous rendering with active job '+stream.active+', queue '+stream.queue.size+', last replies '+[...workerMessages].slice(-8).join(', '));
 };
 async function waitFor(label,condition,deadline=45000){
  const start=performance.now();
  while(performance.now()-start<deadline){
   assertHealthy(label);
   if(condition())return Math.round(performance.now()-start);
   frame();await new Promise(resolve=>setTimeout(resolve,42));
  }
  throw Error(label+' timed out, active '+stream.active+', queued '+stream.queue.size+', recent replies '+[...workerMessages].slice(-8).join(', '));
 }
 function walk(x,y){
  for(let i=0;i<180;i++){
   const dx=x-player.x,dy=y-player.y,distance=Math.hypot(dx,dy);
   if(distance<13)return;
   game.update(.05,{keyboard:{x:dx/distance,y:dy/distance}});
  }
  throw Error('Could not walk to '+x+','+y+' from '+player.x+','+player.y);
 }
 function capture(name){frame();pictures[name]=canvas.toDataURL();}
 function place(x,y){Object.assign(player,{x,y,swimming:false,underBridge:false,trainGround:0});renderer.trainScene=null;}
 function mountainSample(x,y,name){
  const sample=document.createElement('canvas');sample.width=540;sample.height=380;
  const c=sample.getContext('2d'),bounds={left:x-270,top:y-190,right:x+270,bottom:y+190};
  c.translate(-bounds.left,-bounds.top);
  drawWildMountain(c,bounds,0,world);
  pictures[name]=sample.toDataURL();
  const rgba=c.getImageData(0,0,sample.width,sample.height).data,colors=new Set();
  for(let i=0;i<rgba.length;i+=68)if(rgba[i+3])colors.add(rgba[i]+','+rgba[i+1]+','+rgba[i+2]);
  return colors.size;
 }
 try{
  frames.startupMs=await waitFor('Wilds startup',()=>!world.preparing);
  check('Local collision releases startup with the Worker still running',!world.preparing);
  const [eastX,eastY]=MOUNTAIN_ASCENT[4],eastRegion='region:surface:'+Math.floor(eastX/1600)+':'+Math.floor(eastY/1600);
  const eastFloor='floor:surface:512:'+Math.floor(eastX/512)+':';
  place(eastX,eastY);frame();
  const mountainKey='mountain:surface';
  check('First view queues the detailed mountain without waiting for a terrain bitmap',
   !stream.ready.has(mountainKey)&&(stream.active===mountainKey||stream.queue.has(mountainKey)));
  const fallbackColors=mountainSample(eastX,eastY-95,'mountain-coarse-fallback');
  check('The first mountain frame already paints a coarse land surface',fallbackColors>0);
  frames.mountainMs=await waitFor('Detailed mountain raster',()=>workerMessages.has(mountainKey)&&stream.ready.get(mountainKey) instanceof ImageBitmap);
  const mountain=stream.ready.get(mountainKey);
  check('The live Worker transfers the full mountain image',
   mountain.width===Math.ceil((MOUNTAIN_BOUNDS.right-MOUNTAIN_BOUNDS.left)/2)&&
   mountain.height===Math.ceil((MOUNTAIN_BOUNDS.bottom-MOUNTAIN_BOUNDS.top)/2));
  const detailedColors=mountainSample(eastX,eastY-95,'mountain-worker-detail');
  check('The detailed mountain replaces the fallback and adds native pixel detail',detailedColors>fallbackColors+10);
  frames.eastRegionMs=await waitFor('Eastern collision region',()=>workerMessages.has(eastRegion)&&streamRegion(world,eastX,eastY));
  frames.eastFloorMs=await waitFor('Eastern floor image',()=>[...workerMessages].some(key=>key?.startsWith(eastFloor)&&stream.ready.get(key) instanceof ImageBitmap));
  check('The Worker returns collision data and a native floor bitmap east of the previous boundary',true);
  frames.mapMs=await waitFor('Expanded map bitmap',()=>workerMessages.has('map')&&stream.ready.get('map') instanceof ImageBitmap);
  const map=stream.ready.get('map'),probe=document.createElement('canvas');probe.width=map.width;probe.height=map.height;
  const paint=probe.getContext('2d');paint.drawImage(map,0,0);
  const pixels=paint.getImageData(map.width*.87,map.height*.57,map.width*.10,map.height*.31).data;
  let land=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]===96&&pixels[i+1]===112&&pixels[i+2]===94)land++;
  check('The Worker produces a map bitmap with Greywake Mountain on the added east land',land>150);
  const [upX,upY,upZ]=MOUNTAIN_ASCENT[5];walk(upX,upY);
  check('Regular movement reaches the next switchback at the higher terrain elevation',Math.abs(player.trainGround-upZ)<5);
  capture('mountain-streamed');
  place(HOLLOW_GATE.x,HOLLOW_GATE.y-78);frame();walk(HOLLOW_GATE.x,HOLLOW_GATE.y-25);
  check('The authored cave entrance is reachable with the Worker enabled',trainPrompt(game,player).includes('ENTER SMUGGLERS'));
  game.update(.05,{keyboard:{interact:true}});game.update(.05,{keyboard:{}});
  check('The regular Interact input enters Smugglers’ Hollow',design.activeRoom===HOLLOW_ROOM&&Math.hypot(player.x-HOLLOW_ARRIVAL.x,player.y-HOLLOW_ARRIVAL.y)<25);
  const caveRegion='region:'+HOLLOW_ROOM+':'+Math.floor(player.x/1600)+':'+Math.floor(player.y/1600);
  frames.caveRegionMs=await waitFor('Hollow collision namespace',()=>workerMessages.has(caveRegion)&&streamRegion(world,player.x,player.y));
  walk(...HOLLOW_NAV[1]);walk(...HOLLOW_NAV[2]);
  check('The player walks the dry cavern path to the berth',wildLandsSurface(design,player.x,player.y)==='grass'&&!player.swimming);
  capture('hollow-streamed');
  walk(...HOLLOW_NAV[1]);walk(...HOLLOW_NAV[0]);walk(HOLLOW_EXIT.x,HOLLOW_EXIT.y);
  game.update(.05,{keyboard:{interact:true}});game.update(.05,{keyboard:{}});
  check('The regular Interact input exits to the mountain trail',!design.activeRoom&&Math.hypot(player.x-HOLLOW_GATE.x,player.y-HOLLOW_GATE.y)<40);
  walk(HOLLOW_GATE.x-75,HOLLOW_GATE.y-85);
  check('Ordinary surface movement continues after the cave exit',wildLandsSurface(design,player.x,player.y)==='grass'&&!player.swimming);
  assertHealthy();
  check('One Worker remained active with zero errors across both terrain layers',true);
  return {checks,pictures,frames,workerErrors,workerReplyCount:workerMessages.size};
 }catch(error){
  return {checks,pictures,frames,workerErrors,workerReplyCount:workerMessages.size,failure:error.message};
 }finally{canvas.remove();stopRailwayStream(world);}
}

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1120,height:750,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 const errors=[];
 window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await window.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await window.webContents.executeJavaScript(verifyWorker?`(${verifyStreamedHarbors})()`:`(async()=>{
   window.requestAnimationFrame=()=>0;
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {drawTrainTest}=await import('./src/train-world-art.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {trainInteraction,trainPrompt,trainWorldBlocked}=await import('./src/train-test.mjs');
   const {PIRATE_SHIP_LAYOUT,pirateShip,pirateShipPoint,syncPirateShipPlayer,movePirateShipPlayer,tickPirateShipPlayer}=await import('./src/pirate-ship.mjs');
   const {HOLLOW_ROOM,HOLLOW_GATE,HOLLOW_EXIT,HOLLOW_ARRIVAL,HOLLOW_NAV,MOUNTAIN_ASCENT,MOUNTAIN_CAVE_TRAIL,MOUNTAIN_DESCENTS,MOUNTAIN_SUMMIT,EAST_WILDS_WIDTH,mountainHeight}=await import('./src/wild-mountain-layout.mjs');
   const {wildLandsSurface}=await import('./src/wild-lands-world.mjs');
   const {stopRailwayStream}=await import('./src/railway-stream.mjs');
   const checks=[],pictures={},frames={};
   const check=(label,pass)=>{if(!pass)throw Error(label);checks.push(label);};
   const assets=wildboundPolishTest.assets,game=new Game(()=>.5,{deferWorld:true});
   game.addPlayer('keyboard','Harbor scout');game.start();game.spriteLibrary=assets.library;
   const NativeWorker=window.Worker;let entered;
   try{window.Worker=undefined;entered=enterWildLands(game);}finally{window.Worker=NativeWorker;}
   check('The Wild Lands launches with the expanded east boundary',entered.ok&&game.trainTest.design.width===EAST_WILDS_WIDTH);
   const player=game.players[0],world=game.trainTest,d=world.design;
   world.noticeUntil=0;world.preparing=false;world.streamDisabled=true;world.time=4;game.time=4;
   game.sky={...game.sky,mode:'day',time:0};
   const canvas=document.createElement('canvas');
   canvas.style.cssText='position:fixed;inset:0;width:1100px;height:720px';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets);
   const place=(x,y)=>Object.assign(player,{x,y,swimming:false,underBridge:false,trainGround:0});
   const capture=(name,camera)=>{
    renderer.trainScene=null;renderer.cameraOverride=camera||null;
    const began=performance.now();if(camera)drawTrainTest(renderer,game,0);else renderer.draw(game,0);const elapsed=performance.now()-began;
    const screen=renderer.ctx.getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();
    for(let i=0;i<screen.length;i+=216)colors.add(screen[i]+','+screen[i+1]+','+screen[i+2]);
    check(name+' draws a populated native frame',colors.size>120);
    frames[name]={elapsedMs:Math.round(elapsed),colors:colors.size,zoom:renderer.camera.zoom,costs:world.drawCosts};
    pictures[name]=canvas.toDataURL();
   };
   const checkPlank=(ship,label)=>{
    const plan=PIRATE_SHIP_LAYOUT.plank,edge=pirateShipPoint(ship,plan.x,plan.farY+15);
    place(edge.x,edge.y);
    check(label+' gangplank approaches from dry unblocked ground',wildLandsSurface(d,edge.x,edge.y)==='grass'&&!trainWorldBlocked(game,edge.x,edge.y,7,false,false,0,false,player));
    check(label+' displays its boarding prompt',trainPrompt(game,player).includes('BOARD'));
    trainInteraction(game,player);
    check(label+' boards through the regular interact action',player.pirateRide?.level==='plank');
    const walk=pirateShipPoint(ship,plan.x,plan.nearY-33);
    movePirateShipPlayer(game,player,walk.x-player.x,walk.y-player.y);
    check(label+' gangplank joins the main deck',player.pirateRide?.level==='deck'&&player.pirateVisualLift>20);
   };
   function walkRider(ship,x,y){
    const p=pirateShipPoint(ship,x,y);movePirateShipPlayer(game,player,p.x-player.x,p.y-player.y);
   }
   function standOnShip(ship,x,y){
    Object.assign(player.pirateRide,{x,y});syncPirateShipPlayer(game,player);
   }
   const exterior=pirateShip(game),plank=PIRATE_SHIP_LAYOUT.plank,shore=pirateShipPoint(exterior,plank.x,plank.farY+20);
   place(shore.x,shore.y);capture('offshore',{x:exterior.x,y:exterior.y-48,zoom:.78});capture('offshore-approach');
   checkPlank(exterior,'Offshore');capture('offshore-deck');
   const hatch=PIRATE_SHIP_LAYOUT.hatch;
   standOnShip(exterior,hatch.x,hatch.y+18);trainInteraction(game,player);
   check('The deck hatch opens the hold cutaway',player.pirateRide?.level==='hold');capture('offshore-hold');
   trainInteraction(game,player);check('The hold ladder returns to deck',player.pirateRide?.level==='deck');
   const mast=PIRATE_SHIP_LAYOUT.nests[1];standOnShip(exterior,mast.x,mast.ropeY+5);trainInteraction(game,player);
   for(let i=0;i<150&&player.pirateRide?.level==='rope';i++)tickPirateShipPlayer(game,player,{x:0,y:0},1/60,false);
   check('The main mast rope reaches the elevated crow’s nest',player.pirateRide?.level==='nest'&&player.pirateVisualLift>150);capture('offshore-nest');
   trainInteraction(game,player);for(let i=0;i<150&&player.pirateRide?.level==='rope';i++)tickPirateShipPlayer(game,player,{x:0,y:0},1/60,false);
   standOnShip(exterior,plank.x,plank.nearY-10);walkRider(exterior,plank.x,plank.farY+20);
   check('The offshore gangplank returns the actor to shore',!player.pirateRide);
   const alpine=MOUNTAIN_ASCENT[4];place(alpine[0],alpine[1]);
   game.update(.05,{keyboard:{}});
   const resident=game.enemies.find(e=>e.wildMountain&&Math.hypot(e.x-player.x,e.y-player.y)<150);
   const drawActor=renderer.animator.draw;
   let drawnY;
   renderer.animator.draw=function(ctx,actor,...args){
    if(resident&&actor.id===resident.id)drawnY=actor.y;
    return drawActor.call(this,ctx,actor,...args);
   };
   capture('mountain-alpine');
   renderer.animator.draw=drawActor;
   check('A native mountain monster draws at its elevated trail height',resident&&Math.abs(drawnY-(resident.y-mountainHeight(d,resident.x,resident.y)))<1);
   const summit=MOUNTAIN_ASCENT.at(-1);place(summit[0],summit[1]);
   check('The summit has projected ground and a walkable top',mountainHeight(d,player.x,player.y)>=460&&!trainWorldBlocked(game,player.x,player.y));
   const [crestX,crestY]=MOUNTAIN_SUMMIT[2];
   check('The visible northern crest ends at its collision edge',trainWorldBlocked(game,crestX,crestY-8)&&!trainWorldBlocked(game,crestX,crestY+15));
   capture('summit');
   const edge=MOUNTAIN_DESCENTS.find(link=>link.id==='snowline-ledge');
   place(...edge.launch);
   Object.assign(player,{jumpHeight:0,jumpVelocity:0,invuln:999});
   const dx=edge.landing[0]-edge.launch[0],dy=edge.landing[1]-edge.launch[1],distance=Math.hypot(dx,dy);
   game.update(.05,{keyboard:{x:dx/distance,y:dy/distance,jump:true}});
   check('Directional Jump at the upper ledge commits to the downhill crossing',player.mountainDescent?.id===edge.id);
   for(let i=0;i<8;i++)game.update(.05,{keyboard:{}});
   capture('mountain-descent');
   check('The camera keeps the airborne explorer in view',Math.abs(renderer.camera.y-(player.y-player.trainGround-player.jumpHeight))<8);
   for(let i=0;i<22&&player.mountainDescent;i++)game.update(.05,{keyboard:{}});
   check('The ledge lands the player on its lower trail',!player.mountainDescent&&player.jumpHeight===0&&Math.hypot(player.x-edge.landing[0],player.y-edge.landing[1])<6);
   game.update(.05,{keyboard:{x:-dx/distance,y:-dy/distance,jump:true}});
   check('The lower shelf has no reverse jump shortcut',!player.mountainDescent);
   game.update(.05,{keyboard:{}});
   Object.assign(player,{jumpHeight:0,jumpVelocity:0});
   world.wildLandsOverview=true;capture('wild-lands-overview');world.wildLandsOverview=false;
   const map=world.wildMap,colors=map.getContext('2d').getImageData(map.width*.87,map.height*.57,map.width*.10,map.height*.31).data;
   let mountainPixels=0;for(let i=0;i<colors.length;i+=4)if(colors[i]===96&&colors[i+1]===112&&colors[i+2]===94)mountainPixels++;
   check('The native minimap paints the new mountain beyond the old east boundary',mountainPixels>150);
   const approach=MOUNTAIN_CAVE_TRAIL.at(-1);place(approach[0],approach[1]);capture('mountain-entrance');
   check('The rock opening displays the Hollow entrance prompt',trainPrompt(game,player).includes('ENTER SMUGGLERS'));
   trainInteraction(game,player);
   check('The mountain entrance reaches the cavern safely',d.activeRoom===HOLLOW_ROOM&&player.x===HOLLOW_ARRIVAL.x&&player.y===HOLLOW_ARRIVAL.y);
   capture('hollow-arrival');
   const wreck=pirateShip(game);
   check('The cave selects its distinct weathered ship',wreck.id===HOLLOW_ROOM&&wreck!==exterior);
   capture('hollow-harbor',{x:wreck.x,y:wreck.y,zoom:.58});
   for(const [x,y]of HOLLOW_NAV)check('Hollow path is dry and clear at '+x+','+y,wildLandsSurface(d,x,y)==='grass'&&!trainWorldBlocked(game,x,y));
   checkPlank(wreck,'Cavern');capture('hollow-deck');
   standOnShip(wreck,hatch.x,hatch.y+18);trainInteraction(game,player);check('The wreck hold remains playable',player.pirateRide?.level==='hold');capture('hollow-hold');
   trainInteraction(game,player);standOnShip(wreck,plank.x,plank.nearY-10);walkRider(wreck,plank.x,plank.farY+20);
   place(HOLLOW_EXIT.x,HOLLOW_EXIT.y);trainInteraction(game,player);
   check('The cavern exit returns to the mountain path',!d.activeRoom&&Math.abs(player.x-HOLLOW_GATE.x)<35&&Math.abs(player.y-HOLLOW_GATE.y)<35);
   canvas.remove();stopRailwayStream(world);
   return {checks,pictures,frames};
  })()`);
  for(const [name,image] of Object.entries(result.pictures))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(image.split(',')[1],'base64'));
  const report={checks:result.checks,frames:result.frames,errors,workerErrors:result.workerErrors,workerReplyCount:result.workerReplyCount,failure:result.failure,muted:window.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));app.exit(errors.length||result.failure||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);app.exit(1);}
});
