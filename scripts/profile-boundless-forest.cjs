const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','boundless-forest-profile');
fs.mkdirSync(out,{recursive:true});
const draft=process.argv.includes('--pixel-draft');
if(draft){
 const {pathToFileURL}=require('node:url');
 let source=fs.readFileSync(path.join(root,'src/grass-field.mjs'),'utf8');
 source=source.replace("'./forest-landscape.mjs'",JSON.stringify(pathToFileURL(path.join(root,'src/forest-landscape.mjs')).href))
  .replace('forestHash,routeDistance','forestHash,forestNoise,routeDistance')
  .replace('y+=3)for(let x=4;x<1596;x+=3)','y+=18)for(let x=4;x<1596;x+=18)')
  .replace('y+=3)for(let x=-36;x<=36;x+=3)','y+=6)for(let x=-36;x<=36;x+=6)')
  .replace('4+n*5,.7+n*.4','4+n*4,1.8+n*.8')
  .replace('(.9+n*.7)*scale','(2.0+n*.8)*scale')
  .replace('color=mix(low,mid,smoothstep(0.,.6,t));color=mix(color,tip,smoothstep(.65,1.,t)*.7);','color=t<.34?low:t<.82?mid:tip;')
  .replace('color*=variation.y*(.82+patches*.23+valueNoise(root*.071)*.08);','color*=.88+floor(patches*3.)*.09;')
  .replace('Math.min(1800,Math.ceil(w*2)),height=Math.min(1200,Math.ceil(h*2))','Math.min(900,Math.ceil(w/2)),height=Math.min(600,Math.ceil(h/2))')
  .replace('c.save();c.imageSmoothingEnabled=false;c.drawImage(this.canvas',`if(!front){
   if(!this.draftGround){
    this.draftGround=document.createElement('canvas');this.draftGround.width=this.draftGround.height=800;
    const pen=this.draftGround.getContext('2d'),colors=['#46692f','#547735','#62843b','#709247'];
    for(let y=0;y<1600;y+=4)for(let x=0;x<1600;x+=4){
     if(g.terrain[Math.floor(y/32)*50+Math.floor(x/32)]!=='grass'||routeDistance(g.forestLandscape,x,y)<29||clearingDistance(x,y,g.seed)<.97||forestPavingAt(g.forestLandscape,x,y))continue;
     const n=forestNoise(x/110,y/110,g.seed)*.83+forestNoise(x/18,y/18,g.seed+91)*.17;
     pen.fillStyle=colors[Math.min(3,Math.floor(n*4))];pen.fillRect(x/2,y/2,2,2);
    }
   }
   c.save();c.imageSmoothingEnabled=false;c.drawImage(this.draftGround,0,0,1600,1600);c.restore();
  }
  c.save();c.imageSmoothingEnabled=false;c.drawImage(this.canvas`);
 fs.writeFileSync(path.join(out,'grass-draft.mjs'),source);
}
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);const errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);if(e.message.startsWith('PROFILE '))console.log(e.message);});
 try{
  await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');win.showInactive();
  await win.webContents.debugger.attach('1.3');
  await win.webContents.debugger.sendCommand('Profiler.enable');await win.webContents.debugger.sendCommand('Profiler.start');
  const data=await win.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{Assets}=await import('./src/assets.mjs'),{GrassFieldRenderer}=await import('./src/grass-field.mjs'),{updateBoundlessWorld}=await import('./src/boundless-world.mjs');
   console.log('PROFILE imports ready');const assets=new Assets();await assets.load();console.log('PROFILE assets ready');const g=new Game(undefined,{deferWorld:true});g.seed=42;g.mapMode='boundless';g.environment='forest';
   const p=g.addPlayer('keyboard','Forest QA');g.start();console.log('PROFILE game ready');g.openingBoard=false;g.bloom=3;g.time=20;g.weather=null;g.boundlessSpawnTimer=99999;g.spriteLibrary=assets.library;g.onSound=()=>{};g.persist=()=>{};
   const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:1440px;height:900px';document.body.append(canvas);
   const r=new Renderer(canvas,assets);r.grassField=new GrassFieldRenderer();
   const stats=a=>({mean:a.reduce((s,v)=>s+v,0)/a.length,p95:[...a].sort((a,b)=>a-b)[Math.floor(a.length*.95)],max:Math.max(...a)});
   const draft=${draft};const DraftField=draft?(await import('./test-output/boundless-forest-profile/grass-draft.mjs')).GrassFieldRenderer:null;
   const variants=[],images={};let stage={floor:[],grass:[],lights:[],actors:[]};
   const wrap=(o,k,group)=>{const fn=o[k];o[k]=function(...a){const t=performance.now();const v=fn.apply(this,a);stage[group].push(performance.now()-t);return v};return fn;};
   wrap(r,'floor','floor');const grass=wrap(r.grassField,'draw','grass');wrap(r.animator,'draw','actors');
   const stream=[];
   for(const [location,x,y]of [['origin',810,890],['outer',2400,800]]){
    p.x=x;p.y=y;
    for(let i=0;i<12;i++){const t=performance.now();updateBoundlessWorld(g,1/60);stream.push(performance.now()-t);}
    g.explored=new Set();for(let ty=Math.floor(y/32)-35;ty<Math.floor(y/32)+35;ty++)for(let tx=Math.floor(x/32)-35;tx<Math.floor(x/32)+35;tx++)g.explored.add(tx+','+ty);
    for(const variant of (draft?['baseline','pixel-draft','baseline-repeat']:['baseline','no-grass','no-shadows','no-grass-or-shadows'])){
     if(draft){r.grassField.dispose();r.grassField=variant==='pixel-draft'?new DraftField():new GrassFieldRenderer();}
     const drawGrass=Object.getPrototypeOf(r.grassField).draw;
     r.dynamicShadows=!variant.includes('shadows');r.grassField.draw=variant.includes('no-grass')?()=>false:function(...a){const t=performance.now();const v=drawGrass.apply(this,a);stage.grass.push(performance.now()-t);return v;};
     const cpu=[],frames=[];let previous=null;
     for(let i=0;i<35;i++){
      await new Promise(resolve=>setTimeout(resolve,0));const now=performance.now();if(i>=10&&previous!==null)frames.push(now-previous);previous=now;
      g.time+=1/60;r.camera={x,y,zoom:1.05};const t=performance.now();r.draw(g,0);if(i>=10)cpu.push(performance.now()-t);
      if(i===9)stage={floor:[],grass:[],lights:[],actors:[]};
     }
     variants.push({location,variant,drawMs:stats(cpu),frameIntervalMs:stats(frames),floorMs:stage.floor.length?stats(stage.floor):null,grassSubmitMs:stage.grass.length?stats(stage.grass):null,actorMs:stage.actors.length?stats(stage.actors):null,scenery:g.scenery.length,chunks:g.boundlessLoadedChunks.length,grassInstances:r.grassField.instances});
     console.log('PROFILE completed '+location+'/'+variant+' '+JSON.stringify(variants.at(-1)));
     if(variant==='baseline'||variant==='pixel-draft')images[location+'-'+variant]=canvas.toDataURL();
    }
   }
   const gl=r.grassField.gl,ext=gl?.getExtension('WEBGL_debug_renderer_info');
   return {variants,streamingMs:stats(stream),images,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,gpuTimerSupported:!!gl?.getExtension('EXT_disjoint_timer_query_webgl2'),size:[canvas.width,canvas.height],dpr:devicePixelRatio};
  })()`);
  const profile=await win.webContents.debugger.sendCommand('Profiler.stop');fs.writeFileSync(path.join(out,draft?'draft-cpu-profile.json':'cpu-profile.json'),JSON.stringify(profile.profile));
  for(const [name,url]of Object.entries(data.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  delete data.images;data.errors=errors;fs.writeFileSync(path.join(out,draft?'draft-report.json':'report.json'),JSON.stringify(data,null,2));console.log(JSON.stringify(data));app.exit(errors.length?1:0);
 }catch(e){console.error(e);app.exit(1);}
});
