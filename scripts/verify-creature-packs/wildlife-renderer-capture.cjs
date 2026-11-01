const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const html = path.join(__dirname, 'wildlife-renderer-preview.html');
const output = path.join(__dirname, 'wildlife-renderer-contact-sheet.png');
const isolatedProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-wildlife-preview-'));
app.setPath('userData', isolatedProfile);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 640, height: 1420, webPreferences: { backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => { if (event.level >= 2) errors.push(event.message); });
  try {
    await win.loadFile(html);
    await win.webContents.executeJavaScript('new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>window.previewReady?resolve(true):Date.now()-start>15000?reject(Error("Preview timed out")):setTimeout(poll,50);poll();})');
    if (errors.length) throw Error(errors.join('\n'));
    const image = await win.webContents.capturePage();
    fs.writeFileSync(output, image.toPNG());
    console.log(`Wrote ${output}`);
  } catch (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
  } finally {
    win.destroy();
    app.quit();
  }
});
