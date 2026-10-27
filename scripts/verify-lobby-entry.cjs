const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/lobby-entry');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:900,useContentSize:true,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 const errors=[],checks=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const assert=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const js=source=>w.webContents.executeJavaScript(source);
 const pause=()=>new Promise(r=>setTimeout(r,180));
 const capture=async name=>{await pause();fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());};
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');
  await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.entryCtx=ctx,false)'});
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await js('window.wildboundBoot.ready');
  for(let i=0;i<300;i++){if(await js(`document.getElementById('loading').classList.contains('done')&&!!window.entryCtx`))break;await new Promise(r=>setTimeout(r,50));}
  w.showInactive();w.focus();await pause();
  await js(`window.entryRaf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;void 0;`);
  const helpers=`window.c=window.entryCtx;window.pads=[];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});window.tick=()=>{const inputs=c.inputFrame();c.playableLobby.update(.016,inputs);return inputs;};window.reset=()=>{pads=[];c.newLobby();c.previousPads.clear();tick();};`;
  await js(helpers+'reset();void 0;');
  assert(await js(`!document.querySelector('.lobby-landing').hidden&&c.game.players.length===0`),'New party starts on title artwork');
  for(const [width,height]of [[1440,900],[1920,1080],[800,600],[640,420]]){
   w.setContentSize(width,height);await pause();
   const layout=await js(`(()=>{const r=document.querySelector('.lobby-world').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,iw:innerWidth,ih:innerHeight,buttons:[...document.querySelectorAll('#party-menu button')].filter(b=>b.getBoundingClientRect().height).map(b=>b.textContent),heading:getComputedStyle(document.querySelector('.party-heading')).display,help:getComputedStyle(document.querySelector('.party-help')).display,overflow:document.documentElement.scrollHeight>innerHeight};})()`);
   assert(layout.x===0&&layout.y===44&&layout.w===layout.iw&&layout.h===layout.ih-44&&!layout.overflow,'Room fills viewport below toolbar '+width+'x'+height);
   assert(layout.buttons.join()==='Studio'&&layout.heading==='none'&&layout.help==='none','Only Studio remains above room '+width+'x'+height);
   await capture('title-'+width+'x'+height);
  }
  w.setContentSize(1280,850);await pause();
  for(const key of ['K','Enter','Space','Shift','Left']){
   await js('reset()');w.webContents.sendInputEvent({type:'keyDown',keyCode:key});w.webContents.sendInputEvent({type:'keyUp',keyCode:key});await pause();
   const keyboard=await js(`({count:c.game.players.length,device:c.game.players[0]?.device,panel:c.playableLobby.state.members.get(c.game.players[0]?.id)?.panel,selected:!!c.playableLobby.state.members.get(c.game.players[0]?.id)?.spawned,focus:document.activeElement.outerHTML.slice(0,200)})`);
   assert(keyboard.count===1&&keyboard.device==='keyboard'&&keyboard.panel==='choose'&&!keyboard.selected,'Keyboard '+key+' opens explorer selection once '+JSON.stringify(keyboard));
  }
  await capture('choose-empty');
  const point=await js(`(()=>{const r=document.querySelector('.choice-new').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()`);
  await js('reset()');await pause();
  w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...point});w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});await pause();
  const mouse=await js(`({count:c.game.players.length,panel:c.playableLobby.state.members.get(c.game.players[0]?.id)?.panel,landing:document.querySelector('.lobby-landing').hidden})`);
  assert(mouse.count===1&&mouse.panel==='choose','Mouse click joins without clicking through to New character '+JSON.stringify(mouse));
  await js('reset()');await js(`document.querySelector('.lobby-landing').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,movementX:5,movementY:0}))`);
  assert(await js(`c.game.players.length===1`),'Mouse movement opens explorer selection');
  await js('reset()');await js(`document.querySelector('.lobby-landing').dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:10,cancelable:true}))`);
  assert(await js(`c.game.players.length===1`),'Mouse wheel opens explorer selection');
  await js('reset();c.profiles.create("Saved explorer")');
  for(const gesture of ['face','start','back','trigger','left-stick','right-stick']){
   const data=await js(`(()=>{reset();const p={id:'Xbox Wireless Controller',index:0,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};pads=[p];tick();
    const kind=${JSON.stringify(gesture)};if(kind==='left-stick')p.axes[0]=.8;else if(kind==='right-stick')p.axes[3]=-.8;else if(kind==='trigger')p.buttons[6].value=.7;else p.buttons[{face:0,start:9,back:8}[kind]].pressed=true;
    tick();tick();tick();const hero=c.game.players[0],state=c.playableLobby.state.members.get(hero?.id);const result={count:c.game.players.length,device:hero?.device,family:hero?.controllerFamily,panel:state?.panel,selected:!!state?.spawned,settings:document.getElementById('settings-dialog').open};
    p.axes.fill(0);for(const b of p.buttons){b.pressed=false;b.value=0;}tick();return result;})()`);
   assert(data.count===1&&data.device==='pad:0'&&data.panel==='choose'&&!data.selected&&!data.settings,'Controller '+gesture+' joins and consumes held gesture');
  }
  await js(`pads[0].buttons[13].pressed=true;tick();pads[0].buttons[13].pressed=false;tick();pads[0].buttons[0].pressed=true;tick();pads[0].buttons[0].pressed=false;tick();`);
  assert(await js(`!!c.game.players[0].profileId&&c.playableLobby.state.members.get(c.game.players[0].id).spawned`),'Fresh controller press selects saved explorer after release');
  await capture('selected-explorer');
  await js(`pads.push({id:'Nintendo Switch Pro Controller',index:1,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});pads[1].buttons[0].pressed=true;tick();pads[1].buttons[0].pressed=false;tick();`);
  assert(await js(`c.game.players.length===2&&c.game.players[1].controllerFamily==='switch'&&c.playableLobby.state.members.get(c.game.players[1].id).panel==='choose'`),'Second controller joins its own explorer panel');
  await capture('two-players');
  await js(`reset();document.getElementById('lobby-studio').click()`);await pause();
  assert(await js(`c.game.players.length===0&&!!document.querySelector('dialog[open]')`),'Studio opens without joining a player');
  w.webContents.sendInputEvent({type:'keyDown',keyCode:'K'});w.webContents.sendInputEvent({type:'keyUp',keyCode:'K'});await pause();
  assert(await js('c.game.players.length===0'),'Studio keyboard input cannot join behind dialog');
  assert(errors.length===0,'Zero renderer errors');
  const report={checks,errors,physicalControllersTested:false,base};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(0);
 }catch(error){console.error(error);console.error(JSON.stringify({checks,errors}));app.exit(1);}
});
