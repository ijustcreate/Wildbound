const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-output', 'split-shadow-equivalence');
// Supply either a complete pre-change source tree or the three pre-change modules.
const baseline = process.env.WILDBOUND_SHADOW_BASELINE;
const overriddenModules = ['render.mjs', 'scene-casters.mjs', 'split-screen-renderer.mjs'];

if (process.versions.electron) {
  run().catch(error => {
    console.error(error);
    require('electron').app.exit(1);
  });
} else {
  const {spawnSync} = require('node:child_process');
  const electron = require('electron');
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const result = spawnSync(electron, [__filename, '--mute-audio'], {
    cwd: root, env, stdio: 'inherit', timeout: 180_000,
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

async function run() {
  const {app, BrowserWindow, session} = require('electron');
  fs.mkdirSync(output, {recursive: true});
  app.setPath('userData', fs.mkdtempSync(path.join(output, 'profile-')));
  app.commandLine.appendSwitch('mute-audio');
  app.on('window-all-closed', () => {});
  await app.whenReady();

  async function sample(label, source) {
    const isolated = session.fromPartition(`shadow-${label}`);
    const win = new BrowserWindow({
      show: false,
      width: 1040,
      height: 700,
      webPreferences: {session: isolated, backgroundThrottling: false},
    });
    const errors = [];
    win.webContents.setAudioMuted(true);
    win.webContents.on('console-message', event => {
      if (event.level === 'error') errors.push(`${event.message} @ ${event.sourceId}:${event.lineNumber}`);
    });
    try {
      await win.loadFile(path.join(source, 'index.html'));
      await win.webContents.executeJavaScript('wildboundBoot.ready');
      const frames = await win.webContents.executeJavaScript(`(${renderFrames.toString()})()`);
      assert.deepEqual(errors, [], `${label} renderer errors`);
      return frames;
    } finally {
      win.destroy();
    }
  }

  const before = baseline ? await sample('before', baselineSource(baseline)) : null;
  const after = await sample('after', root);
  const changedMask = (first, second) => first.masks.some((mask, index) => mask.pixels !== second.masks[index]?.pixels);
  assert.ok(changedMask(after.initial, after.movedProp), 'Moving a static prop changes shadow pixels on the next frame');
  assert.ok(changedMask(after.movedProp, after.liftedActor), 'Lifting an actor changes shadow pixels on the next frame');
  const summary = {};
  for (const [name, frame] of Object.entries(after)) {
    assert.equal(frame.views.length, 2, `${name} should have two simultaneous split views`);
    assert.ok(frame.masks.length >= 2, `${name} should draw dynamic shadow masks`);
    assert.ok(new Set(frame.masks.map(mask => mask.transform.join(','))).size >= 2, `${name} should draw both camera transforms`);
    if (before) {
      const expected = before[name];
      assert.deepEqual(frame.views, expected.views, `${name} camera positions match baseline`);
      assert.equal(frame.masks.length, expected.masks.length, `${name} draws the same number of masks`);
      for (const [index, mask] of frame.masks.entries()) {
        const original = expected.masks[index];
        assert.deepEqual(mask.destination, original.destination, `${name} mask ${index} destination`);
        assert.deepEqual(mask.transform, original.transform, `${name} mask ${index} transform`);
        assert.equal(mask.opacity, original.opacity, `${name} mask ${index} opacity`);
        assert.ok(mask.pixels === original.pixels, `${name} mask ${index} pixels match baseline`);
      }
      assert.ok(frame.image === expected.image, `${name} composed pixels match baseline`);
    }
    const png = Buffer.from(frame.image.split(',')[1], 'base64');
    fs.writeFileSync(path.join(output, `${name}.png`), png);
    summary[name] = {views: frame.views, masks: frame.masks.length, sha256: createHash('sha256').update(png).digest('hex')};
  }
  const report = {baseline: baseline ? path.resolve(baseline) : null, frames: summary};
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Split shadow verification passed for ${Object.keys(summary).length} frames${before ? ' with exact baseline pixel matches' : ''}.`);
  app.exit(0);
}

function baselineSource(snapshot) {
  const source = path.resolve(snapshot);
  if (fs.existsSync(path.join(source, 'index.html'))) return source;
  const staged = fs.mkdtempSync(path.join(output, 'baseline-'));
  for (const name of ['index.html', 'app.mjs']) fs.copyFileSync(path.join(root, name), path.join(staged, name));
  for (const name of ['assets', 'authored', 'public', 'art', 'worlds']) {
    fs.symlinkSync(path.join(root, name), path.join(staged, name), 'junction');
  }
  const modules = path.join(staged, 'src');
  fs.cpSync(path.join(root, 'src'), modules, {recursive: true});
  for (const name of overriddenModules) fs.copyFileSync(path.join(source, name), path.join(modules, name));
  return staged;
}

async function renderFrames() {
  window.requestAnimationFrame = () => 0;
  window.Worker = undefined;
  // Complete all shadow masks in one draw regardless of the host's wall time.
  Object.defineProperty(performance, 'now', {value: () => 0});
  const {Game} = await import('./src/core.mjs');
  const {Assets} = await import('./src/assets.mjs');
  const {Renderer} = await import('./src/render.mjs');
  const {generateWorld} = await import('./src/world.mjs');
  const {setCelShading} = await import('./src/cel-shading.mjs');
  const {CAMERA_DEFAULTS, saveCameraSettings} = await import('./src/multiplayer-camera.mjs');
  setCelShading(false);
  saveCameraSettings({...CAMERA_DEFAULTS, reducedMotion: true});

  const assets = new Assets();
  await assets.load();
  const canvas = document.createElement('canvas');
  for (const element of document.body.children) element.style.display = 'none';
  canvas.style.cssText = 'width:1000px;height:620px';
  document.body.append(canvas);
  const renderer = new Renderer(canvas, assets);
  renderer.setDynamicShadows(true);

  let randomState = 42;
  Math.random = () => ((randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0) / 4294967296);
  const game = new Game(() => .5);
  game.addPlayer('keyboard', 'Explorer One');
  game.addPlayer('pad:1', 'Explorer Two');
  game.start();
  Object.assign(game, generateWorld(42, 'forest'), {
    seed: 42, environment: 'forest', generatedEnvironment: 'forest', phase: 'play', openingBoard: false,
    bloom: 3, time: 22, event: null, weather: null, enemies: [], persist: () => {}, onSound: () => {}, spriteLibrary: assets.library,
  });
  const [first, second] = game.players;
  Object.assign(first, {x: 250, y: 350, room: null});
  Object.assign(second, {x: 1350, y: 1100, room: null});
  const tree = {kind: 'tree', x: first.x + 70, y: first.y + 80, size: 100};
  game.scenery.push(tree);

  const ctx = renderer.ctx;
  const nativeDrawImage = ctx.drawImage;
  let masks = null;
  ctx.drawImage = function (source, ...destination) {
    if (masks && destination.length === 4 && destination[2] === 1600 && new Error().stack.includes('drawRealtimeWorldShadows')) {
      const {a, b, c, d, e, f} = this.getTransform();
      const rgba = source.getContext('2d').getImageData(0, 0, source.width, source.height).data;
      let bytes = '';
      for (let offset = 0; offset < rgba.length; offset += 16384) {
        bytes += String.fromCharCode(...rgba.subarray(offset, offset + 16384));
      }
      masks.push({destination, transform: [a, b, c, d, e, f], opacity: this.globalAlpha, pixels: btoa(bytes)});
    }
    return nativeDrawImage.call(this, source, ...destination);
  };
  function capture() {
    masks = [];
    renderer.draw(game, 0);
    const frame = {
      views: renderer.splitViews.map(view => ({key: view.key, camera: view.camera})),
      masks,
      image: canvas.toDataURL(),
    };
    masks = null;
    return frame;
  }
  try {
    for (let frame = 0; frame < 4; frame++) renderer.draw(game, 1 / 60);
    const initial = capture();
    tree.x += 105;
    const movedProp = capture();
    second.jumpHeight = 35;
    const liftedActor = capture();
    return {initial, movedProp, liftedActor};
  } finally {
    ctx.drawImage = nativeDrawImage;
  }
}
