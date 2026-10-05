const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/bow-aim-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const png=await w.webContents.executeJavaScript(`(async()=>{
 const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=600;const c=canvas.getContext('2d');c.fillStyle='#21312d';c.fillRect(0,0,960,600);
 for(let row=0;row<5;row++)for(let d=0;d<8;d++){
 const [faceX,faceY]=directionVector(d),blend=row/4;c.fillStyle='#f0ddae';c.font='10px monospace';c.fillText('Aim '+blend+' / '+d,d*120+4,row*120+12);
 c.save();c.translate(d*120+60,row*120+112);c.scale(2.4,2.4);
 drawPlayer(c,{hp:100,faceX,faceY,bowVisualAngle:d*Math.PI/4,bowAimBlend:blend,bowAiming:true,charge:0,equipment:{hand1:'bow',back:'starter_quiver'},inventory:[{type:'arrow',qty:8}]},.3,playerMotion);c.restore();
 }return canvas.toDataURL('image/png');})()`);
 fs.writeFileSync(path.join(root,'test-output/bow-aim-preview.png'),Buffer.from(png.split(',')[1],'base64'));console.log('Rendered 40 aim transition poses');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
