// Verify the local art gallery with native Electron and an isolated profile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const name = process.platform === 'win32' ? 'electron.exe' : 'electron';
  const binary = path.join(root, 'node_modules', 'electron', 'dist', name);
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawnSync(binary, [__filename, ...process.argv.slice(2)], {
    cwd: root, env, stdio: 'inherit', timeout: 45000,
  });
  if (child.error) console.error(child.error);
  process.exit(child.status ?? 1);
}

const { app, BrowserWindow } = require('electron');
const gallery = path.resolve(process.argv[2] ?? path.join(root, 'docs/design/sprite-stacking-demos/index.html'));
const output = path.resolve(process.argv[3] ?? path.join(root, 'test-output', `sprite-stack-gallery-${Date.now()}.png`));
const profile = path.join(root, 'test-output', `sprite-stack-profile-${process.pid}`);
fs.mkdirSync(profile, { recursive: true });
fs.mkdirSync(path.dirname(output), { recursive: true });
app.setPath('userData', profile);
app.disableHardwareAcceleration();

const waitForPaint = win => win.webContents.executeJavaScript(`new Promise(resolve =>
  requestAnimationFrame(() => requestAnimationFrame(resolve)))`);

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false, width: 1320, height: 850, useContentSize: true,
    webPreferences: { offscreen: true, backgroundThrottling: false },
  });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  await win.loadFile(gallery);
  const run = source => win.webContents.executeJavaScript(source);
  assert.deepEqual(await run('window.wildboundGalleryReady'), { cards: 5, failed: 0 });
  const assets = await run(`Promise.all([...document.querySelectorAll('.source')].map(async link => {
    const img = new Image();
    img.src = link.href;
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  }))`);
  assert.ok(assets.length >= 15, 'Each prop should expose its concept, four views and slices');
  const checkFrames = () => run(`['[data-original]', '[data-stack]'].map(selector =>
    [...document.querySelectorAll(selector)].map(canvas => canvas.toDataURL()))`);
  const angle = value => run(`(() => {
    const slider = document.querySelector('#angle');
    slider.value = ${value};
    slider.dispatchEvent(new Event('input'));
    return document.querySelector('#degrees').value;
  })()`);
  assert.equal(await angle(0), '0°');
  const [originals, stacks] = await checkFrames();
  assert.equal(await angle(71), '71°');
  const [unturned, rotated] = await checkFrames();
  assert.deepEqual(originals, unturned);
  for (const [i, stack] of stacks.entries()) assert.notEqual(stack, rotated[i], `Stack ${i + 1} should rotate`);

  await run(`document.querySelector('#play').click()`);
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.notEqual(await run(`document.querySelector('#angle').value`), '71');
  assert.equal(await angle(24), '24°');
  assert.equal(await run(`document.querySelector('#play').getAttribute('aria-pressed')`), 'false');
  await run(`document.querySelector('[name="scale"][value="1"]').click()`);
  const [nativeOriginals, nativeStacks] = await checkFrames();
  for (const [i, image] of originals.entries()) assert.notEqual(image, nativeOriginals[i], `Original ${i + 1} should resize`);
  for (const [i, image] of rotated.entries()) assert.notEqual(image, nativeStacks[i], `Stack ${i + 1} should resize`);

  win.setContentSize(430, 650);
  await waitForPaint(win);
  const mobile = await run(`({
    viewport: document.documentElement.clientWidth,
    width: document.documentElement.scrollWidth,
    columns: getComputedStyle(document.querySelector('#demos')).gridTemplateColumns.split(' ').length,
  })`);
  assert.equal(mobile.columns, 1);
  assert.equal(mobile.width, mobile.viewport);
  await run(`document.querySelector('[name="scale"][value="3"]').click()`);
  await waitForPaint(win);
  assert.equal(await run(`getComputedStyle(document.querySelector('.comparison')).gridTemplateColumns.split(' ').length`), 1);
  win.setContentSize(1320, 850);
  await run(`document.querySelector('[name="scale"][value="2"]').click()`);
  await waitForPaint(win);
  assert.equal(await run(`getComputedStyle(document.querySelector('#demos')).gridTemplateColumns.split(' ').length`), 2);
  win.webContents.debugger.attach('1.3');
  const { cssContentSize } = await win.webContents.debugger.sendCommand('Page.getLayoutMetrics');
  const { data } = await win.webContents.debugger.sendCommand('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 },
  });
  win.webContents.debugger.detach();
  fs.writeFileSync(output, Buffer.from(data, 'base64'));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ cards: 5, assets: assets.length, mobile, rendererErrors: errors, output }, null, 2));
  win.destroy();
  app.quit();
}).catch(error => {
  console.error(error);
  app.exit(1);
});
