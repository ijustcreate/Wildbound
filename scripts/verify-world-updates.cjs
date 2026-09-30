const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
const appRoot=process.argv.includes('--packaged')?path.join(root,'dist',require('../package.json').version,'Wildbound-win32-x64/resources/app.asar'):root;
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'world-update-profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{offscreen:true}});
 try{
  await win.loadFile(path.join(appRoot,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  await win.webContents.executeJavaScript("window.showcase('opening-board')");
  fs.writeFileSync(path.join(out,'opening-board-updated.png'),(await win.webContents.capturePage()).toPNG());
  await win.webContents.executeJavaScript('window.previewGhostMinions()');
  await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  fs.writeFileSync(path.join(out,'minion-roster-updated.png'),(await win.webContents.capturePage()).toPNG());
  const images=await win.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{Assets}=await import('./src/assets.mjs');
   const {PlayableLobby}=await import('./src/playable-lobby.mjs'),{LobbyPractice}=await import('./src/lobby-practice.mjs'),{damageEnemy}=await import('./src/enemy-damage.mjs');
   const {drawWaterSurface}=await import('./src/water-surface.mjs');
   const assets=new Assets();await assets.load();const g=new Game();g.phase='play';g.openingBoard=false;g.generatedEnvironment='forest';g.terrain.fill('grass');g.house=null;g.scenery=[];g.enemies=[];g.time=2;
   for(let y=8;y<=17;y++)for(let x=8;x<=17;x++)g.terrain[y*50+x]=(x===8||x===17)?'shallow':y===12?'bridge':'water';
   const p=g.addPlayer('keyboard','Pip');Object.assign(p,{x:400,y:400,swimming:true,underBridge:true});
   const canvas=document.createElement('canvas');canvas.style.width='960px';canvas.style.height='640px';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets);renderer.camera={x:416,y:416,zoom:1};renderer.draw(g,0);
   const water=canvas.toDataURL();
   const probe=document.createElement('canvas');probe.width=probe.height=32;const pc=probe.getContext('2d');
   const light=()=>{const pixels=pc.getImageData(0,0,32,32).data;let n=0;for(let i=0;i<pixels.length;i+=4)n+=(pixels[i]+pixels[i+1]+pixels[i+2])/3;return n/1024;};
   g.terrain[0]='water';drawWaterSurface(pc,g,0,0,32,32);const deep=light();g.terrain[0]='shallow';drawWaterSurface(pc,g,0,0,32,32);if(light()<deep+30)throw Error('Shallow water lacks contrast');
   const targetCanvas=document.createElement('canvas');targetCanvas.width=1024;targetCanvas.height=620;
   const lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{canvas:targetCanvas,practice:new LobbyPractice(),getGame:()=>({players:[]}),difficultyArt:new Image()});
   lobby.difficultyArt.src='./assets/difficulty-icons.png';await lobby.difficultyArt.decode();
   for(const type of ['physical','fire','ice']){damageEnemy(lobby.practice.targets[3],type==='physical'?42:16,type);lobby.practice.updateTargets(.09);}
   lobby.draw();return {water,targets:targetCanvas.toDataURL()};
  })()`);
  for(const [name,data] of Object.entries(images))fs.writeFileSync(path.join(out,name+'-updated.png'),Buffer.from(data.split(',')[1],'base64'));
  console.log('Opening board, portrait, water depth contrast, bridge layer, and stacked damage rendered');app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
