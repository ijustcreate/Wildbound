const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const base = path.resolve(process.env.WILDBOUND_VERIFY_APP || root);
const baseline = process.argv.includes('--baseline');

if (!process.versions.electron) {
 const env = {...process.env};
 delete env.ELECTRON_RUN_AS_NODE;
 const electron = path.join(root, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron');
 const child = spawnSync(electron, [__filename, ...process.argv.slice(2), '--mute-audio'], {
  cwd: root, env, encoding: 'utf8', timeout: 160000, windowsHide: true,
 });
 process.stdout.write(child.stdout || '');
 process.stderr.write(child.stderr || '');
 if (child.error) console.error(child.error);
 process.exit(child.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
const output = path.join(root, 'test-output', 'wilds-terrain', baseline ? 'baseline' : base === root ? 'source' : 'packaged');
fs.mkdirSync(output, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-terrain-')));
app.commandLine.appendSwitch('mute-audio');
const timer = setTimeout(() => app.exit(1), 150000);

app.whenReady().then(async () => {
 const win = new BrowserWindow({show: false, width: 1240, height: 780, webPreferences: {backgroundThrottling: false}});
 win.webContents.setAudioMuted(true);
 const errors = [];
 win.webContents.on('console-message', event => {
  if (event.level === 'error') errors.push(event.message);
 });
 try {
  await win.loadFile(path.join(base, 'index.html'), {query: {tools: '1'}});
  const {images, ...result} = await win.webContents.executeJavaScript(`(${survey})(${baseline})`);
  for (const [name, image] of Object.entries(images)) {
   fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(image.split(',')[1], 'base64'));
  }
  const report = {base, baseline, ...result, errors, muted: win.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  app.exit(report.failure || errors.length || !report.muted ? 1 : 0);
 } catch (error) {
  console.error(error.stack);
  app.exit(1);
 } finally {
  clearTimeout(timer);
 }
});

async function survey(baseline) {
 await wildboundBoot.ready;
 const tools = wildboundPolishTest;
 const [{Game}, {Renderer}, {enterWildLands}, surface, mountain, train, sessions, {nativeWaterRuns}] = await Promise.all([
  import('./src/core.mjs'), import('./src/render.mjs'), import('./src/wild-lands.mjs'),
  import('./src/wild-lands-world.mjs'), import('./src/wild-mountain-layout.mjs'), import('./src/train-test.mjs'),
  import('./src/session.mjs'), import('./src/wild-lands-art.mjs'),
 ]);
 const requestFrame = window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame = () => 0;
 await new Promise(resolve => requestFrame(resolve));
 const TerrainWorker = window.Worker;
 window.Worker = undefined;
 let g = new Game(() => .5, {deferWorld: true});
 let p = g.addPlayer('keyboard', 'Terrain scout');
 const use = () => {
  g.persist = g.onSound = () => {};
  g.spriteLibrary = tools.assets.library;
  tools.game = g;
 };
 use();
 const entered = enterWildLands(g, {persistent: true, homeStart: true});
 if (!entered.ok) throw Error('The native Wilds expedition could not start');
 tools.show('play');
 const canvas = document.getElementById('game-canvas');
 const renderer = new Renderer(canvas, tools.assets);
 tools.renderer = renderer;
 const checks = [], samples = {}, images = {};
 const expect = (value, label) => {
  if (!value) throw Error(label);
  checks.push(label);
 };
 const tick = (input = {}) => g.update(.05, {keyboard: input});
 const design = () => g.trainTest.design;
 const place = (x, y) => {
  const z = mountain.mountainHeight(design(), x, y);
  Object.assign(p, {x, y, trainGround: z, trainVisualLift: z, groundHeight: 0, jumpHeight: 0, jumpVelocity: 0,
   swimming: false, underBridge: false, trainDeck: false, invuln: 999, ui: null, moving: false});
  delete p.mountainDescent;
  const t = g.trainTest;
  t.previous.clear();
  t.preparing = false;
  t.noticeUntil = 0;
  if (g.sky) g.sky.elapsed = 120;
 };
 const shot = (name, focus = null) => {
  renderer.trainScene = null;
  renderer.cameraOverride = focus;
  renderer.draw(g, .05, {sealCapture: Boolean(focus)});
  if (focus) {
   images[name] = canvas.toDataURL();
   return;
  }
  const {w, h} = renderer.resize(), scale = canvas.width / w;
  const {zoom, x, y} = renderer.camera, {width, height} = design();
  const map = document.createElement('canvas');
  map.width = 1200;
  map.height = 600;
  const c = map.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(canvas, (w / 2 - x * zoom) * scale, (h / 2 - y * zoom) * scale,
   width * zoom * scale, height * zoom * scale, 0, 0, map.width, map.height);
  images[name] = map.toDataURL();
 };

 try {
  place(p.x, p.y);
  g.trainTest.wildLandsOverview = true;
  shot('01-wilds-map');
  const nativeOverview = g.trainTest.wildOverview;
  g.trainTest.wildLandsOverview = false;

  const viewpoints = [
   ['02-west-woodland-edge', 2015, 3670, .79],
   ['03-cemetery-edge', 2150, 6800, .9],
   ['04-south-woodland-edge', 9855, 8395, .89],
   ['05-frostmere-edge', 7430, 4800, .91],
   ['06-eastern-sandy-lake', 15580, 5680, .43],
   ['07-greywake-pines', ...mountain.MOUNTAIN_ASCENT[5].slice(0, 2), .87],
   ['08-icy-summit', 17910, 6500, .96],
  ];
  for (const [name, x, y, zoom] of viewpoints) {
   place(x, y);
   shot(name, {x, y, zoom});
  }

  const land = (x, y) => surface.wildLandsGround(design(), x, y);
  const wet = (x, y) => surface.wildLandsSurface(design(), x, y);
  const probe = (name, x, y) => { samples[name] = {x, y, biome: land(x, y), surface: wet(x, y)}; };
  probe('west woods', 2015, 3670);
  probe('west cemetery', 2150, 6800);
  probe('southwest woods', 4864, 8263);
  probe('southern woods', 9855, 8395);
  probe('west Frostmere', 7430, 4800);
  probe('Frostmere snow east of the maze', 9000, 5500);
  probe('eastern forest lake', 15580, 5680);
  probe('sandy lake margin', 15570, 5935);
  probe('forest west of the lake', 14930, 5700);
  probe('forest north of the lake', 15480, 5000);
  probe('forest east of the lake', 16130, 5680);
  probe('Tideglass lagoon', 17070, 3650);
  probe('east drop landing', 18820, 6475);
  if (baseline) return {images, checks, samples};

  const forestSites = ['west woods', 'southwest woods', 'southern woods', 'forest west of the lake',
   'forest north of the lake', 'forest east of the lake'];
  expect(forestSites.every(name => samples[name].biome === 'forest' && samples[name].surface === 'grass'),
   'Forest fills the marked west, south and eastern dry land');
  expect(samples['west cemetery'].biome === 'graveyard', 'The dark cemetery reaches the marked western margin');
  expect(samples['west Frostmere'].biome === 'ice' && samples['Frostmere snow east of the maze'].biome === 'ice',
   'Snow fills the marked Frostmere ground around the northern maze');
  expect(samples['eastern forest lake'].surface === 'water' && samples['sandy lake margin'].biome === 'beach',
   'The eastern forest keeps its sandy lake with deep water');
  expect(samples['Tideglass lagoon'].surface === 'water', 'The original Tideglass lagoon remains wet');

  const walk = (x, y, limit = 160) => {
   for (let frame = 0; frame < limit; frame++) {
    const dx = x - p.x, dy = y - p.y, distance = Math.hypot(dx, dy);
    if (distance < 12) return true;
    tick({x: dx / distance, y: dy / distance});
   }
   return false;
  };
  const highPath = mountain.MOUNTAIN_ASCENT.slice(-3);
  place(...highPath[0]);
  expect(highPath.slice(1).every(([x, y]) => walk(x, y)), 'Ordinary movement follows the upper switchbacks to the summit');
  expect(p.trainGround > 445, 'The summit keeps its native elevated walkable surface');

  const lip = {x: 18042, y: 6475};
  place(lip.x, lip.y);
  expect(!train.trainWorldBlocked(g, lip.x, lip.y), 'The east summit lip has a clear starting position');
  tick({x: 1, jump: true});
  expect(Boolean(p.mountainDescent), 'Jumping east from the summit commits to a downhill drop');
  for (let frame = 0; frame < 7; frame++) tick();
  expect(p.x > lip.x && p.jumpHeight > 0 && !p.swimming, 'The explorer moves out over the slope while airborne');
  shot('09-east-summit-drop', {x: p.x, y: p.y, zoom: .84});
  const dropping = JSON.parse(JSON.stringify(sessions.saveSession(g)));
  g = sessions.restoreSession(dropping);
  p = g.players[0];
  use();
  g.trainTest.preparing = false;
  expect(Boolean(p.mountainDescent), 'The descent survives saving and loading while airborne');
  for (let frame = 0; frame < 80 && !p.swimming; frame++) tick();
  expect(p.swimming && p.x > 18650 && wet(p.x, p.y) === 'water' && !p.mountainDescent && !p.jumpHeight,
   'The drop ends in native deep-water swimming east of Greywake');
  shot('10-ocean-landing', {x: p.x - 60, y: p.y, zoom: .92});
  for (let frame = 0; frame < 75; frame++) tick({x: -1, jump: frame % 9 < 4});
  expect(p.x > 18300 && (p.trainGround || 0) < 20, 'Swimming and jumping back toward the cliff cannot climb to the summit');

  const ledge = mountain.MOUNTAIN_DESCENTS.find(link => link.id === 'snowline-ledge');
  const [lx, ly] = ledge.launch, [ex, ey] = ledge.landing;
  const span = Math.hypot(ex - lx, ey - ly), dx = (ex - lx) / span, dy = (ey - ly) / span;
  place(lx, ly);
  tick({x: dx, y: dy, jump: true});
  expect(p.mountainDescent?.id === ledge.id, 'The existing downhill trail shortcut still launches');
  for (let frame = 0; frame < 35 && p.mountainDescent; frame++) tick();
  expect(Math.hypot(p.x - ex, p.y - ey) < 6, 'The original downhill jump still lands on the lower trail');
  const launchHeight = mountain.mountainHeight(design(), lx, ly);
  let reverseStayedOnLowerTrail = true;
  for (let frame = 0; frame < 34; frame++) {
   tick({x: -dx, y: -dy, jump: frame % 9 < 3});
   reverseStayedOnLowerTrail &&= !p.mountainDescent && p.trainGround < launchHeight - 16 && Boolean(mountain.mountainTrail(p.x, p.y));
  }
  expect(reverseStayedOnLowerTrail, 'Repeated uphill jumps keep the explorer on the lower switchback');

  place(16020, 7270);
  const rise = p.trainGround;
  tick({x: -1, y: 1, jump: true});
  expect(Boolean(p.mountainDescent), 'Jumping from an unmarked lip can reach a clear lower trail');
  for (let frame = 0; frame < 40 && p.mountainDescent; frame++) tick();
  expect(!p.mountainDescent && !p.jumpHeight && p.trainGround < rise - 20 && Math.hypot(p.x - 15887, p.y - 7397) < 15,
   'The unmarked descent lands on the cave trail below');

  const worker = new TerrainWorker(new URL('./src/railway-stream-worker.mjs', location.href), {type: 'module'});
  const request = (kind, args) => new Promise((resolve, reject) => {
   const deadline = setTimeout(() => reject(Error('Terrain Worker timed out drawing ' + kind)), 37000);
   worker.onmessage = ({data}) => {
    clearTimeout(deadline);
    if (data.error) reject(Error(data.error));
    else resolve(data);
   };
   worker.onerror = event => {
    clearTimeout(deadline);
    reject(Error(event.message));
   };
   worker.postMessage({kind, key: kind + ':survey', args: {...args, room: null}});
  });
  try {
   worker.postMessage({kind: 'init', design: design()});
   const {width, height} = nativeOverview;
   const {bitmap} = await request('overview', {size: width, height, opened: []});
   expect(bitmap instanceof ImageBitmap && bitmap.width === width && bitmap.height === height,
    'The native terrain Worker builds the revised overview');
   const workerCanvas = document.createElement('canvas');
   workerCanvas.width = width;
   workerCanvas.height = height;
   const arriving = workerCanvas.getContext('2d');
   arriving.drawImage(bitmap, 0, 0);
   bitmap.close();
   const syncPixels = nativeOverview.getContext('2d').getImageData(0, 0, width, height).data;
   const workerPixels = arriving.getImageData(0, 0, width, height).data;
   const difference = syncPixels.reduce((sum, value, index) => sum + Math.abs(value - workerPixels[index]), 0) / syncPixels.length;
   samples.overviewMeanChannelDifference = difference;
   const lakeChunk = {x: 15360, y: 5632};
   const {value: {tiles}} = await request('water', lakeChunk);
   const expected = Array.from({length: 256}, (_, index) => nativeWaterRuns(design(), lakeChunk.x + index % 16 * 32,
    lakeChunk.y + Math.floor(index / 16) * 32));
   expect(JSON.stringify(tiles) === JSON.stringify(expected), 'The Worker and direct lake masks match across the shoreline chunk');
   if (difference >= .5) {
    images['worker-overview-diagnostic'] = workerCanvas.toDataURL();
    images['direct-overview-diagnostic'] = nativeOverview.toDataURL();
   }
   expect(difference < .5, 'The streamed and direct overview preserve the same biome and shoreline shapes');
  } finally {
   worker.terminate();
  }
  return {images, checks, samples};
 } catch (error) {
  return {images, checks, samples, failure: error.stack};
 }
}
