// Author every isolated part through the game's actual InlinePixelEditor,
// then export only this assignment's new rig subjects. Never writes a profile.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/tv-arena');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'author-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 try{
  await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
    const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
    const {RigStudio}=await import('./src/player-studio.mjs'),{ARENA_SUBJECTS,arenaRigPack}=await import('./src/tv-arena-creatures.mjs');
    const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
    const {directionVector}=await import('./src/player-motion.mjs');
    const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;background:#102a25;z-index:99999;overflow:auto';document.body.append(host);
    const studio=new RigStudio(async()=> 'Arena source pixels exported.');studio.setSubject('bramblecap');studio.clip='idle';studio.mount(host);studio.playing=false;studio.bones=false;studio.mode='setup';
    const scratch=document.createElement('canvas');scratch.width=scratch.height=256;const ctx=scratch.getContext('2d');const log=[];
    for(const [kind,subject]of Object.entries(ARENA_SUBJECTS)){
      if(${JSON.stringify(process.env.ARENA_SUBJECT||'')}&&kind!==${JSON.stringify(process.env.ARENA_SUBJECT||'')})continue;
      subject.replace(subject.defaults());studio.setSubject(kind);studio.mount(host);studio.clip='idle';studio.mode='setup';studio.playing=false;
      for(let direction=0;direction<8;direction++){
        studio.direction=direction;const [faceX,faceY]=directionVector(direction);
        const pose=Object.fromEntries(Object.entries(subject.data.joints).map(([n,j])=>[n,[...j.position]]));
        ctx.resetTransform();ctx.clearRect(0,0,256,256);ctx.translate(128,128);captureLayers(subject.data);
        try{subject.draw(ctx,{faceX,faceY,animationAction:'idle',playerFrame:0},0,subject.data,pose);}finally{releaseLayers(subject.data);}
        const parts=capturedLayers(subject.data,direction).filter(p=>p.sprite.pixels.some(Boolean));
        for(const part of parts){
          studio.selected=part.bone;studio.openBonePixelEditor(part);
          const editor=studio.bonePixelEditor,source=structuredClone(part.sprite),draw=editor.draw;
          // Paint the source clusters one pixel at a time using the native pencil.
          // Batch redraws; this changes no brush, undo, palette or save semantics.
          editor.draw=()=>{};editor.sprite.pixels.fill(0);editor.last=null;
          for(let i=0;i<source.pixels.length;i++)if(source.pixels[i]){editor.color=source.palette[source.pixels[i]];editor.last=null;editor.paint({x:i%source.width,y:Math.floor(i/source.width)});}
          editor.draw=draw;editor.draw();editor.changed();
          const save=[...host.querySelectorAll('.rig-inline-pixels button')].find(b=>b.textContent==='Save pixels to rig');await save.onclick();
          log.push({kind,direction,part:part.id,pixels:source.pixels.filter(Boolean).length});
        }
      }
    }
    studio.setSubject('mossback');studio.mount(host);studio.direction=7;studio.mode='animate';studio.clip='walk';studio.frame=3;studio.animate(0);
    const cap=capturedLayers(studio.model,7).find(p=>p.bone==='crown');studio.selected='crown';if(cap)studio.openBonePixelEditor(cap);
    return {rigs:arenaRigPack(),log};
  })().catch(e=>({error:e.stack}))`);
  if(result.error)throw Error(result.error);
  fs.writeFileSync(path.join(out,'editor-authoring.json'),JSON.stringify(result.log,null,2));
  fs.writeFileSync(path.join(out,'arena-rigs.json'),JSON.stringify(result.rigs));
  const existing=JSON.parse(fs.readFileSync(path.join(root,'authored/rigs.json'),'utf8'));existing.arenaRigs=result.rigs;
  fs.writeFileSync(path.join(root,'authored/rigs.json'),JSON.stringify(existing)+'\n');
  fs.writeFileSync(path.join(out,'in-game-pixel-editor.png'),(await win.webContents.capturePage()).toPNG());
  console.log(JSON.stringify({subjects:Object.keys(result.rigs),parts:result.log.length,pixels:result.log.reduce((n,p)=>n+p.pixels,0)}));win.destroy();app.exit(0);
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
