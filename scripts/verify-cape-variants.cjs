const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'capes-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});await win.loadFile(path.join(root,'index.html'));
 const png=await win.webContents.executeJavaScript(`(async()=>{
 const {drawPlayer,defaultPlayerMotion,directionVector}=await import('./src/player-motion.mjs');
 const cv=document.createElement('canvas');cv.width=1000;cv.height=700;const c=cv.getContext('2d');c.fillStyle='#343b3e';c.fillRect(0,0,1000,700);c.imageSmoothingEnabled=false;
 const ids=['cape','tattered_cape','short_cape','pointed_cape'];
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){
  c.save();c.translate(col*250+125,row*230+160);c.scale(3,3);const [faceX,faceY]=directionVector(row===2?2:4);
  drawPlayer(c,{faceX,faceY,moving:row>0,equipment:{cape:ids[col]},animationAction:row?'run':'idle',playerFrame:0},row===2?.5:.1,defaultPlayerMotion());c.restore();
  c.fillStyle='#eee';c.font='14px sans-serif';c.fillText(ids[col]+' · '+(row?'running':'idle'),col*250+20,row*230+210);
 }
 return cv.toDataURL('image/png').split(',')[1];})()`);
 fs.writeFileSync(path.join(out,'cape-variants.png'),Buffer.from(png,'base64'));console.log('Rendered all four capes, idle/back-running/profile-running.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
