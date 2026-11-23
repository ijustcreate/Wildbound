const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const electron = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe');
  const run = spawnSync(electron, [__filename, '--mute-audio'], {
    cwd: root,
    env,
    stdio: 'inherit',
    timeout: 150000,
  });
  if (run.error) console.error(run.error);
  process.exit(run.status ?? 1);
}

const { app, BrowserWindow } = require('electron');
const appRoot = process.env.WILDBOUND_VERIFY_APP || root;
const output = path.join(root, 'test-output', 'forest-tree-variants', appRoot === root ? 'source' : 'packaged');
fs.mkdirSync(output, { recursive: true });
app.setPath('userData', fs.mkdtempSync(path.join(output, 'profile-')));
app.commandLine.appendSwitch('mute-audio');

async function reviewTrees() {
  window.requestAnimationFrame = () => 0;
  const { Game } = await import('./src/core.mjs');
  const { Assets } = await import('./src/assets.mjs');
  const { Renderer } = await import('./src/render.mjs');
  const { tickSceneryFalls } = await import('./src/environment.mjs');
  const { footprintHit, generateWorld, propDepth } = await import('./src/world.mjs');
  const {
    drawForestTree,
    forestTreeTierOcclusion,
    isTwoTierForestTree,
    treeBase,
    treeSeason,
    treeType,
  } = await import('./src/forest-tree-art.mjs');

  const checks = [];
  const images = {};
  const report = {};
  function check(condition, message, detail) {
    if (!condition) throw new Error(detail === undefined ? message : `${message} (${JSON.stringify(detail)})`);
    checks.push(message);
  }

  const assets = new Assets();
  await assets.load();
  const game = new Game(() => 0.5);
  const explorer = game.addPlayer('keyboard', 'Explorer');
  game.start();
  Object.assign(game, {
    environment: 'forest', generatedEnvironment: 'forest', openingBoard: false,
    bloom: 3, event: null, enemies: [], weather: null, time: 12,
    spriteLibrary: assets.library, persist() {}, onSound() {},
  });
  game.sky.elapsed = 100;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:1200px;height:820px;display:block';
  document.body.replaceChildren(canvas);
  function viewport(surface, camera) {
    const view = new Renderer(surface, assets);
    view.drawMultiplayer = () => false;
    view.camera = { ...camera };
    view.cameraOverride = { ...camera };
    view.cameraFollowSpeed = 5;
    return view;
  }
  const comparisonCamera = { x: 555, y: 408, zoom: 1.18 };
  const renderer = viewport(canvas, comparisonCamera);
  const oak = {
    id: 'qa-oak', kind: 'tree', treeType: 'oak', procedural: true,
    x: 555, y: 500 - 108 * 0.35, rootY: 500, size: 108, seed: 41,
  };
  const tiered = { ...oak, id: 'qa-tiered', treeVariant: 'two-tier' };
  const maple = { ...oak, id: 'qa-maple', treeType: 'maple' };
  check(isTwoTierForestTree(tiered) && !isTwoTierForestTree(oak), 'Only the tagged comparison oak selects the two-tier variant');
  check(treeType(maple) === 'maple' && treeSeason(maple, game) === 'autumn', 'Default maple uses its own species and autumn season');

  for (const tree of [maple, tiered]) {
    const base = treeBase(tree);
    check(base.x === oak.x && base.y === oak.rootY && propDepth(tree) === propDepth(oak), `${tree.id} keeps the existing oak ground anchor and scene depth`);
    const footprint = (dx, dy) => footprintHit(tree, assets.library.tree, base.x + dx, base.y + dy, 4);
    check(footprint(0, 0) && !footprint(0, -45) && !footprint(55, -25), `${tree.id} blocks the trunk without blocking the canopy clearance`);
    check([-26, -19, 0, 19, 26].every(dx => [-22, -10, 0, 6].every(dy =>
      footprint(dx, dy) === footprintHit(oak, assets.library.tree, base.x + dx, base.y + dy, 4))), `${tree.id} keeps the existing trunk collision width`);
  }

  const artSheet = document.createElement('canvas');
  artSheet.width = 1068;
  artSheet.height = 392;
  const sheetPen = artSheet.getContext('2d');
  sheetPen.fillStyle = '#344b3a';
  sheetPen.fillRect(0, 0, artSheet.width, artSheet.height);
  const art = document.createElement('canvas');
  art.width = 350;
  art.height = 340;
  const pen = art.getContext('2d', { willReadFrequently: true });
  function artPixels(tree, time) {
    pen.clearRect(0, 0, art.width, art.height);
    pen.save();
    pen.translate(175 - oak.x, 291 - oak.rootY);
    drawForestTree(pen, tree, time, game);
    pen.restore();
    return pen.getImageData(0, 0, art.width, art.height).data;
  }
  const artByTree = new Map();
  const comparisons = [[oak, 'Standard oak'], [tiered, 'Two-tier oak'], [maple, 'Autumn maple']];
  for (const [i, [tree, label]] of comparisons.entries()) {
    const before = artPixels(tree, game.time);
    artByTree.set(tree, before);
    sheetPen.drawImage(art, i * 356 + 3, 20);
    sheetPen.fillStyle = '#f0e4ba';
    sheetPen.font = '17px sans-serif';
    sheetPen.textAlign = 'center';
    sheetPen.fillText(label, i * 356 + 178, 367);
    const after = artPixels(tree, game.time + 0.52);
    check(after.some((channel, index) => channel !== before[index]), `${label} responds to native wind animation`);
  }
  function differentOpacity(first, second) {
    return first.some((channel, index) => index % 4 === 3 && channel !== second[index]);
  }
  check(differentOpacity(artByTree.get(oak), artByTree.get(tiered)), 'Two-tier tree has a distinct canopy silhouette');
  check(differentOpacity(artByTree.get(oak), artByTree.get(maple)), 'Maple differs in shape from the established oak');
  const maplePixels = artByTree.get(maple);
  let warmLeaves = 0;
  for (let index = 0; index < maplePixels.length; index += 4) {
    const y = Math.floor(index / (4 * art.width));
    const [red, green, blue, alpha] = maplePixels.subarray(index, index + 4);
    if (y < 230 && alpha > 150 && red > 100 && red > green * 1.19 && red > blue * 1.5) warmLeaves++;
  }
  check(warmLeaves > 500, 'Maple crown contains a visible volume of warm autumn leaves', warmLeaves);
  images['01-tree-comparison'] = artSheet.toDataURL();

  const naturalWorlds = [42, 61, 137, 281, 526, 841].map(seed => ({ seed, ...generateWorld(seed, 'forest') }));
  const naturalCounts = naturalWorlds.map(world => ({
    seed: world.seed,
    trees: world.scenery.filter(tree => tree.kind === 'tree').length,
    maples: world.scenery.filter(tree => tree.treeType === 'maple').length,
    tiers: world.scenery.filter(isTwoTierForestTree).length,
  }));
  const naturalTiers = naturalCounts.reduce((sum, scene) => sum + scene.tiers, 0);
  const naturalMaples = naturalCounts.reduce((sum, scene) => sum + scene.maples, 0);
  const naturalTrees = naturalCounts.reduce((sum, scene) => sum + scene.trees, 0);
  check(naturalMaples > 0 && naturalTiers > 0 && naturalTrees > 0, 'Unmodified forest generation supplies both new trees', naturalCounts);
  check(naturalTiers / naturalTrees < 0.2, 'Two-tier trees are uncommon in the generated forest sample', naturalCounts);
  report.naturalCounts = naturalCounts;

  function setScene(world) {
    Object.assign(game, world, { forestLandscape: world.forestLandscape, portalTransition: null });
    game.portals = [];
    game.questNpcs = [];
    game.supplyChests = [];
    game.explored = new Set(game.terrain.keys());
  }
  function setCamera(camera) {
    Object.assign(renderer.camera, camera);
    Object.assign(renderer.cameraOverride, camera);
  }
  const firstNatural = naturalWorlds.find(world => world.scenery.some(isTwoTierForestTree));
  const feature = firstNatural.scenery.filter(isTwoTierForestTree).sort((a, b) =>
    Math.hypot(a.x - 800, a.rootY - 800) - Math.hypot(b.x - 800, b.rootY - 800))[0];
  setScene(firstNatural);
  const walkable = [[38, 28], [-38, 28], [50, 40], [-50, 40], [0, 60]].map(([x, y]) =>
    ({ x: feature.x + x, y: feature.rootY + y })).find(p => !game.blocked(p.x, p.y, 6));
  check(Boolean(walkable), 'Generated two-tier tree has a walkable approach near the trunk');
  Object.assign(explorer, walkable);
  setCamera({ x: feature.x, y: feature.rootY - feature.size * 1.05, zoom: 1.05 });
  renderer.draw(game, 0.05);
  check(renderer.actorQueue.some(actor => actor.sourceProp === feature), 'A naturally generated two-tier tree goes through normal world rendering');
  images['02-natural-grove'] = canvas.toDataURL();

  const openScene = naturalWorlds[0];
  setScene({ ...openScene, terrain: openScene.terrain.map(() => 'grass'), scenery: [
    { ...oak, x: 392 }, tiered, { ...maple, x: 731 },
  ] });
  setCamera(comparisonCamera);

  const candidates = [];
  for (let y = -tiered.size * 2.3; y <= 0; y += 2) {
    for (let x = -tiered.size; x <= tiered.size; x += 2) {
      const target = { ...explorer, x: tiered.x + x, y: tiered.rootY + y };
      const state = forestTreeTierOcclusion(tiered, target);
      if (state.upper || state.lower) candidates.push({ x: target.x, y: target.y, ...state });
    }
  }
  function sampleFor(upper, lower) {
    const sameTier = candidates.filter(p => p.upper === upper && p.lower === lower);
    const centered = sameTier.filter(p => Math.abs(p.x - tiered.x) < 11);
    const points = centered.length ? centered : sameTier;
    return points[Math.floor(points.length / 2)];
  }
  const upperOnly = sampleFor(true, false);
  const lowerOnly = sampleFor(false, true);
  const both = sampleFor(true, true);
  check(upperOnly && lowerOnly && both, 'Canopy geometry allows each tier to fade alone or together');

  function state(view) {
    const alpha = view.treeTierAlpha?.get(tiered);
    check(Number.isFinite(alpha?.upper) && Number.isFinite(alpha?.lower), 'Renderer recorded finite independent opacity for both tiers', alpha);
    return { ...alpha };
  }
  function steady(view, count = 7) {
    for (let frame = 0; frame < count; frame++) view.draw(game, 0.21);
  }
  const clear = { x: tiered.x + 46, y: tiered.rootY + 25 };
  Object.assign(explorer, clear);
  steady(renderer, 1);
  const baseline = state(renderer);
  check(baseline.upper > 0.97 && baseline.lower > 0.97, 'Both tiers start solid with explorer in front', baseline);
  images['03-before-fade'] = canvas.toDataURL();

  Object.assign(explorer, upperOnly);
  renderer.draw(game, 0.045);
  const entering = state(renderer);
  steady(renderer);
  const upper = state(renderer);
  check(upper.upper < entering.upper && entering.upper < baseline.upper, 'Upper canopy transitions gradually before reaching its faded state', { entering, upper });
  check(upper.upper < 0.55 && upper.lower > 0.97, 'Only the overlapping upper canopy fades', upper);
  images['04-upper-fade'] = canvas.toDataURL();

  Object.assign(explorer, both);
  steady(renderer);
  const overlap = state(renderer);
  check(overlap.upper < 0.55 && overlap.lower < 0.65, 'Both foliage tiers fade where the explorer overlaps both', overlap);
  images['05-both-fade'] = canvas.toDataURL();

  Object.assign(explorer, lowerOnly);
  steady(renderer);
  const lower = state(renderer);
  check(lower.upper > 0.97 && lower.lower < 0.55, 'Only the overlapping lower canopy fades', lower);
  images['05b-lower-fade'] = canvas.toDataURL();

  Object.assign(explorer, clear);
  renderer.draw(game, 0.045);
  const leaving = state(renderer);
  steady(renderer);
  const restored = state(renderer);
  check(overlap.lower < leaving.lower && leaving.lower < restored.lower && restored.upper > 0.97 && restored.lower > 0.97,
    'Both tiers smoothly restore opacity when the explorer leaves', { overlap, leaving, restored });
  images['06-restored'] = canvas.toDataURL();
  report.opacity = { baseline, entering, upper, overlap, lower, leaving, restored };

  const savedEquipment = explorer.equipment;
  const savedShadows = renderer.dynamicShadows;
  explorer.equipment = { ...savedEquipment, hand2: 'torch' };
  game.sky.elapsed = 345;
  renderer.setDynamicShadows(true);
  steady(renderer);
  const litTiers = [...renderer.worldLights.props.entries()]
    .filter(([key]) => key.includes(tiered.id)).map(([key, entry]) => {
      const { bounds, original } = entry;
      const pixels = original.getContext('2d').getImageData(0, 0, original.width, original.height).data;
      return { layer: key.split(':').at(-1), bounds, populated: pixels.some((n, i) => i % 4 === 3 && n > 0) };
    });
  check(['upper', 'lower', 'roots'].every(layer => litTiers.some(tier => tier.layer === layer && tier.populated &&
    Object.values(tier.bounds).every(Number.isFinite))), 'Torchlight renders all three tree layers with independent populated light buffers', litTiers);
  images['07-torchlight'] = canvas.toDataURL();
  report.litTiers = litTiers;
  explorer.equipment = savedEquipment;
  game.sky.elapsed = 100;
  renderer.setDynamicShadows(savedShadows);

  const teammate = game.addPlayer('pad:0', 'Partner');
  Object.assign(explorer, both);
  Object.assign(teammate, clear);
  const child = document.createElement('canvas');
  child.style.cssText = canvas.style.cssText;
  document.body.append(child);
  const partnerView = viewport(child, renderer.camera);
  renderer.splitChild = true;
  renderer.cameraOwnerIds = [explorer.id];
  partnerView.splitChild = true;
  partnerView.cameraOwnerIds = [teammate.id];
  steady(renderer);
  steady(partnerView);
  const explorerOpacity = state(renderer);
  const partnerOpacity = state(partnerView);
  check(explorerOpacity.upper < 0.55 && explorerOpacity.lower < 0.65 && partnerOpacity.upper > 0.97 && partnerOpacity.lower > 0.97,
    'Independent split renderers fade foliage only for their own explorers', { explorerOpacity, partnerOpacity });
  images['08-split-explorer-view'] = canvas.toDataURL();
  images['09-split-partner-view'] = child.toDataURL();
  report.splitOpacity = { explorer: explorerOpacity, partner: partnerOpacity };

  Object.assign(teammate, { x: 1200, y: 1200 });
  Object.assign(explorer, clear);
  Object.assign(tiered, { falling: 0.85, fallDirection: 1 });
  steady(renderer, 1);
  check(!renderer.treeTierAlpha.get(tiered), 'Falling tree clears the standing canopy fade state');
  images['10-falling'] = canvas.toDataURL();
  const lootBefore = game.loot.length;
  tickSceneryFalls(game, 0.7);
  steady(renderer, 1);
  check(tiered.fallen && tiered.depleted && game.loot.length === lootBefore + 1 && game.loot.at(-1).type === 'log' &&
    renderer.actorQueue.some(actor => actor.sourceProp === tiered), 'Felled two-tier tree drops logs and leaves its stump in the active render queue');
  images['11-stump'] = canvas.toDataURL();
  return { checks, images, ...report };
}

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1280, height: 850, webPreferences: { backgroundThrottling: false } });
  const errors = [];
  window.webContents.setAudioMuted(true);
  window.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  window.webContents.on('render-process-gone', (_, details) => errors.push(details.reason));
  const deadline = setTimeout(() => app.exit(1), 140000);
  try {
    await window.loadFile(path.join(appRoot, 'index.html'));
    await window.webContents.executeJavaScript('wildboundBoot.ready');
    const result = await window.webContents.executeJavaScript(
      `(${reviewTrees.toString()})().catch(error => ({ error: String(error), stack: error.stack }))`
    );
    if (result.error) throw new Error(result.stack || result.error);
    const { images, checks, ...detail } = result;
    for (const [name, data] of Object.entries(images)) {
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    }
    const muted = window.webContents.isAudioMuted();
    const report = { passed: checks.length, muted, errors, checks, ...detail };
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    app.exit(muted && errors.length === 0 ? 0 : 1);
  } catch (error) {
    console.error(error?.stack || error, errors);
    app.exit(1);
  } finally {
    clearTimeout(deadline);
  }
});
