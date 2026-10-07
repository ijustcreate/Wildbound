const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/starter-chest-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true}});
 const run=async source=>{const result=await w.webContents.executeJavaScript('(async()=>{try{return await ('+source+');}catch(e){return {verificationError:e.stack};}})()');if(result?.verificationError)throw Error(result.verificationError);return result;};
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('window.wildboundBoot.ready');
  const result=await run('window.verifyStarterChestControls()');console.log(result.checks);
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
  const art=await run(`(async()=>{const {drawStarterChest}=await import('./src/starter-chest.mjs');const a=document.createElement('canvas');a.width=600;a.height=240;const c=a.getContext('2d');c.fillStyle='#3c4844';c.fillRect(0,0,600,240);c.imageSmoothingEnabled=false;c.scale(2,2);drawStarterChest(c,{x:75,y:78},0);drawStarterChest(c,{x:225,y:78},1);return a.toDataURL();})()`);
  fs.writeFileSync(path.join(root,'test-output/starter-chest-art.png'),Buffer.from(art.split(',')[1],'base64'));
  fs.writeFileSync(path.join(root,'test-output/starter-chest-ui.png'),(await w.webContents.capturePage()).toPNG());
  for(const [width,height] of [[1280,850],[780,600],[600,430]]){
   w.setContentSize(width,height);await new Promise(r=>setTimeout(r,300));
   const layout=await run(`(()=>{const p=document.querySelector('.hero-panel.loot-popup');if(!p||p.querySelectorAll('.storage-slots button').length!==48)throw Error('Lost chest slots');const r=p.getBoundingClientRect();for(const b of p.querySelectorAll('.storage-slots button,.storage-popup-actions button')){const a=b.getBoundingClientRect();if(a.left<r.left-1||a.right>r.right+1||a.top<r.top-1||a.bottom>r.bottom+1)throw Error('Clipped starter slot/button '+b.dataset.action);if(a.height<20)throw Error('Collapsed starter slot '+JSON.stringify({height:a.height,panel:[r.width,r.height],classes:p.className,children:[...p.children].map(e=>[e.className,e.getBoundingClientRect().height])}));}const columns=getComputedStyle(p.querySelector('.storage-slots')).gridTemplateColumns.split(' ').length,{g,p:hero}=window.starterVerification;g.inventoryAction(hero,'select:0');g.inventoryAction(hero,'down');if(hero.ui.index!==columns)throw Error('D-pad stride does not match resized chest');return {viewport:[innerWidth,innerHeight],chest:[r.width,r.height],slots:48,columns};})()`);console.log(layout);
  }
  app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
