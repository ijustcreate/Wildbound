const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const p=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:150000});process.stdout.write(p.stdout||'');process.stderr.write(p.stderr||'');process.exit(p.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/winter-night',process.env.WILDBOUND_VERIFY_APP?'packaged':'source');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.commandLine.appendSwitch('mute-audio');
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1100,height:780,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message)});
try{const base=process.env.WILDBOUND_VERIFY_APP||root;await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('wildboundBoot.ready');const result=await win.webContents.executeJavaScript(`(async()=>{
 requestAnimationFrame=()=>0;const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
 const {drawNightLight,lightSources}=await import('./src/night-cycle.mjs'),{drawWinterNight,winterLightSources}=await import('./src/winter-night.mjs'),{footprintHit}=await import('./src/world.mjs'),{saveSession,restoreSession}=await import('./src/session.mjs');
 const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m)},assets=new Assets();await assets.load();
 const g=new Game(()=>.5);g.environment='ice';g.seed=42;g.spriteLibrary=assets.library;const hero=g.addPlayer('keyboard','Explorer');g.start();g.openingBoard=false;g.bloom=3;g.time=12;g.enemies=[];g.weather=null;g.visionEnabled=false;g.explored=new Set(Array.from({length:2500},(_,i)=>i));g.onSound=()=>{};g.persist=()=>{};
 const lodge=g.scenery.find(p=>p.kind==='winter_lodge'),lamps=g.scenery.filter(p=>p.kind==='winter_lantern');ok(!!lodge&&lamps.length===4,'Fresh snow world includes lodge and four lanterns');
 ok(footprintHit(lodge,null,800,520,8),'Lodge has a solid footprint');ok(!footprintHit(lodge,null,800,600,8),'Lodge approach is walkable');ok(winterLightSources(g).length===6,'Window and lantern sources join normal light field');
 const saved=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));ok(saved.scenery.some(p=>p.kind==='winter_lodge'),'Scenery survives session restore');
 const canvas=document.createElement('canvas');canvas.style.cssText='width:1100px;height:780px';document.body.append(canvas);const r=new Renderer(canvas,assets);r.camera={x:800,y:585,zoom:.8};
 Object.assign(hero,{x:800,y:735});hero.inventory=[];hero.equipment={};
 for(const [name,elapsed]of [['day',120],['dusk',280],['night',360],['dawn',468]]){g.sky.elapsed=elapsed;g.time+=1;r.camera={x:800,y:585,zoom:.8};r.draw(g,0);images[name]=canvas.toDataURL();}
 g.sky.elapsed=360;g.time+=1;hero.inventory=[{type:'lantern',qty:1}];r.camera={x:800,y:585,zoom:.8};r.draw(g,0);images.carriedLantern=canvas.toDataURL();
 canvas.style.cssText='width:640px;height:420px';r.camera={x:800,y:710,zoom:.7};r.draw(g,0);images.small=canvas.toDataURL();ok(r.actorQueue.some(p=>p.id===lodge.id),'Lodge uses real scenery depth queue');
 const test=document.createElement('canvas');test.width=800;test.height=600;const c=test.getContext('2d'),camera={x:800,y:800,zoom:1};
 const blank=()=>{c.fillStyle='#d8e8ec';c.fillRect(0,0,800,600)};blank();drawNightLight(c,{...g,scenery:[],players:[],sky:{elapsed:360}},camera,800,600,null,{occluded:true});const cold=[...c.getImageData(400,300,1,1).data];ok(cold[2]>cold[0]*1.4&&cold[0]<75,'Unlit snow becomes deep blue at night');
 blank();const unlit=c.getImageData(400,300,1,1).data[0];drawNightLight(c,{...g,sky:{elapsed:120}},camera,800,600,null,{occluded:true});ok(c.getImageData(400,300,1,1).data[0]===unlit,'Daylight stays unchanged');
 blank();drawWinterNight(c,g,camera,800,600,1,[{x:800,y:800,radius:150,intensity:1}],null);const warm=c.getImageData(400,300,1,1).data[0];ok(warm>cold[0]*2,'Local light opens a readable pool in the blue night veil');
 ok(winterLightSources({...g,generatedEnvironment:'forest'}).length===0,'Winter fixtures do not light other biomes');
 return {checks,images,cold,warm};})()`);
for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,failed:0,checks:result.checks,errors,muted:win.webContents.isAudioMuted(),cold:result.cold,warm:result.warm,appPath:base};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(0);
}catch(e){console.error(e.stack);app.exit(1);}});


