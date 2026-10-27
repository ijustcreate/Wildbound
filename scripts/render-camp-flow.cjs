const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output','camp-flow-profile'));
app.whenReady().then(async()=>{
 try{
  const win=new BrowserWindow({show:false,width:1300,height:1500,useContentSize:true});win.webContents.setAudioMuted(true);
  await win.loadFile(path.join(root,'docs/art/settings-button-flow.html'));
  const height=await win.webContents.executeJavaScript('document.documentElement.scrollHeight');win.setContentSize(1300,height);
  await win.webContents.capturePage();await new Promise(r=>setTimeout(r,150));
  fs.writeFileSync(path.join(root,'docs/art/settings-button-flow.png'),(await win.webContents.capturePage()).toPNG());app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
