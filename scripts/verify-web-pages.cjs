const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),pages=path.join(root,'dist/pages-publish'),out=path.join(root,'test-output/web-pages');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const server=http.createServer((req,res)=>{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let file=path.resolve(pages,'.'+relative);
 if(!file.startsWith(pages+path.sep)&&file!==pages){res.writeHead(403);return res.end();}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 fs.readFile(file,(error,body)=>{if(error){res.writeHead(404);return res.end('Missing');}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.wav':'audio/wav','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(body);});
});
app.whenReady().then(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`,checks=[],errors=[];
 const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 w.showInactive();
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const ready=async()=>{
  await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  for(let i=0;i<600;i++){if(await w.webContents.executeJavaScript(`document.getElementById('loading')?.classList.contains('done')`)){await new Promise(r=>setTimeout(r,700));return;}await new Promise(r=>setTimeout(r,50));}
  throw Error('Game assets did not finish initializing');
 };
 try{
  await w.loadURL(base+'/');
  assert(await w.webContents.executeJavaScript(`document.querySelector('a[href="latest/"]')&&document.querySelector('a[href="original/"]')`),'Chooser has both play links');
  await w.webContents.executeJavaScript(`localStorage.setItem('wildbound-publish-probe','original sentinel')`);
  await w.loadURL(base+'/latest/');
  for(let i=0;i<200;i++){if(await w.webContents.executeJavaScript(`location.pathname==='/releases/1.2.55/'&&!!window.wildboundBoot`))break;await new Promise(r=>setTimeout(r,50));}
  await ready();
  assert(await w.webContents.executeJavaScript(`!window.wildboundBoot.error&&location.pathname==='/releases/1.2.55/'`),'Latest resolves to ready 1.2.55');
  assert(await w.webContents.executeJavaScript(`localStorage.getItem('wildbound-publish-probe')===null`),'Current cannot read original save keys');
  await w.webContents.executeJavaScript(`localStorage.setItem('wildbound-publish-probe','current sentinel');document.getElementById('nav-workshop').click()`);
  await w.webContents.executeJavaScript('new Promise(r=>setTimeout(r,500))');
  assert(await w.webContents.executeJavaScript(`document.getElementById('workshop').classList.contains('active')`),'Workshop opens');
  fs.writeFileSync(path.join(out,'workshop.png'),(await w.webContents.capturePage()).toPNG());
  await w.webContents.executeJavaScript(`document.getElementById('nav-play').click();document.getElementById('worlds-button').click()`);
  assert(await w.webContents.executeJavaScript(`!!document.querySelector('#worlds-modal:not([hidden]),.worlds-dialog,.worlds-menu')||document.body.innerText.includes('Create & explore')`),'Worlds menu opens');
  const render=await w.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{Assets}=await import('./src/assets.mjs');
   const a=new Assets();await a.load();const g=new Game(()=>.5,{deferWorld:true});g.seed=42;g.addPlayer('keyboard','Web QA');g.start();g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=a.library;
   document.getElementById('worlds-dialog').close();
   const c=document.createElement('canvas');c.width=960;c.height=640;c.style.cssText='position:fixed;inset:0;z-index:99999;width:100vw;height:100vh';document.body.append(c);const r=new Renderer(c,a);for(let i=0;i<8;i++){g.update(1/60,{keyboard:{x:1,y:0}});r.draw(g,0);}return g.players.length===1&&c.width>0;
  })()`);
  assert(render,'Real web gameplay updates and renders');await new Promise(r=>setTimeout(r,250));fs.writeFileSync(path.join(out,'game.png'),(await w.webContents.capturePage()).toPNG());
  await w.loadURL(base+'/releases/1.2.55/');await ready();
  assert(await w.webContents.executeJavaScript(`localStorage.getItem('wildbound-publish-probe')==='current sentinel'`),'Current save survives reload');
  await w.loadURL(base+'/original/');await ready();
  assert(await w.webContents.executeJavaScript(`!window.wildboundBoot.error&&localStorage.getItem('wildbound-publish-probe')==='original sentinel'`),'Original boots and retains historical save');
  fs.writeFileSync(path.join(out,'original.png'),(await w.webContents.capturePage()).toPNG());
  await w.loadURL(base+'/releases/1.0.74/');await ready();
  assert(await w.webContents.executeJavaScript('!window.wildboundBoot.error'),'Previous 1.0.74 archive still boots');
  const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');let preserved=0;
  function compare(relative){for(const e of fs.readdirSync(path.join(pages,relative),{withFileTypes:true})){const p=path.join(relative,e.name);if(e.isDirectory())compare(p);else{assert(digest(path.join(pages,p))===digest(path.join(pages,'original',p)),'Preserved '+p);preserved++;}}}
  for(const folder of ['src','assets','authored'])compare(folder);
  assert(digest(path.join(pages,'app.mjs'))===digest(path.join(pages,'original/app.mjs')),'Original application is unchanged');
  const report={checks:checks.filter(c=>!c.startsWith('Preserved ')),preservedFiles:preserved,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(errors.length?1:0);
 }catch(e){console.error(e);console.error(JSON.stringify({checks,errors}));app.exit(1);}
});
