const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','vending-ui-'+Date.now());
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1100,height:780,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');await new Promise(r=>setTimeout(r,600));
  const controls=[];for(const family of ['xbox','switch'])controls.push(await win.webContents.executeJavaScript(`verifyVendingUI('${family}')`));
  await win.webContents.executeJavaScript(`(async()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);})()`);
  const views=[];
  for(const [width,height]of [[1100,780],[842,620],[640,480],[400,700]]){
   win.setContentSize(width,height);await new Promise(r=>setTimeout(r,100));
   views.push(await win.webContents.executeJavaScript(`(()=>{
    const {panel,draw,g,p:player}=vendingUIQA;draw();const p=panel.getBoundingClientRect(),tray=panel.querySelector('.vending-tray').getBoundingClientRect(),catalog=panel.querySelector('.vending-catalog'),selected=panel.querySelector('.vending-tray button.selected');
    const assert=(v,m)=>{if(!v)throw Error(m);};assert(p.left>=0&&p.top>=0&&p.right<=innerWidth+1&&p.bottom<=innerHeight+1,'Panel out of viewport');assert(panel.scrollWidth<=panel.clientWidth+1,'Horizontal overflow');assert(tray.bottom<=p.bottom,'Collect clipped');assert(selected,'No collect cursor');
    const last=panel.querySelector('.vending-slots button:last-child');last.scrollIntoView({block:'nearest'});assert(last.getBoundingClientRect().bottom<=catalog.getBoundingClientRect().bottom+1,'Last item unreachable '+JSON.stringify({width:innerWidth,last:last.getBoundingClientRect().toJSON(),catalog:catalog.getBoundingClientRect().toJSON(),scroll:catalog.scrollTop,height:catalog.scrollHeight,client:catalog.clientHeight}));catalog.scrollTop=0;
    g.inventoryAction(player,'up');draw();const item=panel.querySelector('.vending-slots .selected').getBoundingClientRect(),list=panel.querySelector('.vending-catalog').getBoundingClientRect();assert(item.top>=list.top-1&&item.bottom<=list.bottom+1,'Controller did not reveal selected row');g.inventoryAction(player,'down');draw();
    return {width:innerWidth,height:innerHeight,panelWidth:p.width,panelHeight:p.height,catalogScrollable:catalog.scrollHeight>catalog.clientHeight};
   })()`));
   win.setContentSize(width+4,height+4);await new Promise(r=>setTimeout(r,120));win.setContentSize(width,height);await new Promise(r=>setTimeout(r,150));
   fs.writeFileSync(path.join(out,`vending-${width}.png`),(await win.webContents.capturePage()).toPNG());
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({packaged:base!==root,controls,views,errors},null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({out,controls,views,errors}));app.exit(0);
 }catch(e){console.error(e.stack,errors);app.exit(1);}
});
