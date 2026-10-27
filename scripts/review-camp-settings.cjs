const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','camp-settings-v2');
app.disableHardwareAcceleration();app.setPath('userData',path.join(output,'profile-'+Date.now()));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);const errors=[];win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 const run=source=>win.webContents.executeJavaScript(source);
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await run('window.wildboundBoot.ready');
  await run("document.getElementById('settings-button').click()");
  const checks=await run(`(()=>{
   const d=document.getElementById('settings-dialog'),checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   assert(d.querySelectorAll('[data-settings-tab]').length===3,'Exactly three tabs; Player tab removed');
   const select=d.querySelector('#board-size'),arrow=select.parentElement.querySelector('[data-camp-arrow="1"]'),before=select.value;
   arrow.click();assert(select.value!==before&&localStorage.getItem('wildbound-board-size')===select.value,'Selector arrow updates the real board setting and persistence');
   d.querySelector('[data-settings-tab=sound]').click();
   const range=d.querySelector('#music-volume'),prior=Number(range.value);range.parentElement.querySelector('[data-camp-arrow="1"]').click();
   assert(Number(range.value)>prior&&Number(localStorage.getItem('wildbound-music-volume'))===Number(range.value),'Range arrow updates real music volume and persistence');
   d.querySelector('[data-settings-tab=controls]').click();const invert=d.querySelector('#invert-aim-y');invert.click();
   assert(JSON.parse(localStorage.getItem('wildbound-camp-input')).invertY===true,'Invert toggle persists an active input setting');
   const layout=d.querySelector('#controller-layout');layout.value='alternate';layout.dispatchEvent(new Event('change'));
   assert(JSON.parse(localStorage.getItem('wildbound-mapping')).attack===0,'Layout selector changes the real game mapping');
   return checks;
  })()`);
  fs.mkdirSync(output,{recursive:true});const layouts=[];
  for(const [width,height] of [[1280,850],[600,430],[962,1635]]){
   win.setContentSize(width,height);await new Promise(r=>setTimeout(r,250));
   for(const tab of ['display','sound','controls']){
    await run(`document.querySelector('[data-settings-tab=${tab}]').click()`);
    await new Promise(r=>setTimeout(r,250));
    const layout=await run(`(()=>{const d=document.getElementById('settings-dialog'),r=d.getBoundingClientRect(),p=d.querySelector('[data-settings-panel=${tab}]'),done=d.querySelector('#close-settings').getBoundingClientRect();return {tab:'${tab}',width:innerWidth,height:innerHeight,dialog:[r.width,r.height],ratio:r.width/r.height,visible:!!p.getClientRects().length,contentHeight:p.scrollHeight,bodyHeight:d.querySelector('.settings-panels').clientHeight,doneVisible:done.bottom<=innerHeight&&done.top>=0};})()`);
    if(!layout.visible||!layout.doneVisible||Math.abs(layout.ratio-.53)>.01)throw Error('Incorrect portrait layout '+JSON.stringify(layout));
    await win.webContents.capturePage();await new Promise(r=>setTimeout(r,120));
    layouts.push(layout);fs.writeFileSync(path.join(output,`${tab}-${width}x${height}.png`),(await win.webContents.capturePage()).toPNG());
   }
  }
  await run("document.getElementById('close-settings').click();if(document.getElementById('settings-dialog').open)throw Error('Done did not close')");checks.push('Done closes the dialog');
  if(errors.length)throw Error(errors.join('\n'));
  const report={checks,layouts,rendererErrors:errors};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
