const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/ready-icons');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.commandLine.appendSwitch('mute-audio');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1100,height:800,useContentSize:true,webPreferences:{backgroundThrottling:false}}),errors=[],checks=[];
 w.webContents.setAudioMuted(true);w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');
  await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.qaContext=ctx,false)'});
  await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('wildboundBoot.ready');
  await new Promise(r=>setTimeout(r,1000));
  await w.webContents.executeJavaScript(`(async()=>{const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);qaContext.show('lobby');})()`);
  for(const [name,width,height] of [['xbox',1100,800],['switch',1100,800],['keyboard',1100,800],['mixed',1100,800],['compact',480,600]]){
   w.setContentSize(width,height);
   await w.webContents.executeJavaScript(`(()=>{
    const {game:g,playableLobby:l}=qaContext;l.closeBoardReadyMenu();g.players=[];l.reset();
    const family='${name}'==='switch'?'switch':'xbox';
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{id:family==='switch'?'Nintendo Switch Pro Controller':'Xbox Wireless Controller',index:0,mapping:'standard'}]});
    for(const device of ('${name}'==='mixed'?['keyboard','pad:0']:['${name}'==='keyboard'?'keyboard':'pad:0'])){
     const p=g.addPlayer(device,'DAD');p.profileId='icon-qa-'+p.id;
    }
    l.sync();for(const p of g.players){Object.assign(l.state.members.get(p.id),{spawned:true,panel:null});l.close(p);}
    l.openBoardReadyMenu(g.players[0]);l.syncBoardReadyMenu();document.querySelector('.lobby-landing').hidden=true;
    const panel=l.boardReadyNode,icons=[...panel.querySelectorAll('.controller-glyph')];
    if(icons.length!==('${name}'==='keyboard'?0:4))throw Error('Incorrect icon count');
    if(!panel.querySelector('.board-ready-confirm').getAttribute('aria-label').includes('${name}'==='keyboard'||'${name}'==='mixed'?'Enter':'A button'))throw Error('Missing accessible confirm label');
    for(const icon of icons){const pixels=icon.getContext('2d').getImageData(0,0,64,64).data;if(!pixels.some(v=>v))throw Error('Empty button badge');}
   })()`);
   await new Promise(r=>setTimeout(r,150));
   const bounds=await w.webContents.executeJavaScript(`(()=>{const p=qaContext.playableLobby.boardReadyNode,b=p.getBoundingClientRect();for(const e of p.querySelectorAll('.board-ready-actions button,.board-ready-help')){const r=e.getBoundingClientRect();if(r.left<b.left||r.right>b.right+1||r.bottom>b.bottom+1)throw Error('Prompt overflows panel');}return b.toJSON();})()`);
   fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage({x:Math.max(0,Math.floor(bounds.x)),y:Math.max(0,Math.floor(bounds.y)),width:Math.ceil(bounds.width),height:Math.ceil(bounds.height)})).toPNG());
   checks.push(name+' renders badges, accessible labels and contained prompts');
  }
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,muted:w.webContents.isAudioMuted()},null,2));console.log(JSON.stringify({checks,errors}));app.exit(0);
 }catch(e){console.error(e,errors);app.exit(1);}
});
