const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/swamp-shadow-layers');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {drawProp}=await import('./src/environment.mjs'),{drawPlayer,playerMotion}=await import('./src/player-motion.mjs');
 const {WorldLightRenderer,worldLightField}=await import('./src/world-lighting.mjs');
 const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=700;const c=sheet.getContext('2d');c.fillStyle='#78815c';c.fillRect(0,0,1200,700);c.imageSmoothingEnabled=false;
 const props=[];for(const [row,kind]of ['old_cypress','mangrove'].entries())for(const [col,seed]of [7,19,42,103].entries())props.push({id:row*4+col,kind,x:140+col*300,y:305+row*330,rootY:305+row*330,size:265,treeVariantSeed:seed,seed});
 for(const p of props){drawProp(c,p,0,{}, {dynamicShadows:true});c.fillStyle='#172e27';c.font='15px monospace';c.fillText(p.kind+' / seed '+p.treeVariantSeed,p.x-110,p.rootY+30);}
 c.save();c.translate(285,300);c.scale(1.8,1.8);drawPlayer(c,{hp:100,faceX:0,faceY:1,equipment:{}},0,playerMotion);c.restore();
 c.fillStyle='#122b25';c.font='bold 18px monospace';c.fillText('DRAFT STRUCTURE STUDY — same editable native art, varied branches/crowns',16,24);
 const motion=document.createElement('canvas');motion.width=600;motion.height=360;const pen=motion.getContext('2d'),tree={id:0,kind:'old_cypress',x:280,y:330,rootY:330,size:300};
 const render=t=>{pen.clearRect(0,0,600,360);drawProp(pen,tree,t,{}, {dynamicShadows:true});return pen.getImageData(0,0,600,360).data;};
 const a=render(0),b=render(1);let changed=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3])changed++;
 if(!changed)throw Error('Moss is still frozen');
 const light={x:100,y:330,height:30,radius:400,intensity:1,color:'#ffc76f',owner:'lamp'},renderer=new WorldLightRenderer();
 const game={scenery:[tree]},times=[];let litChanges=0,oldLit;
 for(let i=0;i<60;i++){pen.clearRect(0,0,600,360);const frame={time:i/30,sources:[light],field:worldLightField(game,[light])};const start=performance.now();renderer.drawProp(pen,tree,p=>drawProp(p,tree,frame.time,game,{dynamicShadows:true}),frame);times.push(performance.now()-start);if(i===0)oldLit=pen.getImageData(0,0,600,360).data;}
 const end=pen.getImageData(0,0,600,360).data;for(let i=0;i<end.length;i+=4)if(end[i]!==oldLit[i]||end[i+1]!==oldLit[i+1]||end[i+2]!==oldLit[i+2])litChanges++;
 if(!litChanges)throw Error('Lit cache freezes moss');times.sort((a,b)=>a-b);
 return {png:sheet.toDataURL().split(',')[1],motionChangedPixels:changed,litMotionChangedPixels:litChanges,warmMedianMs:times[30],warmP95Ms:times[57],variantSeeds:[7,19,42,103],scope:'structure variations are review-only; no saved props changed'};
 })()`);
 fs.writeFileSync(path.join(out,'tree-structure-draft.png'),Buffer.from(result.png,'base64'));delete result.png;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
