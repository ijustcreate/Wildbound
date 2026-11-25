const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const base = path.resolve(process.env.WILDBOUND_VERIFY_APP || root);

if (!process.versions.electron) {
 const env = {...process.env};
 delete env.ELECTRON_RUN_AS_NODE;
 const executable = process.platform === 'win32' ? 'electron.exe' : 'electron';
 const child = spawnSync(path.join(root, 'node_modules', 'electron', 'dist', executable), [__filename, '--mute-audio'], {
  cwd: root, env, encoding: 'utf8', timeout: 175000, windowsHide: true,
 });
 process.stdout.write(child.stdout || '');
 process.stderr.write(child.stderr || '');
 if (child.error) console.error(child.error);
 process.exit(child.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
const output = path.join(root, 'test-output', 'wilds-coastal-landmarks', base === root ? 'source' : 'packaged');
fs.mkdirSync(output, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-coastal-landmarks-')));
app.commandLine.appendSwitch('mute-audio');
const timer = setTimeout(() => app.exit(1), 165000);

app.whenReady().then(async () => {
 const win = new BrowserWindow({show: false, width: 1240, height: 800, webPreferences: {backgroundThrottling: false}});
 win.webContents.setAudioMuted(true);
 const errors = [];
 win.webContents.on('console-message', event => {
  if (event.level === 'error') errors.push(event.message);
 });
 try {
  await win.loadFile(path.join(base, 'index.html'), {query: {tools: '1'}});
  const {images, ...result} = await win.webContents.executeJavaScript(`(${survey})()`);
  for (const [name, image] of Object.entries(images)) {
   fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(image.split(',')[1], 'base64'));
  }
  const report = {base, ...result, errors, muted: win.webContents.isAudioMuted()};
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

async function survey() {
 await wildboundBoot.ready;
 const tools = wildboundPolishTest;
 const load = name => import('./src/' + name + '.mjs');
 const [{Game}, {Renderer}, {enterWildLands}, terrain, {trainWorldBlocked}, {WILD_LANDS_SITES},
  {nativeWaterRuns}, {saveSession, restoreSession}, {SKULL_ROCK}, {MERMAID_LAGOON}] = await Promise.all([
  'core', 'render', 'wild-lands', 'wild-lands-world', 'train-test', 'wild-lands-content',
  'wild-lands-art', 'session', 'wild-skull-rock', 'wild-mermaid-lagoon',
 ].map(load));
 const requestFrame = window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame = () => 0;
 await new Promise(resolve => requestFrame(resolve));
 const TerrainWorker = window.Worker;
 window.Worker = undefined;

 const g = new Game(() => .5, {deferWorld: true});
 const p = g.addPlayer('keyboard', 'Coast scout');
 g.persist = g.onSound = () => {};
 g.spriteLibrary = tools.assets.library;
 tools.game = g;
 const entered = enterWildLands(g, {persistent: true, homeStart: true});
 if (!entered.ok) throw Error('The native Wilds expedition could not start');
 tools.show('play');
 const t = g.trainTest, d = t.design;
 const canvas = document.getElementById('game-canvas');
 const renderer = new Renderer(canvas, tools.assets);
 tools.renderer = renderer;

 const checks = [], samples = {}, images = {};
 const expect = (value, message) => {
  if (!value) throw Error(message);
  checks.push(message);
 };
 const wet = (x, y) => terrain.wildLandsSurface(d, x, y);
 const blocked = (x, y) => trainWorldBlocked(g, x, y, 8, false, true);
 const point = () => ({x: p.x, y: p.y, surface: wet(p.x, p.y), swimming: p.swimming});
 const tick = (input = {}) => g.update(.05, {keyboard: input});
 const place = (x, y) => {
  Object.assign(p, {x, y, trainGround: 0, trainVisualLift: 0, groundHeight: 0, jumpHeight: 0, jumpVelocity: 0,
   swimming: wet(x, y) === 'water', diveDepth: 0, underBridge: false, trainDeck: false, invuln: 999, ui: null, moving: false});
  delete p.mountainDescent;
  t.previous.clear();
  t.preparing = false;
  t.noticeUntil = 0;
  if (g.sky) g.sky.elapsed = 120;
 };
 const navigate = ([x, y], label, states = new Set()) => {
  let lastDistance = Infinity, stalledFrames = 0;
  for (let frame = 0; frame < 550; frame++) {
   const dx = x - p.x, dy = y - p.y, distance = Math.hypot(dx, dy);
   if (distance < 9) return states;
   stalledFrames = distance < lastDistance - .04 ? 0 : stalledFrames + 1;
   if (stalledFrames > 30) break;
   lastDistance = distance;
   tick({x: dx / distance, y: dy / distance});
   states.add(wet(p.x, p.y));
   if (p.swimming) states.add('swimming');
  }
  const position = point();
  throw Error(`${label} stalled near ${position.x.toFixed(1)}, ${position.y.toFixed(1)} (${position.surface}), target ${x}, ${y}`);
 };
 const shot = (name, focus = null) => {
  t.noticeUntil = 0;
  renderer.trainScene = null;
  renderer.cameraOverride = focus;
  renderer.draw(g, .05, {sealCapture: Boolean(focus)});
  if (focus) {
   images[name] = canvas.toDataURL();
   return;
  }
  const {w, h} = renderer.resize();
  const {zoom, x, y} = renderer.camera;
  const scale = canvas.width / w;
  const map = document.createElement('canvas');
  map.width = 1200;
  map.height = Math.round(map.width * d.height / d.width);
  const context = map.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.drawImage(canvas, (w / 2 - x * zoom) * scale, (h / 2 - y * zoom) * scale,
   d.width * zoom * scale, d.height * zoom * scale, 0, 0, map.width, map.height);
  images[name] = map.toDataURL();
 };

 // The approaches stay on the same world surface. Only the test's start points are staged.
 const lagoonTrail = [17175, 4900], lagoonShelf = [17120, 5310], lagoonPool = [17430, 5420];
 const lagoonShallows = [17200, 5350], lagoonChannel = [17300, 5425], lagoonOutcrop = [17383, 5391];
 const greywakeBeach = [18130, 8157], skullSea = [18191, 8994], skullLanding = [18352, 9016];
 const skullShore = [[18430, 9054], [18560, 9017]], skullGrotto = [18579, 8860];
 const skullCheek = [18438, 8896];
 try {
  expect([SKULL_ROCK, MERMAID_LAGOON].every(site => WILD_LANDS_SITES.some(entry => entry.id === site.id && !entry.room)),
   'Both coastal destinations are registered in the normal Wilds surface');
  const labels = new Set();
  const captureLabel = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (label, ...args) {
   labels.add(String(label).trim().toLowerCase());
   return captureLabel.call(this, label, ...args);
  };
  try {
   t.wildLandsOverview = true;
   place(p.x, p.y);
   shot('01-wilds-overview');
  } finally {
   CanvasRenderingContext2D.prototype.fillText = captureLabel;
   t.wildLandsOverview = false;
  }
  const overview = t.wildOverview;
  expect(labels.has('skull rock') && labels.has('mermaid lagoon'), 'The native overview paints both names');

  place(...lagoonShelf);
  shot('02-mermaid-lagoon', {x: 17465, y: 5315, zoom: .48});
  shot('03-lagoon-shelves', {x: 17240, y: 5320, zoom: .86});
  place(...skullLanding);
  shot('04-skull-rock', {x: 18552, y: 8788, zoom: .52});
  place(...skullGrotto);
  shot('05-skull-grotto', {x: 18568, y: 8970, zoom: .9});

  expect(wet(...lagoonTrail) === 'grass' && wet(...lagoonShelf) === 'grass' && !blocked(...lagoonShelf),
   'The Tideglass approach and Mermaid Lagoon shelf are dry and accessible');
  expect(wet(...lagoonPool) === 'water' && !blocked(...lagoonPool), 'The lagoon pool has clear deep water');
  expect(blocked(...lagoonOutcrop) && blocked(17284, 5207), 'Lagoon rock columns and the central outcrop have native collision');
  place(...lagoonTrail);
  navigate([17175, 5065], 'Northern lagoon approach');
  navigate(lagoonShelf, 'Lagoon shelf');
  expect(!p.swimming, 'Ordinary movement reaches the dry lagoon shelf from Tideglass');
  const lagoonStates = new Set();
  for (const waypoint of [lagoonShallows, lagoonChannel, lagoonPool]) navigate(waypoint, 'Lagoon swim', lagoonStates);
  expect(lagoonStates.has('shallow') && lagoonStates.has('swimming') && p.swimming,
   'Ordinary movement wades through shallows and swims into the lagoon');
  samples.lagoonPool = point();
  for (const waypoint of [lagoonChannel, lagoonShallows, lagoonShelf]) navigate(waypoint, 'Swimming back to the shelf');
  expect(!p.swimming && wet(p.x, p.y) === 'grass', 'The explorer can climb onto the lagoon shelf from the water');
  expect(t.wildExploration.discovered.has(MERMAID_LAGOON.id), 'Mermaid Lagoon is discovered during normal exploration');
  expect(wet(17070, 3650) === 'water' && wet(15580, 5680) === 'water', 'The older Tideglass and east forest pools remain wet');

  expect(wet(...greywakeBeach) === 'grass' && wet(...skullSea) === 'water' && wet(...skullLanding) === 'grass',
   'Greywake beach and Skull Rock are separated by open ocean');
  place(...greywakeBeach);
  const seaStates = navigate(skullSea, 'Swim from the Greywake shore');
  expect(p.swimming && seaStates.has('shallow') && seaStates.has('swimming'), 'The explorer can swim out from the existing Greywake shore');
  const landingStates = navigate(skullLanding, 'Skull Rock landing');
  expect(landingStates.has('shallow') && !p.swimming && wet(p.x, p.y) === 'grass',
   'Swimming ashore hands off to walking on the Skull Rock beach');
  for (const waypoint of skullShore) navigate(waypoint, 'Walking along Skull Rock shore');
  navigate(skullGrotto, 'Entering the mouth grotto');
  expect(!p.swimming && wet(p.x, p.y) === 'grass' && !blocked(...skullGrotto),
   'Ordinary movement reaches the dry recessed mouth of Skull Rock');
  samples.skullGrotto = point();
  expect(blocked(...skullCheek), 'The solid skull cheek has native collision');
  const before = {x: p.x, y: p.y};
  const distance = Math.hypot(skullCheek[0] - before.x, skullCheek[1] - before.y);
  const towardCheek = {x: (skullCheek[0] - before.x) / distance, y: (skullCheek[1] - before.y) / distance};
  let nearestCheek = distance;
  for (let frame = 0; frame < 40; frame++) {
   tick(towardCheek);
   nearestCheek = Math.min(nearestCheek, Math.hypot(p.x - skullCheek[0], p.y - skullCheek[1]));
  }
  samples.closestApproachToCheek = nearestCheek;
  expect(nearestCheek > 25 && !blocked(p.x, p.y),
   'Holding movement toward the rock cannot walk through the skull cheek');
  expect(t.wildExploration.discovered.has(SKULL_ROCK.id), 'Skull Rock is discovered during normal exploration');
  for (const waypoint of [skullGrotto, ...skullShore.slice().reverse(), skullLanding]) navigate(waypoint, 'Returning to Skull Rock shore');
  navigate(skullSea, 'Swimming away from Skull Rock');
  expect(p.swimming, 'The beach leads back to the open water');

  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  expect([SKULL_ROCK, MERMAID_LAGOON].every(site => restored.trainTest.wildExploration.discovered.has(site.id)),
   'Both discoveries survive a native expedition checkpoint');

  for (const site of [SKULL_ROCK, MERMAID_LAGOON]) {
   expect(terrain.wildLandsTravel(g, site.id).ok && wet(p.x, p.y) === 'grass' && !blocked(p.x, p.y),
    `The development travel entry arrives on safe ground at ${site.name}`);
  }

  const worker = new TerrainWorker(new URL('./src/railway-stream-worker.mjs', location.href), {type: 'module'});
  const request = (kind, key, args) => new Promise((resolve, reject) => {
   const deadline = setTimeout(() => reject(Error('Terrain Worker timed out during ' + key)), 35000);
   worker.onmessage = ({data}) => {
    clearTimeout(deadline);
    if (data.error) reject(Error(data.error));
    else resolve(data);
   };
   worker.onerror = event => {
    clearTimeout(deadline);
    reject(Error(event.message));
   };
   worker.postMessage({kind, key, args: {...args, room: null}});
  });
  try {
   worker.postMessage({kind: 'init', design: d});
   const {width, height} = overview;
   const {bitmap} = await request('overview', 'coastal-overview', {size: width, height, opened: []});
   expect(bitmap instanceof ImageBitmap && bitmap.width === width && bitmap.height === height,
    'The actual native terrain Worker renders the extended overview');
   const workerCanvas = new OffscreenCanvas(width, height), context = workerCanvas.getContext('2d');
   context.drawImage(bitmap, 0, 0);
   bitmap.close();
   const direct = overview.getContext('2d').getImageData(0, 0, width, height).data;
   const streamed = context.getImageData(0, 0, width, height).data;
   const difference = direct.reduce((sum, value, index) => sum + Math.abs(value - streamed[index]), 0) / direct.length;
   samples.overviewMeanChannelDifference = difference;
   expect(difference < .5, 'The streamed and direct maps keep the same coastline and landmark shapes');

   for (const [name, [x, y], probes] of [
    ['Lagoon', lagoonShelf, [[lagoonShelf, 'grass'], [lagoonShallows, 'shallow']]],
    ['Skull Rock', skullLanding, [[skullLanding, 'grass'], [skullSea, 'water']]],
   ]) {
    const cx = Math.floor(x / 512) * 512, cy = Math.floor(y / 512) * 512;
    const {value: {tiles}} = await request('water', 'coastal-water-' + cx + '-' + cy, {x: cx, y: cy});
    const expected = Array.from({length: 256}, (_, index) => nativeWaterRuns(d, cx + index % 16 * 32,
     cy + Math.floor(index / 16) * 32));
    expect(expected.some(tile => tile.shore.length) && JSON.stringify(tiles) === JSON.stringify(expected),
     `${name} streamed shoreline masks match the direct masks`);
    const surfaceAt = ([px, py]) => {
     const tile = tiles[Math.floor((py - cy) / 32) * 16 + Math.floor((px - cx) / 32)];
     const contains = ([rx, ry, rw, rh]) => px >= rx && py >= ry && px < rx + rw && py < ry + rh;
     return tile.shallow.some(contains) ? 'shallow' : tile.wet.some(contains) ? 'water' : 'grass';
    };
    expect(probes.every(([location, material]) => surfaceAt(location) === material && wet(...location) === material),
     `${name} swimming and walking surfaces align with the streamed water paint`);
   }
  } finally {
   worker.terminate();
  }
  return {checks, samples, images};
 } catch (error) {
  return {checks, samples, images, failure: error.stack, position: point()};
 }
}
