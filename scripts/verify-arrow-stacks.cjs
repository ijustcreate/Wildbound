const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/arrow-stack-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const png=await w.webContents.executeJavaScript(`(async()=>{
 const {drawEmbeddedArrow}=await import('./src/embedded-arrow.mjs');
 const canvas=document.createElement('canvas');canvas.width=800;canvas.height=380;const c=canvas.getContext('2d');c.fillStyle='#60676a';c.fillRect(0,0,800,380);c.scale(2,2);
 for(let row=0;row<2;row++)for(let i=0;i<4;i++){const x=50+i*100,y=50+row*85;drawEmbeddedArrow(c,{x,y,z:row?15:0,angle:[0,-.6,1.5,3][i],qty:[1,5,10,100][i],surfaceEmbedded:!!row},2);}
 return canvas.toDataURL();})()`);
 fs.writeFileSync(path.join(root,'test-output/arrow-stacks.png'),Buffer.from(png.split(',')[1],'base64'));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
