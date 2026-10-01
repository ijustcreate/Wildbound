const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/tv-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1100,height:740,webPreferences:{offscreen:true}});
 try{
  await w.loadFile(path.join(root,'index.html'));
  await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {LobbyTelevision}=await import('./src/lobby-tv.mjs');
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=620;
   const c=canvas.getContext('2d');c.fillStyle='#102820';c.fillRect(0,0,1024,620);
   const tv=new LobbyTelevision(42);tv.join('one');tv.join('two');
   tv.step(.016,{});tv.draw(c,0,0,512,288);
   const a=tv.players.get('one'),b=tv.players.get('two');
   tv.camera=280;Object.assign(a,{x:320,y:104,invulnerable:0});Object.assign(b,{x:360,y:56,invulnerable:0});tv.spawnEnemies();tv.draw(c,512,0,512,288);
   const pipe=tv.blocks(320,420).find(v=>v.kind==='pipe');tv.enterPipe(pipe);tv.coins=12;
   tv.draw(c,0,310,512,288);
   tv.usePipe();tv.camera=448;Object.assign(a,{x:480,y:104});Object.assign(b,{x:496,y:104});tv.spawnEnemies();tv.draw(c,512,310,512,288);
   return {png:canvas.toDataURL('image/png'),area:tv.area,coins:tv.coins,players:tv.players.size};
  })()`);
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
  fs.writeFileSync(path.join(root,'test-output/lobby-tv-preview.png'),Buffer.from(result.png.split(',')[1],'base64'));
  delete result.png;console.log(JSON.stringify(result));app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
