const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const executable = require('electron');
  const child = require('node:child_process').spawnSync(
    executable, [__filename, '--mute-audio'], {cwd: root, env, stdio: 'inherit', timeout: 120000},
  );
  process.exit(child.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-split-player-ui-')));
app.commandLine.appendSwitch('mute-audio');

async function verifySplitPlayerUI(diagonal, capture) {
  await wildboundBoot.ready;
  if (wildboundBoot.error) throw Error(wildboundBoot.error);
  const nativeFrame = window.splitTestNativeFrame ??= window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = () => 0;
  // The fixtures supply controller families. A physical pad connected while
  // this runs must not substitute a different family's prompts.
  Object.defineProperty(navigator, 'getGamepads', {configurable: true, value: () => []});

  const api = window.wildboundPolishTest;
  const {Game} = await import('./src/core.mjs');
  const {Renderer} = await import('./src/render.mjs');
  const {generateWorld} = await import('./src/world.mjs');
  const {CAMERA_DEFAULTS, saveCameraSettings} = await import('./src/multiplayer-camera.mjs');
  saveCameraSettings({...CAMERA_DEFAULTS, enabled: true, dynamicSplit: true, reducedMotion: true});

  const game = new Game(() => .5);
  const first = game.addPlayer('keyboard', 'Alder');
  const second = game.addPlayer('pad:1', 'Birch');
  second.controllerFamily = 'playstation';
  game.start();
  Object.assign(game, generateWorld(42, 'house'), {
    seed: 42, generatedEnvironment: 'house', environment: 'house',
    phase: 'play', openingBoard: false, enemies: [], event: null, weather: null,
    spriteLibrary: api.assets.library,
  });
  Object.assign(first, {x: 250, y: 250});
  const secondStart = {x: 1350, y: diagonal ? 1050 : 250};
  Object.assign(second, secondStart);
  api.game = game;
  game.persist = () => {};
  game.onSound = () => {};
  api.show('play');
  const canvas = document.getElementById('game-canvas');
  const overlay = document.getElementById('hero-overlays');
  const renderer = new Renderer(canvas, api.assets);
  renderer.setDynamicShadows(false);
  api.renderer = renderer;

  const checks = [];
  function check(condition, label, details) {
    if (!condition) throw Error(details ? label + ' ' + JSON.stringify(details()) : label);
    checks.push(label);
  }
  function frame(dt = 0) {
    renderer.draw(game, dt);
    api.heroUI.draw(game, renderer);
  }
  function screenPoint(x, y) {
    const rect = canvas.getBoundingClientRect();
    return [rect.x + x / renderer.viewport.w * rect.width, rect.y + y / renderer.viewport.h * rect.height];
  }
  function paneSamples(player) {
    const view = renderer.splitViews.find(cell => cell.players.includes(player));
    const {x, y} = view.centroid;
    return [screenPoint(x, y), ...view.poly.map(p => screenPoint(x + (p.x - x) * .88, y + (p.y - y) * .88))];
  }
  function menuCoversPane(player) {
    return paneSamples(player).every(point => overlay.contains(document.elementFromPoint(...point)));
  }
  function paneStaysClear(player) {
    return paneSamples(player).every(point => !overlay.contains(document.elementFromPoint(...point)));
  }
  function describePaneHits(player) {
    return paneSamples(player).map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return {x, y, id: hit?.id, className: hit?.getAttribute('class')};
    });
  }
  function cameraLayout() {
    return JSON.stringify(renderer.splitViews.map(({key, poly, camera}) => ({key, poly, camera})));
  }
  function closeMenu(player) {
    const panel = api.heroUI.panels.get(player.id);
    const close = panel.querySelector('[data-action="close"]');
    const {x, y, width, height} = close.getBoundingClientRect();
    check(close.contains(document.elementFromPoint(x + width / 2, y + height / 2)),
      player.name + ' can reach the menu close button');
    close.click();
    frame();
    check(!player.ui && !api.heroUI.panels.has(player.id), player.name + ' closes their own menu');
  }

  for (let i = 0; i < 24; i++) frame(1 / 60);
  frame();
  check(renderer.splitViews?.length === 2, 'Two separated players get two camera panes');
  check(diagonal === renderer.splitSeams.some(({a, b}) => Math.abs(a.x - b.x) > 1 && Math.abs(a.y - b.y) > 1),
    'Renderer uses the expected split divider');
  const initialLayout = cameraLayout();
  game.openInventory(first);
  frame();
  frame();
  check(cameraLayout() === initialLayout, 'Opening the first menu preserves camera bounds and zoom');
  check(menuCoversPane(first) && paneStaysClear(second),
    'First menu covers only its own pane', () => [describePaneHits(first), describePaneHits(second)]);

  game.openInventory(second);
  frame();
  frame();
  check(cameraLayout() === initialLayout, 'Opening both menus preserves camera bounds and zoom');
  check(menuCoversPane(first) && menuCoversPane(second), 'Both menus cover their own panes');
  check(api.heroUI.panels.get(first.id).dataset.ownerDevice === first.device &&
    api.heroUI.panels.get(second.id).dataset.ownerDevice === second.device, 'Menus keep their input owners');
  const keyboardHelp = api.heroUI.panels.get(first.id).querySelector('.inventory-help').textContent;
  const controllerHelp = api.heroUI.panels.get(second.id).querySelector('.inventory-help').textContent;
  if (!keyboardHelp.includes('Esc') || !controllerHelp.includes('Circle'))
    throw Error(`Unexpected keyboard or controller help: ${keyboardHelp} | ${controllerHelp}`);
  check(true, 'Menus display their owner’s control labels');
  game.inventoryAction(second, 'next');
  frame();
  check(second.ui.index === 1 && first.ui.index === 0, 'Changing selection affects only the second menu');
  closeMenu(first);
  check(paneStaysClear(first) && menuCoversPane(second), 'Second menu covers only its own pane');
  check(cameraLayout() === initialLayout, 'Closing the first menu preserves both cameras');

  if (!diagonal) {
    Object.assign(second, {x: first.x + 20, y: first.y});
    for (let i = 0; i < 24; i++) frame(.1);
    const panel = api.heroUI.panels.get(second.id);
    check(!renderer.splitViews && panel?.getBoundingClientRect().width < canvas.getBoundingClientRect().width,
      'Players can regroup while the inventory returns to the shared-screen dock');
    check(renderer.uiPlayArea.width < 1, 'Shared-screen inventory reserves its normal dock space');
  }
  closeMenu(second);
  if (diagonal) {
    check(paneStaysClear(first) && paneStaysClear(second), 'Closing both menus restores both visible panes');
    check(cameraLayout() === initialLayout, 'Closing both menus preserves camera bounds and zoom');
    game.openInventory(first, 'starter');
    frame();
    check(api.heroUI.panels.get(first.id).classList.contains('chest-redesign'), 'The starter chest opens its real loot menu');
    check(menuCoversPane(first) && paneStaysClear(second), 'The chest stays inside its player’s pane');
    check(cameraLayout() === initialLayout, 'Opening the chest preserves both camera panes');
    closeMenu(first);
  } else {
    const companion = game.addPlayer('pad:2', 'Cedar');
    Object.assign(companion, {x: first.x + 20, y: first.y});
    Object.assign(second, {x: 1350, y: first.y});
    frame(1 / 60);
    check(renderer.splitViews?.length === 2 &&
      renderer.splitViews.some(view => view.players.includes(first) && view.players.includes(companion)),
      'Two nearby players can share a pane while another player is split off');
    game.openInventory(first);
    game.openInventory(companion);
    frame();
    check(menuCoversPane(first) && paneStaysClear(second), 'Menus in a shared pane leave the remote pane clear');
    closeMenu(first);
    check(menuCoversPane(companion) && paneStaysClear(second), 'Closing one menu in the shared pane leaves the other open');
    closeMenu(companion);
  }
  if (capture) {
    game.players = [first, second];
    Object.assign(second, secondStart);
    game.openInventory(first);
    for (let i = 0; i < 16; i++) frame(1 / 60);
    await new Promise(resolve => nativeFrame(() => setTimeout(resolve, 400)));
  }
  return checks;
}

app.whenReady().then(async () => {
  const errors = [];
  const checks = [];
  const capture = process.env.WILDBOUND_VERIFY_CAPTURE === '1';
  const output = path.join(root, 'test-output', 'split-player-ui');
  fs.mkdirSync(output, {recursive: true});
  let failure, audioMuted = true;
  try {
    const base = process.env.WILDBOUND_VERIFY_APP || root;
    for (const [width, height] of [[1280, 800], [640, 640]]) {
      const win = new BrowserWindow({
        show: false, width, height, useContentSize: true,
        webPreferences: {backgroundThrottling: false},
      });
      win.webContents.setAudioMuted(true);
      win.webContents.on('console-message', event => {
        if (event.level === 'error') errors.push(event.message);
      });
      win.webContents.on('render-process-gone', (_event, details) => errors.push(details.reason));
      await win.loadFile(path.join(base, 'index.html'), {query: {tools: '1'}});
      await win.webContents.executeJavaScript(`(async () => {
        await wildboundBoot.ready;
        window.dispatchEvent(new KeyboardEvent('keydown', {key: ' ', code: 'Space', bubbles: true}));
        window.dispatchEvent(new KeyboardEvent('keyup', {key: ' ', code: 'Space', bubbles: true}));
        await new Promise(resolve => setTimeout(resolve, 350));
      })()`);
      if (capture) win.showInactive();
      const result = await win.webContents.executeJavaScript(
        `(${verifySplitPlayerUI})(${width === 640}, ${capture}).then(checks => ({checks}), error => ({error: error.stack}))`,
      );
      if (result.error) throw Error(width + 'x' + height + ': ' + result.error);
      checks.push(...result.checks.map(label => width + 'x' + height + ' ' + label));
      audioMuted &&= win.webContents.isAudioMuted();
      if (capture) {
        const image = await win.webContents.capturePage(undefined, {stayHidden: true, stayAwake: true});
        fs.writeFileSync(path.join(output, width + 'x' + height + '.png'), image.toPNG());
        win.hide();
      }
    }
  } catch (error) {
    failure = error.stack;
  }
  const report = {checks, errors, failure, audioMuted};
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  app.exit(failure || errors.length || !report.audioMuted ? 1 : 0);
});
