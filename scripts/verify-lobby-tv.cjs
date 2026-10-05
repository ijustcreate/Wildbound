const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/tv-profile'));
app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,webPreferences:{offscreen:true}});
 try{
  await window.loadFile(path.join(root,'index.html'));
  await window.webContents.executeJavaScript('window.wildboundBoot.ready');
  const png=await window.webContents.executeJavaScript(`(async()=>{
   const {LobbyTelevision,drawLobbyTelevision}=await import('./src/lobby-tv.mjs');
   const {TV_SCENES_PER_LEVEL,TV_SECTION_TILES}=await import('./src/lobby-tv-levels.mjs');
   const canvas=document.createElement('canvas');canvas.width=1040;canvas.height=680;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#263231';c.fillRect(0,0,1040,680);
   const end=TV_SCENES_PER_LEVEL*TV_SECTION_TILES*16;
   const states=[{level:1,camera:0,time:1},{level:1,camera:end+185,time:7},{level:2,camera:0,time:1},{level:2,camera:end+185,time:7}];
   for(let i=0;i<states.length;i++){
    const tv=new LobbyTelevision(42);tv.join('one');Object.assign(tv,states[i]);
    const x=(i%2)*520,y=Math.floor(i/2)*340;
    c.fillStyle='#eedcae';c.font='18px monospace';c.fillText('Level 1-'+tv.level+(i%2?' finish':' start'),x+12,y+23);
    c.imageSmoothingEnabled=false;tv.draw(c,x+4,y+38,512,288);
   }
   return canvas.toDataURL('image/png');
  })()`);
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
  const output=path.join(root,'test-output/lobby-tv-preview.png');
  fs.writeFileSync(output,Buffer.from(png.split(',')[1],'base64'));
  console.log(output);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
