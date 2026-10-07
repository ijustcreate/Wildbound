// Native Electron QA. No normal profile, authored assets, or running games are touched.
// Run: node scripts/verify-graveyard-world.cjs
// WILDBOUND_VERIFY_APP accepts either an unpacked app directory or resources/app.asar.
// WILDBOUND_VERIFY_ELECTRON optionally selects an existing Electron QA executable.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const cp = require('node:child_process');
  let installed;
  try { installed = require('electron'); } catch { /* Local runtime may be absent. */ }
  const candidates = [process.env.WILDBOUND_VERIFY_ELECTRON, installed,
    path.join(root, 'test-output', 'electron-41.10.7', 'electron.exe')];
  const binary = candidates.find(p => typeof p === 'string' && fs.existsSync(p));
  if (!binary) throw Error('No existing Electron runtime. Set WILDBOUND_VERIFY_ELECTRON; this verifier does not install dependencies.');
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const child = cp.spawnSync(binary, [__filename], {cwd: root, env, windowsHide: true,
    timeout: 180000, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8'});
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  if (child.error) console.error(child.error.stack);
  process.exitCode = child.error ? 1 : child.status ?? 1;
} else {
  launchElectronQA().catch(error => {console.error(error.stack); require('electron').app.exit(1);});
}

async function verifyInRenderer() {
  const [{Game, EVENTS}, {Renderer}, {Assets}, {HeroUI}, {ITEMS, count}, {drawItem},
    {saveSession, restoreSession}, {snapshot}, world, art, ecology, {livingAnimals}, {cemeteryEvent}] = await Promise.all([
    import('./src/core.mjs'), import('./src/render.mjs'), import('./src/assets.mjs'),
    import('./src/hero-ui.mjs'), import('./src/items.mjs'), import('./src/item-art.mjs'),
    import('./src/session.mjs'), import('./src/rooms.mjs'), import('./src/graveyard-world.mjs'),
    import('./src/graveyard-art.mjs'), import('./src/graveyard-ecology.mjs'),
    import('./src/living-ecosystem.mjs'), import('./src/graveyard-events.mjs')]);
  const report = window.graveyardQAReport = {checks: [], counters: {}, pictures: {}, stages: []};
  const check = (ok, name, detail) => {
    report.checks.push({name, passed: !!ok, ...(detail === undefined ? {} : {detail})});
    return !!ok;
  };
  const stage = async (name, action) => {
    const started = performance.now();
    try { await action(); } catch (error) { check(false, name, error.stack); }
    report.stages.push({name, milliseconds: Math.round(performance.now() - started)});
  };
  const assets = new Assets(); await assets.load();
  document.body.style.margin = '0';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:1280px;height:900px;z-index:99998';
  document.body.append(canvas);
  const makeGame = () => {
    const g = new Game(() => .5); g.seed = 75; g.environment = 'graveyard';
    const p = g.addPlayer('keyboard', 'Cemetery QA'); g.start();
    g.openingBoard = false; g.bloom = 3; g.time = 30; g.event = g.reveal = null;
    g.weather = {type: 'clear'}; g.spriteLibrary = assets.library;
    return {g, p};
  };
  const {g, p} = makeGame(), renderer = new Renderer(canvas, assets);
  const render = (name, x, y, zoom = 2) => {
    renderer.camera = {x, y, zoom}; renderer.draw(g, 0);
    report.pictures[name] = canvas.toDataURL('image/png');
  };
  const step = (seconds, input = {}) => {
    for (let n = 0; n < Math.ceil(seconds / .05); n++) g.update(.05, {keyboard: input});
  };
  const pressAttack = () => {g.update(.05, {keyboard: {attack: true}}); g.update(.05, {keyboard: {}});};
  const feetBlocked = (x, y, radius = 10, flying = false) => g.blocked(x, y, radius, flying, false, false, 0);
  const resetPlayer = (x, y, fx = 0, fy = -1) => Object.assign(p, {x, y, faceX: fx, faceY: fy,
    previousInput: {}, hp: 100, ui: null, room: null, consumeInput: false, attack: 0,
    charge: 0, stun: 0, sleeping: 0, jumpHeight: 0, groundHeight: 0});
  const nativeProbe = (paint, w = 192, h = 144) => {
    const probe = document.createElement('canvas'); probe.width = w; probe.height = h;
    const c = probe.getContext('2d'); c.imageSmoothingEnabled = false; paint(c);
    return probe;
  };
  const digest = data => {
    let n = 2166136261;
    for (const v of data) n = Math.imul(n ^ v, 16777619);
    return (n >>> 0).toString(16);
  };

  await stage('Generated layout, collision and native overview', () => {
    check(g.generatedEnvironment === 'graveyard' && g.graveyard?.version === 1, 'Real Game.start generates the cemetery');
    const kinds = Object.fromEntries([...new Set(g.scenery.map(s => s.kind))].map(kind => [kind, g.scenery.filter(s => s.kind === kind).length]));
    Object.assign(report.counters, {seed: g.seed, terrainTiles: g.terrain.length, scenery: g.scenery.length, sceneryKinds: kinds,
      initialRavens: g.enemies.filter(e => e.kind === 'raven').length});
    check(g.terrain.length === 2500 && g.scenery.length <= world.GRAVEYARD_SCENERY_LIMIT, 'Terrain and scenery populations are bounded');
    check(kinds.gravestone === 30 && kinds.leafless_tree === 6 && [2, 3].includes(kinds.mausoleum), 'Thirty attached markers, six bare trees, two or three mausoleums');
    check(kinds.cemetery_fence > 90 && kinds.grave_forest_tree > 130, 'Iron enclosure and dense outer forest are generated');
    check(g.graveyard.plots.every(plot => {
      const s = g.scenery.find(s => s.id === plot.stoneId);
      return s?.plotId === plot.id && s.x === plot.x + plot.w / 2 && s.rootY + 2 === plot.y;
    }), 'Every headstone is physically attached to its own grave plot');
    let safe = 0, gate = 0, trail = 0, failures = 0;
    for (let y = 700; y <= 878; y += 4) for (let x = 700; x <= 900; x += 4) {
      safe++; if (world.graveyardBlocked(g, x, y, 10)) failures++;
    }
    check(failures === 0, 'The complete requested spawn clearing is free of cemetery blockers', {samples: safe, failures});
    for (const [x, y] of [[352, 500], [1248, 750], [600, 288], [600, 1216], [704, 1216]]) {
      check(feetBlocked(x, y, 0), 'Game collision blocks perimeter ' + x + ',' + y);
      check(!feetBlocked(x, y, 10, true), 'Flying bypasses cemetery fence ' + x + ',' + y);
    }
    failures = 0;
    for (let x = 724; x <= 876; x += 8) for (let y = 1180; y <= 1280; y += 8) {
      gate++; if (feetBlocked(x, y, 16)) failures++;
    }
    check(failures === 0 && g.graveyard.gate.w === 192, 'Actual Game collision leaves the large gate and apron usable', {samples: gate, failures});
    failures = 0;
    for (let i = 1; i < g.graveyard.trail.length; i++) for (let n = 0; n <= 30; n++) {
      const a = g.graveyard.trail[i - 1], b = g.graveyard.trail[i], t = n / 30;
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      // The final endpoint is the map boundary, which the core correctly keeps solid.
      if (y > 1576) continue;
      trail++; if (feetBlocked(x, y, 16)) failures++;
    }
    check(failures === 0, 'Actual Game collision connects the gate to the winding forest exit', {samples: trail, failures});
    report.counters.collisionSamples = {safe, gate, trail};
    for (const kind of ['gravestone', 'mausoleum', 'leafless_tree', 'grave_forest_tree']) {
      const s = g.scenery.find(s => s.kind === kind), r = s.graveyardFootprint;
      check(feetBlocked(r.x + r.w / 2, r.y + r.h / 2, 0), 'Actual Game collision blocks ' + kind + ' foundation');
    }
    resetPlayer(800, 700); render('normal-overview', 800, 780, .43);
    render('full-environment', 800, 800, .28);
    render('gate-and-trail', 805, 1240, 1.1);
    render('attached-graves', 550, 570, 1.8);
    render('mausoleums-and-ivy', 800, 400, .9);
    const tree = g.scenery.find(s => s.kind === 'leafless_tree');
    render('leafless-tree-before', tree.x, tree.rootY - 44, 2.4);
    report.counters.groundChunks = renderer.groundChunks.size;
  });

  await stage('Ecology and unrelated-event guard', () => {
    const animals = ecology.spawnSurfaceEcology(g);
    report.counters.ecologyInitial = Object.fromEntries(['grave_moth', 'crypt_beetle', 'graveyard_cat'].map(kind => [kind, animals.filter(a => a.kind === kind).length]));
    check(animals.length === 15 && animals.filter(a => a.kind === 'grave_moth').length === 8 &&
      animals.filter(a => a.kind === 'crypt_beetle').length === 6 && animals.filter(a => a.kind === 'graveyard_cat').length === 1,
      'Real Game includes exactly eight grave moths, six crypt beetles and one cat');
    check(!livingAnimals(g).some(a => ['grave_moth', 'crypt_beetle', 'graveyard_cat'].includes(a.kind)) &&
      !g.enemies.some(e => ['grave_moth', 'crypt_beetle', 'graveyard_cat'].includes(e.kind)), 'Ambient fauna have one JSON owner, with no hidden runtime/combat duplicates');
    const cat = animals.find(a => a.kind === 'graveyard_cat');
    check(cat.faction === 'neutral' && cat.catchable === false, 'Cat is neutral and cannot be captured');
    for (const kind of ['graveyard_cat', 'grave_moth', 'crypt_beetle']) {
      const a = animals.find(a => a.kind === kind); render(kind + '-closeup', a.x, a.y - 10, 3);
    }
    const before = JSON.stringify(animals.map(a => ({id: a.id, x: a.x, y: a.y})));
    step(2); check(JSON.stringify(g.graveyard.surfaceEcology.animals.map(a => ({id: a.id, x: a.x, y: a.y}))) !== before,
      'Actual Game.update advances surface critters');
    const frozen = JSON.stringify(g.graveyard.surfaceEcology); g.paused = true;
    ecology.tickSurfaceEcology(g, 1); check(JSON.stringify(g.graveyard.surfaceEcology) === frozen, 'Paused surface ecology does not advance'); g.paused = false;
    let rejected = 0;
    for (const [index, event] of EVENTS.entries()) if (!cemeteryEvent(event)) {
      const state = JSON.stringify({event: g.event, enemies: g.enemies, portals: g.portals});
      g.spawnEvent(index); if (JSON.stringify({event: g.event, enemies: g.enemies, portals: g.portals}) === state) rejected++;
    }
    const unrelated = EVENTS.filter(e => !cemeteryEvent(e)).length;
    check(rejected === unrelated && unrelated > 0, 'Main eventfilter rejects every unrelated event', {rejected, unrelated});
    report.counters.unrelatedEventsRejected = rejected;
    g.enemies = []; // Isolate melee/capture scenarios from the initial three ravens.
  });

  await stage('Actual melee marker break and native skeleton crawl', () => {
    const stone = g.scenery.find(s => s.kind === 'gravestone'), initialHP = stone.hp;
    p.equipment = {...p.equipment, hand1: 'sword', hand2: null}; p.inventory = [];
    resetPlayer(stone.x, stone.rootY - 80, 0, -1);
    pressAttack(); check(stone.hp === initialHP, 'Game attack facing away cannot harvest the marker');
    step(1.5); resetPlayer(stone.x, stone.rootY - 80, 0, 1);
    const enemyCount = g.enemies.length; g.random = () => .05;
    pressAttack(); check(stone.hp > 0 && stone.hp < initialHP && g.enemies.length === enemyCount, 'Partial Game melee hit damages the stone without a spawn');
    step(1.5); resetPlayer(stone.x, stone.rootY - 80, 0, 1); pressAttack();
    const e = g.enemies.find(e => e.ambientGraveSpawn && e.graveEmergence?.origin.plotId === stone.plotId);
    if (!check(stone.depleted && e?.kind === 'skeleton' && e.hp > 0, 'Seeded .05 grave-break roll creates a living skeleton through actual Game attack input')) return;
    const origin = {...e.graveEmergence.origin}, hp = e.hp, bodyCounts = [], hashes = [];
    check(!feetBlocked(stone.x, stone.rootY, 8), 'Broken marker releases its actual Game collider');
    for (const elapsed of [.4, 1.2, 2.2]) {
      while (e.graveEmergence && e.graveEmergence.elapsed < elapsed - .0001) g.update(.05, {});
      check(e.graveEmergence && e.x === origin.x && e.y === origin.y && e.hp === hp && !e.moving && !e.attack,
        'Game freezes emerging skeleton AI at ' + elapsed + ' seconds');
      render('skeleton-crawl-' + Math.round(elapsed * 100), origin.x, origin.groundY - 18, 3);
      const probe = nativeProbe(c => {c.translate(96 - origin.x, 96 - origin.groundY); art.drawGraveEmergence(c, e, 1, 64);});
      const pixels = probe.getContext('2d').getImageData(0, 0, probe.width, probe.height).data;
      let bone = 0, belowDirt = 0;
      for (let n = 0; n < pixels.length; n += 4) {
        if (pixels[n] === 199 && pixels[n + 1] === 200 && pixels[n + 2] === 173 && pixels[n + 3]) bone++;
        if (Math.floor(n / 4 / probe.width) >= 106 && pixels[n + 3]) belowDirt++;
      }
      bodyCounts.push(bone); hashes.push(digest(pixels));
      check(bone > 0 && belowDirt === 0, 'Native crawling pixels are clipped above foreground dirt at ' + elapsed + ' seconds', {bone, belowDirt});
      report.pictures['crawl-native-' + Math.round(elapsed * 100)] = probe.toDataURL();
    }
    check(bodyCounts[0] < bodyCounts[1] && bodyCounts[1] < bodyCounts[2] && new Set(hashes).size === 3,
      'Actual elapsed progression reveals more clipped crawling body', {bodyCounts, hashes});
    const saved = JSON.parse(JSON.stringify(saveSession(g))), restored = restoreSession(saved);
    check(JSON.stringify(restored.enemies.find(a => a.id === e.id)?.graveEmergence) === JSON.stringify(e.graveEmergence),
      'Session JSON preserves the partially emerged body and attached origin');
    step(.3); check(!e.graveEmergence && e.hp > 0 && e.state !== 'emerging', 'Finished emergence returns the living skeleton to normal AI');
    report.counters.crawl = {duration: world.GRAVE_EMERGENCE_SECONDS, bodyCounts, hashes, origin, breakRoll: stone.breakRoll};
    g.enemies = []; g.random = () => .5;
  });

  await stage('Actual tree harvest, separated fall and grounded stump', () => {
    const tree = g.scenery.find(s => s.kind === 'leafless_tree'), root = {x: tree.x, y: tree.rootY};
    p.equipment.hand1 = 'sword'; p.equipment.hand2 = null;
    resetPlayer(tree.x, tree.rootY + 38, 0, -1);
    for (let n = 0; n < 9 && !tree.falling; n++) {pressAttack(); if (!tree.falling) step(.65);}
    if (!check(!!tree.falling, 'Repeated actual Game melee input fells the leafless tree')) return;
    const rootHashes = [], treeFrames = [];
    for (const elapsed of [.2, .7, 1.25]) {
      while (tree.falling && tree.falling < elapsed - .0001) g.update(.05, {});
      check(tree.x === root.x && tree.rootY === root.y, 'Falling upper tree leaves root position fixed at ' + elapsed);
      render('tree-fall-' + Math.round(elapsed * 100), root.x + 20, root.y - 30, 2.4);
      const probe = nativeProbe(c => {c.translate(96 - tree.x, 110 - tree.rootY); art.drawGraveyardProp(c, tree, g.time, g);}, 256, 144);
      rootHashes.push(digest(probe.getContext('2d').getImageData(72, 110, 48, 7).data)); treeFrames.push(probe.toDataURL());
      report.pictures['tree-native-' + Math.round(elapsed * 100)] = treeFrames.at(-1);
    }
    check(new Set(rootHashes).size === 1 && new Set(treeFrames).size === 3, 'Native root pixels stay fixed while upper trunk/branches fall separately', {rootHashes});
    step(.4); check(tree.fallen && tree.depleted && !tree.falling && g.scenery.includes(tree) && tree.rootY === root.y,
      'Shared tickEnvironment retains the depleted grounded stump');
    render('tree-grounded-stump', root.x, root.y - 10, 3);
    report.counters.tree = {root, rootHashes, fallen: tree.fallen, logDrops: g.loot.filter(l => l.type === 'log').length};
    check(report.counters.tree.logDrops === 1, 'Actual felling produces one log-drop record');
  });

  await stage('Nested container capture through input, real inventory icons and JSON state', async () => {
    const caught = [];
    p.inventory = [{type: 'relic_bag', qty: 1, contents: [{type: 'relic_bag', qty: 1, contents: [{type: 'empty_bottle', qty: 2}]}]}];
    p.equipment.hand1 = 'critter_net'; p.equipment.hand2 = null;
    for (const kind of ['grave_moth', 'crypt_beetle']) {
      const a = g.graveyard.surfaceEcology.animals.find(a => a.kind === kind);
      resetPlayer(a.x, a.y, 1, 0); pressAttack();
      const item = p.inventory.find(i => i?.type === 'caught_' + kind);
      check(count(p, 'caught_' + kind) === 1 && item?.captureContainer === 'empty_jar' && !g.graveyard.surfaceEcology.animals.some(b => b.id === a.id),
        'Game net input captures ' + kind + ' using a migrated bottle inside nested bags');
      caught.push(a.id); step(.4);
    }
    check(!p.inventory[0].contents[0].contents.some(i => ['empty_jar', 'empty_bottle'].includes(i?.type)),
      'Exactly two nested containers are consumed');
    const ids = g.graveyard.surfaceEcology.animals.map(a => a.id);
    check(ids.length === 13 && new Set(ids).size === ids.length && caught.every(id => g.graveyard.surfaceEcology.caught.includes(id)),
      'Catches reduce the bounded JSON population once each');
    const saved = JSON.parse(JSON.stringify(saveSession(g))), restored = restoreSession(saved);
    check(JSON.stringify(snapshot(g).graveyard) === JSON.stringify(saved.state.graveyard), 'Multiplayer snapshot includes all graveyard JSON ecology');
    check(JSON.stringify(restored.graveyard) === JSON.stringify(g.graveyard), 'Actual save/restore preserves exact cemetery ecology');
    for (let n = 0; n < 5; n++) ecology.spawnSurfaceEcology(restored);
    check(restored.graveyard.surfaceEcology.animals.length === 13 && !livingAnimals(restored).some(a => ['grave_moth', 'crypt_beetle', 'graveyard_cat'].includes(a.kind)),
      'Repeated restore/init neither refills catches nor creates hidden duplicates');
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;inset:0;z-index:99999'; document.body.append(host);
    const ui = new HeroUI(host); g.openInventory(p); p.ui.panel = 'pack'; p.ui.index = p.inventory.findIndex(i => i?.type === 'caught_grave_moth');
    ui.draw(g, renderer); await new Promise(resolve => setTimeout(resolve, 250)); ui.draw(g, renderer);
    const panel = ui.panels.get(p.id), iconHashes = {}, atlas = nativeProbe(c => {c.fillStyle = '#233b34'; c.fillRect(0, 0, 480, 180);}, 480, 180);
    const ac = atlas.getContext('2d'); ac.imageSmoothingEnabled = false;
    for (const [n, kind] of ['grave_moth', 'crypt_beetle'].entries()) {
      const index = p.inventory.findIndex(i => i?.type === 'caught_' + kind);
      const button = panel.querySelector('.item-grid button[data-index="' + index + '"][data-mode="pack"]'), icon = button?.querySelector('canvas.item-icon');
      const pixels = icon?.getContext('2d').getImageData(0, 0, icon.width, icon.height).data;
      let occupied = 0; for (let i = 3; pixels && i < pixels.length; i += 4) if (pixels[i]) occupied++;
      check(icon && occupied > 100 && button.getAttribute('aria-label').includes(ITEMS['caught_' + kind].name), 'Actual HeroUI item icon contains ' + kind + ' pixels', {occupied});
      if (icon) {iconHashes[kind] = digest(pixels); ac.drawImage(icon, n * 240 + 48, 20, 144, 144);}
    }
    const jar = nativeProbe(c => drawItem(c, 'empty_jar', 24, 24, 48), 48, 48);
    iconHashes.empty_jar = digest(jar.getContext('2d').getImageData(0, 0, 48, 48).data);
    check(new Set(Object.values(iconHashes)).size === 3, 'Real moth, beetle and empty-jar icons are distinct');
    report.pictures['actual-inventory-icons'] = atlas.toDataURL(); report.counters.iconHashes = iconHashes;
    window.graveyardInventoryCaptureReady = true;
    await window.graveyardCaptureInventory();
    const mothIndex = p.inventory.findIndex(i => i?.type === 'caught_grave_moth');
    p.ui.index = mothIndex; g.update(.05, {}); g.update(.05, {keyboard: {use: true}});
    const released = g.graveyard.surfaceEcology.animals.find(a => a.kind === 'grave_moth' && a.releasedOwner === p.id);
    check(released && count(p, 'empty_jar') === 1 && count(p, 'caught_grave_moth') === 0, 'Actual inventory Use releases moth and returns its exact container');
    g.update(.05, {}); g.update(.05, {keyboard: {close: true}}); host.remove();
    if (released) {
      resetPlayer(released.x, released.y, 1, 0); pressAttack();
      check(count(p, 'caught_grave_moth') === 1 && !g.graveyard.surfaceEcology.animals.some(a => a.id === released.id) &&
        g.graveyard.surfaceEcology.caught.length === 2, 'Game input recaptures the released moth without duplicate native caught IDs');
    }
    const {g: full, p: fp} = makeGame(); full.enemies = [];
    const target = full.graveyard.surfaceEcology.animals.find(a => a.kind === 'crypt_beetle');
    Object.assign(fp, {x: target.x, y: target.y, faceX: 1, faceY: 0, consumeInput: false, previousInput: {}});
    fp.equipment.hand1 = 'critter_net'; fp.equipment.hand2 = null;
    fp.inventory = Array.from({length: 24}, () => ({type: 'sword', qty: 1}));
    fp.inventory[0] = {type: 'relic_bag', qty: 1, contents: [{type: 'empty_jar', qty: 1}]};
    const pack = JSON.stringify(fp.inventory);
    full.update(.05, {keyboard: {attack: true}}); full.update(.05, {keyboard: {}});
    check(JSON.stringify(fp.inventory) === pack && full.graveyard.surfaceEcology.animals.some(a => a.id === target.id) && livingAnimals(full).length === 0,
      'Actual full-backpack net input is atomic and does not fall through to a different hidden critter');
    report.counters.ecologyAfterCapture = {animals: g.graveyard.surfaceEcology.animals.length, caught: [...g.graveyard.surfaceEcology.caught],
      hiddenAnimals: livingAnimals(g).length, restoredAnimals: restored.graveyard.surfaceEcology.animals.length};
  });
  report.counters.finalRenderer = {canvas: [canvas.width, canvas.height], viewport: renderer.viewport,
    scenery: g.scenery.length, groundChunks: renderer.groundChunks.size, pictures: Object.keys(report.pictures).length};
  return report;
}

async function launchElectronQA() {
  const {app, BrowserWindow, ipcMain} = require('electron');
  const base = path.resolve(process.env.WILDBOUND_VERIFY_APP || root);
  const out = path.join(root, 'test-output', 'graveyard-world');
  fs.mkdirSync(out, {recursive: true});
  app.disableHardwareAcceleration();
  const profile = fs.mkdtempSync(path.join(out, 'profile-')); app.setPath('userData', profile);
  const started = new Date().toISOString(), errors = [], screenshots = [];
  let window, finished = false;
  const writeReport = async (data = {}) => {
    for (const [name, png] of Object.entries(data.pictures || {})) {
      const target = path.join(out, name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.png');
      fs.writeFileSync(target, Buffer.from(png.split(',')[1], 'base64')); screenshots.push(target);
    }
    delete data.pictures;
    const checks = data.checks || [], failed = checks.filter(c => !c.passed).length + errors.length;
    const report = {...data, started, finished: new Date().toISOString(), base, profile, isolated: true,
      runtime: {executable: process.execPath, electron: process.versions.electron, chrome: process.versions.chrome},
      screenshots: [...new Set(screenshots)], errors, passed: checks.filter(c => c.passed).length, failed};
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({passed: report.passed, failed, errors, counters: report.counters, out, base, profile}, null, 2));
    return failed;
  };
  const deadline = setTimeout(async () => {
    if (finished) return; finished = true; errors.push('Native cemetery QA timed out');
    let data; try {data = await window.webContents.executeJavaScript('window.graveyardQAReport || {}');} catch {}
    await writeReport(data); app.exit(1);
  }, 155000);
  await app.whenReady();
  window = new BrowserWindow({show: false, width: 1280, height: 900, useContentSize: true,
    webPreferences: {offscreen: true, backgroundThrottling: false}});
  window.webContents.setAudioMuted(true);
  window.webContents.on('console-message', event => {if (event.level === 'error') errors.push(event.message);});
  window.webContents.on('render-process-gone', (_event, details) => errors.push('Renderer exited: ' + JSON.stringify(details)));
  window.webContents.on('preload-error', (_event, _file, error) => errors.push(error.stack));
  // Capture the actual composed HeroUI window, in addition to native canvas PNGs.
  const captureChannel = 'graveyard-native-inventory-' + process.pid;
  ipcMain.handle(captureChannel, async () => {
    const target = path.join(out, 'actual-inventory.png');
    fs.writeFileSync(target, (await window.webContents.capturePage()).toPNG()); screenshots.push(target);
  });
  // No preload or app modifications: the debugger injects a one-shot capture binding.
  window.webContents.debugger.attach('1.3');
  await window.webContents.debugger.sendCommand('Runtime.enable');
  await window.webContents.debugger.sendCommand('Runtime.addBinding', {name: 'graveyardNativeCapture'});
  window.webContents.debugger.on('message', async (_event, method, params) => {
    if (method !== 'Runtime.bindingCalled' || params.name !== 'graveyardNativeCapture') return;
    try {
      const target = path.join(out, 'actual-inventory.png');
      fs.writeFileSync(target, (await window.webContents.capturePage()).toPNG()); screenshots.push(target);
      await window.webContents.executeJavaScript('window.graveyardCaptureResolve()');
    } catch (error) {errors.push(error.stack); await window.webContents.executeJavaScript('window.graveyardCaptureResolve()');}
  });
  try {
    await window.loadFile(path.join(base, 'index.html'), {query: {tools: '1'}});
    await window.webContents.executeJavaScript(`(async()=>{
      await window.wildboundBoot.ready;
      window.graveyardRuntimeErrors=[];
      addEventListener('error',e=>window.graveyardRuntimeErrors.push(e.error?.stack||e.message));
      addEventListener('unhandledrejection',e=>window.graveyardRuntimeErrors.push(e.reason?.stack||String(e.reason)));
      const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
      window.graveyardCaptureInventory=()=>new Promise(resolve=>{window.graveyardCaptureResolve=resolve;window.graveyardNativeCapture('inventory');});
    })()`);
    console.log('Native graveyard QA loaded ' + base);
    const report = await window.webContents.executeJavaScript('(' + verifyInRenderer.toString() + ')()');
    errors.push(...await window.webContents.executeJavaScript('window.graveyardRuntimeErrors || []'));
    const failed = await writeReport(report); finished = true; clearTimeout(deadline);
    ipcMain.removeHandler(captureChannel); window.webContents.debugger.detach(); app.exit(failed ? 1 : 0);
  } catch (error) {
    errors.push(error.stack); let data;
    try {data = await window.webContents.executeJavaScript('window.graveyardQAReport || {}');} catch {}
    try {const target = path.join(out, 'failure.png'); fs.writeFileSync(target, (await window.webContents.capturePage()).toPNG()); screenshots.push(target);} catch {}
    await writeReport(data); finished = true; clearTimeout(deadline); ipcMain.removeHandler(captureChannel); app.exit(1);
  }
}
