const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const base = path.resolve(process.env.WILDBOUND_VERIFY_APP || root);

if (!process.versions.electron) {
 const env = {...process.env};
 delete env.ELECTRON_RUN_AS_NODE;
 const exe = process.platform === 'win32' ? 'electron.exe' : 'electron';
 const child = spawnSync(path.join(root, 'node_modules', 'electron', 'dist', exe), [__filename, '--mute-audio'], {
  cwd: root, env, encoding: 'utf8', timeout: 145000, windowsHide: true,
 });
 process.stdout.write(child.stdout || '');
 process.stderr.write(child.stderr || '');
 if (child.error) console.error(child.error);
 process.exit(child.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
const out = path.join(root, 'test-output', 'wilds-light-and-clock', base === root ? 'source' : 'packaged');
fs.mkdirSync(out, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-light-clock-')));
app.commandLine.appendSwitch('mute-audio');
const timeout = setTimeout(() => app.exit(1), 135000);

app.whenReady().then(async () => {
 const win = new BrowserWindow({show: false, width: 1200, height: 780, webPreferences: {backgroundThrottling: false}});
 win.webContents.setAudioMuted(true);
 const errors = [];
 win.webContents.on('console-message', event => {
  if (event.level === 'error') errors.push(event.message);
 });
 try {
  await win.loadFile(path.join(base, 'index.html'), {query: {tools: '1'}});
  const {images, ...result} = await win.webContents.executeJavaScript(`(${survey})()`);
  for (const [name, data] of Object.entries(images)) {
   fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
  }
  const report = {base, ...result, errors, muted: win.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  app.exit(report.failure || errors.length || !report.muted ? 1 : 0);
 } catch (error) {
  console.error(error.stack);
  app.exit(1);
 } finally {
  clearTimeout(timeout);
 }
});

async function survey() {
 await wildboundBoot.ready;
 const load = name => import('./src/' + name + '.mjs');
 const [{Game}, {Renderer}, {enterWildLands}, {equip, give}, {lightSources, timeOfDay}, {saveCameraSettings},
  {switchAlleyLayer}] = await Promise.all([
  'core', 'render', 'wild-lands', 'items', 'night-cycle', 'multiplayer-camera', 'diagon-alley',
 ].map(load));
 const nextFrame = window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame = () => 0;
 await new Promise(resolve => nextFrame(resolve));

 const tools = wildboundPolishTest;
 const g = new Game(() => .5, {deferWorld: true});
 const p = g.addPlayer('keyboard', 'Torch bearer');
 const second = g.addPlayer('pad-0', 'Second explorer');
 g.players = [p];
 g.persist = g.onSound = () => {};
 g.spriteLibrary = tools.assets.library;
 tools.game = g;
 if (!enterWildLands(g, {persistent: true, homeStart: true}).ok) throw Error('Could not enter the native Wilds');
 tools.show('play');
 const t = g.trainTest;
 t.noticeUntil = 0;
 t.preparing = false;
 const canvas = document.getElementById('game-canvas');
 const renderer = new Renderer(canvas, tools.assets);
 tools.renderer = renderer;
 const place = (actor, x, y) => Object.assign(actor, {x, y, invuln: 999, trainGround: 0, trainVisualLift: 0,
  groundHeight: 0, jumpHeight: 0, swimming: false, ui: null});
 // The flat Tideglass path keeps ground probes separate from the held sprite and static lights.
 place(p, 16680, 4820);

 const checks = [], samples = {}, images = {};
 const expect = (value, message) => {
  if (!value) throw Error(message);
  checks.push(message);
 };
 const labels = [];
 const originalText = CanvasRenderingContext2D.prototype.fillText;
 CanvasRenderingContext2D.prototype.fillText = function (label, x, y, ...rest) {
  if (this.canvas === canvas) labels.push({label: String(label), x, y, align: this.textAlign, width: this.measureText(label).width});
  return originalText.call(this, label, x, y, ...rest);
 };
 const draw = (name, dt = 0, fixedCamera = false) => {
  labels.length = 0;
  renderer.draw(g, dt, {sealCapture: fixedCamera});
  if (name) images[name] = canvas.toDataURL();
  return [...labels];
 };
 const settleTerrain = async (fixedCamera = false) => {
  const until = performance.now() + 27000;
  do {
   draw(null, 0, fixedCamera);
   const stream = t.terrainStream;
   // Warm the normal minimap bitmap ahead of unrelated background prefetch.
   stream?.request('map', 'map', {size: 320, height: 192}, 240);
   if (stream?.ready.has('map') && t.streamCoverage.groundPending === 0) return true;
   await new Promise(resolve => setTimeout(resolve, 140));
  } while (performance.now() < until);
  throw Error(`Terrain Worker did not finish: ${JSON.stringify(t.streamCoverage)}; map=${t.terrainStream?.ready.has('map')}`);
 };
 const getPixels = () => renderer.ctx.getImageData(0, 0, canvas.width, canvas.height).data;
 const setTime = elapsed => {
  g.sky.elapsed = elapsed;
  g.sky.phase = timeOfDay(g);
 };
 const lightForPlayer = () => lightSources(g).find(source => source.owner === `actor:${p.id}`);
 const clockFits = ({x, y, align, width}) => {
  const left = align === 'center' ? x - width / 2 : ['right', 'end'].includes(align) ? x - width : x;
  return left >= 0 && left + width <= renderer.viewport.w && y >= 4 && y + 4 <= renderer.viewport.h;
 };
 const clockFrame = (time, phase, imageName = null, dt = 0) => {
  const frame = draw(imageName, dt);
  const timeLabels = frame.filter(row => row.label === time);
  const phaseLabel = frame.find(row => row.label.toLowerCase() === phase);
  expect(timeLabels.length === 1 && clockFits(timeLabels[0]) && phaseLabel && clockFits(phaseLabel),
   `The Wilds displays one visible ${phase} clock at ${time}`);
 };

 function compareGround(unlit, lit, start, end) {
  const {w, h} = renderer.viewport, cam = renderer.camera;
  const density = canvas.width / w;
  const luminance = (data, i) => .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
  let count = 0, total = 0, warmed = 0, warmShift = 0;
  for (let dy = -end; dy <= end; dy += 4) for (let dx = -end; dx <= end; dx += 4) {
   const radius = Math.hypot(dx, dy);
   if (radius < start || radius > end) continue;
   const px = Math.floor((w / 2 + (p.x + dx - cam.x) * cam.zoom) * density);
   const py = Math.floor((h / 2 + (p.y + dy - cam.y) * cam.zoom) * density);
   if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;
   const index = (py * canvas.width + px) * 4;
   const change = luminance(lit, index) - luminance(unlit, index);
   total += change;
   warmed += change > 4;
   warmShift += (lit[index] - unlit[index]) - (lit[index + 2] - unlit[index + 2]);
   count++;
  }
  return {count, brighterFraction: warmed / count, luminance: total / count, warmShift: warmShift / count};
 }

 try {
  setTime(360);
  g.weather = null;
  expect(await settleTerrain(), 'The normal terrain Worker supplies the scene and minimap before visual checks');

  for (const [elapsed, time, phase, photo] of [
   [0, '06:00', 'day', '03-day'], [240, '18:00', 'dusk'], [300, '21:00', 'night'],
   [360, '00:00', 'night'], [450, '04:30', 'dawn', '04-dawn'],
  ]) {
   setTime(elapsed);
   clockFrame(time, phase, photo);
  }
  setTime(480 - .04);
  g.update(.05, {keyboard: {}});
  expect(g.sky.elapsed >= 480 && g.sky.days === 1, 'A normal Wilds update rolls into the next day');
  clockFrame('06:00', 'day');
  setTime(359.96);
  g.update(.05, {keyboard: {}});
  expect(g.sky.elapsed >= 360, 'A normal Wilds update advances the displayed in-game time');
  clockFrame('00:00', 'night');

  canvas.style.width = '670px';
  canvas.style.height = '460px';
  clockFrame('00:00', 'night', '05-narrow-clock');
  canvas.style.removeProperty('width');
  canvas.style.removeProperty('height');
  saveCameraSettings({enabled: true, dynamicSplit: true, reducedMotion: true});
  place(second, 15430, 4890);
  g.players.push(second);
  for (let frame = 0; frame < 8; frame++) draw(null, .15);
  expect(renderer.splitViews?.length === 2, 'Two separated Wilds players enter split camera');
  clockFrame('00:00', 'night', '06-shared-split-clock', .15);
  t.wildLandsOverview = true;
  expect(!draw().some(row => row.label === '00:00'), 'The full-map overlay stays free of the clock widget');
  t.wildLandsOverview = false;
  g.players = [p];
  for (let frame = 0; frame < 4; frame++) draw(null, .15);
  renderer.cameraOverride = {x: p.x, y: p.y, zoom: .78};
  renderer.trainScene = null;
  expect(await settleTerrain(true), 'The close ground probes use loaded Wilds terrain');

  for (const shadows of [true, false]) {
   renderer.setDynamicShadows(shadows);
   for (const hand of shadows ? ['hand1', 'hand2'] : ['hand1']) {
    p.inventory = [];
    p.equipment = {};
    draw(null, 0, true);
    draw(shadows && hand === 'hand1' ? '01-midnight-no-torch' : null, 0, true);
    const unlit = getPixels();
    expect(!lightForPlayer(), 'The unarmed explorer contributes no carried light');
    expect(give(p.inventory, 'torch', 1) && equip(p, p.inventory.findIndex(item => item?.type === 'torch'), hand),
     `Normal equipment accepts the torch in ${hand}`);
    expect(lightForPlayer()?.radius > 100, 'The equipped torch enters the native player light field');
    draw(null, 0, true);
    draw(shadows && hand === 'hand1' ? '02-midnight-torch' : null, 0, true);
    const lit = getPixels();
    const near = compareGround(unlit, lit, 48, 140), far = compareGround(unlit, lit, 315, 340);
    samples[`${hand}-${shadows ? 'shadows-on' : 'shadows-off'}`] = {near, far};
    expect(near.count > 500 && near.brighterFraction > .5 && near.luminance > 6 && near.warmShift > 3,
     `The torch casts warm light onto nearby terrain with dynamic shadows ${shadows ? 'on' : 'off'} (${hand})`);
    expect(far.count > 100 && Math.abs(far.luminance) < 3 && near.luminance > Math.abs(far.luminance) + 5,
     'Terrain outside the torch radius stays dark');
    if (shadows && hand === 'hand1') {
     const equipped = lightForPlayer();
     p.equipment = {};
     give(p.inventory, 'torch', 1);
     draw(null, 0, true);
     const packed = lightForPlayer(), packPixels = getPixels();
     const packGround = compareGround(unlit, packPixels, 48, 140);
     samples.packed = {intensity: packed?.intensity ?? 0, ground: packGround};
     expect(packGround.luminance < near.luminance - 4 && (packed?.intensity ?? 0) < equipped.intensity,
      'Equipping the torch lights more ground than carrying it in the pack');
    }
   }
  }
  switchAlleyLayer(g, 'diagon');
  place(p, 8000, 5500);
  renderer.trainScene = null;
  clockFrame('00:00', 'night', '07-diagon-clock');
 } catch (error) {
  return {checks, samples, images, failure: error.stack};
 } finally {
  CanvasRenderingContext2D.prototype.fillText = originalText;
 }
 return {checks, samples, images};
}
