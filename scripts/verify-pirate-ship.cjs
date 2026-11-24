const fs=require('node:fs');
const path=require('node:path');
const {app,BrowserWindow}=require('electron');
const root=path.resolve(__dirname,'..');
const target=process.env.WILDBOUND_VERIFY_APP;
const out=path.join(root,'test-output/pirate-ship',target?'packaged':'source');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>app.exit(1),180000);

app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
 const errors=[];
 w.webContents.setAudioMuted(true);
 w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await w.loadFile(path.join(target||root,'index.html'));
  await w.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   requestAnimationFrame=()=>0;Worker=undefined;
   const {Game}=await import('./src/core.mjs');
   const {Assets}=await import('./src/assets.mjs');
   const {Renderer}=await import('./src/render.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {drawTrainTest,trainPrompt}=await import('./src/train-test.mjs');
   const {PIRATE_CAVE_BERTH,PIRATE_SHIP_LAYOUT:layout,pirateShip,pirateShipLocal,pirateShipPoint,syncPirateShipPlayer}=await import('./src/pirate-ship.mjs');
   const {cameraSettings,saveCameraSettings}=await import('./src/multiplayer-camera.mjs');
   const {footstepMaterial}=await import('./src/audio.mjs');
   const {waterAt}=await import('./src/environment.mjs');
   const checks=[],images={},sounds=[];
   const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
   const assets=new Assets();await assets.load();
   const g=new Game(()=>.47);g.addPlayer('keyboard','Ship explorer');g.start();g.openingBoard=false;
   g.spriteLibrary=assets.library;g.onSound=name=>sounds.push(name);g.persist=()=>{};
   ok(enterWildLands(g,{persistent:true}).ok,'native Wild Lands session opens');
   const p=g.players[0],t=g.trainTest;t.preparing=false;t.noticeUntil=0;p.invincible=true;
   const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:1280px;height:850px';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=false;
   const step=input=>g.update(.05,{keyboard:input||{}});
   const interact=()=>{step({});step({interact:true});step({});};
   const rest=frames=>{for(let i=0;i<frames;i++)step({});};
   const place=(x,y)=>Object.assign(p,pirateShipPoint(pirateShip(g),x,y));
   const walk=(x,y)=>{
    const target=pirateShipPoint(pirateShip(g),x,y);
    for(let i=0;i<140;i++){
     const dx=target.x-p.x,dy=target.y-p.y,remaining=Math.hypot(dx,dy);
     if(remaining<5.8)return;
     const magnitude=Math.min(1,remaining/8);
     step({x:dx/remaining*magnitude,y:dy/remaining*magnitude});
    }
    throw Error('Unable to walk to '+x+','+y+' from '+JSON.stringify(pirateShipLocal(pirateShip(g),p))+' on '+(p.pirateRide?.level||'shore'));
   };
   const shot=(key,center,zoom)=>{
    renderer.cameraOverride={x:center.x,y:center.y,zoom};renderer.trainScene=null;
    drawTrainTest(renderer,g,.016);images[key]=canvas.toDataURL();renderer.cameraOverride=null;
   };
   const {plank,hatch,nests}=layout;
   let ship=pirateShip(g);
   const dry=(x,y)=>{const q=pirateShipPoint(ship,x,y);return waterAt(g,q.x,q.y)==='grass';};
   place(plank.x,plank.farY+27);step({});
   ok(dry(plank.x,plank.farY+6),'lowered gangplank ends on the island beach');
   ok(trainPrompt(g,p)==='E · BOARD PIRATE SHIP','standard keyboard cue at the lowered plank');
   shot('01-portal-island-ship',{x:ship.x,y:ship.y-26},.58);
   shot('01b-boarding',p,.95);
   walk(plank.x,plank.nearY-14);
   ok(p.pirateRide?.level==='deck'&&p.pirateRide.shipId===ship.id,'walking from shore crosses the plank onto main deck');
   ok(footstepMaterial(g,p)==='wood'&&!p.swimming,'deck is above water and uses wood steps');
   walk(plank.x,78);walk(hatch.x,55);
   ok(trainPrompt(g,p)==='E · GO BELOW DECK','stairs show a below-deck prompt');
   interact();
   ok(p.pirateRide?.level==='hold'&&p.pirateVisualLift<layout.deckZ,'Interact descends into the cutaway');
   const lift=p.pirateVisualLift;
   walk(hatch.x,0);walk(64,0);walk(64,42);
   ok(p.pirateRide.x>layout.hold.partitionX&&Math.abs(p.pirateVisualLift-lift)<8,'both below-deck rooms are connected by the doorway');
   shot('02-ship-hold',ship,1.23);
   walk(64,0);walk(hatch.x,0);walk(hatch.x,48);interact();
   ok(p.pirateRide?.level==='deck','same stairs return to main deck');
   walk(-136,48);walk(-136,-40);walk(-174,-40);
   for(const [i,nest]of nests.entries()){
    if(i===1){walk(-135,-30);walk(41,-30);walk(41,18);}
    if(i===2)walk(146,18);
    ok(trainPrompt(g,p)==='E · CLIMB ROPE','rope prompt at '+nest.id+' mast');
    interact();ok(p.pirateRide?.level==='rope','keyboard Interact starts climbing '+nest.id+' mast');
    rest(45);
    ok(p.pirateRide?.level==='nest'&&p.pirateRide.nest===nest.id&&p.pirateVisualLift>layout.deckZ+65,'arrives above the rigging in '+nest.id+' crow’s nest');
    shot('03-nest-'+nest.id,{x:p.x,y:p.y},1.05);
    interact();rest(45);
    ok(p.pirateRide?.level==='deck','climbs down from '+nest.id+' crow’s nest');
   }
   walk(135,19);walk(135,-57);walk(-93,-57);walk(-93,-76);
   ok(trainPrompt(g,p)==='E · FIRE CANNON','cannon control appears beside the gun');
   interact();const waterShot=ship.shots.find(s=>s.cannonId==='north-0');
   ok(waterShot&&sounds.includes('pirateCannon'),'Interact fires a projectile and cannon sound cue');
   shot('04-cannon-fire',pirateShipPoint(ship,-93,-80),1.32);
   interact();
   ok(ship.shots.length===1&&trainPrompt(g,p)==='E · CANNON RELOADING','reload blocks immediate repeat fire');
   rest(17);
   ok(waterShot.impactAge>=0&&waterShot.impactWater,'north gun reaches the channel and splashes');
   shot('05-cannon-splash',pirateShipPoint(ship,waterShot.x,waterShot.y+95),1.14);
   rest(30);ok(trainPrompt(g,p)==='E · FIRE CANNON','gun is ready again after reload');
   walk(-93,75);interact();const landShot=ship.shots.find(s=>s.cannonId==='south-0');
   rest(18);
   ok(landShot?.impactAge>=0&&landShot.impactWater===false,'south gun reaches the dry island and makes a land impact');
   walk(-93,57);walk(-220,60);walk(plank.x,plank.nearY+9);walk(plank.x,plank.farY+16);
   ok(!p.pirateRide&&!p.swimming&&dry(plank.x,plank.farY+16),'walking down the lowered plank returns to dry beach');
   t.design.activeRoom=PIRATE_CAVE_BERTH.id;t.previous.clear();ship=pirateShip(g);
   ok(ship.id===PIRATE_CAVE_BERTH.id&&ship.shots.length===0,'cave wreck has independent effects and reload state');
   place(plank.x,plank.farY+24);step({});
   ok(dry(plank.x,plank.farY+5)&&trainPrompt(g,p)==='E · BOARD PIRATE SHIP','cave shore connects to its lowered gangplank');
   shot('06-cave-wreck',{x:ship.x,y:ship.y-26},.58);
   interact();ok(p.pirateRide?.level==='plank','native keyboard also boards from the cave approach');
   walk(plank.x,78);walk(hatch.x,55);interact();
   ok(p.pirateRide?.level==='hold'&&p.pirateRide.shipId===ship.id,'cave wreck below-deck areas are accessible');
   shot('07-cave-hold',ship,1.15);
   const partner={...p,id:'ship-copilot',name:'Deck explorer',device:'pad:0',pirateRide:{...p.pirateRide,level:'deck',x:p.pirateRide.x+24}};
   g.players.push(partner);syncPirateShipPlayer(g,partner);
   for(let frame=0;frame<8;frame++)renderer.draw(g,.1);
   ok(renderer.splitViews?.length===2&&renderer.splitViews.every(view=>view.players.length===1),'nearby co-op explorers on different floors retain separate views');
   images['08-coop-ship-floors']=canvas.toDataURL();
   const settings=cameraSettings(),drawActor=renderer.animator.draw,seen=new Set();
   saveCameraSettings({...settings,enabled:false});
   renderer.animator.draw=function(ctx,actor,...args){seen.add(actor.id);return drawActor.call(this,ctx,actor,...args);};
   try{renderer.draw(g,.05);}finally{renderer.animator.draw=drawActor;saveCameraSettings(settings);}
   ok(seen.has(p.id)&&seen.has(partner.id),'both ship explorers render when the local camera uses a single view');
   return {checks,images};
  })()`);
  for(const [name,data] of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  if(errors.length)throw Error(errors.join('\n'));
  const report={passed:result.checks.length,checks:result.checks,muted:w.webContents.isAudioMuted(),errors};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  clearTimeout(deadline);app.exit(0);
 }catch(error){
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,errors},null,2));
  console.error(error);clearTimeout(deadline);app.exit(1);
 }
});
