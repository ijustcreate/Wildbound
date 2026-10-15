const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const r=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename],{cwd:root,env,windowsHide:true,stdio:'inherit',timeout:90000});process.exit(r.status??1);}
const {app,BrowserWindow}=require('electron');
const out=path.join(root,'test-output','performance-overlay');fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const deadline=setTimeout(()=>app.exit(1),80000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1100,height:850,webPreferences:{backgroundThrottling:false}});
 w.webContents.on('console-message',e=>{if(e.level==='error')console.error(e.message);});
 try{
  await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
  await w.webContents.executeJavaScript(`(async()=>{
   await window.wildboundBoot.ready;await window.showcase('game');
   document.querySelector('#pause-button').click();document.querySelector('#pause-dev').click();
   const b=document.querySelector('[data-debug="performance"]');if(!b)throw Error('Missing live toggle');
   if(b.getAttribute('aria-pressed')!=='false')throw Error('Not opt-in');b.click();
   await new Promise(r=>setTimeout(r,1200));
   const p=document.querySelector('#performance-overlay');if(p.hidden||!p.textContent.includes('FPS')||!p.textContent.includes('World draw'))throw Error('No real frame metrics');
   if(getComputedStyle(p).pointerEvents!=='none')throw Error('Overlay intercepts input');
   document.querySelector('[data-debug="performance-reset"]').click();
   window.overlayQA={text:p.textContent};
  })()`);
  w.setContentSize(1101,851);await new Promise(r=>setTimeout(r,500));
  fs.writeFileSync(path.join(out,'overlay.png'),(await w.webContents.capturePage()).toPNG());
  w.setContentSize(560,540);await new Promise(r=>setTimeout(r,600));
  await w.webContents.executeJavaScript(`(()=>{const p=document.querySelector('#performance-overlay'),r=p.getBoundingClientRect();if(r.left<0||r.right>innerWidth||r.bottom>innerHeight)throw Error('Small window overflow');const b=document.querySelector('[data-debug="performance"]');b.click();})()`);
  await new Promise(r=>setTimeout(r,100));
  const report=await w.webContents.executeJavaScript(`(()=>{if(!document.querySelector('#performance-overlay').hidden)throw Error('Toggle off failed');return window.overlayQA;})()`);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:true,out}));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e);clearTimeout(deadline);app.exit(1);}
});
