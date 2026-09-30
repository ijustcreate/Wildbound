const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'salvage-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{offscreen:true,backgroundThrottling:false}});await win.loadFile(path.join(root,'index.html'));
await win.webContents.executeJavaScript(`(async()=>{
 const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{drawPlayer,playerAction}=await import('./src/player-motion.mjs');
 const host=document.createElement('div');host.style='position:fixed;inset:0;background:#182820;z-index:999999';document.body.append(host);
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.persist=()=>{};g.loot=[];p.inventory=[{type:'moon_blade',qty:1,sockets:['starheart']}];p.x=600;p.y=600;g.openInventory(p);
 const ui=new HeroUI(host);ui.draw(g,{});const b=host.querySelector('[data-action="salvage-hold"]');if(!b||b.disabled)throw Error('Salvage unavailable');
 b.onkeydown({code:'Space',preventDefault(){},stopPropagation(){}});
 for(let i=0;i<14;i++){g.tickAdventure(.05,{keyboard:{}});ui.draw(g,{});}
 if(host.querySelector('[data-action="salvage-hold"]')!==b)throw Error('Hold button replaced during progress');
 const ring=b.querySelector('.salvage-ring');if(+ring.getAttribute('aria-valuenow')<40)throw Error('Ring failed to fill');if(playerAction(p)!=='salvage')throw Error('Animation not active');
 b.scrollIntoView({block:'center'});
 const canvas=document.createElement('canvas');canvas.width=600;canvas.height=420;canvas.style='position:absolute;left:480px;top:90px;background:#253a32';host.append(canvas);const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#eddcaa';c.font='20px sans-serif';c.fillText('Salvage · working pose and hand particles',20,35);c.save();c.translate(290,365);c.scale(8,8);drawPlayer(c,{...p,faceX:0,faceY:1},g.time);c.restore();
 window.salvageCheck={g,p,ui,host,b};
})()`);
await win.webContents.executeJavaScript('new Promise(resolve=>setTimeout(resolve,300))');fs.writeFileSync(path.join(out,'salvage-hold.png'),(await win.webContents.capturePage()).toPNG());
await win.webContents.executeJavaScript(`(()=>{const {g,p,ui,host}=window.salvageCheck;for(let i=0;i<13;i++){g.tickAdventure(.05,{keyboard:{}});ui.draw(g,{});}if(g.loot.length!==3||p.inventory.some(Boolean))throw Error('Salvage did not finish');if(!g.loot.every(l=>l.manualPickup))throw Error('Drops auto-collect');if(!p.salvageFinish)throw Error('Completion animation missing');})()`);
console.log('Salvage hold ring, stable button, animation, hand particles, completion and manual drops passed');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
