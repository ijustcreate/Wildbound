const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/swamp-study');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 try{await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const images=await w.webContents.executeJavaScript(`(async()=>{
 const {drawSwampStudy}=await import('./src/swamp-art.mjs'),{Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{drawProp}=await import('./src/environment.mjs'),{PLAYER_RENDER_SIZE}=await import('./src/render-settings.mjs');
 const assets=new Assets();await assets.load();const surface=document.createElement('canvas'),renderer=new Renderer(surface,assets),images={};
 const make=()=>{const c=document.createElement('canvas');c.width=960;c.height=640;c.getContext('2d').imageSmoothingEnabled=false;return c;};
 const study=make();drawSwampStudy(study.getContext('2d'),{drawPlayer:(c,x,y)=>{c.save();c.translate(x,y);c.scale(.5,.5);renderer.animator.draw(c,{sprite:'explorer-teal',x:0,y:0,faceX:0,faceY:1,moving:false},0,PLAYER_RENDER_SIZE);c.restore();}});images['swamp-clearing-draft']=study.toDataURL();
 for(const env of ['forest','beach']){const g=new Game(()=>.5,{deferWorld:true});g.seed=75;g.environment=env;const p=g.addPlayer('keyboard','Reference');g.start();g.openingBoard=false;g.bloom=3;g.time=30;g.weather={type:'clear'};g.spriteLibrary=assets.library;
 const c=make(),pen=c.getContext('2d'),x=800,y=800;g.explored=new Set();for(let ty=0;ty<50;ty++)for(let tx=0;tx<50;tx++)g.explored.add(tx+','+ty);renderer.camera={x,y,zoom:1};pen.translate(480-x,320-y);renderer.floor(pen,960,640,g);for(const prop of g.scenery.filter(s=>Math.abs(s.x-x)<650&&Math.abs((s.rootY??s.y)-y)<500).sort((a,b)=>(a.rootY??a.y)-(b.rootY??b.y)))drawProp(pen,prop,g.time,g);images[env+'-reference']=c.toDataURL();}
 return images;
 })()`);
 for(const [name,url]of Object.entries(images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
 console.log('Saved native swamp draft and current Forest/Beach references.');w.destroy();app.quit();
 }catch(e){console.error(e);w.destroy();app.exit(1);}
});


