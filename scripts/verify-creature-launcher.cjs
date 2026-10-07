// Boot the launcher's actual source entry in a fresh diagnostic-only profile.
// The desktop shortcut itself keeps using normal saves; this check never does.
const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const child=require('node:child_process').spawnSync(path.join(root,'test-output/electron-41.10.7/electron.exe'),[__filename],{cwd:root,env,encoding:'utf8',timeout:70000});
 if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);if(child.error)console.error(child.error);process.exit(child.status??1);
}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output','creature-launcher-qa-'+Date.now()+'-'+process.pid);fs.mkdirSync(out,{recursive:true});app.setAppPath(root);app.setVersion(require(path.join(root,'package.json')).version);app.setPath('userData',path.join(out,'profile'));app.disableHardwareAcceleration();
const deadline=setTimeout(()=>app.exit(1),60000);process.argv.push('--no-live-diagnostics');require(path.join(root,'main.cjs'));
app.whenReady().then(async()=>{
 try{
  const w=BrowserWindow.getAllWindows()[0];if(!w)throw Error('Actual main entry created no window');w.webContents.setAudioMuted(true);
  if(w.webContents.isLoadingMainFrame()||w.webContents.getURL()==='')await new Promise((resolve,reject)=>{w.webContents.once('did-finish-load',resolve);w.webContents.once('did-fail-load',(_e,code,text)=>reject(Error(code+' '+text)));});
  const report=await w.webContents.executeJavaScript(`(async()=>{await window.wildboundBoot.ready;await new Promise(r=>setTimeout(r,1200));const [{EVENTS},{effects},{WILD_FAUNA_KINDS}]=await Promise.all([import('./src/core.mjs'),import('./src/particles.mjs'),import('./src/wild-fauna-data.mjs')]);return {events:EVENTS.filter(e=>['succubus','imp','zombie'].includes(e.kind)).map(e=>({kind:e.kind,count:e.count})),blackHole:effects['px-black-hole'].name,pigs:WILD_FAUNA_KINDS.filter(k=>k.startsWith('pig')),lobby:!!document.querySelector('.playable-lobby'),loaded:document.getElementById('loading').classList.contains('done'),profileBridge:typeof window.desktop?.loadProfiles};})()`);
  if(report.events.length!==3||report.events[0].count!==2||report.events[1].count!==3||report.pigs.length!==2||!report.lobby||!report.loaded||report.profileBridge!=='function')throw Error('Updated source did not finish actual lobby boot: '+JSON.stringify(report));
  fs.writeFileSync(path.join(out,'source-lobby.png'),(await w.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:1,failed:0,source:app.getAppPath(),profile:app.getPath('userData'),report},null,2));console.log(JSON.stringify({passed:1,failed:0,out,source:app.getAppPath(),report},null,2));clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error.stack);fs.writeFileSync(path.join(out,'failure.txt'),error.stack);clearTimeout(deadline);app.exit(1);}
});
