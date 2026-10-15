const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/boundless-world');fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:980,webPreferences:{offscreen:true}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});try{
 await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await w.webContents.executeJavaScript(`(async()=>{
 const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{Assets}=await import('./src/assets.mjs'),{drawProp}=await import('./src/environment.mjs'),{boundlessRegionPlan,boundlessCacheSize}=await import('./src/boundless-generation.mjs'),{updateBoundlessWorld,boundlessTerrainAt,boundlessBiomeAt}=await import('./src/boundless-world.mjs'),{saveSession,restoreSession}=await import('./src/session.mjs');
 const assert=(v,m)=>{if(!v)throw Error(m)},assets=new Assets();await assets.load();const pictures={},checks=[];
 const runtime=document.createElement('canvas');runtime.style.cssText='position:fixed;inset:0;width:1280px;height:900px;z-index:99998';document.body.append(runtime);const renderer=new Renderer(runtime,assets);
 for(const env of ['forest','desert','ice','temple','beach','graveyard','house']){
  const g=new Game(()=>.5,{deferWorld:true});g.seed=75;g.mapMode='boundless';g.environment=env;const p=g.addPlayer('keyboard','Boundless QA');g.start();g.openingBoard=false;g.bloom=1;g.time=30;g.weather={type:'clear'};g.spriteLibrary=assets.library;g.boundlessSpawnTimer=9999;g.onSound=()=>{};g.persist=()=>{};
  for(const [name,x,y]of [['positive',2400,800],['negative',-800,800],['far',8800,-800],['seam',1600,800]]){
   p.x=x;p.y=y;for(let n=0;n<12;n++)updateBoundlessWorld(g,.01);assert(boundlessBiomeAt(g,x,y)===env,'Mixed destination '+env+'/'+name);
   g.explored=new Set();for(let ty=Math.floor(y/32)-35;ty<Math.floor(y/32)+35;ty++)for(let tx=Math.floor(x/32)-35;tx<Math.floor(x/32)+35;tx++)g.explored.add(tx+','+ty);
   const c=document.createElement('canvas');c.width=960;c.height=640;const pen=c.getContext('2d');pen.imageSmoothingEnabled=false;const zoom=.65;renderer.camera={x,y,zoom};pen.translate(c.width/2-x*zoom,c.height/2-y*zoom);pen.scale(zoom,zoom);renderer.floor(pen,c.width,c.height,g);
   const image=pen.getImageData(0,0,c.width,c.height);let transparent=0,gray=0;for(let i=0;i<image.data.length;i+=4){if(!image.data[i+3])transparent++;if(image.data[i]===136&&image.data[i+1]===138&&image.data[i+2]===142)gray++;}assert(transparent===0,'Missing ground '+env+'/'+name+'/'+transparent);assert(gray===0,'Reveal erases outer ground '+env+'/'+name+'/'+gray);
   for(const prop of g.scenery.filter(s=>Math.abs(s.x-x)<1100&&Math.abs((s.rootY??s.y)-y)<750).sort((a,b)=>(a.rootY??a.y)-(b.rootY??b.y)))drawProp(pen,prop,g.time,g);
   pictures[env+'-'+name]=c.toDataURL();assert(boundlessCacheSize(g)<=64,'Terrain cache grows');checks.push(env+'/'+name);
  }
  // A complete renderer view as well as isolated floor probes.
  p.x=2400;p.y=800;for(let n=0;n<12;n++)updateBoundlessWorld(g,.01);renderer.camera={x:p.x,y:p.y,zoom:.7};renderer.draw(g,0);pictures[env+'-runtime']=runtime.toDataURL();
  const saved=JSON.parse(JSON.stringify(saveSession(g))),r=restoreSession(saved);assert(r.generatedEnvironment===env&&r.mapMode==='boundless','Save changed map');assert(boundlessTerrainAt(r,-73,87)===boundlessTerrainAt(g,-73,87),'Save changed distant geography');
  if(env==='beach'||env==='graveyard'){
   const map=document.createElement('canvas');map.width=880;map.height=720;const ctx=map.getContext('2d'),left=env==='beach'?-3600:-1600,top=env==='beach'?-1800:-1600,width=env==='beach'?8800:6400,height=env==='beach'?7200:6400,colors={grass:env==='graveyard'?'#354b43':'#53784e',mud:'#514b41',sand:'#dfc897',shallow:'#80cbbf',water:'#216f87',path:'#9b9583',wood:'#997450',bridge:'#997450'};
   for(let py=0;py<720;py+=4)for(let px=0;px<880;px+=4){const x=left+(px+2)/880*width,y=top+(py+2)/720*height,kind=boundlessTerrainAt(g,Math.floor(x/32),Math.floor(y/32));ctx.fillStyle=colors[kind]||'#66794f';ctx.fillRect(px,py,4,4);}
   if(env==='graveyard')for(let cy=-1;cy<3;cy++)for(let cx=-1;cx<3;cx++){const plan=boundlessRegionPlan(g,cx,cy),worlds=plan.cemetery?.plots||g.graveyard.plots.filter(q=>!q.boundlessRegion);ctx.fillStyle='#d2cbb3';for(const plot of worlds){const x=(cx===0&&cy===0?plot.stoneX:plot.stoneX+cx*1600+plan.featureOffset.x),y=(cx===0&&cy===0?plot.stoneY:plot.stoneY+cy*1600+plan.featureOffset.y);ctx.fillRect((x-left)/width*880,(y-top)/height*720,3,3);}}
   ctx.fillStyle='#ffe2a0';ctx.fillRect((800-left)/width*880-3,(800-top)/height*720-3,6,6);pictures[env+'-overview']=map.toDataURL();
  }
 }
 return {checks,pictures,muted:true};
 })()`);
 for(const [name,url]of Object.entries(result.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
 if(errors.length)throw Error(errors.join('\n'));const report={checks:result.checks,groundViews:result.checks.length,runtimeViews:7,saveDestinations:7,muted:true,errors};fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));w.destroy();app.quit();
}catch(e){console.error(e);if(errors.length)console.error(errors.join('\n'));w.destroy();app.exit(1);}});
