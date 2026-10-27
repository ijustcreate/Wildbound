const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,process.env.WILDBOUND_COMPARE_OUTPUT||'test-output/forest-interleaved');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const bases=[process.env.WILDBOUND_COMPARE_OLD||'dist/1.2.56-2026-10-23T17-01-17-223Z/Wildbound-win32-x64/resources/app',process.env.WILDBOUND_COMPARE_NEW||'dist/1.2.57-2026-10-23T18-12-06-286Z/Wildbound-win32-x64/resources/app'].map(p=>path.resolve(root,p)),roots=bases.map(p=>pathToFileURL(p).href);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);if(e.message.startsWith('QA '))console.log(e.message);});try{
 await w.loadFile(path.join(bases[1],'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');w.showInactive();
 await w.webContents.executeJavaScript('window.qaFrame=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;new Promise(window.qaFrame)');
 const report=await w.webContents.executeJavaScript(`(async()=>{
  const roots=${JSON.stringify(roots)},pairs=[];
  for(const base of roots){
   const {Game,EVENTS}=await import(base+'/src/core.mjs'),{Renderer}=await import(base+'/src/render.mjs'),{Assets}=await import(base+'/src/assets.mjs'),{loadProjectRigs}=await import(base+'/src/project-rigs.mjs'),{ITEMS}=await import(base+'/src/items.mjs'),{updateBoundlessWorld}=await import(base+'/src/boundless-world.mjs'),{playerMotion}=await import(base+'/src/player-motion.mjs');
   await loadProjectRigs(EVENTS,ITEMS);const assets=new Assets();await assets.load();const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:1440px;height:900px';document.body.append(c);const r=new Renderer(c,assets);r.setDynamicShadows(true);
   const g=new Game(()=>.5,{deferWorld:true});g.seed=42;g.mapMode='boundless';g.environment='forest';const p=g.addPlayer('keyboard','Comparison');g.start();g.openingBoard=false;g.bloom=3;g.weather=null;g.time=20;g.boundlessSpawnTimer=99999;g.spriteLibrary=assets.library;g.onSound=()=>{};g.persist=()=>{};p.invincible=true;
   pairs.push({g,p,r,c,EVENTS,updateBoundlessWorld,base,rig:playerMotion.locomotionRevision});
  }
  const stats=a=>({mean:a.reduce((s,x)=>s+x,0)/a.length,p95:[...a].sort((a,b)=>a-b)[Math.ceil(a.length*.95)-1],max:Math.max(...a)}),scenes=[];
  for(const [name,x,y,roam,wildlife]of [['clearing',810,890,false,false],['outer-roam',2400,800,true,false],['negative-roam',-800,800,true,false],['stampede',810,890,true,true]]){
   for(const q of pairs){const {g,p,EVENTS,updateBoundlessWorld}=q;p.x=x;p.y=y;for(let i=0;i<180;i++)updateBoundlessWorld(g,1/60);g.explored=new Set();for(let ty=Math.floor(y/32)-30;ty<Math.floor(y/32)+30;ty++)for(let tx=Math.floor(x/32)-30;tx<Math.floor(x/32)+30;tx++)g.explored.add(tx+','+ty);if(wildlife){g.spawnEvent(EVENTS.findIndex(e=>e.name==='Twenty thunders'),{test:true,force:true});g.eventTime=999;}q.samples=[];}
   for(let frame=0;frame<150;frame++){
    await new Promise(window.qaFrame);pairs[frame%2].c.style.zIndex='20';pairs[1-frame%2].c.style.zIndex='19';
    for(const index of frame%2?[1,0]:[0,1]){const q=pairs[index],{g,p,r}=q;const start=performance.now();g.update(1/60,{keyboard:{x:roam?(frame%80<40?1:-1):0,y:0}});r.camera={x,y,zoom:1.05};r.draw(g,0);if(frame>=50)q.samples.push(performance.now()-start);}
   }
   const data=pairs.map(q=>({base:q.base,rig:q.rig,cpuMs:stats(q.samples),grass:q.r.grassField.instances,enemies:q.g.enemies.length,scenery:q.g.scenery.length}));scenes.push({name,data});console.log('QA '+name+' '+JSON.stringify(data));
  }
  return {scenes,method:'Both complete packaged runtimes share one Electron window; adjacent draws alternate order each frame; 50 warm-up and 100 measured frames per scene; no CPU profiler.',size:[pairs[1].c.width,pairs[1].c.height],dpr:devicePixelRatio};
 })()`);
 report.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(errors.length?1:0);
 }catch(e){console.error(e);app.exit(1);}});
