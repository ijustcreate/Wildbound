const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
const base=process.argv.includes('--packaged')?path.join(root,'dist',require('../package.json').version,'Wildbound-win32-x64/resources/app.asar'):root;
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/tv-wildbound-profile'));
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{offscreen:true}});
  const errors=[];window.webContents.on('console-message',(_,level,message)=>{if(level>=2)errors.push(message);});
  try{
    await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
    await window.webContents.executeJavaScript('window.wildboundBoot.ready');
    const flow=await window.webContents.executeJavaScript('window.verifyTvWildboundFlow()');
    if(flow.players!==2||flow.phase!=='lobby')throw Error('Integrated lobby transition failed');
    fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
    fs.writeFileSync(path.join(root,'test-output/tv-wildbound-integration.png'),Buffer.from(flow.png.split(',')[1],'base64'));
    const result=await window.webContents.executeJavaScript(`(async()=>{
      const {TvWildbound}=await import('./src/tv-wildbound.mjs');
      const {Animator}=await import('./src/animation.mjs');
      const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
      const c=canvas.getContext('2d'),animator=new Animator();
      const mode=new TvWildbound([{id:'one',name:'Scout',appearance:{},equipment:{}}],42);
      for(let i=0;i<18;i++)mode.step(.05,{});
      mode.draw(c,canvas.width,canvas.height,animator);
      const warning=canvas.toDataURL('image/png');
      for(let i=0;i<57;i++)mode.step(.05,{});
      const p=mode.players.get('one');p.x=235;
      mode.step(.016,{one:{attack:true}});
      mode.draw(c,canvas.width,canvas.height,animator);
      const intro=canvas.toDataURL('image/png');
      p.x=1830;mode.camera=1450;mode.draw(c,canvas.width,canvas.height,animator);
      const png=canvas.toDataURL('image/png');
      canvas.width=640;canvas.height=360;mode.draw(c,canvas.width,canvas.height,animator);
      return {warning,intro,png,small:canvas.toDataURL('image/png'),progress:mode.progress,camera:mode.camera,enemies:mode.enemies.map(e=>e.kind)};
    })().catch(e=>({error:e.stack}))`);
    if(result.error)throw Error(result.error);
    for(const [key,file] of [['warning','tv-wildbound-warning.png'],['intro','tv-wildbound-board.png'],['png','tv-wildbound-panorama.png'],['small','tv-wildbound-small.png']]){
      fs.writeFileSync(path.join(root,'test-output',file),Buffer.from(result[key].split(',')[1],'base64'));delete result[key];
    }
    if(errors.length)throw Error('Renderer errors: '+errors.join(' | '));
    if(!result.progress||result.camera<1000||!result.enemies.includes('lion')||!result.enemies.includes('bat'))throw Error('Mode verification failed: '+JSON.stringify(result));
    console.log(JSON.stringify({...result,integratedPlayers:flow.players}));app.exit(0);
  }catch(error){console.error(error.stack||error);app.exit(1);}
});
