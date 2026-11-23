const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const result = require('node:child_process').spawnSync(
    path.join(root, 'node_modules/electron/dist/electron.exe'), [__filename, '--mute-audio'],
    {cwd: root, env, encoding: 'utf8', timeout: 180000}
  );
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  process.exit(result.status ?? 1);
}
const {app, BrowserWindow} = require('electron');
const out = path.join(root, 'test-output/station-art', process.env.WILDBOUND_STATION_REPORT ||
  (process.env.WILDBOUND_VERIFY_APP ? 'packaged' : 'source'));
fs.mkdirSync(out, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(out, 'profile-')));
app.commandLine.appendSwitch('mute-audio');
const deadline = setTimeout(() => app.exit(1), 170000);
app.whenReady().then(async () => {
  const window = new BrowserWindow({show: false, width: 1320, height: 900, webPreferences: {backgroundThrottling: false}});
  const errors = [];
  window.webContents.setAudioMuted(true);
  window.webContents.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
  try {
    await window.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP || root, 'index.html'));
    await window.webContents.executeJavaScript('wildboundBoot.ready');
    const result = await window.webContents.executeJavaScript(`(async () => {
      window.requestAnimationFrame = () => 0;
      window.Worker = undefined;
      const {Game} = await import('./src/core.mjs');
      const {Assets} = await import('./src/assets.mjs');
      const {Renderer} = await import('./src/render.mjs');
      const {enterWildLands} = await import('./src/wild-lands.mjs');
      const {defaultTrainDesign} = await import('./src/train-design.mjs');
      const {stationEntrance, stationAssetHouse} = await import('./src/station-building.mjs');
      const {defaultRailwayStation, railwayStations, stationHouse, drawStationGround,
        stationSubjects, drawStationSubject, stationBlocked, stationDeckAt, stationPlatformSamples,
        drawStationLights} = await import('./src/railway-station.mjs');
      const {drawTrainTest} = await import('./src/train-world-art.mjs');
      const {PLAYER_RENDER_SIZE} = await import('./src/render-settings.mjs');

      const checks = [];
      const ok = (value, label) => {
        if (!value) throw Error(label);
        checks.push(label);
      };
      const assets = new Assets();
      await assets.load();
      const game = new Game(() => .5);
      const player = game.addPlayer('keyboard', 'Station scout');
      game.persist = () => {};
      game.onSound = () => {};
      game.start();
      game.openingBoard = false;
      game.spriteLibrary = assets.library;
      ok(enterWildLands(game).ok, 'Enter actual Wild Lands');
      const t = game.trainTest;
      const hero = game.players[0];
      t.preparing = false;
      const d = t.design;
      const worlds = railwayStations(d);
      ok(worlds.length === 8, 'Eight Wild Lands stops');

      const main = document.createElement('canvas');
      main.style.cssText = 'width: 1320px; height: 900px';
      main.style.position = 'fixed';
      document.body.append(main);
      const renderer = new Renderer(main, assets);
      renderer.dynamicShadows = false;
      const images = {};
      const city = worlds[0].station;
      t.notice = '';
      t.noticeUntil = 0;
      const pose = (x, y) => Object.assign(hero,{x, y, faceX: 0, faceY: 1, groundHeight: 0, moving: false});
      const style = await import('./src/station-polish.mjs');
      const tileWidth = 580;
      const tileHeight = 400;

      function drawSample(ctx, world, interior, night, scale, w, h) {
        const s = world.station;
        const door = stationEntrance(s);
        const actor = interior
          ? {x: door.x - door.nx * 25, y: door.y - door.ny * 25}
          : {x: door.x + door.nx * 50, y: door.y + door.ny * (door.side==='north'?53:46)};
        ctx.save();
        ctx.fillStyle = night ? '#283b43' : '#425b43';
        ctx.fillRect(0, 0, w, h);
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-s.x, -s.y + 18);
        drawStationGround(ctx, world, 1);
        const figures = [...stationSubjects(world, 1, t.stationCats), {...actor, depth: actor.y, reviewHero: true}];
        for (const obj of figures.sort((a,b) => a.depth - b.depth)) {
          if (obj.reviewHero) {
            renderer.animator.draw(ctx, {...hero, x: actor.x, y: actor.y, faceX: 0, faceY: 1, moving: false}, 1, PLAYER_RENDER_SIZE);
          } else {
            drawStationSubject(ctx, world, obj, 1, renderer, [actor], game);
          }
        }
        if (night) {
          ctx.fillStyle = '#1a254969';
          ctx.fillRect(s.x - w/2/scale, s.y - h/2/scale - 18, w/scale, h/scale);
        }
        drawStationLights(ctx, world, 1, night);
        ctx.restore();
      }

      const artRevisions = new Set();
      for (const [i, world] of worlds.entries()) {
        const s = world.station, door = stationEntrance(s);
        const toward = (n) => ({x:door.x+door.nx*n,y:door.y+door.ny*n});
        ok(world._stationContext.angle === 0, s.name + ' keeps the upright building projection');
        ok([-23,-12,0,12,23].every(n => {const p=toward(n);return !stationBlocked(d,p.x,p.y,7);}), s.name + ' doorway has a traversable center lane');
        ok(stationBlocked(d,s.x-s.w/2+4,s.y-s.h/2+4,7), s.name + ' retains solid wall corners');
        const samples = stationPlatformSamples(world);
        const mid = samples[Math.floor(samples.length / 2)];
        ok(stationDeckAt(d,(mid.near.x+mid.far.x)/2,(mid.near.y+mid.far.y)/2) === s.floorHeight,
          s.name + ' paint uses the playable platform deck');
        const house = stationAssetHouse(world, stationHouse(world));
        ok(house.furniture.length >= 5 && house.walls.length >= 10,
          s.name + ' retains native assets for damage and collision');
        const shell = stationSubjects(world, 1, t.stationCats).find(subject => subject.stationLocal?.stationBuilding);
        const sample = document.createElement('canvas');
        sample.width = s.w + 80;
        sample.height = s.h + 120;
        const pen = sample.getContext('2d', {willReadFrequently: true});
        const shellVisible = position => {
          pen.resetTransform();
          pen.clearRect(0, 0, sample.width, sample.height);
          pen.translate(sample.width / 2 - s.x, sample.height / 2 + 35 - s.y);
          drawStationSubject(pen, world, shell, 1, renderer, [position], game);
          return pen.getImageData(0, 0, sample.width, sample.height).data.some((v, j) => j % 4 === 3 && v > 0);
        };
        ok(shellVisible(toward(64)) && !shellVisible(toward(10)),
          s.name + ' cuts the roof away before the doorway covers the player');
        if (style.stationVisualTheme) artRevisions.add(style.stationVisualTheme(s).id);
      }
      if (style.stationVisualTheme) ok(artRevisions.size === 8, 'Eight distinct station art identities');

      for (const interior of [false, true]) {
        const sheet = document.createElement('canvas');
        sheet.width = tileWidth * 2;
        sheet.height = tileHeight * 4;
        const ctx = sheet.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        for (const [i, world] of worlds.entries()) {
          const x = i % 2 * tileWidth, y = Math.floor(i / 2) * tileHeight;
          ctx.save();
          ctx.translate(x,y);
          ctx.beginPath();
          ctx.rect(0,0,tileWidth,tileHeight);
          ctx.clip();
          drawSample(ctx, world, interior, false, 1, tileWidth, tileHeight);
          ctx.fillStyle = '#273b34';
          ctx.fillRect(0,tileHeight-30,tileWidth,30);
          ctx.fillStyle = '#e6d9a7';
          ctx.font = '14px system-ui';
          ctx.fillText(world.station.name, 14,tileHeight-10);
          ctx.restore();
        }
        images[interior ? 'station-interiors' : 'station-exteriors'] = sheet.toDataURL();
      }
      const legacy = defaultTrainDesign();
      if (!legacy.station) legacy.station = defaultRailwayStation(legacy);
      const standalone = document.createElement('canvas');
      standalone.width = 760;
      standalone.height = 500;
      drawSample(standalone.getContext('2d'), legacy, false, false, 1.1, 760, 500);
      images.lakewood = standalone.toDataURL();
      ok(!stationBlocked(legacy,stationEntrance(legacy.station).x,stationEntrance(legacy.station).y,6),
        'Legacy Lakewood doorway remains open');

      const door = stationEntrance(city);
      for (const interior of [false,true]) {
        const sign = interior ? -1 : 1;
        pose(door.x + sign * door.nx * 30, door.y + sign * door.ny * 30);
        renderer.cameraOverride = {x:city.x,y:city.y+12,zoom:1.12};
        renderer.trainScene = null;
        drawTrainTest(renderer,game,.016);
        images[interior ? 'jungle-live-interior' : 'jungle-live-exterior'] = main.toDataURL();
      }
      const dark = document.createElement('canvas');
      dark.width = 760;
      dark.height = 500;
      drawSample(dark.getContext('2d'), worlds[0], false, true, 1.1, 760, 500);
      images['jungle-night-lighting'] = dark.toDataURL();
      return {images,checks};
    })()`);
    for (const [name, source] of Object.entries(result.images)) {
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(source.split(',')[1], 'base64'));
    }
    const summary = {passed:result.checks.length, checks:result.checks, muted:window.webContents.isAudioMuted(), errors};
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(summary,null,2));
    console.log(JSON.stringify(summary));
    if (errors.length) throw Error(errors.join('\n'));
    clearTimeout(deadline);
    app.exit(0);
  } catch (error) {
    console.error(error.stack, errors);
    clearTimeout(deadline);
    app.exit(1);
  }
});
