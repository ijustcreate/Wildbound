const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output','wilds-alley-followup',process.env.WILDBOUND_FOLLOWUP_STAGE||'source');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-alley-followup-')));
app.commandLine.appendSwitch('mute-audio');
const timeout=setTimeout(()=>app.exit(2),110000);

app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:820,useContentSize:true,webPreferences:{backgroundThrottling:false}});
 w.webContents.setAudioMuted(true);
 const errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(base,'index.html'));
  await w.webContents.executeJavaScript('wildboundBoot.ready');
  const review=async()=>{
   window.requestAnimationFrame=()=>0;
   const {Assets}=await import('./src/assets.mjs'),{Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {BellglassScreenEffect}=await import('./src/bellglass-screen-effect.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs'),{interactAlley,alleyBlocked,OLLIVANDERS_PASSAGE}=await import('./src/diagon-alley.mjs');
   const {NOCTURNE_GRAVES,NIGHTGLASS_REAR_DOOR}=await import('./src/diagon-nocturne-rear.mjs');
   const {HOGSMEADE_BUILDINGS,HOGSMEADE_PROPS,hogsmeadeDoor}=await import('./src/hogsmeade-layout.mjs');
   const {trainInteraction}=await import('./src/train-test.mjs');
   const {ARENA_BAR_SERVICE,ARENA_ENTRANCES,ARENA_RING}=await import('./src/diagon-arena-layout.mjs');
   const {interactDiagonArena,arenaBarView}=await import('./src/diagon-arena.mjs');
   const {CHAMPION_DRINK}=await import('./src/arena-drink-state.mjs');
   const {npcDialogueView}=await import('./src/npc-quests.mjs');
   const {give}=await import('./src/items.mjs');
   const assets=new Assets();await assets.load();
   const g=new Game(()=>.01,{deferWorld:true});g.addPlayer('keyboard','Rory');g.addPlayer('pad:1','Oak');
   if(!enterWildLands(g,{persistent:true}).ok)throw Error('Wild Lands unavailable');
   const [p,guest]=g.players,t=g.trainTest;
   t.terrainStream?.worker.terminate();delete t.terrainStream;t.streamDisabled=true;t.preparing=false;
   t.noticeUntil=0;g.openingBoard=false;g.spriteLibrary=assets.library;g.enemies=[];g.onSound=()=>{};g.persist=()=>{};
   g.sky.elapsed=110;
   const canvas=document.createElement('canvas');
   canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:9999';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets),fx=new BellglassScreenEffect(),images={},checks=[];
   window.reviewStillShots=images;
   const check=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
   function paint(name,x,y,zoom,itsFx=false){
    renderer.cameraOverride={x,y,zoom};renderer.camera={x,y,zoom};renderer.trainScene=null;
    renderer.draw(g,.03,{sealCapture:true});
    if(itsFx)fx.draw(renderer.ctx,g);
    if(name)images[name]=canvas.toDataURL().split(',')[1];
   }
   function moveTo(x,y){Object.assign(p,{x,y,room:null,ui:null});Object.assign(guest,{x:x-31,y:y+20,room:null,ui:null});}
   t.design.activeRoom='diagon';
   const passage=OLLIVANDERS_PASSAGE;
   moveTo(passage.x+passage.w-36,passage.y+24);
   const start=p.x;
   for(let i=0;i<58;i++)g.moveActor(p,-6,0);
   check(p.x<start-310,'The paved lane passes straight below Ollivanders to the west side');
   paint('ollivanders-passage',7597,4270,2);
   moveTo(8195,5228);paint('nocturne-connector',8205,5209,2.4);
   moveTo(7935,5589);paint('diagon-portal-plaza',7990,5661,2.1);
   moveTo(8000,3858);p.coins=0;give(p.inventory,'dark_essence',5);interactAlley(g,p);
   check(npcDialogueView(g,p).npc.name==='Griphook'&&p.coins===0,'Griphook opens his own dialogue before any gold is exchanged');
   g.inventoryAction(p,'choice:0');check(p.coins===50,'Griphook exchanges 5 Dark Essence for 50 gold exactly once');
   paint('gringotts-counter',8000,3845,2.3);
   moveTo(9280,4933);paint('nocturne-curios-hearth',9262,4909,2.5);
   moveTo(9183,5274);paint('nocturne-facades-lighting',9270,5279,1.9);
   moveTo(NIGHTGLASS_REAR_DOOR.x-17,NIGHTGLASS_REAR_DOOR.y);
   check(interactAlley(g,p)&&!alleyBlocked(g,NIGHTGLASS_REAR_DOOR.x,NIGHTGLASS_REAR_DOOR.y),'Actual Interact opens the Nightglass rear door');
   moveTo(9451,5507);check(interactAlley(g,p)&&!alleyBlocked(g,9474,5507),'Actual Interact opens the separate cemetery gate');
   paint('nightglass-rear-cemetery',9493,5501,2.2);
   const grave=NOCTURNE_GRAVES[1];moveTo(grave.x,grave.y+29);p.faceX=0;p.faceY=-1;
   p.equipment.hand1='dagger';
   for(let i=0;i<7&&!g.enemies.some(e=>e.nocturneGraveGhost);i++)g.resolveMelee(p,0,{damage:1,arc:120,reach:1});
   check(g.enemies.some(e=>e.nocturneGraveGhost&&e.hp>0),'Real headstone strikes free a live, hostile ghost');
   paint('nocturne-ghost',9561,5506,2.8);
   moveTo(7429,3697);interactAlley(g,p);g.inventoryAction(p,'use');
   check(npcDialogueView(g,p).text.includes('first rule'),'Celia’s real dialogue offers the broken mirror clue');
   moveTo(ARENA_ENTRANCES['meridian-hall'].x,ARENA_ENTRANCES['meridian-hall'].y);interactAlley(g,p);
   moveTo(ARENA_BAR_SERVICE.x,ARENA_BAR_SERVICE.y);p.coins=120;interactDiagonArena(g,p);
   check(arenaBarView(g,p).choices.filter(c=>c.type).length===2,'Brindle sells two drinks before a ring winner unlocks the third');
   moveTo(ARENA_RING.x+ARENA_RING.w/2-15,ARENA_RING.y+ARENA_RING.h/2);
   Object.assign(guest,{x:p.x+15,y:p.y,hp:4,invuln:0});g.hurt(guest,120,p);
   moveTo(ARENA_BAR_SERVICE.x,ARENA_BAR_SERVICE.y);interactDiagonArena(g,p);
   check(arenaBarView(g,p).choices.find(choice=>choice.type===CHAMPION_DRINK),'An actual ring knockout permanently reveals Champion’s Draught');
   paint('lamplit-barkeep',8180,4691,2.2);
   delete t.design.activeRoom;g.enemies=[];g.effects=[];
   moveTo(7764,4187);paint('hogsmeade-exteriors',8310,4013,.61);
   check(HOGSMEADE_PROPS.length===43,'Hogsmeade ships with 43 individually placed props');
   for(const site of HOGSMEADE_BUILDINGS){
    const door=hogsmeadeDoor(site);moveTo(door.x,door.y+24);p.faceX=0;p.faceY=-1;
    paint(site.id+'-front',site.x,site.y-10,1.52);
    if(site.tone==='shack')for(let i=0;i<6;i++)g.resolveMelee(p,0,{damage:1,arc:120,reach:1});
    trainInteraction(g,p);moveTo(site.x,site.y+26);
    paint(site.id,site.x,site.y,2.45);
   }
   t.design.activeRoom='diagon';moveTo(9162,5250);g.time=5.2;t.noticeUntil=0;
   paint('mushroom-normal',9190,5219,1.7);
   p.field.bellglassMushroomRemaining=60;paint('mushroom-one',9190,5219,1.7,true);
   check(images['mushroom-normal']!==images['mushroom-one'],'One portion applies visible geometry and rainbow color changes');
   p.field.bellglassMushroomRemaining=180;
   for(let i=0;i<4;i++){g.time+=.033;paint(null,9190,5219,1.7,true);}
   paint('mushroom-three',9190,5219,1.7,true);
   check(images['mushroom-three']!==images['mushroom-one'],'Third portion compounds the palette and trails');
   const glError=fx.warp?.gl.getError();
   check(glError===0&&fx.hasHistory,'Actual WebGL shader compiles and retains luminous history: '+JSON.stringify({glError,hasHistory:fx.hasHistory,shaderError:fx.shaderError}));
   p.field.bellglassMushroomRemaining=0;g.time=5.2;paint('mushroom-expired',9190,5219,1.7,true);
   check(!fx.hasHistory,'Expired effect clears its previous-frame history');
   return {images,checks};
  };
  const result=await w.webContents.executeJavaScript('('+review.toString()+')()');
  if(errors.length)throw Error(errors.join('\n'));
  for(const [name,image] of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(image,'base64'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:result.checks,rendererErrors:errors,muted:w.webContents.isAudioMuted(),base},null,2));
  clearTimeout(timeout);app.exit(0);
 }catch(error){
  const pictures=await w.webContents.executeJavaScript('window.reviewStillShots||{}').catch(()=>({}));
  for(const [name,image] of Object.entries(pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(image,'base64'));
  fs.writeFileSync(path.join(out,'error.txt'),String(error.stack||error)+'\n'+errors.join('\n'));
  clearTimeout(timeout);app.exit(1);
 }
});
