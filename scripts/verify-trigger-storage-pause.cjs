const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/trigger-storage-pause');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);const errors=[];
win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
try{
 await win.loadURL('about:blank');win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Debugger.enable');
 await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.reviewContext=ctx,false)'});
 await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const initial=await win.webContents.executeJavaScript(`(async()=>{
  const raf=requestAnimationFrame;window.qaRaf=raf;window.requestAnimationFrame=()=>0;await new Promise(raf);
  const ctx=window.reviewContext,g=new ctx.Game(()=>.5);ctx.game=g;ctx.wireGame();
  const p=g.addPlayer('keyboard','DAD'),q=g.addPlayer('pad:0','EMBER');p.profileId='qa-dad';q.profileId='qa-ember';g.start();g.openingBoard=false;g.weather=null;g.sky.elapsed=100;
  ctx.show('play');const r=new ctx.Renderer(ctx.$('game-canvas'),ctx.assets);ctx.renderer=r;r.camera={x:800,y:820,zoom:1.05};r.draw(g,0);
  g.portal(p);const d=g.portals.find(d=>d.owner===p.id);p.x=d.x;p.y=d.y;g.enterRoom(p,d);
  window.storageQA={ctx,g,p,q,d,r,checks:[],assert(v,m){if(!v)throw Error(m);this.checks.push(m);}};
  for(let n=0;n<3;n++){r.draw(g,0);ctx.heroUI.draw(g,r);}
  const panel=ctx.heroUI.panels.get(p.id),canvas=panel.querySelector('.room-view'),s=window.storageQA;
  s.assert(panel.getBoundingClientRect().width<=421,'Partial-party storage has a narrow window');
  s.assert(panel.querySelectorAll(':scope > button:not([data-action=close])').length===0,'Storage has no bottom station buttons');
  s.assert(canvas.clientHeight>300,'Room view uses available height');
  s.assert(Number(canvas.dataset.worldZoom)===r.camera.zoom,'Storage matches main-world camera scale');
  const close=panel.querySelector('[data-action=close]'),cr=close.getBoundingClientRect(),pr=panel.getBoundingClientRect();s.assert(cr.left>=pr.left&&cr.right<=pr.right&&cr.top>=pr.top,'Storage return control stays inside its window');
  return {width:panel.getBoundingClientRect().width,zoom:canvas.dataset.worldZoom};
 })()`);
 await win.webContents.executeJavaScript('new Promise(window.qaRaf)');await new Promise(r=>setTimeout(r,100));
 fs.writeFileSync(path.join(out,'storage-narrow.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript(`(()=>{const s=window.storageQA,{g,q,d,ctx,r}=s;q.x=d.x;q.y=d.y;g.enterRoom(q,d);for(let n=0;n<3;n++)ctx.heroUI.draw(g,r);const panels=[...document.querySelectorAll('.hero-panel.private-storage-room')];s.assert(panels.length===1,'Same storage room has one shared view');s.assert(panels[0].getBoundingClientRect().width>800,'Whole party in same room gets a wide view');})()`);
 await win.webContents.executeJavaScript('new Promise(window.qaRaf)');await new Promise(r=>setTimeout(r,100));
 fs.writeFileSync(path.join(out,'storage-shared.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript(`(()=>{const s=window.storageQA,{g,p,q,ctx,r}=s;p.roomX=60;p.roomY=110;p.previousInput={};g.update(.02,{keyboard:{interact:true}});for(let n=0;n<3;n++)ctx.heroUI.draw(g,r);s.assert(!!p.ui,'Shared-room chest interaction still opens inventory');const chest=ctx.heroUI.panels.get(p.id),room=ctx.heroUI.panels.get(q.id);s.assert(Number(chest.style.zIndex)>Number(room.style.zIndex),'Chest stays above the shared room view');p.ui=null;ctx.heroUI.draw(g,r);})()`);
 await win.webContents.executeJavaScript(`(()=>{const s=window.storageQA,{g,p,q,ctx,r}=s;g.leaveRoom(q);p.roomX=60;p.roomY=110;p.previousInput={};g.update(.02,{keyboard:{interact:true}});s.assert(!!p.ui,'Walking to a chest and interacting still opens inventory');p.ui=null;g.leaveRoom(p);ctx.heroUI.draw(g,r);document.querySelector('#pause-button').click();s.assert(document.querySelector('#pause-dialog').open,'Expedition pause opens');})()`);
 for(const [name,width,height]of [['desktop',1280,850],['small',600,430],['portrait',962,1635]]){
  win.setContentSize(width,height);await new Promise(r=>setTimeout(r,120));
  await win.webContents.executeJavaScript(`(()=>{const s=window.storageQA,d=document.querySelector('#pause-dialog'),style=getComputedStyle(d),b=d.getBoundingClientRect();s.assert(style.backgroundImage.includes('settings-wood.png'),'Pause uses restored Camp wood materials at ${name}');s.assert(b.left>=0&&b.right<=innerWidth+1&&b.top>=0&&b.bottom<=innerHeight+1,'Pause fits ${name} viewport');s.assert(d.scrollWidth<=d.clientWidth+1,'Pause has no horizontal overflow ${name}');s.assert(d.scrollHeight<=d.clientHeight+1,'Main pause actions fit without scrolling ${name}');})()`);
  fs.writeFileSync(path.join(out,'pause-'+name+'.png'),(await win.webContents.capturePage()).toPNG());
 }
 const checks=await win.webContents.executeJavaScript('window.storageQA.checks');if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,initial,rendererErrors:errors},null,2));console.log(JSON.stringify({checks,initial,rendererErrors:errors}));app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
