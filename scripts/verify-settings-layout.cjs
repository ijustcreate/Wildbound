const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-output', 'settings-layout.png');
app.disableHardwareAcceleration();
app.setPath('userData', path.join(root, 'test-output', 'settings-layout-profile'));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 820, height: 680 });
  await win.loadFile(path.join(root, 'index.html'));
  await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result = await win.webContents.executeJavaScript(`(() => {
    const dialog=document.querySelector('#settings-dialog');
    dialog.showModal();
    document.querySelector('[data-settings-tab="explorer"]').click();
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
    const tabs=document.querySelector('.settings-tabs'), panels=document.querySelector('.settings-panels');
    const active=document.querySelector('[data-settings-panel="explorer"]');
    return {dialog:rect(dialog),tabs:rect(tabs),panels:rect(panels),active:rect(active),hidden:[...document.querySelectorAll('[data-settings-panel][hidden]')].length};
  })()`);
  fs.writeFileSync(out, (await win.webContents.capturePage()).toPNG());
  console.log(JSON.stringify(result));
  if (result.tabs.h > 80 || result.panels.h < 120 || result.hidden !== 2) throw Error('Settings layout failed');
  app.exit(0);
}).catch(error => { console.error(error.stack || error); app.exit(1); });
