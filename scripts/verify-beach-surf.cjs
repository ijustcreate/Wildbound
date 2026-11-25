const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const run = require('node:child_process').spawnSync(require('electron'), [__filename, '--mute-audio', ...process.argv.slice(2)], {
    cwd: root, env, stdio: 'inherit', timeout: 90000,
  });
  if (run.error) console.error(run.error);
  process.exit(run.status ?? 1);
}

const { app, BrowserWindow } = require('electron');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const baseline = process.argv.includes('--baseline');
const out = path.join(root, 'test-output', baseline ? 'beach-surf-before' : 'beach-surf');
fs.mkdirSync(out, { recursive: true });
app.setPath('userData', fs.mkdtempSync(path.join(out, 'profile-')));
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1100, height: 770, webPreferences: { backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  try {
    await win.loadFile(path.join(base, 'index.html'));
    const { pictures, ...result } = await win.webContents.executeJavaScript(`(${verify.toString()})(${baseline})`);
    const report = { ...result, muted: win.webContents.isAudioMuted(), errors, out };
    for (const [name, data] of Object.entries(pictures)) {
      fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
    }
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    if (!report.muted || errors.length) throw Error('Audio mute or console check failed');
    app.exit(report.failures?.length ? 1 : 0);
  } catch (error) {
    console.error(error, errors);
    app.exit(1);
  }
});

async function verify(baseline) {
  await window.wildboundBoot.ready;
  const nextFrame = requestAnimationFrame.bind(window);
  window.requestAnimationFrame = () => 0;
  await new Promise(nextFrame);

  const [
    { Game }, { Assets }, { Renderer }, { rules }, { drawBeachGround, beachCacheSize, BEACH_GROUND_CACHE_LIMIT },
    { beachShore, BEACH_PIER }, { waterAt }, { islandCoastDistance }, { createBeachSurfChunk, paintBeachSurfChunk },
  ] = await Promise.all([
    import('./src/core.mjs'), import('./src/assets.mjs'), import('./src/render.mjs'),
    import('./src/definitions.mjs'), import('./src/beach-art.mjs'),
    import('./src/beach-world.mjs'), import('./src/environment.mjs'), import('./src/boundless-generation.mjs'),
    baseline ? Promise.resolve({}) : import('./src/beach-surf.mjs'),
  ]);
  const assets = new Assets();
  await assets.load();
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:99999;width:1100px;height:740px';
  document.body.append(canvas);
  const renderer = new Renderer(canvas, assets);
  rules.visionRadius = 1600;

  function makeGame(mapMode) {
    const game = new Game(() => .5);
    game.seed = 1234;
    game.environment = 'beach';
    game.mapMode = mapMode;
    const player = game.addPlayer('keyboard', 'Shoreline QA');
    game.start();
    Object.assign(game, { openingBoard: false, bloom: 3, weather: null, spriteLibrary: assets.library });
    Object.assign(player, { invincible: true, hp: 100, room: null });
    return { game, player };
  }

  const pictures = {};
  const classic = makeGame('bounded');
  const checks = [], failures = [];
  const assert = (ok, message, details) => {
    if (ok) checks.push(message);
    else failures.push({ message, details });
  };
  const scene = ({ game, player }, name, x, y, time, zoom = 1.7) => {
    Object.assign(player, { x: x + 130, y: y + 75 });
    game.time = time;
    renderer.camera = { x, y, zoom };
    renderer.draw(game, 0);
    pictures[name] = canvas.toDataURL();
  };
  scene(classic, 'classic-coast', 520, 361, 0);

  const ground = document.createElement('canvas');
  ground.width = 680;
  ground.height = 385;
  const context = ground.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingEnabled = false;
  const drawImage = context.drawImage.bind(context);
  function groundFrame(game, x, y, time, staticOnly = false) {
    game.time = time;
    context.setTransform(1, 0, 0, 1, -x, -y);
    context.clearRect(x, y, ground.width, ground.height);
    if (staticOnly) context.drawImage = (...args) => {
      if (args[0].width === 256 && args[0].height === 256) drawImage(...args);
    };
    try {
      drawBeachGround(context, game, {
        sx: Math.floor(x / 32), sy: Math.floor(y / 32),
        ex: Math.ceil((x + ground.width) / 32), ey: Math.ceil((y + ground.height) / 32),
      });
    } finally {
      if (staticOnly) delete context.drawImage;
    }
    return context.getImageData(0, 0, ground.width, ground.height).data;
  }

  groundFrame(classic.game, 170, 150, 0);
  pictures['classic-ground'] = ground.toDataURL();
  if (baseline) {
    scene(classic, 'classic-pools', 305, 1074, 0);
    return { pictures, baseline };
  }

  function color(pixels, x, y) {
    const index = (y * ground.width + x) * 4;
    return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
  }

  function foam(r, g, b) {
    return r >= 215 && g >= 216 && b >= 179 && r - b < 47;
  }

  function pixelChange(first, second, x, y, w, h) {
    let changed = 0;
    for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) {
      const index = (row * ground.width + col) * 4;
      if (first[index] !== second[index] || first[index + 1] !== second[index + 1] || first[index + 2] !== second[index + 2]) changed++;
    }
    return changed / (w * h);
  }

  const coastX = 170, coastY = 150, samples = [], boardCoverage = [], foamCoverage = [];
  const terrainBefore = classic.game.terrain.join(',');
  const pierX = BEACH_PIER.x + BEACH_PIER.w / 2;
  const surfacePoints = [[600, 130], [600, 340], [600, 525], [pierX, BEACH_PIER.y + 32], [280, 1060]];
  const surfaceTypes = () => surfacePoints.map(([x, y]) => waterAt(classic.game, x, y));
  const initialSurfaceTypes = surfaceTypes();
  let surfaceStable = true;
  const staticCoast = groundFrame(classic.game, coastX, coastY, 0, true);
  for (let i = 0; i < 24; i++) {
    const time = i * .32;
    const pixels = groundFrame(classic.game, coastX, coastY, time);
    surfaceStable &&= initialSurfaceTypes.join() === surfaceTypes().join();
    const crest = [];
    for (let worldX = 525; worldX < 810; worldX += 4) {
      const shore = Math.round(beachShore(worldX, classic.game.seed));
      for (let worldY = shore + 43; worldY >= shore - 32; worldY--) {
        const [r, g, b] = color(pixels, worldX - coastX, worldY - coastY);
        const [dryR, dryG, dryB] = color(staticCoast, worldX - coastX, worldY - coastY);
        if (r - dryR + g - dryG < 28 || b - dryB < 13) continue;
        crest.push(worldY - shore);
        break;
      }
    }
    crest.sort((a, b) => a - b);
    samples.push({ time, columns: crest.length, median: crest[Math.floor(crest.length / 2)] ?? null });

    scene(classic, 'coast-' + String(i).padStart(2, '0'), 520, 361, time);
    let visibleBoardRows = 0, maxFoamWidth = 0;
    const projection = renderer.camera;
    const scaleX = canvas.width / renderer.viewport.w, scaleY = canvas.height / renderer.viewport.h;
    const pixelX = x => Math.round(canvas.width / 2 + (x - projection.x) * projection.zoom * scaleX);
    const pixelY = y => Math.round(canvas.height / 2 + (y - projection.y) * projection.zoom * scaleY);
    const a = pixelX(pierX - 21), b = pixelX(pierX + 21);
    const startY = pixelY(305), endY = pixelY(431);
    const pier = renderer.ctx.getImageData(a, startY, b - a, endY - startY).data;
    for (let y = 0; y < endY - startY; y++) {
      let board = 0, foamWidth = 0;
      for (let x = 0; x < b - a; x++) {
        const k = (y * (b - a) + x) * 4;
        const r = pier[k], g = pier[k + 1], blue = pier[k + 2];
        if (foam(r, g, blue)) foamWidth++;
        else if (r > blue + 14 && r > g + 4) board++;
      }
      if (board > (b - a) * .75) visibleBoardRows++;
      maxFoamWidth = Math.max(maxFoamWidth, foamWidth);
    }
    boardCoverage.push(visibleBoardRows / (endY - startY));
    foamCoverage.push(maxFoamWidth / (b - a));
  }

  const track = samples.filter(sample => sample.columns >= 18).map(sample => sample.median);
  const crestTravel = Math.max(...track) - Math.min(...track);
  const advances = track.some((value, i) => i && value > track[i - 1] + 1);
  const retreats = track.some((value, i) => i && value < track[i - 1] - 1);
  assert(track.length >= 6 && crestTravel >= 8 && advances && retreats, 'Classic foam advances and retreats across the shoreline', samples);
  assert(Math.min(...boardCoverage) > .75 && Math.max(...foamCoverage) < .45,
    'The real Renderer keeps the pier deck visible without a bright surf line cutting across it', { boardCoverage, foamCoverage });
  assert(['bridge', 'water', 'shallow', 'sand'].every(kind => initialSurfaceTypes.includes(kind))
    && terrainBefore === classic.game.terrain.join(',') && surfaceStable, 'Tide leaves the Classic logical water, sand and pier classification unchanged', initialSurfaceTypes);

  const firstPool = groundFrame(classic.game, 0, 900, 0);
  const secondPool = groundFrame(classic.game, 0, 900, 2.5);
  const poolChange = pixelChange(firstPool, secondPool, 223, 107, 114, 90);
  const dryChange = pixelChange(firstPool, secondPool, 223, 300, 114, 35);
  assert(poolChange > .025 && dryChange === 0, 'Tide-pool water animates while dry sand remains fixed', { poolChange, dryChange });
  scene(classic, 'classic-pools', 305, 1074, 0);
  scene(classic, 'classic-pools-later', 305, 1074, 2.5);

  const boundless = makeGame('boundless');
  const seamX = -256;
  let shoreY = -450;
  while (shoreY < 360 && islandCoastDistance(seamX, shoreY, boundless.game.seed) < 20) shoreY += 2;
  const firstX = -500, secondX = -360, firstY = shoreY - 208, secondY = firstY + 38;
  const first = groundFrame(boundless.game, firstX, firstY, 2);
  pictures['boundless-negative-ground'] = ground.toDataURL();
  const second = groundFrame(boundless.game, secondX, secondY, 2);
  let matches = 0, comparable = 0;
  for (let y = shoreY - 110; y < shoreY + 110; y++) for (let x = seamX - 64; x < seamX + 64; x++) {
    const a = color(first, x - firstX, y - firstY);
    const b = color(second, x - secondX, y - secondY);
    if (a[3] === 255 && a.every((value, i) => value === b[i])) matches++;
    comparable++;
  }
  const seamMatch = matches / comparable;
  function chunkRaster(x0, y0, kindAt) {
    const chunk = createBeachSurfChunk(x0, y0, 256, kindAt, boundless.game.seed);
    paintBeachSurfChunk(chunk, 2);
    const image = document.createElement('canvas');
    image.width = image.height = 256;
    const pen = image.getContext('2d', { willReadFrequently: true });
    pen.imageSmoothingEnabled = false;
    pen.drawImage(chunk.ground, 0, 0);
    pen.drawImage(chunk.surface, 0, 0, 256, 256);
    const pixels = pen.getImageData(0, 0, 256, 256).data;
    return (x, y) => {
      const index = ((y - y0) * 256 + x - x0) * 4;
      return pixels.subarray(index, index + 4);
    };
  }
  const y0 = Math.floor(shoreY / 4) * 4 - 128;
  const kindAt = (x, y) => waterAt(boundless.game, x, y);
  const left = chunkRaster(seamX - 256, y0, kindAt);
  const right = chunkRaster(seamX, y0, kindAt);
  const centered = chunkRaster(seamX - 128, y0, kindAt);
  let rasterMatches = 0, rasterComparisons = 0;
  for (let y = shoreY - 112; y <= shoreY + 110; y += 2) for (let x = seamX - 16; x < seamX + 16; x += 2) {
    const split = x < seamX ? left(x, y) : right(x, y);
    const single = centered(x, y);
    if (split.every((value, i) => value === single[i])) rasterMatches++;
    rasterComparisons++;
  }
  const rasterMatch = rasterMatches / rasterComparisons;
  assert(seamMatch > .995 && rasterMatch > .995, 'Negative 256-pixel shore chunk seams agree across camera and raster origins', { seamX, shoreY, seamMatch, rasterMatch });
  const classicBed = (x, y) => {
    const kind = waterAt(classic.game, x, y);
    const shore = beachShore(x, classic.game.seed);
    return kind !== 'bridge' ? kind : y < shore - 62 ? 'water' : y < shore + 18 ? 'shallow' : 'sand';
  };
  const upper = chunkRaster(256, 0, classicBed);
  const lower = chunkRaster(256, 256, classicBed);
  const across = chunkRaster(256, 128, classicBed);
  let classicMatches = 0, classicComparisons = 0;
  for (let y = 244; y < 268; y += 2) for (let x = 274; x < 400; x += 2) {
    const split = y < 256 ? upper(x, y) : lower(x, y);
    const single = across(x, y);
    if (split.every((value, i) => value === single[i])) classicMatches++;
    classicComparisons++;
  }
  const classicRasterMatch = classicMatches / classicComparisons;
  assert(classicRasterMatch > .995, 'Classic offshore ground agrees on both sides of the horizontal raster seam', classicRasterMatch);
  const boundlessWater = waterAt(boundless.game, seamX - 12, shoreY - 170);
  const boundlessLand = waterAt(boundless.game, seamX - 12, shoreY + 100);
  assert(boundlessWater === 'water' && boundlessLand === 'sand', 'Boundless negative shoreline contains both generated ocean and walkable sand', [boundlessWater, boundlessLand]);
  const boundlessLater = groundFrame(boundless.game, firstX, firstY, 5);
  const boundlessChange = pixelChange(first, boundlessLater, seamX - firstX - 45, shoreY - firstY - 48, 90, 72);
  assert(boundlessChange > .035, 'The negative Boundless surf visibly moves along its generated shore', boundlessChange);
  scene(boundless, 'boundless-coast', seamX, shoreY, 0);
  scene(boundless, 'boundless-coast-later', seamX, shoreY, 2.5);
  assert([classic.game, boundless.game].every(game => beachCacheSize(game) <= BEACH_GROUND_CACHE_LIMIT), 'Beach ground chunk caches stay within their cap');

  return { pictures, baseline, checks, failures, samples, crestTravel, boardCoverage, foamCoverage, poolChange, dryChange, seamMatch, rasterMatch, classicRasterMatch, boundlessChange };
}
