const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {app,BrowserWindow}=require('electron');
const target=process.env.WILDBOUND_VERIFY_APP;
const out=path.join(root,'test-output/diagon-residents',target?'packaged':'source');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.commandLine.appendSwitch('mute-audio');
const watchdog=setTimeout(()=>app.exit(1),90000);

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
 const errors=[];
 window.webContents.setAudioMuted(true);
 window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await window.loadFile(path.join(target||root,'index.html'));
  await window.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await window.webContents.executeJavaScript(`(async()=>{
   requestAnimationFrame=()=>0;
   Worker=undefined;
   const {Game}=await import('./src/core.mjs');
   const {Assets}=await import('./src/assets.mjs');
   const {Renderer}=await import('./src/render.mjs');
   const {HeroUI}=await import('./src/hero-ui.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {alleyBlocked,alleyPrompt,tickAlley}=await import('./src/diagon-alley.mjs');
   const {ALLEY_RESIDENTS}=await import('./src/diagon-resident-schedules.mjs');
   const {GARDEN_RESIDENTS}=await import('./src/diagon-garden-residents.mjs');
   const {alleyResidentsFor}=await import('./src/diagon-residents.mjs');
   const checks=[],images={},ok=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
   const assets=new Assets();await assets.load();
   const g=new Game(()=>.5);g.addPlayer('keyboard','Alley visitor');g.start();g.openingBoard=false;
   g.spriteLibrary=assets.library;g.onSound=()=>{};g.persist=()=>{};
   ok(enterWildLands(g).ok,'enters Wild Lands');
   const t=g.trainTest,p=g.players[0];
   t.preparing=false;t.design.activeRoom='diagon';t.time=12;g.sky.elapsed=0;
   Object.assign(p,{x:8000,y:5520});tickAlley(g,0);
   const world=document.createElement('div');world.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#233432';
   const canvas=document.createElement('canvas');canvas.style.cssText='display:block;width:100%;height:100%';
   const uiRoot=document.createElement('div');uiRoot.id='resident-verification-ui';uiRoot.style.cssText='position:absolute;inset:0;pointer-events:none';
   world.append(canvas,uiRoot);document.body.append(world);
   const r=new Renderer(canvas,assets),ui=new HeroUI(uiRoot);r.dynamicShadows=false;
   const draw=()=>{r.draw(g,.016);ui.draw(g,r);};
   const tick=input=>g.update(.05,{keyboard:input});
   const conversations=[...ALLEY_RESIDENTS,...GARDEN_RESIDENTS.filter(a=>a.topic)];
   ok(t.gardenVisitors.length===4,'garden has four named resident actors');
   ok(new Set(alleyResidentsFor(g).map(a=>a.name)).size===alleyResidentsFor(g).length,'garden and avenue use one actor per named resident');
   for(const resident of conversations){
    const actor=alleyResidentsFor(g).find(a=>a.residentId===resident.id);
    const expected='TALK TO '+resident.name.toUpperCase();
    const approaches=[[0,26],[0,-26],[-25,0],[25,0],[-22,-16],[22,16],[0,0]];
    const spot=approaches.map(([dx,dy])=>({x:actor.x+dx,y:actor.y+dy})).find(point=>
     !alleyBlocked(g,point.x,point.y)&&alleyPrompt(g,{...p,...point})===expected);
    if(!spot)throw Error('Missing public approach to '+resident.name);
    Object.assign(p,spot);t.previous.clear();tick({interact:true});
    ok(p.ui?.alleyResident===actor.id,'native Interact opens dialogue with '+resident.name);
    if(resident.id==='tamsin'){
     t.noticeUntil=0;r.trainScene=null;draw();
     ok(uiRoot.querySelector('.npc-dialogue h2')?.textContent===resident.name,'native panel shows the resident name');
     ok(uiRoot.querySelector('.npc-dialogue-text')?.textContent===resident.greeting,'native panel shows personal greeting');
     const portrait=uiRoot.querySelector('.npc-dialogue-portrait');
     ok(portrait?.getContext('2d').getImageData(0,0,portrait.width,portrait.height).data.some((value,i)=>i%4===3&&value>0),'native conversation portrait renders');
     tick({});tick({interact:true});draw();
     ok(uiRoot.querySelector('.npc-dialogue-text')?.textContent===resident.story,'native Interact picks the selected story');
     uiRoot.querySelector('[data-index="0"]').click();draw();
     uiRoot.querySelector('[data-index="1"]').click();draw();
     ok(uiRoot.querySelector('.npc-dialogue-text')?.textContent.includes('the fountain'),'native reply reports the next stop');
    }
    if(resident.topic){
     t.noticeUntil=0;r.trainScene=null;draw();
     uiRoot.querySelector('[data-index="2"]').click();draw();
     ok(uiRoot.querySelector('.npc-dialogue-text')?.textContent===resident.topic.text,'native topic opens for '+resident.name);
     uiRoot.querySelector('[data-index="1"]').click();draw();
     ok(uiRoot.querySelector('.npc-dialogue-text')?.textContent===resident.topic.replies[1].text,'native reply differs for '+resident.name);
     if(actor.gardenResident){
      uiRoot.querySelector('[data-index="0"]').click();draw();
      uiRoot.querySelector('[data-index="0"]').click();draw();
      ok(uiRoot.querySelector('.npc-dialogue-text')?.textContent===resident.topic.replies[0].text,'native alternate reply works for '+resident.name);
      if(resident.topic.replies[0].reward){
       ok(p.inventory.some(i=>i?.type===resident.topic.replies[0].reward),'native backpack receives the sample from '+resident.name);
      }
      if(resident.id==='hermione')images.gardenConversation=canvas.toDataURL();
     }
    }
    tick({});tick({close:true});
    if(p.ui)throw Error('Native close failed for '+resident.name);
   }
   const board=document.createElement('canvas');board.width=1040;board.height=80+Math.ceil(ALLEY_RESIDENTS.length/5)*208;
   const ink=board.getContext('2d');ink.fillStyle='#263634';ink.fillRect(0,0,board.width,board.height);
   ink.fillStyle='#efdcaa';ink.textAlign='center';ink.font='600 25px Georgia';ink.fillText('Diagon Alley residents',520,38);
   for(const [i,actor] of t.alleyVisitors.entries()){
    const x=104+(i%5)*208,y=225+Math.floor(i/5)*208;
    ink.fillStyle='#314440';ink.fillRect(x-89,y-159,178,192);
    r.animator.draw(ink,{...actor,x,y:y-13,faceX:i%2?-.35:.35,faceY:1,animationAction:'idle'},1.5,151);
    ink.fillStyle='#efdcaa';ink.font='600 16px Georgia';ink.fillText(actor.name,x,y+19);
   }
   images.cast=board.toDataURL();
   const gardenBoard=document.createElement('canvas');gardenBoard.width=780;gardenBoard.height=218;
   const gardenInk=gardenBoard.getContext('2d');gardenInk.fillStyle='#243833';gardenInk.fillRect(0,0,gardenBoard.width,gardenBoard.height);
   gardenInk.imageSmoothingEnabled=false;gardenInk.textAlign='center';
   for(const [i,actor] of t.gardenVisitors.entries()){
    const x=97+(i%5)*195,y=174+Math.floor(i/5)*215;
    gardenInk.fillStyle='#364d43';gardenInk.fillRect(x-87,y-156,174,187);
    for(const facing of [-1,1])r.animator.draw(gardenInk,{...actor,x:x+facing*35,y:y-12,faceX:facing*.55,faceY:1,animationAction:'idle'},1.5,113);
    gardenInk.fillStyle='#efdcaa';gardenInk.font='600 16px Georgia';gardenInk.fillText(actor.name,x,y+19);
   }
   images.gardenCast=gardenBoard.toDataURL();
   const inScene=(actor,name)=>{
    Object.assign(p,{x:actor.x+48,y:actor.y+47});r.trainScene=null;draw();images[name]=canvas.toDataURL();
   };
   for(const [id,name,at,action] of [
    ['neville','neville-tending',17.7,'pickup'],['sprout','sprout-tending',16.35,'pickup'],
    ['luna','luna-pool-watch',20.6,'interact'],['hermione','hermione-studying',22,'carry'],
   ]){
    t.time=at;g.time=at;tickAlley(g,0);
    const actor=t.gardenVisitors.find(a=>a.residentId===id);
    ok(actor.animationAction===action,'native '+action+' plays for '+actor.name);
    inScene(actor,name);
   }
   const reader=t.gardenVisitors.find(a=>a.residentId==='hermione');
   g.sky.elapsed=240;
   for(let i=0;i<20;i++){t.time+=.05;tickAlley(g,.05);}
   ok(reader.moving&&reader.targetPlace==='flourishStudy','Hermione walks through the garden gate to the bookshop');
   inScene(reader,'hermione-garden-walk');
   for(let i=0;i<90&&reader.place!=='flourishStudy';i++){t.time+=.5;tickAlley(g,.5);}
   ok(reader.place==='flourishStudy'&&reader.interactionArt==='openBook','Hermione arrives at Flourish & Blotts and resumes reading');
   inScene(reader,'hermione-bookshop');
   g.sky.elapsed=0;t.alleyVisitors=null;tickAlley(g,0);
   g.sky.elapsed=120;
   for(let i=0;i<20;i++){t.time+=.05;tickAlley(g,.05);}
   const walker=t.alleyVisitors.find(a=>a.residentId==='juniper');
   ok(walker.moving&&walker.movementGait==='walk','resident moves with native walking pose in Nocturne');
   Object.assign(p,{x:walker.x+48,y:walker.y+60});r.trainScene=null;draw();images.nocturne=canvas.toDataURL();
   g.sky.elapsed=0;t.alleyVisitors=null;t.time+=40;tickAlley(g,0);
   const speaker=t.alleyVisitors[0];Object.assign(p,{x:speaker.x,y:speaker.y+25});r.trainScene=null;draw();images.avenue=canvas.toDataURL();
   t.previous.clear();tick({interact:true});draw();
   ok(p.ui?.alleyResident===speaker.id,'resident dialogue is ready for the desktop visual check');
   window.drawResidentVerification=draw;
   return {checks,images};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  window.showInactive();
  const capture=async size=>{
   await window.webContents.executeJavaScript('drawResidentVerification()');
   await new Promise(resolve=>setTimeout(resolve,250));
   const fits=await window.webContents.executeJavaScript(`(()=>{
    const panel=document.querySelector('#resident-verification-ui .npc-dialogue-session');
    const rect=panel?.getBoundingClientRect();
    const choice=panel?.querySelector('[data-index="2"]')?.getBoundingClientRect();
    return rect&&choice&&rect.width>0&&rect.left>=-1&&rect.top>=-1&&rect.right<=innerWidth+1&&
      rect.bottom<=innerHeight+1&&choice.bottom<=rect.bottom;
   })()`);
   if(!fits)throw Error('Dialogue is not fully in the '+size+' viewport');
   fs.writeFileSync(path.join(out,size+'.png'),(await window.webContents.capturePage()).toPNG());
   result.checks.push('native resident conversation fits '+size+' viewport');
  };
  await capture('desktop');
  window.setContentSize(640,480);
  await new Promise(resolve=>setTimeout(resolve,100));
  await capture('small');
  if(errors.length)throw Error(errors.join('\n'));
  const report={passed:result.checks.length,checks:result.checks,errors,muted:window.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  clearTimeout(watchdog);app.exit(0);
 }catch(error){
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,errors},null,2));
  console.error(error);clearTimeout(watchdog);app.exit(1);
 }
});
