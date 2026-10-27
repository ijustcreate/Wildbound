const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/camp-navigation');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:850,height:950,useContentSize:true,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message)});
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.qaContext=ctx,false)'});
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  await w.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.qaRaf=raf;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const ctx=qaContext,g=ctx.game,checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
   g.players=[];const pads=['Xbox Wireless Controller','Nintendo Switch Pro Controller'].map((id,index)=>({id,index,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});ctx.previousPads.clear();
   for(const pad of pads){const p=g.addPlayer('pad:'+pad.index),h=ctx.profiles.create('Menu '+pad.index);ctx.profiles.assign(p,h);}
   const step=()=>ctx.inputFrame(),release=()=>{pads.forEach(p=>{p.axes.fill(0);p.buttons.forEach(b=>{b.pressed=false;b.value=0})});step()},press=(i,b)=>{release();pads[i].buttons[b]={pressed:true,value:1};step()};
   const d=document.querySelector('#settings-dialog'),id=()=>document.activeElement.id;
   for(const screen of ['lobby','play'])for(const index of [0,1]){
    g.phase=screen;g.openingBoard=false;ctx.show(screen);release();press(index,9);release();
    assert(d.open&&d.dataset.ownerDevice==='pad:'+index,'Controller owns Start menu '+screen+' '+index);
    press(index,12);assert(document.activeElement.dataset.settingsTab==='display','Up reaches active tab '+screen+' '+index);
    press(index,15);assert(document.activeElement.dataset.settingsTab==='sound'&&document.querySelector('#settings-sound').hidden===false,'D-pad right switches tab '+screen+' '+index);
    press(index,13);assert(id()==='sound-toggle','Down enters selected tab '+screen+' '+index);
    press(index,12);press(index,15);assert(document.activeElement.dataset.settingsTab==='controls','D-pad reaches Controls tab '+screen+' '+index);
    press(index,15);assert(document.activeElement.dataset.settingsTab==='display','D-pad wraps to Display '+screen+' '+index);
    press(index,13);assert(document.activeElement.matches('#camp-session-actions>summary'),'Down returns to panel actions '+screen+' '+index);
    press(index,13);assert(id()==='fullscreen-button','Down leaves Lobby/Expedition actions '+screen+' '+index);
    press(index,13);assert(id()==='cel-shading-toggle','Smoothing reachable '+screen+' '+index);
    assert(document.activeElement.classList.contains('menu-focus'),'Visible controller focus '+screen+' '+index);
    press(index,14);assert(!document.activeElement.checked,'Left disables toggle '+screen+' '+index);
    press(index,15);assert(document.activeElement.checked,'Right enables toggle '+screen+' '+index);
    press(index,13);assert(id()==='dynamic-shadows-toggle','Shadows reachable '+screen+' '+index);
    press(index,13);assert(id()==='world-grid-toggle','Grid toggle reachable '+screen+' '+index);
    press(index,13);assert(id()==='world-grid-style','Grid style reachable '+screen+' '+index);
    const style=document.activeElement.value;press(index,15);assert(document.activeElement.value!==style,'Select changes '+screen+' '+index);
    press(index,13);assert(id()==='world-grid-opacity','Opacity reachable '+screen+' '+index);
    const opacity=Number(document.activeElement.value);press(index,14);assert(Number(document.activeElement.value)<opacity,'Range adjusts '+screen+' '+index);
    for(const expected of ['ui-scale','board-size','event-duration','close-settings']){press(index,13);assert(id()===expected,'Reach '+expected+' '+screen+' '+index);}
    assert(document.querySelector('.settings-panels').scrollTop>0,'Lower options scroll into view '+screen+' '+index);
    press(index,5);assert(d.querySelector('[data-settings-tab=sound]').getAttribute('aria-selected')==='true','RB reaches Sound '+screen+' '+index);
    assert(id()==='sound-toggle','Sound starts on real setting '+screen+' '+index);press(index,13);assert(id()==='music-volume','Music volume reachable '+screen+' '+index);
    press(index,5);assert(d.querySelector('[data-settings-tab=controls]').getAttribute('aria-selected')==='true','RB reaches Controls '+screen+' '+index);
    const seen=new Set();for(let n=0;n<70;n++){seen.add(id());if(id()==='close-settings')break;press(index,13);}
    assert(seen.has('controller-layout')&&seen.has('stick-response')&&seen.has('aim-deadzone')&&seen.has('controller-vibration')&&seen.has('close-settings'),'Controls tab navigates to all main inputs and Done '+screen+' '+index);
    press(index,0);assert(!d.open&&!ctx.paused,'Done works '+screen+' '+index);release();
    document.querySelector('#pause-button').click();assert(d.open&&d.dataset.ownerDevice==='keyboard','Mouse-opened menu starts with keyboard owner '+screen+' '+index);
    press(index,13);assert(d.dataset.ownerDevice==='pad:'+index&&id()==='fullscreen-button','First intentional pad input takes mouse-opened menu '+screen+' '+index);
    press(index===0?1:0,13);assert(d.dataset.ownerDevice==='pad:'+index&&id()==='fullscreen-button','Other pad cannot steal owner '+screen+' '+index);
    press(index,13);assert(id()==='cel-shading-toggle','Navigate after mouse takeover '+screen+' '+index);
    release();pads[index].axes[1]=1;step();assert(id()==='dynamic-shadows-toggle','Stick moves down '+screen+' '+index);
    const before=document.activeElement.checked;pads[index].buttons[0]={pressed:true,value:1};step();assert(document.activeElement.checked!==before,'Confirm works while stick remains held '+screen+' '+index);
    pads[index].buttons[0]={pressed:false,value:0};step();await new Promise(r=>setTimeout(r,360));step();assert(id()==='world-grid-toggle','Held stick repeats without neutral '+screen+' '+index);
    release();press(index,9);pads[index].buttons[9].pressed=false;pads[index].axes[2]=.5;step();press(index,9);release();assert(d.open,'Right-stick drift does not lock reopening '+screen+' '+index);press(index,1);release();assert(!d.open,'Back closes '+screen+' '+index);
   }
   window.campNavQA={ctx,g,pads,checks,assert,press,release};
  })()`);
  for(const [name,width,height]of [['portrait',850,950],['compact',600,430]]){
   w.setContentSize(width,height);await new Promise(r=>setTimeout(r,120));await w.webContents.executeJavaScript(`(()=>{const q=campNavQA;q.press(0,9);q.release();q.press(0,13);q.press(0,13);})()`);await w.webContents.executeJavaScript('new Promise(r=>qaRaf(()=>qaRaf(r)))');
   fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());await w.webContents.executeJavaScript('campNavQA.press(0,1);campNavQA.release()');
  }
  const checks=await w.webContents.executeJavaScript('campNavQA.checks');if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,rendererErrors:errors},null,2));console.log(JSON.stringify({checks:checks.length,rendererErrors:errors}));app.exit(0);
 }catch(e){console.error(e,errors);console.error(await w.webContents.executeJavaScript('JSON.stringify({active:document.activeElement.outerHTML.slice(0,500),owner:document.querySelector("#settings-dialog").dataset.ownerDevice})'));app.exit(1)}
});
