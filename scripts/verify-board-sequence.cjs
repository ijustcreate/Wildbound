const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'board-roll-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1280,height:850});await win.loadFile(path.join(root,'index.html'));
const images=await win.webContents.executeJavaScript(`(async()=>{
 const {Game}=await import('./src/core.mjs');const {drawBoard}=await import('./src/board.mjs');const {drawDie}=await import('./src/render.mjs');const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.hitTable(p);
 const cv=document.createElement('canvas');cv.width=1120;cv.height=760;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 const capture=()=>{c.fillStyle='#092219';c.fillRect(0,0,1120,760);c.save();c.translate(560,370);c.scale(3.8,3.8);drawBoard(c,g,g.roll.elapsed,{closeup:true,drawDie});c.restore();return cv.toDataURL('image/png').split(',')[1];};
 for(let i=0;i<15;i++)g.update(.05);const rolling=capture();while(!g.roll.resolved)g.update(.05);const reveal=capture();
 const panel=document.getElementById('board-panel');document.body.append(panel);panel.classList.remove('hidden');panel.classList.add('board-sequence');document.body.dataset.boardSize='compact';
 const canvas=document.getElementById('board-closeup');canvas.getContext('2d').drawImage(cv,0,0,canvas.width,canvas.height);const r=panel.getBoundingClientRect();if(r.width<600||r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight)throw Error('Cinematic panel does not fit viewport: '+JSON.stringify(r.toJSON()));return {rolling,reveal};})()`);
for(const [name,png] of Object.entries(images))fs.writeFileSync(path.join(out,'board-'+name+'.png'),Buffer.from(png,'base64'));console.log('Board dice and center reveal rendered; cinematic fits viewport with compact preference');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
