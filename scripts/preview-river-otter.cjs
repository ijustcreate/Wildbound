// Render the native wildlife rig in its real game canvas renderer for review.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','river-otter-review');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});win.webContents.setAudioMuted(true);await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const moduleUrl=pathToFileURL(path.join(root,'src/creature-packs/index.mjs')).href;
 const png=await win.webContents.executeJavaScript(`(async()=>{
  const {CREATURE_PACK_SUBJECTS}=await import(${JSON.stringify(moduleUrl)}),subject=CREATURE_PACK_SUBJECTS.river_otter,model=subject.data;
  const canvas=document.createElement('canvas');canvas.width=1120;canvas.height=690;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  c.fillStyle='#172e2b';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#f1dfb7';c.font='bold 22px sans-serif';c.fillText('WILDBOUND · RIVER OTTER / NATIVE RIG STUDY',24,34);c.font='12px sans-serif';c.fillStyle='#b8c5a5';c.fillText('Chestnut coat · cream throat · rounded ears · broad rudder tail · actual wildlife renderer',24,56);
  const dirs=[[0,0,1,'front'],[1,-.7,.7,'front diagonal'],[2,-1,0,'profile'],[3,-.7,-.7,'rear diagonal'],[4,0,-1,'rear'],[5,.7,-.7,'rear diagonal'],[6,1,0,'profile'],[7,.7,.7,'front diagonal']];
  dirs.forEach(([d,fx,fy,label],i)=>{const x=82+i*136;c.fillStyle='#203d37';c.fillRect(x-42,72,84,170);c.fillStyle='#d8ca9c';c.font='11px sans-serif';c.textAlign='center';c.fillText(label,x,91);c.save();c.translate(x,216);c.scale(2,2);subject.draw(c,{kind:'river_otter',hp:44,faceX:fx,faceY:fy,equipment:{},inventory:[],state:'idle',moving:false},0,model);c.restore();});
  c.textAlign='left';c.fillStyle='#f1dfb7';c.font='bold 15px sans-serif';c.fillText('WALK CYCLE',24,278);c.fillText('SWIM CYCLE',24,472);
  for(let i=0;i<8;i++){const x=112+i*124;c.fillStyle='#203d37';c.fillRect(x-37,292,74,144);c.fillStyle='#c0c9a8';c.font='10px sans-serif';c.textAlign='center';c.fillText('step '+(i+1),x,308);c.save();c.translate(x,416);c.scale(2,2);subject.draw(c,{kind:'river_otter',hp:44,faceX:1,faceY:.2,equipment:{},inventory:[],state:'idle',animationAction:'walk',poseTime:i/8,moving:true},i/12,model);c.restore();
   c.fillStyle='#203d37';c.fillRect(x-37,484,74,144);c.fillStyle='#c0c9a8';c.font='10px sans-serif';c.fillText('stroke '+(i+1),x,500);c.save();c.translate(x,608);c.scale(2,2);subject.draw(c,{kind:'river_otter',hp:44,faceX:1,faceY:.2,equipment:{},inventory:[],state:'swim',animationAction:'swim',poseTime:i/12,swimming:true,moving:true},i/12,model);c.restore();
  }return canvas.toDataURL('image/png').split(',')[1];})()`);
 const file=path.join(out,'river-otter-review.png');fs.writeFileSync(file,Buffer.from(png,'base64'));console.log(file);app.exit(0);
}).catch(error=>{console.error(error);app.exit(1);});
