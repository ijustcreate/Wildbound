const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const result=spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],
  {cwd:root,env,encoding:'utf8',timeout:120000});
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 if(result.error)console.error(result.error);
 process.exit(result.status??1);
}

const {app,BrowserWindow}=require('electron');
const source=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output/quidditch-merchandise',source===root?'source':'packaged');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const deadline=setTimeout(()=>app.exit(1),115000);

async function verifyInRenderer(){
 window.requestAnimationFrame=()=>0;
 window.Worker=undefined;
 const {Game}=await import('./src/core.mjs');
 const {GameAudio}=await import('./src/audio.mjs');
 const {DIAGON_AMBIENCE,DIAGON_FOLEY}=await import('./src/diagon-alley-audio.mjs');
 const {enterWildLands}=await import('./src/wild-lands.mjs');
 const {ALLEY_SHOPS,interactAlley}=await import('./src/diagon-alley.mjs');
 const {Assets}=await import('./src/assets.mjs');
 const {Renderer}=await import('./src/render.mjs');
 const {HeroUI}=await import('./src/hero-ui.mjs');
 const {FLOURISH_SPELLBOOK_STOCK}=await import('./src/wizarding-shop-goods.mjs');
 const {merchantRows}=await import('./src/traveling-merchant.mjs');
 const {ITEMS}=await import('./src/items.mjs');
 const {useBroom}=await import('./src/broom-mount.mjs');
 const {directionVector,drawPlayer}=await import('./src/player-motion.mjs');
 const checks=[],images={};
 const check=(condition,message)=>{
  if(!condition)throw Error(message);
  checks.push(message);
 };
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const g=new Game(()=>.5),original=g.addPlayer('keyboard','Shop Visitor');
 g.start();g.openingBoard=false;g.persist=()=>{};original.coins=1250;
 check(enterWildLands(g).ok,'The desktop world enters the Wild Lands');
 g.trainTest.preparing=false;g.trainTest.design.activeRoom='diagon';
 const p=g.players[0],assets=new Assets();
 await assets.load();
 g.spriteLibrary=assets.library;
 const stage=document.createElement('div');
 stage.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#142a25';
 const canvas=document.createElement('canvas');
 canvas.style.cssText='display:block;width:100%;height:100%';
 const originalOverlay=document.getElementById('hero-overlays');
 if(originalOverlay)originalOverlay.id='inactive-hero-overlays';
 const overlay=document.createElement('div');
 overlay.id='hero-overlays';
 stage.append(canvas,overlay);document.body.append(stage);
 const renderer=new Renderer(canvas,assets);
 const heroUi=new HeroUI(overlay);
 renderer.dynamicShadows=false;
 window.showMerchandise=(id,type,width)=>{
  g.trainTest.design.activeRoom='diagon';
  const shop=ALLEY_SHOPS.find(shop=>shop.id===id);
  Object.assign(p,{x:shop.x-105,y:shop.y+12,ui:null});
  if(!interactAlley(g,p)||p.ui.alleyShop!==id)throw Error('Could not open '+id);
  const row=merchantRows(g,p).find(row=>row.item.type===type);
  p.ui.index=row.index;
  renderer.trainScene=null;renderer.draw(g,.016);heroUi.draw(g,renderer);
  const panel=overlay.querySelector('.merchant-session');
  const rect=panel?.getBoundingClientRect();
  if(!rect||rect.width<=0||rect.height<=0)throw Error('Could not render '+id);
  if(width&&(rect.left<0||rect.right>width))throw Error('Stock panel overflows its window');
  return panel;
 };
 const books=window.showMerchandise('flourish','alley_efficient_casting');
 check(FLOURISH_SPELLBOOK_STOCK.every(([type])=>books.textContent.includes(ITEMS[type].name))&&
  books.textContent.includes('Standard Book of Spells')&&books.textContent.includes('14%'),
 'Flourish shows all five books and the selected casting bonus');
 const broomShop=window.showMerchandise('quidditch','firebolt');
 check(broomShop.textContent.includes('Firebolt')&&broomShop.textContent.includes('360')&&broomShop.textContent.includes('Nimbus 2000'),
  'Quality Quidditch Supplies shows the Firebolt price alongside Nimbus 2000');
 broomShop.querySelector('.merchant-confirm').click();
 const slot=p.inventory.findIndex(item=>item?.type==='firebolt');
 check(slot>=0&&useBroom(g,p,slot),'The Firebolt purchase can be mounted in the desktop game');

 const sheet=document.createElement('canvas');
 sheet.width=320;sheet.height=176;
 const c=sheet.getContext('2d');
 c.imageSmoothingEnabled=false;c.fillStyle='#2c4641';c.fillRect(0,0,sheet.width,sheet.height);
 for(let d=0;d<8;d++){
  const [faceX,faceY]=directionVector(d);
  c.save();c.translate(d%4*80+40,Math.floor(d/4)*88+64);
  drawPlayer(c,{...p,faceX,faceY},0);
  c.restore();
 }
 const enlarged=document.createElement('canvas');
 enlarged.width=sheet.width*3;enlarged.height=sheet.height*3;
 const enlargedContext=enlarged.getContext('2d');enlargedContext.imageSmoothingEnabled=false;
 enlargedContext.drawImage(sheet,0,0,enlarged.width,enlarged.height);
 images.firebolt=enlarged.toDataURL();

 const a=new GameAudio();
 a.unlock();
 await a.ctx.resume();
 const analyzer=a.ctx.createAnalyser();
 a.buses.ambience.connect(analyzer);
 a.ambient=()=>{};
 p.ui=null;
 const place=(x,y)=>Object.assign(p,{x,y});
 place(8024,4190);a.update(g,true);
 const fountain=a.worldLoops.get('diagon-fountain');
 check(fountain?.source.loop&&fountain.source.buffer.duration===5,'The fountain starts the continuous cascade in native Web Audio');
 const values=new Float32Array(analyzer.fftSize);
 let rms=0;
 for(let i=0;i<20;i++){
  await sleep(150);
  analyzer.getFloatTimeDomainData(values);
  rms=Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/values.length);
  if(rms>.001&&fountain.pan.pan.value<0)break;
 }
 check(rms>.001&&fountain.pan.pan.value<0,'The muted desktop audio graph produces local water panned toward the fountain');
 place(8015,4420);a.update(g,true);
 await sleep(750);
 check(fountain.gain.gain.value<.085,'Fountain volume falls with physical distance');
 const bank=ALLEY_SHOPS.find(shop=>shop.id==='gringotts');
 place(bank.x,bank.y);a.update(g,true);
 check(!!fountain.retireAt,'Fountain sound fades out inside Gringotts');

 const kettle=DIAGON_AMBIENCE.find(source=>source.key==='diagon-cart');
 place(kettle.x+15,kettle.y);
 await sleep(360);a.update(g,true);
 check(a.worldLoops.has('diagon-cart'),'Street kettle steam starts at the kettle prop');
 const kettleFoley=DIAGON_FOLEY.find(source=>source.cue==='alleyKettle');
 a.alleyCueAt.set(kettleFoley,0);
 a.update(g,true);
 await sleep(320);
 check([...a.cache.keys()].some(name=>name.includes('metalPot')),'Nearby kettle foley decodes an actual recorded pot sample');

 g.trainTest.design.activeRoom='quidditch';
 a.update(g,true);
 check(a.alleyListeners.length===0&&a.alleyCueAt.size===0&&
  [...a.worldLoops.values()].every(loop=>loop.retireAt>0),'Leaving the alley clears foley and fades every old world loop');
 await a.ctx.close();
 return {checks,images,fountainRms:rms};
}

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1180,height:810,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 window.webContents.on('console-message',event=>{
  if(event.level==='error')console.error(event.sourceId+':'+event.lineNumber,event.message);
 });
 try{
  await window.loadFile(path.join(source,'index.html'));
  await window.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await window.webContents.executeJavaScript('('+verifyInRenderer.toString()+')().catch(error=>({error:error.stack}))',true);
  if(result.error)throw Error(result.error);
  for(const [name,uri]of Object.entries(result.images)){
   fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(uri.split(',')[1],'base64'));
  }
  await window.webContents.executeJavaScript("showMerchandise('flourish','alley_efficient_casting',innerWidth)");
  await new Promise(resolve=>setTimeout(resolve,150));
  fs.writeFileSync(path.join(out,'flourish.png'),(await window.webContents.capturePage()).toPNG());
  await window.webContents.executeJavaScript("showMerchandise('quidditch','firebolt',innerWidth)");
  await new Promise(resolve=>setTimeout(resolve,150));
  fs.writeFileSync(path.join(out,'quidditch-shop.png'),(await window.webContents.capturePage()).toPNG());
  window.setContentSize(640,470);
  await window.webContents.executeJavaScript("showMerchandise('flourish','alley_battle_charms',innerWidth)");
  result.checks.push('Flourish stock fits a 640px desktop window');
  const report={passed:result.checks.length,checks:result.checks,fountainRms:result.fountainRms,muted:window.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
