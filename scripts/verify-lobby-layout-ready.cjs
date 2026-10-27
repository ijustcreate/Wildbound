const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/lobby-layout-ready');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1770,height:970,useContentSize:true,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message)});
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.qaContext=ctx,false)'});
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  await w.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.qaRaf=raf;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const ctx=window.qaContext,g=ctx.game,l=ctx.playableLobby,checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
   g.players=[];l.reset();ctx.show('lobby');l.update(.02,{});
   assert(getComputedStyle(document.querySelector('.party-help')).display!=='none','An empty lobby retains join instructions');
   const pads=['Xbox Wireless Controller','Nintendo Switch Pro Controller'].map((id,index)=>({id,index,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});ctx.previousPads.clear();
   for(let i=0;i<2;i++){const p=g.addPlayer('pad:'+i),h=ctx.profiles.create('Layout '+i);ctx.profiles.assign(p,h);}
   l.sync();for(const p of g.players)Object.assign(l.state.members.get(p.id),{spawned:true,panel:null,x:400+p.id*60,y:350});for(const p of g.players)l.close(p);l.update(.02,{});ctx.renderRoster();
   const step=()=>{const wasBlocked=ctx.paused||!!document.querySelector('dialog[open]');const inputs=ctx.inputFrame();if(ctx.screen==='lobby')l.update(.02,inputs,wasBlocked||ctx.paused||!!document.querySelector('dialog[open]'));return inputs};
   const release=()=>{for(const pad of pads){pad.axes.fill(0);for(const b of pad.buttons){b.pressed=false;b.value=0}}step()};
   const press=(i,b)=>{release();pads[i].buttons[b]={pressed:true,value:1};step()};
   window.layoutQA={ctx,g,l,checks,assert,pads,step,release,press};
   for(const index of [0,1]){
    release();l.openBoardReadyMenu(g.players[index]);g.players.forEach(p=>p.ready=true);g.players[index].ready=false;
    press(index,0);assert(!l.boardReadyMenuOpen,'Ready closes for controller '+index);
    for(let f=0;f<8;f++)step();assert(l.practice.players.every(a=>!(a.jumpHeight>0)&&!a.wingHover),'Held ready does not jump for controller '+index);
    release();press(index,0);step();assert(l.practice.players.find(a=>a.device==='pad:'+index).jumpHeight>0,'Fresh jump works for controller '+index);release();
    for(const a of l.practice.players)Object.assign(a,{jumpHeight:0,jumpVelocity:0,wingHover:false,jumpHeld:false});
    g.players.forEach(p=>p.ready=false);l.state.countdown=null;
   }
   for(const screen of ['lobby','play']){
    g.phase=screen==='play'?'play':'lobby';g.openingBoard=false;ctx.show(screen);
    for(const index of [0,1]){
     press(index,9);release();const d=document.querySelector('#settings-dialog');
     assert(d.open&&d.dataset.pauseMenu==='true'&&ctx.paused,'Start opens full Camp Settings in '+screen+' '+index);
     assert(d.querySelectorAll('[data-settings-tab]').length===3,'All three tabs are present '+screen+' '+index);
     assert(getComputedStyle(d).backgroundImage.includes('settings-sign-v2.png'),'Original illustrated sign is used '+screen+' '+index);
     assert(document.activeElement.matches('#camp-session-actions>summary'),'Game actions disclosure is focused '+screen+' '+index);
     press(index,0);assert(document.querySelector('#camp-session-actions').open,'Controller opens game actions '+screen+' '+index);
     press(index,13);assert(document.activeElement.id==='pause-dev','Developer cheats reachable '+screen+' '+index);
     press(index,13);assert(document.activeElement.id==='restart-button','New party/expedition reachable '+screen+' '+index);
     press(index,15);assert(document.activeElement.id==='quit-button','Landing screen reachable '+screen+' '+index);
     press(index,13);assert(document.activeElement.id==='pause-worlds','Worlds reachable '+screen+' '+index);
     press(index,12);press(index,12);assert(document.activeElement.id==='pause-dev','Up returns to Developer cheats '+screen+' '+index);
     press(index,0);assert(!!d.querySelector('.game-debug-console'),'Controller activates Developer cheats '+screen+' '+index);
     press(index,1);assert(!d.querySelector('.game-debug-console'),'Back closes Developer cheats '+screen+' '+index);
     press(index,5);assert(d.querySelector('[data-settings-tab=sound]').getAttribute('aria-selected')==='true','RB reaches Sound '+screen+' '+index);
     press(index,5);assert(d.querySelector('[data-settings-tab=controls]').getAttribute('aria-selected')==='true','RB reaches Controls '+screen+' '+index);
     press(index,4);assert(d.querySelector('[data-settings-tab=sound]').getAttribute('aria-selected')==='true','LB returns to Sound '+screen+' '+index);
     press(index===0?1:0,9);assert(d.open&&ctx.paused,'Other controller cannot close the owner menu '+screen+' '+index);
     press(index,9);release();assert(!d.open&&!ctx.paused&&!document.querySelector('#pause-dialog').open,'Fresh Start resumes directly '+screen+' '+index);
    }
   }
   g.phase='lobby';ctx.show('lobby');for(const p of g.players)l.close(p);l.update(.02,{});ctx.renderRoster();
  })()`);
  for(const [name,width,height] of [['wide',1770,970],['desktop',1280,850],['compact',600,430],['portrait',600,900]]){
   w.setContentSize(width,height);await new Promise(r=>setTimeout(r,120));
   await w.webContents.executeJavaScript(`(()=>{const {ctx,g,l,assert}=layoutQA;l.update(.02,{});ctx.renderRoster();l.draw();const room=l.canvas.getBoundingClientRect(),bar=document.querySelector('.party-banner').getBoundingClientRect(),roster=document.querySelector('#roster').getBoundingClientRect();assert(Math.abs(room.top-bar.bottom)<2,'No reserved heading gap ${name}');assert(Math.abs(room.bottom-innerHeight)<2,'No reserved footer gap ${name}');assert(roster.top-room.top<=6,'Player cards are raised ${name}');assert(getComputedStyle(document.querySelector('.party-help')).display==='none','Hidden help consumes no room ${name}');assert(document.documentElement.scrollWidth<=innerWidth+1,'No horizontal overflow ${name}');})()`);
   await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');await new Promise(r=>setTimeout(r,180));
   fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());
   await w.webContents.executeJavaScript(`(()=>{const {press,release,assert}=layoutQA;press(0,9);release();const d=document.querySelector('#settings-dialog'),r=d.getBoundingClientRect(),done=document.querySelector('#close-settings').getBoundingClientRect();assert(d.open&&Math.abs(r.width/r.height-.53)<.01,'Complete portrait sign fits ${name}');assert(done.bottom<=innerHeight&&done.top>=0,'Done stays visible ${name}');})()`);
   for(const tab of ['display','sound','controls']){
    await w.webContents.executeJavaScript(`document.querySelector('[data-settings-tab=${tab}]').click()`);
    await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');await new Promise(r=>setTimeout(r,100));
    fs.writeFileSync(path.join(out,'camp-'+name+'-'+tab+'.png'),(await w.webContents.capturePage()).toPNG());
   }
   await w.webContents.executeJavaScript(`(()=>{const {press,release,assert}=layoutQA;press(0,9);release();assert(!document.querySelector('#settings-dialog').open&&!layoutQA.ctx.paused,'Complete sign resumes cleanly ${name}');})()`);

  }
  await w.webContents.executeJavaScript(`(()=>{const {ctx,g,l,assert}=layoutQA;document.querySelector('#pause-button').click();const d=document.querySelector('#settings-dialog');assert(d.open&&d.dataset.ownerDevice==='keyboard','Mouse/keyboard Pause uses the same full Camp sign');d.dispatchEvent(new Event('cancel',{cancelable:true}));assert(!d.open&&!ctx.paused,'Keyboard Escape resumes directly');document.querySelector('#pause-button').click();document.querySelector('#close-settings').click();assert(!d.open&&!ctx.paused,'Done resumes directly');})()`);
  const checks=await w.webContents.executeJavaScript('layoutQA.checks');if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,rendererErrors:errors},null,2));console.log(JSON.stringify({checks,rendererErrors:errors}));app.exit(0);
 }catch(e){console.error(e,errors);console.error(await w.webContents.executeJavaScript(`JSON.stringify({active:document.activeElement.outerHTML,controls:[...document.querySelectorAll('#pause-dialog button,#pause-dialog summary')].map(e=>({id:e.id,text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))})`));app.exit(1)}
});
