const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','realms');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1400,height:1000,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message);});
 await win.loadFile(path.join(base,'index.html'));
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {Game,EVENTS}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
  const {drawRealmGround,drawRealmProp,drawRealmAtmosphere}=await import('./src/realm-art.mjs'),{drawRealmLife}=await import('./src/realm-life.mjs'),{RealmEditor}=await import('./src/realm-editor.mjs');
  const assets=new Assets();await assets.load();const images={},checks=[];
  for(const env of ['swamp','caverns','shadow']){
   const g=new Game(()=>.5);g.environment=env;g.seed=42;g.spriteLibrary=assets.library;g.addPlayer('keyboard');g.start();g.bloom=3;
   for(let i=0;i<100;i++)g.update(.016);g.bloom=3;g.openingBoard=false;
   const cv=document.createElement('canvas');cv.width=1100;cv.height=1100;const c=cv.getContext('2d');c.scale(1100/1600,1100/1600);drawRealmGround(c,g);drawRealmLife(c,g);for(const p of [...g.scenery].sort((a,b)=>a.rootY-b.rootY))drawRealmProp(c,p,g.time,g);drawRealmLife(c,g,'air');drawRealmAtmosphere(c,g);images[env+'-overview']=cv.toDataURL().split(',')[1];
   const runtime=document.createElement('canvas');runtime.width=1280;runtime.height=900;Object.defineProperty(runtime,'clientWidth',{value:1280});Object.defineProperty(runtime,'clientHeight',{value:900});document.body.append(runtime);const renderer=new Renderer(runtime,assets);Object.assign(g.players[0],{x:370,y:445});Object.assign(renderer.camera,{x:370,y:420,zoom:1.7});renderer.draw(g,0);images[env+'-gameplay']=runtime.toDataURL().split(',')[1];runtime.remove();
   for(const event of EVENTS.filter(e=>e.environment===env)){g.spawnEvent(EVENTS.indexOf(event));if(!event.type&&g.eventSpawnCount!==event.count)throw Error(event.name+' did not spawn its roster');for(let i=0;i<20;i++)g.update(.016);renderer.draw(g,.016);checks.push(env+': '+event.name+' spawned and rendered');}
   checks.push(env+': '+g.scenery.length+' props; '+g.realmState.animals.length+' ambient creatures');
  }
  const root=document.createElement('section');document.body.append(root);const editor=new RealmEditor(assets);editor.mount(root);for(const env of ['swamp','caverns','shadow']){editor.env=env;editor.mount(root);if(!root.querySelector('canvas'))throw Error('Missing editor');}editor.selected=editor.game.scenery[0];editor.draw();editor.fields.size.value=120;editor.fields.size.onchange();if(editor.selected.size!==120)throw Error('Editor size failed');root.querySelectorAll('button').forEach(b=>{if(b.textContent==='Save layout')b.click();});const {realmWorld}=await import('./src/realm-world.mjs');if(realmWorld(42,'shadow').scenery[0].size!==120)throw Error('Layout save failed');root.remove();checks.push('All three editor tabs mounted; property edit and layout save/reload passed');
  const swampRoot=document.createElement('section');document.body.append(swampRoot);editor.env='swamp';editor.mount(swampRoot);const sg=editor.game;sg.terrain[10*50+12]='bridge';editor.selected=sg.scenery.find(p=>p.kind==='mangrove');editor.draw();editor.fields.collisionWidth.value=35;editor.fields.collisionWidth.onchange();const selectedId=editor.selected.id;for(const b of swampRoot.querySelectorAll('button'))if(b.textContent==='Save layout')b.click();const loaded=realmWorld(42,'swamp');if(loaded.terrain[512]!=='bridge'||loaded.scenery.find(p=>p.id===selectedId).collisionWidth!==35)throw Error('Swamp terrain/collision save failed');swampRoot.remove();checks.push('Swamp painted bridge and edited collision survive layout save/reload');
  const board=document.createElement('canvas');board.width=1440;board.height=860;const c=board.getContext('2d');c.fillStyle='#202a2d';c.fillRect(0,0,1440,860);const {REALM_ASSETS}=await import('./src/realm-world.mjs');let row=0;for(const [env,props]of Object.entries(REALM_ASSETS)){c.textAlign='left';c.fillStyle='#eee2c4';c.font='22px sans-serif';c.fillText(env,22,row*280+28);let i=0;for(const [kind,def]of Object.entries(props)){const x=90+i*178,y=row*280+220;drawRealmProp(c,{kind,x,y:y-def.size*.19,rootY:y,size:Math.min(160,def.size),realm:true},1,{spriteLibrary:assets.library,realmEditor:true});c.fillStyle='#ded8c9';c.font='13px sans-serif';c.textAlign='center';c.fillText(kind.replaceAll('_',' '),x,y+28);i++;}row++;}images['asset-catalog']=board.toDataURL().split(',')[1];
  const {Designer}=await import('./src/designer.mjs'),{ITEMS}=await import('./src/items.mjs');const studio=new Designer(assets,EVENTS,ITEMS,()=>{});studio.tab='Environments';studio.open();checks.push('Integrated Studio Environments tab opened');
  await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const ed=studio.realmEditor,b=ed.canvas.getBoundingClientRect(),side=Math.min(b.width,b.height);ed.mode='place';ed.prop='cypress_knee';ed.canvas.onpointerdown({clientX:b.left+(b.width-side)/2+side*.3,clientY:b.top+(b.height-side)/2+side*.4});const placed=ed.game.scenery.at(-1);if(Math.abs(placed.x-480)>1||Math.abs(placed.rootY-640)>1)throw Error('Letterboxed map pointer does not align');checks.push('Letterboxed editor placement aligns with visible map');
  return {images,checks};
 })()`);
 fs.writeFileSync(path.join(out,'studio.png'),(await win.webContents.capturePage()).toPNG());
 for(const [name,png]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png,'base64'));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:result.checks,errors},null,2));console.log(JSON.stringify({checks:result.checks,errors},null,2));app.exit(errors.length?1:0);
}).catch(e=>{console.error(e);app.exit(1);});
