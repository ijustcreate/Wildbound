const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/victory-crypt');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message)});
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.qaContext=ctx,false)'});
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  await w.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.qaRaf=raf;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const ctx=qaContext,checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
   const pads=['Xbox Wireless Controller','Nintendo Switch Pro Controller'].map((id,index)=>({id,index,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});ctx.previousPads.clear();
   const fresh=()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());ctx.paused=false;const g=new ctx.Game(()=>.37);ctx.game=g;ctx.wireGame();g.addPlayer('pad:0','DAD');g.addPlayer('pad:1','EMBER FOX');g.phase='won';g.openingBoard=false;g.victoryRewards=[{type:'armor',qty:1},{type:'sword',qty:1}];ctx.show('play');return g};
   let g=fresh();const draw=()=>ctx.heroUI.draw(ctx.game,ctx.renderer),step=()=>{const inputs=ctx.inputFrame();draw();return inputs};
   const release=()=>{pads.forEach(p=>{p.axes.fill(0);p.buttons.forEach(b=>{b.pressed=false;b.value=0})});return step()};
   const press=(i,b)=>{release();pads[i].buttons[b]={pressed:true,value:1};return step()};
   window.vcQA={ctx,checks,assert,pads,step,release,press,fresh,draw};
   for(const index of [0,1]){
    g=ctx.game;release();g.onVictoryBoard(g.players[index]);const d=document.querySelector('#next-game-dialog');assert(d.open,'Replay opens '+index);
    pads[index].axes[0]=1;const i=step();assert(!i['pad:'+index]?.x,'Replay consumes movement '+index);release();
    press(index,12);assert(document.activeElement.id==='next-game-yes','Replay Yes reachable '+index);
    press(index,13);assert(document.activeElement.id==='next-game-no','Replay No reachable '+index);
    press(index,13);assert(document.activeElement.id==='next-game-lobby','Replay lobby reachable '+index);
    press(index,12);press(index,0);assert(!d.open,'Replay No closes '+index);
    pads[index].axes[0]=1;assert(!step()['pad:'+index]?.x,'Held confirm cannot move behind replay '+index);release();
    const p=g.players[index];g.openInventory(p,'victory');draw();release();
    for(let n=0;n<5&&!p.ui.footerAction;n++)press(index,13);
    assert(!!p.ui.footerAction,'Chest footer reachable '+index);if(p.ui.footerAction!=='lootAll')press(index,15);
    assert(p.ui.footerAction==='lootAll','Loot all reachable '+index);press(index,0);
    assert(!g.victoryRewards.some(Boolean),'Loot all transfers rewards '+index);
    assert(p.inventory.some(a=>a?.type==='armor'),'Native backpack receives treasure '+index);
    press(index,13);assert(p.ui.footerAction==='victory-lobby'||p.ui.footerAction==='victory-restart','End actions reachable '+index);
    press(index,14);assert(p.ui.footerAction==='victory-restart','Restart reachable '+index);
    press(index,15);assert(p.ui.footerAction==='victory-lobby','Return lobby reachable '+index);
    press(index===0?1:0,0);assert(p.ui?.storage==='victory','Other pad cannot activate owned chest '+index);
    press(index,1);assert(!p.ui,'Owner closes chest '+index);release();
    g.victoryRewards=[{type:'armor',qty:1},{type:'sword',qty:1}];
   }
   for(const action of ['restart','lobby']){
    g=fresh();release();const p=g.players[0];g.openInventory(p,'victory');draw();release();
    for(let n=0;n<5&&!p.ui.footerAction;n++)press(0,13);
    press(0,13);if(action==='restart')press(0,14);else press(0,15);
    assert(p.ui.footerAction==='victory-'+action,'Controller selects native '+action+' callback');press(0,0);
    assert(ctx.game!==g,'Native '+action+' callback replaces finished expedition');if(action==='lobby')assert(ctx.screen==='lobby','Native callback returns to lobby');release();
   }
   const {renderVictoryReport}=await import('./src/victory-ui.mjs');window.vcQA.renderVictoryReport=renderVictoryReport;
  })()`);
  for(const [name,width,height,count]of [['single',1280,850,1],['party',1280,850,6],['compact',600,430,2],['portrait',600,900,2]]){
   w.setContentSize(width,height);await new Promise(r=>setTimeout(r,120));
   await w.webContents.executeJavaScript(`(()=>{const q=vcQA,g=q.fresh();g.players=[];for(let n=0;n<${count};n++){const p=g.addPlayer('pad:'+n,n?'EMBER FOX '+n:'DAD');p.level=23;}g.cleared=13;g.round=6;g.debrief=g.players.map(p=>({name:p.name,lootRecovered:1469,damageTaken:15843,rescues:8,objectives:122}));const d=document.querySelector('#victory-results');q.renderVictoryReport(d,g);d.showModal();document.querySelector('#victory-continue').focus();})()`);
   await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');
   await w.webContents.executeJavaScript(`(()=>{const {assert}=vcQA,d=document.querySelector('#victory-results'),r=d.getBoundingClientRect(),b=document.querySelector('#victory-continue').getBoundingClientRect();assert(r.top>=0&&r.bottom<=innerHeight+1,'Victory fits ${name}');assert(b.top>=0&&b.bottom<=innerHeight,'Continue visible ${name}');assert(d.querySelectorAll('.victory-explorer').length===${count},'All hero cards ${name}');assert(getComputedStyle(d.querySelector('.victory-stat strong')).color==='rgb(255, 225, 161)','Readable gold stats ${name}');assert(document.documentElement.scrollWidth<=innerWidth+1,'No page overflow ${name}');})()`);
   fs.writeFileSync(path.join(out,'victory-'+name+'.png'),(await w.webContents.capturePage()).toPNG());
   await w.webContents.executeJavaScript(`document.querySelector('#victory-results').close()`);
  }
  w.setContentSize(1280,850);
  await w.webContents.executeJavaScript(`(async()=>{
   const {ctx,assert,release}=vcQA;release();const {spawnMausoleumEvent}=await import('./src/mausoleum-crypt.mjs'),{enterOldWell,leaveOldWell}=await import('./src/old-well.mjs');
   const g=new ctx.Game(()=>.37);ctx.game=g;ctx.wireGame();g.environment='graveyard';const p=g.addPlayer('pad:0','Crypt explorer');g.start();g.openingBoard=false;p.invincible=true;const d=spawnMausoleumEvent(g);Object.assign(p,{x:d.x,y:d.y+50});assert(enterOldWell(g,p,d),'Native crypt enters');assert(d.well.tile===32,'Crypt uses regular 32-pixel world tiles');
   g.update(.02,{});const before=p.roomX;g.update(.03,{'pad:0':{x:1,dodge:true}});assert(p.dashTime>0,'Native dash runs in crypt');assert(p.roomX>before,'Dash moves room actor');
   for(let n=0;n<25;n++)g.update(.02,{});g.update(.02,{'pad:0':{jump:true}});assert(p.jumpHeight>0,'Native jump runs in crypt');for(let n=0;n<50;n++)g.update(.02,{});
   const pos={x:p.roomX,y:p.roomY};g.update(.03,{'pad:0':{x:1,block:true,aimX:1,aimY:0}});assert(Math.hypot(p.roomX-pos.x,p.roomY-pos.y)<.01,'Hold position remains native in crypt');
   ctx.show('play');ctx.renderer=new ctx.Renderer(document.querySelector('#game-canvas'),ctx.assets);ctx.renderer.draw(g,.02);ctx.heroUI.draw(g,ctx.renderer);assert(ctx.renderer.roomWindows[0].full,'Whole party crypt occupies the full world canvas');
   window.vcQA.crypt={g,p,d,enterOldWell,leaveOldWell};
  })()`);
  await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');fs.writeFileSync(path.join(out,'crypt-full.png'),(await w.webContents.capturePage()).toPNG());
  await w.webContents.executeJavaScript(`(()=>{const {ctx,assert}=vcQA,{g,d}=vcQA.crypt;const q=g.addPlayer('pad:1','Outside explorer');Object.assign(q,{x:d.x,y:d.y+50});ctx.renderer.draw(g,.02);ctx.heroUI.draw(g,ctx.renderer);assert(!ctx.renderer.roomWindows[0].full,'Split party retains separate surface and crypt views');})()`);
  await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');fs.writeFileSync(path.join(out,'crypt-split.png'),(await w.webContents.capturePage()).toPNG());
  const checks=await w.webContents.executeJavaScript('vcQA.checks');if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,rendererErrors:errors},null,2));console.log(JSON.stringify({checks,rendererErrors:errors}));app.exit(0);
 }catch(e){console.error(e,errors);console.error(await w.webContents.executeJavaScript(`JSON.stringify({active:document.activeElement.outerHTML.slice(0,1000),ui:qaContext.game.players.map(p=>p.ui)})`));app.exit(1)}
});



