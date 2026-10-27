const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','lobby-join-controls');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadURL('about:blank');win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Debugger.enable');
  await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.lobbyJoinContext=ctx,false)'});
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const ctx=window.lobbyJoinContext,g=ctx.game,l=ctx.playableLobby;g.players=[];l.reset();ctx.show('lobby');ctx.renderRoster();
   const checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const pads=['Xbox Wireless Controller','Nintendo Switch Pro Controller'].map((id,index)=>({id,index,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});ctx.previousPads.clear();
   const set=(pad,key,on)=>pads[pad].buttons[key]={pressed:on,value:on?1:0};
   const tick=()=>{const inputs=ctx.inputFrame();l.update(.05,inputs);return inputs;};
   const press=(pad,key)=>{set(pad,key,true);const input=tick();set(pad,key,false);tick();return input;};
   for(let index=0;index<2;index++){
    const hero=ctx.profiles.create(index?'Switch explorer':'Xbox explorer');
    press(index,0);const p=g.players.find(p=>p.device==='pad:'+index);assert(!!p,'Controller joins '+pads[index].id);
    const cards=[...document.querySelectorAll('#roster .roster-card')];const card=cards.find(c=>c.hero===p);
    assert(!card&&cards.length===index,'No placeholder nameplate before choosing explorer '+index);
    const member=l.state.members.get(p.id);member.choice=l.available(p).findIndex(h=>h.id===hero.id);l.renderPanel(p);
    ctx.renderRoster();assert(![...document.querySelectorAll('#roster .roster-card')].some(c=>c.hero===p),'Previewing explorer does not create nameplate '+index);
    [...l.nodes.get(p.id).querySelectorAll('button')].find(b=>b.textContent==='Choose').click();tick();ctx.renderRoster();
    assert(p.profileId===hero.id,'Actual Choose confirms explorer '+index);
    const selected=[...document.querySelectorAll('#roster .roster-card')].find(c=>c.hero===p);
    assert(selected&&selected.closest('.lobby-world')&&selected.getBoundingClientRect().width>0,'Visible nameplate after choosing explorer '+index);
    Object.assign(member,{x:300+index*300,y:350,faceX:0,faceY:-1,inventoryRelease:false});
    assert(document.querySelector('#roster').textContent.includes(p.name),'Nameplate follows selected explorer '+index);
    const input=press(index,12);assert(input[p.device].portal,'Actual D-pad Up input opens storage '+index);
    assert(g.portals.some(d=>d.owner===p.id),'Storage portal owned by correct player '+index);
    press(index,12);assert(!g.portals.some(d=>d.owner===p.id),'Fresh D-pad Up closes storage '+index);
    press(index,4);let actor=l.practice.players.find(a=>a.id===p.id);assert(!actor.dashTime,'Left shoulder does not dash '+index);
    pads[index].axes[0]=1;set(index,5,true);const right=tick();actor=l.practice.players.find(a=>a.id===p.id);
    assert(right[p.device].dodge&&!right[p.device].potion&&actor.dashTime>0,'Right shoulder dashes without consuming potion '+index);
    set(index,5,false);pads[index].axes[0]=0;tick();
   }
   ctx.renderRoster();assert(document.querySelectorAll('#roster .roster-card').length===2,'Both joined nameplates remain visible');
   ctx.show('play');assert(document.querySelector('#roster').parentElement.id==='play','Nameplates transfer to expedition HUD');ctx.show('lobby');assert(document.querySelector('#roster').closest('.lobby-world'),'Nameplates return to lobby without duplication');
   return {checks,physicalControllersTested:false};
  })()`);
  win.setContentSize(1281,850);await new Promise(r=>setTimeout(r,150));win.setContentSize(1280,850);
  await win.webContents.executeJavaScript('window.lobbyJoinContext.renderRoster();window.lobbyJoinContext.playableLobby.draw();');
  await new Promise(r=>setTimeout(r,200));fs.writeFileSync(path.join(out,'lobby-nameplates.png'),(await win.webContents.capturePage()).toPNG());
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...result,rendererErrors:errors},null,2));console.log(JSON.stringify(result));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
