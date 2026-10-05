const {app,BrowserWindow}=require('electron'),path=require('node:path');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/house-worlds-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 const button=[...document.querySelectorAll('button')].find(b=>b.textContent==='House worlds mode: Off');
 if(!button)throw Error('Mode button missing');button.click();if(button.getAttribute('aria-pressed')!=='true')throw Error('Toggle failed');button.click();
 const {Game}=await import('./src/core.mjs');const {travelHouseWorlds}=await import('./src/house-worlds.mjs');
 const g=new Game();g.addPlayer('keyboard');g.environment='house';g.start();g.houseWorldsEnabled=true;g.random=()=>.7;travelHouseWorlds(g,5);if(g.generatedEnvironment!=='ice')throw Error('Travel failed');travelHouseWorlds(g,8);if(g.generatedEnvironment!=='house')throw Error('Return failed');return 'Electron boot, mode toggle and house/ice return passed';})()`));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
