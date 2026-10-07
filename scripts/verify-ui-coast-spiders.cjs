const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','ui-coast-spiders');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile-'+Date.now()));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=async source=>{const r=await w.webContents.executeJavaScript('(async()=>{try{return await ('+source+');}catch(e){return {qaError:e.stack};}})()');if(r?.qaError)throw Error(r.qaError);return r;};
 const deadline=setTimeout(()=>{console.error('UI/coast/spider QA timed out');app.exit(1);},120000);
 const save=(name,data)=>fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');
  await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.uiCoastContext=ctx,false)'});
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('window.wildboundBoot.ready');
  const art=await run(`(async()=>{
   const {Game,EVENTS}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Animator}=await import('./src/animation.mjs'),{Renderer}=await import('./src/render.mjs'),{rigSubject}=await import('./src/rig-subjects.mjs');
   const assets=new Assets();await assets.load();const animator=new Animator(assets),sheet=document.createElement('canvas');sheet.width=960;sheet.height=480;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#202c30';c.fillRect(0,0,960,480);
   for(const [row,kind]of ['tarantula','spider'].entries()){
    if(rigSubject(kind).data.artGeneration!==2)throw Error('Pack did not load native spider generation '+kind);
    c.fillStyle='#eadfc4';c.font='16px system-ui';c.fillText(kind==='spider'?'BLACK SPIDER · glossy angular legs':'SANDY TARANTULA · fuzzy banded legs',20,30+row*240);
    const frames=new Set();
    for(let d=0;d<8;d++){const x=60+d*120,y=170+row*240;animator.draw(c,{kind,x,y,hp:110,faceX:Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction:'walk',playerFrame:3},1,80);
     const probe=document.createElement('canvas');probe.width=probe.height=120;const pc=probe.getContext('2d');for(const frame of [0,3,6]){pc.clearRect(0,0,120,120);animator.draw(pc,{kind,x:60,y:70,hp:110,faceX:0,faceY:1,animationAction:'walk',playerFrame:frame},1,75);frames.add(probe.toDataURL());}
    }
    if(frames.size<3)throw Error('Actual walking spider frame is static '+kind);
   }
   const {livingAnimals}=await import('./src/living-ecosystem.mjs');
   const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.seed=177;g.environment='beach';g.start();g.openingBoard=false;g.update(.016,{});
   if(livingAnimals(g).filter(a=>a.kind==='crab').length!==10||livingAnimals(g).filter(a=>a.kind==='fish').length!==8)throw Error('Actual beach omitted coastal critters');
   const view=document.createElement('canvas');view.width=960;view.height=640;view.style='position:fixed;left:0;top:0;width:960px;height:640px';document.body.append(view);const r=new Renderer(view,assets);r.camera={x:1030,y:850,zoom:1.1};r.draw(g,0);const beach=view.toDataURL();view.remove();
   const tar=EVENTS.findIndex(e=>e.kind==='tarantula');g.spawnEvent(tar);if(g.enemies.filter(e=>e.kind==='tarantula').length!==2)throw Error('Actual tarantula event missing');
   const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:99999;background:#23352c';document.body.append(host);const {HeroUI}=await import('./src/hero-ui.mjs'),{ITEMS,SLOTS}=await import('./src/items.mjs');
   for(const slot of SLOTS)p.equipment[slot]=Object.keys(ITEMS).find(id=>ITEMS[id].slot===slot&&!ITEMS[id].gmOnly);p.equipment.hand1='staff';p.equipment.hand2='occupied';g.openInventory(p);p.ui.panel='gear';const ui=new HeroUI(host);ui.draw(g,assets);
   const panel=ui.panels.get(p.id);if(panel.querySelector('.quiver-slot'))throw Error('Arrow selector remains');
   for(const b of panel.querySelectorAll('.paper-doll button')){const icon=b.querySelector('.item-icon'),data=icon?.getContext('2d').getImageData(0,0,48,48).data;if(!data?.some((v,i)=>i%4===3&&v))throw Error('Invisible equipped item '+b.dataset.slot);if(getComputedStyle(b).borderImageSource!=='none')throw Error('Stretched gear texture remains');}
   if(panel.querySelector('[data-slot="hand2"]').classList.contains('empty-slot'))throw Error('Occupied two-hand icon still empty');
   window.uiCoastQA={g,p,ui,host,assets};return {spiders:sheet.toDataURL(),beach,checks:['16 native spider/tarantula facings','walk frames change in the real Animator','real beach has ten crabs/eight fish','real encounter spawns two tarantulas','eleven equipped icons contain pixels including both hands','no arrow selector or bitmap-stretched gear borders']};
  })()`);save('spider-rigs',art.spiders);save('beach-coast',art.beach);
  const checks=art.checks;
  console.log(await run(`(()=>{window.uiCoastQA.host.remove();const ctx=window.uiCoastContext;if(!ctx)throw Error('Missing app lobby context');ctx.paused=true;ctx.newLobby();const p=ctx.game.addPlayer('keyboard','MAP TEST');p.profileId='qa-temporary';const l=ctx.playableLobby;l.keepSelectedPlayers();document.getElementById('map-mode').value='bounded';l.open(p,'environment');window.mapQA={ctx,p,l};return 'Actual map table opened';})()`));
  for(const [width,height]of [[1280,850],[960,650],[780,600],[600,430]]){
   w.setContentSize(width,height);
   for(let n=0;n<30;n++){await new Promise(r=>setTimeout(r,100));const v=await run('[innerWidth,innerHeight]'),size=w.getContentSize();if(Math.abs(v[0]-size[0])<3&&Math.abs(v[1]-size[1])<3)break;}
   await new Promise(r=>setTimeout(r,250));
   checks.push(await run(`(()=>{const {l,p}=window.mapQA;l.renderPanel(p);const panel=l.nodes.get(p.id),r=panel.getBoundingClientRect(),area=l.panels.getBoundingClientRect(),buttons=[...panel.querySelectorAll('button')];if(panel.querySelectorAll('.map-mode-toggle').length!==1||panel.querySelector('.map-mode-choice'))throw Error('Two-button Boundless UI remains');if(panel.querySelectorAll('.map-choice').length!==document.getElementById('environment').options.length)throw Error('Map choice missing');if(panel.scrollHeight>panel.clientHeight+1||panel.scrollWidth>panel.clientWidth+1)throw Error('Map selection requires scrolling '+JSON.stringify([innerWidth,innerHeight,r.width,r.height,panel.scrollHeight,panel.clientHeight]));if(r.top<area.top-1||r.bottom>area.bottom+1||r.left<area.left-1||r.right>area.right+1)throw Error('Map dialog outside one-screen room');for(const b of buttons){const a=b.getBoundingClientRect();if(a.bottom>r.bottom+1||a.right>r.right+1)throw Error('Clipped map button');}return 'Map picker fits '+innerWidth+' × '+innerHeight+' with every map / one toggle';})()`));
  }
  checks.push(await run(`(()=>{const {l,p,ctx}=window.mapQA,mode=document.getElementById('map-mode');if(mode.value!=='bounded')throw Error('Not bounded by default');l.nodes.get(p.id).querySelector('.map-mode-toggle').click();if(mode.value!=='boundless'||l.nodes.get(p.id).querySelector('.map-mode-toggle').getAttribute('aria-pressed')!=='true')throw Error('Boundless toggle does not enable');l.nodes.get(p.id).querySelector('.map-mode-toggle').click();if(mode.value!=='bounded')throw Error('Boundless toggle does not disable');const n=ctx.game.players.length;l.navigate(p,{y:1});if(!l.nodes.get(p.id).querySelector('.map-choice.lobby-focus'))throw Error('Map keyboard cursor not visible');const focus=l.state.members.get(p.id).focus;l.navigate(p,{y:1},'pad:2');if(l.state.members.get(p.id).focus!==focus)throw Error('Map controller ownership leaked');return 'Bounded default, reversible one-button Boundless toggle and owner-only map focus work';})()`));
  w.setContentSize(960,650);await new Promise(r=>setTimeout(r,350));fs.writeFileSync(path.join(out,'map-picker.png'),(await w.webContents.capturePage()).toPNG());
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:checks.length,failed:0,checks},null,2));console.log(JSON.stringify({passed:checks.length,failed:0,checks,out},null,2));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e.stack);try{console.error(await w.webContents.executeJavaScript(`JSON.stringify({viewport:[innerWidth,innerHeight],zoom:devicePixelRatio,panels:[...document.querySelectorAll('.lobby-player-panel.map-menu,.lobby-panels,.lobby-world')].map(e=>({class:e.className,rect:e.getBoundingClientRect().toJSON(),rows:getComputedStyle(e).gridTemplateRows,columns:getComputedStyle(e).gridTemplateColumns,container:getComputedStyle(e).containerType}))})`));fs.writeFileSync(path.join(out,'failure.png'),(await w.webContents.capturePage()).toPNG());}catch{}fs.writeFileSync(path.join(out,'failure.txt'),e.stack);clearTimeout(deadline);app.exit(1);}
});
