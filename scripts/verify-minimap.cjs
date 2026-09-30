const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/minimap-profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{offscreen:true}});
 win.webContents.on('console-message',(_e,...args)=>console.log('renderer',...args));
 try{
  await win.loadFile(path.join(root,'index.html'));const boot=await win.webContents.executeJavaScript('window.wildboundBoot.ready.then(()=>null).catch(e=>e.stack)');if(boot)throw Error(boot);
  const png=await win.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.environment='ice';g.start();
   Object.assign(p,{x:480,y:900,hp:50,color:'#70efbf'});g.enemies=[];g.loot=[{x:p.x,y:p.y,type:'arrow'}];g.portals=[{x:p.x,y:p.y,owner:p.id}];g.explored=new Set(Array.from({length:2500},(_,i)=>i));
   const canvas=document.createElement('canvas');canvas.width=400;canvas.height=640;const c=canvas.getContext('2d');c.scale(4,4);c.fillStyle='#172923';c.fillRect(0,0,100,160);
   Renderer.prototype.minimap.call({age:1},c,g,100,160);
   const x=Math.round((21+p.x/1600*65)*4),y=Math.round((30+p.y/1600*65)*4);
   const pixel=c.getImageData(x,y,1,1).data;if(pixel[0]!==112||pixel[1]!==239||pixel[2]!==191)throw Error('Player marker missing or covered');
   return canvas.toDataURL();
  })()`);
  fs.writeFileSync(path.join(root,'test-output/minimap-player.png'),Buffer.from(png.split(',')[1],'base64'));
  console.log('Living player marker pixels visible above overlapping loot and portal.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
