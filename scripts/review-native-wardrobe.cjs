// Isolated real-Electron review of every slotted item. Never reads personal saves.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','native-wardrobe');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});
 win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('render-process-gone',(_e,d)=>errors.push(d.reason));
 await win.loadFile(path.join(root,'index.html'));
 await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {drawPlayer,playerMotion,directionVector,poseAt}=await import('./src/player-motion.mjs');
  const {ITEMS}=await import('./src/items.mjs');
  const {DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
  const {loadHumanoidArt}=await import('./src/humanoid-hd.mjs');await loadHumanoidArt();
  const slots=[...new Set(Object.values(ITEMS).filter(x=>x.slot).map(x=>x.slot))];
  const sheets=[],report=[],actions=['idle','run','slash','ranged','cast','jump_air','death'];
  const scratch=document.createElement('canvas');scratch.width=scratch.height=192;const sc=scratch.getContext('2d');
  const actor=(id,d,action,frame)=>{const [faceX,faceY]=directionVector(d);return {faceX,faceY,hp:100,appearance:DEFAULT_APPEARANCE,inventory:[],equipment:{[ITEMS[id].slot]:id},animationAction:action,playerFrame:frame};};
  for(const slot of slots){
   const entries=Object.entries(ITEMS).filter(([,x])=>x.slot===slot);
   const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=entries.length*116+40;
   const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#152b29';c.fillRect(0,0,sheet.width,sheet.height);
   c.fillStyle='#ead8a8';c.font='16px monospace';c.fillText('CAPTAIN BASE / '+slot+' / all eight directions',12,25);
   for(let row=0;row<entries.length;row++){
    const [id,def]=entries[row];let renders=0;
    c.fillStyle='#c7bb96';c.font='10px monospace';c.fillText(id,10,55+row*116);
    for(let d=0;d<8;d++){
     for(const action of actions){
      const clip=playerMotion.clips[action];if(!clip)throw Error('Missing player action: '+action);
      const a=actor(id,d,action,Math.floor(clip.length*.4));
      const pose=poseAt(playerMotion,action,a.playerFrame);
      if(Object.values(pose).flat().some(v=>!Number.isFinite(v)))throw Error('Nonfinite pose '+id+' '+action);
      sc.clearRect(0,0,192,192);sc.save();sc.translate(96,120);drawPlayer(sc,a,.2,playerMotion);sc.restore();renders++;
     }
     const x=230+d*94,y=138+row*116;
     c.save();c.translate(x,y);c.scale(2,2);drawPlayer(c,actor(id,d,'idle',0),0,playerMotion);c.restore();
     // Native size sits beside the enlarged view to expose lost pixel detail.
     c.save();c.translate(x+28,y);drawPlayer(c,actor(id,d,'idle',0),0,playerMotion);c.restore();
    }
    report.push({id,slot,renders,directions:8,actions});
   }
   sheets.push({slot,png:sheet.toDataURL('image/png').split(',')[1]});
  }
  return {sheets,report,revision:playerMotion.nativeHumanoidRevision};
 })()`);
 for(const sheet of result.sheets)fs.writeFileSync(path.join(out,sheet.slot+'.png'),Buffer.from(sheet.png,'base64'));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({revision:result.revision,items:result.report,errors},null,2));
 console.log(JSON.stringify({revision:result.revision,items:result.report.length,renders:result.report.reduce((n,x)=>n+x.renders,0),sheets:result.sheets.length,errors}));
 app.exit(errors.length?1:0);
}).catch(e=>{console.error(e);app.exit(1);});
