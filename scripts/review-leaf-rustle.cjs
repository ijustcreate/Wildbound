const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/leaf-rustle');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1100,height:800,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {drawForestTree,drawTreeFoliage}=await import('./src/forest.mjs'),{Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{Assets}=await import('./src/assets.mjs');
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=560;const c=canvas.getContext('2d'),images={},checks=[];
   const assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   function draw(time,storm=false){
    c.setTransform(1,0,0,1,0,0);c.fillStyle='#475e43';c.fillRect(0,0,1080,560);c.imageSmoothingEnabled=false;
    c.fillStyle='#efe2b5';c.font='18px sans-serif';c.fillText(storm?'Storm: stronger leaf-fan motion':'Gentle breeze: independently rustling leaf fans',25,28);
    const g=storm?{weather:{type:'thunderstorm',life:40,duration:45,intensity:1}}:{};
    for(let i=0;i<3;i++){
     c.save();c.translate(180+i*360,460);c.scale(3,3);drawForestTree(c,{kind:'tree',treeType:['oak','birch','pine'][i],season:'summer',x:0,y:0,rootY:0,size:64},time,g);c.restore();
     c.fillStyle='#efe2b5';c.fillText(['Oak','Birch','Pine'][i],155+i*360,510);
    }
   }
   draw(0);images['calm-0']=canvas.toDataURL();draw(1.5);images['calm-1']=canvas.toDataURL();draw(1.5,true);images.storm=canvas.toDataURL();
   const pixels=t=>{draw(t);return c.getImageData(0,0,1080,560).data;};const a=pixels(0),b=pixels(1.5);let crownChange=0,rootChange=0;
   for(let y=80;y<490;y++)for(let x=30;x<1050;x++){const i=(y*1080+x)*4;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]){if(y<400)crownChange++;if(y>430)rootChange++;}}
   assert(crownChange>100,'Broad foliage clusters visibly animate');assert(rootChange===0,'Trunks and roots stay fixed');
   const bare=document.createElement('canvas');bare.width=144;bare.height=128;const pen=bare.getContext('2d');pen.translate(72,112);
   drawTreeFoliage(pen,{x:0,y:0,size:64,treeType:'oak',season:'winter',leafHabit:'deciduous'},1,{});
   assert(!pen.getImageData(0,0,144,128).data.some((v,i)=>i%4===3&&v),'Winter deciduous crowns stay bare');
   const chunks=[],stream=canvas.captureStream(24),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:1800000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.start();
   const start=performance.now();await new Promise(resolve=>{const step=()=>{const elapsed=(performance.now()-start)/1000;draw(elapsed,elapsed>3);if(elapsed<6)raf(step);else resolve();};raf(step);});
   const done=new Promise(resolve=>recorder.onstop=resolve);recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());
   const video=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
   const assets=new Assets();await assets.load();const game=new Game(()=>.5,{deferWorld:true});game.seed=42;game.environment='forest';game.mapMode='boundless';const p=game.addPlayer('keyboard','Leaf review');game.start();game.openingBoard=false;game.sky.elapsed=100;game.weather=null;game.time=20;game.spriteLibrary=assets.library;Object.assign(p,{x:1060,y:1110});
   const view=document.createElement('canvas');view.style.cssText='width:1100px;height:800px';document.body.append(view);const r=new Renderer(view,assets);r.setDynamicShadows(true);r.camera={x:1060,y:1110,zoom:1.6};
   for(let n=0;n<30;n++){game.time=20+n/12;r.draw(game,0);}images.forest=view.toDataURL();
   return {images,video,checks,crownChange,rootChange};
  })()`);
  for(const [name,url]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'leaf-rustle.webm'),Buffer.from(result.video.split(',')[1],'base64'));
  if(errors.length)throw Error(errors.join('\n'));delete result.images;delete result.video;result.rendererErrors=errors;
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
