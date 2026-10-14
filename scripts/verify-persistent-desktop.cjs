const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {ServerTransport}=require('../server-transport.cjs');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.setPath('userData',path.join(root,'test-output','persistent-desktop-profile'));
let server;
const windows=[],transports=new Map(),errors=[],saves=[];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw Error(message);};
const run=(w,code)=>w.webContents.executeJavaScript(code);
async function wait(w,expression,message,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){if(await run(w,expression))return;await delay(100);}throw Error(message+': '+JSON.stringify(await run(w,'({boot:window.wildboundBoot?.error,loader:document.querySelector("#loading p")?.textContent})')));}
app.whenReady().then(async()=>{
  let directory;
  try{
    directory=await fs.mkdtemp(path.join(os.tmpdir(),'wildbound-electron-server-'));
    const {createPersistentServer}=await import('../server/runtime.mjs');
    const config={bind:'127.0.0.1',port:0,adminHost:'127.0.0.1',adminPort:0,joinToken:'b'.repeat(64),adminToken:'a'.repeat(64),seed:17,maxPlayers:6,publicAddress:'',savePath:path.join(directory,'world.json')};
    server=await createPersistentServer(config);
    const rigs=JSON.parse(await fs.readFile(path.join(base,'authored','rigs.json'),'utf8'));
    for(const channel of ['profiles-load','session-load','house-designs-load'])ipcMain.handle(channel,()=>null);
    ipcMain.handle('project-rigs-load',()=>rigs);
    for(const channel of ['profiles-save','session-save','house-designs-save','project-rigs-save'])ipcMain.handle(channel,(e,data)=>{saves.push({sender:e.sender.id,channel,data});return true;});
    ipcMain.handle('controller-claim',()=>true);ipcMain.handle('controller-release',()=>true);ipcMain.handle('fullscreen',()=>false);
    ipcMain.handle('room-stop',()=>true);
    ipcMain.handle('server-connect',(e,...args)=>{const transport=transports.get(e.sender.id);return transport.connect(...args);});
    ipcMain.handle('server-disconnect',e=>{transports.get(e.sender.id)?.stop();return true;});
    ipcMain.on('server-send',(e,data)=>transports.get(e.sender.id)?.send(data));
    const results=[];
    for(let index=0;index<2;index++){
      const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{preload:path.join(base,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,additionalArguments:['--wildbound-test']}});
      windows.push(w);w.webContents.setAudioMuted(true);
      w.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push({window:index,message});});
      transports.set(w.webContents.id,new ServerTransport(data=>{if(!w.isDestroyed())w.webContents.send('server-event',data);}));
      await w.loadFile(path.join(base,'index.html'));
      await wait(w,'!!window.wildboundServerTest?.inspect().ready','Desktop did not reach the lobby',60000);
      results.push({name:`Client ${index+1} booted full module graph`,pass:true});
      await run(w,`document.getElementById('server-address').value=${JSON.stringify(`ws://127.0.0.1:${server.gamePort}/game`)};document.getElementById('server-name').value=${JSON.stringify('Electron'+index)};document.getElementById('server-key').value=${JSON.stringify(config.joinToken)};document.getElementById('server-join').click();`);
      await wait(w,"window.wildboundServerTest.inspect().connection==='connected'&&window.wildboundServerTest.inspect().screen==='play'",'Shared forest did not connect');
      assert(await run(w,"!document.getElementById('server-connection').hidden"),'Connection banner missing');
    }
    const clientStates=await Promise.all(windows.map(w=>run(w,'window.wildboundServerTest.inspect()')));
    assert(server.status().playerCount===2,'Both desktop clients must connect: '+JSON.stringify({status:server.status(),clients:clientStates.map(c=>({connection:c.connection,role:c.role,errors:c.errors}))}));
    server.game.openingBoard=false;
    const a=await run(windows[0],'window.wildboundServerTest.inspect()'),b=await run(windows[1],'window.wildboundServerTest.inspect()');
    assert(a.playerId!==b.playerId,'Desktop clients must own different explorers');
    await run(windows[0],"window.wildboundServerTest.action('openInventory')");
    await wait(windows[0],"window.wildboundServerTest.inspect().players.some(p=>p.id===window.wildboundServerTest.inspect().playerId&&p.ui)",'Inventory failed to open');
    await wait(windows[0],"!!document.querySelector('#hero-overlays .hero-panel')",'Inventory panel missing');
    await run(windows[1],"window.wildboundServerTest.action('openInventory')");
    await wait(windows[1],"!!document.querySelector('#hero-overlays .hero-panel')",'Second explorer inventory missing');
    for(const w of windows)assert(await run(w,"document.querySelectorAll('#hero-overlays .hero-panel').length===1"),'A client displayed another explorer’s inventory panel');
    await run(windows[1],"window.wildboundServerTest.action('inventoryAction','close')");
    const {give}=await import('../src/items.mjs');
    give(server.game.players.find(p=>p.id===a.playerId).inventory,'sword',1);
    await wait(windows[0],"!!window.wildboundServerTest.inspect().players.find(p=>p.id===window.wildboundServerTest.inspect().playerId).inventory.find(item=>item?.type==='sword')",'Server item did not reach inventory');
    const swordIndex=server.game.players.find(p=>p.id===a.playerId).inventory.findIndex(item=>item?.type==='sword');
    await run(windows[0],`window.wildboundServerTest.action('inventoryAction','select:${swordIndex}')`);
    await run(windows[0],"window.wildboundServerTest.action('inventoryAction','equip')");
    await wait(windows[0],"window.wildboundServerTest.inspect().players.find(p=>p.id===window.wildboundServerTest.inspect().playerId).equipment.hand1==='sword'",'Equipping did not update the authoritative inventory');
    await run(windows[0],"window.wildboundServerTest.action('inventoryAction','panel:gear')");
    await delay(250);
    for(const [width,height]of [[1280,850],[780,600]]){
      windows[0].setSize(width,height);await delay(300);
      const shot=await windows[0].webContents.capturePage();
      await fs.mkdir(path.join(root,'test-output'),{recursive:true});
      await fs.writeFile(path.join(root,'test-output',`persistent-inventory-${width}.png`),shot.toPNG());
    }
    for(const [name,family]of [['Xbox Wireless Controller','xbox'],['Nintendo Switch Pro Controller','switch']]){
      await run(windows[0],`(()=>{window.testServerPad={index:0,id:${JSON.stringify(name)},mapping:'standard',connected:true,axes:[.5,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.testServerPad]});Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});return true;})()`);
      await wait(windows[0],`window.wildboundServerTest.inspect().players.find(p=>p.id===window.wildboundServerTest.inspect().playerId).controllerFamily===${JSON.stringify(family)}`,'Controller family failed to reach the owning server explorer');
      await run(windows[0],"window.testServerPad.axes=[0,0,0,0]");
      await delay(200);
      assert(await run(windows[0],"document.querySelector('#hero-overlays .hero-panel').dataset.ownerDevice==='pad:0'"),'Controller does not own its panel');
    }
    await run(windows[0],"Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]})");
    results.push({name:'Owned panels, occupied/empty slots, and simulated Xbox/Nintendo controller families',pass:true});
    await run(windows[0],"window.wildboundServerTest.action('inventoryAction','close')");
    await wait(windows[0],"!window.wildboundServerTest.inspect().players.find(p=>p.id===window.wildboundServerTest.inspect().playerId).ui",'Inventory did not close');
    const own=server.game.players.find(p=>p.id===a.playerId),before=own.x;
    await run(windows[0],"document.activeElement?.blur();window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',code:'KeyD',bubbles:true}));");await delay(600);
    await run(windows[0],"window.dispatchEvent(new KeyboardEvent('keyup',{key:'d',code:'KeyD',bubbles:true}));");await delay(250);
    assert(own.x>before,'Keyboard input did not move authoritative explorer');
    await wait(windows[1],`window.wildboundServerTest.inspect().players.find(p=>p.id===${a.playerId}).x>${before}`,'Second desktop client did not receive movement');
    results.push({name:'Two desktop clients share authoritative input and inventory UI',pass:true});
    const transport=transports.get(windows[0].webContents.id);transport.socket.terminate();
    await wait(windows[0],"window.wildboundServerTest.inspect().connection==='reconnecting'",'Reconnect state missing');
    await wait(windows[0],"window.wildboundServerTest.inspect().connection==='connected'",'Desktop reconnect failed');
    assert((await run(windows[0],'window.wildboundServerTest.inspect().playerId'))===a.playerId,'Reconnect replaced the explorer');
    await run(windows[0],"window.wildboundServerTest.action('openForestPassage')");
    await delay(200);assert(server.game.portals.some(d=>d.forestTravel==='outbound'),'Heartwood Passage was not opened by server');
    results.push({name:'Reconnect restores identity; Heartwood Passage opens on server',pass:true});
    assert(saves.every(save=>!save.data?.state?.players?.some(p=>p.device?.startsWith('server:'))),'Server progress was written into local expedition');
    for(const w of windows){const state=await run(w,'window.wildboundServerTest.inspect()');assert(!state.errors.length,'Renderer errors: '+JSON.stringify(state.errors));}
    assert(!errors.length,'Electron console errors: '+JSON.stringify(errors));
    await run(windows[0],"document.querySelector('#server-connection button').click()");
    await wait(windows[0],"window.wildboundServerTest.inspect().role===null&&window.wildboundServerTest.inspect().screen==='lobby'",'Leave server failed');
    results.push({name:'Leave server preserves local profile; no renderer exceptions',pass:true});
    const report={failed:0,base,results};await fs.writeFile(path.join(root,'test-output','persistent-desktop.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
    for(const transport of transports.values())transport.stop();
    for(const w of windows)w.destroy();await server.close();await fs.rm(directory,{recursive:true,force:true});app.exit(0);
  }catch(error){
    console.error(error.stack||error);
    await fs.mkdir(path.join(root,'test-output'),{recursive:true});
    await fs.writeFile(path.join(root,'test-output','persistent-desktop.json'),JSON.stringify({failed:1,error:error.stack,errors},null,2));
    for(const transport of transports.values())transport.stop();for(const w of windows)if(!w.isDestroyed())w.destroy();
    if(server)await server.close().catch(()=>{});app.exit(1);
  }
});
