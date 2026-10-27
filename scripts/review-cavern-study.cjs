const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/cavern-study');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 try{await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const images=await w.webContents.executeJavaScript(`(async()=>{
 const {drawCavernStudy}=await import('./src/cavern-study.mjs'),{drawSwampStudy}=await import('./src/swamp-art.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{PLAYER_RENDER_SIZE}=await import('./src/render-settings.mjs');
 const assets=new Assets();await assets.load();const renderer=new Renderer(document.createElement('canvas'),assets),images={};
 const drawPlayer=(c,x,y)=>{c.save();c.translate(x,y);c.scale(.5,.5);renderer.animator.draw(c,{sprite:'explorer-teal',x:0,y:0,faceX:0,faceY:1,moving:false},0,PLAYER_RENDER_SIZE);c.restore();};
 for(const [name,draw]of [['cavern-draft',drawCavernStudy],['approved-swamp-reference',drawSwampStudy]]){const cv=document.createElement('canvas');cv.width=960;cv.height=640;draw(cv.getContext('2d'),{drawPlayer});images[name]=cv.toDataURL();}
 return images;})()`);
 for(const [name,url]of Object.entries(images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
 console.log('Native cavern draft and approved swamp reference rendered.');w.destroy();app.quit();
 }catch(e){console.error(e);w.destroy();app.exit(1);}
});
