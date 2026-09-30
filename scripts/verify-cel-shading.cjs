const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',path.join(out,'cel-shading-profile'));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1280,height:850});
  try {
    await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const {setCelShading,applyCelShading}=await import('./src/cel-shading.mjs');
      const canvas=document.createElement('canvas');canvas.width=320;canvas.height=200;
      const c=canvas.getContext('2d');
      function paint(){c.resetTransform();c.fillStyle='#18382c';c.fillRect(0,0,320,200);
        c.fillStyle='#e9a44d';for(let y=20;y<170;y+=8)c.fillRect(30+(y-20)/2,y,130,8);
        c.fillStyle='#e03020';c.fillRect(0,0,20,20);c.fillStyle='#2030e0';c.fillRect(0,180,20,20);}
      setCelShading(false);paint();const before=canvas.toDataURL();
      if(applyCelShading(c)!==false||canvas.toDataURL()!==before)throw Error('Off mode changed pixels');
      setCelShading(true);c.setTransform(2,0,0,2,3,4);c.globalAlpha=.7;c.imageSmoothingEnabled=false;
      if(!applyCelShading(c))throw Error('GPU shader unavailable');
      if(c.globalAlpha<.69||c.getTransform().e!==3||c.imageSmoothingEnabled)throw Error('Canvas state was not preserved');
      const after=canvas.toDataURL();if(before===after)throw Error('Shader had no visible effect');
      const top=c.getImageData(5,5,1,1).data,bottom=c.getImageData(5,190,1,1).data;
      if(top[0]<top[2]||bottom[2]<bottom[0])throw Error('Image orientation changed');
      const pixels=c.getImageData(0,0,320,200).data;let blended=0;
      for(let y=25;y<165;y++)for(let x=25;x<245;x++){const i=(y*320+x)*4;if(pixels[i]>45&&pixels[i]<210)blended++;}
      if(blended<50)throw Error('Staircase edges were not smoothed');
      canvas.width=641;canvas.height=359;paint();if(!applyCelShading(c))throw Error('Resize failed');
      setCelShading(false);canvas.width=320;canvas.height=200;paint();
      if(canvas.toDataURL()!==before)throw Error('Off did not restore exact pixels');
      const toggle=document.getElementById('cel-shading-toggle');toggle.checked=false;toggle.click();
      if(localStorage.getItem('wildbound-cel-shading')!=='on')throw Error('Toggle was not saved');
      return {before,after,blended};
    })()`);
    for(const name of ['before','after'])fs.writeFileSync(path.join(out,'cel-'+name+'.png'),Buffer.from(result[name].split(',')[1],'base64'));
    await win.reload();
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    if(!await win.webContents.executeJavaScript("document.getElementById('cel-shading-toggle').checked"))throw Error('Preference did not survive reload');
    await win.webContents.executeJavaScript("window.showcase('opening-board')");
    await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    fs.writeFileSync(path.join(out,'cel-world.png'),(await win.webContents.capturePage()).toPNG());
    await win.webContents.executeJavaScript("document.getElementById('settings-button').click()");
    await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    fs.writeFileSync(path.join(out,'cel-settings.png'),(await win.webContents.capturePage()).toPNG());
    console.log('PASS: GPU smoothing, '+result.blended+' blended edge pixels, orientation, canvas state, resizing, exact off rendering, settings and reload persistence.');
    app.exit(0);
  } catch(error) {console.error(error);app.exit(1);}
});
