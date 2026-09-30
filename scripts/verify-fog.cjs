const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'fog-profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1100,height:800,webPreferences:{offscreen:true}});
 try{
  await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const png=await win.webContents.executeJavaScript(`(async()=>{
   const {drawFog}=await import('./src/weather-art.mjs');
   const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=720;const c=canvas.getContext('2d');
   const g={phase:'play',seed:42,sky:{elapsed:350},players:[{x:800,y:800,hp:100,equipment:{}}],explored:new Set()};
   for(let y=0;y<50;y++)for(let x=0;x<50;x++)if(Math.hypot(x-24,y-25)<7)g.explored.add(y*50+x);
   const camera={x:800,y:800,zoom:2};
   c.fillStyle='#8baabd';c.fillRect(0,0,1000,720);c.strokeStyle='#597b89';c.lineWidth=1;
   for(let x=-12;x<1000;x+=64)for(let y=-24;y<720;y+=64)c.strokeRect(x,y,64,64);
   drawFog(c,g,camera,1000,720);
   const alpha=[];for(const x of [500,590,650,730,850,990])alpha.push(c.getImageData(x,360,1,1).data[0]);
   if(alpha[0]<=alpha[3]||alpha[3]<=alpha[5])throw Error('Fog falloff is not visible');
   c.fillStyle='#f5e4b4';c.fillRect(495,352,10,16);return canvas.toDataURL();
  })()`);
  fs.writeFileSync(path.join(out,'fog-blended.png'),Buffer.from(png.split(',')[1],'base64'));console.log('Blended light and tile-based exploration fog rendered');app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
