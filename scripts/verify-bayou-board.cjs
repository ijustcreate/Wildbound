const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const child=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:90000});if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);process.exit(child.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/bayou-board');fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));const deadline=setTimeout(()=>app.exit(1),80000);
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}}),errors=[];win.webContents.setAudioMuted(true);win.webContents.on('render-process-gone',(_,details)=>errors.push(details.reason));win.webContents.on('console-message',event=>{if(event.level==='error'&&/Error|Exception|Uncaught/.test(event.message))errors.push(event.message);});
try{await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
const report=await win.webContents.executeJavaScript(`(async()=>{
 const {drawBoard,boardPoint}=await import('./src/board.mjs');const {BOARD_ART_ASSETS}=await import('./src/board-art.mjs');const {DEFAULT_BOARD_SETTINGS}=await import('./src/board-settings.mjs');
 const checks=[],pictures={},assert=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
 assert(BOARD_ART_ASSETS.swamp.endsWith('board-bayou-v1.png'),'Bayou selects its own framed board');
 await Promise.all(Object.values(BOARD_ART_ASSETS).map(async src=>{const image=new Image();image.src=new URL(src,new URL('./src/board-art.mjs',location.href));await image.decode();}));await new Promise(r=>setTimeout(r,100));
 for(const [width,height]of [[1280,900],[640,420]]){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d'),scale=Math.min(width/280,height/192);c.translate(width/2,height/2);c.scale(scale,scale);
 const game={generatedEnvironment:'swamp',players:[],roll:null,event:null},settings={...DEFAULT_BOARD_SETTINGS};const sources=[],draw=c.drawImage.bind(c);c.drawImage=(image,...args)=>{if(image.src)sources.push(image.src);draw(image,...args);};drawBoard(c,game,0,{settings});
 assert(sources.some(src=>src.endsWith('board-bayou-v1.png')),width+'px actual board uses Bayou texture');
 for(let i=0;i<47;i++){const p=boardPoint(i),x=Math.floor(width/2+p.x*scale),y=Math.floor(height/2+p.y*scale),pixel=c.getImageData(x,y,1,1).data;assert(pixel[0]>120&&pixel[1]>110&&pixel[2]>80,width+'px stone landing '+i);}
 pictures['bayou-'+width]=canvas.toDataURL();
 let anchor;const ellipse=c.ellipse.bind(c);c.ellipse=(...args)=>{anchor=c.getTransform();ellipse(...args);};game.players=[{id:1,color:'#b9dbbc',boardProgress:0}];
 for(let i=0;i<=48;i++){game.players[0].boardProgress=i;drawBoard(c,game,2,{settings});const p=boardPoint(i);assert(Math.abs(anchor.e-(width/2+p.x*scale))<.001&&Math.abs(anchor.f-(height/2+p.y*scale))<.001,width+'px pawn anchor '+i);}
 game.players=Array.from({length:6},(_,i)=>({id:i+1,color:'#b9dbbc',boardProgress:16}));drawBoard(c,game,3,{settings});pictures['bayou-party-'+width]=canvas.toDataURL();
 }
 return {checks,pictures};})()`);
for(const [name,data]of Object.entries(report.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));if(errors.length)throw Error(errors.join('\n'));const result={passed:report.checks.length,failed:0,muted:win.webContents.isAudioMuted(),errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));clearTimeout(deadline);app.exit(0);
}catch(error){console.error(error.stack);clearTimeout(deadline);app.exit(1);}});
