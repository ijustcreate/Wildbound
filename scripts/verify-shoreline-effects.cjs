const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const electron = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe');
  const run = require('node:child_process').spawnSync(electron, [__filename, '--mute-audio'], {
    env, cwd: root, encoding: 'utf8', timeout: 90000,
  });
  process.stdout.write(run.stdout || '');
  process.stderr.write(run.stderr || '');
  if (run.error) console.error(run.error);
  process.exit(run.status ?? 1);
}

const { app, BrowserWindow } = require('electron');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const out = path.join(root, 'test-output', 'shoreline-effects', base === root ? 'source' : 'packaged');
fs.mkdirSync(out, { recursive: true });
app.setPath('userData', fs.mkdtempSync(path.join(out, 'profile-')));
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 900, height: 680, webPreferences: { backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  try {
    await win.loadFile(path.join(base, 'index.html'));
    const result = await win.webContents.executeJavaScript(`(${verify.toString()})()`);
    fs.writeFileSync(path.join(out, 'shoreline.png'), Buffer.from(result.frame.split(',')[1], 'base64'));
    delete result.frame;
    const report = { ...result, errors, muted: win.webContents.isAudioMuted() };
    console.log(JSON.stringify(report));
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    if (errors.length || !report.muted) throw Error('Renderer error or missing mute');
    app.exit(0);
  } catch (error) {
    console.error(error, errors);
    app.exit(1);
  }
});

async function verify() {
  await window.wildboundBoot.ready;
  const [{ Game }, { CUES }, { GameAudio }, { WaterInteractionRenderer }, { Assets }, { Renderer }] = await Promise.all([
    import('./src/core.mjs'), import('./src/sound-bank.mjs'), import('./src/audio.mjs'),
    import('./src/water-interactions.mjs'), import('./src/assets.mjs'), import('./src/render.mjs'),
  ]);
  const assert = (value, message) => { if (!value) throw Error(message); };
  const game = new Game(() => .5);
  const player = game.addPlayer('keyboard', 'Shoreline QA');
  game.start();
  game.persist = () => {};
  Object.assign(game, {
    phase: 'play', openingBoard: false, environment: 'forest', generatedEnvironment: 'forest',
    bloom: 3, terrain: Array(2500).fill('grass'), enemies: [], house: null, scenery: [], forestLandscape: null,
  });
  Object.assign(player, { x: 548, y: 624, room: null });
  game.terrain[19 * 50 + 19] = 'shallow';
  const audio = new GameAudio();
  audio.unlock();
  await audio.ctx.resume();
  const materialNames = ['grass', 'dirt', 'wood', 'stone', 'tile', 'sand', 'snow', 'ice', 'mud', 'water', 'carpet', 'gravel'];
  const files = materialNames.flatMap(name => CUES[name].files);
  const decoded = await Promise.all(files.map(file => audio.buffer(file)));
  assert(decoded.every(sample => sample?.duration > 0 && sample.duration < 2), 'All footstep recordings decode');
  const steps = [];
  let pending = [];
  const play = audio.play.bind(audio);
  audio.play = (name, actor) => { pending.push(play(name, actor).then(voice => steps.push({ name, played: !!voice }))); };
  audio.updateWorldAmbience = () => {};
  audio.updateWeatherBed = () => {};
  audio.ambient = () => {};
  audio.update(game, true);
  for (const distance of [31, 31, 57]) {
    game.moveActor(player, distance, 0);
    pending = [];
    audio.update(game, true);
    await Promise.all(pending);
    await new Promise(resolve => setTimeout(resolve, 210));
  }
  assert(JSON.stringify(steps.map(s => s.name)) === JSON.stringify(['grass', 'water', 'grass']) && steps.every(s => s.played), JSON.stringify(steps));
  audio.enabled = false;
  audio.apply();
  await audio.ctx.close();

  const assets = new Assets();
  await assets.load();
  Object.assign(game, { seed: 42, time: 12, enemies: [], effects: [], weather: null });
  game.terrain = Array.from({ length: 2500 }, (_, i) => {
    const y = Math.floor(i / 50);
    return y === 20 ? 'shallow' : y > 20 && y < 27 ? 'water' : 'grass';
  });
  const props = [
    { kind: 'tree', x: 678, y: 575, rootY: 627, size: 125 },
    { kind: 'tall_grass', x: 740, y: 609, rootY: 639, size: 82 },
    { kind: 'rock', x: 825, y: 617, rootY: 635, size: 65 },
    { kind: 'forest_understory', forestAsset: 'forest_cattail_tuft', x: 905, y: 630, rootY: 643, size: 48 },
    { kind: 'short_grass', x: 845, y: 864, rootY: 868, size: 38 },
  ].map((prop, i) => ({ ...prop, id: 'shore-' + i, procedural: true }));
  game.scenery = props;
  Object.assign(player, { x: 810, y: 721, hp: 100, swimming: true, diveDepth: 0, moving: true });
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:960px;height:620px';
  document.body.append(canvas);
  const scene = new Renderer(canvas, assets);
  scene.camera = { x: 795, y: 670, zoom: 1.4 };
  scene.draw(game, 0);
  const frame = canvas.toDataURL();
  const stats = scene.waterInteractions.stats;
  assert(stats.mode === 'webgl' && stats.swimmers === 1, JSON.stringify(stats));
  for (const kind of ['tree', 'tall_grass', 'rock', 'reeds', 'actor']) {
    assert(stats.kinds[kind] > 0, 'Scene omitted reflection donor ' + kind);
  }

  // Isolate the renderer to sample real reflected pixels above and below the bank.
  const reflection = new WaterInteractionRenderer();
  const layer = document.createElement('canvas');
  layer.width = 400;
  layer.height = 220;
  const context = layer.getContext('2d');
  context.translate(-600, -600);
  const view = { camera: { x: 800, y: 710, zoom: 1 }, assets, animator: scene.animator, decor: [] };
  const alpha = (x, y, w, h) => {
    const pixels = context.getImageData(x, y, w, h).data;
    let total = 0;
    for (let i = 3; i < pixels.length; i += 4) total += pixels[i];
    return total;
  };
  game.players = [];
  view.camera.y=760;
  view.decor=props;
  context.setTransform(1,0,0,1,-600,-650);
  reflection.draw(context, game, view, layer.width, layer.height);
  assert(reflection.stats.kinds.short_grass && alpha(230,208,30,6)>0,'South-bank foliage reflects into water above its root: '+JSON.stringify(reflection.stats));
  context.setTransform(1,0,0,1,0,0);
  context.clearRect(0,0,layer.width,layer.height);
  context.translate(-600,-600);
  view.camera.y=710;
  view.decor=[];
  game.trainTest = { design: { river: { x: 800, width: 300 } } };
  game.scenery = [...props, { id:'side-bank',kind:'bush',x:647,y:727,rootY:734,size:62,procedural:true }];
  reflection.draw(context, game, view, layer.width, layer.height);
  const railway = reflection.stats;
  assert(railway.kinds.tree && railway.kinds.tall_grass && railway.kinds.rock && railway.kinds.bush, JSON.stringify(railway));
  assert(alpha(52,134,28,26)>0,'Side-bank prop reflects onto the wet side');
  const first = alpha(50, 25, 235, 125);
  const leftDry = alpha(0, 0, 32, 220), rightDry = alpha(368, 0, 32, 220);
  assert(first > 1000 && leftDry === 0 && rightDry === 0, `Railway reflections stay within river: ${first}, ${leftDry}, ${rightDry}`);
  game.time += .17;
  context.clearRect(600, 600, 400, 220);
  reflection.draw(context, game, view, layer.width, layer.height);
  assert(alpha(50, 25, 235, 125) !== first, 'Reflected scenery ripples over time');

  const { wildLandsSurfaceAt } = await import('./src/wild-lands-world.mjs');
  const wildDesign = { wildLands: true };
  let shore;
  for (let x = 2400; x < 13500 && !shore; x += 240) {
    for (let y = 900; y < 8500; y += 8) {
      if ([-12, 0, 12].every(dx => wildLandsSurfaceAt(wildDesign, x + dx, y - 10) === 'grass' &&
        wildLandsSurfaceAt(wildDesign, x + dx, y + 12) !== 'grass')) {
        shore = { x, y };
        break;
      }
    }
  }
  assert(shore, 'Found a real Wilds shoreline');
  Object.assign(view.camera, shore);
  game.trainTest = { design: wildDesign, streamDisabled: true };
  game.scenery = [{ ...props[0], x: shore.x, y: shore.y - 52, rootY: shore.y - 8 }];
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, layer.width, layer.height);
  context.translate(layer.width / 2 - shore.x, layer.height / 2 - shore.y);
  reflection.draw(context, game, view, layer.width, layer.height);
  const wilds = reflection.stats;
  assert(wilds.kinds.tree && alpha(188, 122, 24, 27) > 0, 'Wilds native water mask includes the tree reflection');
  assert(alpha(188, 92, 24, 8) === 0, 'Wilds native water mask excludes its dry bank');
  return { files: decoded.length, steps, classic: stats, railway, wilds, frame };
}
