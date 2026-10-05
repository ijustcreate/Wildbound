const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/ritual-loot-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1100,height:900,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 const {Game}=await import('./src/core.mjs');const {HeroUI}=await import('./src/hero-ui.mjs');const {Assets}=await import('./src/assets.mjs');
 const assets=new Assets();await assets.load();const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();
 const root=document.createElement('div');root.style.cssText='position:fixed;inset:0;z-index:999999;background:#13271f';document.body.append(root);
 const ui=new HeroUI(root);g.victoryRewards=[{type:'sword',qty:1},{type:'potion',qty:3}];g.openInventory(p,'victory');ui.draw(g,assets);
 if(!root.querySelector('.loot-popup')||root.querySelector('.paper-doll'))throw Error('Loot is not separate');
 if(root.querySelectorAll('.loot-rows button').length!==2)throw Error('Loot rows missing');
 return 'Electron boot and separate victory loot layout passed';})()`));
 await new Promise(r=>setTimeout(r,500));fs.writeFileSync(path.join(root,'test-output/ritual-loot.png'),(await w.webContents.capturePage()).toPNG());app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
