const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const controlHost = '127.0.0.1';
const controlPort = 4184;
const allowed = new Map([
  ['status', ['GET', '/admin/status']],
  ['save', ['POST', '/admin/save']],
  ['stop', ['POST', '/admin/stop']],
  ['announce', ['POST', '/admin/announce']],
]);

function requestControl(action, token, payload) {
  const route = allowed.get(action);
  if (!route) return Promise.reject(Error('Unknown server control action.'));
  const body = payload == null ? '' : JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: controlHost, port: controlPort, method: route[0], path: route[1],
      timeout: 4000,
      headers: {
        'x-wildbound-admin-token': String(token || '').slice(0, 256),
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, res => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { text += chunk; if (text.length > 65536) req.destroy(Error('Server response too large.')); });
      res.on('end', () => {
        let data;
        try { data = JSON.parse(text); } catch { return reject(Error('Invalid server response.')); }
        if (res.statusCode < 200 || res.statusCode >= 300)
          return reject(Error(data?.error || `Server returned ${res.statusCode}.`));
        resolve(data);
      });
    });
    req.on('timeout', () => req.destroy(Error('Server did not respond.')));
    req.on('error', reject);
    req.end(body);
  });
}

app.whenReady().then(async () => {
  const smoke = process.argv.includes('--smoke-test');
  let quitting = false;
  let tray;
  const window = new BrowserWindow({
    width: 960, height: 720, minWidth: 720, minHeight: 550,
    title: 'Wildbound Server Control', backgroundColor: '#101e1b',
    show: !smoke,
    icon: path.join(__dirname, 'assets', 'wildbound-icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'server-control-preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      offscreen: smoke,
    },
  });
  if (smoke) window.webContents.setAudioMuted(true);
  if (!smoke) {
    tray = new Tray(path.join(__dirname, 'assets', 'wildbound-icon.ico'));
    tray.setToolTip('Wildbound server status');
    tray.setContextMenu(Menu.buildFromTemplate([
      {label:'Show status',click:() => window.show()},
      {label:'Quit status monitor',click:() => {quitting = true; app.quit();}},
    ]));
    tray.on('double-click',() => window.show());
    window.on('close', event => { if (!quitting) {event.preventDefault(); window.hide();} });
  }
  ipcMain.handle('persistent-server-control', (_event, action, token, payload) => {
    if (_event.sender !== window.webContents) throw Error('Control window required.');
    if (action === 'announce') {
      const message = String(payload?.message || '').trim().slice(0, 240);
      if (!message) throw Error('Enter an announcement.');
      payload = {message};
    } else payload = undefined;
    return requestControl(action, token, payload);
  });
  window.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  await window.loadFile('server-control.html');
  if (smoke) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    const result = await window.webContents.executeJavaScript(`({
      title: document.title,
      state: document.getElementById('state').textContent,
      controlsDisabled: ['save','stop','send'].every(id => document.getElementById(id).disabled),
      noPageErrors: !!document.getElementById('notice').textContent,
    })`);
    const output = path.join(__dirname, 'test-output', 'server-control-smoke.json');
    fs.mkdirSync(path.dirname(output), {recursive:true});
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    const screenshot = await window.webContents.capturePage();
    fs.writeFileSync(path.join(__dirname, 'test-output', 'server-control-smoke.png'), screenshot.toPNG());
    console.log(JSON.stringify(result));
    app.quit();
  }
});
app.on('window-all-closed', () => app.quit());

module.exports = {requestControl};
