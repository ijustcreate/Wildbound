const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const run = require('node:child_process').spawnSync(require('electron'), [__filename, '--mute-audio'], {
    cwd: root, env, stdio: 'inherit', timeout: 90000,
  });
  if (run.error) console.error(run.error);
  process.exit(run.status ?? 1);
}

const { app, BrowserWindow } = require('electron');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const out = path.join(root, 'test-output', 'water-actor-clipping', base === root ? 'source' : 'packaged');
fs.mkdirSync(out, { recursive: true });
app.setPath('userData', fs.mkdtempSync(path.join(out, 'profile-')));
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 960, height: 680, webPreferences: { backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [], loadErrors = [];
  win.webContents.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
  win.webContents.session.webRequest.onErrorOccurred({ urls: ['file:///*'] }, ({ url, error }) => {
    if (error !== 'net::ERR_ABORTED') loadErrors.push({ url, error });
  });
  try {
    await win.loadFile(path.join(base, 'index.html'));
    const { pictures, ...result } = await win.webContents.executeJavaScript(`(${verify.toString()})()`);
    for (const [name, data] of Object.entries(pictures)) {
      fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
    }
    const report = { ...result, errors, muted: win.webContents.isAudioMuted(), out };
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    app.exit(report.failures.length || errors.length || !report.muted ? 1 : 0);
  } catch (error) {
    console.error(error, errors, loadErrors);
    app.exit(1);
  }
});

async function verify() {
  await window.wildboundBoot.ready;
  const nextFrame = requestAnimationFrame.bind(window);
  window.requestAnimationFrame = () => 0;
  await new Promise(nextFrame);
  const [{ Game, EVENTS }, { Assets }, { Renderer }, { rules, creatures }, { waterAt }, { tickSwimming }, { BEACH_PIER }] = await Promise.all([
    import('./src/core.mjs'), import('./src/assets.mjs'), import('./src/render.mjs'), import('./src/definitions.mjs'),
    import('./src/environment.mjs'), import('./src/swimming.mjs'), import('./src/beach-world.mjs'),
  ]);

  const checks = [], failures = [], pictures = {}, samples = {};
  function check(value, message, details) {
    if (value) checks.push(message);
    else failures.push({ message, details });
  }

  const assets = new Assets();
  await assets.load();
  const game = new Game(() => .5);
  game.seed = 1234;
  game.environment = 'beach';
  const player = game.addPlayer('keyboard', 'Coastal explorer');
  game.start();
  Object.assign(game, { phase: 'play', openingBoard: false, bloom: 3, weather: null, spriteLibrary: assets.library, scenery: [], time: 1.6 });
  rules.visionRadius = 1400;
  game.spawnEvent(EVENTS.findIndex(event => event.type === 'friendly_npc'));
  const npc = game.questNpcs[0];
  if (!npc) throw Error('Could not spawn a real quest NPC');
  const enemy = { ...creatures.skeleton.stats, id: 9001, kind: 'skeleton', faction: 'hostile', state: 'idle' };
  game.enemies = [enemy];
  game.effects = [];

  const actors = [
    { name: 'player', actor: player, x: 580 },
    { name: 'monster', actor: enemy, x: 640 },
    { name: 'quest-npc', actor: npc, x: 700 },
  ];
  const shoreRows = Array.from({ length: 32 }, (_, i) => 144 + i * 16);
  for (const subject of actors) {
    const rows = kind => shoreRows.filter(y => waterAt(game, subject.x, y) === kind);
    const shallow = rows('shallow');
    subject.bank = { sand: rows('sand')[0] + 24, shallow: shallow[Math.floor(shallow.length / 2)], water: rows('water').at(-1) - 48 };
    check(Object.entries(subject.bank).every(([kind, y]) => waterAt(game, subject.x, y) === kind), `${subject.name} has real Beach dry, shallow and deep locations`, subject.bank);
    Object.assign(subject.actor, { faceX: 0, faceY: 1, moving: false, room: null, invuln: 0 });
  }
  const pierX = BEACH_PIER.x + BEACH_PIER.w / 2, pierY = BEACH_PIER.y + 64;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:99999;width:960px;height:640px';
  canvas.getContext('2d', { willReadFrequently: true });
  document.body.append(canvas);
  const renderer = new Renderer(canvas, assets);
  const realDraw = renderer.animator.draw.bind(renderer.animator);
  const tracked = new Set(actors.map(subject => subject.actor.id));
  const called = new Set();
  let omit = false;
  renderer.animator.draw = (context, actor, ...args) => {
    if (tracked.has(actor.id)) {
      if (omit) return;
      called.add(actor.id);
    }
    return realDraw(context, actor, ...args);
  };

  function frame(name, kind, playerMode = 'grounded', subjects = actors) {
    const atPier = playerMode === 'pier' || playerMode === 'under-pier';
    for (const subject of actors) {
      const actor = subject.actor;
      const underBridge = playerMode === 'under-pier' && actor === player;
      Object.assign(actor, {
        x: atPier && actor === player ? pierX : subject.x,
        y: atPier && actor === player ? pierY : subject.bank[kind],
        jumpHeight: playerMode === 'airborne' && actor === player ? 30 : 0,
        groundHeight: 0, swimming: underBridge, underwater: false, underBridge, diveDepth: 0,
      });
    }
    tickSwimming(game, player, {}, .05);
    game.effects = [];
    const rows = subjects.map(subject => subject.actor.y);
    const centerY = (Math.min(...rows) + Math.max(...rows)) / 2;
    renderer.camera = { x: subjects.length === 1 ? player.x : 640, y: centerY + 4, zoom: 2.25 };
    called.clear();
    renderer.draw(game, 0);
    pictures[name] = canvas.toDataURL();
    const width = canvas.width, height = canvas.height;
    const full = renderer.ctx.getImageData(0, 0, width, height).data;
    // Draw the same frame without the tracked sprites. Comparing the two
    // keeps water, shadows and world labels out of the silhouette measurement.
    omit = true;
    renderer.draw(game, 0);
    const clear = renderer.ctx.getImageData(0, 0, width, height).data;
    omit = false;

    const sX = width / renderer.viewport.w * renderer.camera.zoom;
    const sY = height / renderer.viewport.h * renderer.camera.zoom;
    const result = {};
    for (const { name: tag, actor } of subjects) {
      const x = width / 2 + (actor.x - renderer.camera.x) * sX;
      const y = height / 2 + (actor.y - renderer.camera.y) * sY;
      let pixels = 0, top = Infinity, bottom = -Infinity, lower = 0;
      for (let py = Math.max(0, Math.round(y - 105 * sY)); py < Math.min(height, Math.round(y + 11 * sY)); py++) {
        for (let px = Math.max(0, Math.round(x - 33 * sX)); px < Math.min(width, Math.round(x + 33 * sX)); px++) {
          const i = (py * width + px) * 4;
          const strength = Math.abs(full[i] - clear[i]) + Math.abs(full[i + 1] - clear[i + 1]) + Math.abs(full[i + 2] - clear[i + 2]);
          if (strength < 36) continue;
          pixels++;
          const row = (py - y) / sY;
          if (row > -10) lower++;
          top = Math.min(top, row);
          bottom = Math.max(bottom, row);
        }
      }
      result[tag] = { called: called.has(actor.id), pixels, lower, top, bottom, height: bottom - top };
    }
    samples[name] = { ...result, playerState: { swimming: player.swimming, underBridge: player.underBridge,
      jumpHeight: player.jumpHeight, groundHeight: player.groundHeight, surface: waterAt(game, player.x, player.y) } };
    return result;
  }

  const dry = frame('01-dry', 'sand');
  const shallow = frame('02-shallows', 'shallow');
  const deep = frame('03-deep', 'water');
  const airborne = frame('04-airborne', 'water', 'airborne', [actors[0]]).player;
  const deck = frame('05-pier-deck', 'water', 'pier', [actors[0]]).player;
  const underPier = frame('06-under-pier', 'water', 'under-pier', [actors[0]]).player;
  const dryAgain = frame('07-back-on-sand', 'sand').player;
  for (const { name } of actors) {
    const [a, b, c] = [dry[name], shallow[name], deep[name]];
    check(a.called && b.called && c.called && Math.min(a.pixels, b.pixels, c.pixels) > 100, `${name} still has visible native sprite pixels at all three depths`, [a, b, c]);
    check(b.height < a.height - 1 && c.height < b.height - 2, `${name} loses more of its lower silhouette as the water gets deeper`, [a, b, c]);
  }
  check(!samples['02-shallows'].playerState.swimming && samples['03-deep'].playerState.swimming, 'Normal swimming logic wades in the shallows and swims out in deep water');
  check(!samples['04-airborne'].playerState.swimming && airborne.height > dry.player.height * .85
    && airborne.bottom < dry.player.bottom - 18, 'Airborne player retains the full silhouette above deep water', airborne);
  check(samples['05-pier-deck'].playerState.surface === 'bridge' && !samples['05-pier-deck'].playerState.swimming
    && deck.height > dry.player.height * .85, 'The dry pier deck does not clip feet above the ocean', deck);
  check(samples['06-under-pier'].playerState.underBridge && samples['06-under-pier'].playerState.swimming
    && underPier.height < deck.height - 10 && underPier.pixels > 100, 'Swimming below the same deck still clips the body and keeps the head visible', underPier);
  check(Math.abs(dryAgain.height - dry.player.height) <= 1, 'Returning to sand restores full player height', dryAgain);
  return { pictures, samples, checks, failures };
}
