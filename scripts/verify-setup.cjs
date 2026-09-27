const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output','setup-profile'));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1440,height:940,webPreferences:{offscreen:true}});
  try {
    await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    for(const [width,height] of [[1440,940],[1000,700]]){
      win.setSize(width,height);
      for(const stage of ['lobby','create','keyboard','gallery','delete','angles','event']){
        await win.webContents.executeJavaScript(`window.setupPreview('${stage}')`);await new Promise(r=>setTimeout(r,200));
        const valid=await win.webContents.executeJavaScript(`(()=>{const d=[...document.querySelectorAll('dialog[open]')].at(-1);return !d||d.scrollWidth<=d.clientWidth+1;})()`);
        if(!valid)throw Error('Setup overflow: '+stage+' '+width);
        if(stage==='delete' && !await win.webContents.executeJavaScript("!!document.querySelector('.character-gallery.confirming')"))throw Error('Delete confirmation missing');
        fs.writeFileSync(path.join(root,'test-output',`setup-${stage}-${width}.png`),(await win.webContents.capturePage()).toPNG());
        if(stage==='gallery'){
          const independent=await win.webContents.executeJavaScript(`(()=>{
            const [a,b]=document.querySelectorAll('.character-gallery'),old=b.dataset.selected;
            const pad={axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};pad.buttons[15].pressed=true;a.handleController(pad,[]);
            if(a.dataset.selected===old||b.dataset.selected!==old)return false;
            pad.buttons[15].pressed=false;pad.buttons[0].pressed=true;a.handleController(pad,[]);
            if(a.isConnected)return false;
            return b.isConnected&&document.querySelectorAll('.character-gallery').length===1&&!document.querySelector('dialog[open]');
          })()`);
          if(!independent)throw Error('Independent player pickers failed');
        }
        if(stage==='event' && !await win.webContents.executeJavaScript(`(()=>{const e=document.querySelector('#event-card'),s=document.querySelector('.field-status');return e.getBoundingClientRect().top>=s.getBoundingClientRect().bottom+8&&parseFloat(getComputedStyle(e.querySelector('p')).fontSize)>=16;})()`))throw Error('Event overlaps status or text too small');
      }
    }
    console.log('Fourteen screenshots, independent pickers and event clearance verified.');app.exit(0);
  } catch(e){console.error(e);app.exit(1);}
});
