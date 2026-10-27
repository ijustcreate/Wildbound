const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','storage-ui-layout');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const deadline=setTimeout(()=>app.exit(1),90000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1000,height:720,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.setAudioMuted(true);w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
  await w.webContents.executeJavaScript('(async()=>{await window.wildboundBoot.ready;window.requestAnimationFrame=()=>0;})()');
  const report=await w.webContents.executeJavaScript(`(async()=>{
   const [{Game},{Assets},{HeroUI}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/hero-ui.mjs')]);
   const check=(ok,message)=>{if(!ok)throw Error(message);};
   const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
   const host=document.createElement('div');host.id='hero-overlays';host.style.cssText='position:fixed!important;inset:0!important;z-index:99999';document.body.append(host);
   const assets=new Assets();await assets.load();const ui=new HeroUI(host),g=new Game(()=>.5),p=g.addPlayer('keyboard','April');g.start();g.openingBoard=false;
   g.portal(p);const door=g.portals[0];p.x=door.x;p.y=door.y;g.enterRoom(p,door);ui.draw(g,assets);ui.draw(g,assets);
   const room=ui.panels.get(p.id),close=room.querySelector('[data-action=close]'),canvas=room.querySelector('canvas.room-view'),roomButtons=[...room.querySelectorAll(':scope > button:not([data-action=close])')];
   check(getComputedStyle(close).position==='absolute','Private storage close button is out of the content flow');
   check(roomButtons.length===5&&roomButtons.every(b=>b.getBoundingClientRect().height<=38),'Private storage station buttons have compact fixed heights: '+room.className+' / '+roomButtons.map(b=>getComputedStyle(b).height).join(','));
   check(canvas.getBoundingClientRect().height<=206&&canvas.getBoundingClientRect().height>=120,'Private storage preview uses a viewport-fitted height');
   check(roomButtons.every(b=>b.getBoundingClientRect().bottom<=room.getBoundingClientRect().bottom+1),'Every private storage station button fits in its panel');
   const roomReport={panel:rect(room),canvas:rect(canvas),buttons:roomButtons.map(rect)};
   room.remove();host.remove();
   const host2=document.createElement('div');host2.id='hero-overlays';host2.style.cssText='position:fixed!important;inset:0!important;z-index:99999';document.body.append(host2);
   p.room=null;g.portals=[];g.victoryRewards=[{type:'safari_pith_helmet',qty:1},{type:'potion',qty:2},{type:'sword',qty:1},{type:'hat',qty:1},{type:'boots',qty:1}];g.expeditionDebrief={cleared:4,skipped:5,score:4};g.openInventory(p,'victory');
   const victoryUi=new HeroUI(host2);victoryUi.draw(g,assets);victoryUi.draw(g,assets);const panel=victoryUi.panels.get(p.id),area=panel.querySelector('.storage-containers'),card=panel.querySelector('.storage-container'),slots=panel.querySelector('.storage-slots'),footer=panel.querySelector('.chest-menu-footer');
   check(card.getBoundingClientRect().height>=area.getBoundingClientRect().height-2,'Victory chest contents stretch into the available panel height: '+panel.className+' / '+card.getBoundingClientRect().height+' / '+area.getBoundingClientRect().height+' / '+getComputedStyle(area).height);
   check(slots.getBoundingClientRect().height>=150,'Victory chest slots are large enough to read and select');
   check(footer.getBoundingClientRect().bottom<=panel.getBoundingClientRect().bottom+1,'Victory loot and restart controls stay inside the panel');
   return {room:roomReport,victory:{panel:rect(panel),contents:rect(card),slots:rect(slots),footer:rect(footer)}};
  })()`);
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,errors},null,2));
  console.log(JSON.stringify({...report,errors}));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e);if(errors.length)console.error(errors.join('\n'));clearTimeout(deadline);app.exit(1);}
});
