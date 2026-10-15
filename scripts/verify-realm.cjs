const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output','persistent-forest');fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{
  const windows=[],errors=[],checks=[];let server;
  const assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
  const {installRealmDesktop}=require(path.join(base,'realm-desktop.cjs'));
  const folder=fs.mkdtempSync(path.join(out,'server-'));
  installRealmDesktop({ipcMain,app,folder,emit:(data,sender)=>{if(!sender.isDestroyed())sender.send('realm-event',data);}});
  const store=require(path.join(base,'save-store.cjs'));
  ipcMain.handle('project-rigs-load',()=>JSON.parse(fs.readFileSync(path.join(base,'authored','rigs.json'),'utf8')));ipcMain.handle('project-rigs-save',()=>true);
  ipcMain.handle('profiles-load',()=>null);ipcMain.handle('profiles-save',()=>true);
  ipcMain.handle('session-load',()=>null);ipcMain.handle('session-save',()=>true);
  ipcMain.handle('house-designs-load',()=>null);ipcMain.handle('house-designs-save',()=>true);
  ipcMain.handle('room-stop',()=>true);ipcMain.handle('controller-claim',()=>false);
  ipcMain.handle('controller-release',()=>true);ipcMain.handle('fullscreen',()=>false);
  const js=(w,code)=>w.webContents.executeJavaScript(code);
  async function capture(w,name){
    for(let attempt=0;attempt<3;attempt++){
      await new Promise(r=>setTimeout(r,400));
      try{const image=await w.webContents.capturePage();fs.writeFileSync(path.join(out,name),image.toPNG());return;}
      catch(error){if(attempt===2)throw error;const [width,height]=w.getSize();w.setSize(width+1,height+1);}
    }
  }
  try{
    const {startForestServer}=await import(require('node:url').pathToFileURL(path.join(base,'realm-server.mjs')).href);
    server=await startForestServer({folder,port:0,host:'127.0.0.1'});
    server.config.port=server.port;fs.writeFileSync(path.join(folder,'server.json'),JSON.stringify(server.config));
    const address=`127.0.0.1:${server.port}/${server.config.playKey}`;
    for(let i=0;i<2;i++){
      const w=new BrowserWindow({show:false,width:1440,height:940,webPreferences:{offscreen:true,
        partition:'realm-qa-'+i,preload:path.join(base,'preload.cjs'),additionalArguments:['--wildbound-test'],contextIsolation:true,sandbox:true}});
      w.webContents.setAudioMuted(true);windows.push(w);
      w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
      await w.loadFile(path.join(base,'index.html'));await js(w,'window.wildboundBoot.ready');
      assert(await js(w,'!!window.realmTest&&document.getElementById("loading").classList.contains("done")'),'Client '+i+' booted');
      await js(w,`window.realmTest.client.settings=${JSON.stringify({address,creatorKey:server.config.creatorKey,name:'QA Explorer'})};window.realmTest.before=JSON.stringify(window.realmTest.getProfiles());`);
      if(i===0){
        await js(w,'document.querySelector("#party-menu [data-persistent-worlds]").click()');
        assert(await js(w,'document.querySelector(".designer-dialog[open] [aria-selected=true]").textContent==="Servers"'),'Game menu opens Servers tab');
        assert(await js(w,'document.querySelectorAll(".realm-panel button").length>=12'),'Server setup and creator controls mounted');
        await capture(w,'servers-tab.png');
        await js(w,'window.realmTest.getDesigner().dialog.close()');
      }
      await js(w,`window.realmTest.client.join(${i===0})`);
      assert(await js(w,'document.body.dataset.screen==="play"&&window.realmTest.getGame().realm.id==="forest-test"'),'Client '+i+' entered forest through game');
    }
    const [a,b]=windows;
    await new Promise(r=>setTimeout(r,500));
    assert(await js(b,'window.realmTest.getGame().players.length===2'),'Two desktop clients share one forest');
    await js(a,'window.realmTest.client.command("edit",{type:"landmark",name:"Desktop Remembered",x:1190,y:1080})');
    await new Promise(r=>setTimeout(r,250));
    assert(await js(b,'window.realmTest.getGame().realm.landmarks.some(l=>l.name==="Desktop Remembered")'),'Creator landmark reaches second desktop client');
    await js(a,'window.realmTest.client.command("undo")');await new Promise(r=>setTimeout(r,200));
    assert(await js(b,'!window.realmTest.getGame().realm.landmarks.some(l=>l.name==="Desktop Remembered")'),'Undo reaches both clients');
    await js(a,'window.realmTest.client.command("edit",{type:"landmark",name:"Desktop Remembered",x:1190,y:1080})');
    await js(a,'window.realmTest.client.openServers()');a.setSize(1000,700);
    await new Promise(r=>setTimeout(r,200));
    assert(await js(a,'document.querySelector(".realm-panel").getBoundingClientRect().width<=innerWidth'),'Servers editor fits small desktop window');
    await capture(a,'servers-small.png');
    await js(a,'window.realmTest.getDesigner().dialog.close()');a.setSize(1440,940);
    await new Promise(r=>setTimeout(r,400));
    await capture(a,'forest-two-clients.png');
    await server.close();await new Promise(r=>setTimeout(r,150));
    assert(await js(a,'!window.realmTest.client.connected&&window.realmTest.client.active'),'Disconnect freezes network client without starting local simulation');
    server=await startForestServer({folder,port:server.port,host:'127.0.0.1'});
    await js(a,'window.realmTest.client.reconnect()');await js(b,'window.realmTest.client.reconnect()');
    assert(await js(a,'window.realmTest.getGame().realm.landmarks.some(l=>l.name==="Desktop Remembered")'),'Forest edit persists after server restart and reconnect');
    for(const w of windows){await js(w,'window.realmTest.client.leave()');assert(await js(w,'JSON.stringify(window.realmTest.getProfiles())===window.realmTest.before'),'Campaign profiles unchanged after realm visit');
      assert(await js(w,'document.body.dataset.screen==="lobby"&&!window.realmTest.getGame().realm'),'Return Home restores the previous lobby');}
    await server.close();
    const started=await js(a,'window.desktop.realmStart()');
    assert(started.status.id==='forest-test','Desktop setup starts a detached server process');
    const status=await fetch(`http://127.0.0.1:${started.status?server.port:0}/status`).then(r=>r.json());
    assert(status.revision>0,'Detached server loads the saved forest');
    for(const w of windows)w.destroy();
    assert((await fetch(`http://127.0.0.1:${server.port}/status`).then(r=>r.json())).online,'Server remains available after both desktop clients close');
    await fetch(`http://127.0.0.1:${server.port}/stop`,{method:'POST',headers:{'x-creator-key':server.config.creatorKey}});
    assert(errors.length===0,'No renderer errors');
    const report={checks,muted:true,clients:2,errors,base};fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
    await server.close();app.quit();
  }catch(error){console.error(error);console.error({errors,checks});for(const w of windows)if(!w.isDestroyed())w.destroy();if(server)await server.close();app.exit(1);}
});
