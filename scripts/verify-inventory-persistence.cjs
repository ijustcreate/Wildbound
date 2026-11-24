const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const run = require('node:child_process').spawnSync(
    path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'),
    [__filename, '--mute-audio'], {env, cwd: root, encoding: 'utf8', timeout: 120000},
  );
  process.stdout.write(run.stdout || '');
  process.stderr.write(run.stderr || '');
  if (run.error) console.error(run.error);
  process.exit(run.status ?? 1);
}

const {app, BrowserWindow, ipcMain} = require('electron');
const store = require('../save-store.cjs');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const output = path.join(root, 'test-output', 'inventory-persistence', base === root ? 'source' : 'packaged');
fs.mkdirSync(output, {recursive: true});
const profile = fs.mkdtempSync(path.join(output, 'profile-'));
app.setPath('userData', profile);
app.commandLine.appendSwitch('mute-audio');
const files = {
  profiles: path.join(profile, 'characters-v1.json'),
  classic: path.join(profile, 'session-v1.json'),
  wilds: path.join(profile, 'session-wilds-v1.json'),
};
const sessionFile = mode => files[mode === 'wilds' ? 'wilds' : 'classic'];
ipcMain.handle('profiles-load', () => store.read(files.profiles, 'profiles'));
ipcMain.handle('profiles-save', (_, value) => store.write(files.profiles, value, 'profiles'));
ipcMain.handle('session-load', (_, mode) => store.read(sessionFile(mode), 'session'));
ipcMain.handle('session-save', (_, value, mode) => store.write(sessionFile(mode), value, 'session'));
for (const channel of ['project-rigs-load', 'house-designs-load', 'location-designs-load', 'room-stop'])
  ipcMain.handle(channel, () => null);

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false, width: 1180, height: 780,
    webPreferences: {preload: path.join(base, 'preload.cjs'), backgroundThrottling: false},
  });
  window.webContents.setAudioMuted(true);
  const errors = [], checks = [];
  window.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  const run = async fn => {
    const result = await window.webContents.executeJavaScript(
      `(${fn.toString()})().catch(error=>({error:error.stack||String(error)}))`,
    );
    if (result?.error) throw Error(result.error);
    checks.push(...result);
  };
  const boot = async () => {
    await window.loadFile(path.join(base, 'index.html'), {query: {tools: '1'}});
    await window.webContents.executeJavaScript('window.wildboundBoot.ready');
  };
  try {
    await boot();
    await run(async () => {
      const test = window.wildboundPolishTest;
      window.requestAnimationFrame = () => 0;
      const {Game} = await import('./src/core.mjs');
      const {interactAlley, alleyGate, ALLEY_SHOPS} = await import('./src/diagon-alley.mjs');
      const {merchantAction} = await import('./src/traveling-merchant.mjs');
      const check = (value, label) => { if (!value) throw Error(label); checks.push(label); };
      const checks = [];
      const count = (p, type) => p.inventory.reduce((sum, item) => sum + (item?.type === type ? item.qty : 0), 0);
      const collect = (g, p, type, qty) => {
        const drop = {id: g.nextId++, x: p.x, y: p.y, type, qty};
        g.loot.push(drop);
        check(g.collect(p, drop), 'Collected ' + type + ' through gameplay');
      };
      const equip = (g, p, type) => {
        g.openInventory(p);
        g.inventoryAction(p, 'select:' + p.inventory.findIndex(item => item?.type === type));
        g.inventoryAction(p, 'equip');
        g.inventoryAction(p, 'close');
      };
      const wait = async condition => {
        const end = performance.now() + 5000;
        while (!condition()) {
          if (performance.now() > end) throw Error('Timed out waiting for inventory save transition');
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      };
      const openCampActions = () => {
        test.pause();
        const actions = document.querySelector('#camp-session-actions');
        check(document.querySelector('#settings-dialog').open && !actions.hidden,
          'Pause opens the illustrated Camp settings with Expedition actions available');
        if (!actions.open) actions.querySelector('summary').click();
        return actions;
      };
      const beginPreview = () => {
        const actions = openCampActions();
        actions.querySelector('#pause-dev').click();
        const button = document.querySelector('[data-debug="wild-lands"]');
        check(button.textContent === 'Preview The Wild Lands', 'Dev entry identifies the temporary preview');
        button.click();
        test.game.trainTest.preparing = false;
        return test.game.players[0];
      };
      const purchase = (g, p, stockIndex) => {
        const gate = alleyGate(g);
        Object.assign(p, {x: gate.x, y: gate.y + 40});
        p.equipment.hand1 = 'starter_wand';
        interactAlley(g, p);
        g.trainTest.time += 1;
        interactAlley(g, p);
        const shop = ALLEY_SHOPS[0];
        Object.assign(p, {x: shop.x + 76, y: shop.y + 12});
        check(interactAlley(g, p), 'Opened the Diagon Alley merchant');
        merchantAction(g, p, 'select:' + stockIndex);
        merchantAction(g, p, 'use');
        merchantAction(g, p, 'close');
      };

      const classic = new Game(() => .5, {deferWorld: true});
      const player = classic.addPlayer('keyboard', 'Inventory QA');
      const hero = test.profiles.create(player.name);
      test.profiles.assign(player, hero);
      classic.start();
      test.game = classic;
      test.show('play');
      player.coins = 500;
      collect(classic, player, 'sword', 1);
      equip(classic, player, 'sword');
      await test.flushProgress();
      check((await window.desktop.loadSession()).state.players[0].equipment.hand1 === 'sword',
        'Classic checkpoint contains the equipped pickup');

      const preview = beginPreview();
      check(preview !== player, 'Preview uses an isolated explorer copy');
      purchase(classic, preview, 2);
      check(count(preview, 'fire_wand') === 1 && preview.coins === 360, 'Preview purchased a durable fire wand receipt');
      collect(classic, preview, 'ice_wand', 1);
      equip(classic, preview, 'ice_wand');
      const previewActions = openCampActions();
      check(previewActions.querySelector('#progress-save-now').hidden &&
        previewActions.querySelector('#progress-save-status').textContent.includes('temporary'),
      'Pause explains preview inventory and omits the ineffective Save button');
      previewActions.querySelector('#quit-button').click();
      await wait(() => !classic.trainTest && !document.querySelector('#settings-dialog').open &&
        !document.querySelector('#pause-dialog').open);
      check(count(player, 'fire_wand') === 1 && count(player, 'ice_wand') === 0 &&
        player.equipment.hand1 === 'sword' && player.coins === 360,
      'Leaving from Pause preserves the purchased wand, its cost and the original equipped gear');

      const closePreview = beginPreview();
      purchase(classic, closePreview, 3);
      await window.wildboundFlushLocalWorld();
      const closingSave = (await window.desktop.loadSession()).state.players[0];
      check(count(closingSave, 'fire_wand') === 1 && count(closingSave, 'ice_wand') === 1 &&
        closingSave.coins === 220, 'Desktop close save settles both durable shop receipts exactly once');

      const {lobby, first: explorer, hero: explorerProfile} = window.previewCharacterSelect();
      test.profiles.assign(explorer, explorerProfile);
      lobby.keepSelectedPlayers();
      lobby.open(explorer, 'environment');
      const menu = lobby.nodes.get(explorer.id);
      check(!(await window.desktop.loadSession('wilds')), 'First Wilds launch has no checkpoint');
      menu.querySelector('.expedition-wilds').click();
      menu.querySelector('.expedition-accept').click();
      await wait(() => test.game.trainTest?.persistent);
      const wilds = test.game;
      check(test.screen === 'play' && wilds.trainTest.design.wildLands &&
        !document.querySelector('.wilds-start-dialog'),
        'The actual Adventure Board Wilds choice starts the saved Wild Lands mode');
      collect(wilds, explorer, 'potion', 2);
      explorer.hp = 10;
      wilds.usePotion(explorer);
      equip(wilds, explorer, 'fire_wand');
      wilds.trainTest.distance = 8200;
      wilds.trainTest.wildExploration = {discovered: new Set(['fern-glade']), opened: new Set(['fern-glade'])};
      await test.flushProgress();
      const wildsSave = await window.desktop.loadSession('wilds');
      check(wildsSave.wilds && wildsSave.state.players[0].equipment.hand1 === 'fire_wand',
        'Saved Wild Lands has its own full expedition checkpoint');
      check(count(wildsSave.state.players[0], 'potion') === 1, 'Used potion stays used in the checkpoint');
      return checks;
    });
    await boot();
    await run(async () => {
      const result = [];
      const check = (value, label) => { if (!value) throw Error(label); result.push(label); };
      const test = window.wildboundPolishTest;
      window.requestAnimationFrame = () => 0;
      const {lobby, first: explorer, hero} = window.previewCharacterSelect();
      test.profiles.assign(explorer, hero);
      lobby.keepSelectedPlayers();
      lobby.open(explorer, 'environment');
      const menu = lobby.nodes.get(explorer.id);
      let popupSeen = false;
      const popupSelector = '.wilds-start-dialog,[data-wilds-resume],[data-wilds-new]';
      const observer = new MutationObserver(records => {
        popupSeen ||= records.some(record => [...record.addedNodes].some(node =>
          node instanceof Element && (node.matches(popupSelector) || node.querySelector(popupSelector))));
      });
      observer.observe(document.body, {childList: true, subtree: true});
      try {
        menu.querySelector('.expedition-wilds').click();
        menu.querySelector('.expedition-accept').click();
        const end = performance.now() + 10000;
        while (!test.game.trainTest?.persistent && !popupSeen && performance.now() < end)
          await new Promise(resolve => setTimeout(resolve, 25));
        check(!popupSeen && !document.querySelector(popupSelector),
          'Adventure Board Accept never shows the Wilds checkpoint popup');
        check(test.screen === 'play' && test.game.trainTest?.persistent && !menu.isConnected,
          'Adventure Board Accept resumes the saved Wilds directly and closes the chooser');
        const train = test.game.trainTest, player = test.game.players[0];
        check(train.distance === 8200 && train.wildExploration.opened.has('fern-glade') &&
          player.equipment.hand1 === 'fire_wand' && player.coins === 220,
        'Adventure Board retains saved train location, claimed supplies, equipment and currency');
      } finally {
        observer.disconnect();
      }
      return result;
    });
    await boot();
    await run(async () => {
      const result = [];
      const check = (value, label) => { if (!value) throw Error(label); result.push(label); };
      const test = window.wildboundPolishTest;
      document.querySelector('#continue-wilds').click();
      const end = performance.now() + 10000;
      while (!test.game.trainTest?.persistent && performance.now() < end)
        await new Promise(resolve => setTimeout(resolve, 25));
      check(test.game.trainTest?.persistent, 'Fresh Electron renderer continues The Wilds from disk');
      const p = test.game.players[0], h = test.profiles.data.heroes[0];
      for (const record of [p, h])
        check(record.equipment.hand1 === 'fire_wand' && record.coins === 220 &&
          record.inventory.some(item => item?.type === 'ice_wand') &&
          record.inventory.find(item => item?.type === 'potion')?.qty === 1,
        record === p ? 'Resumed party retains equipment, purchase, currency and consumed supplies' :
          'Reloaded character library retains the same progression');
      return result;
    });
  } catch (error) {
    errors.push(error.stack || String(error));
  }
  const report = {checks, errors, muted: window.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  app.exit(errors.length || !report.muted ? 1 : 0);
});
