const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/tv-polish');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'baseline-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);try{
 await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {ARENA_SUBJECTS}=await import('./src/tv-arena-creatures.mjs'),{captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs'),{directionVector}=await import('./src/player-motion.mjs');
 const c=document.createElement('canvas').getContext('2d'),result={};c.canvas.width=c.canvas.height=256;
 for(const kind of ['bramblecap','mossback']){const subject=ARENA_SUBJECTS[kind],model=subject.defaults(),sprites={};for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d),pose=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position]));c.resetTransform();c.clearRect(0,0,256,256);c.translate(128,128);captureLayers(model);try{subject.draw(c,{faceX,faceY,animationAction:'idle',playerFrame:0},0,model,pose);}finally{releaseLayers(model);}for(const p of capturedLayers(model,d))if(p.sprite.pixels.some(Boolean)){sprites[p.id]||={};sprites[p.id][d]=structuredClone(p.sprite);}}
 result[kind]={model,sprites};}return result;})()`);
 fs.writeFileSync(path.join(out,'legacy-defaults.json'),JSON.stringify(result));console.log('Captured legacy default models and pixel parts without changing authored assets.');win.destroy();app.exit(0);
 }catch(e){console.error(e);win.destroy();app.exit(1);}});
