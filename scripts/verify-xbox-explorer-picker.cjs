const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const baseline=process.env.WILDBOUND_PICKER_EXPECT_BASELINE==='1';
const deferredBaseline=process.env.WILDBOUND_PICKER_EXPECT_DEFER_BUG==='1';
const output=path.join(root,'test-output','xbox-picker-live',process.env.WILDBOUND_PICKER_STAGE||(baseline?'baseline':'source'));
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-xbox-picker-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>app.exit(1),90000);

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadURL('about:blank');
  win.webContents.debugger.attach('1.3');
  await win.webContents.debugger.sendCommand('Debugger.enable');
  await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.pickerQA=ctx,false)'});
  const appLines=fs.readFileSync(path.join(base,'app.mjs'),'utf8').split('\n');
  const frameRegistration=appLines.findIndex(line=>line.trimEnd()==='requestAnimationFrame(frame);');
  if(frameRegistration<0)throw Error('Cannot locate the app frame registration.');
  await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'app\\.mjs$',lineNumber:frameRegistration,condition:'(window.pickerFrame=frame,false)'});
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const ctx=window.pickerQA,lobby=ctx.playableLobby;
   const wait=(ms=90)=>new Promise(resolve=>setTimeout(resolve,ms));
   window.requestAnimationFrame=()=>0;
   await wait(30);
   const frames=async(ms=90)=>{
    const end=performance.now()+ms;
    let count=0;
    do{window.pickerFrame(performance.now());count++;await wait(18);}while(count<2||performance.now()<end);
   };
   const checks=[],pictures={},trace={},pass=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
   for(const name of ['Xbox fixture','Keyboard fixture','Switch fixture'])ctx.profiles.create(name);
   Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});
   const claims=[];
   let deferClaim=false,finishClaim;
   // Match the desktop's asynchronous physical-device claim before the real
   // inputFrame and lobby renderer handle each standard Gamepad button.
   window.desktop={claimController:async key=>{
    if(deferClaim)await new Promise(resolve=>{finishClaim=resolve;});else await wait(30);
    claims.push(key);return true;
   },releaseController:async()=>true,
    saveProfiles:async()=>true,loadSession:async()=>null};
   const makePad=(index,id)=>({index,id,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
   let xbox=makePad(0,'Xbox 360 Controller (XInput STANDARD GAMEPAD)'),switchPad=makePad(1,'Wireless Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2009)');
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[xbox,switchPad]});
   const state=device=>{
    const p=ctx.game.players.find(player=>player.device===device),s=p&&lobby.state.members.get(p.id),node=p&&lobby.nodes.get(p.id);
    return {exists:!!p,spawned:!!s?.spawned,panel:s?.panel??null,focus:node?.querySelector('.lobby-focus')?.textContent??null,
     profile:!!ctx.profiles.data.heroes.find(hero=>hero.id===p?.profileId),name:p?.name,id:p?.id,x:s?.x};
   };
   const padButton=async(pad,button,hold=90)=>{
    pad.buttons[button]={pressed:true,value:1};await frames(hold);
    pad.buttons[button]={pressed:false,value:0};await frames();
   };
   const key=async(key,code)=>{
    for(const type of ['keydown','keyup']){document.body.dispatchEvent(new KeyboardEvent(type,{key,code,bubbles:true,cancelable:true}));await frames();}
   };
   const fresh=async()=>{await ctx.newLobby();await frames(120);};
   const drawn=new Map(),nativeDraw=lobby.animator.draw.bind(lobby.animator);
   lobby.animator.draw=(c,actor,...args)=>{
    if(c.canvas===lobby.canvas&&actor.kind==='player')drawn.set(actor.id,{name:actor.name,x:actor.x,moving:actor.moving});
    nativeDraw(c,actor,...args);
   };
   await fresh();
   pass(!document.querySelector('.lobby-landing').hidden,'Real app starts on the title when the party is empty');
   await padButton(xbox,0,220);
   trace.xboxOpened=state('pad:0');
   if(trace.xboxOpened.panel!=='choose'||trace.xboxOpened.spawned||!claims.some(key=>key.includes('XInput')))throw Error('Expected fresh Xbox join: '+JSON.stringify({state:trace.xboxOpened,claims}));
   checks.push('Xbox A joins the actual chooser after an asynchronous device claim, without consuming the held join');
   pictures['xbox-chooser']=lobby.canvas.toDataURL();
   await padButton(xbox,0);
   trace.xboxFreshConfirm=state('pad:0');
   if(${baseline}){
    pass(trace.xboxOpened.focus!=='Choose'&&!trace.xboxFreshConfirm.spawned,'Baseline reproduces fresh Xbox A failing to select the displayed saved explorer');
    for(let i=0;i<10&&state('pad:0').focus!=='Choose';i++)await padButton(xbox,13);
    await padButton(xbox,0);
    pass(state('pad:0').spawned,'Baseline can select after manually moving focus to Choose');
   }else{
    if(trace.xboxOpened.focus!=='Choose'||!trace.xboxFreshConfirm.spawned||!trace.xboxFreshConfirm.profile||trace.xboxFreshConfirm.panel!==null)throw Error('Expected fresh default Xbox A confirmation: '+JSON.stringify({trace,claims}));
    checks.push('Fresh Xbox A chooses the saved explorer shown by default');
   }
   const start=state('pad:0'),firstPose=drawn.get(start.id);
   xbox.axes[0]=.85;await frames(360);xbox.axes[0]=0;await frames();
   const moved=state('pad:0'),movedPose=drawn.get(start.id);
   trace.movement={start,firstPose,moved,movedPose};
   if(firstPose?.name!==start.name||!(moved.x>start.x+5)||!(movedPose?.x>firstPose?.x+5))throw Error('Expected actual Animator movement: '+JSON.stringify(trace.movement));
   checks.push('Chosen Xbox explorer is drawn by the live Animator and moves under the actual left stick');
   pictures['xbox-selected-in-world']=lobby.canvas.toDataURL();
   if(!${baseline}){
    await fresh();await padButton(xbox,0);await padButton(xbox,1);
    trace.afterCancel=state('pad:0');
    await padButton(xbox,0);
    pass(state('pad:0').panel==='choose'&&!state('pad:0').spawned,'Xbox B cancels the first picker and a fresh A can open it again');
    await padButton(xbox,0);
    pass(state('pad:0').spawned,'Xbox can select a saved explorer after reopening');
    await fresh();await key('Enter','Enter');await key('Enter','Enter');
    pass(state('keyboard').spawned&&state('keyboard').profile&&state('keyboard').panel===null,'Keyboard Enter still opens and selects the default saved explorer');
    await padButton(xbox,0);
    pass(state('keyboard').spawned&&!state('pad:0').spawned&&state('pad:0').panel==='choose','Joining Xbox opens only its picker while keyboard explorer remains active');
    await padButton(xbox,0);
    pass(state('pad:0').spawned&&state('keyboard').name!==state('pad:0').name,'Xbox owns its picker and cannot select the active keyboard profile');
    await padButton(switchPad,1);
    pass(state('pad:1').panel==='choose'&&!state('pad:1').spawned,'Nintendo physical east button opens its own picker');
    await padButton(switchPad,1);
    pass(state('pad:1').spawned&&state('pad:1').profile&&state('pad:0').spawned&&state('keyboard').spawned,'Nintendo east confirms only its own preview while both other explorers remain active');
    pictures['keyboard-xbox-switch']=lobby.canvas.toDataURL();
    await fresh();
    xbox=makePad(2,'Xbox 360 Controller (XInput STANDARD GAMEPAD)');
    deferClaim=true;
    xbox.buttons[0]={pressed:true,value:1};window.pickerFrame(performance.now());
    xbox.buttons[0]={pressed:false,value:0};
    if(!finishClaim)throw Error('Deferred Xbox claim did not start.');
    finishClaim();await wait(25);window.pickerFrame(performance.now());
    trace.lateClaimAtNeutral=state('pad:2');
    pass(trace.lateClaimAtNeutral.panel==='choose'&&!trace.lateClaimAtNeutral.spawned,'A claim resolving after A is up opens the picker on the single neutral frame');
    await padButton(xbox,0);
    trace.freshAfterLateClaim=state('pad:2');
    if(trace.freshAfterLateClaim.spawned===${deferredBaseline})throw Error('Unexpected first confirm after neutral claim: '+JSON.stringify({trace,claims}));
    checks.push(${deferredBaseline}?'Intermediate build reproduces swallowing fresh A after a claim completed on a neutral frame':'Fresh A selects immediately after a delayed claim opens the picker on a neutral frame');
   }
   return {checks,trace,claims,pictures};
  })()`);
  for(const [name,data] of Object.entries(result.pictures))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  delete result.pictures;
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...result,base,errors,audioMuted:win.webContents.isAudioMuted(),physicalHardwareTested:false},null,2));
  if(errors.length)throw Error(errors.join('\n'));
  clearTimeout(deadline);app.exit(0);
 }catch(error){
  fs.writeFileSync(path.join(output,'error.txt'),String(error.stack||error)+'\n'+errors.join('\n'));
  clearTimeout(deadline);app.exit(1);
 }
});
