const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/hand-layer-profile'));
app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,webPreferences:{offscreen:true}});
 try{
  await window.loadFile(path.join(root,'index.html'));
  await window.webContents.executeJavaScript('window.wildboundBoot.ready');
  const png=await window.webContents.executeJavaScript(`(async()=>{
   const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=480;
   const c=canvas.getContext('2d');c.fillStyle='#28403c';c.fillRect(0,0,960,480);
   for(let row=0;row<2;row++)for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);c.fillStyle='#e6d6ab';c.font='13px monospace';c.fillText((row?'Block ':'Idle ')+d,d*120+8,row*240+20);
    c.save();c.translate(d*120+60,row*240+204);c.scale(3.8,3.8);
    drawPlayer(c,{faceX,faceY,hp:100,animationAction:row?'block':'idle',equipment:{hand1:'starter_wand',hand2:'starter_shield'}},.3,playerMotion);c.restore();
   }
   return canvas.toDataURL('image/png');
  })()`);
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
  const output=path.join(root,'test-output/hand-layer-preview.png');
  fs.writeFileSync(output,Buffer.from(png.split(',')[1],'base64'));
  console.log(output);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
