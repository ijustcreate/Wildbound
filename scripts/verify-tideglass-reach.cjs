const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const stage=process.env.WILDBOUND_TIDEGLASS_STAGE||'source';
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-tideglass-')));
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
const deadline=setTimeout(()=>app.exit(2),115000);

async function verify(){
 await window.wildboundBoot.ready;
 const raf=requestAnimationFrame,WorkerType=window.Worker;
 requestAnimationFrame=()=>0;await new Promise(raf);window.Worker=undefined;
 const load=name=>import('./src/'+name+'.mjs');
 const [{Game},{Assets},{Renderer},{enterWildLands},{trainInteraction,trainPrompt},
  {TIDEGLASS_PATHS,TIDEGLASS_CAMP,TIDEGLASS_BEACON,TIDEGLASS_SIGNALS,TIDEGLASS_VAULT},
  {TIDEGLASS_SURVEYOR,tideglassBeaconLit},{npcDialogueView,npcDialogueAction},
  {wildLandsSurfaceAt},{snapshotWildLands,restoreWildLands},{ITEMS,gearStat},{stopRailwayStream}]=await Promise.all([
  'core','assets','render','wild-lands','train-test','tideglass-layout','tideglass-quest','npc-quests',
  'wild-lands-world','wild-lands-session','items','railway-stream',
 ].map(load));
 const results=[],images={},assert=(test,label)=>{if(!test)throw Error(label);results.push(label);};
 const assets=new Assets();await assets.load();
 const g=new Game(()=>.45);g.addPlayer('keyboard','Surveyor');
 g.start();g.spriteLibrary=assets.library;g.persist=()=>{};
 assert(enterWildLands(g,{persistent:true}).ok,'The new coast is reachable in the ordinary Wild Lands expedition');
 const t=g.trainTest,p=g.players[0];
 t.preparing=false;t.streamDisabled=true;t.noticeUntil=0;
 g.sky.elapsed=100;g.time=12;t.time=12;g.enemies=[];
 const canvas=document.createElement('canvas');
 canvas.style.cssText='width:1100px;height:760px;position:fixed;inset:0';
 document.body.append(canvas);
 const renderer=new Renderer(canvas,assets);
 const capture=(name,x,y,zoom=1.2)=>{
  renderer.trainScene=null;renderer.cameraOverride={x,y,zoom};
  renderer.draw(g,.02,{sealCapture:true});images[name]=canvas.toDataURL();
 };
 const go=(x,y)=>{
  const fromX=p.x,fromY=p.y,dx=x-fromX,dy=y-fromY,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/7));
  for(let i=0;i<n;i++)g.moveActor(p,dx/n,dy/n);
  if(Math.hypot(p.x-x,p.y-y)>9||wildLandsSurfaceAt(t.design,p.x,p.y)!=='grass'){
   throw Error(`Route blocked at ${p.x},${p.y}, from ${fromX},${fromY} to ${x},${y}`);
  }
 };
 Object.assign(p,{x:15020,y:4795,swimming:false,trainGround:0,jumpHeight:0});
 go(...TIDEGLASS_PATHS[0][1]);
 go(TIDEGLASS_SURVEYOR.x+15,TIDEGLASS_SURVEYOR.y+32);
 assert(trainPrompt(g,p).includes('MARA SOUNDING')&&trainInteraction(g,p),'Walked off the original mainland and greeted the surveyor through native Interact');
 assert(npcDialogueView(g,p).npc?.name==='Mara Sounding','Surveyor uses the normal NPC dialogue');
 npcDialogueAction(g,p,'use');
 assert(npcDialogueView(g,p).text.includes('Singing Stacks')&&npcDialogueView(g,p).text.includes('Drowned Orrery'),
  'Mara gives directions to all three puzzle sites');
 npcDialogueAction(g,p,'close');
 capture('saltwind-camp',TIDEGLASS_CAMP.x,TIDEGLASS_CAMP.y-25,1.25);
 go(...TIDEGLASS_PATHS[0][2]);go(...TIDEGLASS_PATHS[0][3]);go(...TIDEGLASS_PATHS[0][4]);
 for(const q of TIDEGLASS_PATHS[1].slice(1))go(...q);
 assert(trainPrompt(g,p).includes('SINGING STACKS')&&trainInteraction(g,p),'Eastern fork leads to the Singing Stacks signal');
 capture('singing-stacks',TIDEGLASS_SIGNALS[0].x+45,TIDEGLASS_SIGNALS[0].y-10,.98);
 for(const q of TIDEGLASS_PATHS[1].slice(0,-1).reverse())go(...q);
 for(const q of TIDEGLASS_PATHS[0].slice(5,9))go(...q);
 assert(trainPrompt(g,p).includes('DROWNED ORRERY')&&trainInteraction(g,p),'Western path takes the player around deep lagoon water to the Orrery signal');
 capture('drowned-orrery',TIDEGLASS_SIGNALS[1].x,TIDEGLASS_SIGNALS[1].y+75,.99);
 assert(wildLandsSurfaceAt(t.design,17048,3650)==='water','The central lagoon remains an actual water body');
 for(const q of TIDEGLASS_PATHS[0].slice(9,12))go(...q);
 for(const q of TIDEGLASS_PATHS[2].slice(1))go(...q);
 assert(trainPrompt(g,p).includes('WINDWARD ARCH')&&trainInteraction(g,p)&&tideglassBeaconLit(t),'Windward Arch completes the three-signal circuit');
 capture('windward-arch',TIDEGLASS_SIGNALS[2].x,TIDEGLASS_SIGNALS[2].y-25,1.24);
 for(const q of TIDEGLASS_PATHS[2].slice(0,-1).reverse())go(...q);
 for(const q of TIDEGLASS_PATHS[0].slice(12))go(...q);
 go(TIDEGLASS_VAULT.x,TIDEGLASS_VAULT.y+29);
 assert(trainPrompt(g,p).includes('LOCKBOX'),'Northern trail ends within reach of the real lockbox');
 assert(trainInteraction(g,p)&&p.inventory.some(i=>i?.type==='tideglass_lens'),'The completed circuit awards the unique Tideglass Lens');
 trainInteraction(g,p);
 assert(p.inventory.filter(i=>i?.type==='tideglass_lens').length===1,'The same explorer cannot claim another lens');
 assert(gearStat('sword',['tideglass_lens'],'maxMana')===12&&gearStat('sword',['tideglass_lens'],'manaRegen')===2&&ITEMS.tideglass_lens.trinket,
  'The lens bonuses use native socketed gear stats');
 const restored=restoreWildLands(JSON.parse(JSON.stringify(snapshotWildLands(t))));
 assert(tideglassBeaconLit(restored),'The three signals survive a saved expedition checkpoint');
 g.sky.elapsed=780;t.time+=.6;g.time+=.6;
 t.noticeUntil=0;
 capture('stormwatch-lit',TIDEGLASS_BEACON.x+20,TIDEGLASS_BEACON.y-48,1.04);
 t.wildLandsOverview=true;
 renderer.cameraOverride=null;renderer.trainScene=null;
 renderer.draw(g,.02,{sealCapture:true});images['tideglass-overview']=canvas.toDataURL();
 t.wildLandsOverview=false;
 stopRailwayStream(t);
 window.Worker=WorkerType;
 return {results,images,finalPosition:{x:p.x,y:p.y}};
}

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1120,height:780,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 const errors=[];
 window.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await window.loadFile(path.join(base,'index.html'));
  const result=await window.webContents.executeJavaScript(`(${verify.toString()})()`);
  const out=path.join(root,'test-output','tideglass-reach',stage);
  fs.mkdirSync(out,{recursive:true});
  for(const [key,value] of Object.entries(result.images))fs.writeFileSync(path.join(out,key+'.png'),Buffer.from(value.split(',')[1],'base64'));
  delete result.images;
  const report={...result,base,errors,muted:window.webContents.isAudioMuted()};
  console.log(JSON.stringify(report));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  if(errors.length||!report.muted)throw Error('Renderer error or missing mute');
 }catch(e){console.error(e,errors);process.exitCode=1;}
 finally{clearTimeout(deadline);window.destroy();app.exit(process.exitCode||0);}
});
