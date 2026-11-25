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
    cwd: root, env, stdio: 'inherit', timeout: 145000, windowsHide: true,
  });
  if (child.error) console.error(child.error);
  process.exit(child.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
const output = path.join(root, 'test-output', 'greyhaven-cast', base === root ? 'source' : 'packaged');
fs.mkdirSync(output, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-greyhaven-cast-')));
app.commandLine.appendSwitch('mute-audio');

app.whenReady().then(async () => {
  const window = new BrowserWindow({show: false, width: 1152, height: 760,
    webPreferences: {backgroundThrottling: false}});
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  try {
    await window.loadFile(path.join(base, 'index.html'), {query: {tools: '1'}});
    const {images, ...results} = await window.webContents.executeJavaScript(`(${review})()`);
    for (const [name, data] of Object.entries(images)) {
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    }
    const report = {base, ...results, errors, muted: window.webContents.isAudioMuted()};
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    app.exit(report.failure || errors.length || !report.muted ? 1 : 0);
  } catch (error) {
    console.error(error.stack);
    app.exit(1);
  }
});

async function review() {
  await wildboundBoot.ready;
  const load = name => import('./src/' + name + '.mjs');
  const [{Game}, {Renderer}, {enterWildLands}, {GREYHAVEN_CAST}, {toCastleWorld},
    {trainPrompt, trainWorldBlocked}, {npcDialogueView}, {switchWildLandsLayer}, {npcDialoguePanel, drawNpcDialoguePortraits},
    {controllerButtonNames}] = await Promise.all([
    'core', 'render', 'wild-lands', 'greyhaven-cast', 'wild-castle', 'train-test', 'npc-quests',
    'wild-lands-world', 'npc-dialogue-ui', 'controls',
  ].map(load));
  const frame = requestAnimationFrame.bind(window);
  window.requestAnimationFrame = () => 0;
  await new Promise(resolve => frame(resolve));
  const tools = wildboundPolishTest;
  const g = new Game(() => .5, {deferWorld: true});
  g.addPlayer('keyboard', 'Castle explorer');
  tools.game = g;
  g.spriteLibrary = tools.assets.library;
  g.onSound = g.persist = () => {};
  if (!enterWildLands(g, {persistent: true, homeStart: true}).ok) throw Error('Could not enter the Wilds');
  tools.show('play');
  const t = g.trainTest;
  t.terrainStream?.worker.terminate();
  delete t.terrainStream;
  t.preparing = false;
  t.streamDisabled = true;
  t.noticeUntil = 0;
  const p = g.players[0];
  const canvas = document.getElementById('game-canvas');
  const renderer = new Renderer(canvas, tools.assets);
  tools.renderer = renderer;
  const checks = [], images = {};
  const assert = (value, name) => {
    if (!value) throw Error(name);
    checks.push(name);
  };
  const save = (name, surface) => { images[name] = surface.toDataURL(); };
  const input = keys => g.update(.04, {keyboard: keys});
  const face = [[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]];
  const sheet = document.createElement('canvas');
  sheet.width = 1260;
  sheet.height = 900;
  const pen = sheet.getContext('2d');
  pen.imageSmoothingEnabled = false;
  const order = [
    'greyhaven-mim', 'greyhaven-ector', 'greyhaven-kay', 'greyhaven-robin', 'greyhaven-little-john', 'greyhaven-marian',
  ];
  const actors = [...GREYHAVEN_CAST].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  pen.fillStyle = '#241e27';
  pen.fillRect(0, 0, sheet.width, sheet.height);
  pen.font = '600 30px system-ui';
  pen.fillStyle = '#f0d6ad';
  pen.fillText('Greyhaven cast', 34, 43);
  for (const [d, direction] of ['S','SW','W','NW','N','NE','E','SE'].entries()) {
    pen.font = '500 19px system-ui';
    pen.fillStyle = '#cbb5a5';
    pen.textAlign = 'center';
    pen.fillText(direction, 220 + d * 135, 82);
  }
  for (const [row, actor] of actors.entries()) {
    const name = actor.id.slice('greyhaven-'.length);
    const floor = 201 + row * 133;
    pen.fillStyle = row % 2 ? '#332935' : '#3d313b';
    pen.fillRect(15, floor - 108, 1230, 126);
    pen.fillStyle = '#f1d5b3';
    pen.font = '600 17px system-ui';
    pen.textAlign = 'left';
    pen.fillText(actor.name, 28, floor - 28);
    for (const [d, [faceX, faceY]] of face.entries()) {
      const pose = {...actor, x: 220 + 135 * d, y: floor, faceX, faceY, animationAction: 'idle', playerFrame: 1};
      renderer.animator.draw(pen, pose, 1, 107 * actor.greyhavenScale);
    }
    const motion = document.createElement('canvas');
    motion.width = 700; motion.height = 440;
    const c = motion.getContext('2d');
    c.fillStyle = '#3d313b'; c.fillRect(0, 0, motion.width, motion.height);
    c.imageSmoothingEnabled = false;
    const clips = ['idle', 'walk', 'run', actor.greyhavenCostume === 'robin' ? 'draw' : 'interact', 'hurt'];
    for (const [r, clip] of clips.entries()) for (const [d, [faceX, faceY]] of face.entries()) {
      renderer.animator.draw(c, {...actor, x: 47+d*86, y: 80+r*86, faceX, faceY, animationAction: clip, playerFrame: 2}, 1, 65 * actor.greyhavenScale);
    }
    save(`${name}-motion`, motion);
  }
  save('native-sprites', sheet);

  try {
    assert(actors.length === 6 && actors.every(actor => actor.greyhavenCostume), 'Six costumed Greyhaven actors load');
    for (const npc of actors) {
      const room = npc.story ? 'castle-greyhaven-' + npc.story : null;
      if (t.design.activeRoom !== room) switchWildLandsLayer(g, room);
      const point = npc.story ? toCastleWorld(npc) : npc;
      const spots = [[0,26],[26,0],[-26,0],[0,-26],[18,18],[-18,18],[0,0]];
      const target = `TALK TO ${npc.name.toUpperCase()}`;
      const spot = spots.map(([dx, dy]) => ({x: point.x+dx, y: point.y+dy}))
        .find(q => {
          Object.assign(p, q, {room:null, ui:null, swimming:false, underBridge:false, trainDeck:false, jumpHeight:0});
          return !trainWorldBlocked(g, p.x, p.y, 7, false, false, 0, false, p) && trainPrompt(g, p).includes(target);
        });
      assert(spot, `${npc.name} has a dry, collision-free approach and an interaction prompt`);
      for (const family of ['xbox', 'playstation']) {
        Object.assign(p, {device: 'pad:0', controllerFamily: family});
        assert(trainPrompt(g, p) === `${controllerButtonNames(family)[3]} · ${target}`, `${npc.name} shows the ${family} interaction label`);
      }
      Object.assign(p, {device: 'keyboard', controllerFamily: undefined});
      input({});
      input({interact:true});
      assert(p.ui?.greyhavenCast === npc.id, `${npc.name} opens dialogue through the normal keyboard action`);
      const view = npcDialogueView(g, p);
      assert(view.npc?.id === npc.id && view.text && view.choices.length, `${npc.name} has dialogue and choices`);
      const panel = document.createElement('section');
      npcDialoguePanel(panel, g, p, (label, action, onClick) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.dataset.action = action;
        button.onclick = onClick;
        return button;
      });
      assert(panel.querySelector('h2')?.textContent === npc.name, `${npc.name} renders the normal dialogue panel`);
      drawNpcDialoguePortraits(panel, g, p, renderer.animator);
      const portrait = panel.querySelector('.npc-dialogue-portrait');
      assert(portrait.getContext('2d').getImageData(0, 0, portrait.width, portrait.height).data.some((value, i) => i % 4 === 3 && value > 20), `${npc.name} has a live rig portrait`);
      save(npc.greyhavenCostume + '-portrait', portrait);
      p.ui = null;
      renderer.camera.x = p.x;
      renderer.camera.y = p.y;
      renderer.camera.zoom = 1.35;
      renderer.draw(g, .05);
      save(npc.greyhavenCostume + '-scene', canvas);
    }
  } catch (error) {
    return {checks, images, failure: error.stack};
  }
  return {checks, images};
}
