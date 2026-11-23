// Paint updated parts through the real InlinePixelEditor; retain all user-edited parts/keys.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/tv-polish');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'author-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);try{
 const file=path.join(root,'authored/rigs.json'),saved=JSON.parse(fs.readFileSync(file,'utf8')).arenaRigs,original=JSON.parse(fs.readFileSync(path.join(out,'legacy-defaults.json'),'utf8')),previousFile=path.join(out,'last-defaults.json'),previous=fs.existsSync(previousFile)?JSON.parse(fs.readFileSync(previousFile,'utf8')):null;
 const baseline=Object.fromEntries(['bramblecap','mossback'].map(k=>[k,saved[k]?.artGeneration>=2&&previous?.[k]?previous[k]:original[k]]));
 await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const saved=${JSON.stringify(saved)},baseline=${JSON.stringify(baseline)};
 const {RigStudio}=await import('./src/player-studio.mjs'),{ARENA_SUBJECTS}=await import('./src/tv-arena-creatures.mjs'),{mergeArenaDesign,sameArenaPixels}=await import('./src/tv-arena-design-merge.mjs');
 const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs'),{directionVector}=await import('./src/player-motion.mjs');
 const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
 const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;background:#102a25;z-index:99999';document.body.append(host);
 const studio=new RigStudio(async()=> 'TV art exported');studio.playing=false;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d'),log=[],rigs={},defaults={};
 for(const kind of ['bramblecap','mossback']){
  const subject=ARENA_SUBJECTS[kind],raw=subject.defaults(),merged=mergeArenaDesign(saved[kind],baseline[kind].model,raw),parts=[];raw.palette=structuredClone(merged.palette);defaults[kind]={model:subject.defaults(),sprites:{}};
  for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d),pose=Object.fromEntries(Object.entries(raw.joints).map(([n,j])=>[n,j.position]));c.resetTransform();c.clearRect(0,0,256,256);c.translate(128,128);captureLayers(raw);try{subject.draw(c,{faceX,faceY,animationAction:'idle',playerFrame:0},0,raw,pose);}finally{releaseLayers(raw);}for(const part of capturedLayers(raw,d).filter(p=>p.sprite.pixels.some(Boolean))){parts.push({direction:d,part:structuredClone(part)});defaults[kind].sprites[part.id]||={};defaults[kind].sprites[part.id][d]=structuredClone(part.sprite);}}
  subject.replace(merged);studio.setSubject(kind);studio.mount(host);studio.playing=false;studio.mode='setup';studio.clip='idle';
  const prepared=new Set();
  for(const {direction,part}of parts){
   const existing=saved[kind]?.boneSprites?.[part.id]?.[direction],old=baseline[kind].sprites[part.id]?.[direction];
   if(existing&&!sameArenaPixels(existing,old)){log.push({kind,direction,part:part.id,preserved:true});continue;}
   if(!prepared.has(direction)){
    for(const entry of parts.filter(p=>p.direction===direction)){const oldPixel=saved[kind]?.boneSprites?.[entry.part.id]?.[direction];if(!oldPixel||sameArenaPixels(oldPixel,baseline[kind].sprites[entry.part.id]?.[direction])){if(subject.data.boneSprites?.[entry.part.id])delete subject.data.boneSprites[entry.part.id][direction];}}
    const model=subject.data,[faceX,faceY]=directionVector(direction),pose=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position]));c.resetTransform();c.clearRect(0,0,256,256);c.translate(128,128);captureLayers(model);try{subject.draw(c,{faceX,faceY,animationAction:'idle',playerFrame:0},0,model,pose);}finally{releaseLayers(model);}prepared.add(direction);
   }
   studio.direction=direction;studio.selected=part.bone;studio.openBonePixelEditor(part);const editor=studio.bonePixelEditor,source=structuredClone(editor.sprite),draw=editor.draw;editor.draw=()=>{};editor.sprite.pixels.fill(0);editor.last=null;
   for(let i=0;i<source.pixels.length;i++)if(source.pixels[i]){editor.color=source.palette[source.pixels[i]];editor.last=null;editor.paint({x:i%source.width,y:Math.floor(i/source.width)});}
   editor.draw=draw;editor.draw();editor.changed();await [...host.querySelectorAll('.rig-inline-pixels button')].find(b=>b.textContent==='Save pixels to rig').onclick();log.push({kind,direction,part:part.id,pixels:source.pixels.filter(Boolean).length});
  }
  rigs[kind]=structuredClone(subject.data);
 }
 studio.setSubject('mossback');studio.mount(host);studio.direction=6;studio.mode='animate';studio.clip='walk';studio.frame=4;studio.animate(0);return {rigs,defaults,log};})()`);
 const current=JSON.parse(fs.readFileSync(file,'utf8'));current.arenaRigs={...current.arenaRigs,...result.rigs};const tmp=file+'.tv-polish.tmp';fs.writeFileSync(tmp,JSON.stringify(current)+'\n');fs.renameSync(tmp,file);
 fs.writeFileSync(path.join(out,'last-defaults.json'),JSON.stringify(result.defaults));fs.writeFileSync(path.join(out,'pixel-editor-receipt.json'),JSON.stringify(result.log,null,2));fs.writeFileSync(path.join(out,'pixel-editor.png'),(await win.webContents.capturePage()).toPNG());console.log(JSON.stringify({parts:result.log.length,painted:result.log.filter(x=>!x.preserved).length,preserved:result.log.filter(x=>x.preserved).length}));win.destroy();app.exit(0);
 }catch(e){console.error(e);win.destroy();app.exit(1);}});
