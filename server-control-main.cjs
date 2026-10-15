const {app, BrowserWindow, ipcMain, Tray, Menu, clipboard, dialog} = require('electron');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

let controlHost = '127.0.0.1';
let controlPort = 4184;
let configuredToken = '';
let configuredJoinKey = '';
const configIndex = process.argv.indexOf('--config');
const configPath = configIndex >= 0 ? process.argv[configIndex+1] : path.join(__dirname,'server-data','config.json');
const smoke = process.argv.includes('--smoke-test');
if(smoke)app.disableHardwareAcceleration();
const monitorId=require('node:crypto').createHash('sha256').update(path.resolve(configPath)).digest('hex').slice(0,16);
app.setPath('userData',path.join(smoke?path.join(__dirname,'test-output'):app.getPath('appData'),'Wildbound Server Control',smoke?'smoke':monitorId));
let controlWindow;
if(!smoke){
  if(!app.requestSingleInstanceLock()){app.quit();return;}
  app.on('second-instance',()=>{if(controlWindow){if(controlWindow.isMinimized())controlWindow.restore();controlWindow.show();controlWindow.focus();}});
}
if (configPath && fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath,'utf8'));
  if (!['127.0.0.1','localhost','::1'].includes(config.adminHost)) throw Error('Admin control must use loopback.');
  controlHost = config.adminHost; controlPort = config.adminPort; configuredToken = config.adminToken;
  configuredJoinKey = config.joinToken;
}
const allowed = new Map([
  ['status', ['GET', '/admin/status']],
  ['save', ['POST', '/admin/save']],
  ['stop', ['POST', '/admin/stop']],
  ['announce', ['POST', '/admin/announce']],
]);
const diagnostics=require('./server-diagnostics.cjs').createDiagnostics(path.join(smoke?path.join(__dirname,'test-output'):path.dirname(configPath),'diagnostics'),{root:__dirname,secrets:[configuredToken,configuredJoinKey]});
function record(type,message){try{diagnostics.event(type,message);}catch(error){console.error('Diagnostic history unavailable:',error.message);}}

function requestControl(action, token, payload) {
  const route = allowed.get(action);
  if (!route) return Promise.reject(Error('Unknown server control action.'));
  const body = payload == null ? '' : JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: controlHost, port: controlPort, method: route[0], path: route[1],
      timeout: 4000,
      headers: {
        'x-wildbound-admin-token': String(token || configuredToken).slice(0, 256),
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
  let quitting = false;
  let tray;
  const window = new BrowserWindow({
    width: 1200, height: 880, minWidth: 640, minHeight: 550,
    title: 'Wildbound Server Control', backgroundColor: '#101e1b',
    show: !smoke,
    icon: path.join(__dirname, 'assets', 'wildbound-icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'server-control-preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false,
    },
  });
  controlWindow=window;
  record('monitor-start','Dashboard opened.');
  window.webContents.on('render-process-gone',(_event,details)=>record('renderer-exit',details.reason));
  window.webContents.on('console-message',(_event,level,message)=>{if(level>=3)record('renderer-error',message);});
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
    if(action==='exportReport'){
      const report=diagnostics.report();
      return dialog.showSaveDialog(window,{title:'Export Wildbound support report',defaultPath:path.join(app.getPath('desktop'),'Wildbound-support-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'),filters:[{name:'Support report',extensions:['json']}]}).then(result=>{
        if(result.canceled)return {message:'Export cancelled.'};
        fs.writeFileSync(result.filePath,JSON.stringify(report,null,2));return {message:'Support report saved. Attach it when reporting an issue.'};
      });
    }
    if(action==='copyJoinKey'){
      if(!configuredJoinKey)throw Error('No local server join key is configured.');
      clipboard.writeText(configuredJoinKey);return {message:'Join key copied. Share it only with your players.'};
    }
    if (action === 'announce') {
      const message = String(payload?.message || '').trim().slice(0, 240);
      if (!message) throw Error('Enter an announcement.');
      payload = {message};
    } else payload = undefined;
    return requestControl(action, token, payload).then(data=>{
      if(action==='status'){try{diagnostics.status(data);}catch(error){console.error('Diagnostic history unavailable:',error.message);}}
      else record('operator-action',action);
      return data;
    }).catch(error=>{record('request-error',error.message);throw error;});
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
    const liveResult={...result};
    const fixture={instanceId:'test-world',localHealth:true,publicHealth:true,authorityCount:1,tunnelCount:1,playerCount:3,rosterCount:4,uptimeSeconds:3721,lastSave:new Date().toISOString(),worldSeed:714002,tick:84340,publicAddress:'wss://example.test/game',players:[{id:1,name:'Rowan',location:'Heartwood Clearing'},{id:2,name:'Fern',location:'Forest expedition'},{id:3,name:'<img src=x onerror=alert(1)>',location:'Forest expedition'}]};
    await window.webContents.executeJavaScript(`window.serverDashboard.render(${JSON.stringify(fixture)})`);
    const checks=await window.webContents.executeJavaScript(`({rows:document.querySelectorAll('#player-list tr').length,safeText:!document.querySelector('#player-list img'),connected:window.serverDashboard.inspect().connected,overflow:document.documentElement.scrollWidth>innerWidth})`);
    await fs.promises.writeFile(path.join(__dirname,'test-output','server-dashboard-desktop.png'),(await window.webContents.capturePage()).toPNG()).catch(()=>{});
    window.setSize(680,760);await new Promise(resolve=>setTimeout(resolve,250));
    const small=await window.webContents.executeJavaScript(`({overflow:document.documentElement.scrollWidth>innerWidth})`);
    await fs.promises.writeFile(path.join(__dirname,'test-output','server-dashboard-small.png'),(await window.webContents.capturePage()).toPNG()).catch(()=>{});
    await window.webContents.executeJavaScript(`window.serverDashboard.render(${JSON.stringify({...fixture,players:[],playerCount:0})});window.serverDashboard.offline('Test offline state')`);
    const offline=await window.webContents.executeJavaScript(`({disabled:document.getElementById('save').disabled&&document.getElementById('stop').disabled,cleared:document.getElementById('players').textContent==='—'})`);
    Object.assign(result,{live:liveResult,checks,small,offline,failed:checks.rows!==3||!checks.safeText||!checks.connected||checks.overflow||small.overflow||!offline.disabled||!offline.cleared?1:0});
    const output = path.join(__dirname, 'test-output', 'server-control-smoke.json');
    fs.mkdirSync(path.dirname(output), {recursive:true});
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    const screenshot = await window.webContents.capturePage();
    fs.writeFileSync(path.join(__dirname, 'test-output', 'server-control-smoke.png'), screenshot.toPNG());
    console.log(JSON.stringify(result));
    app.exit(result.failed);
  }
});
app.on('window-all-closed', () => app.quit());

module.exports = {requestControl};
