const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'table-depth-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false});await win.loadFile(path.join(root,'index.html'));
const png=await win.webContents.executeJavaScript(`(async()=>{
 const {Renderer}=await import('./src/render.mjs');const {Assets}=await import('./src/assets.mjs');const {Game}=await import('./src/core.mjs');
 const assets=new Assets();await assets.load();const game=new Game();game.environment='house';const p=game.addPlayer('keyboard');game.start();game.openingBoard=false;game.scenery=[];game.enemies=[];
 const live=document.createElement('canvas');live.style.width='600px';live.style.height='500px';document.body.append(live);const renderer=new Renderer(live,assets);
 const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=420;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;
 const states=[{y:775,groundHeight:0,jumpHeight:0},{y:790,groundHeight:16,jumpHeight:0},{y:805,groundHeight:16,jumpHeight:0},{y:790,groundHeight:0,jumpHeight:24}];
 for(let i=0;i<states.length;i++){
 Object.assign(p,{x:800,faceX:0,faceY:1},states[i]);Object.assign(renderer.camera,{x:800,y:780,zoom:2.8});renderer.draw(game,0);
 const board=renderer.actorQueue.findIndex(a=>a.isBoard),actor=renderer.actorQueue.findIndex(a=>a.isPlayer&&a.id===p.id);
 if(i===0?actor>=board:actor<=board)throw Error('Incorrect table ordering at state '+i);
 c.drawImage(live,0,0,600,500,i*300,0,300,380);c.fillStyle='#122b24';c.fillRect(i*300,380,300,40);c.fillStyle='#fff';c.font='15px sans-serif';c.fillText(['Behind on floor','Back half of tabletop','Front half of tabletop','Jumping above back half'][i],i*300+12,405);
 }live.remove();return sheet.toDataURL('image/png').split(',')[1];})()`);
fs.writeFileSync(path.join(out,'table-depth.png'),Buffer.from(png,'base64'));console.log('Live renderer: floor-behind occlusion, back/front tabletop support, and airborne depth passed');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
