const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/wow-creatures');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{offscreen:true}});
 w.webContents.setAudioMuted(true);
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const beast=await import('./src/beast-motion.mjs'),night=await import('./src/night-rigs.mjs'),motion=await import('./src/player-motion.mjs'),layers=await import('./src/render-order.mjs');
   const pictures={},report={};
   for(const kind of ['spider','boar','elephant']){
    const m=kind==='elephant'?night.nightMotions.elephant:beast.beastMotions[kind];
    if(m.motionSource?.kind!=='wowhead-bone-transfer')throw Error(kind+' source transfer absent');
    if(!(kind==='elephant'?night.validateNightMotion(kind,m):beast.validateBeastMotion(kind,m)))throw Error(kind+' invalid authored rig');
    const actions=kind==='elephant'?['idle','walk','charge','trumpet','death']:kind==='spider'?['idle','walk','attack','death']:['idle','walk','charge','attack','death'];
    for(const [action,clip]of Object.entries(m.clips))for(let d=0;d<8;d++)for(let frame=0;frame<clip.length;frame++){
     const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.translate(128,170);const [faceX,faceY]=motion.directionVector(d);
     const actor={kind,faceX,faceY,animationAction:action,playerFrame:frame};
     (kind==='elephant'?night.drawNightRig:beast.drawBeast)(c,actor,0,m);
    }
    for(const action of actions){const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=240;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#26332e';c.fillRect(0,0,canvas.width,canvas.height);
     c.fillStyle='#e5d5a8';c.font='16px monospace';c.fillText(kind+' / '+action+' / eight directions',18,24);
     for(let d=0;d<8;d++){const [faceX,faceY]=motion.directionVector(d);c.save();c.translate(90+d*180,185);c.scale(3,3);(kind==='elephant'?night.drawNightRig:beast.drawBeast)(c,{kind,faceX,faceY,animationAction:action,playerFrame:action==='death'?m.clips[action].length-1:Math.floor(m.clips[action].length*.35)},0,m);c.restore();c.fillText(String(d),80+d*180,222);}pictures[kind+'-'+action]=canvas.toDataURL('image/png').split(',')[1];}
    if(kind==='elephant')for(const action of ['walk','run','trumpet','death']){
     const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=240;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#26332e';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#e5d5a8';c.font='16px monospace';c.fillText('elephant / '+action+' / profile cycle',18,24);
     for(let f=0;f<8;f++){const [faceX,faceY]=motion.directionVector(2);c.save();c.translate(90+f*180,185);c.scale(3,3);night.drawNightRig(c,{kind,faceX,faceY,animationAction:action,playerFrame:f*(m.clips[action].length-1)/7},0,m);c.restore();}pictures['elephant-'+action+'-cycle']=canvas.toDataURL('image/png').split(',')[1];
    }
    report[kind]={displayId:m.motionSource.displayId,joints:Object.keys(m.joints).length,clips:Object.keys(m.clips).length};
    if(kind==='elephant'){
     const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.translate(128,170);
     layers.captureLayers(m);night.drawNightRig(c,{kind,faceX:0,faceY:1,animationAction:'idle',playerFrame:0},0,m);layers.releaseLayers(m);
     const parts=layers.capturedLayers(m,0);for(const id of ['Elephant body','Elephant head','Elephant ear L','Elephant ear R','Elephant trunk base','Elephant trunk middle','Elephant trunk tip','Front leg L','Front leg R'])
      if(!parts.find(p=>p.id===id&&p.sprite.pixels.some(Boolean)))throw Error('Uneditable elephant part '+id);
     report[kind].editableParts=parts.length;
    }
   }
   const button=[...document.querySelectorAll('button')].find(b=>b.textContent==='Rig studio');if(!button)throw Error('Game Studio missing');button.click();
   const picker=document.querySelector('.ps-subject');if(!picker)throw Error('Studio picker missing');
   for(const kind of ['spider','boar','elephant']){picker.value=kind;picker.dispatchEvent(new Event('change'));if(picker.value!==kind)throw Error('Studio missing '+kind);}
   return {report,pictures};
  })()`);
  for(const [name,png]of Object.entries(result.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png,'base64'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result.report,null,2));
  console.log(JSON.stringify(result.report));w.destroy();app.quit();
 }catch(e){console.error(e);w.destroy();app.exit(1);}
});
