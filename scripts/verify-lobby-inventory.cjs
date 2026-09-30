const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/lobby-inventory-profile'));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1440,height:940,webPreferences:{offscreen:true}});
  try{
    await win.loadFile(path.join(root,'index.html'));
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const assert=(value,message)=>{if(!value)throw Error(message);};
      const pause=()=>new Promise(resolve=>setTimeout(resolve,120));
      const key=async(code,key)=>{window.dispatchEvent(new KeyboardEvent('keydown',{code,key,bubbles:true,cancelable:true}));await pause();window.dispatchEvent(new KeyboardEvent('keyup',{code,key,bubbles:true}));await pause();};
      const click=text=>{const b=[...document.querySelectorAll('.lobby-player-panel button')].find(b=>b.textContent===text);assert(b,'Missing '+text);b.click();};
      await key('Enter','Enter');click('+ New character');click('Create & join');await pause();
      await key('KeyI','i');
      assert(document.querySelector('#lobby #hero-overlays .hero-panel'),'Lobby inventory is visible');
      assert(document.querySelector('.hero-panel [data-action="close"]'),'Inventory close button exists');
      await key('Escape','Escape');assert(!document.querySelector('.hero-panel'),'Escape closes inventory');
      await key('KeyI','i');await key('KeyI','i');assert(!document.querySelector('.hero-panel'),'I toggles inventory');
      await key('KeyI','i');
      return 'Keyboard join, inventory open, Escape close, and I toggle passed';
    })()`);
    fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
    fs.writeFileSync(path.join(root,'test-output/lobby-inventory.png'),(await win.webContents.capturePage()).toPNG());
    console.log(result);app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
});
