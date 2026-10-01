const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/quiver-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{offscreen:true}});
 try{
  await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const png=await w.webContents.executeJavaScript(`(async()=>{
   const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=840;const c=canvas.getContext('2d');
   c.fillStyle='#21312d';c.fillRect(0,0,960,840);
   const actions=['idle','walk','draw','ranged','dash','mine','death'];
   for(let row=0;row<actions.length;row++)for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);c.fillStyle='#e6d6ab';c.font='10px monospace';c.fillText(actions[row]+' '+d,d*120+8,row*120+12);
    c.save();c.translate(d*120+60,row*120+111);c.scale(2.4,2.4);
    drawPlayer(c,{faceX,faceY,hp:100,animationAction:actions[row],equipment:{back:'starter_quiver',hand1:'bow'},inventory:[{type:'arrow',qty:3}]},.3,playerMotion);c.restore();
   }return canvas.toDataURL('image/png');
  })()`);
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});fs.writeFileSync(path.join(root,'test-output/quiver-preview.png'),Buffer.from(png.split(',')[1],'base64'));
  console.log('Rendered 56 quiver poses in Electron');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
