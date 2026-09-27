const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output','expansion-profile'));
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1440,height:940,webPreferences:{offscreen:true}});try{
 await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 for(const stage of ['rigs','house','ice','blizzard']){const data=await win.webContents.executeJavaScript(`window.expansionPreview('${stage}')`);fs.writeFileSync(path.join(root,'test-output',`expansion-${stage}.png`),Buffer.from(data.split(',')[1],'base64'));}
 console.log('Four expansion previews rendered.');app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
