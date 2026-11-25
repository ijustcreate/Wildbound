const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output','live-edit',base===root?'source':'packaged');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-live-edit-'));
const editFile=path.join(profile,'live-edits-v1.json'),preload=path.join(profile,'qa-preload.cjs');
const store=require(path.join(base,'save-store.cjs'));
const hatProfile=['profile','live-edit-tester','hat'];
const legacyHatKey=JSON.stringify(hatProfile);
const legacyHat={x:2,y:-1,scale:1.05,rotation:3};
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',profile);
app.commandLine.appendSwitch('mute-audio');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
fs.writeFileSync(preload,`
 const {contextBridge,ipcRenderer}=require('electron');
 contextBridge.exposeInMainWorld('desktop',{
  onRoom:()=>{},loadProfiles:async()=>null,saveProfiles:async()=>true,
  loadSession:async()=>null,saveSession:async()=>true,
  loadLiveEdits:()=>ipcRenderer.invoke('live-edits-load'),
  saveLiveEdits:data=>ipcRenderer.invoke('live-edits-save',data)
 });
`);
ipcMain.handle('live-edits-load',()=>store.read(editFile,'liveEdits'));
ipcMain.handle('live-edits-save',(_event,data)=>store.write(editFile,data,'liveEdits'));
const timeout=setTimeout(()=>{console.error('Live Edit verification timed out.');app.exit(1);},160000);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1200,height:810,
  webPreferences:{offscreen:true,backgroundThrottling:false,preload}});
 win.webContents.setAudioMuted(true);
 const errors=[],checks=[];
 let stage='startup';
 const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
 const page=source=>win.webContents.executeJavaScript(source,true);
 const boot=async()=>{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await page('wildboundBoot.ready');
  await page(`(${prepareLiveEditGame})()`);
  win.webContents.focus();
 };
 const waitFor=async(source,ms=9000)=>{
  const until=Date.now()+ms;
  while(Date.now()<until){
   const value=await page(source);
   if(value)return value;
   await pause(90);
  }
  throw Error('Timed out waiting for '+source);
 };
 const gesture=async(from,to=from)=>{
  const input=(type,point)=>win.webContents.sendInputEvent({type,x:Math.round(point.x),y:Math.round(point.y),
   ...(type==='mouseMove'?{}:{button:'left',clickCount:1})});
  input('mouseMove',from);
  input('mouseDown',from);
  await pause(35);
  if(from!==to)input('mouseMove',to);
  await pause(60);
  input('mouseUp',to);
  await pause(80);
 };
 const key=async(code,action)=>{
  win.webContents.sendInputEvent({type:'keyDown',keyCode:code});
  try{return await action();}finally{win.webContents.sendInputEvent({type:'keyUp',keyCode:code});}
 };
 const clickWorld=async(x,y)=>gesture(await page(`liveEditQA.client(${x},${y})`));
 const clickControl=async selector=>gesture(await waitFor(`liveEditQA.controlPoint(${JSON.stringify(selector)})`));
 const preview=direction=>clickControl(`.live-edit-facings [data-facing="${direction}"]`);
 const capture=async name=>{
  win.webContents.invalidate();
  await pause(160);
  const picture=await win.webContents.capturePage();
  if(picture.isEmpty())throw Error('Could not capture '+name);
  fs.writeFileSync(path.join(out,name+'.png'),picture.toPNG());
 };
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await store.write(editFile,{version:1,scenes:{characters:{headwear:{[legacyHatKey]:legacyHat}}}},'liveEdits');
  await boot();
  stage='opening and moving the nonmodal editor';
  await waitFor('liveEditQA.ready()');
  await page("document.querySelector('.live-edit-toggle').click()");
  check(await page("!liveEditQA.panel.hidden&&!document.querySelector('dialog[open]')"),'Edit opens its nonmodal inspector while remaining in the game');
  const initialTime=await page('liveEditQA.game.time');
  await waitFor(`liveEditQA.game.time>${initialTime}`);
  checks.push('The expedition simulation keeps running while the editor is open');
  const header=await page("liveEditQA.center(liveEditQA.panel.querySelector('.live-edit-header'))");
  const oldPanel=await page('liveEditQA.panel.getBoundingClientRect().left');
  await gesture(header,{x:header.x-510,y:header.y+30});
  check(await page(`liveEditQA.panel.getBoundingClientRect().left<${oldPanel}-350`),'Dragging the panel header repositions the inspector');
  const moved=await page("liveEditQA.center(liveEditQA.panel.querySelector('.live-edit-header'))");
  await gesture(moved,{x:45,y:85});
  await page('liveEditQA.hold(true)');
  const heldTime=await page('liveEditQA.game.time');
  await pause(240);
  check(await page(`liveEditQA.game.time===${heldTime}`),'Hold simulation pauses the expedition without closing the editor');

  stage='painting and undoing terrain';
  await page("liveEditQA.choose('ground');liveEditQA.brush('stone')");
  const terrain=await page('liveEditQA.terrainFixture()');
  check(terrain.cells.length===2&&terrain.terrain==='grass','Found adjacent dry ground tiles in the native Wild Lands scene');
  const before=await page('liveEditQA.groundPixel()');
  await gesture(terrain.start,terrain.end);
  check(await page("liveEditQA.terrainBrushes().every(brush=>brush==='stone')"),'Native canvas dragging paints both cells with the selected texture');
  const after=await page('liveEditQA.groundPixel()');
  check(before.join(',')!==after.join(',')&&await page('liveEditQA.sameTerrainCollision()'),'The painted material renders immediately and preserves the dry ground physics');
  await page("liveEditQA.press('Undo')");
  check(await page('liveEditQA.terrainBrushes().every(brush=>brush===null)'),'Undo reverts both tiles as one stroke');
  await page("liveEditQA.press('Redo')");
  check(await page("liveEditQA.terrainBrushes().every(brush=>brush==='stone')"),'Redo restores the painted stroke');
  await capture('painted-terrain');

  stage='dragging a native Homestead furnishing';
  await page("liveEditQA.choose('props');liveEditQA.goToHomestead()");
  const furniture=await waitFor('liveEditQA.furnitureFixture()');
  await gesture(furniture.screen,furniture.end);
  const movedFurniture=await page(`liveEditQA.furnitureState(${JSON.stringify(furniture.id)})`);
  check(movedFurniture&&Math.abs(movedFurniture.x-furniture.x-42)<=2&&Math.abs(movedFurniture.y-furniture.y-22)<=2,
   'Dragging a rendered Homestead furnishing moves its actual layout geometry');
  check(await page(`liveEditQA.fieldValue('World X')===${movedFurniture.x}`),'The inspector stays selected on the furnishing after its canvas drag');
  await capture('homestead-furnishing');

  stage='selecting and moving a native tree';
  await page("liveEditQA.choose('trees');liveEditQA.goToTree()");
  const tree=await waitFor('liveEditQA.treeFixture()',30000);
  await gesture(tree.screen);
  check(await page(`liveEditQA.fieldValue('World X')===${tree.x}`),'A real mouse click selects the visible native tree');
  await page(`liveEditQA.setField('World X',${tree.destination})`);
  check(await page(`liveEditQA.treeState(${JSON.stringify(tree.id)},${tree.x},${tree.destination},${tree.collisionY})`),
   'Moving the tree updates its live placement and collision footprint');

  stage='fitting individual headwear facings in the compact inspector';
  win.setSize(1000,700);
  await waitFor('innerWidth<=1020&&innerHeight<=720');
  await page("liveEditQA.goToHatFixture();liveEditQA.choose('characters')");
  const explorer=await waitFor('liveEditQA.explorerClient()');
  await gesture(explorer);
  check(await page("liveEditQA.panel.querySelector('h3')?.textContent==='Live Edit Tester'"),'The Characters tab selects the rendered explorer');
  await gesture(await waitFor('liveEditQA.hatClient()'));
  const directions=await page('liveEditQA.facingControls()');
  check(directions.length===8&&new Set(directions.map(control=>control.direction)).size===8&&directions.every(control=>control.reachable),
   'Clicking the equipped hat reveals eight reachable facing controls at the minimum desktop size');
  check(await page("liveEditQA.hat().direction==='N'&&liveEditQA.actualDirection()==='N'&&liveEditQA.fieldValue('Offset X')===2&&liveEditQA.fieldValue('Angle')===3&&liveEditQA.hat().savedValues===null"),
   'The editor opens on the real current facing with the legacy fit inherited by North');
  const northBounds=await page('liveEditQA.hat().bounds');
  await page("liveEditQA.setField('Offset X',11)");
  await waitFor(`liveEditQA.hat().bounds.x>${northBounds.x+6}&&liveEditQA.paintedHat()?.fit?.x===11`);
  check(await page("liveEditQA.hat('N').values.x===11&&liveEditQA.hat('E').values.x===2"),
   'Editing North moves the displayed hat while East retains the inherited fit');
  await capture('headwear-north-compact');
  await preview('E');
  await waitFor("liveEditQA.paintedHat()?.direction==='E'&&liveEditQA.paintedHat().preview");
  check(await page("liveEditQA.actualDirection()==='N'&&liveEditQA.fieldValue('Offset X')===2&&liveEditQA.fieldValue('Angle')===3"),
   'East preview turns the rendered hat without changing the explorer’s gameplay facing');
  await page("liveEditQA.setField('Offset X',-12);liveEditQA.setField('Angle',22)");
  await waitFor("liveEditQA.paintedHat()?.direction==='E'&&liveEditQA.paintedHat().fit?.rotation===22");
  check(await page("liveEditQA.hat('N').values.x===11&&liveEditQA.hat('N').values.rotation===3&&liveEditQA.hat('E').values.x===-12&&liveEditQA.hat('E').values.rotation===22"),
   'North and East retain independent offsets and angles');
  check(await page("liveEditQA.facingControls().filter(control=>control.adjusted).map(control=>control.direction).sort().join(',')==='E,N'"),
   'The compass marks the two overridden facings');
  await capture('headwear-east-compact');
  await clickControl('.live-edit-reset-facing');
  check(await page("liveEditQA.hat('E').values.x===0&&liveEditQA.hat('E').values.rotation===0&&liveEditQA.hat('N').values.x===11&&liveEditQA.hat('NE').values.x===2"),
   'Reset facing restores native alignment only for the selected angle');
  await page("liveEditQA.press('Undo')");
  check(await page("liveEditQA.hat('E').values.x===-12&&liveEditQA.hat('E').values.rotation===22"),'Undo restores the East override');
  await page("liveEditQA.press('Redo')");
  check(await page("liveEditQA.hat('E').values.x===0&&liveEditQA.hat('N').values.x===11"),'Redo reapplies the East reset without editing North');
  await page("liveEditQA.press('Undo')");
  await clickControl('.live-edit-follow');
  await waitFor("liveEditQA.hat().direction==='N'&&liveEditQA.fieldValue('Offset X')===11");
  checks.push('Follow facing returns to the explorer’s actual North fit');
  await preview('NE');
  await waitFor("liveEditQA.paintedHat()?.direction==='NE'&&liveEditQA.paintedHat().fit?.x===2&&liveEditQA.fieldValue('Offset X')===2");
  await clickControl('.live-edit-toggle');
  await waitFor("liveEditQA.panel.hidden&&liveEditQA.paintedHat()?.direction==='N'&&!liveEditQA.paintedHat().preview&&liveEditQA.paintedHat().fit?.x===11");
  checks.push('Closing Live Edit clears the preview and restores the actual North view');
  await key('D',()=>waitFor("liveEditQA.actualDirection()==='E'&&liveEditQA.paintedHat()?.direction==='E'&&liveEditQA.paintedHat().fit?.x===-12"));
  await key('W',()=>waitFor("liveEditQA.actualDirection()==='N'&&liveEditQA.paintedHat()?.direction==='N'&&liveEditQA.paintedHat().fit?.x===11"));
  checks.push('Turning with normal keyboard movement applies the saved fit to the actual gameplay view');
  win.setSize(1200,810);
  await waitFor('innerWidth>=1180&&innerHeight>=790');
  await clickControl('.live-edit-toggle');
  await page('liveEditQA.hold(true)');

  stage='editing an actual Wild Lands spawn';
  const camp=await page("liveEditQA.choose('spawns');liveEditQA.goToCamp()");
  await waitFor('liveEditQA.campInView()');
  await clickWorld(camp.x,camp.y);
  check(await page("liveEditQA.fieldValue('Area radius')===80"),'The Spawns tab can select the authored Merlock area');
  await page(`liveEditQA.setField('World X',${camp.x+24});liveEditQA.setField('Area radius',100)`);
  check(await page(`liveEditQA.camp().x===${camp.x+24}&&liveEditQA.camp().radius===100`),'Moving and resizing the camp immediately updates its authorable spawn region');
  const post=await page('liveEditQA.post()');
  await clickWorld(post.x,post.y);
  check(await page("liveEditQA.panel.querySelector('h3')?.textContent.endsWith('spawn post 1')&&!liveEditQA.field('Area radius')"),
   'A separate click can select an individual spawn post within the camp');
  await page(`liveEditQA.setField('World X',${post.x+12});liveEditQA.clearCampPosts();liveEditQA.hold(false)`);
  await waitFor('liveEditQA.campActorAtPost()',30000);
  checks.push('A real future spawn uses the edited camp and post coordinates');
  await page('liveEditQA.hold(true)');
  await capture('spawn-camp');

  stage='checking performance and persistence';
  await page("liveEditQA.press('Performance')");
  await waitFor("document.querySelector('#performance-overlay')?.textContent.includes('FPS')");
  check(await page("document.querySelector('#performance-overlay').textContent.includes('enemies')"),'Performance turns on live frame and enemy diagnostics');
  await page("liveEditQA.press('Save')");
  await waitFor("liveEditQA.panel.querySelector('[role=status]').textContent==='Edits saved.'");
  const {scenes}=await store.read(editFile,'liveEdits');
  const records=scenes['wilds:outdoors'];
  check(Object.keys(records.terrain).length===2&&records.spawn[camp.id].radius===100&&records.placement[tree.id].x===tree.destination&&
   records.placement[furniture.id]?.x===movedFurniture.x&&records.placement[furniture.id]?.y===movedFurniture.y,
   'Save writes the authored ground, spawn, and placement records via isolated desktop IPC');
  const savedHat=scenes.characters.headwear;
  const keyFor=direction=>JSON.stringify([...hatProfile,direction]);
  check(savedHat[keyFor('N')]?.x===11&&savedHat[keyFor('E')]?.x===-12&&savedHat[keyFor('E')]?.rotation===22&&
   JSON.stringify(savedHat[legacyHatKey])===JSON.stringify(legacyHat)&&!Object.hasOwn(savedHat,keyFor('NE')),
   'Save writes two per-facing records and preserves the original fit for untouched angles');

  stage='reopening the same edits on a fresh game';
  await boot();
  await waitFor('liveEditQA.ready()');
  await waitFor(`liveEditQA.loadedEdits(${JSON.stringify({terrain:terrain.cells,camp:camp.id,post:post.id,spawnX:post.x+12,tree:tree.id,destination:tree.destination,furniture:{id:furniture.id,...movedFurniture}})})`);
  checks.push('A fresh application load reapplies the saved furnishing, terrain, tree, spawn and headwear edits');
  check(await page("liveEditQA.hat('N').values.x===11&&liveEditQA.hat('E').values.x===-12&&liveEditQA.hat('E').values.rotation===22&&liveEditQA.hat('NE').values.x===2&&liveEditQA.hat('NE').savedValues===null"),
   'After reopening, the two overrides and old fit fallback apply to their original directions');
  const report={passed:checks.length,checks,errors,muted:win.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  fs.rmSync(path.join(out,'failed-checks.json'),{force:true});
  console.log(JSON.stringify(report));
  app.exit(errors.length||!report.muted?1:0);
 }catch(error){
  const scene=await page('window.liveEditQA?.diagnostics()').catch(()=>null);
  fs.writeFileSync(path.join(out,'failed-checks.json'),JSON.stringify({stage,checks,error:error.message,errors,scene},null,2));
  console.error(stage,error.stack||error,errors);
  app.exit(1);
 }finally{
  clearTimeout(timeout);
 }
});

async function prepareLiveEditGame(){
 const {Game}=await import('./src/core.mjs');
 const {Renderer}=await import('./src/render.mjs');
 const {enterWildLands}=await import('./src/wild-lands.mjs');
 const {terrainCellAt}=await import('./src/live-edit-terrain.mjs');
 const {getSpawn}=await import('./src/live-edit-spawns.mjs');
 const {getPlacement,placementTargets}=await import('./src/live-edit-placement.mjs');
 const {headwearFor,headwearTargets}=await import('./src/live-edit-headwear.mjs');
 const {DIRECTIONS,facingIndex,playerHeadwearFacing}=await import('./src/player-motion.mjs');
 const {wildHomestead}=await import('./src/wild-homestead-layout.mjs');
 const {footprintHit}=await import('./src/world.mjs');
 const {WILD_HOMESTEAD}=await import('./src/overlook-maze-layout.mjs');
 const {waterAt}=await import('./src/environment.mjs');
 const tools=wildboundPolishTest,game=new Game(()=>.5);
 const hero=game.addPlayer('keyboard','Live Edit Tester');
 game.start();
 game.openingBoard=false;
 if(!enterWildLands(game,{persistent:true}).ok)throw Error('Could not enter the Wild Lands');
 hero.profileId='live-edit-tester';
 hero.equipment.head='hat';
 hero.invincible=true;
 Object.assign(hero,{x:6000,y:4770,faceX:0,faceY:-1});
 tools.game=game;
 tools.show('play');
 game.persist=()=>{};
 game.onSound=()=>{};
 game.spriteLibrary=tools.assets.library;
 const canvas=document.querySelector('#game-canvas');
 if(!tools.renderer)tools.renderer=new Renderer(canvas,tools.assets);
 const renderer=tools.renderer;
 let paintedHat;
 const drawActor=renderer.animator.drawActor;
 renderer.animator.drawActor=function(context,actor,time,size,lighting){
  if(actor.id===hero.id)paintedHat={direction:DIRECTIONS[playerHeadwearFacing(actor)],
   preview:actor.liveHeadwearPreviewView!=null,fit:actor.liveHeadwearFit};
  return drawActor.call(this,context,actor,time,size,lighting);
 };
 const panel=document.querySelector('#live-edit-inspector');
 const campId='merlock-camp:emberbank';
 let terrainStart,terrainEnd,terrainBefore;
 const location=()=>wildHomestead(game.trainTest.design);
 const center=element=>{const bounds=element.getBoundingClientRect();return {x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};};
 const client=(x,y)=>renderer.worldToClient({x,y});
 const hit=screen=>screen&&document.elementFromPoint(screen.x,screen.y)===canvas;
 const explorerId='player:'+hero.id;
 const hat=direction=>headwearFor(game,explorerId,direction);
 const field=label=>[...panel.querySelectorAll('.live-edit-numbers label')].find(row=>row.firstChild.textContent===label)?.querySelector('input');
 const controls={
  game,panel,client,center,field,
  ready:()=>{const button=document.querySelector('.live-edit-toggle');return button&&!button.hidden&&!button.disabled&&!game.trainTest.preparing;},
  choose:category=>panel.querySelector('[data-category="'+category+'"]').click(),
  hold:held=>{panel.querySelector('input[type=checkbox]').checked=held;},
  press:label=>[...panel.querySelectorAll('button')].find(button=>button.textContent===label).click(),
  fieldValue:label=>field(label)?.valueAsNumber,
  setField(label,value){const input=field(label);if(!input)throw Error('No field '+label);input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));},
  brush(id){const picker=panel.querySelector('select[aria-label="Ground material"]');picker.value=id;picker.dispatchEvent(new Event('change',{bubbles:true}));},
  terrainFixture(){
   terrainStart={x:6032,y:4816};terrainEnd={x:6064,y:4816};
   const cells=[terrainStart,terrainEnd].map(p=>terrainCellAt(game,p).id);
   terrainBefore=game.blocked(terrainStart.x,terrainStart.y,8);
   return {cells,start:client(terrainStart.x,terrainStart.y),end:client(terrainEnd.x,terrainEnd.y),terrain:waterAt(game,terrainStart.x,terrainStart.y)};
  },
  terrainBrushes:()=>[terrainStart,terrainEnd].map(p=>terrainCellAt(game,p)?.brush),
  sameTerrainCollision:()=>waterAt(game,terrainStart.x,terrainStart.y)==='grass'&&game.blocked(terrainStart.x,terrainStart.y,8)===terrainBefore,
  groundPixel(){
   const p=client(terrainStart.x,terrainStart.y),rect=canvas.getBoundingClientRect();
   const x=Math.floor((p.x-rect.x)*canvas.width/rect.width),y=Math.floor((p.y-rect.y)*canvas.height/rect.height);
   return [...renderer.ctx.getImageData(x,y,1,1).data];
  },
  goToHomestead(){
   const table=location().furniture.find(item=>item.kind==='table');
   Object.assign(hero,table?{x:table.x+table.w/2-30,y:table.y+table.h+25}:WILD_HOMESTEAD);
   renderer.trainScene=null;
  },
  goToTree(){
   const tree=location().trees[1];
   if(tree)Object.assign(hero,{x:tree.x-30,y:tree.y+55});
   renderer.trainScene=null;
  },
  furnitureFixture(){
   const home=wildHomestead(game.trainTest.design);
   for(const item of home.furniture.filter(asset=>['sofa','desk','table','chair'].includes(asset.kind))){
    const id=`furniture:homestead:${item.id}`,x=item.x+item.w/2,y=item.y+item.h/2;
    const screen=client(x,y),end=client(x+42,y+22);
    if(hit(screen)&&hit(end)&&placementTargets(game,{x,y},'props')[0]?.id===id){
     return {id,x:item.x,y:item.y,screen,end};
    }
   }
   return null;
  },
  furnitureState(id){
   const asset=wildHomestead(game.trainTest.design).furniture.find(item=>`furniture:homestead:${item.id}`===id);
   return asset?{x:asset.x,y:asset.y}:null;
  },
  treeFixture(){
   for(const prop of wildHomestead(game.trainTest.design).trees){
    const id='house-tree:homestead:'+prop.id,point={x:prop.x,y:(prop.rootY??prop.y)-25};
    if(placementTargets(game,point,'trees')[0]?.id!==id)continue;
    const screen=client(point.x,point.y);
    if(!hit(screen))continue;
    const rootY=prop.rootY??prop.y+prop.size*.35;
    return {id,x:prop.x,destination:prop.x-72,screen,collisionY:rootY-4};
   }
   return null;
  },
  treeState(id,oldX,newX,collisionY){
   const tree=wildHomestead(game.trainTest.design).trees.find(prop=>'house-tree:homestead:'+prop.id===id);
   return !!tree&&tree.x===newX&&footprintHit(tree,null,newX,collisionY,7)&&!footprintHit(tree,null,oldX,collisionY,7);
  },
  explorerClient(){
   const target=headwearTargets(game).find(subject=>subject.id===explorerId);
   if(!target||Math.hypot(target.x-hero.x,target.y-hero.y)>65)return null;
   const position=client(target.x,target.y);
   return hit(position)?position:null;
  },
  hatClient(){
   const bounds=hat()?.bounds;
   if(!bounds)return null;
   const position=client(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
   return hit(position)?position:null;
  },
  hat,
  paintedHat:()=>paintedHat,
  actualDirection:()=>DIRECTIONS[facingIndex(hero.faceX,hero.faceY)],
  controlPoint(selector){
   const element=document.querySelector(selector);
   if(!element||element.disabled)return null;
   const point=center(element);
   return element.contains(document.elementFromPoint(point.x,point.y))?point:null;
  },
  facingControls(){
   return [...panel.querySelectorAll('.live-edit-facings [data-facing]')].map(button=>({
    direction:button.dataset.facing,adjusted:button.dataset.adjusted==='true',
    reachable:!!controls.controlPoint(`[data-facing="${button.dataset.facing}"]`),
   }));
  },
  goToHatFixture(){
   Object.assign(hero,{x:6000,y:4770});
   renderer.trainScene=null;
  },
  camp:()=>getSpawn(game,campId),
  post:()=>getSpawn(game,campId+':0'),
  goToCamp(){
   const camp=getSpawn(game,campId);
   Object.assign(hero,{x:camp.x,y:camp.y-65});
   renderer.trainScene=null;
   return camp;
  },
  campInView(){
   const camp=getSpawn(game,campId),point=client(camp.x,camp.y);
   return document.elementFromPoint(point.x,point.y)===canvas;
  },
  clearCampPosts(){
   const camp=getSpawn(game,campId);
   Object.assign(hero,{x:camp.x-110,y:camp.y-68});
   renderer.trainScene=null;
  },
  campActorAtPost(){
   const post=getSpawn(game,campId+':0');
   return game.enemies.some(enemy=>enemy.wildSpawnKey===post.id&&enemy.homeX===post.x&&enemy.homeY===post.y);
  },
  diagnostics(){
   const inspect=({x,y})=>{const screen=client(x,y),element=screen&&document.elementFromPoint(screen.x,screen.y);return {x,y,screen,element:element?.id||element?.tagName};};
   return {hero:inspect(hero),camera:renderer.camera,room:hero.room,panel:panel.getBoundingClientRect().toJSON(),
    inspector:panel.querySelector('.live-edit-fields').textContent,hat:hat(),facing:controls.actualDirection(),paintedHat,
    camp:inspect(getSpawn(game,campId)),trees:location()?.trees.map(tree=>inspect(tree)),
    furniture:location()?.furniture.filter(item=>item.kind==='table').map(item=>({kind:item.kind,...inspect({x:item.x+item.w/2,y:item.y+item.h/2})})),
    preparation:game.trainTest.preparing,stream:game.trainTest.streamCoverage,visibleTrees:game.trainTest.visibleForest?.length};
  },
  loadedEdits(expect){
   const savedTerrain=[{x:6032,y:4816},{x:6064,y:4816}].map(point=>terrainCellAt(game,point));
   return savedTerrain.every((cell,index)=>cell?.id===expect.terrain[index]&&cell.brush==='stone')&&
    getSpawn(game,expect.camp).radius===100&&getSpawn(game,expect.post).x===expect.spawnX&&
    getPlacement(game,expect.tree)?.x===expect.destination&&hat('N').values.x===11&&
    getPlacement(game,expect.furniture.id)?.x===expect.furniture.x&&getPlacement(game,expect.furniture.id)?.y===expect.furniture.y;
  },
 };
 window.liveEditQA=controls;
}
