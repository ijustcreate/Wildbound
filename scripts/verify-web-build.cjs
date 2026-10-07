const {app,BrowserWindow}=require('electron'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version,base=path.resolve(process.argv[2]||path.join(root,'dist','web-'+version));
const out=path.join(root,'test-output','web-'+version);fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const prefix='/Wildbound/releases/'+version+'/',missing=[],mime={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),relative=url.pathname.startsWith(prefix)?decodeURIComponent(url.pathname.slice(prefix.length)):'',file=path.resolve(base,relative||'index.html');
 if(!url.pathname.startsWith(prefix)||!file.startsWith(base+path.sep)){res.writeHead(404);res.end();return;}
 fs.readFile(file,(e,data)=>{if(e){missing.push(url.pathname);res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);});
});
const deadline=setTimeout(()=>app.exit(1),90000);
app.whenReady().then(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+prefix;
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true,nodeIntegration:false,contextIsolation:true}}),errors=[];
 w.webContents.setAudioMuted(true);w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await w.loadURL(url+'?tools=1');await w.webContents.executeJavaScript('(async()=>{await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);return true;})()');
  const report=await w.webContents.executeJavaScript(`(async()=>{
   const checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);},manifest=await (await fetch('./web-build.json')).json();
   check(!window.desktop,'Browser build boots without Electron preload or desktop APIs');check(manifest.version==='${version}'&&document.title.includes('v${version}'),'Visible browser title and manifest have the release version');
   const [{Game},{Assets},{HeroUI},{ITEMS},{restoreSession,saveSession}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/hero-ui.mjs'),import('./src/items.mjs'),import('./src/session.mjs')]);
   const assets=new Assets();await assets.load();check(!!assets.library&&!!assets.animationBank,'Versioned relative paths load sprites and animation library');
   const rigs=await fetch('./authored/rigs.json');check(rigs.ok,'Shared authored rigs are available in the web build');
   const g=new Game(()=>.5),p=g.addPlayer('keyboard','WEB TEST');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');p.x=p.y=400;
   check(!!ITEMS.healing_wand&&!!ITEMS.halo&&!!ITEMS.honeycomb,'New healing and honeycomb gear is present in browser runtime');
   const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:999999;background:#193128';document.body.append(host);const ui=new HeroUI(host);g.openInventory(p);ui.draw(g,assets);ui.draw(g,assets);
   const panel=ui.panels.get(p.id),portrait=panel.querySelector('.equipment-preview'),style=getComputedStyle(portrait);check(style.position==='absolute'&&style.zIndex==='1'&&portrait.getContext('2d').getImageData(0,0,portrait.width,portrait.height).data.some((v,i)=>i%4===3&&v),'Browser inventory character is visible above background with real humanoid pixels');
   check(panel.querySelectorAll('.inventory-window .item-grid button').length===24&&!panel.querySelector('.quiver-slot'),'Browser backpack shows all 24 slots without arrow selector');
   p.ui=null;g.portal(p);const d=g.portals[0];p.x=d.x;p.y=d.y;g.enterRoom(p,d);g.update(.05,{keyboard:{jump:true}});check(p.roomJumpHeight>0,'Browser storage accepts actual jump input');ui.draw(g,assets);check(!!host.querySelector('canvas.room-view'),'Browser storage view renders');g.leaveRoom(p);
   const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));check(restored.players.length===1&&restored.players[0].profileId===p.profileId,'Browser session state remains serializable');
   return {checks,manifest};
  })()`);
  if(errors.length||missing.length)throw Error(JSON.stringify({errors,missing}));fs.writeFileSync(path.join(out,'browser.png'),(await w.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,errors,missing,url,base},null,2));console.log(JSON.stringify({...report,errors,missing}));clearTimeout(deadline);server.close();app.exit(0);
 }catch(e){console.error(e);if(errors.length)console.error(errors.join('\n'));clearTimeout(deadline);server.close();app.exit(1);}
});
