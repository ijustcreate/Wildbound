const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','skeleton-baseline');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);
 await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const wizardRef=fs.readFileSync('C:/Users/New User/Desktop/fsdfs.jpg').toString('base64');
 const sheetRef=fs.readFileSync('C:/Users/New User/Desktop/hLvPD4.png').toString('base64');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {directionVector}=await import('./src/player-motion.mjs');
  const {skeletonMotions,drawSkeleton}=await import('./src/skeleton-motion.mjs');
  const canvas=document.createElement('canvas');canvas.width=1500;canvas.height=840;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#142723';c.fillRect(0,0,canvas.width,canvas.height);
  c.fillStyle='#e9d9af';c.font='bold 22px sans-serif';c.fillText('SKELETON WIZARD · ASSEMBLED GAME-RENDERER STUDY',24,34);
  c.fillStyle='#cabd9a';c.font='13px sans-serif';c.fillText('One short-legged humanoid-rig baseline · five turn views · idle / run / staff cast / heavy cut',24,56);
  const model=skeletonMotions.skeleton_wizard,dirs=[0,1,2,3,4],labels=['FRONT','DIAGONAL','PROFILE','REAR DIAG.','BACK'];
  const loadImage=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
  const refs=await Promise.all([loadImage('data:image/jpeg;base64,${wizardRef}'),loadImage('data:image/png;base64,${sheetRef}')]);
  c.fillStyle='#c7bd9f';c.font='12px sans-serif';c.fillText('WIZARD REFERENCE',1130,82);c.drawImage(refs[0],1130,91,150,150);
  c.fillText('PROPORTION REFERENCE',1300,82);c.drawImage(refs[1],1300,91,175,140);
  for(let col=0;col<dirs.length;col++){
   const d=dirs[col],[faceX,faceY]=directionVector(d);c.fillStyle='#c7bd9f';c.font='10px sans-serif';c.fillText(labels[col],24+col*215,166);
   const modes=[['IDLE',{}],['RUN',{moving:true,animationAction:'run',playerFrame:3}],['STAFF CAST',{animationAction:'cast',playerFrame:5}],['HEAVY CUT',{animationAction:'swipe_big',playerFrame:5}]];
   modes.forEach(([label,state],row)=>{
    if(col===0){c.fillStyle='#c7bd9f';c.font='11px sans-serif';c.fillText(label,24,193+row*150);}
    c.save();c.translate(138+col*215,197+row*150);c.scale(3.6,3.6);
    drawSkeleton(c,{kind:'skeleton_wizard',hp:100,faceX,faceY,inventory:[],equipment:{},...state},.1,model);c.restore();
   });
  }
  c.fillStyle='#c7bd9f';c.font='12px sans-serif';c.fillText('GAMEPLAY SCALE',1130,300);c.fillText('ENLARGED DETAIL',1260,300);
  const [fx,fy]=directionVector(0),previewActor={kind:'skeleton_wizard',hp:100,faceX:fx,faceY:fy,inventory:[],equipment:{},animationAction:'cast',playerFrame:4};
  c.save();c.translate(1200,430);c.scale(1.6,1.6);drawSkeleton(c,previewActor,.1,model);c.restore();
  c.save();c.translate(1380,430);c.scale(3.5,3.5);drawSkeleton(c,previewActor,.1,model);c.restore();
  const axeCanvas=document.createElement('canvas');axeCanvas.width=900;axeCanvas.height=300;const ac=axeCanvas.getContext('2d');ac.imageSmoothingEnabled=false;ac.fillStyle='#142723';ac.fillRect(0,0,900,300);
  ac.fillStyle='#e9d9af';ac.font='bold 16px sans-serif';ac.fillText('LONG AXE INTEGRATION CHECK · IDLE AND TWO-HANDED SWING',18,24);
  let axeError=null;
  for(let col=0;col<5;col++){const [ax,ay]=directionVector(col);ac.fillStyle='#c7bd9f';ac.font='11px sans-serif';ac.fillText(labels[col],18+col*175,46);
   for(let row=0;row<2;row++){const actor={kind:'skeleton',hp:100,faceX:ax,faceY:ay,inventory:[],equipment:{hand1:'skeleton_long_axe'},...(row?{attack:.2}:{})};ac.save();ac.translate(80+col*175,105+row*125);ac.scale(2.1,2.1);try{drawSkeleton(ac,actor,.1,skeletonMotions.skeleton);}catch(e){axeError={col,row,error:e?.stack||String(e)};}ac.restore();}
  }
  return {image:canvas.toDataURL().split(',')[1],axe:axeCanvas.toDataURL().split(',')[1],revision:model.nativeSkeletonRevision||0,axeError,actions:['run','cast','swipe_big','long_axe_swing'].map(x=>[x,!!skeletonMotions.skeleton.clips[x]])};
 })()`);
 fs.writeFileSync(path.join(out,'baseline.png'),Buffer.from(result.image,'base64'));
 fs.writeFileSync(path.join(out,'long-axe-integration.png'),Buffer.from(result.axe,'base64'));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({revision:result.revision,actions:result.actions,axeError:result.axeError},null,2));console.log(JSON.stringify({path:path.join(out,'baseline.png'),revision:result.revision,actions:result.actions,axeError:result.axeError}));app.exit(0);
}).catch(e=>{console.error(e?.stack||e);app.exit(1);});
