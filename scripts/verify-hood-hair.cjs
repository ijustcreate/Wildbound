const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','hood-hair');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
 const {DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
 const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=680;const c=sheet.getContext('2d');c.fillStyle='#817150';c.fillRect(0,0,1280,680);c.imageSmoothingEnabled=false;
 for(const [row,action]of ['idle','run','death'].entries())for(let d=0;d<8;d++){
  const [faceX,faceY]=directionVector(d),actor={hp:100,faceX,faceY,animationAction:action,playerFrame:action==='run'?2:action==='death'?playerMotion.clips.death.length-1:0,equipment:{head:'banshee_hood'},appearance:{...DEFAULT_APPEARANCE,hair:'crop',hairColor:'#593923'}};
  c.save();c.translate(80+d*160,160+row*200);c.scale(3,3);drawPlayer(c,actor,0,playerMotion);c.restore();
  c.fillStyle='#fff0c5';c.font='12px monospace';c.fillText(action+' / '+d,20+d*160,190+row*200);
 }
 const scratch=document.createElement('canvas');scratch.width=scratch.height=160;const pen=scratch.getContext('2d');let poses=0;
 for(const id of ['banshee_hood','ranger_hood','leather_hood'])for(let d=0;d<8;d++)for(const action of ['idle','walk','run','swipe_one','draw','death']){
  const [faceX,faceY]=directionVector(d),clip=playerMotion.clips[action];if(!clip)continue;
  for(let frame=0;frame<clip.length;frame++){
   pen.clearRect(0,0,160,160);pen.save();pen.translate(80,120);pen.scale(2,2);
   drawPlayer(pen,{hp:100,faceX,faceY,animationAction:action,playerFrame:frame,equipment:{head:id},appearance:{...DEFAULT_APPEARANCE,hair:'crop'}},0,playerMotion);pen.restore();poses++;
  }
 }
 return {png:sheet.toDataURL().split(',')[1],directions:8,actions:3,checkedPoses:poses};})()`);
 fs.writeFileSync(path.join(out,(process.env.WILDBOUND_HOOD_LABEL||'after')+'.png'),Buffer.from(result.png,'base64'));delete result.png;console.log(JSON.stringify(result));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
