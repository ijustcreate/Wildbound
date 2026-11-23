const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const child=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:120000});if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);process.exit(child.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/house-living');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'isolated-profile'));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),110000);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];w.webContents.setAudioMuted(true);w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
try{await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');const result=await w.webContents.executeJavaScript(`(async()=>{
 window.requestAnimationFrame=()=>0;
 const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{generateWorld}=await import('./src/world.mjs');
 const {interactHouseLiving,tickHouseLiving,houseLivingTarget}=await import('./src/house-living.mjs'),{drawFurniture}=await import('./src/house-render.mjs'),{drawHouseAppliances}=await import('./src/house-living.mjs'),{surfaceAction}=await import('./src/house-surfaces.mjs');
 const {houseLightSources}=await import('./src/house-lights.mjs');
 const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const assets=new Assets();await assets.load();const g=new Game(()=>.5),p=g.addPlayer('keyboard','House QA');g.start();Object.assign(g,generateWorld(42,'house'),{seed:42,environment:'house',generatedEnvironment:'house',phase:'play',openingBoard:false,bloom:3,event:null,weather:null,enemies:[]});g.persist=()=>{};g.onSound=()=>{};g.spriteLibrary=assets.library;
 const canvas=document.createElement('canvas');canvas.style.cssText='width:1280px;height:850px';document.body.replaceChildren(canvas);const r=new Renderer(canvas,assets);
 const stove=g.house.furniture.find(f=>f.kind==='stove'),sink=g.house.furniture.find(f=>f.kind==='sink'),bed=g.house.furniture.find(f=>f.kind==='bed');
 const tap=f=>{Object.assign(p,{x:f.kind==='bed'?f.x-24:f.x+f.w/2,y:f.kind==='bed'?f.y+50:f.y+f.h+18});g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{}});};
 tap(stove);ok(stove.applianceOn===true,'actual Interact turns stove on');ok(houseLightSources(g).some(s=>s.color==='#ffb66b'),'burner state emits warm light');tap(sink);ok(sink.applianceOn===true,'actual Interact turns tap on');for(let i=0;i<100;i++)g.update(.05,{keyboard:{}});ok(sink.waterLevel===1,'sink fills and stops at full');
 const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=460;const c=sheet.getContext('2d');c.fillStyle='#454d3b';c.fillRect(0,0,1000,460);
 for(const [i,on]of [false,true].entries()){
  c.save();c.translate(95+i*480,120);c.scale(4,4);for(const [j,f]of [stove,sink].entries()){const shown={...f,x:j*64,y:0,applianceOn:on,waterLevel:on?1:0};drawFurniture(c,shown,{house:{furniture:[shown]}});drawHouseAppliances(c,{house:{furniture:[shown]},players:[],time:1.2});}c.restore();
 }
 images.appliances=sheet.toDataURL();
 Object.assign(p,{x:bed.x-24,y:bed.y+50,hp:20,maxHp:100});tap(bed);ok(p.bedRest&&p.sleeping>0,'bed Interact starts rest');for(let i=0;i<40;i++)g.update(.05,{keyboard:{}});ok(p.hp>=51&&p.hp<=55,'bed heals about 32 percent in two seconds');
 r.camera={x:bed.x+bed.w/2,y:bed.y+45,zoom:3};r.draw(g,0);images.sleep=canvas.toDataURL();g.update(.05,{keyboard:{jump:true}});ok(!p.bedRest&&p.jumpHeight>0,'jump wakes and jumps in actual update');r.draw(g,0);images.wake=canvas.toDataURL();
 Object.assign(p,{x:380,y:630,jumpHeight:0,groundHeight:0});r.camera={x:440,y:640,zoom:1.6};r.draw(g,0);images.yard=canvas.toDataURL();ok(r.grassField.active&&r.grassField.instances>0,'house uses live forest meadow renderer');
 const counter=g.house.furniture.find(f=>f.kind==='counter');p.x=counter.x+counter.w*.78;p.y=counter.y+counter.h*.5;ok(surfaceAction(g,p)===null,'fruit bowl and cutting board have no interaction');
 return {checks,images,grassInstances:r.grassField.instances};})()`);
for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,checks:result.checks,failed:0,errors,muted:w.webContents.isAudioMuted(),grassInstances:result.grassInstances};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
}catch(e){console.error(e.stack,errors);clearTimeout(deadline);app.exit(1);}});
