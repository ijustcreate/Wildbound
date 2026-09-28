const http = require('node:http');
const path = require('node:path');
const {existsSync} = require('node:fs');
const {spawn} = require('node:child_process');
const url = 'http://127.0.0.1:4173/';
function browserLaunch() {
  if (process.platform === 'win32') {
    const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
    for (const relative of ['Google/Chrome/Application/chrome.exe', 'Microsoft/Edge/Application/msedge.exe']) {
      const executable = roots.map(root => path.join(root, relative)).find(existsSync);
      if (executable) return {command: executable, args: ['--app=' + url, '--start-fullscreen']};
    }
    throw Error('Fullscreen game mode needs Chrome or Edge installed.');
  }
  return {command: process.platform === 'darwin' ? 'open' : 'xdg-open', args: [url]};
}
function ready() {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(res.statusCode === 200 && body.includes('Wildbound')));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => req.destroy());
  });
}
(async () => {
  if (!await ready()) {
    const server = spawn(process.execPath, [path.join(__dirname, 'serve.cjs')], {
      cwd: path.resolve(__dirname, '..'), detached: true, stdio: 'ignore', windowsHide: true,
    });
    server.unref();
  }
  for (let i = 0; i < 30; i++) {
    if (await ready()) {
      const launch = browserLaunch();
      if (process.argv.includes('--check')) { console.log('Wildbound server ready: ' + url); console.log(JSON.stringify(launch)); return; }
      const browser = spawn(launch.command, launch.args, {stdio: 'ignore', detached: true});
      browser.on('error', error => { console.error('Open ' + url + ' in your browser. ' + error.message); });
      browser.unref();
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw Error('Could not start the browser game on port 4173. Another application may be using that port.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
