const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/bayou-upgrade',process.env.BAYOU_STAGE||'after');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:820,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(process.env.WILDBOUND_APP_ROOT||root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.style.cssText='width:1280px;height:800px';document.body.append(canvas);
   const r=new Renderer(canvas,assets),g=new Game(()=>.5,{deferWorld:true});g.seed=75;g.environment='swamp';const p=g.addPlayer('keyboard','Bayou review');g.start();g.openingBoard=false;g.bloom=3;g.time=30;g.weather=null;g.spriteLibrary=assets.library;g.explored=new Set();for(let y=0;y<50;y++)for(let x=0;x<50;x++)g.explored.add(x+','+y);
   const images={},checks=[],capture=(label,x,y,zoom=1.2,night=false)=>{Object.assign(p,{x,y:label.startsWith('shrine')?y+85:y,hp:100});g.sky.elapsed=night?320:100;r.camera={x,y,zoom};r.draw(g,0);images[label]=canvas.toDataURL();};
   capture('arrival',800,800);capture('channel',1160,670);capture('outer-islands',520,430);capture('night',1160,670,1.2,true);capture('overview',800,800,.72);
   const landmark=g.scenery.find(s=>s.kind==='bayou_shrine');if(landmark){capture('shrine',landmark.x,landmark.rootY-30,1.1);capture('shrine-night',landmark.x,landmark.rootY-30,1.1,true);}
   const bridge=g.terrain.findIndex(t=>t==='bridge');if(bridge>=0)capture('crossing',bridge%50*32+16,Math.floor(bridge/50)*32+16,1.2);
   const t=g.time;capture('motion-a',1160,670);g.time=t+1.1;capture('motion-b',1160,670);checks.push({name:'rendered live bayou views',passed:true});
   checks.push({name:'tree variants',passed:g.scenery.filter(s=>s.treeVariantSeed!==undefined).length>5});
   checks.push({name:'landmarks',passed:g.scenery.some(s=>s.kind==='bayou_shrine')});
   for(const s of g.scenery.filter(s=>s.kind.startsWith('bayou_')&&s.kind!=='bayou_lily'))checks.push({name:'finite landmark '+s.kind,passed:Number.isFinite(s.x+s.rootY)});
   return {images,checks,scenery:g.scenery.length,trees:g.scenery.filter(s=>['old_cypress','mangrove'].includes(s.kind)).length};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  const {PNG}=require('pngjs'),a=PNG.sync.read(fs.readFileSync(path.join(out,'motion-a.png'))),b=PNG.sync.read(fs.readFileSync(path.join(out,'motion-b.png')));let changed=0;for(let i=0;i<a.data.length;i+=4)if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2])changed++;result.checks.push({name:'live animation changes pixels',passed:changed>100,changedPixels:changed});
  result.errors=errors;result.failed=result.checks.filter(c=>!c.passed).length+errors.length;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));win.destroy();app.exit(process.env.BAYOU_STAGE==='before'?0:result.failed?1:0);
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
