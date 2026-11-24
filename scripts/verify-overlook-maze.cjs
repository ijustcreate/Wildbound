const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const run = require('node:child_process').spawnSync(require('electron'), [__filename, '--mute-audio'], {
    cwd: root, env, encoding: 'utf8', timeout: 160000,
  });
  process.stdout.write(run.stdout || '');
  process.stderr.write(run.stderr || '');
  if (run.error) console.error(run.error);
  process.exit(run.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const label = process.env.WILDBOUND_MAZE_CAPTURE || (process.env.WILDBOUND_VERIFY_APP ? 'packaged' : 'source');
if (!/^[\w-]+$/.test(label)) throw Error('Invalid maze capture name');
const out = path.join(root, 'test-output', 'overlook-maze', label);
fs.mkdirSync(out, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(out, 'profile-')));
app.commandLine.appendSwitch('mute-audio');
const deadline = setTimeout(() => app.exit(1), 150000);

app.whenReady().then(async () => {
  const win = new BrowserWindow({show: false, width: 1280, height: 900, useContentSize: true,
    webPreferences: {backgroundThrottling: false}});
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  try {
    await win.loadFile(path.join(base, 'index.html'));
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result = await win.webContents.executeJavaScript(`(${verify.toString()})()`);
    for (const [name, png] of Object.entries(result.images)) {
      fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(png.split(',')[1], 'base64'));
    }
    const report = {appPath: base, passed: result.checks.length, checks: result.checks,
      muted: win.webContents.isAudioMuted(), errors, failure: result.failure || null};
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    if (result.failure || errors.length) throw Error([result.failure, ...errors].filter(Boolean).join('\n'));
    console.log(`${report.passed} muted Overlook checks passed. ${out}`);
    clearTimeout(deadline);
    app.exit(0);
  } catch (error) {
    console.error(error);
    clearTimeout(deadline);
    app.exit(1);
  }
});

async function verify() {
  window.requestAnimationFrame = () => 0;
  const [{Game, expeditionCameraTarget}, {Assets}, {Renderer}, {saveSession, restoreSession}, {enterWildLands},
    {wildLandsTravel}, {wildLandmarkBuildings}, {equip, BACKPACK_SLOTS}, {actorRadius, collisionOffset},
    {overlookMazeFor, overlookBlocked}, {drawOverlookGarden, overlookSubjects, drawOverlookSubject},
    {OVERLOOK_TRACE}] = await Promise.all([
    import('./src/core.mjs'), import('./src/assets.mjs'), import('./src/render.mjs'), import('./src/session.mjs'),
    import('./src/wild-lands.mjs'), import('./src/wild-lands-world.mjs'), import('./src/wild-landmark-buildings.mjs'),
    import('./src/items.mjs'), import('./src/navigation.mjs'), import('./src/overlook-maze.mjs'),
    import('./src/overlook-maze-art.mjs'), import('./src/overlook-maze-trace.mjs'),
  ]);
  const assets = new Assets();
  await assets.load();
  const checks = [], images = {};
  const assert = (okay, message) => {
    if (!okay) throw Error(message);
    checks.push(message);
  };
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:1280px;height:900px;position:fixed;inset:0';
  document.body.append(canvas);
  const renderer = new Renderer(canvas, assets);
  const capture = (name, game, target, zoom) => {
    renderer.camera = {x: target.x, y: target.y, zoom};
    renderer.cameraOverride = game.trainTest ? {...renderer.camera} : null;
    renderer.draw(game, 0);
    images[name] = canvas.toDataURL();
  };
  const captureNormal = (name, game) => {
    const {w, h} = renderer.resize();
    renderer.camera = expeditionCameraTarget(game, w, h);
    renderer.cameraOverride = null;
    renderer.trainScene = null;
    renderer.draw(game, 0);
    images[name] = canvas.toDataURL();
  };
  const captureLayout = (game, maze) => {
    const preview = document.createElement('canvas');
    preview.width = maze.w + 128;
    preview.height = maze.h + 174;
    const pen = preview.getContext('2d');
    pen.imageSmoothingEnabled = false;
    pen.fillStyle = '#41593b';
    pen.fillRect(0, 0, preview.width, preview.height);
    pen.translate(64 - maze.x, 72 - maze.y);
    const showAll = () => true;
    drawOverlookGarden(pen, maze, showAll);
    for (const subject of overlookSubjects(maze, showAll, {...game, players: []}).sort((a, b) => a.depth - b.depth)) {
      drawOverlookSubject(pen, subject);
    }
    images['overlook-layout-preview'] = preview.toDataURL();
  };
  const center = r => ({x: r.x + r.w / 2, y: r.y + r.h / 2});
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const blocked = (g, p, x, y, margin = 0) =>
    g.blocked(x, y, actorRadius(p) + margin, false, false, false, collisionOffset(g, p), 0, false, p);
  const input = (g, keys = {}) => g.update(.025, {keyboard: keys});
  const pulse = (g, keys) => { input(g); input(g, keys); input(g); };
  const place = (p, q) => Object.assign(p, {x: q.x, y: q.y, faceX: 0, faceY: -1});
  const checkpoint = g => JSON.parse(JSON.stringify(saveSession(g)));
  const prepare = g => {
    g.spriteLibrary = assets.library;
    g.onSound = () => {};
    g.persist = () => {};
    g.enemies = [];
    g.bloom = 3;
    g.openingBoard = false;
    g.sky = {...g.sky, elapsed: 125};
    if (g.trainTest) {
      g.trainTest.streamDisabled = true;
      delete g.trainTest.preparing;
      input(g);
    }
  };

  // Search native collision, then walk it through the normal movement entry point.
  function route(start, goal, bounds, reach, solid, unit) {
    const queue = [start], visited = new Map([[`${start.x}:${start.y}`, null]]);
    const stepOkay = (a, b) => !solid(b.x, b.y) && !solid((a.x + b.x) / 2, (a.y + b.y) / 2);
    for (let i = 0; i < queue.length; i++) {
      const at = queue[i];
      if (distance(at, goal) <= reach) {
        const points = [];
        for (let node = at; node; node = visited.get(`${node.x}:${node.y}`)) points.push(node);
        return points.reverse();
      }
      for (const [dx, dy] of [[unit, 0], [-unit, 0], [0, unit], [0, -unit]]) {
        const next = {x: at.x + dx, y: at.y + dy};
        const key = `${next.x}:${next.y}`;
        if (visited.has(key) || next.x < bounds.left || next.x > bounds.right ||
          next.y < bounds.top || next.y > bounds.bottom || !stepOkay(at, next)) continue;
        visited.set(key, at);
        queue.push(next);
      }
    }
    return null;
  }

  function walk(g, p, points) {
    for (const at of points) {
      for (let attempt = 0; attempt < 4 && distance(p, at) > .1; attempt++) {
        g.moveActor(p, at.x - p.x, at.y - p.y);
      }
      if (distance(p, at) > 1) throw Error(`Movement stopped at (${p.x}, ${p.y}) en route to (${at.x}, ${at.y})`);
    }
  }

  const itemCount = (g, p) => [...g.loot, ...p.inventory].reduce((sum, entry) =>
    sum + (entry?.type === 'cursed_axe' ? entry.qty : 0), 0) + Number(p.equipment?.hand1 === 'cursed_axe');

  function findBreakTarget(g, p, maze) {
    const parts = [...maze.parts].sort((a, b) => distance(center(a), maze.entrance) - distance(center(b), maze.entrance));
    for (const part of parts) {
      const point = center(part);
      if (!blocked(g, p, point.x, point.y)) continue;
      for (const axis of [{x: 0, y: -1}, {x: 1, y: 0}]) {
        const gap = (axis.x ? part.w : part.h) / 2 + 18;
        const start = {x: point.x - axis.x * gap, y: point.y - axis.y * gap};
        const end = {x: point.x + axis.x * gap, y: point.y + axis.y * gap};
        if (!blocked(g, p, start.x, start.y) && !blocked(g, p, end.x, end.y)) return {point, start, end, axis};
      }
    }
    throw Error('No intact hedge section has walkable ground on both sides');
  }

  function verifyTrace(maze, label) {
    const x0 = 43, y0 = 100, width = 366, height = 554;
    const reference = new Uint8Array(width * height), collision = new Uint8Array(reference.length);
    const scale = 3.2, sourceX = x => 47 + (x - maze.x) / scale, sourceY = y => 104 + (y - maze.y) / scale;
    function stamp(mask, left, top, right, bottom) {
      const startX = Math.max(0, Math.ceil(left - x0 - .5));
      const endX = Math.min(width, Math.ceil(right - x0 - .5));
      const startY = Math.max(0, Math.ceil(top - y0 - .5));
      const endY = Math.min(height, Math.ceil(bottom - y0 - .5));
      for (let y = startY; y < endY; y++) mask.fill(1, y * width + startX, y * width + endX);
    }
    // Center each authored eight-pixel stroke on its original poster line.
    for (const [x1, y1, x2, y2] of OVERLOOK_TRACE) {
      if (y1 === y2) stamp(reference, x1, y1 - 4, x2, y1 + 4);
      else stamp(reference, x1 - 4, y1, x1 + 4, y2);
    }
    const start=Math.ceil(sourceX(maze.southOpening.left)-x0-.5),end=Math.ceil(sourceX(maze.southOpening.right)-x0-.5);
    for(let y=640-y0;y<648-y0;y++)reference.fill(0,y*width+start,y*width+end);
    for (const part of maze.parts) {
      if(part.entranceGap)continue;
      const left = sourceX(part.x), top = sourceY(part.y);
      const right = sourceX(part.x + part.w), bottom = sourceY(part.y + part.h);
      if (left < x0 || top < y0 || right > x0 + width || bottom > y0 + height) {
        throw Error(`${label} hedge goes outside the traced footprint`);
      }
      stamp(collision, left, top, right, bottom);
    }
    const mismatch = reference.findIndex((value, i) => value !== collision[i]);
    assert(mismatch < 0, mismatch < 0 ? `${label} collision reproduces every poster stroke and gap` :
      `${label} collision differs from the trace at (${x0 + mismatch % width}, ${y0 + Math.floor(mismatch / width)})`);
  }

  function verifyTrim(g, p, maze, label) {
    const ends = maze.parts.filter(part => part.entryEnd);
    const left = ends.find(part => part.entryEnd === 'left'), right = ends.find(part => part.entryEnd === 'right');
    const opening = maze.opening;
    assert(ends.length === 2 && left && right && left.x + left.w === opening.left && right.x === opening.right &&
      ends.every(part => opening.y >= part.y && opening.y < part.y + part.h),
      `${label} exactly two trimmed hedge ends abut the real north opening`);
    const trims = overlookSubjects(maze, () => true, g).filter(subject => subject.hedge?.entryEnd);
    assert(trims.length === 4 && trims.some(subject => subject.hedge.id === left.id) &&
      trims.some(subject => subject.hedge.id === right.id), `${label} native painter receives both trimmed ends`);
    const art = document.createElement('canvas'), top = Math.floor(opening.y) - 100;
    art.width = right.x + right.w - left.x;
    art.height = 160;
    const pen = art.getContext('2d', {willReadFrequently: true});
    pen.translate(-left.x, -top);
    for (const trim of trims) drawOverlookSubject(pen, trim);
    const pixels = pen.getImageData(0, 0, art.width, art.height).data;
    let leftPaint = 0, rightPaint = 0, gapPaint = 0;
    for (let y = 0; y < art.height; y++) for (let x = 0; x < art.width; x++) {
      if (!pixels[(y * art.width + x) * 4 + 3]) continue;
      if (x + left.x < opening.left) leftPaint++;
      else if (x + left.x >= opening.right) rightPaint++;
      else gapPaint++;
    }
    assert(leftPaint > 0 && rightPaint > 0 && gapPaint === 0, `${label} the carved silhouettes leave the visible gap open`);
    const clearance = actorRadius(p) + 2;
    const lanes = [opening.left + clearance, (opening.left + opening.right) / 2, opening.right - clearance];
    for (let y = opening.y - 12; y <= opening.y + 12; y++) {
      if (lanes.some(x => blocked(g, p, x, y))) throw Error(`${label} entrance trim obstructs player movement at y=${y}`);
    }
    assert(true, `${label} original threshold is open across the native player footprint`);
  }

  function exercise(g, building, label) {
    const p = g.players[0], maze = overlookMazeFor(g);
    assert(maze && maze.parts.length > 70, `${label} has the tall hedge maze behind the house`);
    verifyTrace(maze, label);
    const gate = building.doors.find(door => door.kind === 'gate' && Math.abs(center(door).x - maze.gate.x) < 1);
    assert(gate && gate.y > maze.entrance.y, `${label} retains its rear gate in front of the maze`);
    const gatePoint = center(gate);
    place(p, {x: gatePoint.x, y: gatePoint.y + 38});
    assert(!gate.open && blocked(g, p, gatePoint.x, gatePoint.y), `${label} rear gate starts closed and solid`);
    pulse(g, {interact: true});
    assert(gate.open && !blocked(g, p, gatePoint.x, gatePoint.y), `${label} normal interaction opens the rear gate`);

    walk(g, p, [{x: gatePoint.x, y: gate.y - 16}]);
    const worldRight = (g.trainTest?.design.width ?? 1600) - 24;
    const approach = route({x: p.x, y: p.y}, maze.entrance, {
      left: Math.max(24, maze.x - 80),
      right: Math.min(worldRight, maze.x + maze.w + 80),
      top: maze.entrance.y - 24,
      bottom: gate.y + 16,
    }, 12, (x, y) => blocked(g, p, x, y, 2), 8);
    assert(approach, `${label} has a clear garden approach from gate to maze`);
    walk(g, p, approach);
    if (!g.trainTest) assert(p.y < 0, 'Villa explorer walks north beyond the original map edge');
    capture(`${label}-approach`, g, {x: p.x, y: p.y - 65}, 1.12);
    captureNormal(`${label}-approach-native`, g);
    capture(`${label}-overview`, g, center(maze), Math.min(550 / maze.w, 400 / maze.h));
    if (!g.trainTest) captureLayout(g, maze);
    verifyTrim(g, p, maze, label);
    const threshold = {x: maze.entrance.x, y: maze.opening.y + 16};
    walk(g, p, [{x: threshold.x, y: p.y}, threshold]);
    Object.assign(p, {faceX: 0, faceY: 1});
    capture(`${label}-trimmed-entrance`, g, {x: threshold.x, y: maze.opening.y - 12}, 1.75);

    const bounds = {left: maze.x, top: Math.min(maze.y, maze.entrance.y - 24), right: maze.x + maze.w,
      bottom: Math.max(maze.y + maze.h, maze.entrance.y + 24)};
    const hedge = (x, y) => overlookBlocked(g, x, y, actorRadius(p), 0, false);
    const south={x:maze.southEntrance.x,y:maze.southOpening.y+23};
    const southRoute=route(south,maze.chest,{...bounds,bottom:south.y+4},44,hedge,4);
    assert(southRoute,`${label} south entrance connects to the chest`);
    place(p,south);walk(g,p,southRoute);
    capture(`${label}-south-entrance`,g,south,1.45);
    place(p,threshold);
    const corridor = route({x: p.x, y: p.y}, maze.chest, bounds, 44, hedge, 4);
    assert(corridor && corridor.length * 4 > distance(p, maze.chest) * 1.14,
      `${label} has a winding, connected route from entrance to chest with hedges intact`);
    walk(g, p, corridor);
    const atChest = {x: p.x, y: p.y};
    assert(distance(p, maze.chest) <= 44, `${label} real movement reaches the center court`);
    capture(`${label}-chest-closed`, g, maze.chest, 1.3);

    const backpack = p.inventory;
    p.inventory = Array.from({length: BACKPACK_SLOTS}, () => ({type: 'stone', qty: 999}));
    pulse(g, {interact: true});
    assert(itemCount(g, p) === 0 && !maze.state.opened, `${label} a full backpack leaves the center chest closed`);
    p.inventory = backpack;
    g.dropLoot(p.x+5,p.y,'stone',1,null,true);
    assert(g.nearbyLoot(p),`${label} overlapping loose loot is within pickup range`);
    pulse(g, {interact: true});
    assert(itemCount(g, p) === 1 && maze.state.opened && p.inventory.some(entry => entry?.type === 'cursed_axe'),
      `${label} center chest grants one cursed axe after a successful interaction`);
    pulse(g, {interact: true});
    assert(itemCount(g, p) === 1, `${label} repeated interaction cannot grant a second axe`);
    assert(equip(p, p.inventory.findIndex(entry => entry?.type === 'cursed_axe')), `${label} axe equips from the native inventory`);
    Object.assign(p, {faceX: 0, faceY: 1});
    capture(`${label}-chest-open`, g, maze.chest, 1.3);
    captureNormal(`${label}-court-native`, g);

    const {point, start, end, axis} = findBreakTarget(g, p, maze);
    place(p, start);
    assert(g.projectileBlocked(point.x, point.y, 2), `${label} intact hedge stops projectiles`);
    g.moveActor(p, end.x - start.x, end.y - start.y);
    assert(distance(p, end) > 10, `${label} intact hedge stops attempted walking`);
    place(p, start);
    capture(`${label}-hedge-intact`, g, point, 1.8);

    const swing = {aimX: axis.x, aimY: axis.y};
    for (let hit = 0; hit < 18 && blocked(g, p, point.x, point.y); hit++) {
      Object.assign(p, {x: start.x, y: start.y, faceX: axis.x, faceY: axis.y});
      input(g, {...swing, attack: true});
      input(g, swing);
      for (let frame = 0; frame < 22; frame++) input(g, swing);
    }
    assert(!blocked(g, p, point.x, point.y) && !g.projectileBlocked(point.x, point.y, 2),
      `${label} ordinary player attacks make a collision and projectile gap`);
    place(p, start);
    walk(g, p, [point, end]);
    assert(distance(p, end) < 1, `${label} explorer walks through the broken hedge`);

    // Save before another draw to ensure persistence does not depend on paint side effects.
    const restored = restoreSession(checkpoint(g));
    prepare(restored);
    assert(!g.trainTest || restored.trainTest?.persistent, `${label} checkpoint restores the same expedition mode`);
    const revived = restored.players[0];
    assert(!blocked(restored, revived, point.x, point.y) && !restored.projectileBlocked(point.x, point.y, 2),
      `${label} broken hedge remains open after a serialized checkpoint restore`);
    capture(`${label}-hedge-broken`, restored, point, 1.8);
    place(revived, atChest);
    pulse(restored, {interact: true});
    assert(overlookMazeFor(restored)?.state.opened && itemCount(restored, revived) === 1 && revived.equipment.hand1 === 'cursed_axe',
      `${label} equipped axe and single chest claim survive restoring the expedition`);
  }

  try {
    const houseGame = new Game(() => .42, {deferWorld: true});
    houseGame.houseWorldsEnabled = true;
    houseGame.addPlayer('keyboard', 'Overlook explorer');
    houseGame.start();
    prepare(houseGame);
    assert(houseGame.generatedEnvironment === 'house' && houseGame.house, 'Campaign starts in the Garden Villa');
    assert(houseGame.house.floors.some(floor => floor.x < 800 && floor.x + floor.w > 800 &&
      floor.y < 800 && floor.y + floor.h > 800), 'Villa retains its original board room');
    exercise(houseGame, houseGame.house, 'villa');

    const wildGame = new Game(() => .42, {deferWorld: true});
    wildGame.addPlayer('keyboard', 'Wilds explorer');
    assert(enterWildLands(wildGame, {persistent: true}).ok, 'Start a public Wild Lands expedition');
    prepare(wildGame);
    assert(wildLandsTravel(wildGame, 'hearth').ok, 'Public Wilds travel reaches the Old Homestead');
    for (let frame = 0; frame < 24; frame++) input(wildGame);
    const homestead = wildLandmarkBuildings(wildGame.trainTest.design).find(landmark => landmark.id === 'homestead');
    assert(homestead, 'Old Homestead still exists on the Wild Lands map');
    exercise(wildGame, homestead, 'wilds');
  } catch (error) {
    return {checks, images, failure: error.stack};
  }
  return {checks, images};
}
